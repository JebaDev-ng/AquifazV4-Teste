import { NextRequest, NextResponse } from 'next/server'

import { requireEditor } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import { ALLOWED_BUCKETS } from '../constants'

type MediaLibraryRow = {
  id: string
  storage_path: string
  url: string | null
  filename?: string | null
  size?: number | null
  created_at?: string | null
  checksum?: string | null
  width?: number | null
  height?: number | null
  mime_type?: string | null
  bucket: string
}

export async function GET(request: NextRequest) {
  try {
    await requireEditor()

    const { searchParams } = new URL(request.url)
    const bucket = (searchParams.get('bucket') || '').trim()
    const prefixParam = (searchParams.get('prefix') || '').trim().replace(/^\/+/, '').replace(/\/+$/, '')

    if (!bucket || !ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Bucket inválido' }, { status: 400 })
    }

    const supabase = await createClient()
    const listTarget = prefixParam.length ? prefixParam : undefined
    const { data: objects, error: listError } = await supabase.storage
      .from(bucket)
      .list(listTarget, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (listError) {
      console.error('Erro ao listar objetos do storage:', listError)
      return NextResponse.json({ error: 'Erro ao carregar galeria' }, { status: 500 })
    }

    const files = (objects || []).filter((item) => item.name && item.metadata?.size !== 0)
    const storagePaths = files.map((file) =>
      [prefixParam, file.name].filter(Boolean).join('/')
    )

    if (storagePaths.length === 0) {
      return NextResponse.json({ items: [] })
    }

    const { data: mediaRecordsRaw, error: dbError } = await supabase
      .from('media_library')
      .select('*')
      .eq('bucket', bucket)
      .in('storage_path', storagePaths)

    if (dbError) {
      console.error('Erro ao buscar registros da media_library:', dbError)
      return NextResponse.json({ error: 'Erro ao carregar galeria' }, { status: 500 })
    }

    const mediaRecords = (mediaRecordsRaw ?? []) as MediaLibraryRow[]
    const mediaByPath = new Map<string, MediaLibraryRow>()
    mediaRecords.forEach((record) => {
      mediaByPath.set(record.storage_path, record)
    })

    const items = await Promise.all(
      storagePaths.map(async (path, index) => {
        const file = files[index]
        const record = mediaByPath.get(path)
        const { data } = supabase.storage.from(bucket).getPublicUrl(path)

        return {
          id: record?.id ?? null,
          url: record?.url || data.publicUrl,
          storage_path: path,
          bucket,
          filename: record?.filename ?? file?.name ?? path.split('/').pop(),
          size: record?.size ?? file?.metadata?.size ?? null,
          created_at: record?.created_at ?? file?.created_at ?? null,
          checksum: record?.checksum ?? null,
          width: record?.width ?? null,
          height: record?.height ?? null,
          mime_type: record?.mime_type ?? undefined,
        }
      })
    )

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Erro ao carregar galeria:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao carregar galeria'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

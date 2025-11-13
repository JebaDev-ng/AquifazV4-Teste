import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

import { requireEditor, logActivity } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'
import { ALLOWED_BUCKETS } from './constants'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']

function sanitizeSegment(value: string, fallback: string) {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9-_]/g, '')
  return cleaned || fallback
}

function sanitizePath(rawPath: string | null, fallback: string) {
  if (!rawPath) return fallback
  const segments = rawPath
    .split('/')
    .map((segment) => sanitizeSegment(segment, ''))
    .filter(Boolean)

  return segments.length > 0 ? segments.join('/') : fallback
}

export async function POST(request: NextRequest) {
  try {
    await requireEditor()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = ((formData.get('bucket') as string) || '').trim()
    const rawEntity = ((formData.get('entity') as string) || bucket).trim()
    const rawEntityId = ((formData.get('entity_id') as string) || uuidv4()).trim()
    const rawFileRole = ((formData.get('file_role') as string) || 'main').trim()
    const prefixInput = (formData.get('prefix') as string) || ''
    const altText = (formData.get('alt_text') as string) || ''
    const mediaCategory = ((formData.get('category') as string) || rawEntity).trim() || bucket

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!bucket || !ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Bucket inválido' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP, GIF ou SVG.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const checksum = createHash('sha256').update(buffer).digest('hex')

    const sanitizedEntity = sanitizeSegment(rawEntity || bucket, bucket)
    const sanitizedEntityId = sanitizeSegment(rawEntityId, uuidv4())
    const sanitizedRole = sanitizeSegment(rawFileRole || 'main', uuidv4())
    const fallbackPrefix = `${sanitizedEntity}/${sanitizedEntityId}`
    const sanitizedPrefix = sanitizePath(prefixInput, fallbackPrefix)

    const { data: duplicateMedia, error: duplicateError } = await supabase
      .from('media_library')
      .select('id, filename, original_name, url, storage_path, size, mime_type, width, height, alt_text, category, checksum, bucket')
      .eq('bucket', bucket)
      .eq('checksum', checksum)
      .maybeSingle()

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('Erro ao verificar duplicidade de mídia:', duplicateError)
    }

    if (duplicateMedia) {
      const { data: { publicUrl: existingPublicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(duplicateMedia.storage_path)

      const pathSegments = duplicateMedia.storage_path.split('/')
      const storedEntity = pathSegments[0] || sanitizedEntity
      const storedEntityId = pathSegments[1] || sanitizedEntityId

      await logActivity('media_reused', 'media', duplicateMedia.id, undefined, {
        filename: duplicateMedia.filename,
        bucket,
        checksum,
      })

      return NextResponse.json({
        id: duplicateMedia.id,
        url: duplicateMedia.url || existingPublicUrl,
        storagePath: duplicateMedia.storage_path,
        bucket,
        filename: duplicateMedia.filename,
        original_name: duplicateMedia.original_name,
        size: duplicateMedia.size,
        width: duplicateMedia.width,
        height: duplicateMedia.height,
        alt_text: duplicateMedia.alt_text,
        category: duplicateMedia.category,
        checksum,
        reused: true,
        entity: storedEntity,
        entityId: storedEntityId,
      })
    }

    const image = sharp(buffer)
    const metadata = await image.metadata()

    const hasAlpha = Boolean(metadata.hasAlpha)
    let targetFormat: 'jpeg' | 'png' | 'webp' | 'gif' | 'svg'
    let contentType: string

    if (file.type === 'image/gif') {
      targetFormat = 'gif'
      contentType = 'image/gif'
    } else if (file.type === 'image/png') {
      targetFormat = hasAlpha ? 'png' : 'jpeg'
      contentType = targetFormat === 'png' ? 'image/png' : 'image/jpeg'
    } else if (file.type === 'image/webp') {
      targetFormat = 'webp'
      contentType = 'image/webp'
    } else if (file.type === 'image/svg+xml') {
      targetFormat = 'svg'
      contentType = 'image/svg+xml'
    } else {
      targetFormat = 'jpeg'
      contentType = 'image/jpeg'
    }

    const extension =
      targetFormat === 'jpeg'
        ? 'jpg'
        : targetFormat === 'gif'
        ? 'gif'
        : targetFormat === 'svg'
        ? 'svg'
        : targetFormat
    const fileName = `${sanitizedRole}.${extension}`
    const storagePath = `${sanitizedPrefix}/${fileName}`

    let optimizedBuffer: Buffer
    if (targetFormat === 'gif' || targetFormat === 'svg') {
      optimizedBuffer = buffer
    } else {
      const resized = image.resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true,
      })

      if (targetFormat === 'png') {
        optimizedBuffer = await resized.png({ compressionLevel: 9, quality: 90 }).toBuffer()
      } else if (targetFormat === 'webp') {
        optimizedBuffer = await resized.webp({ quality: 90, alphaQuality: 80 }).toBuffer()
      } else {
        optimizedBuffer = await resized.jpeg({ quality: 85 }).toBuffer()
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, optimizedBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ error: 'Erro no upload do arquivo' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath)

    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_library')
      .insert({
        filename: fileName,
        original_name: file.name,
        url: publicUrl,
        storage_path: storagePath,
        checksum,
        size: optimizedBuffer.length,
        mime_type: contentType,
        width: metadata.width,
        height: metadata.height,
        alt_text: altText,
        category: mediaCategory,
        bucket,
        uploaded_by: user?.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      await supabase.storage.from(bucket).remove([storagePath])
      console.error('Erro ao salvar metadados:', dbError)
      return NextResponse.json({ error: 'Erro ao salvar arquivo' }, { status: 500 })
    }

    await logActivity('media_uploaded', 'media', mediaRecord.id, undefined, {
      filename: fileName,
      original_name: file.name,
      size: optimizedBuffer.length,
      category: mediaCategory,
      bucket,
    })

    return NextResponse.json({
      id: mediaRecord.id,
      url: publicUrl,
      storagePath,
      bucket,
      filename: fileName,
      original_name: file.name,
      size: optimizedBuffer.length,
      checksum,
      width: metadata.width,
      height: metadata.height,
      alt_text: altText,
      category: mediaCategory,
      entity: sanitizedEntity,
      entityId: sanitizedEntityId,
      reused: false,
    })
  } catch (error: unknown) {
    console.error('Erro no upload:', error)
    const message = error instanceof Error ? error.message : 'Erro interno no upload'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireEditor()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    
    const supabase = await createClient()
    
    let query = supabase
      .from('media_library')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: media, error, count } = await query

    if (error) {
      console.error('Erro ao buscar mídia:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error: unknown) {
    console.error('Erro na API de mídia:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao listar mídia'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

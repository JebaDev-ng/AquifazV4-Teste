import { NextRequest, NextResponse } from 'next/server'

import { logActivity } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: media, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(media || [])
  } catch (error) {
    console.error('Erro ao buscar mídia:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar mídia' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum ID fornecido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Buscar arquivos para deletar do storage
    const { data: mediaItems, error: fetchError } = await supabase
      .from('media')
      .select('id, filename, storage_path, category, checksum')
      .in('id', ids)

    if (fetchError) {
      throw fetchError
    }

    // Deletar do banco
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .in('id', ids)

    if (dbError) {
      throw dbError
    }

    if (mediaItems && mediaItems.length > 0) {
      for (const item of mediaItems) {
        const bucket = item.category || 'media'

        await logActivity('media_deleted_bulk', 'media', item.id, undefined, {
          filename: item.filename,
          bucket,
          checksum: item.checksum,
        })

        const { count: references, error: referenceError } = await supabase
          .from('media')
          .select('*', { head: true, count: 'exact' })
          .eq('storage_path', item.storage_path)
          .eq('category', bucket)

        if (referenceError) {
          console.error('Erro ao verificar referências de mídia:', referenceError)
          continue
        }

        if (references && references > 0) {
          continue
        }

        const { error: storageError } = await supabase.storage
          .from(bucket)
          .remove([item.storage_path])

        if (storageError) {
          console.error('Erro ao deletar arquivo do storage:', storageError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar mídia:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar mídia' },
      { status: 500 }
    )
  }
}
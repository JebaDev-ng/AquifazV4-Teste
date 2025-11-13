import { NextRequest, NextResponse } from 'next/server'

import { logActivity } from '@/lib/admin/auth'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    
    // Buscar arquivo para deletar do storage
    const { data: mediaItem, error: fetchError } = await supabase
      .from('media')
      .select('filename, storage_path, category, checksum')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Erro ao buscar mídia para remoção:', fetchError)
      return NextResponse.json(
        { error: 'Erro ao localizar o arquivo' },
        { status: 500 }
      )
    }

    if (!mediaItem) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      )
    }

    const bucket = mediaItem.category || 'media'

    // Deletar do banco
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', id)

    if (dbError) {
      throw dbError
    }

    await logActivity('media_deleted', 'media', id, undefined, {
      filename: mediaItem.filename,
      bucket,
      checksum: mediaItem.checksum,
    })

    // Verificar se ainda existe alguma referência à mesma mídia
    const { count: references, error: referenceError } = await supabase
      .from('media')
      .select('*', { head: true, count: 'exact' })
      .eq('storage_path', mediaItem.storage_path)
      .eq('category', bucket)

    if (referenceError) {
      console.error('Erro ao verificar referências de mídia:', referenceError)
      return NextResponse.json({ success: true })
    }

    if (references && references > 0) {
      return NextResponse.json({ success: true })
    }

    // Deletar arquivo do storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([mediaItem.storage_path])

    if (storageError) {
      console.error('Erro ao deletar arquivo do storage:', storageError)
      // Não falhar a operação se o arquivo não existir no storage
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
# media-library — To-Dos (Execucao Tecnica)

## 1. Migrations Supabase
- [ ] Abrir `02_media_and_logs.sql`
- [ ] Adicionar coluna `bucket TEXT NOT NULL DEFAULT 'media'`
- [ ] Criar indice `UNIQUE(bucket, checksum)` com WHERE
- [ ] Criar migration incremental `20251112140000_media_add_bucket.sql`
- [ ] Preencher bucket legado a partir de `storage_path`
- [ ] Atualizar README sobre a coluna nova

## 2. API — Upload
- [ ] Atualizar POST `/api/admin/upload`
- [ ] Listar arquivos existentes (prefix)
- [ ] Checar se arquivo ja existe
- [ ] Se existir: retornar meta existente
- [ ] Se nao existir: realizar upload
- [ ] Inserir registro em `media_library` com bucket
- [ ] Normalizar nome do arquivo
- [ ] Responder `reused` true/false

## 3. API — Galeria
- [ ] Criar GET `/api/admin/upload/gallery`
- [ ] Receber bucket e prefix opcional
- [ ] Listar arquivos do bucket
- [ ] Fazer join com `media_library`
- [ ] Retornar url, filename, checksum, width/height

## 4. Front-end Hooks
- [ ] Criar `useBucketGallery(bucket, prefix?)`
- [ ] Criar helper `uploadImage()`
- [ ] Mapear retornos (loading, error, refetch)

## 5. Componente Unificado
- [ ] Criar `components/admin/ui/media-picker.tsx`
- [ ] Criar modal (Dialog shadcn)
- [ ] Abas: Galeria / Upload novo
- [ ] Preview externo
- [ ] Selecao de imagem existente
- [ ] Upload novo → atualizar galeria → fechar modal

## 6. Substituicao no Admin
- [ ] Atualizar `single-image-upload.tsx`
- [ ] Atualizar `single-image-uploader.tsx`
- [ ] Atualizar `components/admin/products/image-uploader.tsx`
- [ ] Remover logicas duplicadas
- [ ] Garantir que cada section passa bucket + entity + entityId

## 7. Tipos e Ajustes Gerais
- [ ] Atualizar interface `UploadedImageMeta`
- [ ] Ajustar endpoints de delecao e listagem
- [ ] Revisar Zod schemas
- [ ] Testar multi-upload (produtos)

## 8. Testes Manuais
- [ ] Testar Hero
- [ ] Testar Banners
- [ ] Testar Products
- [ ] Testar Categories
- [ ] Confirmar que o mesmo arquivo nao duplica
- [ ] Validar galeria listando corretamente
- [ ] Confirmar exclusao sem quebrar referencias

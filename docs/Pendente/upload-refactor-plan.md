# Plano de Refatoracao do Fluxo de Upload

## Objetivos
- Evitar duplicacao de arquivos no Supabase Storage.
- Listar midias existentes antes de novos uploads.
- Unificar experiencia de upload com galeria reutilizavel no painel admin.

## Etapas Principais

### 1. Ajustes no schema Supabase
- Atualizar `supabase/migrations/v2/02_media_and_logs.sql` para incluir a coluna obrigatoria `bucket TEXT NOT NULL DEFAULT 'media'` na tabela `media_library`.
- Alterar o indice unico para considerar `(bucket, checksum)` quando `checksum IS NOT NULL`.
- Criar migration incremental (ex.: `20251112140000_media_add_bucket.sql`) para ambientes ja provisionados:
  - Adicionar coluna `bucket` com default `media`.
  - Popular `bucket` usando `split_part(storage_path, '/', 1)` quando existir prefixo.
  - Ajustar o indice unico removendo a versao antiga e criando `UNIQUE (bucket, checksum)`.
- Atualizar documentacao em `supabase/migrations/v2/README.md` sobre a nova coluna.

### 2. API de upload (`app/api/admin/upload/route.ts`)
- Garantir que a tabela utilizada seja `media_library` e que a coluna `bucket` seja persistida junto aos metadados.
- Antes do upload:
  - Invocar `supabase.storage.from(bucket).list(prefix)` onde `prefix = sanitizedEntity/sanitizedEntityId`.
  - Padronizar `fileName` com a logica atual (slug + extensao) e verificar se ja existe no resultado da listagem.
  - Se existir, retornar os metadados existentes (consultando `media_library` por `storage_path`).
  - Se nao existir, processar e enviar o arquivo normalmente.
- Ajustar resposta JSON para incluir `bucket`, `reused`, `checksum` e metadados relevantes.

### 3. Endpoint de galeria
- Criar rota `app/api/admin/upload/gallery/route.ts` com metodo GET.
- Receber `bucket` e `prefix` como query params.
- Listar arquivos com `supabase.storage.from(bucket).list(prefix)`.
- Enriquecer dados consultando `media_library` pelos `storage_path` correspondentes.
- Retornar itens com `url`, `storagePath`, `filename`, `width`, `height`, `created_at`, `bucket`.

### 4. Hooks e helpers no front
- Implementar hook `useBucketGallery(bucket, prefix)` para consumir o endpoint de galeria e expor `images`, `loading`, `error`, `refetch`.
- Criar helper `uploadImage({ file, bucket, entity, entityId, fileRole })` que faz POST em `/api/admin/upload` e retorna metadados da midia.

### 5. Componente unico de upload
- Criar componente `MediaPicker` (ex.: `components/admin/ui/media-picker.tsx`).
- Props principais: `value`, `onChange`, `bucket`, `entity`, `entityId`, `label`, `helperText`, `maxSizeMb`, `allowedMimeTypes`.
- Interface:
  - Botao/area abre `Dialog` Shadcn.
  - Modal com duas abas/tablist: "Galeria" e "Enviar".
  - Galeria usa `useBucketGallery` para mostrar thumbnails reutilizaveis.
  - Aba de upload utiliza dropzone/Input para novos arquivos e chama `uploadImage`.
- Ao selecionar item existente ou upload novo, fechar modal atualizando `value`.
- Exibir preview principal fora do modal seguindo UX atual.

### 6. Substituicao nos formularios admin
- Atualizar componentes existentes (ex.: `single-image-upload.tsx`, `single-image-uploader.tsx`, `products/image-uploader.tsx`, telas de Hero/Banners/Categorias) para usar `MediaPicker`.
- Remover logica duplicada de dropzone e garantir que todos usem mesma rota/hook.
- Manter `category` do contexto para analytics, mas `bucket` sempre refletindo bucket real.

### 7. Ajustes adicionais
- Atualizar `lib/uploads.ts` e tipos derivados (`UploadedImageMeta`) para incluir `bucket`, `checksum`, `reused`.
- Revisar rotas de delecao/listagem (`app/api/admin/media/**/*.ts`) para operar sobre `media_library` e coluna `bucket`.
- Verificar Zod schemas ou helpers relacionados a midia.

### 8. Testes manuais
- Rodar `npm run lint` apos mudar o codigo.
- Validar fluxo nos formulários do painel admin (Hero, Banners, Produtos, Categorias) garantindo:
  - Visualizacao da galeria existente.
  - Reutilizacao de midias sem duplicar arquivos no storage.
  - Upload novo funcionando com dados persistidos no banco.
- Confirmar que remocoes nao apagam arquivos ainda referenciados.

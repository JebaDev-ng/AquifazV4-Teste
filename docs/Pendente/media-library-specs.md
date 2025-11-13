# media-library — Especificacao Tecnica

## 1. Visao Geral
- **Proposito:** disponibilizar um fluxo unificado de gestao de midias no painel admin, permitindo uploads otimizados, reaproveitamento de arquivos existentes e visualizacao previa por bucket.
- **Fluxos suportados:**
  - Upload de novas imagens com deduplicacao (hash + listagem no bucket).
  - Reuso de midias existentes a partir de uma galeria.
  - Listagem paginada/filtrada por prefixo de caminhos.
  - Remocao segura (somente quando nao ha referencias restantes no banco).

## 2. Schema do Supabase
- **Tabela principal:** `public.media_library`.
- **Colunas relevantes:**
  - `bucket TEXT NOT NULL DEFAULT 'media'` (novo campo obrigatorio indicando o bucket fisico).
  - `checksum TEXT` armazenando hash SHA-256 do arquivo otimizando dedupe.
  - Metadados historicos (filename, original_name, storage_path, size, mime_type, width, height, alt_text, category, uploaded_by, created_at).
- **Indice unico:** `CREATE UNIQUE INDEX idx_media_library_checksum_unique ON media_library(bucket, checksum) WHERE checksum IS NOT NULL;`.
- **Migracao incremental:** arquivo `20251112140000_media_add_bucket.sql` deve adicionar coluna `bucket`, popular valor com prefixo de `storage_path` (fallback 'media'), remover indice antigo e criar o novo.

## 3. Fluxo de Upload (API)
- **Endpoint:** `POST /api/admin/upload`.
- **Passos chave:**
  1. Validar autenticacao (requireEditor) e parametros (`bucket`, `entity`, `entity_id`).
  2. Gerar nome padronizado (`${sanitizedRole}.${ext}`) usando slug e extensao normalizada.
  3. Consultar `supabase.storage.from(bucket).list(prefix)` com `prefix = sanitizedEntity/sanitizedEntityId` para detectar arquivos existentes.
  4. Se ja existir arquivo com mesmo nome → retornar metadados armazenados em `media_library` (flag `reused = true`).
  5. Caso contrario → otimizar imagem via Sharp (limite 2000px, formatos JPEG/PNG/WebP/GIF) e realizar upload.
  6. Persistir registro em `media_library` incluindo `bucket`, `checksum`, `category`, dimensoes e `storage_path`.
  7. Retornar JSON com `reused`, `bucket`, `storagePath`, `checksum`, dimensoes e metadados informados.

## 4. Fluxo da Galeria
- **Endpoint:** `GET /api/admin/upload/gallery`.
- **Parametros:**
  - `bucket` (obrigatorio).
  - `prefix` (opcional para filtrar por subpastas).
- **Processo:**
  1. Chamar `supabase.storage.from(bucket).list(prefix)` para recuperar objetos do storage.
  2. Para cada objeto, buscar linha correspondente em `media_library` via `storage_path`.
  3. Montar resposta com url publica, tamanho, dimensoes e dados extras (fallback quando nao houver registro).

## 5. Hooks / Services
- **`useBucketGallery(bucket, prefix?)`:** hook React que consome o endpoint `/gallery`, gerencia estados `images`, `isLoading`, `error` e expõe `refetch`.
- **`uploadImage(options)`:** helper que envia `FormData` para `POST /api/admin/upload`, retorna objeto `UploadedImageMeta` enriquecido.
- **Ambos** devem lidar com abort/cancelamento, revalidacao e exibicao de mensagens de erro coerentes com UX atual.

## 6. Componente Reutilizavel
- **Nome sugerido:** `MediaPicker` (`components/admin/ui/media-picker.tsx`).
- **Props:**
  - `value: UploadedImageMeta | null` (ou array quando multi upload).
  - `onChange`, `bucket`, `entity`, `entityId`, `label`, `helperText`, `maxSizeMb`, `allowedMimeTypes`, `fileRole`.
- **Estrutura:**
  - Preview principal fora do modal exibindo imagem selecionada.
  - Botao abre `Dialog` com Tabs: `Galeria` (lista thumbnails + filtro) e `Novo Upload` (dropzone/input).
  - Selecionar item existente fecha modal e dispara `onChange`.
  - Abas reutilizam `useBucketGallery` e helper `uploadImage`.

## 7. Integracao no Admin
- Substituir componentes legados (`single-image-upload.tsx`, `single-image-uploader.tsx`, `products/image-uploader.tsx`) pelo `MediaPicker`.
- Ajustar paginas do painel (Hero, Banners, Products, Categories) para usar nova API.
- Remover duplicidade de lógica de upload e garantir que `bucket` correto esteja mapeado para cada secao.

## 8. Seguranca e Validacoes
- **MIME types:** restringir a `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`.
- **Tamanho maximo:** 5 MB por arquivo (pode ser configuravel via prop `maxSizeMb`).
- **Campos obrigatorios:** `entity`, `entityId`, `bucket` e `file` devem ser validados antes da chamada ao storage.
- **Permissoes:** apenas roles `admin`/`editor` garantem acesso (via `requireEditor`).

## 9. Checklist Final
- [ ] Schema ajustado com migracoes aplicadas.
- [ ] Upload evita duplicacao (hash + listagem).
- [ ] Galeria exibe midias existentes por bucket/prefix.
- [ ] `MediaPicker` integrado em todas as telas relevantes.
- [ ] Rotas de delecao respeitam coluna `bucket` e referencias cruzadas.
- [ ] Tipos/Interfaces atualizados (`UploadedImageMeta`, etc.).
- [ ] `npm run lint` sem erros.
- [ ] Verificacao manual de upload, reuse e remocao para Hero, Banners, Produtos e Categorias.

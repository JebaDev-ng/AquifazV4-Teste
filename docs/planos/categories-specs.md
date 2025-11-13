# Categories Admin — Specs

## 1. Contexto

A aba de Categorias no painel admin hoje apresenta inconsistências em relação às demais sections (Hero, Banners, Products):

- `app/admin/categories/page.tsx`:
  - Mantém `slug` manual.
  - Não publica `accent_color`.
- Produtos (`components/admin/products/product-form.tsx`):
  - Gera `slug` automaticamente.
  - Envia todos os campos esperados pelo backend.
- Upload de imagem em Categorias:
  - Usa `components/admin/ui/single-image-upload.tsx`, quebrando o fluxo unificado definido em `docs/media-library-specs.md` e aplicado em Hero/Banner.
- `components/admin/categories/category-products-modal.tsx`:
  - Replica UI própria, sem `components/admin/ui/modal.tsx`.
  - Não respeita paginação real da API.
- Homepage (`components/ui/categories-section.tsx`):
  - Ignora `image_url` e `accent_color`.
  - O que é salvo no admin não reflete o storefront.

## 2. Objetivos

1. Alinhar a modelagem de categorias ao padrão das demais sections:
   - `slug` automático.
   - Campos completos (`accent_color`, imagem, status, sort_order etc.).
   - Logs consistentes.
2. Adotar o `MediaPicker` como fluxo único de upload/reuso de mídias para categorias.
3. Unificar a UX da aba com Hero, Banners e Products:
   - Formulários padronizados.
   - Feedback visual consistente.
   - Uso de componentes compartilhados (forms, modal, toasts).
4. Garantir que a homepage consuma os dados gerenciados no admin:
   - Mesma fonte de dados.
   - Mesmo schema.
   - Uso de imagem e `accent_color`.
5. Definir métricas e processo de QA para evitar regressão funcional/visual.

## 3. Escopo

### Incluído

- Ajustes na área de admin de categorias:
  - `app/admin/categories/**`
- Ajustes nos endpoints de categorias:
  - `app/api/admin/categories/**`
- Integração com componentes compartilhados:
  - `MediaPicker` (upload e galeria).
  - `components/admin/ui/modal.tsx`.
- Consumo de dados em:
  - `components/ui/categories-section.tsx`
  - Páginas que exibem categorias (`app/page.tsx`, `app/produtos/page.tsx`).

### Excluído

- Criação de novas tabelas no Supabase.
- Redesign completo da homepage.
- Mudanças em features fora do domínio de categorias.

## 4. Modelo de Dados de Categoria (conceitual)

Campos esperados para categoria (modelo lógico):

- `id`: identificador único.
- `slug`: string única, gerada automaticamente a partir do nome.
- `name` / `title`: nome exibido da categoria.
- `description` (opcional).
- `accent_color` (opcional, cor de destaque).
- `image_id` / `image_url` (ligação com media_library / storage_path).
- `sort_order`: número para ordenação manual.
- `is_active`: boolean para visibilidade.
- Metadados:
  - `created_at`
  - `updated_at`
  - `created_by` / `updated_by` (quando aplicável).

Regras:

- `slug`:
  - Gerado automaticamente.
  - Normalizado via helper (ex.: `slugifyId`).
  - Deve ser único dentro do contexto de categorias.
- `accent_color`:
  - Opcional, mas quando presente deve ser hex válido.
- Imagem:
  - Deve usar fluxo MediaPicker.
  - Deve armazenar `storage_path` e/ou referência para `media_library`.

## 5. API de Categorias

### Endpoints relevantes

- `POST /api/admin/categories`
  - Cria nova categoria.
  - Recebe payload validado via Zod.
  - Gera `slug` automaticamente se não fornecido.
  - Persiste `accent_color` e relação com imagem.
  - Registra `logActivity`.

- `PUT /api/admin/categories/[id]`
  - Atualiza campos de categoria existente.
  - Permite rename seguro:
    - Atualiza slug.
    - Sincroniza dependências, se necessário.
  - Mantém integridade de `accent_color` e imagem.

- `GET /api/admin/categories`
  - Lista categorias com filtros básicos (ativo, texto, paginação).
  - Usado tanto no admin quanto em modais (ex.: products modal).

- `PATCH /api/admin/categories/reorder` (ou similar)
  - Endpoint dedicado para reordenar categorias com base em `sort_order`.

### Requisitos da API

- Validar:
  - `name` obrigatório.
  - `slug` único.
  - `accent_color` formato válido (se enviado).
- Garantir:
  - Nenhum campo crítico é silenciado (ex.: `accent_color` vindo do front e ignorado).
  - Logs consistentes (`logActivity`) para:
    - criação
    - atualização
    - reorder
- Não sobrescrever campos customizados do admin em rotinas de sync.

## 6. Upload de Imagens (MediaPicker)

- Categorias deve usar o mesmo fluxo descrito em `docs/media-library-specs.md`.
- Comportamento esperado:
  - Bucket e prefix:
    - `bucket`: definido conforme convenção (ex.: `media` ou `categories`).
    - `prefix`: `categories/<slug>/`.
  - Usuário pode:
    - Selecionar imagem existente da galeria.
    - Fazer upload de nova imagem.
  - A API de upload:
    - Deduplica arquivos via checksum.
    - Retorna metadados (`storage_path`, `url`, `reused`, `bucket`).
- O formulário de categoria deve:
  - Armazenar apenas o necessário para referenciar a mídia:
    - `storage_path` ou `media_id`.
  - Exibir preview usando o `url` derivado do storage.

## 7. UI/UX de Admin — Categorias

Padrões a seguir:

- Formulário:
  - Usar a mesma base de componentes de form utilizados em Products.
  - Aplicar React Hook Form + Zod para validação.
  - Campos:
    - Nome
    - Slug (readonly ou editável com regra clara)
    - Accent color (input de cor ou text)
    - Imagem (MediaPicker)
    - Status (ativo/inativo)
- Feedback:
  - Sucesso/erro via toasts ou feedback inline (nada de `window.alert`).
- Modal de produtos da categoria:
  - Baseado em `components/admin/ui/modal.tsx`.
  - Paginação via API real (`/api/admin/products`).
  - Sem replicar layout manual sem necessidade.

## 8. Integração com Homepage

- `components/ui/categories-section.tsx` deve:
  - Consumir as mesmas categorias do admin.
  - Respeitar:
    - `is_active`
    - `sort_order`
    - `image_url` (ou derivado de `storage_path`)
    - `accent_color`
  - Renderizar:
    - Card com imagem.
    - Título e descrição.
    - Cor de destaque aplicada conforme design.
- Páginas:
  - `app/page.tsx` e `app/produtos/page.tsx` devem:
    - Considerar `accent_color` no layout quando existir.
    - Ter fallback visual quando imagem ou cor não estiverem definidas.

## 9. QA, Observabilidade e Métricas

- QA:
  - Testar:
    - Criar categoria.
    - Editar nome/slug.
    - Definir/remover `accent_color`.
    - Trocar imagem reutilizando da galeria.
    - Reordenar categorias.
    - Verificar reflexo na homepage.
- Observabilidade:
  - Verificar logs de `logActivity` para operações-chave.
  - Monitorar erros em `/api/admin/categories`.
- Métricas:
  - Erros de validação de slug.
  - Falhas em upload para categorias.
  - Diferença entre categorias ativas no admin e exibidas na homepage.

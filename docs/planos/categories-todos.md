# Categories Admin — To-Dos

## 0. Preparação

- [x] Verificar feature flags relacionadas a homepage/admin (ex.: `useHomepageSections`, `HomepageSettings`).
- [x] Confirmar proteção de rotas e endpoints (ex.: `requireAdmin`, `requireEditor`).
- [x] Validar dependências com `docs/media-library-specs.md` e `MediaPicker`.

---

## 1. Dados e API

### 1.1 Refatorar `app/admin/categories/page.tsx`

 - [x] Migrar formulário para React Hook Form + Zod (padronizar com Products).
 - [x] Implementar `slug` automático usando helper de slugification (ex.: `slugifyId`).
 - [x] Permitir edição controlada do slug (se for requisito), com validação de unicidade.
 - [x] Incluir `accent_color` no form:
  - [x] Campo com máscara/validação de hex.
 - [x] Garantir que o submit envie:
  - [x] `name`
  - [x] `slug`
  - [x] `accent_color`
  - [x] dados de imagem (storage_path/media_id)
  - [x] `is_active`
  - [x] `sort_order` quando aplicável.

### 1.2 Atualizar rotas de API

- [x] Abrir `app/api/admin/categories/route.ts` (POST/GET).
- [x] Atualizar validação (Zod ou schema equivalente) para incluir:
  - [x] `accent_color`
  - [x] campos da imagem.
- [x] Garantir geração de `slug` quando não enviado ou vazio.
- [x] Registrar `logActivity` para criação de categoria.
- [x] Abrir `app/api/admin/categories/[id]/route.ts` (PUT/DELETE/PATCH, dependendo da estrutura).
- [x] Permitir rename de categoria com update seguro de `slug`.
- [x] Registrar `logActivity` para atualização/remoção.

### 1.3 Endpoint de reorder (se ainda não existir)

- [x] Criar endpoint dedicado (ex.: `app/api/admin/categories/reorder/route.ts`).
- [x] Receber lista de IDs + nova ordem.
- [x] Atualizar `sort_order` em batch.
- [x] Registrar `logActivity` para reorder.

---

## 2. Upload Unificado (MediaPicker)

### 2.1 Implementar/Integrar MediaPicker

- [x] Confirmar implementação de `MediaPicker` de acordo com `docs/media-library-specs.md`.
- [x] Se necessário, criar arquivo:
  - [x] `components/admin/ui/media-picker.tsx`.

### 2.2 Substituir SingleImageUpload

- [x] Abrir `components/admin/ui/single-image-upload.tsx` e mapear uso atual em categorias.
- [x] Em `app/admin/categories/page.tsx`:
  - [x] Remover uso de `SingleImageUpload`.
  - [x] Integrar `MediaPicker` como componente principal de seleção de imagem.
- [x] Configurar bucket/prefix:
  - [x] `bucket`: seguir padrão definido no projeto (ex.: `media`).
  - [x] `prefix`: `categories/<slug>/`.
- [x] Garantir que a resposta da API de upload seja mapeada para:
  - [x] `storage_path`
  - [x] `url`
  - [x] `reused`
  - [x] `bucket`.

### 2.3 Documentação

- [x] Atualizar README do painel admin com:
  - [x] Seção “Fluxo de mídia em Categorias”.
  - [x] Referência ao `MediaPicker`.

---

## 3. UI e UX da Aba de Categorias

### 3.1 Formulário principal

- [x] Padronizar layout com o mesmo design de Products:
  - [x] Títulos de seção.
  - [x] Inputs e labels.
  - [x] Botões de salvar/cancelar.
- [x] Substituir qualquer `alert/confirm` nativo por:
  - [x] Toasters / feedback inline (ex.: `useToast` do UI Kit).
- [x] Adicionar preview visual da categoria:
  - [x] Card ao lado do form, espelhando estrutura da homepage (imagem + título + cor).

### 3.2 `CategoryProductsModal`

- [x] Abrir `components/admin/categories/category-products-modal.tsx`.
- [x] Substituir modal customizado por:
  - [x] `components/admin/ui/modal.tsx`.
- [x] Integrar listagem de produtos via:
  - [x] `/api/admin/products` com paginação real (ou infinite scroll).
- [x] Remover estilos duplicados/localmente inventados.
- [x] Garantir:
  - [x] Seleção de produtos.
  - [x] Remoção/adição de vínculo com categoria.
  - [x] Feedback visual claro (loading, erro, sucesso).

---

## 4. Integração com a Homepage

### 4.1 Atualizar categories-section

- [x] Abrir `components/ui/categories-section.tsx`.
- [x] Atualizar para consumir:
  - [x] `image_url` (derivado de `storage_path`/media_library).
  - [x] `accent_color`.
  - [x] `is_active`.
  - [x] `sort_order`.
- [x] Ajustar layout dos cards para:
  - [x] Exibir imagem da categoria.
  - [x] Aplicar `accent_color` em borda, background ou highlight, conforme design.
- [x] Garantir fallback:
  - [x] Placeholder quando não houver imagem.
  - [x] Cor padrão quando não houver `accent_color`.

### 4.2 Páginas que usam categorias

- [x] Abrir `app/page.tsx` (homepage).
- [x] Confirmar que a seção de categorias está usando o mesmo source da API/loader atualizado.
- [x] Abrir `app/produtos/page.tsx` (se fizer uso de categorias).
- [x] Aplicar uso de `accent_color` e imagens nos filtros/listas, se for o caso.

---

## 5. QA e Observabilidade

### 5.1 Testes manuais

- [ ] Rodar `npm run lint` e resolver warnings relacionados.
- [ ] Testar fluxo completo no admin:
  - [ ] Criar categoria nova com imagem e `accent_color`.
  - [ ] Editar nome e verificar atualização de slug (quando aplicável).
  - [ ] Trocar imagem reutilizando item existente do MediaPicker.
  - [ ] Reordenar categorias (drag and drop / controles disponíveis).
  - [ ] Vincular/desvincular produtos pelo `CategoryProductsModal`.
- [ ] Testar reflexo na homepage:
  - [ ] Verificar imagem correta.
  - [ ] Verificar aplicação de `accent_color`.
  - [ ] Conferir ordem das categorias.
  - [ ] Conferir comportamento em desktop e mobile.

### 5.2 Logs e métricas

- [ ] Verificar logs de `logActivity`:
  - [ ] Criação/edição/reorder de categorias.
- [ ] Monitorar `/api/admin/categories`:
  - [ ] Erros de validação.
  - [ ] Erros de banco.
- [ ] Registrar métricas (mesmo que manuais no início):
  - [ ] Tempo médio de cadastro de categoria.
  - [ ] Ocorrência de uploads duplicados (esperado = 0).
  - [ ] Diferenças entre categorias no admin e na homepage (esperado = 0).

---

## 6. Pós-Entrega

- [ ] Validar com stakeholders se:
  - [ ] UX da aba de categorias está alinhada com Hero/Banners/Products.
  - [ ] Visual da homepage está coerente com a nova configuração.
- [ ] Decidir se mantém ou remove qualquer feature flag temporária usada na migração.

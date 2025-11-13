# Plano de Revisão da Aba de Categorias

## Contexto
- `app/admin/categories/page.tsx` mantém slug manual e não publica `accent_color`, diferente de `components/admin/products/product-form.tsx` que gera slug automaticamente e envia todos os campos.
- Upload de imagem usa `components/admin/ui/single-image-upload.tsx`, contrariando o fluxo unificado definido em `docs/media-library-specs.md` e nos formulários de Hero/Banner.
- O modal de gestão de produtos (`components/admin/categories/category-products-modal.tsx`) replica UI própria, sem `components/admin/ui/modal.tsx` nem paginação real da API.
- A homepage (`components/ui/categories-section.tsx`) ignora `image_url` e `accent_color`, logo o conteúdo salvo no admin não impacta o storefront.

## Objetivos
1. Alinhar a modelagem de categorias ao padrão das demais sections (slug automático, campos completos, logs).
2. Adotar o MediaPicker como fluxo único de upload e reuso de mídias para categorias.
3. Unificar UX da aba com os padrões de Hero, Banners e Products (forms + feedback + modal compartilhado).
4. Garantir que a homepage utilize os dados gerenciados no admin sem divergências de schema.
5. Estabelecer métricas e QA que evitem regressões funcionais ou visuais.

## Escopo
- Inclusões: ajustes no admin (`app/admin/categories/**`), APIs (`app/api/admin/categories/**`), componentes compartilhados de upload/modal, consumo de dados na homepage.
- Exclusões: mudanças estruturais na base Supabase além dos campos já existentes (ex.: não criar novas tabelas), redesign completo da homepage, features fora de categorias.

## Fase 0 — Preparação
1. Mapear feature flags e estados locais que possam interferir na experiência (checar `useHomepageSections` e `HomepageSettings`).
2. Validar permissões necessárias (`requireAdmin`, `requireEditor`) nos endpoints envolvidos.
3. Revisar backlog de mídia para garantir que a migração para MediaPicker não conflita com a task de `docs/media-library-specs.md`.

## Fase 1 — Dados e API
1. Refatorar `app/admin/categories/page.tsx` para usar React Hook Form + Zod, com auto-slug (via helper de `slugifyId`).
2. Incluir `accent_color` e demais campos opcionais no payload enviado aos endpoints (`POST`/`PUT`).
3. Atualizar validação em `app/api/admin/categories/route.ts` e `app/api/admin/categories/[id]/route.ts` para refletir o novo schema e permitir rename seguro.
4. Garantir registro consistente em logs (`logActivity`) para criação, atualização e sincronização.
5. Reavaliar `sync` para evitar sobrescrever campos customizados do admin.

## Fase 2 — Upload Unificado
1. Implementar o `MediaPicker` conforme `docs/media-library-specs.md`, expondo seleção de galeria + novo upload.
2. Substituir `SingleImageUpload` por `MediaPicker` na aba de categorias e validar integração com `/api/admin/upload`.
3. Normalizar bucket/prefix (`categories/<slug>/`) e assegurar que reuso de imagem propague `storage_path`.
4. Documentar no README do painel o novo fluxo de mídia.

## Fase 3 — UI e UX
1. Padronizar layout do formulário (componentes de `components/admin/ui`) e remover `alert/confirm` em favor de toasts ou feedback inline.
2. Reescrever `CategoryProductsModal` utilizando `components/admin/ui/modal.tsx`, com paginação/infinite scroll da API (`/api/admin/products`).
3. Incluir preview visual da categoria (card espelhando a homepage) ao lado do formulário.
4. Implementar reordenação de categorias com drag and drop e endpoint dedicado (similar a `saveSectionItemOrder`).

## Fase 4 — Integração com a Homepage
1. Atualizar `components/ui/categories-section.tsx` para exibir imagens, cores e estados ativos vindos do banco.
2. Garantir que `app/page.tsx` e `app/produtos/page.tsx` tratem o novo campo `accent_color` e fallback.
3. Introduzir testes manuais orientados (desktop/mobile) para conferir consistência visual.

## Fase 5 — QA e Observabilidade
1. Rodar `npm run lint` e checar warnings ligados a hooks/form.
2. Validar fluxo completo (criar, editar, desativar, mover produtos, reusar imagem) em ambiente local e staging.
3. Monitorar logs de `logActivity` após deploy para assegurar auditoria dos eventos.
4. Definir métricas: tempo médio de cadastro, taxa de erro de upload, consistência entre admin e homepage.

## Cronograma Estimado
- Semana 1: Fases 0 e 1 concluídas com code review.
- Semana 2: Fases 2 e 3 com validações de UX.
- Semana 3: Fase 4, ajustes finos e QA completo.
- Semana 4: Deploy gradual, monitoramento de métricas e suporte pós-release.

## Dependências
- Disponibilidade das specs finais do MediaPicker.
- Acesso aos buckets Supabase e credenciais de service role para testes locais.
- Aprovação de stakeholders para mudanças visuais na homepage.

## Riscos e Mitigações
- **Risco:** regressão em uploads existentes. **Mitigação:** feature flag temporária para alternar entre componentes.
- **Risco:** discrepância de slug após rename. **Mitigação:** migração que atualiza produtos vinculados e valida na API.
- **Risco:** aumento de tempo de carregamento por previews. **Mitigação:** lazy loading das imagens e compressão via `next/image`.

## Métricas de Sucesso
- 0 erros de validação de slug durante cadastros em 7 dias.
- Redução de 50% no tempo médio de cadastro de categoria (baseline coletado antes da entrega).
- 100% das categorias exibindo imagem real na homepage após sincronização.
- Nenhuma falha registrada na API `/api/admin/categories` em logs durante o primeiro ciclo de observação.

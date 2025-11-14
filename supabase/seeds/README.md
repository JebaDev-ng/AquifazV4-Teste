# Supabase Seeds

Os seeds ficam diretamente em `supabase/seeds` porque o CLI aplica os arquivos nessa pasta em ordem alfanumérica. Para garantir consistência:

1. Use prefixos numéricos (`1_`, `2_`, ...) para facilitar a ordem.
2. Execute com `supabase db reset --seed` sempre que precisar recriar tudo localmente.

## Arquivos disponíveis

| Arquivo | Conteúdo |
| --- | --- |
| `1_seed_base_auth.sql` | Usuários/grupos de autenticação iniciais. |
| `2_seed_product_categories.sql` | Categorias públicas usadas pelo storefront + categoria `uncategorized`. |
| `3_seed_content_sections.sql` | Hero, banner e configurações padrão em `content_sections`. |
| `4_seed_homepage_sections.sql` | Seções de produtos iniciais (sem itens vinculados). |
| `5_seed_products.sql` | Categorias avançadas e catálogo inicial de produtos reais. |

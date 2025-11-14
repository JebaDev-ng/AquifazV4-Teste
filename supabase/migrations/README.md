# Supabase Migrations

O Supabase CLI carrega as migrations diretamente da pasta `supabase/migrations`, respeitando apenas a ordem lexicográfica (timestamp + nome). Subpastas ainda não são suportadas, portanto mantemos os arquivos na raiz e usamos uma convenção `YYYYMMDDHHMMSS_<contexto>.sql`.

## Índice rápido

| Arquivo | Domínio | Descrição |
| --- | --- | --- |
| `20241114090000_create_products_table.sql` | Produtos | Estrutura principal da tabela `products`, índices e RLS. |
| `20241114090500_create_products_bucket.sql` | Storage | Bucket `products` e policies de upload. |
| `20241114091000_create_media_library.sql` | Media Library | Tabela `media_library` que registra uploads e auditoria. |
| `20241114091500_create_product_categories.sql` | Categorias | Primeira versão da tabela `product_categories` com RLS. |
| `20241114092000_update_product_categories_schema.sql` | Categorias | Adiciona o campo `icon` e o gatilho que mantém `updated_at`. |
| `20241114092500_create_categories_bucket.sql` | Storage | Bucket `categories` + policies para as imagens das categorias. |
| `20241114093000_add_product_categories_fk.sql` | Produtos ↔ Categorias | Garante categorias auxiliares e cria a FK em `products.category`. |
| `20241114093500_create_content_sections.sql` | Conteúdo base | Estrutura compartilhada usada por hero, banner e homepage settings. |
| `20241114094000_create_homepage_sections.sql` | Seções de produtos | Tabelas `homepage_sections` e `homepage_section_items` com RLS. |
| `20241114094500_create_hero_and_banner_buckets.sql` | Storage | Buckets/policies para uploads das áreas “Hero” e “Banners”. |

> Dica: use `supabase db lint` ou `supabase db diff` sempre a partir da raiz do projeto para manter a mesma ordem.

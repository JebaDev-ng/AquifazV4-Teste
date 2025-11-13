# Migrações V2 - Schema Otimizado

## 📋 Visão Geral

Esta é a versão 2 do schema do banco de dados, completamente otimizada e sem lógica de sincronização de categorias.

## 🎯 Principais Mudanças

### ✅ O que mudou:

1. **Categorias criadas manualmente**
   - Não há mais seed de categorias pré-definidas
   - Admin cria categorias do zero via painel
   - Sem botão de "sincronizar" - não faz mais sentido

2. **Schema simplificado**
   - Removida lógica de sincronização
   - Estrutura mais limpa e direta
   - Melhor performance

3. **Controle total do admin**
   - Admin define quais categorias existem
   - Flexibilidade total para personalização
   - Sem dados "forçados" no banco

### ❌ O que foi removido:

- Seed automático de categorias
- Lógica de sincronização (`sync`)
- Tabelas redundantes (`homepage_categories`, `homepage_products`)
- Campos desnecessários

## 📁 Estrutura dos Arquivos

```
v2/
├── 00_initial_schema.sql       # Schema base (profiles, categories, products)
├── 01_content_management.sql   # Hero, banners, seções da homepage
├── 02_media_and_logs.sql       # Biblioteca de mídia e logs
├── 03_storage_buckets.sql      # Configuração do Supabase Storage
├── 04_seed_initial_data.sql    # Dados mínimos (hero, banner, settings)
└── README.md                   # Este arquivo
```

## 🚀 Como Aplicar

### Opção 1: Banco de Dados Novo (Recomendado)

```bash
# 1. Criar novo projeto no Supabase
# 2. Executar as migrações em ordem:

psql -h <seu-host> -U postgres -d postgres -f 00_initial_schema.sql
psql -h <seu-host> -U postgres -d postgres -f 01_content_management.sql
psql -h <seu-host> -U postgres -d postgres -f 02_media_and_logs.sql
psql -h <seu-host> -U postgres -d postgres -f 03_storage_buckets.sql
psql -h <seu-host> -U postgres -d postgres -f 04_seed_initial_data.sql
```

### Opção 2: Via Supabase Dashboard

1. Acesse o SQL Editor no dashboard do Supabase
2. Execute cada arquivo na ordem (00 → 04)
3. Verifique se não há erros

### Opção 3: Via Supabase CLI

```bash
# Se estiver usando Supabase CLI local
supabase db reset
supabase migration up
```

## 📊 Tabelas Criadas

### Core
- `profiles` - Perfis de usuários com roles
- `product_categories` - Categorias (criadas manualmente)
- `products` - Produtos completos

### Conteúdo
- `content_sections` - Conteúdo genérico editável
- `homepage_hero_content` - Hero section
- `homepage_banner_sections` - Banners
- `homepage_sections` - Seções configuráveis
- `homepage_section_items` - Produtos nas seções

### Sistema
- `media_library` - Biblioteca de mídia
- `activity_logs` - Logs de atividades

## 🔐 Segurança (RLS)

Todas as tabelas têm Row Level Security (RLS) habilitado:

- **Leitura pública**: Categorias, produtos, conteúdo
- **Escrita admin**: Apenas admins podem criar/editar/deletar
- **Escrita editor**: Editores podem gerenciar produtos
- **Logs**: Apenas admins podem visualizar

## 🎨 Fluxo de Trabalho

### 1. Primeiro Acesso (Admin)

```sql
-- Criar primeiro admin manualmente
UPDATE profiles
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

### 2. Criar Categorias

Via painel admin:
1. Acessar `/admin/categories`
2. Clicar em "Nova Categoria"
3. Preencher: nome, descrição, ícone, cor
4. Salvar

### 3. Criar Produtos

Via painel admin:
1. Acessar `/admin/products`
2. Clicar em "Novo Produto"
3. Selecionar categoria criada
4. Preencher dados e salvar

### 4. Configurar Homepage

Via painel admin:
1. Editar hero section
2. Editar banners
3. Criar seções de produtos
4. Arrastar produtos para as seções

## 🔄 Migração de Dados Antigos

Se você tem dados no schema antigo:

```sql
-- Migrar categorias (se necessário)
INSERT INTO product_categories (id, name, description, icon, sort_order)
SELECT id, name, description, icon, sort_order
FROM old_categories_table
ON CONFLICT (id) DO NOTHING;

-- Migrar produtos
INSERT INTO products (name, slug, category, price, ...)
SELECT name, slug, category, price, ...
FROM old_products_table
ON CONFLICT (slug) DO NOTHING;
```

## ⚠️ Notas Importantes

1. **Backup**: Sempre faça backup antes de aplicar migrações
2. **Ordem**: Execute os arquivos na ordem numérica
3. **Erros**: Se houver erro, reverta e corrija antes de continuar
4. **Teste**: Teste em ambiente de desenvolvimento primeiro

## 📚 Documentação Adicional

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)

## 🐛 Troubleshooting

### Erro: "relation already exists"

```sql
-- Dropar tabela se necessário
DROP TABLE IF EXISTS nome_da_tabela CASCADE;
```

### Erro: "permission denied"

```sql
-- Verificar role do usuário
SELECT current_user, current_database();
```

### Erro: "RLS policy violation"

```sql
-- Desabilitar RLS temporariamente (apenas para debug)
ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;
```

## ✅ Checklist Pós-Migração

- [ ] Todas as tabelas foram criadas
- [ ] RLS está habilitado em todas as tabelas
- [ ] Storage bucket 'uploads' foi criado
- [ ] Dados iniciais (hero, banner) foram inseridos
- [ ] Primeiro admin foi configurado
- [ ] Categorias foram criadas manualmente
- [ ] Produtos de teste foram criados
- [ ] Homepage está renderizando corretamente

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do Supabase Dashboard
2. Console do navegador (erros de RLS)
3. Network tab (erros de API)

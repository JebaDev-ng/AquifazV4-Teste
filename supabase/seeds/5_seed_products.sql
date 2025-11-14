-- Seed: categorias avançadas e catálogo inicial de produtos

with category_seed (raw_id, name, description, active, sort_order) as (
  values
    ('convites-eventos', 'Convites & Eventos', 'Itens para eventos, cerimônias, festas e identificação.', true, 200),
    ('materiais-pdv', 'Materiais Promocionais & PDV', 'Materiais de divulgação, ponto de venda e comunicação visual.', true, 210),
    ('papelaria-escritorio', 'Papelaria & Escritório', 'Papelaria personalizada, uso corporativo e organização.', true, 220),
    ('adesivos-sinalizacao', 'Adesivos & Sinalização Visual', 'Adesivos, placas e comunicação visual de ambientes.', true, 230),
    ('educacional-editorial', 'Educacional & Editorial', 'Materiais para cursos, escolas, certificações e catálogos.', true, 240),
    ('impressao-acabamentos', 'Impressão & Acabamentos', 'Impressão avulsa e serviços de acabamento.', true, 250),
    ('vestuario-personalizado', 'Vestuário Personalizado', 'Camisas e vestuário com identidade visual da marca.', true, 260),
    ('docs-servicos-digitais', 'Docs & Serviços Digitais', 'Digitação, digitalização, edição de docs e identidade visual.', true, 270),
    ('apresentacoes-midias', 'Apresentações & Mídia Digital', 'Slides, vídeos e artes digitais para telão e redes.', true, 280)
),
normalized_categories as (
  select
    trim(
      both '-'
      from regexp_replace(
        regexp_replace(
          lower(coalesce(nullif(raw_id, ''), name)),
          '[^a-z0-9]+',
          '-',
          'g'
        ),
        '-{2,}',
        '-',
        'g'
      )
    ) as id,
    name,
    description,
    active,
    sort_order
  from category_seed
)
insert into public.product_categories (id, name, description, active, sort_order)
select
  id,
  name,
  description,
  active,
  sort_order
from normalized_categories
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

with new_products (
  slug,
  name,
  description,
  category,
  price,
  unit,
  sort_order
) as (
  values
    -- Convites & Eventos
    ('convite-casamento', 'Convite de Casamento', 'Convites personalizados para casamento, com arte exclusiva e papel especial.', 'convites-eventos', 150.00, 'lote', 10),
    ('convite-empresarial', 'Convite Empresarial', 'Convites formais para eventos corporativos, reuniões e solenidades.', 'convites-eventos', 120.00, 'lote', 20),
    ('convite-formatura', 'Convite Formatura', 'Convites para colações e festas de formatura, com identidade da turma.', 'convites-eventos', 130.00, 'lote', 30),
    ('convite-aniversario', 'Convite de Aniversário', 'Convites criativos para festas infantis, teens e adultos.', 'convites-eventos', 90.00, 'lote', 40),
    ('cracha-eventos', 'Crachá de Eventos', 'Crachás personalizados com cordão, para identificação de participantes.', 'convites-eventos', 4.50, 'unidade', 50),
    ('credencial-evento', 'Credencial', 'Credenciais premium para staff, VIP e acesso restrito em eventos.', 'convites-eventos', 6.00, 'unidade', 60),
    ('lembranca-setimo-dia', 'Lembrança de 7º Dia', 'Cartões lembrança com mensagem personalizada para cerimônias religiosas.', 'convites-eventos', 80.00, 'lote', 70),
    ('topo-bolo', 'Topo de Bolo', 'Topper personalizado para bolo, em papel ou PVC, com nome ou tema.', 'convites-eventos', 35.00, 'unidade', 80),
    ('cartela-bijuteria', 'Cartela para Bijuteria', 'Cartelas personalizadas para exposição de brincos, colares e acessórios.', 'convites-eventos', 70.00, 'lote', 90),
    ('tags-personalizadas', 'Tags Personalizadas', 'Tags para lembrancinhas, embalagens e produtos, com furo e cordão opcional.', 'convites-eventos', 55.00, 'lote', 100),
    ('aviso-porta', 'Aviso de Porta', 'Avisos "Não perturbe" personalizados para eventos, hotéis ou quartos.', 'convites-eventos', 60.00, 'lote', 110),

    -- Materiais Promocionais & PDV
    ('flyer', 'Flyer', 'Folheto promocional frente ou frente e verso para divulgação rápida.', 'materiais-pdv', 90.00, 'lote', 200),
    ('panfleto', 'Panfleto', 'Material impresso para distribuição em massa com ofertas e campanhas.', 'materiais-pdv', 95.00, 'lote', 210),
    ('folder-1-dobra', 'Folder 1 Dobra', 'Folder com uma dobra, ideal para apresentar serviços de forma objetiva.', 'materiais-pdv', 160.00, 'lote', 220),
    ('folder-2-dobras', 'Folder 2 Dobras', 'Folder em três partes, com mais espaço para conteúdo e imagens.', 'materiais-pdv', 190.00, 'lote', 230),
    ('banner-lona', 'Banner em Lona', 'Banner em lona para fachadas, eventos e promoções, com ilhós.', 'materiais-pdv', 70.00, 'unidade', 240),
    ('display-mesa', 'Display de Mesa', 'Display em papel ou cartão para balcão ou mesas de atendimento.', 'materiais-pdv', 60.00, 'lote', 250),
    ('display-l', 'Display em L', 'Display rígido em formato L para balcão, cardápios e informativos.', 'materiais-pdv', 75.00, 'lote', 260),
    ('faixa-divulgacao', 'Faixa de Divulgação', 'Faixa em lona para promoções sazonais e eventos especiais.', 'materiais-pdv', 85.00, 'unidade', 270),
    ('solapa', 'Solapa Personalizada', 'Solapas personalizadas para sacolas ou embalagens de produtos.', 'materiais-pdv', 80.00, 'lote', 280),
    ('wobbler-pdv', 'Wobbler para PDV', 'Wobblers para gôndolas e PDV, com haste e recorte personalizado.', 'materiais-pdv', 95.00, 'lote', 290),
    ('cartao-postal', 'Cartão Postal', 'Cartões postais personalizados para campanhas, turismo ou lembrança.', 'materiais-pdv', 85.00, 'lote', 300),

    -- Papelaria & Escritório
    ('cartao-visitas', 'Cartão de Visitas', 'Cartões de visita personalizados com acabamento profissional.', 'papelaria-escritorio', 55.00, 'lote', 400),
    ('papel-timbrado', 'Papel Timbrado', 'Papel timbrado com logotipo e identidade visual da empresa.', 'papelaria-escritorio', 120.00, 'lote', 410),
    ('papelaria-personalizada', 'Papelaria Personalizada', 'Kit com papel timbrado, envelopes e cartões na mesma identidade.', 'papelaria-escritorio', 220.00, 'kit', 420),
    ('pasta-personalizada', 'Pasta Personalizada', 'Pastas com impressão externa e interna para propostas e contratos.', 'papelaria-escritorio', 150.00, 'lote', 430),
    ('bloco-anotacoes', 'Bloco de Anotações', 'Blocos personalizados para uso interno, eventos ou brindes corporativos.', 'papelaria-escritorio', 90.00, 'lote', 440),
    ('planner-semanal', 'Planner Semanal', 'Planner de mesa ou parede com organização semanal personalizada.', 'papelaria-escritorio', 70.00, 'unidade', 450),
    ('receituario', 'Receituário', 'Receituário médico ou odontológico com dados profissionais.', 'papelaria-escritorio', 85.00, 'lote', 460),
    ('capa-carne', 'Capa de Carnê', 'Capas personalizadas para carnês de pagamento ou assinaturas.', 'papelaria-escritorio', 80.00, 'lote', 470),
    ('envelope-personalizado', 'Envelope Personalizado', 'Envelopes impressos com logotipo e dados de contato.', 'papelaria-escritorio', 120.00, 'lote', 480),
    ('etiquetas-personalizadas', 'Etiquetas Personalizadas', 'Etiquetas adesivas para produtos, endereçamento ou organização.', 'papelaria-escritorio', 70.00, 'lote', 490),
    ('marca-pagina', 'Marca Página', 'Marcadores de página personalizados para brindes, eventos ou editoras.', 'papelaria-escritorio', 60.00, 'lote', 500),
    ('calendario-mesa', 'Calendário de Mesa', 'Calendários de mesa personalizados com marca e contatos da empresa.', 'papelaria-escritorio', 95.00, 'lote', 510),
    ('calendario-parede', 'Calendário de Parede', 'Calendários de parede com identidade visual personalizada.', 'papelaria-escritorio', 110.00, 'lote', 520),
    ('impressao-colorida-a3', 'Impressão Colorida A3', 'Impressões coloridas em A3 para pôsteres e apresentações.', 'papelaria-escritorio', 6.00, 'pagina', 530),
    ('impressao-colorida-a4', 'Impressão Colorida A4', 'Impressões coloridas em A4 para documentos e apostilas.', 'papelaria-escritorio', 3.50, 'pagina', 540),

    -- Educacional & Editorial
    ('apostilas-personalizadas', 'Apostilas', 'Impressão e acabamento de apostilas para cursos e treinamentos.', 'educacional-editorial', 4.50, 'unidade', 600),
    ('revista-grampo', 'Revista com Grampo', 'Revistas ou livretos com grampo para catálogos e materiais institucionais.', 'educacional-editorial', 6.50, 'unidade', 610),
    ('certificado-personalizado', 'Certificado', 'Certificados personalizados para cursos, eventos e premiações.', 'educacional-editorial', 80.00, 'lote', 620),

    -- Impressão & Acabamentos
    ('plastificacao-documentos', 'Plastificação', 'Plastificação de documentos para proteção e durabilidade.', 'impressao-acabamentos', 7.00, 'unidade', 650),
    ('laminacao-bopp', 'Laminação BOPP', 'Laminação fosca ou brilho para capas, cartões e materiais premium.', 'impressao-acabamentos', 2.50, 'unidade', 660),

    -- Adesivos & Sinalização Visual
    ('adesivo-parede', 'Adesivo de Parede', 'Adesivos decorativos para ambientes residenciais ou comerciais.', 'adesivos-sinalizacao', 120.00, 'm2', 700),
    ('adesivo-vinil', 'Adesivo de Vinil', 'Adesivos em vinil resistentes para rótulos, vitrines e veículos.', 'adesivos-sinalizacao', 90.00, 'm2', 710),
    ('adesivo-fotografico', 'Adesivo Fotográfico', 'Adesivos com qualidade fotográfica para painéis e decorações especiais.', 'adesivos-sinalizacao', 140.00, 'm2', 720),
    ('fachada-comercial', 'Fachada Comercial', 'Arte e impressão de fachada comercial em lona ou vinil.', 'adesivos-sinalizacao', 220.00, 'servico', 730),
    ('placa-parede', 'Placa de Parede', 'Placas rígidas para identificação de ambientes, salas e recepções.', 'adesivos-sinalizacao', 90.00, 'unidade', 740),

    -- Vestuário Personalizado
    ('camisa-manga-curta', 'Camisa Manga Curta', 'Camisetas personalizadas com estampa em silk ou DTF para empresas e eventos.', 'vestuario-personalizado', 59.90, 'unidade', 800),
    ('camisa-manga-longa', 'Camisa Manga Longa', 'Camisas manga longa personalizadas para uniformes ou ações promocionais.', 'vestuario-personalizado', 69.90, 'unidade', 810),

    -- Docs & Serviços Digitais
    ('digitacoes-profissionais', 'Digitações', 'Digitação profissional de textos, trabalhos e documentos diversos.', 'docs-servicos-digitais', 8.00, 'pagina', 850),
    ('digitalizacoes', 'Digitalizações', 'Digitalização de documentos físicos em alta qualidade.', 'docs-servicos-digitais', 3.00, 'pagina', 860),
    ('edicao-documentos', 'Edição de Documentos', 'Ajuste de layout, correção e formatação de documentos existentes.', 'docs-servicos-digitais', 40.00, 'servico', 870),
    ('criacao-logotipo', 'Criação de Logotipo', 'Criação de logotipo original com estudo de identidade visual.', 'docs-servicos-digitais', 350.00, 'servico', 880),
    ('vetorizacao-logotipo', 'Vetorização de Logotipo', 'Conversão de logotipos em baixa resolução para vetor editável.', 'docs-servicos-digitais', 80.00, 'servico', 890),

    -- Apresentações & Mídia Digital
    ('figurinhas-whatsapp', 'Figurinhas para WhatsApp', 'Criação de figurinhas personalizadas a partir de fotos ou ilustrações.', 'apresentacoes-midias', 35.00, 'pacote', 900),
    ('slides-powerpoint', 'Slides em PowerPoint', 'Criação e diagramação de apresentações profissionais em PowerPoint.', 'apresentacoes-midias', 200.00, 'servico', 910),
    ('slides-video', 'Slides em Vídeo', 'Transformação de apresentações em vídeo animado para telões ou redes.', 'apresentacoes-midias', 250.00, 'servico', 920),
    ('banner-rede-social', 'Banner para Rede Social', 'Arte digital otimizada para Instagram, Facebook e outras redes.', 'apresentacoes-midias', 45.00, 'arte', 930)
),
normalized_products as (
  select
    slug,
    name,
    description,
    trim(
      both '-'
      from regexp_replace(
        regexp_replace(
          lower(coalesce(nullif(category, ''), 'uncategorized')),
          '[^a-z0-9]+',
          '-',
          'g'
        ),
        '-{2,}',
        '-',
        'g'
      )
    ) as category,
    price,
    unit,
    sort_order
  from new_products
)
insert into public.products (
  slug,
  name,
  description,
  category,
  price,
  unit,
  sort_order,
  meta_description
)
select
  slug,
  name,
  description,
  category,
  price,
  unit,
  sort_order,
  description
from normalized_products
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  price = excluded.price,
  unit = excluded.unit,
  sort_order = excluded.sort_order,
  meta_description = excluded.meta_description,
  updated_at = timezone('utc', now());

with section_seed (
  id,
  title,
  subtitle,
  layout_type,
  bg_color,
  limit_value,
  view_all_label,
  view_all_href,
  category_id,
  sort_order,
  is_active,
  config
) as (
  values
    (
      'featured_showcase',
      'Produtos em destaque',
      'Seleção curada pelo time AquiFaz',
      'featured',
      'white',
      3,
      'Ver catálogo',
      '/produtos',
      null,
      10,
      true,
      jsonb_build_object('badge', 'Top picks')
    ),
    (
      'grid_convites_eventos',
      'Convites & Eventos',
      'Itens essenciais para organizar cerimônias e festas',
      'grid',
      'gray',
      3,
      'Ver convites',
      '/produtos?category=convites-eventos',
      'convites-eventos',
      20,
      true,
      jsonb_build_object('tagline', 'Personalização completa')
    ),
    (
      'grid_promocionais',
      'Materiais Promocionais & PDV',
      'Folhetos, banners e comunicações rápidas para campanhas',
      'grid',
      'white',
      3,
      'Ver materiais promocionais',
      '/produtos?category=materiais-pdv',
      'materiais-pdv',
      30,
      true,
      jsonb_build_object('tagline', 'Impulsione suas ações')
    ),
    (
      'grid_digitais',
      'Serviços Digitais',
      'Artes para redes, apresentações e mídias digitais',
      'grid',
      'gray',
      3,
      'Ver serviços digitais',
      '/produtos?category=apresentacoes-midias',
      'apresentacoes-midias',
      40,
      true,
      jsonb_build_object('tagline', 'Presença online alinhada à marca')
    )
)
insert into public.homepage_sections (
  id,
  title,
  subtitle,
  layout_type,
  bg_color,
  "limit",
  view_all_label,
  view_all_href,
  category_id,
  sort_order,
  is_active,
  config
)
select
  id,
  title,
  subtitle,
  layout_type,
  bg_color,
  limit_value,
  view_all_label,
  view_all_href,
  category_id,
  sort_order,
  is_active,
  coalesce(config, '{}'::jsonb)
from section_seed
on conflict (id) do update
set
  title = excluded.title,
  subtitle = excluded.subtitle,
  layout_type = excluded.layout_type,
  bg_color = excluded.bg_color,
  "limit" = excluded."limit",
  view_all_label = excluded.view_all_label,
  view_all_href = excluded.view_all_href,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  config = excluded.config,
  updated_at = timezone('utc', now());

delete from public.homepage_section_items
where section_id in (
  'featured_showcase',
  'grid_convites_eventos',
  'grid_promocionais',
  'grid_digitais'
);

with item_seed (section_id, product_slug, sort_order) as (
  values
    ('featured_showcase', 'convite-casamento', 1),
    ('featured_showcase', 'cartao-visitas', 2),
    ('featured_showcase', 'adesivo-parede', 3),
    ('grid_convites_eventos', 'convite-empresarial', 1),
    ('grid_convites_eventos', 'cracha-eventos', 2),
    ('grid_convites_eventos', 'topo-bolo', 3),
    ('grid_promocionais', 'flyer', 1),
    ('grid_promocionais', 'banner-lona', 2),
    ('grid_promocionais', 'wobbler-pdv', 3),
    ('grid_digitais', 'slides-powerpoint', 1),
    ('grid_digitais', 'banner-rede-social', 2),
    ('grid_digitais', 'figurinhas-whatsapp', 3)
),
resolved_items as (
  select
    i.section_id,
    p.id as product_id,
    i.sort_order
  from item_seed i
  join public.products p on p.slug = i.product_slug
)
insert into public.homepage_section_items (
  section_id,
  product_id,
  sort_order
)
select
  section_id,
  product_id,
  sort_order
from resolved_items
order by section_id, sort_order;


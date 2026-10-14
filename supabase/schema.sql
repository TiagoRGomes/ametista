-- Ametista CMS schema for Supabase
-- Run the whole file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id integer primary key default 1 check (id = 1),
  business_name text not null default 'AMETISTA',
  tagline text not null default 'Materiais para construção',
  hero_badge text not null default 'A sua loja de confiança',
  hero_title text not null default 'Tudo para sua obra. Perto de você.',
  hero_description text not null default 'Da hidráulica à elétrica, do cimento ao acabamento: na Ametista você encontra materiais para construir, reformar e cuidar de cada detalhe.',
  logo_url text not null default '/images/logo-ametista.jpg',
  hero_image_url text not null default '/images/fachada.jpg',
  about_title text not null default 'Mais praticidade para construir, reformar e cuidar.',
  about_description text not null default 'A Ametista reúne produtos para diferentes fases da obra, de instalações hidráulicas e elétricas a materiais de construção, acabamento e fixação. Nossa equipe está pronta para ajudar você a encontrar o que precisa.',
  cta_title text not null default 'Fale com a Ametista e peça seu orçamento.',
  cta_description text not null default 'Envie sua lista de materiais pelo WhatsApp e consulte preços e disponibilidade com nossa equipe.',
  phone text not null default '(35) 3464-1120',
  whatsapp_construction text not null default '5535999633377',
  whatsapp_agro text not null default '5535999683336',
  address text not null default 'Avenida Alvarenga Peixoto, 807 - Centro, Inconfidentes - MG, Brasil',
  opening_hours text not null default '',
  show_categories boolean not null default true,
  show_products boolean not null default true,
  show_about boolean not null default true,
  show_cta boolean not null default true,
  section_order text[] not null default array['categories','products','about','cta']::text[],
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  eyebrow text not null default 'Linha de produtos',
  description text not null default '',
  image_url text not null default '/images/fachada.jpg',
  icon_name text not null default 'package',
  products text[] not null default '{}',
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text not null default '',
  image_url text not null default '/images/fachada.jpg',
  price text not null default '',
  position integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_position_idx on public.categories(position);
create index if not exists products_position_idx on public.products(position);
create index if not exists products_category_id_idx on public.products(category_id);

-- Seed the editable home page and category/catalog starter items (prices are intentionally blank).
insert into public.site_content (id, address) values (1, 'Avenida Alvarenga Peixoto, 807 - Centro, Inconfidentes - MG, Brasil')
on conflict (id) do update set address = case
  when nullif(btrim(site_content.address), '') is null then excluded.address
  else site_content.address
end;

insert into public.categories (slug, name, eyebrow, description, image_url, icon_name, products, position, is_visible)
values
  ('hidraulica','Hidráulica','Água e instalação','Tubos de PVC, conexões, linha de água quente e torneiras.','/images/torneiras-metais.jpg','droplets',array['Conexões','Tubos de PVC','Tubos de água quente','Conexões de água quente','Torneiras e metais'],1,true),
  ('eletrica','Materiais elétricos','Instalações e iluminação','Itens para instalações elétricas, reparos e iluminação.','/images/iluminacao-eletrica.jpg','lightbulb',array['Materiais elétricos','Lâmpadas e iluminação','Componentes e acessórios'],2,true),
  ('vedacit','Vedacit e acabamento','Proteção e manutenção','Linha Vedacit, produtos para vedação, tintas e manutenção.','/images/prateleira-vedacit-tintas.jpg','paint-bucket',array['Linha Vedacit','Vedação e impermeabilização','Tintas e manutenção'],3,true),
  ('cimento','Cimento e cal Itaú','Base para sua obra','Cimento Itaú e Cal Itaú para diferentes etapas da construção.','/images/fachada.jpg','hammer',array['Cimento Itaú','Cal Itaú','Materiais para construção em geral'],4,true),
  ('fixacao','Parafusos e pregos','Fixação e montagem','Itens de fixação para reparos, montagem e obra.','/images/parafusos-pregos.jpg','nut',array['Parafusos','Pregos','Fixadores e acessórios'],5,true),
  ('torneiras','Torneiras e metais','Detalhes que fazem diferença','Torneiras e metais para instalações, trocas e reformas.','/images/torneiras-metais.jpg','wrench',array['Torneiras','Metais para instalação','Acessórios hidráulicos'],6,true)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name, description, image_url, price, position, is_visible)
select c.id, v.slug, v.name, v.description, v.image_url, '', v.position, true
from (values
  ('hidraulica','tubos-de-pvc','Tubos de PVC','Tubos para instalações hidráulicas. Consulte os diâmetros disponíveis.','/images/torneiras-metais.jpg',1),
  ('hidraulica','conexoes','Conexões','Conexões para montagem e manutenção de instalações.','/images/torneiras-metais.jpg',2),
  ('hidraulica','linha-agua-quente','Linha de água quente','Tubos e conexões indicados para instalações de água quente.','/images/torneiras-metais.jpg',3),
  ('eletrica','materiais-eletricos','Materiais elétricos','Produtos para instalações e manutenção elétrica.','/images/iluminacao-eletrica.jpg',4),
  ('vedacit','linha-vedacit','Linha Vedacit','Produtos Vedacit para vedação e proteção da construção.','/images/prateleira-vedacit-tintas.jpg',5),
  ('cimento','cimento-itau','Cimento Itaú','Consulte disponibilidade e valores do cimento Itaú.','/images/fachada.jpg',6),
  ('cimento','cal-itau','Cal Itaú','Consulte disponibilidade e valores da cal Itaú.','/images/fachada.jpg',7),
  ('torneiras','torneiras-produto','Torneiras','Opções de torneiras e metais para sua instalação.','/images/torneiras-metais.jpg',8),
  ('fixacao','parafusos-e-pregos','Parafusos e pregos','Itens de fixação para diversas aplicações.','/images/parafusos-pregos.jpg',9)
) as v(category_slug,slug,name,description,image_url,position)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

-- Ensure frontend roles can reach these tables; RLS policies below limit what they can do.
grant select on public.site_content, public.categories, public.products to anon, authenticated;
grant insert, update, delete on public.site_content, public.categories, public.products to authenticated;
grant select on public.admin_users to authenticated;

-- Enable row level security everywhere.
alter table public.admin_users enable row level security;
alter table public.site_content enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

-- Admin user can read their own membership. Membership writes should be done in SQL Editor.
drop policy if exists "admin users can read own row" on public.admin_users;
create policy "admin users can read own row" on public.admin_users
for select to authenticated using (user_id = auth.uid());

-- Public site content can be read by visitors; only allow designated admins to modify it.
drop policy if exists "site content is public readable" on public.site_content;
create policy "site content is public readable" on public.site_content
for select to anon, authenticated using (true);
drop policy if exists "admins can insert site content" on public.site_content;
create policy "admins can insert site content" on public.site_content
for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can update site content" on public.site_content;
create policy "admins can update site content" on public.site_content
for update to authenticated using (exists (select 1 from public.admin_users a where a.user_id = auth.uid())) with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can delete site content" on public.site_content;
create policy "admins can delete site content" on public.site_content
for delete to authenticated using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Public visitors see only published categories and products. Admins see drafts/hidden records too.
drop policy if exists "public reads visible categories" on public.categories;
create policy "public reads visible categories" on public.categories
for select to anon, authenticated using (is_visible = true or exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can insert categories" on public.categories;
create policy "admins can insert categories" on public.categories
for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can update categories" on public.categories;
create policy "admins can update categories" on public.categories
for update to authenticated using (exists (select 1 from public.admin_users a where a.user_id = auth.uid())) with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can delete categories" on public.categories;
create policy "admins can delete categories" on public.categories
for delete to authenticated using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "public reads visible products" on public.products;
create policy "public reads visible products" on public.products
for select to anon, authenticated using (is_visible = true or exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can insert products" on public.products;
create policy "admins can insert products" on public.products
for insert to authenticated with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can update products" on public.products;
create policy "admins can update products" on public.products
for update to authenticated using (exists (select 1 from public.admin_users a where a.user_id = auth.uid())) with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can delete products" on public.products;
create policy "admins can delete products" on public.products
for delete to authenticated using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Public image access; uploading/changing/deleting requires an admin membership row.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ametista-media', 'ametista-media', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update set public = true, file_size_limit = 8388608;

drop policy if exists "public can view ametista media" on storage.objects;
create policy "public can view ametista media" on storage.objects
for select to anon, authenticated using (bucket_id = 'ametista-media');
drop policy if exists "admins can upload ametista media" on storage.objects;
create policy "admins can upload ametista media" on storage.objects
for insert to authenticated with check (bucket_id = 'ametista-media' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can update ametista media" on storage.objects;
create policy "admins can update ametista media" on storage.objects
for update to authenticated using (bucket_id = 'ametista-media' and exists (select 1 from public.admin_users a where a.user_id = auth.uid())) with check (bucket_id = 'ametista-media' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
drop policy if exists "admins can delete ametista media" on storage.objects;
create policy "admins can delete ametista media" on storage.objects
for delete to authenticated using (bucket_id = 'ametista-media' and exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

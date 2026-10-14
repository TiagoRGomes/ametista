-- Ametista CMS: tema de cores editável no painel administrativo.
-- Execute uma única vez no Supabase Dashboard > SQL Editor.
-- Não apaga nem modifica o conteúdo existente.
alter table public.site_content
  add column if not exists theme_primary text not null default '#f0782c';

update public.site_content
set theme_primary = '#f0782c'
where theme_primary is null or btrim(theme_primary) = '';

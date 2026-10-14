# Ametista CMS — React + Vite + Tailwind + Supabase

Site da Ametista com painel `/admin`. O site público continua funcionando com conteúdo de demonstração local, mas o CMS completo exige configurar o Supabase.

## Requisitos

- Node.js LTS
- Projeto Supabase
- Conta GitHub e Cloudflare Pages (para publicar)

## 1. Instalar localmente

```bash
npm install
```

Copie `.env.example` para `.env` e preencha o URL e a chave pública do Supabase:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_ANON_OU_PUBLISHABLE
```

Não use a chave `service_role` no frontend. As variáveis `VITE_*` fazem parte do bundle público.

## 2. Preparar o Supabase

1. Abra o projeto no Supabase e vá a **SQL Editor**.
2. Execute o arquivo `supabase/schema.sql`. Ele cria tabelas, políticas RLS, bucket de imagens e dados iniciais para as categorias e linhas de produtos da Ametista.
3. Em **Authentication → Users**, crie o usuário administrador com o e-mail e senha desejados. Não ofereça cadastro público na aplicação.
4. Copie o **UID** do usuário recém-criado. No SQL Editor, execute (substitua o UUID):

```sql
insert into public.admin_users (user_id)
values ('COLE-AQUI-O-UUID-DO-USUARIO');
```

Como alternativa, se preferir procurar o usuário pelo e-mail, execute, substituindo o e-mail:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'admin@sualoja.com.br'
on conflict (user_id) do nothing;
```

5. Em **Authentication → URL Configuration**, adicione os endereços local e de produção em **Redirect URLs**, por exemplo `http://localhost:5173/**` e `https://SEU-SITE.pages.dev/**`.

## 3. Rodar localmente

```bash
npm run dev
```

- Site público: o endereço local mostrado pelo Vite
- Admin: acrescente `/admin`, por exemplo `http://localhost:5173/admin`

## 4. Publicar no GitHub e Cloudflare Pages

1. Envie o projeto ao GitHub. O `.env` já está coberto pelo `.gitignore` padrão do Vite, mas **confirme que não está enviando `.env`**. O arquivo que deve ir ao GitHub é `.env.example`.
2. No Cloudflare Pages, conecte o repositório.
3. Configure:
   - **Framework preset:** Vite (ou None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Em Settings → Environment variables, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para Production (e Preview, se utilizar).
5. Depois de mudar variáveis de ambiente, inicie um novo deploy para que sejam incorporadas ao bundle.
6. Cadastre o domínio `pages.dev` em **Redirect URLs** no Supabase Auth.

O arquivo `public/_redirects` encaminha URLs como `/admin` ao aplicativo React no Cloudflare Pages.

## Funcionalidades do painel

- Login do administrador via Supabase Auth (sem cadastro público no app).
- Editor de textos da home, logotipo, foto de destaque, contactos, endereço e horário.
- Seção final com mapa incorporado do Google Maps e botão “Como chegar”, abrindo a rota no Google Maps do celular. O endereço inicial é Avenida Alvarenga Peixoto, 807 - Centro, Inconfidentes - MG, Brasil; ele pode ser atualizado em Administração → Página inicial → Morada.
- Mostrar/ocultar seções e reorganizar a ordem da página.
- Criar, editar, excluir e ocultar categorias.
- Criar, editar, excluir e ocultar produtos, com categoria, imagem e preço opcional.
- Upload de imagens para Supabase Storage (limite de 8 MB por arquivo).
- Regras de Row Level Security (RLS): visitantes leem conteúdo publicado; somente UIDs presentes em `admin_users` podem editar conteúdo e mídia.

## Notas

- O catálogo inicial contém linhas de produtos fornecidas pela loja, não preços de inventário. Os preços começam vazios para evitar valores incorretos.
- A fachada e as fotos originais são mantidas em `public/images/`. Imagens enviadas pelo CMS usam o bucket `ametista-media`.
- Depois que o site está publicado, alterações feitas pelo painel gravam diretamente no Supabase e passam a aparecer no site público após recarregar a página.

# Recuperação integrada do Ametista CMS

Este pacote foi montado a partir dos arquivos que você enviou nesta conversa. A causa concreta do erro de importação era que `src/App.jsx` e `src/Admin.jsx` importavam `src/lib/content.js` e `src/lib/supabase.js`, mas esses dois arquivos não estavam presentes no projeto recebido.

## Como aplicar com segurança

1. Faça uma cópia da sua pasta atual.
2. Extraia o ZIP na pasta `ametista-landing` (a mesma que contém `package.json`) e aceite mesclar/substituir os arquivos.
3. O ZIP não inclui `.env`, `.git`, `node_modules`, `.vite` nem `dist`; esses itens locais não serão substituídos.
4. No Git Bash, nessa pasta, execute:

   ```bash
   npm ci
   npm run build
   ```

5. Se o build concluir sem erros, execute `npm run dev` e teste `/` e `/admin`.
6. Confira `git status`. Confirme que `.env` não está listado; depois faça commit e push para iniciar um novo deploy no Cloudflare Pages.

Não execute novamente o SQL completo do Supabase apenas para corrigir imports. Os arquivos de aplicação são separados do banco de dados. A conexão usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, com RLS no banco; nunca coloque a chave `service_role` no frontend.

## Corrigido nesta versão

- Adicionado `src/lib/supabase.js`, com configuração segura do cliente e validação de valores de exemplo.
- Adicionado `src/lib/content.js`, com leitura de conteúdo público, conteúdo padrão em caso de falha de conexão e upload de imagens para o bucket `ametista-media`.
- Ajustado o salvamento de produtos para gravar `category_id` como `null` quando não houver categoria, em vez de enviar uma string vazia para uma coluna UUID.

## Verificação

A sintaxe dos arquivos JavaScript/JSX e a resolução dos imports relativos foram verificadas estaticamente. O build de produção não pôde ser executado neste ambiente porque o acesso à registry do npm não está disponível; execute `npm run build` localmente antes de publicar.

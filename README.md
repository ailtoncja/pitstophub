# PitStopHub

Plataforma focada em automobilismo com categorias, equipes, pilotos, calendario e classificacao.

## Requisitos

- Node.js 20+
- npm
- Projeto Supabase criado

## Configurar Supabase

1. Crie um projeto no Supabase.
2. No painel do Supabase, abra SQL Editor e execute o arquivo `supabase/schema.sql`.
3. Copie `.env.example` para `.env` e preencha:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Rodar localmente

1. npm install
2. npm run dev
3. Abra http://localhost:3000

## Build

- npm run build
- npm run preview

## Deploy na Vercel

1. Suba no GitHub.
2. Importe o repositorio na Vercel.
3. Configure as variaveis de ambiente na Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
4. Build Command: npm run build
5. Output Directory: dist

## Deploy na Netlify

1. Suba no GitHub.
2. Importe o repositorio na Netlify.
3. A Netlify vai ler `netlify.toml` automaticamente com:
- Build Command: `npm run build`
- Publish Directory: `dist`
- SPA Redirect: `/* -> /index.html (200)`
4. Configure as variaveis de ambiente na Netlify:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
5. Dispare um novo deploy.

## Observacao

- Se a confirmacao de email estiver habilitada no Supabase Auth, o cadastro cria a conta e o usuario precisa confirmar email antes de entrar.

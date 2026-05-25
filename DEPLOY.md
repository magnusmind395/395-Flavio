# Deploy — Magnus Mind (395-flavio)

Arquitetura híbrida: **Netlify** (frontend) + **Render** (backend/API).

## Frontend (Netlify)

### Novo site / nova conta Netlify

Se o deploy antigo (`395-flavio2.netlify.app` ou outra conta) não reflete o código atual, **crie um site novo** — não é obrigatório apagar o antigo.

1. Acesse [app.netlify.com](https://app.netlify.com) com a **conta correta** (ou crie uma nova).
2. **Add new project** → **Import an existing project** → **GitHub**.
3. Autorize o GitHub e escolha o repositório: `lucasmonteiro9996/395-Flavio`.
4. Branch: `main`.
5. Confirme (o `netlify.toml` na raiz já define build e publish):

| Campo | Valor |
|-------|--------|
| Build command | `npm run build` |
| Publish directory | `dist` |

6. **Site configuration → Environment variables** — adicione todas abaixo (ou use os valores de `.env.production` no repo).

7. **Deploy site** e anote a URL gerada (ex.: `https://nome-aleatorio.netlify.app`).

8. **Firebase Console** → projeto `magnusmind-d42ec` → **Authentication** → **Settings** → **Authorized domains** → adicione o domínio Netlify novo (sem `https://`).

9. **Render** (API) → variável `CORS_ORIGIN` → inclua a URL nova do Netlify, separada por vírgula:
   ```
   https://SEU-SITE.netlify.app,https://395-flavio2.netlify.app,http://localhost:5173
   ```
   Salve e faça **Manual Deploy** no Render se necessário.

10. (Opcional) **Domain management** no Netlify → domínio customizado (ex. `app.magnusmind.io`).

O arquivo `netlify.toml` na raiz já cuida do redirect SPA (`/*` → `index.html`).

### Variáveis obrigatórias no Netlify

1. Conecte o repositório no [Netlify](https://app.netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Variáveis de ambiente:

| Variável | Exemplo |
|----------|---------|
| `VITE_API_BASE_URL` | `https://three95-flavio.onrender.com` |
| `VITE_FIREBASE_API_KEY` | ver `.env.production` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `magnusmind-d42ec.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `magnusmind-d42ec` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `magnusmind-d42ec.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `981919789399` |
| `VITE_FIREBASE_APP_ID` | `1:981919789399:web:46f31e0ad8e164f54e8e12` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-5QHZ9D7E9V` |

O arquivo `netlify.toml` já configura SPA redirects (`/*` → `index.html`).

## Backend (Render)

1. Crie um **Web Service** com **Root Directory** = `server` (obrigatório).
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Health check path: `/api/health`
5. Copie variáveis de `server/.env.example` (OpenRouter, Firebase Admin, Serper/Tavily, WhatsApp).

Ou use o blueprint `render.yaml` na raiz do repositório (Render → Blueprint).

**"Cannot GET /" no navegador:** você abriu a URL da **API** (`three95-flavio.onrender.com`). Isso é normal se o deploy estiver desatualizado — faça **Manual Deploy** no Render após push. Com a versão atual, `/` retorna JSON e `/api/health` confirma que a API está no ar. O **app visual** fica no Netlify, não no Render.

## Desenvolvimento local

```bash
# Terminal 1 — API
cd server && npm install && npm run dev

# Terminal 2 — Frontend
npm install && npm run dev
```

O Vite faz proxy de `/api` para `http://localhost:3001`.

## Timeouts

- Chamadas gerais: **90s** (`AXIOS_TIMEOUT`)
- Chat Consultoria IA: **120s** (`CHAT_TIMEOUT`)

Isso evita erros em cold start do Render (plano gratuito).

# Deploy — Magnus Mind (395-flavio)

Arquitetura híbrida: **Netlify** (frontend) + **Render** (backend/API).

## Frontend (Netlify)

1. Conecte o repositório no [Netlify](https://app.netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Variáveis de ambiente:

| Variável | Exemplo |
|----------|---------|
| `VITE_API_BASE_URL` | `https://three95-flavio.onrender.com` |
| `VITE_FIREBASE_*` | Credenciais do projeto Firebase |

O arquivo `netlify.toml` já configura SPA redirects (`/*` → `index.html`).

## Backend (Render)

1. Crie um **Web Service** apontando para a pasta `server/`.
2. Build: `npm install && npm run build`
3. Start: `npm start`
4. Copie variáveis de `server/.env.example` (OpenRouter, Firebase Admin, Serper/Tavily, WhatsApp).

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

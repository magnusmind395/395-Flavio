# Magnus Mind — 395-flavio

Plataforma de consultoria estratégica com IA, reconstruída a partir do deploy em [395-flavio2.netlify.app](https://395-flavio2.netlify.app/).

## Funcionalidades

- **Login / Registro** (Firebase Auth)
- **Formulário inicial** (Firestore — estágio do negócio, contexto)
- **Dashboard** com estágio real, estatísticas e recomendações dinâmicas
- **Consultoria IA** (OpenRouter + RAG + busca web opcional)
- **Objetivos estratégicos** (CRUD, filtros, sugestões IA, export CSV)
- **Minha equipe** (membros, performance, habilidades)
- **Relatórios** gerados pela API
- **Histórico** de atividades
- **Backend** com WhatsApp (estrutura), timeouts 90s/120s

## Estrutura

```
395-flavio/
├── src/           # Frontend React + Vite + TypeScript
├── server/        # Backend Express (Render)
├── netlify.toml
├── DEPLOY.md
└── .env.example
```

## Início rápido

```bash
# API
cd server
cp .env.example .env
npm install
npm run dev

# Frontend (outro terminal)
npm install
cp .env.example .env
npm run dev
```

## Deploy

Veja [DEPLOY.md](./DEPLOY.md) — frontend no Netlify, API no Render (`VITE_API_BASE_URL`).

## Firebase

O projeto original usava `magnusmind-d42ec`. Configure as variáveis `VITE_FIREBASE_*` ou use os valores padrão em `src/config/firebase.ts` (somente se o projeto ainda estiver ativo na sua conta).

## Chaves necessárias (backend)

- `OPENROUTER_API_KEY` — chat IA
- `FIREBASE_*` — persistência em produção
- `SERPER_API_KEY` ou `TAVILY_API_KEY` — busca (opcional)
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` — WhatsApp (opcional)

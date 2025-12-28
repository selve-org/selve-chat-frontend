# SELVE Chatbot - Frontend

**Live:** [chat.selve.me](https://chat.selve.me)  
**Status:** Production

Next.js chat interface for SELVE personality insights. Users can ask questions about their assessment results and get AI-powered explanations grounded in psychology research.

## Features

- Chat UI with message history
- Real-time typing indicators
- Markdown response rendering
- Authentication with Clerk
- Responsive mobile design

## Quick Start

```bash
pnpm install
pnpm dev  # http://localhost:3000
```

## Tech Stack

**Framework:** Next.js 16 with App Router  
**Styling:** TailwindCSS  
**Auth:** Clerk (shares session with main SELVE app)  
**API:** Connects to `api-chat.selve.me` (FastAPI backend)  
**Deployment:** Vercel (auto-deploy from `main` branch)

## Environment Variables

Copy `.env.template` to `.env` and add your keys:

```bash
cp .env.template .env
```

## Deployment

Push to `main` branch → Vercel auto-deploys to `chat.selve.me`

```bash
git push origin main
```

## Related Repos

- [selve](https://github.com/selve-org/selve) - Main assessment platform
- [selve-chat-backend](https://github.com/selve-org/selve-chat-backend) - FastAPI + RAG backend

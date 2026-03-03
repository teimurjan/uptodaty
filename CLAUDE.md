# uptodaty

AI engineering news feed — daily briefing curated by LLM with web search.

## Stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, Biome, Bun, Vercel AI SDK.

## Commands

- `bun dev` — development server
- `bun run build` — production build
- `bun run lint` — Biome check
- `bun run format` — Biome format

## Architecture

```
src/
  app/api/news/route.ts    server-side LLM API (Anthropic or OpenAI, auto-detected)
  lib/model.ts             provider resolution based on available API key
  components/              one component per file, all typed
  hooks/                   data fetching, scroll tracking, keyboard nav
  lib/                     types, constants, pure utility functions
```

## Conventions

- **Clean, typed, DRY, functional code** — no shortcuts, no `any`, no class components
- Biome for linting and formatting (not ESLint/Prettier)
- Bun as package manager
- Tailwind CSS v4 with `@theme inline` for design tokens in `globals.css`
- Composability over inheritance — small, focused components composed together
- Client components use `"use client"` directive explicitly
- Dynamic category colors use inline `style` (runtime values unknown to Tailwind)
- No obvious comments — code should be self-explanatory

## Environment

Set one of these in `.env.local` — the app auto-detects the provider:
- `ANTHROPIC_API_KEY` — uses Claude Sonnet 4
- `OPENAI_API_KEY` — uses GPT-4o

Optional (enables daily Redis cache — app works without it):
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

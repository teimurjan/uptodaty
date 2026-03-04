# uptodaty

AI engineering news feed — daily briefing curated by LLM with web search.

## Stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, Biome, Bun, Vercel AI SDK.

## Commands

- `bun dev` — development server
- `bun run build` — production build
- `bun run lint` — Biome check
- `bun run format` — Biome format
- `bun run db:seed-pipeline` — seed 3 days of data via full pipeline
- `bun run db:backfill-embeddings` — backfill embeddings + cross-day relations for existing data

## Architecture

```
src/
  app/api/news/route.ts    full pipeline: fetch → dedup → LLM → embed → persist → cache
  app/api/news/graph/      graph API: neighborhood traversal + semantic search
  lib/graph.ts             FalkorDB graph + vector storage (embeddings, relations, KNN search)
  lib/embeddings.ts        OpenAI text-embedding-3-small via AI SDK
  lib/model.ts             provider resolution based on available API key
  components/              one component per file, all typed
  hooks/                   data fetching, scroll tracking, keyboard nav
  lib/                     types, constants, pure utility functions
scripts/
  seed-pipeline.ts         full pipeline seed (3 days)
  backfill-embeddings.ts   backfill embeddings + cross-day relations
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

Always required (used for embeddings — dedup + relation detection + search):
- `OPENAI_API_KEY` — text-embedding-3-small

Optional (enables persistent graph storage + cross-day relations + search):
- `FALKORDB_HOST` (default: localhost)
- `FALKORDB_PORT` (default: 6379)
- `FALKORDB_USERNAME`
- `FALKORDB_PASSWORD`

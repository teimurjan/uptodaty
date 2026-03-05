# uptodaty

AI engineering news feed — daily briefing curated by LLM with web search.

## Stack

Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, Biome, Bun, Vercel AI SDK.

## Commands

- `bun dev` — development server
- `bun run build` — production build
- `bun run lint` — Biome check
- `bun run format` — Biome format
- `bun run db:seed` — seed 3 days of data via full pipeline (all verticals)
- `bun run db:clear` — clear graph database
- `bun run db:backfill-embeddings` — backfill embeddings + relations for existing data
- `bun run cache:clear` — clear dev cache

## Architecture

```
src/
  app/api/news/route.ts    full pipeline: fetch → dedup → categorize → LLM → embed → persist
  app/api/news/graph/      graph API: neighborhood traversal + semantic search
  lib/categorize.ts        pre-categorize HN articles into verticals via gpt-4.1-mini
  lib/pipeline.ts          orchestrates: fetch global → dedup → categorize → curate → persist
  lib/graph.ts             FalkorDB graph + vector storage (embeddings, relations, KNN search)
  lib/embeddings.ts        OpenAI text-embedding-3-small via AI SDK
  lib/model.ts             provider resolution based on available API key
  components/              one component per file, all typed
  hooks/                   data fetching, scroll tracking, keyboard nav
  lib/                     types, constants, pure utility functions
scripts/
  seed.ts                  full pipeline seed (3 days, all verticals)
  backfill-embeddings.ts   backfill embeddings + relations
  clear.ts                 clear graph database
  clear-cache.ts           clear dev cache
```

## Pipeline

1. **Fetch** — HN once (uncategorized) + Reddit/GitHub per-vertical (pre-tagged)
2. **Dedup** — embedding-based cross-source deduplication
3. **Categorize** — classify HN articles into verticals via gpt-4.1-mini
4. **Curate** — main LLM selects 10-15 items per vertical (only sees its own articles)
5. **Persist** — embed items, store in FalkorDB, create relations via KNN

## Conventions

- **Clean, typed, DRY, functional code** — no shortcuts, no `any`, no class components
- Biome for linting and formatting (not ESLint/Prettier)
- Bun as package manager
- Tailwind CSS v4 with `@theme inline` for design tokens in `globals.css`
- Composability over inheritance — small, focused components composed together
- Client components use `"use client"` directive explicitly
- Dynamic category colors use inline `style` (runtime values unknown to Tailwind)
- No obvious comments — code should be self-explanatory
- FalkorDB vector search returns cosine **distance** (lower = more similar), not similarity

## Environment

Set one of these in `.env.local` — the app auto-detects the provider:
- `ANTHROPIC_API_KEY` — uses Claude Sonnet 4
- `OPENAI_API_KEY` — uses GPT-4o

Always required (used for embeddings + categorization):
- `OPENAI_API_KEY` — text-embedding-3-small + gpt-4.1-mini

Optional (enables persistent graph storage + relations + search):
- `FALKORDB_HOST` (default: localhost)
- `FALKORDB_PORT` (default: 6379)
- `FALKORDB_USERNAME`
- `FALKORDB_PASSWORD`

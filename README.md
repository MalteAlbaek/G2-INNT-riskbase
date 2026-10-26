# G2 – riskbase

Next.js web app for screening of project documents (tenders, environmental and geotechnical reports) against configurable templates. Built with Next.js, Tailwind v4, shadcn (Base UI) and Supabase.

## Demo video

▶️ [Watch the demo video](docs/demo.mov)

## Project structure

```
apps/web/            Next.js app (frontend + API routes)
packages/db-types/   Generated TypeScript types for the Supabase database
supabase/            Database migrations and local Supabase config
```

## Getting started

Requirements: [bun](https://bun.sh) 1.3.5 and (for a local database) the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
bun install
cp apps/web/.env.example apps/web/.env.local   # fill in Supabase URL + publishable key
bun run dev                                     # http://localhost:3000
```

Local database (optional):

```bash
bun run db:start    # starts Supabase locally
bun run db:reset    # applies the migrations in supabase/migrations
```

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Start the dev server |
| `bun run build` | Production build |
| `bun run lint` | ESLint |
| `bun run type-check` | TypeScript check |

See [apps/web/README.md](apps/web/README.md) for more details.

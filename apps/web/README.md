# riskbase web

Next.js frontend for riskbase. Part of the riskbase monorepo (turborepo + bun workspaces).

## Requirements

- bun (this repo pins the version via `packageManager` in the root `package.json`, currently `bun@1.3.5`)
- Node not required directly, bun handles the runtime

## Setup

Run everything from the repo root, not from `apps/web`. The workspace deps are hoisted, so installing from inside `apps/web` will miss things.

```bash
cd ../..          # repo root
bun install
```

## Running the dev server

From the repo root:

```bash
bun run dev
```

This runs `turbo dev`, which picks up every app in `apps/*` that has a `dev` script. Right now that's just `@riskbase/web`. Turbo prints which packages are in scope when it starts, e.g.:

```
Packages in scope: @riskbase/web
```

Server comes up on http://localhost:3000. If something is already bound to 3000 (leftover process from a previous run, another terminal, etc.), Next will fall back to 3001 and Turbo will error out with "Another next dev server is already running" — it does not kill the old one for you. Check for a stray process first:

```bash
lsof -i :3000
kill <pid>
```

You can also run just this app without going through turbo, if you're only working on web and don't care about other workspace packages:

```bash
cd apps/web
bun run dev
```

## Other scripts

From `apps/web`:

```bash
bun run build        # next build
bun run start         # next start, after build
bun run lint          # eslint
bun run type-check    # tsc --noEmit, no output
bun run clean         # rm -rf .next
```

Same scripts work from the repo root prefixed with `turbo`, e.g. `bun run build` at the root builds every app.

## Notes

- Styled with Tailwind v4 + shadcn (base UI, not radix).
- If `turbo dev` fails immediately with "Missing devEngines.packageManager or legacy packageManager field", the root `package.json` is missing the `packageManager` field. It has to match whatever's in `bun.lock`.

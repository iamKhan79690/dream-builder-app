# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Dream Builder API (server/)

> Note: on disk this package is the `backend/` directory. Everywhere below, "server/" means `backend/`.

Backend for Dream Builder, a storytelling app for children aged 8–14.
I am a beginner at backend. After writing code, briefly explain what each new file does and why.

## Stack (do not change without asking)
- Node.js 24 + TypeScript, ES modules ("type": "module")
- Express 5 (NOT Fastify, NOT Express 4)
- PostgreSQL via PGlite (@electric-sql/pglite), database files in ./data
- Drizzle ORM + drizzle-kit (driver "pglite")
- Zod for all request validation
- Sessions in a database table + httpOnly cookie named "sid"
- Password hashing with Node's built-in crypto.scrypt (no bcrypt)
- pnpm with --ignore-workspace for every install

## Commands

```bash
pnpm install --ignore-workspace --lockfile-dir .
pnpm add <pkg> --ignore-workspace --lockfile-dir .
pnpm --ignore-workspace dev         # tsx watch src/index.ts
pnpm --ignore-workspace typecheck   # tsc --noEmit (no test runner or linter yet)
pnpm --ignore-workspace db:push     # drizzle-kit push: sync src/db/schema.ts into the PGlite db at DB_PATH
```

pnpm 12 gotchas (the parent folder has a `pnpm-workspace.yaml`):
- `pnpm run` auto-installs first. Without `--ignore-workspace`, it installs the **frontend's** packages into `backend/node_modules`.
- Without `--lockfile-dir .`, pnpm installs into a stray nested `backend/backend/node_modules`. Delete that folder if it shows up.
- Installs end with `ERR_PNPM_IGNORED_BUILDS` for esbuild, but packages are still installed and tsx/drizzle-kit work. Don't use `CI=true`, because it switches on frozen-lockfile and the install fails.

## Folder layout
src/index.ts          only starts the server
src/app.ts            builds the Express app, mounts routes under /api/v1
src/config.ts         reads .env
src/db/               client.ts (connection), schema.ts (tables)
src/routes/           one Router per area (auth, children, stories, jobs)
src/middleware/       validate, requireParent, errorHandler
src/services/         real logic; routes stay thin
src/jobs/             in-memory queue (will become BullMQ later)
src/lib/              small helpers (password, ids)
src/types/            express.d.ts, story.ts

## Rules
- All routes under /api/v1.
- Validate every request body with Zod via a shared validate middleware.
- Never trust the client for ownership: parentId always comes from req.user (the session), never from the body.
- Anything not owned by the caller returns 404 (not 403), so we don't reveal it exists.
- Check UUID params before querying; bad IDs return 404, not 500.
- Never return passwordHash or other secrets in responses.
- In handlers, send the response then `return;` (don't `return res.json(...)`).
- One errorHandler middleware, registered last; it logs the error and returns a generic 500.
- The StoryState shape must match src/state/AppState.tsx in the frontend (project root). Read it, don't guess.
- Do not touch files outside server/ unless I ask.
- Do not run git commands

## Frontend contract (from ../src/state/AppState.tsx)
- `StoryState`, `ChildProfile`, `ParentState` and `Order` set the API field names. Where the PRD and the frontend disagree, the frontend wins. Don't add PRD-only fields (`oneMoreAmazingThing`, `narratorMode`, `dedication`, `todayGoal`, `thirdChallengeText`). Flag any PRD rule that depends on them instead.
- Mode comes from the child's age: under 12 is `junior` (Explorer), 12 and over is `senior` (Creator). See `modeForAge`.
- The hero name falls back in this order: `charName`, then the hero type's `defaultName` (in `../src/data/content.ts`), then `"Sparky"`.
- `facesChallenge3`: `null` means not decided yet, and `false` means the child skipped the Challenge Gate.
- Story panels use AI-generated images. Pre-made art in `../src/assets/heroes/` isn't the only source.

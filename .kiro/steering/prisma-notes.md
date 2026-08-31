# Prisma Setup Notes — Anglework

Hard-won context from initial project setup. This Prisma version has behaved inconsistently with its own documentation and CLI output more than once — treat these as confirmed facts from direct testing in this project, not general assumptions about Prisma.

## Version — do not change
- Stay on **`prisma@7.10.0`** and **`@prisma/client@7.10.0`**. Do not run `npm i prisma@latest` or `@prisma/client@latest`.
- Every `prisma` command prints an "update available" banner pointing at `8.0.0-rc.12`. Ignore it — that's a pre-release, not a stable version.
- The `prisma` CLI and `@prisma/client` must stay on matching major versions. A mismatch (CLI on an 8.x RC while the client stayed on 7.x) previously caused `prisma init` to silently skip creating `prisma/schema.prisma` while still printing success messages.

## Config
- The config file is **`prisma.config.ts`** at the project root. (An early `prisma init` run printed its name as `prisma7.config.ts` in the summary output — that was a display bug; the actual file has always been `prisma.config.ts`.)
- `prisma/schema.prisma`'s `datasource` block must **not** contain a `url` property. The connection is configured through `prisma.config.ts` plus the driver adapter in code, not the schema file.

## Database connection — Neon
- Production database is Neon Postgres. App is deployed to Vercel serverless functions.
- Use **`@prisma/adapter-neon`** — not the generic `@prisma/adapter-pg`. It connects over WebSocket instead of raw TCP, which is what actually works reliably from serverless functions.
- Do not separately install `@neondatabase/serverless` or `ws` — `@prisma/adapter-neon` bundles both.
- Two connection strings are required: a **pooled** one (`DATABASE_URL`, used by the app via the adapter) and a **direct/unpooled** one (used by the Prisma CLI for schema operations).
- Use **`prisma db push`**, not `prisma migrate dev` — the Neon adapter doesn't support the shadow-database operations `migrate dev` depends on.

## Generated client
- Output path is `src/generated/prisma` (set via the `generator` block's `output` field in schema.prisma).
- Import `PrismaClient` from **`./generated/prisma/client`** specifically — not the bare `./generated/prisma` directory. This version doesn't generate an `index.ts` barrel file, so importing the directory itself fails to resolve.

## Housekeeping
- `.env` must stay in `.gitignore` — this repo is public (hackathon requirement) and `.env` holds real database credentials.
- Do not add a `postinstall: "prisma skills sync"` script to `package.json`. It regenerates `.claude/`, `.cursor/`, `.devin/`, `.windsurf/` skill folders on every install — this project intentionally doesn't use them.
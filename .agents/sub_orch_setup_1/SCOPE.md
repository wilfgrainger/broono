# Scope: Project Setup & Baseline

## Architecture
- **Root**: Next.js frontend with TailwindCSS, TypeScript, and Capacitor integration. Static HTML export configured.
- **Backend**: Cloudflare Worker backend powered by Hono. Uses Cloudflare D1 for SQL migrations and KV for caching.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | Root Frontend Setup | Create root `package.json`, `tsconfig.json`, `next.config.ts`, `wrangler.jsonc`, `.gitlab-ci.yml`, and basic hello-world frontend under `src/` that compiles. | None | IN_PROGRESS | d843399a-1888-4f07-b7b0-a714a7080385 |
| 2 | Backend Setup & DB migrations | Create `backend/package.json`, `backend/tsconfig.json`, `backend/wrangler.toml`, hello-world Hono endpoint, and D1 migrations for User, Pet, and Inventory schemas. | None | IN_PROGRESS | d843399a-1888-4f07-b7b0-a714a7080385 |
| 3 | Build & Verification | Build and verify both frontend (next build) and backend (wrangler deploy --dry-run or tsc compile) to ensure 100% clean builds. | M1, M2 | IN_PROGRESS | d843399a-1888-4f07-b7b0-a714a7080385 |

## Interface Contracts
- Refer to `PROJECT.md` for Frontend <-> Backend API contracts.

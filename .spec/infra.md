# Infrastructure

## Runtimes
- **Frontend**: Node (build time via Vite), Browser (runtime). Deployed on Cloudflare Pages.
- **Backend**: Cloudflare Workers (V8 Isolate).

## Environments
- **Local Dev**:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:8787` (Wrangler dev server)
- **Production**:
  - Canonical Domain: `broono.app`
  - Worker routes to backend APIs.

## Cloudflare D1
- SQLite dialect.
- Schema stored in `backend/schema.sql`.

## API Secrets & Variables (Wrangler)
- `DB`: D1 Database binding.
- `FRONTEND_URL`: string (CORS origin).
- `JWT_SECRET`: string.
- `RESEND_API_KEY`: string.
- `STRIPE_SECRET_KEY`: string.
- `STRIPE_WEBHOOK_SECRET`: string.
- `STRIPE_PRO_PRICE_ID`: string.

## PWA
- Configured via Vite PWA Plugin.
- Digital Asset Links at `public/.well-known/assetlinks.json`.

## Testing & Checks
- Vitest for Frontend component tests (`@testing-library/react`).
- `npx tsc --noEmit` and `pnpm lint` required before commit.
- Strict Typescript: No `@typescript-eslint/no-explicit-any` or `@typescript-eslint/no-unused-vars`.
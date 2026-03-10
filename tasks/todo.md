# Drift Register & Todo

## Audit Findings & Divergence
1. **API Root Response Drift**: The root endpoint `/` returns plain text (`app.get('/', (c) => c.text('Broono API Gateway - Active'))`) instead of JSON, violating the memory requirement ("The backend API root endpoint (`/`) must return a JSON response").
2. **Missing Test Script**: `backend/package.json` does not have a `test` script. Monorepo guidelines require `pnpm test` in execution plans. The root `package.json` lacks a `test` script too.

## Remediation Plan

- [ ] Repair API Root Endpoint
  - Update `backend/src/index.ts` to return JSON on `/` (e.g., `c.json({ status: 'active', message: 'Broono API Gateway - Active' })`).
- [ ] Add Test Scripts
  - Add `test` script to root `package.json` (`"test": "vitest run"` or simply echo if no tests yet, but frontend has vitest).
  - Add `test` script to `backend/package.json` (`"test": "tsc --noEmit"` as per memory "The backend `package.json` does not contain a `test` script. Utilize compiler checks...").
- [ ] Run Tests & Linting
  - Verify changes with `pnpm lint` and `pnpm test`.
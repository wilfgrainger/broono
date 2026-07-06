# Handoff Report - Playwright E2E Test Suite Strategy & Setup

## 1. Observation
We examined the repository and observed the following:
* **Root Configuration**: `package.json` contains dependencies for Next.js 15.1.0, React 19.2.4, Capacitor 8.2.0, and Vite 7.3.1.
* **Frontend Codebase**: `src/app/page.tsx` contains a simple placeholder page displaying "Hello World from Broono!" (lines 1-11). There are no existing test folders or configs.
* **Backend Codebase**: `backend/src/index.ts` contains a basic Hono server with a single `/api/hello` GET route (lines 1-15).
* **Interface Contracts**: `.agents/orchestrator/PROJECT.md` specifies the API contract for `/api/pet/sync` and `/api/leaderboard` (lines 24-78).
* **User Requirements**: `ORIGINAL_REQUEST.md` (lines 23-27) mandates a Playwright test suite verifying:
  - Local game loop offline idle calculations.
  - Vitals degradation sync.
  - Shop coin boundary check (blocked under 1000 coins).

## 2. Logic Chain
1. Based on the placeholder status of `src/app/page.tsx` and `backend/src/index.ts`, the E2E test suite cannot run against live code immediately.
2. Testing local game loop time calculations (Feature 1) requires deterministic clock manipulation. Playwright's `page.clock` provides this control if the frontend calculates decay based on the standard `Date` API.
3. Testing server-side anti-cheat logic (Feature 2) requires a backend that can calculate authoritative decay and verify client inputs.
4. Testing shop progression (Feature 3) requires seeding user coins at specific boundaries (e.g. 999 vs 1000). To avoid external dependencies (e.g. Supabase, KV, D1), the test suite requires a mocked backend with `__control` endpoints to allow dynamic state seeding.
5. Normalizing Apple, Google, and Facebook auth (Feature 5) requires mocking JWT decoding on the backend and injecting mocked session tokens in tests.
6. Gathering these elements, we designed a catalog of 60 test cases covering Tiers 1-4 and proposed a Next.js/Hono mock setup in `analysis.md`.

## 3. Caveats
* **Capacitor Integration**: Playwright tests will run against the Next.js web application server and do not cover native Capacitor shell logic directly (e.g., native push notifications or native OAuth overlays).
* **Mock Realism**: The mock backend will simulate the D1 and KV layer in-memory. Drift between mock DB behavior and actual Cloudflare D1/KV SQL execution must be verified during integration.

## 4. Conclusion
A robust Playwright test suite can be established by running a mock backend API written in Hono concurrently with the Next.js frontend, using `page.clock` for time manipulation, and using data attributes for selector reliability. The detailed strategy and 60 test cases have been written to `analysis.md`.

## 5. Verification Method
1. Inspect the detailed E2E strategy and the 60 test cases cataloged in:
   `c:\Users\wilf6\dev\broono\.agents\teamwork_preview_explorer_infra_2\analysis.md`
2. Validate that all requirements from `ORIGINAL_REQUEST.md` are covered under the Tier 1 Feature Coverage and Tier 2 Boundary test cases.
3. Invalidation conditions: If the frontend uses non-standard Web APIs for tracking time (such as native background synchronization workers) that cannot be controlled via Playwright's `page.clock`, the time manipulation strategy must be adjusted.

---

## Remaining Work
1. **Playwright Installation**: Initialize playwright in the project root (`pnpm dlx playwright install` or adding `@playwright/test` to devDependencies).
2. **Mock Server Implementation**: Create a mock server at `tests/mock-backend/server.ts` implementing Hono endpoints and the state-seeding `__control` routes.
3. **Writing Test Cases**: Translate the 60 test cases designed in `analysis.md` into Playwright `.spec.ts` files under `tests/`.
4. **Wrangler integration**: Setup tests to run locally with `wrangler dev` in the integration phase.

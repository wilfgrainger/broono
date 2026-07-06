## 2026-07-04T16:43:07Z
You are the Setup Worker. Your working directory is c:\Users\wilf6\dev\broono\.agents\worker_setup_1.
Your task is to write the baseline configurations, source code, and migration files for the broono.app project.

Specifically, write the following files with correct, robust configurations:

1. Root Files:
   - `package.json`: Contains scripts for dev, build, start, lint. Dependencies include React 19 (`react` and `react-dom` version `19.2.4`), Next.js (`next` version `^15.1.0`), Capacitor (`@capacitor/core` version `8.2.0`, `@capacitor/cli` version `8.2.0`), react-router-dom `7.13.1`, zustand `5.0.11`, lucide-react `0.576.0`, clsx, date-fns. DevDependencies include typescript `5.9.3`, eslint `9.39.3`, vite `7.3.1`, vite-plugin-pwa `1.2.0`, wrangler `4.70.0`, and appropriate types.
   - `tsconfig.json`: Standard TypeScript configuration for Next.js App Router.
   - `next.config.ts`: NextConfig exporting static HTML build (`output: 'export'`).
   - `vite.config.ts`: React Vite config (for testing/utility options).
   - `wrangler.toml`: Set up configuration for pages with `pages_build_output_dir = "out"` and binding to backend service `broono-api`.
   - `.gitlab-ci.yml`: Standard GitLab CI configuration that builds frontend static site (Pages stage) using pnpm.
   - `pnpm-workspace.yaml`: Defining packages `.` and `backend`.
   - `src/app/page.tsx`: Basic hello-world page.
   - `src/app/layout.tsx`: Basic HTML layout with metadata.
   - `src/app/globals.css`: Minimal styles.

2. Backend Files (in `backend/`):
   - `backend/package.json`: Hono setup with dependencies `hono` `4.12.5`, `jose` `5.10.0`. DevDependencies: `wrangler` `4.70.0`, `@cloudflare/workers-types` `4.20260301.1`, `typescript` `5.9.3`.
   - `backend/tsconfig.json`: Cloudflare Worker tsconfig.
   - `backend/wrangler.toml`: Name `broono-api`, main `src/index.ts`, compatibility date `2024-04-03`, KV bindings (`PET_STATE_CACHE`), D1 database bindings (`DB`, database name `broono-db`, migrations dir `migrations`).
   - `backend/src/index.ts`: Basic hello-world API endpoint GET `/api/hello` returning JSON.
   - `backend/migrations/0001_initial.sql`: Schema definitions for User, Pet, and Inventory tables.

3. Build and Verification:
   - Run `pnpm install` in the root workspace.
   - Run the frontend build command (`pnpm build`) and verify it compiles cleanly without errors.
   - Run the backend compilation (`pnpm --filter backend build` or running `tsc` inside backend folder) to ensure it compiles cleanly.

Report your actions, the contents of the files created, and the build results in a handoff report at: `c:\Users\wilf6\dev\broono\.agents\worker_setup_1\handoff.md`.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.

## 2026-07-04T16:46:11Z
You are teamwork_preview_worker. Your working directory is c:\Users\wilf6\dev\broono\.agents\worker_setup_1.
Your task is to implement a comprehensive Playwright E2E test suite for broono.app.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Follow these instructions to complete the task:
1. Update `package.json` to add required dependencies: `@playwright/test`, `hono`, `@hono/node-server`, `concurrently`, and `sirv-cli` (or use existing packages if applicable). Run the install command.
2. Build a local mock Cloudflare Worker backend using Hono in `tests/mock-backend.ts` running on port 3001. It must support:
   - `/api/pet/sync` (POST) to authenticate via JWT, validate client time delta, apply vital decay anti-cheat rules, and save state in-memory.
   - `/api/leaderboard` (GET) to retrieve sorted users for Global, Country, and Friends tiers.
   - Control endpoints: `/__control/seed` and `/__control/reset` to seed/reset the test state.
3. Enhance the Next.js frontend placeholder in `src/app/page.tsx` (and other files if needed) to be a fully interactive client containing:
   - A local game loop calculating vitals decay (Hunger, Hydration, Temperature, Happiness) based on offline time-deltas (`Date.now() - last_sync_time`).
   - A Pet View showing vitals and actions (Feed, Water, Play).
   - A Shop component that is locked (with a `data-testid="shop-locked-overlay"`) below 1,000 coins, and unlocks above 1,000 coins.
   - A Leaderboard UI displaying Global, Country, and Friends & Family lists fetched from the mock backend.
   - JWT Auth support (saving session tokens, handling Apple proxy email mapping like `*@privaterelay.appleid.com`, and redirecting on 401).
   - Expose `data-testid` elements on all UI components to support Playwright selectors.
4. Set up `playwright.config.ts` targeting `http://localhost:3000`. Include scripts in `package.json` to run the frontend build, mock server, and tests concurrently.
5. Implement exactly 60 test cases across 4 tiers:
   - Tier 1: Feature Coverage (25 tests)
   - Tier 2: Boundary & Corner Cases (25 tests)
   - Tier 3: Cross-Feature Combinations (5 tests)
   - Tier 4: Real-World Scenarios (5 tests)
   Make sure all tests execute, manipulate clocks/local storage for offline calculations, and pass 100% of the time.
6. Verify your implementation by running the E2E tests, checking outputs, and ensuring no errors or warnings are shown.
7. Write `TEST_INFRA.md` and `TEST_READY.md` in the project root.
8. Write a handoff report in your agent directory explaining the setup and verification command, and send a message back.

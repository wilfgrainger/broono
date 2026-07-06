# Orchestration Plan - broono.app

## Objective
Build the beta version of broono.app (a Tamagotchi-style mobile pet simulation game) featuring a Next.js (Static Export) frontend and a serverless Cloudflare Workers backend.

## Execution Tracks
The project follows the Dual-Track Project Pattern:
1. **E2E Testing Track**: Parallel track designing and implementing Playwright tests based on user requirements.
2. **Implementation Track**: Track responsible for setting up configurations, building frontend/backend features, integrating auth/databases, and passing the tests.

## Planned Milestones

### Milestone 1: E2E Testing Track Setup
- **Scope**: Create Playwright test suite (Tiers 1-4 tests) covering:
  - Local game loop offline idle time calculations.
  - Vitals degradation sync with mocked backend.
  - Shop access check (blocked under 1000 coins).
- **Output**: `TEST_INFRA.md` and eventually `TEST_READY.md` containing test running instructions and coverage checks.

### Milestone 2: Project Setup & Baseline (Implementation)
- **Scope**: Re-create project structure, baseline configs, and database schemas:
  - Frontend: `package.json`, `tsconfig.json`, `next.config.ts` or `vite.config.ts`, Tailwind CSS, and basic project routing.
  - Backend: `backend/package.json`, `backend/tsconfig.json`, Hono router, `wrangler.jsonc` (or `wrangler.toml`), and D1 database migrations.
  - Capacitor settings.
- **Output**: A compiled baseline for both frontend and backend.

### Milestone 3: Frontend UI & Vital Decay Loop
- **Scope**: Implement frontend UI and local game loop:
  - Pet View (hatching egg, vitals HUD: Hunger, Hydration, Temperature, Happiness).
  - Offline vital decay loop based on time-deltas.
  - Coin earnings and shop unlock mechanism (locked at <1000 coins).
  - Leaderboard UI with global/country/friends tabs.
- **Output**: Working frontend UI.

### Milestone 4: Backend API & State Validation
- **Scope**: Implement Worker API:
  - API endpoints `/api/pet/sync` and `/api/leaderboard`.
  - Server-side validation of client time delta and vital decay calculations.
  - Supabase JWT validation.
  - State caching in Cloudflare KV and persistence in Cloudflare D1.
- **Output**: Working backend API integrated with KV and D1.

### Milestone 5: E2E Integration & Verification (Phase 1 & 2)
- **Scope**: Integrate, test, and harden the app:
  - Run Playwright E2E tests against the real backend and frontend.
  - Fix any failures and ensure 100% test coverage for Tiers 1-4.
  - Perform Tier 5 Adversarial Coverage Hardening (Challenger scans source, generates adversarial cases, Worker fixes exposed issues).
- **Output**: 100% passing tests and audit clearance.

## Coordination & Flow
- Spawn **E2E Testing Track Orchestrator** to run Milestone 1.
- Spawn **Setup Sub-orchestrator** to run Milestone 2.
- Upon M2 completion, spawn sub-orchestrators for M3 and M4.
- Once M1, M3, and M4 are complete, spawn **E2E Integration Sub-orchestrator** for Milestone 5.
- Finally, trigger Victory Audit and report to Sentinel.

# Handoff Report — Playwright E2E Test Suite Strategy & Design

## 1. Observation
I observed the following files and details in the workspace:
- **`ORIGINAL_REQUEST.md`**: Outlines the core requirements, including E2E tests for simulating offline idle time decay, state sync validation, and shop coin threshold checks (locked under 1,000 coins).
- **`requirements.md`**: Confirms gameplay mechanics, nurture loop, vitals (Hunger, Hydration, Temperature, Happiness), and leaderboard tiers (Global, Country, Friends & Family).
- **`technical-steering.md`**: Specifes Next.js static export with Capacitor, Cloudflare Workers API using Hono, and Supabase Auth normalization for OAuth logins (extracting email as primary key, accommodating Apple's hide-my-email relays).
- **`.agents/orchestrator/PROJECT.md`**: Defines interface contracts, specifically:
  - `POST /api/pet/sync` receiving `pet_id`, `vitals` object, `coins`, `last_sync_time`, `client_time`, and responding with status and verified state.
  - `GET /api/leaderboard` with parameters `tier` (`global`, `country`, `friends`) and `country_code`, returning sorted player array.
- **`package.json`**: Standard dependencies (`react`, `react-dom`, `next`, `@capacitor/core`, `react-router-dom`, `zustand`, `lucide-react`) and devDependencies, missing `@playwright/test` and related scripts.
- **`backend/package.json`**: Backend dependencies (`hono`, `jose`, `wrangler`, `@cloudflare/workers-types`).
- **`backend/migrations/0001_initial.sql`**: Database structure consisting of `User`, `Pet`, and `Inventory` tables, and index definitions.

---

## 2. Logic Chain
1. *Requirements Analysis*: The product rules require testing offline decay loops, sync logic, authentication normalization, coin thresholds, and leaderboard tiers.
2. *Infrastructure Design*: To write stable, fast E2E tests:
   - Next.js must compile statically (`output: 'export'`), allowing the static server (`sirv-cli`) to serve it.
   - We must redirect requests to a local Hono mock server during testing via environment injection (`NEXT_PUBLIC_API_URL`).
   - The mock backend must support seeding and resetting states (via test-only paths `/__test/...`) to ensure unit-like isolation for each E2E test.
   - Playwright's Clock API is the only reliable way to test offline vital decay without real-time delays.
3. *Test Matrix Formulation*: Designing a comprehensive set of 60 test cases ensures:
   - Coverage for all major features (25 tests).
   - Validation of negative time-deltas, overflows, and SQL injection security boundaries (25 tests).
   - State transition and dependency chains (5 cross-feature tests).
   - Real-world user flows (5 scenario tests).
4. *Conclusion*: By implementing the proposed mock backend endpoints and Playwright clock overrides, the implementer can establish a deterministic verification harness for all 60 tests.

---

## 3. Caveats
- **Playwright Installation**: Playwright is not yet present in `package.json` devDependencies. The implementation phase must install `@playwright/test` and set up the browser binaries.
- **Supabase Integration**: The JWT authentication logic assumes Supabase client handling. The mock backend must provide valid mock JWT signatures matching what the Hono worker expects in production.

---

## 4. Conclusion
We have completed the E2E testing strategy and planning phase:
- Defined a detailed E2E setup using Playwright, a Hono mock server, and client-side clock manipulation.
- Created 60 individual, structured test cases spanning Tiers 1-4 across the 5 main features.
- Structured frontend routing configurations and auth bypass rules.
- Drafted package scripts to orchestrate compilation, mock startup, test execution, and teardown.

All details are recorded in `c:\Users\wilf6\dev\broono\.agents\teamwork_preview_explorer_infra_3\analysis.md`.

---

## 5. Verification Method
To verify the correctness of the planning files:
1. Inspect `c:\Users\wilf6\dev\broono\.agents\teamwork_preview_explorer_infra_3\analysis.md` to confirm the presence of:
   - Playwright E2E strategy and time manipulation details.
   - Exact list of 60 test cases grouped into 4 Tiers.
   - Frontend static build structure guidelines.
   - Mock API endpoint layout and command configs.
2. Verify that no source code files (`.ts`, `.tsx`, `.js`, etc.) were modified or created inside `/src` or `/backend`.

# Synthesis of E2E Testing Strategy

## Summary of Inputs
- **Explorer 1**: Proposed browser-level interception (`page.route`) and local Wrangler dev server for Capacitor. Emphasized `page.clock` and localStorage state injection.
- **Explorer 2**: Proposed Node-Hono mock server on port 8788/8787 and `/__control` endpoints for seeding state. Provided catalog of 60 tests.
- **Explorer 3**: Proposed serving static build on port 3000 using `sirv-cli` and Node-Hono mock server on port 8787. Detail-oriented mapping of 60 test cases.

## Consensus & Architecture Decision
1. **Frontend App**: Use Next.js (`output: "export"`). Since the frontend codebase is currently a placeholder, the Worker will build a basic interactive mock page in `src/app/page.tsx` (and/or layout) that simulates the pet UI, the shop, the leaderboards, offline time jump settings, and authentication forms. This allows the Playwright test suite to perform genuine, interactive opaque-box testing without writing a complex client-side engine.
2. **Mock Backend API**: Spin up a Node.js process running Hono on port `3001` (or `8788`). It will mock all core API endpoints `/api/pet/sync` and `/api/leaderboard`, validate signatures, detect cheating, and offer special control routes `/__control/seed` and `/__control/reset` for test isolation.
3. **Time Manipulation**: Use Playwright's `page.clock` API to fast-forward time, combined with storing the `last_sync_time` in localStorage to verify vital decay.
4. **Test Suite Execution**: Use `concurrently` to launch:
   - Next.js development server (or `sirv` of static build) on `http://localhost:3000`
   - Node-Hono mock server on `http://localhost:3001`
   - Playwright test runner (`npx playwright test`)
5. **Test Case Catalog**: Exactly 60 tests covering 5 features across 4 tiers:
   - **Feature 1**: Offline Idle Time & Vital Decay
   - **Feature 2**: State Sync & API Validation (POST `/api/pet/sync`)
   - **Feature 3**: Shop & Coins Progression (access control < 1000 coins)
   - **Feature 4**: Leaderboard Display & Tiers (Global, Country, Friends & Family)
   - **Feature 5**: JWT Authorization & Auth Normalization (Apple Proxy Email)

## Next Steps
Spawn a **Worker** (`teamwork_preview_worker`) with this synthesis, instructing them to:
1. Update `package.json` to add required dependencies (`@playwright/test`, `hono`, `@hono/node-server`, `concurrently`).
2. Write the interactive placeholder frontend in `src/app/page.tsx` that supports the test assertions.
3. Write the Node-Hono mock server in `tests/mock-backend.ts`.
4. Write the Playwright configuration in `playwright.config.ts`.
5. Write the 60 test cases in `tests/e2e.spec.ts`.
6. Run the tests to verify 100% pass rate.
7. Generate `TEST_INFRA.md` and `TEST_READY.md`.

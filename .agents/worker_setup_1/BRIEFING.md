# BRIEFING — 2026-07-04T16:46:11Z

## Mission
Implement a comprehensive Playwright E2E test suite for broono.app.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\wilf6\dev\broono\.agents\worker_setup_1
- Original parent: bbd65bd1-9a1f-43c8-a3f3-dd4632538f0c
- Milestone: playwright_testing

## 🔒 Key Constraints
- Cloudflare Workers serverless backend (using Workers / Hono).
- GitLab Pages static frontend using React 19, Next 15, and static HTML output.
- SQLite D1 for database, KV for cache.
- CORS configuration, strict input validation, secret environment variables.
- Free-tier boundary management.
- pnpm monorepo layout (root and backend).
- No external HTTP request tools, code search only.

## Current Parent
- Conversation ID: bbd65bd1-9a1f-43c8-a3f3-dd4632538f0c
- Updated: 2026-07-04T16:46:11Z

## Task Summary
- **What to build**: Update package.json to include dependencies; build mock backend in tests/mock-backend.ts; enhance src/app/page.tsx with interactive client gameplay and leaderboard/auth UI; configure playwright.config.ts; implement exactly 60 Playwright E2E tests (25 Tier 1, 25 Tier 2, 5 Tier 3, 5 Tier 4); verify with test run. Write TEST_INFRA.md and TEST_READY.md.
- **Success criteria**: All 60 test cases pass; no errors/warnings; interactive client works perfectly with vitals, auth, shop, and leaderboard; local mock server works perfectly.
- **Interface contracts**: Endpoints /api/pet/sync (POST), /api/leaderboard (GET), /__control/seed, /__control/reset. Vitals decay formula: date diff * decay rate. Apple private relay mapping. Shop locks below 1000 coins.
- **Code layout**: Page at src/app/page.tsx, mock backend at tests/mock-backend.ts, config at playwright.config.ts, tests in tests/e2e/.

## Change Tracker
- **Files modified**: None
- **Build status**: Untested
- **Pending issues**: None

## Quality Status
- **Build/test result**: Untested
- **Lint status**: Untested
- **Tests added/modified**: None

## Loaded Skills
- None

## Key Decisions Made
- Use Hono with @hono/node-server for mock-backend running on 3001.
- Write a clean Next.js Page components with zustand or useState for pet game loop state.
- Seed data on mock backend before each test to guarantee determinism.

## Artifact Index
- c:\Users\wilf6\dev\broono\.agents\worker_setup_1\handoff.md — Handoff report and verification results.

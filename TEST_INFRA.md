# Test Infrastructure

This document outlines the Playwright E2E test infrastructure created for `broono.app`.

## Architecture

The test suite runs E2E against a locally served production build of the Next.js frontend and a mock backend server that reproduces all key Cloudflare Workers interfaces, authentication states, and validation rules.

1. **Frontend Server**:
   - Compiles static HTML output using `pnpm build`.
   - Served on `http://localhost:3000` via `sirv-cli` (using `sirv out -p 3000 --single`).

2. **Mock Backend**:
   - Implemented using Hono and running on Node (via `@hono/node-server`) on `http://localhost:3001`.
   - Emulates key serverless routes:
     - `POST /api/pet/sync`: Verifies JWT tokens, simulates in-game vitals decay, runs anti-cheat algorithms to block unauthorized stat injection, and saves game state in-memory.
     - `GET /api/leaderboard`: Renders rankings filtered by Global, Country, and Friends tiers.
     - Control endpoints (`POST /__control/seed`, `POST /__control/reset`) to control database state.

3. **E2E Testing Tooling**:
   - Playwright E2E framework executes 60 test cases across Feature Coverage, Boundary/Corner cases, Cross-Feature Combinations, and Real-World Scenarios.
   - Sequential worker execution (`workers: 1`) prevents database state contamination.

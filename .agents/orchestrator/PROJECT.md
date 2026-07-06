# Project: broono.app

## Architecture
A mobile-first, Tamagotchi-style pet simulation game.
- **Frontend**: Next.js Static Export, optimized for GitLab Pages. Compiled and copied via Capacitor to mobile wrappers.
- **Backend**: Cloudflare Workers serverless API (using Hono framework), backed by Cloudflare D1 (relational leaderboard/user data) and Cloudflare KV (pet state cache).
- **Authentication**: Supabase Auth (JWT) email-based keys, normalized to Google/Facebook/Apple logins.
- **AI Chatbot**: DeepSeek V4 flash/pro via NVIDIA NIM API.

## Code Layout
- `src/`: Next.js frontend code.
- `backend/`: Cloudflare Worker backend code.
- `android/`: Capacitor Android project structure.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | E2E Testing Track | Playwright test runner, Tier 1-4 tests covering all user requirements, mock worker. | None | IN_PROGRESS | bbd65bd1-9a1f-43c8-a3f3-dd4632538f0c |
| 2 | Project Setup & Baseline | Set up package.json, vite.config.ts / next.config.js, wrangler.toml, DB schemas. | None | IN_PROGRESS | 1fb39607-c654-4c0c-8223-c844dc586449 |
| 3 | Frontend UI & Game Loop | Local game loop, vital decay, Pet View, Shop UI, Leaderboard UI. | M2 | PLANNED | TBD |
| 4 | Backend API & State Validation | Hono API, state validation, KV state cache & D1 integration, JWT auth. | M2 | PLANNED | TBD |
| 5 | E2E Integration & Verification | Run E2E tests, fix bugs, pass Tiers 1-4, execute Tier 5 Adversarial Hardening. | M1, M3, M4 | PLANNED | TBD |

## Interface Contracts
### Frontend ↔ Cloudflare Worker API
#### Authentication
- Header: `Authorization: Bearer <JWT_TOKEN>` (Supabase Auth email-based JWT)

#### Synchronize Pet State
- **URL**: `/api/pet/sync`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "pet_id": "string",
    "vitals": {
      "hunger": 95.0,
      "hydration": 90.0,
      "temperature": 37.0,
      "happiness": 85.0
    },
    "coins": 1200,
    "last_sync_time": 1783382900,
    "client_time": 1783383000
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "vitals": {
      "hunger": 95.0,
      "hydration": 90.0,
      "temperature": 37.0,
      "happiness": 85.0
    },
    "coins": 1200,
    "last_sync_time": 1783383000
  }
  ```

#### Leaderboards
- **URL**: `/api/leaderboard`
- **Method**: `GET`
- **Query Parameters**:
  - `tier`: `global` | `country` | `friends`
  - `country_code`: `string` (required if tier is `country`)
- **Response**:
  ```json
  {
    "tier": "global",
    "leaderboard": [
      { "rank": 1, "username": "alice", "coins": 5000, "country": "US" },
      { "rank": 2, "username": "bob", "coins": 4500, "country": "CA" }
    ]
  }
  ```

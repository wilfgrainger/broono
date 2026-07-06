# Scope: E2E Testing Track

## Architecture
- **E2E Test Runner**: Playwright framework configuration, running locally against a test web server and mocked Cloudflare Worker backend.
- **Frontend App**: Next.js static build (or a compatible static HTML structure serving as a placeholder/mock).
- **Backend Service**: Mocked REST API endpoints for Cloudflare Worker (`/api/pet/sync`, `/api/leaderboard`, etc.) that validate request headers, schemas, and timestamps.
- **Test Categories**: 4-Tier test suite based on Category-Partition, Boundary Value Analysis, Pairwise, and Workload Testing.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | Test Infra Setup | Playwright config, mock Worker server, and static app layout / structure | None | DONE | 9f993711-7b5f-4125-b3c6-b4d7476a451a, 81cc8256-b4b9-4b2c-8146-fcd8d3b4d5e3, 70ce689e-41d9-4bf4-8aca-c25e2ad1e24b |
| 2 | Tier 1 Feature Tests | 25 tests covering 5 features in normal happy paths | M1 | IN_PROGRESS | 263cec6b-cb99-4989-a95c-a2a8994488d1 |
| 3 | Tier 2 Edge & Boundary Tests | 25 tests covering limit boundaries, empty inputs, token errors | M1 | IN_PROGRESS | 263cec6b-cb99-4989-a95c-a2a8994488d1 |
| 4 | Tier 3 & 4 Tests | 5 cross-feature and 5 real-world scenario tests (10 total) | M2, M3 | IN_PROGRESS | 263cec6b-cb99-4989-a95c-a2a8994488d1 |
| 5 | Documentation & Readiness | Run verification, generate TEST_INFRA.md and TEST_READY.md | M4 | IN_PROGRESS | 263cec6b-cb99-4989-a95c-a2a8994488d1 |

## Interface Contracts
- **Web App URL**: `http://localhost:3000` (Playwright base URL)
- **API URL**: `http://localhost:3001` (Mocked backend API base)
- **State Sync Endpoint**: `POST /api/pet/sync` (requires JWT token, returns updated state)
- **Leaderboard Endpoint**: `GET /api/leaderboard?tier=<tier>&country_code=<country>` (returns ranked players)

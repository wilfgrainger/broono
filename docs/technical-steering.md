# broono.app Technical Steering

## Architecture North Star
Broono should be engineered as a **mobile-only Capacitor game** backed by a **Cloudflare free-tier-compatible service layer**. The technical plan must protect the product vision: a cozy Tamagotchi-style care loop, Android/iOS parity, Google/Apple auth parity, and mocked payments until app-store IAP credentials and products are ready.

## Target Runtime and Delivery
- **Client:** React-based game client optimized for phone portrait layouts and embedded in Capacitor.
- **Mobile shells:** Capacitor Android and Capacitor iOS are production distribution targets.
- **Static hosting:** The web bundle must remain deployable to Cloudflare Pages. GitHub Pages may be acceptable for development/demo hosting, but not as a reason to treat desktop web as a primary platform.
- **API layer:** Cloudflare Workers provide REST APIs for game state, auth/session exchange, leaderboard reads/writes, and payment entitlement mocks.
- **Data layer:** Use D1 for relational/persistent game records where appropriate and KV for low-latency cached/config/session-adjacent state where appropriate.
- **Cost constraint:** Default choices must stay within Cloudflare free-tier assumptions until product scale proves otherwise.

## Mobile-Only Engineering Principles
- Build and test UI primarily at phone viewport sizes.
- Treat desktop layouts as unsupported or internal-only unless explicitly approved.
- Prefer touch-first controls, resilient offline/retry behavior, and short-session performance.
- Keep app startup lightweight; daily check-in should feel immediate.
- Avoid browser APIs or desktop assumptions that do not work inside Capacitor Android/iOS.

## Capacitor Requirements
- Maintain Android and iOS build paths as first-class citizens.
- Any native capability must be evaluated for both platforms before adoption.
- Platform conditionals are acceptable only when needed for store policy, native APIs, or OS behavior; gameplay and feature parity should remain aligned.
- Store-facing features such as auth, purchases, and restore flows must be implemented in ways compatible with Google Play and Apple App Store review.

## Cloudflare Free-Tier Backend Steering
Design backend features so they can run on:
- **Cloudflare Pages** for static client hosting.
- **Cloudflare Workers** for REST endpoints.
- **Cloudflare D1** for durable relational records such as users, pets, inventory, currencies, mini-game results, destinations, and leaderboard submissions.
- **Cloudflare KV** for cacheable configuration, feature flags, public leaderboard snapshots, and non-critical lookup data.

Avoid introducing required services such as always-on servers, managed containers, expensive queues, or paid databases unless a future architecture review explicitly approves them.

## API Design Direction
Workers should expose small, versionable REST endpoints. Expected domains include:
- Session/auth bootstrap.
- Player profile and pet state sync.
- Care actions and stat decay calculation.
- Inventory, cosmetics, utilities, and destination unlocks.
- Mini-game result submission and coin rewards.
- Leaderboard queries and submissions.
- Mock purchase catalog, entitlement grant, and restore simulation.

APIs should be deterministic, testable, and safe to call from a mobile client with intermittent connectivity. Server-side validation is required for currency, inventory, leaderboard, and entitlement updates.

## Game State and Sync
- Keep authoritative progression state server-side once a user is authenticated.
- Support anonymous/local onboarding where needed, then merge or bind state after mocked or real auth.
- Model care stat decay using timestamps so the app does not require background timers.
- Make conflict handling explicit for multi-device or reinstall scenarios.
- Do not trust client-submitted currency, inventory, or leaderboard totals without validation.

## Authentication Steering
- Google and Apple auth must remain equal in prominence, placement, and product support.
- If Google sign-in appears anywhere in the UI, Apple sign-in must appear alongside it with comparable treatment.
- Development and staging may use mocked Google/Apple identity providers until production OAuth credentials are provisioned.
- Mock users must be clearly distinguishable in data and logs.
- Production auth work should be isolated behind provider interfaces so replacing mocks with real OAuth does not rewrite gameplay code.

## Payments and Entitlements Steering
- Payments are **mocked only** until Google Play Billing and Apple StoreKit/IAP credentials and product definitions exist.
- No code path should require a real purchase for MVP progression.
- Mock purchase APIs should exercise entitlement grant, inventory unlock, error states, and restore-purchase UX.
- Keep entitlement storage platform-aware so future Google Play and Apple receipt validation can be added without changing product concepts.
- Do not add non-store payment providers for digital goods inside the mobile apps.

## Data Model Direction
Initial durable entities should include:
- User/account identity, including auth provider type and mock/production marker.
- Player profile, locale/country, created date, and settings.
- Pet, egg, hatch result, animal name, lifecycle status, and care stats.
- Currency ledger or validated coin balance changes.
- Inventory, cosmetics, utility upgrades, and destination unlocks.
- Mini-game attempts, rewards, and anti-abuse metadata.
- Leaderboard scores by global, country, and friends/family scopes.
- Mock purchase catalog entries and entitlement records.

Prefer migrations and schemas that can evolve safely without deleting player progress.

## Security, Privacy, and Safety
- Validate all economy and leaderboard mutations on the Worker.
- Store only data needed for gameplay and account recovery.
- Treat family/friends features as privacy-sensitive.
- Avoid exposing precise personal data in leaderboards; country-level display should be coarse and user-controlled where possible.
- Keep secrets out of the client bundle and repository.
- Plan for child/family-friendly content expectations even before formal compliance work begins.

## Observability and Operations
- Log enough request, error, and mock-provider context to debug mobile issues without collecting unnecessary personal data.
- Feature flags should be possible through Cloudflare-friendly configuration.
- Production incidents should be diagnosable from Workers/Cloudflare logs and client build metadata.
- Build artifacts should identify app version, platform, and environment.

## Testing Expectations
- Unit test care stat decay, economy validation, mini-game reward calculation, entitlement grants, and leaderboard scoring.
- Add integration tests around Worker API routes as they appear.
- Exercise mocked Google and Apple auth paths equally.
- Exercise mocked purchase success, cancellation, failure, and restore scenarios.
- Run mobile viewport checks for significant UI changes; use device builds or emulators before store releases.

## Explicit Technical Guardrails
- Do not make desktop web the primary product target.
- Do not require paid infrastructure for the baseline architecture.
- Do not ship Google auth without Apple auth parity.
- Do not enable real-money purchases until store IAP credentials/products and receipt-validation plans are ready.
- Do not bypass Google Play Billing or Apple IAP for in-app digital goods.
- Do not couple gameplay code directly to mocked providers; mocks must be replaceable.

# Playwright E2E Test Planning & Infrastructure Analysis
**Project**: broono.app (Next.js + Cloudflare Workers)
**Prepared by**: teamwork_preview_explorer_infra_1

---

## 1. Executive Summary
This analysis details the test planning, architecture, and configuration for a Playwright End-to-End (E2E) test suite targeting the **broono.app** Tamagotchi-style mobile pet simulation. The proposed infrastructure uses **Playwright** as the test runner, leveraging its native request interception (`page.route`) and clock control (`page.clock`) capabilities to mock the Cloudflare Worker backend and control offline time simulation without spinning up secondary mock server processes. Alternatively, we specify a local Mock Wrangler configuration for Capacitor-native testing. The suite covers 5 core gameplay features with exactly 60 test cases structured across 4 distinct testing tiers.

---

## 2. E2E Test Suite Strategy & Design

### A. Environment Configuration & Launch Architecture
The testing suite will run in a Node.js-based environment orchestrated by `pnpm`.
1. **Frontend Server**: The Next.js frontend will be built (`next build && next start` or via a lightweight static host like `serve` since it is a Static Export) to run on `http://localhost:3000`.
2. **Mocking Strategy**:
   - **Unit E2E (Browser-based)**: Playwright's `page.route()` intercepts all calls to `/api/*` and Supabase Auth (`https://*.supabase.co/*`). This keeps tests fast, isolated, and parallelizable.
   - **Integrative E2E (Device/Emulator-based)**: A mock Wrangler local worker instance can be run on `http://localhost:8787` for tests running inside native Capacitor wrappers (where Playwright's browser-routing cannot hook into the app's native network layer easily).
3. **Configuration**: Playwright config (`playwright.config.ts`) will manage:
   - Base URL configuration.
   - Global webServer setup to automatically spin up the Next.js server.
   - Test directory mapping (`tests/e2E/**/*.spec.ts`).

### B. Clock Mocking (Offline Vital Decay Simulation)
To test **Feature 1 (Offline Idle Time & Vital Decay)**, we must control time deterministically.
- Playwright's `page.clock` API allows freezing, stepping, and advancing time:
  ```typescript
  // Freeze time at a specific timestamp
  await page.clock.install({ time: new Date('2026-07-04T12:00:00Z') });
  ```
- Alternatively, we simulate offline time by manipulating the frontend's local storage:
  1. Inject a state with a past timestamp into `localStorage`:
     ```typescript
     await page.evaluate(() => {
       localStorage.setItem('broono_pet_state', JSON.stringify({
         pet_id: "broono-egg",
         vitals: { hunger: 100, hydration: 100, temperature: 37.0, happiness: 100 },
         coins: 500,
         last_sync_time: Date.now() - (4 * 3600 * 1000) // 4 hours ago
       }));
     });
     ```
  2. Reload the page using `page.reload()`.
  3. The local game loop initialization logic reads the storage, computes `Date.now() - last_sync_time` (4 hours), applies decay, updates state, and renders.
  4. Playwright asserts the rendered vitals reflect the 4-hour decay values.

### C. State Sync & Anti-Cheat Validation
- **POST `/api/pet/sync`**: Tests will verify that the client sends correct request payloads (vitals, client_time, last_sync_time) and that the application handles responses appropriately.
- **Security & Integrity**: Playwright will mock backend validation rejections (e.g. 400 Bad Request, Out of Sync, Cheating Detected) and assert that the frontend handles rollbacks (reverting back to the last known valid state cached in D1/KV) and displays warnings to the user.

### D. Currency & Progression Locks
- The shop is locked until a player accumulates **1,000 coins**.
- Playwright will test shop accessibility under, at, and above the 1,000-coin threshold by setting state values in localStorage/mock API and asserting that:
  - Interactive shop routes are blocked/hidden.
  - Locked state overlays are rendered.
  - Coins deduct correctly upon valid transactions.

---

## 3. The 60 Specific Test Cases

### Tier 1: Feature Coverage (5 per feature = 25 tests)

#### Feature 1: Offline idle time calculation & Vital Decay
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F1-01** | Hunger offline decay | Inject pet state with hunger=100, last_sync_time=2h ago. | Load pet page. | Hunger is calculated at `100 - (2 * hunger_decay_rate)` and displayed in UI. |
| **TC-F1-02** | Hydration offline decay | Inject pet state with hydration=100, last_sync_time=3h ago. | Load pet page. | Hydration is calculated at `100 - (3 * hydration_decay_rate)` and displayed in UI. |
| **TC-F1-03** | Temperature drift offline | Inject pet state with temp=37, last_sync_time=4h ago. | Load pet page. | Temperature is modified towards ambient and UI shows updated value. |
| **TC-F1-04** | Happiness offline decay | Inject pet state with happiness=100, last_sync_time=5h ago. | Load pet page. | Happiness is calculated at `100 - (5 * happiness_decay_rate)` in UI. |
| **TC-F1-05** | Real-time vital decay | Mock current time, load page with full vitals. | Advance page clock by 5 minutes. | Vitals decrease in real-time according to active decay rates in the foreground. |

#### Feature 2: State Sync & API Validation (POST /api/pet/sync)
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F2-01** | Sync success UI update | Intercept POST `/api/pet/sync` -> return 200 OK with sync confirmation. | Trigger a manual sync or make pet action. | localStorage `last_sync_time` updates to match server timestamp response. |
| **TC-F2-02** | Intercept sync payload | Route POST `/api/pet/sync` to capture request. | Perform pet action to trigger sync. | Payload contains `pet_id`, `vitals` object, `coins`, `last_sync_time`, `client_time`. |
| **TC-F2-03** | Auth header presence | Route `/api/pet/sync` to capture request headers. | Trigger state sync. | Header contains `Authorization: Bearer <valid_jwt>`. |
| **TC-F2-04** | Sync failure handling | Intercept `/api/pet/sync` -> return 500 Internal Server Error. | Perform action triggering sync. | UI displays "Sync failed, changes saved locally" banner. |
| **TC-F2-05** | Conflict resolution | Intercept `/api/pet/sync` -> return 200 with coins=2000 (server state is higher). | Trigger state sync with client coins=1200. | Client updates local store and UI coin counter to 2000. |

#### Feature 3: Shop & Coins Progression (Locked/Unlocked at 1,000)
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F3-01** | Shop locked below 1k | Inject pet state with coins=999. | Navigate to Shop page. | Shop view displays "Locked until 1,000 coins" overlay, buy buttons hidden. |
| **TC-F3-02** | Shop unlocked at 1k | Inject pet state with coins=1000. | Navigate to Shop page. | Shop is interactive; "Locked" overlay is absent. |
| **TC-F3-03** | Shop unlocked above 1k | Inject pet state with coins=1500. | Navigate to Shop page. | Shop items are fully browsable and purchase buttons are enabled. |
| **TC-F3-04** | Coin deduction on buy | Inject state with coins=1200. Mock sync API to accept purchase. | Purchase a cosmetic item costing 300. | Local coin count updates to 900 in UI and state. |
| **TC-F3-05** | Inventory additions | Inject state with empty inventory. Mock sync API. | Purchase "Penguin Suit" costing 400. | Item is added to inventory page and equipped. |

#### Feature 4: Leaderboard Display (Global, Country, Friends & Family)
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F4-01** | Global leaderboard render | Mock `/api/leaderboard?tier=global` with ranks 1-5. | Navigate to Leaderboard, select Global. | Displays 5 user rows with correct ranks, usernames, and scores. |
| **TC-F4-02** | Country leaderboard render | Mock `/api/leaderboard?tier=country&country_code=GB` with UK users. | Select Country tab. | Displays GB-specific users and shows GB flag. |
| **TC-F4-03** | Friends leaderboard render | Mock `/api/leaderboard?tier=friends` with user's friends list. | Select Friends tab. | Displays friends list with ranks and coin counts. |
| **TC-F4-04** | User highlight | Mock leaderboard containing current user "broono_owner". | Open leaderboard. | Row containing "broono_owner" is highlighted with distinct UI style. |
| **TC-F4-05** | Empty state handling | Mock `/api/leaderboard?tier=friends` to return `[]`. | Select Friends tab. | Displays "Add friends to start competing!" empty state illustration. |

#### Feature 5: JWT Identity Authentication & Auth Normalization
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F5-01** | Redirect unauth users | Clear localStorage auth tokens. | Navigate to `/dashboard` or `/`. | App immediately redirects to `/login`. |
| **TC-F5-02** | Successful credentials login | Mock Supabase Auth sign-in to succeed with token. | Enter credentials, submit. | Redirects to home pet dashboard, stores JWT. |
| **TC-F5-03** | Apple sign-in proxy normalization | Mock Supabase Auth callback returning Apple proxy email. | Trigger Apple Sign-In callback. | Auth succeeds, database normalizes proxy email as primary key. |
| **TC-F5-04** | JWT expiration handling | Intercept any api request -> return 401 Unauthorized. | Attempt state sync or actions. | User is signed out, redirected to `/login` with session expiry toast. |
| **TC-F5-05** | User logout | Logged-in state preset. | Click "Logout" button. | Tokens cleared from storage, user redirected to `/login`. |

---

### Tier 2: Boundary & Edge Cases (5 per feature = 25 tests)

#### Feature 1: Offline idle time calculation & Vital Decay
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F1-06** | Hunger floor limit | Inject state hunger=20, last_sync_time=24h ago. | Load pet page. | Hunger is calculated and clamped at exactly 0 (no negative values). |
| **TC-F1-07** | Hydration floor limit | Inject state hydration=20, last_sync_time=24h ago. | Load pet page. | Hydration is calculated and clamped at exactly 0. |
| **TC-F1-08** | Happiness floor limit | Inject state happiness=10, last_sync_time=24h ago. | Load pet page. | Happiness is calculated and clamped at exactly 0. |
| **TC-F1-09** | Vitals ceiling limit | Inject state hunger=95. | Feed pet with item adding +10 hunger. | Hunger is clamped at exactly 100 (never exceeds 100). |
| **TC-F1-10** | Extreme offline delta | Inject last_sync_time=1 year ago (massive gap). | Load pet page. | Vitals clamp to 0; pet is in starvation state; app stays functional. |

#### Feature 2: State Sync & API Validation (POST /api/pet/sync)
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F2-06** | Clock spoofing rejection | Intercept `/api/pet/sync` -> return 400 Out of Sync (Client time in future). | Trigger sync with client time set to +1 hour. | UI displays "Device clock out of sync" modal, blocking actions. |
| **TC-F2-07** | Impossible decay rate rollback | Intercept `/api/pet/sync` -> return 400 (Vitals dropped too fast). | Spoof vitals to 0 in 1 second, trigger sync. | Client rolls back local state to last known server state. |
| **TC-F2-08** | Coin injection rejection | Intercept `/api/pet/sync` -> return 400 (Suspicious coin change). | Inject +50000 coins client-side, trigger sync. | Sync rejected; client rolls back local coins and displays anti-cheat warning. |
| **TC-F2-09** | Concurrent sync throttling | Set `/api/pet/sync` response latency to 2s. | Click multiple buttons rapidly triggering syncs. | Client sends only one sync request, queuing or ignoring duplicates. |
| **TC-F2-10** | Malformed response fallback | Intercept `/api/pet/sync` -> return invalid JSON text. | Trigger sync. | Client handles parsing exception; does not crash; retries sync later. |

#### Feature 3: Shop & Coins Progression (Locked/Unlocked at 1,000)
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F3-06** | Buy item with exact balance | Inject state with coins=1000. | Buy item costing 1000. | Coins become 0. Shop remains unlocked (persistent progression milestone). |
| **TC-F3-07** | Insufficient coins check | Inject state with coins=1100. | Attempt to buy item costing 1200. | "Buy" button is disabled; toast error shown; no API call is triggered. |
| **TC-F3-08** | Utility purchase limit | Inject state with AC already owned. | Navigate to Shop. | "Air Conditioner" upgrade displays "Owned" and button is disabled. |
| **TC-F3-09** | Coin overflow layout | Inject state with coins=99,999,999. | View coin counter. | Score text does not overflow container or cause UI wrap. |
| **TC-F3-10** | Purchase double-click prevention | Intercept sync API with delayed response. | Double click buy button. | Only one transaction executes; coin deduction only occurs once. |

#### Feature 4: Leaderboard Display (Global, Country, Friends & Family)
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F4-06** | Score overflow layout | Mock leaderboard with user having 999,999,999 coins. | View leaderboard. | Layout is preserved; score numbers are legible. |
| **TC-F4-07** | Slow network spinner | Mock leaderboard endpoint with 3s latency. | Navigate to Leaderboard. | Loading skeleton/spinner is displayed during wait. |
| **TC-F4-08** | API error screen | Mock `/api/leaderboard` -> return 500 error. | Navigate to Leaderboard. | Displays "Could not load leaderboard" message and a "Retry" button. |
| **TC-F4-09** | Exact ties display | Mock leaderboard with ranks 2 and 3 sharing identical scores. | View leaderboard. | Displays ties correctly (e.g. Rank 2, Rank 2 or sequential ranks). |
| **TC-F4-10** | Infinite scroll paging | Mock paginated leaderboard data. | Scroll to bottom of leaderboard list. | Triggers page 2 request; appends new items seamlessly. |

#### Feature 5: JWT Identity Authentication & Auth Normalization
| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-F5-06** | Corrupted JWT session | Set `sb-access-token` to invalid garbage string. | Load app. | Storage cleared; user is treated as logged-out and sent to `/login`. |
| **TC-F5-07** | Bad login credentials | Mock Supabase Auth sign-in to return 400 Bad Credentials. | Enter invalid credentials and login. | Error alert displays "Invalid login credentials". |
| **TC-F5-08** | Private Apple email signup | Mock Apple OAuth with hidden email address. | Click "Sign in with Apple". | Account registered; proxy email mapped as unique DB key in Worker. |
| **TC-F5-09** | Offline app launch | Disable network. Cache valid session details in storage. | Load app. | User successfully enters Pet View (offline dashboard access with cache). |
| **TC-F5-10** | Injection payload sanitation | Provide SQL injection string as username/email. | Submit login. | Frontend rejects via validation, or backend rejects safely without crash. |

---

### Tier 3: Cross-Feature Combinations (5 tests)

| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-CR-01** | Happiness Decay & Mini-game Multipliers | Inject low happiness (10) via offline decay. | Play mini-game; earn rewards. | Game rewards base coins; coin multiplier is reduced due to low happiness. |
| **TC-CR-02** | Coin unlock shop transition | Set coins to 950. Mock mini-game completion API. | Play mini-game, earn 60 coins (total 1010). | Shop UI automatically updates to unlocked state without reload. |
| **TC-CR-03** | Account switching | User A logged in. | Log out and immediately log in as User B. | Dashboard updates to User B's pet; leaderboard highlight moves to User B. |
| **TC-CR-04** | AC purchase modifies subsequent decay | Preset coins=1500. Mock shop purchase and state. | Buy AC from shop -> simulate 6h offline delta. | Temperature decay is arrested; other vitals decay normally. |
| **TC-CR-05** | Transaction rejection rollback | Set coins=1200. Intercept sync API to return 401/400. | Buy shop item costing 300. | Deducts client-side -> API fails -> client rolls back to 1200 coins, item removed. |

---

### Tier 4: Real-World Scenarios (5 tests)

| Test ID | Test Name | Setup / Mocking | Action / Steps | Expected Assertions |
|---|---|---|---|---|
| **TC-RW-01** | Daily check-in sequence | Inject decayed vitals from overnight gap. | Log in -> Check vitals -> Feed pet -> Play mini-game -> Sync -> Log out. | Vitals recover; coins increase; final state successfully syncs and logs out. |
| **TC-RW-02** | Mid-gameplay disconnect recovery | Start online -> lose internet -> play mini-game -> recover network. | Feed pet -> disconnect -> play game (coins +100) -> reconnect. | Actions cached locally; reconnect triggers sync; backend accepts update. |
| **TC-RW-03** | App backgrounding | App active in browser. | Simulate backgrounding for 4 hours (pause page) -> foreground. | App calculates idle time; applies vital decay; UI updates and sync triggers. |
| **TC-RW-04** | Leaderboard progression climb | User has 950 coins (Rank 4, Rank 3 is 1000). | Play mini-game; earn 100 coins. State syncs. Open Leaderboard. | User's coins update to 1050; leaderboard ranks user at Rank 3. |
| **TC-RW-05** | Session expiry during transaction | User browses shop. Auth token expires. | Click "Buy" button -> intercept API to return 401. | Purchase aborted; user redirected to `/login` with "Session expired". |

---

## 4. Frontend Integration & Mock Backend Architecture

### A. Next.js Frontend Structure & Instrumentation for E2E
To make the Next.js frontend testable under Playwright, the developer should implement the following structure:

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx          # Initial entry point
│   ├── login/            # Login screen (Supabase Auth input)
│   ├── dashboard/        # Pet View and care options
│   ├── shop/             # Shop items grid
│   └── leaderboard/      # Leaderboard rankings
├── components/           # UI elements (buttons, progress bars)
└── hooks/
    └── usePetStore.ts    # Zustand state manager (syncs with localStorage & Worker API)
```

#### Test Hooks & Attributes
- **Element Tagging**: Add `data-testid` attributes on all critical nodes:
  - Vitals: `data-testid="hunger-bar"`, `data-testid="hydration-bar"`, `data-testid="temperature-bar"`, `data-testid="happiness-bar"`.
  - Currency: `data-testid="coin-count"`.
  - Shop Overlay: `data-testid="shop-locked-overlay"`.
  - Buttons: `data-testid="buy-ac-button"`, `data-testid="login-button"`.
- **Global Testing Hook**: Expose the Zustand store to `window` under development/testing environments to allow direct inspections or injections from Playwright when local storage changes alone are insufficient:
  ```typescript
  if (process.env.NEXT_PUBLIC_APP_ENV === 'test') {
    (window as any).__petStore = usePetStore;
  }
  ```

---

### B. Mocked Backend API Strategy & Running Configurations
For complete isolation, the E2E tests should not communicate with the live Cloudflare Worker. We propose two mock execution strategies:

#### Method 1: Playwright Route Interception (In-Test Mocking)
Playwright intercepts network calls directly. This requires no backend configuration or extra running process:
```typescript
// tests/e2e/sync.spec.ts
import { test, expect } from '@playwright/test';

test('sync updates offline decay values', async ({ page }) => {
  // Mock API
  await page.route('**/api/pet/sync', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: "success",
        vitals: { hunger: 90, hydration: 90, temperature: 37, happiness: 90 },
        coins: 1050,
        last_sync_time: Math.floor(Date.now() / 1000)
      })
    });
  });

  // Proceed with test...
});
```

#### Method 2: Out-of-Process Mock Worker (Wrangler Test Mode)
For Capacitor testing (where Playwright runs outside the target app environment), a mock Worker is executed on port `8787` using Wrangler.
- **Mock Implementation File (`backend/src/mock.ts`)**:
  A simplified Hono application that mimics the production endpoints (`/api/pet/sync`, `/api/leaderboard`, etc.) but uses an in-memory object or a local file for state storage, omitting external JWT checks or D1 writes unless specifically requested.
- **Run Configurations (Wrangler)**:
  Run the mock API server locally:
  ```bash
  # Start the mock worker on port 8787 with wrangler local mode
  npx wrangler dev backend/src/mock.ts --port 8787 --local
  ```

---

### C. Workflow & Sequence Diagram for E2E Executions
Below is the sequence of events during a typical Playwright offline decay E2E test run:

```
 +------------------+           +------------------+          +------------------+
 | Playwright Test  |           | Next.js Frontend |          | Mocked Worker    |
 | (Test Runner)    |           | (Browser / App)  |          | (API / Intercept)|
 +--------+---------+           +--------+---------+          +--------+---------+
          |                              |                             |
          | 1. Install mock clock        |                             |
          +----------------------------->|                             |
          |                              |                             |
          | 2. Inject state to local     |                             |
          |    storage (2 hours ago)     |                             |
          +----------------------------->|                             |
          |                              |                             |
          | 3. Trigger page reload       |                             |
          +----------------------------->|                             |
          |                              |                             |
          |                              | 4. Compute decay delta      |
          |                              |    (current - 2h)           |
          |                              |----+                        |
          |                              |    |                        |
          |                              |<---+                        |
          |                              |                             |
          |                              | 5. POST /api/pet/sync       |
          |                              +---------------------------->|
          |                              |                             | 6. Intercept /
          |                              |                             |    Verify client state
          |                              |                             |----+
          |                              |                             |    | (Verify no cheat)
          |                              |                             |<---+
          |                              | 7. Return 200 OK (updated)  |
          |                              |<----------------------------+
          |                              |                             |
          |                              | 8. Update UI & storage      |
          |                              |----+                        |
          |                              |    |                        |
          |                              |<---+                        |
          |                              |                             |
          | 9. Assert UI vitals          |                             |
          |    (e.g., Hunger = 80)       |                             |
          +----------------------------->|                             |
```

---

## 5. Conclusion & Recommendations
1. **Primary Mocking Model**: Recommend using Playwright's **in-test Route Interception** (`page.route`) as the default for E2E tests, which keeps tests isolated, runs fast, and requires no external servers.
2. **Capacitor Support**: For E2E testing of the Capacitor wrapper (native build), developers should run the **Mock Wrangler Worker** on `localhost:8787` and point the Capacitor native app configuration to it.
3. **Deterministic Clocking**: Ensure developers use Playwright's `page.clock` API for all vital decay tests rather than sleeping or waiting, keeping E2E execution times under seconds.
4. **Zustand Exposure**: Ensure the state management library (Zustand) is exposed via `window.__petStore` in testing builds to facilitate test validation.

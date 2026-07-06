# Playwright E2E Test Suite Strategy & Infrastructure Plan

## 1. High-Level Playwright E2E Test Strategy

This document outlines the testing strategy for **broono.app**, a Tamagotchi-style mobile pet simulation. The testing suite is built on **Playwright** and is designed to execute against a compiled Next.js static export served locally, communicating with a mocked Cloudflare Worker backend.

### 1.1 Test Run Environment
- **Frontend Host**: The static build (`out/` or `dist/` directory) is served on `http://localhost:3000` using a lightweight HTTP server (e.g., `sirv-cli` or `http-server`).
- **Backend Host**: A mocked Hono worker runs on `http://localhost:8787` (using wrangler in local mode or a dedicated Node-Hono mock server).
- **Configuration**: Playwright reads configuration from `playwright.config.ts`, spinning up both the frontend server and backend API before test execution.

```
+------------------+                   +------------------+
| Playwright Test  |                   | Next.js Frontend |
|   Runner (Node)  |                   | (Static Export)  |
+--------+---------+                   +--------+---------+
         | (Controls Browser)                   |
         v                                      | (Fetch API)
+------------------+                            v
| Chromium / WebKit| ---------------------->  /api/* (Mock Backend)
+------------------+                            |
                                                v
                                       +------------------+
                                       |   Hono Mock API  |
                                       |   (Port 8787)    |
                                       +------------------+
```

### 1.2 Time Manipulation Strategy
The local game loop is heavily time-dependent. To test offline idle time calculations without sleeping, Playwright's **Clock API** (available in modern Playwright versions) will be used to manipulate the browser's system clock.
- **Clock Initialization**: Playwright installs a mock clock via `await page.clock.install({ time: new Date() })`.
- **Time Jumping**: Tests advance time using `await page.clock.fastForward('12:00:00')` to simulate 12 hours offline.
- **Sync Correlation**: The local storage `last_sync_time` and the backend DB record are aligned with this clock, allowing precise evaluation of vital decay.

### 1.3 State Isolation & Test Control
- **Database Reset**: The database (D1) and state cache (KV) are wiped before each test via test-only endpoints (e.g., `/api/__test/reset`).
- **State Seeding**: To run a test in a specific initial state (e.g., user has 999 coins, pet is an egg, etc.), Playwright invokes `/api/__test/seed` with the target payload before navigating to the frontend page.
- **Token Injection**: Supabase JWT session tokens are injected directly into `localStorage` during the `beforeEach` hook to bypass the UI login steps for features that require authentication.

---

## 2. Playwright E2E Test Cases (60 Cases)

### Tier 1: Feature Coverage (25 Tests)

#### Feature 1: Offline Idle Time Calculation & Vital Decay
* **TEST-01: Local Loop Initialization**
  - **Objective**: Verify that the game loop initializes and displays current vitals from the backend.
  - **Setup**: Seed backend state with pet vitals: Hunger=80, Hydration=80, Temp=37.0, Happiness=80.
  - **Steps**: Login, navigate to pet dashboard, verify HUD display.
  - **Assertions**: HUD labels show Hunger=80%, Hydration=80%, Temp=37.0°C, Happiness=80%.
* **TEST-02: Short-Term Offline Decay (1 Hour)**
  - **Objective**: Verify that Hunger and Hydration decay after 1 hour offline.
  - **Setup**: Seed last sync time at $T_0$. Advance browser clock by 1 hour ($T_0 + 3600s$).
  - **Steps**: Navigate to pet page.
  - **Assertions**: Vitals drop by the expected 1-hour decay amount (e.g., Hunger = 75, Hydration = 75).
* **TEST-03: Medium-Term Offline Decay (6 Hours)**
  - **Objective**: Verify that Happiness also begins to degrade when offline for 6 hours.
  - **Setup**: Seed last sync time at $T_0$. Advance clock by 6 hours ($T_0 + 21600s$).
  - **Steps**: Navigate to pet page.
  - **Assertions**: Hunger and Hydration drop significantly, Happiness is reduced, Temp remains in normal bounds.
* **TEST-04: Extreme Offline Neglect (24 Hours)**
  - **Objective**: Verify vitals bottom out and pet changes status to neglected/sick.
  - **Setup**: Seed vitals at 50. Advance clock by 24 hours ($T_0 + 86400s$).
  - **Steps**: Open pet dashboard.
  - **Assertions**: Hunger and Hydration are 0. Pet status indicator shows "Sick" or "Neglected".
* **TEST-05: Environment-Based Decay Modification**
  - **Objective**: Verify that environmental factors (e.g., placing the pet in a desert environment) accelerate hydration decay.
  - **Setup**: Seed pet environment = 'Desert'. Set clock $T_0$. Advance by 2 hours.
  - **Steps**: Open dashboard.
  - **Assertions**: Hydration decay is double the standard rate.

#### Feature 2: State Sync & API Validation
* **TEST-06: Initial Sync on Login**
  - **Objective**: Verify that the client sends a sync request immediately after login.
  - **Setup**: Clear client state. Seed backend pet state.
  - **Steps**: Log in as a user.
  - **Assertions**: Intercept POST `/api/pet/sync`. Verify payload contains valid matching client timestamp and pet ID.
* **TEST-07: Periodic Active Sync**
  - **Objective**: Verify that a sync request is sent periodically (e.g., every 60 seconds) when the app is active.
  - **Setup**: Open the app. Mock the clock.
  - **Steps**: Wait for 60 seconds of simulated time.
  - **Assertions**: Intercept POST `/api/pet/sync` and check that the body contains the minor vital changes from active play.
* **TEST-08: Sync After Offline Decay Recalculation**
  - **Objective**: Verify that the client syncs the newly decayed state immediately upon calculating offline time.
  - **Setup**: Set clock to $T_0$. Advance to $T_0 + 2$ hours.
  - **Steps**: Open the app.
  - **Assertions**: POST `/api/pet/sync` is sent. Payload matches locally decayed calculations, and response status is 200.
* **TEST-09: Sync Rejection and Override**
  - **Objective**: Verify client updates its UI when the backend rejects and overrides the state.
  - **Setup**: Mock POST `/api/pet/sync` to return a different, corrected state (e.g., server corrected values).
  - **Steps**: Trigger sync.
  - **Assertions**: Verify client UI changes to show the server's overridden vitals.
* **TEST-10: Token Integrity on Sync**
  - **Objective**: Verify the sync API call includes the Bearer token.
  - **Setup**: Inject mock JWT token.
  - **Steps**: Trigger sync.
  - **Assertions**: Intercept request, verify `Authorization` header equals `Bearer <JWT_TOKEN>`.

#### Feature 3: Shop & Coins Progression
* **TEST-11: Shop Lock for Poor Users**
  - **Objective**: Assert that users with < 1,000 coins cannot open the shop.
  - **Setup**: Seed user state with 500 coins.
  - **Steps**: Go to dashboard, click the Shop button.
  - **Assertions**: Verify shop is locked. A modal/tooltip appears saying "Locked: Requires 1,000 coins".
* **TEST-12: Shop Unlock for Wealthy Users**
  - **Objective**: Assert that users with >= 1,000 coins can enter the shop.
  - **Setup**: Seed user state with 1,000 coins.
  - **Steps**: Go to dashboard, click the Shop button.
  - **Assertions**: Shop UI opens successfully, showing item listings.
* **TEST-13: Item Purchase Deducts Coins**
  - **Objective**: Verify that buying an item reduces coin balance and updates inventory.
  - **Setup**: Seed user with 1,200 coins.
  - **Steps**: Enter shop, click "Buy Cat Ears" (cost: 300 coins).
  - **Assertions**: Coin indicator on screen immediately updates to 900. Inventory displays "Cat Ears".
* **TEST-14: Insufficient Funds for Item**
  - **Objective**: Verify that user cannot purchase an item if its price exceeds their coins.
  - **Setup**: Seed user with 1,050 coins.
  - **Steps**: Enter shop, try to buy "Palace Environment" (cost: 1,500 coins).
  - **Assertions**: The purchase button is disabled or triggers an "insufficient coins" toast. Coins remain at 1,050.
* **TEST-15: Immediate Sync on Purchase**
  - **Objective**: Verify that buying an item triggers an immediate database sync.
  - **Setup**: Seed user with 1,100 coins.
  - **Steps**: Enter shop, buy "Penguin Suit" (cost: 500 coins).
  - **Assertions**: Intercept POST `/api/pet/sync` and check that the body contains the updated coins (600) and the penguin suit in inventory.

#### Feature 4: Leaderboard Display
* **TEST-16: Global Leaderboard Retrieval**
  - **Objective**: Verify that the global leaderboard is fetched and displayed correctly.
  - **Setup**: Seed backend database with 5 players (ranks 1 to 5).
  - **Steps**: Navigate to Leaderboard page, select "Global" tab.
  - **Assertions**: Verify 5 rows are rendered in correct ranking order (by coin count).
* **TEST-17: Country Leaderboard Filtering**
  - **Objective**: Verify the country leaderboard displays only users from the current user's country.
  - **Setup**: Seed user with country 'CA'. Seed database with players from US, CA, and UK.
  - **Steps**: Open Leaderboard page, select "Country" tab.
  - **Assertions**: Intercept GET `/api/leaderboard?tier=country&country_code=CA`. Verify the table only displays players from Canada.
* **TEST-18: Friends & Family Leaderboard**
  - **Objective**: Verify that the friends tier shows social connections.
  - **Setup**: Seed player and 2 friends.
  - **Steps**: Open Leaderboard page, select "Friends & Family" tab.
  - **Assertions**: Verify only the player and their 2 friends are displayed.
* **TEST-19: Tab Navigation Flow**
  - **Objective**: Verify switching tabs performs correct API queries.
  - **Steps**: Open leaderboard. Click Global, then Country, then Friends.
  - **Assertions**: Verify GET calls are made for each tier with appropriate query parameters.
* **TEST-20: Self-User Highlighting**
  - **Objective**: Verify the current user is styled differently in the list.
  - **Setup**: Log in as "alice" (rank 3 in global).
  - **Steps**: Go to global leaderboard.
  - **Assertions**: Row with user "alice" has a distinct highlight class (e.g. `bg-yellow-100` or `border-primary`).

#### Feature 5: JWT Identity Authentication & Auth Normalization
* **TEST-21: Redirect to Login when Unauthenticated**
  - **Objective**: Prevent access to the game dashboard for unauthenticated sessions.
  - **Setup**: Clear all localStorage and cookies.
  - **Steps**: Navigate directly to `/dashboard` or `/pet`.
  - **Assertions**: Page automatically redirects to `/login`.
* **TEST-22: Google Login Flow Normalization**
  - **Objective**: Verify Google Login stores JWT and allows entrance.
  - **Setup**: Mock Supabase oauth response for Google provider.
  - **Steps**: Click "Sign in with Google", approve mock OAuth.
  - **Assertions**: Check that `localStorage.getItem('sb-token')` exists and is a valid JWT. User is redirected to `/dashboard`.
* **TEST-23: Apple Login with Hidden Email**
  - **Objective**: Ensure Apple private relay emails are handled safely.
  - **Setup**: Mock Supabase OAuth payload with email `xyz@privaterelay.appleid.com`.
  - **Steps**: Click "Sign in with Apple".
  - **Assertions**: Backend accepts token, maps proxy email. UI displays pet setup for new account.
* **TEST-24: Auto-Logout on Token Expiry**
  - **Objective**: Verify the client logs out if the API returns 401 Unauthorized.
  - **Setup**: Inject expired JWT token.
  - **Steps**: App attempts to sync state. Mock API returns 401.
  - **Assertions**: Local session is destroyed. App redirects to `/login` with an "expired session" message.
* **TEST-25: Manual Logout Cleanup**
  - **Objective**: Verify user state is fully purged upon logout.
  - **Setup**: Logged in state.
  - **Steps**: Click "Log Out" in settings.
  - **Assertions**: Local storage keys (`sb-token`, cached pet state) are deleted. Current page is `/login`.

---

### Tier 2: Boundary & Edge Cases (25 Tests)

#### Feature 1: Offline Idle Time Calculation & Vital Decay
* **TEST-26: Negative Time Delta (Time Travel)**
  - **Objective**: Prevent errors or stat gains if client clock is set backward.
  - **Setup**: Seed last sync time at $T_0$. Set browser clock to $T_0 - 1$ hour.
  - **Steps**: Open the app.
  - **Assertions**: Vitals do not increase or corrupt. Elapsed time is treated as 0, leaving vitals unchanged.
* **TEST-27: Decade-Long Neglect (Clip Vitals at Zero)**
  - **Objective**: Verify vitals clip at 0 instead of displaying negative numbers.
  - **Setup**: Seed last sync at $T_0$. Advance clock by 10 years.
  - **Steps**: Open the app.
  - **Assertions**: Vitals are exactly 0 (not negative). Pet status is "Deceased".
* **TEST-28: Fractional Millisecond Decay Precision**
  - **Objective**: Verify fractional active decay does not suffer floating point drift.
  - **Setup**: Run game active loop for 100 iterations of 50ms intervals.
  - **Steps**: Verify internal vitals representation.
  - **Assertions**: Vitals are rounded appropriately in the UI and match target decimal limits in storage.
* **TEST-29: Vitals Cap at 100**
  - **Objective**: Verify overfeeding/overwatering does not push vitals past 100%.
  - **Setup**: Vitals at 95.
  - **Steps**: Click "Feed" (+10 hunger) twice.
  - **Assertions**: Hunger HUD displays exactly 100%.
* **TEST-30: Thermal Extremes**
  - **Objective**: Verify temperature decay does not exceed biological bounds (0°C to 50°C).
  - **Setup**: Seed pet in an extreme environment. Advance clock by 48 hours.
  - **Steps**: Inspect temperature HUD.
  - **Assertions**: Temperature is clamped at 50°C (maximum hot) or 0°C (maximum cold), not higher/lower.

#### Feature 2: State Sync & API Validation
* **TEST-31: Server Override of Client Cheating**
  - **Objective**: Backend must reject client sync stating 100% vitals after 12 hours offline.
  - **Setup**: Set client offline for 12 hours. Intercept sync payload to set vitals to 100.
  - **Steps**: Trigger sync.
  - **Assertions**: The backend overrides the values in the response body. UI updates to reflect the server's corrected, decayed values.
* **TEST-32: Mismatched Pet ID Sync Attempt**
  - **Objective**: Verify a user cannot update another user's pet ID.
  - **Setup**: Log in as User A. Send sync payload targeting User B's pet ID.
  - **Steps**: POST `/api/pet/sync` with User B's pet ID.
  - **Assertions**: Backend responds with 403 Forbidden.
* **TEST-33: Network Offline Queue & Reconcile**
  - **Objective**: Verify sync queue buffers updates during network dropout.
  - **Setup**: Block network requests using Playwright (`page.route('**/*', route => route.abort())`).
  - **Steps**: Perform feed action (+10 coins). Restore network. Wait for next sync tick.
  - **Assertions**: Once restored, the next sync POST payload contains the correct aggregated coins count.
* **TEST-34: Concurrent Sync Requests (Optimistic Locking)**
  - **Objective**: Prevent state overwrite conflicts if multiple syncs occur concurrently.
  - **Setup**: Send two sync requests with conflicting client times.
  - **Steps**: Mock DB to process both.
  - **Assertions**: The older request is rejected or merged safely. The backend uses `last_sync` to ensure only the latest state is stored.
* **TEST-35: API Parameter Pollution/Validation**
  - **Objective**: Ensure the backend rejects bad input structures (e.g. string vitals).
  - **Steps**: Send sync payload with `"hunger": "one-hundred"`.
  - **Assertions**: Backend returns 400 Bad Request, showing validation errors.

#### Feature 3: Shop & Coins Progression
* **TEST-36: Threshold Boundary (Exactly 999 Coins)**
  - **Objective**: Verify shop remains locked at 999 coins.
  - **Setup**: Seed user with 999 coins.
  - **Steps**: Try to open Shop.
  - **Assertions**: Shop access is blocked.
* **TEST-37: Threshold Boundary (Exactly 1,000 Coins)**
  - **Objective**: Verify shop unlocks at exactly 1,000 coins.
  - **Setup**: Seed user with 1,000 coins.
  - **Steps**: Try to open Shop.
  - **Assertions**: Shop access is allowed.
* **TEST-38: Purchase to Exact Zero**
  - **Objective**: Verify purchase succeeds when user spends their last coin.
  - **Setup**: Seed user with 1,000 coins. Shop item costs 1,000.
  - **Steps**: Buy "Castle Theme" (cost: 1,000 coins).
  - **Assertions**: Purchase succeeds. Coins are exactly 0.
* **TEST-39: Duplicate Unique Cosmetics Purchase**
  - **Objective**: Prevent purchasing a unique cosmetic item that is already owned.
  - **Setup**: Seed inventory with "Penguin Suit".
  - **Steps**: Go to shop. Find "Penguin Suit".
  - **Assertions**: The purchase button is disabled and reads "Owned".
* **TEST-40: Buy Button Double-Click Spam**
  - **Objective**: Prevent double-spending coins due to UI latency.
  - **Setup**: 1,200 coins. Item costs 1,000.
  - **Steps**: Double-click "Buy" button rapidly.
  - **Assertions**: Only one API request goes through, or backend handles it safely. Coins drop to 200, not negative.

#### Feature 4: Leaderboard Display
* **TEST-41: Empty Friends Leaderboard**
  - **Objective**: Ensure a clear user message if the user has no friends.
  - **Setup**: Seed database with no friends for current user.
  - **Steps**: View Friends & Family leaderboard.
  - **Assertions**: Displays text: "You have no friends added yet. Share your invite code!"
* **TEST-42: Pagination Beyond 50 Users**
  - **Objective**: Verify leaderboard limits retrieval payload size.
  - **Setup**: Seed database with 100 users.
  - **Steps**: Open Global Leaderboard.
  - **Assertions**: Verify exactly 50 rows are shown initially. Scrolling down or clicking "Next" loads the next page.
* **TEST-43: Identical Score Ranking Tie-breaker**
  - **Objective**: Ensure stable sorting for players with identical coin counts.
  - **Setup**: Seed User A and User B both with 1,500 coins. User A created at $T_1$, User B at $T_2$ ($T_1 < T_2$).
  - **Steps**: Open leaderboard.
  - **Assertions**: User A is ranked above User B.
* **TEST-44: Invalid Country Code Query**
  - **Objective**: Verify querying leaderboard with an invalid country code returns empty list or error.
  - **Steps**: Request GET `/api/leaderboard?tier=country&country_code=INVALID`.
  - **Assertions**: Returns 400 Bad Request or empty list.
* **TEST-45: Integer Overflow Coins Rendering**
  - **Objective**: Verify that extreme coin counts do not break the leaderboard layout.
  - **Setup**: Seed a player with 9,999,999,999 coins.
  - **Steps**: View Global Leaderboard.
  - **Assertions**: Number is correctly formatted (e.g., "10B" or "9,999,999,999") without wrapping or breaking layout.

#### Feature 5: JWT Identity Authentication & Auth Normalization
* **TEST-46: SQL Injection in Authorization Header**
  - **Objective**: Ensure the backend does not crash or leak data when sent SQL in auth headers.
  - **Steps**: Send sync request with header `Authorization: Bearer ' OR '1'='1`.
  - **Assertions**: Backend responds with 401 Unauthorized.
* **TEST-47: Apple Login Missing Email Payload**
  - **Objective**: Handle Apple Sign-in payloads that lack an email.
  - **Setup**: Mock Apple OAuth response with missing email object.
  - **Steps**: Trigger Apple login.
  - **Assertions**: Auth is rejected or falls back to using user's unique provider ID (subject) as primary key mapping.
* **TEST-48: Malformed JWT Structure**
  - **Objective**: Ensure raw/broken strings in authorization headers fail gracefully.
  - **Steps**: Send request with `Authorization: Bearer not-a-jwt`.
  - **Assertions**: Returns 401 Unauthorized.
* **TEST-49: Rogue Signature JWT**
  - **Objective**: Reject tokens signed by foreign keys.
  - **Setup**: Generate JWT signed with fake secret.
  - **Steps**: Attempt sync.
  - **Assertions**: Returns 401 Unauthorized.
* **TEST-50: Cross-User Profile Hijacking**
  - **Objective**: Ensure user A's token cannot query user B's profile page.
  - **Setup**: Log in as User A. Request user profile page of User B (`/api/user/user-b-id`).
  - **Assertions**: Returns 403 Forbidden.

---

### Tier 3: Cross-Feature Combinations (5 Tests)

* **TEST-51: Shop Purchase Persistence Lifecycle**
  - **Objective**: Purchase an item, sync with backend, reload page, verify item remains owned.
  - **Setup**: User has 1,200 coins.
  - **Steps**: Navigate to Shop -> Purchase "Cat Ears" -> Trigger Sync -> Reload Page -> Open Inventory.
  - **Assertions**: "Cat Ears" is shown in inventory, coins read 900.
* **TEST-52: Offline Decay with Shop Environment Modifiers**
  - **Objective**: Purchase a temperature control unit (AC), go offline, verify temperature did not decay.
  - **Setup**: Seed user with 1,500 coins. Buy "Air Conditioner" item.
  - **Steps**: Advance clock by 10 hours.
  - **Assertions**: Vitals decay (Hunger/Hydration) occurs, but Temperature remains stable at 37°C.
* **TEST-53: Game Progression Leaderboard Update**
  - **Objective**: Earn coins through gameplay, sync state, inspect leaderboard to verify updated rank.
  - **Setup**: Global leaderboard exists. Player has 800 coins (rank 20).
  - **Steps**: Earn 400 coins -> Trigger state sync -> Open Leaderboard.
  - **Assertions**: User's coins read 1,200. Rank has risen (e.g. to rank 15).
* **TEST-54: Session Expiration During Shop Interaction**
  - **Objective**: If auth token expires while user is inside the shop, buying must fail and redirect.
  - **Setup**: Inside shop UI. Expire the JWT token.
  - **Steps**: Click "Buy Item".
  - **Assertions**: Buy API returns 401. User is kicked to `/login`. Coins and inventory are unmodified.
* **TEST-55: Pet Neglect Restricts Shop Access**
  - **Objective**: If a pet dies of neglect due to long offline time, the shop must lock again.
  - **Setup**: User has 1,200 coins. Advance clock by 48 hours (pet dies).
  - **Steps**: Open the app. Try to enter the Shop.
  - **Assertions**: Shop button is disabled or redirects to a "Revive Pet" utility screen, blocking normal cosmetic purchasing.

---

### Tier 4: Real-World Scenarios (5 Tests)

* **TEST-56: Full Daily Care Routine (Cold Start)**
  - **Objective**: Simulate daily check-in: login, process offline decay, feed, water, play mini-game, sync, view rank.
  - **Setup**: Seed last sync 18 hours ago. User has 500 coins.
  - **Steps**:
    1. Log in.
    2. Verify offline decay message ("While you were away...").
    3. Click "Feed" (+15 Hunger, cost 20 coins).
    4. Click "Water" (+15 Hydration, cost 15 coins).
    5. Play mini-game, scoring 300 points (+300 coins).
    6. Verify sync occurs.
    7. View global leaderboard.
  - **Assertions**: Final vitals are corrected. Coins read 765. Global rank displays updated coins.
* **TEST-57: Cross-Device State Sync**
  - **Objective**: Verify care task on Mobile is immediately reflected on Tablet layout.
  - **Setup**: Use two Playwright BrowserContexts (Device A and Device B) logged into the same account.
  - **Steps**:
    1. On Device A: Feed pet (+20 hunger).
    2. Sync completes on Device A.
    3. On Device B: Reload page or wait for auto-sync fetch.
  - **Assertions**: Device B displays the new hunger percentage, reflecting Device A's action.
* **TEST-58: Reconnection and Aggressive Sync Resolution**
  - **Objective**: Simulate playing on a subway: lose connection, play, reconnect, verify state is saved.
  - **Setup**: Load app. Go offline (`context.setOffline(true)`).
  - **Steps**:
    1. Click "Feed" 3 times.
    2. Advance clock 10 minutes.
    3. Reconnect to network (`context.setOffline(false)`).
    4. Wait for sync trigger.
  - **Assertions**: App does not crash. Sync request is dispatched containing the correct final vitals and coin modifications.
* **TEST-59: Leaderboard Rivalry Competition**
  - **Objective**: Verify competing users see real-time ranking swaps.
  - **Setup**: Player A (1,000 coins, rank 2) and Player B (1,050 coins, rank 1).
  - **Steps**:
    1. Log in as Player A.
    2. Win mini-game (+100 coins).
    3. Sync Player A state.
    4. Open Leaderboard.
  - **Assertions**: Player A is now rank 1 with 1,100 coins. Player B is rank 2.
* **TEST-60: New Account Onboarding and Egg Hatching**
  - **Objective**: Register new account, nurture egg, hatch pet, verify start assets.
  - **Steps**:
    1. Navigate to register page.
    2. Complete Google Login simulation.
    3. Choose egg name "Broono".
    4. Maintain temperature at 37°C for 2 minutes (simulated).
    5. Trigger hatch.
  - **Assertions**: Pet status becomes "Baby". Starting bonus (200 coins) is credited. Sync persists new state to database.

---

## 3. Frontend Placeholder & Build Structure

For Playwright E2E tests to run successfully against the Next.js frontend, the static export needs to be structured with test hooks and configure its API endpoints dynamically.

### 3.1 Next.js Project Structure
The Next.js configuration is set to `output: 'export'` inside `next.config.ts`, generating static HTML/JS/CSS assets inside the `out/` (or `dist/`) directory.

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx          # Login & Onboarding router
│   ├── dashboard/
│   │   └── page.tsx      # Main Pet HUD
│   ├── shop/
│   │   └── page.tsx      # Shop View (locked <1000 coins)
│   └── leaderboard/
│       └── page.tsx      # Rankings View
├── components/
│   └── game-loop.tsx     # Active game loop & state provider
└── lib/
    ├── api.ts            # REST client targeting process.env.NEXT_PUBLIC_API_URL
    └── store.ts          # Zustand store for pet vitals, coins, and credentials
```

### 3.2 Dynamic API Routing
The frontend must point its API requests to the mock server port during E2E testing:
- **Client API Init**:
  ```typescript
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.broono.app';
  ```
- **Playwright Environment**: The Playwright runner spins up the frontend build using an environment file `.env.test` or injecting `NEXT_PUBLIC_API_URL=http://localhost:8787` during compilation.

### 3.3 Auth Bypass Hooks
To speed up tests, the authentication store (e.g. Zustand) should check for local storage tokens upon mounting:
- If `localStorage.getItem('sb-token')` exists, bypass login forms and immediately transition to `/dashboard`.
- During E2E tests, Playwright injects mock JWTs directly into localStorage:
  ```typescript
  await context.addInitScript(() => {
    window.localStorage.setItem('sb-token', 'mocked-jwt-token');
    window.localStorage.setItem('sb-user-email', 'tester@example.com');
  });
  ```

---

## 4. Mocked Backend API Architecture

Since Cloudflare Workers cannot be run natively in Node.js without a wrapper, we will run a dedicated mocked API server using **Hono** running on Node.js or `wrangler dev` in local mode. 

### 4.1 Implementation of Hono Mock Server
The mock server simulates the endpoints defined in `PROJECT.md` and maintains state in-memory or in a local SQLite file (simulating D1) and key-value mapping (simulating KV).

#### Key Endpoints:
1. `POST /api/auth/google` - Verifies Google ID tokens, registers user in-memory, returns mock JWT.
2. `POST /api/pet/sync` - Validates the client's vital calculations, updates in-memory cache, returns 200.
3. `GET /api/leaderboard` - Queries in-memory array sorted by coin counts.
4. **Test-Only Control Endpoints** (Prefixed with `/__test`):
   - `POST /__test/reset` - Clears all in-memory database records and key-value entries.
   - `POST /__test/seed` - Pre-populates the database with custom states (e.g., custom user coin counts, specific pet vitals) for testing.

### 4.2 Script Configurations for Test Run
To run E2E tests in a single command, we propose a script pipeline:

1. **Install Dependencies**:
   ```bash
   pnpm add -D @playwright/test sirv-cli concurrently
   ```

2. **Package.json Scripts**:
   Configure these scripts in the root `package.json`:
   ```json
   "scripts": {
     "build:frontend": "next build",
     "serve:frontend": "sirv out --port 3000 --single",
     "start:mock-backend": "node backend/dist-test/src/index.js",
     "test:e2e": "concurrently -k -s first \"pnpm serve:frontend\" \"pnpm start:mock-backend\" \"playwright test\""
   }
   ```

3. **Playwright Config File (`playwright.config.ts`)**:
   ```typescript
   import { defineConfig, devices } from '@playwright/test';

   export default defineConfig({
     testDir: './tests',
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 2 : 0,
     workers: process.env.CI ? 1 : undefined,
     reporter: 'html',
     use: {
       baseURL: 'http://localhost:3000',
       trace: 'on-first-retry',
     },
     projects: [
       {
         name: 'chromium',
         use: { ...devices['Desktop Chrome'] },
       },
       {
         name: 'firefox',
         use: { ...devices['Desktop Firefox'] },
       },
       {
         name: 'webkit',
         use: { ...devices['Desktop Safari'] },
       },
     ],
   });
   ```

By implementing this architecture, we decouple the frontend development from the complex Cloudflare KV/D1 production deployments during integration testing, allowing fast, deterministic E2E assertions.

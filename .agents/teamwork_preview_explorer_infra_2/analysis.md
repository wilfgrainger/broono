# Playwright E2E Test Suite Strategy & Architecture for broono.app

This document outlines the end-to-end (E2E) testing strategy, infrastructure setup, and a comprehensive suite of 60 test cases for the broono.app project. It defines how to test the Next.js frontend (designed for Capacitor) and the serverless Cloudflare Workers backend under a mocked local testing environment.

---

## 1. Playwright E2E Test Suite Strategy

To ensure high-fidelity testing of a Tamagotchi-style pet simulation, the test suite must address key testing challenges: time manipulation, offline state transition, API contract validation, economy gating, leaderboard sorting, and social identity normalization.

### Feature 1: Offline Idle Time Calculation & Vital Decay
* **Objective**: Verify that when a user is offline, the elapsed time-delta is calculated and translated into accurate, deterministic vital decay (Hunger, Hydration, Temperature, Happiness) upon returning.
* **Testing Strategy**:
  - **Time Mocking**: Leverage Playwright's native clock APIs (`page.clock`) to manipulate `Date.now()` and timers. This avoids modifying the system clock or introducing slow delays in E2E tests.
  - **Local Storage Injection**: Since the game loops stores state locally, tests will inject state directly into `localStorage` (e.g., `last_sync_time`, `vitals`, `coins`) before navigating to the page.
  - **Asserting Decay**: Simulating hours of offline time by fast-forwarding the clock, then verifying that the UI HUD reflects decayed vitals.

### Feature 2: State Sync & API Validation (POST `/api/pet/sync`)
* **Objective**: Verify that the client synchronizes its local state (with decay calculated) with the backend, and that the backend validates these calculations to prevent cheating.
* **Testing Strategy**:
  - **Mock Server**: Run a local mock API server that receives the `POST /api/pet/sync` payload.
  - **Contract Testing**: Assert that the outgoing payload contains `pet_id`, `vitals`, `coins`, `last_sync_time`, and `client_time` exactly matching the current client state.
  - **Anti-Cheat Validation**: Simulate invalid payloads (e.g., time-deltas representing future time, vitals set to 100 when they should have decayed, coins increased arbitrarily) and assert that the mock backend detects the drift and returns appropriate rejection codes (e.g., `400 Bad Request` or a corrected state payload).

### Feature 3: Shop & Coins Progression
* **Objective**: Verify that players with `< 1000` coins are locked out of the premium shop, and players with `>= 1000` coins can access, browse, and purchase cosmetics/utilities.
* **Testing Strategy**:
  - **Gate Enforcement**: Seed the client with specific coin balances (e.g., 999 vs 1000) and verify the visual lock overlay, disabled buttons, and blocked routing.
  - **Purchase Lifecycle**: Simulating clicking a purchase button, verifying that it sends the correct purchase action to the backend, decrements coins, adds the item to the user's inventory, and applies functional changes (e.g., purchasing Air Conditioning slows down Temperature decay).

### Feature 4: Leaderboard Display
* **Objective**: Verify that the leaderboard correctly displays rankings across three tiers: Global, Country, and Friends & Family.
* **Testing Strategy**:
  - **Data Injection**: Seed the mock backend with varying leaderboard datasets (e.g., users from different countries, matching friend groups).
  - **UI Verification**: Assert that tab switching (Global, Country, Friends & Family) triggers the correct GET requests to `/api/leaderboard?tier=<tier>&country_code=<country>` and renders ranks, usernames, coins, and countries in sorted order.

### Feature 5: JWT Identity Authentication & Auth Normalization
* **Objective**: Verify that the application correctly authenticates users using Supabase Auth JWTs, normalizing social logins (Google, Facebook, Apple) into email-based database keys.
* **Testing Strategy**:
  - **Token Injection**: Intercept auth configurations and mock the Supabase Auth client to return specific JWT tokens (e.g., standard email, social Apple login with proxy email `@privaterelay.appleid.com`).
  - **Headers Check**: Assert that every sync and leaderboard request contains the `Authorization: Bearer <JWT_TOKEN>` header.
  - **Unauthenticated Handling**: Assert that the client handles expired or missing JWT tokens by redirecting users to the login screen and blocking API interactions.

---

## 2. Test Case Catalog (60 Specific Test Cases)

### Tier 1: Feature Coverage (25 Tests)

#### Feature 1: Offline Decay & Hatching Loop
1. **TC-01: Egg Hatching Lifecycle**
   - *Description*: Verify an unhatched egg gains XP from feeding/caring and hatches into a named pet when the XP threshold is reached.
   - *Setup*: Seed state with an unhatched egg at 95/100 XP.
   - *Action*: Interact with egg (e.g., feed once) to cross the 100 XP threshold.
   - *Assertion*: Verify the egg animation changes to a pet hatch animation, a prompt is shown to name the pet, and the state updates with the named pet.
2. **TC-02: Active Game Loop Decay**
   - *Description*: Verify vitals decay gradually while the game is actively running in the foreground.
   - *Setup*: Active pet, all vitals at 100%. Fast-forward clock by 10 minutes.
   - *Action*: Monitor the HUD values.
   - *Assertion*: Vitals (Hunger, Hydration, Happiness) have decreased according to active decay rates (e.g. Hunger from 100 to 98).
3. **TC-03: Offline Idle Time Calculation**
   - *Description*: Verify that when the app is reopened, offline time-delta is calculated and vital decay is applied correctly.
   - *Setup*: App closed. Seed local storage with last sync timestamp set to 4 hours ago.
   - *Action*: Launch the app.
   - *Assertion*: Verify the app calculates a 4-hour offline delta, reduces vitals accordingly, and displays a summary notification (e.g., "Your pet was alone for 4 hours").
4. **TC-04: Environmental Decay Modifiers**
   - *Description*: Verify that different locations (e.g., Starter Village vs Holiday Resort) apply different decay multipliers.
   - *Setup*: Pet in Holiday Resort environment (which decreases Happiness decay by 50%).
   - *Action*: Fast-forward clock by 2 hours.
   - *Assertion*: Happiness has decayed at half the rate of the Starter Village benchmark.
5. **TC-05: Pet Death State Trigger**
   - *Description*: Verify that if Hunger or Hydration reaches 0, the pet dies and the UI transitions to a deceased/revival state.
   - *Setup*: Seed pet with Hunger at 2%.
   - *Action*: Fast-forward clock by 1 hour (forcing hunger to 0).
   - *Assertion*: UI displays a deceased pet notification, locks gameplay actions, and presents a revival/egg-hatch button.

#### Feature 2: State Sync & API Validation
6. **TC-06: Normal Sync Execution**
   - *Description*: Verify client sends state to `/api/pet/sync` and updates local timestamp on success.
   - *Setup*: Authenticated user, pet in normal state.
   - *Action*: Trigger periodic or manual state sync.
   - *Assertion*: A POST request is sent to `/api/pet/sync` with valid vitals, coins, and timestamps. Server responds with 200 OK, and `last_sync_time` is updated.
7. **TC-07: Local Storage Sync Cache (Offline Mode)**
   - *Description*: Verify that when the network is unavailable, state updates are stored in localStorage and queued.
   - *Setup*: Intercept network to return connection failure.
   - *Action*: Play a mini-game to earn 50 coins and trigger sync.
   - *Assertion*: Client UI displays a "cloud out of sync" status, and the updated coin balance (e.g. +50) is stored in localStorage.
8. **TC-08: Server-Side Anti-Cheat: Clock Manipulation Rejection**
   - *Description*: Verify backend rejects client payloads claiming state from the future.
   - *Setup*: Seed local client. Intercept API and mock backend to evaluate calculations.
   - *Action*: Client manipulates system clock to skip 10 days ahead and sends a sync request.
   - *Assertion*: Mock backend detects the impossible future timestamp and returns `400 Bad Request` or overrides the client state with server-authoritative calculations.
9. **TC-09: Server-Side Anti-Cheat: Vitals Manipulation Rejection**
   - *Description*: Verify backend rejects vital values that are higher than possible given the time delta.
   - *Setup*: Last sync was 5 hours ago (vitals should have decayed by 10%).
   - *Action*: Client sends a sync payload with vitals modified to 100% in memory.
   - *Assertion*: Backend rejects payload, forcing the client to restore the server-calculated decayed state.
10. **TC-10: Server-Side Anti-Cheat: Coin Gain Validation**
    - *Description*: Verify backend validates coin updates and rejects illegal increments.
    - *Setup*: User has 100 coins.
    - *Action*: Client sends sync payload claiming 5,000 coins without corresponding mini-game completion proofs.
    - *Assertion*: Backend rejects the sync request or returns an error, preventing coin inflation.

#### Feature 3: Shop & Coins Progression
11. **TC-11: Shop Locked State (< 1000 Coins)**
    - *Description*: Verify the premium shop is inaccessible to users with less than 1,000 coins.
    - *Setup*: Seed wallet with 950 coins.
    - *Action*: Attempt to click the "Premium Shop" button or navigate to `/shop`.
    - *Assertion*: Shop button shows a lock icon, clicking it triggers a "Locked - Need 1,000 Coins" tooltip, and direct navigation redirects back to Pet View.
12. **TC-12: Shop Unlocked State (>= 1000 Coins)**
    - *Description*: Verify shop unlocks immediately when the user crosses the 1,000 coin threshold.
    - *Setup*: Seed wallet with 990 coins.
    - *Action*: Play a mini-game to earn 15 coins (wallet now 1005 coins).
    - *Assertion*: Shop lock icon disappears, clicking it successfully navigates to the shop view.
13. **TC-13: Item Purchase Mechanics**
    - *Description*: Verify purchasing a cosmetic item deducts coins and adds it to the user's inventory.
    - *Setup*: Seed wallet with 1,200 coins. Navigate to Shop.
    - *Action*: Purchase "Penguin Suit" costing 300 coins.
    - *Assertion*: Wallet is decremented to 900 coins, item is marked as "Owned", and inventory API sync request contains the new item.
14. **TC-14: Utility Upgrade Application**
    - *Description*: Verify utility upgrades (e.g. Air Conditioning) apply their modifications to vitals decay.
    - *Setup*: Seed wallet with 2,000 coins.
    - *Action*: Purchase "Air Conditioning" (freezes/reduces temperature decay).
    - *Assertion*: UI shows "Air Conditioning Active", and subsequent clock fast-forwards show temperature vital decays at 0% or greatly reduced rates.
15. **TC-15: Environment Unlock & Background Change**
    - *Description*: Verify unlocking a new environment updates the UI theme and pet backdrop.
    - *Setup*: Seed wallet with 2,500 coins.
    - *Action*: Purchase and equip "Holiday Resort" environment.
    - *Assertion*: UI theme elements and background image update, and the new environment ID is persisted in the sync payload.

#### Feature 4: Leaderboards
16. **TC-16: Global Leaderboard Retrieval**
    - *Description*: Verify the Global Leaderboard displays the overall top players sorted by coins.
    - *Setup*: Seed mock backend database with 5 distinct users.
    - *Action*: Open Leaderboards and select "Global" tab.
    - *Assertion*: Leaderboard shows the 5 users ordered by coin count (descending), indicating their ranks, usernames, coins, and countries.
17. **TC-17: Country Leaderboard Filtering**
    - *Description*: Verify the Country Leaderboard displays only users matching the current user's country code.
    - *Setup*: Seed backend with users from US, CA, and UK. Current user is registered in CA.
    - *Action*: Open Leaderboards and select "Country" tab.
    - *Assertion*: Leaderboard displays only CA users, sorted by coins. API request includes `tier=country&country_code=CA`.
18. **TC-18: Friends & Family Leaderboard Filtering**
    - *Description*: Verify the Friends tier shows only linked friends of the authenticated user.
    - *Setup*: Seed authenticated user and their friends list.
    - *Action*: Open Leaderboards and select "Friends" tab.
    - *Assertion*: Leaderboard displays only the authenticated user and their seeded friends, sorted by coins.
19. **TC-19: Leaderboard Live Updates Post-Sync**
    - *Description*: Verify a user's leaderboard rank update immediately propagates when they earn coins and sync.
    - *Setup*: User is ranked #3 on the local leaderboard.
    - *Action*: Play mini-game, earn 500 coins, sync state.
    - *Assertion*: Re-entering the leaderboard displays the user's rank updated (e.g., moved up to #2) with their new coin balance.
20. **TC-20: User Rank Highlight**
    - *Description*: Verify that the current user's entry is visually highlighted in the leaderboard lists.
    - *Setup*: Authenticated user is present in global ranks.
    - *Action*: Scroll through the Global Leaderboard.
    - *Assertion*: The current user's row displays with a distinct class or style (e.g., `bg-primary-100` or a border highlight).

#### Feature 5: JWT Auth & Normalization
21. **TC-21: Email/Password Authentication Flow**
    - *Description*: Verify registration and login using email/password produces a valid token.
    - *Setup*: User navigates to Auth screen.
    - *Action*: Enter email and password, click Log In.
    - *Assertion*: Supabase mock returns a JWT containing the user's email, which is stored in memory/secure storage, and the app routes to the Pet View.
22. **TC-22: Google OAuth Normalization**
    - *Description*: Verify Google login payloads normalize to the standard email key structure.
    - *Setup*: Click "Sign in with Google".
    - *Action*: Complete the mock Google authentication flow.
    - *Assertion*: Supabase normalizes the user data into a JWT with the primary email. The client forwards this token to the Worker, which maps it successfully.
23. **TC-23: Apple OAuth Normalization (Standard Email)**
    - *Description*: Verify standard Apple login with shared email normalizes correctly.
    - *Setup*: Click "Sign in with Apple".
    - *Action*: Complete Apple mock authentication, opting to share email.
    - *Assertion*: JWT containing standard Apple-registered email is issued, verified, and parsed by the Worker.
24. **TC-24: Apple OAuth Normalization (Proxy Private Email)**
    - *Description*: Verify Apple login with "Hide My Email" proxy address is handled gracefully.
    - *Setup*: Click "Sign in with Apple".
    - *Action*: Complete Apple mock authentication, opting to hide email.
    - *Assertion*: Supabase/Apple issues a JWT containing a proxy email (e.g., `user@privaterelay.appleid.com`). The Worker accepts this as a valid unique identifier and creates the user profile without error.
25. **TC-25: Token Expiration & Re-Auth Redirect**
    - *Description*: Verify that if a JWT is expired, API requests return 401 and the client forces a logout.
    - *Setup*: Force mock JWT to have an expired token timestamp.
    - *Action*: Trigger a pet sync.
    - *Assertion*: The Worker responds with `401 Unauthorized`. The client intercepts this status, clears local session data, and redirects the user to the login screen.

---

### Tier 2: Boundary & Edge Cases (25 Tests)

#### Feature 1: Offline Decay & Hatching Loop
26. **TC-26: Vitals Ceiling Clamping (100.0%)**
    - *Description*: Verify that feeding or caring for a pet cannot push vitals beyond 100.0%.
    - *Setup*: Hunger at 98.0%.
    - *Action*: Feed pet with food that normally restores +10% Hunger.
    - *Assertion*: Hunger is clamped exactly at 100.0%, rather than overflowing to 108.0%.
27. **TC-27: Vitals Floor Clamping (0.0%)**
    - *Description*: Verify vitals clamp at 0.0% and do not become negative numbers.
    - *Setup*: Hunger at 1.0%.
    - *Action*: Fast-forward clock by 12 hours (exceeding decay capacity).
    - *Assertion*: Hunger is clamped exactly at 0.0%, preventing NaN or negative value errors in the client or sync payload.
28. **TC-28: Zero Time-Delta Sync**
    - *Description*: Verify that consecutive rapid page loads or sync requests do not trigger decay calculations.
    - *Setup*: Open page, record vitals.
    - *Action*: Instantly reload the page (time-delta = 0).
    - *Assertion*: Vitals remain completely unchanged; no division by zero or NaN values occur during calculations.
29. **TC-29: Extreme Time-Delta (Long Absence)**
    - *Description*: Verify that a long offline gap (e.g., 6 months) degrades all vitals to 0.0% but does not crash calculations.
    - *Setup*: Seed last sync timestamp to 6 months ago.
    - *Action*: Launch the app.
    - *Assertion*: Vitals are clamped to 0.0% (dead/starving state), and the app loads the state cleanly without overflow errors.
30. **TC-30: Location Transition Boundary Decay**
    - *Description*: Verify decay calculations are computed dynamically based on the exact time spent in each location during a sync.
    - *Setup*: User changes location, which alters decay rates.
    - *Action*: Simulate offline time spanning a location change event.
    - *Assertion*: The total applied decay correctly reflects the sum of time spent in each location under their respective decay rules.

#### Feature 2: State Sync & API Validation
31. **TC-31: Permitted Clock Drift Tolerance**
    - *Description*: Verify the server tolerates minor client clock drift (e.g., up to 2 minutes) without rejecting the sync request.
    - *Setup*: Backend server set to time T.
    - *Action*: Client sends sync request with client time set to T + 90 seconds.
    - *Assertion*: Server accepts the sync request as normal drift and processes the state.
32. **TC-32: Rapid Multi-Click Concurrent Sync Requests**
    - *Description*: Verify rapid concurrent sync requests are handled idempotently or queue correctly to prevent double coin collection.
    - *Setup*: UI with a sync button or mini-game reward claim.
    - *Action*: Rapidly double-click/triple-click the reward/sync button.
    - *Assertion*: The client fires requests, but the server processes only the first transaction, returning conflict responses (or idempotent success) for subsequent requests without duplicating coin values.
33. **TC-33: Corrupted or Missing Payload Fields**
    - *Description*: Verify the API responds with `400 Bad Request` if mandatory fields are omitted.
    - *Setup*: Authenticated user.
    - *Action*: Send a POST to `/api/pet/sync` missing the `vitals` object or `client_time`.
    - *Assertion*: Backend returns `400 Bad Request` with validation error messages, and does not update KV/D1.
34. **TC-34: Backend Storage Outage Resilience**
    - *Description*: Verify client remains operational if D1 or KV experiences a write failure.
    - *Setup*: Mock backend is configured to simulate D1 database write failure (500 Internal Server Error).
    - *Action*: Play mini-game and trigger sync.
    - *Assertion*: UI shows "Sync Failed - Saved Locally", letting the user continue playing locally with cached changes.
35. **TC-35: Retroactive Multiple offline Session Sync**
    - *Description*: Verify the client can queue and batch sync multiple separate offline sessions compiled during internet downtime.
    - *Setup*: Disconnect network. Simulate session 1 (decay, feed), session 2 (decay, earn 50 coins).
    - *Action*: Reconnect network and trigger sync.
    - *Assertion*: The client sends the net accumulated changes, which are verified and accepted by the server.

#### Feature 3: Shop & Coins Progression
36. **TC-36: Coin Threshold Boundary (999 vs 1000 Coins)**
    - *Description*: Verify the shop unlocks exactly at 1000 coins and remains locked at 999 coins.
    - *Setup*: Seed wallet with 999 coins.
    - *Action*: Check shop state, then add exactly 1 coin and check again.
    - *Assertion*: At 999 coins, shop remains locked. At 1000 coins, the shop instantly transitions to unlocked.
37. **TC-37: Server-Side Coin Balance Gate Verification**
    - *Description*: Verify the backend blocks shop purchase attempts if the database shows insufficient coins, even if the client tries to bypass UI locks.
    - *Setup*: DB registers 500 coins. Client-side memory is manipulated to show 2,000 coins.
    - *Action*: Attempt to purchase a 1,000-coin item.
    - *Assertion*: Server validates transaction against DB balance, rejects the request with `403 Forbidden` (Insufficient Funds), and does not update inventory.
38. **TC-38: Inventory Capacity Check (Duplicate Uniques)**
    - *Description*: Verify that unique items (like specific backgrounds or character skins) cannot be purchased more than once.
    - *Setup*: User already owns "Penguin Suit".
    - *Action*: Attempt to buy "Penguin Suit" again.
    - *Assertion*: Purchase button is disabled or reads "Owned", and direct API requests to purchase return `409 Conflict`.
39. **TC-39: Cheat Attempt: Custom Client-Side Item Prices**
    - *Description*: Verify the server ignores custom prices sent in the client purchase payload and applies server-configured catalog prices.
    - *Setup*: "Cat Ears" costs 500 coins in DB.
    - *Action*: Client sends purchase payload specifying price `1 coin` for "Cat Ears".
    - *Assertion*: Server rejects the request or overrides price with catalog price (500 coins), deducting 500 coins from user's account.
40. **TC-40: Mini-Game Rate Limiting (Coin Earning Speedrun)**
    - *Description*: Verify server rejects mini-game coin awards if submitted at physically impossible frequencies.
    - *Setup*: User finishes mini-game.
    - *Action*: Send 10 mini-game completion logs within 1 second.
    - *Assertion*: Server rate-limiter triggers, rejecting the subsequent completions and flagging potential exploit activity.

#### Feature 4: Leaderboards
41. **TC-41: Leaderboard Rank Tie-Breaker Resolution**
    - *Description*: Verify ranks are sorted secondary-wise (e.g., date of registration or username alphabetical order) when coin totals match.
    - *Setup*: Seed 3 users with exactly 1500 coins.
    - *Action*: Retrieve the leaderboard.
    - *Assertion*: Ranks are assigned sequentially (1, 2, 3) using deterministic sorting criteria without skipping ranks.
42. **TC-42: Empty Country Leaderboard State**
    - *Description*: Verify requesting country rankings with no active users returns an empty list gracefully.
    - *Setup*: Clean database. Current user country is set to "AQ" (Antarctica).
    - *Action*: Select "Country" tab.
    - *Assertion*: Leaderboard handles empty results array from `/api/leaderboard?tier=country&country_code=AQ` without crashing, displaying "No rankings available for Antarctica".
43. **TC-43: High Coin Balance Leaderboard Formatting**
    - *Description*: Verify coin counts in the millions do not break the leaderboard table layout.
    - *Setup*: Seed user with `9,999,999` coins.
    - *Action*: View leaderboard.
    - *Assertion*: Renders large numbers cleanly (formatted with commas or abbreviations like "9.9M") and does not overflow text containers.
44. **TC-44: Invalid Country Code Query Param Handling**
    - *Description*: Verify requesting invalid country codes returns an error or fallback response instead of a crash.
    - *Setup*: Send manual request to `/api/leaderboard?tier=country&country_code=XYZ`.
    - *Action*: Evaluate response.
    - *Assertion*: Server responds with `400 Bad Request` or defaults to global tier, and does not throw server exceptions.
45. **TC-45: Leaderboard Listing with Missing User Country**
    - *Description*: Verify users registered without a country code do not crash the leaderboard render.
    - *Setup*: User profile in D1 has `country = NULL`.
    - *Action*: View Global Leaderboard.
    - *Assertion*: Renders row successfully, showing a placeholder flag or blank country text.

#### Feature 5: JWT Auth & Normalization
46. **TC-46: Malformed Authorization Header Handling**
    - *Description*: Verify API rejects invalid Auth header patterns (e.g., basic auth, missing scheme, etc.).
    - *Setup*: Send GET `/api/leaderboard?tier=global`.
    - *Action*: Pass `Authorization: Basic YWxpY2U6c2VjcmV0` or `Authorization: Bearer`.
    - *Assertion*: Worker returns `401 Unauthorized` with clear explanation.
47. **TC-47: Token Tampering / Signature Forgery**
    - *Description*: Verify backend rejects tokens with valid payload structure but invalid cryptographic signatures.
    - *Setup*: Generate standard JWT token for `user@example.com`, alter the signature block.
    - *Action*: Send sync request with tampered token.
    - *Assertion*: Worker rejects request with `401 Unauthorized`.
48. **TC-48: Apple Proxy Email SQL Injection Sanity**
    - *Description*: Verify that private relay emails containing symbols and hyphens are escaped to prevent SQL injection in D1.
    - *Setup*: Authenticate with Apple proxy: `abc.123-xyz_df@privaterelay.appleid.com`.
    - *Action*: Play and sync pet state.
    - *Assertion*: SQL query safely executes, inserting/updating the user in D1.
49. **TC-49: Unified Auth Provider Linking**
    - *Description*: Verify that linking multiple auth providers (e.g. Google and Facebook) with the same email returns the same database record.
    - *Setup*: User registers via Google with `user@example.com`.
    - *Action*: Later, user logs in via Facebook with `user@example.com`.
    - *Assertion*: The Supabase token yields the same normalized email, retrieving the same pet state from D1.
50. **TC-50: Active Session Token Expiry / Refresh**
    - *Description*: Verify client refreshes token automatically when token expires during gameplay.
    - *Setup*: Set token expiry to 10 seconds.
    - *Action*: Play game for 20 seconds, executing periodic syncs.
    - *Assertion*: Client intercepts impending expiry, calls Supabase refresh token API, and continues syncing with new token without interrupting gameplay.

---

### Tier 3: Cross-Feature Combinations (5 Tests)

51. **TC-51: Sick Pet Mini-Game Lockout**
    - *Description*: Verify that neglecting a pet causing it to become sick locks the player out of mini-games (curtailing coin generation).
    - *Setup*: Simulate 24 hours of offline decay, dropping Happiness and Hunger to <10% (triggering "Sick" state).
    - *Action*: Try to click the "Start Mini-Game" button.
    - *Assertion*: Button is disabled, showing a tooltip "Your pet is too sick to play! Feed or heal it first."
52. **TC-52: Utility Purchase Decays Mitigation**
    - *Description*: Verify that purchasing and activating a utility item in the shop changes the offline decay calculations when simulated.
    - *Setup*: Purchase "Air Conditioning" (freezes Temperature decay) and "Automatic Waterer" (reduces Hydration decay by 75%).
    - *Action*: Simulate 12 hours offline.
    - *Assertion*: Hunger and Happiness decayed normally, but Temperature remains at 37.0°C and Hydration has decayed by only 25% of standard rate.
53. **TC-53: Coin Reward Path to Shop Unlock**
    - *Description*: Verify that completing a mini-game that awards the 1,000th coin triggers an in-game alert and unlocks shop access without refreshing the app.
    - *Setup*: User has 980 coins.
    - *Action*: Play a mini-game, scoring enough to earn 30 coins. Return to main dashboard.
    - *Assertion*: Coin counter increases to 1010, an animation plays showing the shop lock breaking, and the Shop button is immediately clickable.
54. **TC-54: Sync Transaction Integrity**
    - *Description*: Verify shop purchases, coin balances, and vitals sync atomically to prevent client rollback.
    - *Setup*: User has 1200 coins.
    - *Action*: Buy "Cat Ears" for 500 coins (coins become 700), feed pet (+10% Hunger), then disconnect network immediately before sync completes.
    - *Assertion*: When connection resumes, a single atomic sync payload carrying modified inventory (adds Cat Ears), modified coins (700), and modified vitals is processed. Server verifies balance matches purchase history and commits to D1.
55. **TC-55: Social Board Creation & Validation**
    - *Description*: Verify a newly registered user using a social login proxy email can earn coins, sync, and instantly view their rank on the leaderboards.
    - *Setup*: Fresh Apple login generating proxy email `anon-728@privaterelay.appleid.com`.
    - *Action*: Hatch pet, play mini-game (earn 150 coins), sync, and load Global Leaderboard.
    - *Assertion*: Leaderboard displays the proxy profile (or designated username) positioned correctly relative to other players.

---

### Tier 4: Real-World Scenarios (5 Tests)

56. **TC-56: Flight Mode Scenario**
    - *Description*: Simulate a user playing while offline (e.g., on a flight), earning coins and caring for the pet, then reconnecting to sync.
    - *Setup*: Disconnect network (simulate airplane mode).
    - *Action*: Fast-forward clock 3 hours (vitals decay locally). Feed pet (using local stock). Play 2 mini-games (earn 300 coins). Reconnect network.
    - *Assertion*: The client queues all local events. Upon reconnecting, the sync payload containing the updated vitals, inventory updates, and coin balance (+300) is sent. The server accepts the state.
57. **TC-57: Neglected Pet and Revival Recovery**
    - *Description*: Simulate a user forgetting the app for 5 days, returning to find a deceased pet, buying a revival item/egg, and restarting.
    - *Setup*: Seed last sync to 5 days ago.
    - *Action*: Launch the app. Accept the pet death notification. Go to the shop, purchase "Phoenix Feather" revival item (or select "Hatch New Egg"), and trigger a hatch.
    - *Assertion*: Pet state transitions to "Hatching", old pet data is archived, and new pet lifecycle begins. Vitals reset to defaults.
58. **TC-58: Multi-Device Sync Conflict Resolution**
    - *Description*: Verify that if a user plays on Device A, then opens Device B, Device B detects its local cache is stale and overwrites it with the backend state.
    - *Setup*: Device A syncs state showing 2000 coins, pet is Happy. Device B has an old cached state showing 500 coins, pet is Hungry.
    - *Action*: Open Device B under the same user login.
    - *Assertion*: Device B sends a sync check. The backend responds with the authoritative state (2000 coins, Happy). Device B overwrites its local storage and updates the UI accordingly.
59. **TC-59: High Latency / Flaky Connection Sync**
    - *Description*: Verify the client handles intermittent timeouts and duplicates requests safely.
    - *Setup*: Configure network throttling to simulate 5000ms latency and 40% packet loss.
    - *Action*: Complete mini-game and sync.
    - *Assertion*: Client UI displays a "Syncing..." status. If requests timeout, the client retries, and the server deduplicates the retry using request sequence numbers or timestamps.
60. **TC-60: Social Auth Re-Linking & State Retention**
    - *Description*: Verify a user logging in from a different device using a different login method linked to the same email retrieves the identical pet profile.
    - *Setup*: User profile linked to `john.doe@example.com` via Google.
    - *Action*: Log out. Log in using Apple Auth sharing the same email `john.doe@example.com`.
    - *Assertion*: Next.js App contacts Supabase, receives normalized email, sends to Worker. Worker retrieves the exact same profile, loading their existing pet and progress.

---

## 3. Frontend & Playwright Interaction Architecture

To facilitate clean, robust E2E tests, the Next.js frontend build must expose appropriate hooks, identifiers, and configuration mechanisms.

### Data Attributes for Playwright Selectors
Production and development builds must include stable `data-testid` attributes on critical interactive elements:
* **Vitals Dashboard**: `data-testid="hud-hunger"`, `data-testid="hud-hydration"`, `data-testid="hud-temperature"`, `data-testid="hud-happiness"`
* **Pet Status**: `data-testid="pet-egg"`, `data-testid="pet-hatched"`, `data-testid="pet-dead"`, `data-testid="pet-name-display"`
* **Action Buttons**: `data-testid="btn-feed"`, `data-testid="btn-water"`, `data-testid="btn-play-game"`, `data-testid="btn-sync"`
* **Shop Elements**: `data-testid="shop-locked-overlay"`, `data-testid="shop-item-penguin-suit"`, `data-testid="btn-buy-air-con"`, `data-testid="wallet-balance"`
* **Leaderboards**: `data-testid="leaderboard-tab-global"`, `data-testid="leaderboard-row-0"`, `data-testid="leaderboard-row-username"`, `data-testid="leaderboard-empty"`
* **Auth Elements**: `data-testid="auth-email-input"`, `data-testid="btn-google-login"`, `data-testid="btn-apple-login"`

### Game Clock & Time Manipulation
Instead of custom time-mocking hooks in production code, Playwright's native `page.clock` should be used.
* **Mechanism**: Playwright mocks global `Date` and `performance.now`.
* **Frontend Implementation**: The Next.js game loop must rely exclusively on `Date.now()` (or standard JavaScript timers) to compute time-deltas. Do not use server-time sync offsets that bypass local browser dates, ensuring Playwright's clock modifications directly control the local game time.
* **Testing Time Jumps**:
  ```typescript
  // Playwright Test Snippet Example
  await page.clock.setFixedTime(new Date('2026-07-04T12:00:00Z'));
  await page.goto('/');
  // Fast forward 4 hours
  await page.clock.fastForward('04:00:00');
  // Playwright automatically advances browser timers and Date.now()
  ```

### API Configurable Base URL
The client API client (e.g., Axios or fetch wrappers) must fetch its endpoint base URL from an environment variable:
* `process.env.NEXT_PUBLIC_API_URL`
* In production, this defaults to the Cloudflare Worker routing.
* In Playwright test builds, it is set to `http://localhost:8788` (the port of the mocked backend server).

---

## 4. Mocked Backend API Infrastructure

To execute independent frontend E2E tests without relying on a live Cloudflare Worker or Supabase deployment, a dedicated Mock Backend API is required.

### Setup Architecture
* **Technology**: A fast, lightweight TypeScript server running Hono (compiled via `tsx` or `ts-node`), matching the routing structure of the real backend worker.
* **Launch Mechanism**: Run alongside the Next.js dev server during E2E runs.
  ```json
  // Proposed package.json scripts
  "scripts": {
    "test:e2e:mock": "tsx ./tests/mock-backend/server.ts",
    "test:e2e:run": "playwright test",
    "test:e2e": "start-server-and-test dev http://localhost:3000 test:e2e:mock http://localhost:8788 test:e2e:run"
  }
  ```

### Control Endpoints (Seeding and Verifying State)
The mock backend will expose a secret prefix `/__control/*` allowing the Playwright test suite to seed state and verify database assertions.
* `POST /__control/seed-user`: Seeds D1 and KV mock caches with specific pet state, coins, and country.
* `GET /__control/get-state?email=xxx`: Returns the current stored database state for validation.
* `POST /__control/reset`: Resets all mock databases to clean states.

#### Mock Server Architecture Sketch:
```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";

const mockApp = new Hono();
mockApp.use("/*", cors({ origin: "http://localhost:3000" }));

// Mock Databases in Memory
let mockUsers = new Map();
let mockKV = new Map();

// Control API
mockApp.post("/__control/seed-user", async (c) => {
  const { email, petState, coins, country } = await c.req.json();
  mockUsers.set(email, { email, coins, country, petState });
  mockKV.set(`pet:${email}`, petState);
  return c.json({ status: "seeded" });
});

// Mocked Game API
mockApp.post("/api/pet/sync", async (c) => {
  // Decode JWT, bypass verification for mock test
  const authHeader = c.req.header("Authorization");
  const email = decodeMockJWT(authHeader); 
  
  const body = await c.req.json();
  
  // Anti-cheat verification logic
  const serverTime = Math.floor(Date.now() / 1000);
  const timeDelta = body.client_time - body.last_sync_time;
  
  if (timeDelta < 0 || body.client_time > serverTime + 120) {
    return c.json({ status: "error", error: "Clock manipulation detected" }, 400);
  }
  
  // Calculate authoritative decay
  const currentKV = mockKV.get(`pet:${email}`);
  const expectedHunger = calculateDecay(currentKV.hunger, timeDelta);
  
  if (body.vitals.hunger > expectedHunger + 0.1) { // 0.1 buffer
    return c.json({ status: "error", error: "Vitals decay manipulation detected" }, 400);
  }
  
  // Save & Return
  mockKV.set(`pet:${email}`, body.vitals);
  return c.json({ status: "success", vitals: body.vitals, coins: body.coins });
});
```

### JWT Verification Mocking
* During test runs, the mock backend will decode JWTs using a helper that reads the token payload without making external calls to Supabase.
* This allows tests to pass raw JSON strings encoded as JWTs (e.g. using a simple base64 signature mock), providing complete independence from Supabase availability.

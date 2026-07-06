# Original User Request

## Initial Request — 2026-07-04T16:38:16Z

Build the beta version of a Tamagotchi-style mobile pet simulation game named "broono.app", featuring a Next.js frontend (wrapped for mobile via Capacitor) and a serverless Cloudflare Workers backend.

Working directory: c:\Users\wilf6\dev\broono
Integrity mode: demo

## Requirements

### R1. Frontend UI and Local Game Loop
Implement a Next.js (Static Export) frontend featuring a local game loop that calculates vital decay (Hunger, Hydration, Temperature, Happiness) based on offline time-deltas. Include a Pet View, a Shop (unlocking at 1,000 coins), and a tiered Leaderboard UI.

### R2. Backend API and State Validation
Implement a Cloudflare Worker REST API to authenticate users, securely validate the client's time delta / vital decay calculations, and synchronize the pet state to Cloudflare KV and D1.

### R3. Authentication and Data Models
Integrate an identity provider (like Supabase Auth) to normalize Google/Facebook/Apple logins into a single email-based database key. Create NoSQL/SQL schemas for User, Pet, and Inventory entities, optimizing leaderboard retrieval across Global, Country, and Friends & Family tiers.

## Acceptance Criteria

### E2E Testing with Playwright
- [ ] A Playwright test suite is provided in the repository that spins up the Next.js frontend and a mocked Cloudflare Worker backend.
- [ ] Playwright tests successfully verify that simulating offline idle time results in the correct calculation of vital decays on the frontend.
- [ ] Playwright tests successfully verify that the frontend correctly synchronizes the degraded vitals with the mocked backend API, and the backend accepts the state correctly.
- [ ] Playwright tests successfully assert that a user with less than 1,000 coins cannot access the shop.

# Broono Implementation Plan

## Purpose
This planning document keeps execution aligned with the product and technical steering documents. It should be updated as the team learns, but the default plan is to protect Broono's mobile-only Tamagotchi vision, Cloudflare free-tier architecture, Google/Apple auth parity, Capacitor Android/iOS delivery, and mocked payments until store IAP credentials are available.

## Phase 0: Foundations
- Confirm React client builds cleanly as a static bundle suitable for Cloudflare Pages.
- Confirm Capacitor Android and iOS project setup and document local build commands.
- Establish environment naming for local, staging, and production.
- Define provider interfaces for auth, payments, storage, and API access before wiring real services.
- Keep all product-critical flows usable with mocked auth and mocked payments.

## Phase 1: Core Pet Loop
- Implement free egg onboarding in the village home.
- Add pet state for Hunger, Hydration, Temperature, and Happiness.
- Add timestamp-based stat decay and care actions.
- Hatch eggs into random named animals.
- Persist local state first if needed, then sync to Worker/D1 when backend routes are ready.

## Phase 2: Economy and Mini-Games
- Add a validated coin model.
- Build the first educational word mini-game.
- Award coins through server-validated mini-game results where possible.
- Add basic cosmetics or utility upgrades purchasable with coins.
- Add destination unlock scaffolding.

## Phase 3: Cloudflare Backend
- Add Workers REST endpoints for profile, pet state, care actions, inventory, mini-game rewards, leaderboards, auth mocks, and purchase mocks.
- Add D1 migrations for users, pets, inventory, currencies, destinations, mini-games, leaderboards, and entitlements.
- Add KV-backed configuration or cache only where it reduces cost or latency without risking authoritative state.
- Add validation and tests for all currency, inventory, entitlement, and leaderboard mutations.

## Phase 4: Auth Parity
- Implement mocked Google and Apple sign-in with equal prominence in every relevant UI.
- Mark mock identities in persisted data.
- Prepare real OAuth integration behind the same provider interface.
- Do not launch a Google-only auth experience.

## Phase 5: Payment Mocking and IAP Readiness
- Implement mocked purchase catalog, purchase success/failure/cancel, entitlement grant, and restore flows.
- Keep MVP progression independent of real-money purchases.
- Prepare a platform-aware entitlement model for future Google Play Billing and Apple StoreKit receipt validation.
- Do not enable real payments until store credentials, product definitions, and review-ready flows exist.

## Phase 6: Leaderboards and Social
- Add Global, Country, and Friends & Family leaderboard scopes.
- Keep display privacy-conscious and avoid exposing unnecessary personal data.
- Validate all submitted scores server-side.
- Add abuse-resistant scoring and replay controls as mini-games mature.

## Ongoing Definition of Done
- Phone viewport behavior checked for user-facing changes.
- Android and iOS parity considered for every mobile feature.
- Cloudflare free-tier compatibility preserved.
- Google/Apple auth parity preserved.
- Payment behavior remains mocked unless store IAP readiness has been explicitly completed.
- Product changes continue to support a cozy, safe daily pet-care loop.

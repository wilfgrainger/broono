## 2026-07-04T16:44:00Z
You are teamwork_preview_explorer. Your working directory is c:\Users\wilf6\dev\broono\.agents\teamwork_preview_explorer_infra_2.
Your task is to analyze the broono.app project and propose a detailed test planning and infrastructure setup for a Playwright E2E test suite.
1. Read ORIGINAL_REQUEST.md, requirements.md, technical-steering.md, and c:\Users\wilf6\dev\broono\.agents\orchestrator\PROJECT.md.
2. Formulate the Playwright E2E test suite strategy that targets 5 main features:
   - Feature 1: Offline idle time calculation & Vital Decay (Hunger, Hydration, Temperature, Happiness).
   - Feature 2: State Sync & API Validation (POST /api/pet/sync).
   - Feature 3: Shop & Coins Progression (locked/unlocked at 1000 coins).
   - Feature 4: Leaderboard Display (Global, Country, Friends & Family tiers).
   - Feature 5: JWT Identity Authentication & Auth normalization.
3. Design 60 specific test cases across the 4 tiers:
   - Tier 1: Feature Coverage (5 per feature = 25 tests)
   - Tier 2: Boundary & Edge Cases (5 per feature = 25 tests)
   - Tier 3: Cross-Feature Combinations (5 tests)
   - Tier 4: Real-World Scenarios (5 tests)
4. Propose how the Next.js frontend placeholder/build should be structured to interact with Playwright and the mocked backend, and how the mocked backend API should be run.
5. Write your detailed analysis and recommendations to c:\Users\wilf6\dev\broono\.agents\teamwork_preview_explorer_infra_2\analysis.md and handoff.md. Do not write any source code directly. Send a completion message when done.

# Broono

Broono is a mobile-first GLP-1 tracking companion for weight progress, dose timing, hydration, protein goals, symptoms and private notes.

The product uses one React codebase for the phone-focused web experience and the Capacitor Android application. Health and journal data are stored locally on the user's device; the backend stores only the account and subscription records needed for authentication and Google Play billing.

> Broono is a personal tracking companion, not a medical device and not a substitute for professional medical advice.

## Current architecture

| Area | Technology | Production path |
| --- | --- | --- |
| Web and shared app UI | React 19, TypeScript, Vite | GitHub Pages at `broono.app` |
| Android wrapper | Capacitor 8 | Android package `app.broono.android` |
| API | Hono on Cloudflare Workers | `api.broono.app` |
| Account and waitlist data | Cloudflare D1 | Bound to the API Worker |
| Authentication | Google Sign-In | ID-token audience validation in the Worker |
| Billing | Google Play Billing | Server-side purchase verification and RTDN handling |

The frontend and API are deliberately separate deployments. The root build creates a static `dist/` directory for GitHub Pages; Wrangler is used only inside `backend/`.

## Local development

### Prerequisites

- Node.js 22
- pnpm 10
- Wrangler, installed through the backend package

### Install

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
```

### Run the frontend

```bash
pnpm dev
```

The public early-access page is available at `http://localhost:5173/waitlist`.

### Run the API

```bash
pnpm --dir backend dev
```

By default the frontend expects the local API at `http://localhost:8787`. Override this with `VITE_API_URL` when needed.

## Quality checks

```bash
pnpm run test:frontend
pnpm run test:backend
pnpm run build
```

The pull-request workflow installs both lockfiles, runs frontend and backend regression tests, builds the static site, and validates the custom-domain and legacy-service-worker retirement files. A push to `main` deploys the verified frontend artifact to GitHub Pages.

## Configuration

### Frontend build variables

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_ANDROID_CLIENT_ID`
- `VITE_REVIEW_GOOGLE_EMAIL` for an optional store-review hint

### Worker bindings and secrets

- `DB`
- `FRONTEND_URL`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_ANDROID_CLIENT_ID`
- `GOOGLE_AUTH_ALLOWED_EMAILS` when access must be restricted
- `GOOGLE_PLAY_PACKAGE_NAME`
- `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`
- `GOOGLE_PLAY_WEBHOOK_TOKEN`

See `docs/PRODUCTION_HOSTING.md`, `docs/mobile_launch_strategy.md` and `GOOGLE_PLAY_SETUP.md` for release-specific detail.

## Privacy model

The application keeps weight entries, medication settings, symptoms, hydration, goals and journal entries in local device storage. The backend stores the Google account email, subscription status and Google Play billing reference required to operate authenticated paid access. Early-access submissions store the supplied name, email and optional product feedback.

Do not introduce server-side health-data persistence without a separate privacy, security, migration and consent design review.

## Contributing and security

Read `CONTRIBUTING.md` before proposing a change. Please report security vulnerabilities through GitHub's private vulnerability reporting rather than a public issue; see `SECURITY.md`.

## Licence status

No software licence has been selected yet. Public repository visibility alone does not grant permission to copy, modify or redistribute the code. Selecting an open-source licence is an explicit owner decision still required before the project can accurately be described as open source.

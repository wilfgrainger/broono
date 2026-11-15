# Broono

Broono is a mobile-first, local-only GLP-1 tracking companion for weight progress, dose timing, hydration, goals, symptoms and private notes.

## Features

- **Injections**: log site and dose (standard pen strengths as quick picks, any dose typed), with the least-recently-used of six sites suggested for rotation.
- **Next dose and estimated level**: the next scheduled dose, and an estimated relative medication level built from logged injections (one-compartment model using label half-life and time to peak), with the coming week projected.
- **Weight**: kilograms, pounds, or stones and pounds; trend chart with start and goal lines, % lost, weekly rate, BMI, and 5–25% milestones.
- **Dose history**: titration steps from logged injections.
- **Side effects**: multi-select per log, with frequency over recent logs.
- **Daily targets**: protein and water counters that reset at local midnight.
- **Guide**: missed-dose window for the chosen medicine and self-care notes from the patient leaflets, with when to seek urgent help.
- **Reminders**: a weekly `.ics` calendar event, so the user's calendar does the reminding without any server or notification permission.
- **Data**: JSON backup and validated restore, CSV export for spreadsheets, printable clinician summary, local erase.
- **Platform**: light and dark themes (system or pinned), installable web app, browser and Android back navigation between tabs.

There is no Broono account, authentication service, application API, remote database, analytics tracker or paid feature gate. The web and Android editions run from the same React codebase and store user-entered data on the device.

> Broono is a personal tracking companion, not a medical device and not a substitute for professional medical advice.

## Architecture

| Area | Technology | Boundary |
| --- | --- | --- |
| User interface | React 19, TypeScript, Vite | Runs in the browser or Capacitor WebView |
| Local state | Zustand persistence | Browser/app local storage only |
| Web hosting | GitHub Pages | Delivers static application files at `broono.app` |
| Android wrapper | Capacitor 8 | No internet or billing permission |
| Backend | None | No Worker, API or server-side application data |
| Database | None | No D1 or other remote application database |
| Accounts and payments | None | All current features are available locally |

The production document includes a Content Security Policy with `connect-src 'none'`, preventing the application from opening runtime API connections. The release workflow also fails if backend, API, Google Auth, billing or D1 markers return.

## Local development

### Prerequisites

- Node.js 22
- pnpm 10

### Install and run

```bash
pnpm install --frozen-lockfile
pnpm dev
```

### Test and build

```bash
pnpm test
pnpm run build
pnpm run test:e2e
```

The end-to-end tests exercise local onboarding, unrestricted Progress and Journal features, data export and local erasure without starting a backend server.

## Data model

The following information is kept in local browser or app storage:

- setup status and tracker preferences;
- medication name, dose, injection day, reminder time and treatment start date;
- goal weight and optional height (for BMI);
- logs: weight, injection site and dose, side effects and notes;
- journal entries;
- hydration and protein totals for the day, and personal goals.

The web edition is installable (web app manifest and icons in `public/`). Settings provides a JSON export, an import that restores a previous export after validating it, and a control to erase all Broono data from the current device. There is no automatic cloud backup or cross-device sync.

## Deployment

A push to `main` runs `.github/workflows/deploy-broono-pages.yml`, which:

1. installs the committed dependency graph;
2. runs the frontend and local-only architecture tests;
3. builds the static application;
4. verifies the local-only CSP and build marker;
5. checks that backend and native network/billing surfaces are absent;
6. deploys the static artifact to GitHub Pages.

See `docs/PRODUCTION_HOSTING.md` for the exact release and Cloudflare-retirement checks. The old Worker, D1 database, API subdomain and Cloudflare Git deployment are not part of Broono local edition and should be deleted after any required data-retention check.

## Android

The checked-in Android project does not request `android.permission.INTERNET` or `com.android.vending.BILLING`, and it does not link the former Google Auth or native-purchases modules.

The Android WebView cannot download files, so Export writes the backup to the app's private cache with `@capacitor/filesystem` and opens the system share sheet with `@capacitor/share`. Neither plugin declares a permission, and nothing leaves the device unless the user picks a destination. Import uses the standard file picker.

Run `pnpm android:sync` after dependency or Capacitor configuration changes, then review the generated manifest and Gradle files before committing them.

## Contributing and security

Read `CONTRIBUTING.md` before proposing a change. Security concerns should use GitHub private vulnerability reporting; see `SECURITY.md`.

Do not add accounts, remote application storage, telemetry, billing or network APIs without an explicit product-direction decision and a new privacy/security design. Local-only operation is a tested product invariant.

## Licence status

No software licence has been selected yet. Public repository visibility alone does not grant permission to copy, modify or redistribute the code. Selecting an open-source licence remains an owner decision before the project can accurately be described as open source.

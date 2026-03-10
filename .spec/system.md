# Architecture

## Core Vibe & Intent
Broono is a GLP-1 companion app designed to track user journeys with medications (Zepbound, Mounjaro, Wegovy, Ozempic).
It emphasizes privacy, local data storage for health records, and a "night" theme visual identity.

## Components
- **Frontend**: React + Vite (TypeScript), Zustand (localStorage persistence for health data), deployed on Cloudflare Pages. Designed mobile-first.
- **Backend**: Hono + Cloudflare Workers, stateless API gateway.
- **Database**: Cloudflare D1 (SQLite) for user accounts, magic links, and subscription states.
- **Auth**: Passwordless Magic Links (Resend + Jose JWT).
- **Payments**: Stripe Checkout and Webhooks.

## Invariants & Principles
- **Data Privacy**: All sensitive health data (weekly logs, journal entries, weight tracking, symptom logs) MUST remain purely on the local device via `localStorage`. The backend never stores health data. This is to satisfy UK GDPR and Google Play Store Data Safety requirements.
- **API Responses**: Root endpoint `/` and all API endpoints MUST return JSON.
- **State Management**: Zustand `persist` middleware manages local state.
- **Styling**: Uses standard CSS classes (`index.css`) and global CSS variables. Avoids inline styling.

## Domain Boundaries
- `frontend`: User Interface, Local Data Persistence, PWA capabilities.
- `backend`: Authentication, Account Management, Stripe Subscription Handling.
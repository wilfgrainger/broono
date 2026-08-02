# Contributing to Broono

Thank you for taking the time to improve Broono.

## Before starting

1. Search existing issues and pull requests to avoid duplicating work.
2. Keep changes aligned with the current product: a mobile-first GLP-1 tracking companion.
3. Do not add server-side storage for weight, medication, symptoms, journal or other health data without an approved privacy and security design.
4. Open an issue before a major dependency, architecture, billing, authentication or data-model change.

## Development setup

```bash
pnpm install --frozen-lockfile
pnpm --dir backend install --frozen-lockfile
```

Run the frontend and API separately:

```bash
pnpm dev
pnpm --dir backend dev
```

## Required checks

Before opening a pull request, run:

```bash
pnpm run test:frontend
pnpm run test:backend
pnpm run build
```

Add or update tests when behaviour changes. A visual change should be checked at narrow phone widths as well as desktop width, with keyboard focus and reduced-motion preferences considered.

## Pull requests

Keep each pull request focused on one coherent outcome. Describe:

- the user or operator problem;
- the chosen approach and important trade-offs;
- tests actually run;
- privacy, security, accessibility and deployment effects;
- rollback or safe reversal where relevant.

Do not include generated build output, secrets, real user data or personal health records.

## Product and medical boundaries

Broono is a tracking companion, not a medical device. Avoid diagnostic, treatment or guaranteed-outcome claims. Product copy should be calm, specific and supportable.

## Licence status

The repository does not currently include an open-source licence. Contributions should not assume that public visibility grants reuse or redistribution rights. A licence must be selected by the repository owner before the project is formally open source.

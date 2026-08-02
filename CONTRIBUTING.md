# Contributing to Broono

Thank you for taking the time to improve Broono.

## Product invariant

Broono is a mobile-first, local-only GLP-1 tracking companion.

A normal contribution must not add:

- user accounts or authentication;
- remote application storage or sync;
- a Worker, API route or server database;
- analytics, advertising or behavioural telemetry;
- subscription billing or paid feature gates;
- runtime network access for user-entered tracking data.

A proposal to change this boundary requires an explicit owner decision and a separate architecture, privacy and security review before implementation.

## Development setup

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Required checks

Before opening a pull request, run:

```bash
pnpm test
pnpm run build
pnpm run test:e2e
```

The local-only regression test must remain green. A visual change should also be checked at narrow phone widths and desktop width, with keyboard focus and reduced-motion preferences considered.

For Android-affecting changes, run `pnpm android:sync` and review generated permissions and plugin wiring. The app must not regain internet, billing, Google Auth or native-purchase integration.

## Pull requests

Keep each pull request focused on one coherent outcome. Describe:

- the user problem;
- the chosen approach and trade-offs;
- tests actually run;
- privacy, accessibility and deployment effects;
- whether local storage or data-export compatibility changes;
- rollback or safe reversal where relevant.

Do not include generated production output, secrets, real user data or personal health records.

## Product and medical boundaries

Broono is a tracking companion, not a medical device. Avoid diagnostic, treatment, dosing or guaranteed-outcome claims. Medication-level displays must remain clearly described as estimates rather than clinical measurements.

## Licence status

The repository does not currently include an open-source licence. Contributions should not assume that public visibility grants reuse or redistribution rights. A licence must be selected by the repository owner before the project is formally open source.

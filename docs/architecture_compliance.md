# Broono local data architecture

## Decision

Broono is a static, local-only application. The architecture deliberately contains no application backend, remote database, user account, analytics service or payment system.

## Data flow

```text
user input
  -> React UI validation
  -> Zustand state
  -> browser / Capacitor local storage
  -> on-screen views or user-requested JSON export
```

There is no normal path from local tracking state to a Broono-controlled server.

## Local records

The persisted state may contain:

- setup status;
- medication and schedule preferences;
- starting weight and weight unit;
- check-in dates, weight, symptoms, injection site and notes;
- journal entries;
- hydration state and goals.

The state must not contain access tokens, email addresses, subscription status, purchase tokens or remote identifiers.

## Trust boundaries

### Device and browser profile

Local storage is readable by code running in the same application origin or WebView. The primary controls are:

- no remote application scripts;
- a restrictive Content Security Policy;
- no runtime network connection permission;
- careful treatment of stored text as data rather than HTML;
- local erasure and export controls;
- Android backup disabled.

### Static hosting

GitHub Pages delivers public application assets. Hosting and network providers may process ordinary connection metadata, but no Broono endpoint receives user-entered tracker records.

### User export

Export creates a local JSON download. After creation, the user controls where that file is stored or shared. The export must include no hidden account or platform identifiers.

## Privacy consequences

Local-only architecture materially reduces collection and breach exposure, but it does not make data invulnerable. Risks remain from:

- an unlocked or compromised device;
- malicious browser extensions or other software;
- screenshots and copied text;
- OS or device backup behaviour;
- exported files;
- loss of data when storage is cleared.

Product copy and documentation must state these limits honestly.

## Change control

The following changes require a new architecture and privacy decision before implementation:

- account creation or authentication;
- remote backup or sync;
- server-side storage of any record;
- analytics, crash telemetry containing user context, or advertising;
- email collection or waitlists;
- subscription or purchase handling;
- AI or external API processing of user-entered data.

## Automated enforcement

`src/local-only.node-test.ts` and the GitHub Pages workflow check that:

- backend and paywall-era paths are absent;
- runtime source contains no API/auth/billing markers;
- production CSP blocks outbound application connections;
- Android internet and billing permissions are absent;
- the static production marker is present.

A green dashboard alone is insufficient if these controls have been bypassed or weakened.

# Broono mobile launch strategy

## Product position

Broono is one local application delivered in two shells:

- a phone-first web edition on GitHub Pages;
- an Android Capacitor package built from the same static bundle.

Neither shell requires an account, remote API, subscription or server database. Current features are free and store user-entered records on the device.

## Android boundary

The Android package must:

- bundle the reviewed `dist/` application;
- request no internet permission;
- request no billing permission;
- include no Google Auth or purchase plugin;
- keep Android backups disabled unless an explicit encrypted-backup design is approved;
- preserve local export and local erasure;
- describe medication-level displays as estimates, not clinical measurements.

Run `pnpm android:sync` after any dependency change. Then inspect:

- `android/app/src/main/AndroidManifest.xml`;
- `android/app/capacitor.build.gradle`;
- `android/capacitor.settings.gradle`.

Do not publish a build if sync reintroduces a network, identity or billing capability.

## Web boundary

The web edition is static. Production must retain:

- `connect-src 'none'` in the Content Security Policy;
- no analytics or remote fonts/scripts;
- no form that submits personal data;
- GitHub Pages as the only application host;
- the legacy service-worker kill switch until old installations are cleared.

Ordinary network requests needed to download the site from GitHub Pages are hosting traffic, not an application API or sync service.

## Store and listing claims

Use supportable language:

- “No account required.”
- “Your entries stay on this device.”
- “No cloud sync or remote backup.”
- “Free local features.”
- “Personal tracking, not medical advice.”

Do not claim that data can never be exposed: device compromise, browser extensions, OS backups, screenshots and user exports remain outside Broono's direct control.

## Release proof

Before a mobile release:

1. run unit, local-only and end-to-end tests;
2. build the static application;
3. sync Android;
4. verify permissions and linked plugins;
5. install on a clean device/emulator;
6. complete onboarding with connectivity disabled;
7. create, close and reopen local records;
8. export data and inspect the JSON;
9. erase local data and verify the landing page returns;
10. confirm no account, purchase or network prompt appears.

## Future capabilities

Cross-device sync, accounts, telemetry, paid plans or remote backup are not incremental implementation details. Any of them changes the privacy promise and requires a new product decision, architecture, threat model, data lifecycle and migration plan.

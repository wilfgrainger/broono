# Broono architecture

## Decision

Broono is a TypeScript game with a Phaser renderer. Vite builds the static client, Capacitor packages the same client for Android and iOS, Cloudflare Pages hosts the browser build, and one Cloudflare Worker owns authentication, saves and leaderboards.

GitHub Actions is test and deployment automation only. It is not a game-state data plane.

## Runtime topology

1. Browser or Capacitor client renders the game locally through Phaser.
2. Google Identity Services returns a Google ID credential.
3. The Worker verifies the credential against Google's signed keys and configured audience.
4. The Worker returns a short, Broono-scoped session token.
5. Authenticated saves and leaderboard reads go through `api.broono.app`.
6. D1 is the sole persistence store for player records and authoritative saves.

The game loop remains playable offline as a guest. Network availability must never control rendering or frame rate.

## Boundaries

- **Client:** rendering, input, simulation, optimistic local state and offline guest play.
- **Worker:** identity verification, authorization, save validation and leaderboard policy.
- **D1:** player profiles and versioned save documents.
- **Pages:** immutable static game assets.
- **GitHub Actions:** deterministic tests and intentional deployments only.

## Mobile

The initial checked-in shell is Capacitor-ready. Android and iOS projects are generated locally only when store work starts, avoiding large generated platform trees in the repository. Google Play delivery requires an Android OAuth client and signing certificate fingerprint in addition to the web client ID.

## Security

- Never trust a player ID sent in a request body.
- Verify Google issuer, audience and signature in the Worker.
- Keep Google client ID and session secret outside source control.
- Apply strict origin allowlists and bearer authorization.
- Treat client-reported scores as provisional until server-side run validation is added.

## Scale path

The first release uses D1 because save writes and leaderboard queries are relational and small. Add Durable Objects only when real-time cooperative sessions are built. Add R2 only for authored asset packs or replays. These are measured scale decisions, not launch dependencies.

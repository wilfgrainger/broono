# Broono

**A good dog woke up undead. Survive the Wildwood for 99 nights.**

Broono is an original mobile-first survival game built with TypeScript, Phaser, Vite, Capacitor and Cloudflare.

## Run locally

```bash
npm ci
npm run dev
```

Keyboard: WASD or arrow keys. Mobile: virtual stick. Walk over supplies to collect them and use the action button near the warm light to refuel it with two wood.

Google sign-in is enabled when `VITE_GOOGLE_CLIENT_ID`, Worker `GOOGLE_CLIENT_ID` and Worker `SESSION_SECRET` are configured. Guest play works without credentials.

## Validate

```bash
npm test
npm run build
npx wrangler deploy --dry-run
```

See [product direction](docs/PRODUCT.md) and [architecture](docs/ARCHITECTURE.md).

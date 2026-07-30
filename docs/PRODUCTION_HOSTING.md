# Broono production hosting

## Frontend

- Source: `main`
- Build: Vite static output in `dist/`
- Host: GitHub Pages
- Domain: `https://broono.app`
- Deployment: `.github/workflows/deploy-broono-pages.yml`

The frontend must not be deployed with Wrangler or Cloudflare Pages. The root `deploy` script is intentionally informational so a local command cannot silently replace the GitHub Pages production site.

## Backend

- Host: Cloudflare Workers
- Worker: `broono-api`
- Domain: `https://api.broono.app`
- Configuration: `backend/wrangler.toml`

The Pages build injects `VITE_API_URL=https://api.broono.app`. The API allows the production origin `https://broono.app`.

## Legacy game retirement

An obsolete game release installed a root-scoped service worker. The static file `public/sw.js` is a temporary kill switch that clears caches, unregisters that worker and reloads open tabs. Keep it in place until the old game is no longer observed in normal or installed-browser sessions.

## Release verification

The Pages workflow fails unless all of the following are present in the artifact:

- GLP build marker `glp-restored-2026-07-30-v3`
- `CNAME` containing `broono.app`
- the self-destructing `/sw.js`
- SPA fallback `404.html`

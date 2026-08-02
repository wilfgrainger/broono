# Broono production hosting

## Frontend

- Source branch: `main`
- Build: Vite static output in `dist/`
- Host: GitHub Pages
- Canonical domain: `https://broono.app`
- Deployment workflow: `.github/workflows/deploy-broono-pages.yml`

The frontend must not be deployed with Wrangler or Cloudflare Pages. The root `deploy` script is intentionally informational so a local command cannot silently replace the GitHub Pages production site.

Pull requests run the same frontend and backend regression tests used by the release workflow, then build and inspect the static artifact. Pushes to `main` upload that verified artifact to GitHub Pages.

## Backend

- Host: Cloudflare Workers
- Worker: `broono-api`
- Domain: `https://api.broono.app`
- Configuration: `backend/wrangler.toml`
- Data store: Cloudflare D1

The Pages build injects `VITE_API_URL=https://api.broono.app`. The API must set `FRONTEND_URL=https://broono.app` so credentialed CORS requests are accepted only from the canonical frontend.

The backend is deployed separately and is not automatically published by the Pages workflow. A backend release must run its tests, use the reviewed `backend/wrangler.toml`, preserve D1 data, and have an explicit rollback or forward-fix plan.

## Legacy game retirement

An obsolete game release installed a root-scoped service worker. The static file `public/sw.js` is a temporary kill switch that clears caches, unregisters that worker and reloads open tabs. Keep it in place until the old game is no longer observed in normal or installed-browser sessions.

Removing the kill switch is a separate release decision. Validate fresh browsers, previously controlled browsers and installed/PWA sessions before deleting it.

## Release verification

The Pages workflow fails unless all of the following are true:

- frontend dependencies install from the committed lockfile;
- backend dependencies install from the committed backend lockfile;
- frontend regression tests pass;
- backend regression tests pass;
- the production Vite build succeeds;
- the GLP build marker `glp-restored-2026-07-30-v3` is present;
- `CNAME` contains `broono.app`;
- the self-destructing `/sw.js` remains present;
- the SPA fallback `404.html` is generated.

After deployment, verify the canonical domain, `/waitlist`, `/privacy`, `/terms`, API health, waitlist status and a safe test submission against the intended environment. Do not use real health data for release checks.

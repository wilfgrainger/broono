# Broono Cloudflare Pages deployment runbook

Broono's playable frontend is deployed with Cloudflare Pages. The Vite build writes the mobile game shell to `dist/`, and Cloudflare Pages serves that directory directly. There is no Worker required for the current family demo.

## One-time local OAuth login

Wrangler uses Cloudflare OAuth for local Pages deployments. Run this from the repo root on a machine with browser access:

```bash
npm install
npm run cf:login
npm run cf:whoami
```

`npm run cf:login` opens Cloudflare's OAuth flow. After approval, `npm run cf:whoami` should show the active Cloudflare account. Do not commit OAuth credentials; Wrangler stores them outside the repo.

## Cloudflare Pages build settings

Use these settings for the connected `main` branch in Cloudflare Pages:

```txt
Framework preset: None / Vite
Build command: npm run build
Build output directory: dist
Root directory: /
```

If your Cloudflare project asks for a deploy command, use the Pages deploy script rather than any Worker command:

```txt
Deploy command: npm run deploy:pages
```

The repo intentionally does not ship a Worker deploy script for the current frontend-only demo. `npm run deploy:frontend` is available for local authenticated deploys when you want one command to build and publish the Pages project.

## SPA fallback and headers

Cloudflare Pages copies files from `public/` during the Vite build:

- `public/_redirects` sends all app routes to `index.html`, so refreshing mobile app routes does not 404.
- `public/_headers` adds basic security headers and immutable caching for hashed assets.


## GitHub Actions production deploy

The repository includes `.github/workflows/cloudflare-pages.yml` to validate and deploy the Pages frontend from `main`.

Required GitHub configuration:

- Secret `CLOUDFLARE_API_TOKEN`: Cloudflare API token with Cloudflare Pages edit/deploy access.
- Secret `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID.
- Optional repository variable `CLOUDFLARE_PAGES_PROJECT_NAME`: Pages project name; defaults to `broono` in the workflow.

The workflow runs `npm ci`, `npm test`, `npm run build`, installs Chromium for Playwright, runs `npm run test:e2e`, uploads `dist` as an artifact, then deploys that artifact with `wrangler pages deploy` on pushes to `main`.

## Smoke test after deploy

After Cloudflare finishes deploying, verify these URLs:

```bash
curl -L https://broono.app/ -o /tmp/broono.html -w 'HTTP:%{http_code}\n'
```

Expected result:

- `/` returns the HTML game shell with the Broono app root, not the previous site and not a Worker JSON response.

If `/` still shows an old site, check that the `broono.app` custom domain is attached to the Cloudflare Pages project, not an old Worker/Pages project, then purge the Cloudflare cache. If automated tests receive a Cloudflare challenge page, temporarily relax challenge/WAF rules for `broono.app/*` while validating the family demo.

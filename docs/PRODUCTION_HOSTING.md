# Broono production hosting

## Supported production path

- Source branch: `main`
- Build: Vite static output in `dist/`
- Host: GitHub Pages
- Canonical domain: `https://broono.app`
- Deployment workflow: `.github/workflows/deploy-broono-pages.yml`

Broono has no production application backend. Do not deploy a Worker, Pages Function, API service, server database, authentication service or billing webhook for the current product.

GitHub Pages serves the static HTML, JavaScript, CSS and public assets. User-entered tracking data remains in browser or Capacitor local storage and is not sent to Broono infrastructure.

## Local-only controls

The release is blocked unless:

- the `backend/` directory is absent;
- the build contains `broono-local-only-2026-08-02-v1`;
- the Content Security Policy contains `connect-src 'none'`;
- source and output contain no Broono API URL, API build variable, Google Auth runtime, native purchase runtime or D1 binding;
- the Android manifest contains neither internet nor billing permission;
- the Android Gradle files do not link Google Auth or native-purchases modules;
- frontend and local-only regression tests pass.

These checks make local-only operation an executable invariant rather than a documentation claim.

## Legacy Cloudflare retirement

Previous versions used a Cloudflare Worker, D1 database and a repository-connected Cloudflare deployment project. They are no longer part of the product.

After this release is merged:

1. confirm there is no information in D1 that must be retained for a legal or user-request reason;
2. export any record that must be preserved outside the product, without retaining unnecessary personal data;
3. delete the `broono-api` Worker and its routes/custom domain;
4. delete the Broono D1 database;
5. disconnect the Cloudflare Git integration for this repository;
6. remove obsolete DNS records for `api.broono.app` or Worker/Pages targets;
7. confirm `broono.app` still resolves to GitHub Pages and the static app works;
8. confirm no Cloudflare deployment comment or check appears on a later repository commit.

Cloudflare may still proxy DNS for the website if deliberately desired, but it must not run Broono application code or store Broono application data.

## Legacy service-worker retirement

An obsolete game release installed a root-scoped service worker. `public/sw.js` remains a temporary kill switch that clears old caches and unregisters the worker.

Keep it until fresh browsers, previously controlled browsers and installed/PWA sessions consistently show the local GLP application. Removing it is a separate reviewed release.

## Release verification

The GitHub Pages workflow performs the automated checks. After deployment, manually verify:

- `/` presents the local-only landing page;
- setup works without a sign-in or network API;
- Progress and Journal are available without a paywall;
- Settings exports a JSON file;
- local erasure returns the app to its initial state;
- `/privacy` and `/terms` describe local-only operation;
- `/waitlist` no longer presents or submits a server form;
- browser developer tools show no Broono API request;
- `broono.app` is served by the intended GitHub Pages release.

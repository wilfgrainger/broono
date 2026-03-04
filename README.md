# Broono

Broono is a GLP-1 companion app designed to track your journey with medications like Zepbound, Mounjaro, Wegovy, or Ozempic.

## Architecture

- **Frontend**: React + Vite (TypeScript) - Deployed on Cloudflare Pages.
- **Backend**: Hono + Cloudflare Workers - Serverless API.
- **Database**: Cloudflare D1.
- **Auth**: Magic Links via Resend.
- **Payments**: Stripe.

## Getting Started

### Prerequisites

- [pnpm](https://pnpm.io/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (Cloudflare CLI)

### Installation

1. Clone the repository.
2. Install dependencies in the root and backend:
   ```bash
   pnpm install
   cd backend && npm install
   ```

### Development

#### Frontend
```bash
pnpm dev
```

#### Backend
```bash
cd backend
npm run dev
```

### Deployment

#### Frontend (Cloudflare Pages)
Connect your GitHub/GitLab repository to Cloudflare Pages and select the Vite preset. Set `VITE_API_URL` to your worker URL.

#### Backend (Cloudflare Workers)
```bash
cd backend
npm run deploy
```

## Security

- CORS is enforced for the primary frontend domain.
- Secrets are managed via Cloudflare environment variables.
- Input validation is handled on the backend via Hono.

## Domain & Routing

- Canonical Domain: `broono.app`
- `www.broono.app` automatically redirects to the canonical domain to ensure session consistency and avoid duplicate content issues.

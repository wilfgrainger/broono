# Technical Steering & Infra
- **Frontend**: Next.js (Static Export) hosted on Cloudflare Pages.
- **Mobile Wrapper**: Capacitor for Android/iOS.
- **API Layer**: Cloudflare Workers (Hono).
- **Database Engine**: Cloudflare D1 (SQL).
- **State Cache**: Cloudflare KV.
- **AI Integration**: NVIDIA NIM API (deepseek-v4-flash / deepseek-v4-pro). Secure HTTP REST calls via Cloudflare Worker.
- **Identity (IAM)**: Supabase Auth (normalizing Google, Facebook, Apple logins into a single JWT). Must support "Sign in with Apple" prominently.

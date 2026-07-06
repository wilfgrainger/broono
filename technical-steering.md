# technical-steering.md

## 1. Architecture & Free-Tier Stack
The entire backend and infrastructure layer is optimized to remain strictly within standard free tiers, heavily utilizing Cloudflare's edge network.

* **Frontend UI**: Next.js (Static Export) hosted on Cloudflare Pages. Free tier supports 500 builds/month and unlimited bandwidth.
* **Mobile Wrapper**: Capacitor bridges the web build to native Android (Google Play) and iOS (App Store) binaries.
* **API Layer**: Cloudflare Workers handle serverless RESTful API requests. Free tier allows 100,000 requests per day at a 10ms CPU time limit per invocation.
* **Database**: Cloudflare D1 (SQL) is used for user/email mapping and relational leaderboard data. Free tier supports 5 million rows read/day and 100,000 rows written/day.
* **State Cache**: Cloudflare KV is used for rapid caching of non-relational pet state before writing batch updates to D1. Free tier supports 100,000 reads/day.

## 2. Free-Tier AI Integration (In-Game Chatbot & Support)
To implement an intelligent, context-aware AI assistant without incurring backend costs, the system will integrate DeepSeek V4 via NVIDIA NIM's free developer endpoints.

* **Provider**: NVIDIA NIM API (build.nvidia.com).
* **Selected Model**: deepseek-ai/deepseek-v4-flash (recommended for high-speed chat) or deepseek-ai/deepseek-v4-pro (for complex logic or agentic tasks).
* **Capabilities**: Leverages a 1-million-token context window and an MoE architecture, enabling the AI to analyze extensive game mechanics and player data in real time.
* **Cost Mechanics**: Free access via the NVIDIA Developer tier. Standard rate limits apply to the free preview keys.
* **Integration**: Secure HTTP REST calls executed directly from the Cloudflare Worker to api.nvidia.com, ensuring the NIM API key remains hidden on the edge and is not exposed in the client-side Capacitor app.

## 3. Identity & Access Management (IAM) & Apple App Store Compliance
Because the application relies on an email address as the primary relational key in the database, the authentication flow must accommodate the strict rules of both Google Play and the Apple App Store.

* **The Apple Mandate**: If an iOS app offers third-party social logins (e.g., Google or Facebook), Apple's App Store Review Guidelines legally mandate that "Sign in with Apple" must also be presented as an option of equal prominence. Failure to include this will result in immediate rejection from the App Store.
* **The Email Primary Key Problem**: When a user selects "Sign in with Apple," Apple provides an option to "Hide My Email." This generates a unique, private proxy email address.
* **Database Resolution**: Your backend must accept these proxy emails as valid unique identifiers. The Cloudflare Worker handling authentication will receive the OAuth token, extract the email, and map it directly to the user's ID in the Cloudflare D1 database.
* **Implementation**: Use an identity provider like Supabase Auth (free tier up to 50,000 MAU) integrated into your Next.js app to normalize the OAuth payloads from Google, Facebook, and Apple into a single JWT structure containing the target email key before passing it to your Cloudflare Worker.

## 4. Multi-Platform Deployment (Capacitor)
Capacitor acts as the bridge between the Next.js web application and the native device capabilities required by the app stores.

* **Build Pipeline**: The Next.js application is compiled into static assets.
* **Native Sync**: Capacitor copies these static assets into native Android Studio and Xcode projects.
* **Device APIs**: Capacitor plugins allow the React frontend to natively interface with device storage (for offline vital calculation), push notifications, and native OAuth login overlays.

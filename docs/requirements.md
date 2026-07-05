# broono.app Product Requirements

## Vision
Broono is a **mobile-only Tamagotchi-style pet simulation game** designed for brief, rewarding daily check-ins. Players care for a quirky virtual creature, grow a personal collection, learn through bite-sized word play, and share progress with friends and family without requiring expensive infrastructure or web-first compromises.

The product north star is: **a lovable daily pet-care loop that feels native on Android and iOS, can launch on Cloudflare's free tier, and stays ready for real Google/Apple authentication and store in-app purchases when credentials are available.**

## Platform Scope
- **Mobile only:** Broono is built for phone-sized Android and iOS experiences first. Desktop web may exist only as an internal development or deployment convenience, not as a primary product surface.
- **Native shell:** Production distribution targets Capacitor Android and Capacitor iOS wrappers around the shared React game client.
- **Touch-first UI:** All game interactions must be usable with one thumb, large tap targets, portrait orientation, short sessions, and intermittent network connectivity.
- **Store readiness:** Product decisions must keep Google Play and Apple App Store review requirements in mind, especially authentication parity and in-app purchase policy.

## Target Audience
- Casual mobile players who enjoy daily nurture loops, collection, cosmetics, and low-pressure progression.
- Families and friend groups who want lightweight competition and safe social comparison.
- Players who prefer short, positive sessions over grind-heavy or real-time competitive mechanics.

## Core Game Loop
1. Player opens Broono on their phone.
2. Player checks the pet's needs: **Hunger, Hydration, Temperature, and Happiness**.
3. Player performs simple care actions that improve those needs.
4. Player optionally plays educational word mini-games to earn coins.
5. Player spends coins on cosmetics, utility upgrades, or destination unlocks.
6. Player returns later, ideally roughly once per day, to continue the care loop and progression.

The loop should reward consistency without punishing missed days harshly enough to cause churn.

## Pet Lifecycle
- Players begin in a village home with a **free egg**.
- Eggs hatch into random named animals after the designed early onboarding/care period.
- Pets should have clear state, visible mood, and personality cues tied to care status.
- Future lifecycle extensions may include growth stages, memories, collections, seasonal variants, and pet histories, but the MVP must stay focused on a simple hatch-and-care loop.

## Needs and Care Stats
Broono's minimum care model includes:
- **Hunger:** Improved through feeding actions or food items.
- **Hydration:** Improved through water or drink actions.
- **Temperature:** Managed through environment, clothing, or location effects.
- **Happiness:** Improved through play, cosmetics, mini-games, and healthy care balance.

Care stats should decay over time in a way that supports daily check-ins. Decay tuning must be conservative for launch so players do not feel punished for normal life interruptions.

## Economy and Progression
- **Coins** are the primary soft currency.
- Coins are earned through educational word mini-games and selected progression rewards.
- Coins are spent on cosmetics, utility upgrades, care items, and destination unlocks.
- The economy must be understandable, non-predatory, and testable without paid purchases.
- Any premium purchase path must remain **mocked** until Google Play Billing and Apple StoreKit credentials/products are provisioned.

## Educational Word Mini-Games
Mini-games should:
- Be short enough for mobile daily sessions.
- Reward coins, streaks, or care-adjacent bonuses.
- Reinforce spelling, vocabulary, word recognition, or other language skills.
- Avoid blocking the core care loop; mini-games are optional earn-and-engage activities.

## Destinations and Home
- The first player setting is a village home.
- Destinations provide progression goals, visual variety, and future hooks for weather, temperature, mini-game themes, and collectible animals.
- Destination unlocks should be coin-based for MVP unless/until store IAP is properly configured.

## Cosmetics and Utility Upgrades
- Cosmetics personalize the pet, home, or destinations without breaking game balance.
- Utility upgrades may make care easier, extend stat comfort windows, or improve earning efficiency.
- Cosmetics and utility upgrades must be structured so they can later map to store-compliant paid bundles if the business model requires it.

## Social and Leaderboards
Broono should support leaderboard categories:
- **Global**
- **Country**
- **Friends & Family**

Leaderboards should emphasize friendly progress, collection, care consistency, or mini-game achievements. Friends & Family features must be privacy-conscious and should avoid exposing children or family groups beyond intentional sharing.

## Authentication Requirements
- Google and Apple sign-in must have product parity.
- Whenever Google sign-in is offered, Apple sign-in must be offered with equal prominence and comparable UX treatment.
- Until production OAuth credentials are provisioned, authentication may be mocked in development and staging.
- Mocked auth must be clearly isolated from production paths and must not imply real identity verification.

## Payments Requirements
- Payments remain mocked until Google Play Billing and Apple StoreKit/IAP credentials, products, and review-ready flows exist.
- The MVP must not depend on real-money purchase success.
- Store IAP integration must preserve platform parity and avoid bypassing app-store payment rules for digital goods.
- Mock purchase flows should support testing entitlement, cosmetic unlock, and restore-purchase UX without real transactions.

## MVP Must-Haves
- Capacitor-packaged Android/iOS client path.
- Mobile-only pet care loop with the four core stats.
- Free egg onboarding and random named animal hatch outcome.
- Coin earning through at least one educational word mini-game.
- Coin spending on at least one cosmetic or utility upgrade.
- Destination unlock foundation.
- Google/Apple auth parity in UI, with mocks acceptable before credentials.
- Mocked payment and entitlement paths until store IAP credentials are ready.
- Cloudflare free-tier-compatible backend architecture.

## Non-Goals for Initial Launch
- Desktop-first gameplay.
- Real-money payments before store credentials and review-ready IAP flows.
- Complex real-time multiplayer.
- Expensive backend dependencies that exceed Cloudflare free-tier assumptions.
- Authentication flows that privilege Google over Apple or hide Apple sign-in where Google is present.

## Product Guardrails
- Keep Broono cozy, safe, and approachable.
- Favor daily delight over aggressive monetization.
- Do not introduce architecture that prevents Cloudflare free-tier launch.
- Do not introduce product flows that assume desktop web as the primary experience.
- Do not introduce real payments before store IAP setup is complete.
- Preserve parity between Google and Apple auth in every user-facing design.

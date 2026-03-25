# Broono Mobile Launch Strategy

## Executive Recommendation

Yes — keeping **one repo** for your React app, Android shell, backend, and future iOS shell is the normal and recommended approach for a small product team.

For Broono, the best path is:

1. Keep the current React + Capacitor app as the shared product codebase.
2. Launch **Android first** because Google Play review is already in motion.
3. Add **iOS** as a second native target in the same repo once Android retention, paywall conversion, and onboarding metrics are stable.
4. Treat `broono.app` as a **staging / QA surface**, not the main monetization surface.
5. Keep backend auth, subscription verification, and compliance logic centralized so both stores share the same product rules.

## What the Repo Already Tells Us

Broono is already structurally close to an Android-first mobile product:

- Capacitor is already installed and configured with an Android target.
- Android billing is already wired around Google Play purchases.
- The backend already verifies Google Play subscriptions and RTDN webhooks.
- Product copy and legal pages currently describe Broono Pro as **Google Play only**.
- There is **no iOS target yet**, and the current billing implementation is Android-specific.

This means you should **not** rebuild from scratch. You should turn the current codebase into a deliberate **shared mobile core** with platform-specific adapters.

## Is One Repo the Right Setup?

### Short answer

**Yes.** Most early-stage teams use one repo for:

- shared React / TypeScript app code
- Android native wrapper
- iOS native wrapper
- backend APIs
- compliance docs
- CI/CD and release automation

### Why one repo is right for Broono

Because your product is:

- mobile-only in business intent
- still evolving quickly
- maintained by a small team
- dependent on shared onboarding, auth, health tracking, and subscription rules

A single repo gives you:

- one source of truth for product logic
- easier release coordination
- lower maintenance overhead
- simpler environment management
- less duplication between Android and iOS

### When people split repos

Teams usually split repos later, and only when they have:

- separate mobile teams
- separate backend ownership
- very different release cadences
- strong DevOps maturity

Broono is not there yet. Splitting now would likely slow you down.

## Recommended Architecture Going Forward

### Keep this monorepo shape

- `/src` → shared mobile UI and app logic
- `/android` → Android native project
- `/ios` → future iOS native project
- `/backend` → auth, subscription verification, webhooks
- `/docs` → store submission, compliance, operations

### Add a platform abstraction layer

Right now billing and some auth behavior are Android-first. Before iOS work starts, standardize platform services behind shared interfaces:

- `authService`
- `subscriptionService`
- `analyticsService`
- `notificationsService`
- `remoteConfigService`

Then implement per-platform adapters:

- Android adapter
- iOS adapter
- browser / QA adapter

This lets the product stay one app even when store mechanics differ.

## The Biggest Product Decision: Web vs Mobile

You said this is a **mobile app only**, with the web version mainly for testing.

That is a good strategy, but you should make it explicit.

### Recommendation

Position the surfaces like this:

- **Android app** → primary launch product and first revenue channel
- **Future iOS app** → second revenue channel using the same shared codebase
- **broono.app** → QA, legal pages, support links, maybe waitlist / marketing, but **not** the canonical paid experience

### Why this matters

Right now users can still encounter a web experience, while your monetization copy says upgrades happen only in Android.
That is workable for testing, but confusing if treated as a public product.

So operationally:

- keep the web build for development and internal review
- keep legal pages public
- avoid marketing the web app as a consumer destination
- send users to the native store listing for real activation and purchases

## What Must Happen Before iOS

Do **not** start full iOS implementation before Android launch basics are validated.

### Android-first milestones

1. Finish Google Play internal / closed testing.
2. Confirm sign-in works on real production signing.
3. Verify subscription purchase, trial start, renewal, cancellation, and restore flows.
4. Confirm account deletion and privacy wording match actual behavior.
5. Measure:
   - activation rate
   - onboarding completion
   - trial start rate
   - trial-to-paid conversion
   - week-1 retention

Once those numbers exist, build iOS using the best-performing onboarding and paywall approach.

## What Will Need to Change for Apple

Apple is not just “add another build target.”

You will need iOS-specific work in these areas:

### 1. Native project

Add Capacitor iOS and commit the `/ios` directory to the same repo.

### 2. Billing

Current billing is Google Play-specific. You will need:

- App Store subscriptions
- StoreKit-compatible purchase flow
- iOS restore purchases flow
- backend receipt / transaction verification path for Apple

### 3. Auth

Google Sign-In may remain available, but Apple review often goes more smoothly when **Sign in with Apple** is supported if third-party login is offered in certain cases. Treat that as a likely requirement to evaluate before iOS submission.

### 4. Compliance

You will need App Store-specific:

- privacy nutrition labels
- subscription metadata
- screenshot sets
- review notes
- deletion / support handling

### 5. UX polish

Expect platform-specific work for:

- safe areas
- keyboard behavior
- status bar treatment
- haptics
- permission prompts
- navigation feel

## Money-Making Plan: Focus on Revenue, Not Just Shipping

As a boutique consulting recommendation: **do not optimize for “available in both stores” before you optimize for “people convert and stay.”**

### Your real goal for the next phase

Get to a repeatable loop:

1. user installs
2. user completes onboarding
3. user logs health progress for 7+ days
4. user hits a meaningful Pro gate
5. user starts trial
6. user converts to paid
7. churn reasons are understood

### Suggested initial commercial strategy

#### Free tier should do one job well

Let free users get a clear “aha” moment:

- log medication
- track weight
- see consistency
- build streak / habit confidence

#### Pro should unlock emotional outcomes, not just features

Your Pro wall should sell:

- momentum
- progress visibility
- clinician-ready exports
- deeper history
- accountability

#### Pricing strategy

Your current low monthly price may help early conversion, but only if:

- onboarding makes the value obvious
- the paywall appears after useful engagement
- restore / verification is flawless

For now, avoid adding annual plans until you understand retention.

## 30 / 60 / 90 Day Plan

### Next 30 days: Android launch readiness

- Ship Android internal / closed testing
- Clean up all Android-first copy and documentation inconsistencies
- Instrument funnel metrics
- Verify production purchase lifecycle end to end
- Produce store assets and submission notes
- Create a support workflow for billing and account deletion issues

### Days 31–60: Learn what converts

- Watch onboarding drop-off
- Adjust paywall timing and wording
- Collect user interviews from first testers
- Review retention by medication journey stage
- Identify the 1–2 strongest value propositions

### Days 61–90: Prepare iOS correctly

- Add `/ios` via Capacitor
- create Apple-specific subscription and receipt verification design
- decide whether to add Sign in with Apple
- prepare App Store compliance package
- run TestFlight with the refined onboarding and paywall

## Suggested 10-Agent Workflow from agency-agents

If you want to use **10 agents** from `agency-agents`, use them as a lightweight advisory board — not as 10 people all writing code at once.

Recommended set:

1. **Mobile App Builder** → define Android-first and iOS-second implementation plan
2. **Backend Architect** → shared subscription/auth platform design
3. **Frontend Developer** → mobile UX cleanup and component polish
4. **UI Designer** → onboarding/paywall visual clarity
5. **Reality Checker** → launch readiness and risk gate
6. **Legal Compliance Checker** → store/privacy/deletion review
7. **App Store Optimizer** → store listing and ASO
8. **Growth Hacker** → activation and conversion experiments
9. **Analytics Reporter** → KPI dashboard and funnel definitions
10. **Sprint Prioritizer** → turn strategy into weekly execution

### How to use them well

Use them in this order:

- **Plan:** Mobile App Builder, Backend Architect, Sprint Prioritizer
- **De-risk:** Legal Compliance Checker, Reality Checker
- **Improve conversion:** UI Designer, Frontend Developer, Growth Hacker
- **Launch:** App Store Optimizer, Analytics Reporter

## Immediate Broono Recommendations

### Do now

- Keep one repo.
- Launch Android first.
- Add a formal mobile roadmap in the repo.
- Treat the web app as support / QA, not the core commercial surface.
- Refactor shared services so iOS can plug in later without product rewrites.
- Define the metrics that prove the app is making money.

### Do not do now

- Do not create a separate iOS repo.
- Do not rebuild in React Native or Flutter unless Capacitor proves inadequate.
- Do not spend weeks polishing web behavior that will not matter for paid users.
- Do not expand feature scope before validating conversion and retention.

## Practical Next Step

If I were advising Broono as a startup consultancy, I would make the next work package:

**Phase 1: Android Revenue Readiness**

Deliverables:

- launch checklist tied to real owners
- analytics event map
- Android production test plan
- paywall and onboarding refinement backlog
- iOS architecture gap list

That gets you closer to **revenue**, not just “more software.”

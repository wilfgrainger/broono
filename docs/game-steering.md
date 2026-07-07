# Broono Game Steering

Last updated: 2026-07-07

## Authority

This document is the product/game steering source for future Broono sessions. It supersedes older product-direction notes when they conflict with the game concept, loop, audience, monetization, or UX priorities. `docs/technical-steering.md` still governs platform and architecture unless this document explicitly says a product requirement has changed.

The current shipped `Snack Pop Quest` prototype is useful evidence, not the destination.

## Hard Decision

Broono should restart around a pet-first daily toy:

**Broono's Weird Breakfast**

A mobile-first daily companion game where players feed Broono three weird word-snacks, watch Broono visibly transform, save the memory, and optionally earn rare ingredients through a tiny word challenge.

The product sentence:

> Feed Broono strange words. Broono changes. Come back tomorrow to see what he remembers.

## Why We Are Restarting

The current `Snack Pop Quest` direction is clearer than the earlier prototype, but the center of gravity is wrong.

- It feels like a generic cluster puzzle with a pet above it.
- Broono is not mechanically important.
- The board decision is too obvious: tap the largest visible group.
- Hearts, coins, boosters, shop, IAP, quests, leaderboards, and auth appear before the core toy earns them.
- The child-facing monetization surface is trust-damaging.
- The live UI still contains internal/product-strategy content that breaks the fiction.

Brutal verdict: polishing the board is a trap. The strongest asset is Broono, not the board.

## Market Research Summary

### Macro Market

- Newzoo's 2025 report frames games as a $188.8B global revenue market with 3.6B players, but mobile growth is slower in mature markets. This means Broono needs distinctiveness and retention, not generic feature completeness. Source: https://newzoo.com/resources/trend-reports/newzoo-global-games-market-report-2025
- Sensor Tower's 2025 mobile gaming report says mobile IAP revenue, time spent, and sessions grew in 2024, and casual games drove the largest growth in the West. It also notes developers are refocusing on existing/live-service titles because attracting new audiences is hard. Source: https://sensortower.com/state-of-gaming-2025
- AppMagic's 2025 casual report notes that Puzzle and Casino generate over 72% of casual revenue. That validates the money in puzzle, but also confirms the market is crowded and dominated by mature incumbents. Source: https://appmagic.rocks/research/casual-report-2025

### Virtual Pet and Companion Signal

- `My Talking Tom 2` is positioned around pet care, expressive reactions, customization, worlds, mini-games, and offline play. The store page emphasizes the pet's reactions, routines, outfits, worlds, and collectibles before pure score mechanics. Source: https://play.google.com/store/apps/details?id=com.outfit7.mytalkingtom2
- `My Tamagotchi Forever` emphasizes raising, feeding, washing, growth, evolution, collections, sharing, and unlocking food/costumes/town items. This supports Broono's original pet-first direction. Source: https://play.google.com/store/apps/details?id=eu.bandainamcoent.mytamagotchiforever
- A 2025 narrative review of virtual pets identifies recurring themes: ongoing relationships, wellbeing, learning, play, ethics, and consumption. Broono should exploit the relationship/learning/play side and avoid exploitative consumption loops. Source: https://www.sciencedirect.com/science/article/pii/S1875952125000382
- Sensor Tower's Q2 2025 health/fitness app notes show `Finch: Self-Care Pet` with robust active users near 8.3M and steady weekly revenue around $380K by late June. This validates the daily companion + self-care/pet loop beyond children. Source: https://sensortower.com/blog/2025-q2-unified-top-5-health%20and%20fitness-units-us-600af518241bc16eb8dce802

### UGC, Shareability, and Generated Identity

- Roblox reported 132M average daily active users in Q1 2026 and 31B hours engaged, up 35% and 43% year over year respectively. The important lesson is not "be Roblox"; it is that identity, creation, sharing, and social artifacts drive massive engagement. Source: https://s27.q4cdn.com/984876518/files/doc_financials/2026/q1/Q1-2026-Earnings-Shareholder-Letter.pdf
- UGC ecosystems are growing, but full UGC platforms are not Broono's scope. Broono should borrow the lightweight part: generated identity artifacts that are fun to save or share.

### Kids, Parents, and Monetization Risk

- The FTC's Epic/Fortnite dark-pattern settlement is a bright-line warning for child-facing games: one-button purchases, confusing purchase UX, lack of explicit consent, and hidden refunds create legal and trust risk. Source: https://www.ftc.gov/business-guidance/blog/2022/12/245-million-ftc-settlement-alleges-fortnite-owner-epic-games-used-digital-dark-patterns-charge
- For Broono, real-money monetization must be parent-gated, optional, transparent, and never tied to pet neglect, failure pressure, or frustration relief.

## Idea Test Matrix

Scores: 1 is weak, 5 is strong. We weight maintainability and ownability heavily because Broono is an indie-scale product.

| Candidate | Kid Clarity | Adult Appeal | Ownability | Retention | Monetization Safety | Maintainability | Verdict |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Snack Pop Quest | 3 | 2 | 1 | 2 | 2 | 4 | Kill as main game. Too generic. |
| Craving Puzzle | 4 | 3 | 2 | 3 | 3 | 3 | Possible mini-game, not core. |
| Classic Tamagotchi Care | 4 | 3 | 3 | 4 | 4 | 4 | Strong foundation, but needs a unique twist. |
| Broono's Weird Breakfast | 5 | 4 | 5 | 4 | 5 | 5 | Winner. Ownable, simple, pet-first. |
| Broono Pocket Planet | 3 | 4 | 4 | 4 | 4 | 2 | Too large for next prototype. |
| Sticker/Share Card Toy | 4 | 4 | 4 | 3 | 5 | 4 | Good supporting feature. |

## Chosen Direction

### Core Loop

1. Broono wakes up with a strange craving.
2. The player gets a tray of word-snacks.
3. The player chooses exactly three snacks.
4. Broono eats them and visibly transforms.
5. The game creates a named form and a memory sentence.
6. The result is saved in the memory log.
7. Optional tiny word challenge earns one rare ingredient.
8. Player returns tomorrow for a new craving, new tray, and evolving memory.

### Example Session

Broono says:

> I want something cold, noisy, and brave.

Tray:

- frozen
- moon
- hiccup
- brave
- button
- fizzy
- whisper
- tiny

Player feeds:

- frozen
- brave
- hiccup

Result:

- Broono turns pale blue.
- His ears puff up.
- He hiccups snow bubbles.
- Memory: `Broono became a Frozen Brave Hiccup and tried to scare the moon.`
- Share card: `Today my Broono became: Frozen Brave Hiccup.`

## Design Pillars

### 1. Broono Is The Game

Every primary action must change Broono's visible state, memory, mood, collection, or relationship with the player.

If a feature does not affect Broono, it is secondary.

### 2. Words Are Toys

Words are not worksheets. They are ingredients, spells, jokes, moods, and identity pieces. Educational value comes from playful vocabulary, categorization, word association, and daily repetition.

### 3. Daily, Not Grind

One good session should take 60-120 seconds. The game should reward returning but should not punish missed days harshly.

### 4. Safe Enough For Kids, Interesting Enough For Adults

Kids should understand the action instantly. Adults should find the outcomes charming, funny, and collectible.

### 5. Shareable Output Beats Leaderboards

Broono should produce artifacts worth showing: forms, memories, breakfast cards, and collections. Avoid competitive leaderboards until there is a clear safety and privacy reason.

## First Prototype Scope

Build this before adding any shop, auth, leaderboard, or payment surface.

### Must Have

- One mobile-first screen.
- Large expressive Broono habitat.
- Tray of 6-9 word-snack cards.
- Exactly three selectable cards per feeding.
- Feed button.
- Deterministic reaction generation from the selected words.
- At least 30 word-snacks across categories:
  - flavor
  - object
  - mood
  - sound
  - magic
- At least 12 visible Broono reaction variables:
  - color tint
  - eye shape
  - mouth expression
  - ear pose
  - body size
  - bounce speed
  - float/grounded state
  - sparkle/sweat/fire/frost effect
  - caption tone
  - bowl fill
  - accessory hint
  - background accent
- Memory log for last 7 meals.
- One optional daily word challenge.
- Result/share card inside the app.
- Local persistence.

### Should Have

- Daily seed so the tray changes by date.
- "Favorite memory" pin.
- Gentle onboarding prompt.
- Reduced-motion CSS path.
- No external network dependency for core play.

### Must Not Have

- No real-money purchase UI.
- No Booster Bank.
- No child-facing IAP claims.
- No leaderboard.
- No global/country/friends ranking.
- No concept-analysis panel in the player UI.
- No auth gate before play.
- No guilt copy such as "Broono goes hungry" tied to failure or purchases.

## Word-Snack System

Each word-snack should have structured tags:

```ts
type WordSnack = {
  id: string;
  label: string;
  category: 'flavor' | 'object' | 'mood' | 'sound' | 'magic';
  tone: 'sweet' | 'weird' | 'cozy' | 'wild' | 'spooky';
  effects: Array<'cold' | 'hot' | 'float' | 'glow' | 'tiny' | 'giant' | 'sleepy' | 'bouncy'>;
  rarity: 'common' | 'rare';
};
```

Reaction generation should be deterministic and explainable:

- Form name: adjective + object + sound/mood.
- Visual state: derived from effects and tone.
- Memory sentence: templated from category mix.
- Collection key: sorted snack ids + date seed.

Avoid opaque AI generation for MVP. The game should work offline and be testable.

## Candidate Word-Snack Starter Set

Flavor:

- sweet
- spicy
- fizzy
- frozen
- burnt
- sour

Object:

- moon
- sock
- crown
- puddle
- button
- comet

Mood:

- shy
- brave
- dramatic
- sleepy
- greedy
- cheerful

Sound:

- hiccup
- hum
- whisper
- clang
- burp
- pop

Magic:

- glowing
- tiny
- upside-down
- invisible
- electric
- wobbly

## Monetization Steering

Do not monetize the first prototype.

Future monetization, if used, should be:

- parent-gated
- cosmetic-first
- clear and optional
- never tied to hunger, shame, failure, or frustration relief
- never one-tap from a child-facing screen
- never required for the daily loop

Acceptable future paid value:

- cosmetic wardrobes
- habitat themes
- sticker packs
- expanded memory card styles
- optional parent-approved season packs

Unacceptable monetization:

- paid retries
- paid hunger relief
- paid streak repair for kids
- pressure timers
- "best value" dark-pattern labels for child-facing users
- fake scarcity
- purchases without confirmation, restore, terms, and parent controls

## Safety and Privacy Steering

- Core play must not require account creation.
- Do not expose real names, country, friends, or family relationships in MVP UI.
- Keep all generated text from controlled templates and approved word lists.
- Avoid chat, free-form user text, public sharing, and multiplayer in MVP.
- If any sharing is added, it should be local device share-card export only.
- Treat parent trust as a core product feature, not legal cleanup.

## Visual Steering

Broono needs to become a premium mascot.

Required improvements:

- larger Broono on first screen
- mouth and expression states
- distinct silhouette
- emotional reaction states
- fewer heavy outlines and badges
- less UI chrome
- more habitat/toy feel
- fewer systems visible at once

The first viewport should read:

1. This is Broono.
2. Broono wants breakfast.
3. I choose funny word-snacks.
4. Broono changes.

If a first-time viewer sees a dashboard, the design failed.

## Technical Steering

Keep the existing stack:

- React/Vite client
- mobile portrait-first UI
- Cloudflare Pages deployability
- Cloudflare Worker compatibility for future sync
- local persistence first
- deterministic game logic with unit tests

For the next prototype, the likely write targets are:

- `src/game.ts`: replace or bypass board-first state with word-snack feeding state.
- `src/hooks/useGameLoop.ts`: expose select/feed/reset/daily challenge actions.
- `src/main.tsx`: rebuild as one-screen pet feeding toy.
- `src/styles.css`: simplify visual hierarchy and make Broono larger.
- `src/game.test.ts`: test deterministic reaction generation and persistence-safe state.
- `e2e/broono.spec.ts`: test first-use flow, feeding, memory log, and mobile layout.

The old board engine can remain temporarily if it does not appear in the user flow, but future sessions should delete it once the feeding prototype is stable.

## Metrics For Testing

Prototype success is not "tests pass." Prototype success is whether people understand and want another turn.

Use these validation questions:

1. What do you think this game is?
2. What do you do first?
3. What happened after feeding Broono?
4. Did the result make you smile?
5. Would you try another combination?
6. Would you come back tomorrow?
7. Would you save or share the result card?

Target signals:

- 80% of testers understand the loop within 5 seconds.
- 70% try a second combination unprompted.
- 50% say they would come back tomorrow.
- At least one generated result is memorable enough to repeat aloud.

## 48-Hour Build Plan

### Phase 1: Strip

- Remove player-facing shop, bank, leaderboard, auth, and idea-analysis surfaces from the first flow.
- Keep only HUD-lite, Broono, word tray, feed action, result, and memory.

### Phase 2: Feeding Model

- Add `WordSnack`, `BroonoReaction`, `BroonoMemory`, and `BreakfastState`.
- Add deterministic tray generation from date seed.
- Add selection limit of three snacks.
- Add feed action and memory append.

### Phase 3: Reaction System

- Map word tags to visual classes.
- Add Broono expression variants.
- Add generated form names and memory templates.
- Add result card.

### Phase 4: Tiny Word Challenge

- Add one optional challenge: pick a word matching a clue.
- Reward one rare ingredient for the next meal.
- Keep it optional and short.

### Phase 5: Verify

- Unit test deterministic tray/reaction/memory generation.
- E2E test first session.
- Screenshot mobile viewport.
- Deploy only if the first viewport reads as a pet toy, not a dashboard.

## Future Session Rules

Every future implementation session should start by checking this document.

Before editing, answer:

1. Does this make Broono more central?
2. Does this make the daily feeding loop clearer?
3. Does this create a memory, reaction, or collectible artifact?
4. Is it safe for children and trusted by adults?
5. Is it maintainable by a small indie team?

If the answer is no, do not build it.

## Current Recommendation

Stop improving `Snack Pop Quest` as the main product. Use it only as a learning artifact.

Build `Broono's Weird Breakfast` next.


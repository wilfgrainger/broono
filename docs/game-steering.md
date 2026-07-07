# Broono Game Steering

Last updated: 2026-07-07

## Authority

This document is the game/product steering source for future Broono sessions. It is updated from `steering-research.md` and supersedes the previous `Broono's Weird Breakfast` pivot. `docs/technical-steering.md` still governs platform and architecture unless product direction here requires a different user-facing surface.

## Hard Decision

Broono should restart around:

**Broono Style Showdown**

A safe, no-chat, asynchronous style-and-theme challenge game for a mixed family audience, especially girls roughly 10-13, where players style an avatar plus micro-scene to a prompt, create a polished Broono Card, vote using pre-written reactions, remix themes, and unlock curated weekly drops.

The product sentence:

> Style the theme. Make a Broono Card. Vote safely. Remix the next look.

## Why This Direction

The research in `steering-research.md` points away from generic pet puzzle loops and toward creative identity play:

- Open-ended creative worlds and avatar customization dominate the relevant family-friendly category.
- Style challenge loops have strong viral proof through theme, voting, rank, and remix behavior.
- Children aged 8-13 use avatars for self-representation, alter-ego play, social needs, and performance.
- A full sandbox world is too large for the current team, but an asynchronous style challenge captures the strongest loop with less moderation burden.
- Safe sharing should be card/clip based, not chat or free-text UGC.

## What To Kill

Do not continue `Snack Pop Quest` as the main product.

Kill or hide from the child-facing flow:

- match-2 snack board as the product center
- Booster Bank
- child-facing priced IAP
- open chat
- free-text profiles
- public comments
- global/country/friends leaderboards
- internal idea-ranking panels
- fake daily quests
- pressure timers, energy walls, or guilt loops

## What To Keep

- Mobile-first React/Vite/Capacitor-compatible client.
- Cloudflare Pages deployability.
- Deterministic local game state.
- Broono as mascot/host.
- Bright tactile visual language.
- Safe, curated, whitelist-only content.
- Shareable rendered artifacts.
- Optional auth only after play is already useful.

## First Prototype Scope

The first Style Showdown prototype must prove the loop, not the economy.

Must have:

- one phone-first style challenge flow
- daily/theme prompt
- avatar and micro-scene preview
- curated wardrobe items across hair, top, bottom, shoes, prop, backdrop
- theme tags and deterministic score preview
- Broono Card creation
- local saved cards
- safe voting with pre-written reactions only
- remix/new theme action
- Friday gift mechanic with no random loot
- no real-money purchase UI
- no chat or free text

Should have:

- parent-trust copy
- broad prompt language beyond fashion-only stereotypes
- reduced-motion support
- screenshot/share-card-ready layout
- local persistence

Must not have:

- child-facing IAP
- random loot boxes
- interest-based ads
- user-entered text
- public profiles
- country display
- failure pressure linked to spending

## Design Pillars

### 1. Creative Output First

Every session should produce something a player recognizes as theirs: a Broono Card, look, remix, scene, or saved style.

### 2. Safe Social Without Chat

Players can vote, react, remix, and share rendered cards. They cannot type public text, comment, reveal personal info, or DM.

### 3. Theme Prompts Drive Repeat Play

Prompts should be playful, broad, and remixable:

- Midnight Museum
- Rainbow Goalkeeper
- Space Camp DJ
- Forest Popstar
- Retro Pet Detective

### 4. Cosmetics Over Pressure

Future monetization should sell identity, creativity, and expanded expression. It should not sell relief from frustration.

### 5. Small-Team Maintainability

Prefer curated content packs, deterministic scoring, and static renderable cards over open-world scope or heavy moderation systems.

## Monetization Steering

Do not monetize the first prototype.

Future paid value may include:

- transparent wardrobe packs
- scene prop packs
- pose/animation packs
- VIP closet capacity
- seasonal theme passes
- parent-approved founder packs

Rules:

- parent gate before purchases
- no one-tap spending
- no "best value" dark-pattern labels in child-facing UI
- no randomized paid rewards
- no paid retry or pressure timer relief
- restore purchases and terms before production IAP

## Safety Steering

- Core play must not require account creation.
- Use only curated wardrobe, prompt, reaction, and card text.
- No open chat, free text, public bios, profile photos, or precise location.
- Sharing is rendered artifact first, not a social network.
- Treat parent trust as a product feature.

## Visual Steering

The first viewport should read:

1. Here is today's theme.
2. I style a look.
3. Broono hosts the challenge.
4. I create a card.

Avoid dashboard clutter. Keep HUD minimal. Make avatar and scene the hero.

## Technical Steering

Likely write targets for this iteration:

- `src/game.ts`: style themes, wardrobe, scoring, cards, voting, gifts.
- `src/hooks/useGameLoop.ts`: local state, selection, submission, voting, remix, gift.
- `src/main.tsx`: one mobile-first style studio flow.
- `src/styles.css`: polished fashion-card visual system.
- `src/game.test.ts`: deterministic scoring and safety/loop tests.
- `e2e/broono.spec.ts`: first-session browser flow.

Do not add backend complexity until the loop is compelling.

## Validation Questions

Ask testers:

1. What do you think this app is?
2. What do you do first?
3. Would you make another look?
4. Would you save or share the card?
5. Which theme was most interesting?
6. Did anything feel too young, too old, or unsafe?

Early success target:

- 80% understand the loop within 5 seconds.
- 70% create a first card.
- 50% want another theme.
- 20% say they would share or save the card.

## Current Recommendation

Build and test **Broono Style Showdown** now. Treat all previous puzzle/pet loops as discarded prototypes unless they later re-enter as optional mini-games.


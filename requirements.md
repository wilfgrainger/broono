# requirements.md

## 1. Product Vision & Aesthetics
* **Core Concept**: A mobile-first, Tamagotchi-style pet simulation game focusing on daily care, educational mini-games, and social competition.
* **Art Style**: A bright, playful fusion of pastel pixel art and modern cartoon aesthetics.

## 2. Gameplay Mechanics
* **The Nurture Loop**: The player starts in a casual village home with a free egg. The primary loop requires checking in roughly once a day.
* **Hatching Phase**: Players feed and care for the egg. Upon gaining enough XP, it hatches into a random animal assigned a procedurally generated name.
* **Vitals Management**: Post-hatching, players manage Hunger, Hydration, Temperature, and Happiness. Environmental factors (e.g., location) alter vital decay rates.
* **Offline Calculation**: The frontend calculates offline/idle time since the last login, applying vital decay locally before syncing with the backend to prevent cheating.
* **Mini-Games**: Features addictive but slightly educational mini-games (e.g., basic crosswords, word puzzles) to earn coins and unlock destinations.

## 3. Economy & Progression
* **Currency**: Coins are earned strictly through consistent care and completing mini-games.
* **Shop Mechanics**: The premium shop is locked until a player hoards 1,000 coins.
* **Cosmetics**: Players start with basic free outfits. Premium items include penguin suits, cat ears, and custom collars.
* **Utility & Environments**: Players can purchase utility upgrades (e.g., air conditioning to freeze temperature decay) and unlock new environments, moving from the starter village to a palace or holiday resort.

## 4. Social Features
* **Leaderboards**: Players are ranked by total coin accumulation across three distinct tiers: Global, Country, and Friends & Family.

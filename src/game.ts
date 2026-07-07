export type StyleCategory = 'hair' | 'top' | 'bottom' | 'shoes' | 'prop' | 'backdrop';
export type StyleTag = 'sporty' | 'glam' | 'cozy' | 'spooky' | 'space' | 'retro' | 'nature' | 'music' | 'royal' | 'silly';
export type LeaderboardScope = 'global' | 'country' | 'friends';
export type AuthProvider = 'guest' | 'google' | 'apple';
export type PaymentProductId = 'coin_pouch' | 'coin_vault' | 'starter_bundle' | 'care_pass_monthly';

export type WardrobeItem = {
  id: string;
  name: string;
  category: StyleCategory;
  tags: StyleTag[];
  rarity: 'starter' | 'rare' | 'star';
  color: string;
};

export type StyleTheme = {
  id: string;
  title: string;
  prompt: string;
  tags: StyleTag[];
  palette: string[];
};

export type BroonoCard = {
  id: string;
  themeId: string;
  title: string;
  score: number;
  rank: 'Newcomer' | 'Trendsetter' | 'Style Star';
  itemIds: string[];
  createdAt: string;
  reactions: Record<'clever' | 'colors' | 'wild', number>;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  country: string;
  provider: AuthProvider;
  totalCoins: number;
  friendCode: string;
};

export type Pet = {
  id: string;
  name: string;
  species: string;
  mood: 'curious' | 'sparkly' | 'proud' | 'focused';
  favoriteTag: StyleTag;
};

export type Inventory = {
  coins: number;
  ownedItemIds: string[];
  fridayGiftClaimed: boolean;
};

export type StyleRun = {
  theme: StyleTheme;
  selectedItemIds: Partial<Record<StyleCategory, string>>;
  scorePreview: number;
  submittedCard?: BroonoCard;
  savedCards: BroonoCard[];
  voteCards: BroonoCard[];
};

export type GameState = {
  user: UserProfile;
  pet: Pet;
  run: StyleRun;
  inventory: Inventory;
  purchaseHistory: string[];
};

export const kvKeys = {
  user: (userId: string) => `user:${userId}`,
  pet: (userId: string) => `pet:${userId}`,
  inventory: (userId: string) => `inventory:${userId}`,
  run: (userId: string) => `style-run:${userId}`,
  leaderboard: (scope: LeaderboardScope, segment = 'all') => `leaderboard:${scope}:${segment}`,
};

export const styleThemes: StyleTheme[] = [
  {
    id: 'midnight-museum',
    title: 'Midnight Museum',
    prompt: 'Style a look for sneaking through a moonlit museum gala.',
    tags: ['glam', 'spooky', 'royal'],
    palette: ['#2c175f', '#ff5ba8', '#ffe066'],
  },
  {
    id: 'rainbow-goalkeeper',
    title: 'Rainbow Goalkeeper',
    prompt: 'Build a sporty look that could guard a rainbow castle.',
    tags: ['sporty', 'royal', 'silly'],
    palette: ['#55d6ff', '#7bed8d', '#ffcc3f'],
  },
  {
    id: 'space-camp-dj',
    title: 'Space Camp DJ',
    prompt: 'Create an outfit for a zero-gravity music party.',
    tags: ['space', 'music', 'retro'],
    palette: ['#7b5cff', '#28d9ff', '#ff4f9a'],
  },
  {
    id: 'forest-popstar',
    title: 'Forest Popstar',
    prompt: 'Mix nature, sparkle, and stage energy.',
    tags: ['nature', 'music', 'glam'],
    palette: ['#35d07f', '#ffe066', '#ff70bd'],
  },
  {
    id: 'retro-pet-detective',
    title: 'Retro Pet Detective',
    prompt: 'Dress for solving tiny mysteries at the arcade.',
    tags: ['retro', 'silly', 'cozy'],
    palette: ['#ff8b3d', '#7c5cff', '#8ef3ff'],
  },
];

export const wardrobeItems: WardrobeItem[] = [
  { id: 'hair-cloud-puffs', name: 'Cloud Puffs', category: 'hair', tags: ['cozy', 'silly'], rarity: 'starter', color: '#8ef3ff' },
  { id: 'hair-starlight-bob', name: 'Starlight Bob', category: 'hair', tags: ['glam', 'space'], rarity: 'starter', color: '#b08cff' },
  { id: 'hair-arcade-spikes', name: 'Arcade Spikes', category: 'hair', tags: ['retro', 'music'], rarity: 'rare', color: '#ff5ba8' },
  { id: 'top-moon-jacket', name: 'Moon Jacket', category: 'top', tags: ['space', 'glam'], rarity: 'starter', color: '#4933b8' },
  { id: 'top-varsity-cape', name: 'Varsity Cape', category: 'top', tags: ['sporty', 'royal'], rarity: 'starter', color: '#ffcc3f' },
  { id: 'top-moss-hoodie', name: 'Moss Hoodie', category: 'top', tags: ['nature', 'cozy'], rarity: 'rare', color: '#35d07f' },
  { id: 'bottom-star-skirt', name: 'Star Skirt', category: 'bottom', tags: ['glam', 'music'], rarity: 'starter', color: '#ff70bd' },
  { id: 'bottom-comet-shorts', name: 'Comet Shorts', category: 'bottom', tags: ['sporty', 'space'], rarity: 'starter', color: '#28d9ff' },
  { id: 'bottom-detective-cords', name: 'Detective Cords', category: 'bottom', tags: ['retro', 'cozy'], rarity: 'rare', color: '#d28b54' },
  { id: 'shoes-bubble-boots', name: 'Bubble Boots', category: 'shoes', tags: ['silly', 'space'], rarity: 'starter', color: '#8ef3ff' },
  { id: 'shoes-gala-sneaks', name: 'Gala Sneaks', category: 'shoes', tags: ['glam', 'sporty'], rarity: 'starter', color: '#fff1a6' },
  { id: 'shoes-leaf-stompers', name: 'Leaf Stompers', category: 'shoes', tags: ['nature', 'cozy'], rarity: 'rare', color: '#69e28f' },
  { id: 'prop-mic-wand', name: 'Mic Wand', category: 'prop', tags: ['music', 'glam'], rarity: 'starter', color: '#ff5ba8' },
  { id: 'prop-crown-ball', name: 'Crown Ball', category: 'prop', tags: ['royal', 'sporty'], rarity: 'starter', color: '#ffe066' },
  { id: 'prop-magnifier-lollipop', name: 'Lollipop Lens', category: 'prop', tags: ['retro', 'silly'], rarity: 'star', color: '#56e4ff' },
  { id: 'backdrop-moon-gallery', name: 'Moon Gallery', category: 'backdrop', tags: ['spooky', 'glam'], rarity: 'starter', color: '#2c175f' },
  { id: 'backdrop-castle-field', name: 'Castle Field', category: 'backdrop', tags: ['royal', 'sporty'], rarity: 'starter', color: '#55d6ff' },
  { id: 'backdrop-neon-woods', name: 'Neon Woods', category: 'backdrop', tags: ['nature', 'music'], rarity: 'rare', color: '#35d07f' },
];

export const categories: StyleCategory[] = ['hair', 'top', 'bottom', 'shoes', 'prop', 'backdrop'];

const todaySeed = () => new Date().toISOString().slice(0, 10);

const hashSeed = (seed: string) => {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createRng = (seed: string) => {
  let value = hashSeed(seed);
  return () => {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
};

export function themeForSeed(seed = todaySeed()) {
  return styleThemes[hashSeed(seed) % styleThemes.length];
}

export const createStarterUser = (provider: AuthProvider = 'guest'): UserProfile => ({
  id: `${provider}-demo-user`,
  email: provider === 'apple' ? 'player@privaterelay.appleid.com' : `${provider}@broono.app`,
  displayName: provider === 'guest' ? 'Guest Stylist' : provider === 'apple' ? 'Apple Stylist' : 'Google Stylist',
  country: 'US',
  provider,
  totalCoins: 360,
  friendCode: 'STYLE-0420',
});

export const createStarterPet = (_now = Date.now()): Pet => ({
  id: 'broono-host',
  name: 'Broono',
  species: 'Style Sprite',
  mood: 'curious',
  favoriteTag: 'silly',
});

const starterSelection = (theme: StyleTheme): Partial<Record<StyleCategory, string>> => {
  const selection: Partial<Record<StyleCategory, string>> = {};
  for (const category of categories) {
    const candidates = wardrobeItems.filter((item) => item.category === category);
    const best = candidates.find((item) => item.tags.some((tag) => theme.tags.includes(tag))) ?? candidates[0];
    selection[category] = best.id;
  }
  return selection;
};

const seededVoteCards = (theme: StyleTheme): BroonoCard[] => {
  const rng = createRng(theme.id);
  const names = ['Nova Museum Mix', 'Bubble Crown Sprint', 'Arcade Moon Scout'];
  return names.map((title, index) => {
    const itemIds = categories.map((category) => {
      const candidates = wardrobeItems.filter((item) => item.category === category);
      return candidates[Math.floor(rng() * candidates.length) % candidates.length].id;
    });
    const score = 68 + index * 7 + Math.floor(rng() * 8);
    return {
      id: `seed-${theme.id}-${index}`,
      themeId: theme.id,
      title,
      score,
      rank: score >= 82 ? 'Style Star' : 'Trendsetter',
      itemIds,
      createdAt: new Date(0).toISOString(),
      reactions: { clever: 12 + index * 4, colors: 9 + index * 3, wild: 7 + index * 5 },
    };
  });
};

export function scoreLook(theme: StyleTheme, selectedItemIds: Partial<Record<StyleCategory, string>>) {
  const selected = Object.values(selectedItemIds)
    .map((id) => wardrobeItems.find((item) => item.id === id))
    .filter((item): item is WardrobeItem => Boolean(item));
  const coverage = categories.filter((category) => selected.some((item) => item.category === category)).length * 8;
  const tagMatches = selected.flatMap((item) => item.tags).filter((tag) => theme.tags.includes(tag)).length;
  const variety = new Set(selected.flatMap((item) => item.tags)).size;
  return Math.min(100, Math.round(28 + coverage + tagMatches * 7 + variety * 1.5));
}

export function rankForScore(score: number): BroonoCard['rank'] {
  if (score >= 88) return 'Style Star';
  if (score >= 72) return 'Trendsetter';
  return 'Newcomer';
}

export function createStarterGameState(provider: AuthProvider = 'guest', seed = todaySeed()): GameState {
  const theme = themeForSeed(seed);
  const selectedItemIds = starterSelection(theme);
  return {
    user: createStarterUser(provider),
    pet: createStarterPet(),
    run: {
      theme,
      selectedItemIds,
      scorePreview: scoreLook(theme, selectedItemIds),
      savedCards: [],
      voteCards: seededVoteCards(theme),
    },
    inventory: {
      coins: 360,
      ownedItemIds: wardrobeItems.filter((item) => item.rarity === 'starter').map((item) => item.id),
      fridayGiftClaimed: false,
    },
    purchaseHistory: [],
  };
}

export function selectWardrobeItem(state: GameState, itemId: string): GameState {
  const item = wardrobeItems.find((candidate) => candidate.id === itemId);
  if (!item || !state.inventory.ownedItemIds.includes(itemId)) return state;
  const selectedItemIds = { ...state.run.selectedItemIds, [item.category]: item.id };
  return {
    ...state,
    pet: { ...state.pet, mood: item.tags.some((tag) => state.run.theme.tags.includes(tag)) ? 'sparkly' : 'focused' },
    run: { ...state.run, selectedItemIds, scorePreview: scoreLook(state.run.theme, selectedItemIds), submittedCard: undefined },
  };
}

const titleForLook = (theme: StyleTheme, selectedItemIds: Partial<Record<StyleCategory, string>>) => {
  const selected = Object.values(selectedItemIds)
    .map((id) => wardrobeItems.find((item) => item.id === id))
    .filter((item): item is WardrobeItem => Boolean(item));
  const strongestTag = theme.tags.find((tag) => selected.some((item) => item.tags.includes(tag))) ?? theme.tags[0];
  const prop = selected.find((item) => item.category === 'prop')?.name.replace('Lollipop ', '') ?? 'Look';
  return `${strongestTag[0].toUpperCase()}${strongestTag.slice(1)} ${prop}`;
};

export function submitLook(state: GameState, now = new Date()): GameState {
  const score = scoreLook(state.run.theme, state.run.selectedItemIds);
  const card: BroonoCard = {
    id: `card-${state.run.theme.id}-${now.getTime().toString(36)}`,
    themeId: state.run.theme.id,
    title: titleForLook(state.run.theme, state.run.selectedItemIds),
    score,
    rank: rankForScore(score),
    itemIds: categories.map((category) => state.run.selectedItemIds[category]).filter((id): id is string => Boolean(id)),
    createdAt: now.toISOString(),
    reactions: { clever: 0, colors: 0, wild: 0 },
  };
  return {
    ...state,
    user: { ...state.user, totalCoins: state.user.totalCoins + 45 },
    pet: { ...state.pet, mood: score >= 88 ? 'proud' : 'sparkly' },
    inventory: { ...state.inventory, coins: state.inventory.coins + 45 },
    run: {
      ...state.run,
      submittedCard: card,
      savedCards: [card, ...state.run.savedCards].slice(0, 7),
    },
  };
}

export function voteForCard(state: GameState, cardId: string, reaction: keyof BroonoCard['reactions']): GameState {
  return {
    ...state,
    run: {
      ...state.run,
      voteCards: state.run.voteCards.map((card) => (
        card.id === cardId
          ? { ...card, reactions: { ...card.reactions, [reaction]: card.reactions[reaction] + 1 } }
          : card
      )),
    },
  };
}

export function remixTheme(state: GameState, seed = `${state.run.theme.id}:remix`): GameState {
  const rng = createRng(seed);
  const theme = styleThemes[Math.floor(rng() * styleThemes.length) % styleThemes.length];
  const selectedItemIds = starterSelection(theme);
  return {
    ...state,
    pet: { ...state.pet, mood: 'curious' },
    run: {
      theme,
      selectedItemIds,
      scorePreview: scoreLook(theme, selectedItemIds),
      submittedCard: undefined,
      savedCards: state.run.savedCards,
      voteCards: seededVoteCards(theme),
    },
  };
}

export function claimFridayGift(state: GameState): GameState {
  if (state.inventory.fridayGiftClaimed) return state;
  const gift = wardrobeItems.find((item) => item.rarity === 'star');
  return {
    ...state,
    inventory: {
      ...state.inventory,
      fridayGiftClaimed: true,
      ownedItemIds: Array.from(new Set([...state.inventory.ownedItemIds, ...(gift ? [gift.id] : [])])),
    },
  };
}

export const leaderboard: Record<LeaderboardScope, Array<{ name: string; score: number; region: string; level: number }>> = {
  global: [
    { name: 'Mika', score: 94, region: 'JP', level: 31 },
    { name: 'Ava', score: 91, region: 'US', level: 28 },
    { name: 'Noah', score: 88, region: 'GB', level: 25 },
  ],
  country: [
    { name: 'Ava', score: 91, region: 'US', level: 28 },
    { name: 'Sol', score: 86, region: 'US', level: 21 },
    { name: 'Jun', score: 81, region: 'US', level: 18 },
  ],
  friends: [
    { name: 'You', score: 76, region: 'US', level: 1 },
    { name: 'Rae', score: 74, region: 'US', level: 1 },
    { name: 'Kit', score: 72, region: 'CA', level: 1 },
  ],
};

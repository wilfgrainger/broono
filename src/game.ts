export type VitalName = 'hunger' | 'hydration' | 'temperature' | 'happiness';
export type Vitals = Record<VitalName, number>;
export type EnvironmentId = 'village' | 'palace' | 'resort';
export type LeaderboardScope = 'global' | 'country' | 'friends';
export type AuthProvider = 'guest' | 'google' | 'apple';
export type PaymentProductId = 'coin_pouch' | 'coin_vault' | 'starter_bundle' | 'care_pass_monthly';

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
  stage: 'egg' | 'hatched';
  species?: string;
  name?: string;
  xp: number;
  level: number;
  vitals: Vitals;
  lastSeenAt: number;
  environment: EnvironmentId;
  hasAirConditioning: boolean;
};

export type Inventory = {
  coins: number;
  ownedItemIds: string[];
  unlockedEnvironmentIds: EnvironmentId[];
  premiumPassActive: boolean;
};

export type GameState = {
  user: UserProfile;
  pet: Pet;
  inventory: Inventory;
  purchaseHistory: string[];
};

export const HATCH_XP = 100;
export const SHOP_UNLOCK_COINS = 1000;

export const kvKeys = {
  user: (userId: string) => `user:${userId}`,
  pet: (userId: string) => `pet:${userId}`,
  inventory: (userId: string) => `inventory:${userId}`,
  leaderboard: (scope: LeaderboardScope, segment = 'all') => `leaderboard:${scope}:${segment}`,
};

export const environments: Record<EnvironmentId, { label: string; description: string; decay: Vitals; unlock: string }> = {
  village: {
    label: 'Village Home',
    description: 'A cozy starter cottage for a free egg and gentle daily check-ins.',
    decay: { hunger: 1.4, hydration: 1.2, temperature: 0.7, happiness: 0.9 },
    unlock: 'Default',
  },
  palace: {
    label: 'Moonlit Palace',
    description: 'A glittering upgrade with slower happiness decay and regal backdrops.',
    decay: { hunger: 1.2, hydration: 1, temperature: 0.5, happiness: 0.45 },
    unlock: 'Win 3 word puzzles',
  },
  resort: {
    label: 'Holiday Resort',
    description: 'Sunny beaches that boost happiness, but hydration drains faster.',
    decay: { hunger: 1.1, hydration: 1.8, temperature: 1.1, happiness: 0.35 },
    unlock: 'Complete crossword streak',
  },
};

const species = ['otter', 'fox', 'penguin', 'capybara', 'kitten', 'dragon'];
const names = ['Pip', 'Barnaby', 'Sprout', 'Mochi', 'Bubbles', 'Nori'];

export const createStarterUser = (provider: AuthProvider = 'guest'): UserProfile => ({
  id: `${provider}-demo-user`,
  email: provider === 'apple' ? 'player@privaterelay.appleid.com' : `${provider}@broono.app`,
  displayName: provider === 'guest' ? 'Guest Ranger' : provider === 'apple' ? 'Apple Ranger' : 'Google Ranger',
  country: 'US',
  provider,
  totalCoins: 940,
  friendCode: 'BRN-0420',
});

export const createStarterPet = (now = Date.now()): Pet => ({
  id: 'pet-demo',
  stage: 'egg',
  xp: 0,
  level: 1,
  vitals: { hunger: 88, hydration: 90, temperature: 78, happiness: 84 },
  lastSeenAt: now,
  environment: 'village',
  hasAirConditioning: false,
});

export const createStarterGameState = (provider: AuthProvider = 'guest', now = Date.now()): GameState => ({
  user: createStarterUser(provider),
  pet: createStarterPet(now),
  inventory: { coins: 940, ownedItemIds: ['basic-cap'], unlockedEnvironmentIds: ['village'], premiumPassActive: false },
  purchaseHistory: [],
});

export function applyOfflineDecay(pet: Pet, now = Date.now()): Pet {
  const hours = Math.max(0, (now - pet.lastSeenAt) / 3_600_000);
  const decay = environments[pet.environment].decay;
  const nextVitals = Object.fromEntries(
    Object.entries(pet.vitals).map(([key, value]) => {
      const vital = key as VitalName;
      const decayRate = vital === 'temperature' && pet.hasAirConditioning ? 0 : decay[vital];
      return [vital, Math.max(0, Math.round(value - decayRate * hours))];
    }),
  ) as Vitals;
  return { ...pet, vitals: nextVitals, lastSeenAt: Math.max(pet.lastSeenAt, now) };
}

export function careForPet(pet: Pet, vital: VitalName): Pet {
  const vitals = { ...pet.vitals, [vital]: Math.min(100, pet.vitals[vital] + 16) };
  const xp = pet.xp + 14;
  if (pet.stage === 'egg' && xp >= HATCH_XP) {
    const index = Math.floor((xp + Object.values(vitals).reduce((a, b) => a + b, 0)) % species.length);
    return { ...pet, stage: 'hatched', species: species[index], name: names[index], xp, level: 2, vitals };
  }
  return { ...pet, xp, level: 1 + Math.floor(xp / HATCH_XP), vitals };
}

export function awardMiniGameCoins(state: GameState, coins = 85): GameState {
  const totalCoins = state.user.totalCoins + coins;
  return {
    ...state,
    user: { ...state.user, totalCoins },
    inventory: { ...state.inventory, coins: state.inventory.coins + coins },
  };
}

export function canOpenPremiumShop(coins: number) {
  return coins >= SHOP_UNLOCK_COINS;
}

export const iapRewards: Record<PaymentProductId, { coins: number; itemIds: string[]; premiumPassActive?: boolean }> = {
  coin_pouch: { coins: 500, itemIds: [] },
  coin_vault: { coins: 3200, itemIds: [] },
  starter_bundle: { coins: 900, itemIds: ['launch-hoodie', 'sparkle-bowl'] },
  care_pass_monthly: { coins: 1200, itemIds: ['vip-ribbon'], premiumPassActive: true },
};

export function grantIapReward(state: GameState, productId: PaymentProductId, receiptId: string): GameState {
  const reward = iapRewards[productId];
  if (!reward || state.purchaseHistory.includes(receiptId)) return state;

  const ownedItemIds = Array.from(new Set([...state.inventory.ownedItemIds, ...reward.itemIds]));
  const totalCoins = state.user.totalCoins + reward.coins;

  return {
    ...state,
    user: { ...state.user, totalCoins },
    inventory: {
      ...state.inventory,
      coins: state.inventory.coins + reward.coins,
      ownedItemIds,
      premiumPassActive: state.inventory.premiumPassActive || Boolean(reward.premiumPassActive),
    },
    purchaseHistory: [receiptId, ...state.purchaseHistory],
  };
}

export const shopItems = [
  { id: 'basic-cap', name: 'Starter Cap', category: 'Basic Cosmetic', cost: 0, premium: false },
  { id: 'penguin-suit', name: 'Penguin Suit', category: 'Premium Cosmetic', cost: 1200, premium: true },
  { id: 'cat-ears', name: 'Cat Ears', category: 'Premium Cosmetic', cost: 1050, premium: true },
  { id: 'custom-collar', name: 'Custom Collar', category: 'Premium Cosmetic', cost: 1300, premium: true },
  { id: 'launch-hoodie', name: 'Launch Hoodie', category: 'IAP Bundle Cosmetic', cost: 900, premium: true },
  { id: 'sparkle-bowl', name: 'Sparkle Bowl', category: 'IAP Bundle Cosmetic', cost: 900, premium: true },
  { id: 'vip-ribbon', name: 'VIP Ribbon', category: 'Care Pass Cosmetic', cost: 1200, premium: true },
  { id: 'ac', name: 'Air Conditioning', category: 'Utility Upgrade', cost: 1500, premium: true },
];

export const leaderboard: Record<LeaderboardScope, Array<{ name: string; coins: number; region: string }>> = {
  global: [
    { name: 'Mika', coins: 2420, region: 'JP' },
    { name: 'Ava', coins: 1990, region: 'US' },
    { name: 'Noah', coins: 1705, region: 'GB' },
  ],
  country: [
    { name: 'Ava', coins: 1990, region: 'US' },
    { name: 'Sol', coins: 1510, region: 'US' },
    { name: 'Jun', coins: 1185, region: 'US' },
  ],
  friends: [
    { name: 'You', coins: 940, region: 'US' },
    { name: 'Rae', coins: 880, region: 'US' },
    { name: 'Kit', coins: 720, region: 'CA' },
  ],
};

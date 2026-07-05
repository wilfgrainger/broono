import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HATCH_XP,
  applyOfflineDecay,
  careForPet,
  createStarterGameState,
  createStarterPet,
  leaderboard,
  shopItems,
  type Pet,
  grantIapReward,
  iapRewards,
  type VitalName,
} from './game';

type AuthUser = { id: string; displayName: string; country: string };
type AuthState = { status: 'anonymous'; user: null } | { status: 'signed-in'; user: AuthUser };

class MockAuthClient {
  private state: AuthState = { status: 'anonymous', user: null };
  private listeners = new Set<(state: AuthState) => void>();

  get current() {
    return this.state;
  }

  onAuthStateChanged(listener: (state: AuthState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  signIn(user: AuthUser) {
    this.state = { status: 'signed-in', user };
    this.emit();
  }

  signOut() {
    this.state = { status: 'anonymous', user: null };
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) listener(this.state);
  }
}

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'> {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}

const saveSyncedPet = (storage: Pick<Storage, 'setItem'>, userId: string, pet: Pet) => {
  storage.setItem(`broono:${userId}:pet`, JSON.stringify(pet));
};

const loadSyncedPet = (storage: Pick<Storage, 'getItem'>, userId: string, now: number) => {
  const payload = storage.getItem(`broono:${userId}:pet`);
  return payload ? applyOfflineDecay(JSON.parse(payload) as Pet, now) : createStarterPet(now);
};

const premiumShopIsUnlocked = (coins: number) => coins >= 1_000;
const visibleShopItems = (coins: number) => shopItems.filter((item) => !item.premium || premiumShopIsUnlocked(coins));

describe('broono nurture game loop', () => {
  it('applies offline decay from the selected environment and advances lastSeenAt', () => {
    const pet = createStarterPet(0);
    const decayed = applyOfflineDecay(pet, 3_600_000 * 10);

    expect(decayed.vitals).toMatchObject({ hunger: 74, hydration: 78, temperature: 71, happiness: 75 });
    expect(decayed.lastSeenAt).toBe(36_000_000);
  });

  it('uses destination-specific decay and clamps vitals at zero', () => {
    const pet: Pet = {
      ...createStarterPet(0),
      environment: 'resort',
      vitals: { hunger: 6, hydration: 6, temperature: 6, happiness: 6 },
    };

    expect(applyOfflineDecay(pet, 3_600_000 * 10).vitals).toEqual({
      hunger: 0,
      hydration: 0,
      temperature: 0,
      happiness: 3,
    });
  });

  it('does not penalize a pet when a stale sync timestamp moves backwards', () => {
    const pet = createStarterPet(60_000);
    const staleSync = applyOfflineDecay(pet, 1_000);

    expect(staleSync.vitals).toEqual(pet.vitals);
    expect(staleSync.lastSeenAt).toBe(60_000);
  });

  it('keeps temperature stable when air conditioning is owned', () => {
    const pet: Pet = { ...createStarterPet(0), hasAirConditioning: true };

    expect(applyOfflineDecay(pet, 3_600_000 * 24).vitals.temperature).toBe(78);
  });

  it.each<VitalName>(['hunger', 'hydration', 'temperature', 'happiness'])('caps %s care at 100 and awards XP', (vital) => {
    const pet: Pet = { ...createStarterPet(), xp: 10, vitals: { ...createStarterPet().vitals, [vital]: 96 } };
    const cared = careForPet(pet, vital);

    expect(cared.vitals[vital]).toBe(100);
    expect(cared.xp).toBe(24);
  });

  it('hatches an egg after enough care XP with a deterministic identity', () => {
    let pet = createStarterPet();
    for (let i = 0; i < Math.ceil(HATCH_XP / 14); i += 1) pet = careForPet(pet, 'happiness');

    expect(pet.stage).toBe('hatched');
    expect(pet.level).toBe(2);
    expect(pet.name).toBeTruthy();
    expect(pet.species).toBeTruthy();
  });
});

describe('premium shop gating', () => {
  it('keeps premium cosmetics and utility upgrades hidden below 1,000 coins', () => {
    expect(premiumShopIsUnlocked(999)).toBe(false);
    expect(visibleShopItems(999)).toEqual([expect.objectContaining({ id: 'basic-cap', premium: false })]);
  });

  it('unlocks the complete premium catalog at the 1,000 coin threshold', () => {
    expect(premiumShopIsUnlocked(1_000)).toBe(true);
    expect(visibleShopItems(1_000).map((item) => item.id)).toEqual(shopItems.map((item) => item.id));
  });

  it('marks every paid premium item with a non-zero coin cost', () => {
    expect(shopItems.filter((item) => item.premium)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'penguin-suit', cost: expect.any(Number) }),
        expect.objectContaining({ id: 'cat-ears', cost: expect.any(Number) }),
        expect.objectContaining({ id: 'ac', cost: expect.any(Number) }),
      ]),
    );
    expect(shopItems.filter((item) => item.premium).every((item) => item.cost > 0)).toBe(true);
  });
});

describe('mocked IAP rewards', () => {
  it('grants coins, bundle items, and idempotent receipt history', () => {
    const state = grantIapReward(createStarterGameState(), 'starter_bundle', 'receipt-1');
    const replayed = grantIapReward(state, 'starter_bundle', 'receipt-1');

    expect(iapRewards.starter_bundle.coins).toBe(900);
    expect(state.inventory.coins).toBe(1840);
    expect(state.inventory.ownedItemIds).toEqual(expect.arrayContaining(['launch-hoodie', 'sparkle-bowl']));
    expect(replayed.inventory.coins).toBe(state.inventory.coins);
    expect(replayed.purchaseHistory).toEqual(['receipt-1']);
  });

  it('activates the care pass entitlement from the subscription product', () => {
    const state = grantIapReward(createStarterGameState(), 'care_pass_monthly', 'receipt-pass');

    expect(state.inventory.premiumPassActive).toBe(true);
    expect(state.inventory.ownedItemIds).toContain('vip-ribbon');
  });
});

describe('auth mocks', () => {
  let auth: MockAuthClient;

  beforeEach(() => {
    auth = new MockAuthClient();
  });

  it('starts anonymous and notifies subscribers immediately', () => {
    const listener = vi.fn();

    auth.onAuthStateChanged(listener);

    expect(auth.current).toEqual({ status: 'anonymous', user: null });
    expect(listener).toHaveBeenCalledWith({ status: 'anonymous', user: null });
  });

  it('can drive signed-in and signed-out states for leaderboard tests', () => {
    const listener = vi.fn();
    const unsubscribe = auth.onAuthStateChanged(listener);

    auth.signIn({ id: 'user-1', displayName: 'Ava', country: 'US' });
    auth.signOut();
    unsubscribe();
    auth.signIn({ id: 'user-2', displayName: 'Mika', country: 'JP' });

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenNthCalledWith(2, {
      status: 'signed-in',
      user: { id: 'user-1', displayName: 'Ava', country: 'US' },
    });
    expect(listener).toHaveBeenLastCalledWith({ status: 'anonymous', user: null });
  });

  it('matches authenticated players to seeded leaderboard rows', () => {
    auth.signIn({ id: 'user-1', displayName: 'Ava', country: 'US' });

    expect(leaderboard.country.some((row) => row.name === auth.current.user?.displayName && row.region === auth.current.user.country)).toBe(true);
    expect(leaderboard.friends[0]).toMatchObject({ name: 'You', region: 'US' });
  });
});

describe('state sync test adapter', () => {
  it('hydrates a saved pet for a user and applies offline decay once', () => {
    const storage = new MemoryStorage();
    const savedAt = 100_000;
    const hydratedAt = savedAt + 3_600_000 * 2;
    const pet = careForPet(createStarterPet(savedAt), 'hunger');

    saveSyncedPet(storage, 'user-1', pet);
    const hydrated = loadSyncedPet(storage, 'user-1', hydratedAt);

    expect(hydrated.xp).toBe(14);
    expect(hydrated.vitals.hunger).toBe(97);
    expect(hydrated.vitals.hydration).toBe(88);
    expect(hydrated.lastSeenAt).toBe(hydratedAt);
  });

  it('isolates synced pets by authenticated user id', () => {
    const storage = new MemoryStorage();
    const userOnePet = careForPet(createStarterPet(0), 'hunger');
    const userTwoPet = careForPet(createStarterPet(0), 'happiness');

    saveSyncedPet(storage, 'user-1', userOnePet);
    saveSyncedPet(storage, 'user-2', userTwoPet);

    expect(loadSyncedPet(storage, 'user-1', 0).vitals.hunger).toBe(100);
    expect(loadSyncedPet(storage, 'user-2', 0).vitals.happiness).toBe(100);
  });

  it('creates a fresh starter pet when no synced state exists', () => {
    const storage = new MemoryStorage();

    expect(loadSyncedPet(storage, 'missing-user', 42)).toEqual(createStarterPet(42));
  });
});

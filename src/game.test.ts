import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  claimFridayGift,
  createStarterGameState,
  createStarterPet,
  leaderboard,
  remixTheme,
  scoreLook,
  selectWardrobeItem,
  submitLook,
  themeForSeed,
  voteForCard,
  wardrobeItems,
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

const saveSyncedPet = (storage: Pick<Storage, 'setItem'>, userId: string, pet: ReturnType<typeof createStarterPet>) => {
  storage.setItem(`broono:${userId}:pet`, JSON.stringify(pet));
};

const loadSyncedPet = (storage: Pick<Storage, 'getItem'>, userId: string) => {
  const payload = storage.getItem(`broono:${userId}:pet`);
  return payload ? JSON.parse(payload) as ReturnType<typeof createStarterPet> : createStarterPet();
};

describe('style showdown model', () => {
  it('selects deterministic daily themes', () => {
    expect(themeForSeed('2026-07-07')).toEqual(themeForSeed('2026-07-07'));
    expect(themeForSeed('2026-07-07')).not.toEqual(themeForSeed('2026-07-08'));
  });

  it('creates a starter look with every category represented', () => {
    const state = createStarterGameState('guest', '2026-07-07');

    expect(Object.values(state.run.selectedItemIds).filter(Boolean)).toHaveLength(6);
    expect(state.run.scorePreview).toBeGreaterThan(60);
    expect(state.inventory.ownedItemIds).toEqual(expect.arrayContaining(['hair-cloud-puffs', 'top-moon-jacket']));
  });

  it('scores looks higher when selected items match theme tags', () => {
    const state = createStarterGameState('guest', '2026-07-07');
    const lowMatch = {
      hair: 'hair-cloud-puffs',
      top: 'top-moss-hoodie',
      bottom: 'bottom-detective-cords',
      shoes: 'shoes-leaf-stompers',
      prop: 'prop-magnifier-lollipop',
      backdrop: 'backdrop-neon-woods',
    };

    expect(scoreLook(state.run.theme, state.run.selectedItemIds)).toBeGreaterThan(scoreLook(state.run.theme, lowMatch));
  });

  it('updates the selected look and preview score only for owned items', () => {
    const state = createStarterGameState();
    const owned = selectWardrobeItem(state, 'top-varsity-cape');
    const locked = selectWardrobeItem(state, 'top-moss-hoodie');

    expect(owned.run.selectedItemIds.top).toBe('top-varsity-cape');
    expect(owned.pet.mood).toMatch(/sparkly|focused/);
    expect(locked.run.selectedItemIds.top).toBe(state.run.selectedItemIds.top);
  });

  it('submits a Broono Card, rewards coins, and stores local history', () => {
    const state = createStarterGameState();
    const submitted = submitLook(state, new Date('2026-07-07T12:00:00.000Z'));

    expect(submitted.run.submittedCard?.title).toBeTruthy();
    expect(submitted.run.submittedCard?.score).toBe(submitted.run.scorePreview);
    expect(submitted.run.savedCards).toHaveLength(1);
    expect(submitted.inventory.coins).toBe(state.inventory.coins + 45);
  });

  it('votes with pre-written reactions and remixes to a new safe theme', () => {
    const state = createStarterGameState('guest', '2026-07-07');
    const card = state.run.voteCards[0];
    const voted = voteForCard(state, card.id, 'clever');
    const remixed = remixTheme(voted, 'forced-remix');

    expect(voted.run.voteCards[0].reactions.clever).toBe(card.reactions.clever + 1);
    expect(remixed.run.theme.id).toBeTruthy();
    expect(remixed.run.submittedCard).toBeUndefined();
  });

  it('claims the Friday gift once without random loot behavior', () => {
    const state = createStarterGameState();
    const claimed = claimFridayGift(state);
    const replayed = claimFridayGift(claimed);

    expect(claimed.inventory.fridayGiftClaimed).toBe(true);
    expect(claimed.inventory.ownedItemIds).toContain('prop-magnifier-lollipop');
    expect(replayed.inventory.ownedItemIds).toEqual(claimed.inventory.ownedItemIds);
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

  it('can drive signed-in and signed-out states for style tests', () => {
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

  it('keeps leaderboard data coarse if reused later', () => {
    auth.signIn({ id: 'user-1', displayName: 'Ava', country: 'US' });

    expect(leaderboard.country.some((row) => row.name === auth.current.user?.displayName && row.region === auth.current.user.country)).toBe(true);
    expect(leaderboard.friends[0]).toMatchObject({ name: 'You', region: 'US' });
  });
});

describe('state sync test adapter', () => {
  it('hydrates a saved Broono host for a user', () => {
    const storage = new MemoryStorage();
    const pet = { ...createStarterPet(), mood: 'proud' as const };

    saveSyncedPet(storage, 'user-1', pet);

    expect(loadSyncedPet(storage, 'user-1')).toEqual(pet);
  });

  it('isolates synced Broono state by authenticated user id', () => {
    const storage = new MemoryStorage();
    const userOnePet = { ...createStarterPet(), favoriteTag: 'glam' as const };
    const userTwoPet = { ...createStarterPet(), favoriteTag: 'retro' as const };

    saveSyncedPet(storage, 'user-1', userOnePet);
    saveSyncedPet(storage, 'user-2', userTwoPet);

    expect(loadSyncedPet(storage, 'user-1').favoriteTag).toBe('glam');
    expect(loadSyncedPet(storage, 'user-2').favoriteTag).toBe('retro');
  });

  it('creates a fresh Broono host when no synced state exists', () => {
    const storage = new MemoryStorage();

    expect(loadSyncedPet(storage, 'missing-user')).toEqual(createStarterPet());
  });
});

describe('wardrobe content safety', () => {
  it('uses a closed, curated item list without free text', () => {
    expect(wardrobeItems.length).toBeGreaterThanOrEqual(18);
    expect(wardrobeItems.every((item) => item.name.length > 0 && item.tags.length > 0)).toBe(true);
  });
});

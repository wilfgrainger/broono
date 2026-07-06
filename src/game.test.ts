import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  advanceLevel,
  canOpenPrizeShop,
  createBoard,
  createStarterGameState,
  createStarterPet,
  findLargestCluster,
  getCluster,
  grantIapReward,
  hasPlayableCluster,
  iapRewards,
  leaderboard,
  playTile,
  retryLevel,
  shopItems,
  useBooster,
  type Board,
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

const playableBoard: Board = [
  ['berry', 'berry', 'lemon', 'mint', 'soda', 'grape'],
  ['lemon', 'mint', 'lemon', 'mint', 'soda', 'grape'],
  ['mint', 'grape', 'grape', 'mint', 'lemon', 'berry'],
  ['soda', 'soda', 'grape', 'lemon', 'berry', 'mint'],
  ['berry', 'lemon', 'mint', 'soda', 'grape', 'lemon'],
  ['grape', 'mint', 'soda', 'berry', 'lemon', 'soda'],
  ['mint', 'soda', 'berry', 'grape', 'mint', 'berry'],
];

const withBoard = (board: Board) => ({
  ...createStarterGameState(),
  run: {
    ...createStarterGameState().run,
    board,
    seed: 'test-board',
  },
});

const saveSyncedPet = (storage: Pick<Storage, 'setItem'>, userId: string, pet: ReturnType<typeof createStarterPet>) => {
  storage.setItem(`broono:${userId}:pet`, JSON.stringify(pet));
};

const loadSyncedPet = (storage: Pick<Storage, 'getItem'>, userId: string) => {
  const payload = storage.getItem(`broono:${userId}:pet`);
  return payload ? JSON.parse(payload) as ReturnType<typeof createStarterPet> : createStarterPet();
};

describe('snack pop board mechanics', () => {
  it('creates deterministic playable boards from the same seed', () => {
    const board = createBoard('same-seed');

    expect(board).toEqual(createBoard('same-seed'));
    expect(board).not.toEqual(createBoard('different-seed'));
    expect(hasPlayableCluster(board)).toBe(true);
  });

  it('finds connected snack clusters without crossing colors', () => {
    expect(getCluster(playableBoard, 0, 0)).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
    expect(getCluster(playableBoard, 0, 2).length).toBe(2);
  });

  it('scores a valid pop, spends one move, refills the board, and grants coins', () => {
    const state = withBoard(playableBoard);
    const next = playTile(state, 0, 0);

    expect(next.run.score).toBe(40);
    expect(next.run.movesLeft).toBe(state.run.movesLeft - 1);
    expect(next.run.bestCluster).toBe(2);
    expect(next.inventory.coins).toBe(state.inventory.coins + 1);
    expect(next.run.board).not.toEqual(playableBoard);
    expect(hasPlayableCluster(next.run.board)).toBe(true);
  });

  it('adds combo pressure for larger pops and marks the level won at target', () => {
    const state = {
      ...withBoard(playableBoard),
      run: {
        ...withBoard(playableBoard).run,
        targetScore: 20,
      },
    };
    const next = playTile(state, 0, 0);

    expect(next.run.status).toBe('won');
    expect(next.pet.mood).toBe('full');
    expect(next.inventory.coins).toBe(state.inventory.coins + 36);
  });

  it('advances after wins and consumes hearts on retry', () => {
    const won = { ...withBoard(playableBoard), run: { ...withBoard(playableBoard).run, status: 'won' as const } };
    const nextLevel = advanceLevel(won);
    const retried = retryLevel(nextLevel);

    expect(nextLevel.run.level).toBe(2);
    expect(nextLevel.inventory.hearts).toBe(5);
    expect(retried.run.level).toBe(2);
    expect(retried.inventory.hearts).toBe(4);
  });

  it('uses boosters for board recovery and biggest-cluster clearing', () => {
    const state = withBoard(playableBoard);
    const shuffled = useBooster(state, 'shuffle');
    const spooned = useBooster(state, 'spoon');

    expect(shuffled.inventory.boosters.shuffle).toBe(1);
    expect(shuffled.run.board).not.toEqual(state.run.board);
    expect(findLargestCluster(state.run.board).length).toBeGreaterThanOrEqual(2);
    expect(spooned.inventory.boosters.spoon).toBe(0);
    expect(spooned.run.score).toBeGreaterThan(0);
  });
});

describe('premium shop and mocked purchases', () => {
  it('keeps the prize shop gated until level 3', () => {
    expect(canOpenPrizeShop(2)).toBe(false);
    expect(canOpenPrizeShop(3)).toBe(true);
    expect(shopItems.filter((item) => item.premium).every((item) => item.cost > 0)).toBe(true);
  });

  it('grants coins, cosmetics, boosters, and idempotent receipt history', () => {
    const state = grantIapReward(createStarterGameState(), 'starter_bundle', 'receipt-1');
    const replayed = grantIapReward(state, 'starter_bundle', 'receipt-1');

    expect(iapRewards.starter_bundle.coins).toBe(900);
    expect(state.inventory.coins).toBe(1260);
    expect(state.inventory.ownedItemIds).toEqual(expect.arrayContaining(['gummy-cape', 'star-tray']));
    expect(state.inventory.boosters.spoon).toBe(3);
    expect(replayed.inventory.coins).toBe(state.inventory.coins);
    expect(replayed.purchaseHistory).toEqual(['receipt-1']);
  });

  it('activates the snack pass entitlement from the subscription product', () => {
    const state = grantIapReward(createStarterGameState(), 'care_pass_monthly', 'receipt-pass');

    expect(state.inventory.premiumPassActive).toBe(true);
    expect(state.inventory.ownedItemIds).toContain('vip-crown');
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
  it('hydrates a saved pet for a user', () => {
    const storage = new MemoryStorage();
    const pet = { ...createStarterPet(), mood: 'hyped' as const };

    saveSyncedPet(storage, 'user-1', pet);

    expect(loadSyncedPet(storage, 'user-1')).toEqual(pet);
  });

  it('isolates synced pets by authenticated user id', () => {
    const storage = new MemoryStorage();
    const userOnePet = { ...createStarterPet(), name: 'Broono One' };
    const userTwoPet = { ...createStarterPet(), name: 'Broono Two' };

    saveSyncedPet(storage, 'user-1', userOnePet);
    saveSyncedPet(storage, 'user-2', userTwoPet);

    expect(loadSyncedPet(storage, 'user-1').name).toBe('Broono One');
    expect(loadSyncedPet(storage, 'user-2').name).toBe('Broono Two');
  });

  it('creates a fresh starter pet when no synced state exists', () => {
    const storage = new MemoryStorage();

    expect(loadSyncedPet(storage, 'missing-user')).toEqual(createStarterPet());
  });
});

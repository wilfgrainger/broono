export type TileColor = 'berry' | 'lemon' | 'mint' | 'soda' | 'grape';
export type Board = TileColor[][];
export type LeaderboardScope = 'global' | 'country' | 'friends';
export type AuthProvider = 'guest' | 'google' | 'apple';
export type PaymentProductId = 'coin_pouch' | 'coin_vault' | 'starter_bundle' | 'care_pass_monthly';
export type BoosterId = 'shuffle' | 'spoon';

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
  level: number;
  mood: 'hungry' | 'hyped' | 'full' | 'sleepy';
  outfitId: string;
};

export type PuzzleRun = {
  id: string;
  seed: string;
  level: number;
  board: Board;
  score: number;
  targetScore: number;
  movesLeft: number;
  combo: number;
  bestCluster: number;
  turn: number;
  status: 'playing' | 'won' | 'lost';
  lastPop?: {
    clusterSize: number;
    points: number;
    coins: number;
  };
};

export type Inventory = {
  coins: number;
  hearts: number;
  ownedItemIds: string[];
  boosters: Record<BoosterId, number>;
  premiumPassActive: boolean;
};

export type GameState = {
  user: UserProfile;
  pet: Pet;
  run: PuzzleRun;
  inventory: Inventory;
  purchaseHistory: string[];
};

export type BoardPosition = { row: number; col: number };

export const BOARD_WIDTH = 6;
export const BOARD_HEIGHT = 7;
export const tileColors: TileColor[] = ['berry', 'lemon', 'mint', 'soda', 'grape'];
export const PRIZE_SHOP_LEVEL = 3;

export const kvKeys = {
  user: (userId: string) => `user:${userId}`,
  pet: (userId: string) => `pet:${userId}`,
  inventory: (userId: string) => `inventory:${userId}`,
  run: (userId: string) => `run:${userId}`,
  leaderboard: (scope: LeaderboardScope, segment = 'all') => `leaderboard:${scope}:${segment}`,
};

const tileLabels: Record<TileColor, string> = {
  berry: 'Berry',
  lemon: 'Lemon',
  mint: 'Mint',
  soda: 'Soda',
  grape: 'Grape',
};

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

const pickTile = (rng: () => number, colors = tileColors) => colors[Math.floor(rng() * colors.length) % colors.length];

export const labelForTile = (tile: TileColor) => tileLabels[tile];

export function createBoard(seed: string, width = BOARD_WIDTH, height = BOARD_HEIGHT, colors = tileColors): Board {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const rng = createRng(`${seed}:${attempt}`);
    const board = Array.from({ length: height }, () => (
      Array.from({ length: width }, () => pickTile(rng, colors))
    ));
    if (hasPlayableCluster(board)) return board;
  }

  const fallback = Array.from({ length: height }, () => (
    Array.from({ length: width }, (_, col) => colors[col % colors.length])
  ));
  fallback[0][1] = fallback[0][0];
  return fallback;
}

export function getCluster(board: Board, startRow: number, startCol: number): BoardPosition[] {
  const target = board[startRow]?.[startCol];
  if (!target) return [];

  const queue: BoardPosition[] = [{ row: startRow, col: startCol }];
  const visited = new Set<string>();
  const cluster: BoardPosition[] = [];

  while (queue.length > 0) {
    const position = queue.shift()!;
    const key = `${position.row}:${position.col}`;
    if (visited.has(key) || board[position.row]?.[position.col] !== target) continue;

    visited.add(key);
    cluster.push(position);

    queue.push(
      { row: position.row - 1, col: position.col },
      { row: position.row + 1, col: position.col },
      { row: position.row, col: position.col - 1 },
      { row: position.row, col: position.col + 1 },
    );
  }

  return cluster;
}

export function hasPlayableCluster(board: Board) {
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] === board[row]?.[col + 1] || board[row][col] === board[row + 1]?.[col]) return true;
    }
  }
  return false;
}

function ensurePlayableBoard(board: Board, seed: string) {
  if (hasPlayableCluster(board)) return board;
  return createBoard(`${seed}:reshuffle`);
}

function collapseAndRefill(board: Board, removed: Set<string>, seed: string): Board {
  const width = board[0]?.length ?? BOARD_WIDTH;
  const height = board.length || BOARD_HEIGHT;
  const rng = createRng(seed);
  const next = Array.from({ length: height }, () => Array<TileColor>(width));

  for (let col = 0; col < width; col += 1) {
    const survivors: TileColor[] = [];
    for (let row = height - 1; row >= 0; row -= 1) {
      if (!removed.has(`${row}:${col}`)) survivors.push(board[row][col]);
    }

    for (let row = height - 1; row >= 0; row -= 1) {
      next[row][col] = survivors[height - 1 - row] ?? pickTile(rng);
    }
  }

  return ensurePlayableBoard(next, seed);
}

const scoreForCluster = (clusterSize: number, combo: number) => (clusterSize * clusterSize * 10) + (combo * 35);
const coinsForCluster = (clusterSize: number, didWin: boolean) => Math.max(1, Math.floor(clusterSize / 2)) + (didWin ? 35 : 0);
const targetForLevel = (level: number) => 640 + (level - 1) * 170;
const movesForLevel = (level: number) => Math.max(16, 22 - Math.floor((level - 1) / 3));

export const createStarterUser = (provider: AuthProvider = 'guest'): UserProfile => ({
  id: `${provider}-demo-user`,
  email: provider === 'apple' ? 'player@privaterelay.appleid.com' : `${provider}@broono.app`,
  displayName: provider === 'guest' ? 'Guest Popper' : provider === 'apple' ? 'Apple Popper' : 'Google Popper',
  country: 'US',
  provider,
  totalCoins: 360,
  friendCode: 'POP-0420',
});

export const createStarterPet = (_now = Date.now()): Pet => ({
  id: 'snack-buddy',
  name: 'Broono',
  species: 'Sugar Sprite',
  level: 1,
  mood: 'hungry',
  outfitId: 'starter-band',
});

export const createPuzzleRun = (level = 1, seed = `level-${level}`): PuzzleRun => ({
  id: `${seed}-${level}`,
  seed,
  level,
  board: createBoard(seed),
  score: 0,
  targetScore: targetForLevel(level),
  movesLeft: movesForLevel(level),
  combo: 0,
  bestCluster: 0,
  turn: 0,
  status: 'playing',
});

export const createStarterGameState = (provider: AuthProvider = 'guest'): GameState => ({
  user: createStarterUser(provider),
  pet: createStarterPet(),
  run: createPuzzleRun(1, 'broono-launch'),
  inventory: {
    coins: 360,
    hearts: 5,
    ownedItemIds: ['starter-band'],
    boosters: { shuffle: 2, spoon: 1 },
    premiumPassActive: false,
  },
  purchaseHistory: [],
});

export function playTile(state: GameState, row: number, col: number): GameState {
  if (state.run.status !== 'playing') return state;

  const cluster = getCluster(state.run.board, row, col);
  if (cluster.length < 2) {
    return {
      ...state,
      pet: { ...state.pet, mood: 'hungry' },
      run: { ...state.run, combo: 0, lastPop: undefined },
    };
  }

  const combo = cluster.length >= 5 ? state.run.combo + 1 : Math.max(0, state.run.combo - 1);
  const points = scoreForCluster(cluster.length, combo);
  const nextScore = state.run.score + points;
  const movesLeft = state.run.movesLeft - 1;
  const didWin = nextScore >= state.run.targetScore;
  const status = didWin ? 'won' : movesLeft <= 0 ? 'lost' : 'playing';
  const coins = coinsForCluster(cluster.length, didWin);
  const removed = new Set(cluster.map((position) => `${position.row}:${position.col}`));
  const board = collapseAndRefill(state.run.board, removed, `${state.run.seed}:${state.run.turn + 1}`);

  return {
    ...state,
    user: { ...state.user, totalCoins: state.user.totalCoins + coins },
    pet: {
      ...state.pet,
      level: Math.max(state.pet.level, state.run.level),
      mood: didWin ? 'full' : cluster.length >= 6 ? 'hyped' : 'hungry',
    },
    inventory: { ...state.inventory, coins: state.inventory.coins + coins },
    run: {
      ...state.run,
      board,
      score: nextScore,
      movesLeft,
      combo,
      bestCluster: Math.max(state.run.bestCluster, cluster.length),
      turn: state.run.turn + 1,
      status,
      lastPop: { clusterSize: cluster.length, points, coins },
    },
  };
}

export function advanceLevel(state: GameState): GameState {
  if (state.run.status !== 'won') return state;
  const nextLevel = state.run.level + 1;
  return {
    ...state,
    pet: { ...state.pet, level: nextLevel, mood: 'hyped' },
    inventory: { ...state.inventory, hearts: Math.min(5, state.inventory.hearts + 1) },
    run: createPuzzleRun(nextLevel, `level-${nextLevel}-${state.user.id}`),
  };
}

export function retryLevel(state: GameState): GameState {
  const hearts = Math.max(0, state.inventory.hearts - 1);
  return {
    ...state,
    pet: { ...state.pet, mood: hearts === 0 ? 'sleepy' : 'hungry' },
    inventory: { ...state.inventory, hearts },
    run: createPuzzleRun(state.run.level, `${state.run.seed}-retry-${state.run.turn}`),
  };
}

export function useBooster(state: GameState, boosterId: BoosterId): GameState {
  if (state.run.status !== 'playing' || state.inventory.boosters[boosterId] <= 0) return state;

  const boosters = { ...state.inventory.boosters, [boosterId]: state.inventory.boosters[boosterId] - 1 };
  if (boosterId === 'shuffle') {
    return {
      ...state,
      inventory: { ...state.inventory, boosters },
      run: { ...state.run, board: createBoard(`${state.run.seed}:shuffle:${state.run.turn}`), combo: 0 },
    };
  }

  const largest = findLargestCluster(state.run.board);
  if (largest.length < 2) return { ...state, inventory: { ...state.inventory, boosters } };
  const anchor = largest[0];
  const boosted = playTile(state, anchor.row, anchor.col);
  return {
    ...boosted,
    inventory: {
      ...boosted.inventory,
      boosters,
    },
  };
}

export function findLargestCluster(board: Board) {
  const seen = new Set<string>();
  let largest: BoardPosition[] = [];

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      const key = `${row}:${col}`;
      if (seen.has(key)) continue;
      const cluster = getCluster(board, row, col);
      cluster.forEach((position) => seen.add(`${position.row}:${position.col}`));
      if (cluster.length > largest.length) largest = cluster;
    }
  }

  return largest;
}

export function canOpenPrizeShop(level: number) {
  return level >= PRIZE_SHOP_LEVEL;
}

export const iapRewards: Record<PaymentProductId, { coins: number; itemIds: string[]; boosters: Partial<Record<BoosterId, number>>; premiumPassActive?: boolean }> = {
  coin_pouch: { coins: 500, itemIds: [], boosters: { shuffle: 1 } },
  coin_vault: { coins: 3200, itemIds: [], boosters: { shuffle: 5, spoon: 3 } },
  starter_bundle: { coins: 900, itemIds: ['gummy-cape', 'star-tray'], boosters: { shuffle: 2, spoon: 2 } },
  care_pass_monthly: { coins: 1200, itemIds: ['vip-crown'], boosters: { shuffle: 4, spoon: 4 }, premiumPassActive: true },
};

export function grantIapReward(state: GameState, productId: PaymentProductId, receiptId: string): GameState {
  const reward = iapRewards[productId];
  if (!reward || state.purchaseHistory.includes(receiptId)) return state;

  const ownedItemIds = Array.from(new Set([...state.inventory.ownedItemIds, ...reward.itemIds]));
  const boosters = { ...state.inventory.boosters };
  for (const [booster, amount] of Object.entries(reward.boosters)) {
    boosters[booster as BoosterId] += amount ?? 0;
  }

  return {
    ...state,
    user: { ...state.user, totalCoins: state.user.totalCoins + reward.coins },
    inventory: {
      ...state.inventory,
      coins: state.inventory.coins + reward.coins,
      ownedItemIds,
      boosters,
      premiumPassActive: state.inventory.premiumPassActive || Boolean(reward.premiumPassActive),
    },
    purchaseHistory: [receiptId, ...state.purchaseHistory],
  };
}

export const shopItems = [
  { id: 'starter-band', name: 'Starter Band', category: 'Owned Outfit', cost: 0, premium: false },
  { id: 'gummy-cape', name: 'Gummy Cape', category: 'Sprite Outfit', cost: 900, premium: true },
  { id: 'star-tray', name: 'Star Snack Tray', category: 'Board Skin', cost: 1100, premium: true },
  { id: 'rainbow-boots', name: 'Rainbow Boots', category: 'Sprite Outfit', cost: 1250, premium: true },
  { id: 'vip-crown', name: 'VIP Crown', category: 'Snack Pass Outfit', cost: 1400, premium: true },
  { id: 'sugar-castle', name: 'Sugar Castle', category: 'Stage Theme', cost: 1800, premium: true },
];

export const leaderboard: Record<LeaderboardScope, Array<{ name: string; score: number; region: string; level: number }>> = {
  global: [
    { name: 'Mika', score: 18420, region: 'JP', level: 31 },
    { name: 'Ava', score: 15990, region: 'US', level: 28 },
    { name: 'Noah', score: 13705, region: 'GB', level: 25 },
  ],
  country: [
    { name: 'Ava', score: 15990, region: 'US', level: 28 },
    { name: 'Sol', score: 12110, region: 'US', level: 21 },
    { name: 'Jun', score: 9185, region: 'US', level: 18 },
  ],
  friends: [
    { name: 'You', score: 640, region: 'US', level: 1 },
    { name: 'Rae', score: 580, region: 'US', level: 1 },
    { name: 'Kit', score: 420, region: 'CA', level: 1 },
  ],
};

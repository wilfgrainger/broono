import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  advanceLevel,
  createStarterGameState,
  canOpenPrizeShop,
  grantIapReward,
  playTile,
  retryLevel,
  useBooster,
  type AuthProvider,
  type BoosterId,
  type GameState,
  type PaymentProductId,
} from '../game';
import { createApiSync, createMockPaymentClient, type PurchaseReceipt } from '../platform';

const STORAGE_KEY = 'broono.gameState.v2';
const LEGACY_STORAGE_KEY = 'broono.gameState.v1';

function normalizeState(state: unknown, provider: AuthProvider): GameState {
  if (
    typeof state !== 'object'
    || state === null
    || !('run' in state)
    || !('inventory' in state)
    || !('user' in state)
  ) {
    return createStarterGameState(provider);
  }

  const parsed = state as GameState;
  return {
    ...parsed,
    inventory: {
      ...parsed.inventory,
      hearts: parsed.inventory.hearts ?? 5,
      boosters: {
        shuffle: parsed.inventory.boosters?.shuffle ?? 2,
        spoon: parsed.inventory.boosters?.spoon ?? 1,
      },
      premiumPassActive: parsed.inventory.premiumPassActive ?? false,
    },
    purchaseHistory: parsed.purchaseHistory ?? [],
  };
}

function loadState(provider: AuthProvider): GameState {
  if (typeof localStorage === 'undefined') return createStarterGameState(provider);
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return createStarterGameState(provider);
  }

  try {
    return normalizeState(JSON.parse(stored), provider);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return createStarterGameState(provider);
  }
}

export function useGameLoop(provider: AuthProvider = 'guest') {
  const [state, setState] = useState<GameState>(() => loadState(provider));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [lastReceipt, setLastReceipt] = useState<PurchaseReceipt | null>(null);
  const paymentClient = useMemo(() => createMockPaymentClient(), []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSyncStatus('syncing');
      void createApiSync().push({ pet: state.pet, coins: state.inventory.coins }).then(() => {
        setSyncStatus('synced');
      });
    }, 15_000);
    return () => window.clearInterval(id);
  }, [state]);

  const popTile = useCallback((row: number, col: number) => {
    setState((current) => playTile(current, row, col));
  }, []);

  const nextLevel = useCallback(() => {
    setState((current) => advanceLevel(current));
  }, []);

  const retry = useCallback(() => {
    setState((current) => retryLevel(current));
  }, []);

  const triggerBooster = useCallback((boosterId: BoosterId) => {
    setState((current) => useBooster(current, boosterId));
  }, []);

  const signInAs = useCallback((nextProvider: AuthProvider) => {
    setState((current) => ({
      ...current,
      user: {
        ...createStarterGameState(nextProvider).user,
        totalCoins: current.user.totalCoins,
      },
    }));
  }, []);

  const purchase = useCallback(async (productId: PaymentProductId) => {
    const receipt = await paymentClient.purchase(productId);
    setLastReceipt(receipt);
    setState((current) => grantIapReward(current, receipt.productId, receipt.id));
  }, [paymentClient]);

  return useMemo(() => ({
    state,
    popTile,
    nextLevel,
    retry,
    triggerBooster,
    signInAs,
    purchase,
    lastReceipt,
    syncStatus,
    shopUnlocked: canOpenPrizeShop(state.run.level),
  }), [lastReceipt, nextLevel, popTile, purchase, retry, signInAs, state, syncStatus, triggerBooster]);
}

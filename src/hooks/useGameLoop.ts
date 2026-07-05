import { useCallback, useEffect, useMemo, useState } from 'react';
import { awardMiniGameCoins, careForPet, createStarterGameState, applyOfflineDecay, canOpenPremiumShop, grantIapReward, type AuthProvider, type GameState, type PaymentProductId, type VitalName } from '../game';
import { createApiSync, createMockPaymentClient, type PurchaseReceipt } from '../platform';

const STORAGE_KEY = 'broono.gameState.v1';

function normalizeState(state: GameState): GameState {
  return {
    ...state,
    inventory: {
      ...state.inventory,
      premiumPassActive: state.inventory.premiumPassActive ?? false,
    },
    purchaseHistory: state.purchaseHistory ?? [],
  };
}

function loadState(provider: AuthProvider): GameState {
  if (typeof localStorage === 'undefined') return createStarterGameState(provider, Date.now() - 21_600_000);
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return createStarterGameState(provider, Date.now() - 21_600_000);
  try {
    return normalizeState(JSON.parse(stored) as GameState);
  } catch {
    return createStarterGameState(provider, Date.now() - 21_600_000);
  }
}

export function useGameLoop(provider: AuthProvider = 'guest') {
  const [state, setState] = useState<GameState>(() => {
    const loaded = loadState(provider);
    return { ...loaded, pet: applyOfflineDecay(loaded.pet) };
  });
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

  const care = useCallback((vital: VitalName) => {
    setState((current) => ({ ...current, pet: careForPet(current.pet, vital) }));
  }, []);

  const completeMiniGame = useCallback(() => {
    setState((current) => awardMiniGameCoins(current));
  }, []);

  const signInAs = useCallback((nextProvider: AuthProvider) => {
    setState((current) => ({ ...current, user: { ...createStarterGameState(nextProvider).user, totalCoins: current.user.totalCoins } }));
  }, []);

  const purchase = useCallback(async (productId: PaymentProductId) => {
    const receipt = await paymentClient.purchase(productId);
    setLastReceipt(receipt);
    setState((current) => grantIapReward(current, receipt.productId, receipt.id));
  }, [paymentClient]);

  return useMemo(() => ({
    state,
    care,
    completeMiniGame,
    signInAs,
    purchase,
    lastReceipt,
    syncStatus,
    shopUnlocked: canOpenPremiumShop(state.inventory.coins),
  }), [care, completeMiniGame, lastReceipt, purchase, signInAs, state, syncStatus]);
}

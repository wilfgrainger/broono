import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  claimFridayGift,
  createStarterGameState,
  remixTheme,
  selectWardrobeItem,
  submitLook,
  voteForCard,
  type AuthProvider,
  type BroonoCard,
  type GameState,
} from '../game';
import { createApiSync } from '../platform';

const STORAGE_KEY = 'broono.styleShowdown.v1';

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
      fridayGiftClaimed: parsed.inventory.fridayGiftClaimed ?? false,
    },
    purchaseHistory: parsed.purchaseHistory ?? [],
  };
}

function loadState(provider: AuthProvider): GameState {
  if (typeof localStorage === 'undefined') return createStarterGameState(provider);
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return createStarterGameState(provider);

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

  const selectItem = useCallback((itemId: string) => {
    setState((current) => selectWardrobeItem(current, itemId));
  }, []);

  const submit = useCallback(() => {
    setState((current) => submitLook(current));
  }, []);

  const vote = useCallback((cardId: string, reaction: keyof BroonoCard['reactions']) => {
    setState((current) => voteForCard(current, cardId, reaction));
  }, []);

  const remix = useCallback(() => {
    setState((current) => remixTheme(current, `${current.run.theme.id}:${current.run.savedCards.length}:${Date.now()}`));
  }, []);

  const claimGift = useCallback(() => {
    setState((current) => claimFridayGift(current));
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

  return useMemo(() => ({
    state,
    selectItem,
    submit,
    vote,
    remix,
    claimGift,
    signInAs,
    syncStatus,
  }), [claimGift, remix, selectItem, signInAs, state, submit, syncStatus, vote]);
}

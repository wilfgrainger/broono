export type GameState = {
  night: number;
  phase: 'day' | 'night';
  secondsRemaining: number;
  health: number;
  hunger: number;
  wood: number;
  scraps: number;
  fire: number;
  rescued: number;
};

export const initialState = (): GameState => ({
  night: 1,
  phase: 'day',
  secondsRemaining: 50,
  health: 100,
  hunger: 100,
  wood: 0,
  scraps: 0,
  fire: 58,
  rescued: 0,
});

export const nextPhase = (state: GameState): GameState => {
  if (state.phase === 'day') {
    return { ...state, phase: 'night', secondsRemaining: 35 };
  }
  return {
    ...state,
    night: Math.min(99, state.night + 1),
    phase: 'day',
    secondsRemaining: 50,
  };
};

export const refuel = (state: GameState): GameState => {
  if (state.wood < 2 || state.fire >= 100) return state;
  return { ...state, wood: state.wood - 2, fire: Math.min(100, state.fire + 26) };
};

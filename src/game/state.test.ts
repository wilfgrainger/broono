import { describe, expect, it } from 'vitest';
import { initialState, nextPhase, refuel } from './state';

describe('survival state', () => {
  it('moves from day to night and advances only after night', () => {
    const day = initialState();
    const night = nextPhase(day);
    const nextDay = nextPhase(night);
    expect(night).toMatchObject({ night: 1, phase: 'night' });
    expect(nextDay).toMatchObject({ night: 2, phase: 'day' });
  });

  it('consumes two wood and caps fire', () => {
    expect(refuel({ ...initialState(), wood: 3, fire: 90 })).toMatchObject({ wood: 1, fire: 100 });
  });
});

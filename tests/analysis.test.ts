import { describe, expect, it } from 'vitest';
import { classifyMove, isDecidedEitherWay } from '../analysis/classify';
import { gamePhase } from '../analysis/gamePhase';
import { winProbability, winProbabilityFromCp } from '../analysis/winProbability';

describe('win probability', () => {
  it('is 50% at 0 and symmetric', () => {
    expect(winProbabilityFromCp(0)).toBeCloseTo(50);
    expect(winProbabilityFromCp(300) + winProbabilityFromCp(-300)).toBeCloseTo(100);
  });
  it('matches the formula', () => {
    expect(winProbabilityFromCp(100)).toBeCloseTo(50 + 50 * (2 / (1 + Math.exp(-0.368208)) - 1), 6);
  });
  it('handles mate scores explicitly', () => {
    expect(winProbability({ cp: null, mate: 3 })).toBe(100);
    expect(winProbability({ cp: null, mate: -1 })).toBe(0);
  });
});

describe('classifyMove', () => {
  it.each([
    [60, 59, 'good'],
    [60, 57, 'inaccuracy'],
    [60, 52, 'mistake'],
    [60, 40, 'blunder'],
  ] as const)('%d -> %d is %s', (b, a, cls) => expect(classifyMove(b, a)).toBe(cls));
});

describe('isDecidedEitherWay', () => {
  it('skips only when decided before AND after', () => {
    expect(isDecidedEitherWay(98, 97)).toBe(true);
    expect(isDecidedEitherWay(3, 1)).toBe(true);
    expect(isDecidedEitherWay(97, 55)).toBe(false); // "stop losing won games"
    expect(isDecidedEitherWay(4, 30)).toBe(false);
  });
});

describe('gamePhase', () => {
  it('detects phases', () => {
    expect(gamePhase('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 1)).toBe('opening');
    expect(gamePhase('6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 40', 40)).toBe('endgame');
    expect(gamePhase('r1bq1rk1/pp2bppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/R2QK2R w KQ - 0 20', 20)).toBe('middlegame');
  });
});

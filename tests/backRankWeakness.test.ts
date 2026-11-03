import { describe, expect, it } from 'vitest';
import { detectBackRankWeakness } from '../explain/motifs/backRankWeakness';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('backRankWeakness', () => {
  it.each([
    ['backrank-allowed', 'opponent', 'e8'],
    ['backrank-missed', 'you', 'd8'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectBackRankWeakness(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('backRankWeakness');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'scholar-allowed', 'skewer-allowed-rook'])('stays silent on %s', (id) => {
    expect(detectBackRankWeakness(analysisOf(id))).toBeNull();
  });
});

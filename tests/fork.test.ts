import { describe, expect, it } from 'vitest';
import { detectFork } from '../explain/motifs/fork';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('fork', () => {
  it.each([
    ['fork-allowed-knight', 'opponent', 'f6'],
    ['fork-missed-knight', 'you', 'f6'],
    ['fork-allowed-pawn', 'opponent', 'd4'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectFork(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('fork');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'hang-queen-g5', 'pin-allowed-queen'])('stays silent on %s', (id) => {
    expect(detectFork(analysisOf(id))).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { detectSkewer } from '../explain/motifs/skewer';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('skewer', () => {
  it.each([
    ['skewer-allowed-rook', 'opponent', 'f5'],
    ['skewer-missed-rook', 'you', 'f5'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectSkewer(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('skewer');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'pin-allowed-queen', 'fork-allowed-pawn'])('stays silent on %s', (id) => {
    expect(detectSkewer(analysisOf(id))).toBeNull();
  });
});

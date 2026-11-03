import { describe, expect, it } from 'vitest';
import { detectPin } from '../explain/motifs/pin';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('pin', () => {
  it.each([
    ['pin-allowed-knight', 'opponent', 'c6'],
    ['pin-allowed-queen', 'opponent', 'e7'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectPin(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('pin');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'fork-allowed-knight', 'hang-rook-b2'])('stays silent on %s', (id) => {
    expect(detectPin(analysisOf(id))).toBeNull();
  });
});

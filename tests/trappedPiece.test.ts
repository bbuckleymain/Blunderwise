import { describe, expect, it } from 'vitest';
import { detectTrappedPiece } from '../explain/motifs/trappedPiece';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('trappedPiece', () => {
  it.each([
    ['trapped-bishop-a7', 'opponent', 'a7'],
    ['trapped-bishop-a2', 'opponent', 'a2'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectTrappedPiece(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('trappedPiece');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'missed-capture-knight', 'pin-allowed-knight', 'hang-knight-d4'])('stays silent on %s', (id) => {
    expect(detectTrappedPiece(analysisOf(id))).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { detectHangingPiece } from '../explain/motifs/hangingPiece';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('hangingPiece', () => {
  it.each([
    ['hang-knight-d4', 'opponent', 'd4'],
    ['hang-queen-g5', 'opponent', 'g5'],
    ['hang-rook-b2', 'opponent', 'b2'],
    ['hang-bishop-f7', 'opponent', 'f7'],
    ['hang-pawn-a4', 'opponent', 'a4'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectHangingPiece(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('hangingPiece');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'missed-capture-rook', 'skewer-missed-rook'])('stays silent on %s', (id) => {
    expect(detectHangingPiece(analysisOf(id))).toBeNull();
  });
});

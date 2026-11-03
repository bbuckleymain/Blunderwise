import { describe, expect, it } from 'vitest';
import { detectMissedCapture } from '../explain/motifs/missedCapture';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('missedCapture', () => {
  it.each([
    ['missed-capture-queen', 'you', 'g5'],
    ['missed-capture-knight', 'you', 'd4'],
    ['missed-capture-rook', 'you', 'c4'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectMissedCapture(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('missedCapture');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'hang-knight-d4', 'fork-allowed-pawn'])('stays silent on %s', (id) => {
    expect(detectMissedCapture(analysisOf(id))).toBeNull();
  });
});

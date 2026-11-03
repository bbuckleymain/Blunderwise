import { describe, expect, it } from 'vitest';
import { detectMissedMate } from '../explain/motifs/missedMate';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('missedMate', () => {
  it.each([
    ['scholar-missed', 'you', 'f7'],
    ['backrank-missed', 'you', 'd8'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectMissedMate(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('missedMate');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'scholar-allowed', 'hang-rook-b2'])('stays silent on %s', (id) => {
    expect(detectMissedMate(analysisOf(id))).toBeNull();
  });
});

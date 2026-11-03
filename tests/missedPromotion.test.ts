import { describe, expect, it } from 'vitest';
import { detectMissedPromotion } from '../explain/motifs/missedPromotion';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('missedPromotion', () => {
  it.each([
    ['missed-promo-white', 'you', 'b8'],
    ['missed-promo-black', 'you', 'b1'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectMissedPromotion(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('missedPromotion');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'hang-rook-b2', 'backrank-missed'])('stays silent on %s', (id) => {
    expect(detectMissedPromotion(analysisOf(id))).toBeNull();
  });
});

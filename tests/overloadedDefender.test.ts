import { describe, expect, it } from 'vitest';
import { detectOverloadedDefender } from '../explain/motifs/overloadedDefender';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('overloadedDefender', () => {
  it.each([
    ['overloaded-bishop', 'opponent', 'd6'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectOverloadedDefender(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('overloadedDefender');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'fork-allowed-pawn', 'trapped-bishop-a7'])('stays silent on %s', (id) => {
    expect(detectOverloadedDefender(analysisOf(id))).toBeNull();
  });
});

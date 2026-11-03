import { describe, expect, it } from 'vitest';
import { detectKingSafetyBlunder } from '../explain/motifs/kingSafetyBlunder';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('kingSafetyBlunder', () => {
  it.each([
    ['king-safety-f6', 'opponent', 'e8'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectKingSafetyBlunder(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('kingSafetyBlunder');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'hang-queen-g5', 'pin-allowed-queen'])('stays silent on %s', (id) => {
    expect(detectKingSafetyBlunder(analysisOf(id))).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { detectAllowedMate } from '../explain/motifs/allowedMate';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('allowedMate', () => {
  it.each([
    ['scholar-allowed', 'opponent', 'f7'],
    ['fools-mate', 'opponent', 'h4'],
    ['backrank-allowed', 'opponent', 'e8'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectAllowedMate(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('allowedMate');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'scholar-missed', 'king-safety-f6'])('stays silent on %s', (id) => {
    expect(detectAllowedMate(analysisOf(id))).toBeNull();
  });
});

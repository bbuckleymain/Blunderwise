import { describe, expect, it } from 'vitest';
import { detectDiscoveredAttack } from '../explain/motifs/discoveredAttack';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('discoveredAttack', () => {
  it.each([
    ['discovered-allowed', 'opponent', 'e4'],
    ['discovered-missed', 'you', 'e4'],
  ] as const)('finds it in %s (side %s, square %s)', (id, side, square) => {
    const r = detectDiscoveredAttack(analysisOf(id));
    expect(r).not.toBeNull();
    expect(r?.tag).toBe('discoveredAttack');
    expect(r?.side).toBe(side);
    expect(r?.squares).toContain(square);
    expect(r?.confidence).toBeGreaterThan(0.5);
    expect(r?.evidence.length).toBeGreaterThan(10);
  });

  it.each([...NEGATIVE_IDS, 'fork-allowed-knight', 'skewer-missed-rook'])('stays silent on %s', (id) => {
    expect(detectDiscoveredAttack(analysisOf(id))).toBeNull();
  });
});

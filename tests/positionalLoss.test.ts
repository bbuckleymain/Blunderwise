import { describe, expect, it } from 'vitest';
import { detectMotifs } from '../explain/motifs';
import { positionalLoss } from '../explain/motifs/positionalLoss';
import { analysisOf, NEGATIVE_IDS } from './helpers';

describe('positionalLoss fallback', () => {
  it.each(NEGATIVE_IDS)('is the only tag on %s', (id) => {
    const tags = detectMotifs(analysisOf(id));
    expect(tags.map((t) => t.tag)).toEqual(['positionalLoss']);
  });

  it('names the better move', () => {
    const r = positionalLoss(analysisOf('neg-a5'));
    expect(r.keyMoveSan).toBe('c5');
    expect(r.evidence).toContain('c5');
  });
});

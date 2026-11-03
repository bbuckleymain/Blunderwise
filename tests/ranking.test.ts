import { describe, expect, it } from 'vitest';
import { MAX_TAGS, detectMotifs } from '../explain/motifs';
import { FIXTURES, analysisOf } from './helpers';

describe('motif ranking', () => {
  it.each(FIXTURES.map((f) => f.id))('%s: at most 2 tags, expected ones present', (id) => {
    const f = FIXTURES.find((x) => x.id === id);
    const tags = detectMotifs(analysisOf(id)).map((t) => t.tag);
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.length).toBeLessThanOrEqual(MAX_TAGS);
    for (const t of f?.expected ?? []) expect(tags).toContain(t);
    const ok = new Set([...(f?.expected ?? []), ...(f?.alsoOk ?? [])]);
    for (const t of tags) expect(ok.has(t)).toBe(true);
  });

  it('puts mate first', () => {
    expect(detectMotifs(analysisOf('backrank-allowed'))[0]?.tag).toBe('allowedMate');
  });

  it('prefers the pin over "hanging" for the same piece', () => {
    expect(detectMotifs(analysisOf('pin-allowed-queen')).map((t) => t.tag)).toEqual(['pin']);
  });
});

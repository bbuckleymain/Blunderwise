import { describe, expect, it } from 'vitest';
import { DAY_MS, RETRY_MS, newCard, schedule } from '../analysis/spacedRepetition';

describe('drill scheduling', () => {
  const t0 = 1_000_000;
  it('new cards are due now', () => expect(newCard(t0).dueAt).toBe(t0));
  it('grows the gap on success: 1 day, 3 days, then x ease', () => {
    let c = schedule(newCard(t0), true, t0);
    expect(c.dueAt).toBe(t0 + DAY_MS);
    c = schedule(c, true, t0);
    expect(c.intervalDays).toBe(3);
    c = schedule(c, true, t0);
    expect(c.intervalDays).toBeCloseTo(3 * 2.7, 1); // ease grew 2.5 -> 2.7 over two successes
  });
  it('a miss brings it back in 10 minutes and resets the streak', () => {
    const c = schedule(schedule(newCard(t0), true, t0), false, t0);
    expect(c.dueAt).toBe(t0 + RETRY_MS);
    expect(c.reps).toBe(0);
    expect(c.lapses).toBe(1);
    expect(c.ease).toBeCloseTo(2.4);
  });
  it('ease never drops below 1.3', () => {
    let c = newCard(t0);
    for (let i = 0; i < 20; i++) c = schedule(c, false, t0);
    expect(c.ease).toBe(1.3);
  });
});

import fixtures from '../fixtures/fixtures.json';
import type { Fixture } from '../fixtures/types';
import { analyze, type Analysis } from '../explain/facts';

export const FIXTURES = fixtures as unknown as Fixture[];

export function fixture(id: string): Fixture {
  const f = FIXTURES.find((x) => x.id === id);
  if (!f) throw new Error(`No fixture ${id}`);
  return f;
}

const memo = new Map<string, Analysis>();
export function analysisOf(id: string): Analysis {
  let a = memo.get(id);
  if (!a) {
    a = analyze(fixture(id).ctx);
    memo.set(id, a);
  }
  return a;
}

/** Fixtures with no tactic at all. */
export const NEGATIVE_IDS = FIXTURES.filter((f) => f.expected.includes('positionalLoss')).map((f) => f.id);

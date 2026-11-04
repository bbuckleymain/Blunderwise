import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { classifyMove } from '../analysis/classify';
import { winProbability } from '../analysis/winProbability';
import { ALL_MOTIF_TAGS, analyze, buildVocabulary, checkExplanation, detectMotifs, explainInstantly, templateExplanation, type MistakeContext } from '../explain';
import { buildPlan } from '../explain/plan';
import { trackOpening } from '../openings/book';
import { mulberry32 } from '../scripts/puzzles';

/** Cases per seed. Small by default so the suite stays quick; run `FUZZ_N=500 npx vitest run tests/fuzz.test.ts` for a deep sweep. */
const N = Number(process.env.FUZZ_N ?? 40);

type Rand = () => number;
const pick = <T,>(r: Rand, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)] as T;
const uci = (m: { from: string; to: string; promotion?: string }): string => `${m.from}${m.to}${m.promotion ?? ''}`;

/** A random legal position that is not game over, plus how it was reached. */
function randomPosition(r: Rand): Chess {
  for (;;) {
    const c = new Chess();
    const plies = 2 + Math.floor(r() * 90);
    for (let i = 0; i < plies && !c.isGameOver(); i++) c.move(pick(r, c.moves({ verbose: true })));
    if (!c.isGameOver()) return c;
  }
}

/** A random legal line (UCI) of up to `n` plies from `fen`. */
function playout(r: Rand, fen: string, n: number): string[] {
  const c = new Chess(fen);
  const out: string[] = [];
  for (let i = 0; i < n && !c.isGameOver(); i++) {
    const m = pick(r, c.moves({ verbose: true }));
    c.move(m);
    out.push(uci(m));
  }
  return out;
}

function randomScore(r: Rand): { cp: number | null; mate: number | null } {
  return r() < 0.15 ? { cp: null, mate: (r() < 0.5 ? -1 : 1) * (1 + Math.floor(r() * 5)) } : { cp: Math.round((r() - 0.5) * 1600), mate: null };
}

function randomContext(r: Rand): MistakeContext {
  const c = randomPosition(r);
  const fen = c.fen();
  const played = pick(r, c.moves({ verbose: true }));
  const after = new Chess(fen);
  after.move(played);
  const bestFirst = pick(r, c.moves({ verbose: true }));
  const bestTail = (() => {
    const t = new Chess(fen);
    t.move(bestFirst);
    return playout(r, t.fen(), Math.floor(r() * 7));
  })();
  const evalBefore = randomScore(r);
  const evalAfter = randomScore(r);
  return {
    fen,
    movePlayedUci: uci(played),
    bestMoveUci: uci(bestFirst),
    evalBefore,
    evalAfter,
    winProbBefore: winProbability(evalBefore),
    winProbAfter: winProbability(evalAfter),
    bestLine: [uci(bestFirst), ...bestTail],
    // A real engine PV is empty after the final move of the game, so allow that too.
    refutationLine: after.isGameOver() ? [] : playout(r, after.fen(), Math.floor(r() * 9)),
    moveNumber: Number(fen.split(' ')[5] ?? '1'),
    myColor: c.turn(),
  };
}

describe('fuzz: the coaching pipeline never crashes and never contradicts itself', () => {
  for (const seed of [1, 2]) {
    it(`seed ${seed}: ${N} random mistakes`, () => {
      const r = mulberry32(seed);
      const tagsSeen = new Set<string>();
      for (let i = 0; i < N; i++) {
        const ctx = randomContext(r);
        const label = `seed ${seed} case ${i}: ${ctx.fen} played ${ctx.movePlayedUci}`;
        let result;
        try {
          const a = analyze(ctx);
          const tags = detectMotifs(a);
          expect(tags.length, label).toBeGreaterThan(0);
          expect(tags.length, label).toBeLessThanOrEqual(2);
          for (const t of tags) {
            tagsSeen.add(t.tag);
            expect(ALL_MOTIF_TAGS, label).toContain(t.tag);
            expect(t.confidence, label).toBeGreaterThanOrEqual(0);
            expect(t.confidence, label).toBeLessThanOrEqual(1);
            for (const sq of t.squares) expect(sq, label).toMatch(/^[a-h][1-8]$/);
          }
          // The built-in template is the safety net: it must always pass the same validator the LLM output faces.
          const tmpl = templateExplanation(a.facts, tags);
          const check = checkExplanation(tmpl, buildVocabulary(a, tags), tags);
          expect(check, `${label}\n${JSON.stringify(tmpl)}`).toEqual({ ok: true });
          result = explainInstantly(ctx);
        } catch (e) {
          throw new Error(`${label}\n${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
        }
        expect(result.explanation.headline.trim().length, label).toBeGreaterThan(0);
        expect(classifyMove(ctx.winProbBefore, ctx.winProbAfter)).toMatch(/good|inaccuracy|mistake|blunder/);
      }
      expect(tagsSeen.size).toBeGreaterThan(1);
    }, 600_000);
  }

  it('the plan helper and opening tracker handle any legal position', () => {
    const r = mulberry32(99);
    for (let i = 0; i < N * 3; i++) {
      const c = randomPosition(r);
      const plan = buildPlan(c.fen());
      expect(plan.items.length, c.fen()).toBeGreaterThan(0);
      for (const it of plan.items) {
        expect(it.text.length).toBeGreaterThan(10);
        for (const sq of it.squares) expect(sq).toMatch(/^[a-h][1-8]$/);
      }
      expect(() => trackOpening(c.history({ verbose: true }).map((m) => m.after))).not.toThrow();
    }
  }, 600_000);
});

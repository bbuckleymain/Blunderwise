/**
 * DEV-ONLY: turns fixtures/specs.ts into fixtures/fixtures.json using Stockfish (WASM).
 * Usage: npm run fixtures:generate [-- --depth 18]
 */
import { Chess } from 'chess.js';
import { writeFileSync } from 'node:fs';
import { negateScore } from '../analysis/score';
import { winProbability } from '../analysis/winProbability';
import { classifyMove } from '../analysis/classify';
import { SPECS, type FixtureSpec } from '../fixtures/specs';
import type { Fixture } from '../fixtures/types';
import { DevEngine } from './devEngine';

const depthArg = process.argv.indexOf('--depth');
const DEPTH = depthArg >= 0 ? Number(process.argv[depthArg + 1]) : 18;

function startFen(spec: FixtureSpec): string {
  if (spec.fen) return spec.fen;
  const c = new Chess();
  for (const m of spec.moves ?? []) c.move(m);
  return c.fen();
}

async function main(): Promise<void> {
  const engine = new DevEngine();
  await engine.init();
  const out: Fixture[] = [];
  for (const spec of SPECS) {
    const fen = startFen(spec);
    const chess = new Chess(fen);
    const me = chess.turn();
    const uci = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(spec.played);
    const mv = uci ? chess.move({ from: uci[1] ?? '', to: uci[2] ?? '', promotion: uci[3] }) : chess.move(spec.played);
    const playedUci = `${mv.from}${mv.to}${mv.promotion ?? ''}`;
    if (chess.isCheckmate()) throw new Error(`${spec.id}: played move is mate, not a mistake`);

    const before = await engine.search(fen, DEPTH);
    const afterRaw = await engine.search(chess.fen(), DEPTH);
    if (!before.bestMove) throw new Error(`${spec.id}: no best move`);
    const evalBefore = before.score;
    const evalAfter = negateScore(afterRaw.score);
    const wpB = winProbability(evalBefore);
    const wpA = winProbability(evalAfter);
    const moveNumber = Number(fen.split(' ')[5] ?? '1');
    out.push({
      id: spec.id,
      description: spec.description,
      expected: [...spec.expected],
      alsoOk: [...(spec.alsoOk ?? [])],
      ctx: {
        fen,
        movePlayedUci: playedUci,
        bestMoveUci: before.bestMove,
        evalBefore,
        evalAfter,
        winProbBefore: Math.round(wpB * 10) / 10,
        winProbAfter: Math.round(wpA * 10) / 10,
        bestLine: before.pv.slice(0, 12),
        refutationLine: afterRaw.pv.slice(0, 12),
        moveNumber,
        myColor: me,
      },
    });
    const fmt = (s: { cp: number | null; mate: number | null }): string => (s.mate !== null ? `M${s.mate}` : `${s.cp}`);
    console.log(
      `${spec.id.padEnd(28)} best=${before.bestMove.padEnd(6)} ${fmt(evalBefore).padStart(6)} -> ${fmt(evalAfter).padStart(6)}  ` +
        `${wpB.toFixed(0)}% -> ${wpA.toFixed(0)}% ${classifyMove(wpB, wpA).padEnd(10)} ref=${afterRaw.pv.slice(0, 6).join(' ')}`,
    );
  }
  engine.quit();
  writeFileSync(new URL('../fixtures/fixtures.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
  console.log(`\nWrote ${out.length} fixtures at depth ${DEPTH}.`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});

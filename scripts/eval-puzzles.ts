/**
 * DEV-ONLY: grade the motif detectors against the Lichess puzzle database (held-out, real positions).
 *
 *   curl -LO https://database.lichess.org/lichess_db_puzzle.csv.zst
 *   npm run eval:puzzles -- lichess_db_puzzle.csv.zst --n 1000
 *
 * Options: --n 1000  --depth 12  --min-rating 600  --max-rating 2000  --seed 1  --out puzzle-eval.json
 *          --engine /usr/bin/stockfish   (default: STOCKFISH_PATH, /usr/bin/stockfish, /usr/local/bin/stockfish, else WASM)
 *
 * Each puzzle starts one move before the blunder: the side to move plays moves[0] (the blunder) and the rest is
 * the solution that punishes it. Lichess themes name the tactic in the solution, so they are compared with our
 * "allowed" detections. Lichess themes are not exhaustive, so precision here is a lower bound.
 */
import { Chess } from 'chess.js';
import { createReadStream, existsSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { createZstdDecompress } from 'node:zlib';
import { classifyMove } from '../analysis/classify';
import { negateScore } from '../analysis/score';
import { winProbability } from '../analysis/winProbability';
import { analyze } from '../explain/facts';
import { detectMotifs, runDetectors } from '../explain/motifs';
import type { MistakeContext, MotifTag } from '../explain/types';
import { UciEngine } from '../main/uciEngine';
import { emptyScore, expectedTags, mulberry32, parsePuzzleLine, scorePuzzle, THEME_TO_TAG, type LichessPuzzle, type TagScore } from './puzzles';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const file = process.argv[2];
if (!file || file.startsWith('--') || !existsSync(file)) {
  console.error('Usage: npm run eval:puzzles -- <lichess_db_puzzle.csv[.zst]> [--n 1000] [--depth 12]');
  process.exit(1);
}
const N = Number(arg('n', '1000'));
const DEPTH = Number(arg('depth', '12'));
const MIN = Number(arg('min-rating', '600'));
const MAX = Number(arg('max-rating', '2000'));
const SEED = Number(arg('seed', '1'));
const OUT = arg('out', 'puzzle-eval.json');

function makeEngine(): UciEngine {
  const explicit = arg('engine', process.env.STOCKFISH_PATH ?? '');
  const native = [explicit, '/usr/bin/stockfish', '/usr/local/bin/stockfish'].find((p) => p && existsSync(p));
  if (native) return new UciEngine({ name: 'eval', path: native, options: { Threads: '2', Hash: '128' } });
  const require = createRequire(import.meta.url);
  const js = path.join(path.dirname(require.resolve('stockfish/package.json')), 'src', 'stockfish-17.1-lite-single-03e3232.js');
  console.log('(no native Stockfish found, using the slow WASM build)');
  return new UciEngine({ name: 'eval', path: process.execPath, args: [js] });
}

/** Reservoir-sample N puzzles in the rating window that have at least one scorable theme. */
async function sample(): Promise<LichessPuzzle[]> {
  const rand = mulberry32(SEED);
  const raw = createReadStream(file as string);
  const input = (file as string).endsWith('.zst') ? raw.pipe(createZstdDecompress()) : raw;
  const out: LichessPuzzle[] = [];
  let seen = 0;
  for await (const line of createInterface({ input, crlfDelay: Infinity })) {
    const p = parsePuzzleLine(line);
    if (!p || p.rating < MIN || p.rating > MAX || expectedTags(p.themes).length === 0) continue;
    seen += 1;
    if (out.length < N) out.push(p);
    else {
      const j = Math.floor(rand() * seen);
      if (j < N) out[j] = p;
    }
  }
  console.log(`Sampled ${out.length} of ${seen} eligible puzzles (rating ${MIN}-${MAX}).`);
  return out;
}

async function main(): Promise<void> {
  const puzzles = await sample();
  const engine = makeEngine();
  await engine.whenReady();
  const table = new Map<MotifTag, TagScore>();
  const misses: Record<string, string[]> = {};
  const falseAlarms: Record<string, string[]> = {};
  let used = 0;
  let skipped = 0;
  let noTag = 0;
  const t0 = Date.now();

  for (const [i, p] of puzzles.entries()) {
    try {
      const chess = new Chess(p.fen);
      const me = chess.turn();
      const played = p.moves[0] ?? '';
      const before = await engine.evaluate(p.fen, DEPTH);
      chess.move({ from: played.slice(0, 2), to: played.slice(2, 4), promotion: played[4] });
      const afterRaw = await engine.evaluate(chess.fen(), DEPTH);
      if (!before.bestMove || before.bestMove === played) {
        skipped += 1;
        continue;
      }
      const evalBefore = { cp: before.cp, mate: before.mate };
      const evalAfter = negateScore({ cp: afterRaw.cp, mate: afterRaw.mate });
      const wpB = winProbability(evalBefore);
      const wpA = winProbability(evalAfter);
      if (classifyMove(wpB, wpA) === 'good') {
        skipped += 1;
        continue;
      }
      const ctx: MistakeContext = {
        fen: p.fen,
        movePlayedUci: played,
        bestMoveUci: before.bestMove,
        evalBefore,
        evalAfter,
        winProbBefore: wpB,
        winProbAfter: wpA,
        bestLine: before.pv.length ? before.pv : [before.bestMove],
        refutationLine: p.moves.slice(1), // the verified puzzle solution
        moveNumber: Number(p.fen.split(' ')[5] ?? '1'),
        myColor: me,
      };
      const a = analyze(ctx);
      const shown = detectMotifs(a).map((t) => t.tag);
      const raw = runDetectors(a).map((t) => t.tag);
      const expected = expectedTags(p.themes);
      scorePuzzle(table, expected, shown, raw);
      if (shown.length === 1 && shown[0] === 'positionalLoss') noTag += 1;
      const url = `https://lichess.org/training/${p.id}`;
      for (const t of expected) if (!shown.includes(t)) (misses[t] ??= []).length < 8 && misses[t].push(`${url} (shown: ${shown.join(', ')})`);
      for (const t of shown) if (Object.values(THEME_TO_TAG).includes(t) && !expected.includes(t)) (falseAlarms[t] ??= []).length < 8 && falseAlarms[t].push(`${url} (lichess: ${p.themes.join(' ')})`);
      used += 1;
    } catch (e) {
      skipped += 1;
      if (skipped < 5) console.error(`puzzle ${p.id}:`, e instanceof Error ? e.message : e);
    }
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${puzzles.length} (${Math.round((Date.now() - t0) / 1000)}s)`);
  }
  engine.dispose();

  const pct = (n: number, d: number): string => (d ? `${Math.round((100 * n) / d)}%`.padStart(5) : '    -');
  console.log(`\nScored ${used} puzzles (${skipped} skipped). ${noTag} got no tactic tag at all (positionalLoss only).\n`);
  console.log('tag                  support  recall(shown)  recall(any detector)  precision(lower bound)');
  const rows = [...table].sort((x, y) => y[1].support - x[1].support);
  for (const [tag, s] of rows) {
    console.log(`${tag.padEnd(20)} ${String(s.support).padStart(7)}  ${pct(s.hitsTop, s.support).padStart(13)}  ${pct(s.hitsRaw, s.support).padStart(20)}  ${pct(s.predictedCorrect, s.predicted).padStart(22)}  (shown ${s.predicted}x)`);
  }
  writeFileSync(OUT, `${JSON.stringify({ settings: { N, DEPTH, MIN, MAX, SEED }, used, skipped, noTag, table: Object.fromEntries(rows.map(([t, s]) => [t, s ?? emptyScore()])), misses, falseAlarms }, null, 2)}\n`);
  console.log(`\nExample misses and false alarms (with puzzle links) written to ${OUT}`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});

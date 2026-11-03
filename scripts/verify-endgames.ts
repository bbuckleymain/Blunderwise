/**
 * DEV-ONLY: re-verify endgames/positions.ts with a native Stockfish.
 *   npm run verify:endgames -- /usr/bin/stockfish [depth]
 * Wins must be mate or +5.00 or better for the side you play; draws must be exactly 0.00 for that side.
 */
import { Chess } from 'chess.js';
import { existsSync } from 'node:fs';
import { ENDGAMES } from '../endgames/positions';
import { UciEngine } from '../main/uciEngine';

const exe = process.argv[2] ?? process.env.STOCKFISH_PATH ?? '/usr/bin/stockfish';
const depth = Number(process.argv[3] ?? '26');
if (!existsSync(exe)) {
  console.error(`Stockfish not found at ${exe}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const e = new UciEngine({ name: 'verify', path: exe, options: { Threads: '2', Hash: '256' }, searchTimeoutMs: 300000 });
  let bad = 0;
  for (const p of ENDGAMES) {
    const turn = new Chess(p.fen).turn();
    const r = await e.evaluate(p.fen, depth);
    // Score for the side `playAs`.
    const sign = turn === p.playAs ? 1 : -1;
    const mate = r.mate === null ? null : sign * r.mate;
    const cp = r.cp === null ? null : sign * r.cp;
    const ok = p.goal === 'win' ? (mate !== null && mate > 0) || (cp !== null && cp >= 500) : mate === null && cp === 0;
    if (!ok) bad += 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${p.id.padEnd(22)} ${p.goal.padEnd(5)} ${mate !== null ? `M${mate}` : `cp ${cp}`}`);
  }
  e.dispose();
  if (bad) process.exit(1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

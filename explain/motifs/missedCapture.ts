import { seeCapture } from '../board';
import { describe, makeResult, toRef, type Detector } from './common';

/** The best move simply wins material by capturing, and I played something else. */
export const detectMissedCapture: Detector = (a) => {
  const best = a.best[0];
  if (!best || best.captured === null) return null;
  if (best.uci === a.ctx.movePlayedUci) return null;
  const victim = a.before.get(best.to);
  if (!victim) return null; // en passant: rare, skip
  const gain = seeCapture(a.before, best.from, best.to);
  const missed = a.facts.materialAfterBestLine - a.facts.materialAfterRefutation;
  if (gain < 1 || missed < 1) return null;
  const confidence = gain >= 2 ? 0.85 : 0.5;
  const capturer = a.before.get(best.from);
  return makeResult(
    'missedCapture',
    'you',
    confidence,
    [best.to, best.from],
    capturer ? [toRef(victim), toRef(capturer)] : [toRef(victim)],
    `${best.san} would have won the ${describe(victim)}`,
    best.san,
  );
};

import { makeResult, type Detector } from './common';

/** I had a forced mate and my move threw it away. */
export const detectMissedMate: Detector = (a) => {
  const before = a.ctx.evalBefore.mate;
  const after = a.ctx.evalAfter.mate;
  if (before === null || before <= 0) return null;
  if (after !== null && after > 0) return null;
  const first = a.best[0];
  if (!first) return null;
  const mateStep = a.best.find((s) => s.isMate);
  const theirKing = a.before.kingSquare(a.opp);
  return makeResult(
    'missedMate',
    'you',
    mateStep ? 0.95 : 0.85,
    [first.from, first.to, ...(theirKing ? [theirKing] : [])],
    [],
    before === 1
      ? `${first.san} was checkmate`
      : `you had a forced checkmate in ${before} moves starting with ${first.san}`,
    first.san,
  );
};

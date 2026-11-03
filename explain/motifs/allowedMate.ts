import { makeResult, toRef, type Detector } from './common';

/** After my move the opponent has a forced mate (and did not before). */
export const detectAllowedMate: Detector = (a) => {
  const before = a.ctx.evalBefore.mate;
  const after = a.ctx.evalAfter.mate;
  if (after === null || after >= 0) return null;
  if (before !== null && before < 0) return null;
  const first = a.refutation[0];
  if (!first) return null;
  const n = -after;
  const mateStep = a.refutation.find((s) => s.isMate);
  const king = a.after.kingSquare(a.me);
  const kingPiece = king ? a.after.get(king) : undefined;
  return makeResult(
    'allowedMate',
    'opponent',
    mateStep ? 0.95 : 0.85,
    [first.from, first.to, ...(mateStep ? [mateStep.to] : []), ...(king ? [king] : [])],
    kingPiece ? [toRef(kingPiece)] : [],
    n === 1 ? `${first.san} is checkmate` : `they have a forced checkmate in ${n} moves starting with ${first.san}`,
    first.san,
  );
};

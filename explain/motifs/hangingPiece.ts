import { isCapturedLater } from '../line';
import { makeResult, type Detector } from './common';

/** One of my pieces can be won right after my move, and the refutation takes it. */
export const detectHangingPiece: Detector = (a) => {
  const early = a.refutation.slice(0, 4);
  for (const h of a.facts.leftHanging) {
    const sq = h.piece.square;
    const capture = isCapturedLater(early, sq, a.me, -1);
    const lostInLine = a.facts.materialBefore - a.facts.materialAfterRefutation;
    let confidence = 0;
    if (capture) confidence = h.loss >= 3 ? 0.9 : 0.55;
    else if (h.loss >= 2 && lostInLine >= h.loss - 0.5) confidence = 0.55;
    if (confidence === 0) continue;
    const movedIt = sq === a.playedStep.to;
    const how = capture ? ` with ${capture.san}` : '';
    const evidence = movedIt
      ? `you moved your ${h.piece.piece} to ${sq}, where it can be taken${how}`
      : `your ${h.piece.piece} on ${sq} was left undefended and can be taken${how}`;
    return makeResult(
      'hangingPiece',
      'opponent',
      confidence,
      capture ? [sq, capture.from] : [sq],
      [h.piece],
      evidence,
      capture?.san ?? null,
    );
  }
  return null;
};

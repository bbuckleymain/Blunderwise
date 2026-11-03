import { PIECE_NAME } from '../board';
import { movesBy } from '../line';
import { makeResult, type Detector } from './common';

/** The best line promotes one of my pawns within my next two moves; my move did not. */
export const detectMissedPromotion: Detector = (a) => {
  if (a.playedStep.promotion !== null) return null;
  const mine = movesBy(a.best, a.me, 2);
  const idx = mine.findIndex((s) => s.promotion !== null);
  const promo = mine[idx];
  if (!promo || promo.promotion === null) return null;
  const swing = a.facts.materialAfterBestLine - a.facts.materialAfterRefutation;
  const drop = a.ctx.winProbBefore - a.ctx.winProbAfter;
  if (swing < 3 && drop < 10) return null;
  return makeResult(
    'missedPromotion',
    'you',
    idx === 0 ? 0.9 : 0.7,
    [promo.from, promo.to],
    [{ piece: 'pawn', square: promo.from, color: a.me }],
    `${promo.san} would have turned your pawn into a ${PIECE_NAME[promo.promotion]}`,
    promo.san,
  );
};

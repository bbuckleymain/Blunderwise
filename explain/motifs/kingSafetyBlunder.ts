import type { Square } from 'chess.js';
import { fileOf, rankOf } from '../board';
import { movesBy } from '../line';
import { makeResult, type Detector } from './common';

/**
 * My move weakened my own king (pushed a shield pawn, or walked the king out in the
 * opening/middlegame), and the refutation immediately goes after the king with checks or mate.
 */
export const detectKingSafetyBlunder: Detector = (a) => {
  const step = a.playedStep;
  const king = a.before.kingSquare(a.me);
  if (!king) return null;
  const up = a.me === 'w' ? 1 : -1;

  let weakness: string | null = null;
  if (step.piece === 'p') {
    const fileGap = Math.abs(fileOf(step.from) - fileOf(king));
    const ahead = (rankOf(step.from) - rankOf(king)) * up;
    if (fileGap <= 1 && ahead >= 1 && ahead <= 2) weakness = `pushing the pawn on ${step.from} opened up your king on ${king}`;
  } else if (step.piece === 'k' && Math.abs(fileOf(step.from) - fileOf(step.to)) < 2 && a.facts.phase !== 'endgame') {
    weakness = `walking your king to ${step.to} left it exposed`;
  }
  if (!weakness) return null;

  const oppMoves = movesBy(a.refutation, a.opp, 2);
  const checks = oppMoves.filter((s) => s.isCheck);
  const mated = a.facts.mate.theyHaveMateIn !== null;
  const drop = a.ctx.winProbBefore - a.ctx.winProbAfter;
  if (drop < 5) return null;

  // Weaker evidence: an opponent piece starts aiming at the square my move gave up next to the king.
  const vacated = step.piece === 'p' ? step.from : null;
  const kingNow = a.after.kingSquare(a.me) ?? king;
  const zone = new Set<Square>([...a.after.attacksFromKingZone(kingNow), ...(vacated ? [vacated] : [])]);
  let aimer: (typeof oppMoves)[number] | null = null;
  for (const s of oppMoves) {
    const hits = s.boardAfter.attacksFrom(s.to).filter((sq) => zone.has(sq));
    const raysBefore = s.boardBefore.attacksFrom(s.from).filter((sq) => zone.has(sq));
    if (hits.length > raysBefore.length) {
      aimer = s;
      break;
    }
  }

  const firstCheck = checks[0];
  let confidence = 0;
  if (mated) confidence = 0.75;
  else if (firstCheck) confidence = 0.7;
  else if (aimer) confidence = 0.55;
  if (confidence === 0) return null;
  const key = firstCheck ?? aimer;
  return makeResult(
    'kingSafetyBlunder',
    'opponent',
    confidence,
    [step.from, step.to, king, ...(key ? [key.to] : [])],
    [{ piece: 'king', square: step.piece === 'k' ? step.to : king, color: a.me }],
    firstCheck
      ? `${weakness}, and ${firstCheck.san} attacks it right away`
      : aimer
        ? `${weakness}, and ${aimer.san} starts aiming at it`
        : weakness,
    key?.san ?? null,
  );
};

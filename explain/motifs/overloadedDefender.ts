import type { BoardPiece } from '../board';
import { makeResult, nameOf, stakeFor, toRef, type Detector } from './common';

/**
 * After my move, one of my pieces is the only defender of two attacked pieces.
 * The refutation takes one, my defender recaptures, and the other one falls.
 */
export const detectOverloadedDefender: Detector = (a) => {
  const board = a.after;
  for (const d of board.pieces(a.me)) {
    const duties: BoardPiece[] = board.pieces(a.me).filter(
      (y) =>
        y.square !== d.square &&
        y.type !== 'k' &&
        board.attackers(y.square, a.opp).length > 0 &&
        board.attacks(d.square, y.square) &&
        board.attackers(y.square, a.me).length === 1,
    );
    if (duties.length < 2) continue;
    const dutySquares = new Set(duties.map((y) => y.square));
    const steps = a.refutation;
    // Pattern: opponent captures duty #1, defender recaptures there, opponent captures duty #2.
    let pattern = false;
    for (let i = 0; i + 2 < steps.length; i++) {
      const s1 = steps[i];
      const s2 = steps[i + 1];
      const s3 = steps[i + 2];
      if (!s1 || !s2 || !s3) continue;
      if (s1.mover !== a.opp || !s1.captured || !dutySquares.has(s1.to)) continue;
      if (s2.from !== d.square || s2.to !== s1.to) continue;
      if (s3.mover === a.opp && s3.captured && dutySquares.has(s3.to) && s3.to !== s1.to) pattern = true;
      break;
    }
    const stake = stakeFor(a, 'opponent');
    const takesDuty = steps.slice(0, 3).some((s) => s.mover === a.opp && s.captured && dutySquares.has(s.to));
    const confidence = pattern ? 0.85 : takesDuty && stake >= 2 ? 0.55 : 0;
    if (confidence === 0) continue;
    const list = duties.map((y) => `${nameOf(y)} on ${y.square}`).join(' and ');
    return makeResult(
      'overloadedDefender',
      'opponent',
      confidence,
      [d.square, ...duties.map((y) => y.square)],
      [toRef(d), ...duties.map(toRef)],
      `your ${nameOf(d)} on ${d.square} is the only defender of both the ${list}, so it cannot protect both`,
      steps[0]?.san ?? null,
    );
  }
  return null;
};

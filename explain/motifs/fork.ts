import { see } from '../board';
import { isCapturedLater, movesBy } from '../line';
import type { MotifSide } from '../types';
import { bestOf, lineFor, makeResult, nameOf, stakeFor, toRef, value, type Detector } from './common';
import type { Analysis } from '../facts';

function forkOn(a: Analysis, side: MotifSide) {
  const { steps, attacker, defender } = lineFor(a, side);
  for (const s of movesBy(steps, attacker, 2)) {
    const board = s.boardAfter;
    const forker = board.get(s.to);
    if (!forker) continue;
    const targets = board
      .attacksFrom(s.to)
      .map((sq) => board.get(sq))
      .filter((p): p is NonNullable<typeof p> => p !== undefined && p.color === defender)
      .filter(
        (p) =>
          p.type === 'k' ||
          (p.type !== 'p' && (value(p) > value(forker) || see(board, p.square, attacker) > 0)),
      );
    if (targets.length < 2) continue;
    const won = targets.find((t) => t.type !== 'k' && isCapturedLater(steps, t.square, defender, s.ply));
    const stake = stakeFor(a, side);
    if (stake < 1.5) continue;
    const confidence = won ? 0.9 : 0.65;
    const names = targets.map((t) => `${nameOf(t)} on ${t.square}`).join(' and ');
    const who = side === 'opponent' ? 'their' : 'your';
    return makeResult(
      'fork',
      side,
      confidence,
      [s.to, ...targets.map((t) => t.square)],
      [toRef(forker), ...targets.map(toRef)],
      `${s.san} lets ${who} ${nameOf(forker)} attack the ${names} at once`,
      s.san,
    );
  }
  return null;
}

export const detectFork: Detector = (a) => bestOf([forkOn(a, 'opponent'), forkOn(a, 'you')]);

import { see, slidingDirs } from '../board';
import { isCapturedLater, movesBy } from '../line';
import type { MotifSide } from '../types';
import type { Analysis } from '../facts';
import { bestOf, lineFor, makeResult, nameOf, stakeFor, toRef, value, type Detector } from './common';

function discoveredOn(a: Analysis, side: MotifSide) {
  const { steps, attacker, defender } = lineFor(a, side);
  for (const s of movesBy(steps, attacker, 2)) {
    for (const d of s.boardBefore.pieces(attacker)) {
      if (d.square === s.from) continue;
      for (const dir of slidingDirs(d.type)) {
        const blockerBefore = s.boardBefore.ray(d.square, dir).blocker;
        if (!blockerBefore || blockerBefore.square !== s.from) continue;
        const target = s.boardAfter.ray(d.square, dir).blocker;
        if (!target || target.color !== defender) continue;
        const isKing = target.type === 'k';
        const worthIt =
          isKing ||
          (target.type !== 'p' && (value(target) > value(d) || see(s.boardAfter, target.square, attacker) > 0));
        if (!worthIt) continue;
        const stake = stakeFor(a, side);
        const won = !isKing && isCapturedLater(steps, target.square, defender, s.ply);
        let confidence = 0;
        if (stake < 1.5) continue;
        if (isKing && s.isCheck) confidence = 0.9;
        else if (won) confidence = 0.85;
        else confidence = 0.6;
        if (confidence === 0) continue;
        const mover = s.boardAfter.get(s.to);
        const owner = side === 'opponent' ? 'your' : 'their';
        const what = isKing ? `a discovered check on ${owner} king` : `a discovered attack on ${owner} ${nameOf(target)} on ${target.square}`;
        return makeResult(
          'discoveredAttack',
          side,
          confidence,
          [s.from, s.to, d.square, target.square],
          mover ? [toRef(mover), toRef(d), toRef(target)] : [toRef(d), toRef(target)],
          `${s.san} moves out of the way of the ${nameOf(d)} on ${d.square}, giving ${what}`,
          s.san,
        );
      }
    }
  }
  return null;
}

export const detectDiscoveredAttack: Detector = (a) => bestOf([discoveredOn(a, 'opponent'), discoveredOn(a, 'you')]);

import { slidingDirs } from '../board';
import { isCapturedLater, movesBy } from '../line';
import type { MotifSide } from '../types';
import type { Analysis } from '../facts';
import { bestOf, lineFor, makeResult, nameOf, stakeFor, toRef, value, type Detector } from './common';

function skewerOn(a: Analysis, side: MotifSide) {
  const { steps, attacker, defender } = lineFor(a, side);
  for (const s of movesBy(steps, attacker, 2)) {
    const board = s.boardAfter;
    const slider = board.get(s.to);
    if (!slider) continue;
    for (const dir of slidingDirs(slider.type)) {
      const [front, back] = board.firstTwoOnRay(s.to, dir);
      if (!front || !back || front.color !== defender || back.color !== defender) continue;
      if (back.type === 'k' || value(back) < 3) continue;
      if (!(front.type === 'k' || value(front) > value(back))) continue;
      const won = isCapturedLater(steps, back.square, defender, s.ply);
      const stake = stakeFor(a, side);
      const confidence = stake < 1.5 ? 0 : won ? 0.9 : 0.6;
      if (confidence === 0) continue;
      const owner = side === 'opponent' ? 'your' : 'their';
      return makeResult(
        'skewer',
        side,
        confidence,
        [s.to, front.square, back.square],
        [toRef(slider), toRef(front), toRef(back)],
        `${s.san} attacks ${owner} ${nameOf(front)} on ${front.square}; once it moves, the ${nameOf(back)} behind it on ${back.square} falls`,
        s.san,
      );
    }
  }
  return null;
}

export const detectSkewer: Detector = (a) => bestOf([skewerOn(a, 'opponent'), skewerOn(a, 'you')]);

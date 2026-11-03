import { isCapturedLater, movesBy } from '../line';
import type { Board } from '../board';
import type { MotifSide } from '../types';
import type { Analysis } from '../facts';
import { bestOf, findPins, lineFor, makeResult, nameOf, pinKey, stakeFor, toRef, type Detector } from './common';

function pinOn(a: Analysis, side: MotifSide) {
  const { steps, attacker, defender } = lineFor(a, side);
  const existing = new Set(findPins(a.before, attacker).map(pinKey));
  const boards: { board: Board; ply: number; san: string | null }[] = [];
  if (side === 'opponent') boards.push({ board: a.after, ply: -1, san: null });
  for (const s of movesBy(steps, attacker, 2)) boards.push({ board: s.boardAfter, ply: s.ply, san: s.san });

  for (const { board, ply, san } of boards) {
    for (const pin of findPins(board, attacker)) {
      // A pinned piece with no defender is just hanging; that is a different lesson.
      if (board.attackers(pin.pinned.square, defender).length === 0) continue;
      const isNew = !existing.has(pinKey(pin));
      const won = isCapturedLater(steps, pin.pinned.square, defender, ply);
      const stake = stakeFor(a, side);
      let confidence = 0;
      if (won && stake >= 1.5) confidence = 0.85;
      else if (isNew && side === 'opponent' && stake >= 2) confidence = 0.6;
      if (confidence === 0) continue;
      const toWhat = pin.behind.type === 'k' ? 'king' : nameOf(pin.behind);
      const owner = side === 'opponent' ? 'your' : 'their';
      const how = san ?? a.playedStep.san;
      return makeResult(
        'pin',
        side,
        confidence,
        [pin.pinned.square, pin.pinner.square, pin.behind.square],
        [toRef(pin.pinned), toRef(pin.pinner), toRef(pin.behind)],
        `after ${how}, ${owner} ${nameOf(pin.pinned)} on ${pin.pinned.square} is pinned to the ${toWhat} on ${pin.behind.square} by the ${nameOf(pin.pinner)} on ${pin.pinner.square}`,
        san,
      );
    }
  }
  return null;
}

export const detectPin: Detector = (a) => bestOf([pinOn(a, 'opponent'), pinOn(a, 'you')]);

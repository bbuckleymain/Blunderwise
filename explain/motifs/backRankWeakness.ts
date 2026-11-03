import { fileOf, rankOf, toSquare } from '../board';
import type { MotifSide } from '../types';
import type { Analysis } from '../facts';
import { bestOf, lineFor, makeResult, nameOf, stakeFor, toRef, type Detector } from './common';

function backRankOn(a: Analysis, side: MotifSide) {
  const { steps, attacker, defender } = lineFor(a, side);
  const backRank = defender === 'w' ? 0 : 7;
  const forward = defender === 'w' ? 1 : -1;
  for (const s of steps.slice(0, 6)) {
    if (s.mover !== attacker || !s.isCheck) continue;
    if (s.piece !== 'r' && s.piece !== 'q') continue;
    if (rankOf(s.to) !== backRank) continue;
    const board = s.boardAfter;
    const king = board.kingSquare(defender);
    if (!king || rankOf(king) !== backRank) continue;
    const escapes = [-1, 0, 1]
      .map((df) => toSquare(fileOf(king) + df, backRank + forward))
      .filter((sq): sq is NonNullable<typeof sq> => sq !== null);
    const boxedIn = escapes.every((sq) => {
      const occ = board.get(sq);
      return (occ !== undefined && occ.color === defender) || board.attackers(sq, attacker).length > 0;
    });
    if (!boxedIn) continue;
    const mates = steps.slice(s.ply, s.ply + 5).some((x) => x.isMate);
    const confidence = mates ? 0.9 : stakeFor(a, side) >= 2 ? 0.6 : 0;
    if (confidence === 0) continue;
    const kingPiece = board.get(king);
    const checker = board.get(s.to);
    const owner = side === 'opponent' ? 'your' : 'their';
    return makeResult(
      'backRankWeakness',
      side,
      confidence,
      [s.to, king, ...escapes],
      [kingPiece, checker].filter((p): p is NonNullable<typeof p> => p !== undefined).map(toRef),
      `${owner} king on ${king} is boxed in by its own pieces, so ${s.san} with the ${checker ? nameOf(checker) : 'piece'} on the back rank ${mates ? 'is checkmate' : 'wins material'}`,
      s.san,
    );
  }
  return null;
}

export const detectBackRankWeakness: Detector = (a) => bestOf([backRankOn(a, 'opponent'), backRankOn(a, 'you')]);

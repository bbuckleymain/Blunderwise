import { Chess } from 'chess.js';
import { PIECE_VALUE, seeCapture } from '../board';
import { isCapturedLater, movesBy } from '../line';
import { findPins, makeResult, nameOf, toRef, value, type Detector } from './common';

/**
 * After the opponent's reply, one of my pieces (worth >= 3) has no safe square left,
 * and the refutation goes on to win it.
 */
export const detectTrappedPiece: Detector = (a) => {
  for (const s of movesBy(a.refutation, a.opp, 2)) {
    if (s.isCheck) continue; // forced king moves are a fork/check story, not a trap
    const board = s.boardAfter;
    const pinned = new Set(findPins(board, a.opp).map((p) => p.pinned.square));
    const chess = new Chess(s.fenAfter);
    for (const x of board.pieces(a.me)) {
      if (x.type === 'k' || x.type === 'p' || value(x) < 3 || pinned.has(x.square)) continue;
      const moves = chess.moves({ square: x.square, verbose: true });
      const safeExists = moves.some((m) => {
        const net = seeCapture(board, m.from, m.to);
        return net > -2;
      });
      if (safeExists) continue;
      // Only call it trapped when the line really goes on to win it.
      const won = isCapturedLater(a.refutation, x.square, a.me, s.ply);
      if (!won) continue;
      const confidence = 0.85;
      return makeResult(
        'trappedPiece',
        'opponent',
        confidence,
        [x.square, s.to, ...moves.map((m) => m.to)],
        [toRef(x)],
        `after ${s.san}, your ${nameOf(x)} on ${x.square} has no safe square to go to`,
        s.san,
      );
    }
  }
  return null;
};

// Exported for tests: the value table is the single source of truth.
export const TRAP_MIN_VALUE = PIECE_VALUE.n;

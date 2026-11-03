import type { Square } from 'chess.js';
import { PIECE_NAME } from './board';
import type { Analysis } from './facts';
import type { MotifResult, PieceName } from './types';

/** How many plies of each line the narrator may talk about. */
export const NARRATED_PLIES = 6;

/** The only moves, squares and pieces the narrator is allowed to mention. */
export interface Vocabulary {
  readonly squares: ReadonlySet<Square>;
  /** SAN without check/mate suffixes. */
  readonly moves: ReadonlySet<string>;
  readonly pieces: ReadonlySet<PieceName>;
}

export const stripSan = (san: string): string => san.replace(/[+#!?]+$/g, '');

export function buildVocabulary(a: Analysis, tags: readonly MotifResult[]): Vocabulary {
  const squares = new Set<Square>();
  const moves = new Set<string>();
  const pieces = new Set<PieceName>();
  const f = a.facts;

  for (const m of [f.played, f.best]) {
    squares.add(m.from);
    squares.add(m.to);
    moves.add(stripSan(m.san));
    pieces.add(m.piece);
    if (m.captured) pieces.add(m.captured);
    if (m.promotion) pieces.add(m.promotion);
  }
  for (const steps of [a.best.slice(0, NARRATED_PLIES), a.refutation.slice(0, NARRATED_PLIES)]) {
    for (const s of steps) {
      squares.add(s.from);
      squares.add(s.to);
      moves.add(stripSan(s.san));
      pieces.add(PIECE_NAME[s.piece]);
      if (s.captured) pieces.add(PIECE_NAME[s.captured]);
      if (s.promotion) pieces.add(PIECE_NAME[s.promotion]);
      if (s.isCheck) pieces.add('king');
    }
  }
  const mp = f.movedPiece;
  for (const p of [...mp.attackedBefore, ...mp.attackedAfter, ...mp.defendedBefore, ...mp.defendedAfter]) {
    squares.add(p.square);
    pieces.add(p.piece);
  }
  for (const h of f.leftHanging) {
    squares.add(h.piece.square);
    pieces.add(h.piece.piece);
  }
  for (const t of tags) {
    for (const sq of t.squares) squares.add(sq);
    for (const p of t.pieces) {
      squares.add(p.square);
      pieces.add(p.piece);
    }
    if (t.keyMoveSan) moves.add(stripSan(t.keyMoveSan));
  }
  if (f.mate.iHadMateIn !== null || f.mate.theyHaveMateIn !== null) pieces.add('king');
  return { squares, moves, pieces };
}

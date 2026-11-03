import type { Color, Square } from 'chess.js';
import { PIECE_NAME, PIECE_VALUE, slidingDirs, toRef, type Board, type BoardPiece } from '../board';
import type { Analysis } from '../facts';
import type { LineStep } from '../line';
import type { MotifResult, MotifSide, MotifTag, PieceRef } from '../types';

export type Detector = (a: Analysis) => MotifResult | null;

export interface SideLine {
  readonly side: MotifSide;
  readonly steps: readonly LineStep[];
  readonly attacker: Color;
  readonly defender: Color;
}

/** 'opponent' = the refutation of my move; 'you' = the best line I missed. */
export function lineFor(a: Analysis, side: MotifSide): SideLine {
  return side === 'opponent'
    ? { side, steps: a.refutation, attacker: a.opp, defender: a.me }
    : { side, steps: a.best, attacker: a.me, defender: a.opp };
}

/**
 * Material that is at stake on this side's line (pawn units, positive = the line's attacker profits).
 * opponent: what I lose compared with before my move. you: what the best line keeps over the game line.
 */
export function stakeFor(a: Analysis, side: MotifSide): number {
  const f = a.facts;
  return side === 'opponent'
    ? f.materialBefore - f.materialAfterRefutation
    : f.materialAfterBestLine - f.materialAfterRefutation;
}

export function makeResult(
  tag: MotifTag,
  side: MotifSide,
  confidence: number,
  squares: readonly Square[],
  pieces: readonly PieceRef[],
  evidence: string,
  keyMoveSan: string | null,
): MotifResult {
  return {
    tag,
    side,
    confidence: Math.max(0, Math.min(1, confidence)),
    squares: [...new Set(squares)],
    pieces,
    evidence,
    keyMoveSan,
  };
}

export function bestOf(results: readonly (MotifResult | null)[]): MotifResult | null {
  let top: MotifResult | null = null;
  for (const r of results) if (r && (!top || r.confidence > top.confidence)) top = r;
  return top;
}

export const nameOf = (p: BoardPiece): string => PIECE_NAME[p.type];
export const value = (p: BoardPiece): number => PIECE_VALUE[p.type];
export const describe = (p: BoardPiece): string => `${nameOf(p)} on ${p.square}`;
export { toRef };

export interface Pin {
  readonly pinner: BoardPiece;
  readonly pinned: BoardPiece;
  readonly behind: BoardPiece;
}

/** Pieces of `defender` (worth >= 3) pinned by sliders of `attacker` to a king or a more valuable piece. */
export function findPins(board: Board, attacker: Color): Pin[] {
  const pins: Pin[] = [];
  for (const s of board.pieces(attacker)) {
    for (const dir of slidingDirs(s.type)) {
      const [first, second] = board.firstTwoOnRay(s.square, dir);
      if (!first || !second) continue;
      if (first.color === attacker || second.color === attacker) continue;
      if (first.type === 'k' || value(first) < 3) continue;
      if (second.type === 'k' || value(second) > value(first)) {
        pins.push({ pinner: s, pinned: first, behind: second });
      }
    }
  }
  return pins;
}

export const pinKey = (p: Pin): string => `${p.pinner.square}-${p.pinned.square}-${p.behind.square}`;

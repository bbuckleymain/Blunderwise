import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import { Board, parseUci } from './board';

/** One ply of a line, with the boards on both sides of it. */
export interface LineStep {
  readonly ply: number;
  readonly uci: string;
  readonly san: string;
  readonly mover: Color;
  readonly piece: PieceSymbol;
  readonly from: Square;
  readonly to: Square;
  readonly captured: PieceSymbol | null;
  readonly promotion: PieceSymbol | null;
  readonly isCheck: boolean;
  readonly isMate: boolean;
  readonly fenBefore: string;
  readonly fenAfter: string;
  readonly boardBefore: Board;
  readonly boardAfter: Board;
}

/** Play a UCI line from `fen`. Throws on an illegal move so bad fixtures fail loudly. */
export function playLine(fen: string, uciMoves: readonly string[], maxPlies = Infinity): LineStep[] {
  const chess = new Chess(fen);
  const steps: LineStep[] = [];
  let boardBefore = Board.fromFen(fen);
  for (const [i, uci] of uciMoves.entries()) {
    if (i >= maxPlies) break;
    const { from, to, promotion } = parseUci(uci);
    const fenBefore = chess.fen();
    let move;
    try {
      move = chess.move({ from, to, promotion });
    } catch {
      throw new Error(`Illegal move ${uci} at ply ${i} from ${fenBefore}`);
    }
    const fenAfter = chess.fen();
    const boardAfter = Board.fromFen(fenAfter);
    steps.push({
      ply: i,
      uci,
      san: move.san,
      mover: move.color,
      piece: move.piece,
      from: move.from,
      to: move.to,
      captured: move.captured ?? null,
      promotion: move.promotion ?? null,
      isCheck: chess.isCheck(),
      isMate: chess.isCheckmate(),
      fenBefore,
      fenAfter,
      boardBefore,
      boardAfter,
    });
    boardBefore = boardAfter;
  }
  return steps;
}

/** The first `n` moves made by `color` in a line. */
export function movesBy(steps: readonly LineStep[], color: Color, n: number): LineStep[] {
  return steps.filter((s) => s.mover === color).slice(0, n);
}

/** Does `color` capture a piece on `square` (tracking it if it moves) within the line after `fromPly`? */
export function isCapturedLater(
  steps: readonly LineStep[],
  startSquare: Square,
  victimColor: Color,
  fromPly: number,
): LineStep | null {
  let sq: Square = startSquare;
  for (const s of steps) {
    if (s.ply <= fromPly) continue;
    if (s.mover === victimColor && s.from === sq) {
      sq = s.to;
      continue;
    }
    if (s.mover !== victimColor && s.to === sq && s.captured !== null) return s;
  }
  return null;
}

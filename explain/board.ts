import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';
import type { PieceName, PieceRef } from './types';

export const PIECE_VALUE: Readonly<Record<PieceSymbol, number>> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

export const PIECE_NAME: Readonly<Record<PieceSymbol, PieceName>> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

export const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

export interface BoardPiece {
  readonly square: Square;
  readonly type: PieceSymbol;
  readonly color: Color;
}

const FILES = 'abcdefgh';

export const fileOf = (sq: Square): number => FILES.indexOf(sq.charAt(0));
export const rankOf = (sq: Square): number => Number(sq.charAt(1)) - 1;

export function toSquare(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return `${FILES.charAt(file)}${rank + 1}` as Square;
}

export function isSquare(s: string): s is Square {
  return /^[a-h][1-8]$/.test(s);
}

type Dir = readonly [number, number];
const ROOK_DIRS: readonly Dir[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const BISHOP_DIRS: readonly Dir[] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];
const KING_DIRS: readonly Dir[] = [...ROOK_DIRS, ...BISHOP_DIRS];
const KNIGHT_JUMPS: readonly Dir[] = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

export function slidingDirs(type: PieceSymbol): readonly Dir[] {
  if (type === 'r') return ROOK_DIRS;
  if (type === 'b') return BISHOP_DIRS;
  if (type === 'q') return KING_DIRS;
  return [];
}

/**
 * Immutable board snapshot used for attack maps and static exchange evaluation.
 * Attacks are pseudo-legal (pins are ignored), which is the standard convention for attack maps.
 */
export class Board {
  private readonly cells: ReadonlyMap<Square, BoardPiece>;

  private constructor(cells: ReadonlyMap<Square, BoardPiece>) {
    this.cells = cells;
  }

  static fromFen(fen: string): Board {
    const chess = new Chess(fen);
    const cells = new Map<Square, BoardPiece>();
    for (const row of chess.board()) {
      for (const p of row) {
        if (p) cells.set(p.square, { square: p.square, type: p.type, color: p.color });
      }
    }
    return new Board(cells);
  }

  get(sq: Square): BoardPiece | undefined {
    return this.cells.get(sq);
  }

  pieces(color?: Color): BoardPiece[] {
    const out: BoardPiece[] = [];
    for (const p of this.cells.values()) if (color === undefined || p.color === color) out.push(p);
    return out;
  }

  kingSquare(color: Color): Square | null {
    for (const p of this.cells.values()) if (p.type === 'k' && p.color === color) return p.square;
    return null;
  }

  /** Remove the piece on `sq` (no-op if empty). */
  without(sq: Square): Board {
    const next = new Map(this.cells);
    next.delete(sq);
    return new Board(next);
  }

  /** Move whatever is on `from` to `to`, replacing anything there. Pseudo move for simulations. */
  shift(from: Square, to: Square): Board {
    const p = this.cells.get(from);
    if (!p) return this;
    const next = new Map(this.cells);
    next.delete(from);
    next.set(to, { square: to, type: p.type, color: p.color });
    return new Board(next);
  }

  /** Squares the piece on `sq` attacks (including squares occupied by either colour). */
  attacksFrom(sq: Square): Square[] {
    const p = this.cells.get(sq);
    if (!p) return [];
    const f = fileOf(sq);
    const r = rankOf(sq);
    const out: Square[] = [];
    const push = (df: number, dr: number): void => {
      const t = toSquare(f + df, r + dr);
      if (t) out.push(t);
    };
    switch (p.type) {
      case 'p': {
        const dr = p.color === 'w' ? 1 : -1;
        push(-1, dr);
        push(1, dr);
        break;
      }
      case 'n':
        for (const [df, dr] of KNIGHT_JUMPS) push(df, dr);
        break;
      case 'k':
        for (const [df, dr] of KING_DIRS) push(df, dr);
        break;
      default:
        for (const dir of slidingDirs(p.type)) out.push(...this.ray(sq, dir).visited);
    }
    return out;
  }

  /** Walk from `sq` in `dir`; returns visited squares up to and including the first occupied one. */
  ray(sq: Square, dir: Dir): { visited: Square[]; blocker: BoardPiece | null } {
    const visited: Square[] = [];
    let f = fileOf(sq) + dir[0];
    let r = rankOf(sq) + dir[1];
    for (;;) {
      const t = toSquare(f, r);
      if (!t) return { visited, blocker: null };
      visited.push(t);
      const occ = this.cells.get(t);
      if (occ) return { visited, blocker: occ };
      f += dir[0];
      r += dir[1];
    }
  }

  /** The first two pieces met along a ray (for pins / skewers / x-rays). */
  firstTwoOnRay(sq: Square, dir: Dir): [BoardPiece | null, BoardPiece | null] {
    const first = this.ray(sq, dir).blocker;
    if (!first) return [null, null];
    const second = this.ray(first.square, dir).blocker;
    return [first, second];
  }

  /** The king's square plus its neighbours. */
  attacksFromKingZone(king: Square): Square[] {
    const out: Square[] = [king];
    for (const [df, dr] of KING_DIRS) {
      const t = toSquare(fileOf(king) + df, rankOf(king) + dr);
      if (t) out.push(t);
    }
    return out;
  }

  attacks(from: Square, target: Square): boolean {
    return this.attacksFrom(from).includes(target);
  }

  /** Pieces of `color` that attack `sq`. */
  attackers(sq: Square, color: Color): BoardPiece[] {
    return this.pieces(color).filter((p) => this.attacks(p.square, sq));
  }
}

/**
 * Static exchange evaluation: material (pawn units) `side` wins by starting a capture sequence on `sq`,
 * both sides always recapturing with their least valuable attacker and stopping when it no longer pays.
 * Returns 0 when capturing does not pay.
 */
export function see(board: Board, sq: Square, side: Color): number {
  const target = board.get(sq);
  if (!target || target.color === side) return 0;
  const attackers = board.attackers(sq, side);
  if (attackers.length === 0) return 0;
  attackers.sort((a, b) => PIECE_VALUE[a.type] - PIECE_VALUE[b.type]);
  const lva = attackers[0];
  if (!lva) return 0;
  const next = board.shift(lva.square, sq);
  return Math.max(0, PIECE_VALUE[target.type] - see(next, sq, other(side)));
}

/** Material `side` nets by capturing on `to` with the piece on `from`, then best play by both sides. */
export function seeCapture(board: Board, from: Square, to: Square): number {
  const mover = board.get(from);
  const target = board.get(to);
  if (!mover) return 0;
  const gained = target ? PIECE_VALUE[target.type] : 0;
  const next = board.shift(from, to);
  return gained - see(next, to, other(mover.color));
}

/** Material balance in pawn units from `color`'s point of view (kings excluded). */
export function materialBalance(board: Board, color: Color): number {
  let sum = 0;
  for (const p of board.pieces()) {
    if (p.type === 'k') continue;
    sum += p.color === color ? PIECE_VALUE[p.type] : -PIECE_VALUE[p.type];
  }
  return sum;
}

export function toRef(p: BoardPiece): PieceRef {
  return { piece: PIECE_NAME[p.type], square: p.square, color: p.color };
}

export interface ParsedUci {
  readonly from: Square;
  readonly to: Square;
  readonly promotion: PieceSymbol | undefined;
}

export function parseUci(uci: string): ParsedUci {
  const m = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(uci);
  if (!m || !m[1] || !m[2]) throw new Error(`Bad UCI move: ${uci}`);
  const promo = m[3];
  return {
    from: m[1] as Square,
    to: m[2] as Square,
    promotion: promo === 'q' || promo === 'r' || promo === 'b' || promo === 'n' ? promo : undefined,
  };
}

/**
 * Material balance after captures settle: a small captures-only search from the current position.
 * Returned from `pov`'s point of view.
 */
export function settledMaterial(fen: string, pov: Color, maxDepth = 6): number {
  const chess = new Chess(fen);
  const stm = chess.turn();
  const v = quiesce(chess, maxDepth, -Infinity, Infinity);
  return stm === pov ? v : -v;
}

function quiesce(chess: Chess, depth: number, alpha: number, beta: number): number {
  const stm = chess.turn();
  const standPat = materialBalance(Board.fromFen(chess.fen()), stm);
  if (depth === 0) return standPat;
  let a = alpha;
  if (standPat >= beta) return standPat;
  if (standPat > a) a = standPat;
  const captures = chess
    .moves({ verbose: true })
    .filter((m) => m.captured !== undefined || m.promotion !== undefined)
    .sort((x, y) => PIECE_VALUE[y.captured ?? 'p'] - PIECE_VALUE[x.captured ?? 'p']);
  for (const m of captures) {
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
    const score = -quiesce(chess, depth - 1, -beta, -a);
    chess.undo();
    if (score >= beta) return score;
    if (score > a) a = score;
  }
  return a;
}

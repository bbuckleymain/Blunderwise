/** Lichess puzzle CSV parsing and theme mapping (pure; used by eval-puzzles.ts and its tests). */
import type { MotifTag } from '../explain/types';

export interface LichessPuzzle {
  readonly id: string;
  readonly fen: string;
  /** UCI. moves[0] is the blunder (the side to move in `fen` plays it); the rest is the punishing solution. */
  readonly moves: readonly string[];
  readonly rating: number;
  readonly themes: readonly string[];
}

/** Columns: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags */
export function parsePuzzleLine(line: string): LichessPuzzle | null {
  const c = line.split(',');
  if (c.length < 8 || c[0] === 'PuzzleId') return null;
  const [id, fen, moves, rating, , , , themes] = c;
  if (!id || !fen || !moves || !themes) return null;
  const mv = moves.trim().split(' ').filter(Boolean);
  if (mv.length < 2) return null;
  return { id, fen, moves: mv, rating: Number(rating), themes: themes.trim().split(' ').filter(Boolean) };
}

/**
 * Lichess themes describe the punishing solution, i.e. the tactic the blunder ALLOWED.
 * Only themes with a clear counterpart among our detectors are scored.
 */
export const THEME_TO_TAG: Readonly<Record<string, MotifTag>> = {
  hangingPiece: 'hangingPiece',
  fork: 'fork',
  pin: 'pin',
  skewer: 'skewer',
  discoveredAttack: 'discoveredAttack',
  trappedPiece: 'trappedPiece',
  backRankMate: 'backRankWeakness',
  mate: 'allowedMate',
  exposedKing: 'kingSafetyBlunder',
};

export function expectedTags(themes: readonly string[]): MotifTag[] {
  return [...new Set(themes.map((t) => THEME_TO_TAG[t]).filter((t): t is MotifTag => t !== undefined))];
}

/** Deterministic PRNG so a sample can be reproduced with --seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TagScore {
  support: number; // puzzles with this theme
  hitsTop: number; // ...where it is in our shown tags (max 2)
  hitsRaw: number; // ...where any detector found it
  predicted: number; // puzzles where we showed this tag
  predictedCorrect: number; // ...and Lichess has the theme
}

export function emptyScore(): TagScore {
  return { support: 0, hitsTop: 0, hitsRaw: 0, predicted: 0, predictedCorrect: 0 };
}

/** Score one puzzle into the per-tag table (only mapped tags are counted). */
export function scorePuzzle(table: Map<MotifTag, TagScore>, expected: readonly MotifTag[], shown: readonly MotifTag[], raw: readonly MotifTag[]): void {
  const mapped = new Set<MotifTag>(Object.values(THEME_TO_TAG));
  for (const t of expected) {
    const s = table.get(t) ?? emptyScore();
    s.support += 1;
    if (shown.includes(t)) s.hitsTop += 1;
    if (raw.includes(t)) s.hitsRaw += 1;
    table.set(t, s);
  }
  for (const t of shown) {
    if (!mapped.has(t)) continue;
    const s = table.get(t) ?? emptyScore();
    s.predicted += 1;
    if (expected.includes(t)) s.predictedCorrect += 1;
    table.set(t, s);
  }
}

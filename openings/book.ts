/** Opening book lookups. Pure TS: positions are keyed by EPD (first 4 FEN fields), so transpositions just work. */
import data from './openings.json';
import type { OpeningsData } from './types';

const BOOK = data as unknown as OpeningsData;

export const epdOf = (fen: string): string => fen.split(' ').slice(0, 4).join(' ');

export interface OpeningName {
  readonly eco: string;
  readonly name: string;
  /** Name before ':' (e.g. "Sicilian Defense"). */
  readonly family: string;
}

export interface BookMove {
  readonly uci: string;
  readonly families: readonly string[];
  /** How many named lines play this move here (a popularity proxy). */
  readonly lines: number;
}

export const families = (): readonly string[] => BOOK.families;

export function isBookPosition(fen: string): boolean {
  return BOOK.positions[epdOf(fen)] !== undefined;
}

/** The named opening that ends exactly at this position, if any. */
export function openingAt(fen: string): OpeningName | null {
  const n = BOOK.positions[epdOf(fen)]?.n;
  const entry = n === undefined ? undefined : BOOK.names[n];
  if (!entry) return null;
  return { eco: entry[0], name: entry[1], family: BOOK.families[entry[2]] ?? entry[1] };
}

/** Book continuations from this position; `family` keeps only moves that stay inside that opening family. */
export function bookMoves(fen: string, family: string | null = null): BookMove[] {
  const node = BOOK.positions[epdOf(fen)];
  if (!node) return [];
  const want = family === null ? -1 : BOOK.families.indexOf(family);
  if (family !== null && want < 0) return [];
  const out: BookMove[] = [];
  for (const [uci, e] of Object.entries(node.x)) {
    if (want >= 0 && !e.f.includes(want)) continue;
    out.push({ uci, families: e.f.map((i) => BOOK.families[i] ?? ''), lines: e.c });
  }
  return out;
}

/** Pick a book move at random, weighted by how many lines play it (so 1.e4 is likelier than 1.g4). */
export function pickBookMove(fen: string, family: string | null, rand: () => number = Math.random): string | null {
  const moves = bookMoves(fen, family);
  const total = moves.reduce((s, m) => s + m.lines, 0);
  if (total === 0) return null;
  let r = rand() * total;
  for (const m of moves) {
    r -= m.lines;
    if (r < 0) return m.uci;
  }
  return moves[moves.length - 1]?.uci ?? null;
}

export interface OpeningTrack {
  /** Deepest named opening reached while still in book (null if the game never reached a named position). */
  readonly opening: OpeningName | null;
  /** How many leading plies stayed in book. */
  readonly bookPlies: number;
  /** True when the game left book (the position after ply `bookPlies` is unknown). */
  readonly leftBook: boolean;
}

/**
 * Follow a game: `fens[i]` is the position after ply i+1 (so fens.length = plies played).
 * The game is in book while each resulting position is known to the book.
 */
export function trackOpening(fens: readonly string[]): OpeningTrack {
  let opening: OpeningName | null = null;
  let plies = 0;
  for (const fen of fens) {
    if (!isBookPosition(fen)) return { opening, bookPlies: plies, leftBook: true };
    plies += 1;
    opening = openingAt(fen) ?? opening;
  }
  return { opening, bookPlies: plies, leftBook: false };
}

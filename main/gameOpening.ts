import { Chess } from 'chess.js';
import { trackOpening } from '../openings/book';

export interface GameOpening {
  readonly eco: string | null;
  readonly name: string | null;
  readonly family: string | null;
  readonly bookPlies: number;
}

/** Which opening a stored game followed, and for how many plies. Games from a custom position have none. */
export function openingOfPgn(pgn: string): GameOpening {
  const none: GameOpening = { eco: null, name: null, family: null, bookPlies: 0 };
  try {
    const c = new Chess();
    c.loadPgn(pgn);
    if (c.getHeaders().FEN) return none;
    const t = trackOpening(c.history({ verbose: true }).map((m) => m.after));
    return { eco: t.opening?.eco ?? null, name: t.opening?.name ?? null, family: t.opening?.family ?? null, bookPlies: t.bookPlies };
  } catch {
    return none;
  }
}

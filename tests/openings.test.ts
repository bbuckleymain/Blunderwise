import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { bookMoves, families, isBookPosition, openingAt, pickBookMove, trackOpening } from '../openings/book';

function fensAfter(sans: string[]): string[] {
  const c = new Chess();
  return sans.map((s) => {
    c.move(s);
    return c.fen();
  });
}

describe('opening book', () => {
  it('names well-known openings', () => {
    const najdorf = fensAfter(['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6']);
    expect(trackOpening(najdorf).opening?.name).toMatch(/Sicilian Defense: Najdorf/);
    expect(trackOpening(najdorf).opening?.family).toBe('Sicilian Defense');
    expect(trackOpening(fensAfter(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'])).opening?.name).toBe('Ruy Lopez');
    expect(trackOpening(fensAfter(['d4', 'd5', 'c4'])).opening?.name).toBe("Queen's Gambit");
  });

  it('follows transpositions by position, not move order', () => {
    const a = trackOpening(fensAfter(['e4', 'c5', 'Nf3', 'd6']));
    const b = trackOpening(fensAfter(['Nf3', 'c5', 'e4', 'd6']));
    expect(b.leftBook).toBe(false);
    expect(b.opening?.family).toBe(a.opening?.family);
  });

  it('reports where the game left theory', () => {
    const t = trackOpening(fensAfter(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'h3', 'h5']));
    expect(t.leftBook).toBe(true);
    expect(t.bookPlies).toBeGreaterThanOrEqual(8);
    expect(t.bookPlies).toBeLessThan(12);
    expect(t.opening?.family).toBe('Ruy Lopez');
  });

  it('a nonsense first move is out of book straight away', () => {
    const t = trackOpening(fensAfter(['a4']));
    expect(t.bookPlies).toBeLessThanOrEqual(1);
  });

  it('offers book continuations, optionally restricted to a family', () => {
    const start = new Chess().fen();
    const all = bookMoves(start).map((m) => m.uci);
    expect(all).toContain('e2e4');
    expect(all).toContain('d2d4');
    const afterE4 = fensAfter(['e4'])[0] ?? '';
    const sicilian = bookMoves(afterE4, 'Sicilian Defense').map((m) => m.uci);
    expect(sicilian).toContain('c7c5');
    expect(sicilian).not.toContain('e7e5');
    expect(bookMoves(fensAfter(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'h3', 'h5'])[11] ?? '')).toEqual([]);
  });

  it('picks weighted random book moves and can steer into a family', () => {
    const start = new Chess().fen();
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) seen.add(pickBookMove(start, null, Math.random) ?? '');
    expect(seen.has('e2e4')).toBe(true);
    expect(seen.size).toBeGreaterThan(2); // varied
    expect(pickBookMove(start, null, () => 0)).not.toBeNull();
    const afterE4 = fensAfter(['e4'])[0] ?? '';
    for (let i = 0; i < 50; i++) expect(pickBookMove(afterE4, 'Sicilian Defense')).toBe('c7c5');
    expect(pickBookMove(afterE4, 'Not An Opening')).toBeNull();
  });

  it('exposes family names and position lookups', () => {
    expect(families()).toContain('Sicilian Defense');
    expect(isBookPosition(new Chess().fen())).toBe(true);
    expect(openingAt(fensAfter(['e4'])[0] ?? '')?.name).toBe("King's Pawn Game");
  });
});

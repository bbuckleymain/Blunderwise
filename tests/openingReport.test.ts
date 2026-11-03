import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { Db } from '../main/db';
import { openingOfPgn } from '../main/gameOpening';
import { newCard } from '../analysis/spacedRepetition';

const pgnOf = (sans: string[], headers = '', result = '*'): string => {
  const c = new Chess();
  for (const s of sans) c.move(s);
  const text = c.history().map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ');
  return `${headers}[Result "${result}"]\n\n${text} ${result}`;
};

const NAJDORF = ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'h3', 'h5'];
const RUY = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6'];

describe('game openings', () => {
  it('identifies the opening of a PGN and where it left book', () => {
    const o = openingOfPgn(pgnOf(NAJDORF));
    expect(o.family).toBe('Sicilian Defense');
    expect(o.name).toMatch(/Najdorf/);
    expect(o.bookPlies).toBeGreaterThanOrEqual(10);
    expect(o.bookPlies).toBeLessThan(12);
  });
  it('ignores games from a custom position', () => {
    const c = new Chess('8/8/8/4k3/8/8/4P3/4K3 w - - 0 1');
    c.move('e3');
    expect(openingOfPgn(c.pgn()).family).toBeNull();
  });
});

describe('opening report', () => {
  const db = new Db(':memory:');
  db.saveGame({ myColor: 'b', opponent: 'Bot', result: '0-1', pgn: pgnOf(NAJDORF, '', '0-1') }); // I win as Black
  db.saveGame({ myColor: 'b', opponent: 'Bot', result: '1-0', pgn: pgnOf(NAJDORF, '', '1-0') }); // I lose
  db.saveGame({ myColor: 'w', opponent: 'Bot', result: '1/2-1/2', pgn: pgnOf(RUY, '', '1/2-1/2') });
  it('groups by family and colour with results', () => {
    const rows = db.openingReport();
    const sic = rows.find((r) => r.family === 'Sicilian Defense' && r.color === 'b');
    expect(sic).toMatchObject({ games: 2, wins: 1, losses: 1, draws: 0 });
    const ruy = rows.find((r) => r.family === 'Ruy Lopez');
    expect(ruy).toMatchObject({ color: 'w', games: 1, draws: 1 });
    expect(sic?.avgBookPlies).toBeGreaterThan(8);
  });
  it('filters drills by opening family (opening-phase only)', () => {
    const id = db.listGames().find((g) => g.openingFamily === 'Sicilian Defense')?.id ?? 0;
    const base = { fen: new Chess().fen(), myColor: 'b' as const, playedUci: 'a7a5', playedSan: 'a5', bestUci: 'c7c5', bestSan: 'c5', classification: 'mistake', tags: [], gameId: id, opening: 'Sicilian Defense' };
    db.addDrill({ ...base, phase: 'opening' }, newCard(0));
    db.addDrill({ ...base, playedUci: 'h7h5', playedSan: 'h5', phase: 'middlegame' }, newCard(0));
    expect(db.dueDrills(Date.now(), { opening: 'Sicilian Defense' }, 10)).toHaveLength(1);
    expect(db.dueDrills(Date.now(), { opening: 'Ruy Lopez' }, 10)).toHaveLength(0);
    expect(db.dueDrills(Date.now(), {}, 10)).toHaveLength(2);
    expect(db.openingReport().find((r) => r.family === 'Sicilian Defense')?.drills).toBe(1);
  });
});

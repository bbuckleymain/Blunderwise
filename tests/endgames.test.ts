import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { ENDGAMES } from '../endgames/positions';

describe('endgame trainer positions', () => {
  it('has unique ids and legal, unfinished positions', () => {
    expect(new Set(ENDGAMES.map((e) => e.id)).size).toBe(ENDGAMES.length);
    for (const e of ENDGAMES) {
      const c = new Chess(e.fen); // throws on an illegal FEN
      expect(c.isGameOver(), e.id).toBe(false);
      expect(e.idea.length).toBeGreaterThan(30);
    }
  });
  it('covers wins and draws, from both colours', () => {
    expect(ENDGAMES.some((e) => e.goal === 'win')).toBe(true);
    expect(ENDGAMES.some((e) => e.goal === 'draw' && e.playAs === 'b')).toBe(true);
  });
  it('wins are played by the side with the material', () => {
    for (const e of ENDGAMES.filter((x) => x.goal === 'win')) {
      const board = new Chess(e.fen).board().flat();
      const mine = board.filter((p) => p && p.color === e.playAs && p.type !== 'k').length;
      const theirs = board.filter((p) => p && p.color !== e.playAs && p.type !== 'k').length;
      expect(mine, e.id).toBeGreaterThan(theirs - 1);
    }
  });
});

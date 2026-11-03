import { describe, expect, it } from 'vitest';
import { Board, see, settledMaterial } from '../explain/board';
import { buildFacts } from '../explain/facts';
import { fixture } from './helpers';

describe('board helpers', () => {
  it('SEE: undefended piece is lost, defended pawn-for-knight is not worth it', () => {
    const b = Board.fromFen('r1bqkb1r/pppp1ppp/2n2n2/4p3/2BNP3/8/PPPP1PPP/RNBQK2R b KQkq - 5 4');
    expect(see(b, 'd4', 'b')).toBe(3);
  });
  it('settles material after captures', () => {
    // White to move can take a free rook.
    expect(settledMaterial('6k1/5ppp/8/8/2r5/8/3K1PPP/2R5 w - - 0 1', 'w')).toBe(5);
  });
});

describe('buildFacts', () => {
  it('describes a hanging-knight blunder', () => {
    const f = buildFacts(fixture('hang-knight-d4').ctx);
    expect(f.played.san).toBe('Nd4');
    expect(f.played.piece).toBe('knight');
    expect(f.best.san).toBe('d3');
    expect(f.refutationLineSan[0]).toBe('exd4');
    expect(f.leftHanging[0]?.piece.square).toBe('d4');
    expect(f.materialAfterRefutation - f.materialBefore).toBeLessThanOrEqual(-2);
    expect(f.phase).toBe('opening');
    expect(f.severity).toBe('game-changing blunder');
  });
  it('records what the moved piece attacks and defends', () => {
    const f = buildFacts(fixture('hang-queen-g5').ctx);
    expect(f.movedPiece.attackedAfter.map((p) => p.square)).toContain('g2');
    expect(f.movedPiece.defendedAfter.map((p) => p.square)).toContain('g7');
  });
  it('records mate info', () => {
    expect(buildFacts(fixture('scholar-allowed').ctx).mate.theyHaveMateIn).toBe(1);
    expect(buildFacts(fixture('scholar-missed').ctx).mate.iHadMateIn).toBe(1);
  });
  it('rejects a context whose FEN side to move is not myColor', () => {
    const ctx = { ...fixture('hang-knight-d4').ctx, myColor: 'b' as const };
    expect(() => buildFacts(ctx)).toThrow();
  });
});

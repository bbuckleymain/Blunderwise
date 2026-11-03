import { describe, expect, it } from 'vitest';
import { buildPlan } from '../explain/plan';

const ids = (fen: string): string[] => buildPlan(fen, 20).items.map((i) => i.id);

describe('plan helper', () => {
  it('suggests development and castling early', () => {
    const p = buildPlan('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');
    expect(p.items.map((i) => i.id)).toEqual(expect.arrayContaining(['castle', 'develop']));
    expect(p.items.length).toBeLessThanOrEqual(3);
    expect(p.items[0]?.text.length).toBeGreaterThan(20);
  });
  it('tells you to use an open file', () => {
    expect(ids('r2r2k1/pp3ppp/8/8/8/8/PP3PPP/R4RK1 w - - 0 20')).toContain('open-file');
  });
  it('notices passed pawns, and that the opponent has one', () => {
    expect(ids('4k3/8/8/3P4/8/8/8/4K3 w - - 0 40')).toContain('passed-pawn');
    expect(ids('4k3/8/8/8/3p4/8/8/4K3 w - - 0 40')).toContain('stop-passed');
  });
  it('finds a knight outpost and its squares', () => {
    const p = buildPlan('r2qk2r/pp3ppp/8/8/2P5/2N5/PP3PPP/R2QK2R w KQkq - 0 15', 20);
    const o = p.items.find((i) => i.id === 'outpost');
    expect(o?.squares).toContain('d5');
  });
  it('points at an isolated pawn to attack', () => {
    expect(ids('r2qk2r/pp3ppp/8/3p4/8/2N5/PP3PPP/R2QK2R w KQkq - 0 20')).toContain('target-isolated');
  });
  it('advises trading when ahead and keeping pieces when behind', () => {
    expect(ids('r3k3/pppp1ppp/8/8/8/8/PPPP1PPP/R2QK2R w - - 0 25')).toContain('trade');
    expect(ids('r2qk2r/pppp1ppp/8/8/8/8/PPPP1PPP/R3K3 w - - 0 25')).toContain('complicate');
  });
  it('spots opposite-side castling', () => {
    expect(ids('2kr3r/ppp2ppp/2n1bn2/3pp3/3PP3/2N1BN2/PPP2PPP/R4RK1 w - - 0 14')).toContain('storm');
  });
  it('always gives some advice, and tells the endgame king to centralise', () => {
    expect(buildPlan('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1').items.length).toBeGreaterThan(0);
    expect(ids('8/5k2/8/8/8/8/6K1/R7 w - - 0 50').includes('king-active') || ids('8/5k2/8/8/8/8/6K1/R7 w - - 0 50').includes('worst-piece')).toBe(true);
  });
  it('speaks for the side to move', () => {
    expect(buildPlan('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2').color).toBe('b');
  });
});

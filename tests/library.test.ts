import { Chess } from 'chess.js';
import { describe, expect, it } from 'vitest';
import { explainInstantly } from '../explain';
import type { CoachService } from '../main/coach';
import { Db } from '../main/db';
import { Library } from '../main/library';
import type { MoveCheck, MoveCheckRequest, ReviewedMove } from '../shared/api';
import { fixture } from './helpers';

// A game where White plays 4.Nd4?? (the hang-knight-d4 fixture) and otherwise fine moves.
const PGN = '[White "You"]\n[Black "Bot"]\n[Result "0-1"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Nd4 exd4 0-1';

/** Coach stub: every move is good except the fixture blunder, which gets the real pipeline result. */
function stubCoach(): CoachService {
  const f = fixture('hang-knight-d4');
  const blunder = (fenBefore: string, uci: string): MoveCheck => ({
    moveUci: uci,
    san: new Chess(fenBefore).move({ from: uci.slice(0, 2), to: uci.slice(2, 4) }).san,
    classification: uci === f.ctx.movePlayedUci && fenBefore === f.ctx.fen ? 'blunder' : uci === 'd2d4' ? 'good' : 'good',
    winProbBefore: f.ctx.winProbBefore,
    winProbAfter: uci === f.ctx.movePlayedUci ? f.ctx.winProbAfter : f.ctx.winProbBefore,
    bestMoveUci: f.ctx.bestMoveUci,
    bestMoveSan: 'd3',
    stop: false,
    book: false,
    ctx: uci === f.ctx.movePlayedUci && fenBefore === f.ctx.fen ? f.ctx : null,
    instant: uci === f.ctx.movePlayedUci && fenBefore === f.ctx.fen ? explainInstantly(f.ctx) : null,
  });
  const coach = {
    async reviewGame(pgn: string, myColor: 'w' | 'b'): Promise<ReviewedMove[]> {
      const g = new Chess();
      g.loadPgn(pgn);
      return g.history({ verbose: true }).map((m, ply) => {
        const uci = `${m.from}${m.to}`;
        const mine = m.color === myColor;
        return { ply, fenBefore: m.before, fenAfter: m.after, san: m.san, uci, mine, check: mine ? blunder(m.before, uci) : null };
      });
    },
    async checkMove(req: MoveCheckRequest): Promise<MoveCheck> {
      return { ...blunder(req.fenBefore, req.moveUci), classification: req.moveUci === 'd2d3' ? 'good' : 'mistake' };
    },
  };
  return coach as unknown as CoachService;
}

describe('library: analysis -> report -> drills', () => {
  const db = new Db(':memory:');
  const lib = new Library(db, stubCoach());
  const id = db.saveGame({ myColor: 'w', opponent: 'Bot', result: '0-1', pgn: PGN });

  it('stores the mistake with its motif and marks the game analysed', async () => {
    expect(db.unanalyzedGameIds()).toEqual([id]);
    await lib.analyzeAll(() => undefined);
    expect(db.unanalyzedGameIds()).toEqual([]);
    const r = db.report();
    expect(r.gamesAnalyzed).toBe(1);
    expect(r.myMoves).toBe(4);
    expect(r.byClassification.blunder).toBe(1);
    expect(r.byTag[0]).toMatchObject({ tag: 'hangingPiece', count: 1, allowed: 1, missed: 0, blunders: 1 });
    expect(r.byPhase[0]?.phase).toBe('opening');
  });

  it('turns the blunder into a drill that is due now, filterable by motif', () => {
    const now = Date.now();
    expect(db.dueDrills(now, {}, 10)).toHaveLength(1);
    expect(db.dueDrills(now, { tag: 'hangingPiece' }, 10)).toHaveLength(1);
    expect(db.dueDrills(now, { tag: 'fork' }, 10)).toHaveLength(0);
    expect(db.drillCounts(now)).toMatchObject({ total: 1, due: 1 });
  });

  it('re-analysing does not duplicate drills or mistakes', async () => {
    await lib.analyzeGame(id);
    expect(db.drillCounts(Date.now()).total).toBe(1);
    expect(db.report().byClassification.blunder).toBe(1);
  });

  it('a wrong answer brings the drill back in 10 minutes, a right one pushes it to tomorrow', async () => {
    const d = db.dueDrills(Date.now(), {}, 1)[0];
    if (!d) throw new Error('no drill');
    const wrong = await lib.answerDrill(d.id, 'e1g1');
    expect(wrong.correct).toBe(false);
    expect(wrong.nextDueAt - Date.now()).toBeLessThan(11 * 60_000);
    const right = await lib.answerDrill(d.id, 'd2d3');
    expect(right.correct).toBe(true);
    expect(right.nextDueAt - Date.now()).toBeGreaterThan(23 * 3600_000);
    expect(db.drillCounts(Date.now()).due).toBe(0);
  });

  it('imports skip games already in the library', () => {
    const g = { source: 'lichess' as const, externalId: 'lichess:abc', myColor: 'b' as const, opponent: 'x', result: '1-0', pgn: PGN, playedAt: '2026-10-01T00:00:00Z' };
    expect(db.importGames([g, g])).toBe(1);
    expect(db.importGames([g])).toBe(0);
    expect(db.listGames().find((x) => x.source === 'lichess')?.analyzed).toBe(false);
  });
});

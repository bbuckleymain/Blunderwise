import { gamePhase } from '../analysis/gamePhase';
import { newCard, schedule } from '../analysis/spacedRepetition';
import type { DrillAnswer, ImportResult, LibraryProgress, MistakeRow } from '../shared/api';
import type { CoachService } from './coach';
import type { Db } from './db';
import { fetchChessComGames, fetchLichessGames, type HttpGet } from './importers';

/** Game library: imports, batch analysis into stored mistakes, and drills built from them. */
export class Library {
  private running: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly db: Db,
    private readonly coach: CoachService,
    private readonly http?: HttpGet,
  ) {}

  async importLichess(username: string, max: number): Promise<ImportResult> {
    const games = await fetchLichessGames(username, max, this.http);
    return { fetched: games.length, added: this.db.importGames(games) };
  }

  async importChessCom(username: string, max: number): Promise<ImportResult> {
    const games = await fetchChessComGames(username, max, this.http);
    return { fetched: games.length, added: this.db.importGames(games) };
  }

  /** Analyse one game on the background engine, store its mistakes and add drills for mistakes and blunders. */
  async analyzeGame(id: number, onMove?: (done: number, total: number) => void): Promise<void> {
    const g = this.db.getGame(id);
    if (!g) return;
    const moves = await this.coach.reviewGame(g.pgn, g.myColor, (p) => onMove?.(p.done, p.total), 'bulk');
    const rows: MistakeRow[] = [];
    let myMoves = 0;
    for (const m of moves) {
      if (!m.mine) continue;
      myMoves += 1;
      const c = m.check;
      if (!c?.ctx || !c.bestMoveUci || !c.bestMoveSan || c.classification === 'good') continue;
      const tags = c.instant?.tags ?? [];
      rows.push({
        ply: m.ply,
        fen: m.fenBefore,
        playedUci: m.uci,
        playedSan: m.san,
        bestUci: c.bestMoveUci,
        bestSan: c.bestMoveSan,
        classification: c.classification,
        phase: c.instant?.facts.phase ?? gamePhase(m.fenBefore, c.ctx.moveNumber),
        tags: tags.map((t) => t.tag),
        sides: tags.map((t) => t.side),
        winBefore: c.winProbBefore,
        winAfter: c.winProbAfter,
      });
      if (c.classification === 'mistake' || c.classification === 'blunder') {
        this.db.addDrill(
          {
            fen: m.fenBefore,
            myColor: g.myColor,
            playedUci: m.uci,
            playedSan: m.san,
            bestUci: c.bestMoveUci,
            bestSan: c.bestMoveSan,
            classification: c.classification,
            tags: tags.map((t) => t.tag),
            gameId: id,
            opening: g.openingFamily,
            phase: c.instant?.facts.phase ?? gamePhase(m.fenBefore, c.ctx.moveNumber),
          },
          newCard(Date.now()),
        );
      }
    }
    this.db.storeAnalysis(id, myMoves, rows);
  }

  /** Analyse every game not analysed yet, one at a time (calls are queued, never run twice at once). */
  analyzeAll(onProgress: (p: LibraryProgress) => void): Promise<number> {
    const job = this.running.then(async () => {
      const ids = this.db.unanalyzedGameIds();
      for (const [i, id] of ids.entries()) {
        onProgress({ game: i, games: ids.length, move: 0, moves: 0 });
        await this.analyzeGame(id, (move, moves) => onProgress({ game: i, games: ids.length, move, moves }));
      }
      onProgress({ game: ids.length, games: ids.length, move: 0, moves: 0 });
      return ids.length;
    });
    this.running = job.catch(() => undefined);
    return job;
  }

  /** Queue a single game (used right after a game against the bot is saved). */
  analyzeInBackground(id: number): void {
    this.running = this.running.then(() => this.analyzeGame(id)).catch((e: unknown) => console.error('auto-analysis failed', e));
  }

  async answerDrill(id: number, moveUci: string): Promise<DrillAnswer> {
    const d = this.db.getDrill(id);
    if (!d) throw new Error(`No drill ${id}`);
    const check = await this.coach.checkMove({ fenBefore: d.fen, moveUci, myColor: d.myColor });
    const correct = moveUci === d.bestUci || check.classification === 'good';
    const card = schedule(d, correct, Date.now());
    this.db.updateDrill(id, card);
    return { correct, check, nextDueAt: card.dueAt };
  }
}

import { DatabaseSync } from 'node:sqlite';
import type { EngineEval } from '../engine/types';
import type { KeyValueStore } from '../explain/cache';
import type { ReviewState } from '../analysis/spacedRepetition';
import type { Color, MotifTag } from '../explain/types';
import type { DrillRecord, GameRecord, MistakeRow, ReportData, SaveGameRequest } from '../shared/api';
import type { ImportedGame } from './importers';

/** SQLite storage via Node's built-in node:sqlite (no native module to rebuild for Electron). */
export class Db {
  private readonly db: DatabaseSync;

  constructor(file: string) {
    this.db = new DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        my_color TEXT NOT NULL,
        opponent TEXT NOT NULL,
        result TEXT NOT NULL,
        pgn TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS analyses (
        fen TEXT NOT NULL,
        depth INTEGER NOT NULL,
        cp INTEGER,
        mate INTEGER,
        pv TEXT NOT NULL,
        best TEXT,
        PRIMARY KEY (fen, depth)
      );
      CREATE TABLE IF NOT EXISTS explanations (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS mistakes (
        game_id INTEGER NOT NULL,
        ply INTEGER NOT NULL,
        fen TEXT NOT NULL,
        played_uci TEXT NOT NULL,
        played_san TEXT NOT NULL,
        best_uci TEXT NOT NULL,
        best_san TEXT NOT NULL,
        classification TEXT NOT NULL,
        phase TEXT NOT NULL,
        tags TEXT NOT NULL,
        sides TEXT NOT NULL,
        win_before REAL NOT NULL,
        win_after REAL NOT NULL,
        PRIMARY KEY (game_id, ply)
      );
      CREATE TABLE IF NOT EXISTS drills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fen TEXT NOT NULL,
        my_color TEXT NOT NULL,
        played_uci TEXT NOT NULL,
        played_san TEXT NOT NULL,
        best_uci TEXT NOT NULL,
        best_san TEXT NOT NULL,
        classification TEXT NOT NULL,
        tags TEXT NOT NULL,
        game_id INTEGER,
        created_at INTEGER NOT NULL,
        due_at INTEGER NOT NULL,
        interval_days REAL NOT NULL,
        ease REAL NOT NULL,
        reps INTEGER NOT NULL,
        lapses INTEGER NOT NULL,
        UNIQUE (fen, played_uci)
      );
    `);
    this.migrate();
  }

  /** Add columns introduced after the first release. */
  private migrate(): void {
    const cols = new Set(
      (this.db.prepare('PRAGMA table_info(games)').all() as { name: string }[]).map((c) => c.name),
    );
    if (!cols.has('source')) this.db.exec("ALTER TABLE games ADD COLUMN source TEXT NOT NULL DEFAULT 'bot'");
    if (!cols.has('external_id')) this.db.exec('ALTER TABLE games ADD COLUMN external_id TEXT');
    if (!cols.has('analyzed')) this.db.exec('ALTER TABLE games ADD COLUMN analyzed INTEGER NOT NULL DEFAULT 0');
    if (!cols.has('my_moves')) this.db.exec('ALTER TABLE games ADD COLUMN my_moves INTEGER NOT NULL DEFAULT 0');
    this.db.exec('CREATE UNIQUE INDEX IF NOT EXISTS games_external ON games(external_id) WHERE external_id IS NOT NULL');
  }

  /** Insert imported games, skipping ones already in the library. Returns how many were new. */
  importGames(games: readonly ImportedGame[]): number {
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO games (created_at, my_color, opponent, result, pgn, source, external_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    let added = 0;
    for (const g of games) {
      const r = stmt.run(g.playedAt, g.myColor, g.opponent, g.result, g.pgn, g.source, g.externalId);
      added += Number(r.changes);
    }
    return added;
  }

  unanalyzedGameIds(): number[] {
    return (this.db.prepare('SELECT id FROM games WHERE analyzed = 0 ORDER BY created_at DESC').all() as { id: number }[]).map((r) =>
      Number(r.id),
    );
  }

  /** Replace a game's stored mistakes and mark it analyzed. */
  storeAnalysis(gameId: number, myMoves: number, rows: readonly MistakeRow[]): void {
    this.db.prepare('DELETE FROM mistakes WHERE game_id = ?').run(gameId);
    const ins = this.db.prepare(
      'INSERT INTO mistakes (game_id, ply, fen, played_uci, played_san, best_uci, best_san, classification, phase, tags, sides, win_before, win_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    for (const m of rows) {
      ins.run(gameId, m.ply, m.fen, m.playedUci, m.playedSan, m.bestUci, m.bestSan, m.classification, m.phase, m.tags.join(','), m.sides.join(','), m.winBefore, m.winAfter);
    }
    this.db.prepare('UPDATE games SET analyzed = 1, my_moves = ? WHERE id = ?').run(myMoves, gameId);
  }

  /** Create a drill unless the same position + move is already a drill. */
  addDrill(d: { fen: string; myColor: Color; playedUci: string; playedSan: string; bestUci: string; bestSan: string; classification: string; tags: readonly MotifTag[]; gameId: number | null }, card: ReviewState): void {
    this.db
      .prepare(
        'INSERT OR IGNORE INTO drills (fen, my_color, played_uci, played_san, best_uci, best_san, classification, tags, game_id, created_at, due_at, interval_days, ease, reps, lapses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(d.fen, d.myColor, d.playedUci, d.playedSan, d.bestUci, d.bestSan, d.classification, d.tags.join(','), d.gameId, Date.now(), card.dueAt, card.intervalDays, card.ease, card.reps, card.lapses);
  }

  private static toDrill(r: Record<string, unknown>): DrillRecord {
    return {
      id: Number(r.id),
      fen: String(r.fen),
      myColor: r.my_color === 'b' ? 'b' : 'w',
      playedUci: String(r.played_uci),
      playedSan: String(r.played_san),
      bestUci: String(r.best_uci),
      bestSan: String(r.best_san),
      classification: String(r.classification),
      tags: String(r.tags).split(',').filter(Boolean) as MotifTag[],
      gameId: r.game_id === null ? null : Number(r.game_id),
      dueAt: Number(r.due_at),
      intervalDays: Number(r.interval_days),
      ease: Number(r.ease),
      reps: Number(r.reps),
      lapses: Number(r.lapses),
    };
  }

  /** Due drills, most-missed first. `tag` filters to drills carrying that motif. */
  dueDrills(now: number, tag: MotifTag | null, limit: number): DrillRecord[] {
    const rows = tag
      ? this.db
          .prepare("SELECT * FROM drills WHERE due_at <= ? AND (',' || tags || ',') LIKE ? ORDER BY lapses DESC, due_at ASC LIMIT ?")
          .all(now, `%,${tag},%`, limit)
      : this.db.prepare('SELECT * FROM drills WHERE due_at <= ? ORDER BY lapses DESC, due_at ASC LIMIT ?').all(now, limit);
    return rows.map((r) => Db.toDrill(r as Record<string, unknown>));
  }

  getDrill(id: number): DrillRecord | null {
    const r = this.db.prepare('SELECT * FROM drills WHERE id = ?').get(id);
    return r ? Db.toDrill(r as Record<string, unknown>) : null;
  }

  updateDrill(id: number, card: ReviewState): void {
    this.db
      .prepare('UPDATE drills SET due_at = ?, interval_days = ?, ease = ?, reps = ?, lapses = ? WHERE id = ?')
      .run(card.dueAt, card.intervalDays, card.ease, card.reps, card.lapses, id);
  }

  drillCounts(now: number): { total: number; due: number; nextDueAt: number | null } {
    const total = Number((this.db.prepare('SELECT COUNT(*) AS n FROM drills').get() as { n: number }).n);
    const due = Number((this.db.prepare('SELECT COUNT(*) AS n FROM drills WHERE due_at <= ?').get(now) as { n: number }).n);
    const next = this.db.prepare('SELECT MIN(due_at) AS t FROM drills WHERE due_at > ?').get(now) as { t: number | null };
    return { total, due, nextDueAt: next.t === null ? null : Number(next.t) };
  }

  report(): ReportData {
    const g = this.db.prepare('SELECT COUNT(*) AS games, COALESCE(SUM(my_moves), 0) AS moves FROM games WHERE analyzed = 1').get() as {
      games: number;
      moves: number;
    };
    const rows = this.db.prepare('SELECT classification, phase, tags, sides FROM mistakes').all() as {
      classification: string;
      phase: string;
      tags: string;
      sides: string;
    }[];
    const byClass = { inaccuracy: 0, mistake: 0, blunder: 0 };
    const tagMap = new Map<string, { count: number; allowed: number; missed: number; blunders: number }>();
    const phaseMap = new Map<string, { count: number; blunders: number }>();
    for (const r of rows) {
      if (r.classification === 'inaccuracy' || r.classification === 'mistake' || r.classification === 'blunder') byClass[r.classification] += 1;
      if (r.classification === 'inaccuracy') continue; // motifs/phases: mistakes and blunders only
      const isBlunder = r.classification === 'blunder' ? 1 : 0;
      const ph = phaseMap.get(r.phase) ?? { count: 0, blunders: 0 };
      phaseMap.set(r.phase, { count: ph.count + 1, blunders: ph.blunders + isBlunder });
      const tags = r.tags.split(',').filter(Boolean);
      const sides = r.sides.split(',');
      tags.forEach((t, i) => {
        const e = tagMap.get(t) ?? { count: 0, allowed: 0, missed: 0, blunders: 0 };
        const allowed = sides[i] === 'opponent' ? 1 : 0;
        tagMap.set(t, { count: e.count + 1, allowed: e.allowed + allowed, missed: e.missed + (1 - allowed), blunders: e.blunders + isBlunder });
      });
    }
    return {
      gamesAnalyzed: Number(g.games),
      myMoves: Number(g.moves),
      byClassification: byClass,
      byTag: [...tagMap].map(([tag, v]) => ({ tag: tag as MotifTag, ...v })).sort((a, b) => b.count - a.count),
      byPhase: [...phaseMap].map(([phase, v]) => ({ phase, ...v })),
    };
  }

  saveGame(g: SaveGameRequest): number {
    const r = this.db
      .prepare('INSERT INTO games (created_at, my_color, opponent, result, pgn) VALUES (?, ?, ?, ?, ?)')
      .run(new Date().toISOString(), g.myColor, g.opponent, g.result, g.pgn);
    return Number(r.lastInsertRowid);
  }

  private static toGame(row: Record<string, unknown>): GameRecord {
    return {
      id: Number(row.id),
      source: row.source === 'lichess' || row.source === 'chesscom' ? row.source : 'bot',
      analyzed: Number(row.analyzed ?? 0) === 1,
      createdAt: String(row.created_at),
      myColor: row.my_color === 'b' ? 'b' : 'w',
      opponent: String(row.opponent),
      result: String(row.result),
      pgn: String(row.pgn),
    };
  }

  listGames(): GameRecord[] {
    return this.db
      .prepare('SELECT * FROM games ORDER BY created_at DESC LIMIT 500')
      .all()
      .map((r) => Db.toGame(r as Record<string, unknown>));
  }

  getGame(id: number): GameRecord | null {
    const row = this.db.prepare('SELECT * FROM games WHERE id = ?').get(id);
    return row ? Db.toGame(row as Record<string, unknown>) : null;
  }

  getAnalysis(fenKey: string, depth: number): EngineEval | null {
    const row = this.db.prepare('SELECT * FROM analyses WHERE fen = ? AND depth >= ? ORDER BY depth DESC LIMIT 1').get(fenKey, depth) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return {
      cp: row.cp === null ? null : Number(row.cp),
      mate: row.mate === null ? null : Number(row.mate),
      pv: String(row.pv).split(' ').filter(Boolean),
      bestMove: row.best === null ? null : String(row.best),
    };
  }

  putAnalysis(fenKey: string, depth: number, e: EngineEval): void {
    this.db
      .prepare('INSERT OR REPLACE INTO analyses (fen, depth, cp, mate, pv, best) VALUES (?, ?, ?, ?, ?, ?)')
      .run(fenKey, depth, e.cp, e.mate, e.pv.join(' '), e.bestMove);
  }

  getSetting(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  setSetting(key: string, value: string | null): void {
    if (value === null) this.db.prepare('DELETE FROM settings WHERE key = ?').run(key);
    else this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }

  /** Explanation cache for the pipeline. */
  explanationStore(): KeyValueStore {
    return {
      get: (key) => {
        const row = this.db.prepare('SELECT value FROM explanations WHERE key = ?').get(key) as { value: string } | undefined;
        return Promise.resolve(row ? row.value : null);
      },
      set: (key, value) => {
        this.db.prepare('INSERT OR REPLACE INTO explanations (key, value) VALUES (?, ?)').run(key, value);
        return Promise.resolve();
      },
    };
  }

  close(): void {
    this.db.close();
  }
}

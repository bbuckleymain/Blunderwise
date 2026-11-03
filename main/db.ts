import { DatabaseSync } from 'node:sqlite';
import type { EngineEval } from '../engine/types';
import type { KeyValueStore } from '../explain/cache';
import type { GameRecord, SaveGameRequest } from '../shared/api';

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
    `);
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
      createdAt: String(row.created_at),
      myColor: row.my_color === 'b' ? 'b' : 'w',
      opponent: String(row.opponent),
      result: String(row.result),
      pgn: String(row.pgn),
    };
  }

  listGames(): GameRecord[] {
    return this.db
      .prepare('SELECT * FROM games ORDER BY id DESC LIMIT 200')
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

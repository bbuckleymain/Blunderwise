import { Chess } from 'chess.js';
import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { newCard } from '../analysis/spacedRepetition';
import { parseBackup } from '../main/backupFile';
import { Db, SCHEMA_VERSION, gameUid } from '../main/db';

const tmp = (): string => mkdtempSync(path.join(tmpdir(), 'bw-storage-'));

function pgnOf(sans: string[], result: string): string {
  const c = new Chess();
  for (const s of sans) c.move(s);
  const text = c.history().map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}. ${m}` : m)).join(' ');
  return `[Result "${result}"]\n\n${text} ${result}`;
}

const GAME = pgnOf(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'], '1-0');
const drill = (gameId: number) => ({
  fen: new Chess().fen(),
  myColor: 'w' as const,
  playedUci: 'a2a3',
  playedSan: 'a3',
  bestUci: 'e2e4',
  bestSan: 'e4',
  classification: 'mistake',
  tags: [],
  gameId,
  opening: 'Ruy Lopez',
  phase: 'opening',
});

describe('surviving app updates: schema migration', () => {
  it('migrates an old database, keeps every game, and leaves a safety copy first', () => {
    const dir = tmp();
    const file = path.join(dir, 'blunderwise.sqlite');
    // A database as the very first release wrote it: no uid, no opening columns, user_version 0.
    const old = new DatabaseSync(file);
    old.exec(`CREATE TABLE games (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, my_color TEXT NOT NULL, opponent TEXT NOT NULL, result TEXT NOT NULL, pgn TEXT NOT NULL);`);
    const ins = old.prepare('INSERT INTO games (created_at, my_color, opponent, result, pgn) VALUES (?, ?, ?, ?, ?)');
    ins.run('2026-10-01T10:00:00.000Z', 'w', 'Stockfish level 5', '1-0', GAME);
    ins.run('2026-10-02T10:00:00.000Z', 'b', 'Maia 1100', '0-1', GAME);
    old.close();

    const db = new Db(file);
    expect(db.listGames()).toHaveLength(2);
    expect(db.listGames().every((g) => g.opening !== null)).toBe(true); // openings back-filled too
    expect(Number((new DatabaseSync(file).prepare('PRAGMA user_version').get() as { user_version: number }).user_version)).toBe(SCHEMA_VERSION);

    const backups = readdirSync(path.join(dir, 'backups'));
    expect(backups.filter((f) => f.startsWith('pre-migration-v0-'))).toHaveLength(1);
    const copy = new DatabaseSync(path.join(dir, 'backups', backups[0] ?? ''));
    expect(Number((copy.prepare('SELECT COUNT(*) AS n FROM games').get() as { n: number }).n)).toBe(2);
    expect(copy.prepare("SELECT name FROM pragma_table_info('games') WHERE name = 'uid'").get()).toBeUndefined(); // the untouched original
    copy.close();
    db.close();

    // Opening it again does not migrate (or back up) again, and nothing is lost.
    const again = new Db(file);
    expect(again.listGames()).toHaveLength(2);
    expect(readdirSync(path.join(dir, 'backups')).filter((f) => f.startsWith('pre-migration'))).toHaveLength(1);
    again.close();
  });
});

describe('automatic backups', () => {
  it('writes a rolling daily backup, skips when one is recent, and keeps only the last 7', () => {
    const dir = tmp();
    const db = new Db(path.join(dir, 'blunderwise.sqlite'));
    db.saveGame({ myColor: 'w', opponent: 'Bot', result: '1-0', pgn: GAME });
    const backups = path.join(dir, 'backups');
    const t0 = new Date();
    const first = db.backupIfDue(backups, t0);
    expect(first).toMatch(/^blunderwise-\d{8}-\d{6}\.sqlite$/);
    expect(db.backupIfDue(backups, new Date(t0.getTime() + 3600_000))).toBeNull(); // still fresh
    for (let i = 1; i <= 10; i++) db.backupIfDue(backups, new Date(t0.getTime() + i * 25 * 3600_000));
    const rolling = readdirSync(backups).filter((f) => /^blunderwise-\d{8}-\d{6}\.sqlite$/.test(f));
    expect(rolling).toHaveLength(7);
    // A backup is a complete, readable database.
    const copy = new DatabaseSync(path.join(backups, rolling[0] ?? ''));
    expect(Number((copy.prepare('SELECT COUNT(*) AS n FROM games').get() as { n: number }).n)).toBe(1);
    copy.close();
    expect(Db.listBackups(backups).length).toBe(7);
    db.close();
  });

  it('works for an in-memory database without touching the disk', () => {
    expect(new Db(':memory:').counts()).toEqual({ games: 0, drills: 0 });
  });
});

describe('moving your library between installs (export / import)', () => {
  it('round-trips games and drills (with their schedule) and never duplicates', () => {
    const a = new Db(':memory:');
    const id1 = a.saveGame({ myColor: 'w', opponent: 'Stockfish level 5', result: '1-0', pgn: GAME });
    a.saveGame({ myColor: 'b', opponent: 'Maia 1500', result: '0-1', pgn: pgnOf(['d4', 'd5'], '0-1') });
    a.importGames([{ source: 'lichess', externalId: 'lichess:abc123', myColor: 'w', opponent: 'someone (1500)', result: '1/2-1/2', pgn: GAME, playedAt: '2026-09-01T00:00:00Z' }]);
    a.addDrill(drill(id1), { ...newCard(0), reps: 2, intervalDays: 3, dueAt: 5_000_000, lapses: 1 });

    const file = JSON.stringify(a.exportAll()); // what is written to disk
    const b = new Db(':memory:');
    const first = b.importBackup(parseBackup(file));
    expect(first).toEqual({ games: 3, drills: 1, skipped: 0 });
    expect(b.listGames()).toHaveLength(3);
    expect(b.listGames().find((g) => g.source === 'lichess')?.opponent).toBe('someone (1500)');
    const d = b.dueDrills(10_000_000, {}, 10)[0];
    expect(d).toMatchObject({ reps: 2, lapses: 1, intervalDays: 3, opening: 'Ruy Lopez' });
    expect(d?.gameId).not.toBeNull(); // re-linked to the imported game

    // Importing the same file again changes nothing.
    expect(b.importBackup(parseBackup(file))).toEqual({ games: 0, drills: 0, skipped: 3 });
    expect(b.counts()).toEqual({ games: 3, drills: 1 });
  });

  it('merges into an existing library without overwriting what is there', () => {
    const a = new Db(':memory:');
    a.saveGame({ myColor: 'w', opponent: 'Old bot', result: '1-0', pgn: GAME });
    const b = new Db(':memory:');
    b.saveGame({ myColor: 'b', opponent: 'New bot', result: '0-1', pgn: pgnOf(['c4'], '0-1') });
    const r = b.importBackup(parseBackup(JSON.stringify(a.exportAll())));
    expect(r.games).toBe(1);
    expect(b.counts().games).toBe(2);
  });

  it('never fails to save two identical games saved at the same instant', () => {
    const db = new Db(':memory:');
    for (let i = 0; i < 50; i++) db.saveGame({ myColor: 'w', opponent: 'Bot', result: '1-0', pgn: GAME });
    expect(db.counts().games).toBe(50);
  });

  it('gives games a stable id', () => {
    expect(gameUid('2026-01-01T00:00:00Z', GAME)).toBe(gameUid('2026-01-01T00:00:00Z', GAME));
    expect(gameUid('2026-01-01T00:00:00Z', GAME)).not.toBe(gameUid('2026-01-02T00:00:00Z', GAME));
  });

  it('rejects files that are not (or not fully) a backup, with a readable message', () => {
    expect(() => parseBackup('not json')).toThrow(/not valid JSON/);
    expect(() => parseBackup('{"format":"something-else"}')).toThrow(/not a Blunderwise backup/);
    expect(() => parseBackup('{"format":"blunderwise-backup","version":9,"games":[],"drills":[]}')).toThrow(/newer version/);
    expect(() => parseBackup('{"format":"blunderwise-backup","version":1,"games":[{"uid":"x"}],"drills":[]}')).toThrow(/Game 1 .* damaged/);
    expect(() => parseBackup('{"format":"blunderwise-backup","version":1,"games":[],"drills":[{"fen":"x"}]}')).toThrow(/Drill 1 .* damaged/);
    expect(parseBackup(JSON.stringify(new Db(':memory:').exportAll())).games).toEqual([]);
  });

  it('writes a consistent copy with backupTo', () => {
    const dir = tmp();
    const db = new Db(path.join(dir, 'blunderwise.sqlite'));
    db.saveGame({ myColor: 'w', opponent: 'Bot', result: '1-0', pgn: GAME });
    const dest = path.join(dir, 'copy.sqlite');
    db.backupTo(dest);
    db.backupTo(dest); // overwriting is fine
    expect(existsSync(dest)).toBe(true);
    expect(new Db(dest).counts().games).toBe(1);
  });
});

describe('record against each bot', () => {
  it('groups results per opponent, from your side of the board', () => {
    const db = new Db(':memory:');
    const save = (opponent: string, color: 'w' | 'b', result: string): number => db.saveGame({ myColor: color, opponent, result, pgn: pgnOf(['e4'], result) });
    save('Stockfish level 5', 'w', '1-0'); // win
    save('Stockfish level 5', 'b', '1-0'); // loss
    save('Stockfish level 5', 'w', '1/2-1/2'); // draw
    save('Maia 1100', 'b', '0-1'); // win as Black
    db.importGames([{ source: 'lichess', externalId: 'lichess:x', myColor: 'w', opponent: 'human', result: '1-0', pgn: GAME, playedAt: '2026-01-01T00:00:00Z' }]);
    const rows = db.opponentRecord();
    expect(rows.map((r) => r.opponent)).toEqual(['Stockfish level 5', 'Maia 1100']); // online games are not "bots"
    expect(rows[0]).toMatchObject({ games: 3, wins: 1, draws: 1, losses: 1 });
    expect(rows[1]).toMatchObject({ games: 1, wins: 1, losses: 0 });
  });
});

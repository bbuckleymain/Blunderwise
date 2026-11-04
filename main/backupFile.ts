import type { BackupDrill, BackupFile, BackupGame } from '../shared/api';
import { BACKUP_FORMAT } from './db';

const str = (v: unknown): v is string => typeof v === 'string';
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const color = (v: unknown): v is 'w' | 'b' => v === 'w' || v === 'b';

function parseGame(v: unknown, i: number): BackupGame {
  const g = v as Record<string, unknown> | null;
  if (!g || !str(g.uid) || g.uid === '' || !str(g.createdAt) || !color(g.myColor) || !str(g.opponent) || !str(g.result) || !str(g.pgn)) {
    throw new Error(`Game ${i + 1} in the file is damaged.`);
  }
  return {
    uid: g.uid,
    createdAt: g.createdAt,
    myColor: g.myColor,
    opponent: g.opponent,
    result: g.result,
    pgn: g.pgn,
    source: str(g.source) ? g.source : 'bot',
    externalId: str(g.externalId) ? g.externalId : null,
  };
}

function parseDrill(v: unknown, i: number): BackupDrill {
  const d = v as Record<string, unknown> | null;
  if (
    !d ||
    !str(d.fen) ||
    !color(d.myColor) ||
    !str(d.playedUci) ||
    !str(d.playedSan) ||
    !str(d.bestUci) ||
    !str(d.bestSan) ||
    !str(d.classification) ||
    !Array.isArray(d.tags) ||
    !num(d.createdAt) ||
    !num(d.dueAt) ||
    !num(d.intervalDays) ||
    !num(d.ease) ||
    !num(d.reps) ||
    !num(d.lapses)
  ) {
    throw new Error(`Drill ${i + 1} in the file is damaged.`);
  }
  return {
    gameUid: str(d.gameUid) ? d.gameUid : null,
    fen: d.fen,
    myColor: d.myColor,
    playedUci: d.playedUci,
    playedSan: d.playedSan,
    bestUci: d.bestUci,
    bestSan: d.bestSan,
    classification: d.classification,
    tags: d.tags.filter(str),
    opening: str(d.opening) ? d.opening : null,
    phase: str(d.phase) ? d.phase : null,
    createdAt: d.createdAt,
    dueAt: d.dueAt,
    intervalDays: d.intervalDays,
    ease: d.ease,
    reps: d.reps,
    lapses: d.lapses,
  };
}

/** Parse and validate the text of a backup file. Throws a plain-English error for anything that is not one of ours. */
export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This is not a Blunderwise backup file (it is not valid JSON).');
  }
  const o = data as Record<string, unknown> | null;
  if (!o || o.format !== BACKUP_FORMAT) throw new Error('This is not a Blunderwise backup file.');
  if (o.version !== 1) throw new Error('This backup was made by a newer version of Blunderwise. Update the app and try again.');
  if (!Array.isArray(o.games) || !Array.isArray(o.drills)) throw new Error('The backup file is incomplete.');
  return {
    format: BACKUP_FORMAT,
    version: 1,
    exportedAt: str(o.exportedAt) ? o.exportedAt : '',
    games: o.games.map(parseGame),
    drills: o.drills.map(parseDrill),
  };
}

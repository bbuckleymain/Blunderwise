/** Import games from Lichess and Chess.com public APIs. Parsing is pure and unit-tested; fetch is injectable. */
import type { Color } from '../explain/types';

export interface ImportedGame {
  readonly source: 'lichess' | 'chesscom';
  readonly externalId: string;
  readonly myColor: Color;
  readonly opponent: string;
  readonly result: string;
  readonly pgn: string;
  readonly playedAt: string;
}

export type HttpGet = (url: string, headers: Record<string, string>) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

const UA = 'Blunderwise/0.1 (personal desktop chess coach)';

export function pgnHeaders(pgn: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of pgn.matchAll(/^\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/gm)) {
    if (m[1] && m[2] !== undefined) out.set(m[1], m[2]);
  }
  return out;
}

/** Split a multi-game PGN export into single games. */
export function splitPgn(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\n(?=\[Event )/)
    .map((g) => g.trim())
    .filter((g) => g.startsWith('['));
}

function sideOf(h: Map<string, string>, username: string): Color | null {
  const u = username.toLowerCase();
  if ((h.get('White') ?? '').toLowerCase() === u) return 'w';
  if ((h.get('Black') ?? '').toLowerCase() === u) return 'b';
  return null;
}

function describeOpponent(h: Map<string, string>, me: Color): string {
  const side = me === 'w' ? 'Black' : 'White';
  const name = h.get(side) ?? '?';
  const elo = h.get(`${side}Elo`);
  return elo && elo !== '?' ? `${name} (${elo})` : name;
}

function isStandard(h: Map<string, string>): boolean {
  return (h.get('Variant') ?? 'Standard').toLowerCase() === 'standard' && !h.has('SetUp');
}

/** Parse Lichess's PGN export for `username`. Non-standard variants are skipped. */
export function parseLichessExport(text: string, username: string): ImportedGame[] {
  const out: ImportedGame[] = [];
  for (const pgn of splitPgn(text)) {
    const h = pgnHeaders(pgn);
    const me = sideOf(h, username);
    if (!me || !isStandard(h)) continue;
    const site = h.get('Site') ?? '';
    const id = site.split('/').pop() ?? '';
    if (!id) continue;
    out.push({
      source: 'lichess',
      externalId: `lichess:${id}`,
      myColor: me,
      opponent: describeOpponent(h, me),
      result: h.get('Result') ?? '*',
      pgn,
      playedAt: `${(h.get('UTCDate') ?? h.get('Date') ?? '').replace(/\./g, '-')}T${h.get('UTCTime') ?? '00:00:00'}Z`,
    });
  }
  return out;
}

interface ChessComGame {
  url?: unknown;
  uuid?: unknown;
  pgn?: unknown;
  rules?: unknown;
  end_time?: unknown;
}

/** Parse one Chess.com monthly archive (JSON) for `username`. Only standard chess. */
export function parseChessComArchive(json: string, username: string): ImportedGame[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  const games = (data as { games?: unknown }).games;
  if (!Array.isArray(games)) return [];
  const out: ImportedGame[] = [];
  for (const g of games as ChessComGame[]) {
    if (g.rules !== 'chess' || typeof g.pgn !== 'string') continue;
    const h = pgnHeaders(g.pgn);
    const me = sideOf(h, username);
    if (!me || h.has('SetUp')) continue;
    const id = typeof g.uuid === 'string' ? g.uuid : typeof g.url === 'string' ? g.url : null;
    if (!id) continue;
    out.push({
      source: 'chesscom',
      externalId: `chesscom:${id}`,
      myColor: me,
      opponent: describeOpponent(h, me),
      result: h.get('Result') ?? '*',
      pgn: g.pgn,
      playedAt: typeof g.end_time === 'number' ? new Date(g.end_time * 1000).toISOString() : new Date().toISOString(),
    });
  }
  return out;
}

const defaultGet: HttpGet = (url, headers) => fetch(url, { headers });

async function getText(get: HttpGet, url: string, accept: string): Promise<string> {
  let res;
  try {
    res = await get(url, { Accept: accept, 'User-Agent': UA });
  } catch {
    throw new Error(`Could not reach ${new URL(url).host}. Check your internet connection.`);
  }
  if (res.status === 404) throw new Error('User not found');
  if (res.status === 429) throw new Error('Rate limited by the server; try again in a minute');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function fetchLichessGames(username: string, max: number, get: HttpGet = defaultGet): Promise<ImportedGame[]> {
  const u = encodeURIComponent(username.trim());
  const url = `https://lichess.org/api/games/user/${u}?max=${max}&moves=true&tags=true&clocks=false&evals=false&opening=true`;
  return parseLichessExport(await getText(get, url, 'application/x-chess-pgn'), username.trim());
}

export async function fetchChessComGames(username: string, max: number, get: HttpGet = defaultGet): Promise<ImportedGame[]> {
  const u = encodeURIComponent(username.trim().toLowerCase());
  const archives = JSON.parse(await getText(get, `https://api.chess.com/pub/player/${u}/games/archives`, 'application/json')) as {
    archives?: unknown;
  };
  const months = Array.isArray(archives.archives) ? (archives.archives.filter((x) => typeof x === 'string') as string[]) : [];
  const out: ImportedGame[] = [];
  for (const month of [...months].reverse()) {
    const games = parseChessComArchive(await getText(get, month, 'application/json'), username.trim());
    out.push(...games.reverse()); // newest first
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

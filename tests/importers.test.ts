import { describe, expect, it } from 'vitest';
import { fetchChessComGames, fetchLichessGames, parseChessComArchive, parseLichessExport, splitPgn, type HttpGet } from '../main/importers';

// Samples in the documented export formats (headers as Lichess / Chess.com emit them).
const LICHESS = `[Event "Rated Blitz game"]
[Site "https://lichess.org/abcd1234"]
[Date "2026.10.30"]
[White "TwoCan"]
[Black "someone"]
[Result "0-1"]
[UTCDate "2026.10.30"]
[UTCTime "18:02:11"]
[WhiteElo "1210"]
[BlackElo "1275"]
[Variant "Standard"]
[TimeControl "300+0"]
[ECO "C50"]
[Termination "Normal"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3# 0-1


[Event "Rated Blitz game"]
[Site "https://lichess.org/zzzz9999"]
[Date "2026.10.29"]
[White "x"]
[Black "TwoCan"]
[Result "1-0"]
[Variant "Chess960"]
[SetUp "1"]
[FEN "bbqnnrkr/pppppppp/8/8/8/8/PPPPPPPP/BBQNNRKR w HFhf - 0 1"]

1. d4 1-0


[Event "Rated Rapid game"]
[Site "https://lichess.org/yyyy8888"]
[Date "2026.10.28"]
[White "someone_else"]
[Black "twocan"]
[Result "1/2-1/2"]
[WhiteElo "1190"]
[BlackElo "1201"]
[Variant "Standard"]

1. d4 d5 2. c4 e6 1/2-1/2
`;

const CHESSCOM_ARCHIVES = JSON.stringify({
  archives: ['https://api.chess.com/pub/player/twocan/games/2026/09', 'https://api.chess.com/pub/player/twocan/games/2026/10'],
});
const month = (n: number, uuidPrefix: string): string =>
  JSON.stringify({
    games: [
      ...Array.from({ length: n }, (_, i) => ({
        url: `https://www.chess.com/game/live/${uuidPrefix}${i}`,
        uuid: `${uuidPrefix}-${i}`,
        rules: 'chess',
        end_time: 1761800000 + i,
        pgn: `[Event "Live Chess"]\n[Site "Chess.com"]\n[White "TwoCan"]\n[Black "Opp${i}"]\n[Result "1-0"]\n[WhiteElo "1200"]\n[BlackElo "1180"]\n\n1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0`,
      })),
      { url: 'x', uuid: 'bughouse', rules: 'bughouse', pgn: '[White "TwoCan"]\n\n1. e4' },
    ],
  });

describe('Lichess import', () => {
  it('splits a multi-game export', () => {
    expect(splitPgn(LICHESS)).toHaveLength(3);
  });
  it('keeps standard games, finds my colour case-insensitively, skips variants', () => {
    const games = parseLichessExport(LICHESS, 'TwoCan');
    expect(games.map((g) => g.externalId)).toEqual(['lichess:abcd1234', 'lichess:yyyy8888']);
    expect(games[0]?.myColor).toBe('w');
    expect(games[0]?.opponent).toBe('someone (1275)');
    expect(games[0]?.result).toBe('0-1');
    expect(games[0]?.playedAt).toBe('2026-10-30T18:02:11Z');
    expect(games[1]?.myColor).toBe('b');
  });
  it('calls the documented endpoint', async () => {
    let seen = '';
    const get: HttpGet = (url) => {
      seen = url;
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(LICHESS) });
    };
    const games = await fetchLichessGames('TwoCan', 20, get);
    expect(seen).toContain('https://lichess.org/api/games/user/TwoCan?max=20');
    expect(games).toHaveLength(2);
  });
  it('explains network failures in plain words', async () => {
    const get: HttpGet = () => Promise.reject(new TypeError('fetch failed'));
    await expect(fetchLichessGames('x', 5, get)).rejects.toThrow('Could not reach lichess.org. Check your internet connection.');
  });
  it('reports unknown users', async () => {
    const get: HttpGet = () => Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('') });
    await expect(fetchLichessGames('nobody', 5, get)).rejects.toThrow(/not found/);
  });
});

describe('Chess.com import', () => {
  it('parses a monthly archive and skips other rule sets', () => {
    const games = parseChessComArchive(month(2, 'a'), 'twocan');
    expect(games).toHaveLength(2);
    expect(games[0]?.myColor).toBe('w');
    expect(games[0]?.opponent).toBe('Opp0 (1180)');
  });
  it('walks archives newest first and stops at max', async () => {
    const urls: string[] = [];
    const get: HttpGet = (url) => {
      urls.push(url);
      const body = url.endsWith('/archives') ? CHESSCOM_ARCHIVES : url.endsWith('/10') ? month(3, 'oct') : month(5, 'sep');
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(body) });
    };
    const games = await fetchChessComGames('TwoCan', 4, get);
    expect(games).toHaveLength(4);
    expect(games[0]?.externalId).toBe('chesscom:oct-2'); // newest game first
    expect(urls[1]).toContain('/2026/10');
  });
});

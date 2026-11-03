/**
 * DEV-ONLY: build openings/openings.json from the Lichess openings dataset (CC0, github.com/lichess-org/chess-openings).
 *   npm run generate:openings              # downloads a.tsv..e.tsv from GitHub
 *   npm run generate:openings -- ./tsvdir  # or reads them from a folder
 * Every prefix of every named line becomes a "book" position, so transpositions are recognised by position, not move order.
 */
import { Chess } from 'chess.js';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { BookNode, OpeningsData } from '../openings/types';

const BASE = 'https://raw.githubusercontent.com/lichess-org/chess-openings/master';

async function loadTsv(letter: string, dir: string | undefined): Promise<string> {
  if (dir) return readFileSync(path.join(dir, `${letter}.tsv`), 'utf8');
  const res = await fetch(`${BASE}/${letter}.tsv`);
  if (!res.ok) throw new Error(`Download of ${letter}.tsv failed: HTTP ${res.status}`);
  return res.text();
}

const epd = (fen: string): string => fen.split(' ').slice(0, 4).join(' ');

async function main(): Promise<void> {
  const dir = process.argv[2];
  const rows: { eco: string; name: string; pgn: string }[] = [];
  for (const l of ['a', 'b', 'c', 'd', 'e']) {
    for (const line of (await loadTsv(l, dir)).split('\n').slice(1)) {
      const [eco, name, pgn] = line.split('\t');
      if (eco && name && pgn) rows.push({ eco, name, pgn: pgn.trim() });
    }
  }
  const families = [...new Set(rows.map((r) => r.name.split(':')[0]?.trim() ?? r.name))].sort((a, b) => a.localeCompare(b));
  const famIdx = new Map(families.map((f, i) => [f, i]));
  const names: [string, string, number, number][] = [];
  const positions = new Map<string, { n?: number; x: Map<string, { f: Set<number>; c: number }> }>();

  for (const r of rows) {
    const fam = famIdx.get(r.name.split(':')[0]?.trim() ?? r.name) ?? 0;
    const chess = new Chess();
    const sans = r.pgn.replace(/\d+\.(\.\.)?/g, ' ').split(/\s+/).filter(Boolean);
    const nameIdx = names.push([r.eco, r.name, fam, sans.length]) - 1;
    for (const san of sans) {
      const key = epd(chess.fen());
      const m = chess.move(san);
      const node = positions.get(key) ?? { x: new Map<string, { f: Set<number>; c: number }>() };
      const uci = `${m.from}${m.to}${m.promotion ?? ''}`;
      const e = node.x.get(uci) ?? { f: new Set<number>(), c: 0 };
      e.f.add(fam);
      e.c += 1;
      node.x.set(uci, e);
      positions.set(key, node);
    }
    const endKey = epd(chess.fen());
    const end = positions.get(endKey) ?? { x: new Map<string, { f: Set<number>; c: number }>() };
    // Several names can end on one position (transpositions): keep the longest line.
    if (end.n === undefined || (names[end.n]?.[3] ?? 0) < sans.length) end.n = nameIdx;
    positions.set(endKey, end);
  }

  const out: OpeningsData = {
    families,
    names,
    positions: Object.fromEntries(
      [...positions].map(([k, v]): [string, BookNode] => [
        k,
        { ...(v.n !== undefined ? { n: v.n } : {}), x: Object.fromEntries([...v.x].map(([u, e]) => [u, { f: [...e.f].sort((a, b) => a - b), c: e.c }])) },
      ]),
    ),
  };
  const file = new URL('../openings/openings.json', import.meta.url);
  writeFileSync(file, JSON.stringify(out));
  console.log(`${rows.length} lines, ${families.length} families, ${positions.size} positions -> openings/openings.json (${Math.round(statSync(file).size / 1024)} KB)`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});

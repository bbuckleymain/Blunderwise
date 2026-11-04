import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { EngineManager, findMaiaWeights } from '../main/engineManager';
import { UciEngine } from '../main/uciEngine';
import type { Settings } from '../shared/api';

const require = createRequire(import.meta.url);
const sfJs = path.join(path.dirname(require.resolve('stockfish/package.json')), 'src', 'stockfish-17.1-lite-single-03e3232.js');

const dir = mkdtempSync(path.join(tmpdir(), 'cc-engines-'));
const weights = path.join(dir, 'weights');
mkdirSync(weights);
for (const r of [1100, 1500, 1900]) writeFileSync(path.join(weights, `maia-${r}.pb.gz`), '');
writeFileSync(path.join(weights, 'notes.txt'), '');

// A fake lc0: speaks just enough UCI and records how it was launched and searched.
const log = path.join(dir, 'fake-lc0.log');
const fakeLc0 = path.join(dir, 'lc0');
writeFileSync(
  fakeLc0,
  `#!${process.execPath}
const fs = require('fs');
fs.appendFileSync(${JSON.stringify(log)}, 'args ' + process.argv.slice(2).join(' ') + '\\n');
require('readline').createInterface({ input: process.stdin }).on('line', (l) => {
  fs.appendFileSync(${JSON.stringify(log)}, l + '\\n');
  if (l === 'uci') console.log('id name FakeLc0\\nuciok');
  else if (l === 'isready') console.log('readyok');
  else if (l.startsWith('go')) console.log('info depth 1 score cp 12 nodes 1 pv e7e5\\nbestmove e7e5');
  else if (l === 'quit') process.exit(0);
});
`,
);
chmodSync(fakeLc0, 0o755);

const settings: Settings = {
  stopOn: 'blunder',
  botMovetimeMs: 100,
  analysisDepth: 10,
  llmProvider: 'gemini',
  geminiModel: 'x',
  openrouterModel: 'openrouter/free',
  stockfishPath: '',
  lc0Path: fakeLc0,
  maiaWeightsDir: weights,
  lichessUsername: '',
  chesscomUsername: '',
  openingVariety: true,
  boardTheme: 'brown',
  sounds: true,
};

const engines: { dispose(): void }[] = [];
afterAll(() => engines.forEach((e) => e.dispose()));

describe('Maia weights discovery', () => {
  it('finds maia-XXXX.pb.gz files sorted by rating', () => {
    expect([...findMaiaWeights(weights).keys()]).toEqual([1100, 1500, 1900]);
  });
  it('returns nothing for a missing folder', () => {
    expect(findMaiaWeights(path.join(dir, 'nope')).size).toBe(0);
  });
});

describe('EngineManager + Maia', () => {
  it('launches lc0 with the right weights and plays with nodes 1', async () => {
    const m = new EngineManager(() => settings, dir);
    engines.push(m);
    const r = await m.maiaEngine(1500).getBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', { nodes: 1 });
    expect(r.bestMove).toBe('e7e5');
    const text = readFileSync(log, 'utf8');
    expect(text).toContain(`--weights=${path.join(weights, 'maia-1500.pb.gz')}`);
    expect(text).toContain('go nodes 1');
  });
  it('reports missing ratings clearly', () => {
    const m = new EngineManager(() => settings, dir);
    engines.push(m);
    expect(() => m.maiaEngine(1300)).toThrow(/No Maia weights for 1300/);
  });
});

describe('UciEngine (real Stockfish, WASM build)', () => {
  const sf = new UciEngine({ name: 'sf-test', path: process.execPath, args: [sfJs] });
  engines.push(sf);

  it('evaluates a mate in one', async () => {
    const r = await sf.evaluate('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', 8);
    expect(r.bestMove).toBe('h5f7');
    expect(r.mate).toBe(1);
  }, 30000);

  it('a weak-skill search does not leave the engine weakened for later analysis', async () => {
    await sf.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', { skill: 0, movetimeMs: 50 });
    for (let i = 0; i < 3; i++) {
      const r = await sf.evaluate('6k1/5ppp/8/8/2r5/8/3K1PPP/2R5 w - - 0 1', 8);
      expect(r.bestMove).toBe('c1c4'); // free rook: full strength finds it every time
    }
  }, 60000);

  it('serialises concurrent searches and applies skill level', async () => {
    const [a, b] = await Promise.all([
      sf.getBestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', { skill: 0, movetimeMs: 100 }),
      sf.evaluate('6k1/5ppp/8/8/2r5/8/3K1PPP/2R5 w - - 0 1', 8),
    ]);
    expect(a.bestMove).toMatch(/^[a-h][1-8][a-h][1-8]$/);
    expect(b.bestMove).toBe('c1c4');
  }, 30000);
});

describe('lc0 inside Flatpak', () => {
  const s = { ...settings, lc0Path: '' };
  it('runs the host lc0 through flatpak-spawn when only /run/host has it', async () => {
    const { resolveLc0Launch } = await import('../main/engineManager');
    const l = resolveLc0Launch(s, true, (p) => p === '/run/host/usr/bin/lc0');
    expect(l).toEqual({ path: 'flatpak-spawn', args: ['--host', '/usr/bin/lc0'], display: '/usr/bin/lc0 (host)' });
  });
  it('outside Flatpak uses the binary directly', async () => {
    const { resolveLc0Launch } = await import('../main/engineManager');
    expect(resolveLc0Launch(s, false, (p) => p === '/usr/bin/lc0')?.path).toBe('/usr/bin/lc0');
  });
  it('reports nothing when lc0 is not installed', async () => {
    const { resolveLc0Launch } = await import('../main/engineManager');
    expect(resolveLc0Launch(s, true, () => false)).toBeNull();
  });
});

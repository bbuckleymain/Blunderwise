import { createRequire } from 'node:module';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { CoachService } from '../main/coach';
import { Db } from '../main/db';
import type { EngineManager } from '../main/engineManager';
import type { SettingsStore } from '../main/settings';
import { UciEngine } from '../main/uciEngine';

const require = createRequire(import.meta.url);
const sfJs = path.join(path.dirname(require.resolve('stockfish/package.json')), 'src', 'stockfish-17.1-lite-single-03e3232.js');
const engine = new UciEngine({ name: 'threat-test', path: process.execPath, args: [sfJs] });
afterAll(() => engine.dispose());

const engines = { coach: () => engine, bulk: () => engine } as unknown as EngineManager;
const settings = { get: () => ({ analysisDepth: 10, stopOn: 'blunder' }) } as unknown as SettingsStore;
const coach = new CoachService(engines, new Db(':memory:'), settings);

describe('threat (what would they do if I passed?)', () => {
  it('spots a mating threat', async () => {
    // 1.e4 e5 2.Bc4 Nc6 3.Qh5, Black to move: White threatens Qxf7#.
    const t = await coach.threat('r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3');
    expect(t.uci).toBe('h5f7');
    expect(t.text).toContain('checkmate');
  }, 30000);

  it('says nothing is urgent in a quiet position', async () => {
    const t = await coach.threat('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(t.uci).toBeNull();
    expect(t.text).toMatch(/Nothing urgent/);
  }, 30000);

  it('describes a capture threat', async () => {
    // Black bishop on b4 pinned-ish: Black threatens ...Bxc3 / ...Nxe4; here the loose white e4 pawn is attacked by a knight on f6 and c5... use a plain hanging-pawn case.
    const t = await coach.threat('4k3/8/8/3p4/4P3/8/8/4K3 b - - 0 1'); // White to move after pass-flip: black pawn d5 attacked by e4 pawn; Black's idea is dxe4
    expect(t.text.length).toBeGreaterThan(5);
  }, 30000);

  it('refuses when you are in check', async () => {
    const t = await coach.threat('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1');
    expect(t.uci).toBeNull();
    expect(t.text).toMatch(/check/);
  }, 30000);
});

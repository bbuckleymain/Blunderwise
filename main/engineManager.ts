import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { EngineStatus } from '../shared/api';
import type { Settings } from '../shared/api';
import { UciEngine } from './uciEngine';

const STOCKFISH_CANDIDATES = ['/usr/bin/stockfish', '/usr/local/bin/stockfish', '/usr/games/stockfish'];
const LC0_CANDIDATES = ['/usr/bin/lc0', '/usr/local/bin/lc0'];

function firstExisting(paths: readonly string[]): string | null {
  for (const p of paths) if (p && existsSync(p)) return p;
  return null;
}

function inPath(bin: string): string | null {
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    const p = path.join(dir, bin);
    if (dir && existsSync(p)) return p;
  }
  return null;
}

export function resolveStockfish(settings: Settings, resourcesDir: string): string | null {
  return firstExisting([
    settings.stockfishPath,
    process.env.STOCKFISH_PATH ?? '',
    ...STOCKFISH_CANDIDATES,
    inPath('stockfish') ?? '',
    path.join(resourcesDir, 'engines', 'stockfish'),
  ]);
}

export function resolveLc0(settings: Settings): string | null {
  return firstExisting([settings.lc0Path, process.env.LC0_PATH ?? '', ...LC0_CANDIDATES, inPath('lc0') ?? '']);
}

/** Maia weight files are named like maia-1100.pb.gz; returns rating -> file. */
export function findMaiaWeights(dir: string): Map<number, string> {
  const out = new Map<number, string>();
  if (!dir || !existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const m = /^maia-(\d{4})\.pb(\.gz)?$/.exec(f);
    if (m?.[1]) out.set(Number(m[1]), path.join(dir, f));
  }
  return new Map([...out].sort((a, b) => a[0] - b[0]));
}

/**
 * Owns the engine processes: one Stockfish for the coach (analysis), one for the opponent,
 * and one lc0 per Maia rating in use (created lazily).
 */
export class EngineManager {
  private coachEngine: UciEngine | null = null;
  private opponentEngine: UciEngine | null = null;
  private readonly maia = new Map<number, UciEngine>();
  private stockfishPath: string | null = null;
  private stockfishError: string | null = null;

  constructor(
    private readonly getSettings: () => Settings,
    private readonly resourcesDir: string,
  ) {}

  private startStockfish(name: string, threads: string): UciEngine | null {
    this.stockfishPath = resolveStockfish(this.getSettings(), this.resourcesDir);
    if (!this.stockfishPath) {
      this.stockfishError = 'Stockfish not found. Install it with: sudo pacman -S stockfish';
      return null;
    }
    this.stockfishError = null;
    return new UciEngine({ name, path: this.stockfishPath, options: { Threads: threads, Hash: '64' } });
  }

  coach(): UciEngine {
    if (!this.coachEngine || !this.coachEngine.alive) this.coachEngine = this.startStockfish('stockfish-coach', '2');
    if (!this.coachEngine) throw new Error(this.stockfishError ?? 'Stockfish unavailable');
    return this.coachEngine;
  }

  opponent(): UciEngine {
    if (!this.opponentEngine || !this.opponentEngine.alive) this.opponentEngine = this.startStockfish('stockfish-opponent', '1');
    if (!this.opponentEngine) throw new Error(this.stockfishError ?? 'Stockfish unavailable');
    return this.opponentEngine;
  }

  maiaEngine(rating: number): UciEngine {
    const existing = this.maia.get(rating);
    if (existing?.alive) return existing;
    const s = this.getSettings();
    const lc0 = resolveLc0(s);
    if (!lc0) throw new Error('lc0 not found. Install lc0 (AUR: lc0) or set its path in Settings.');
    const weights = findMaiaWeights(s.maiaWeightsDir).get(rating);
    if (!weights) throw new Error(`No Maia weights for ${rating} in ${s.maiaWeightsDir || '(no folder set)'}`);
    const e = new UciEngine({ name: `maia-${rating}`, path: lc0, args: [`--weights=${weights}`], options: { Threads: '1' } });
    this.maia.set(rating, e);
    return e;
  }

  async status(): Promise<EngineStatus> {
    let sfOk = false;
    let sfErr: string | null = null;
    try {
      await this.coach().whenReady();
      sfOk = true;
    } catch (e) {
      sfErr = e instanceof Error ? e.message : String(e);
    }
    const s = this.getSettings();
    const lc0 = resolveLc0(s);
    const ratings = [...findMaiaWeights(s.maiaWeightsDir).keys()];
    let maiaErr: string | null = null;
    if (!lc0) maiaErr = 'lc0 not found';
    else if (ratings.length === 0) maiaErr = 'No Maia weight files (maia-XXXX.pb.gz) in the weights folder';
    return {
      stockfish: { ok: sfOk, path: this.stockfishPath, error: sfErr },
      maia: { ok: maiaErr === null, lc0Path: lc0, ratings, error: maiaErr },
    };
  }

  restart(): void {
    this.dispose();
  }

  dispose(): void {
    this.coachEngine?.dispose();
    this.opponentEngine?.dispose();
    for (const e of this.maia.values()) e.dispose();
    this.coachEngine = null;
    this.opponentEngine = null;
    this.maia.clear();
  }
}

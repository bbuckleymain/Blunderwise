/**
 * DEV-ONLY: a tiny UCI driver around the WASM Stockfish from the `stockfish` npm package.
 * Used to generate and verify fixtures. The app itself never imports this.
 */
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { Score } from '../analysis/score';

const require = createRequire(import.meta.url);

export interface SearchResult {
  readonly score: Score; // side-to-move point of view
  readonly pv: string[];
  readonly bestMove: string | null;
}

export class DevEngine {
  private readonly proc: ChildProcessWithoutNullStreams;
  private buffer = '';
  private waiters: { test: (line: string) => boolean; resolve: (line: string) => void }[] = [];
  private listeners: ((line: string) => void)[] = [];

  constructor() {
    const pkg = path.dirname(require.resolve('stockfish/package.json'));
    const script = path.join(pkg, 'src', 'stockfish-17.1-lite-single-03e3232.js');
    this.proc = spawn(process.execPath, [script], { stdio: 'pipe' });
    this.proc.stdout.setEncoding('utf8');
    this.proc.stdout.on('data', (chunk: string) => {
      this.buffer += chunk;
      let idx;
      while ((idx = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, idx).trim();
        this.buffer = this.buffer.slice(idx + 1);
        for (const l of this.listeners) l(line);
        this.waiters = this.waiters.filter((w) => {
          if (w.test(line)) {
            w.resolve(line);
            return false;
          }
          return true;
        });
      }
    });
  }

  private send(cmd: string): void {
    this.proc.stdin.write(`${cmd}\n`);
  }

  private waitFor(test: (line: string) => boolean): Promise<string> {
    return new Promise((resolve) => this.waiters.push({ test, resolve }));
  }

  async init(): Promise<void> {
    this.send('uci');
    await this.waitFor((l) => l === 'uciok');
    this.send('setoption name Hash value 64');
    this.send('isready');
    await this.waitFor((l) => l === 'readyok');
  }

  async search(fen: string, depth: number): Promise<SearchResult> {
    this.send('ucinewgame');
    this.send(`position fen ${fen}`);
    let score: Score = { cp: 0, mate: null };
    let pv: string[] = [];
    const onLine = (line: string): void => {
      if (!line.startsWith('info') || !line.includes(' pv ')) return;
      if (line.includes('multipv') && !line.includes('multipv 1 ')) return;
      const cp = / score cp (-?\d+)/.exec(line);
      const mate = / score mate (-?\d+)/.exec(line);
      if (cp?.[1]) score = { cp: Number(cp[1]), mate: null };
      else if (mate?.[1]) score = { cp: null, mate: Number(mate[1]) };
      pv = (line.split(' pv ')[1] ?? '').trim().split(/\s+/);
    };
    this.listeners.push(onLine);
    this.send(`go depth ${depth}`);
    const done = await this.waitFor((l) => l.startsWith('bestmove'));
    this.listeners = this.listeners.filter((l) => l !== onLine);
    const bm = done.split(/\s+/)[1];
    return { score, pv, bestMove: bm && bm !== '(none)' ? bm : null };
  }

  quit(): void {
    this.send('quit');
    this.proc.kill();
  }
}

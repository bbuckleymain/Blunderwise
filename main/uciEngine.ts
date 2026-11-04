import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import type { BestMoveOptions, Engine, EngineEval } from '../engine/types';
import { goCommand, parseBestMove, parseInfo } from '../engine/uci';

export interface UciEngineOptions {
  readonly name: string;
  readonly path: string;
  readonly args?: readonly string[];
  /** Options sent once after `uci`, e.g. { Threads: '2', Hash: '128' }. */
  readonly options?: Readonly<Record<string, string>>;
  /** Max time for one search before we give up (ms). */
  readonly searchTimeoutMs?: number;
}

/** A native UCI engine over stdio. Searches are serialised: one at a time, in call order. */
export class UciEngine implements Engine {
  readonly name: string;
  private readonly proc: ChildProcessWithoutNullStreams;
  private readonly listeners = new Set<(line: string) => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private readonly ready: Promise<void>;
  private readonly sentOptions = new Map<string, string>();
  private dead: Error | null = null;
  private readonly timeoutMs: number;

  constructor(opts: UciEngineOptions) {
    this.name = opts.name;
    this.timeoutMs = opts.searchTimeoutMs ?? 60000;
    this.proc = spawn(opts.path, [...(opts.args ?? [])], { stdio: 'pipe' });
    this.proc.on('error', (e) => this.fail(e));
    this.proc.on('exit', (code) => this.fail(new Error(`${opts.name} exited with code ${code ?? 'null'}`)));
    createInterface({ input: this.proc.stdout }).on('line', (line) => {
      for (const l of [...this.listeners]) l(line.trim());
    });
    this.proc.stderr.resume();
    this.ready = (async () => {
      this.send('uci');
      await this.waitFor((l) => l === 'uciok', 10000);
      for (const [k, v] of Object.entries(opts.options ?? {})) this.setOption(k, v);
      await this.sync();
    })();
  }

  private fail(e: Error): void {
    if (!this.dead) this.dead = e;
    for (const l of [...this.listeners]) l('__dead__');
  }

  get alive(): boolean {
    return this.dead === null;
  }

  async whenReady(): Promise<void> {
    await this.ready;
  }

  private send(cmd: string): void {
    if (this.dead) throw this.dead;
    this.proc.stdin.write(`${cmd}\n`);
  }

  private setOption(name: string, value: string): void {
    if (this.sentOptions.get(name) === value) return;
    this.send(`setoption name ${name} value ${value}`);
    this.sentOptions.set(name, value);
  }

  private waitFor(test: (line: string) => boolean, timeoutMs: number, onLine?: (line: string) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(`${this.name}: timed out`));
      }, timeoutMs);
      const listener = (line: string): void => {
        if (line === '__dead__') {
          clearTimeout(timer);
          this.listeners.delete(listener);
          reject(this.dead ?? new Error(`${this.name} died`));
          return;
        }
        onLine?.(line);
        if (test(line)) {
          clearTimeout(timer);
          this.listeners.delete(listener);
          resolve(line);
        }
      };
      this.listeners.add(listener);
    });
  }

  private async sync(): Promise<void> {
    this.send('isready');
    await this.waitFor((l) => l === 'readyok', 10000);
  }

  private run<T>(job: () => Promise<T>): Promise<T> {
    const next = this.queue.then(job, job);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private search(fen: string, go: string, options: Record<string, string>): Promise<EngineEval> {
    return this.run(async () => {
      await this.ready;
      // "Skill Level" sticks to the engine once set: restore full strength for any search that does not ask for a skill.
      const wanted = { ...options };
      if (!('Skill Level' in wanted) && this.sentOptions.has('Skill Level')) wanted['Skill Level'] = '20';
      for (const [k, v] of Object.entries(wanted)) this.setOption(k, v);
      this.send(`position fen ${fen}`);
      await this.sync();
      let cp: number | null = 0;
      let mate: number | null = null;
      let pv: string[] = [];
      const onLine = (line: string): void => {
        const info = parseInfo(line);
        if (!info || info.multipv !== 1) return;
        cp = info.cp;
        mate = info.mate;
        if (info.pv.length > 0) pv = info.pv;
      };
      this.send(go);
      const done = await this.waitFor((l) => parseBestMove(l) !== undefined, this.timeoutMs, onLine);
      const bestMove = parseBestMove(done) ?? null;
      return { cp: mate === null ? cp : null, mate, pv, bestMove };
    });
  }

  evaluate(fen: string, depth: number): Promise<EngineEval> {
    return this.search(fen, goCommand({ depth }), {});
  }

  getBestMove(fen: string, opts: BestMoveOptions): Promise<EngineEval> {
    const options: Record<string, string> = {};
    if (opts.skill !== undefined) options['Skill Level'] = String(Math.max(0, Math.min(20, Math.round(opts.skill))));
    return this.search(fen, goCommand(opts), options);
  }

  dispose(): void {
    try {
      this.send('quit');
    } catch {
      // already gone
    }
    setTimeout(() => this.proc.kill(), 300);
  }
}

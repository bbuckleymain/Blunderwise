/** Pure UCI protocol helpers (no I/O), shared by every UCI engine. */

export interface UciInfo {
  readonly depth: number | null;
  readonly multipv: number;
  readonly cp: number | null;
  readonly mate: number | null;
  readonly pv: string[];
}

export function parseInfo(line: string): UciInfo | null {
  if (!line.startsWith('info ')) return null;
  const t = line.split(/\s+/);
  let depth: number | null = null;
  let multipv = 1;
  let cp: number | null = null;
  let mate: number | null = null;
  let pv: string[] = [];
  for (let i = 1; i < t.length; i++) {
    const k = t[i];
    if (k === 'depth') depth = Number(t[++i]);
    else if (k === 'multipv') multipv = Number(t[++i]);
    else if (k === 'score') {
      const kind = t[++i];
      const v = Number(t[++i]);
      if (kind === 'cp') cp = v;
      else if (kind === 'mate') mate = v;
      if (t[i + 1] === 'lowerbound' || t[i + 1] === 'upperbound') i++;
    } else if (k === 'pv') {
      pv = t.slice(i + 1).filter(Boolean);
      break;
    } else if (k === 'string') break;
  }
  if (cp === null && mate === null) return null;
  return { depth, multipv, cp, mate, pv };
}

export function parseBestMove(line: string): string | null | undefined {
  if (!line.startsWith('bestmove')) return undefined;
  const mv = line.split(/\s+/)[1];
  return mv && mv !== '(none)' && mv !== '0000' ? mv : null;
}

export function goCommand(opts: { depth?: number; movetimeMs?: number; nodes?: number }): string {
  if (opts.nodes !== undefined) return `go nodes ${opts.nodes}`;
  if (opts.depth !== undefined) return `go depth ${opts.depth}`;
  return `go movetime ${opts.movetimeMs ?? 500}`;
}

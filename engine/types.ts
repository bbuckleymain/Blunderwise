/** One engine answer. Scores are from the side to move's point of view. */
export interface EngineEval {
  readonly cp: number | null;
  readonly mate: number | null;
  readonly pv: readonly string[];
  readonly bestMove: string | null;
}

export interface BestMoveOptions {
  /** Stockfish "Skill Level" 0-20. Ignored by engines that do not support it. */
  readonly skill?: number;
  readonly movetimeMs?: number;
  readonly depth?: number;
  /** lc0/Maia: search exactly this many nodes (1 = pure policy, most human-like). */
  readonly nodes?: number;
}

export interface Engine {
  readonly name: string;
  evaluate(fen: string, depth: number): Promise<EngineEval>;
  getBestMove(fen: string, opts: BestMoveOptions): Promise<EngineEval>;
  dispose(): void;
}

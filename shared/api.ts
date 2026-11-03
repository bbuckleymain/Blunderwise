/** The typed bridge between renderer and main. Types only: safe to import from both sides. */
import type { Color, ExplainResult, MistakeContext } from '../explain/types';
import type { MoveClass } from '../analysis/classify';

export type OpponentKind = 'stockfish' | 'maia';

export interface EngineStatus {
  readonly stockfish: { readonly ok: boolean; readonly path: string | null; readonly error: string | null };
  readonly maia: { readonly ok: boolean; readonly lc0Path: string | null; readonly ratings: readonly number[]; readonly error: string | null };
}

export interface BotMoveRequest {
  readonly fen: string;
  readonly opponent: OpponentKind;
  /** Stockfish skill 0-20 */
  readonly skill: number;
  /** Maia rating, e.g. 1100..1900 */
  readonly maiaRating: number;
  readonly movetimeMs: number;
}

export interface MoveCheckRequest {
  readonly fenBefore: string;
  readonly moveUci: string;
  readonly myColor: Color;
}

export interface MoveCheck {
  readonly moveUci: string;
  readonly san: string;
  readonly classification: MoveClass;
  readonly winProbBefore: number;
  readonly winProbAfter: number;
  readonly bestMoveUci: string | null;
  readonly bestMoveSan: string | null;
  /** True when the coach should stop the game (per the stop-on setting). */
  readonly stop: boolean;
  /** Present for inaccuracies, mistakes and blunders (not for good or already-decided moves). */
  readonly ctx: MistakeContext | null;
  /** Instant template explanation for ctx, so the card can show something immediately. */
  readonly instant: ExplainResult | null;
}

export interface GameRecord {
  readonly id: number;
  readonly createdAt: string;
  readonly myColor: Color;
  readonly opponent: string;
  readonly result: string;
  readonly pgn: string;
}

export interface SaveGameRequest {
  readonly myColor: Color;
  readonly opponent: string;
  readonly result: string;
  readonly pgn: string;
}

export interface ReviewedMove {
  readonly ply: number;
  readonly fenBefore: string;
  readonly fenAfter: string;
  readonly san: string;
  readonly uci: string;
  readonly mine: boolean;
  readonly check: MoveCheck | null;
}

export interface ReviewProgress {
  readonly done: number;
  readonly total: number;
}

export type StopOn = 'blunder' | 'mistake';
export type LlmProvider = 'gemini' | 'openrouter';

export interface Settings {
  readonly stopOn: StopOn;
  readonly botMovetimeMs: number;
  readonly analysisDepth: number;
  readonly llmProvider: LlmProvider;
  readonly geminiModel: string;
  readonly openrouterModel: string;
  readonly stockfishPath: string;
  readonly lc0Path: string;
  readonly maiaWeightsDir: string;
}

export interface KeyStatus {
  readonly hasKey: boolean;
  /** 'basic_text' etc: plain-text storage when no keyring is available. */
  readonly storageBackend: string;
  readonly encrypted: boolean;
}

export interface CoachApi {
  engine: {
    status(): Promise<EngineStatus>;
    restart(): Promise<EngineStatus>;
    botMove(req: BotMoveRequest): Promise<string | null>;
  };
  coach: {
    prefetch(fen: string): Promise<void>;
    checkMove(req: MoveCheckRequest): Promise<MoveCheck>;
    narrate(ctx: MistakeContext): Promise<ExplainResult>;
  };
  games: {
    save(req: SaveGameRequest): Promise<number>;
    list(): Promise<GameRecord[]>;
    get(id: number): Promise<GameRecord | null>;
  };
  review: {
    analyze(pgn: string, myColor: Color): Promise<ReviewedMove[]>;
    onProgress(cb: (p: ReviewProgress) => void): () => void;
  };
  settings: {
    get(): Promise<Settings>;
    set(patch: Partial<Settings>): Promise<Settings>;
    keyStatus(provider: LlmProvider): Promise<KeyStatus>;
    setApiKey(provider: LlmProvider, key: string | null): Promise<KeyStatus>;
    testApiKey(): Promise<{ ok: boolean; message: string }>;
  };
}

export const IPC = {
  engineStatus: 'engine:status',
  engineRestart: 'engine:restart',
  botMove: 'engine:botMove',
  prefetch: 'coach:prefetch',
  checkMove: 'coach:checkMove',
  narrate: 'coach:narrate',
  gamesSave: 'games:save',
  gamesList: 'games:list',
  gamesGet: 'games:get',
  reviewAnalyze: 'review:analyze',
  reviewProgress: 'review:progress',
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  keyStatus: 'settings:keyStatus',
  setApiKey: 'settings:setApiKey',
  testApiKey: 'settings:testApiKey',
} as const;

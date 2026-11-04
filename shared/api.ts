/** The typed bridge between renderer and main. Types only: safe to import from both sides. */
import type { Color, ExplainResult, Explanation, GamePhase, MistakeContext, MotifSide, MotifTag } from '../explain/types';
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
  /** Stockfish only: play random book moves in the opening so games vary. */
  readonly useBook: boolean;
  /** Steer book moves into this opening family (e.g. "Sicilian Defense"); null = any. */
  readonly bookFamily: string | null;
}

export interface OpeningInfo {
  readonly eco: string;
  readonly name: string;
  readonly family: string;
}

export interface OpeningTrackInfo {
  readonly opening: OpeningInfo | null;
  readonly bookPlies: number;
  readonly leftBook: boolean;
}

/** One row of the opening report: how you do with one opening family, per colour. */
export interface OpeningReportRow {
  readonly family: string;
  readonly color: Color;
  readonly games: number;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  /** Average number of plies you stayed in book. */
  readonly avgBookPlies: number;
  readonly analysedGames: number;
  /** Mistakes and blunders you made in the opening phase of these games. */
  readonly openingMistakes: number;
  readonly drills: number;
}

export interface ThreatInfo {
  /** The opponent's strongest idea if you did nothing (UCI), or null when there is nothing urgent. */
  readonly uci: string | null;
  readonly san: string | null;
  readonly text: string;
}

export interface DrillFilter {
  readonly tag?: MotifTag | null;
  /** Only opening-phase drills from games with this opening family. */
  readonly opening?: string | null;
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
  /** The position after this move is known opening theory (and the move was not a serious error). */
  readonly book: boolean;
  /** Present for inaccuracies, mistakes and blunders (not for good or already-decided moves). */
  readonly ctx: MistakeContext | null;
  /** Instant template explanation for ctx, so the card can show something immediately. */
  readonly instant: ExplainResult | null;
}

export type GameSource = 'bot' | 'lichess' | 'chesscom';

export interface GameRecord {
  readonly id: number;
  readonly source: GameSource;
  readonly analyzed: boolean;
  readonly createdAt: string;
  readonly myColor: Color;
  readonly opponent: string;
  readonly result: string;
  readonly pgn: string;
  readonly opening: string | null;
  readonly openingFamily: string | null;
  readonly bookPlies: number;
}

/** Your results against one of the app's own opponents. */
export interface OpponentRecordRow {
  readonly opponent: string;
  readonly games: number;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly lastPlayed: string;
}

export interface BackupGame {
  readonly uid: string;
  readonly createdAt: string;
  readonly myColor: Color;
  readonly opponent: string;
  readonly result: string;
  readonly pgn: string;
  readonly source: string;
  readonly externalId: string | null;
}

export interface BackupDrill {
  readonly gameUid: string | null;
  readonly fen: string;
  readonly myColor: Color;
  readonly playedUci: string;
  readonly playedSan: string;
  readonly bestUci: string;
  readonly bestSan: string;
  readonly classification: string;
  readonly tags: readonly string[];
  readonly opening: string | null;
  readonly phase: string | null;
  readonly createdAt: number;
  readonly dueAt: number;
  readonly intervalDays: number;
  readonly ease: number;
  readonly reps: number;
  readonly lapses: number;
}

/** A portable backup of your games and drills, independent of the app version. */
export interface BackupFile {
  readonly format: 'blunderwise-backup';
  readonly version: 1;
  readonly exportedAt: string;
  readonly games: readonly BackupGame[];
  readonly drills: readonly BackupDrill[];
}

export interface BackupFileInfo {
  readonly name: string;
  readonly bytes: number;
  readonly at: string;
}

export interface DataInfo {
  readonly folder: string;
  readonly databaseBytes: number;
  readonly games: number;
  readonly drills: number;
  readonly backups: readonly BackupFileInfo[];
}

export interface ImportBackupResult {
  readonly games: number;
  readonly drills: number;
  /** Games that were already in your library. */
  readonly skipped: number;
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

/** One stored mistake (inaccuracy or worse) from an analysed game. */
export interface MistakeRow {
  readonly ply: number;
  readonly fen: string;
  readonly playedUci: string;
  readonly playedSan: string;
  readonly bestUci: string;
  readonly bestSan: string;
  readonly classification: MoveClass;
  readonly phase: GamePhase;
  readonly tags: readonly MotifTag[];
  readonly sides: readonly MotifSide[];
  readonly winBefore: number;
  readonly winAfter: number;
}

export interface DrillRecord {
  readonly id: number;
  readonly fen: string;
  readonly myColor: Color;
  readonly playedUci: string;
  readonly playedSan: string;
  readonly bestUci: string;
  readonly bestSan: string;
  readonly classification: string;
  readonly tags: readonly MotifTag[];
  readonly gameId: number | null;
  readonly opening: string | null;
  readonly phase: string | null;
  readonly dueAt: number;
  readonly intervalDays: number;
  readonly ease: number;
  readonly reps: number;
  readonly lapses: number;
}

export interface DrillAnswer {
  readonly correct: boolean;
  /** The engine's verdict on the move you tried (with an explanation context when it was a mistake). */
  readonly check: MoveCheck;
  readonly nextDueAt: number;
}

export interface DrillCounts {
  readonly total: number;
  readonly due: number;
  readonly nextDueAt: number | null;
}

export interface ReportData {
  readonly gamesAnalyzed: number;
  readonly myMoves: number;
  readonly byClassification: { readonly inaccuracy: number; readonly mistake: number; readonly blunder: number };
  /** Mistakes and blunders per motif. allowed = opponent's tactic you allowed; missed = your tactic you missed. */
  readonly byTag: readonly { readonly tag: MotifTag; readonly count: number; readonly allowed: number; readonly missed: number; readonly blunders: number }[];
  readonly byPhase: readonly { readonly phase: string; readonly count: number; readonly blunders: number }[];
}

export interface LibraryProgress {
  readonly game: number;
  readonly games: number;
  readonly move: number;
  readonly moves: number;
}

export interface ImportResult {
  readonly fetched: number;
  readonly added: number;
}

export type StopOn = 'blunder' | 'mistake';
export type LlmProvider = 'gemini' | 'openrouter';
export type BoardTheme = 'brown' | 'green' | 'blue' | 'gray';

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
  readonly lichessUsername: string;
  readonly chesscomUsername: string;
  readonly openingVariety: boolean;
  readonly boardTheme: BoardTheme;
  readonly sounds: boolean;
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
    /** The engine's best move (UCI) in this position, for hints. */
    hint(fen: string): Promise<string | null>;
    /** What would the opponent do if you passed? Never calls the AI. */
    threat(fen: string): Promise<ThreatInfo>;
    /** The coach's AI explanation for this mistake if one is already cached (never calls the AI). */
    cached(ctx: MistakeContext): Promise<Explanation | null>;
  };
  games: {
    save(req: SaveGameRequest): Promise<number>;
    list(): Promise<GameRecord[]>;
    get(id: number): Promise<GameRecord | null>;
    /** Results against each of the app's own bots. */
    record(): Promise<OpponentRecordRow[]>;
  };
  library: {
    importLichess(username: string, max: number): Promise<ImportResult>;
    importChessCom(username: string, max: number): Promise<ImportResult>;
    analyzeAll(): Promise<number>;
    analyzeGame(id: number): Promise<void>;
    onProgress(cb: (p: LibraryProgress) => void): () => void;
    report(): Promise<ReportData>;
  };
  openings: {
    /** `fens[i]` = position after ply i+1 of the game. */
    track(fens: readonly string[]): Promise<OpeningTrackInfo>;
    families(): Promise<string[]>;
    report(): Promise<OpeningReportRow[]>;
  };
  drills: {
    due(filter: DrillFilter, limit: number): Promise<DrillRecord[]>;
    counts(): Promise<DrillCounts>;
    answer(id: number, moveUci: string): Promise<DrillAnswer>;
  };
  review: {
    analyze(pgn: string, myColor: Color): Promise<ReviewedMove[]>;
    onProgress(cb: (p: ReviewProgress) => void): () => void;
  };
  /** Where your games live, backups, and moving them between installs. Dialogs are opened by the main process. */
  data: {
    info(): Promise<DataInfo>;
    backupNow(): Promise<string>;
    /** Save games + drills as a .json backup. null = cancelled. */
    exportBackup(): Promise<{ path: string; games: number; drills: number } | null>;
    /** Save every game as one .pgn file. null = cancelled. */
    exportPgn(): Promise<{ path: string; games: number } | null>;
    /** Merge a .json backup into the library. null = cancelled. */
    importBackup(): Promise<ImportBackupResult | null>;
    openFolder(): Promise<void>;
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
  hint: 'coach:hint',
  threat: 'coach:threat',
  openingTrack: 'openings:track',
  openingFamilies: 'openings:families',
  openingReport: 'openings:report',
  cached: 'coach:cached',
  gamesSave: 'games:save',
  gamesList: 'games:list',
  gamesGet: 'games:get',
  gamesRecord: 'games:record',
  dataInfo: 'data:info',
  dataBackupNow: 'data:backupNow',
  dataExportBackup: 'data:exportBackup',
  dataExportPgn: 'data:exportPgn',
  dataImportBackup: 'data:importBackup',
  dataOpenFolder: 'data:openFolder',
  reviewAnalyze: 'review:analyze',
  reviewProgress: 'review:progress',
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  keyStatus: 'settings:keyStatus',
  setApiKey: 'settings:setApiKey',
  testApiKey: 'settings:testApiKey',
  importLichess: 'library:importLichess',
  importChessCom: 'library:importChessCom',
  analyzeAll: 'library:analyzeAll',
  analyzeGame: 'library:analyzeGame',
  libraryProgress: 'library:progress',
  report: 'library:report',
  drillsDue: 'drills:due',
  drillsCounts: 'drills:counts',
  drillsAnswer: 'drills:answer',
} as const;

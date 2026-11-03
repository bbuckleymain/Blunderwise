import type { Color, PieceSymbol, Square } from 'chess.js';
import type { GamePhase } from '../analysis/gamePhase';
import type { Score } from '../analysis/score';

export type { Color, PieceSymbol, Square, GamePhase, Score };

export type PieceName = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

/** Everything the review step knows about one flagged move. Scores are from MY point of view. */
export interface MistakeContext {
  readonly fen: string;
  readonly movePlayedUci: string;
  readonly bestMoveUci: string;
  readonly evalBefore: Score;
  readonly evalAfter: Score;
  readonly winProbBefore: number;
  readonly winProbAfter: number;
  /** Engine PV from `fen`, starting with the best move (UCI). */
  readonly bestLine: readonly string[];
  /** Engine PV after my move, starting with the opponent's reply (UCI). */
  readonly refutationLine: readonly string[];
  readonly moveNumber: number;
  readonly myColor: Color;
}

export interface PieceRef {
  readonly piece: PieceName;
  readonly square: Square;
  readonly color: Color;
}

export interface MoveFact {
  readonly uci: string;
  readonly san: string;
  readonly piece: PieceName;
  readonly from: Square;
  readonly to: Square;
  readonly captured: PieceName | null;
  readonly promotion: PieceName | null;
  readonly isCheck: boolean;
}

export interface HangingFact {
  readonly piece: PieceRef;
  /** Material (pawn units) the opponent wins by capturing it. */
  readonly loss: number;
}

export type Severity = 'slip' | 'mistake' | 'serious mistake' | 'game-changing blunder';

export interface FactsPacket {
  readonly myColor: Color;
  readonly moveNumber: number;
  readonly phase: GamePhase;
  readonly played: MoveFact;
  readonly best: MoveFact;
  readonly bestLineSan: readonly string[];
  readonly refutationLineSan: readonly string[];
  /** Raw material balance (pawn units, my perspective) before my move. */
  readonly materialBefore: number;
  /** Material balance after the best line, captures settled. */
  readonly materialAfterBestLine: number;
  /** Material balance after the refutation line, captures settled. */
  readonly materialAfterRefutation: number;
  readonly movedPiece: {
    readonly attackedBefore: readonly PieceRef[];
    readonly defendedBefore: readonly PieceRef[];
    readonly attackedAfter: readonly PieceRef[];
    readonly defendedAfter: readonly PieceRef[];
  };
  /** My pieces the opponent can win right after my move. */
  readonly leftHanging: readonly HangingFact[];
  readonly mate: {
    /** I had a forced mate in N before my move. */
    readonly iHadMateIn: number | null;
    /** After my move the opponent has a forced mate in N. */
    readonly theyHaveMateIn: number | null;
  };
  readonly winProbBefore: number;
  readonly winProbAfter: number;
  readonly severity: Severity;
}

export type MotifTag =
  | 'hangingPiece'
  | 'missedCapture'
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discoveredAttack'
  | 'backRankWeakness'
  | 'missedMate'
  | 'allowedMate'
  | 'trappedPiece'
  | 'overloadedDefender'
  | 'missedPromotion'
  | 'kingSafetyBlunder'
  | 'positionalLoss';

export const ALL_MOTIF_TAGS: readonly MotifTag[] = [
  'hangingPiece',
  'missedCapture',
  'fork',
  'pin',
  'skewer',
  'discoveredAttack',
  'backRankWeakness',
  'missedMate',
  'allowedMate',
  'trappedPiece',
  'overloadedDefender',
  'missedPromotion',
  'kingSafetyBlunder',
  'positionalLoss',
];

/** Who gets to use the motif: the opponent (I allowed it) or me (I missed it). */
export type MotifSide = 'opponent' | 'you';

export interface MotifResult {
  readonly tag: MotifTag;
  /** 0..1 */
  readonly confidence: number;
  readonly side: MotifSide;
  readonly squares: readonly Square[];
  readonly pieces: readonly PieceRef[];
  /** Short machine-built statement of what was found; safe to show the narrator. */
  readonly evidence: string;
  /** The key move (SAN) that executes the motif, when there is one. */
  readonly keyMoveSan: string | null;
}

export interface Explanation {
  readonly headline: string;
  readonly explanation: string;
  readonly lesson: string;
  readonly highlightSquares: readonly Square[];
}

export type ExplanationSource = 'llm' | 'template';

export interface ExplainResult {
  readonly facts: FactsPacket;
  readonly tags: readonly MotifResult[];
  readonly explanation: Explanation;
  readonly source: ExplanationSource;
  readonly fromCache: boolean;
  /** Why LLM output was rejected (empty when accepted or not attempted). */
  readonly rejections: readonly string[];
}

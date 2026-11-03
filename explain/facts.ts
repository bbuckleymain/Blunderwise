import { Chess, type Color, type Square } from 'chess.js';
import { gamePhase } from '../analysis/gamePhase';
import {
  Board,
  PIECE_NAME,
  materialBalance,
  other,
  parseUci,
  see,
  settledMaterial,
  toRef,
} from './board';
import { playLine, type LineStep } from './line';
import type { FactsPacket, HangingFact, MistakeContext, MoveFact, PieceRef, Severity } from './types';

/** Plies of each engine line we reason about and show. Longer PVs get noisy. */
export const LINE_PLIES = 8;

/** Everything detectors need, computed once per mistake. */
export interface Analysis {
  readonly ctx: MistakeContext;
  readonly facts: FactsPacket;
  readonly me: Color;
  readonly opp: Color;
  readonly before: Board;
  /** Board right after my move (opponent to move). */
  readonly after: Board;
  readonly fenAfter: string;
  /** Plays from `fenAfter`, starting with the opponent's reply. */
  readonly refutation: readonly LineStep[];
  /** Plays from `ctx.fen`, starting with the best move. */
  readonly best: readonly LineStep[];
  readonly playedStep: LineStep;
}

function moveFact(step: LineStep): MoveFact {
  return {
    uci: step.uci,
    san: step.san,
    piece: PIECE_NAME[step.piece],
    from: step.from,
    to: step.to,
    captured: step.captured ? PIECE_NAME[step.captured] : null,
    promotion: step.promotion ? PIECE_NAME[step.promotion] : null,
    isCheck: step.isCheck,
  };
}

function split(board: Board, targets: readonly Square[], mover: Color): { attacked: PieceRef[]; defended: PieceRef[] } {
  const attacked: PieceRef[] = [];
  const defended: PieceRef[] = [];
  for (const sq of targets) {
    const p = board.get(sq);
    if (!p) continue;
    (p.color === mover ? defended : attacked).push(toRef(p));
  }
  return { attacked, defended };
}

function severityOf(drop: number): Severity {
  if (drop >= 30) return 'game-changing blunder';
  if (drop >= 10) return 'serious mistake';
  if (drop >= 5) return 'mistake';
  return 'slip';
}

function settledAtEnd(startFen: string, steps: readonly LineStep[], me: Color): number {
  const last = steps[steps.length - 1];
  if (!last) return settledMaterial(startFen, me);
  if (last.isMate) return materialBalance(last.boardAfter, me);
  return settledMaterial(last.fenAfter, me);
}

export function analyze(ctx: MistakeContext): Analysis {
  const me = ctx.myColor;
  const opp = other(me);
  const turn = new Chess(ctx.fen).turn();
  if (turn !== me) throw new Error(`FEN side to move (${turn}) is not myColor (${me})`);

  const played = playLine(ctx.fen, [ctx.movePlayedUci]);
  const playedStep = played[0];
  if (!playedStep) throw new Error('Played move missing');
  const fenAfter = playedStep.fenAfter;

  const bestUci = ctx.bestLine[0] === ctx.bestMoveUci ? ctx.bestLine : [ctx.bestMoveUci, ...ctx.bestLine];
  const best = playLine(ctx.fen, bestUci, LINE_PLIES);
  const refutation = playLine(fenAfter, ctx.refutationLine, LINE_PLIES);
  const bestStep = best[0];
  if (!bestStep) throw new Error('Best move missing');

  const before = playedStep.boardBefore;
  const after = playedStep.boardAfter;
  const { from, to } = parseUci(ctx.movePlayedUci);

  const b = split(before, before.attacksFrom(from), me);
  const a = split(after, after.attacksFrom(to), me);

  const leftHanging: HangingFact[] = [];
  for (const p of after.pieces(me)) {
    if (p.type === 'k') continue;
    const loss = see(after, p.square, opp);
    if (loss >= 1) leftHanging.push({ piece: toRef(p), loss });
  }
  leftHanging.sort((x, y) => y.loss - x.loss);

  const drop = ctx.winProbBefore - ctx.winProbAfter;
  const facts: FactsPacket = {
    myColor: me,
    moveNumber: ctx.moveNumber,
    phase: gamePhase(ctx.fen, ctx.moveNumber),
    played: moveFact(playedStep),
    best: moveFact(bestStep),
    bestLineSan: best.map((s) => s.san),
    refutationLineSan: refutation.map((s) => s.san),
    materialBefore: materialBalance(before, me),
    materialAfterBestLine: settledAtEnd(ctx.fen, best, me),
    materialAfterRefutation: settledAtEnd(fenAfter, refutation, me),
    movedPiece: {
      attackedBefore: b.attacked,
      defendedBefore: b.defended,
      attackedAfter: a.attacked,
      defendedAfter: a.defended,
    },
    leftHanging,
    mate: {
      iHadMateIn: ctx.evalBefore.mate !== null && ctx.evalBefore.mate > 0 ? ctx.evalBefore.mate : null,
      theyHaveMateIn: ctx.evalAfter.mate !== null && ctx.evalAfter.mate < 0 ? -ctx.evalAfter.mate : null,
    },
    winProbBefore: ctx.winProbBefore,
    winProbAfter: ctx.winProbAfter,
    severity: severityOf(drop),
  };

  return { ctx, facts, me, opp, before, after, fenAfter, refutation, best, playedStep };
}

/** Convenience: just the facts. */
export function buildFacts(ctx: MistakeContext): FactsPacket {
  return analyze(ctx).facts;
}

import type { Square } from 'chess.js';
import type { Explanation, FactsPacket, MotifResult, PieceName } from '../types';

const LESSONS: Readonly<Record<MotifResult['tag'], string>> = {
  hangingPiece: 'Before every move, check which of your pieces are attacked and whether they are still defended.',
  missedCapture: 'Before every move, check whether your opponent has left a piece you can take for free.',
  fork: 'Look for squares where one enemy piece could attack two of yours at once, and keep your pieces off them.',
  pin: 'Be careful lining up one of your pieces in front of a more valuable one on an open line.',
  skewer: 'Keep your most valuable pieces off the same open line.',
  discoveredAttack: 'When an enemy piece blocks one of their long-range pieces, ask what happens if it moves.',
  backRankWeakness: 'Make an escape square for your king before your back rank runs out of defenders.',
  missedMate: 'Always check every check first: checks can end the game.',
  allowedMate: 'Before every move, look at every check your opponent could give next.',
  trappedPiece: 'Before grabbing material, make sure your piece will still have a safe way back.',
  overloadedDefender: 'If one of your pieces is defending two things, it is defending neither well.',
  missedPromotion: 'When a pawn can reach the last rank, check whether promoting right now wins.',
  kingSafetyBlunder: 'Leave the pawns in front of your king alone unless you have a clear reason.',
  positionalLoss: 'Compare a few candidate moves before you play, not just the first one you see.',
};

function headline(t: MotifResult, facts: FactsPacket): string {
  const pieceOf = (i: number): PieceName | 'piece' => t.pieces[i]?.piece ?? 'piece';
  const mine = t.side === 'opponent';
  switch (t.tag) {
    case 'hangingPiece':
      return `Your ${pieceOf(0)} was left undefended`;
    case 'missedCapture':
      return `You missed a free ${pieceOf(0)}`;
    case 'fork':
      return mine ? `Their ${pieceOf(0)} attacks two pieces at once` : `You missed a ${pieceOf(0)} fork`;
    case 'pin':
      return mine ? `Your ${pieceOf(0)} gets pinned` : 'You missed a winning pin';
    case 'skewer':
      return mine ? `A skewer wins your ${pieceOf(2)}` : 'You missed a winning skewer';
    case 'discoveredAttack':
      return mine ? 'A discovered attack costs you material' : 'You missed a discovered attack';
    case 'backRankWeakness':
      return mine ? 'Your back rank was too weak' : 'Their back rank was weak';
    case 'missedMate':
      return 'You missed checkmate';
    case 'allowedMate':
      return 'This move allows checkmate';
    case 'trappedPiece':
      return `Your ${pieceOf(0)} gets trapped`;
    case 'overloadedDefender':
      return `Your ${pieceOf(0)} had too many jobs`;
    case 'missedPromotion':
      return 'You missed a pawn promotion';
    case 'kingSafetyBlunder':
      return 'This move weakened your king';
    case 'positionalLoss':
      return `${facts.best.san} was the stronger idea`;
  }
}

/** Capitalise the first letter unless the sentence starts with a move or square (e.g. "exd4"). */
function sentence(s: string): string {
  const t = s.trim().replace(/[.]+$/, '');
  if (/^[a-h][1-8x]/.test(t) || /^[KQRBN][a-h1-8x]/.test(t) || /^O-O/.test(t)) return `${t}.`;
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}.`;
}

/** Deterministic explanation built only from the facts and tags. Always valid by construction. */
export function templateExplanation(facts: FactsPacket, tags: readonly MotifResult[]): Explanation {
  const top = tags[0];
  const played = facts.played.san;
  const best = facts.best.san;
  if (!top || top.tag === 'positionalLoss') {
    return {
      headline: `${best} was the stronger idea`,
      explanation: `${sentence(`you played ${played}, which was simply weaker here`)} ${sentence(`${best} was the better idea`)}`,
      lesson: LESSONS.positionalLoss,
      highlightSquares: [facts.best.from, facts.best.to],
    };
  }
  const parts = [sentence(top.evidence)];
  const second = tags[1];
  if (second && second.tag !== 'positionalLoss') parts.push(sentence(second.evidence));
  if (top.side === 'opponent') parts.push(sentence(`you should have played ${best} instead`));
  else parts.push(sentence(`you played ${played} instead, and the chance was gone`));
  const squares: Square[] = [...new Set([...top.squares, ...(second?.squares ?? [])])].slice(0, 6);
  return {
    headline: headline(top, facts),
    explanation: parts.slice(0, 3).join(' '),
    lesson: LESSONS[top.tag],
    highlightSquares: squares,
  };
}

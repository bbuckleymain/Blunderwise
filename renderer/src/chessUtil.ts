import { Chess, SQUARES, type Square } from 'chess.js';
import type { Key } from 'chessground/types';

/** Legal destinations for chessground from a chess.js position. */
export function legalDests(chess: Chess): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  for (const s of SQUARES) {
    const ms = chess.moves({ square: s, verbose: true });
    if (ms.length) dests.set(s, ms.map((m) => m.to));
  }
  return dests;
}

export function isPromotion(chess: Chess, from: Square, to: Square): boolean {
  const p = chess.get(from);
  if (!p || p.type !== 'p') return false;
  return (p.color === 'w' && to[1] === '8') || (p.color === 'b' && to[1] === '1');
}

export const uciFrom = (uci: string): Square => uci.slice(0, 2) as Square;
export const uciTo = (uci: string): Square => uci.slice(2, 4) as Square;

export function gameResult(chess: Chess): { over: boolean; result: string; reason: string } {
  if (chess.isCheckmate()) return { over: true, result: chess.turn() === 'w' ? '0-1' : '1-0', reason: 'checkmate' };
  if (chess.isStalemate()) return { over: true, result: '1/2-1/2', reason: 'stalemate' };
  if (chess.isInsufficientMaterial()) return { over: true, result: '1/2-1/2', reason: 'insufficient material' };
  if (chess.isThreefoldRepetition()) return { over: true, result: '1/2-1/2', reason: 'threefold repetition' };
  if (chess.isDraw()) return { over: true, result: '1/2-1/2', reason: '50-move rule' };
  return { over: false, result: '*', reason: '' };
}

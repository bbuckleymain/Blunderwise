/**
 * "What's my plan?": plain-English ideas for the side to move, from the position's structure.
 * Pure TS + chess.js, no engine and no AI: everything is found by looking at the board.
 */
import type { Color, Square } from 'chess.js';
import { gamePhase, type GamePhase } from '../analysis/gamePhase';
import { Board, PIECE_NAME, fileOf, materialBalance, other, rankOf, toSquare, type BoardPiece } from './board';

export interface PlanItem {
  readonly id: string;
  readonly text: string;
  readonly squares: readonly Square[];
  readonly priority: number;
}

export interface PlanResult {
  readonly color: Color;
  readonly phase: GamePhase;
  readonly items: readonly PlanItem[];
}

const FILE_NAMES = 'abcdefgh';
const MAX_ITEMS = 3;

const HOME: Readonly<Record<Color, { n: readonly Square[]; b: readonly Square[] }>> = {
  w: { n: ['b1', 'g1'], b: ['c1', 'f1'] },
  b: { n: ['b8', 'g8'], b: ['c8', 'f8'] },
};

function pawnsOf(board: Board, color: Color): BoardPiece[] {
  return board.pieces(color).filter((p) => p.type === 'p');
}

/** No enemy pawn can stop or capture it on its way: none ahead on its own or the neighbouring files. */
function isPassed(p: BoardPiece, enemyPawns: readonly BoardPiece[]): boolean {
  const f = fileOf(p.square);
  const r = rankOf(p.square);
  return !enemyPawns.some((e) => Math.abs(fileOf(e.square) - f) <= 1 && (p.color === 'w' ? rankOf(e.square) > r : rankOf(e.square) < r));
}

function isIsolated(p: BoardPiece, ownPawns: readonly BoardPiece[]): boolean {
  const f = fileOf(p.square);
  return !ownPawns.some((o) => Math.abs(fileOf(o.square) - f) === 1);
}

/** Squares from which a pawn of `by` could attack `target` right now or later (an enemy pawn behind or level on a neighbouring file). */
function canBeAttackedByPawn(target: Square, by: readonly BoardPiece[], byColor: Color): boolean {
  const f = fileOf(target);
  const r = rankOf(target);
  return by.some((p) => Math.abs(fileOf(p.square) - f) === 1 && (byColor === 'w' ? rankOf(p.square) < r : rankOf(p.square) > r));
}

const nameOf = (p: BoardPiece): string => PIECE_NAME[p.type];

export function buildPlan(fen: string, maxItems: number = MAX_ITEMS): PlanResult {
  const board = Board.fromFen(fen);
  const parts = fen.split(' ');
  const me: Color = parts[1] === 'b' ? 'b' : 'w';
  const opp = other(me);
  const castling = parts[2] ?? '-';
  const moveNumber = Number(parts[5] ?? '1');
  const phase = gamePhase(fen, moveNumber);
  const items: PlanItem[] = [];
  const add = (id: string, priority: number, text: string, squares: readonly Square[]): void => {
    items.push({ id, text, squares, priority });
  };

  const myPawns = pawnsOf(board, me);
  const theirPawns = pawnsOf(board, opp);
  const myPieces = board.pieces(me);
  const myKing = board.kingSquare(me);
  const theirKing = board.kingSquare(opp);
  const myCastleRights = me === 'w' ? /[KQ]/.test(castling) : /[kq]/.test(castling);
  const homeRank = me === 'w' ? 0 : 7;

  // 1. Development and king safety (opening / early middlegame)
  if (phase !== 'endgame' && moveNumber <= 18) {
    const undeveloped: Square[] = [];
    for (const sq of HOME[me].n) if (board.get(sq)?.type === 'n' && board.get(sq)?.color === me) undeveloped.push(sq);
    for (const sq of HOME[me].b) if (board.get(sq)?.type === 'b' && board.get(sq)?.color === me) undeveloped.push(sq);
    if (undeveloped.length > 0) {
      const names = undeveloped.map((s) => `${nameOf(board.get(s) as BoardPiece)} on ${s}`);
      add('develop', 85, `Finish developing: your ${names.slice(0, 3).join(', ')} ${names.length === 1 ? 'is' : 'are'} still at home. Bring ${names.length === 1 ? 'it' : 'them'} into play before attacking.`, undeveloped);
    }
    if (myKing && rankOf(myKing) === homeRank && fileOf(myKing) === 4) {
      add(
        'castle',
        myCastleRights ? 90 : 72,
        myCastleRights
          ? `Castle soon: your king on ${myKing} is still in the centre. Castling tucks it away and brings a rook into the game.`
          : `Your king on ${myKing} is still in the centre and you can no longer castle. Keep the centre closed and move it to safety if you can.`,
        [myKing],
      );
    }
  }

  // 2. Open files and rooks
  const filesOpen: number[] = [];
  const filesSemi: number[] = [];
  for (let f = 0; f < 8; f++) {
    const mine = myPawns.some((p) => fileOf(p.square) === f);
    const theirs = theirPawns.some((p) => fileOf(p.square) === f);
    if (!mine && !theirs) filesOpen.push(f);
    else if (!mine && theirs) filesSemi.push(f);
  }
  const rooks = myPieces.filter((p) => p.type === 'r');
  const good = new Set([...filesOpen, ...filesSemi]);
  const idleRook = rooks.find((r) => !good.has(fileOf(r.square)));
  const target = [...filesOpen, ...filesSemi][0];
  if (idleRook && target !== undefined && phase !== 'opening') {
    const fileName = FILE_NAMES.charAt(target);
    const kind = filesOpen.includes(target) ? 'open' : 'half-open';
    const sq = toSquare(target, homeRank);
    add('open-file', 75, `The ${fileName}-file is ${kind}. Put your rook there (your rook on ${idleRook.square} is doing little) and press down it.`, sq ? [idleRook.square, sq] : [idleRook.square]);
  }

  // 3. Passed pawns
  const myPassed = myPawns.filter((p) => isPassed(p, theirPawns));
  const theirPassed = theirPawns.filter((p) => isPassed(p, myPawns));
  const bestPassed = [...myPassed].sort((a, b) => (me === 'w' ? rankOf(b.square) - rankOf(a.square) : rankOf(a.square) - rankOf(b.square)))[0];
  if (bestPassed) {
    add('passed-pawn', phase === 'endgame' ? 92 : 80, `Your pawn on ${bestPassed.square} is passed: nothing can stop it by pawns. Support it with your king or pieces and push it.`, [bestPassed.square]);
  }
  const worstTheirs = [...theirPassed].sort((a, b) => (opp === 'w' ? rankOf(b.square) - rankOf(a.square) : rankOf(a.square) - rankOf(b.square)))[0];
  if (worstTheirs) {
    const ahead = toSquare(fileOf(worstTheirs.square), rankOf(worstTheirs.square) + (opp === 'w' ? 1 : -1));
    add('stop-passed', 78, `Your opponent has a passed pawn on ${worstTheirs.square}. Blockade it with a piece${ahead ? ` on ${ahead}` : ''} before it gets dangerous.`, ahead ? [worstTheirs.square, ahead] : [worstTheirs.square]);
  }

  // 4. Knight outposts
  const knights = myPieces.filter((p) => p.type === 'n');
  if (knights.length > 0 && phase !== 'endgame') {
    for (let f = 0; f < 8; f++) {
      for (const r of me === 'w' ? [4, 5, 3] : [3, 2, 4]) {
        const sq = toSquare(f, r);
        if (!sq) continue;
        const occ = board.get(sq);
        if (occ && occ.color !== me) continue;
        const supported = myPawns.some((p) => Math.abs(fileOf(p.square) - f) === 1 && rankOf(p.square) === (me === 'w' ? r - 1 : r + 1));
        if (!supported || canBeAttackedByPawn(sq, theirPawns, opp)) continue;
        const onIt = occ?.type === 'n';
        const knight = knights.find((k) => k.square !== sq) ?? knights[0];
        if (onIt || !knight) continue;
        add('outpost', 65, `${sq} is an outpost: your pawn protects it and no enemy pawn can ever chase a piece away. Route your knight on ${knight.square} there.`, [knight.square, sq]);
        break;
      }
      if (items.some((i) => i.id === 'outpost')) break;
    }
  }

  // 5. Weak enemy pawns
  const isolatedTarget = theirPawns.find((p) => isIsolated(p, theirPawns));
  if (isolatedTarget && phase !== 'opening') {
    add('target-isolated', 60, `Their pawn on ${isolatedTarget.square} is isolated: no pawn can defend it. Attack it with your pieces and tie their pieces down to protecting it.`, [isolatedTarget.square]);
  }
  const doubled = new Map<number, BoardPiece[]>();
  for (const p of theirPawns) doubled.set(fileOf(p.square), [...(doubled.get(fileOf(p.square)) ?? []), p]);
  const doubledFile = [...doubled.values()].find((v) => v.length >= 2);
  if (doubledFile && !isolatedTarget && phase !== 'opening') {
    add('target-doubled', 52, `Their pawns on ${doubledFile.map((p) => p.square).join(' and ')} are doubled and clumsy. Aim at the weak one.`, doubledFile.map((p) => p.square));
  }

  // 6. Kings
  if (myKing && theirKing && phase === 'middlegame') {
    const mf = fileOf(myKing);
    const tf = fileOf(theirKing);
    const mySide = mf >= 5 ? 'kingside' : mf <= 2 ? 'queenside' : null;
    const theirSide = tf >= 5 ? 'kingside' : tf <= 2 ? 'queenside' : null;
    if (mySide && theirSide && mySide !== theirSide) {
      add('storm', 70, `The kings are on opposite wings. Push your pawns on the ${theirSide} (where their king lives) to open lines, and do not waste time on the other side: it is a race.`, [theirKing]);
    } else if (theirSide === null && rankOf(theirKing) === (opp === 'w' ? 0 : 7)) {
      add('king-centre', 66, `Their king on ${theirKing} is still in the centre. Open the centre with a pawn break and use your rooks and queen against it.`, [theirKing]);
    }
  }

  // 7. Material
  const balance = materialBalance(board, me);
  if (phase !== 'opening' && balance >= 2) add('trade', 55, 'You are ahead in material: trade pieces (not pawns) to simplify, and avoid risky complications.', []);
  else if (phase !== 'opening' && balance <= -2) add('complicate', 55, 'You are behind in material: avoid trades, keep pieces on, and look for tricks against their king or loose pieces.', []);

  // 8. Endgame king
  if (phase === 'endgame' && myKing) {
    const dist = Math.max(Math.abs(fileOf(myKing) - 3.5), Math.abs(rankOf(myKing) - 3.5));
    if (dist > 2) add('king-active', 85, `In the endgame your king is a fighting piece. Bring your king on ${myKing} towards the centre.`, [myKing]);
  }

  // 9. Fallback: the least active piece
  const movers = myPieces.filter((p) => p.type === 'n' || p.type === 'b' || p.type === 'r');
  // Only as filler: skip it when there is already concrete advice.
  if (movers.length > 0 && items.length < 2) {
    const mobility = (p: BoardPiece): number => board.attacksFrom(p.square).filter((s) => board.get(s)?.color !== me).length;
    const worst = [...movers].sort((a, b) => mobility(a) - mobility(b))[0];
    if (worst) add('worst-piece', 40, `Improve your least active piece: your ${nameOf(worst)} on ${worst.square} sees very little. Find it a better square before starting something new.`, [worst.square]);
  }

  items.sort((a, b) => b.priority - a.priority);
  return { color: me, phase, items: items.slice(0, maxItems) };
}

/**
 * Endgame trainer positions. Every entry was checked with Stockfish 17.1 at depth 30
 * (scripts/verify-endgames.ts re-checks them): wins have a forced mate or a decisive evaluation,
 * draws evaluate to exactly 0.00 for the side that must hold.
 */
export type EndgameGoal = 'win' | 'draw';

export interface EndgamePosition {
  readonly id: string;
  readonly title: string;
  readonly level: 'basic' | 'intermediate';
  /** What you must achieve against full-strength Stockfish. */
  readonly goal: EndgameGoal;
  /** The side you play. */
  readonly playAs: 'w' | 'b';
  readonly fen: string;
  readonly idea: string;
  /** Verified result for the side `playAs`: 'M12' = forced mate in 12 moves, 'draw' = 0.00. */
  readonly verified: string;
}

export const ENDGAMES: readonly EndgamePosition[] = [
  {
    id: 'kq-k',
    title: 'King and queen vs king',
    level: 'basic',
    goal: 'win',
    playAs: 'w',
    fen: '8/8/8/4k3/8/8/8/KQ6 w - - 0 1',
    idea: 'Use the queen to box the king in, then walk your king closer for mate. Watch out for stalemate!',
    verified: 'M12',
  },
  {
    id: 'kr-k',
    title: 'King and rook vs king',
    level: 'basic',
    goal: 'win',
    playAs: 'w',
    fen: '8/8/8/4k3/8/8/8/KR6 w - - 0 1',
    idea: 'Cut the king off with the rook, march your own king up, and give mate on the edge of the board.',
    verified: 'M21',
  },
  {
    id: 'kbb-k',
    title: 'King and two bishops vs king',
    level: 'basic',
    goal: 'win',
    playAs: 'w',
    fen: '8/8/8/4k3/8/8/8/KBB5 w - - 0 1',
    idea: 'The bishops cover squares of both colours. Squeeze the king towards a corner with your king in support.',
    verified: 'M22',
  },
  {
    id: 'kpk-key',
    title: 'Pawn ending: king in front of the pawn',
    level: 'basic',
    goal: 'win',
    playAs: 'w',
    fen: '3k4/8/3K4/3P4/8/8/8/8 w - - 0 1',
    idea: 'Your king stands two squares in front of the pawn on the 6th rank: that wins by force. Promote the pawn without allowing stalemate.',
    verified: 'M12',
  },
  {
    id: 'kpk-opposition-win',
    title: 'Pawn ending: winning with the opposition',
    level: 'intermediate',
    goal: 'win',
    playAs: 'w',
    fen: '8/8/8/3k4/8/3K4/3P4/8 b - - 0 1',
    idea: 'Black is to move and has to give way. Keep your king in front of the pawn, win the opposition, and escort the pawn home.',
    verified: 'M21',
  },
  {
    id: 'lucena',
    title: 'Rook ending: the Lucena position',
    level: 'intermediate',
    goal: 'win',
    playAs: 'w',
    fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
    idea: 'Your pawn is on the 7th and your king is stuck in front of it. Build a "bridge": put your rook on the 4th rank to shield your king from checks.',
    verified: 'M27',
  },
  {
    id: 'kpk-opposition-draw',
    title: 'Pawn ending: holding the draw',
    level: 'intermediate',
    goal: 'draw',
    playAs: 'b',
    fen: '8/8/8/3k4/8/3K4/3P4/8 w - - 0 1',
    idea: 'White has an extra pawn but you can hold. Keep your king in front of the pawn and answer king moves with the opposition.',
    verified: 'draw',
  },
  {
    id: 'philidor',
    title: 'Rook ending: the Philidor defence',
    level: 'intermediate',
    goal: 'draw',
    playAs: 'b',
    fen: '4k3/8/r7/3PK3/8/8/8/1R6 w - - 0 1',
    idea: 'Keep your rook on the 6th rank so White\'s king cannot advance. Only when the pawn reaches the 6th rank, switch to checking from behind.',
    verified: 'draw',
  },
];

/** How many full moves you must survive to count a "hold the draw" as achieved. */
export const DRAW_SURVIVAL_MOVES = 30;

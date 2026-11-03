import type { MotifTag } from '../explain/types';

/**
 * Hand-written fixture specs. `scripts/generate-fixtures.ts` turns each into a full MistakeContext
 * by asking Stockfish for the evals and lines, and writes fixtures/fixtures.json.
 * `expected` = tags a correct detector set must report; `alsoOk` = tags that are also true and not penalised.
 */
export interface FixtureSpec {
  readonly id: string;
  readonly description: string;
  /** Either a FEN, or SAN moves from the start position. */
  readonly fen?: string;
  readonly moves?: readonly string[];
  /** The mistake, in SAN or UCI. */
  readonly played: string;
  readonly expected: readonly MotifTag[];
  readonly alsoOk?: readonly MotifTag[];
}

export const SPECS: readonly FixtureSpec[] = [
  // --- hangingPiece
  {
    id: 'hang-knight-d4',
    description: 'Italian: Nd4?? drops the knight to the e5 pawn',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    played: 'Nd4',
    expected: ['hangingPiece'],
  },
  {
    id: 'hang-queen-g5',
    description: '2...Qg5?? puts the queen where the f3 knight takes it',
    moves: ['e4', 'e5', 'Nf3'],
    played: 'Qg5',
    expected: ['hangingPiece'],
  },
  {
    id: 'hang-rook-b2',
    description: 'Rb2?? walks into the d4 bishop',
    fen: '6k1/5pp1/7p/8/3b4/8/5PPP/1R4K1 w - - 0 1',
    played: 'Rb2',
    expected: ['hangingPiece'],
  },
  // --- missedCapture
  {
    id: 'missed-capture-queen',
    description: 'Black hung the queen on g5; Nc3 ignores it',
    moves: ['e4', 'e5', 'Nf3', 'Qg5'],
    played: 'Nc3',
    expected: ['missedCapture'],
  },
  {
    id: 'missed-capture-knight',
    description: 'White hung a knight on d4; ...h6 ignores it',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Nd4'],
    played: 'h6',
    expected: ['missedCapture'],
  },
  {
    id: 'missed-capture-rook',
    description: 'Free rook on c4; h3 lets Black trade it off',
    fen: '6k1/5ppp/8/8/2r5/8/3K1PPP/2R5 w - - 0 1',
    played: 'h3',
    expected: ['missedCapture'],
  },
  // --- fork
  {
    id: 'fork-allowed-knight',
    description: '...Qd7?? lets Nf6+ fork king and queen',
    fen: 'r2q2k1/ppp2p1p/6p1/8/4N3/8/PPP2PPP/5RK1 b - - 0 1',
    played: 'Qd7',
    expected: ['fork'],
  },
  {
    id: 'fork-missed-knight',
    description: 'Nf6+ forks king and queen; a3 misses it',
    fen: 'r5k1/pppq1p1p/6p1/8/4N3/8/PPP2PPP/5RK1 w - - 0 1',
    played: 'a3',
    expected: ['fork'],
  },
  {
    id: 'fork-allowed-pawn',
    description: '...Rc5?? lines both rooks up for the d4 pawn fork',
    fen: '2r1k3/pp3ppp/8/4r3/8/2PP4/PP3PPP/5RK1 b - - 0 1',
    played: 'c8c5',
    expected: ['fork'],
  },
  // --- pin
  {
    id: 'pin-allowed-knight',
    description: '...d6?? opens the a4-e8 diagonal; the c6 knight is pinned and d5 wins it',
    fen: '4k3/pp1p1ppp/2n5/8/B2P4/8/PPP2PPP/6K1 b - - 0 1',
    played: 'd6',
    expected: ['pin'],
    alsoOk: ['kingSafetyBlunder'],
  },
  {
    id: 'pin-allowed-queen',
    description: '...Kf8?? pins the queen to the king on the b4-f8 diagonal',
    fen: '6k1/pp2qppp/8/8/1B6/P7/1PP2PPP/6K1 b - - 0 1',
    played: 'Kf8',
    expected: ['pin'],
    alsoOk: ['hangingPiece'],
  },
  // --- skewer
  {
    id: 'skewer-allowed-rook',
    description: '...Qa5?? puts the queen behind the king on the 5th rank: Rf5+',
    fen: '3q4/8/8/3k4/8/8/6PP/5RK1 b - - 0 1',
    played: 'Qa5',
    expected: ['skewer'],
  },
  {
    id: 'skewer-missed-rook',
    description: 'Rf5+ skewers king and queen; h3 misses it',
    fen: '8/8/8/q2k4/8/8/6PP/5RK1 w - - 0 1',
    played: 'h3',
    expected: ['skewer'],
  },
  // --- discoveredAttack
  {
    id: 'discovered-allowed',
    description: '...Ke8?? steps onto the e-file; the e4 knight moves with discovered check and wins the queen',
    fen: 'r4k2/pppq1ppp/8/8/4N3/8/PPP2PPP/4R1K1 b - - 0 1',
    played: 'Ke8',
    expected: ['discoveredAttack'],
    alsoOk: ['fork', 'kingSafetyBlunder'],
  },
  {
    id: 'discovered-missed',
    description: 'The e4 knight can move with discovered check and win the queen; a3 misses it',
    fen: 'r3k3/pppq1ppp/8/8/4N3/8/PPP2PPP/4R1K1 w - - 0 1',
    played: 'a3',
    expected: ['discoveredAttack'],
    alsoOk: ['fork'],
  },
  // --- back rank
  {
    id: 'backrank-allowed',
    description: '...Rd2?? leaves the back rank: Re8#',
    fen: '3r2k1/5ppp/8/8/8/8/5PPP/4R1K1 b - - 0 1',
    played: 'Rd2',
    expected: ['allowedMate', 'backRankWeakness'],
  },
  {
    id: 'backrank-missed',
    description: 'Rd8# is on the board; h3 misses it',
    fen: '6k1/5ppp/8/8/8/8/r4PPP/3R2K1 w - - 0 1',
    played: 'h3',
    expected: ['missedMate', 'backRankWeakness'],
  },
  // --- mates
  {
    id: 'scholar-missed',
    description: 'Qxf7# is available; d3 misses it',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    played: 'd3',
    expected: ['missedMate'],
    alsoOk: ['hangingPiece'],
  },
  {
    id: 'scholar-allowed',
    description: "Scholar's mate: 3...Nf6?? allows Qxf7#",
    moves: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5'],
    played: 'Nf6',
    expected: ['allowedMate'],
  },
  {
    id: 'fools-mate',
    description: "Fool's mate: 2.g4?? allows Qh4#",
    moves: ['f3', 'e5'],
    played: 'g4',
    expected: ['allowedMate'],
    alsoOk: ['kingSafetyBlunder'],
  },
  // --- trappedPiece
  {
    id: 'trapped-bishop-a7',
    description: 'Bxa7?? b6 traps the bishop',
    fen: '2k5/ppp2ppp/5n2/8/8/4B3/PP3PPP/4K3 w - - 0 1',
    played: 'Bxa7',
    expected: ['trappedPiece'],
  },
  {
    id: 'trapped-bishop-a2',
    description: '...Bxa2?? b3 traps the bishop',
    fen: '4k3/pp3ppp/4b3/8/8/5N2/PPP2PPP/2K5 b - - 0 1',
    played: 'Bxa2',
    expected: ['trappedPiece'],
  },
  // --- overloadedDefender
  {
    id: 'overloaded-bishop',
    description: '...b5?? leaves the d6 bishop guarding both knights alone',
    fen: '6k1/p4ppp/1p1b4/2n1n3/1B3B2/8/P4PPP/6K1 b - - 0 1',
    played: 'b5',
    expected: ['overloadedDefender'],
    alsoOk: ['discoveredAttack'],
  },
  // --- missedPromotion
  {
    id: 'missed-promo-white',
    description: 'b8=Q+ is there; h3 lets the rook stop the pawn',
    fen: '6k1/1P6/8/8/8/8/r4PPP/6K1 w - - 0 1',
    played: 'h3',
    expected: ['missedPromotion'],
  },
  {
    id: 'missed-promo-black',
    description: '...b1=Q+ is there; ...g6 lets the rook stop the pawn',
    fen: '6k1/5pp1/7p/8/4R3/7P/1p3PP1/6K1 b - - 0 1',
    played: 'g6',
    expected: ['missedPromotion'],
    alsoOk: ['fork'],
  },
  // --- kingSafetyBlunder
  {
    id: 'king-safety-f6',
    description: '2...f6? weakens the light squares around the king; Bc4 aims at the hole on f7',
    moves: ['e4', 'e5', 'Nf3'],
    played: 'f6',
    expected: ['kingSafetyBlunder'],
  },
  // --- negatives: no tactic
  {
    id: 'neg-a5',
    description: '1...a5: just a slow move',
    moves: ['e4'],
    played: 'a5',
    expected: ['positionalLoss'],
  },
  {
    id: 'neg-ruy-bc4',
    description: 'Ruy Lopez: 4.Bc4 wastes time, no tactic',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'],
    played: 'Bc4',
    expected: ['positionalLoss'],
  },
  {
    id: 'neg-qgd-a5',
    description: 'QGD: a quiet, slightly odd pawn move',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3'],
    played: 'a5',
    expected: ['positionalLoss'],
  },
  {
    id: 'neg-early-queen',
    description: '2.Qh5: an early queen sortie, no tactic',
    moves: ['e4', 'e5'],
    played: 'Qh5',
    expected: ['positionalLoss'],
  },
  {
    id: 'hang-bishop-f7',
    description: 'Italian: Bxf7+?? gives the bishop for a pawn after ...Rxf7',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'O-O'],
    played: 'Bxf7+',
    expected: ['hangingPiece'],
  },
  {
    id: 'hang-pawn-a4',
    description: 'Rook endgame: h4? ignores the attack on the a4 pawn, ...Rxa4',
    fen: '8/5pk1/6p1/8/P7/6P1/r4PKP/1R6 w - - 0 1',
    played: 'h4',
    expected: ['hangingPiece'],
  },
  {
    id: 'neg-london-h3',
    description: 'London: a slow h3, no tactic',
    moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6'],
    played: 'h3',
    expected: ['positionalLoss'],
  },
];

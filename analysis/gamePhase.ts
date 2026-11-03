export type GamePhase = 'opening' | 'middlegame' | 'endgame';

const VALUES: Readonly<Record<string, number>> = { n: 3, b: 3, r: 5, q: 9 };

/** Phase from the FEN's non-pawn material and the move number. */
export function gamePhase(fen: string, moveNumber: number): GamePhase {
  const placement = fen.split(' ')[0] ?? '';
  let nonPawn = 0;
  let queens = 0;
  for (const ch of placement) {
    const v = VALUES[ch.toLowerCase()];
    if (v !== undefined) nonPawn += v;
    if (ch === 'q' || ch === 'Q') queens += 1;
  }
  // Starting non-pawn material is 62.
  if (nonPawn <= 26 || (queens === 0 && nonPawn <= 32)) return 'endgame';
  if (moveNumber <= 12 && nonPawn >= 52) return 'opening';
  return 'middlegame';
}

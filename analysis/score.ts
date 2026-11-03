/**
 * An engine score from a fixed player's point of view.
 * Exactly one of `cp` / `mate` is non-null.
 * `mate > 0`: that player mates in `mate` moves. `mate < 0`: that player gets mated.
 */
export interface Score {
  readonly cp: number | null;
  readonly mate: number | null;
}

export const cpScore = (cp: number): Score => ({ cp, mate: null });
export const mateScore = (mate: number): Score => ({ cp: null, mate });

/** Flip a score to the other player's point of view. */
export function negateScore(s: Score): Score {
  return { cp: s.cp === null ? null : -s.cp, mate: s.mate === null ? null : -s.mate };
}

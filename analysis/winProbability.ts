import type { Score } from './score';

const K = 0.00368208;

/** Win probability (0-100) for the side whose centipawn score this is. */
export function winProbabilityFromCp(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-K * cp)) - 1);
}

/** Win probability (0-100) from a score; mate scores are handled explicitly. */
export function winProbability(score: Score): number {
  if (score.mate !== null) {
    return score.mate > 0 ? 100 : 0;
  }
  if (score.cp === null) {
    throw new Error('Score has neither cp nor mate');
  }
  return winProbabilityFromCp(score.cp);
}

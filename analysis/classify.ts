export type MoveClass = 'good' | 'inaccuracy' | 'mistake' | 'blunder';

/**
 * Classify a move by how much the mover's win probability dropped (percentage points).
 * <2 good, 2-5 inaccuracy, 5-10 mistake, >10 blunder.
 */
export function classifyMove(winProbBefore: number, winProbAfter: number): MoveClass {
  const drop = winProbBefore - winProbAfter;
  if (drop < 2) return 'good';
  if (drop < 5) return 'inaccuracy';
  if (drop < 10) return 'mistake';
  return 'blunder';
}

/**
 * Skip a move only when the game was already decided both before AND after it.
 * A drop from 97% to 55% is exactly the kind of move a coach must flag.
 */
export function isDecidedEitherWay(winProbBefore: number, winProbAfter: number): boolean {
  const won = winProbBefore > 95 && winProbAfter > 95;
  const lost = winProbBefore < 5 && winProbAfter < 5;
  return won || lost;
}

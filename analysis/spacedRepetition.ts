/** A small SM-2 style scheduler for blunder drills. Pure: give it the card and the clock. */
export interface ReviewState {
  readonly reps: number;
  readonly lapses: number;
  readonly intervalDays: number;
  readonly ease: number;
  readonly dueAt: number; // epoch ms
}

export const DAY_MS = 86_400_000;
export const RETRY_MS = 10 * 60_000;

export function newCard(now: number): ReviewState {
  return { reps: 0, lapses: 0, intervalDays: 0, ease: 2.5, dueAt: now };
}

/** Correct: the gap grows (1 day, 3 days, then x ease). Wrong: back in 10 minutes and the gap resets. */
export function schedule(card: ReviewState, correct: boolean, now: number): ReviewState {
  if (!correct) {
    return { reps: 0, lapses: card.lapses + 1, intervalDays: 0, ease: Math.max(1.3, card.ease - 0.2), dueAt: now + RETRY_MS };
  }
  const reps = card.reps + 1;
  const intervalDays = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(card.intervalDays * card.ease * 10) / 10;
  return { reps, lapses: card.lapses, intervalDays, ease: Math.min(3, card.ease + 0.1), dueAt: now + intervalDays * DAY_MS };
}

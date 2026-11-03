import type { Analysis } from '../facts';
import type { MotifResult } from '../types';
import { makeResult } from './common';

/** Fallback when no tactic was found: the move was simply weaker than the best idea. */
export function positionalLoss(a: Analysis): MotifResult {
  const best = a.best[0];
  const swing = a.facts.materialAfterBestLine - a.facts.materialAfterRefutation;
  return makeResult(
    'positionalLoss',
    'you',
    swing < 1.5 ? 0.4 : 0.25,
    best ? [best.from, best.to] : [],
    [],
    best ? `no immediate tactic; ${best.san} was the stronger idea` : 'no immediate tactic',
    best?.san ?? null,
  );
}

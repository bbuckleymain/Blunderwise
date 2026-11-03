import type { Analysis } from '../facts';
import type { MotifResult, MotifTag } from '../types';
import { detectAllowedMate } from './allowedMate';
import { detectBackRankWeakness } from './backRankWeakness';
import type { Detector } from './common';
import { detectDiscoveredAttack } from './discoveredAttack';
import { detectFork } from './fork';
import { detectHangingPiece } from './hangingPiece';
import { detectKingSafetyBlunder } from './kingSafetyBlunder';
import { detectMissedCapture } from './missedCapture';
import { detectMissedMate } from './missedMate';
import { detectMissedPromotion } from './missedPromotion';
import { detectOverloadedDefender } from './overloadedDefender';
import { detectPin } from './pin';
import { positionalLoss } from './positionalLoss';
import { detectSkewer } from './skewer';
import { detectTrappedPiece } from './trappedPiece';

export const DETECTORS: Readonly<Record<Exclude<MotifTag, 'positionalLoss'>, Detector>> = {
  hangingPiece: detectHangingPiece,
  missedCapture: detectMissedCapture,
  fork: detectFork,
  pin: detectPin,
  skewer: detectSkewer,
  discoveredAttack: detectDiscoveredAttack,
  backRankWeakness: detectBackRankWeakness,
  missedMate: detectMissedMate,
  allowedMate: detectAllowedMate,
  trappedPiece: detectTrappedPiece,
  overloadedDefender: detectOverloadedDefender,
  missedPromotion: detectMissedPromotion,
  kingSafetyBlunder: detectKingSafetyBlunder,
};

/** How much a tag matters to the lesson, multiplied by confidence for ranking. */
const RELEVANCE: Readonly<Record<MotifTag, number>> = {
  allowedMate: 1.2,
  missedMate: 1.2,
  backRankWeakness: 0.95,
  fork: 0.9,
  skewer: 0.9,
  discoveredAttack: 0.9,
  missedPromotion: 0.9,
  pin: 0.85,
  trappedPiece: 0.85,
  hangingPiece: 0.85,
  missedCapture: 0.85,
  overloadedDefender: 0.8,
  kingSafetyBlunder: 0.6,
  positionalLoss: 0.1,
};

/** Tags that are a more specific explanation of the same lost piece than "hanging" / "missed capture". */
const SPECIFIC: ReadonlySet<MotifTag> = new Set<MotifTag>([
  'fork',
  'pin',
  'skewer',
  'discoveredAttack',
  'trappedPiece',
  'overloadedDefender',
]);

export const MAX_TAGS = 2;
/** A second tag is only shown when it is clearly relevant on its own. */
export const SECOND_TAG_MIN_SCORE = 0.5;

export const score = (r: MotifResult): number => r.confidence * RELEVANCE[r.tag];

export function runDetectors(a: Analysis): MotifResult[] {
  const found: MotifResult[] = [];
  for (const detect of Object.values(DETECTORS)) {
    const r = detect(a);
    if (r) found.push(r);
  }
  return found;
}

/** Run every detector and keep at most two tags, most relevant first. Never empty. */
export function detectMotifs(a: Analysis): MotifResult[] {
  const found = runDetectors(a);
  const specific = found.filter((r) => SPECIFIC.has(r.tag));
  const kept = found.filter((r) => {
    if (r.tag !== 'hangingPiece' && r.tag !== 'missedCapture') return true;
    const sq = r.squares[0];
    return !specific.some((s) => sq !== undefined && s.squares.includes(sq));
  });
  kept.sort((x, y) => score(y) - score(x));
  const out: MotifResult[] = [];
  for (const r of kept) {
    if (out.length >= MAX_TAGS) break;
    if (out.length > 0 && score(r) < SECOND_TAG_MIN_SCORE) break;
    out.push(r);
  }
  return out.length > 0 ? out : [positionalLoss(a)];
}

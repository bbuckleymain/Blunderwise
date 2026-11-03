import type { MotifTag } from '../../explain/types';

export const MOTIF_LABEL: Record<MotifTag, string> = {
  hangingPiece: 'Hanging pieces',
  missedCapture: 'Missed free captures',
  fork: 'Forks',
  pin: 'Pins',
  skewer: 'Skewers',
  discoveredAttack: 'Discovered attacks',
  backRankWeakness: 'Back-rank weakness',
  missedMate: 'Missed checkmates',
  allowedMate: 'Allowed checkmates',
  trappedPiece: 'Trapped pieces',
  overloadedDefender: 'Overloaded defenders',
  missedPromotion: 'Missed promotions',
  kingSafetyBlunder: 'King safety',
  positionalLoss: 'No tactic (weaker move)',
};

export const PHASE_LABEL: Record<string, string> = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' };

export function inHowLong(ts: number | null): string {
  if (ts === null) return '';
  const mins = Math.max(1, Math.round((ts - Date.now()) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 36) return `${hours} h`;
  return `${Math.round(hours / 24)} days`;
}

import { describe, expect, it } from 'vitest';
import { emptyScore, expectedTags, parsePuzzleLine, scorePuzzle } from '../scripts/puzzles';
import type { MotifTag } from '../explain/types';

describe('lichess puzzle CSV', () => {
  it('parses a row in the published column order', () => {
    const p = parsePuzzleLine('00008,r6k/pp2r2p/4Rp1Q/3p4/8/1N1P2R1/PqP2bPP/7K b - - 0 24,f2g3 e6e7 b2b1 b3c1 b1c1 h6c1,1913,75,94,6230,crushing hangingPiece long middlegame,https://lichess.org/787zsVup/black#47,');
    expect(p?.id).toBe('00008');
    expect(p?.moves[0]).toBe('f2g3');
    expect(p?.themes).toContain('hangingPiece');
    expect(parsePuzzleLine('PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags')).toBeNull();
  });
  it('maps only themes we have detectors for', () => {
    expect(expectedTags(['fork', 'crushing', 'middlegame', 'backRankMate', 'mate', 'mateIn2'])).toEqual(['fork', 'backRankWeakness', 'allowedMate']);
  });
  it('scores recall and precision', () => {
    const t = new Map<MotifTag, ReturnType<typeof emptyScore>>();
    scorePuzzle(t, ['fork'], ['fork', 'hangingPiece'], ['fork', 'hangingPiece', 'pin']);
    scorePuzzle(t, ['pin'], ['hangingPiece'], ['hangingPiece', 'pin']);
    expect(t.get('fork')).toMatchObject({ support: 1, hitsTop: 1, hitsRaw: 1, predicted: 1, predictedCorrect: 1 });
    expect(t.get('pin')).toMatchObject({ support: 1, hitsTop: 0, hitsRaw: 1 });
    expect(t.get('hangingPiece')).toMatchObject({ support: 0, predicted: 2, predictedCorrect: 0 });
  });
});

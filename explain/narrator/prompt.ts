import type { FactsPacket, MotifResult } from '../types';
import type { Vocabulary } from '../vocabulary';
import { NARRATED_PLIES } from '../vocabulary';

/** Bump whenever the prompt or the facts it is built from change: it is part of the cache key. */
export const PROMPT_VERSION = 'v1';

export const SYSTEM_PROMPT = `You are a friendly chess coach talking to a club player rated about 1200.
You explain why ONE move they just played was a mistake.

Rules:
- Use ONLY the moves, squares and pieces listed under "allowed". Never invent other moves, squares or pieces.
- Base the explanation ONLY on "findings" and "lines". Do not claim any tactic that is not in "findings".
- Never mention centipawns, evaluations, numbers of points, engines, depth or percentages.
- Speak directly to the player as "you". Their opponent is "they" / "your opponent".
- Keep it simple and concrete: say what goes wrong after their move, and what the better move does.
- If the only finding is "positionalLoss", say the move was simply weaker and name the better idea; do not invent a tactic.

Reply with ONE JSON object and nothing else:
{
  "headline": "at most 8 words",
  "explanation": "2 or 3 sentences",
  "lesson": "exactly 1 sentence the player can reuse in future games",
  "highlightSquares": ["squares from the allowed list worth highlighting"]
}`;

const COLOR = { w: 'White', b: 'Black' } as const;

function materialWords(n: number): string {
  if (n <= -8) return 'you lose a lot of material (about a queen)';
  if (n <= -4) return 'you lose a rook or more';
  if (n <= -2) return 'you lose a piece';
  if (n <= -1) return 'you lose a pawn';
  if (n >= 8) return 'you win a lot of material';
  if (n >= 4) return 'you win a rook or more';
  if (n >= 2) return 'you win a piece';
  if (n >= 1) return 'you win a pawn';
  return 'material stays about even';
}

/** The user message: the facts packet as compact JSON for the model. */
export function buildUserPrompt(facts: FactsPacket, tags: readonly MotifResult[], vocab: Vocabulary): string {
  const payload = {
    you_play: COLOR[facts.myColor],
    move_number: facts.moveNumber,
    game_phase: facts.phase,
    how_bad: facts.severity,
    your_move: { san: facts.played.san, piece: facts.played.piece, from: facts.played.from, to: facts.played.to },
    better_move: { san: facts.best.san, piece: facts.best.piece, from: facts.best.from, to: facts.best.to },
    lines: {
      after_your_move: facts.refutationLineSan.slice(0, NARRATED_PLIES),
      after_the_better_move: facts.bestLineSan.slice(0, NARRATED_PLIES),
      material_after_your_move_line: materialWords(facts.materialAfterRefutation - facts.materialBefore),
      material_after_better_move_line: materialWords(facts.materialAfterBestLine - facts.materialBefore),
    },
    findings: tags.map((t) => ({
      motif: t.tag,
      who_benefits: t.side === 'opponent' ? 'your opponent' : 'you (missed)',
      evidence: t.evidence,
      key_move: t.keyMoveSan,
    })),
    your_pieces_left_undefended: facts.leftHanging.map((h) => `${h.piece.piece} on ${h.piece.square}`),
    checkmate: {
      you_had_mate_in: facts.mate.iHadMateIn,
      opponent_now_has_mate_in: facts.mate.theyHaveMateIn,
    },
    allowed: {
      moves: [...vocab.moves],
      squares: [...vocab.squares],
      pieces: [...vocab.pieces],
    },
  };
  return JSON.stringify(payload, null, 2);
}

export const RETRY_SUFFIX =
  '\n\nYour previous reply was not valid JSON in the required shape. Reply with ONLY the JSON object.';

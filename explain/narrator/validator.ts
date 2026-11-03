import type { Square } from 'chess.js';
import { isSquare } from '../board';
import type { Explanation, MotifResult, MotifTag, PieceName } from '../types';
import { stripSan, type Vocabulary } from '../vocabulary';

export type ParseResult = { ok: true; value: Explanation } | { ok: false; reason: string };
export type CheckResult = { ok: true } | { ok: false; reasons: string[] };

/** Parse model output into an Explanation (tolerates ```json fences). Shape only, no content checks. */
export function parseExplanation(raw: string): ParseResult {
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not valid JSON' };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { ok: false, reason: 'not a JSON object' };
  const o = data as Record<string, unknown>;
  const { headline, explanation, lesson, highlightSquares } = o;
  if (typeof headline !== 'string' || typeof explanation !== 'string' || typeof lesson !== 'string') {
    return { ok: false, reason: 'missing headline/explanation/lesson strings' };
  }
  if (!Array.isArray(highlightSquares) || !highlightSquares.every((s): s is string => typeof s === 'string')) {
    return { ok: false, reason: 'highlightSquares must be an array of strings' };
  }
  const squares: Square[] = [];
  for (const s of highlightSquares) {
    const lower = s.trim().toLowerCase();
    if (!isSquare(lower)) return { ok: false, reason: `highlightSquares has a non-square "${s}"` };
    squares.push(lower);
  }
  return {
    ok: true,
    value: { headline: headline.trim(), explanation: explanation.trim(), lesson: lesson.trim(), highlightSquares: squares },
  };
}

const PIECE_WORD = /\b(king|queen|rook|bishop|knight|pawn)s?\b/gi;
const SAN_TOKEN = /(?<![\w-])(?:O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h]x[a-h][1-8](?:=[QRBN])?|[a-h][1-8]=[QRBN])[+#]?(?![\w-])/g;
const SQUARE_TOKEN = /(?<![\w])[a-h][1-8](?![\w])/g;
const JARGON = /centipawn|\bcp\b|\bevals?\b|\bevaluation\b|\bengine\b|stockfish|\bdepth\b|[+-]\d+\.\d|\d+(\.\d+)?\s*%|\bpoints?\b/i;

/** Words that claim a motif; the claim must be backed by one of the listed tags. */
const CLAIMS: readonly { re: RegExp; tags: readonly MotifTag[]; name: string }[] = [
  { re: /\bfork/i, tags: ['fork'], name: 'fork' },
  { re: /\bpin(s|ned|ning)?\b/i, tags: ['pin'], name: 'pin' },
  { re: /\bskewer/i, tags: ['skewer'], name: 'skewer' },
  { re: /\bdiscover/i, tags: ['discoveredAttack'], name: 'discovered attack' },
  { re: /back[- ]rank/i, tags: ['backRankWeakness'], name: 'back rank' },
  { re: /\btrap/i, tags: ['trappedPiece'], name: 'trapped piece' },
  { re: /overload/i, tags: ['overloadedDefender'], name: 'overloaded defender' },
  { re: /promot/i, tags: ['missedPromotion'], name: 'promotion' },
  { re: /\bmate\b|checkmat|\bmates\b|\bmating\b/i, tags: ['allowedMate', 'missedMate', 'backRankWeakness'], name: 'checkmate' },
];

export function countSentences(s: string): number {
  // Strip SAN suffixes so "Qxf7#." / "Nf6+!" do not confuse the split.
  const cleaned = s.replace(/[+#]/g, '').trim();
  if (cleaned === '') return 0;
  return cleaned.split(/[.!?]+(?:\s+|$)/).filter((x) => x.trim() !== '').length;
}

export const wordCount = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

/** Content checks against the allowed vocabulary and the detected tags. */
export function checkExplanation(e: Explanation, vocab: Vocabulary, tags: readonly MotifResult[]): CheckResult {
  const reasons: string[] = [];
  const text = `${e.headline}\n${e.explanation}\n${e.lesson}`;

  if (wordCount(e.headline) === 0 || wordCount(e.headline) > 8) reasons.push('headline must be 1-8 words');
  const n = countSentences(e.explanation);
  if (n < 2 || n > 3) reasons.push(`explanation must be 2-3 sentences (got ${n})`);
  if (countSentences(e.lesson) !== 1) reasons.push('lesson must be exactly 1 sentence');
  if (!/\byou(r|rs)?\b/i.test(e.explanation)) reasons.push('explanation must address the player as "you"');
  if (JARGON.test(text)) reasons.push('uses engine jargon or numbers');

  for (const m of text.matchAll(SAN_TOKEN)) {
    const san = stripSan(m[0]);
    if (!vocab.moves.has(san)) reasons.push(`move "${m[0]}" is not in the facts`);
  }
  const withoutSan = text.replace(SAN_TOKEN, ' ');
  for (const m of withoutSan.matchAll(SQUARE_TOKEN)) {
    const sq = m[0];
    if (isSquare(sq) && !vocab.squares.has(sq)) reasons.push(`square "${sq}" is not in the facts`);
  }
  for (const m of text.matchAll(PIECE_WORD)) {
    const word = (m[1] ?? '').toLowerCase() as PieceName;
    if (!vocab.pieces.has(word)) reasons.push(`piece "${word}" is not in the facts`);
  }
  for (const sq of e.highlightSquares) {
    if (!vocab.squares.has(sq)) reasons.push(`highlight square "${sq}" is not in the facts`);
  }
  const tagSet = new Set(tags.map((t) => t.tag));
  for (const c of CLAIMS) {
    if (c.re.test(text) && !c.tags.some((t) => tagSet.has(t))) reasons.push(`claims a ${c.name} the analysis did not find`);
  }
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons: [...new Set(reasons)] };
}

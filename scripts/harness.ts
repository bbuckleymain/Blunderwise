/**
 * Fixture harness. Prints detector precision/recall per tag, validator rejection rate and sample explanations.
 *   npm run harness                      # template narration only
 *   GEMINI_API_KEY=... npm run harness       # also narrate with Gemini (optionally GEMINI_MODEL=...)
 *   OPENROUTER_API_KEY=... npm run harness   # or OpenRouter (optionally OPENROUTER_MODEL=..., default openrouter/free)
 *   npm run harness -- --samples 10
 */
import fixtures from '../fixtures/fixtures.json';
import type { Fixture } from '../fixtures/types';
import {
  ALL_MOTIF_TAGS,
  GeminiClient,
  OpenRouterClient,
  analyze,
  buildVocabulary,
  checkExplanation,
  detectMotifs,
  explainMistake,
  templateExplanation,
  type LlmClient,
  type MotifTag,
} from '../explain';

const all = fixtures as unknown as Fixture[];
const samplesArg = process.argv.indexOf('--samples');
const SAMPLES = samplesArg >= 0 ? Number(process.argv[samplesArg + 1]) : 6;

interface Counts {
  tp: number;
  fp: number;
  fn: number;
}
const counts = new Map<MotifTag, Counts>(ALL_MOTIF_TAGS.map((t) => [t, { tp: 0, fp: 0, fn: 0 }]));
const bump = (t: MotifTag, k: keyof Counts): void => {
  const c = counts.get(t);
  if (c) c[k] += 1;
};

let exact = 0;
const failures: string[] = [];
let templateInvalid = 0;
for (const f of all) {
  const a = analyze(f.ctx);
  const tags = detectMotifs(a);
  const got = new Set(tags.map((t) => t.tag));
  const expected = new Set(f.expected);
  const ok = new Set([...f.expected, ...f.alsoOk]);
  for (const t of got) bump(t, expected.has(t) ? 'tp' : ok.has(t) ? 'tp' : 'fp');
  for (const t of expected) if (!got.has(t)) bump(t, 'fn');
  const missing = [...expected].filter((t) => !got.has(t));
  const extra = [...got].filter((t) => !ok.has(t));
  if (missing.length === 0 && extra.length === 0) exact += 1;
  else failures.push(`  ${f.id}: expected [${[...expected].join(', ')}] got [${[...got].join(', ')}]`);
  const tmpl = templateExplanation(a.facts, tags);
  const check = checkExplanation(tmpl, buildVocabulary(a, tags), tags);
  if (!check.ok) {
    templateInvalid += 1;
    failures.push(`  ${f.id}: TEMPLATE fails validator: ${check.reasons.join('; ')}`);
  }
}

const pct = (n: number, d: number): string => (d === 0 ? '   -  ' : `${((100 * n) / d).toFixed(0).padStart(4)}% `);
console.log(`\nDetector results on ${all.length} fixtures\n`);
console.log('tag                   TP  FP  FN  precision  recall');
let TP = 0;
let FP = 0;
let FN = 0;
for (const [tag, c] of counts) {
  if (c.tp + c.fp + c.fn === 0) continue;
  TP += c.tp;
  FP += c.fp;
  FN += c.fn;
  console.log(`${tag.padEnd(20)} ${String(c.tp).padStart(3)} ${String(c.fp).padStart(3)} ${String(c.fn).padStart(3)}   ${pct(c.tp, c.tp + c.fp)}    ${pct(c.tp, c.tp + c.fn)}`);
}
console.log(`${'ALL'.padEnd(20)} ${String(TP).padStart(3)} ${String(FP).padStart(3)} ${String(FN).padStart(3)}   ${pct(TP, TP + FP)}    ${pct(TP, TP + FN)}`);
console.log(`\nExact matches: ${exact}/${all.length}`);
console.log(`Template explanations failing the validator: ${templateInvalid}/${all.length}`);
if (failures.length) console.log(`\nMismatches:\n${failures.join('\n')}`);

async function narrate(): Promise<void> {
  const gKey = process.env.GEMINI_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;
  const llm: LlmClient | null = orKey
    ? new OpenRouterClient({ apiKey: orKey, model: process.env.OPENROUTER_MODEL })
    : gKey
      ? new GeminiClient({ apiKey: gKey, model: process.env.GEMINI_MODEL })
      : null;
  const label = orKey ? `OpenRouter (${process.env.OPENROUTER_MODEL ?? 'openrouter/free'})` : gKey ? `Gemini (${process.env.GEMINI_MODEL ?? 'default model'})` : null;
  console.log(`\nNarration: ${label ?? 'template only (set OPENROUTER_API_KEY or GEMINI_API_KEY to test an LLM)'}`);
  let rejected = 0;
  let attempted = 0;
  const reasons = new Map<string, number>();
  for (const [i, f] of all.entries()) {
    const r = await explainMistake(f.ctx, { llm });
    if (llm) {
      attempted += 1;
      if (r.source === 'template') {
        rejected += 1;
        for (const why of r.rejections) reasons.set(why.replace(/"[^"]*"/g, '"…"'), (reasons.get(why.replace(/"[^"]*"/g, '"…"')) ?? 0) + 1);
      }
    }
    if (i % Math.max(1, Math.floor(all.length / SAMPLES)) === 0) {
      const e = r.explanation;
      console.log(`\n[${f.id}] (${r.source}) ${r.facts.played.san} vs ${r.facts.best.san} — tags: ${r.tags.map((t) => t.tag).join(', ')}`);
      console.log(`  ${e.headline}`);
      console.log(`  ${e.explanation}`);
      console.log(`  Lesson: ${e.lesson}`);
      console.log(`  Highlight: ${e.highlightSquares.join(' ')}`);
      if (r.rejections.length) console.log(`  (rejected LLM output: ${r.rejections.join('; ')})`);
    }
  }
  if (llm) {
    console.log(`\nValidator rejection rate: ${rejected}/${attempted} (${pct(rejected, attempted).trim()})`);
    for (const [why, n] of [...reasons].sort((x, y) => y[1] - x[1])) console.log(`  ${n}x ${why}`);
  }
}

narrate().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});

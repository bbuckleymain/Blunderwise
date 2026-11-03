import { ExplanationCache, cacheKey, type KeyValueStore } from './cache';
import { analyze } from './facts';
import { detectMotifs } from './motifs';
import type { LlmClient } from './narrator/llm';
import { PROMPT_VERSION, RETRY_SUFFIX, SYSTEM_PROMPT, buildUserPrompt } from './narrator/prompt';
import { templateExplanation } from './narrator/template';
import { checkExplanation, parseExplanation } from './narrator/validator';
import type { ExplainResult, Explanation, MistakeContext } from './types';
import { buildVocabulary } from './vocabulary';

export * from './types';
export { analyze, buildFacts } from './facts';
export { detectMotifs, runDetectors } from './motifs';
export { buildVocabulary } from './vocabulary';
export { templateExplanation } from './narrator/template';
export { parseExplanation, checkExplanation } from './narrator/validator';
export { SYSTEM_PROMPT, PROMPT_VERSION, buildUserPrompt } from './narrator/prompt';
export type { LlmClient } from './narrator/llm';
export { LlmError } from './narrator/llm';
export { GeminiClient, DEFAULT_GEMINI_MODEL } from './narrator/gemini';
export { OpenRouterClient, DEFAULT_OPENROUTER_MODEL } from './narrator/openrouter';
export { ManualLlmClient, toCopyablePrompt } from './narrator/manual';
export { MemoryStore, cacheKey, hashString, type KeyValueStore } from './cache';

export interface ExplainOptions {
  /** Omit (or null) to use the deterministic template only. */
  readonly llm?: LlmClient | null;
  readonly cache?: KeyValueStore | null;
}

/** Instant, offline explanation: facts + tags + template. Use while waiting for the LLM. */
export function explainInstantly(ctx: MistakeContext): ExplainResult {
  const a = analyze(ctx);
  const tags = detectMotifs(a);
  return { facts: a.facts, tags, explanation: templateExplanation(a.facts, tags), source: 'template', fromCache: false, rejections: [] };
}

/** The full pipeline: facts -> motifs -> LLM narration -> validation -> template fallback. Never throws for LLM problems. */
export async function explainMistake(ctx: MistakeContext, opts: ExplainOptions = {}): Promise<ExplainResult> {
  const a = analyze(ctx);
  const tags = detectMotifs(a);
  const vocab = buildVocabulary(a, tags);
  const cache = opts.cache ? new ExplanationCache(opts.cache) : null;
  const key = cacheKey(ctx.fen, ctx.movePlayedUci, PROMPT_VERSION);

  const cached = cache ? await cache.get(key) : null;
  if (cached) {
    return { facts: a.facts, tags, explanation: cached, source: 'llm', fromCache: true, rejections: [] };
  }

  const rejections: string[] = [];
  if (opts.llm) {
    const user = buildUserPrompt(a.facts, tags, vocab);
    let parsed: Explanation | null = null;
    for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
      try {
        const raw = await opts.llm.complete(SYSTEM_PROMPT, attempt === 0 ? user : user + RETRY_SUFFIX);
        const p = parseExplanation(raw);
        if (p.ok) parsed = p.value;
        else rejections.push(`parse: ${p.reason}`);
      } catch (e) {
        rejections.push(`llm: ${e instanceof Error ? e.message : String(e)}`);
        break; // network/quota errors: do not hammer the API, fall back now
      }
    }
    if (parsed) {
      const check = checkExplanation(parsed, vocab, tags);
      if (check.ok) {
        if (cache) await cache.set(key, parsed);
        return { facts: a.facts, tags, explanation: parsed, source: 'llm', fromCache: false, rejections };
      }
      rejections.push(...check.reasons);
    }
  }
  return { facts: a.facts, tags, explanation: templateExplanation(a.facts, tags), source: 'template', fromCache: false, rejections };
}

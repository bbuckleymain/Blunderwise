import { LlmError, type LlmClient } from './llm';

/** OpenRouter's free router: picks one of the currently free models for each request. */
export const DEFAULT_OPENROUTER_MODEL = 'openrouter/free';

type FetchLike = (input: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export interface OpenRouterOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly timeoutMs?: number;
  readonly fetch?: FetchLike;
}

function extractContent(body: unknown): { text: string; model: string | null } {
  if (typeof body !== 'object' || body === null) throw new LlmError('OpenRouter: response is not an object');
  const o = body as { choices?: unknown; model?: unknown; error?: { message?: unknown } };
  if (o.error && typeof o.error.message === 'string') throw new LlmError(`OpenRouter: ${o.error.message}`);
  if (!Array.isArray(o.choices) || o.choices.length === 0) throw new LlmError('OpenRouter: no choices');
  const msg = (o.choices[0] as { message?: { content?: unknown } }).message;
  const content = msg?.content;
  if (typeof content !== 'string' || content.trim() === '') throw new LlmError('OpenRouter: empty content');
  return { text: content, model: typeof o.model === 'string' ? o.model : null };
}

/** OpenRouter chat-completions adapter (OpenAI-compatible). */
export class OpenRouterClient implements LlmClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly doFetch: FetchLike;
  /** Which model actually answered the last request (the free router picks one). */
  lastModel: string | null = null;

  constructor(opts: OpenRouterOptions) {
    if (!opts.apiKey) throw new LlmError('OpenRouter: missing API key');
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? DEFAULT_OPENROUTER_MODEL;
    this.timeoutMs = opts.timeoutMs ?? 30000;
    this.doFetch = opts.fetch ?? (globalThis.fetch as unknown as FetchLike);
  }

  async complete(system: string, user: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.doFetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-Title': 'Blunderwise',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        }),
        signal: controller.signal,
      });
      const raw = await res.text();
      if (!res.ok) throw new LlmError(`OpenRouter HTTP ${res.status}: ${raw.slice(0, 200)}`, res.status);
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new LlmError('OpenRouter: response is not JSON');
      }
      const { text, model } = extractContent(body);
      this.lastModel = model;
      return text;
    } catch (e) {
      if (e instanceof LlmError) throw e;
      throw new LlmError(`OpenRouter request failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

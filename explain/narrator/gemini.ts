import { LlmError, type LlmClient } from './llm';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

type FetchLike = (input: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export interface GeminiOptions {
  readonly apiKey: string;
  readonly model?: string;
  readonly timeoutMs?: number;
  /** Injectable for tests; defaults to global fetch. */
  readonly fetch?: FetchLike;
}

interface GeminiPart {
  text?: unknown;
}
interface GeminiCandidate {
  content?: { parts?: unknown };
}

function extractText(body: unknown): string {
  if (typeof body !== 'object' || body === null) throw new LlmError('Gemini: response is not an object');
  const candidates = (body as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) throw new LlmError('Gemini: no candidates');
  const first = candidates[0] as GeminiCandidate;
  const parts = first.content?.parts;
  if (!Array.isArray(parts)) throw new LlmError('Gemini: no content parts');
  const text = (parts as GeminiPart[])
    .map((p) => (typeof p.text === 'string' ? p.text : ''))
    .join('');
  if (text.trim() === '') throw new LlmError('Gemini: empty text');
  return text;
}

/** Gemini generateContent adapter (works with a free-tier AI Studio key). */
export class GeminiClient implements LlmClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly doFetch: FetchLike;

  constructor(opts: GeminiOptions) {
    if (!opts.apiKey) throw new LlmError('Gemini: missing API key');
    this.apiKey = opts.apiKey;
    this.model = opts.model ?? DEFAULT_GEMINI_MODEL;
    this.timeoutMs = opts.timeoutMs ?? 20000;
    this.doFetch = opts.fetch ?? (globalThis.fetch as unknown as FetchLike);
  }

  async complete(system: string, user: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.doFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': this.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
        }),
        signal: controller.signal,
      });
      const raw = await res.text();
      if (!res.ok) throw new LlmError(`Gemini HTTP ${res.status}: ${raw.slice(0, 200)}`, res.status);
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new LlmError('Gemini: response is not JSON');
      }
      return extractText(body);
    } catch (e) {
      if (e instanceof LlmError) throw e;
      throw new LlmError(`Gemini request failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

import { describe, expect, it } from 'vitest';
import {
  GeminiClient,
  MemoryStore,
  analyze,
  buildVocabulary,
  checkExplanation,
  detectMotifs,
  explainMistake,
  parseExplanation,
  type LlmClient,
} from '../explain';
import { fixture } from './helpers';

const GOOD = JSON.stringify({
  headline: 'Your knight was left undefended',
  explanation: 'After Nd4, your knight on d4 can simply be taken by exd4. You should have played d3 instead.',
  lesson: 'Before every move, check which of your pieces are attacked.',
  highlightSquares: ['d4', 'e5'],
});

function scripted(...replies: (string | Error)[]): LlmClient & { calls: number } {
  const client = {
    calls: 0,
    complete(): Promise<string> {
      const r = replies[Math.min(client.calls, replies.length - 1)];
      client.calls += 1;
      return r instanceof Error ? Promise.reject(r) : Promise.resolve(r ?? '');
    },
  };
  return client;
}

function vocabFor(id: string) {
  const a = analyze(fixture(id).ctx);
  const tags = detectMotifs(a);
  return { vocab: buildVocabulary(a, tags), tags };
}

describe('parseExplanation', () => {
  it('accepts fenced JSON', () => {
    expect(parseExplanation('```json\n' + GOOD + '\n```').ok).toBe(true);
  });
  it('rejects junk and wrong shapes', () => {
    expect(parseExplanation('Sure! Here is').ok).toBe(false);
    expect(parseExplanation('{"headline":1}').ok).toBe(false);
    expect(parseExplanation('{"headline":"a","explanation":"b","lesson":"c","highlightSquares":["z9"]}').ok).toBe(false);
  });
});

describe('checkExplanation', () => {
  const { vocab, tags } = vocabFor('hang-knight-d4');
  const base = { headline: 'Your knight was left undefended', explanation: 'After Nd4, your knight on d4 is lost to exd4. You should have played d3.', lesson: 'Check what your pieces are attacked by.', highlightSquares: ['d4' as const] };

  it('accepts a grounded explanation', () => {
    expect(checkExplanation(base, vocab, tags)).toEqual({ ok: true });
  });
  it.each([
    ['an invented move', { explanation: 'After Nd4, your knight is lost to Bxd4. You should have played d3.' }],
    ['an invented square', { explanation: 'After Nd4, your knight on h5 is lost. You should have played d3.' }],
    ['an invented piece', { explanation: 'After Nd4, your queen is lost. You should have played d3.' }],
    ['a tactic not in the tags', { explanation: 'After Nd4, they fork your pieces. You should have played d3.' }],
    ['engine jargon', { explanation: 'After Nd4, your eval drops by 4.5 points. You should have played d3.' }],
    ['a long headline', { headline: 'This was a really very bad move for you to play' }],
    ['one sentence only', { explanation: 'You lost your knight on d4.' }],
    ['no "you"', { explanation: 'The knight on d4 is lost. The move d3 was better.' }],
    ['a two-sentence lesson', { lesson: 'Check your pieces. Then move.' }],
    ['a highlight outside the facts', { highlightSquares: ['a1' as const] }],
  ])('rejects %s', (_, patch) => {
    expect(checkExplanation({ ...base, ...patch }, vocab, tags).ok).toBe(false);
  });
  it('allows mate words only when a mate tag exists', () => {
    const mate = vocabFor('scholar-allowed');
    const e = { headline: 'This move allows checkmate', explanation: 'After Nf6, your opponent plays Qxf7#. You should have played g6.', lesson: 'Always look at every check your opponent has.', highlightSquares: ['f7' as const] };
    expect(checkExplanation(e, mate.vocab, mate.tags).ok).toBe(true);
  });
});

describe('explainMistake', () => {
  const ctx = fixture('hang-knight-d4').ctx;

  it('uses the LLM when its answer is valid, and caches it', async () => {
    const store = new MemoryStore();
    const llm = scripted(GOOD);
    const r1 = await explainMistake(ctx, { llm, cache: store });
    expect(r1.source).toBe('llm');
    expect(r1.explanation.headline).toBe('Your knight was left undefended');
    const r2 = await explainMistake(ctx, { llm, cache: store });
    expect(r2.fromCache).toBe(true);
    expect(llm.calls).toBe(1);
  });

  it('retries once on unparseable output', async () => {
    const llm = scripted('not json', GOOD);
    const r = await explainMistake(ctx, { llm });
    expect(r.source).toBe('llm');
    expect(llm.calls).toBe(2);
  });

  it('falls back to the template after two bad parses', async () => {
    const llm = scripted('nope', 'still nope');
    const r = await explainMistake(ctx, { llm });
    expect(r.source).toBe('template');
    expect(llm.calls).toBe(2);
    expect(r.rejections.length).toBe(2);
  });

  it('falls back to the template when the LLM hallucinates', async () => {
    const bad = JSON.stringify({ ...JSON.parse(GOOD), explanation: 'After Nd4, their bishop on b4 pins you. You should have played d3.' });
    const store = new MemoryStore();
    const r = await explainMistake(ctx, { llm: scripted(bad), cache: store });
    expect(r.source).toBe('template');
    expect(r.rejections.some((x) => x.includes('pin'))).toBe(true);
    expect(store.size).toBe(0); // never cache rejected output
  });

  it('falls back immediately on network errors', async () => {
    const llm = scripted(new Error('HTTP 503'));
    const r = await explainMistake(ctx, { llm });
    expect(r.source).toBe('template');
    expect(llm.calls).toBe(1);
  });

  it('works with no LLM at all', async () => {
    const r = await explainMistake(ctx);
    expect(r.source).toBe('template');
    expect(r.explanation.explanation).toContain('d4');
  });
});

describe('GeminiClient', () => {
  it('sends the prompt and reads the text part', async () => {
    let seenUrl = '';
    let seenBody = '';
    const client = new GeminiClient({
      apiKey: 'k',
      model: 'test-model',
      fetch: (url, init) => {
        seenUrl = url;
        seenBody = init.body;
        return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ candidates: [{ content: { parts: [{ text: GOOD }] } }] })) });
      },
    });
    expect(await client.complete('sys', 'usr')).toBe(GOOD);
    expect(seenUrl).toContain('models/test-model:generateContent');
    expect(JSON.parse(seenBody).systemInstruction.parts[0].text).toBe('sys');
  });

  it('turns HTTP errors into LlmError', async () => {
    const client = new GeminiClient({ apiKey: 'k', fetch: () => Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve('quota') }) });
    await expect(client.complete('s', 'u')).rejects.toThrow(/429/);
  });
});

describe('OpenRouterClient', () => {
  it('posts a chat completion to the free router and reads the content', async () => {
    const { OpenRouterClient, DEFAULT_OPENROUTER_MODEL } = await import('../explain');
    let seen: { url: string; body: string; auth: string } = { url: '', body: '', auth: '' };
    const client = new OpenRouterClient({
      apiKey: 'sk-or-test',
      fetch: (url, init) => {
        seen = { url, body: init.body, auth: init.headers.Authorization ?? '' };
        return Promise.resolve({
          ok: true,
          status: 200,
          text: () => Promise.resolve(JSON.stringify({ model: 'some/model:free', choices: [{ message: { content: GOOD } }] })),
        });
      },
    });
    expect(await client.complete('sys', 'usr')).toBe(GOOD);
    expect(seen.url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(seen.auth).toBe('Bearer sk-or-test');
    const body = JSON.parse(seen.body);
    expect(body.model).toBe(DEFAULT_OPENROUTER_MODEL);
    expect(body.messages[0]).toEqual({ role: 'system', content: 'sys' });
    expect(client.lastModel).toBe('some/model:free');
  });

  it('turns rate limits into LlmError so the pipeline falls back to the template', async () => {
    const { OpenRouterClient } = await import('../explain');
    const client = new OpenRouterClient({ apiKey: 'k', fetch: () => Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve('rate limited') }) });
    await expect(client.complete('s', 'u')).rejects.toThrow(/429/);
    const r = await explainMistake(fixture('hang-knight-d4').ctx, { llm: client });
    expect(r.source).toBe('template');
  });
});

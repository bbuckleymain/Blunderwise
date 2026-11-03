import type { Explanation } from './types';

/** Injectable key/value storage (memory in tests, SQLite in the app). */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export class MemoryStore implements KeyValueStore {
  private readonly map = new Map<string, string>();
  get(key: string): Promise<string | null> {
    return Promise.resolve(this.map.get(key) ?? null);
  }
  set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
    return Promise.resolve();
  }
  get size(): number {
    return this.map.size;
  }
}

/** 64-bit string hash (cyrb53 variant), pure TS so it runs in the renderer, main or tests. */
export function hashString(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export function cacheKey(fen: string, moveUci: string, promptVersion: string): string {
  return `explain:${hashString(`${fen}|${moveUci}|${promptVersion}`)}`;
}

export class ExplanationCache {
  constructor(private readonly store: KeyValueStore) {}

  async get(key: string): Promise<Explanation | null> {
    const raw = await this.store.get(key);
    if (raw === null) return null;
    try {
      const v = JSON.parse(raw) as Explanation;
      return typeof v.headline === 'string' ? v : null;
    } catch {
      return null;
    }
  }

  set(key: string, value: Explanation): Promise<void> {
    return this.store.set(key, JSON.stringify(value));
  }
}

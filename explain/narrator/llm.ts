/** Anything that can turn a system + user prompt into text. */
export interface LlmClient {
  complete(system: string, user: string): Promise<string>;
}

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

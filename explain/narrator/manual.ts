import type { LlmClient } from './llm';

/** Join the two prompt halves into one block a person can paste into any chat model. */
export function toCopyablePrompt(system: string, user: string): string {
  return `${system}\n\n---\n\n${user}\n\nReply with the JSON object only.`;
}

/**
 * "Copy prompt" fallback: hands the prompt to the UI (which shows a copy button)
 * and resolves with whatever the user pastes back.
 */
export class ManualLlmClient implements LlmClient {
  constructor(private readonly ask: (copyablePrompt: string) => Promise<string>) {}

  complete(system: string, user: string): Promise<string> {
    return this.ask(toCopyablePrompt(system, user));
  }
}

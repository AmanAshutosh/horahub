/**
 * Provider-agnostic LLM client interface (Phase C1).
 *
 * The Narrative Engine's writing layer (src/llm/prompts/*, orchestrated by
 * narrative.service.ts once Phase D lands) should depend only on this
 * interface, never on a concrete SDK — the provider is swapped via
 * env.LLM_PROVIDER (see src/llm/index.ts), matching the exact pattern
 * already used for ephemeris provider selection
 * (src/ephemeris/provider.ts).
 */

export interface LlmGenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

export interface LlmClient {
  readonly id: string;
  generate(prompt: string, opts?: LlmGenerateOptions): Promise<string>;
}

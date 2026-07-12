import 'server-only';
import type { LlmClient } from './client';
import { anthropicLlmClient } from './providers/anthropic';
import { env } from '@/config';

/**
 * Selects the active LLM client from configuration
 * (env.LLM_PROVIDER — currently only "anthropic" is implemented, but the
 * enum in src/config/env.ts is written to be extended). Everything above
 * this seam (prompt builders, orchestration) depends only on the LlmClient
 * interface, never on a concrete SDK.
 */
function loadLlmClient(): LlmClient {
  switch (env.LLM_PROVIDER) {
    case 'anthropic':
    default:
      return anthropicLlmClient;
  }
}

export const llmClient: LlmClient = loadLlmClient();

export type { LlmClient, LlmGenerateOptions } from './client';
export { NARRATIVE_SYSTEM_PROMPT, PROMPT_VERSION } from './prompts/narrative-system';

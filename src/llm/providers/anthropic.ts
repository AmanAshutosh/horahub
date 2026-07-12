import 'server-only';
import type { LlmClient, LlmGenerateOptions } from '../client';
import { env } from '@/config';

const DEFAULT_MAX_TOKENS = 4096;

/**
 * Anthropic adapter for LlmClient. The SDK is imported lazily inside
 * generate() rather than at module top-level — mirrors
 * src/ephemeris/provider.ts's rationale for lazily requiring the native
 * `sweph` module: this module must be importable (e.g. by
 * src/llm/index.ts's provider-selection logic, or by tests) even in an
 * environment where ANTHROPIC_API_KEY isn't set yet and no call will ever
 * actually be made.
 */
export class AnthropicLlmClient implements LlmClient {
  readonly id = 'anthropic';

  async generate(prompt: string, opts: LlmGenerateOptions = {}): Promise<string> {
    if (!env.ANTHROPIC_API_KEY) {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured. Set it in .env.local to use the LLM report-writing layer.',
      );
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: opts.model ?? env.ANTHROPIC_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: opts.temperature,
      system: opts.system,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Anthropic response contained no text content block.');
    }
    return textBlock.text;
  }
}

export const anthropicLlmClient: LlmClient = new AnthropicLlmClient();

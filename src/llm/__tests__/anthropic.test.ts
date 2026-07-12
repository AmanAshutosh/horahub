/**
 * Unit tests for the Anthropic LlmClient adapter — mocks both @/config
 * (to control ANTHROPIC_API_KEY without touching real environment state)
 * and @anthropic-ai/sdk (no real network calls in tests).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AnthropicLlmClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doUnmock('@/config');
    vi.doUnmock('@anthropic-ai/sdk');
  });

  it('throws a clear, actionable error when ANTHROPIC_API_KEY is not configured', async () => {
    vi.doMock('@/config', () => ({ env: { ANTHROPIC_API_KEY: undefined, ANTHROPIC_MODEL: 'claude-sonnet-5' } }));
    const { AnthropicLlmClient } = await import('../providers/anthropic');
    const client = new AnthropicLlmClient();
    await expect(client.generate('hello')).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it('calls the SDK with the prompt/options and returns the text content block', async () => {
    const createMock = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'Generated report text' }] });
    vi.doMock('@/config', () => ({ env: { ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_MODEL: 'claude-sonnet-5' } }));
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: vi.fn().mockImplementation(() => ({ messages: { create: createMock } })),
    }));

    const { AnthropicLlmClient } = await import('../providers/anthropic');
    const client = new AnthropicLlmClient();
    const result = await client.generate('Write a report', { system: 'You are an astrologer', maxTokens: 100 });

    expect(result).toBe('Generated report text');
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-5',
        max_tokens: 100,
        system: 'You are an astrologer',
        messages: [{ role: 'user', content: 'Write a report' }],
      }),
    );
  });

  it('falls back to env.ANTHROPIC_MODEL and a default max_tokens when opts are omitted', async () => {
    const createMock = vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    vi.doMock('@/config', () => ({ env: { ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_MODEL: 'claude-sonnet-5' } }));
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: vi.fn().mockImplementation(() => ({ messages: { create: createMock } })),
    }));

    const { AnthropicLlmClient } = await import('../providers/anthropic');
    await new AnthropicLlmClient().generate('hello');

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-sonnet-5', max_tokens: 4096 }),
    );
  });

  it('throws when the response contains no text content block', async () => {
    const createMock = vi.fn().mockResolvedValue({ content: [{ type: 'tool_use' }] });
    vi.doMock('@/config', () => ({ env: { ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_MODEL: 'claude-sonnet-5' } }));
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: vi.fn().mockImplementation(() => ({ messages: { create: createMock } })),
    }));

    const { AnthropicLlmClient } = await import('../providers/anthropic');
    await expect(new AnthropicLlmClient().generate('hello')).rejects.toThrow(/no text content/);
  });
});

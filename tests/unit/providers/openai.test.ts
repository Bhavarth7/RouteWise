import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenAIProvider } from '../../../src/providers/openai.js';

// Mock the OpenAI SDK
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Generated response' } }],
            usage: { prompt_tokens: 12, completion_tokens: 8 },
          }),
        },
      };
    },
  };
});

describe('OpenAIProvider', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('has correct name', () => {
    const provider = new OpenAIProvider('test-key');
    expect(provider.name).toBe('openai');
  });

  it('is available when API key is provided', () => {
    const provider = new OpenAIProvider('test-key');
    expect(provider.isAvailable()).toBe(true);
  });

  it('is not available when no API key', () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const provider = new OpenAIProvider(undefined);
    expect(provider.isAvailable()).toBe(false);
  });

  it('lists supported models', () => {
    const provider = new OpenAIProvider('test-key');
    const models = provider.listModels();
    expect(models).toContain('gpt-5.5');
    expect(models).toContain('o3');
    expect(models).toContain('gpt-4.1');
  });

  it('completes a prompt and returns structured response', async () => {
    const provider = new OpenAIProvider('test-key');
    const response = await provider.complete('Hello');

    expect(response.content).toBe('Generated response');
    expect(response.provider).toBe('openai');
    expect(response.model).toBe('gpt-4.1');
    expect(response.tokenUsage.inputTokens).toBe(12);
    expect(response.tokenUsage.outputTokens).toBe(8);
    expect(response.tokenUsage.totalTokens).toBe(20);
    expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    expect(response.costUsd).toBeGreaterThan(0);
  });

  it('completes with a specific model', async () => {
    const provider = new OpenAIProvider('test-key');
    const response = await provider.completeWithModel('gpt-5.5', 'Hello');

    expect(response.model).toBe('gpt-5.5');
  });

  it('throws when not configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const provider = new OpenAIProvider(undefined);

    await expect(provider.complete('Hello')).rejects.toThrow('OpenAI provider is not configured');
  });
});

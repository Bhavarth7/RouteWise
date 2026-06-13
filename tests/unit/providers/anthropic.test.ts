import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnthropicProvider } from '../../../src/providers/anthropic.js';

// Mock the Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Hello, world!' }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      };
    },
  };
});

describe('AnthropicProvider', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('has correct name', () => {
    const provider = new AnthropicProvider('test-key');
    expect(provider.name).toBe('anthropic');
  });

  it('is available when API key is provided', () => {
    const provider = new AnthropicProvider('test-key');
    expect(provider.isAvailable()).toBe(true);
  });

  it('is not available when no API key', () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const provider = new AnthropicProvider(undefined);
    expect(provider.isAvailable()).toBe(false);
  });

  it('lists supported models', () => {
    const provider = new AnthropicProvider('test-key');
    const models = provider.listModels();
    expect(models).toContain('claude-opus-4.8');
    expect(models).toContain('claude-sonnet-4.6');
    expect(models).toContain('claude-haiku-4.5');
  });

  it('completes a prompt and returns structured response', async () => {
    const provider = new AnthropicProvider('test-key');
    const response = await provider.complete('Hello');

    expect(response.content).toBe('Hello, world!');
    expect(response.provider).toBe('anthropic');
    expect(response.model).toBe('claude-sonnet-4.6');
    expect(response.tokenUsage.inputTokens).toBe(10);
    expect(response.tokenUsage.outputTokens).toBe(5);
    expect(response.tokenUsage.totalTokens).toBe(15);
    expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    expect(response.costUsd).toBeGreaterThan(0);
  });

  it('completes with a specific model', async () => {
    const provider = new AnthropicProvider('test-key');
    const response = await provider.completeWithModel('claude-haiku-4.5', 'Hello');

    expect(response.model).toBe('claude-haiku-4.5');
  });

  it('throws when not configured', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const provider = new AnthropicProvider(undefined);

    await expect(provider.complete('Hello')).rejects.toThrow(
      'Anthropic provider is not configured',
    );
  });
});

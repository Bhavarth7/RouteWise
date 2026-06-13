import { describe, expect, it, vi } from 'vitest';
import { execute } from '../../../src/core/executor.js';
import type { Provider } from '../../../src/providers/interface.js';
import type { ModelInfo, RoutingDecision } from '../../../src/types/index.js';

const mockModel: ModelInfo = {
  id: 'test-model',
  provider: 'test',
  capabilities: ['reasoning'],
  costPer1kTokens: 0.003,
  p95LatencyMs: 3000,
  qualityScore: 0.9,
  contextWindow: 200000,
  supportsStructuredOutput: true,
};

const mockDecision: RoutingDecision = {
  model: mockModel,
  reason: 'best-fit',
  confidence: 0.9,
};

function createMockProvider(response = 'Mock response'): Provider {
  return {
    name: 'test',
    complete: vi.fn(),
    completeWithModel: vi.fn().mockResolvedValue({
      content: response,
      tokenUsage: { inputTokens: 50, outputTokens: 30, totalTokens: 80 },
      latencyMs: 1200,
      costUsd: 0.00024,
      model: 'test-model',
      provider: 'test',
    }),
    isAvailable: () => true,
    listModels: () => ['test-model'],
  };
}

describe('executor', () => {
  it('executes a step and returns structured result', async () => {
    const provider = createMockProvider();
    const result = await execute('step_001', 'Write hello world', mockDecision, provider);

    expect(result.stepId).toBe('step_001');
    expect(result.output).toBe('Mock response');
    expect(result.model).toBe('test-model');
    expect(result.provider).toBe('test');
    expect(result.tokenUsage.totalTokens).toBe(80);
    expect(result.latencyMs).toBe(1200);
    expect(result.costUsd).toBe(0.00024);
  });

  it('prepends context to prompt when provided', async () => {
    const provider = createMockProvider();
    await execute('step_001', 'Do the thing', mockDecision, provider, {
      context: 'Previous step output here',
    });

    expect(provider.completeWithModel).toHaveBeenCalledWith(
      'test-model',
      expect.stringContaining('Previous step output here'),
      expect.anything(),
    );
    expect(provider.completeWithModel).toHaveBeenCalledWith(
      'test-model',
      expect.stringContaining('Do the thing'),
      expect.anything(),
    );
  });

  it('passes options to provider', async () => {
    const provider = createMockProvider();
    await execute('step_001', 'Generate JSON', mockDecision, provider, {
      system: 'You are a helper',
      maxTokens: 2048,
      temperature: 0.3,
      jsonMode: true,
    });

    expect(provider.completeWithModel).toHaveBeenCalledWith('test-model', 'Generate JSON', {
      system: 'You are a helper',
      maxTokens: 2048,
      temperature: 0.3,
      jsonMode: true,
    });
  });

  it('retries once on failure then succeeds', async () => {
    const provider = createMockProvider();
    (provider.completeWithModel as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('Rate limited'))
      .mockResolvedValueOnce({
        content: 'Retry succeeded',
        tokenUsage: { inputTokens: 50, outputTokens: 30, totalTokens: 80 },
        latencyMs: 2000,
        costUsd: 0.00024,
        model: 'test-model',
        provider: 'test',
      });

    const result = await execute('step_001', 'Hello', mockDecision, provider);
    expect(result.output).toBe('Retry succeeded');
    expect(provider.completeWithModel).toHaveBeenCalledTimes(2);
  });

  it('throws descriptive error after retry failure', async () => {
    const provider = createMockProvider();
    (provider.completeWithModel as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Service unavailable'),
    );

    await expect(execute('step_001', 'Hello', mockDecision, provider)).rejects.toThrow(
      /Step step_001 failed after retry.*Service unavailable/,
    );
  });
});

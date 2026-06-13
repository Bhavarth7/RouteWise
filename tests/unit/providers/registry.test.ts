import { describe, expect, it } from 'vitest';
import type { Provider } from '../../../src/providers/interface.js';
import { ProviderRegistry } from '../../../src/providers/registry.js';
import type { ModelInfo } from '../../../src/types/routing.js';

function createMockProvider(name: string, available = true): Provider {
  return {
    name,
    complete: async () => ({
      content: '',
      tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      latencyMs: 0,
      costUsd: 0,
      model: 'mock',
      provider: name,
    }),
    completeWithModel: async () => ({
      content: '',
      tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      latencyMs: 0,
      costUsd: 0,
      model: 'mock',
      provider: name,
    }),
    isAvailable: () => available,
    listModels: () => ['mock-model'],
  };
}

function createModelInfo(overrides: Partial<ModelInfo> = {}): ModelInfo {
  return {
    id: 'test-model',
    provider: 'test',
    capabilities: ['reasoning', 'code-gen'],
    costPer1kTokens: 0.003,
    p95LatencyMs: 3000,
    qualityScore: 0.9,
    contextWindow: 200000,
    supportsStructuredOutput: true,
    ...overrides,
  };
}

describe('ProviderRegistry', () => {
  it('registers and retrieves a provider', () => {
    const registry = new ProviderRegistry();
    const provider = createMockProvider('anthropic');

    registry.registerProvider(provider);

    expect(registry.getProvider('anthropic')).toBe(provider);
    expect(registry.getProviderNames()).toContain('anthropic');
  });

  it('returns undefined for unregistered provider', () => {
    const registry = new ProviderRegistry();
    expect(registry.getProvider('nonexistent')).toBeUndefined();
  });

  it('registers and retrieves a model', () => {
    const registry = new ProviderRegistry();
    const model = createModelInfo({ id: 'claude-sonnet-4-20250514', provider: 'anthropic' });

    registry.registerModel(model);

    expect(registry.getModel('claude-sonnet-4-20250514')).toBe(model);
  });

  it('returns undefined for unregistered model', () => {
    const registry = new ProviderRegistry();
    expect(registry.getModel('nonexistent')).toBeUndefined();
  });

  it('filters models by capability', () => {
    const registry = new ProviderRegistry();
    registry.registerModel(
      createModelInfo({
        id: 'model-a',
        capabilities: ['reasoning', 'code-gen', 'writing'],
      }),
    );
    registry.registerModel(
      createModelInfo({
        id: 'model-b',
        capabilities: ['summarization', 'editing'],
      }),
    );
    registry.registerModel(
      createModelInfo({
        id: 'model-c',
        capabilities: ['reasoning', 'summarization'],
      }),
    );

    const reasoningModels = registry.getModelsForCapability('reasoning');
    expect(reasoningModels).toHaveLength(2);
    expect(reasoningModels.map((m) => m.id)).toContain('model-a');
    expect(reasoningModels.map((m) => m.id)).toContain('model-c');

    const summaryModels = registry.getModelsForCapability('summarization');
    expect(summaryModels).toHaveLength(2);
    expect(summaryModels.map((m) => m.id)).toContain('model-b');
    expect(summaryModels.map((m) => m.id)).toContain('model-c');
  });

  it('filters models by provider', () => {
    const registry = new ProviderRegistry();
    registry.registerModel(createModelInfo({ id: 'model-a', provider: 'anthropic' }));
    registry.registerModel(createModelInfo({ id: 'model-b', provider: 'openai' }));
    registry.registerModel(createModelInfo({ id: 'model-c', provider: 'anthropic' }));

    const anthropicModels = registry.getModelsByProvider('anthropic');
    expect(anthropicModels).toHaveLength(2);
    expect(anthropicModels.map((m) => m.id)).toContain('model-a');
    expect(anthropicModels.map((m) => m.id)).toContain('model-c');
  });

  it('returns all registered models', () => {
    const registry = new ProviderRegistry();
    registry.registerModel(createModelInfo({ id: 'model-a' }));
    registry.registerModel(createModelInfo({ id: 'model-b' }));

    expect(registry.getAllModels()).toHaveLength(2);
  });

  it('checks provider availability', () => {
    const registry = new ProviderRegistry();
    registry.registerProvider(createMockProvider('available-provider', true));
    registry.registerProvider(createMockProvider('unavailable-provider', false));

    expect(registry.isProviderAvailable('available-provider')).toBe(true);
    expect(registry.isProviderAvailable('unavailable-provider')).toBe(false);
    expect(registry.isProviderAvailable('nonexistent')).toBe(false);
  });
});

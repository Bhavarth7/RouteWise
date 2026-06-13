import { describe, expect, it } from 'vitest';
import { selectModel } from '../../../src/core/selector.js';
import { ProviderRegistry } from '../../../src/providers/registry.js';
import type {
  ModelInfo,
  RoutingConstraints,
  StepClassification,
} from '../../../src/types/index.js';

function createRegistry(...models: ModelInfo[]): ProviderRegistry {
  const registry = new ProviderRegistry();
  for (const model of models) {
    registry.registerModel(model);
  }
  return registry;
}

const sonnet: ModelInfo = {
  id: 'claude-sonnet-4-20250514',
  provider: 'anthropic',
  capabilities: ['reasoning', 'code-gen', 'writing'],
  costPer1kTokens: 0.003,
  p95LatencyMs: 3000,
  qualityScore: 0.92,
  contextWindow: 200000,
  supportsStructuredOutput: true,
};

const gpt4o: ModelInfo = {
  id: 'gpt-4o',
  provider: 'openai',
  capabilities: ['reasoning', 'code-gen', 'writing', 'research'],
  costPer1kTokens: 0.0025,
  p95LatencyMs: 2500,
  qualityScore: 0.9,
  contextWindow: 128000,
  supportsStructuredOutput: true,
};

const gpt4oMini: ModelInfo = {
  id: 'gpt-4o-mini',
  provider: 'openai',
  capabilities: ['summarization', 'editing', 'writing', 'reasoning'],
  costPer1kTokens: 0.00015,
  p95LatencyMs: 1500,
  qualityScore: 0.75,
  contextWindow: 128000,
  supportsStructuredOutput: true,
};

const defaultConstraints: RoutingConstraints = {
  maxCostPer1kTokens: 0.02,
  maxLatencyMs: 30000,
  maxCostPerRun: 0.5,
  preferredProviders: ['anthropic', 'openai'],
  privacyLevel: 'standard',
};

describe('selector', () => {
  it('selects user-preferred model when it meets constraints', () => {
    const registry = createRegistry(sonnet, gpt4o, gpt4oMini);
    const classification: StepClassification = { type: 'reasoning', confidence: 0.9 };

    const result = selectModel(classification, defaultConstraints, registry, {
      reasoning: { prefer: 'claude-sonnet-4-20250514', fallback: 'gpt-4o' },
    });

    expect(result.model.id).toBe('claude-sonnet-4-20250514');
    expect(result.reason).toBe('user-preferred');
    expect(result.confidence).toBe(0.95);
  });

  it('falls back to fallback model when preferred does not meet constraints', () => {
    const registry = createRegistry(sonnet, gpt4o, gpt4oMini);
    const tightConstraints: RoutingConstraints = {
      ...defaultConstraints,
      maxCostPer1kTokens: 0.0026, // Sonnet at 0.003 exceeds this
    };
    const classification: StepClassification = { type: 'reasoning', confidence: 0.9 };

    const result = selectModel(classification, tightConstraints, registry, {
      reasoning: { prefer: 'claude-sonnet-4-20250514', fallback: 'gpt-4o' },
    });

    expect(result.model.id).toBe('gpt-4o');
    expect(result.reason).toBe('fallback');
  });

  it('selects best-fit model by quality when no preference configured', () => {
    const registry = createRegistry(sonnet, gpt4o, gpt4oMini);
    const classification: StepClassification = { type: 'code-gen', confidence: 0.9 };

    const result = selectModel(classification, defaultConstraints, registry);

    // Sonnet has highest quality score for code-gen
    expect(result.model.id).toBe('claude-sonnet-4-20250514');
    expect(result.reason).toBe('best-fit');
    expect(result.confidence).toBe(0.9);
  });

  it('selects cheaper model when budget is tight', () => {
    const registry = createRegistry(sonnet, gpt4o, gpt4oMini);
    const tightBudget: RoutingConstraints = {
      ...defaultConstraints,
      maxCostPer1kTokens: 0.001, // Only gpt-4o-mini fits
    };
    const classification: StepClassification = { type: 'summarization', confidence: 0.9 };

    const result = selectModel(classification, tightBudget, registry);

    expect(result.model.id).toBe('gpt-4o-mini');
  });

  it('relaxes latency constraint when no model fits', () => {
    const registry = createRegistry(sonnet, gpt4o);
    const tightLatency: RoutingConstraints = {
      ...defaultConstraints,
      maxLatencyMs: 100, // No model fits this
    };
    const classification: StepClassification = { type: 'reasoning', confidence: 0.9 };

    const result = selectModel(classification, tightLatency, registry);

    expect(result.reason).toBe('relaxed-latency');
    expect(result.confidence).toBeLessThan(0.9);
  });

  it('respects preferred providers filter', () => {
    const registry = createRegistry(sonnet, gpt4o, gpt4oMini);
    const onlyOpenAI: RoutingConstraints = {
      ...defaultConstraints,
      preferredProviders: ['openai'],
    };
    const classification: StepClassification = { type: 'reasoning', confidence: 0.9 };

    const result = selectModel(classification, onlyOpenAI, registry);

    expect(result.model.provider).toBe('openai');
  });

  it('throws when registry is completely empty', () => {
    const registry = createRegistry();
    const classification: StepClassification = { type: 'reasoning', confidence: 0.9 };

    expect(() => selectModel(classification, defaultConstraints, registry)).toThrow(
      'No models available',
    );
  });

  it('returns only-option when no models match capability', () => {
    // Only register a model that does NOT support the classified type
    const registry = createRegistry(gpt4oMini); // supports summarization, editing, writing, reasoning
    const classification: StepClassification = { type: 'code-gen', confidence: 0.9 };

    // gpt4oMini doesn't have code-gen capability, but it's the only model
    const result = selectModel(classification, defaultConstraints, registry);
    expect(result.reason).toBe('only-option');
    expect(result.confidence).toBe(0.3);
  });
});

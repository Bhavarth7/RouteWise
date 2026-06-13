import { describe, expect, it } from 'vitest';
import type { ModelInfo, RoutingConstraints, StepType } from '../../../src/types/index.js';

describe('types', () => {
  it('StepType accepts valid values', () => {
    const types: StepType[] = [
      'reasoning',
      'code-gen',
      'summarization',
      'writing',
      'research',
      'editing',
    ];
    expect(types).toHaveLength(6);
  });

  it('RoutingConstraints shape is correct', () => {
    const constraints: RoutingConstraints = {
      maxCostPer1kTokens: 0.01,
      maxLatencyMs: 5000,
      maxCostPerRun: 0.5,
      preferredProviders: ['anthropic', 'openai'],
      privacyLevel: 'standard',
    };
    expect(constraints.preferredProviders).toContain('anthropic');
  });

  it('ModelInfo shape is correct', () => {
    const model: ModelInfo = {
      id: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      capabilities: ['reasoning', 'code-gen', 'writing'],
      costPer1kTokens: 0.003,
      p95LatencyMs: 3000,
      qualityScore: 0.92,
      contextWindow: 200000,
      supportsStructuredOutput: true,
    };
    expect(model.capabilities).toContain('reasoning');
  });
});

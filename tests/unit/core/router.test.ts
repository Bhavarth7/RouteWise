import { describe, expect, it, vi } from 'vitest';
import type { RoutewiseConfig } from '../../../src/config/schema.js';
import { Router } from '../../../src/core/router.js';
import type { Provider } from '../../../src/providers/interface.js';
import { ProviderRegistry } from '../../../src/providers/registry.js';
import type { ModelInfo } from '../../../src/types/index.js';

const mockModel: ModelInfo = {
  id: 'test-model',
  provider: 'test-provider',
  capabilities: ['reasoning', 'code-gen', 'writing', 'summarization', 'research', 'editing'],
  costPer1kTokens: 0.003,
  p95LatencyMs: 3000,
  qualityScore: 0.9,
  contextWindow: 200000,
  supportsStructuredOutput: true,
};

function createMockProvider(): Provider {
  return {
    name: 'test-provider',
    complete: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        steps: [
          {
            id: 'step_001',
            type: 'reasoning',
            goal: 'Plan',
            inputs: ['task'],
            expectedOutput: 'Plan document',
          },
          {
            id: 'step_002',
            type: 'code-gen',
            goal: 'Implement',
            inputs: ['step_001'],
            expectedOutput: 'Code',
          },
        ],
      }),
      tokenUsage: { inputTokens: 50, outputTokens: 100, totalTokens: 150 },
      latencyMs: 1000,
      costUsd: 0.001,
      model: 'test-model',
      provider: 'test-provider',
    }),
    completeWithModel: vi.fn().mockResolvedValue({
      content:
        '1. First, we plan the architecture\n2. Then implement the core logic\n3. Add error handling\n4. Write comprehensive tests\n5. Deploy to staging',
      tokenUsage: { inputTokens: 30, outputTokens: 60, totalTokens: 90 },
      latencyMs: 800,
      costUsd: 0.0005,
      model: 'test-model',
      provider: 'test-provider',
    }),
    isAvailable: () => true,
    listModels: () => ['test-model'],
  };
}

function createTestConfig(): RoutewiseConfig {
  return {
    providers: {},
    constraints: {
      maxCostPerRun: 0.5,
      maxCostPer1kTokens: 0.02,
      maxLatencyPerStep: 30000,
      preferredProviders: ['test-provider'],
      privacyLevel: 'standard',
    },
    routing: {},
    trace: {
      store: 'local',
      directory: '.routewise/runs',
    },
  };
}

describe('Router', () => {
  it('runs a full workflow and returns results', async () => {
    const registry = new ProviderRegistry();
    const provider = createMockProvider();
    registry.registerProvider(provider);
    registry.registerModel(mockModel);

    const config = createTestConfig();
    const router = new Router(config, registry);

    const result = await router.run('Build a todo app');

    expect(result.runId).toMatch(/^run_\d{8}_[a-z0-9]+$/);
    expect(result.task).toBe('Build a todo app');
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.totalCostUsd).toBeGreaterThanOrEqual(0);
    expect(result.totalLatencyMs).toBeGreaterThan(0);
    expect(result.status).toBe('completed');
  });

  it('calls onStepComplete callback for each step', async () => {
    const registry = new ProviderRegistry();
    const provider = createMockProvider();
    registry.registerProvider(provider);
    registry.registerModel(mockModel);

    const config = createTestConfig();
    const router = new Router(config, registry);
    const stepResults: unknown[] = [];

    await router.run('Build something', {
      onStepComplete: (step) => {
        stepResults.push(step);
      },
    });

    expect(stepResults.length).toBeGreaterThan(0);
  });

  it('handles step failures gracefully', async () => {
    const registry = new ProviderRegistry();
    const provider: Provider = {
      name: 'test-provider',
      complete: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          steps: [
            {
              id: 'step_001',
              type: 'reasoning',
              goal: 'Plan',
              inputs: ['task'],
              expectedOutput: 'Plan',
            },
          ],
        }),
        tokenUsage: { inputTokens: 10, outputTokens: 10, totalTokens: 20 },
        latencyMs: 100,
        costUsd: 0.0001,
        model: 'test-model',
        provider: 'test-provider',
      }),
      completeWithModel: vi.fn().mockRejectedValue(new Error('API down')),
      isAvailable: () => true,
      listModels: () => ['test-model'],
    };
    registry.registerProvider(provider);
    registry.registerModel(mockModel);

    const config = createTestConfig();
    const router = new Router(config, registry);

    const result = await router.run('Do something');

    expect(result.status).toBe('failed');
    expect(result.steps[0]?.evaluation.passed).toBe(false);
  });

  it('executes a single step', async () => {
    const registry = new ProviderRegistry();
    const provider = createMockProvider();
    registry.registerProvider(provider);
    registry.registerModel(mockModel);

    const config = createTestConfig();
    const router = new Router(config, registry);

    const result = await router.step('Plan the architecture');

    expect(result.stepId).toBe('step_single');
    expect(result.classification.type).toBeDefined();
    expect(result.decision.model.id).toBe('test-model');
    expect(result.result.output).toBeTruthy();
  });

  it('accepts explicit step type override', async () => {
    const registry = new ProviderRegistry();
    const provider = createMockProvider();
    registry.registerProvider(provider);
    registry.registerModel(mockModel);

    const config = createTestConfig();
    const router = new Router(config, registry);

    const result = await router.step('Generate the handler', { type: 'code-gen' });

    expect(result.classification.type).toBe('code-gen');
    expect(result.classification.confidence).toBe(1.0);
  });
});

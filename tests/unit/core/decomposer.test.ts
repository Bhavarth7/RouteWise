import { describe, expect, it, vi } from 'vitest';
import { decompose, getTemplateSteps, parseDecomposition } from '../../../src/core/decomposer.js';
import type { Provider } from '../../../src/providers/interface.js';

function createMockProvider(responseContent: string): Provider {
  return {
    name: 'test',
    complete: vi.fn().mockResolvedValue({
      content: responseContent,
      tokenUsage: { inputTokens: 50, outputTokens: 100, totalTokens: 150 },
      latencyMs: 1000,
      costUsd: 0.001,
      model: 'test-model',
      provider: 'test',
    }),
    completeWithModel: vi.fn(),
    isAvailable: () => true,
    listModels: () => ['test-model'],
  };
}

describe('decomposer', () => {
  describe('decompose with model', () => {
    it('uses model response when available', async () => {
      const mockResponse = JSON.stringify({
        steps: [
          {
            id: 'step_001',
            type: 'reasoning',
            goal: 'Plan the work',
            inputs: ['user task'],
            expectedOutput: 'A plan',
          },
          {
            id: 'step_002',
            type: 'code-gen',
            goal: 'Implement',
            inputs: ['step_001'],
            expectedOutput: 'Code',
          },
        ],
      });
      const provider = createMockProvider(mockResponse);

      const result = await decompose('Build a todo app', provider);

      expect(result.steps).toHaveLength(2);
      expect(result.steps[0]?.type).toBe('reasoning');
      expect(result.steps[1]?.type).toBe('code-gen');
    });

    it('falls back to template when model fails', async () => {
      const provider: Provider = {
        name: 'test',
        complete: vi.fn().mockRejectedValue(new Error('API error')),
        completeWithModel: vi.fn(),
        isAvailable: () => true,
        listModels: () => [],
      };

      const result = await decompose('Build a REST API service', provider);

      // Should match the "build app" template
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps[0]?.type).toBe('reasoning');
    });

    it('falls back to template when model returns invalid JSON', async () => {
      const provider = createMockProvider('This is not JSON at all');

      const result = await decompose('Build a CLI tool', provider);

      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('uses template when no provider given', async () => {
      const result = await decompose('Build an application');
      expect(result.steps.length).toBeGreaterThan(0);
    });
  });

  describe('getTemplateSteps', () => {
    it('matches build/create app pattern', () => {
      const steps = getTemplateSteps('Build a REST API service');
      expect(steps).toHaveLength(5);
      expect(steps[0]?.type).toBe('reasoning');
      expect(steps[2]?.type).toBe('code-gen');
      expect(steps[4]?.type).toBe('writing');
    });

    it('matches documentation pattern', () => {
      const steps = getTemplateSteps('Write documentation for the project');
      expect(steps).toHaveLength(4);
      expect(steps[0]?.type).toBe('research');
      expect(steps[2]?.type).toBe('writing');
      expect(steps[3]?.type).toBe('editing');
    });

    it('matches test pattern', () => {
      const steps = getTemplateSteps('Write tests for the auth module');
      expect(steps).toHaveLength(3);
      expect(steps[0]?.type).toBe('research');
      expect(steps[2]?.type).toBe('code-gen');
    });

    it('returns generic template for unrecognized tasks', () => {
      const steps = getTemplateSteps('Something very unusual that matches nothing');
      expect(steps).toHaveLength(3);
    });
  });

  describe('parseDecomposition', () => {
    it('parses valid JSON', () => {
      const json = JSON.stringify({
        steps: [
          {
            id: 'step_001',
            type: 'reasoning',
            goal: 'Think',
            inputs: ['task'],
            expectedOutput: 'Plan',
          },
        ],
      });
      const result = parseDecomposition(json);
      expect(result).not.toBeNull();
      expect(result?.steps).toHaveLength(1);
    });

    it('strips markdown fences', () => {
      const json =
        '```json\n{"steps": [{"id": "step_001", "type": "writing", "goal": "Write", "inputs": [], "expectedOutput": "Text"}]}\n```';
      const result = parseDecomposition(json);
      expect(result).not.toBeNull();
      expect(result?.steps[0]?.type).toBe('writing');
    });

    it('returns null for invalid JSON', () => {
      const result = parseDecomposition('not json');
      expect(result).toBeNull();
    });

    it('returns null when steps array is missing', () => {
      const result = parseDecomposition('{"something": "else"}');
      expect(result).toBeNull();
    });

    it('defaults invalid step types to reasoning', () => {
      const json = JSON.stringify({
        steps: [
          { id: 'step_001', type: 'invalid', goal: 'Do', inputs: [], expectedOutput: 'Done' },
        ],
      });
      const result = parseDecomposition(json);
      expect(result?.steps[0]?.type).toBe('reasoning');
    });

    it('generates IDs when missing', () => {
      const json = JSON.stringify({
        steps: [{ type: 'writing', goal: 'Write', inputs: [], expectedOutput: 'Text' }],
      });
      const result = parseDecomposition(json);
      expect(result?.steps[0]?.id).toBe('step_001');
    });
  });
});

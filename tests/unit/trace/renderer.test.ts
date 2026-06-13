import { describe, expect, it } from 'vitest';
import { renderSummary, renderTrace } from '../../../src/trace/renderer.js';
import type { FullTrace } from '../../../src/trace/types.js';

function createTrace(): FullTrace {
  return {
    metadata: {
      runId: 'run_20250613_abc123',
      task: 'Build a todo app',
      startedAt: '2025-06-13T10:00:00Z',
      completedAt: '2025-06-13T10:04:32Z',
      status: 'completed',
      totalSteps: 2,
      totalCostUsd: 0.034,
      totalLatencyMs: 8400,
      constraints: { maxCostPerRun: 0.5 },
      humanVerdict: null,
    },
    steps: [
      {
        stepId: 'step_001',
        runId: 'run_20250613_abc123',
        type: 'reasoning',
        goal: 'Plan the architecture',
        inputs: ['user task'],
        expectedOutput: 'Technical plan',
        model: 'claude-sonnet-4-20250514',
        provider: 'anthropic',
        reason: 'best-fit',
        confidence: 0.9,
        costUsd: 0.008,
        latencyMs: 4200,
        evaluation: { passed: true, checks: ['ordered-items: OK'], humanVerdict: null },
        humanVerdict: null,
        artifactPath: null,
      },
      {
        stepId: 'step_002',
        runId: 'run_20250613_abc123',
        type: 'code-gen',
        goal: 'Implement core logic',
        inputs: ['step_001'],
        expectedOutput: 'Working code',
        model: 'claude-sonnet-4-20250514',
        provider: 'anthropic',
        reason: 'user-preferred',
        confidence: 0.95,
        costUsd: 0.026,
        latencyMs: 4200,
        evaluation: { passed: true, checks: ['code-structure: OK'], humanVerdict: null },
        humanVerdict: 'accepted',
        artifactPath: 'artifacts/step_002_code.ts',
      },
    ],
  };
}

describe('renderer', () => {
  describe('renderTrace', () => {
    it('includes run ID', () => {
      const output = renderTrace(createTrace());
      expect(output).toContain('run_20250613_abc123');
    });

    it('includes task description', () => {
      const output = renderTrace(createTrace());
      expect(output).toContain('Build a todo app');
    });

    it('includes step details', () => {
      const output = renderTrace(createTrace());
      expect(output).toContain('step_001');
      expect(output).toContain('Plan the architecture');
      expect(output).toContain('reasoning');
      expect(output).toContain('best-fit');
    });

    it('includes cost summary', () => {
      const output = renderTrace(createTrace());
      expect(output).toContain('$0.0340');
    });

    it('shows human verdict when present', () => {
      const output = renderTrace(createTrace());
      expect(output).toContain('accepted');
    });

    it('shows pass/fail counts', () => {
      const output = renderTrace(createTrace());
      expect(output).toContain('2');
    });
  });

  describe('renderSummary', () => {
    it('includes status and step count', () => {
      const output = renderSummary(createTrace());
      expect(output).toContain('completed');
      expect(output).toContain('2 steps');
    });

    it('includes cost', () => {
      const output = renderSummary(createTrace());
      expect(output).toContain('$0.0340');
    });

    it('includes trace path', () => {
      const output = renderSummary(createTrace());
      expect(output).toContain('.routewise/runs/run_20250613_abc123');
    });
  });
});

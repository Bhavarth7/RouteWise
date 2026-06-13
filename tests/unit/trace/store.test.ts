import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TraceStore } from '../../../src/trace/store.js';
import type { TraceMetadata, TraceStepEntry } from '../../../src/trace/types.js';

const TEST_DIR = join(tmpdir(), 'routewise-test-traces');

function createMetadata(runId = 'run_20250613_abc123'): TraceMetadata {
  return {
    runId,
    task: 'Build a test app',
    startedAt: '2025-06-13T10:00:00Z',
    completedAt: null,
    status: 'running',
    totalSteps: 0,
    totalCostUsd: 0,
    totalLatencyMs: 0,
    constraints: { maxCostPerRun: 0.5 },
    humanVerdict: null,
  };
}

function createStepEntry(stepId = 'step_001', runId = 'run_20250613_abc123'): TraceStepEntry {
  return {
    stepId,
    runId,
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
    evaluation: {
      passed: true,
      checks: ['ordered-items: OK', 'min-length: OK'],
      humanVerdict: null,
    },
    humanVerdict: null,
    artifactPath: null,
  };
}

describe('TraceStore', () => {
  let store: TraceStore;

  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
    store = new TraceStore(TEST_DIR);
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('creates run directory with trace.json and steps.jsonl', async () => {
    const metadata = createMetadata();
    await store.startRun(metadata);

    const trace = await store.getTrace('run_20250613_abc123');
    expect(trace).not.toBeNull();
    expect(trace?.metadata.runId).toBe('run_20250613_abc123');
    expect(trace?.metadata.task).toBe('Build a test app');
    expect(trace?.steps).toHaveLength(0);
  });

  it('appends steps to steps.jsonl', async () => {
    const metadata = createMetadata();
    await store.startRun(metadata);

    await store.appendStep('run_20250613_abc123', createStepEntry('step_001'));
    await store.appendStep('run_20250613_abc123', createStepEntry('step_002'));

    const trace = await store.getTrace('run_20250613_abc123');
    expect(trace?.steps).toHaveLength(2);
    expect(trace?.steps[0]?.stepId).toBe('step_001');
    expect(trace?.steps[1]?.stepId).toBe('step_002');
  });

  it('updates trace.json on completeRun', async () => {
    const metadata = createMetadata();
    await store.startRun(metadata);

    const completed: TraceMetadata = {
      ...metadata,
      completedAt: '2025-06-13T10:04:32Z',
      status: 'completed',
      totalSteps: 2,
      totalCostUsd: 0.034,
      totalLatencyMs: 272000,
      humanVerdict: 'accepted',
    };
    await store.completeRun(completed);

    const trace = await store.getTrace('run_20250613_abc123');
    expect(trace?.metadata.status).toBe('completed');
    expect(trace?.metadata.completedAt).toBe('2025-06-13T10:04:32Z');
    expect(trace?.metadata.totalCostUsd).toBe(0.034);
  });

  it('saves and references artifacts', async () => {
    const metadata = createMetadata();
    await store.startRun(metadata);

    const path = await store.saveArtifact(
      'run_20250613_abc123',
      'step_001_plan.md',
      '# Plan\n\n1. Do thing\n2. Do other thing',
    );

    expect(path).toBe('artifacts/step_001_plan.md');
  });

  it('returns null for nonexistent run', async () => {
    const trace = await store.getTrace('run_nonexistent');
    expect(trace).toBeNull();
  });

  it('gets latest run ID', async () => {
    await store.startRun(createMetadata('run_20250610_aaa'));
    await store.startRun(createMetadata('run_20250613_bbb'));
    await store.startRun(createMetadata('run_20250611_ccc'));

    const latest = await store.getLatestRunId();
    expect(latest).toBe('run_20250613_bbb');
  });

  it('lists all runs (most recent first)', async () => {
    await store.startRun(createMetadata('run_20250610_aaa'));
    await store.startRun(createMetadata('run_20250613_bbb'));
    await store.startRun(createMetadata('run_20250611_ccc'));

    const runs = await store.listRuns();
    expect(runs).toEqual(['run_20250613_bbb', 'run_20250611_ccc', 'run_20250610_aaa']);
  });

  it('returns null for latest when no runs exist', async () => {
    const emptyStore = new TraceStore(join(TEST_DIR, 'empty'));
    const latest = await emptyStore.getLatestRunId();
    expect(latest).toBeNull();
  });
});

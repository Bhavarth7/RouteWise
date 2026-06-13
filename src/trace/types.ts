import type { EvaluationResult, RoutingReason, StepType } from '../types/index.js';

/** Run-level trace metadata stored in trace.json */
export interface TraceMetadata {
  runId: string;
  task: string;
  startedAt: string;
  completedAt: string | null;
  status: 'running' | 'completed' | 'failed';
  totalSteps: number;
  totalCostUsd: number;
  totalLatencyMs: number;
  constraints: Record<string, unknown>;
  humanVerdict: 'accepted' | 'rejected' | null;
}

/** Per-step trace entry stored in steps.jsonl */
export interface TraceStepEntry {
  stepId: string;
  runId: string;
  type: StepType;
  goal: string;
  inputs: string[];
  expectedOutput: string;
  model: string;
  provider: string;
  reason: RoutingReason;
  confidence: number;
  costUsd: number;
  latencyMs: number;
  evaluation: EvaluationResult;
  humanVerdict: 'accepted' | 'rejected' | null;
  artifactPath: string | null;
}

/** A complete trace (metadata + steps) loaded from disk */
export interface FullTrace {
  metadata: TraceMetadata;
  steps: TraceStepEntry[];
}

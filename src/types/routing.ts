import type { StepType } from './workflow.js';

/** Information about a model available in the registry */
export interface ModelInfo {
  id: string;
  provider: string;
  capabilities: StepType[];
  costPer1kTokens: number;
  p95LatencyMs: number;
  qualityScore: number;
  contextWindow: number;
  supportsStructuredOutput: boolean;
  /** Optional tags for filtering/grouping (e.g., "thinking", "fast", "autonomous") */
  tags?: string[];
  /** Extensible metadata — add any provider-specific or model-specific fields here */
  metadata?: Record<string, unknown>;
}

/** A routing decision — why a model was selected */
export interface RoutingDecision {
  model: ModelInfo;
  reason: RoutingReason;
  confidence: number;
}

/** Possible reasons for a routing decision */
export type RoutingReason =
  | 'best-fit'
  | 'user-preferred'
  | 'fallback'
  | 'relaxed-latency'
  | 'relaxed-cost'
  | 'only-option';

/** Per-step-type routing preference from config */
export interface RoutingPreference {
  prefer: string;
  fallback: string;
}

/** Step classification output */
export interface StepClassification {
  type: StepType;
  confidence: number;
  reasoning?: string;
}

/** Evaluation result for a completed step */
export interface EvaluationResult {
  passed: boolean;
  checks: string[];
  humanVerdict: 'accepted' | 'rejected' | null;
}

/** A complete evaluated step in a trace */
export interface TraceStep {
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

/** Run-level trace metadata */
export interface RunTrace {
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

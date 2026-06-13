/** Step type classifications for routing decisions */
export type StepType =
  | 'reasoning'
  | 'code-gen'
  | 'summarization'
  | 'writing'
  | 'research'
  | 'editing';

/** A single step in a decomposed workflow */
export interface WorkflowStep {
  id: string;
  type: StepType;
  goal: string;
  inputs: string[];
  expectedOutput: string;
  constraints?: Partial<RoutingConstraints>;
}

/** Output of the decomposer */
export interface DecomposedWorkflow {
  steps: WorkflowStep[];
}

/** A step after classification */
export interface ClassifiedStep {
  id: string;
  type: StepType;
  confidence: number;
  goal: string;
  inputs: string[];
  expectedOutput: string;
  constraints?: Partial<RoutingConstraints>;
}

/** Result of executing a step */
export interface StepResult {
  stepId: string;
  output: string;
  tokenUsage: TokenUsage;
  latencyMs: number;
  costUsd: number;
  model: string;
  provider: string;
}

/** Token usage tracking */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/** Routing constraints applied to model selection */
export interface RoutingConstraints {
  maxCostPer1kTokens: number;
  maxLatencyMs: number;
  maxCostPerRun: number;
  preferredProviders: string[];
  privacyLevel: 'standard' | 'strict';
}

import type { RoutewiseConfig } from '../config/schema.js';
import type { ProviderRegistry } from '../providers/registry.js';
import type {
  ClassifiedStep,
  DecomposedWorkflow,
  EvaluationResult,
  RoutingConstraints,
  RoutingDecision,
  StepResult,
} from '../types/index.js';
import { classify } from './classifier.js';
import { decompose } from './decomposer.js';
import { evaluate } from './evaluator.js';
import { execute } from './executor.js';
import { type RoutingConfig, selectModel } from './selector.js';

/** Result of a full workflow run */
export interface RunResult {
  runId: string;
  task: string;
  steps: StepRunResult[];
  totalCostUsd: number;
  totalLatencyMs: number;
  status: 'completed' | 'failed';
}

/** Result of a single step within a run */
export interface StepRunResult {
  stepId: string;
  classification: ClassifiedStep;
  decision: RoutingDecision;
  result: StepResult;
  evaluation: EvaluationResult;
}

/** Options for running a workflow */
export interface RunOptions {
  /** Override constraints for this run */
  constraints?: Partial<RoutingConstraints>;
  /** Callback after each step completes */
  onStepComplete?: (step: StepRunResult) => void | Promise<void>;
  /** Callback to get human verdict for a step */
  onHumanVerdict?: (step: StepRunResult) => Promise<'accepted' | 'rejected' | null>;
}

/** Main router that orchestrates the full workflow loop */
export class Router {
  constructor(
    private config: RoutewiseConfig,
    private registry: ProviderRegistry,
  ) {}

  /** Run a full workflow: decompose → classify → select → execute → evaluate */
  async run(task: string, options?: RunOptions): Promise<RunResult> {
    const runId = generateRunId();
    const startTime = performance.now();
    const steps: StepRunResult[] = [];

    // Get a provider for decomposition (use cheapest available)
    const decomposerProvider = this.getCheapestProvider();

    // Decompose the task into steps
    const workflow: DecomposedWorkflow = await decompose(task, decomposerProvider);

    // Get effective constraints
    const constraints = this.getEffectiveConstraints(options?.constraints);
    const routingConfig = this.config.routing as RoutingConfig;

    // Execute each step sequentially
    const previousOutputs: string[] = [];

    for (const step of workflow.steps) {
      try {
        // Classify (or use the type from decomposition)
        const classification: ClassifiedStep = {
          id: step.id,
          type: step.type,
          confidence: 0.9, // High confidence since decomposer already classified
          goal: step.goal,
          inputs: step.inputs,
          expectedOutput: step.expectedOutput,
        };

        // Select model
        const decision = selectModel(
          { type: step.type, confidence: 0.9 },
          constraints,
          this.registry,
          routingConfig,
        );

        // Execute
        const provider = this.registry.getProvider(decision.model.provider);
        if (!provider) {
          throw new Error(`Provider ${decision.model.provider} not available`);
        }

        const context =
          previousOutputs.length > 0
            ? `Previous steps context:\n${previousOutputs.join('\n\n---\n\n')}`
            : undefined;

        const result = await execute(
          step.id,
          `${step.goal}\n\nExpected output: ${step.expectedOutput}`,
          decision,
          provider,
          { context },
        );

        // Evaluate
        const evaluation = evaluate(result.output, step.type, {
          expectedOutput: step.expectedOutput,
        });

        const stepResult: StepRunResult = {
          stepId: step.id,
          classification,
          decision,
          result,
          evaluation,
        };

        // Notify callback
        if (options?.onStepComplete) {
          await options.onStepComplete(stepResult);
        }

        // Get human verdict if callback provided
        if (options?.onHumanVerdict) {
          const verdict = await options.onHumanVerdict(stepResult);
          evaluation.humanVerdict = verdict;
        }

        steps.push(stepResult);
        previousOutputs.push(result.output);
      } catch (error) {
        // Log the failure and continue or stop based on severity
        const message = error instanceof Error ? error.message : String(error);
        const failedResult: StepRunResult = {
          stepId: step.id,
          classification: {
            id: step.id,
            type: step.type,
            confidence: 0,
            goal: step.goal,
            inputs: step.inputs,
            expectedOutput: step.expectedOutput,
          },
          decision: {
            model: {
              id: 'none',
              provider: 'none',
              capabilities: [],
              costPer1kTokens: 0,
              p95LatencyMs: 0,
              qualityScore: 0,
              contextWindow: 0,
              supportsStructuredOutput: false,
            },
            reason: 'only-option',
            confidence: 0,
          },
          result: {
            stepId: step.id,
            output: `ERROR: ${message}`,
            tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            latencyMs: 0,
            costUsd: 0,
            model: 'none',
            provider: 'none',
          },
          evaluation: { passed: false, checks: [`error: ${message}`], humanVerdict: null },
        };
        steps.push(failedResult);
      }
    }

    const totalLatencyMs = Math.round(performance.now() - startTime);
    const totalCostUsd = steps.reduce((sum, s) => sum + s.result.costUsd, 0);
    const allPassed = steps.every((s) => s.evaluation.passed);

    return {
      runId,
      task,
      steps,
      totalCostUsd,
      totalLatencyMs,
      status: allPassed ? 'completed' : 'failed',
    };
  }

  /** Execute a single step with classification and routing */
  async step(
    prompt: string,
    options?: { type?: string; constraints?: Partial<RoutingConstraints> },
  ): Promise<StepRunResult> {
    const constraints = this.getEffectiveConstraints(options?.constraints);
    const routingConfig = this.config.routing as RoutingConfig;

    // Classify
    const classification = options?.type
      ? {
          type: options.type as ClassifiedStep['type'],
          confidence: 1.0,
          reasoning: 'user-specified',
        }
      : classify(prompt);

    // Select
    const decision = selectModel(classification, constraints, this.registry, routingConfig);

    // Execute
    const provider = this.registry.getProvider(decision.model.provider);
    if (!provider) {
      throw new Error(`Provider ${decision.model.provider} not available`);
    }

    const result = await execute('step_single', prompt, decision, provider);

    // Evaluate
    const evaluation = evaluate(result.output, classification.type);

    return {
      stepId: 'step_single',
      classification: {
        id: 'step_single',
        type: classification.type,
        confidence: classification.confidence,
        goal: prompt,
        inputs: ['user prompt'],
        expectedOutput: 'Step output',
      },
      decision,
      result,
      evaluation,
    };
  }

  /** Get the cheapest available provider for decomposition */
  private getCheapestProvider() {
    const providerNames = this.registry.getProviderNames();
    for (const name of providerNames) {
      const provider = this.registry.getProvider(name);
      if (provider?.isAvailable()) {
        return provider;
      }
    }
    return undefined;
  }

  /** Merge run-level constraint overrides with config defaults */
  private getEffectiveConstraints(overrides?: Partial<RoutingConstraints>): RoutingConstraints {
    return {
      maxCostPer1kTokens:
        overrides?.maxCostPer1kTokens ?? this.config.constraints.maxCostPer1kTokens,
      maxLatencyMs: overrides?.maxLatencyMs ?? this.config.constraints.maxLatencyPerStep,
      maxCostPerRun: overrides?.maxCostPerRun ?? this.config.constraints.maxCostPerRun,
      preferredProviders:
        overrides?.preferredProviders ?? this.config.constraints.preferredProviders,
      privacyLevel: overrides?.privacyLevel ?? this.config.constraints.privacyLevel,
    };
  }
}

/** Generate a unique run ID */
function generateRunId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 8);
  return `run_${date}_${rand}`;
}

export { generateRunId };

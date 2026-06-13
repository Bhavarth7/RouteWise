import { createInterface } from 'node:readline';
import type { Command } from 'commander';
import { loadConfig } from '../../config/loader.js';
import { Router } from '../../core/router.js';
import type { StepRunResult } from '../../core/router.js';
import { renderSummary } from '../../trace/renderer.js';
import { TraceStore } from '../../trace/store.js';
import type { TraceMetadata, TraceStepEntry } from '../../trace/types.js';
import { colors, done, error, routingDecision, stepProgress } from '../output.js';
import { createRegistry } from '../setup.js';

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Decompose and execute a full workflow')
    .argument('<task>', 'Task description')
    .option('--no-confirm', 'Skip human verdict prompts')
    .action(async (task: string, options: { confirm: boolean }) => {
      try {
        const config = await loadConfig();
        const registry = createRegistry(config);
        const router = new Router(config, registry);
        const traceStore = new TraceStore(config.trace.directory);

        console.log(`${colors.bold}routewise${colors.reset} — running workflow`);
        console.log(`${colors.dim}Task: ${task}${colors.reset}\n`);

        const result = await router.run(task, {
          onStepComplete: (step) => {
            stepProgress(step.stepId, step.classification.type, step.classification.goal);
            routingDecision(step.decision.model.id, step.decision.reason, step.decision.confidence);
            const evalStatus = step.evaluation.passed
              ? `${colors.green}passed${colors.reset}`
              : `${colors.red}failed${colors.reset}`;
            done(`${evalStatus} ($${step.result.costUsd.toFixed(4)}, ${step.result.latencyMs}ms)`);
          },
          onHumanVerdict: options.confirm ? promptVerdict : undefined,
        });

        // Write trace
        const traceMetadata: TraceMetadata = {
          runId: result.runId,
          task: result.task,
          startedAt: new Date(Date.now() - result.totalLatencyMs).toISOString(),
          completedAt: new Date().toISOString(),
          status: result.status,
          totalSteps: result.steps.length,
          totalCostUsd: result.totalCostUsd,
          totalLatencyMs: result.totalLatencyMs,
          constraints: config.constraints,
          humanVerdict: null,
        };

        await traceStore.startRun(traceMetadata);
        for (const step of result.steps) {
          const entry: TraceStepEntry = {
            stepId: step.stepId,
            runId: result.runId,
            type: step.classification.type,
            goal: step.classification.goal,
            inputs: step.classification.inputs,
            expectedOutput: step.classification.expectedOutput,
            model: step.decision.model.id,
            provider: step.decision.model.provider,
            reason: step.decision.reason,
            confidence: step.decision.confidence,
            costUsd: step.result.costUsd,
            latencyMs: step.result.latencyMs,
            evaluation: step.evaluation,
            humanVerdict: step.evaluation.humanVerdict,
            artifactPath: null,
          };
          await traceStore.appendStep(result.runId, entry);
        }
        await traceStore.completeRun(traceMetadata);

        // Print summary
        const fullTrace = await traceStore.getTrace(result.runId);
        if (fullTrace) {
          console.log(renderSummary(fullTrace));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        error(`Run failed: ${msg}`);
        process.exitCode = 1;
      }
    });
}

/** Prompt user for verdict on a step */
async function promptVerdict(_step: StepRunResult): Promise<'accepted' | 'rejected' | null> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(`  ${colors.yellow}[✓ accept / ✗ reject / ⏭ skip]${colors.reset} `, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      if (normalized === 'accept' || normalized === 'y' || normalized === '✓') {
        resolve('accepted');
      } else if (normalized === 'reject' || normalized === 'n' || normalized === '✗') {
        resolve('rejected');
      } else {
        resolve(null);
      }
    });
  });
}

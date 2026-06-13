import type { Command } from 'commander';
import { loadConfig } from '../../config/loader.js';
import { Router } from '../../core/router.js';
import { colors, done, error, routingDecision, stepProgress } from '../output.js';
import { createRegistry } from '../setup.js';

export function registerStepCommand(program: Command): void {
  program
    .command('step')
    .description('Route and execute a single step')
    .argument('<prompt>', 'Step prompt')
    .option('-t, --type <type>', 'Override step type classification')
    .action(async (prompt: string, options: { type?: string }) => {
      try {
        const config = await loadConfig();
        const registry = createRegistry(config);
        const router = new Router(config, registry);

        const result = await router.step(prompt, {
          type: options.type,
        });

        stepProgress(result.stepId, result.classification.type, result.classification.goal);
        routingDecision(
          result.decision.model.id,
          result.decision.reason,
          result.decision.confidence,
        );

        const evalStatus = result.evaluation.passed
          ? `${colors.green}passed${colors.reset}`
          : `${colors.red}failed${colors.reset}`;
        done(`${evalStatus} ($${result.result.costUsd.toFixed(4)}, ${result.result.latencyMs}ms)`);

        console.log(`\n${colors.bold}Output:${colors.reset}`);
        console.log(result.result.output);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        error(`Step failed: ${msg}`);
        process.exitCode = 1;
      }
    });
}

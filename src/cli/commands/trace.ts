import type { Command } from 'commander';
import { loadConfig } from '../../config/loader.js';
import { renderTrace } from '../../trace/renderer.js';
import { TraceStore } from '../../trace/store.js';
import { error, warn } from '../output.js';

export function registerTraceCommand(program: Command): void {
  program
    .command('trace')
    .description('Show routing trace for a run')
    .option('-r, --run <runId>', 'Specific run ID (latest if omitted)')
    .action(async (options: { run?: string }) => {
      try {
        const config = await loadConfig();
        const traceStore = new TraceStore(config.trace.directory);

        const runId = options.run ?? (await traceStore.getLatestRunId());

        if (!runId) {
          warn('No runs found. Run a workflow first: routewise run "your task"');
          return;
        }

        const trace = await traceStore.getTrace(runId);

        if (!trace) {
          error(`Run not found: ${runId}`);
          process.exitCode = 1;
          return;
        }

        console.log(renderTrace(trace));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        error(`Failed to load trace: ${msg}`);
        process.exitCode = 1;
      }
    });
}

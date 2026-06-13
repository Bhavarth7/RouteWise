import type { Command } from 'commander';
import { ConfigError, loadConfig } from '../../config/loader.js';
import { error, success } from '../output.js';

export function registerConfigCommand(program: Command): void {
  const configCmd = program.command('config').description('Config management commands');

  configCmd
    .command('check')
    .description('Validate the current routewise config')
    .action(async () => {
      try {
        const config = await loadConfig();
        success('Config is valid');
        console.log('');
        console.log(
          `  Providers: ${
            Object.keys(config.providers)
              .filter((k) => config.providers[k as keyof typeof config.providers])
              .join(', ') || 'none configured'
          }`,
        );
        console.log(`  Max cost/run: $${config.constraints.maxCostPerRun}`);
        console.log(`  Max latency/step: ${config.constraints.maxLatencyPerStep}ms`);
        console.log(`  Trace dir: ${config.trace.directory}`);
      } catch (err) {
        if (err instanceof ConfigError) {
          error('Config validation failed:');
          for (const issue of err.issues) {
            console.error(`  - ${issue.path}: ${issue.message}`);
          }
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          error(`Failed to load config: ${msg}`);
        }
        process.exitCode = 1;
      }
    });
}

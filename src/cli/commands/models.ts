import type { Command } from 'commander';
import { colors } from '../output.js';
import { createRegistry } from '../setup.js';

export function registerModelsCommand(program: Command): void {
  program
    .command('models')
    .description('List available models with capabilities and costs')
    .action(() => {
      const registry = createRegistry();
      const models = registry.getAllModels();

      if (models.length === 0) {
        console.log('No models registered. Configure providers in routewise.config.ts');
        return;
      }

      console.log(`${colors.bold}Available Models:${colors.reset}\n`);
      console.log(
        `${'Model'.padEnd(30)} ${'Provider'.padEnd(12)} ${'Cost/1k'.padEnd(10)} ${'Latency'.padEnd(10)} ${'Quality'.padEnd(8)} Capabilities`,
      );
      console.log('─'.repeat(100));

      for (const model of models) {
        const caps = model.capabilities.join(', ');
        console.log(
          `${model.id.padEnd(30)} ${model.provider.padEnd(12)} $${model.costPer1kTokens.toFixed(5).padEnd(9)} ${String(`${model.p95LatencyMs}ms`).padEnd(10)} ${model.qualityScore.toFixed(2).padEnd(8)} ${colors.dim}${caps}${colors.reset}`,
        );
      }
    });
}

import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import type { Command } from 'commander';
import { configTemplate } from '../../config/defaults.js';
import { error, success, warn } from '../output.js';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize routewise config in the current project')
    .action(async () => {
      const configFile = 'routewise.config.ts';

      if (existsSync(configFile)) {
        warn(`${configFile} already exists. Skipping.`);
        return;
      }

      try {
        await writeFile(configFile, configTemplate, 'utf-8');
        success(`Created ${configFile}`);
        console.log('');
        console.log('Next steps:');
        console.log('  1. Set ANTHROPIC_API_KEY and/or OPENAI_API_KEY environment variables');
        console.log('  2. Run: routewise run "your task here"');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        error(`Failed to create config: ${msg}`);
        process.exitCode = 1;
      }
    });
}

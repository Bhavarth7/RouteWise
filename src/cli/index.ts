import { Command } from 'commander';
import { registerConfigCommand } from './commands/config.js';
import { registerInitCommand } from './commands/init.js';
import { registerModelsCommand } from './commands/models.js';
import { registerRunCommand } from './commands/run.js';
import { registerServeCommand } from './commands/serve.js';
import { registerStepCommand } from './commands/step.js';
import { registerTraceCommand } from './commands/trace.js';

const program = new Command();

program
  .name('routewise')
  .description('AI workflow router — routes each step to the best model')
  .version('0.1.0');

// Register all commands
registerInitCommand(program);
registerConfigCommand(program);
registerRunCommand(program);
registerStepCommand(program);
registerTraceCommand(program);
registerModelsCommand(program);
registerServeCommand(program);

program.parse();

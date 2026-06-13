import type { Command } from 'commander';
import { startMcpServer } from '../../mcp/server.js';
import { error } from '../output.js';

export function registerServeCommand(program: Command): void {
  program
    .command('serve')
    .description('Start the MCP server (stdio)')
    .action(async () => {
      try {
        await startMcpServer();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        error(`MCP server failed: ${msg}`);
        process.exitCode = 1;
      }
    });
}

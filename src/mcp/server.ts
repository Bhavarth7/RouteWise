import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createRegistry } from '../cli/setup.js';
import { loadConfig } from '../config/loader.js';
import { Router } from '../core/router.js';
import { TraceStore } from '../trace/store.js';
import type { TraceMetadata, TraceStepEntry } from '../trace/types.js';

/** Start the MCP server on stdio */
export async function startMcpServer(): Promise<void> {
  const config = await loadConfig();
  const registry = createRegistry(config);
  const router = new Router(config, registry);
  const traceStore = new TraceStore(config.trace.directory);

  const server = new McpServer({
    name: 'routewise',
    version: '0.1.0',
  });

  // Tool: routewise_run
  server.tool(
    'routewise_run',
    'Decompose and execute a full AI workflow, routing each step to the best model',
    {
      task: z.string().describe('The task description to decompose and execute'),
    },
    async ({ task }) => {
      const result = await router.run(task);

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

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                runId: result.runId,
                status: result.status,
                totalSteps: result.steps.length,
                totalCostUsd: result.totalCostUsd,
                totalLatencyMs: result.totalLatencyMs,
                steps: result.steps.map((s) => ({
                  stepId: s.stepId,
                  type: s.classification.type,
                  model: s.decision.model.id,
                  reason: s.decision.reason,
                  passed: s.evaluation.passed,
                  output: s.result.output.slice(0, 500),
                })),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // Tool: routewise_step
  server.tool(
    'routewise_step',
    'Route and execute a single step, selecting the best model for the task',
    {
      prompt: z.string().describe('The step prompt to classify, route, and execute'),
      type: z
        .string()
        .optional()
        .describe(
          'Override step type classification (reasoning, code-gen, summarization, writing, research, editing)',
        ),
    },
    async ({ prompt, type }) => {
      const result = await router.step(prompt, { type });

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                stepId: result.stepId,
                classification: result.classification.type,
                model: result.decision.model.id,
                reason: result.decision.reason,
                confidence: result.decision.confidence,
                passed: result.evaluation.passed,
                costUsd: result.result.costUsd,
                latencyMs: result.result.latencyMs,
                output: result.result.output,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  // Tool: routewise_trace
  server.tool(
    'routewise_trace',
    'Retrieve the routing trace for a run, showing why each model was selected',
    {
      runId: z.string().optional().describe('Run ID to retrieve (latest if omitted)'),
    },
    async ({ runId }) => {
      const targetId = runId ?? (await traceStore.getLatestRunId());

      if (!targetId) {
        return {
          content: [{ type: 'text' as const, text: 'No runs found.' }],
        };
      }

      const trace = await traceStore.getTrace(targetId);
      if (!trace) {
        return {
          content: [{ type: 'text' as const, text: `Run not found: ${targetId}` }],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(trace, null, 2),
          },
        ],
      };
    },
  );

  // Tool: routewise_models
  server.tool(
    'routewise_models',
    'List available models with their capabilities, costs, and quality scores',
    {},
    async () => {
      const models = registry.getAllModels();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(models, null, 2),
          },
        ],
      };
    },
  );

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

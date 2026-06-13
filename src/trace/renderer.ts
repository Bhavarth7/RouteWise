import type { FullTrace, TraceStepEntry } from './types.js';

/** ANSI color codes for terminal output */
const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

/** Render a full trace for terminal display */
export function renderTrace(trace: FullTrace): string {
  const lines: string[] = [];

  // Header
  lines.push(`${colors.bold}Run: ${trace.metadata.runId}${colors.reset}`);
  lines.push(`${colors.dim}Task: ${trace.metadata.task}${colors.reset}`);
  lines.push(
    `${colors.dim}Status: ${statusColor(trace.metadata.status)}${trace.metadata.status}${colors.reset}`,
  );
  lines.push('');

  // Steps
  lines.push(`${colors.bold}Steps:${colors.reset}`);
  lines.push('─'.repeat(72));

  for (const step of trace.steps) {
    lines.push(renderStep(step));
  }

  lines.push('─'.repeat(72));

  // Summary
  lines.push('');
  lines.push(`${colors.bold}Summary:${colors.reset}`);
  lines.push(`  Total cost:    $${trace.metadata.totalCostUsd.toFixed(4)}`);
  lines.push(`  Total time:    ${formatDuration(trace.metadata.totalLatencyMs)}`);
  lines.push(`  Steps:         ${trace.steps.length} total`);

  const passed = trace.steps.filter((s) => s.evaluation.passed).length;
  const failed = trace.steps.length - passed;
  lines.push(`  Passed:        ${colors.green}${passed}${colors.reset}`);
  if (failed > 0) {
    lines.push(`  Failed:        ${colors.red}${failed}${colors.reset}`);
  }

  return lines.join('\n');
}

/** Render a single step line */
function renderStep(step: TraceStepEntry): string {
  const status = step.evaluation.passed
    ? `${colors.green}✓${colors.reset}`
    : `${colors.red}✗${colors.reset}`;

  const verdict = step.humanVerdict ? ` ${colors.yellow}[${step.humanVerdict}]${colors.reset}` : '';

  const details = [
    `${colors.cyan}${step.type}${colors.reset}`,
    `model=${step.model}`,
    `reason=${step.reason}`,
    `$${step.costUsd.toFixed(4)}`,
    `${step.latencyMs}ms`,
  ].join(' │ ');

  return `  ${status} ${step.stepId}: ${step.goal}\n    ${colors.dim}${details}${verdict}${colors.reset}`;
}

/** Render a compact summary (for end-of-run CLI output) */
export function renderSummary(trace: FullTrace): string {
  const passed = trace.steps.filter((s) => s.evaluation.passed).length;
  const status =
    trace.metadata.status === 'completed'
      ? `${colors.green}✓ completed${colors.reset}`
      : `${colors.red}✗ failed${colors.reset}`;

  return [
    '',
    `${colors.bold}${status}${colors.reset} — ${trace.steps.length} steps, ${passed} passed`,
    `Cost: $${trace.metadata.totalCostUsd.toFixed(4)} │ Time: ${formatDuration(trace.metadata.totalLatencyMs)}`,
    `Trace: .routewise/runs/${trace.metadata.runId}/`,
  ].join('\n');
}

/** Format milliseconds to human-readable duration */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = ((ms % 60_000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/** Get status color code */
function statusColor(status: string): string {
  switch (status) {
    case 'completed':
      return colors.green;
    case 'failed':
      return colors.red;
    case 'running':
      return colors.yellow;
    default:
      return '';
  }
}

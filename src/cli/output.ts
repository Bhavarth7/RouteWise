/** ANSI color helpers for CLI output */
export const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  magenta: '\x1b[35m',
};

/** Print a success message */
export function success(msg: string): void {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

/** Print an error message */
export function error(msg: string): void {
  console.error(`${colors.red}✗${colors.reset} ${msg}`);
}

/** Print a warning message */
export function warn(msg: string): void {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

/** Print an info message */
export function info(msg: string): void {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

/** Print a step progress line */
export function stepProgress(stepId: string, type: string, goal: string): void {
  console.log(
    `\n${colors.bold}${stepId}${colors.reset} ${colors.dim}[${type}]${colors.reset} ${goal}`,
  );
}

/** Print a routing decision */
export function routingDecision(model: string, reason: string, confidence: number): void {
  console.log(
    `  ${colors.dim}→ ${model} (${reason}, confidence: ${(confidence * 100).toFixed(0)}%)${colors.reset}`,
  );
}

/** Spinner-like progress indicator */
export function working(msg: string): void {
  process.stdout.write(`  ${colors.dim}⏳ ${msg}...${colors.reset}`);
}

/** Clear the working line and show result */
export function done(msg: string): void {
  process.stdout.write(`\r  ${colors.green}✓${colors.reset} ${msg}\n`);
}

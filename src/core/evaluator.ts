import type { EvaluationResult, StepType } from '../types/index.js';

/** Options for evaluation */
export interface EvaluateOptions {
  /** The expected output description */
  expectedOutput?: string;
  /** The original input (for summarization length comparison) */
  originalInput?: string;
  /** Key terms that should be preserved (for summarization) */
  keyTerms?: string[];
}

/** Evaluate a step's output based on its type */
export function evaluate(
  output: string,
  stepType: StepType,
  options?: EvaluateOptions,
): EvaluationResult {
  const checks: string[] = [];
  let passed = true;

  // Universal check: non-empty output
  if (!output || output.trim().length === 0) {
    return { passed: false, checks: ['non-empty: FAILED'], humanVerdict: null };
  }
  checks.push('non-empty: OK');

  // Type-specific checks
  switch (stepType) {
    case 'code-gen':
      passed = evaluateCode(output, checks);
      break;
    case 'writing':
      passed = evaluateWriting(output, checks);
      break;
    case 'summarization':
      passed = evaluateSummarization(output, checks, options);
      break;
    case 'reasoning':
      passed = evaluateReasoning(output, checks);
      break;
    case 'research':
      passed = evaluateReasoning(output, checks); // Same heuristics
      break;
    case 'editing':
      passed = evaluateWriting(output, checks); // Same heuristics
      break;
  }

  return { passed, checks, humanVerdict: null };
}

/** Evaluate code output — checks if it looks parseable */
function evaluateCode(output: string, checks: string[]): boolean {
  let passed = true;

  // Check for common syntax indicators (braces, semicolons, keywords)
  const hasCodeStructure =
    /[{}\[\]();]/.test(output) ||
    /\b(function|class|const|let|var|import|export|def|return|if|for|while)\b/.test(output);

  if (hasCodeStructure) {
    checks.push('code-structure: OK');
  } else {
    checks.push('code-structure: WARN (no obvious code patterns)');
    // Don't fail — might be pseudocode or config
  }

  // Check for balanced braces (basic parse check)
  const openBraces = (output.match(/{/g) ?? []).length;
  const closeBraces = (output.match(/}/g) ?? []).length;
  if (Math.abs(openBraces - closeBraces) <= 1) {
    checks.push('balanced-braces: OK');
  } else {
    checks.push('balanced-braces: FAILED');
    passed = false;
  }

  // Minimum length for code (not just a one-liner)
  if (output.length > 50) {
    checks.push('min-length: OK');
  } else {
    checks.push('min-length: WARN (very short output)');
  }

  return passed;
}

/** Evaluate writing output — checks sections and length */
function evaluateWriting(output: string, checks: string[]): boolean {
  let passed = true;

  // Minimum length for writing (200 chars)
  if (output.length >= 200) {
    checks.push('min-length: OK');
  } else {
    checks.push('min-length: FAILED (under 200 chars)');
    passed = false;
  }

  // Check for structure (headings, paragraphs, lists)
  const hasStructure =
    /^#{1,6}\s/m.test(output) || // Markdown headings
    /^\s*[-*]\s/m.test(output) || // Bullet lists
    /^\d+\.\s/m.test(output) || // Numbered lists
    output.split('\n\n').length >= 2; // Multiple paragraphs

  if (hasStructure) {
    checks.push('has-structure: OK');
  } else {
    checks.push('has-structure: WARN (no clear structure)');
  }

  return passed;
}

/** Evaluate summarization — shorter than input, key terms preserved */
function evaluateSummarization(
  output: string,
  checks: string[],
  options?: EvaluateOptions,
): boolean {
  let passed = true;

  // Check shorter than original input
  if (options?.originalInput) {
    if (output.length < options.originalInput.length) {
      checks.push('shorter-than-input: OK');
    } else {
      checks.push('shorter-than-input: FAILED');
      passed = false;
    }
  }

  // Check key terms preserved
  if (options?.keyTerms && options.keyTerms.length > 0) {
    const outputLower = output.toLowerCase();
    const preserved = options.keyTerms.filter((term) => outputLower.includes(term.toLowerCase()));
    const ratio = preserved.length / options.keyTerms.length;

    if (preserved.length >= 3 || ratio >= 0.5) {
      checks.push(`key-terms: OK (${preserved.length}/${options.keyTerms.length} preserved)`);
    } else {
      checks.push(`key-terms: FAILED (${preserved.length}/${options.keyTerms.length} preserved)`);
      passed = false;
    }
  }

  // Minimum length (a summary should still have substance)
  if (output.length >= 50) {
    checks.push('min-length: OK');
  } else {
    checks.push('min-length: WARN (very short summary)');
  }

  return passed;
}

/** Evaluate reasoning/planning — ordered steps, concrete actions */
function evaluateReasoning(output: string, checks: string[]): boolean {
  let passed = true;

  // Check for ordered items (numbered list or bullet points)
  const hasOrderedItems =
    /^\s*\d+[.)]\s/m.test(output) || // Numbered list
    /^\s*[-*]\s/m.test(output); // Bullet list

  if (hasOrderedItems) {
    checks.push('ordered-items: OK');
  } else {
    checks.push('ordered-items: WARN (no list structure found)');
  }

  // Minimum length for reasoning (100 chars)
  if (output.length >= 100) {
    checks.push('min-length: OK');
  } else {
    checks.push('min-length: FAILED (under 100 chars)');
    passed = false;
  }

  // Check for concrete actions (verbs at start of items)
  const actionVerbs =
    /^\s*[-*\d.)]+\s*(create|build|implement|add|remove|update|configure|set|define|write|test|deploy|verify)/im;
  if (actionVerbs.test(output)) {
    checks.push('concrete-actions: OK');
  } else {
    checks.push('concrete-actions: WARN (no clear action verbs)');
  }

  return passed;
}

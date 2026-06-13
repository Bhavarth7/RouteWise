import type { StepClassification, StepType } from '../types/index.js';

/** Keyword patterns for step type classification */
const STEP_TYPE_PATTERNS: Array<{ type: StepType; keywords: RegExp; weight: number }> = [
  {
    type: 'code-gen',
    keywords:
      /\b(implement|code|function|class|module|component|endpoint|api|scaffold|build|create.*(?:file|app|service)|refactor|migrate|write.*(?:test|code)|fix.*bug)\b/i,
    weight: 0.9,
  },
  {
    type: 'summarization',
    keywords:
      /\b(summarize|summary|tldr|condense|shorten|digest|brief|overview|recap|key\s*points)\b/i,
    weight: 0.95,
  },
  {
    type: 'writing',
    keywords:
      /\b(write|draft|compose|document|readme|blog|post|article|copy|content|description|explain.*to|tutorial|guide)\b/i,
    weight: 0.8,
  },
  {
    type: 'research',
    keywords:
      /\b(research|investigate|find|search|look\s*up|compare|analyze|evaluate.*options|what\s*are|how\s*does|explore)\b/i,
    weight: 0.8,
  },
  {
    type: 'editing',
    keywords:
      /\b(edit|revise|proofread|rewrite|improve|polish|rephrase|rework|clean\s*up|format)\b/i,
    weight: 0.85,
  },
  {
    type: 'reasoning',
    keywords:
      /\b(plan|design|architect|decide|strategy|think|reason|analyze|break\s*down|structure|organize|prioritize)\b/i,
    weight: 0.75,
  },
];

/** Classify a prompt/step description into a step type */
export function classify(prompt: string): StepClassification {
  const scores: Array<{ type: StepType; score: number }> = [];

  for (const pattern of STEP_TYPE_PATTERNS) {
    const matches = prompt.match(pattern.keywords);
    if (matches) {
      // Score based on number of keyword hits and pattern weight
      const matchCount = matches.length;
      const score = Math.min(pattern.weight * (0.5 + matchCount * 0.2), 0.98);
      scores.push({ type: pattern.type, score });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  const topMatch = scores[0];

  // If no pattern matched, default to reasoning (most capable)
  if (!topMatch) {
    return {
      type: 'reasoning',
      confidence: 0.4,
      reasoning: 'No specific pattern matched; defaulting to reasoning as safest choice',
    };
  }

  // If top two scores are very close, reduce confidence
  const secondMatch = scores[1];
  let confidence = topMatch.score;
  if (secondMatch && topMatch.score - secondMatch.score < 0.1) {
    confidence *= 0.8; // Reduce confidence when ambiguous
  }

  return {
    type: topMatch.type,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `Matched ${topMatch.type} pattern with confidence ${confidence.toFixed(2)}`,
  };
}

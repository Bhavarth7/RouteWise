import type { ModelInfo } from '../types/index.js';

/**
 * Model Catalog — the single source of truth for all model metadata.
 *
 * To add a new model:
 * 1. Add an entry to the appropriate provider array below
 * 2. If it's a new provider, create a new array and export it
 * 3. The model will automatically appear in the registry and routing
 *
 * Fields:
 * - id: The model identifier used in API calls
 * - provider: Which provider serves this model
 * - capabilities: What step types this model is good at
 * - costPer1kTokens: Average cost (blended input/output) per 1k tokens in USD
 * - p95LatencyMs: Expected p95 latency in milliseconds
 * - qualityScore: Relative quality score 0-1 (higher = better)
 * - contextWindow: Max tokens in context
 * - supportsStructuredOutput: Can produce JSON mode / structured output
 * - tags: Optional labels for filtering (e.g., "thinking", "fast", "autonomous")
 * - metadata: Optional extensible fields for provider-specific params
 */

// ─── Anthropic Models ────────────────────────────────────────────────────────

export const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-opus-4.8',
    provider: 'anthropic',
    capabilities: ['reasoning', 'code-gen', 'writing', 'research', 'editing', 'summarization'],
    costPer1kTokens: 0.015,
    p95LatencyMs: 8000,
    qualityScore: 0.98,
    contextWindow: 200000,
    supportsStructuredOutput: true,
    tags: ['complex-reasoning', 'premium'],
    metadata: { tier: 'flagship', description: 'Complex Reasoning' },
  },
  {
    id: 'claude-sonnet-4.6',
    provider: 'anthropic',
    capabilities: ['reasoning', 'code-gen', 'writing', 'research', 'editing', 'summarization'],
    costPer1kTokens: 0.003,
    p95LatencyMs: 3000,
    qualityScore: 0.92,
    contextWindow: 200000,
    supportsStructuredOutput: true,
    tags: ['daily-driver', 'balanced'],
    metadata: { tier: 'standard', description: 'Daily Driver' },
  },
  {
    id: 'claude-haiku-4.5',
    provider: 'anthropic',
    capabilities: ['summarization', 'editing', 'writing', 'reasoning', 'code-gen'],
    costPer1kTokens: 0.00025,
    p95LatencyMs: 800,
    qualityScore: 0.75,
    contextWindow: 200000,
    supportsStructuredOutput: true,
    tags: ['instant', 'fast', 'cheap'],
    metadata: { tier: 'lite', description: 'Instant Text. Replacing simple bots' },
  },
];

// ─── OpenAI Models ───────────────────────────────────────────────────────────

export const OPENAI_MODELS: ModelInfo[] = [
  {
    id: 'gpt-5.5',
    provider: 'openai',
    capabilities: ['reasoning', 'code-gen', 'writing', 'research', 'editing', 'summarization'],
    costPer1kTokens: 0.005,
    p95LatencyMs: 4000,
    qualityScore: 0.95,
    contextWindow: 128000,
    supportsStructuredOutput: true,
    tags: ['autonomous', 'agents'],
    metadata: { tier: 'flagship', description: 'Autonomous Agents' },
  },
  {
    id: 'o3',
    provider: 'openai',
    capabilities: ['reasoning', 'code-gen', 'research'],
    costPer1kTokens: 0.01,
    p95LatencyMs: 15000,
    qualityScore: 0.97,
    contextWindow: 200000,
    supportsStructuredOutput: true,
    tags: ['thinking', 'stem', 'science'],
    metadata: { tier: 'reasoning', description: 'STEM & Science. Thinking model' },
  },
  {
    id: 'gpt-4.1',
    provider: 'openai',
    capabilities: ['reasoning', 'code-gen', 'writing', 'research', 'editing', 'summarization'],
    costPer1kTokens: 0.002,
    p95LatencyMs: 2500,
    qualityScore: 0.9,
    contextWindow: 128000,
    supportsStructuredOutput: true,
    tags: ['versatile', 'general'],
    metadata: { tier: 'standard', description: 'General Versatility' },
  },
];

// ─── Google Vertex AI / Gemini Models ────────────────────────────────────────

export const VERTEX_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.5-flash',
    provider: 'vertex',
    capabilities: ['reasoning', 'code-gen', 'writing', 'research', 'editing', 'summarization'],
    costPer1kTokens: 0.0001,
    p95LatencyMs: 1000,
    qualityScore: 0.82,
    contextWindow: 1000000,
    supportsStructuredOutput: true,
    tags: ['fast', 'cheap', 'multimodal'],
    metadata: { tier: 'flash', description: 'Fast multimodal, massive context' },
  },
  {
    id: 'gemini-3.1-pro',
    provider: 'vertex',
    capabilities: ['reasoning', 'code-gen', 'writing', 'research', 'editing', 'summarization'],
    costPer1kTokens: 0.00125,
    p95LatencyMs: 3500,
    qualityScore: 0.91,
    contextWindow: 2000000,
    supportsStructuredOutput: true,
    tags: ['pro', 'deep-reasoning', 'multimodal'],
    metadata: { tier: 'pro', description: 'Deep reasoning with massive context' },
  },
  {
    id: 'gemini-3.1-flash-lite',
    provider: 'vertex',
    capabilities: ['summarization', 'editing', 'writing', 'reasoning'],
    costPer1kTokens: 0.00005,
    p95LatencyMs: 500,
    qualityScore: 0.7,
    contextWindow: 1000000,
    supportsStructuredOutput: true,
    tags: ['ultra-fast', 'ultra-cheap', 'lite'],
    metadata: { tier: 'lite', description: 'Cheapest, fastest for simple tasks' },
  },
];

// ─── All Models ──────────────────────────────────────────────────────────────

/** Complete model catalog — all providers combined */
export const ALL_MODELS: ModelInfo[] = [...ANTHROPIC_MODELS, ...OPENAI_MODELS, ...VERTEX_MODELS];

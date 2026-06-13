import type { RoutewiseUserConfig } from './schema.js';

/** Sensible default configuration — works with just env vars set */
export const defaultConfig: RoutewiseUserConfig = {
  providers: {
    anthropic: { apiKey: 'env:ANTHROPIC_API_KEY' },
    openai: { apiKey: 'env:OPENAI_API_KEY' },
    vertex: { projectId: 'env:VERTEX_PROJECT_ID', location: 'us-central1' },
  },
  constraints: {
    maxCostPerRun: 0.5,
    maxCostPer1kTokens: 0.02,
    maxLatencyPerStep: 30_000,
    preferredProviders: ['anthropic', 'openai', 'vertex'],
    privacyLevel: 'standard',
  },
  routing: {
    reasoning: { prefer: 'claude-sonnet-4.6', fallback: 'gpt-4.1' },
    'code-gen': { prefer: 'claude-sonnet-4.6', fallback: 'gpt-4.1' },
    summarization: { prefer: 'gemini-3.1-flash-lite', fallback: 'claude-haiku-4.5' },
    writing: { prefer: 'claude-sonnet-4.6', fallback: 'gpt-4.1' },
    research: { prefer: 'gemini-3.1-pro', fallback: 'gpt-5.5' },
    editing: { prefer: 'gemini-3.5-flash', fallback: 'claude-haiku-4.5' },
  },
  trace: {
    store: 'local',
    directory: '.routewise/runs',
  },
};

/** Template for `routewise init` — generates a commented config file */
export const configTemplate = `import { defineConfig } from 'routewise';

export default defineConfig({
  providers: {
    anthropic: { apiKey: 'env:ANTHROPIC_API_KEY' },
    openai: { apiKey: 'env:OPENAI_API_KEY' },
    vertex: {
      projectId: 'env:VERTEX_PROJECT_ID',  // Your GCP project ID
      location: 'us-central1',              // GCP region
      // apiKey: 'env:VERTEX_API_KEY',      // Optional: API key auth (alternative to ADC)
    },
  },
  constraints: {
    maxCostPerRun: 0.50,        // USD — maximum spend per workflow run
    maxCostPer1kTokens: 0.02,   // USD — per-step token cost ceiling
    maxLatencyPerStep: 30_000,  // ms — maximum latency per step
    preferredProviders: ['anthropic', 'openai', 'vertex'],
    privacyLevel: 'standard',   // 'standard' | 'strict' (no data retention)
  },
  routing: {
    // Anthropic: claude-opus-4.8 (flagship), claude-sonnet-4.6 (daily driver), claude-haiku-4.5 (instant)
    // OpenAI:    gpt-5.5 (agents), o3 (STEM/thinking), gpt-4.1 (general)
    // Gemini:    gemini-3.1-pro (deep), gemini-3.5-flash (fast), gemini-3.1-flash-lite (cheapest)
    reasoning:      { prefer: 'claude-sonnet-4.6', fallback: 'gpt-4.1' },
    'code-gen':     { prefer: 'claude-sonnet-4.6', fallback: 'gpt-4.1' },
    summarization:  { prefer: 'gemini-3.1-flash-lite', fallback: 'claude-haiku-4.5' },
    writing:        { prefer: 'claude-sonnet-4.6', fallback: 'gpt-4.1' },
    research:       { prefer: 'gemini-3.1-pro', fallback: 'gpt-5.5' },
    editing:        { prefer: 'gemini-3.5-flash', fallback: 'claude-haiku-4.5' },
  },
  trace: {
    store: 'local',
    directory: '.routewise/runs',
  },
});
`;

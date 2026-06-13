import type { TokenUsage } from '../types/index.js';

/** Options passed to a provider's complete method */
export interface ProviderCompleteOptions {
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature (0-1) */
  temperature?: number;
  /** Whether to request structured JSON output */
  jsonMode?: boolean;
  /** System prompt */
  system?: string;
  /** Stop sequences */
  stopSequences?: string[];
}

/** Response from a provider's complete method */
export interface ProviderResponse {
  /** The generated text content */
  content: string;
  /** Token usage stats */
  tokenUsage: TokenUsage;
  /** Actual latency of the API call in ms */
  latencyMs: number;
  /** Computed cost in USD */
  costUsd: number;
  /** Model ID that was actually used */
  model: string;
  /** Provider name */
  provider: string;
}

/** Interface all provider adapters must implement */
export interface Provider {
  /** Provider name (e.g., 'anthropic', 'openai') */
  readonly name: string;

  /** Complete a prompt and return the response */
  complete(prompt: string, options?: ProviderCompleteOptions): Promise<ProviderResponse>;

  /** Complete with a specific model override */
  completeWithModel(
    model: string,
    prompt: string,
    options?: ProviderCompleteOptions,
  ): Promise<ProviderResponse>;

  /** Check if the provider is configured and ready */
  isAvailable(): boolean;

  /** List model IDs this provider supports */
  listModels(): string[];
}

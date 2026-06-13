import Anthropic from '@anthropic-ai/sdk';
import type { Provider, ProviderCompleteOptions, ProviderResponse } from './interface.js';

/** Cost per 1k tokens for Anthropic models (input/output) */
const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4.8': { input: 0.015, output: 0.075 },
  'claude-sonnet-4.6': { input: 0.003, output: 0.015 },
  'claude-haiku-4.5': { input: 0.00025, output: 0.00125 },
  // Legacy model IDs (kept for backward compat)
  'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
  'claude-haiku': { input: 0.00025, output: 0.00125 },
};

/** Anthropic provider adapter */
export class AnthropicProvider implements Provider {
  readonly name = 'anthropic';
  private client: Anthropic | null = null;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  listModels(): string[] {
    return Object.keys(ANTHROPIC_PRICING);
  }

  async complete(prompt: string, options?: ProviderCompleteOptions): Promise<ProviderResponse> {
    return this.completeWithModel('claude-sonnet-4.6', prompt, options);
  }

  async completeWithModel(
    model: string,
    prompt: string,
    options?: ProviderCompleteOptions,
  ): Promise<ProviderResponse> {
    if (!this.client) {
      throw new Error('Anthropic provider is not configured. Set ANTHROPIC_API_KEY.');
    }

    const start = performance.now();

    const response = await this.client.messages.create({
      model,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      system: options?.system ?? undefined,
      messages: [{ role: 'user', content: prompt }],
      ...(options?.stopSequences ? { stop_sequences: options.stopSequences } : {}),
    });

    const latencyMs = Math.round(performance.now() - start);

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const pricing = ANTHROPIC_PRICING[model] ?? { input: 0.003, output: 0.015 };
    const costUsd = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;

    return {
      content,
      tokenUsage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      latencyMs,
      costUsd: Math.round(costUsd * 1_000_000) / 1_000_000, // 6 decimal precision
      model,
      provider: this.name,
    };
  }
}

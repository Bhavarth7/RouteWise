import OpenAI from 'openai';
import type { Provider, ProviderCompleteOptions, ProviderResponse } from './interface.js';

/** Cost per 1k tokens for OpenAI models (input/output) */
const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-5.5': { input: 0.005, output: 0.015 },
  o3: { input: 0.01, output: 0.04 },
  'gpt-4.1': { input: 0.002, output: 0.008 },
  // Legacy model IDs (kept for backward compat)
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

/** OpenAI provider adapter */
export class OpenAIProvider implements Provider {
  readonly name = 'openai';
  private client: OpenAI | null = null;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY;
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  listModels(): string[] {
    return Object.keys(OPENAI_PRICING);
  }

  async complete(prompt: string, options?: ProviderCompleteOptions): Promise<ProviderResponse> {
    return this.completeWithModel('gpt-4.1', prompt, options);
  }

  async completeWithModel(
    model: string,
    prompt: string,
    options?: ProviderCompleteOptions,
  ): Promise<ProviderResponse> {
    if (!this.client) {
      throw new Error('OpenAI provider is not configured. Set OPENAI_API_KEY.');
    }

    const start = performance.now();

    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (options?.system) {
      messages.push({ role: 'system', content: options.system });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      ...(options?.stopSequences ? { stop: options.stopSequences } : {}),
    });

    const latencyMs = Math.round(performance.now() - start);

    const content = response.choices[0]?.message?.content ?? '';
    const inputTokens = response.usage?.prompt_tokens ?? 0;
    const outputTokens = response.usage?.completion_tokens ?? 0;
    const pricing = OPENAI_PRICING[model] ?? { input: 0.0025, output: 0.01 };
    const costUsd = (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;

    return {
      content,
      tokenUsage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      latencyMs,
      costUsd: Math.round(costUsd * 1_000_000) / 1_000_000,
      model,
      provider: this.name,
    };
  }
}

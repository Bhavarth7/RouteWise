import type { Provider, ProviderCompleteOptions } from '../providers/interface.js';
import type { RoutingDecision, StepResult } from '../types/index.js';

/** Options for step execution */
export interface ExecuteOptions {
  /** System prompt to prepend */
  system?: string;
  /** Max tokens for the response */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
  /** Request JSON mode */
  jsonMode?: boolean;
  /** Context from previous steps */
  context?: string;
}

/** Execute a step against the selected model via its provider */
export async function execute(
  stepId: string,
  prompt: string,
  decision: RoutingDecision,
  provider: Provider,
  options?: ExecuteOptions,
): Promise<StepResult> {
  const fullPrompt = options?.context ? `${options.context}\n\n---\n\n${prompt}` : prompt;

  const providerOptions: ProviderCompleteOptions = {
    system: options?.system,
    maxTokens: options?.maxTokens,
    temperature: options?.temperature,
    jsonMode: options?.jsonMode,
  };

  try {
    const response = await provider.completeWithModel(
      decision.model.id,
      fullPrompt,
      providerOptions,
    );

    return {
      stepId,
      output: response.content,
      tokenUsage: response.tokenUsage,
      latencyMs: response.latencyMs,
      costUsd: response.costUsd,
      model: response.model,
      provider: response.provider,
    };
  } catch (error) {
    // Retry once on failure
    try {
      const retryResponse = await provider.completeWithModel(
        decision.model.id,
        fullPrompt,
        providerOptions,
      );

      return {
        stepId,
        output: retryResponse.content,
        tokenUsage: retryResponse.tokenUsage,
        latencyMs: retryResponse.latencyMs,
        costUsd: retryResponse.costUsd,
        model: retryResponse.model,
        provider: retryResponse.provider,
      };
    } catch (retryError) {
      const message = retryError instanceof Error ? retryError.message : String(retryError);
      throw new Error(
        `Step ${stepId} failed after retry. Model: ${decision.model.id}, Provider: ${decision.model.provider}. Error: ${message}`,
      );
    }
  }
}

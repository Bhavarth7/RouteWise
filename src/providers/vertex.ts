import type { Provider, ProviderCompleteOptions, ProviderResponse } from './interface.js';
import { VERTEX_MODELS } from './models.js';

/**
 * Google Vertex AI / Gemini provider adapter.
 *
 * Requires:
 * - VERTEX_PROJECT_ID: Your GCP project ID
 * - VERTEX_LOCATION: GCP region (e.g., "us-central1")
 * - GOOGLE_APPLICATION_CREDENTIALS or VERTEX_API_KEY: Authentication
 *
 * Uses the Vertex AI REST API directly (no SDK dependency for now).
 */
export class VertexProvider implements Provider {
  readonly name = 'vertex';
  private projectId: string | undefined;
  private location: string | undefined;
  private apiKey: string | undefined;

  constructor(options?: { projectId?: string; location?: string; apiKey?: string }) {
    this.projectId = options?.projectId ?? process.env.VERTEX_PROJECT_ID;
    this.location = options?.location ?? process.env.VERTEX_LOCATION ?? 'us-central1';
    this.apiKey = options?.apiKey ?? process.env.VERTEX_API_KEY;
  }

  isAvailable(): boolean {
    // Available if we have project ID + either API key or ADC
    return !!(this.projectId && (this.apiKey || process.env.GOOGLE_APPLICATION_CREDENTIALS));
  }

  listModels(): string[] {
    return VERTEX_MODELS.map((m) => m.id);
  }

  async complete(prompt: string, options?: ProviderCompleteOptions): Promise<ProviderResponse> {
    return this.completeWithModel('gemini-3.5-flash', prompt, options);
  }

  async completeWithModel(
    model: string,
    prompt: string,
    options?: ProviderCompleteOptions,
  ): Promise<ProviderResponse> {
    if (!this.projectId) {
      throw new Error(
        'Vertex AI provider is not configured. Set VERTEX_PROJECT_ID and VERTEX_LOCATION.',
      );
    }

    const start = performance.now();

    // Map model ID to Vertex AI endpoint model name
    const vertexModel = this.resolveModelName(model);
    const url = this.buildEndpointUrl(vertexModel);

    const body = this.buildRequestBody(prompt, options);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as VertexResponse;
    const latencyMs = Math.round(performance.now() - start);

    const content = this.extractContent(data);
    const usage = this.extractUsage(data);

    const modelMeta = VERTEX_MODELS.find((m) => m.id === model);
    const costPer1k = modelMeta?.costPer1kTokens ?? 0.001;
    const costUsd = (usage.totalTokens / 1000) * costPer1k;

    return {
      content,
      tokenUsage: usage,
      latencyMs,
      costUsd: Math.round(costUsd * 1_000_000) / 1_000_000,
      model,
      provider: this.name,
    };
  }

  /** Resolve our model ID to the Vertex AI model name */
  private resolveModelName(model: string): string {
    // Map friendly names to Vertex AI API model identifiers
    const modelMap: Record<string, string> = {
      'gemini-3.5-flash': 'gemini-3.5-flash',
      'gemini-3.1-pro': 'gemini-3.1-pro',
      'gemini-3.1-flash-lite': 'gemini-3.1-flash-lite',
    };
    return modelMap[model] ?? model;
  }

  /** Build the Vertex AI endpoint URL */
  private buildEndpointUrl(model: string): string {
    if (this.apiKey) {
      // Use generativelanguage.googleapis.com for API key auth
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    }
    // Use Vertex AI endpoint for service account auth
    return `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${model}:generateContent`;
  }

  /** Build the request body for Gemini API */
  private buildRequestBody(
    prompt: string,
    options?: ProviderCompleteOptions,
  ): Record<string, unknown> {
    const contents: Array<Record<string, unknown>> = [];

    if (options?.system) {
      contents.push({
        role: 'user',
        parts: [{ text: `System: ${options.system}\n\nUser: ${prompt}` }],
      });
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
    }

    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
    };

    if (options?.jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }

    if (options?.stopSequences) {
      generationConfig.stopSequences = options.stopSequences;
    }

    return { contents, generationConfig };
  }

  /** Get auth headers */
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!this.apiKey && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // For service account auth, get access token via gcloud or metadata server
      // In production, use google-auth-library. For V1, support API key or ADC token.
      const token = process.env.VERTEX_ACCESS_TOKEN;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /** Extract text content from Vertex response */
  private extractContent(data: VertexResponse): string {
    const candidates = data.candidates ?? [];
    if (candidates.length === 0) return '';

    const parts = candidates[0]?.content?.parts ?? [];
    return parts.map((p) => p.text ?? '').join('');
  }

  /** Extract token usage from Vertex response */
  private extractUsage(data: VertexResponse): {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } {
    const usage = data.usageMetadata;
    return {
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      totalTokens: usage?.totalTokenCount ?? 0,
    };
  }
}

/** Vertex AI response shape */
interface VertexResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

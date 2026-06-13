import { resolveApiKey } from '../config/loader.js';
import type { RoutewiseConfig } from '../config/schema.js';
import { AnthropicProvider } from '../providers/anthropic.js';
import { ALL_MODELS } from '../providers/models.js';
import { OpenAIProvider } from '../providers/openai.js';
import { ProviderRegistry } from '../providers/registry.js';
import { VertexProvider } from '../providers/vertex.js';

/**
 * Create a fully configured provider registry.
 *
 * Models are loaded from the catalog (src/providers/models.ts).
 * To add a new model, just add an entry there — it auto-registers here.
 *
 * To add a new provider:
 * 1. Create a new provider class implementing the Provider interface
 * 2. Add its models to the catalog
 * 3. Register the provider instance below
 */
export function createRegistry(config?: RoutewiseConfig): ProviderRegistry {
  const registry = new ProviderRegistry();

  // ─── Register Providers ──────────────────────────────────────────────────

  // Anthropic
  const anthropicKey = config?.providers.anthropic
    ? resolveApiKey(config.providers.anthropic.apiKey)
    : process.env.ANTHROPIC_API_KEY;
  registry.registerProvider(new AnthropicProvider(anthropicKey));

  // OpenAI
  const openaiKey = config?.providers.openai
    ? resolveApiKey(config.providers.openai.apiKey)
    : process.env.OPENAI_API_KEY;
  registry.registerProvider(new OpenAIProvider(openaiKey));

  // Vertex AI / Gemini
  const vertexConfig = config?.providers.vertex;
  registry.registerProvider(
    new VertexProvider({
      projectId: vertexConfig?.projectId ?? process.env.VERTEX_PROJECT_ID,
      location: vertexConfig?.location ?? process.env.VERTEX_LOCATION,
      apiKey: vertexConfig?.apiKey ?? process.env.VERTEX_API_KEY,
    }),
  );

  // ─── Register All Models from Catalog ────────────────────────────────────

  for (const model of ALL_MODELS) {
    registry.registerModel(model);
  }

  return registry;
}

import type { StepType } from '../types/index.js';
import type { ModelInfo } from '../types/routing.js';
import type { Provider } from './interface.js';

/** Registry holding all available providers and their model metadata */
export class ProviderRegistry {
  private providers = new Map<string, Provider>();
  private models = new Map<string, ModelInfo>();

  /** Register a provider adapter */
  registerProvider(provider: Provider): void {
    this.providers.set(provider.name, provider);
  }

  /** Register a model's metadata */
  registerModel(model: ModelInfo): void {
    this.models.set(model.id, model);
  }

  /** Get a provider by name */
  getProvider(name: string): Provider | undefined {
    return this.providers.get(name);
  }

  /** Get a model by ID */
  getModel(id: string): ModelInfo | undefined {
    return this.models.get(id);
  }

  /** Get all models that support a given step type */
  getModelsForCapability(stepType: StepType): ModelInfo[] {
    return Array.from(this.models.values()).filter((m) => m.capabilities.includes(stepType));
  }

  /** Get all models from a specific provider */
  getModelsByProvider(providerName: string): ModelInfo[] {
    return Array.from(this.models.values()).filter((m) => m.provider === providerName);
  }

  /** Get all registered models */
  getAllModels(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  /** Get all registered provider names */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /** Check if a provider is registered and available */
  isProviderAvailable(name: string): boolean {
    const provider = this.providers.get(name);
    return provider?.isAvailable() ?? false;
  }
}

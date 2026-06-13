import type { ProviderRegistry } from '../providers/registry.js';
import type {
  ModelInfo,
  RoutingConstraints,
  RoutingDecision,
  RoutingPreference,
  StepClassification,
} from '../types/index.js';

/** Routing config from user preferences */
export interface RoutingConfig {
  [stepType: string]: RoutingPreference | undefined;
}

/** Select the best model for a classified step within constraints */
export function selectModel(
  classification: StepClassification,
  constraints: RoutingConstraints,
  registry: ProviderRegistry,
  routingConfig?: RoutingConfig,
): RoutingDecision {
  // 1. Check if user has a preferred model for this step type
  const preference = routingConfig?.[classification.type];
  if (preference) {
    const preferred = registry.getModel(preference.prefer);
    if (preferred && meetsConstraints(preferred, constraints)) {
      return { model: preferred, reason: 'user-preferred', confidence: 0.95 };
    }

    // Try fallback
    const fallback = registry.getModel(preference.fallback);
    if (fallback && meetsConstraints(fallback, constraints)) {
      return { model: fallback, reason: 'fallback', confidence: 0.8 };
    }
  }

  // 2. Get all models capable of this step type
  const candidates = registry.getModelsForCapability(classification.type);
  if (candidates.length === 0) {
    // No models for this capability — get any model as last resort
    const allModels = registry.getAllModels();
    if (allModels.length === 0) {
      throw new Error(`No models available in registry for step type: ${classification.type}`);
    }
    const firstModel = allModels[0] as ModelInfo;
    return { model: firstModel, reason: 'only-option', confidence: 0.3 };
  }

  // 3. Filter by constraints
  const withinProvider = filterByProvider(candidates, constraints);
  const withinBudget = withinProvider.filter(
    (m) => m.costPer1kTokens <= constraints.maxCostPer1kTokens,
  );
  const withinLatency = withinBudget.filter((m) => m.p95LatencyMs <= constraints.maxLatencyMs);

  // 4. Pick the best from the most constrained set that has options
  if (withinLatency.length > 0) {
    const best = rankByQuality(withinLatency);
    return { model: best, reason: 'best-fit', confidence: 0.9 };
  }

  if (withinBudget.length > 0) {
    const best = rankByQuality(withinBudget);
    return { model: best, reason: 'relaxed-latency', confidence: 0.7 };
  }

  if (withinProvider.length > 0) {
    const best = rankByQuality(withinProvider);
    return { model: best, reason: 'relaxed-cost', confidence: 0.6 };
  }

  // 5. No constraints met — pick best quality from all candidates
  const best = rankByQuality(candidates);
  return { model: best, reason: 'relaxed-cost', confidence: 0.5 };
}

/** Filter models by preferred providers */
function filterByProvider(models: ModelInfo[], constraints: RoutingConstraints): ModelInfo[] {
  if (constraints.preferredProviders.length === 0) return models;

  const filtered = models.filter((m) => constraints.preferredProviders.includes(m.provider));

  // If no models match preferred providers, return all
  return filtered.length > 0 ? filtered : models;
}

/** Rank models by quality score (highest first) and return the best */
function rankByQuality(models: ModelInfo[]): ModelInfo {
  const sorted = [...models].sort((a, b) => b.qualityScore - a.qualityScore);
  return sorted[0] as ModelInfo;
}

/** Check if a model meets all hard constraints */
function meetsConstraints(model: ModelInfo, constraints: RoutingConstraints): boolean {
  return (
    model.costPer1kTokens <= constraints.maxCostPer1kTokens &&
    model.p95LatencyMs <= constraints.maxLatencyMs
  );
}

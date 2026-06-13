import { z } from 'zod';

/** Valid step types for routing configuration */
const stepTypeSchema = z.enum([
  'reasoning',
  'code-gen',
  'summarization',
  'writing',
  'research',
  'editing',
]);

/** Per-step-type routing preference */
const routingPreferenceSchema = z.object({
  prefer: z.string(),
  fallback: z.string(),
});

/** Provider configuration */
const providerConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key must not be empty'),
});

/** Vertex AI provider configuration */
const vertexConfigSchema = z.object({
  projectId: z.string().min(1, 'Project ID must not be empty'),
  location: z.string().default('us-central1'),
  apiKey: z.string().optional(),
});

/** Constraints configuration */
const constraintsSchema = z.object({
  maxCostPerRun: z.number().positive().default(0.5),
  maxCostPer1kTokens: z.number().positive().default(0.02),
  maxLatencyPerStep: z.number().positive().default(30_000),
  preferredProviders: z.array(z.string()).default(['anthropic', 'openai']),
  privacyLevel: z.enum(['standard', 'strict']).default('standard'),
});

/** Routing configuration — maps step types to model preferences */
const routingSchema = z.record(stepTypeSchema, routingPreferenceSchema).default({});

/** Trace storage configuration */
const traceSchema = z.object({
  store: z.enum(['local']).default('local'),
  directory: z.string().default('.routewise/runs'),
});

/** Full routewise configuration schema */
export const routewiseConfigSchema = z.object({
  providers: z
    .object({
      anthropic: providerConfigSchema.optional(),
      openai: providerConfigSchema.optional(),
      vertex: vertexConfigSchema.optional(),
    })
    .default({}),
  constraints: constraintsSchema.default({}),
  routing: routingSchema,
  trace: traceSchema.default({}),
});

/** Inferred TypeScript type from the Zod schema */
export type RoutewiseConfig = z.infer<typeof routewiseConfigSchema>;

/** Partial config type for user input (before defaults are applied) */
export type RoutewiseUserConfig = z.input<typeof routewiseConfigSchema>;

export { stepTypeSchema, routingPreferenceSchema, constraintsSchema, traceSchema };

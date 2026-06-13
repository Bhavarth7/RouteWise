import { cosmiconfig } from 'cosmiconfig';
import { defaultConfig } from './defaults.js';
import { type RoutewiseConfig, routewiseConfigSchema } from './schema.js';

/** Error thrown when config validation fails */
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly issues: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Resolve an API key value — supports `env:VAR_NAME` syntax */
export function resolveApiKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('env:')) {
    const envVar = value.slice(4);
    return process.env[envVar];
  }
  return value;
}

/** Load and validate routewise config from the filesystem */
export async function loadConfig(searchFrom?: string): Promise<RoutewiseConfig> {
  const explorer = cosmiconfig('routewise', {
    searchPlaces: [
      'routewise.config.ts',
      'routewise.config.js',
      'routewise.config.mjs',
      '.routewiserc',
      '.routewiserc.json',
      '.routewiserc.yaml',
      '.routewiserc.yml',
      'package.json',
    ],
  });

  const result = await explorer.search(searchFrom);

  // Merge with defaults — user config overrides defaults
  const rawConfig = result?.config ? deepMerge(defaultConfig, result.config) : defaultConfig;

  // Validate with Zod
  const parsed = routewiseConfigSchema.safeParse(rawConfig);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new ConfigError(
      `Invalid routewise config: ${issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`,
      issues,
    );
  }

  return parsed.data;
}

/** Helper to define config with type checking (for routewise.config.ts) */
export function defineConfig(config: unknown): unknown {
  return config;
}

/** Deep merge two objects — source overrides target */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (isPlainObject(sourceVal) && isPlainObject(targetVal)) {
      output[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      );
    } else {
      output[key] = sourceVal;
    }
  }

  return output;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

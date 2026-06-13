import { describe, expect, it } from 'vitest';
import { routewiseConfigSchema } from '../../../src/config/schema.js';

describe('config schema', () => {
  it('validates a complete valid config', () => {
    const config = {
      providers: {
        anthropic: { apiKey: 'env:ANTHROPIC_API_KEY' },
        openai: { apiKey: 'env:OPENAI_API_KEY' },
      },
      constraints: {
        maxCostPerRun: 0.5,
        maxCostPer1kTokens: 0.02,
        maxLatencyPerStep: 30_000,
        preferredProviders: ['anthropic', 'openai'],
        privacyLevel: 'standard' as const,
      },
      routing: {
        reasoning: { prefer: 'claude-sonnet-4-20250514', fallback: 'gpt-4o' },
        'code-gen': { prefer: 'claude-sonnet-4-20250514', fallback: 'gpt-4o' },
      },
      trace: {
        store: 'local' as const,
        directory: '.routewise/runs',
      },
    };

    const result = routewiseConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('applies defaults for missing optional fields', () => {
    const minimalConfig = {};
    const result = routewiseConfigSchema.safeParse(minimalConfig);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.constraints.maxCostPerRun).toBe(0.5);
      expect(result.data.constraints.maxLatencyPerStep).toBe(30_000);
      expect(result.data.constraints.privacyLevel).toBe('standard');
      expect(result.data.trace.store).toBe('local');
      expect(result.data.trace.directory).toBe('.routewise/runs');
    }
  });

  it('rejects invalid privacy level', () => {
    const config = {
      constraints: {
        privacyLevel: 'invalid',
      },
    };

    const result = routewiseConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('rejects negative cost values', () => {
    const config = {
      constraints: {
        maxCostPerRun: -1,
      },
    };

    const result = routewiseConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('rejects empty API key string', () => {
    const config = {
      providers: {
        anthropic: { apiKey: '' },
      },
    };

    const result = routewiseConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('accepts config with only some routing entries', () => {
    const config = {
      routing: {
        reasoning: { prefer: 'claude-sonnet-4-20250514', fallback: 'gpt-4o' },
      },
    };

    const result = routewiseConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.routing.reasoning).toEqual({
        prefer: 'claude-sonnet-4-20250514',
        fallback: 'gpt-4o',
      });
    }
  });

  it('rejects invalid step type in routing', () => {
    const config = {
      routing: {
        'invalid-type': { prefer: 'model-a', fallback: 'model-b' },
      },
    };

    const result = routewiseConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('rejects routing preference without fallback', () => {
    const config = {
      routing: {
        reasoning: { prefer: 'claude-sonnet-4-20250514' },
      },
    };

    const result = routewiseConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});

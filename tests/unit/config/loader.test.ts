import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigError, resolveApiKey } from '../../../src/config/loader.js';

describe('resolveApiKey', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves env: prefix to environment variable', () => {
    vi.stubEnv('TEST_API_KEY', 'sk-test-12345');
    const result = resolveApiKey('env:TEST_API_KEY');
    expect(result).toBe('sk-test-12345');
  });

  it('returns undefined when env var is not set', () => {
    const result = resolveApiKey('env:NONEXISTENT_VAR');
    expect(result).toBeUndefined();
  });

  it('returns raw value when no env: prefix', () => {
    const result = resolveApiKey('sk-direct-key');
    expect(result).toBe('sk-direct-key');
  });

  it('returns undefined for undefined input', () => {
    const result = resolveApiKey(undefined);
    expect(result).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const result = resolveApiKey('');
    expect(result).toBeUndefined();
  });
});

describe('ConfigError', () => {
  it('includes issues array', () => {
    const issues = [{ path: 'constraints.maxCostPerRun', message: 'Number must be positive' }];
    const error = new ConfigError('Invalid config', issues);

    expect(error.name).toBe('ConfigError');
    expect(error.message).toBe('Invalid config');
    expect(error.issues).toEqual(issues);
  });

  it('is an instance of Error', () => {
    const error = new ConfigError('test', []);
    expect(error).toBeInstanceOf(Error);
  });
});

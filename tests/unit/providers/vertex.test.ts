import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VertexProvider } from '../../../src/providers/vertex.js';

describe('VertexProvider', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('has correct name', () => {
    const provider = new VertexProvider({ projectId: 'test-project', apiKey: 'test-key' });
    expect(provider.name).toBe('vertex');
  });

  it('is available when project ID and API key are provided', () => {
    const provider = new VertexProvider({ projectId: 'test-project', apiKey: 'test-key' });
    expect(provider.isAvailable()).toBe(true);
  });

  it('is available when project ID and ADC credentials are set', () => {
    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', '/path/to/creds.json');
    const provider = new VertexProvider({ projectId: 'test-project' });
    expect(provider.isAvailable()).toBe(true);
  });

  it('is not available without project ID', () => {
    const provider = new VertexProvider({ apiKey: 'test-key' });
    expect(provider.isAvailable()).toBe(false);
  });

  it('is not available without auth', () => {
    const provider = new VertexProvider({ projectId: 'test-project' });
    expect(provider.isAvailable()).toBe(false);
  });

  it('lists supported models', () => {
    const provider = new VertexProvider({ projectId: 'test-project', apiKey: 'key' });
    const models = provider.listModels();
    expect(models).toContain('gemini-3.5-flash');
    expect(models).toContain('gemini-3.1-pro');
    expect(models).toContain('gemini-3.1-flash-lite');
  });

  it('reads config from environment variables', () => {
    vi.stubEnv('VERTEX_PROJECT_ID', 'my-project');
    vi.stubEnv('VERTEX_LOCATION', 'europe-west1');
    vi.stubEnv('VERTEX_API_KEY', 'my-key');

    const provider = new VertexProvider();
    expect(provider.isAvailable()).toBe(true);
  });

  it('throws when not configured', async () => {
    const provider = new VertexProvider();
    await expect(provider.complete('Hello')).rejects.toThrow(
      'Vertex AI provider is not configured',
    );
  });

  it('uses provided location or defaults to us-central1', () => {
    const provider1 = new VertexProvider({ projectId: 'p', apiKey: 'k', location: 'asia-east1' });
    expect(provider1.isAvailable()).toBe(true);

    const provider2 = new VertexProvider({ projectId: 'p', apiKey: 'k' });
    expect(provider2.isAvailable()).toBe(true);
  });
});

import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FullTrace, TraceMetadata, TraceStepEntry } from './types.js';

/** File-based trace store — one folder per run */
export class TraceStore {
  constructor(private baseDir: string) {}

  /** Create the run directory and write initial trace.json */
  async startRun(metadata: TraceMetadata): Promise<void> {
    const runDir = this.getRunDir(metadata.runId);
    await mkdir(join(runDir, 'artifacts'), { recursive: true });
    await writeFile(join(runDir, 'trace.json'), JSON.stringify(metadata, null, 2), 'utf-8');
    // Create empty steps.jsonl
    await writeFile(join(runDir, 'steps.jsonl'), '', 'utf-8');
  }

  /** Append a step entry to steps.jsonl */
  async appendStep(runId: string, step: TraceStepEntry): Promise<void> {
    const stepsFile = join(this.getRunDir(runId), 'steps.jsonl');
    const line = `${JSON.stringify(step)}\n`;
    await writeFile(stepsFile, line, { flag: 'a', encoding: 'utf-8' });
  }

  /** Update trace.json with final metadata (completedAt, status, totals) */
  async completeRun(metadata: TraceMetadata): Promise<void> {
    const traceFile = join(this.getRunDir(metadata.runId), 'trace.json');
    await writeFile(traceFile, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  /** Save an artifact file for a step */
  async saveArtifact(runId: string, filename: string, content: string): Promise<string> {
    const artifactPath = `artifacts/${filename}`;
    const fullPath = join(this.getRunDir(runId), 'artifacts', filename);
    await writeFile(fullPath, content, 'utf-8');
    return artifactPath;
  }

  /** Load a complete trace (metadata + steps) */
  async getTrace(runId: string): Promise<FullTrace | null> {
    const runDir = this.getRunDir(runId);
    if (!existsSync(runDir)) return null;

    const traceFile = join(runDir, 'trace.json');
    const stepsFile = join(runDir, 'steps.jsonl');

    const metadataRaw = await readFile(traceFile, 'utf-8');
    const metadata = JSON.parse(metadataRaw) as TraceMetadata;

    const stepsRaw = await readFile(stepsFile, 'utf-8');
    const steps = stepsRaw
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as TraceStepEntry);

    return { metadata, steps };
  }

  /** Get the most recent run ID */
  async getLatestRunId(): Promise<string | null> {
    if (!existsSync(this.baseDir)) return null;

    const entries = await readdir(this.baseDir, { withFileTypes: true });
    const runDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('run_'))
      .map((e) => e.name)
      .sort()
      .reverse();

    return runDirs[0] ?? null;
  }

  /** List all run IDs (most recent first) */
  async listRuns(): Promise<string[]> {
    if (!existsSync(this.baseDir)) return [];

    const entries = await readdir(this.baseDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && e.name.startsWith('run_'))
      .map((e) => e.name)
      .sort()
      .reverse();
  }

  private getRunDir(runId: string): string {
    return join(this.baseDir, runId);
  }
}

import { describe, expect, it } from 'vitest';
import { classify } from '../../../src/core/classifier.js';

describe('classifier', () => {
  it('classifies code generation prompts', () => {
    const result = classify('Implement a user authentication middleware');
    expect(result.type).toBe('code-gen');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies scaffold/build prompts as code-gen', () => {
    const result = classify('Build a REST API endpoint for user profiles');
    expect(result.type).toBe('code-gen');
  });

  it('classifies summarization prompts', () => {
    const result = classify('Summarize the key points from this document');
    expect(result.type).toBe('summarization');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('classifies writing prompts', () => {
    const result = classify('Write a README for the project');
    expect(result.type).toBe('writing');
  });

  it('classifies documentation prompts as writing', () => {
    const result = classify('Draft a tutorial explaining how to use the CLI');
    expect(result.type).toBe('writing');
  });

  it('classifies research prompts', () => {
    const result = classify('Research the best database options for this use case');
    expect(result.type).toBe('research');
  });

  it('classifies comparison prompts as research', () => {
    const result = classify('Compare React vs Vue for our frontend');
    expect(result.type).toBe('research');
  });

  it('classifies editing prompts', () => {
    const result = classify('Edit and proofread this document for clarity');
    expect(result.type).toBe('editing');
  });

  it('classifies reasoning/planning prompts', () => {
    const result = classify('Design the architecture for the payment system');
    expect(result.type).toBe('reasoning');
  });

  it('defaults to reasoning for ambiguous prompts', () => {
    const result = classify('Do the thing with the stuff');
    expect(result.type).toBe('reasoning');
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('has lower confidence when types are close', () => {
    // "Write code" matches both writing and code-gen
    const result = classify('Write code for the login page');
    expect(result.confidence).toBeLessThan(0.9);
  });

  it('always returns a valid StepType', () => {
    const validTypes = ['reasoning', 'code-gen', 'summarization', 'writing', 'research', 'editing'];
    const prompts = ['Hello world', '', 'a', 'Do something complex with multiple aspects'];

    for (const prompt of prompts) {
      const result = classify(prompt);
      expect(validTypes).toContain(result.type);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });
});

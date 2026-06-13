import { describe, expect, it } from 'vitest';
import { evaluate } from '../../../src/core/evaluator.js';

describe('evaluator', () => {
  describe('universal checks', () => {
    it('fails on empty output', () => {
      const result = evaluate('', 'code-gen');
      expect(result.passed).toBe(false);
      expect(result.checks).toContain('non-empty: FAILED');
    });

    it('fails on whitespace-only output', () => {
      const result = evaluate('   \n  \t  ', 'writing');
      expect(result.passed).toBe(false);
    });

    it('always has null humanVerdict by default', () => {
      const result = evaluate('some output', 'reasoning');
      expect(result.humanVerdict).toBeNull();
    });
  });

  describe('code-gen evaluation', () => {
    it('passes for valid code with balanced braces', () => {
      const code = `
function hello() {
  const x = 1;
  if (x > 0) {
    return true;
  }
  return false;
}`;
      const result = evaluate(code, 'code-gen');
      expect(result.passed).toBe(true);
      expect(result.checks).toContain('code-structure: OK');
      expect(result.checks).toContain('balanced-braces: OK');
    });

    it('fails for unbalanced braces', () => {
      const code = `function broken() {
  if (true) {
    if (nested) {
      return;
    }
// two closing braces missing`;
      const result = evaluate(code, 'code-gen');
      expect(result.passed).toBe(false);
      expect(result.checks).toContain('balanced-braces: FAILED');
    });
  });

  describe('writing evaluation', () => {
    it('passes for structured content over 200 chars', () => {
      const content = `# My Document

This is a well-structured document with multiple sections.

## Section One

Here is some content that provides value to the reader. It covers the topic
thoroughly and provides examples where needed.

## Section Two

More content here with additional details and explanations.`;
      const result = evaluate(content, 'writing');
      expect(result.passed).toBe(true);
      expect(result.checks).toContain('min-length: OK');
      expect(result.checks).toContain('has-structure: OK');
    });

    it('fails for content under 200 chars', () => {
      const result = evaluate('Short text.', 'writing');
      expect(result.passed).toBe(false);
      expect(result.checks).toContain('min-length: FAILED (under 200 chars)');
    });
  });

  describe('summarization evaluation', () => {
    it('passes when shorter than input and key terms preserved', () => {
      const original =
        'TypeScript is a programming language that builds on JavaScript by adding static type definitions. Types provide a way to describe the shape of an object.';
      const summary = 'TypeScript adds static types to JavaScript for better code quality.';
      const result = evaluate(summary, 'summarization', {
        originalInput: original,
        keyTerms: ['TypeScript', 'JavaScript', 'types', 'static'],
      });
      expect(result.passed).toBe(true);
      expect(result.checks).toContain('shorter-than-input: OK');
    });

    it('fails when longer than input', () => {
      const original = 'Short input.';
      const summary = 'This is a much longer output that exceeds the original input significantly.';
      const result = evaluate(summary, 'summarization', {
        originalInput: original,
      });
      expect(result.passed).toBe(false);
      expect(result.checks).toContain('shorter-than-input: FAILED');
    });

    it('fails when too few key terms preserved', () => {
      const result = evaluate('Something completely unrelated.', 'summarization', {
        keyTerms: ['TypeScript', 'JavaScript', 'types', 'static', 'compiler', 'interfaces'],
      });
      expect(result.passed).toBe(false);
    });
  });

  describe('reasoning evaluation', () => {
    it('passes for ordered list with concrete actions', () => {
      const plan = `1. Create the database schema for users
2. Implement the API endpoints for CRUD
3. Add validation middleware
4. Write integration tests
5. Deploy to staging`;
      const result = evaluate(plan, 'reasoning');
      expect(result.passed).toBe(true);
      expect(result.checks).toContain('ordered-items: OK');
      expect(result.checks).toContain('min-length: OK');
      expect(result.checks).toContain('concrete-actions: OK');
    });

    it('fails for output under 100 chars', () => {
      const result = evaluate('Do stuff.', 'reasoning');
      expect(result.passed).toBe(false);
      expect(result.checks).toContain('min-length: FAILED (under 100 chars)');
    });

    it('passes for bullet list format', () => {
      const plan = `- Create the data model with proper types
- Build the service layer with error handling
- Add test coverage for edge cases
- Set up monitoring and alerting`;
      const result = evaluate(plan, 'reasoning');
      expect(result.passed).toBe(true);
      expect(result.checks).toContain('ordered-items: OK');
    });
  });

  describe('research evaluation', () => {
    it('uses same heuristics as reasoning', () => {
      const research = `1. Investigate PostgreSQL performance for time-series data
2. Compare with TimescaleDB extension
3. Test query patterns with sample data
4. Document findings and recommendation`;
      const result = evaluate(research, 'research');
      expect(result.passed).toBe(true);
    });
  });

  describe('editing evaluation', () => {
    it('uses same heuristics as writing', () => {
      const edited = `# Revised Document

This document has been revised for clarity and consistency.

## Key Changes

- Improved sentence structure throughout
- Fixed grammatical errors in section 2
- Reorganized the introduction for better flow
- Added transition sentences between paragraphs`;
      const result = evaluate(edited, 'editing');
      expect(result.passed).toBe(true);
    });
  });
});

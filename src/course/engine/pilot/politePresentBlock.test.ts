import { describe, expect, it } from 'vitest';
import { politePresentBlock } from './politePresentBlock';
import { validateLesson } from '../validateLesson';
import { estimateMinutes } from '../estimateDuration';

describe('pilot: polite non-past', () => {
  it('is a valid new-block lesson', () => {
    expect(validateLesson(politePresentBlock)).toEqual([]);
  });

  it('lands in the fifteen-to-twenty-five minute design target', () => {
    const minutes = estimateMinutes(politePresentBlock.steps);
    expect(minutes).toBeGreaterThanOrEqual(15);
    expect(minutes).toBeLessThanOrEqual(25);
  });

  it('teaches several connected concepts, not one', () => {
    expect(politePresentBlock.teaches.length).toBeGreaterThanOrEqual(3);
  });

  it('introduces vocabulary in batches, never as one long list', () => {
    const batches = politePresentBlock.steps.filter((s) => s.kind === 'lexBatch');
    expect(batches.length).toBeGreaterThanOrEqual(2);
    for (const batch of batches) {
      expect(batch.kind).toBe('lexBatch');
      if (batch.kind === 'lexBatch') expect(batch.lexemes.length).toBeLessThanOrEqual(6);
    }
  });

  it('carries both Italian and English for every learner-visible string', () => {
    const missing: string[] = [];
    const walk = (value: unknown, path: string): void => {
      if (value === null || typeof value !== 'object') return;
      const record = value as Record<string, unknown>;
      if ('it' in record && !('en' in record)) missing.push(path);
      for (const [key, next] of Object.entries(record)) walk(next, `${path}.${key}`);
    };
    walk(politePresentBlock, 'lesson');
    expect(missing).toEqual([]);
  });
});

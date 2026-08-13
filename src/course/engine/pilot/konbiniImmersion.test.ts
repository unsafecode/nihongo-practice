import { describe, expect, it } from 'vitest';
import { konbiniImmersion } from './konbiniImmersion';
import { validateLesson } from '../validateLesson';
import { estimateMinutes } from '../estimateDuration';

describe('pilot: konbini immersion', () => {
  it('is a valid immersion lesson', () => {
    expect(validateLesson(konbiniImmersion)).toEqual([]);
  });

  it('lands in the fifteen-to-twenty-five minute design target', () => {
    const minutes = estimateMinutes(konbiniImmersion.steps);
    expect(minutes).toBeGreaterThanOrEqual(15);
    expect(minutes).toBeLessThanOrEqual(25);
  });

  it('teaches several connected concepts, not one', () => {
    expect(konbiniImmersion.teaches.length).toBeGreaterThanOrEqual(3);
  });

  it('carries both Italian and English for every learner-visible string', () => {
    const missing: string[] = [];
    const walk = (value: unknown, path: string): void => {
      if (value === null || typeof value !== 'object') return;
      const record = value as Record<string, unknown>;
      if ('it' in record && !('en' in record)) missing.push(path);
      for (const [key, next] of Object.entries(record)) walk(next, `${path}.${key}`);
    };
    walk(konbiniImmersion, 'lesson');
    expect(missing).toEqual([]);
  });

  it('opens with a scene rather than a rule', () => {
    expect(konbiniImmersion.steps[0]?.kind).toBe('dialogueScene');
  });

  it('uses a scene long enough to be immersive', () => {
    const scene = konbiniImmersion.steps[0];
    expect(scene?.kind).toBe('dialogueScene');
    if (scene?.kind === 'dialogueScene') expect(scene.turns.length).toBeGreaterThanOrEqual(8);
  });
});

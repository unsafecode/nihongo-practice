import { describe, expect, it } from 'vitest';
import { estimateMinutes, DURATION_BOUNDS } from './estimateDuration';
import type { Step, StepId } from './types';

const step = (estimateSeconds: number, optional = false): Step =>
  ({ id: 's' as StepId, kind: 'quiz', estimateSeconds, optional,
     prompt: { it: '', en: '' }, options: [], correctIndex: 0 }) as Step;

describe('estimateMinutes', () => {
  it('sums step estimates and rounds to the nearest minute', () => {
    expect(estimateMinutes([step(90), step(90), step(60)])).toBe(4);
  });

  it('counts optional steps at half weight, since many learners skip them', () => {
    expect(estimateMinutes([step(600), step(600, true)])).toBe(15);
  });

  it('returns zero for an empty lesson rather than throwing', () => {
    expect(estimateMinutes([])).toBe(0);
  });

  it('enforces twelve to twenty-eight minutes', () => {
    expect(DURATION_BOUNDS).toEqual({ min: 12, max: 28 });
  });
});

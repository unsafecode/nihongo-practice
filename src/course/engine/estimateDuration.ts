import type { Step } from './types';

/**
 * Design target is 15-25 minutes; these are the enforced outer bounds.
 * See 2026-08-13 design, §5.4.
 */
export const DURATION_BOUNDS = { min: 12, max: 28 } as const;

export function estimateMinutes(steps: readonly Step[]): number {
  const seconds = steps.reduce(
    (total, step) => total + (step.optional === true ? step.estimateSeconds / 2 : step.estimateSeconds),
    0,
  );
  return Math.round(seconds / 60);
}

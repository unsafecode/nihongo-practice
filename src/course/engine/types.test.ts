import { describe, expect, it } from 'vitest';
import { LAYOUT_MODES, STEP_KINDS, type LayoutMode, type StepKind } from './types';

describe('engine types', () => {
  it('exposes exactly three layout modes', () => {
    expect([...LAYOUT_MODES]).toEqual(['stage', 'editorial', 'workbench']);
  });

  it('exposes a closed step-kind set of seventeen kinds', () => {
    expect(STEP_KINDS).toHaveLength(17);
    expect(new Set(STEP_KINDS).size).toBe(17);
  });

  it('includes every kind the Phase 0 archetypes need', () => {
    const phase0: readonly StepKind[] = [
      'hook', 'rule', 'lexBatch', 'guidedBuild', 'examples', 'quiz', 'recap',
      'dialogueScene', 'comprehension', 'breakdown',
    ];
    for (const kind of phase0) expect(STEP_KINDS).toContain(kind);
  });

  it('keeps layout modes assignable to the LayoutMode type', () => {
    const mode: LayoutMode = LAYOUT_MODES[0];
    expect(mode).toBe('stage');
  });
});

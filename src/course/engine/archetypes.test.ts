import { describe, expect, it } from 'vitest';
import { ARCHETYPES, archetypeById } from './archetypes';
import { LAYOUT_MODES, STEP_KINDS } from './types';

describe('archetypes', () => {
  it('defines all six', () => {
    expect(ARCHETYPES.map((a) => a.id)).toEqual([
      'new-block', 'immersion', 'workshop', 'listening', 'roleplay', 'checkpoint',
    ]);
  });

  it('gives each archetype a valid layout mode', () => {
    for (const a of ARCHETYPES) expect(LAYOUT_MODES).toContain(a.layout);
  });

  it('only references known step kinds', () => {
    for (const a of ARCHETYPES)
      for (const phase of a.phases)
        for (const kind of phase.kinds) expect(STEP_KINDS).toContain(kind);
  });

  it('gives the two Phase 0 archetypes genuinely different shapes', () => {
    const block = archetypeById('new-block');
    const immersion = archetypeById('immersion');
    expect(block.layout).toBe('editorial');
    expect(immersion.layout).toBe('stage');
    expect(block.phases[0]?.kinds).toContain('hook');
    expect(immersion.phases[0]?.kinds).toContain('dialogueScene');
  });

  it('keeps phase minimums consistent with the archetype minimum', () => {
    for (const a of ARCHETYPES) {
      const phaseMin = a.phases.reduce((n, p) => n + p.min, 0);
      expect(phaseMin).toBeLessThanOrEqual(a.minSteps);
      expect(a.minSteps).toBeLessThanOrEqual(a.maxSteps);
    }
  });

  it('throws on an unknown archetype id rather than returning undefined', () => {
    // @ts-expect-error deliberately invalid
    expect(() => archetypeById('nope')).toThrow(/unknown archetype/i);
  });
});

/**
 * Phase `name` is a machine key used in validation messages and React keys.
 * The rail renders phase labels to the learner, so every phase needs real
 * localized copy: rendering the raw key put untranslated English ids
 * ("open", "teach", "apply") into an otherwise fully Italian UI.
 */
describe("archetype phases carry learner-facing labels", () => {
  for (const archetype of ARCHETYPES) {
    it(`${archetype.id}: every phase has non-empty it and en copy`, () => {
      for (const phase of archetype.phases) {
        expect(phase.label.it.trim(), `${phase.name}.it`).not.toBe("");
        expect(phase.label.en.trim(), `${phase.name}.en`).not.toBe("");
      }
    });

    it(`${archetype.id}: no label is just the machine key`, () => {
      const lazy = archetype.phases.filter(
        (phase) => phase.label.it === phase.name || phase.label.en === phase.name,
      );
      expect(lazy.map((phase) => phase.name)).toEqual([]);
    });
  }
});

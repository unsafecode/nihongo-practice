import { describe, expect, it } from 'vitest';
import { validateLesson } from './validateLesson';
import type { Lesson } from './types';

// Minimal helpers keep the test readable; build real lessons from these.
const quiz = (id: string, seconds = 120) =>
  ({ id, kind: 'quiz', estimateSeconds: seconds,
     prompt: { it: 'p', en: 'p' }, options: ['a', 'b'], correctIndex: 0 }) as never;

const conformingBlock = (): Lesson => ({
  id: 'pilot' as never, unitId: 'u1' as never, archetype: 'new-block',
  title: { it: 'T', en: 'T' }, canDo: { it: 'C', en: 'C' },
  teaches: [], requires: [], lexemes: [],
  steps: [
    { id: 'h', kind: 'hook', estimateSeconds: 60,
      situation: { it: 's', en: 's' }, canDo: { it: 'c', en: 'c' } },
    { id: 'r', kind: 'rule', estimateSeconds: 120,
      statement: { it: 's', en: 's' }, boundary: { it: 'b', en: 'b' },
      counterExample: { it: 'x', en: 'x' } },
    { id: 'l1', kind: 'lexBatch', estimateSeconds: 180, lexemes: ['a', 'b', 'c', 'd'] as never },
    { id: 'l2', kind: 'lexBatch', estimateSeconds: 180, lexemes: ['e', 'f', 'g', 'h'] as never },
    { id: 'g', kind: 'guidedBuild', estimateSeconds: 240,
      target: { kana: 'か', romaji: 'ka', literal: { it: '', en: '' }, natural: { it: '', en: '' } },
      fragments: ['か'], distractors: [] },
    { id: 'e', kind: 'examples', estimateSeconds: 180, lines: [] },
    quiz('q1'), quiz('q2'),
    { id: 'rc', kind: 'recap', estimateSeconds: 90, learned: [], next: { it: 'n', en: 'n' } },
  ] as never,
});

describe('validateLesson', () => {
  it('accepts a conforming lesson', () => {
    expect(validateLesson(conformingBlock())).toEqual([]);
  });

  it('rejects a lesson shorter than twelve minutes', () => {
    const short = { ...conformingBlock(),
      steps: conformingBlock().steps.map((s) => ({ ...s, estimateSeconds: 10 })) };
    expect(validateLesson(short as Lesson)).toContainEqual(
      expect.objectContaining({ code: 'duration-out-of-bounds' }),
    );
  });

  it('rejects a lesson longer than twenty-eight minutes', () => {
    const long = { ...conformingBlock(),
      steps: conformingBlock().steps.map((s) => ({ ...s, estimateSeconds: 600 })) };
    expect(validateLesson(long as Lesson)).toContainEqual(
      expect.objectContaining({ code: 'duration-out-of-bounds' }),
    );
  });

  it('rejects steps that violate the archetype phase order', () => {
    const scrambled = conformingBlock();
    const steps = [...scrambled.steps];
    const reordered = [steps[8]!, ...steps.slice(0, 8)]; // recap first
    expect(validateLesson({ ...scrambled, steps: reordered } as Lesson)).toContainEqual(
      expect.objectContaining({ code: 'archetype-violation' }),
    );
  });

  it('rejects a lexBatch outside four to six lexemes', () => {
    const lesson = conformingBlock();
    const steps = lesson.steps.map((s) =>
      s.kind === 'lexBatch' ? { ...s, lexemes: ['only-one'] } : s);
    expect(validateLesson({ ...lesson, steps } as Lesson)).toContainEqual(
      expect.objectContaining({ code: 'lex-batch-size' }),
    );
  });

  it('rejects duplicate step ids', () => {
    const lesson = conformingBlock();
    const steps = lesson.steps.map((s) => ({ ...s, id: 'same' }));
    expect(validateLesson({ ...lesson, steps } as unknown as Lesson)).toContainEqual(
      expect.objectContaining({ code: 'duplicate-step-id' }),
    );
  });

  it('rejects a lesson that requires a concept it also teaches', () => {
    const lesson = { ...conformingBlock(),
      teaches: ['c1'] as never, requires: ['c1'] as never };
    expect(validateLesson(lesson as Lesson)).toContainEqual(
      expect.objectContaining({ code: 'self-prerequisite' }),
    );
  });

  it('reports every distinct problem, not just the first', () => {
    const broken = { ...conformingBlock(), teaches: ['c1'] as never,
      requires: ['c1'] as never,
      steps: conformingBlock().steps.map((s) => ({ ...s, estimateSeconds: 5 })) };
    const codes = validateLesson(broken as Lesson).map((e) => e.code);
    expect(new Set(codes)).toEqual(new Set(['duration-out-of-bounds', 'self-prerequisite']));
  });
});

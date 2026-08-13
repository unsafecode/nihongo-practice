import { archetypeById } from './archetypes';
import { DURATION_BOUNDS, estimateMinutes } from './estimateDuration';
import type { Lesson, Step } from './types';

export interface LessonProblem {
  readonly code:
    | 'duration-out-of-bounds' | 'archetype-violation' | 'lex-batch-size'
    | 'duplicate-step-id' | 'self-prerequisite' | 'step-count-out-of-bounds';
  readonly detail: string;
}

/** Walks the step list against the archetype's ordered phases. */
function checkPhases(lesson: Lesson): LessonProblem[] {
  const archetype = archetypeById(lesson.archetype);
  const problems: LessonProblem[] = [];
  let index = 0;

  for (const phase of archetype.phases) {
    let taken = 0;
    while (
      index < lesson.steps.length &&
      taken < phase.max &&
      phase.kinds.includes(lesson.steps[index]!.kind)
    ) {
      index += 1;
      taken += 1;
    }
    if (taken < phase.min) {
      problems.push({
        code: 'archetype-violation',
        detail: `phase "${phase.name}" needs at least ${phase.min} step(s) of ${phase.kinds.join('|')}, found ${taken}`,
      });
    }
  }

  if (index < lesson.steps.length) {
    problems.push({
      code: 'archetype-violation',
      detail: `step ${index} (${lesson.steps[index]!.kind}) does not fit any remaining phase`,
    });
  }
  return problems;
}

export function validateLesson(lesson: Lesson): readonly LessonProblem[] {
  const problems: LessonProblem[] = [];
  const archetype = archetypeById(lesson.archetype);

  const minutes = estimateMinutes(lesson.steps);
  if (minutes < DURATION_BOUNDS.min || minutes > DURATION_BOUNDS.max) {
    problems.push({
      code: 'duration-out-of-bounds',
      detail: `${minutes} min is outside ${DURATION_BOUNDS.min}-${DURATION_BOUNDS.max}`,
    });
  }

  if (lesson.steps.length < archetype.minSteps || lesson.steps.length > archetype.maxSteps) {
    problems.push({
      code: 'step-count-out-of-bounds',
      detail: `${lesson.steps.length} steps outside ${archetype.minSteps}-${archetype.maxSteps}`,
    });
  }

  problems.push(...checkPhases(lesson));

  for (const step of lesson.steps) {
    if (step.kind === 'lexBatch' && (step.lexemes.length < 4 || step.lexemes.length > 6)) {
      problems.push({
        code: 'lex-batch-size',
        detail: `step ${step.id} introduces ${step.lexemes.length} lexemes; use 4-6`,
      });
    }
  }

  const ids = lesson.steps.map((s: Step) => s.id);
  if (new Set(ids).size !== ids.length) {
    problems.push({ code: 'duplicate-step-id', detail: `duplicate step id in ${lesson.id}` });
  }

  const taught = new Set<string>(lesson.teaches);
  for (const required of lesson.requires) {
    if (taught.has(required)) {
      problems.push({
        code: 'self-prerequisite',
        detail: `${lesson.id} both teaches and requires ${required}`,
      });
    }
  }

  return problems;
}

export function assertLessonValid(lesson: Lesson): void {
  const problems = validateLesson(lesson);
  if (problems.length > 0) {
    throw new Error(
      `Lesson ${lesson.id} is invalid:\n` +
        problems.map((p) => `  ${p.code}: ${p.detail}`).join('\n'),
    );
  }
}

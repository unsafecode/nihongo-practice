import { curriculumFoundation } from "../curriculum/foundation";
import { genericPersonas } from "../data/personas";
import type { LessonId, ModuleId } from "../data/types";
import { concepts } from "./concepts";
import {
  curriculumExamples,
  curriculumExamplesById,
} from "./examples";
import { lexiconById, verbLexemes } from "./lexicon";
import {
  speechPromptIdForLesson,
  speechPrompts,
} from "./speechPrompts";
import { en as enCopy } from "./copy/en";
import { it as itCopy } from "./copy/it";
import {
  curriculumExercises,
  exerciseIdsByLesson,
} from "./exercises";
import {
  lessonPlans,
  exampleIdsForPlan,
} from "./lessonPlans";
import type {
  AssembledCurriculumCatalogs,
  ConceptId,
  CurriculumCopyCatalog,
  CurriculumLessonEntry,
  CurriculumModuleEntry,
  LexemeId,
  ModuleCoverage,
} from "./types";

export { lessonPlans };
export type { LessonPlan } from "./lessonPlans";

/**
 * The assembled A0→A1 curriculum (design spec §5, §6, §9 and Slice B plan
 * Task 3). This file assembles the 40 lesson boundaries from the authored
 * lesson plans (`lessonPlans.ts`) — which concepts and lexemes each lesson
 * introduces, practices, and assesses, which shared examples it shows, its
 * spoken target, and its shared exercise definitions (`exercises.ts`) — then
 * derives locale-independent lesson and module coverage from those plans.
 *
 * Coverage is never hand-counted: `moduleCoverage` is computed from the lessons
 * with the same rules `validateCurriculum` re-derives, so the authored and
 * computed matrices are provably identical. Japanese lives only in the example
 * catalog; localized prose lives only in the copy catalogs.
 */

const ALL_VERB_IDS: readonly LexemeId[] = verbLexemes.map((verb) => verb.id);

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

const verbIdSet = new Set(ALL_VERB_IDS);

/** The subset of a lesson plan `derivePracticedIdsByLesson` needs. */
export interface CanonicalPracticedIdsPlan {
  readonly id: LessonId;
  readonly moduleId: ModuleId;
  readonly order: number;
  readonly exampleIds: readonly string[];
  readonly introducedConceptIds: readonly ConceptId[];
  readonly introducedLexemeIds: readonly LexemeId[];
  /** Extra concepts a synthesis/orientation lesson reviews beyond its examples. */
  readonly reviewConceptIds?: readonly ConceptId[];
  /** Extra lexemes a synthesis/orientation lesson reviews beyond its examples. */
  readonly reviewLexemeIds?: readonly LexemeId[];
}

/** The concept/lexeme references `derivePracticedIdsByLesson` reads off an example. */
export interface CanonicalPracticedIdsExample {
  readonly conceptIds: readonly ConceptId[];
  readonly lexemeIds: readonly LexemeId[];
}

export interface PracticedIds {
  readonly concepts: readonly ConceptId[];
  readonly lexemes: readonly LexemeId[];
}

/**
 * Pure canonical-position deriver for `practicedConceptIds`/`practicedLexemeIds`
 * (spec §5.1, §6.4). A lesson's canonical teaching position comes only from
 * `(moduleOrderById.get(moduleId), order)` — never from `plans`' own array
 * position — so reordering the `plans` array (e.g. moving a whole module's
 * declarations around in the source file) leaves every lesson's derived
 * practiced sets unchanged. A lesson practices exactly the concepts/lexemes
 * its examples reuse from a *strictly earlier* canonical lesson, plus any
 * explicit review id that was itself already introduced earlier; same-lesson
 * or later-lesson ids never count as practiced, whether they arrive through
 * an example reference or an explicit review list.
 */
export function derivePracticedIdsByLesson(
  plans: readonly CanonicalPracticedIdsPlan[],
  moduleOrderById: ReadonlyMap<ModuleId, number>,
  examplesById: ReadonlyMap<string, CanonicalPracticedIdsExample>,
): ReadonlyMap<LessonId, PracticedIds> {
  const canonicalOrder = [...plans].sort(
    (left, right) =>
      (moduleOrderById.get(left.moduleId) ?? Number.MAX_SAFE_INTEGER) -
        (moduleOrderById.get(right.moduleId) ?? Number.MAX_SAFE_INTEGER) ||
      left.order - right.order,
  );

  const conceptIntroPosition = new Map<ConceptId, number>();
  const lexemeIntroPosition = new Map<LexemeId, number>();
  canonicalOrder.forEach((plan, position) => {
    for (const id of plan.introducedConceptIds) {
      if (!conceptIntroPosition.has(id)) conceptIntroPosition.set(id, position);
    }
    for (const id of plan.introducedLexemeIds) {
      if (!lexemeIntroPosition.has(id)) lexemeIntroPosition.set(id, position);
    }
  });

  function introducedBefore(
    index: ReadonlyMap<string, number>,
    id: string,
    position: number,
  ): boolean {
    const introducedAt = index.get(id);
    return introducedAt !== undefined && introducedAt < position;
  }

  const result = new Map<LessonId, PracticedIds>();
  canonicalOrder.forEach((plan, position) => {
    const exampleConcepts: ConceptId[] = [];
    const exampleLexemes: LexemeId[] = [];
    for (const exampleId of uniqueStrings(plan.exampleIds)) {
      const example = examplesById.get(exampleId);
      if (!example) continue;
      exampleConcepts.push(...example.conceptIds);
      exampleLexemes.push(...example.lexemeIds);
    }
    const concepts = uniqueStrings([
      ...exampleConcepts.filter((id) =>
        introducedBefore(conceptIntroPosition, id, position),
      ),
      ...(plan.reviewConceptIds ?? []).filter((id) =>
        introducedBefore(conceptIntroPosition, id, position),
      ),
    ]);
    const lexemes = uniqueStrings([
      ...exampleLexemes.filter((id) =>
        introducedBefore(lexemeIntroPosition, id, position),
      ),
      ...(plan.reviewLexemeIds ?? []).filter((id) =>
        introducedBefore(lexemeIntroPosition, id, position),
      ),
    ]);
    result.set(plan.id, {
      concepts: Object.freeze(concepts),
      lexemes: Object.freeze(lexemes),
    });
  });

  return result;
}

const moduleOrderById: ReadonlyMap<ModuleId, number> = new Map(
  curriculumFoundation.modules.map((module) => [module.id, module.order]),
);

const practicedIdsByLesson = derivePracticedIdsByLesson(
  lessonPlans.map((plan) => ({
    id: plan.id,
    moduleId: plan.moduleId,
    order: plan.order,
    exampleIds: exampleIdsForPlan(plan),
    introducedConceptIds: plan.introducedConceptIds,
    introducedLexemeIds: plan.introducedLexemeIds,
    reviewConceptIds: plan.reviewConceptIds,
    reviewLexemeIds: plan.reviewLexemeIds,
  })),
  moduleOrderById,
  curriculumExamplesById,
);

/** The assembled, order-stable lesson boundaries. */
export const curriculumLessons: readonly CurriculumLessonEntry[] = Object.freeze(
  lessonPlans.map((plan) => {
    const practiced = practicedIdsByLesson.get(plan.id) ?? {
      concepts: [],
      lexemes: [],
    };
    const exampleIds = exampleIdsForPlan(plan);
    return Object.freeze({
      id: plan.id,
      moduleId: plan.moduleId,
      order: plan.order,
      estimatedMinutes: plan.estimatedMinutes,
      introducedConceptIds: Object.freeze([...plan.introducedConceptIds]),
      practicedConceptIds: Object.freeze([...practiced.concepts]),
      assessedConceptIds: Object.freeze([...plan.assessedConceptIds]),
      introducedLexemeIds: Object.freeze([...plan.introducedLexemeIds]),
      practicedLexemeIds: Object.freeze([...practiced.lexemes]),
      assessedLexemeIds: Object.freeze([...plan.assessedLexemeIds]),
      exampleIds: Object.freeze(exampleIds),
      speechPromptId: speechPromptIdForLesson(plan.id),
      capstone: plan.capstone,
      // The 3-5 shared exercise definitions this lesson assesses (design spec
      // §5.2, §10.1, Slice C plan Task 2). The catalog authors them from the
      // lesson's own shared examples so the `enforceExerciseTargets` release
      // gate proves the per-lesson budget and shared-answer contract.
      exerciseIds: Object.freeze([...(exerciseIdsByLesson.get(plan.id) ?? [])]),
      assistedKatakanaLexemeIds: Object.freeze([
        ...plan.assistedKatakanaLexemeIds,
      ]),
    });
  }),
);


/** Lessons sorted the way the validator walks them (module order, then order). */
export const orderedCurriculumLessons: readonly CurriculumLessonEntry[] =
  Object.freeze(
    [...curriculumLessons].sort((left, right) => {
      const leftModule = curriculumFoundation.modules.find(
        (module) => module.id === left.moduleId,
      );
      const rightModule = curriculumFoundation.modules.find(
        (module) => module.id === right.moduleId,
      );
      return (
        (leftModule?.order ?? 0) - (rightModule?.order ?? 0) ||
        left.order - right.order
      );
    }),
  );

/** Recompute one module's coverage from the lessons (mirrors the validator). */
function computeModuleCoverage(moduleId: ModuleId): ModuleCoverage {
  const moduleLessons = orderedCurriculumLessons.filter(
    (lesson) => lesson.moduleId === moduleId,
  );
  const introducedConceptIds: string[] = [];
  const introducedLexemeIds: string[] = [];
  const introducedVerbIds: string[] = [];
  const practicedVerbIds: string[] = [];
  const assessedConceptIds: string[] = [];
  const assessedLexemeIds: string[] = [];
  const firstKatakanaExposureIds: string[] = [];
  for (const lesson of moduleLessons) {
    introducedConceptIds.push(...lesson.introducedConceptIds);
    introducedLexemeIds.push(...lesson.introducedLexemeIds);
    assessedConceptIds.push(...lesson.assessedConceptIds);
    assessedLexemeIds.push(...lesson.assessedLexemeIds);
    introducedVerbIds.push(
      ...lesson.introducedLexemeIds.filter((id) => verbIdSet.has(id)),
    );
    practicedVerbIds.push(
      ...lesson.practicedLexemeIds.filter((id) => verbIdSet.has(id)),
    );
    firstKatakanaExposureIds.push(...(lesson.assistedKatakanaLexemeIds ?? []));
  }
  return {
    moduleId,
    lessonIds: moduleLessons.map((lesson) => lesson.id),
    introducedConceptIds: uniqueStrings(introducedConceptIds),
    introducedLexemeIds: uniqueStrings(introducedLexemeIds),
    introducedVerbIds: uniqueStrings(introducedVerbIds),
    practicedVerbIds: uniqueStrings(practicedVerbIds),
    assessedConceptIds: uniqueStrings(assessedConceptIds),
    assessedLexemeIds: uniqueStrings(assessedLexemeIds),
    firstKatakanaExposureIds: uniqueStrings(firstKatakanaExposureIds),
  };
}

/** The 12 modules with foundation identity and derived coverage. */
export const curriculumModules: readonly CurriculumModuleEntry[] = Object.freeze(
  curriculumFoundation.modules.map((module) =>
    Object.freeze({
      id: module.id,
      phase: module.phase,
      order: module.order,
      prerequisiteIds: Object.freeze([...module.prerequisiteIds]),
      coverage: Object.freeze(computeModuleCoverage(module.id)),
    }),
  ),
);

/** Both locale copy catalogs, keyed identically (spec §9.1). */
export const curriculumCopy: CurriculumCopyCatalog = Object.freeze({
  it: itCopy,
  en: enCopy,
});

/** The fully assembled, release-validatable curriculum catalogs. */
export const assembledCurriculum: AssembledCurriculumCatalogs = Object.freeze({
  concepts,
  lexemes: [...lexiconById.values()],
  examples: curriculumExamples,
  exercises: curriculumExercises,
  speechPrompts,
  personas: genericPersonas.map((persona) => ({
    id: persona.id,
    japaneseName: persona.japaneseName,
    latinName: persona.latinName,
  })),
  modules: curriculumModules,
  lessons: curriculumLessons,
  copy: curriculumCopy,
});

import { validateCatalogReferences } from "./validate";
import { PHASE_IDS } from "../data/types";
import { generateExercise } from "../exercises/engine";
import type { ExerciseCatalogsInput } from "../exercises/types";
import type {
  AssembledCurriculumCatalogs,
  ComputedCoverage,
  ExerciseCatalogEntry,
  CurriculumLessonEntry,
  CurriculumModuleEntry,
  CurriculumValidationError,
  CurriculumValidationOptions,
  CurriculumValidationResult,
  LexemeId,
  ModuleCoverage,
} from "./types";

const RELEASE_MIN_LESSONS = 38;
const RELEASE_MAX_LESSONS = 42;
const RELEASE_MIN_VOCABULARY = 250;
const RELEASE_MAX_VOCABULARY = 300;
const RELEASE_MIN_VERBS = 40;
const RELEASE_MIN_REUSED_VERBS = 35;
const GENUINE_REUSE_MODULES = 3;
const GENUINE_REUSE_LATER_MODULES = 2;
const GENUINE_REUSE_EXAMPLES = 4;
const LESSON_MIN_EXERCISES = 3;
const LESSON_MAX_EXERCISES = 5;

/**
 * Any hiragana, katakana (full or half width), or CJK ideograph. Used to prove
 * an exercise definition carries no copied Japanese answer literal: definitions
 * must reference shared data by ID, so every string field is ASCII by design.
 */
const JAPANESE_CHARACTER = /[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/;

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function appendUnique<T>(target: T[], values: readonly T[]): void {
  for (const value of values) {
    if (!target.includes(value)) target.push(value);
  }
}

/**
 * Runtime exercise fields are authoritative when an authored definition exists.
 * Wrapper fields are a compatibility fallback for staged legacy entries that
 * have not acquired a definition yet.
 */
function exerciseData(exercise: ExerciseCatalogEntry): {
  readonly targetExampleId: string;
  readonly assessedConceptIds: readonly string[];
  readonly assessedLexemeIds: readonly string[];
} {
  return exercise.definition === undefined
    ? {
        targetExampleId: exercise.targetExampleId,
        assessedConceptIds: exercise.assessedConceptIds,
        assessedLexemeIds: exercise.assessedLexemeIds,
      }
    : {
        targetExampleId: exercise.definition.targetExampleId,
        assessedConceptIds: exercise.definition.assessedConceptIds,
        assessedLexemeIds: exercise.definition.assessedLexemeIds,
      };
}

function sortedModules(
  modules: readonly CurriculumModuleEntry[],
): CurriculumModuleEntry[] {
  return [...modules].sort(
    (left, right) => left.order - right.order || left.id.localeCompare(right.id),
  );
}

function sortedLessons(
  lessons: readonly CurriculumLessonEntry[],
  modules: readonly CurriculumModuleEntry[],
): CurriculumLessonEntry[] {
  const moduleOrders = new Map(modules.map((module) => [module.id, module.order]));
  return [...lessons].sort(
    (left, right) =>
      (moduleOrders.get(left.moduleId) ?? Number.MAX_SAFE_INTEGER) -
        (moduleOrders.get(right.moduleId) ?? Number.MAX_SAFE_INTEGER) ||
      left.order - right.order ||
      left.id.localeCompare(right.id),
  );
}

function duplicateIds(
  ids: readonly string[],
  code: CurriculumValidationError["code"],
): CurriculumValidationError[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates].map((id) => ({ code, id }));
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return (
    leftSet.size === rightSet.size &&
    [...leftSet].every((id) => rightSet.has(id))
  );
}

function collectReferenceIds(input: AssembledCurriculumCatalogs) {
  const conceptIds: string[] = [];
  const lexemeIds: string[] = [];
  const exampleIds: string[] = [];
  const personaIds: string[] = [];

  for (const concept of input.concepts) {
    appendUnique(conceptIds, concept.prerequisiteIds);
  }
  for (const example of input.examples) {
    appendUnique(lexemeIds, example.lexemeIds);
    appendUnique(conceptIds, example.conceptIds);
  }
  for (const exercise of input.exercises) {
    appendUnique(exampleIds, [exercise.targetExampleId]);
    appendUnique(conceptIds, exercise.assessedConceptIds);
    appendUnique(lexemeIds, exercise.assessedLexemeIds);
    if (exercise.definition) {
      appendUnique(exampleIds, [exercise.definition.targetExampleId]);
      appendUnique(conceptIds, exercise.definition.assessedConceptIds);
      appendUnique(lexemeIds, exercise.definition.assessedLexemeIds);
      if (exercise.definition.kind === "transformation") {
        appendUnique(exampleIds, [exercise.definition.promptExampleId]);
      }
      if ("distractorRefs" in exercise.definition) {
        appendUnique(
          exampleIds,
          (exercise.definition.distractorRefs ?? [])
            .map((ref) => ref.exampleId)
            .filter((id): id is string => id !== undefined),
        );
      }
      appendUnique(
        exampleIds,
        (exercise.definition.acceptedVariants ?? [])
          .flatMap((variant) => variant.segmentRefs)
          .map((ref) => ref.exampleId)
          .filter((id): id is string => id !== undefined),
      );
    }
  }
  for (const speechPrompt of input.speechPrompts) {
    appendUnique(exampleIds, [speechPrompt.targetExampleId]);
  }
  for (const lesson of input.lessons) {
    appendUnique(conceptIds, [
      ...lesson.introducedConceptIds,
      ...lesson.practicedConceptIds,
      ...lesson.assessedConceptIds,
    ]);
    appendUnique(lexemeIds, [
      ...lesson.introducedLexemeIds,
      ...lesson.practicedLexemeIds,
      ...lesson.assessedLexemeIds,
      ...(lesson.assistedKatakanaLexemeIds ?? []),
    ]);
    appendUnique(exampleIds, lesson.exampleIds);
  }
  appendUnique(personaIds, input.personas.map((persona) => persona.id));

  return { conceptIds, lexemeIds, exampleIds, personaIds };
}

function addModuleAndLessonErrors(
  input: AssembledCurriculumCatalogs,
  modules: readonly CurriculumModuleEntry[],
  lessons: readonly CurriculumLessonEntry[],
  errors: CurriculumValidationError[],
): void {
  errors.push(...duplicateIds(input.modules.map((module) => module.id), "duplicate-module-id"));
  errors.push(
    ...duplicateIds(
      input.modules.map((module) => String(module.order)),
      "duplicate-module-order",
    ),
  );
  errors.push(...duplicateIds(input.lessons.map((lesson) => lesson.id), "duplicate-lesson-id"));
  errors.push(
    ...duplicateIds(
      input.exercises.map((exercise) => exercise.id),
      "duplicate-exercise-id",
    ),
  );
  errors.push(
    ...duplicateIds(
      input.speechPrompts.map((prompt) => prompt.id),
      "duplicate-speech-prompt-id",
    ),
  );
  const lessonOrderKeys = lessons.map(
    (lesson) => `${lesson.moduleId}:${lesson.order}`,
  );
  for (const key of duplicateIds(lessonOrderKeys, "duplicate-lesson-order")) {
    const [moduleId, order] = (key.id ?? "").split(":");
    errors.push({
      code: "duplicate-lesson-order",
      moduleId,
      actual: order,
    });
  }

  const moduleIds = new Set(modules.map((module) => module.id));
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const modulesById = new Map(modules.map((module) => [module.id, module]));
  for (const module of modules) {
    for (const prerequisiteId of module.prerequisiteIds) {
      if (!moduleIds.has(prerequisiteId)) {
        errors.push({
          code: "missing-module-reference",
          moduleId: module.id,
          referenceId: prerequisiteId,
        });
      } else {
        const prerequisite = modulesById.get(prerequisiteId);
        if (prerequisite && prerequisite.order >= module.order) {
          errors.push({
            code: "prerequisite-not-earlier",
            moduleId: module.id,
            referenceId: prerequisiteId,
          });
        }
      }
    }
    for (const lessonId of module.coverage.lessonIds) {
      if (!lessonIds.has(lessonId)) {
        errors.push({
          code: "missing-lesson-reference",
          moduleId: module.id,
          referenceId: lessonId,
        });
      }
    }
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (moduleId: string): void => {
    if (visited.has(moduleId)) return;
    if (visiting.has(moduleId)) {
      errors.push({ code: "prerequisite-cycle", moduleId });
      return;
    }
    visiting.add(moduleId);
    const module = modulesById.get(moduleId);
    for (const prerequisiteId of module?.prerequisiteIds ?? []) {
      if (modulesById.has(prerequisiteId)) visit(prerequisiteId);
    }
    visiting.delete(moduleId);
    visited.add(moduleId);
  };
  for (const module of modules) visit(module.id);

  let previousPhaseIndex = -1;
  for (const module of modules) {
    const phaseIndex = PHASE_IDS.indexOf(module.phase);
    if (phaseIndex < previousPhaseIndex) {
      errors.push({ code: "invalid-phase-order", moduleId: module.id });
    }
    previousPhaseIndex = Math.max(previousPhaseIndex, phaseIndex);
  }

  const speechPromptIds = new Set(input.speechPrompts.map((prompt) => prompt.id));
  for (const lesson of lessons) {
    if (!moduleIds.has(lesson.moduleId)) {
      errors.push({
        code: "missing-module-reference",
        lessonId: lesson.id,
        referenceId: lesson.moduleId,
      });
    }
    if (
      !Number.isFinite(lesson.estimatedMinutes) ||
      lesson.estimatedMinutes < 6 ||
      lesson.estimatedMinutes > 10
    ) {
      errors.push({
        code: "lesson-duration-out-of-range",
        lessonId: lesson.id,
        actual: lesson.estimatedMinutes,
      });
    }
    if (
      lesson.requiredAnswerScript === "kanji" ||
      lesson.requiresKanjiOutput === true
    ) {
      errors.push({ code: "required-kanji-output", lessonId: lesson.id });
    }
    if (!speechPromptIds.has(lesson.speechPromptId)) {
      errors.push({
        code: "missing-speech-prompt-reference",
        lessonId: lesson.id,
        referenceId: lesson.speechPromptId,
      });
    }
    if (
      lesson.capstone &&
      (lesson.introducedConceptIds.length > 0 ||
        lesson.introducedLexemeIds.length > 0)
    ) {
      errors.push({ code: "capstone-introduces-content", lessonId: lesson.id });
    }
  }
}

function validateLocaleKeys(
  input: AssembledCurriculumCatalogs,
  errors: CurriculumValidationError[],
): void {
  const italianKeys = Object.keys(input.copy.it).sort();
  const englishKeys = Object.keys(input.copy.en).sort();
  const allKeys = unique([...italianKeys, ...englishKeys]).sort();
  for (const id of allKeys) {
    if (!italianKeys.includes(id) || !englishKeys.includes(id)) {
      errors.push({ code: "locale-key-mismatch", id });
    }
  }
}

function moduleCoverageFor(
  module: CurriculumModuleEntry,
  lessons: readonly CurriculumLessonEntry[],
  lexemeCategories: ReadonlyMap<LexemeId, "verb" | "noun" | "adjective" | "expression" | "other">,
): ModuleCoverage {
  const moduleLessons = lessons.filter((lesson) => lesson.moduleId === module.id);
  const introducedConceptIds: string[] = [];
  const introducedLexemeIds: string[] = [];
  const introducedVerbIds: string[] = [];
  const practicedVerbIds: string[] = [];
  const assessedConceptIds: string[] = [];
  const assessedLexemeIds: string[] = [];
  const firstKatakanaExposureIds: string[] = [];

  for (const lesson of moduleLessons) {
    appendUnique(introducedConceptIds, lesson.introducedConceptIds);
    appendUnique(introducedLexemeIds, lesson.introducedLexemeIds);
    appendUnique(assessedConceptIds, lesson.assessedConceptIds);
    appendUnique(assessedLexemeIds, lesson.assessedLexemeIds);
    appendUnique(
      introducedVerbIds,
      lesson.introducedLexemeIds.filter(
        (id) => lexemeCategories.get(id) === "verb",
      ),
    );
    appendUnique(
      practicedVerbIds,
      lesson.practicedLexemeIds.filter(
        (id) => lexemeCategories.get(id) === "verb",
      ),
    );
    appendUnique(
      firstKatakanaExposureIds,
      lesson.assistedKatakanaLexemeIds ?? [],
    );
  }

  return {
    moduleId: module.id,
    lessonIds: moduleLessons.map((lesson) => lesson.id),
    introducedConceptIds,
    introducedLexemeIds,
    introducedVerbIds,
    practicedVerbIds,
    assessedConceptIds,
    assessedLexemeIds,
    firstKatakanaExposureIds,
  };
}

function computeCoverage(
  input: AssembledCurriculumCatalogs,
  modules: readonly CurriculumModuleEntry[],
  lessons: readonly CurriculumLessonEntry[],
): {
  readonly coverage: ComputedCoverage;
} {
  const lexemeCategories = new Map(
    input.lexemes.map((lexeme) => [lexeme.id, lexeme.category]),
  );
  const examplesById = new Map(input.examples.map((example) => [example.id, example]));
  const vocabularyIds: string[] = [];
  const introducedVerbIds: string[] = [];
  const moduleCoverage: Record<string, ModuleCoverage> = {};
  const verbModules: Record<string, string[]> = {};
  const authoredExampleCounts: Record<string, number> = {};
  const countedAuthorship = new Set<string>();

  for (const module of modules) {
    const coverage = moduleCoverageFor(module, lessons, lexemeCategories);
    moduleCoverage[module.id] = coverage;
  }

  for (const lesson of lessons) {
    const lessonLexemeIds = [
      ...lesson.introducedLexemeIds,
      ...lesson.practicedLexemeIds,
      ...lesson.assessedLexemeIds,
    ];
    appendUnique(vocabularyIds, lessonLexemeIds);
    for (const lexemeId of lessonLexemeIds) {
      if (lexemeCategories.get(lexemeId) === "verb") {
        if (lesson.introducedLexemeIds.includes(lexemeId)) {
          appendUnique(introducedVerbIds, [lexemeId]);
        }
        const modulesForVerb = verbModules[lexemeId] ?? [];
        appendUnique(modulesForVerb, [lesson.moduleId]);
        verbModules[lexemeId] = modulesForVerb;
      }
    }
    for (const exampleId of lesson.exampleIds) {
      const example = examplesById.get(exampleId);
      if (!example) continue;
      appendUnique(vocabularyIds, example.lexemeIds);
      for (const lexemeId of example.lexemeIds) {
        if (lexemeCategories.get(lexemeId) === "verb") {
          const authorshipKey = `example:${example.id}:${lexemeId}`;
          if (!countedAuthorship.has(authorshipKey)) {
            authoredExampleCounts[lexemeId] =
              (authoredExampleCounts[lexemeId] ?? 0) + 1;
            countedAuthorship.add(authorshipKey);
          }
          const modulesForVerb = verbModules[lexemeId] ?? [];
          appendUnique(modulesForVerb, [lesson.moduleId]);
          verbModules[lexemeId] = modulesForVerb;
        }
      }
    }
  }

  for (const exercise of input.exercises) {
    const { assessedLexemeIds } = exerciseData(exercise);
    appendUnique(vocabularyIds, assessedLexemeIds);
    for (const lexemeId of assessedLexemeIds) {
      if (lexemeCategories.get(lexemeId) !== "verb") continue;
      const authorshipKey = `exercise:${exercise.id}:${lexemeId}`;
      if (!countedAuthorship.has(authorshipKey)) {
        authoredExampleCounts[lexemeId] =
          (authoredExampleCounts[lexemeId] ?? 0) + 1;
        countedAuthorship.add(authorshipKey);
      }
    }
  }

  const exercisesById = new Map(
    input.exercises.map((exercise) => [exercise.id, exercise]),
  );
  for (const lesson of lessons) {
    for (const exerciseId of lesson.exerciseIds ?? []) {
      const exercise = exercisesById.get(exerciseId);
      if (!exercise) continue;
      const { assessedLexemeIds } = exerciseData(exercise);
      for (const lexemeId of assessedLexemeIds) {
        if (lexemeCategories.get(lexemeId) !== "verb") continue;
        const modulesForVerb = verbModules[lexemeId] ?? [];
        appendUnique(modulesForVerb, [lesson.moduleId]);
        verbModules[lexemeId] = modulesForVerb;
      }
    }
  }

  const moduleOrders = new Map(modules.map((module) => [module.id, module.order]));
  const laterReuseModules: Record<string, readonly string[]> = {};
  const reusedVerbIds: string[] = [];
  for (const verbId of introducedVerbIds) {
    const moduleIds = verbModules[verbId] ?? [];
    const introductionLesson = lessons.find((lesson) =>
      lesson.introducedLexemeIds.includes(verbId),
    );
    const introductionOrder = introductionLesson
      ? moduleOrders.get(introductionLesson.moduleId) ?? Number.MAX_SAFE_INTEGER
      : Number.MAX_SAFE_INTEGER;
    const laterModules = moduleIds.filter(
      (moduleId) =>
        (moduleOrders.get(moduleId) ?? Number.MIN_SAFE_INTEGER) > introductionOrder,
    );
    laterReuseModules[verbId] = laterModules;
    if (
      new Set([introductionLesson?.moduleId, ...moduleIds]).size >=
        GENUINE_REUSE_MODULES &&
      laterModules.length >= GENUINE_REUSE_LATER_MODULES &&
      (authoredExampleCounts[verbId] ?? 0) >= GENUINE_REUSE_EXAMPLES
    ) {
      reusedVerbIds.push(verbId);
    }
  }

  return {
    coverage: {
      vocabularyIds,
      vocabularyCount: vocabularyIds.length,
      introducedVerbIds,
      introducedVerbCount: introducedVerbIds.length,
      reusedVerbIds,
      moduleCoverage,
      laterReuseModules,
      authoredExampleCounts,
    },
  };
}

function addOrderAndScriptErrors(
  input: AssembledCurriculumCatalogs,
  lessons: readonly CurriculumLessonEntry[],
  errors: CurriculumValidationError[],
): void {
  const concepts = new Set<string>();
  const lexemes = new Set<string>();
  const lexemeById = new Map(input.lexemes.map((lexeme) => [lexeme.id, lexeme]));
  const exposedKatakana = new Set<string>();

  for (const [lessonIndex, lesson] of lessons.entries()) {
    const currentLexemes = unique([
      ...lesson.introducedLexemeIds,
      ...lesson.practicedLexemeIds,
      ...lesson.assessedLexemeIds,
    ]);
    const assisted = lesson.assistedKatakanaLexemeIds ?? [];
    for (const id of currentLexemes) {
      const lexeme = lexemeById.get(id);
      const assistedAtIntroduction =
        lesson.introducedLexemeIds.includes(id) &&
        assisted.includes(id) &&
        (lexeme?.reading.length ?? 0) > 0;
      if (
        lexeme?.script === "katakana" &&
        !exposedKatakana.has(id) &&
        !assistedAtIntroduction
      ) {
        errors.push({
          code: "missing-assisted-katakana-exposure",
          id,
          lessonId: lesson.id,
        });
      }
    }

    for (const id of assisted) {
      const lexeme = lexemeById.get(id);
      if (
        lesson.introducedLexemeIds.includes(id) &&
        lexeme?.script === "katakana" &&
        lexeme.reading.length > 0
      ) {
        exposedKatakana.add(id);
      }
    }

    for (const id of lesson.introducedConceptIds) concepts.add(id);
    for (const id of lesson.introducedLexemeIds) lexemes.add(id);
    for (const id of lesson.assessedConceptIds) {
      if (!concepts.has(id)) {
        errors.push({
          code: "assessment-before-introduction",
          id,
          lessonId: lesson.id,
        });
      }
    }
    for (const id of lesson.assessedLexemeIds) {
      if (!lexemes.has(id)) {
        errors.push({
          code: "assessment-before-introduction",
          id,
          lessonId: lesson.id,
        });
      }
    }
    // A lesson can only claim to practice a concept/lexeme that has been
    // introduced by this lesson or an earlier one (spec §6.4). Catches the
    // same "practiced before introduced" corruption `practicedFor` (Slice B
    // Task 3) guards against at authoring time — e.g. a canonical-order bug
    // that let a later-introduced id slip into an earlier lesson's practiced
    // set — as a defense-in-depth check on the assembled data itself.
    for (const id of lesson.practicedConceptIds) {
      if (!concepts.has(id)) {
        errors.push({
          code: "practice-before-introduction",
          id,
          lessonId: lesson.id,
        });
      }
    }
    for (const id of lesson.practicedLexemeIds) {
      if (!lexemes.has(id)) {
        errors.push({
          code: "practice-before-introduction",
          id,
          lessonId: lesson.id,
        });
      }
    }

    const laterLessons = lessons.slice(lessonIndex + 1);
    for (const id of lesson.introducedConceptIds) {
      if (
        !laterLessons.some((laterLesson) =>
          laterLesson.practicedConceptIds.includes(id),
        )
      ) {
        errors.push({
          code: "introduced-target-not-reused",
          id,
          lessonId: lesson.id,
        });
      }
    }
    for (const id of lesson.introducedLexemeIds) {
      if (
        lexemeById.get(id)?.category === "verb" &&
        !laterLessons.some((laterLesson) =>
          laterLesson.practicedLexemeIds.includes(id),
        )
      ) {
        errors.push({
          code: "introduced-target-not-reused",
          id,
          lessonId: lesson.id,
        });
      }
    }
  }

  const exercisesById = new Map(
    input.exercises.map((exercise) => [exercise.id, exercise]),
  );
  for (const [lessonIndex, lesson] of lessons.entries()) {
    const availableConcepts = new Set(
      lessons
        .slice(0, lessonIndex + 1)
        .flatMap((candidate) => candidate.introducedConceptIds),
    );
    const availableLexemes = new Set(
      lessons
        .slice(0, lessonIndex + 1)
        .flatMap((candidate) => candidate.introducedLexemeIds),
    );
    for (const exerciseId of lesson.exerciseIds ?? []) {
      const exercise = exercisesById.get(exerciseId);
      if (!exercise) continue;
      const { assessedConceptIds, assessedLexemeIds } = exerciseData(exercise);
      for (const id of assessedConceptIds) {
        if (!availableConcepts.has(id)) {
          errors.push({
            code: "assessment-before-introduction",
            id,
            lessonId: lesson.id,
          });
        }
      }
      for (const id of assessedLexemeIds) {
        if (!availableLexemes.has(id)) {
          errors.push({
            code: "assessment-before-introduction",
            id,
            lessonId: lesson.id,
          });
        }
      }
    }
  }
}

function containsJapanese(value: unknown): boolean {
  if (typeof value === "string") return JAPANESE_CHARACTER.test(value);
  if (Array.isArray(value)) return value.some(containsJapanese);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(containsJapanese);
  }
  return false;
}

/** Adapt the assembled catalogs into the shape the pure engine resolves against. */
function toExerciseCatalogs(
  input: AssembledCurriculumCatalogs,
): ExerciseCatalogsInput {
  return {
    concepts: input.concepts.map((concept) => ({ id: concept.id })),
    lexemes: input.lexemes.map((lexeme) => ({ id: lexeme.id })),
    examples: input.examples.map((example) => ({
      id: example.id,
      jp: example.jp ?? "",
      segments: example.segments ?? [],
      lexemeIds: example.lexemeIds,
      conceptIds: example.conceptIds,
    })),
  };
}

/**
 * Exercise-boundary validation (design spec §9.3, §10.1-§10.3, Slice C plan
 * Task 1). Lesson-level reference checks and every definition-level check are
 * always on so a malformed authored exercise fails the build; only the 3-5
 * per-lesson budget is gated behind `enforceExerciseTargets` so the current
 * zero-exercise release stays valid until Task 2 authors the definitions.
 */
function addExerciseErrors(
  input: AssembledCurriculumCatalogs,
  lessons: readonly CurriculumLessonEntry[],
  errors: CurriculumValidationError[],
  enforceExerciseTargets: boolean,
): void {
  const definedExerciseIds = new Set(input.exercises.map((exercise) => exercise.id));

  for (const lesson of lessons) {
    const exerciseIds = lesson.exerciseIds ?? [];
    const seen = new Set<string>();
    for (const exerciseId of exerciseIds) {
      if (!definedExerciseIds.has(exerciseId)) {
        errors.push({
          code: "missing-exercise-reference",
          lessonId: lesson.id,
          referenceId: exerciseId,
        });
      }
      if (seen.has(exerciseId)) {
        errors.push({
          code: "duplicate-exercise-reference",
          lessonId: lesson.id,
          referenceId: exerciseId,
        });
      }
      seen.add(exerciseId);
    }
    if (
      enforceExerciseTargets &&
      (exerciseIds.length < LESSON_MIN_EXERCISES ||
        exerciseIds.length > LESSON_MAX_EXERCISES)
    ) {
      errors.push({
        code: "invalid-exercise-count",
        lessonId: lesson.id,
        actual: exerciseIds.length,
      });
    }
  }

  const catalogs = toExerciseCatalogs(input);
  for (const exercise of input.exercises) {
    const definition = exercise.definition;
    if (!definition) continue;

    if (exercise.id !== definition.id) {
      errors.push({
        code: "inconsistent-exercise-definition",
        id: exercise.id,
        referenceId: "id",
        expected: exercise.id,
        actual: definition.id,
      });
    }
    if (exercise.targetExampleId !== definition.targetExampleId) {
      errors.push({
        code: "inconsistent-exercise-definition",
        id: exercise.id,
        referenceId: "targetExampleId",
        expected: exercise.targetExampleId,
        actual: definition.targetExampleId,
      });
    }
    if (!sameIds(exercise.assessedConceptIds, definition.assessedConceptIds)) {
      errors.push({
        code: "inconsistent-exercise-definition",
        id: exercise.id,
        referenceId: "assessedConceptIds",
        expected: exercise.assessedConceptIds.join(","),
        actual: definition.assessedConceptIds.join(","),
      });
    }
    if (!sameIds(exercise.assessedLexemeIds, definition.assessedLexemeIds)) {
      errors.push({
        code: "inconsistent-exercise-definition",
        id: exercise.id,
        referenceId: "assessedLexemeIds",
        expected: exercise.assessedLexemeIds.join(","),
        actual: definition.assessedLexemeIds.join(","),
      });
    }

    // No copied canonical answer literals: definitions are all-ID by design.
    if (containsJapanese(definition)) {
      errors.push({ code: "copied-exercise-answer", id: exercise.id });
    }

    // Explicit variants only: an empty reference list is an implicit variant.
    for (const variant of definition.acceptedVariants ?? []) {
      if (variant.segmentRefs.length === 0) {
        errors.push({
          code: "implicit-exercise-variant",
          id: exercise.id,
          referenceId: variant.id,
        });
      }
    }

    // Reuse the runtime engine as the single source of truth for structural
    // resolution: missing references, duplicate segments, impossible choice
    // sets, and unresolvable variants all fail the build here (spec §10.3).
    const generated = generateExercise(definition, catalogs);
    if (!generated.ok) {
      const { code, referenceId } = generated.error;
      switch (code) {
        case "impossible-choice":
          errors.push({ code: "impossible-exercise-choice", id: exercise.id });
          break;
        case "duplicate-segment":
          errors.push({
            code: "duplicate-exercise-segment",
            id: exercise.id,
            referenceId,
          });
          break;
        case "invalid-variant":
          // Implicit (empty-ref) variants are already reported above; only an
          // unresolvable reference carries a referenceId to surface here.
          if (referenceId !== undefined) {
            errors.push({
              code: "missing-exercise-reference",
              id: exercise.id,
              referenceId,
            });
          }
          break;
        case "missing-example":
        case "missing-segment":
        case "missing-concept":
        case "missing-lexeme":
        case "absent-target":
          errors.push({
            code: "missing-exercise-reference",
            id: exercise.id,
            referenceId,
          });
          break;
      }
    }
  }
}

const SPOKEN_SUFFIX = "-say";

/**
 * Speech-prompt boundary validation (design spec §12.3, §17.1, Slice D plan
 * Task 1). Reference-integrity checks on any populated prompt are always on so a
 * malformed authored prompt fails the build: comparison/critical/variant
 * references must resolve, be duplicate-free, keep critical within comparison,
 * declare variants the owning lesson already shows, and list comparison segments
 * in target order. Completeness checks — non-empty comparison covering every
 * target segment, and a target that is the owning lesson's spoken `-say` example
 * — are gated behind `enforceSpeechTargets` so lightweight fixtures stay valid
 * while the release catalog (`assembleCourse`) fails closed.
 */
function addSpeechErrors(
  input: AssembledCurriculumCatalogs,
  errors: CurriculumValidationError[],
  enforceSpeechTargets: boolean,
): void {
  const examplesById = new Map(
    input.examples.map((example) => [example.id, example]),
  );
  const lessonByPromptId = new Map(
    input.lessons.map((lesson) => [lesson.speechPromptId, lesson]),
  );

  for (const prompt of input.speechPrompts) {
    const target = examplesById.get(prompt.targetExampleId);
    const targetSegmentIndex = new Map(
      (target?.segments ?? []).map((segment, index) => [segment.id, index]),
    );
    const targetSegmentIds = (target?.segments ?? []).map(
      (segment) => segment.id,
    );
    const comparison = prompt.comparisonSegmentIds;
    const owningLesson = lessonByPromptId.get(prompt.id);
    const lessonExampleIds = new Set(owningLesson?.exampleIds ?? []);

    // Comparison references: existence, duplicates, and target ordering.
    const seenComparison = new Set<string>();
    let previousIndex = -1;
    let orderBroken = false;
    for (const segmentId of comparison) {
      if (!targetSegmentIndex.has(segmentId)) {
        errors.push({
          code: "missing-speech-segment-reference",
          id: prompt.id,
          referenceId: segmentId,
        });
        continue;
      }
      if (seenComparison.has(segmentId)) {
        errors.push({
          code: "duplicate-speech-segment-reference",
          id: prompt.id,
          referenceId: segmentId,
        });
      }
      seenComparison.add(segmentId);
      const index = targetSegmentIndex.get(segmentId) ?? -1;
      if (index <= previousIndex) orderBroken = true;
      previousIndex = index;
    }
    if (orderBroken) {
      errors.push({ code: "invalid-speech-segment-order", id: prompt.id });
    }

    // Critical references: duplicates and containment within comparison.
    const comparisonSet = new Set(comparison);
    const seenCritical = new Set<string>();
    for (const segmentId of prompt.criticalSegmentIds) {
      if (seenCritical.has(segmentId)) {
        errors.push({
          code: "duplicate-speech-segment-reference",
          id: prompt.id,
          referenceId: segmentId,
        });
      }
      seenCritical.add(segmentId);
      if (!comparisonSet.has(segmentId)) {
        errors.push({
          code: "critical-segment-not-compared",
          id: prompt.id,
          referenceId: segmentId,
        });
      }
    }

    // Variant references: existence, duplicates, and lesson ownership.
    const seenVariant = new Set<string>();
    for (const variantId of prompt.acceptedTranscriptVariantExampleIds) {
      if (!examplesById.has(variantId)) {
        errors.push({
          code: "missing-speech-variant-reference",
          id: prompt.id,
          referenceId: variantId,
        });
      }
      if (seenVariant.has(variantId)) {
        errors.push({
          code: "duplicate-speech-variant-reference",
          id: prompt.id,
          referenceId: variantId,
        });
      }
      seenVariant.add(variantId);
      if (
        owningLesson !== undefined &&
        examplesById.has(variantId) &&
        !lessonExampleIds.has(variantId)
      ) {
        errors.push({
          code: "speech-variant-not-in-lesson",
          id: prompt.id,
          referenceId: variantId,
        });
      }
    }

    if (!enforceSpeechTargets) continue;

    // Release completeness: non-empty comparison covering every target segment
    // in order, and a target that is the owning lesson's spoken example.
    if (comparison.length === 0) {
      errors.push({ code: "empty-speech-comparison", id: prompt.id });
    } else {
      const coversAllInOrder =
        comparison.length === targetSegmentIds.length &&
        comparison.every((segmentId, index) => segmentId === targetSegmentIds[index]);
      if (!coversAllInOrder) {
        errors.push({ code: "invalid-speech-segment-order", id: prompt.id });
      }
    }
    if (owningLesson !== undefined) {
      const sayExampleId = owningLesson.exampleIds.find((exampleId) =>
        exampleId.endsWith(SPOKEN_SUFFIX),
      );
      if (prompt.targetExampleId !== sayExampleId) {
        errors.push({
          code: "speech-target-not-say-example",
          id: prompt.id,
          referenceId: prompt.targetExampleId,
        });
      }
    }
  }
}

function addCoverageErrors(
  input: AssembledCurriculumCatalogs,
  coverage: ComputedCoverage,
  errors: CurriculumValidationError[],
  enforceReleaseTargets: boolean,
): void {
  for (const module of input.modules) {
    const computed = coverage.moduleCoverage[module.id];
    if (!computed) continue;
    const authored = module.coverage;
    const mismatch =
      !sameIds(authored.lessonIds, computed.lessonIds) ||
      !sameIds(authored.introducedConceptIds, computed.introducedConceptIds) ||
      !sameIds(authored.introducedLexemeIds, computed.introducedLexemeIds) ||
      !sameIds(authored.introducedVerbIds, computed.introducedVerbIds) ||
      !sameIds(authored.practicedVerbIds, computed.practicedVerbIds) ||
      !sameIds(authored.assessedConceptIds, computed.assessedConceptIds) ||
      !sameIds(authored.assessedLexemeIds, computed.assessedLexemeIds) ||
      !sameIds(
        authored.firstKatakanaExposureIds,
        computed.firstKatakanaExposureIds,
      ) ||
      (authored.verbCount !== undefined &&
        authored.verbCount !== computed.introducedVerbIds.length) ||
      (authored.vocabularyCount !== undefined &&
        authored.vocabularyCount !== computed.introducedLexemeIds.length);
    if (mismatch) {
      errors.push({
        code: "authored-computed-coverage-mismatch",
        moduleId: module.id,
      });
    }
  }

  if (!enforceReleaseTargets) return;
  if (coverage.reusedVerbIds.length < RELEASE_MIN_REUSED_VERBS) {
    errors.push({
      code: "insufficient-verb-reuse",
      actual: coverage.reusedVerbIds.length,
      expected: RELEASE_MIN_REUSED_VERBS,
    });
  }
  const lessonCount = input.lessons.length;
  if (lessonCount < RELEASE_MIN_LESSONS || lessonCount > RELEASE_MAX_LESSONS) {
    errors.push({
      code: "invalid-lesson-count",
      actual: lessonCount,
      expected: `${RELEASE_MIN_LESSONS}-${RELEASE_MAX_LESSONS}`,
    });
  }
  if (
    coverage.vocabularyCount < RELEASE_MIN_VOCABULARY ||
    coverage.vocabularyCount > RELEASE_MAX_VOCABULARY
  ) {
    errors.push({
      code: "invalid-vocabulary-count",
      actual: coverage.vocabularyCount,
      expected: `${RELEASE_MIN_VOCABULARY}-${RELEASE_MAX_VOCABULARY}`,
    });
  }
  if (coverage.introducedVerbCount < RELEASE_MIN_VERBS) {
    errors.push({
      code: "invalid-verb-count",
      actual: coverage.introducedVerbCount,
      expected: RELEASE_MIN_VERBS,
    });
  }
}

function errorSort(
  left: CurriculumValidationError,
  right: CurriculumValidationError,
): number {
  return (
    left.code.localeCompare(right.code) ||
    (left.moduleId ?? "").localeCompare(right.moduleId ?? "") ||
    (left.lessonId ?? "").localeCompare(right.lessonId ?? "") ||
    (left.id ?? left.referenceId ?? "").localeCompare(
      right.id ?? right.referenceId ?? "",
    )
  );
}

export function validateCurriculum(
  input: AssembledCurriculumCatalogs,
  options: CurriculumValidationOptions = {},
): CurriculumValidationResult {
  const modules = sortedModules(input.modules);
  const lessons = sortedLessons(input.lessons, modules);
  const errors: CurriculumValidationError[] = [];
  const references = collectReferenceIds(input);
  const referenceValidation = validateCatalogReferences({
    conceptIds: input.concepts.map((concept) => concept.id),
    lexemeIds: input.lexemes.map((lexeme) => lexeme.id),
    exampleIds: input.examples.map((example) => example.id),
    personaIds: input.personas.map((persona) => persona.id),
    referencedConceptIds: references.conceptIds,
    referencedLexemeIds: references.lexemeIds,
    referencedExampleIds: references.exampleIds,
    referencedPersonaIds: references.personaIds,
  });
  errors.push(...referenceValidation);
  addModuleAndLessonErrors(input, modules, lessons, errors);
  validateLocaleKeys(input, errors);
  addOrderAndScriptErrors(input, lessons, errors);
  addExerciseErrors(input, lessons, errors, options.enforceExerciseTargets ?? false);
  addSpeechErrors(input, errors, options.enforceSpeechTargets ?? false);

  const { coverage } = computeCoverage(input, modules, lessons);
  addCoverageErrors(
    input,
    coverage,
    errors,
    options.enforceReleaseTargets ?? true,
  );

  const stableErrors = errors.sort(errorSort);
  return {
    valid: stableErrors.length === 0,
    errors: stableErrors,
    coverage,
  };
}

import { validateCatalogReferences } from "./validate";
import { PHASE_IDS } from "../data/types";
import type {
  AssembledCurriculumCatalogs,
  ComputedCoverage,
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

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function appendUnique<T>(target: T[], values: readonly T[]): void {
  for (const value of values) {
    if (!target.includes(value)) target.push(value);
  }
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
    appendUnique(vocabularyIds, exercise.assessedLexemeIds);
    for (const lexemeId of exercise.assessedLexemeIds) {
      if (lexemeCategories.get(lexemeId) !== "verb") continue;
      const authorshipKey = `exercise:${exercise.id}:${lexemeId}`;
      if (!countedAuthorship.has(authorshipKey)) {
        authoredExampleCounts[lexemeId] =
          (authoredExampleCounts[lexemeId] ?? 0) + 1;
        countedAuthorship.add(authorshipKey);
      }
      const targetExample = examplesById.get(exercise.targetExampleId);
      if (!targetExample) continue;
      for (const lesson of lessons) {
        if (!lesson.exampleIds.includes(targetExample.id)) continue;
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

  for (const exercise of input.exercises) {
    for (const [lessonIndex, lesson] of lessons.entries()) {
      if (!lesson.exampleIds.includes(exercise.targetExampleId)) continue;
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
      for (const id of exercise.assessedConceptIds) {
        if (!availableConcepts.has(id)) {
          errors.push({
            code: "assessment-before-introduction",
            id,
            lessonId: lesson.id,
          });
        }
      }
      for (const id of exercise.assessedLexemeIds) {
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

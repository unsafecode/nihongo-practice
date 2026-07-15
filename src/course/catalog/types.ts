import type { LessonId, ModuleId, PhaseId } from "../data/types";
import type { PersonaId } from "../data/personas";
import type { CatalogReferenceErrorCode } from "./validate";
import type {
  ExerciseDefinition,
  ExerciseExampleSegment,
} from "../exercises/types";

export type ConceptId = string;
export type LexemeId = string;
export type VerbLexemeId = LexemeId;
export type ExampleId = string;
export type ExerciseDefinitionId = string;
export type SpeechPromptId = string;

export interface ConceptCatalogEntry {
  readonly id: ConceptId;
  readonly prerequisiteIds: readonly ConceptId[];
  readonly surfaceGears: readonly string[];
}

export interface LexemeCatalogEntry {
  readonly id: LexemeId;
  readonly japanese: string;
  readonly reading: string;
  readonly category: "verb" | "noun" | "adjective" | "expression" | "other";
  readonly script: "hiragana" | "katakana";
}

export interface ExampleCatalogEntry {
  readonly id: ExampleId;
  readonly lexemeIds: readonly LexemeId[];
  readonly conceptIds: readonly ConceptId[];
  /**
   * Concatenated kana form, present on authored curriculum examples. Optional so
   * lightweight validator fixtures need not restate it; the exercise engine and
   * validator read it when resolving canonical answers (design spec §10.2).
   */
  readonly jp?: string;
  /**
   * Ordered kana segments with stable within-example IDs. Present on authored
   * examples; optional here so non-exercise fixtures stay terse. This is the
   * shared segment structure exercise definitions reference instead of copying
   * answer literals (design spec §9.1, §10.1).
   */
  readonly segments?: readonly ExerciseExampleSegment[];
}

export interface CurriculumCatalogEntry {
  readonly id: string;
  readonly phase: PhaseId;
  readonly prerequisiteIds: readonly string[];
  readonly exampleIds: readonly ExampleId[];
  readonly exerciseIds: readonly ExerciseDefinitionId[];
  readonly speechPromptId: SpeechPromptId | null;
}

export interface ExerciseCatalogEntry {
  readonly id: ExerciseDefinitionId;
  readonly targetExampleId: ExampleId;
  readonly assessedConceptIds: readonly ConceptId[];
  readonly assessedLexemeIds: readonly LexemeId[];
  /**
   * The typed, deterministic definition the pure engine renders and evaluates
   * (design spec §10.1, Slice C plan Task 1). Optional so Slice A/B fixtures and
   * the not-yet-authored release catalog remain valid; when present the
   * validator proves answers derive from shared data and never copy literals.
   */
  readonly definition?: ExerciseDefinition;
}

export interface SpeechPromptCatalogEntry {
  readonly id: SpeechPromptId;
  readonly targetExampleId: ExampleId;
  /**
   * The stable segment IDs of the target example a learner's spoken attempt is
   * judged most critically on (design spec §12.3). Optional so lightweight
   * validator fixtures need not enumerate segments; authored curriculum prompts
   * always name at least one. This is semantic reference data only — it carries
   * no recognition implementation (Slice D owns that).
   */
  readonly criticalSegmentIds?: readonly string[];
}

export interface PersonaCatalogEntry {
  readonly id: PersonaId;
  readonly japaneseName: string;
  readonly latinName: string;
}

/**
 * The locale-independent lesson boundary assembled from the content catalogs.
 * Every reference is an ID so validation can prove that content is shared
 * rather than copied into a lesson.
 */
export interface CurriculumLessonEntry {
  readonly id: LessonId;
  readonly moduleId: ModuleId;
  readonly order: number;
  readonly estimatedMinutes: number;
  readonly introducedConceptIds: readonly ConceptId[];
  readonly practicedConceptIds: readonly ConceptId[];
  readonly assessedConceptIds: readonly ConceptId[];
  readonly introducedLexemeIds: readonly LexemeId[];
  readonly practicedLexemeIds: readonly LexemeId[];
  readonly assessedLexemeIds: readonly LexemeId[];
  readonly exampleIds: readonly ExampleId[];
  readonly speechPromptId: SpeechPromptId;
  readonly capstone: boolean;
  /**
   * The 3-5 deterministic exercise definitions this lesson assesses (design spec
   * §5.2, §10.1). Optional so Slice B lessons remain valid before Slice C Task 2
   * authors the definitions; the `enforceExerciseTargets` validation gate proves
   * the 3-5 budget once they exist.
   */
  readonly exerciseIds?: readonly ExerciseDefinitionId[];
  /**
   * Katakana IDs shown with their reading at their first exposure. This is
   * optional for non-katakana lessons and intentionally remains semantic data.
   */
  readonly assistedKatakanaLexemeIds?: readonly LexemeId[];
  /**
   * The validator accepts this wider input union so authored kanji requirements
   * can be reported as data errors instead of being hidden by the type system.
   */
  readonly requiredAnswerScript?: "hiragana" | "katakana" | "kanji";
  readonly requiresKanjiOutput?: boolean;
}

/**
 * Machine-computed (or authored-and-checked) coverage for one module.
 */
export interface ModuleCoverage {
  readonly moduleId: ModuleId;
  readonly lessonIds: readonly LessonId[];
  readonly introducedConceptIds: readonly ConceptId[];
  readonly introducedLexemeIds: readonly LexemeId[];
  readonly introducedVerbIds: readonly VerbLexemeId[];
  readonly practicedVerbIds: readonly VerbLexemeId[];
  readonly assessedConceptIds: readonly ConceptId[];
  readonly assessedLexemeIds: readonly LexemeId[];
  readonly firstKatakanaExposureIds: readonly LexemeId[];
  /** Optional legacy/course-map summaries, checked when authored. */
  readonly verbCount?: number;
  readonly vocabularyCount?: number;
}

export interface CurriculumModuleEntry {
  readonly id: ModuleId;
  readonly phase: PhaseId;
  readonly order: number;
  readonly prerequisiteIds: readonly ModuleId[];
  readonly coverage: ModuleCoverage;
}

export interface CurriculumCopyCatalog {
  readonly it: Readonly<Record<string, string>>;
  readonly en: Readonly<Record<string, string>>;
}

export interface AssembledCurriculumCatalogs {
  readonly concepts: readonly ConceptCatalogEntry[];
  readonly lexemes: readonly LexemeCatalogEntry[];
  readonly examples: readonly ExampleCatalogEntry[];
  readonly exercises: readonly ExerciseCatalogEntry[];
  readonly speechPrompts: readonly SpeechPromptCatalogEntry[];
  readonly personas: readonly PersonaCatalogEntry[];
  readonly modules: readonly CurriculumModuleEntry[];
  readonly lessons: readonly CurriculumLessonEntry[];
  readonly copy: CurriculumCopyCatalog;
}

export interface ComputedCoverage {
  readonly vocabularyIds: readonly LexemeId[];
  readonly vocabularyCount: number;
  readonly introducedVerbIds: readonly VerbLexemeId[];
  readonly introducedVerbCount: number;
  readonly reusedVerbIds: readonly LexemeId[];
  readonly moduleCoverage: Readonly<Record<ModuleId, ModuleCoverage>>;
  readonly laterReuseModules: Readonly<
    Record<LexemeId, readonly ModuleId[]>
  >;
  readonly authoredExampleCounts: Readonly<Record<LexemeId, number>>;
}

export type CurriculumValidationErrorCode =
  | CatalogReferenceErrorCode
  | "duplicate-module-id"
  | "duplicate-module-order"
  | "duplicate-lesson-id"
  | "duplicate-lesson-order"
  | "duplicate-exercise-id"
  | "duplicate-speech-prompt-id"
  | "missing-module-reference"
  | "missing-lesson-reference"
  | "missing-exercise-reference"
  | "duplicate-exercise-reference"
  | "duplicate-exercise-segment"
  | "copied-exercise-answer"
  | "implicit-exercise-variant"
  | "impossible-exercise-choice"
  | "invalid-exercise-count"
  | "missing-speech-prompt-reference"
  | "prerequisite-not-earlier"
  | "prerequisite-cycle"
  | "invalid-phase-order"
  | "lesson-duration-out-of-range"
  | "assessment-before-introduction"
  | "practice-before-introduction"
  | "introduced-target-not-reused"
  | "capstone-introduces-content"
  | "required-kanji-output"
  | "missing-assisted-katakana-exposure"
  | "locale-key-mismatch"
  | "authored-computed-coverage-mismatch"
  | "insufficient-verb-reuse"
  | "invalid-lesson-count"
  | "invalid-vocabulary-count"
  | "invalid-verb-count";

export interface CurriculumValidationError {
  readonly code: CurriculumValidationErrorCode;
  readonly id?: string;
  readonly lessonId?: LessonId;
  readonly moduleId?: ModuleId;
  readonly referenceId?: string;
  readonly locale?: "it" | "en";
  readonly expected?: number | string;
  readonly actual?: number | string;
}

export interface CurriculumValidationResult {
  readonly valid: boolean;
  readonly errors: readonly CurriculumValidationError[];
  readonly coverage: ComputedCoverage;
}

export interface CurriculumValidationOptions {
  readonly enforceReleaseTargets?: boolean;
  /**
   * Enforce the per-lesson 3-5 exercise budget (design spec §5.2, §17.1).
   * Independent of `enforceReleaseTargets` and defaulting to `false` so the
   * existing zero-exercise Slice B release stays valid; Slice C Task 2's release
   * gate turns it on once every lesson references its authored definitions.
   */
  readonly enforceExerciseTargets?: boolean;
}

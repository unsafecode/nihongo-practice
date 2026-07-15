import type {
  ConceptId,
  ExampleId,
  ExerciseDefinitionId,
  LexemeId,
} from "../catalog/types";

/**
 * Typed, deterministic exercise definitions and the prompts/results the pure
 * engine derives from them (design spec §10.1-§10.3, Slice C plan Task 1).
 *
 * The load-bearing rule of this boundary: a definition stores only *references*
 * to shared concept, lexeme, and example (segment) data plus locale-independent
 * copy IDs. It never stores a canonical Japanese answer string — the engine
 * assembles every answer, tile, and option from the shared example catalog so
 * `validateCurriculum` can prove content is shared, not copied (§10.1, §10.2).
 *
 * These types intentionally depend only on the scalar ID aliases from the
 * catalog layer; the richer example/segment shape is described structurally
 * below so the real `CurriculumExampleEntry` satisfies it without coupling.
 */

export type ExerciseKind =
  | "tile-ordering"
  | "choice"
  | "transformation"
  | "completion"
  | "constrained-construction";

export type ExerciseSegmentKind = "word" | "particle" | "ending";

/** A within-example segment, structurally compatible with the shared catalog. */
export interface ExerciseExampleSegment {
  readonly id: string;
  readonly jp: string;
  readonly kind: ExerciseSegmentKind;
  readonly reading?: string;
}

/** A shared example, structurally compatible with `CurriculumExampleEntry`. */
export interface ExerciseExample {
  readonly id: ExampleId;
  readonly jp: string;
  readonly segments: readonly ExerciseExampleSegment[];
  readonly lexemeIds: readonly LexemeId[];
  readonly conceptIds: readonly ConceptId[];
}

/** The shared catalogs the engine resolves references against. */
export interface ExerciseCatalogsInput {
  readonly concepts: readonly { readonly id: ConceptId }[];
  readonly lexemes: readonly { readonly id: LexemeId }[];
  readonly examples: readonly ExerciseExample[];
}

/**
 * A reference to one segment of a shared example. `exampleId` defaults to the
 * definition's target example, so intra-sentence references (topic omission,
 * word-order variants, completion blanks) stay terse while cross-sentence
 * references (a distractor particle from another example) are explicit.
 */
export interface SegmentRef {
  readonly exampleId?: ExampleId;
  readonly segmentId: string;
}

export type AcceptedVariantId = string;

/**
 * An explicit, reviewable accepted alternative answer (spec §10.2). Its
 * `segmentRefs` enumerate the exact shared segments that assemble the variant —
 * a reordering, a topic-omitted subsequence, or an alternative particle. A
 * variant is never an implicit fuzzy match: empty or unresolvable refs are an
 * engine error, not a silent acceptance.
 */
export interface AcceptedVariant {
  readonly id: AcceptedVariantId;
  readonly reason: "orthography" | "topic-omission" | "particle-choice" | "word-order";
  readonly segmentRefs: readonly SegmentRef[];
}

interface ExerciseDefinitionBase {
  readonly id: ExerciseDefinitionId;
  readonly kind: ExerciseKind;
  /** Locale-independent copy ID for the instruction/prompt (resolved by the UI). */
  readonly promptCopyId: string;
  readonly assessedConceptIds: readonly ConceptId[];
  readonly assessedLexemeIds: readonly LexemeId[];
  readonly acceptedVariants?: readonly AcceptedVariant[];
}

/** Order the shared target example's shuffled tiles back into its canonical order. */
export interface TileOrderingExerciseDefinition extends ExerciseDefinitionBase {
  readonly kind: "tile-ordering";
  readonly targetExampleId: ExampleId;
  /** Optional extra tiles pulled from shared segments (never new literals). */
  readonly distractorRefs?: readonly SegmentRef[];
}

/** Choose the particle/ending that fills one blanked segment of the target. */
export interface ChoiceExerciseDefinition extends ExerciseDefinitionBase {
  readonly kind: "choice";
  readonly targetExampleId: ExampleId;
  readonly blankSegmentId: string;
  /** Alternative options, each resolved from a shared segment. */
  readonly distractorRefs: readonly SegmentRef[];
}

/** Rewrite a shared source example into a shared transformed example. */
export interface TransformationExerciseDefinition extends ExerciseDefinitionBase {
  readonly kind: "transformation";
  readonly promptExampleId: ExampleId;
  readonly targetExampleId: ExampleId;
  readonly transformation: "tense" | "polarity";
  readonly permitKatakanaToHiragana?: boolean;
}

/** Supply the blanked segments of the target example. */
export interface CompletionExerciseDefinition extends ExerciseDefinitionBase {
  readonly kind: "completion";
  readonly targetExampleId: ExampleId;
  readonly blankSegmentIds: readonly string[];
  readonly permitKatakanaToHiragana?: boolean;
}

/** Construct the target sentence from a localized IT/EN intent. */
export interface ConstrainedConstructionExerciseDefinition
  extends ExerciseDefinitionBase {
  readonly kind: "constrained-construction";
  readonly targetExampleId: ExampleId;
  /** Locale-independent copy ID for the IT/EN source intent text. */
  readonly intentCopyId: string;
  readonly permitKatakanaToHiragana?: boolean;
}

export type ExerciseDefinition =
  | TileOrderingExerciseDefinition
  | ChoiceExerciseDefinition
  | TransformationExerciseDefinition
  | CompletionExerciseDefinition
  | ConstrainedConstructionExerciseDefinition;

export interface ExerciseTile {
  readonly id: string;
  readonly jp: string;
  readonly kind: ExerciseSegmentKind;
  readonly reading?: string;
}

export interface ExerciseChoiceOption {
  readonly id: string;
  readonly jp: string;
  readonly kind: ExerciseSegmentKind;
  readonly reading?: string;
}

export interface ExercisePromptSegment {
  readonly id: string;
  readonly jp: string;
  readonly kind: ExerciseSegmentKind;
  readonly reading?: string;
  readonly isBlank: boolean;
}

interface ExercisePromptBase {
  readonly definitionId: ExerciseDefinitionId;
  readonly kind: ExerciseKind;
  readonly promptCopyId: string;
  readonly assessedConceptIds: readonly ConceptId[];
  readonly assessedLexemeIds: readonly LexemeId[];
}

export interface TileOrderingPrompt extends ExercisePromptBase {
  readonly kind: "tile-ordering";
  /** Tiles in a stable, deterministic presentation order (not the answer order). */
  readonly tiles: readonly ExerciseTile[];
  /** The canonical answer order of the target example's own tiles. */
  readonly correctTileIds: readonly string[];
  /** Extra accepted orders from explicit word-order variants. */
  readonly acceptedTileOrders: readonly (readonly string[])[];
}

export interface ChoicePrompt extends ExercisePromptBase {
  readonly kind: "choice";
  readonly sentenceSegments: readonly ExercisePromptSegment[];
  readonly blankSegmentId: string;
  readonly options: readonly ExerciseChoiceOption[];
  readonly correctOptionId: string;
  /** Correct option plus any explicit particle-choice variant options. */
  readonly acceptedOptionIds: readonly string[];
}

export interface TransformationPrompt extends ExercisePromptBase {
  readonly kind: "transformation";
  readonly promptExampleId: ExampleId;
  readonly promptJp: string;
  readonly canonicalAnswer: string;
  readonly acceptedAnswers: readonly string[];
  readonly permitKatakanaToHiragana: boolean;
}

export interface CompletionPrompt extends ExercisePromptBase {
  readonly kind: "completion";
  readonly sentenceSegments: readonly ExercisePromptSegment[];
  readonly blankSegmentIds: readonly string[];
  readonly canonicalAnswer: string;
  readonly acceptedAnswers: readonly string[];
  readonly permitKatakanaToHiragana: boolean;
}

export interface ConstrainedConstructionPrompt extends ExercisePromptBase {
  readonly kind: "constrained-construction";
  readonly intentCopyId: string;
  readonly canonicalAnswer: string;
  readonly acceptedAnswers: readonly string[];
  readonly permitKatakanaToHiragana: boolean;
}

export type ExercisePrompt =
  | TileOrderingPrompt
  | ChoicePrompt
  | TransformationPrompt
  | CompletionPrompt
  | ConstrainedConstructionPrompt;

export type ExerciseCandidate =
  | { readonly kind: "tile-ordering"; readonly tileIds: readonly string[] }
  | { readonly kind: "choice"; readonly optionId: string }
  | { readonly kind: "transformation"; readonly text: string }
  | { readonly kind: "completion"; readonly text: string }
  | { readonly kind: "constrained-construction"; readonly text: string };

export type ExerciseGenerationErrorCode =
  | "missing-example"
  | "missing-segment"
  | "missing-concept"
  | "missing-lexeme"
  | "duplicate-segment"
  | "impossible-choice"
  | "invalid-variant"
  | "absent-target";

export interface ExerciseGenerationError {
  readonly code: ExerciseGenerationErrorCode;
  readonly definitionId: ExerciseDefinitionId;
  readonly referenceId?: string;
}

export type ExerciseGenerationResult =
  | { readonly ok: true; readonly prompt: ExercisePrompt }
  | { readonly ok: false; readonly error: ExerciseGenerationError };

export type ExerciseEvaluation =
  | { readonly status: "accepted" }
  | {
      readonly status: "retry";
      readonly targetConceptIds: readonly ConceptId[];
      readonly targetLexemeIds: readonly LexemeId[];
    }
  | { readonly status: "invalid-definition"; readonly reason: string };

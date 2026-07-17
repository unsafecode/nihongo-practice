import type { ExerciseKind } from "../exercises/types";
import type {
  AssembledToken,
  RomajiBoundaryBefore,
  RomajiTokenKind,
} from "../../romaji/types";

/**
 * Locale-independent sentence-family/Can-do foundation contracts (design spec
 * §8-§10, §15-§16; Phase 1 Task 1). This module owns *data* contracts only —
 * the pure realization/selection/validation operations (and their Result,
 * error, and report types) belong to the later tasks that implement them.
 *
 * Every ID alias below is intentionally a plain `string`: this catalog is a
 * new, self-contained layer that does not yet wire into the existing
 * `course/catalog` or `course/data` modules (that rewire happens in Phase 2).
 * The only shared imports are the exercise-kind vocabulary and the romaji
 * token contract, per the task's import boundary.
 */

export type CourseLevelId = "a1" | "a2";

export type ModuleId = string;
export type LessonId = string;
export type CheckpointId = string;
export type CanDoId = string;
export type ContextId = string;
export type PersonRoleId = string;
export type ReferentId = string;
export type SentenceFamilyId = string;
export type SentenceVariantId = string;
export type SentenceSlotId = string;
export type SemanticValueId = string;
export type RealizationRuleId = string;
export type LexemeId = string;
export type LexemeSenseId = string;
export type SemanticFrameId = string;
export type PredicateId = string;
export type PracticeRoundId = string;
export type VariantSelectionPolicyId = string;
export type CopyId = string;
export type ConceptId = string;

/** Whether a taught sense must be produced by the learner or only recognized. */
export type LearningUse = "productive" | "receptive";

/** The variation axes a sentence family may permit across its variants (§10.1). */
export type VariationAxis =
  | "speaker-person"
  | "predicate-verb"
  | "object"
  | "location"
  | "time"
  | "polarity-tense-form"
  | "context";

/** The pedagogical role a single authored sentence variant plays (§10.1). */
export type PedagogicalUse =
  | "model"
  | "guided"
  | "controlled-practice"
  | "transfer"
  | "spoken";

/**
 * How a Can-do's checkpoint evidence is gathered. Evidence is always sampled
 * through bounded checkpoint scenarios, never inferred from lesson visits
 * alone (§8), and must include a minimum number of accepted transfer targets.
 */
export interface CanDoEvidenceRule {
  readonly evidenceKind: "checkpoint-sampled";
  readonly minAcceptedTransferTargets: number;
}

/** The five Can-do domains this course reports against (§8). */
export type CanDoDomain =
  | "interaction"
  | "spoken-production"
  | "listening"
  | "reading"
  | "writing";

/**
 * A single Can-do outcome statement (§8). Copy is never certified/mastered/
 * fluent language — `descriptorCopyId` must resolve to product-authored,
 * JF/CEFR-aligned language, and `sourceNote` records that alignment claim
 * explicitly rather than implying a formal certification.
 */
export interface CanDo {
  readonly id: CanDoId;
  readonly level: CourseLevelId;
  readonly domain: CanDoDomain;
  readonly descriptorCopyId: CopyId;
  readonly contextIds: readonly ContextId[];
  readonly lessonIds: readonly LessonId[];
  readonly checkpointEvidenceRule: CanDoEvidenceRule;
  readonly sourceNote?: "product-authored-jf-cefr-aligned";
}

/** A level checkpoint samples multiple Can-dos through bounded scenarios (§8). */
export interface CheckpointDefinition {
  readonly id: CheckpointId;
  readonly level: CourseLevelId;
  readonly sampledCanDoIds: readonly CanDoId[];
  readonly minAcceptedTransferTargetsPerCanDo: number;
}

/** A course level's identity and membership (§5, §15). */
export interface CourseLevel {
  readonly id: CourseLevelId;
  readonly alignmentCopyId: CopyId;
  readonly moduleIds: readonly ModuleId[];
  readonly canDoIds: readonly CanDoId[];
  /** A2 recommends, but does not require, an A1 checkpoint before starting. */
  readonly recommendedPrerequisiteCheckpointId?: CheckpointId;
}

/** A module groups lessons within one level (§6, §7). */
export interface FoundationModule {
  readonly id: ModuleId;
  readonly level: CourseLevelId;
  readonly order: number;
  readonly canDoIds: readonly CanDoId[];
  readonly lessonIds: readonly LessonId[];
}

/**
 * A lesson's canonical position, used to prove spaced productive-verb
 * recurrence (§9.3 rules 4-5). This record is deliberately separate from
 * `FoundationLessonDefinition`: a later lesson can be a stable recurrence
 * point for verb-timeline validation before its own depth contract is
 * authored (the Phase 1 conservative boundary).
 */
export interface LessonPositionRecord {
  readonly lessonId: LessonId;
  readonly level: CourseLevelId;
  readonly moduleId: ModuleId;
  readonly position: number;
}

/** Grammatical role/person kinds a discourse participant may carry (§9.2). */
export type PersonRoleKind = "persona" | "family" | "social" | "learner" | "unnamed";

/** A speaker/addressee/subject role catalog entry (§9.2). */
export interface PersonRole {
  readonly id: PersonRoleId;
  readonly kind: PersonRoleKind;
  readonly labelCopyId: CopyId;
}

export type Animacy = "animate" | "inanimate";

/** A concrete entity a sentence can refer to (§9.2). */
export interface Referent {
  readonly id: ReferentId;
  readonly personRoleId: PersonRoleId;
  readonly animacy: Animacy;
  readonly labelCopyId: CopyId;
}

/** A bounded scenario/setting a Can-do and its variants are practiced in (§8). */
export interface Context {
  readonly id: ContextId;
  readonly labelCopyId: CopyId;
}

/** The semantic argument roles a predicate sense's frame may require. */
export type SemanticArgumentRole =
  | "agent"
  | "theme"
  | "topic"
  | "location"
  | "time"
  | "companion"
  | "goal";

/**
 * The closed set of case particles a predicate sense's frame may assign to
 * a governed argument role (§16 case-frame extension). Deliberately closed
 * rather than a bare `string`, so a new particle requires an explicit type
 * update instead of silently typo-ing past validation.
 */
export type SemanticParticleId =
  | "wa"
  | "o"
  | "ni"
  | "de"
  | "to"
  | "ga"
  | "he"
  | "kara"
  | "made";

/**
 * Per-role case-particle requirements a predicate sense's frame declares
 * (§16 case-frame extension). Only predicate-governed argument roles belong
 * here: `"agent"` and `"topic"` are never keys, because subject/topic marking
 * is chosen by the `DiscourseFrame` (speaker/topic conventions), not by the
 * predicate's own frame. A sense either declares a particle for every one of
 * its governed argument roles, or leaves the record empty when no
 * predicate-specific case marking is needed yet — there is no partial
 * declaration.
 */
export type ArgumentParticleByRole = Readonly<
  Partial<Record<SemanticArgumentRole, SemanticParticleId>>
>;

/**
 * A taught sense of a lexeme (§9.3). Two lexeme IDs with identical orthography
 * are different senses only when their semantic frames differ — this record
 * is the unit the productive/receptive recurrence rules are tracked against.
 */
export interface LearningTargetSense {
  readonly id: LexemeSenseId;
  readonly lexemeId: LexemeId;
  readonly learningUse: LearningUse;
  readonly semanticFrameId: SemanticFrameId;
  readonly predicate: PredicateId;
  readonly argumentRoles: readonly SemanticArgumentRole[];
  /**
   * The predicate sense's own case frame (§16 extension). Sentence families
   * whose senses govern case differently — e.g. `live` (location `ni`) and
   * `work` (location `de`) sharing the `fixture-a1-residence-action`
   * family/rule — read case marking from here, so one family/rule id can
   * realize multiple particle patterns without a string/sense special case.
   */
  readonly argumentParticleByRole: ArgumentParticleByRole;
}

/** What kind of sentence-building unit a semantic value fills a slot with (§10.1). */
export type SemanticValueKind =
  | "referent"
  | "predicate-sense"
  | "object"
  | "location"
  | "time";

/**
 * One authored Japanese/romaji fragment a semantic value contributes to
 * realization. Structurally compatible with `AssembledToken` minus the `id`
 * and `source` fields, which the (later) realizer assigns once it knows the
 * sentence position — semantic values own content, not final placement.
 */
export interface SemanticValueTokenFragment {
  readonly jp: string;
  readonly romaji: string;
  readonly kind: RomajiTokenKind;
  readonly boundaryBefore: RomajiBoundaryBefore;
  readonly reading?: string;
}

/**
 * A reusable semantic building block (§10.1, §15). This is the *only* place
 * Japanese/romaji content is authored for sentence construction — sentence
 * families and variants reference semantic values by ID and never carry
 * their own Japanese literals. Particles and inflectional endings are not
 * authored here; they belong to the (later) realization rule keyed by
 * `SentenceFamily.realizationRuleId`.
 */
export interface SemanticValue {
  readonly id: SemanticValueId;
  readonly kind: SemanticValueKind;
  readonly senseId?: LexemeSenseId;
  readonly animacy?: Animacy;
  readonly tokenFragments: readonly SemanticValueTokenFragment[];
}

/** One slot a sentence family's realization rule fills from a semantic value. */
export interface SentenceSlotDefinition {
  readonly id: SentenceSlotId;
  readonly axis: VariationAxis;
  readonly valueKind: SemanticValueKind;
  readonly optional: boolean;
}

export type Polarity = "affirmative" | "negative";
export type Tense = "present" | "past";
export type Formality = "plain" | "polite";

/** The grammatical form a variant's realization takes (§10.1). */
export interface FormSelection {
  readonly polarity: Polarity;
  readonly tense: Tense;
  readonly formality: Formality;
  /**
   * When true, the sentence is realized as a polite yes/no or content
   * question: the realizer appends the sentence-final interrogative particle
   * か after the predicate ending and marks the semantic fingerprint with a
   * distinct `mood=interrogative` segment. Omitted/undefined means a plain
   * statement — the fingerprint carries no mood segment at all, so every
   * existing statement variant keeps a byte-identical fingerprint. Question
   * word order is authored entirely through slot values (e.g. a なに/どこ
   * complement); this flag only governs the sentence-final particle + mood.
   */
  readonly interrogative?: boolean;
}

/** Speaker/addressee/subject/scenario metadata every example carries (§9.2, §10.1). */
export interface DiscourseFrame {
  readonly speakerRoleId: PersonRoleId;
  readonly addresseeRoleId: PersonRoleId | null;
  readonly subjectReferentId: ReferentId | null;
  readonly subjectRealization: "explicit" | "omitted";
  readonly scenarioNoteCopyId: CopyId;
}

/** A shared sentence-family definition: slots, permitted axes, realizer (§10.1). */
export interface SentenceFamily {
  readonly id: SentenceFamilyId;
  readonly level: CourseLevelId;
  readonly canDoIds: readonly CanDoId[];
  readonly slotSchema: readonly SentenceSlotDefinition[];
  readonly permittedAxes: readonly VariationAxis[];
  readonly realizationRuleId: RealizationRuleId;
  readonly requiredConceptIds: readonly ConceptId[];
}

/**
 * An authored sentence variant (§10.1). It stores semantic *choices* — slot
 * values, discourse frame, context, form, and pedagogical use — never a
 * canonical Japanese answer literal. `RealizedSentence` production is the
 * (later) realizer's job.
 */
export interface SentenceVariant {
  readonly id: SentenceVariantId;
  readonly sentenceFamilyId: SentenceFamilyId;
  readonly discourse: DiscourseFrame;
  readonly contextId: ContextId;
  readonly slotValues: Readonly<Record<SentenceSlotId, SemanticValueId>>;
  readonly form: FormSelection;
  readonly pedagogicalUse: PedagogicalUse;
}

/** One deterministic-selection practice round definition (§11.1). */
export interface PracticeRoundDefinition {
  readonly id: PracticeRoundId;
  readonly purpose: "guided-controlled" | "transfer";
  readonly candidateVariantIds: readonly SentenceVariantId[];
  readonly selectionPolicyId: VariantSelectionPolicyId;
  readonly exerciseKinds: readonly ExerciseKind[];
  readonly targetCount: number;
}

/** A lesson's two-round practice contract (§11.1, §11.2). */
export interface LessonPracticeDefinition {
  readonly lessonId: LessonId;
  readonly roundOne: PracticeRoundDefinition;
  readonly roundTwo: PracticeRoundDefinition;
}

/** The numeric depth/diversity contract every non-phonetic lesson must meet (§9.1). */
export interface LessonDiversityConstraints {
  readonly modelCountRange: readonly [number, number];
  readonly exerciseCountRange: readonly [number, number];
  readonly minFamilies: number;
  readonly minPredicates: number;
  readonly minRoles: number;
  readonly minContexts: number;
  readonly minUniqueTargets: number;
  readonly maxTargetReuse: number;
  readonly minTransferExercises: number;
  readonly requireControlledConstruction: boolean;
}

/**
 * A depth-validated instructional lesson (§9.1, §12). This is the "conservative
 * boundary" catalog entry: only lessons whose model/practice/diversity content
 * has actually been authored belong here. Lessons that exist only to prove
 * verb-recurrence timing live in `lessonPositions` instead (see
 * `LessonPositionRecord`).
 */
export interface FoundationLessonDefinition {
  readonly id: LessonId;
  readonly level: CourseLevelId;
  readonly moduleId: ModuleId;
  readonly primaryCanDoId: CanDoId;
  readonly supportingCanDoIds: readonly CanDoId[];
  readonly modelVariantIds: readonly SentenceVariantId[];
  readonly familyIds: readonly SentenceFamilyId[];
  readonly practice: LessonPracticeDefinition;
  readonly diversityConstraints: LessonDiversityConstraints;
}

/**
 * A correctness-bearing exercise in a verb's introduction lesson, satisfying
 * §9.3 rule 2. It references the practice round the exercise belongs to
 * rather than duplicating an exercise-definition system this task does not
 * own.
 */
export interface VerbIntroductionExerciseRecord {
  readonly lessonId: LessonId;
  readonly roundId: PracticeRoundId;
  readonly exerciseKind: ExerciseKind;
  readonly targetVariantId: SentenceVariantId;
}

/** One later, spaced reuse of a productive/receptive verb sense (§9.3 rules 3-5). */
export interface VerbLaterUse {
  readonly lessonId: LessonId;
  readonly variantId: SentenceVariantId;
}

/**
 * A standalone productive/receptive verb-introduction timeline (§9.3). Raw
 * lesson/variant references only — position gaps, later-module status, and
 * structural distinctness are derived by validators/tests from
 * `lessonPositions` and the referenced variants/families, not pre-computed
 * booleans stored here.
 */
export interface VerbUseRecord {
  readonly id: string;
  readonly senseId: LexemeSenseId;
  readonly learningUse: LearningUse;
  readonly introductionLessonId: LessonId;
  readonly introductionVariantIds: readonly SentenceVariantId[];
  readonly introductionExercise: VerbIntroductionExerciseRecord;
  readonly laterUses: readonly VerbLaterUse[];
}

/** The full Phase 1 foundation catalog set (§15). */
export interface FoundationCatalogs {
  readonly levels: readonly CourseLevel[];
  readonly modules: readonly FoundationModule[];
  readonly checkpoints: readonly CheckpointDefinition[];
  readonly canDos: readonly CanDo[];
  readonly contexts: readonly Context[];
  readonly personRoles: readonly PersonRole[];
  readonly referents: readonly Referent[];
  readonly learningTargetSenses: readonly LearningTargetSense[];
  readonly semanticValues: readonly SemanticValue[];
  readonly sentenceFamilies: readonly SentenceFamily[];
  readonly sentenceVariants: readonly SentenceVariant[];
  readonly lessons: readonly FoundationLessonDefinition[];
  readonly lessonPositions: readonly LessonPositionRecord[];
  readonly verbUseRecords: readonly VerbUseRecord[];
}

/**
 * A realizer's output for one variant (§10.2). The realizer itself
 * (`SentenceFamilyRealizer`) and its Result/error types belong to the task
 * that implements it (Phase 1 Task 2, `realizeFamily.ts`); this is only the
 * data shape that task produces and later tasks consume.
 */
export interface RealizedSentence {
  readonly familyId: SentenceFamilyId;
  readonly variantId: SentenceVariantId;
  readonly tokens: readonly AssembledToken[];
  readonly canonicalJapanese: string;
  /**
   * The learner-visible answer key: normalized canonical Japanese only.
   * Never derived from or mixed with discourse/context/form metadata, so two
   * variants that happen to realize identical Japanese always share this key
   * even when their hidden semantics (discourse, context, form) differ.
   */
  readonly visibleTargetKey: string;
  /**
   * A deterministic serialization of every semantic choice behind this
   * realization (family, discourse role/addressee/referent/realization,
   * predicate sense, context, form, and sorted slot key=value pairs) —
   * independent of any object's JS insertion order. Used to detect
   * accidental semantic duplication across authored variants.
   */
  readonly semanticFingerprint: string;
  readonly predicateSenseId: LexemeSenseId;
  readonly discourse: DiscourseFrame;
  readonly contextId: ContextId;
  readonly pedagogicalUse: PedagogicalUse;
  readonly usedConceptIds: readonly ConceptId[];
  readonly usedLexemeSenseIds: readonly LexemeSenseId[];
}

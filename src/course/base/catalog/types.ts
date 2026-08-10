import type { AssembledToken } from "../../../romaji/types";
import type { LessonId, SemanticArgumentRole } from "../../foundations/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import type { BaseLessonContract } from "../types";
import { BASE_LESSON_MANIFEST } from "../manifest";
import type {
  BaseParticleRole,
  BaseParticleSense,
} from "../forms/particleLicensing";

export type BaseActivityCategory =
  | "meaning-comprehension"
  | "form-function-discrimination"
  | "ordering"
  | "controlled-production"
  | "transformation"
  | "error-diagnosis"
  | "contextual-response"
  | "cumulative-retrieval";

export type BaseInteractionKind =
  | "choice"
  | "tile-ordering"
  | "completion"
  | "transformation"
  | "constrained-construction"
  | "listening"
  | "spoken";

export type BaseActivityMode = "non-spoken" | "audio";
export type BaseActivityKind = BaseActivityCategory | "listening" | "spoken";
export type BaseSemanticActivityOperation =
  | "recognize-meaning"
  | "discriminate-form-function"
  | "order-chunks"
  | "produce-controlled"
  | "transform-form"
  | "diagnose-error"
  | "select-contextual-response"
  | "retrieve-cumulative"
  | "identify-audio"
  | "produce-spoken";
export type BasePhoneticActivityOperation =
  | "discriminate-sound"
  | "segment-morae"
  | "recognize-kana"
  | "map-script"
  | "match-sound-word"
  | "assemble-reading";
export type BaseActivityOperation =
  | BaseSemanticActivityOperation
  | BasePhoneticActivityOperation;

export const BASE_ACTIVITY_OPERATION_BY_CATEGORY: Readonly<
  Record<BaseActivityKind, BaseSemanticActivityOperation>
> = deepFreeze({
  "meaning-comprehension": "recognize-meaning",
  "form-function-discrimination": "discriminate-form-function",
  ordering: "order-chunks",
  "controlled-production": "produce-controlled",
  transformation: "transform-form",
  "error-diagnosis": "diagnose-error",
  "contextual-response": "select-contextual-response",
  "cumulative-retrieval": "retrieve-cumulative",
  listening: "identify-audio",
  spoken: "produce-spoken",
});

export const BASE_ACTIVITY_INTERACTIONS_BY_CATEGORY: Readonly<
  Record<BaseActivityKind, readonly BaseInteractionKind[]>
> = deepFreeze({
  "meaning-comprehension": ["choice"],
  "form-function-discrimination": ["choice"],
  ordering: ["tile-ordering"],
  "controlled-production": ["completion", "constrained-construction"],
  transformation: ["transformation"],
  "error-diagnosis": ["choice"],
  "contextual-response": ["choice", "constrained-construction"],
  "cumulative-retrieval": ["completion", "constrained-construction"],
  listening: ["listening"],
  spoken: ["spoken"],
});

export const BASE_PHONETIC_ACTIVITY_OPERATIONS: readonly BasePhoneticActivityOperation[] =
  deepFreeze([
    "discriminate-sound",
    "segment-morae",
    "recognize-kana",
    "map-script",
    "match-sound-word",
    "assemble-reading",
  ]);

const ACTIVITY_KINDS = new Set<string>(
  Object.keys(BASE_ACTIVITY_OPERATION_BY_CATEGORY),
);
const ACTIVITY_INTERACTIONS = new Set<string>([
  "choice",
  "tile-ordering",
  "completion",
  "transformation",
  "constrained-construction",
  "listening",
  "spoken",
]);
const ACTIVITY_MODES = new Set<string>(["non-spoken", "audio"]);
const ACTIVITY_OPERATIONS = new Set<string>([
  ...Object.values(BASE_ACTIVITY_OPERATION_BY_CATEGORY),
  ...BASE_PHONETIC_ACTIVITY_OPERATIONS,
]);

export interface BaseActivityDefinition {
  readonly id: string;
  readonly category: BaseActivityKind;
  readonly interactionKind: BaseInteractionKind;
  readonly mode: BaseActivityMode;
  readonly targetId: string;
  readonly operation: BaseActivityOperation;
  readonly instructionCopyId: string;
  readonly acceptedFeedbackCopyId: string;
  readonly retryFeedbackCopyId: string;
  readonly assessedConceptIds: readonly string[];
  readonly assessedLexemeIds: readonly string[];
}

export interface BaseLessonCommon {
  readonly lessonId: LessonId;
  readonly contract: BaseLessonContract;
  readonly prerequisiteLessonIds: readonly LessonId[];
  readonly activities: readonly BaseActivityDefinition[];
  readonly recapCopyId: string;
}

export interface BaseSemanticLessonFields {
  readonly newLexemeIds: readonly string[];
  readonly reviewLexemeIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly reviewedConceptIds: readonly string[];
  readonly explanationBlockIds: Readonly<{
    readonly main: string;
    readonly construction: string;
    readonly constraints: string;
    readonly commonError: string;
    readonly nearestContrast: string;
  }>;
  readonly patternCellIds: readonly string[];
  readonly workedExampleIds: readonly string[];
  readonly dialogueId: string | null;
  readonly referenceSnapshotIds: readonly string[];
  readonly interactive: boolean;
  readonly retrievedSystemIds: readonly string[];
}

export interface BasePhoneticLessonContent extends BaseLessonCommon {
  readonly contract: "phonetic";
  readonly contrastiveItemIds: readonly string[];
  readonly anchorLexemeIds: readonly string[];
  readonly audioExemplarIds: readonly string[];
  readonly phoneticExplanationCopyId: string;
  readonly contrastMapId: string;
}

export interface BaseContentLessonContent
  extends BaseLessonCommon,
    BaseSemanticLessonFields {
  readonly contract: "content";
}

export interface BaseSystemLessonContent
  extends BaseLessonCommon,
    BaseSemanticLessonFields {
  readonly contract: "system";
}

export interface BaseSynthesisLessonContent
  extends BaseLessonCommon,
    BaseSemanticLessonFields {
  readonly contract: "synthesis";
}

export type BaseLessonContent =
  | BasePhoneticLessonContent
  | BaseContentLessonContent
  | BaseSystemLessonContent
  | BaseSynthesisLessonContent;

export type BasePredicateAspect =
  | "dynamic"
  | "stative"
  | "nominal"
  | "adjectival";

export type BaseInterpretationTag =
  | "habitual"
  | "future"
  | "present-state"
  | "ongoing-now"
  | "resulting-state"
  | "past"
  | "negative";

export type BaseTranslationCopy =
  | Readonly<{ readonly copyId: string }>
  | Readonly<{ readonly enCopyId: string; readonly itCopyId: string }>;

export interface BaseParticleFrame {
  readonly predicateSenseId: string;
  readonly provided: Readonly<
    Partial<Record<BaseParticleRole, BaseParticleSense>>
  >;
}

/**
 * Canonical provenance carried by every learner-visible Japanese target.
 *
 * Token source references are useful rendering metadata, but are not
 * authoritative content ownership records: generated morphemes can carry
 * non-canonical source IDs. Validators use these explicit fields instead.
 */
export interface BaseVisibleTarget {
  readonly tokens: readonly AssembledToken[];
  readonly lexemeIds: readonly string[];
  readonly conceptIds: readonly string[];
  readonly formIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly semanticRoleIds: readonly SemanticArgumentRole[];
  readonly interpretationTags: readonly BaseInterpretationTag[];
  /**
   * Canonical predicate provenance. A particle frame can only describe this
   * named sense and one visible lexeme that realizes it.
   */
  readonly predicateSenseId: string | null;
  readonly predicateLexemeId: string | null;
  readonly predicateAspect?: BasePredicateAspect;
  readonly discourseFrameId?: string;
  readonly particleFrame?: BaseParticleFrame;
}

export interface BaseExample extends BaseVisibleTarget {
  readonly id: string;
  readonly discourseFrameId: string;
  readonly teachingPurposeCopyId: string;
  readonly translationCopy: BaseTranslationCopy;
  readonly predicateAspect: BasePredicateAspect;
}

export interface BaseDialogueTurn extends BaseVisibleTarget {
  readonly speakerId: string;
  readonly discourseFrameId: string;
  readonly predicateAspect: BasePredicateAspect;
}

export interface BaseDialogue {
  readonly id: string;
  readonly practicalOutcomeCopyId: string;
  readonly turns: readonly BaseDialogueTurn[];
}

function cloneForBasePublication<T>(
  value: T,
  seen: WeakMap<object, unknown> = new WeakMap(),
): T {
  if (value === null || typeof value !== "object") return value;
  const source = value as object;
  const existing = seen.get(source);
  if (existing !== undefined) return existing as T;
  if (Array.isArray(value)) {
    const clone: unknown[] = [];
    seen.set(source, clone);
    clone.push(...value.map((entry) => cloneForBasePublication(entry, seen)));
    return clone as T;
  }
  const prototype = Object.getPrototypeOf(source);
  if (prototype !== Object.prototype && prototype !== null) return value;
  const clone = Object.create(prototype) as Record<string, unknown>;
  seen.set(source, clone);
  for (const key of Object.keys(source)) {
    clone[key] = cloneForBasePublication(
      (source as Readonly<Record<string, unknown>>)[key],
      seen,
    );
  }
  return clone as T;
}

function visibleTargetView(source: BaseVisibleTarget): BaseVisibleTarget {
  return deepFreeze(
    cloneForBasePublication({
      tokens: source.tokens,
      lexemeIds: source.lexemeIds,
      conceptIds: source.conceptIds,
      formIds: source.formIds,
      patternCellIds: source.patternCellIds,
      semanticRoleIds: source.semanticRoleIds,
      interpretationTags: source.interpretationTags,
      predicateSenseId: source.predicateSenseId,
      predicateLexemeId: source.predicateLexemeId,
      ...(source.predicateAspect
        ? { predicateAspect: source.predicateAspect }
        : {}),
      ...(source.discourseFrameId
        ? { discourseFrameId: source.discourseFrameId }
        : {}),
      ...(source.particleFrame ? { particleFrame: source.particleFrame } : {}),
    }),
  );
}

/** Clones and freezes arbitrary canonical target provenance before publication. */
export function visibleTargetFromTarget(target: BaseVisibleTarget): BaseVisibleTarget {
  return visibleTargetView(target);
}

/** Adapts an authored example to the canonical visible-target provenance view. */
export function visibleTargetFromExample(example: BaseExample): BaseVisibleTarget {
  return visibleTargetView(example);
}

/** Adapts an authored dialogue turn to the canonical visible-target provenance view. */
export function visibleTargetFromDialogueTurn(
  turn: BaseDialogueTurn,
): BaseVisibleTarget {
  return visibleTargetView(turn);
}

/** @deprecated Use `visibleTargetFromExample` for clone-safe publication. */
export function baseVisibleTargetForExample(example: BaseExample): BaseVisibleTarget {
  return visibleTargetFromExample(example);
}

/** @deprecated Use `visibleTargetFromDialogueTurn` for clone-safe publication. */
export function baseVisibleTargetForDialogueTurn(
  turn: BaseDialogueTurn,
): BaseVisibleTarget {
  return visibleTargetFromDialogueTurn(turn);
}

export interface BaseLexemeCommon {
  readonly id: string;
  readonly kana: string;
  readonly romaji: string;
  readonly meaningCopyId: string;
  readonly firstTeachLessonId: LessonId;
  readonly countable: boolean;
}

export type BaseTeConstruction = "te" | "request" | "sequence" | "te-imasu";

export interface BaseVerbLexeme extends BaseLexemeCommon {
  readonly category: "verb";
  readonly verbClass: "godan" | "ichidan" | "suru" | "kuru";
  readonly aspect: "dynamic" | "stative";
  readonly allowedTeConstructions: readonly BaseTeConstruction[];
  readonly dictionaryTokens: readonly AssembledToken[];
  readonly teFormException?: Readonly<{
    readonly stemKana: string;
    readonly stemRomaji: string;
    readonly endingKana: string;
    readonly endingRomaji: string;
  }>;
}

export interface BaseAdjectiveLexeme extends BaseLexemeCommon {
  readonly category: "adjective";
  readonly adjectiveClass: "i" | "na";
  /**
   * I-adjectives normally inflect from the dictionary form without its final
   * い. An irregular record supplies the canonical negative/past stem instead.
   */
  readonly iAdjectiveInflection?: Readonly<{
    readonly negativeStemKana: string;
    readonly negativeStemRomaji: string;
  }>;
}

export interface BaseNounLexeme extends BaseLexemeCommon {
  readonly category: "noun";
}

export interface BaseExpressionLexeme extends BaseLexemeCommon {
  readonly category: "expression";
}

export type BaseLexeme =
  | BaseVerbLexeme
  | BaseAdjectiveLexeme
  | BaseNounLexeme
  | BaseExpressionLexeme;

export type BaseConceptKind = "concept" | "form" | "reference-entry";

export interface BaseConcept {
  readonly id: string;
  readonly kind: BaseConceptKind;
  readonly prerequisiteIds: readonly string[];
  readonly firstTeachLessonId: LessonId;
}

export interface BaseRetrievalSystem {
  readonly id: string;
  readonly firstTeachLessonId: LessonId;
  readonly componentContentIds: readonly string[];
}

export interface BaseReferenceSnapshotDefinition {
  readonly id: string;
  readonly firstTeachLessonId: LessonId;
  readonly titleCopyId: string;
}

export interface BaseValidationCatalogs {
  readonly lexemes: ReadonlyMap<string, BaseLexeme>;
  readonly concepts: ReadonlyMap<string, BaseConcept>;
  readonly examples: ReadonlyMap<string, BaseExample>;
  readonly dialogues: ReadonlyMap<string, BaseDialogue>;
  readonly audioTargets: ReadonlyMap<string, BaseVisibleTarget>;
  readonly acceptedAnswerTargets: ReadonlyMap<string, BaseVisibleTarget>;
  /** Prompt provenance is keyed by `baseActivityPromptKey(lessonId, activityId)`. */
  readonly activityPromptTargets: ReadonlyMap<string, BaseVisibleTarget>;
  readonly copyIds: ReadonlySet<string>;
  readonly contrastMapIds: ReadonlySet<string>;
  readonly referenceSnapshots: ReadonlyMap<string, BaseReferenceSnapshotDefinition>;
  readonly patternCellIds: ReadonlySet<string>;
  readonly patternCellIdsByLesson: ReadonlyMap<LessonId, readonly string[]>;
  readonly systems: ReadonlyMap<string, BaseRetrievalSystem>;
}

export type BaseLessonContentDefinitionErrorCode =
  | "empty-id"
  | "duplicate-activity-id"
  | "unknown-lesson-id"
  | "lesson-contract-mismatch"
  | "wrong-contract-fields";

export class BaseLessonContentDefinitionError extends Error {
  readonly code: BaseLessonContentDefinitionErrorCode;

  constructor(code: BaseLessonContentDefinitionErrorCode, message: string) {
    super(message);
    this.name = "BaseLessonContentDefinitionError";
    this.code = code;
  }
}

function nonempty(value: string): boolean {
  return value.trim().length > 0;
}

function assertNonemptyId(value: string, label: string): void {
  if (!nonempty(value)) {
    throw new BaseLessonContentDefinitionError("empty-id", `${label} must be nonempty.`);
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function isNonemptyString(value: unknown): value is string {
  return typeof value === "string" && nonempty(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isNonemptyString);
}

function isAllowed(set: ReadonlySet<string>, value: unknown): boolean {
  return typeof value === "string" && set.has(value);
}

function hasActivityFields(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isNonemptyString(value.id) &&
    isAllowed(ACTIVITY_KINDS, value.category) &&
    isAllowed(ACTIVITY_INTERACTIONS, value.interactionKind) &&
    isAllowed(ACTIVITY_MODES, value.mode) &&
    isNonemptyString(value.targetId) &&
    isAllowed(ACTIVITY_OPERATIONS, value.operation) &&
    isNonemptyString(value.instructionCopyId) &&
    isNonemptyString(value.acceptedFeedbackCopyId) &&
    isNonemptyString(value.retryFeedbackCopyId) &&
    isStringArray(value.assessedConceptIds) &&
    isStringArray(value.assessedLexemeIds)
  );
}

function hasCommonFields(value: unknown): value is Readonly<Record<string, unknown>> {
  return (
    isRecord(value) &&
    isNonemptyString(value.lessonId) &&
    isNonemptyString(value.contract) &&
    isStringArray(value.prerequisiteLessonIds) &&
    Array.isArray(value.activities) &&
    value.activities.every(hasActivityFields) &&
    isNonemptyString(value.recapCopyId)
  );
}

function hasPhoneticFields(
  lesson: unknown,
): lesson is BasePhoneticLessonContent {
  if (!isRecord(lesson)) return false;
  return (
    isStringArray(lesson.contrastiveItemIds) &&
    isStringArray(lesson.anchorLexemeIds) &&
    isStringArray(lesson.audioExemplarIds) &&
    isNonemptyString(lesson.phoneticExplanationCopyId) &&
    isNonemptyString(lesson.contrastMapId)
  );
}

const SEMANTIC_EXPLANATION_KEYS = [
  "main",
  "construction",
  "constraints",
  "commonError",
  "nearestContrast",
] as const;

const PHONETIC_FIELD_KEYS = [
  "contrastiveItemIds",
  "anchorLexemeIds",
  "audioExemplarIds",
  "phoneticExplanationCopyId",
  "contrastMapId",
] as const;

const SEMANTIC_FIELD_KEYS = [
  "newLexemeIds",
  "reviewLexemeIds",
  "introducedConceptIds",
  "reviewedConceptIds",
  "explanationBlockIds",
  "patternCellIds",
  "workedExampleIds",
  "dialogueId",
  "referenceSnapshotIds",
  "interactive",
  "retrievedSystemIds",
] as const;

const hasOwn: (value: object, key: PropertyKey) => boolean =
  (Object as unknown as {
    hasOwn?: (value: object, key: PropertyKey) => boolean;
  }).hasOwn ??
  ((value, key) => Object.prototype.hasOwnProperty.call(value, key));

function hasOwnAny(value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  return keys.some((key) => hasOwn(value, key));
}

function hasExplanationBlocks(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const keys = Object.getOwnPropertyNames(value);
  return (
    Object.getOwnPropertySymbols(value).length === 0 &&
    keys.length === SEMANTIC_EXPLANATION_KEYS.length &&
    SEMANTIC_EXPLANATION_KEYS.every(
      (key) => keys.includes(key) && isNonemptyString(value[key]),
    )
  );
}

function hasSemanticFields(
  lesson: unknown,
): lesson is Exclude<BaseLessonContent, BasePhoneticLessonContent> {
  if (!isRecord(lesson)) return false;
  return (
    isStringArray(lesson.newLexemeIds) &&
    isStringArray(lesson.reviewLexemeIds) &&
    isStringArray(lesson.introducedConceptIds) &&
    isStringArray(lesson.reviewedConceptIds) &&
    hasExplanationBlocks(lesson.explanationBlockIds) &&
    isStringArray(lesson.patternCellIds) &&
    isStringArray(lesson.workedExampleIds) &&
    (isNonemptyString(lesson.dialogueId) || lesson.dialogueId === null) &&
    isStringArray(lesson.referenceSnapshotIds) &&
    typeof lesson.interactive === "boolean" &&
    isStringArray(lesson.retrievedSystemIds)
  );
}

/**
 * Applies only the invariants that are safe while authoring one lesson. Course
 * depth, catalog resolution, and ordering remain validator responsibilities.
 */
export function defineBaseLessonContent<T extends BaseLessonContent>(lesson: T): T {
  if (!hasCommonFields(lesson)) {
    throw new BaseLessonContentDefinitionError(
      "wrong-contract-fields",
      "Lesson does not provide the required common fields.",
    );
  }
  assertNonemptyId(lesson.lessonId, "lessonId");
  assertNonemptyId(lesson.recapCopyId, "recapCopyId");
  const manifest = BASE_LESSON_MANIFEST[lesson.lessonId];
  if (!manifest) {
    throw new BaseLessonContentDefinitionError(
      "unknown-lesson-id",
      `Lesson "${lesson.lessonId}" is not in the Base lesson manifest.`,
    );
  }
  if (lesson.contract !== manifest.contract) {
    throw new BaseLessonContentDefinitionError(
      "lesson-contract-mismatch",
      `Lesson "${lesson.lessonId}" must use the "${manifest.contract}" contract.`,
    );
  }
  const activityIds = new Set<string>();
  for (const activity of lesson.activities) {
    assertNonemptyId(activity.id, "activity id");
    assertNonemptyId(activity.targetId, "activity targetId");
    assertNonemptyId(activity.operation, "activity operation");
    if (activityIds.has(activity.id)) {
      throw new BaseLessonContentDefinitionError(
        "duplicate-activity-id",
        `Activity id "${activity.id}" appears more than once.`,
      );
    }
    activityIds.add(activity.id);
  }

  if (lesson.contract === "phonetic") {
    if (!hasPhoneticFields(lesson) || hasOwnAny(lesson, SEMANTIC_FIELD_KEYS)) {
      throw new BaseLessonContentDefinitionError(
        "wrong-contract-fields",
        "Phonetic lesson does not provide phonetic fields.",
      );
    }
    const phonetic = lesson;
    assertNonemptyId(phonetic.phoneticExplanationCopyId, "phoneticExplanationCopyId");
    assertNonemptyId(phonetic.contrastMapId, "contrastMapId");
  } else if (hasSemanticFields(lesson) && !hasOwnAny(lesson, PHONETIC_FIELD_KEYS)) {
    const semantic = lesson;
    for (const id of Object.values(semantic.explanationBlockIds)) {
      assertNonemptyId(id, "explanation block id");
    }
  } else {
    throw new BaseLessonContentDefinitionError(
      "wrong-contract-fields",
      "Lesson contract does not provide its required field family.",
    );
  }

  return deepFreeze(cloneForBasePublication(lesson));
}

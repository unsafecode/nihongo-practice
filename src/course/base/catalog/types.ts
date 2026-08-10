import type { AssembledToken } from "../../../romaji/types";
import type { LessonId, SemanticArgumentRole } from "../../foundations/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import type { BaseLessonContract } from "../types";
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
export type BaseActivityOperation =
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

export const BASE_ACTIVITY_OPERATION_BY_CATEGORY: Readonly<
  Record<BaseActivityKind, BaseActivityOperation>
> = Object.freeze({
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

export interface BaseActivityDefinition {
  readonly id: string;
  readonly category: BaseActivityKind;
  readonly interactionKind: BaseInteractionKind;
  readonly mode: BaseActivityMode;
  readonly targetId: string;
  readonly operation: BaseActivityOperation;
  readonly activityPromptTokens?: readonly AssembledToken[];
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

export interface BaseExample {
  readonly id: string;
  readonly tokens: readonly AssembledToken[];
  readonly lexemeIds: readonly string[];
  readonly conceptIds: readonly string[];
  readonly formIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly semanticRoleIds: readonly SemanticArgumentRole[];
  readonly discourseFrameId: string;
  readonly teachingPurposeCopyId: string;
  readonly translationCopy: BaseTranslationCopy;
  readonly predicateAspect: BasePredicateAspect;
  readonly interpretationTags: readonly BaseInterpretationTag[];
  readonly particleFrame?: Readonly<{
    readonly predicateSenseId: string;
    readonly provided: Readonly<
      Partial<Record<BaseParticleRole, BaseParticleSense>>
    >;
  }>;
}

export interface BaseDialogueTurn {
  readonly speakerId: string;
  readonly tokens: readonly AssembledToken[];
  readonly lexemeIds: readonly string[];
  readonly conceptIds: readonly string[];
  readonly formIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly semanticRoleIds: readonly SemanticArgumentRole[];
  readonly discourseFrameId: string;
  readonly predicateAspect: BasePredicateAspect;
  readonly interpretationTags: readonly BaseInterpretationTag[];
  readonly particleFrame?: Readonly<{
    readonly predicateSenseId: string;
    readonly provided: Readonly<
      Partial<Record<BaseParticleRole, BaseParticleSense>>
    >;
  }>;
}

export interface BaseDialogue {
  readonly id: string;
  readonly practicalOutcomeCopyId: string;
  readonly turns: readonly BaseDialogueTurn[];
}

export interface BaseLexemeCommon {
  readonly id: string;
  readonly kana: string;
  readonly romaji: string;
  readonly meaningCopyId: string;
  readonly firstTeachLessonId: LessonId;
  readonly countable: boolean;
}

export interface BaseVerbLexeme extends BaseLexemeCommon {
  readonly category: "verb";
  readonly verbClass: "godan" | "ichidan" | "suru" | "kuru";
  readonly aspect: "dynamic" | "stative";
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

export interface BaseValidationCatalogs {
  readonly lexemes: ReadonlyMap<string, BaseLexeme>;
  readonly concepts: ReadonlyMap<string, BaseConcept>;
  readonly examples: ReadonlyMap<string, BaseExample>;
  readonly dialogues: ReadonlyMap<string, BaseDialogue>;
  readonly audioTargets: ReadonlyMap<string, readonly AssembledToken[]>;
  readonly copyIds: ReadonlySet<string>;
  readonly referenceSnapshotIds: ReadonlySet<string>;
  readonly patternCellIds: ReadonlySet<string>;
  readonly acceptedAnswerTokens: ReadonlyMap<string, readonly AssembledToken[]>;
}

export type BaseLessonContentDefinitionErrorCode =
  | "empty-id"
  | "duplicate-activity-id"
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
  return value !== null && typeof value === "object";
}

function hasPhoneticFields(lesson: BaseLessonContent): boolean {
  const candidate = lesson as unknown as Readonly<Record<string, unknown>>;
  return (
    Array.isArray(candidate.contrastiveItemIds) &&
    Array.isArray(candidate.anchorLexemeIds) &&
    Array.isArray(candidate.audioExemplarIds) &&
    typeof candidate.phoneticExplanationCopyId === "string" &&
    typeof candidate.contrastMapId === "string"
  );
}

function hasSemanticFields(
  lesson: BaseLessonContent,
): lesson is Exclude<BaseLessonContent, BasePhoneticLessonContent> {
  if (lesson.contract === "phonetic") return false;
  const candidate = lesson as unknown as Readonly<Record<string, unknown>>;
  return (
    Array.isArray(candidate.newLexemeIds) &&
    Array.isArray(candidate.reviewLexemeIds) &&
    Array.isArray(candidate.introducedConceptIds) &&
    Array.isArray(candidate.reviewedConceptIds) &&
    isRecord(candidate.explanationBlockIds) &&
    Array.isArray(candidate.patternCellIds) &&
    Array.isArray(candidate.workedExampleIds) &&
    (typeof candidate.dialogueId === "string" || candidate.dialogueId === null) &&
    Array.isArray(candidate.referenceSnapshotIds) &&
    typeof candidate.interactive === "boolean" &&
    Array.isArray(candidate.retrievedSystemIds)
  );
}

/**
 * Applies only the invariants that are safe while authoring one lesson. Course
 * depth, catalog resolution, and ordering remain validator responsibilities.
 */
export function defineBaseLessonContent<T extends BaseLessonContent>(lesson: T): T {
  assertNonemptyId(lesson.lessonId, "lessonId");
  assertNonemptyId(lesson.recapCopyId, "recapCopyId");
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
    if (!hasPhoneticFields(lesson)) {
      throw new BaseLessonContentDefinitionError(
        "wrong-contract-fields",
        "Phonetic lesson does not provide phonetic fields.",
      );
    }
    const phonetic = lesson as BasePhoneticLessonContent;
    assertNonemptyId(phonetic.phoneticExplanationCopyId, "phoneticExplanationCopyId");
    assertNonemptyId(phonetic.contrastMapId, "contrastMapId");
  } else if (hasSemanticFields(lesson)) {
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

  return deepFreeze(lesson);
}

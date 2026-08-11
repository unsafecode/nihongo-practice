import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import { immutableReadonlySet } from "../../foundations/immutableReadonlySet";
import {
  defineBaseLessonContent,
  type BaseActivityCategory,
  type BaseActivityDefinition,
  type BaseExample,
  type BaseLessonContent,
  type BaseSystemLessonContent,
  type BaseValidationCatalogs,
  type BaseVisibleTarget,
} from "../catalog/types";
import {
  BASE_CONCEPT_BY_ID,
  BASE_REFERENCE_SNAPSHOT_BY_ID,
  BASE_RETRIEVAL_SYSTEM_BY_ID,
} from "../catalog/concepts";
import { BASE_FIRST_TEACH_OWNERS } from "../catalog/firstTeach";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import { baseActivityPromptKey } from "../catalog/visibleTargets";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  baseParticleSurfaceTokens,
  type BaseParticleSense,
} from "../forms/particleLicensing";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateFirstTeachOrder } from "../validation/sequenceRules";

type LocalizedExplanation = Readonly<{
  readonly mainCopyId: string;
  readonly constructionCopyId: string;
  readonly constraintsCopyId: string;
  readonly commonErrorCopyId: string;
  readonly nearestContrastId: string;
}>;

export interface BaseSemanticActivityDesign {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly acceptedAnswers: readonly string[];
  readonly correctOptionIndex: number | null;
  readonly promptTarget: BaseVisibleTarget;
  readonly acceptedAnswerTarget: BaseVisibleTarget;
  readonly optionTargetIds: readonly string[];
  readonly optionTargets: readonly BaseVisibleTarget[];
  readonly optionFactStatus: readonly (
    | "accepted-world"
    | "rejected-context"
  )[];
  readonly audioTargetId: string | null;
  readonly promptContextCopyId: string;
  readonly reviewed: true;
  readonly informationStructure?:
    | "established-topic"
    | "focused-new-subject"
    | "not-applicable";
  readonly category: BaseActivityDefinition["category"];
  readonly interactionKind: BaseActivityDefinition["interactionKind"];
  readonly mode: BaseActivityDefinition["mode"];
  readonly operation: BaseActivityDefinition["operation"];
  readonly patternCellId: string;
  readonly contextTarget: BaseSemanticContextTarget;
  readonly operationEvidence: BaseSemanticOperationEvidence;
  readonly referentId?: string | null;
  readonly worldFactId?: string | null;
}

export interface BaseSemanticContextTarget {
  readonly id: string;
  readonly copyId: string;
  readonly kind:
    | "meaning-context"
    | "information-structure"
    | "ordering-context"
    | "transformation-context"
    | "diagnostic-context"
    | "response-context"
    | "retrieval-context"
    | "audio-context"
    | "recall-context";
  readonly informationStructure:
    | "established-topic"
    | "focused-new-subject"
    | "not-applicable";
  readonly revealsAnswer: false;
  readonly audioRequired: boolean;
  readonly recallRequired: boolean;
}

export interface BaseSemanticOperationEvidence {
  readonly kind: BaseActivityDefinition["operation"];
  readonly sourceTargetId?: string;
  readonly candidateTargetId?: string;
  readonly errorCode?: string;
  readonly tileTargetIds?: readonly string[];
  readonly orderedAnswerTargetId?: string;
}

export interface BaseAuthoredSemanticLesson {
  readonly content: Exclude<BaseLessonContent, { readonly contract: "phonetic" | "synthesis" }>;
  readonly titleCopyId: string;
  readonly objectiveCopyId: string;
  readonly explanation: LocalizedExplanation;
  readonly patternCellIds: readonly string[];
  readonly examples: readonly BaseExample[];
  readonly activityDesigns: readonly BaseSemanticActivityDesign[];
  readonly dialogue: null;
}

export interface BaseSentenceFoundationsModule {
  readonly id: "sentence-foundations";
  readonly lessons: readonly BaseAuthoredSemanticLesson[];
  readonly worldFacts: Readonly<{
    readonly speaker: "university-student";
    readonly tanaka: "nurse";
    readonly yamada: "lawyer";
    readonly friend: "international-student";
  }>;
}

export type BaseSemanticModuleError =
  | "invalid-module-shape"
  | "invalid-lesson-shape"
  | "invalid-lesson-allocation"
  | "invalid-copy"
  | "canonical-depth-failure";

export interface BaseSemanticModuleValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseSemanticModuleError[];
}

export type BaseAuthoredTokenPart =
  | string
  | "desu"
  | "comma"
  | "chunk-arrow"
  | "wa"
  | "ga"
  | "no"
  | "mo"
  | "to-listing"
  | "to-nominal"
  | "to-companion"
  | "ka"
  | "cue-context"
  | "cue-topic"
  | "cue-focus"
  | "cue-order"
  | "cue-audio"
  | "cue-recall"
  | "cue-error";
type TokenPart = BaseAuthoredTokenPart;

interface ExampleSpec {
  readonly parts: readonly TokenPart[];
  readonly frame: string;
  readonly patternCellId: string;
  readonly utteranceKind: NonNullable<BaseExample["utteranceKind"]>;
  readonly contextCopyId: string;
}

interface ActivitySpec {
  readonly prompt: readonly TokenPart[];
  readonly answer: readonly TokenPart[];
  readonly options: readonly (readonly TokenPart[])[];
  readonly correctOptionIndex: 0 | 1;
  readonly promptContextCopyId: string;
  readonly patternCellId: string;
  readonly informationStructure?: BaseSemanticActivityDesign["informationStructure"];
  readonly shape: BaseSemanticActivityShape;
  readonly referentId?: string | null;
  readonly worldFactId?: string | null;
  readonly errorCode?: string | null;
}

export type BaseSemanticActivityShape = Readonly<{
  readonly category: BaseActivityDefinition["category"];
  readonly interactionKind: BaseActivityDefinition["interactionKind"];
  readonly mode: BaseActivityDefinition["mode"];
  readonly operation: BaseActivityDefinition["operation"];
  readonly contextKind: BaseSemanticContextTarget["kind"];
}>;

interface LessonSpec {
  readonly lessonId:
    | "sentence-foundations-1"
    | "sentence-foundations-2"
    | "sentence-foundations-3"
    | "sentence-foundations-4";
  readonly prerequisiteLessonIds: readonly string[];
  readonly newLexemeIds: readonly string[];
  readonly reviewLexemeIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly reviewedConceptIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly examples: readonly ExampleSpec[];
  readonly activities: readonly ActivitySpec[];
}

export const BASE_MEANING_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "meaning-comprehension",
    interactionKind: "choice",
    mode: "non-spoken",
    operation: "recognize-meaning",
    contextKind: "meaning-context",
  });
export const BASE_FORM_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "form-function-discrimination",
    interactionKind: "choice",
    mode: "non-spoken",
    operation: "discriminate-form-function",
    contextKind: "information-structure",
  });
export const BASE_ORDERING_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "ordering",
    interactionKind: "tile-ordering",
    mode: "non-spoken",
    operation: "order-chunks",
    contextKind: "ordering-context",
  });
export const BASE_CONTROLLED_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "controlled-production",
    interactionKind: "completion",
    mode: "non-spoken",
    operation: "produce-controlled",
    contextKind: "response-context",
  });
export const BASE_TRANSFORMATION_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "transformation",
    interactionKind: "transformation",
    mode: "non-spoken",
    operation: "transform-form",
    contextKind: "transformation-context",
  });
export const BASE_ERROR_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "error-diagnosis",
    interactionKind: "choice",
    mode: "non-spoken",
    operation: "diagnose-error",
    contextKind: "diagnostic-context",
  });
export const BASE_CONTEXT_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "contextual-response",
    interactionKind: "constrained-construction",
    mode: "non-spoken",
    operation: "select-contextual-response",
    contextKind: "response-context",
  });
export const BASE_RETRIEVAL_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "cumulative-retrieval",
    interactionKind: "completion",
    mode: "non-spoken",
    operation: "retrieve-cumulative",
    contextKind: "retrieval-context",
  });
export const BASE_LISTENING_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "listening",
    interactionKind: "listening",
    mode: "audio",
    operation: "identify-audio",
    contextKind: "audio-context",
  });
export const BASE_SPOKEN_ACTIVITY_SHAPE: BaseSemanticActivityShape = deepFreeze({
    category: "spoken",
    interactionKind: "spoken",
    mode: "audio",
    operation: "produce-spoken",
    contextKind: "recall-context",
  });

function lexicalToken(lexemeId: string, tokenId: string): AssembledToken {
  const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
  if (!lexeme) throw new Error(`Unknown Base lexeme "${lexemeId}".`);
  return {
    id: tokenId,
    jp: lexeme.kana,
    romaji: lexeme.romaji,
    kind: "lexical",
    boundaryBefore: "space",
    source: { domain: "catalog", referenceId: lexemeId },
  };
}

function tokensFor(parts: readonly TokenPart[], id: string): readonly AssembledToken[] {
  return parts.map((part, index) => {
    if (part === "desu") {
      return {
        id: `${id}-${index}-desu`,
        jp: "です",
        romaji: "desu",
        kind: "morpheme",
        boundaryBefore: "space",
        source: { domain: "catalog", referenceId: "affirmative-desu" },
      };
    }
    if (part === "comma") {
      return {
        id: `${id}-${index}-comma`,
        jp: "、",
        romaji: ",",
        kind: "punctuation",
        boundaryBefore: "attach",
        source: { domain: "catalog", referenceId: "japanese-comma" },
      };
    }
    if (part === "chunk-arrow") {
      return {
        id: `${id}-${index}-chunk-arrow`,
        jp: "→",
        romaji: "→",
        kind: "punctuation",
        boundaryBefore: "attach",
        source: { domain: "catalog", referenceId: "sentence-chunks" },
      };
    }
    const cueSurfaceByPart: Readonly<Record<string, string>> = {
      "cue-context": "◇",
      "cue-topic": "◎",
      "cue-focus": "●",
      "cue-order": "↔",
      "cue-audio": "♪",
      "cue-recall": "↺",
      "cue-error": "!",
    };
    const cueSurface = cueSurfaceByPart[part];
    if (cueSurface) {
      return {
        id: `${id}-${index}-${part}`,
        jp: cueSurface,
        romaji: cueSurface,
        kind: "punctuation",
        boundaryBefore: "attach",
        source: { domain: "catalog", referenceId: part },
      };
    }
    const particleSenseByPart: Readonly<
      Partial<Record<BaseAuthoredTokenPart, BaseParticleSense>>
    > = {
      wa: "topic-wa",
      ga: "focus-subject-ga",
      no: "possessive-attributive-no",
      mo: "additive-mo",
      "to-listing": "listing-to",
      "to-nominal": "nominal-to",
      "to-companion": "companion-to",
      ka: "question-ka",
    };
    const particleSense = particleSenseByPart[part];
    if (particleSense) {
      const [particle] = baseParticleSurfaceTokens(particleSense);
      return {
        ...particle,
        id: `${id}-${index}-${particleSense}`,
      };
    }
    const token = lexicalToken(part, `${id}-${index}-${part}`);
    return index === 0 ? { ...token, boundaryBefore: "attach" } : token;
  });
}

function lexemeIdsFor(parts: readonly TokenPart[]): readonly string[] {
  const grammarParts = new Set<BaseAuthoredTokenPart>([
    "desu",
    "comma",
    "chunk-arrow",
    "wa",
    "ga",
    "no",
    "mo",
    "to-listing",
    "to-nominal",
    "to-companion",
    "ka",
    "cue-context",
    "cue-topic",
    "cue-focus",
    "cue-order",
    "cue-audio",
    "cue-recall",
    "cue-error",
  ]);
  return [...new Set(parts.filter((part) => !grammarParts.has(part)))];
}

function japaneseFor(parts: readonly TokenPart[], id: string): string {
  return tokensFor(parts, id).map(({ jp }) => jp).join("");
}

export function authoredVisibleTarget(
  parts: readonly TokenPart[],
  id: string,
  conceptIds: readonly string[],
  patternCellIds: readonly string[],
): BaseVisibleTarget {
  return deepFreeze({
    tokens: tokensFor(parts, id),
    lexemeIds: lexemeIdsFor(parts),
    conceptIds,
    formIds: parts.includes("desu") ? ["affirmative-desu"] : [],
    patternCellIds,
    semanticRoleIds: [],
    interpretationTags: [],
    predicateSenseId: null,
    predicateLexemeId: null,
  });
}

function exampleFor(
  lessonId: string,
  spec: ExampleSpec,
  index: number,
  conceptIds: readonly string[],
): BaseExample {
  const id = `${lessonId}-example-${index + 1}`;
  return deepFreeze({
    ...authoredVisibleTarget(spec.parts, id, conceptIds, [spec.patternCellId]),
    id,
    teachingPurposeCopyId: `${id}-purpose`,
    translationCopy: { copyId: `${id}-translation` },
    predicateAspect: "nominal",
    discourseFrameId: spec.frame,
    interpretationTags: ["present-state"],
    utteranceKind: spec.utteranceKind,
    contextCopyId: spec.contextCopyId,
  });
}

function sentenceConceptIdsFor(
  parts: readonly TokenPart[],
  patternCellId?: string,
): readonly string[] {
  const ids = new Set<string>();
  if (parts.includes("chunk-arrow")) ids.add("sentence-chunks");
  if (parts.includes("desu")) ids.add("affirmative-desu");
  if (parts.includes("comma")) ids.add("discourse-roles");
  if (patternCellId === "sf2-predicate-final") ids.add("sentence-order");
  if (patternCellId === "sf2-recoverable-omission") ids.add("sentence-omission");
  if (patternCellId === "sf4-recoverable-reference") ids.add("sentence-omission");
  if (patternCellId?.startsWith("sf4-")) ids.add("discourse-roles");
  return [...ids];
}

function cuePartFor(shape: BaseSemanticActivityShape): TokenPart {
  if (shape.operation === "order-chunks") return "cue-order";
  if (shape.operation === "identify-audio") return "cue-audio";
  if (shape.operation === "produce-spoken") return "cue-recall";
  if (shape.operation === "diagnose-error") return "cue-error";
  return "cue-context";
}

function operationEvidenceFor(
  shape: BaseSemanticActivityShape,
  promptTargetId: string,
  optionTargetIds: readonly string[],
  optionTargets: readonly BaseVisibleTarget[],
  correctOptionIndex: 0 | 1,
  errorCode: string | null | undefined,
): BaseSemanticOperationEvidence {
  const wrongIndex = correctOptionIndex === 0 ? 1 : 0;
  if (shape.operation === "order-chunks") {
    return {
      kind: shape.operation,
      tileTargetIds: optionTargets[correctOptionIndex].tokens.map(({ id }) => id),
      orderedAnswerTargetId: optionTargetIds[correctOptionIndex],
    };
  }
  if (shape.operation === "transform-form") {
    return { kind: shape.operation, sourceTargetId: promptTargetId };
  }
  if (shape.operation === "diagnose-error") {
    return {
      kind: shape.operation,
      candidateTargetId: optionTargetIds[wrongIndex],
      errorCode: errorCode ?? "context-form-mismatch",
    };
  }
  return { kind: shape.operation };
}

function activitiesFor(
  spec: LessonSpec,
): Readonly<{
  definitions: readonly BaseActivityDefinition[];
  designs: readonly BaseSemanticActivityDesign[];
  acceptedAnswers: readonly (readonly [string, BaseVisibleTarget])[];
  prompts: readonly (readonly [string, BaseVisibleTarget])[];
  audioTargets: readonly (readonly [string, BaseVisibleTarget])[];
}> {
  const definitions: BaseActivityDefinition[] = [];
  const designs: BaseSemanticActivityDesign[] = [];
  const acceptedAnswers: (readonly [string, BaseVisibleTarget])[] = [];
  const prompts: (readonly [string, BaseVisibleTarget])[] = [];
  const audioTargets: (readonly [string, BaseVisibleTarget])[] = [];

  spec.activities.forEach((activity, index) => {
    const shape = activity.shape;
    const id = `${spec.lessonId}-activity-${index + 1}`;
    const promptId = `${id}-prompt`;
    const optionTargetIds = activity.options.map(
      (_, optionIndex) => `${id}-option-${optionIndex + 1}`,
    );
    const optionTargets = activity.options.map((parts, optionIndex) =>
      authoredVisibleTarget(
        parts,
        optionTargetIds[optionIndex],
        sentenceConceptIdsFor(
          parts,
          optionIndex === activity.correctOptionIndex
            ? activity.patternCellId
            : undefined,
        ),
        optionIndex === activity.correctOptionIndex
          ? [activity.patternCellId]
          : [],
      ),
    );
    const acceptedAnswerTarget = optionTargets[activity.correctOptionIndex];
    const wrongOptionIndex = activity.correctOptionIndex === 0 ? 1 : 0;
    const promptParts =
      shape.operation === "transform-form"
        ? activity.prompt
        : shape.operation === "diagnose-error"
          ? activity.options[wrongOptionIndex]
          : [cuePartFor(shape)];
    const promptTarget = authoredVisibleTarget(
      promptParts,
      promptId,
      shape.operation === "transform-form" ||
        shape.operation === "diagnose-error"
        ? sentenceConceptIdsFor(promptParts)
        : [],
      [],
    );
    const targetId =
      shape.mode === "audio" && shape.category === "listening"
        ? `${id}-audio`
        : optionTargetIds[activity.correctOptionIndex];
    const assessedLexemeIds = [...new Set([
      ...promptTarget.lexemeIds,
      ...acceptedAnswerTarget.lexemeIds,
      ...optionTargets.flatMap(({ lexemeIds }) => lexemeIds),
    ])];
    definitions.push({
      id,
      category: shape.category,
      interactionKind: shape.interactionKind,
      mode: shape.mode,
      targetId,
      operation: shape.operation,
      instructionCopyId: `${id}-instruction`,
      acceptedFeedbackCopyId: `${shape.operation}-feedback-accepted`,
      retryFeedbackCopyId: `${shape.operation}-feedback-retry`,
      assessedConceptIds: [...new Set(
        optionTargets.flatMap((target) => [
          ...target.conceptIds,
          ...target.formIds,
        ]),
      )],
      assessedLexemeIds,
      optionTargetIds,
    });
    const options = optionTargets.map(({ tokens }) =>
      tokens.map(({ jp }) => jp).join(""),
    );
    const answer = japaneseFor(activity.answer, `${id}-accepted-surface`);
    designs.push({
      id,
      prompt: japaneseFor(activity.prompt, `${id}-prompt-surface`),
      options,
      acceptedAnswers: [answer],
      correctOptionIndex: activity.correctOptionIndex,
      promptTarget,
      acceptedAnswerTarget,
      optionTargetIds,
      optionTargets,
      optionFactStatus: optionTargets.map((_, optionIndex) =>
        optionIndex === activity.correctOptionIndex
          ? "accepted-world"
          : "rejected-context",
      ),
      audioTargetId: targetId.endsWith("-audio") ? targetId : null,
      promptContextCopyId: activity.promptContextCopyId,
      reviewed: true,
      informationStructure: activity.informationStructure ?? "not-applicable",
      category: shape.category,
      interactionKind: shape.interactionKind,
      mode: shape.mode,
      operation: shape.operation,
      patternCellId: activity.patternCellId,
      contextTarget: {
        id: `${id}-context`,
        copyId: activity.promptContextCopyId,
        kind: shape.contextKind,
        informationStructure: activity.informationStructure ?? "not-applicable",
        revealsAnswer: false,
        audioRequired: shape.operation === "identify-audio",
        recallRequired: shape.operation === "produce-spoken",
      },
      operationEvidence: operationEvidenceFor(
        shape,
        baseActivityPromptKey(spec.lessonId, id),
        optionTargetIds,
        optionTargets,
        activity.correctOptionIndex,
        activity.errorCode,
      ),
      referentId: activity.referentId ?? null,
      worldFactId: activity.worldFactId ?? null,
    });
    prompts.push([
      baseActivityPromptKey(spec.lessonId, id),
      promptTarget,
    ]);
    optionTargetIds.forEach((optionTargetId, optionIndex) => {
      acceptedAnswers.push([optionTargetId, optionTargets[optionIndex]]);
    });
    if (targetId.endsWith("-audio")) {
      audioTargets.push([targetId, acceptedAnswerTarget]);
    }
  });
  return {
    definitions,
    designs,
    acceptedAnswers,
    prompts,
    audioTargets,
  };
}

function example(
  parts: readonly TokenPart[],
  frame: string,
  patternCellId: string,
  utteranceKind: NonNullable<BaseExample["utteranceKind"]>,
  contextCopyId: string,
): ExampleSpec {
  return { parts, frame, patternCellId, utteranceKind, contextCopyId };
}

function activity(
  prompt: readonly TokenPart[],
  answer: readonly TokenPart[],
  distractor: readonly TokenPart[],
  correctOptionIndex: 0 | 1,
  promptContextCopyId: string,
  patternCellId: string,
  shape: BaseSemanticActivityShape,
  referentId: string | null = null,
  worldFactId: string | null = null,
  errorCode: string | null = null,
): ActivitySpec {
  return {
    prompt,
    answer,
    options:
      correctOptionIndex === 0
        ? [answer, distractor]
        : [distractor, answer],
    correctOptionIndex,
    promptContextCopyId,
    patternCellId,
    informationStructure: "not-applicable",
    shape,
    referentId,
    worldFactId,
    errorCode,
  };
}

const LESSON_SPECS: readonly LessonSpec[] = deepFreeze([
  {
    lessonId: "sentence-foundations-1",
    prerequisiteLessonIds: ["sounds-4"],
    newLexemeIds: ["noun-gakusei", "noun-sensei", "noun-watashi"],
    reviewLexemeIds: [
      "anchor-asa",
      "anchor-ie",
      "anchor-umi",
      "anchor-neko",
      "anchor-kagi",
      "anchor-kaze",
      "anchor-denwa",
      "anchor-pan",
      "anchor-gakkou",
      "anchor-hon",
      "anchor-kippu",
      "anchor-kyaku",
      "anchor-shashin",
      "anchor-ryokou",
      "anchor-obaasan",
    ],
    introducedConceptIds: ["sentence-chunks"],
    reviewedConceptIds: [],
    patternCellIds: ["sf1-identifying-chunk", "sf1-context-chunk"],
    examples: [
      example(["noun-watashi", "chunk-arrow", "noun-gakusei"], "speaker-to-role-analysis", "sf1-identifying-chunk", "anatomy-model", "sentence-foundations-1-example-1-context"),
      example(["noun-watashi", "chunk-arrow", "noun-sensei"], "speaker-to-title-analysis", "sf1-identifying-chunk", "anatomy-model", "sentence-foundations-1-example-2-context"),
      example(["noun-gakusei", "chunk-arrow", "noun-watashi"], "role-to-person-analysis", "sf1-context-chunk", "anatomy-model", "sentence-foundations-1-example-3-context"),
      example(["anchor-shashin", "chunk-arrow", "anchor-neko"], "photo-to-animal-analysis", "sf1-context-chunk", "anatomy-model", "sentence-foundations-1-example-4-context"),
      example(["anchor-kagi", "chunk-arrow", "anchor-ie"], "key-to-home-analysis", "sf1-context-chunk", "anatomy-model", "sentence-foundations-1-example-5-context"),
      example(["anchor-kaze", "chunk-arrow", "anchor-umi"], "wind-to-sea-analysis", "sf1-context-chunk", "anatomy-model", "sentence-foundations-1-example-6-context"),
      example(["anchor-kippu", "chunk-arrow", "anchor-ryokou"], "ticket-to-trip-analysis", "sf1-context-chunk", "anatomy-model", "sentence-foundations-1-example-7-context"),
      example(["anchor-asa", "chunk-arrow", "anchor-gakkou"], "morning-to-school-analysis", "sf1-context-chunk", "anatomy-model", "sentence-foundations-1-example-8-context"),
      example(["anchor-denwa", "chunk-arrow", "noun-sensei"], "phone-to-teacher-analysis", "sf1-context-chunk", "anatomy-model", "sentence-foundations-1-example-9-context"),
      example(["anchor-pan", "chunk-arrow", "anchor-hon"], "bread-to-book-analysis", "sf1-context-chunk", "anatomy-model", "sentence-foundations-1-example-10-context"),
    ],
    activities: [
      activity(["anchor-shashin", "chunk-arrow"], ["noun-watashi"], ["anchor-obaasan"], 0, "sentence-foundations-1-activity-1-instruction", "sf1-context-chunk", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["anchor-gakkou", "chunk-arrow"], ["noun-gakusei"], ["anchor-ryokou"], 0, "sentence-foundations-1-activity-2-instruction", "sf1-identifying-chunk", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["cue-order"], ["noun-sensei", "chunk-arrow", "noun-watashi"], ["noun-gakusei", "chunk-arrow", "noun-sensei"], 1, "sentence-foundations-1-activity-3-instruction", "sf1-identifying-chunk", BASE_ORDERING_ACTIVITY_SHAPE),
      activity(["anchor-shashin", "chunk-arrow"], ["anchor-neko"], ["anchor-obaasan"], 0, "sentence-foundations-1-activity-4-instruction", "sf1-context-chunk", BASE_CONTROLLED_ACTIVITY_SHAPE),
      activity(["anchor-gakkou", "chunk-arrow", "anchor-ryokou"], ["anchor-gakkou", "chunk-arrow", "anchor-hon"], ["anchor-hon", "chunk-arrow", "anchor-gakkou"], 1, "sentence-foundations-1-activity-5-instruction", "sf1-context-chunk", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      activity(["anchor-kagi", "chunk-arrow"], ["anchor-ie"], ["anchor-denwa"], 1, "sentence-foundations-1-activity-6-instruction", "sf1-context-chunk", BASE_ERROR_ACTIVITY_SHAPE, null, null, "context-meaning-mismatch"),
      activity(["anchor-kaze", "chunk-arrow"], ["anchor-umi"], ["anchor-asa"], 0, "sentence-foundations-1-activity-7-instruction", "sf1-context-chunk", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["anchor-asa", "chunk-arrow"], ["anchor-gakkou"], ["anchor-kaze"], 1, "sentence-foundations-1-activity-8-instruction", "sf1-context-chunk", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      activity(["anchor-denwa", "chunk-arrow"], ["anchor-shashin"], ["anchor-kagi"], 0, "sentence-foundations-1-activity-9-instruction", "sf1-context-chunk", BASE_LISTENING_ACTIVITY_SHAPE),
      activity(["anchor-ryokou", "chunk-arrow"], ["anchor-kippu"], ["anchor-pan"], 1, "sentence-foundations-1-activity-10-instruction", "sf1-context-chunk", BASE_SPOKEN_ACTIVITY_SHAPE),
    ],
  },
  {
    lessonId: "sentence-foundations-2",
    prerequisiteLessonIds: ["sentence-foundations-1"],
    newLexemeIds: ["noun-tanaka", "noun-yamada", "noun-hito"],
    reviewLexemeIds: [
      "noun-gakusei",
      "noun-sensei",
      "noun-watashi",
      "anchor-neko",
      "anchor-ie",
      "anchor-umi",
      "anchor-hon",
      "anchor-gakkou",
      "anchor-obaasan",
      "anchor-asa",
      "anchor-ryokou",
      "anchor-shashin",
      "anchor-kippu",
      "anchor-kagi",
      "anchor-denwa",
    ],
    introducedConceptIds: ["sentence-order", "sentence-omission"],
    reviewedConceptIds: ["sentence-chunks"],
    patternCellIds: ["sf2-predicate-final", "sf2-recoverable-omission"],
    examples: [
      example(["anchor-shashin", "chunk-arrow", "noun-tanaka"], "photo-cue-to-tanaka", "sf2-predicate-final", "anatomy-model", "sentence-foundations-2-example-1-context"),
      example(["anchor-shashin", "chunk-arrow", "noun-yamada"], "photo-cue-to-yamada", "sf2-predicate-final", "anatomy-model", "sentence-foundations-2-example-2-context"),
      example(["noun-hito", "chunk-arrow", "noun-watashi"], "anatomy-focus-speaker", "sf2-predicate-final", "anatomy-model", "sentence-foundations-2-example-3-context"),
      example(["anchor-shashin", "chunk-arrow", "anchor-neko"], "photo-cue-to-cat", "sf2-recoverable-omission", "anatomy-model", "sentence-foundations-2-example-4-context"),
      example(["anchor-gakkou", "chunk-arrow", "anchor-hon"], "school-cue-to-book", "sf2-recoverable-omission", "anatomy-model", "sentence-foundations-2-example-5-context"),
      example(["anchor-kagi", "chunk-arrow", "anchor-ie"], "key-cue-to-home", "sf2-recoverable-omission", "anatomy-model", "sentence-foundations-2-example-6-context"),
      example(["anchor-denwa", "chunk-arrow", "anchor-shashin"], "phone-cue-to-photo", "sf2-recoverable-omission", "anatomy-model", "sentence-foundations-2-example-7-context"),
      example(["anchor-ryokou", "chunk-arrow", "anchor-kippu"], "travel-cue-to-ticket", "sf2-recoverable-omission", "anatomy-model", "sentence-foundations-2-example-8-context"),
      example(["anchor-asa", "chunk-arrow", "anchor-gakkou"], "morning-cue-to-school", "sf2-recoverable-omission", "anatomy-model", "sentence-foundations-2-example-9-context"),
      example(["anchor-ie", "chunk-arrow", "anchor-denwa"], "home-cue-to-phone", "sf2-recoverable-omission", "anatomy-model", "sentence-foundations-2-example-10-context"),
    ],
    activities: [
      activity(["anchor-shashin", "chunk-arrow"], ["noun-tanaka"], ["anchor-denwa"], 1, "sentence-foundations-2-activity-1-instruction", "sf2-recoverable-omission", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["anchor-shashin", "chunk-arrow"], ["noun-yamada"], ["anchor-kagi"], 0, "sentence-foundations-2-activity-2-instruction", "sf2-recoverable-omission", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["cue-order"], ["noun-watashi", "chunk-arrow", "noun-hito"], ["noun-sensei", "chunk-arrow", "noun-hito"], 0, "sentence-foundations-2-activity-3-instruction", "sf2-predicate-final", BASE_ORDERING_ACTIVITY_SHAPE),
      activity(["noun-hito", "chunk-arrow"], ["noun-gakusei"], ["anchor-obaasan"], 1, "sentence-foundations-2-activity-4-instruction", "sf2-predicate-final", BASE_CONTROLLED_ACTIVITY_SHAPE),
      activity(["noun-hito", "chunk-arrow", "noun-gakusei"], ["noun-hito", "chunk-arrow", "noun-sensei"], ["noun-sensei", "chunk-arrow", "noun-hito"], 0, "sentence-foundations-2-activity-5-instruction", "sf2-predicate-final", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      activity(["anchor-shashin", "chunk-arrow"], ["noun-watashi"], ["anchor-denwa"], 1, "sentence-foundations-2-activity-6-instruction", "sf2-recoverable-omission", BASE_ERROR_ACTIVITY_SHAPE, null, null, "context-meaning-mismatch"),
      activity(["anchor-shashin", "chunk-arrow"], ["anchor-neko"], ["anchor-kagi"], 1, "sentence-foundations-2-activity-7-instruction", "sf2-recoverable-omission", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["anchor-gakkou", "chunk-arrow"], ["anchor-hon"], ["anchor-kippu"], 0, "sentence-foundations-2-activity-8-instruction", "sf2-recoverable-omission", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      activity(["anchor-kagi", "chunk-arrow"], ["anchor-ie"], ["anchor-denwa"], 1, "sentence-foundations-2-activity-9-instruction", "sf2-recoverable-omission", BASE_LISTENING_ACTIVITY_SHAPE),
      activity(["anchor-denwa", "chunk-arrow"], ["anchor-shashin"], ["anchor-kagi"], 0, "sentence-foundations-2-activity-10-instruction", "sf2-recoverable-omission", BASE_SPOKEN_ACTIVITY_SHAPE),
    ],
  },
  {
    lessonId: "sentence-foundations-3",
    prerequisiteLessonIds: ["sentence-foundations-2"],
    newLexemeIds: [
      "noun-kangoshi",
      "noun-bengoshi",
      "noun-tomodachi",
      "noun-isha",
    ],
    reviewLexemeIds: [
      "noun-gakusei",
      "noun-sensei",
      "noun-watashi",
      "noun-tanaka",
      "noun-yamada",
      "noun-hito",
      "anchor-neko",
      "anchor-ie",
      "anchor-umi",
      "anchor-hon",
      "anchor-kippu",
      "anchor-gakkou",
      "anchor-shashin",
      "anchor-kaze",
      "anchor-kyaku",
      "anchor-asa",
      "anchor-kagi",
      "anchor-denwa",
      "anchor-pan",
      "anchor-ryokou",
      "anchor-obaasan",
    ],
    introducedConceptIds: ["affirmative-desu"],
    reviewedConceptIds: ["sentence-order", "sentence-omission"],
    patternCellIds: ["sf3-noun-predicate", "sf3-polite-copula"],
    examples: [
      example(["noun-kangoshi", "desu"], "answer-tanaka-role", "sf3-noun-predicate", "complete-clause", "sentence-foundations-3-example-1-context"),
      example(["noun-bengoshi", "desu"], "answer-yamada-role", "sf3-noun-predicate", "complete-clause", "sentence-foundations-3-example-2-context"),
      example(["noun-tomodachi", "desu"], "answer-relationship", "sf3-noun-predicate", "complete-clause", "sentence-foundations-3-example-3-context"),
      example(["noun-isha", "desu"], "answer-doctor-role", "sf3-noun-predicate", "complete-clause", "sentence-foundations-3-example-4-context"),
      example(["noun-gakusei", "desu"], "answer-speaker-role", "sf3-polite-copula", "complete-clause", "sentence-foundations-3-example-5-context"),
      example(["noun-sensei", "desu"], "answer-teacher-role", "sf3-polite-copula", "complete-clause", "sentence-foundations-3-example-6-context"),
      example(["noun-watashi", "desu"], "answer-photo-speaker", "sf3-polite-copula", "complete-clause", "sentence-foundations-3-example-7-context"),
      example(["noun-hito", "desu"], "answer-human-category", "sf3-polite-copula", "complete-clause", "sentence-foundations-3-example-8-context"),
      example(["anchor-neko", "desu"], "answer-animal-identity", "sf3-polite-copula", "complete-clause", "sentence-foundations-3-example-9-context"),
      example(["anchor-ie", "desu"], "answer-place-identity", "sf3-polite-copula", "complete-clause", "sentence-foundations-3-example-10-context"),
    ],
    activities: [
      activity(["cue-context"], ["noun-tanaka", "desu"], ["noun-kangoshi"], 0, "sentence-foundations-3-activity-1-instruction", "sf3-noun-predicate", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["cue-context"], ["noun-yamada", "desu"], ["noun-bengoshi"], 1, "sentence-foundations-3-activity-2-instruction", "sf3-noun-predicate", BASE_FORM_ACTIVITY_SHAPE),
      activity(["anchor-kippu"], ["anchor-kippu", "desu"], ["anchor-obaasan", "desu"], 1, "sentence-foundations-3-activity-3-instruction", "sf3-polite-copula", BASE_ORDERING_ACTIVITY_SHAPE),
      activity(["anchor-gakkou"], ["anchor-gakkou", "desu"], ["anchor-obaasan", "desu"], 0, "sentence-foundations-3-activity-4-instruction", "sf3-polite-copula", BASE_CONTROLLED_ACTIVITY_SHAPE),
      activity(["anchor-asa", "chunk-arrow", "desu"], ["anchor-asa", "desu"], ["noun-tomodachi"], 0, "sentence-foundations-3-activity-5-instruction", "sf3-polite-copula", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      activity(["anchor-kagi"], ["anchor-kagi", "desu"], ["anchor-umi", "desu"], 1, "sentence-foundations-3-activity-6-instruction", "sf3-polite-copula", BASE_ERROR_ACTIVITY_SHAPE, null, null, "context-meaning-mismatch"),
      activity(["cue-context"], ["anchor-denwa", "desu"], ["noun-isha"], 0, "sentence-foundations-3-activity-7-instruction", "sf3-polite-copula", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["anchor-kyaku"], ["anchor-kyaku", "desu"], ["anchor-kaze", "desu"], 1, "sentence-foundations-3-activity-8-instruction", "sf3-polite-copula", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      activity(["cue-audio"], ["anchor-shashin", "desu"], ["anchor-obaasan", "desu"], 1, "sentence-foundations-3-activity-9-instruction", "sf3-polite-copula", BASE_LISTENING_ACTIVITY_SHAPE),
      activity(["anchor-ryokou"], ["anchor-ryokou", "desu"], ["anchor-obaasan", "desu"], 0, "sentence-foundations-3-activity-10-instruction", "sf3-polite-copula", BASE_SPOKEN_ACTIVITY_SHAPE),
    ],
  },
  {
    lessonId: "sentence-foundations-4",
    prerequisiteLessonIds: ["sentence-foundations-3"],
    newLexemeIds: ["noun-daigakusei", "noun-ryuugakusei", "noun-kazoku"],
    reviewLexemeIds: [
      "noun-tanaka",
      "noun-yamada",
      "noun-gakusei",
      "noun-sensei",
      "noun-watashi",
      "noun-bengoshi",
      "noun-kangoshi",
      "noun-tomodachi",
      "noun-isha",
      "noun-hito",
      "anchor-hon",
      "anchor-neko",
      "anchor-shashin",
      "anchor-ie",
      "anchor-kippu",
      "anchor-gakkou",
      "anchor-umi",
      "anchor-denwa",
    ],
    introducedConceptIds: ["discourse-roles"],
    reviewedConceptIds: ["sentence-order", "sentence-omission", "affirmative-desu"],
    patternCellIds: ["sf4-explicit-reference", "sf4-recoverable-reference"],
    examples: [
      example(["noun-watashi", "comma", "noun-gakusei", "desu"], "explicit-speaker-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-1-context"),
      example(["noun-tanaka", "comma", "noun-kangoshi", "desu"], "explicit-tanaka-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-2-context"),
      example(["noun-yamada", "comma", "noun-bengoshi", "desu"], "explicit-yamada-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-3-context"),
      example(["noun-tomodachi", "comma", "noun-ryuugakusei", "desu"], "explicit-friend-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-4-context"),
      example(["noun-daigakusei", "desu"], "omitted-speaker-specific-role", "sf4-recoverable-reference", "complete-clause", "sentence-foundations-4-example-5-context"),
      example(["noun-ryuugakusei", "desu"], "omitted-friend-specific-role", "sf4-recoverable-reference", "complete-clause", "sentence-foundations-4-example-6-context"),
      example(["noun-kazoku", "desu"], "omitted-photo-group", "sf4-recoverable-reference", "complete-clause", "sentence-foundations-4-example-7-context"),
      example(["noun-gakusei", "desu"], "omitted-general-role", "sf4-recoverable-reference", "complete-clause", "sentence-foundations-4-example-8-context"),
      example(["noun-sensei", "desu"], "omitted-title", "sf4-recoverable-reference", "complete-clause", "sentence-foundations-4-example-9-context"),
      example(["noun-hito", "desu"], "omitted-human-category", "sf4-recoverable-reference", "complete-clause", "sentence-foundations-4-example-10-context"),
    ],
    activities: [
      activity(["noun-watashi"], ["noun-watashi", "comma", "noun-daigakusei", "desu"], ["noun-watashi", "comma", "noun-sensei", "desu"], 1, "sentence-foundations-4-activity-1-instruction", "sf4-explicit-reference", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["noun-tanaka"], ["noun-tanaka", "comma", "noun-tomodachi", "desu"], ["noun-tomodachi", "desu"], 1, "sentence-foundations-4-activity-2-instruction", "sf4-explicit-reference", BASE_FORM_ACTIVITY_SHAPE),
      activity(["noun-yamada"], ["noun-yamada", "comma", "noun-tomodachi", "desu"], ["noun-tomodachi", "comma", "noun-yamada", "desu"], 0, "sentence-foundations-4-activity-3-instruction", "sf4-explicit-reference", BASE_ORDERING_ACTIVITY_SHAPE),
      activity(["cue-context"], ["noun-tomodachi", "comma", "noun-gakusei", "desu"], ["noun-hito", "comma", "noun-ryuugakusei", "desu"], 0, "sentence-foundations-4-activity-4-instruction", "sf4-explicit-reference", BASE_CONTROLLED_ACTIVITY_SHAPE),
      activity(["noun-watashi", "comma", "anchor-umi", "desu"], ["anchor-umi", "desu"], ["anchor-hon", "desu"], 1, "sentence-foundations-4-activity-5-instruction", "sf4-recoverable-reference", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      activity(["cue-error"], ["anchor-neko", "desu"], ["anchor-shashin", "comma", "noun-kazoku", "desu"], 0, "sentence-foundations-4-activity-6-instruction", "sf4-recoverable-reference", BASE_ERROR_ACTIVITY_SHAPE, null, null, "context-meaning-mismatch"),
      activity(["anchor-denwa"], ["anchor-denwa", "desu"], ["anchor-shashin", "desu"], 1, "sentence-foundations-4-activity-7-instruction", "sf4-recoverable-reference", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["anchor-ie"], ["anchor-ie", "desu"], ["anchor-hon", "desu"], 0, "sentence-foundations-4-activity-8-instruction", "sf4-recoverable-reference", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      activity(["anchor-kippu"], ["anchor-kippu", "desu"], ["anchor-hon", "desu"], 0, "sentence-foundations-4-activity-9-instruction", "sf4-recoverable-reference", BASE_LISTENING_ACTIVITY_SHAPE),
      activity(["anchor-gakkou"], ["anchor-gakkou", "desu"], ["anchor-shashin", "desu"], 1, "sentence-foundations-4-activity-10-instruction", "sf4-recoverable-reference", BASE_SPOKEN_ACTIVITY_SHAPE),
    ],
  },
]);

const exampleEntries: (readonly [string, BaseExample])[] = [];
const acceptedAnswerEntries: (readonly [string, BaseVisibleTarget])[] = [];
const activityPromptEntries: (readonly [string, BaseVisibleTarget])[] = [];
const audioTargetEntries: (readonly [string, BaseVisibleTarget])[] = [];
const patternEntries: (readonly [string, readonly string[]])[] = [];

const RAW_LESSON_DEFINITIONS: readonly BaseAuthoredSemanticLesson[] =
  LESSON_SPECS.map((spec) => {
    const concepts = [...spec.introducedConceptIds, ...spec.reviewedConceptIds];
    const examples = spec.examples.map((entry, index) =>
      exampleFor(spec.lessonId, entry, index, concepts),
    );
    examples.forEach((example) => exampleEntries.push([example.id, example]));
    const activitySet = activitiesFor(spec);
    acceptedAnswerEntries.push(...activitySet.acceptedAnswers);
    activityPromptEntries.push(...activitySet.prompts);
    audioTargetEntries.push(...activitySet.audioTargets);
    patternEntries.push([spec.lessonId, spec.patternCellIds]);
    const explanation: LocalizedExplanation = {
      mainCopyId: `${spec.lessonId}-explanation-main`,
      constructionCopyId: `${spec.lessonId}-explanation-construction`,
      constraintsCopyId: `${spec.lessonId}-explanation-constraints`,
      commonErrorCopyId: `${spec.lessonId}-explanation-common-error`,
      nearestContrastId: `${spec.lessonId}-explanation-nearest-contrast`,
    };
    const content = defineBaseLessonContent({
      lessonId: spec.lessonId,
      contract: "system",
      prerequisiteLessonIds: spec.prerequisiteLessonIds,
      activities: activitySet.definitions,
      recapCopyId: `${spec.lessonId}-recap`,
      newLexemeIds: spec.newLexemeIds,
      reviewLexemeIds: spec.reviewLexemeIds,
      introducedConceptIds: spec.introducedConceptIds,
      reviewedConceptIds: spec.reviewedConceptIds,
      explanationBlockIds: {
        main: explanation.mainCopyId,
        construction: explanation.constructionCopyId,
        constraints: explanation.constraintsCopyId,
        commonError: explanation.commonErrorCopyId,
        nearestContrast: explanation.nearestContrastId,
      },
      patternCellIds: spec.patternCellIds,
      workedExampleIds: examples.map(({ id }) => id),
      dialogueId: null,
      referenceSnapshotIds: ["sentence-anatomy"],
      interactive: false,
      retrievedSystemIds: [],
    });
    return deepFreeze({
      content,
      titleCopyId: `${spec.lessonId}-title`,
      objectiveCopyId: `${spec.lessonId}-objective`,
      explanation,
      patternCellIds: spec.patternCellIds,
      examples,
      activityDesigns: activitySet.designs,
      dialogue: null,
    });
  });

export const BASE_SENTENCE_FOUNDATIONS_LESSONS: readonly BaseSystemLessonContent[] =
  deepFreeze(RAW_LESSON_DEFINITIONS.map(({ content }) => content as BaseSystemLessonContent));

export const BASE_SENTENCE_FOUNDATIONS_EXAMPLES: readonly BaseExample[] = deepFreeze(
  RAW_LESSON_DEFINITIONS.flatMap(({ examples }) => examples),
);

export const BASE_SENTENCE_FOUNDATIONS_PATTERN_CELL_IDS_BY_LESSON: ReadonlyMap<
  string,
  readonly string[]
> = immutableReadonlyMap(patternEntries);

const patternCellIds = patternEntries.flatMap(([, cells]) => cells);

export const BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS: BaseValidationCatalogs =
  deepFreeze({
    lexemes: BASE_LEXEME_BY_ID,
    concepts: BASE_CONCEPT_BY_ID,
    examples: immutableReadonlyMap(exampleEntries),
    dialogues: immutableReadonlyMap([]),
    audioTargets: immutableReadonlyMap(audioTargetEntries),
    acceptedAnswerTargets: immutableReadonlyMap(acceptedAnswerEntries),
    activityPromptTargets: immutableReadonlyMap(activityPromptEntries),
    copyIds: immutableReadonlySet(Object.keys(baseNavigationCopyEn.content)),
    contrastMapIds: immutableReadonlySet([]),
    referenceSnapshots: BASE_REFERENCE_SNAPSHOT_BY_ID,
    patternCellIds: immutableReadonlySet(patternCellIds),
    patternCellIdsByLesson:
      BASE_SENTENCE_FOUNDATIONS_PATTERN_CELL_IDS_BY_LESSON,
    systems: BASE_RETRIEVAL_SYSTEM_BY_ID,
  });

const RAW_BASE_SENTENCE_FOUNDATIONS_MODULE: BaseSentenceFoundationsModule = {
  id: "sentence-foundations",
  lessons: RAW_LESSON_DEFINITIONS,
  worldFacts: {
    speaker: "university-student",
    tanaka: "nurse",
    yamada: "lawyer",
    friend: "international-student",
  },
};

function denseArray(value: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    return undefined;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.keys(descriptors).length !== value.length + 1) return undefined;
  for (let index = 0; index < value.length; index += 1) {
    if (!descriptors[String(index)] || !("value" in descriptors[String(index)])) {
      return undefined;
    }
  }
  return value;
}

function plainRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  if (Object.getPrototypeOf(value) !== Object.prototype) return undefined;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.getOwnPropertySymbols(value).length > 0) return undefined;
  if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) {
    return undefined;
  }
  return value as Readonly<Record<string, unknown>>;
}

function targetSurface(value: unknown): string | undefined {
  const target = plainRecord(value);
  const tokens = target ? denseArray(target.tokens) : undefined;
  if (!tokens) return undefined;
  const surfaces: string[] = [];
  for (const token of tokens) {
    const record = plainRecord(token);
    if (!record || typeof record.jp !== "string") return undefined;
    surfaces.push(record.jp);
  }
  return surfaces.join("");
}

function targetPatternCells(value: unknown): readonly unknown[] | undefined {
  const target = plainRecord(value);
  return target ? denseArray(target.patternCellIds) : undefined;
}

export function validatePublishedSemanticActivities(
  lessonValue: unknown,
): boolean {
  const lesson = plainRecord(lessonValue);
  const content = lesson ? plainRecord(lesson.content) : undefined;
  const activities = content ? denseArray(content.activities) : undefined;
  const designs = lesson ? denseArray(lesson.activityDesigns) : undefined;
  const cells = lesson ? denseArray(lesson.patternCellIds) : undefined;
  if (
    !lesson ||
    !content ||
    !activities ||
    !designs ||
    !cells ||
    activities.length !== 10 ||
    designs.length !== activities.length
  ) {
    return false;
  }
  const positions: number[] = [];
  const lengthDistribution = { longer: 0, shorter: 0, tie: 0 };
  for (let index = 0; index < designs.length; index += 1) {
    const design = plainRecord(designs[index]);
    const activity = plainRecord(activities[index]);
    if (!design || !activity) return false;
    for (const key of [
      "category",
      "interactionKind",
      "mode",
      "operation",
    ] as const) {
      if (design[key] !== activity[key]) return false;
    }
    const patternCellId = design.patternCellId;
    const correctOptionIndex = design.correctOptionIndex;
    if (
      typeof patternCellId !== "string" ||
      !cells.includes(patternCellId) ||
      (correctOptionIndex !== 0 && correctOptionIndex !== 1)
    ) {
      return false;
    }
    positions.push(correctOptionIndex);
    const optionTargets = denseArray(design.optionTargets);
    const optionTargetIds = denseArray(design.optionTargetIds);
    const activityOptionIds = denseArray(activity.optionTargetIds);
    if (
      !optionTargets ||
      !optionTargetIds ||
      !activityOptionIds ||
      optionTargets.length !== 2 ||
      optionTargetIds.length !== 2 ||
      activityOptionIds.length !== 2 ||
      optionTargetIds.some((id, optionIndex) => id !== activityOptionIds[optionIndex])
    ) {
      return false;
    }
    const acceptedTarget = design.acceptedAnswerTarget;
    if (acceptedTarget !== optionTargets[correctOptionIndex]) return false;
    for (let optionIndex = 0; optionIndex < optionTargets.length; optionIndex += 1) {
      const targetCells = targetPatternCells(optionTargets[optionIndex]);
      if (
        !targetCells ||
        (optionIndex === correctOptionIndex
          ? targetCells.length !== 1 || targetCells[0] !== patternCellId
          : targetCells.length !== 0)
      ) {
        return false;
      }
    }
    const contextTarget = plainRecord(design.contextTarget);
    const evidence = plainRecord(design.operationEvidence);
    if (
      !contextTarget ||
      !evidence ||
      contextTarget.copyId !== design.promptContextCopyId ||
      contextTarget.revealsAnswer !== false ||
      evidence.kind !== design.operation
    ) {
      return false;
    }
    if (
      design.operation === "order-chunks" &&
      (denseArray(evidence.tileTargetIds)?.length ?? 0) < 2
    ) {
      return false;
    }
    if (
      design.operation === "transform-form" &&
      typeof evidence.sourceTargetId !== "string"
    ) {
      return false;
    }
    if (
      design.operation === "diagnose-error" &&
      (typeof evidence.candidateTargetId !== "string" ||
        typeof evidence.errorCode !== "string")
    ) {
      return false;
    }
    if (
      contextTarget.audioRequired !== (design.operation === "identify-audio") ||
      contextTarget.recallRequired !== (design.operation === "produce-spoken")
    ) {
      return false;
    }
    const promptCells = targetPatternCells(design.promptTarget);
    if (!promptCells || promptCells.length !== 0) return false;
    const optionLengths = optionTargets.map((target) => targetSurface(target)?.length);
    if (optionLengths.some((length) => length === undefined)) return false;
    const correctLength = optionLengths[correctOptionIndex] as number;
    const otherLength = optionLengths[correctOptionIndex === 0 ? 1 : 0] as number;
    if (correctLength > otherLength) lengthDistribution.longer += 1;
    else if (correctLength < otherLength) lengthDistribution.shorter += 1;
    else lengthDistribution.tie += 1;
  }
  const fingerprint = positions.join("");
  return (
    positions.filter((position) => position === 0).length === 5 &&
    positions.filter((position) => position === 1).length === 5 &&
    fingerprint !== "0101010101" &&
    fingerprint !== "1010101010" &&
    lengthDistribution.longer >= 2 &&
    lengthDistribution.shorter >= 2 &&
    lengthDistribution.tie >= 2
  );
}

export function validateBaseSentenceFoundationsModule(
  value: unknown,
): BaseSemanticModuleValidation {
  const errors = new Set<BaseSemanticModuleError>();
  const module = plainRecord(value);
  if (!module || module.id !== "sentence-foundations") {
    return { ok: false, errors: ["invalid-module-shape"] };
  }
  const lessons = denseArray(module.lessons);
  if (!lessons) {
    return { ok: false, errors: ["invalid-lesson-shape"] };
  }
  const worldFacts = plainRecord(module.worldFacts);
  if (
    !worldFacts ||
    worldFacts.speaker !== "university-student" ||
    worldFacts.tanaka !== "nurse" ||
    worldFacts.yamada !== "lawyer" ||
    worldFacts.friend !== "international-student"
  ) {
    errors.add("invalid-module-shape");
  }
  const expectedIds = LESSON_SPECS.map(({ lessonId }) => lessonId);
  if (
    lessons.length !== expectedIds.length ||
    lessons.some((lesson, index) => {
      const record = plainRecord(lesson);
      const content = record ? plainRecord(record.content) : undefined;
      return !content || content.lessonId !== expectedIds[index];
    })
  ) {
    errors.add("invalid-lesson-allocation");
  }
  for (const lesson of lessons) {
    const record = plainRecord(lesson);
    const content = record?.content;
    if (!record || !content) {
      errors.add("invalid-lesson-shape");
      continue;
    }
    if (
      lessons.length === BASE_SENTENCE_FOUNDATIONS_LESSONS.length &&
      validateFirstTeachOrder(
        lessons.map((lesson) => (plainRecord(lesson)?.content ?? null)),
        BASE_FIRST_TEACH_OWNERS,
        BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
      ).length > 0
    ) {
      errors.add("canonical-depth-failure");
    }
    if (
      validateBaseLessonDepth(
        content,
        BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
      ).length > 0
    ) {
      errors.add("canonical-depth-failure");
    }
    if (!validatePublishedSemanticActivities(record)) {
      errors.add("invalid-lesson-shape");
    }
  }
  const en = baseNavigationCopyEn.content;
  const it = baseNavigationCopyIt.content;
  const requiredCopyIds = new Set([
    ...RAW_LESSON_DEFINITIONS.flatMap((lesson) => [
      lesson.titleCopyId,
      lesson.objectiveCopyId,
      lesson.content.recapCopyId,
      ...Object.values(lesson.explanation),
      ...lesson.examples.flatMap((example) => [
        example.teachingPurposeCopyId,
        "copyId" in example.translationCopy ? example.translationCopy.copyId : "",
        example.contextCopyId ?? "",
      ]),
      ...lesson.activityDesigns.map(({ promptContextCopyId }) => promptContextCopyId),
      ...lesson.content.activities.flatMap((activity) => [
        activity.instructionCopyId,
        activity.acceptedFeedbackCopyId,
        activity.retryFeedbackCopyId,
      ]),
    ]),
  ]);
  if (
    [...requiredCopyIds].some(
      (id) =>
        id.length === 0 ||
        typeof en[id] !== "string" ||
        en[id].trim().length === 0 ||
        typeof it[id] !== "string" ||
        it[id].trim().length === 0,
    )
  ) {
    errors.add("invalid-copy");
  }
  return { ok: errors.size === 0, errors: [...errors] };
}

const moduleValidation = validateBaseSentenceFoundationsModule(
  RAW_BASE_SENTENCE_FOUNDATIONS_MODULE,
);
if (!moduleValidation.ok) {
  const details = BASE_SENTENCE_FOUNDATIONS_LESSONS.flatMap((lesson) =>
    validateBaseLessonDepth(
      lesson,
      BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
    ),
  );
  throw new Error(
    `Invalid Base sentence-foundations module: ${moduleValidation.errors.join(", ")} ${JSON.stringify(details)}`,
  );
}

export const BASE_SENTENCE_FOUNDATIONS_MODULE: BaseSentenceFoundationsModule =
  deepFreeze(RAW_BASE_SENTENCE_FOUNDATIONS_MODULE);

export const BASE_SEMANTIC_ACTIVITY_CATEGORIES: readonly BaseActivityCategory[] =
  deepFreeze([
    "meaning-comprehension",
    "form-function-discrimination",
    "ordering",
    "controlled-production",
    "transformation",
    "error-diagnosis",
    "contextual-response",
    "cumulative-retrieval",
  ]);

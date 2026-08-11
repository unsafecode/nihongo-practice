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
  readonly acceptedAnswerTargetId: string;
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
  readonly audioContract: BaseSemanticAudioContract | null;
}

export interface BaseSemanticAudioContract {
  readonly kind: "semantic-synthesis";
  readonly targetId: string;
  readonly locale: "ja-JP";
  readonly promptVisible: false;
}

export interface BaseSentenceRoleModel {
  readonly id: string;
  readonly patternCellId: string;
  readonly roles: readonly string[];
  readonly orientation: "context-to-final-answer" | "recoverable-final-fragment";
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
  readonly roleModels: readonly BaseSentenceRoleModel[];
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
  readonly worldFactIds: readonly string[];
  readonly worldFactLedger: readonly BaseWorldFactRecord[];
}

export interface BaseWorldFactRecord {
  readonly id: string;
  readonly acceptedTargetIds: readonly string[];
  readonly rejectedTargetIds: readonly string[];
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
  | "period"
  | "wa"
  | "ga"
  | "no"
  | "mo"
  | "to-listing"
  | "to-nominal"
  | "to-companion"
  | "ka"
  | "ne"
  | "yo";
type TokenPart = BaseAuthoredTokenPart;

interface ExampleSpec {
  readonly parts: readonly TokenPart[];
  readonly frame: string;
  readonly patternCellId: string;
  readonly utteranceKind: NonNullable<BaseExample["utteranceKind"]>;
  readonly contextCopyId: string;
  readonly roleModelId: string;
  readonly recoverableContextId: string;
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
    if (part === "period") {
      return {
        id: `${id}-${index}-period`,
        jp: "。",
        romaji: ".",
        kind: "punctuation",
        boundaryBefore: "attach",
        source: { domain: "catalog", referenceId: "japanese-period" },
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
      ne: "interactional-ne",
      yo: "interactional-yo",
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
    "period",
    "wa",
    "ga",
    "no",
    "mo",
    "to-listing",
    "to-nominal",
    "to-companion",
    "ka",
    "ne",
    "yo",
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
): BaseExample {
  const id = `${lessonId}-example-${index + 1}`;
  return deepFreeze({
    ...authoredVisibleTarget(
      spec.parts,
      id,
      sentenceConceptIdsFor(spec.parts, spec.patternCellId),
      [spec.patternCellId],
    ),
    id,
    teachingPurposeCopyId: `${id}-purpose`,
    translationCopy: { copyId: `${id}-translation` },
    predicateAspect: "nominal",
    discourseFrameId: spec.frame,
    interpretationTags: ["present-state"],
    utteranceKind: spec.utteranceKind,
    contextCopyId: spec.contextCopyId,
    roleModelId: spec.roleModelId,
    recoverableContextId: spec.recoverableContextId,
  });
}

function sentenceConceptIdsFor(
  parts: readonly TokenPart[],
  patternCellId?: string,
): readonly string[] {
  const ids = new Set<string>();
  if (parts.includes("desu")) ids.add("affirmative-desu");
  if (patternCellId?.startsWith("sf1-")) ids.add("sentence-chunks");
  if (patternCellId === "sf2-predicate-final") ids.add("sentence-order");
  if (patternCellId === "sf2-recoverable-omission") ids.add("sentence-omission");
  if (patternCellId === "sf4-recoverable-reference") ids.add("sentence-omission");
  if (patternCellId?.startsWith("sf4-")) ids.add("discourse-roles");
  if (patternCellId === "sf4-modifier-before-noun") {
    ids.add("modifier-before-noun");
  }
  return [...ids];
}

function sentencePatternCellsFor(
  parts: readonly TokenPart[],
  patternCellId: string,
): readonly string[] {
  const realizes =
    patternCellId.startsWith("sf1-") ||
    patternCellId.startsWith("sf2-") ||
    ((patternCellId.startsWith("sf3-") ||
      patternCellId === "sf4-recoverable-reference" ||
      patternCellId === "sf4-complete-short-sentence") &&
      parts.includes("desu") &&
      !parts.includes("comma")) ||
    (patternCellId === "sf4-explicit-reference" &&
      parts.includes("comma") &&
      parts.includes("desu")) ||
    (patternCellId === "sf4-modifier-before-noun" &&
      parts.includes("desu") &&
      !parts.includes("comma"));
  return realizes ? [patternCellId] : [];
}

function operationEvidenceFor(
  shape: BaseSemanticActivityShape,
  promptTargetId: string,
  optionTargetIds: readonly string[],
  optionTargets: readonly BaseVisibleTarget[],
  correctOptionIndex: 0 | 1,
  errorCode: string | null | undefined,
): BaseSemanticOperationEvidence {
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
      candidateTargetId: promptTargetId,
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
    const isSpoken = shape.operation === "produce-spoken";
    const authoredOptionTargetIds = activity.options.map(
      (_, optionIndex) => `${id}-option-${optionIndex + 1}`,
    );
    const authoredOptionTargets = activity.options.map((parts, optionIndex) =>
      authoredVisibleTarget(
        parts,
        authoredOptionTargetIds[optionIndex],
        sentenceConceptIdsFor(parts, activity.patternCellId),
        sentencePatternCellsFor(parts, activity.patternCellId),
      ),
    );
    const acceptedAnswerTargetId = isSpoken
      ? `${id}-answer`
      : authoredOptionTargetIds[activity.correctOptionIndex];
    const acceptedAnswerTarget = isSpoken
      ? authoredVisibleTarget(
          activity.answer,
          acceptedAnswerTargetId,
          sentenceConceptIdsFor(activity.answer, activity.patternCellId),
          sentencePatternCellsFor(activity.answer, activity.patternCellId),
        )
      : authoredOptionTargets[activity.correctOptionIndex];
    const optionTargetIds = isSpoken ? [] : authoredOptionTargetIds;
    const optionTargets = isSpoken ? [] : authoredOptionTargets;
    const promptParts = activity.prompt;
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
        : acceptedAnswerTargetId;
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
      acceptedFeedbackCopyId: `${spec.lessonId}-activity-${index + 1}-feedback-accepted`,
      retryFeedbackCopyId: `${spec.lessonId}-activity-${index + 1}-feedback-retry`,
      assessedConceptIds: [...new Set(
        [acceptedAnswerTarget, ...optionTargets].flatMap((target) => [
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
      correctOptionIndex: isSpoken ? null : activity.correctOptionIndex,
      promptTarget,
      acceptedAnswerTarget,
      acceptedAnswerTargetId,
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
      audioContract:
        shape.operation === "identify-audio"
          ? {
              kind: "semantic-synthesis",
              targetId,
              locale: "ja-JP",
              promptVisible: false,
            }
          : null,
    });
    prompts.push([
      baseActivityPromptKey(spec.lessonId, id),
      promptTarget,
    ]);
    optionTargetIds.forEach((optionTargetId, optionIndex) => {
      acceptedAnswers.push([optionTargetId, optionTargets[optionIndex]]);
    });
    if (isSpoken) {
      acceptedAnswers.push([acceptedAnswerTargetId, acceptedAnswerTarget]);
    }
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
  recoverableContextId = `${frame}-context`,
): ExampleSpec {
  return {
    parts,
    frame,
    patternCellId,
    utteranceKind,
    contextCopyId,
    roleModelId: `${patternCellId}-role-model`,
    recoverableContextId,
  };
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
    newLexemeIds: [
      "noun-gakusei",
      "noun-sensei",
      "noun-watashi",
      "noun-kazoku",
      "name-sakura",
      "name-ken",
    ],
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
      example(["noun-watashi", "comma", "noun-gakusei", "period"], "self-introduction-fragment", "sf1-identifying-chunk", "contextual-fragment", "sentence-foundations-1-example-1-context"),
      example(["anchor-obaasan", "comma", "noun-sensei", "period"], "photo-caption-role", "sf1-identifying-chunk", "contextual-fragment", "sentence-foundations-1-example-2-context"),
      example(["noun-kazoku", "comma", "anchor-shashin", "period"], "family-album-note", "sf1-context-chunk", "contextual-fragment", "sentence-foundations-1-example-3-context"),
      example(["anchor-asa", "comma", "anchor-gakkou", "period"], "morning-schedule-note", "sf1-context-chunk", "contextual-fragment", "sentence-foundations-1-example-4-context"),
      example(["anchor-ryokou", "comma", "anchor-umi", "period"], "trip-destination-note", "sf1-context-chunk", "contextual-fragment", "sentence-foundations-1-example-5-context"),
      example(["anchor-denwa", "comma", "anchor-obaasan", "period"], "call-routing-note", "sf1-context-chunk", "contextual-fragment", "sentence-foundations-1-example-6-context"),
      example(["anchor-kagi", "comma", "anchor-ie", "period"], "key-label-note", "sf1-context-chunk", "contextual-fragment", "sentence-foundations-1-example-7-context"),
      example(["anchor-kippu", "comma", "anchor-ryokou", "period"], "ticket-purpose-note", "sf1-context-chunk", "contextual-fragment", "sentence-foundations-1-example-8-context"),
      example(["anchor-shashin", "comma", "name-sakura", "period"], "sakura-photo-note", "sf1-context-chunk", "contextual-fragment", "sentence-foundations-1-example-9-context"),
      example(["anchor-shashin", "comma", "name-ken", "period"], "ken-photo-note", "sf1-context-chunk", "contextual-fragment", "sentence-foundations-1-example-10-context"),
    ],
    activities: [
      activity(["anchor-shashin"], ["anchor-shashin", "comma", "noun-watashi"], ["anchor-shashin", "comma", "anchor-obaasan"], 0, "sentence-foundations-1-activity-1-instruction", "sf1-identifying-chunk", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["anchor-gakkou"], ["anchor-gakkou", "comma", "noun-gakusei"], ["anchor-gakkou", "comma", "anchor-ryokou"], 0, "sentence-foundations-1-activity-2-instruction", "sf1-identifying-chunk", BASE_FORM_ACTIVITY_SHAPE),
      activity(["anchor-denwa"], ["anchor-denwa", "comma", "noun-sensei"], ["anchor-denwa", "comma", "anchor-kaze"], 1, "sentence-foundations-1-activity-3-instruction", "sf1-identifying-chunk", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["anchor-shashin"], ["anchor-shashin", "comma", "noun-kazoku"], ["anchor-shashin", "comma", "anchor-ryokou"], 0, "sentence-foundations-1-activity-4-instruction", "sf1-context-chunk", BASE_CONTROLLED_ACTIVITY_SHAPE),
      activity(["anchor-gakkou"], ["anchor-gakkou", "comma", "anchor-hon"], ["anchor-gakkou", "comma", "anchor-obaasan"], 1, "sentence-foundations-1-activity-5-instruction", "sf1-context-chunk", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["anchor-denwa", "comma", "anchor-kaze"], ["anchor-denwa", "comma", "name-sakura"], ["anchor-denwa", "comma", "anchor-pan"], 1, "sentence-foundations-1-activity-6-instruction", "sf1-context-chunk", BASE_ERROR_ACTIVITY_SHAPE, null, null, "context-meaning-mismatch"),
      activity(["anchor-kagi"], ["anchor-kagi", "comma", "anchor-gakkou"], ["anchor-kagi", "comma", "anchor-umi"], 0, "sentence-foundations-1-activity-7-instruction", "sf1-context-chunk", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["anchor-kippu"], ["anchor-kippu", "comma", "name-ken"], ["anchor-kippu", "comma", "anchor-kaze"], 1, "sentence-foundations-1-activity-8-instruction", "sf1-context-chunk", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      activity(["anchor-pan"], ["anchor-pan", "comma", "anchor-ie"], ["anchor-pan", "comma", "anchor-kagi"], 0, "sentence-foundations-1-activity-9-instruction", "sf1-context-chunk", BASE_LISTENING_ACTIVITY_SHAPE),
      activity(["anchor-kaze"], ["anchor-kaze", "comma", "anchor-asa"], ["anchor-kaze", "comma", "anchor-shashin"], 1, "sentence-foundations-1-activity-10-instruction", "sf1-context-chunk", BASE_SPOKEN_ACTIVITY_SHAPE),
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
      "noun-kazoku",
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
      example(["anchor-shashin", "comma", "noun-tanaka", "period"], "tanaka-explicit-context", "sf2-predicate-final", "contextual-fragment", "sentence-foundations-2-example-1-context", "sf2-pair-tanaka"),
      example(["noun-tanaka", "period"], "tanaka-omitted-context", "sf2-recoverable-omission", "contextual-fragment", "sentence-foundations-2-example-2-context", "sf2-pair-tanaka"),
      example(["anchor-shashin", "comma", "noun-yamada", "period"], "yamada-explicit-context", "sf2-predicate-final", "contextual-fragment", "sentence-foundations-2-example-3-context", "sf2-pair-yamada"),
      example(["noun-yamada", "period"], "yamada-omitted-context", "sf2-recoverable-omission", "contextual-fragment", "sentence-foundations-2-example-4-context", "sf2-pair-yamada"),
      example(["anchor-obaasan", "comma", "noun-hito", "period"], "person-explicit-context", "sf2-predicate-final", "contextual-fragment", "sentence-foundations-2-example-5-context", "sf2-pair-person"),
      example(["noun-hito", "period"], "person-omitted-context", "sf2-recoverable-omission", "contextual-fragment", "sentence-foundations-2-example-6-context", "sf2-pair-person"),
      example(["anchor-gakkou", "comma", "noun-gakusei", "period"], "student-explicit-context", "sf2-predicate-final", "contextual-fragment", "sentence-foundations-2-example-7-context", "sf2-pair-student"),
      example(["noun-gakusei", "period"], "student-omitted-context", "sf2-recoverable-omission", "contextual-fragment", "sentence-foundations-2-example-8-context", "sf2-pair-student"),
      example(["anchor-denwa", "comma", "anchor-shashin", "period"], "screen-explicit-context", "sf2-predicate-final", "contextual-fragment", "sentence-foundations-2-example-9-context", "sf2-pair-screen"),
      example(["anchor-shashin", "period"], "screen-omitted-context", "sf2-recoverable-omission", "contextual-fragment", "sentence-foundations-2-example-10-context", "sf2-pair-screen"),
    ],
    activities: [
      activity(["anchor-shashin", "comma", "noun-tanaka"], ["noun-tanaka", "comma", "noun-hito"], ["anchor-shashin", "comma", "noun-yamada", "comma", "noun-hito"], 1, "sentence-foundations-2-activity-1-instruction", "sf2-recoverable-omission", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["anchor-shashin", "comma", "noun-yamada"], ["noun-yamada", "comma", "noun-hito"], ["anchor-shashin", "comma", "noun-tanaka", "comma", "noun-kazoku"], 0, "sentence-foundations-2-activity-2-instruction", "sf2-recoverable-omission", BASE_FORM_ACTIVITY_SHAPE),
      activity(["anchor-obaasan"], ["anchor-obaasan", "comma", "noun-kazoku"], ["anchor-obaasan", "comma", "noun-sensei"], 0, "sentence-foundations-2-activity-3-instruction", "sf2-predicate-final", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["anchor-gakkou", "comma", "noun-gakusei"], ["noun-gakusei", "comma", "noun-watashi"], ["noun-gakusei", "comma", "anchor-obaasan", "comma", "noun-kazoku"], 1, "sentence-foundations-2-activity-4-instruction", "sf2-recoverable-omission", BASE_CONTROLLED_ACTIVITY_SHAPE),
      activity(["anchor-denwa", "comma", "anchor-gakkou"], ["noun-sensei"], ["noun-kazoku"], 0, "sentence-foundations-2-activity-5-instruction", "sf2-recoverable-omission", BASE_CONTROLLED_ACTIVITY_SHAPE),
      activity(["anchor-shashin", "comma", "anchor-kippu"], ["noun-watashi"], ["anchor-umi"], 1, "sentence-foundations-2-activity-6-instruction", "sf2-recoverable-omission", BASE_ERROR_ACTIVITY_SHAPE, null, null, "context-meaning-mismatch"),
      activity(["anchor-shashin"], ["anchor-neko"], ["anchor-kagi"], 1, "sentence-foundations-2-activity-7-instruction", "sf2-recoverable-omission", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["anchor-gakkou"], ["anchor-hon"], ["anchor-kippu"], 0, "sentence-foundations-2-activity-8-instruction", "sf2-recoverable-omission", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      activity(["anchor-kagi"], ["anchor-ie"], ["anchor-asa"], 1, "sentence-foundations-2-activity-9-instruction", "sf2-recoverable-omission", BASE_LISTENING_ACTIVITY_SHAPE),
      activity(["anchor-shashin"], ["anchor-denwa"], ["anchor-kagi"], 0, "sentence-foundations-2-activity-10-instruction", "sf2-recoverable-omission", BASE_SPOKEN_ACTIVITY_SHAPE),
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
      activity(["anchor-shashin"], ["noun-tanaka", "desu"], ["noun-kangoshi"], 0, "sentence-foundations-3-activity-1-instruction", "sf3-noun-predicate", BASE_MEANING_ACTIVITY_SHAPE),
      activity(["anchor-shashin"], ["noun-yamada", "desu"], ["noun-bengoshi"], 1, "sentence-foundations-3-activity-2-instruction", "sf3-noun-predicate", BASE_FORM_ACTIVITY_SHAPE),
      activity(["anchor-kippu"], ["anchor-kippu", "desu"], ["desu", "anchor-kippu"], 1, "sentence-foundations-3-activity-3-instruction", "sf3-polite-copula", BASE_ORDERING_ACTIVITY_SHAPE),
      activity(["anchor-shashin"], ["anchor-gakkou", "desu"], ["anchor-obaasan", "desu"], 0, "sentence-foundations-3-activity-4-instruction", "sf3-polite-copula", BASE_CONTROLLED_ACTIVITY_SHAPE),
      activity(["anchor-asa"], ["anchor-asa", "desu"], ["noun-tomodachi"], 0, "sentence-foundations-3-activity-5-instruction", "sf3-polite-copula", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      activity(["anchor-pan", "desu"], ["anchor-kagi", "desu"], ["anchor-umi", "desu"], 1, "sentence-foundations-3-activity-6-instruction", "sf3-polite-copula", BASE_ERROR_ACTIVITY_SHAPE, null, null, "context-meaning-mismatch"),
      activity(["noun-isha"], ["anchor-denwa", "desu"], ["noun-gakusei"], 0, "sentence-foundations-3-activity-7-instruction", "sf3-polite-copula", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["anchor-kaze"], ["anchor-kyaku", "desu"], ["anchor-hon", "desu"], 1, "sentence-foundations-3-activity-8-instruction", "sf3-polite-copula", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      activity(["anchor-denwa"], ["anchor-shashin", "desu"], ["anchor-obaasan", "comma", "noun-sensei", "desu"], 1, "sentence-foundations-3-activity-9-instruction", "sf3-polite-copula", BASE_LISTENING_ACTIVITY_SHAPE),
      activity(["anchor-kippu"], ["anchor-ryokou", "desu"], ["anchor-obaasan", "desu"], 0, "sentence-foundations-3-activity-10-instruction", "sf3-polite-copula", BASE_SPOKEN_ACTIVITY_SHAPE),
    ],
  },
  {
    lessonId: "sentence-foundations-4",
    prerequisiteLessonIds: ["sentence-foundations-3"],
    newLexemeIds: [
      "noun-daigakusei",
      "noun-ryuugakusei",
      "name-mika",
      "name-sora",
      "name-haru",
      "name-ai",
    ],
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
      "noun-kazoku",
      "name-sakura",
      "name-ken",
      "anchor-hon",
      "anchor-neko",
      "anchor-shashin",
      "anchor-ie",
      "anchor-kippu",
      "anchor-gakkou",
      "anchor-umi",
      "anchor-denwa",
      "anchor-kagi",
    ],
    introducedConceptIds: ["discourse-roles", "modifier-before-noun"],
    reviewedConceptIds: ["sentence-order", "sentence-omission", "affirmative-desu"],
    patternCellIds: [
      "sf4-modifier-before-noun",
      "sf4-complete-short-sentence",
      "sf4-explicit-reference",
    ],
    examples: [
      example(["name-sakura", "noun-sensei", "desu", "period"], "sakura-title-compound", "sf4-modifier-before-noun", "complete-clause", "sentence-foundations-4-example-1-context"),
      example(["name-ken", "noun-sensei", "desu", "period"], "ken-title-compound", "sf4-modifier-before-noun", "complete-clause", "sentence-foundations-4-example-2-context"),
      example(["anchor-hon", "desu"], "complete-book-identification", "sf4-complete-short-sentence", "complete-clause", "sentence-foundations-4-example-3-context"),
      example(["anchor-kippu", "desu"], "complete-ticket-identification", "sf4-complete-short-sentence", "complete-clause", "sentence-foundations-4-example-4-context"),
      example(["noun-watashi", "comma", "noun-daigakusei", "desu"], "explicit-speaker-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-5-context"),
      example(["noun-tomodachi", "comma", "noun-ryuugakusei", "desu"], "explicit-friend-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-6-context"),
      example(["name-mika", "comma", "noun-gakusei", "desu"], "mika-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-7-context"),
      example(["name-sora", "comma", "noun-gakusei", "desu"], "sora-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-8-context"),
      example(["name-haru", "comma", "noun-gakusei", "desu"], "haru-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-9-context"),
      example(["name-ai", "comma", "noun-gakusei", "desu"], "ai-hanging-topic", "sf4-explicit-reference", "hanging-topic", "sentence-foundations-4-example-10-context"),
    ],
    activities: [
      activity(["name-mika"], ["name-mika", "noun-sensei", "desu"], ["name-mika", "comma", "noun-daigakusei", "desu"], 1, "sentence-foundations-4-activity-1-instruction", "sf4-modifier-before-noun", BASE_CONTEXT_ACTIVITY_SHAPE),
      activity(["name-sora"], ["name-sora", "noun-sensei", "desu"], ["name-sora", "comma", "noun-sensei", "desu"], 1, "sentence-foundations-4-activity-2-instruction", "sf4-modifier-before-noun", BASE_FORM_ACTIVITY_SHAPE),
      activity(["name-haru"], ["name-haru", "noun-sensei", "desu"], ["noun-sensei", "name-haru", "desu"], 0, "sentence-foundations-4-activity-3-instruction", "sf4-modifier-before-noun", BASE_ORDERING_ACTIVITY_SHAPE),
      activity(["anchor-shashin"], ["noun-daigakusei", "desu"], ["noun-daigakusei"], 0, "sentence-foundations-4-activity-4-instruction", "sf4-complete-short-sentence", BASE_CONTROLLED_ACTIVITY_SHAPE),
      activity(["noun-watashi"], ["noun-hito", "desu"], ["noun-gakusei", "desu"], 1, "sentence-foundations-4-activity-5-instruction", "sf4-complete-short-sentence", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      activity(["noun-sensei", "name-ai", "desu"], ["name-ai", "noun-sensei", "desu"], ["name-ai", "comma", "noun-ryuugakusei", "desu"], 0, "sentence-foundations-4-activity-6-instruction", "sf4-modifier-before-noun", BASE_ERROR_ACTIVITY_SHAPE, null, null, "modifier-order-mismatch"),
      activity(["noun-tomodachi"], ["noun-ryuugakusei", "desu"], ["noun-sensei", "desu"], 1, "sentence-foundations-4-activity-7-instruction", "sf4-complete-short-sentence", BASE_CONTEXT_ACTIVITY_SHAPE, "friend", "friend-role"),
      activity(["anchor-shashin"], ["noun-kazoku", "desu"], ["anchor-neko", "desu"], 0, "sentence-foundations-4-activity-8-instruction", "sf4-complete-short-sentence", BASE_RETRIEVAL_ACTIVITY_SHAPE, "shared-photo", "shared-photo-content"),
      activity(["noun-tanaka"], ["noun-kangoshi", "desu"], ["noun-tomodachi", "desu"], 0, "sentence-foundations-4-activity-9-instruction", "sf4-complete-short-sentence", BASE_LISTENING_ACTIVITY_SHAPE, "tanaka", "tanaka-role"),
      activity(["noun-yamada"], ["noun-bengoshi", "desu"], ["noun-kangoshi", "desu"], 1, "sentence-foundations-4-activity-10-instruction", "sf4-complete-short-sentence", BASE_SPOKEN_ACTIVITY_SHAPE, "yamada", "yamada-role"),
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
    const examples = spec.examples.map((entry, index) =>
      exampleFor(spec.lessonId, entry, index),
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
    const roleModels: readonly BaseSentenceRoleModel[] =
      spec.lessonId === "sentence-foundations-1"
        ? [
            {
              id: "sf1-identifying-chunk-role-model",
              patternCellId: "sf1-identifying-chunk",
              roles: ["context", "identity-chunk"],
              orientation: "context-to-final-answer",
            },
            {
              id: "sf1-context-chunk-role-model",
              patternCellId: "sf1-context-chunk",
              roles: ["shared-context", "selected-chunk"],
              orientation: "context-to-final-answer",
            },
          ]
        : spec.lessonId === "sentence-foundations-2"
          ? [
              {
                id: "sf2-predicate-final-role-model",
                patternCellId: "sf2-predicate-final",
                roles: ["recoverable-reference", "final-answer"],
                orientation: "recoverable-final-fragment",
              },
              {
                id: "sf2-recoverable-omission-role-model",
                patternCellId: "sf2-recoverable-omission",
                roles: ["shared-context", "spoken-fragment"],
                orientation: "recoverable-final-fragment",
              },
            ]
          : [];
    return deepFreeze({
      content,
      titleCopyId: `${spec.lessonId}-title`,
      objectiveCopyId: `${spec.lessonId}-objective`,
      explanation,
      patternCellIds: spec.patternCellIds,
      examples,
      activityDesigns: activitySet.designs,
      dialogue: null,
      roleModels,
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
  worldFactIds: RAW_LESSON_DEFINITIONS.flatMap((lesson) =>
    lesson.activityDesigns.flatMap(({ worldFactId }) =>
      worldFactId ? [worldFactId] : [],
    ),
  ),
  worldFactLedger: worldFactLedgerFor(RAW_LESSON_DEFINITIONS),
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

function targetTokenMultiset(value: unknown): string | undefined {
  const target = plainRecord(value);
  const tokens = target ? denseArray(target.tokens) : undefined;
  if (!tokens) return undefined;
  const parts: string[] = [];
  for (const token of tokens) {
    const record = plainRecord(token);
    if (!record || typeof record.jp !== "string") return undefined;
    parts.push(record.jp);
  }

  return parts.sort().join("|");
}

function normalizedPreAttemptSurface(value: unknown): string | undefined {
  return targetSurface(value)
    ?.normalize("NFKC")
    .replace(/\s+/gu, "")
    .replace(/[、。？！?!]+$/gu, "");
}

export function worldFactLedgerFor(
  lessons: readonly Readonly<{
    content: Readonly<{ lessonId: string }>;
    activityDesigns: readonly BaseSemanticActivityDesign[];
  }>[],
): readonly BaseWorldFactRecord[] {
  const records = new Map<string, {
    acceptedTargetIds: string[];
    rejectedTargetIds: string[];
  }>();
  for (const lesson of lessons) {
    for (const design of lesson.activityDesigns) {
      if (!design.worldFactId) continue;
      const correct = design.correctOptionIndex;
      const rejectedTargetIds = [
        ...(correct === 0 || correct === 1
          ? [design.optionTargetIds[correct === 0 ? 1 : 0]]
          : []),
        ...(design.operationEvidence.errorCode === "world-fact-mismatch"
          ? [baseActivityPromptKey(lesson.content.lessonId, design.id)]
          : []),
      ];
      const id = design.worldFactId;
      const record = records.get(id) ?? {
        acceptedTargetIds: [],
        rejectedTargetIds: [],
      };
      record.acceptedTargetIds.push(design.acceptedAnswerTargetId);
      record.rejectedTargetIds.push(...rejectedTargetIds);
      records.set(id, record);
    }
  }
  return deepFreeze(
    [...records].map(([id, record]) => ({
      id,
      acceptedTargetIds: [...new Set(record.acceptedTargetIds)],
      rejectedTargetIds: [...new Set(record.rejectedTargetIds)],
    })),
  );
}

export function validatePublishedWorldFactLedger(moduleValue: unknown): boolean {
  const module = plainRecord(moduleValue);
  const lessons = module ? denseArray(module.lessons) : undefined;
  const ledger = module ? denseArray(module.worldFactLedger) : undefined;
  if (!lessons || !ledger) return false;
  const expectedRecords = new Map<string, {
    acceptedTargetIds: string[];
    rejectedTargetIds: string[];
  }>();
  for (const lessonValue of lessons) {
    const lesson = plainRecord(lessonValue);
    const content = lesson ? plainRecord(lesson.content) : undefined;
    const designs = lesson ? denseArray(lesson.activityDesigns) : undefined;
    if (!content || typeof content.lessonId !== "string" || !designs) return false;
    for (const designValue of designs) {
      const design = plainRecord(designValue);
      const optionTargetIds = design ? denseArray(design.optionTargetIds) : undefined;
      const evidence = design ? plainRecord(design.operationEvidence) : undefined;
      const isSpoken = design?.operation === "produce-spoken";
      if (
        !design ||
        !optionTargetIds ||
        (isSpoken ? optionTargetIds.length !== 0 : optionTargetIds.length !== 2) ||
        typeof design.id !== "string" ||
        typeof design.acceptedAnswerTargetId !== "string" ||
        (design.worldFactId !== null && typeof design.worldFactId !== "string") ||
        (design.correctOptionIndex !== null &&
          design.correctOptionIndex !== 0 &&
          design.correctOptionIndex !== 1)
      ) {
        return false;
      }

      if (design.worldFactId === null) continue;
      const correct = design.correctOptionIndex;
      const expected = expectedRecords.get(design.worldFactId) ?? {
        acceptedTargetIds: [],
        rejectedTargetIds: [],
      };
      expected.acceptedTargetIds.push(design.acceptedAnswerTargetId);
      expected.rejectedTargetIds.push(
        ...(correct === 0 || correct === 1
          ? [String(optionTargetIds[correct === 0 ? 1 : 0])]
          : []),
        ...(evidence?.errorCode === "world-fact-mismatch"
          ? [baseActivityPromptKey(content.lessonId, design.id)]
          : []),
      );
      expectedRecords.set(design.worldFactId, expected);
    }

  }
  const expected: BaseWorldFactRecord[] = [...expectedRecords].map(
    ([id, record]) => ({
      id,
      acceptedTargetIds: [...new Set(record.acceptedTargetIds)],
      rejectedTargetIds: [...new Set(record.rejectedTargetIds)],
    }),
  );
  if (ledger.length !== expected.length) return false;
  const ids = new Set<string>();
  return ledger.every((value, index) => {
    const record = plainRecord(value);
    const accepted = record ? denseArray(record.acceptedTargetIds) : undefined;
    const rejected = record ? denseArray(record.rejectedTargetIds) : undefined;
    const match = expected[index];
    if (
      !record ||
      !match ||
      typeof record.id !== "string" ||
      !accepted ||
      accepted.some((id) => typeof id !== "string") ||
      !rejected ||
      rejected.some((id) => typeof id !== "string") ||
      accepted.some((id) => rejected.includes(id)) ||
      ids.has(record.id)
    ) {
      return false;
    }
    ids.add(record.id);
    return (
      record.id === match.id &&
      accepted.length === match.acceptedTargetIds.length &&
      accepted.every((id, acceptedIndex) => id === match.acceptedTargetIds[acceptedIndex]) &&
      rejected.length === match.rejectedTargetIds.length &&
      rejected.every((id, rejectedIndex) => id === match.rejectedTargetIds[rejectedIndex])
    );
  });
}

export function validateNewLexemeMeaningCopies(
  lessonsValue: unknown,
  catalogs: BaseValidationCatalogs,
  enCopyValue: unknown,
  itCopyValue: unknown,
): boolean {
  const lessons = denseArray(lessonsValue);
  const en = plainRecord(enCopyValue);
  const it = plainRecord(itCopyValue);
  if (!lessons || !en || !it) return false;
  return lessons.every((lessonValue) => {
    const lesson = plainRecord(lessonValue);
    const content = lesson ? plainRecord(lesson.content) : undefined;
    const ids = content ? denseArray(content.newLexemeIds) : undefined;
    return (
      !!ids &&
      ids.every((id) => {
        if (typeof id !== "string") return false;
        const lexeme = catalogs.lexemes.get(id);
        if (!lexeme) return false;
        return [en[lexeme.meaningCopyId], it[lexeme.meaningCopyId]].every(
          (copy) => typeof copy === "string" && copy.trim().length > 0,
        );
      })
    );
  });
}

export function validatePublishedSemanticActivities(
  lessonValue: unknown,
): boolean {
  const lesson = plainRecord(lessonValue);
  const content = lesson ? plainRecord(lesson.content) : undefined;
  const activities = content ? denseArray(content.activities) : undefined;
  const designs = lesson ? denseArray(lesson.activityDesigns) : undefined;
  const cells = lesson ? denseArray(lesson.patternCellIds) : undefined;
  const examples = lesson ? denseArray(lesson.examples) : undefined;
  if (
    !lesson ||
    !content ||
    !activities ||
    !designs ||
    !cells ||
    !examples ||
    activities.length !== 10 ||
    designs.length !== activities.length
  ) {
    return false;
  }
  const preAttempt = new Set(
    examples.flatMap((example) => {
      const surface = normalizedPreAttemptSurface(example);
      return surface ? [surface] : [];
    }),
  );
  const dialogue = plainRecord(lesson.dialogue);
  const dialogueTurns = dialogue ? denseArray(dialogue.turns) : [];
  if (dialogue && !dialogueTurns) return false;
  for (const turn of dialogueTurns ?? []) {
    const surface = normalizedPreAttemptSurface(turn);
    if (!surface) return false;
    preAttempt.add(surface);
  }
  const positions: number[] = [];
  const lengthDistribution = { longer: 0, shorter: 0, tie: 0 };
  const practiceSurfaces = new Set<string>();
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
    const isSpoken = design.operation === "produce-spoken";
    if (
      typeof patternCellId !== "string" ||
      !cells.includes(patternCellId) ||
      (isSpoken
        ? correctOptionIndex !== null
        : correctOptionIndex !== 0 && correctOptionIndex !== 1)
    ) {
      return false;
    }
    if (!isSpoken) positions.push(correctOptionIndex as number);
    const optionTargets = denseArray(design.optionTargets);
    const optionTargetIds = denseArray(design.optionTargetIds);
    const activityOptionIds = denseArray(activity.optionTargetIds);
    if (
      !optionTargets ||
      !optionTargetIds ||
      !activityOptionIds ||
      (isSpoken ? optionTargets.length !== 0 : optionTargets.length !== 2) ||
      (isSpoken ? optionTargetIds.length !== 0 : optionTargetIds.length !== 2) ||
      (isSpoken ? activityOptionIds.length !== 0 : activityOptionIds.length !== 2) ||
      optionTargetIds.some((id, optionIndex) => id !== activityOptionIds[optionIndex])
    ) {
      return false;
    }
    const acceptedTarget = design.acceptedAnswerTarget;
    const acceptedSurface = normalizedPreAttemptSurface(acceptedTarget);
    if (
      !acceptedSurface ||
      preAttempt.has(acceptedSurface) ||
      typeof design.acceptedAnswerTargetId !== "string" ||
      (isSpoken
        ? design.acceptedAnswerTargetId !== activity.targetId ||
          targetPatternCells(acceptedTarget)?.[0] !== patternCellId
        : acceptedTarget !== optionTargets[correctOptionIndex as number])
    ) {
      return false;
    }
    if (
      optionTargets.some((target) => {
        const surface = normalizedPreAttemptSurface(target);
        return !surface || preAttempt.has(surface);
      })
    ) {
      return false;
    }
    for (const target of [
      ...optionTargets,
      ...(isSpoken ? [acceptedTarget] : []),
    ]) {
      const surface = normalizedPreAttemptSurface(target);
      if (!surface || practiceSurfaces.has(surface)) return false;
      practiceSurfaces.add(surface);
    }
    const promptSurface = targetSurface(design.promptTarget);
    if (
      !promptSurface ||
      /[◇◎●↔♪↺→]/.test(promptSurface) ||
      optionTargets.some((target) => targetSurface(target) === promptSurface)
    ) {
      return false;
    }
    for (let optionIndex = 0; optionIndex < optionTargets.length; optionIndex += 1) {
      const targetCells = targetPatternCells(optionTargets[optionIndex]);
      if (
        !targetCells ||
        (optionIndex === correctOptionIndex
          ? targetCells.length !== 1 || targetCells[0] !== patternCellId
          : targetCells.some((cell) => cell !== patternCellId))
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
      ((denseArray(evidence.tileTargetIds)?.length ?? 0) < 2 ||
        optionTargets
          .map(targetTokenMultiset)
          .some((signature, _, signatures) =>
            signature === undefined || signature !== signatures[0]) ||
        new Set(optionTargets.map(targetSurface)).size !== optionTargets.length)
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
        typeof evidence.errorCode !== "string" ||
        evidence.candidateTargetId !==
          baseActivityPromptKey(
            String((lesson as { readonly content?: { readonly lessonId?: unknown } }).content?.lessonId),
            String(design.id),
          ))
    ) {
      return false;
    }
    if (
      contextTarget.audioRequired !== (design.operation === "identify-audio") ||
      contextTarget.recallRequired !== (design.operation === "produce-spoken")
    ) {
      return false;
    }
    const audioContract =
      design.audioContract === null ? null : plainRecord(design.audioContract);
    if (
      design.operation === "identify-audio"
        ? !audioContract ||
          audioContract.kind !== "semantic-synthesis" ||
          audioContract.targetId !== design.audioTargetId ||
          audioContract.locale !== "ja-JP" ||
          audioContract.promptVisible !== false
        : design.audioContract !== null
    ) {
      return false;
    }
    if (
      design.worldFactId !== null &&
      (typeof design.worldFactId !== "string" || design.worldFactId.length === 0)
    ) {
      return false;
    }
    if (
      design.worldFactId !== null &&
      (typeof design.referentId !== "string" || design.referentId.length === 0)
    ) {
      return false;
    }
    const promptCells = targetPatternCells(design.promptTarget);
    if (!promptCells || promptCells.length !== 0) return false;
    if (!isSpoken) {
      const optionLengths = optionTargets.map((target) => targetSurface(target)?.length);
      if (optionLengths.some((length) => length === undefined)) return false;
      const correct = correctOptionIndex as 0 | 1;
      const correctLength = optionLengths[correct] as number;
      const otherLength = optionLengths[correct === 0 ? 1 : 0] as number;
      if (correctLength > otherLength) lengthDistribution.longer += 1;
      else if (correctLength < otherLength) lengthDistribution.shorter += 1;
      else lengthDistribution.tie += 1;
    }
  }
  const fingerprint = positions.join("");
  const zeroCount = positions.filter((position) => position === 0).length;
  const oneCount = positions.filter((position) => position === 1).length;
  return (
    positions.length === 9 &&
    Math.abs(zeroCount - oneCount) <= 1 &&
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
  const worldFactIds = denseArray(module.worldFactIds);
  if (
    !worldFacts ||
    worldFacts.speaker !== "university-student" ||
    worldFacts.tanaka !== "nurse" ||
    worldFacts.yamada !== "lawyer" ||
    worldFacts.friend !== "international-student" ||
    !worldFactIds
  ) {
    errors.add("invalid-module-shape");
  }
  if (!validatePublishedWorldFactLedger(module)) {
    errors.add("invalid-module-shape");
  }
  if (
    !validateNewLexemeMeaningCopies(
      lessons,
      BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
      baseNavigationCopyEn.content,
      baseNavigationCopyIt.content,
    )
  ) {
    errors.add("invalid-copy");
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
    const lessonRecord = plainRecord(record);
    const designs = lessonRecord ? denseArray(lessonRecord.activityDesigns) : undefined;
    if (
      !designs ||
      designs.some((design) => {
        const record = plainRecord(design);
        return (
          !record ||
          (record.worldFactId !== null &&
            worldFactIds?.includes(record.worldFactId) !== true)
        );
      })
    ) {
      errors.add("invalid-module-shape");
    }
    if (
      ["sentence-foundations-1", "sentence-foundations-2"].includes(
        String((content as { readonly lessonId?: unknown }).lessonId),
      )
    ) {
      const roleModels = denseArray(record.roleModels);
      const examples = denseArray(record.examples);
      if (
        !roleModels ||
        roleModels.length < 2 ||
        !examples ||
        examples.some((example) => {
          const item = plainRecord(example);
          return (
            !item ||
            item.utteranceKind !== "contextual-fragment" ||
            typeof item.roleModelId !== "string" ||
            typeof item.recoverableContextId !== "string" ||
            !roleModels.some((model) => plainRecord(model)?.id === item.roleModelId)
          );
        })
      ) {
        errors.add("invalid-lesson-shape");
      }
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
  const publicationDetails = RAW_LESSON_DEFINITIONS
    .filter((lesson) => !validatePublishedSemanticActivities(lesson))
    .map(({ content }) => content.lessonId);
  throw new Error(
    `Invalid Base sentence-foundations module: ${moduleValidation.errors.join(", ")} ${JSON.stringify(details)} ${JSON.stringify(publicationDetails)}`,
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

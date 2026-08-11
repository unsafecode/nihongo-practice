import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import { immutableReadonlySet } from "../../foundations/immutableReadonlySet";
import {
  defineBaseLessonContent,
  type BaseActivityDefinition,
  type BaseContentLessonContent,
  type BaseDialogue,
  type BaseDialogueTurn,
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
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import { BASE_FIRST_TEACH_OWNERS } from "../catalog/firstTeach";
import { baseActivityPromptKey } from "../catalog/visibleTargets";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateFirstTeachOrder } from "../validation/sequenceRules";
import {
  authoredVisibleTarget,
  BASE_CONTEXT_ACTIVITY_SHAPE,
  BASE_CONTROLLED_ACTIVITY_SHAPE,
  BASE_ERROR_ACTIVITY_SHAPE,
  BASE_FORM_ACTIVITY_SHAPE,
  BASE_LISTENING_ACTIVITY_SHAPE,
  BASE_MEANING_ACTIVITY_SHAPE,
  BASE_ORDERING_ACTIVITY_SHAPE,
  BASE_RETRIEVAL_ACTIVITY_SHAPE,
  BASE_SENTENCE_FOUNDATIONS_LESSONS,
  BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
  BASE_SPOKEN_ACTIVITY_SHAPE,
  BASE_TRANSFORMATION_ACTIVITY_SHAPE,
  validatePublishedSemanticActivities,
  type BaseAuthoredTokenPart,
  type BaseSemanticActivityDesign,
  type BaseSemanticActivityShape,
} from "./module02SentenceFoundations";

type TopicLessonId =
  | "topic-questions-1"
  | "topic-questions-2"
  | "topic-questions-3"
  | "topic-questions-4";

type Explanation = Readonly<{
  readonly mainCopyId: string;
  readonly constructionCopyId: string;
  readonly constraintsCopyId: string;
  readonly commonErrorCopyId: string;
  readonly nearestContrastId: string;
}>;

export interface BaseAuthoredDialogue {
  readonly id: string;
  readonly turns: readonly BaseDialogueTurn[];
  readonly practicalOutcomeCopyId: string;
  readonly turnCopy: readonly Readonly<{
    readonly translationCopyId: string;
    readonly purposeCopyId: string;
  }>[];
  readonly outcome: "identity-clarified";
  readonly referentLedger: Readonly<{
    readonly learner: "speaker";
    readonly partner: "yuki";
    readonly country: "italy";
    readonly companion: "tanaka";
  }>;
}

export interface BaseReviewedTranslation {
  readonly target: BaseVisibleTarget;
  readonly japanese: string;
  readonly copyId: string;
  readonly en: string;
  readonly it: string;
  readonly semanticTag: string;
}

export interface BaseTopicQuestionsLesson {
  readonly content: BaseSystemLessonContent | BaseContentLessonContent;
  readonly titleCopyId: string;
  readonly objectiveCopyId: string;
  readonly explanation: Explanation;
  readonly patternCellIds: readonly string[];
  readonly examples: readonly BaseExample[];
  readonly activityDesigns: readonly BaseSemanticActivityDesign[];
  readonly dialogue: BaseAuthoredDialogue | null;
  readonly reviewedTranslations: readonly BaseReviewedTranslation[];
}

export interface BaseTopicQuestionsModule {
  readonly id: "topic-questions";
  readonly lessons: readonly BaseTopicQuestionsLesson[];
  readonly sequence: readonly BaseLessonContent[];
  readonly worldFacts: Readonly<{
    readonly speaker: "university-student";
    readonly tanaka: "nurse";
    readonly yamada: "lawyer";
    readonly satou: "student";
    readonly suzuki: "teacher";
    readonly mari: "doctor";
    readonly yukiCountry: "italy";
    readonly speakerCity: "tokyo";
  }>;
}

export type BaseTopicQuestionsModuleError =
  | "invalid-module-shape"
  | "invalid-lesson-shape"
  | "invalid-lesson-allocation"
  | "invalid-copy"
  | "canonical-depth-failure";

interface ExampleSpec {
  readonly parts: readonly BaseAuthoredTokenPart[];
  readonly frame: string;
  readonly patternCellId: string;
}

interface ActivitySpec {
  readonly prompt: readonly BaseAuthoredTokenPart[];
  readonly answer: readonly BaseAuthoredTokenPart[];
  readonly options: readonly (readonly BaseAuthoredTokenPart[])[];
  readonly correctOptionIndex: 0 | 1;
  readonly promptContextCopyId: string;
  readonly patternCellId: string;
  readonly informationStructure: BaseSemanticActivityDesign["informationStructure"];
  readonly shape: BaseSemanticActivityShape;
  readonly referentId: string | null;
  readonly worldFactId: string | null;
  readonly errorCode: string | null;
}

interface DialogueTurnSpec {
  readonly speakerId: "learner" | "partner";
  readonly parts: readonly BaseAuthoredTokenPart[];
  readonly frame: string;
  readonly patternCellIds: readonly string[];
}

interface LessonSpec {
  readonly lessonId: TopicLessonId;
  readonly contract: "system" | "content";
  readonly prerequisiteLessonIds: readonly string[];
  readonly newLexemeIds: readonly string[];
  readonly reviewLexemeIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly reviewedConceptIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly examples: readonly ExampleSpec[];
  readonly activities: readonly ActivitySpec[];
  readonly dialogue: readonly DialogueTurnSpec[] | null;
  readonly translationSemanticTags: readonly string[];
}

const PARTICLE_CONCEPT_BY_PART: Readonly<
  Partial<Record<BaseAuthoredTokenPart, string>>
> = {
  wa: "topic-wa",
  ga: "focus-subject-ga",
  no: "possessive-no",
  mo: "additive-mo",
  "to-listing": "nominal-listing-to",
  "to-nominal": "nominal-listing-to",
  "to-companion": "companion-to",
  ka: "question-ka",
};

function japanese(target: BaseVisibleTarget): string {
  return target.tokens.map(({ jp }) => jp).join("");
}

function targetFor(
  parts: readonly BaseAuthoredTokenPart[],
  id: string,
  patternCellIds: readonly string[] = [],
): BaseVisibleTarget {
  const particleConcepts = parts.flatMap((part) => {
    const conceptId = PARTICLE_CONCEPT_BY_PART[part];
    if (part === "no") return ["possessive-no", "modifier-before-noun"];
    return conceptId ? [conceptId] : [];
  });
  return authoredVisibleTarget(
    parts,
    id,
    [...new Set(particleConcepts)],
    patternCellIds,
  );
}

function exampleFor(
  lessonId: TopicLessonId,
  spec: ExampleSpec,
  index: number,
): BaseExample {
  const id = `${lessonId}-example-${index + 1}`;
  return deepFreeze({
    ...targetFor(spec.parts, id, [spec.patternCellId]),
    id,
    teachingPurposeCopyId: `${id}-purpose`,
    translationCopy: { copyId: `${id}-translation` },
    predicateAspect: "nominal",
    discourseFrameId: spec.frame,
    interpretationTags: ["present-state"],
  });
}

function authoredDialogue(
  lessonId: TopicLessonId,
  specs: readonly DialogueTurnSpec[],
): Readonly<{
  wrapper: BaseAuthoredDialogue;
  canonical: BaseDialogue;
}> {
  const id = `${lessonId}-clarification-dialogue`;
  const turns = specs.map((spec, index) =>
    deepFreeze({
      ...targetFor(
        spec.parts,
        `${id}-turn-${index + 1}`,
        spec.patternCellIds,
      ),
      speakerId: spec.speakerId,
      predicateAspect: "nominal" as const,
      discourseFrameId: spec.frame,
      interpretationTags: ["present-state" as const],
    }),
  );
  const practicalOutcomeCopyId = `${id}-outcome`;
  return {
    wrapper: deepFreeze({
      id,
      turns,
      practicalOutcomeCopyId,
      turnCopy: turns.map((_, index) => ({
        translationCopyId: `${id}-turn-${index + 1}-translation`,
        purposeCopyId: `${id}-turn-${index + 1}-purpose`,
      })),
      outcome: "identity-clarified",
      referentLedger: {
        learner: "speaker",
        partner: "yuki",
        country: "italy",
        companion: "tanaka",
      },
    }),
    canonical: deepFreeze({ id, turns, practicalOutcomeCopyId }),
  };
}

function topicCuePartFor(entry: ActivitySpec): BaseAuthoredTokenPart {
  if (entry.shape.operation === "order-chunks") return "cue-order";
  if (entry.shape.operation === "identify-audio") return "cue-audio";
  if (entry.shape.operation === "produce-spoken") return "cue-recall";
  if (entry.shape.operation === "diagnose-error") return "cue-error";
  if (entry.informationStructure === "focused-new-subject") return "cue-focus";
  if (entry.informationStructure === "established-topic") return "cue-topic";
  return "cue-context";
}

function activitiesFor(
  spec: LessonSpec,
): Readonly<{
  definitions: readonly BaseActivityDefinition[];
  designs: readonly BaseSemanticActivityDesign[];
  accepted: readonly (readonly [string, BaseVisibleTarget])[];
  prompts: readonly (readonly [string, BaseVisibleTarget])[];
  audio: readonly (readonly [string, BaseVisibleTarget])[];
}> {
  const definitions: BaseActivityDefinition[] = [];
  const designs: BaseSemanticActivityDesign[] = [];
  const accepted: (readonly [string, BaseVisibleTarget])[] = [];
  const prompts: (readonly [string, BaseVisibleTarget])[] = [];
  const audio: (readonly [string, BaseVisibleTarget])[] = [];
  spec.activities.forEach((entry, index) => {
    const shape = entry.shape;
    const id = `${spec.lessonId}-activity-${index + 1}`;
    const optionTargetIds = entry.options.map(
      (_, optionIndex) => `${id}-option-${optionIndex + 1}`,
    );
    const optionTargets = entry.options.map((parts, optionIndex) =>
      targetFor(
        parts,
        optionTargetIds[optionIndex],
        optionIndex === entry.correctOptionIndex
          ? [entry.patternCellId]
          : [],
      ),
    );
    const acceptedAnswerTarget = optionTargets[entry.correctOptionIndex];
    const wrongIndex = entry.correctOptionIndex === 0 ? 1 : 0;
    const promptParts =
      shape.operation === "transform-form"
        ? entry.prompt
        : shape.operation === "diagnose-error"
          ? entry.options[wrongIndex]
          : [topicCuePartFor(entry)];
    const promptTarget = targetFor(promptParts, `${id}-prompt`);
    const answerId = optionTargetIds[entry.correctOptionIndex];
    const targetId =
      shape.category === "listening" ? `${id}-audio` : answerId;
    const options = optionTargets.map(japanese);
    const answer = japanese(acceptedAnswerTarget);
    const assessedConceptIds = [...new Set([
      ...optionTargets.flatMap((target) => [
        ...target.conceptIds,
        ...target.formIds,
      ]),
    ])];
    const assessedLexemeIds = [...new Set([
      ...promptTarget.lexemeIds,
      ...acceptedAnswerTarget.lexemeIds,
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
      assessedConceptIds,
      assessedLexemeIds,
      optionTargetIds,
    });
    designs.push({
      id,
      prompt: japanese(promptTarget),
      options,
      acceptedAnswers: [answer],
      correctOptionIndex: options.length > 0 ? options.indexOf(answer) : null,
      promptTarget,
      acceptedAnswerTarget,
      optionTargetIds,
      optionTargets,
      optionFactStatus: optionTargets.map((_, optionIndex) =>
        optionIndex === entry.correctOptionIndex
          ? "accepted-world"
          : "rejected-context",
      ),
      audioTargetId: shape.category === "listening" ? targetId : null,
      promptContextCopyId: entry.promptContextCopyId,
      reviewed: true,
      informationStructure: entry.informationStructure ?? "not-applicable",
      category: shape.category,
      interactionKind: shape.interactionKind,
      mode: shape.mode,
      operation: shape.operation,
      patternCellId: entry.patternCellId,
      contextTarget: {
        id: `${id}-context`,
        copyId: entry.promptContextCopyId,
        kind:
          entry.informationStructure !== "not-applicable"
            ? "information-structure"
            : shape.contextKind,
        informationStructure: entry.informationStructure ?? "not-applicable",
        revealsAnswer: false,
        audioRequired: shape.operation === "identify-audio",
        recallRequired: shape.operation === "produce-spoken",
      },
      operationEvidence:
        shape.operation === "order-chunks"
          ? {
              kind: shape.operation,
              tileTargetIds: acceptedAnswerTarget.tokens.map(({ id }) => id),
              orderedAnswerTargetId: answerId,
            }
          : shape.operation === "transform-form"
            ? {
                kind: shape.operation,
                sourceTargetId: baseActivityPromptKey(spec.lessonId, id),
              }
            : shape.operation === "diagnose-error"
              ? {
                  kind: shape.operation,
                  candidateTargetId: optionTargetIds[wrongIndex],
                  errorCode: entry.errorCode ?? "context-particle-mismatch",
                }
              : { kind: shape.operation },
      referentId: entry.referentId,
      worldFactId: entry.worldFactId,
    });
    prompts.push([baseActivityPromptKey(spec.lessonId, id), promptTarget]);
    optionTargetIds.forEach((optionTargetId, optionIndex) => {
      accepted.push([optionTargetId, optionTargets[optionIndex]]);
    });
    if (shape.category === "listening") audio.push([targetId, acceptedAnswerTarget]);
  });
  return { definitions, designs, accepted, prompts, audio };
}

function ex(
  parts: readonly BaseAuthoredTokenPart[],
  frame: string,
  patternCellId: string,
): ExampleSpec {
  return { parts, frame, patternCellId };
}

function act(
  prompt: readonly BaseAuthoredTokenPart[],
  answer: readonly BaseAuthoredTokenPart[],
  distractor: readonly BaseAuthoredTokenPart[],
  correctOptionIndex: 0 | 1,
  promptContextCopyId: string,
  patternCellId: string,
  informationStructure: BaseSemanticActivityDesign["informationStructure"],
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
    informationStructure,
    shape,
    referentId,
    worldFactId,
    errorCode,
  };
}

const LESSON_SPECS: readonly LessonSpec[] = deepFreeze([
  {
    lessonId: "topic-questions-1",
    contract: "system",
    prerequisiteLessonIds: ["sentence-foundations-4"],
    newLexemeIds: ["noun-tokyo", "noun-kyoto", "noun-osaka", "noun-toshi"],
    reviewLexemeIds: [
      "noun-watashi",
      "noun-gakusei",
      "noun-sensei",
      "noun-kangoshi",
      "noun-bengoshi",
      "noun-tomodachi",
      "noun-ryuugakusei",
      "noun-kazoku",
      "noun-tanaka",
      "noun-yamada",
      "noun-daigakusei",
      "anchor-shashin",
      "anchor-ie",
      "anchor-kippu",
      "anchor-neko",
    ],
    introducedConceptIds: ["topic-wa"],
    reviewedConceptIds: ["discourse-roles", "affirmative-desu"],
    patternCellIds: ["tq1-topic-comment", "tq1-topic-contrast"],
    examples: [
      ex(["noun-watashi", "wa", "noun-gakusei", "desu"], "self-topic", "tq1-topic-comment"),
      ex(["noun-tanaka", "wa", "noun-tomodachi", "desu"], "known-person-relationship-topic", "tq1-topic-comment"),
      ex(["noun-yamada", "wa", "noun-tomodachi", "desu"], "contrasted-person-relationship-topic", "tq1-topic-contrast"),
      ex(["noun-tokyo", "wa", "noun-toshi", "desu"], "place-topic", "tq1-topic-comment"),
      ex(["noun-kyoto", "wa", "noun-toshi", "desu"], "return-to-kyoto-topic", "tq1-topic-contrast"),
      ex(["noun-osaka", "wa", "noun-toshi", "desu"], "correct-osaka-category", "tq1-topic-contrast"),
      ex(["noun-tomodachi", "wa", "noun-gakusei", "desu"], "relationship-category-topic", "tq1-topic-comment"),
      ex(["noun-kazoku", "wa", "noun-tanaka", "desu"], "family-member-selection-topic", "tq1-topic-comment"),
      ex(["anchor-neko", "wa", "noun-tomodachi", "desu"], "affective-animal-topic", "tq1-topic-comment"),
      ex(["noun-watashi", "wa", "noun-tokyo", "desu"], "speaker-city-answer-topic", "tq1-topic-contrast"),
    ],
    activities: [
      act(["noun-tokyo"], ["anchor-shashin", "wa", "noun-tokyo", "desu"], ["anchor-shashin", "wa", "noun-toshi", "desu"], 0, "topic-questions-1-activity-1-instruction", "tq1-topic-comment", "not-applicable", BASE_MEANING_ACTIVITY_SHAPE),
      act(["noun-kyoto"], ["anchor-shashin", "wa", "noun-kyoto", "desu"], ["anchor-shashin", "comma", "noun-kyoto", "desu"], 0, "topic-questions-1-activity-2-instruction", "tq1-topic-contrast", "not-applicable", BASE_FORM_ACTIVITY_SHAPE),
      act(["noun-osaka"], ["anchor-shashin", "wa", "noun-osaka", "desu"], ["noun-osaka", "wa", "anchor-shashin", "desu"], 1, "topic-questions-1-activity-3-instruction", "tq1-topic-comment", "not-applicable", BASE_ORDERING_ACTIVITY_SHAPE),
      act(["noun-watashi"], ["noun-watashi", "wa", "noun-daigakusei", "desu"], ["noun-watashi", "wa", "noun-kangoshi", "desu"], 0, "topic-questions-1-activity-4-instruction", "tq1-topic-contrast", "not-applicable", BASE_CONTROLLED_ACTIVITY_SHAPE),
      act(["noun-tanaka", "comma", "noun-kangoshi", "desu"], ["noun-tanaka", "wa", "noun-kangoshi", "desu"], ["noun-tanaka", "wa", "noun-bengoshi", "desu"], 1, "topic-questions-1-activity-5-instruction", "tq1-topic-comment", "not-applicable", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      act(["noun-yamada"], ["noun-yamada", "wa", "noun-bengoshi", "desu"], ["noun-yamada", "wa", "noun-kangoshi", "desu"], 1, "topic-questions-1-activity-6-instruction", "tq1-topic-contrast", "not-applicable", BASE_ERROR_ACTIVITY_SHAPE, null, null, "world-fact-mismatch"),
      act(["noun-tomodachi"], ["noun-tomodachi", "wa", "noun-ryuugakusei", "desu"], ["noun-tomodachi", "wa", "noun-sensei", "desu"], 0, "topic-questions-1-activity-7-instruction", "tq1-topic-comment", "not-applicable", BASE_CONTEXT_ACTIVITY_SHAPE),
      act(["anchor-neko"], ["anchor-neko", "wa", "noun-kazoku", "desu"], ["anchor-neko", "wa", "noun-gakusei", "desu"], 1, "topic-questions-1-activity-8-instruction", "tq1-topic-contrast", "not-applicable", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      act(["anchor-ie"], ["anchor-ie", "wa", "noun-tokyo", "desu"], ["anchor-ie", "wa", "noun-osaka", "desu"], 0, "topic-questions-1-activity-9-instruction", "tq1-topic-comment", "not-applicable", BASE_LISTENING_ACTIVITY_SHAPE),
      act(["anchor-kippu"], ["anchor-kippu", "wa", "noun-kyoto", "desu"], ["anchor-kippu", "wa", "noun-tokyo", "desu"], 1, "topic-questions-1-activity-10-instruction", "tq1-topic-contrast", "not-applicable", BASE_SPOKEN_ACTIVITY_SHAPE),
    ],
    dialogue: null,
    translationSemanticTags: [
      "speaker-topic",
      "known-person-topic",
      "person-contrast",
      "city-classification",
      "city-comparison",
      "city-contrast",
      "relationship-topic",
      "photo-group-topic",
      "affective-topic",
      "depicted-place-topic",
    ],
  },
  {
    lessonId: "topic-questions-2",
    contract: "system",
    prerequisiteLessonIds: ["topic-questions-1"],
    newLexemeIds: ["noun-satou", "noun-suzuki", "noun-mari"],
    reviewLexemeIds: [
      "noun-gakusei",
      "noun-sensei",
      "noun-isha",
      "noun-bengoshi",
      "noun-kangoshi",
      "noun-tanaka",
      "noun-yamada",
      "noun-watashi",
      "noun-tomodachi",
      "noun-ryuugakusei",
      "noun-daigakusei",
      "noun-hito",
      "noun-tokyo",
      "noun-kyoto",
      "noun-osaka",
      "noun-toshi",
      "anchor-shashin",
      "anchor-ie",
    ],
    introducedConceptIds: ["focus-subject-ga"],
    reviewedConceptIds: ["topic-wa", "affirmative-desu"],
    patternCellIds: ["tq2-focused-subject", "tq2-wa-ga-contrast"],
    examples: [
      ex(["noun-tanaka", "ga", "noun-kangoshi", "desu"], "open-focus-answer", "tq2-focused-subject"),
      ex(["noun-yamada", "ga", "noun-bengoshi", "desu"], "corrective-focus-answer", "tq2-focused-subject"),
      ex(["noun-tomodachi", "ga", "noun-ryuugakusei", "desu"], "exhaustive-role-selection", "tq2-focused-subject"),
      ex(["noun-gakusei", "wa", "noun-satou", "desu"], "student-role-topic", "tq2-wa-ga-contrast"),
      ex(["noun-sensei", "wa", "noun-suzuki", "desu"], "teacher-role-topic", "tq2-wa-ga-contrast"),
      ex(["noun-isha", "wa", "noun-mari", "desu"], "doctor-role-topic", "tq2-wa-ga-contrast"),
      ex(["noun-hito", "ga", "noun-watashi", "desu"], "photo-person-focus", "tq2-focused-subject"),
      ex(["noun-kazoku", "ga", "noun-tanaka", "desu"], "family-member-focus", "tq2-focused-subject"),
      ex(["noun-watashi", "wa", "noun-daigakusei", "desu"], "self-topic", "tq2-wa-ga-contrast"),
      ex(["noun-kazoku", "wa", "noun-tanaka", "desu"], "family-member-topic", "tq2-wa-ga-contrast"),
    ],
    activities: [
      act(["cue-focus"], ["noun-hito", "ga", "noun-satou", "desu"], ["noun-hito", "ga", "noun-suzuki", "desu"], 1, "topic-questions-2-activity-1-instruction", "tq2-focused-subject", "focused-new-subject", BASE_MEANING_ACTIVITY_SHAPE),
      act(["cue-topic"], ["noun-satou", "wa", "noun-gakusei", "desu"], ["noun-satou", "ga", "noun-gakusei", "desu"], 0, "topic-questions-2-activity-2-instruction", "tq2-wa-ga-contrast", "established-topic", BASE_FORM_ACTIVITY_SHAPE),
      act(["cue-order"], ["noun-mari", "ga", "noun-isha", "desu"], ["noun-isha", "ga", "noun-mari", "desu"], 0, "topic-questions-2-activity-3-instruction", "tq2-focused-subject", "focused-new-subject", BASE_ORDERING_ACTIVITY_SHAPE),
      act(["cue-topic"], ["noun-mari", "wa", "noun-isha", "desu"], ["noun-suzuki", "ga", "noun-isha", "desu"], 1, "topic-questions-2-activity-4-instruction", "tq2-wa-ga-contrast", "established-topic", BASE_CONTROLLED_ACTIVITY_SHAPE),
      act(["noun-suzuki", "comma", "noun-sensei", "desu"], ["noun-suzuki", "ga", "noun-sensei", "desu"], ["noun-satou", "ga", "noun-sensei", "desu"], 0, "topic-questions-2-activity-5-instruction", "tq2-focused-subject", "focused-new-subject", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      act(["cue-error"], ["noun-suzuki", "wa", "noun-sensei", "desu"], ["noun-mari", "ga", "noun-sensei", "desu"], 1, "topic-questions-2-activity-6-instruction", "tq2-wa-ga-contrast", "established-topic", BASE_ERROR_ACTIVITY_SHAPE, null, null, "world-fact-mismatch"),
      act(["cue-context"], ["noun-kangoshi", "wa", "noun-tanaka", "desu"], ["noun-kangoshi", "ga", "noun-suzuki", "desu"], 1, "topic-questions-2-activity-7-instruction", "tq2-wa-ga-contrast", "established-topic", BASE_CONTEXT_ACTIVITY_SHAPE),
      act(["cue-context"], ["noun-bengoshi", "wa", "noun-yamada", "desu"], ["noun-bengoshi", "ga", "noun-mari", "desu"], 0, "topic-questions-2-activity-8-instruction", "tq2-wa-ga-contrast", "established-topic", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      act(["cue-audio"], ["noun-ryuugakusei", "wa", "noun-tomodachi", "desu"], ["noun-ryuugakusei", "ga", "noun-satou", "desu"], 1, "topic-questions-2-activity-9-instruction", "tq2-wa-ga-contrast", "established-topic", BASE_LISTENING_ACTIVITY_SHAPE),
      act(["noun-watashi"], ["noun-watashi", "ga", "noun-daigakusei", "desu"], ["noun-watashi", "wa", "noun-gakusei", "desu"], 0, "topic-questions-2-activity-10-instruction", "tq2-focused-subject", "focused-new-subject", BASE_SPOKEN_ACTIVITY_SHAPE),
    ],
    dialogue: null,
    translationSemanticTags: [
      "focused-nurse",
      "focused-lawyer",
      "focused-friend",
      "student-role-topic",
      "teacher-role-topic",
      "doctor-role-topic",
      "focused-photo-person",
      "focused-family-member",
      "speaker-topic",
      "family-topic",
    ],
  },
  {
    lessonId: "topic-questions-3",
    contract: "system",
    prerequisiteLessonIds: ["topic-questions-2"],
    newLexemeIds: [
      "noun-chichi",
      "noun-haha",
      "noun-ani",
      "noun-ane",
      "noun-otousan",
      "noun-okaasan",
    ],
    reviewLexemeIds: [
      "noun-watashi",
      "noun-tanaka",
      "noun-yamada",
      "noun-sensei",
      "noun-isha",
      "noun-gakusei",
      "noun-bengoshi",
      "noun-satou",
      "noun-suzuki",
      "noun-ryuugakusei",
    ],
    introducedConceptIds: ["possessive-no", "modifier-before-noun", "additive-mo"],
    reviewedConceptIds: ["topic-wa", "affirmative-desu"],
    patternCellIds: ["tq3-attributive-no", "tq3-additive-mo"],
    examples: [
      ex(["noun-watashi", "no", "noun-chichi", "desu"], "family-identification", "tq3-attributive-no"),
      ex(["noun-watashi", "no", "noun-haha", "desu"], "family-identification", "tq3-attributive-no"),
      ex(["noun-watashi", "no", "noun-ani", "desu"], "family-identification", "tq3-attributive-no"),
      ex(["noun-watashi", "no", "noun-ane", "desu"], "family-identification", "tq3-attributive-no"),
      ex(["noun-tanaka", "no", "noun-otousan", "desu"], "other-person-father", "tq3-attributive-no"),
      ex(["noun-yamada", "no", "noun-okaasan", "desu"], "other-person-mother", "tq3-attributive-no"),
      ex(["noun-chichi", "mo", "noun-sensei", "desu"], "addition", "tq3-additive-mo"),
      ex(["noun-haha", "mo", "noun-isha", "desu"], "addition", "tq3-additive-mo"),
      ex(["noun-ani", "mo", "noun-gakusei", "desu"], "addition", "tq3-additive-mo"),
      ex(["noun-ane", "mo", "noun-bengoshi", "desu"], "addition", "tq3-additive-mo"),
    ],
    activities: [
      act(["noun-tanaka"], ["noun-tanaka", "no", "noun-otousan", "mo", "noun-sensei", "desu"], ["noun-tanaka", "no", "noun-otousan", "wa", "noun-ryuugakusei", "desu"], 0, "topic-questions-3-activity-1-instruction", "tq3-attributive-no", "not-applicable", BASE_MEANING_ACTIVITY_SHAPE),
      act(["noun-yamada"], ["noun-yamada", "no", "noun-okaasan", "mo", "noun-isha", "desu"], ["noun-yamada", "no", "noun-okaasan", "wa", "noun-isha", "desu"], 1, "topic-questions-3-activity-2-instruction", "tq3-attributive-no", "not-applicable", BASE_FORM_ACTIVITY_SHAPE),
      act(["noun-watashi"], ["noun-watashi", "no", "noun-ani", "mo", "noun-gakusei", "desu"], ["noun-ani", "no", "noun-watashi", "mo", "noun-gakusei", "desu"], 1, "topic-questions-3-activity-3-instruction", "tq3-attributive-no", "not-applicable", BASE_ORDERING_ACTIVITY_SHAPE),
      act(["noun-watashi"], ["noun-watashi", "no", "noun-ane", "mo", "noun-bengoshi", "desu"], ["noun-ane", "wa", "noun-bengoshi", "desu"], 0, "topic-questions-3-activity-4-instruction", "tq3-attributive-no", "not-applicable", BASE_CONTROLLED_ACTIVITY_SHAPE),
      act(["noun-watashi", "no", "noun-chichi", "wa", "noun-sensei", "desu"], ["noun-watashi", "no", "noun-chichi", "mo", "noun-sensei", "desu"], ["noun-watashi", "no", "noun-chichi", "ga", "noun-sensei", "desu"], 0, "topic-questions-3-activity-5-instruction", "tq3-additive-mo", "not-applicable", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      act(["cue-error"], ["noun-watashi", "no", "noun-haha", "mo", "noun-isha", "desu"], ["noun-watashi", "no", "noun-haha", "ga", "noun-isha", "desu"], 1, "topic-questions-3-activity-6-instruction", "tq3-additive-mo", "not-applicable", BASE_ERROR_ACTIVITY_SHAPE, null, null, "additive-particle-mismatch"),
      act(["cue-context"], ["noun-otousan", "mo", "noun-sensei", "desu"], ["noun-chichi", "ga", "noun-sensei", "desu"], 0, "topic-questions-3-activity-7-instruction", "tq3-additive-mo", "not-applicable", BASE_CONTEXT_ACTIVITY_SHAPE),
      act(["cue-context"], ["noun-okaasan", "mo", "noun-isha", "desu"], ["noun-okaasan", "wa", "noun-isha", "desu"], 1, "topic-questions-3-activity-8-instruction", "tq3-additive-mo", "not-applicable", BASE_RETRIEVAL_ACTIVITY_SHAPE),
      act(["cue-audio"], ["noun-satou", "no", "noun-otousan", "desu"], ["noun-satou", "no", "noun-otousan", "wa", "noun-ryuugakusei", "desu"], 1, "topic-questions-3-activity-9-instruction", "tq3-attributive-no", "not-applicable", BASE_LISTENING_ACTIVITY_SHAPE),
      act(["cue-recall"], ["noun-suzuki", "no", "noun-okaasan", "desu"], ["noun-suzuki", "ga", "noun-okaasan", "desu"], 0, "topic-questions-3-activity-10-instruction", "tq3-attributive-no", "not-applicable", BASE_SPOKEN_ACTIVITY_SHAPE),
    ],
    dialogue: null,
    translationSemanticTags: [
      "speaker-father",
      "speaker-mother",
      "speaker-brother",
      "speaker-sister",
      "other-father",
      "other-mother",
      "additive-father",
      "additive-mother",
      "additive-brother",
      "additive-sister",
    ],
  },
  {
    lessonId: "topic-questions-4",
    contract: "content",
    prerequisiteLessonIds: ["topic-questions-3"],
    newLexemeIds: [
      "noun-namae",
      "noun-kuni",
      "noun-amerika",
      "noun-itaria",
      "noun-dare",
      "noun-nan",
      "expression-hai",
      "expression-iie",
      "expression-sou",
      "noun-yuki",
    ],
    reviewLexemeIds: ["noun-tanaka", "noun-tomodachi", "noun-hito"],
    introducedConceptIds: ["nominal-listing-to", "companion-to", "question-ka"],
    reviewedConceptIds: ["topic-wa", "possessive-no", "additive-mo", "affirmative-desu"],
    patternCellIds: ["tq4-question-answer", "tq4-nominal-list", "tq4-companion"],
    examples: [
      ex(["noun-dare", "desu", "ka"], "identity-question", "tq4-question-answer"),
      ex(["noun-amerika", "desu", "ka"], "country-confirmation-fragment", "tq4-question-answer"),
      ex(["noun-namae", "wa", "noun-yuki", "desu", "ka"], "name-confirmation", "tq4-question-answer"),
      ex(["noun-amerika", "to-listing", "noun-itaria", "desu"], "country-list", "tq4-nominal-list"),
      ex(["noun-namae", "to-nominal", "noun-kuni"], "requested-details", "tq4-nominal-list"),
      ex(["noun-tanaka", "to-companion", "noun-tomodachi", "desu"], "companion-relation", "tq4-companion"),
      ex(["expression-hai", "comma", "noun-yuki", "desu"], "name-confirmation-answer", "tq4-question-answer"),
      ex(["expression-iie", "comma", "noun-itaria", "desu"], "correction", "tq4-question-answer"),
    ],
    activities: [
      act(["cue-context"], ["noun-namae", "wa", "noun-nan", "desu", "ka"], ["noun-kuni", "wa", "noun-itaria", "desu", "ka"], 1, "topic-questions-4-activity-1-instruction", "tq4-question-answer", "not-applicable", BASE_MEANING_ACTIVITY_SHAPE),
      act(["noun-kuni"], ["noun-kuni", "wa", "noun-amerika", "desu", "ka"], ["noun-kuni", "wa", "noun-amerika", "desu"], 1, "topic-questions-4-activity-2-instruction", "tq4-question-answer", "not-applicable", BASE_FORM_ACTIVITY_SHAPE),
      act(["noun-amerika"], ["noun-amerika", "to-listing", "noun-itaria"], ["noun-amerika", "noun-itaria", "to-listing"], 0, "topic-questions-4-activity-3-instruction", "tq4-nominal-list", "not-applicable", BASE_ORDERING_ACTIVITY_SHAPE),
      act(["noun-namae"], ["noun-kuni", "to-nominal", "noun-namae"], ["noun-kuni", "no", "noun-namae"], 0, "topic-questions-4-activity-4-instruction", "tq4-nominal-list", "not-applicable", BASE_CONTROLLED_ACTIVITY_SHAPE),
      act(["expression-sou", "desu"], ["expression-sou", "desu", "ka"], ["noun-dare", "no", "noun-tomodachi", "desu", "ka"], 1, "topic-questions-4-activity-5-instruction", "tq4-question-answer", "not-applicable", BASE_TRANSFORMATION_ACTIVITY_SHAPE),
      act(["cue-error"], ["expression-hai", "comma", "noun-itaria", "desu"], ["expression-hai", "comma", "noun-amerika", "desu"], 0, "topic-questions-4-activity-6-instruction", "tq4-question-answer", "not-applicable", BASE_ERROR_ACTIVITY_SHAPE, "yuki", "yuki-country", "world-fact-mismatch"),
      act(["cue-context"], ["expression-iie", "comma", "noun-kuni", "wa", "noun-itaria", "desu"], ["expression-hai", "comma", "noun-kuni", "wa", "noun-amerika", "desu"], 1, "topic-questions-4-activity-7-instruction", "tq4-question-answer", "not-applicable", BASE_CONTEXT_ACTIVITY_SHAPE, "yuki", "yuki-country"),
      act(["cue-context"], ["noun-yuki", "to-companion", "noun-tomodachi", "desu", "ka"], ["noun-yuki", "wa", "noun-tomodachi", "desu"], 0, "topic-questions-4-activity-8-instruction", "tq4-companion", "not-applicable", BASE_RETRIEVAL_ACTIVITY_SHAPE, "learner", null),
      act(["noun-yuki"], ["noun-yuki", "to-companion", "noun-tomodachi", "desu"], ["noun-yuki", "no", "noun-tomodachi", "desu"], 0, "topic-questions-4-activity-9-instruction", "tq4-companion", "not-applicable", BASE_LISTENING_ACTIVITY_SHAPE),
      act(["noun-dare"], ["noun-dare", "to-companion", "noun-tomodachi", "desu", "ka"], ["noun-dare", "wa", "noun-tomodachi", "desu"], 1, "topic-questions-4-activity-10-instruction", "tq4-question-answer", "not-applicable", BASE_SPOKEN_ACTIVITY_SHAPE),
    ],
    dialogue: [
      { speakerId: "learner", parts: ["noun-namae", "wa", "noun-nan", "desu", "ka"], frame: "open-name-question", patternCellIds: ["tq4-question-answer"] },
      { speakerId: "partner", parts: ["noun-yuki", "desu"], frame: "identity-answer", patternCellIds: ["tq4-question-answer"] },
      { speakerId: "learner", parts: ["noun-kuni", "wa", "noun-itaria", "desu", "ka"], frame: "country-clarification", patternCellIds: ["tq4-question-answer"] },
      { speakerId: "partner", parts: ["expression-hai", "comma", "noun-itaria", "desu"], frame: "country-confirmation", patternCellIds: ["tq4-question-answer"] },
      { speakerId: "learner", parts: ["noun-tanaka", "to-companion", "noun-tomodachi", "desu", "ka"], frame: "relationship-check", patternCellIds: ["tq4-question-answer", "tq4-companion"] },
      { speakerId: "partner", parts: ["expression-hai", "comma", "expression-sou", "desu"], frame: "closing-confirmation", patternCellIds: ["tq4-question-answer"] },
    ],
    translationSemanticTags: [
      "identity-question",
      "country-confirmation",
      "name-question",
      "country-list",
      "requested-fields",
      "companion-relation",
      "affirmative-confirmation",
      "negative-correction",
    ],
  },
]);

export const module03ConceptIds: readonly string[] = deepFreeze([
  "topic-wa",
  "focus-subject-ga",
  "possessive-no",
  "modifier-before-noun",
  "additive-mo",
  "nominal-listing-to",
  "companion-to",
  "question-ka",
]);

const exampleEntries: (readonly [string, BaseExample])[] = [];
const dialogueEntries: (readonly [string, BaseDialogue])[] = [];
const acceptedEntries: (readonly [string, BaseVisibleTarget])[] = [];
const promptEntries: (readonly [string, BaseVisibleTarget])[] = [];
const audioEntries: (readonly [string, BaseVisibleTarget])[] = [];
const patternEntries: (readonly [string, readonly string[]])[] = [];

const RAW_TOPIC_LESSONS: readonly BaseTopicQuestionsLesson[] = LESSON_SPECS.map(
  (spec) => {
    const examples = spec.examples.map((entry, index) =>
      exampleFor(spec.lessonId, entry, index),
    );
    examples.forEach((example) => exampleEntries.push([example.id, example]));
    const activities = activitiesFor(spec);
    acceptedEntries.push(...activities.accepted);
    promptEntries.push(...activities.prompts);
    audioEntries.push(...activities.audio);
    patternEntries.push([spec.lessonId, spec.patternCellIds]);
    const dialogue = spec.dialogue
      ? authoredDialogue(spec.lessonId, spec.dialogue)
      : null;
    if (dialogue) dialogueEntries.push([dialogue.canonical.id, dialogue.canonical]);
    const explanation: Explanation = {
      mainCopyId: `${spec.lessonId}-explanation-main`,
      constructionCopyId: `${spec.lessonId}-explanation-construction`,
      constraintsCopyId: `${spec.lessonId}-explanation-constraints`,
      commonErrorCopyId: `${spec.lessonId}-explanation-common-error`,
      nearestContrastId: `${spec.lessonId}-explanation-nearest-contrast`,
    };
    const content = defineBaseLessonContent({
      lessonId: spec.lessonId,
      contract: spec.contract,
      prerequisiteLessonIds: spec.prerequisiteLessonIds,
      activities: activities.definitions,
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
      dialogueId: dialogue?.canonical.id ?? null,
      referenceSnapshotIds: ["sentence-anatomy", "particle-atlas"],
      interactive: dialogue !== null,
      retrievedSystemIds: [],
    } as BaseSystemLessonContent | BaseContentLessonContent);
    const reviewedTranslations: readonly BaseReviewedTranslation[] = examples.map(
      (example, index) => {
        const copyId =
          "copyId" in example.translationCopy
            ? example.translationCopy.copyId
            : "";
        return deepFreeze({
          target: example,
          japanese: japanese(example),
          copyId,
          en: baseNavigationCopyEn.content[copyId] ?? "",
          it: baseNavigationCopyIt.content[copyId] ?? "",
          semanticTag: spec.translationSemanticTags[index] ?? "",
        });
      },
    );
    return deepFreeze({
      content,
      titleCopyId: `${spec.lessonId}-title`,
      objectiveCopyId: `${spec.lessonId}-objective`,
      explanation,
      patternCellIds: spec.patternCellIds,
      examples,
      activityDesigns: activities.designs,
      dialogue: dialogue?.wrapper ?? null,
      reviewedTranslations,
    });
  },
);

export const BASE_TOPIC_QUESTIONS_LESSONS: readonly (
  BaseSystemLessonContent | BaseContentLessonContent
)[] = deepFreeze(RAW_TOPIC_LESSONS.map(({ content }) => content));

export const BASE_TOPIC_QUESTIONS_EXAMPLES: readonly BaseExample[] = deepFreeze(
  RAW_TOPIC_LESSONS.flatMap(({ examples }) => examples),
);

const allExampleEntries = [
  ...BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS.examples.entries(),
  ...exampleEntries,
] as readonly (readonly [string, BaseExample])[];
const allDialogueEntries = [
  ...BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS.dialogues.entries(),
  ...dialogueEntries,
] as readonly (readonly [string, BaseDialogue])[];
const allAcceptedEntries = [
  ...BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS.acceptedAnswerTargets.entries(),
  ...acceptedEntries,
] as readonly (readonly [string, BaseVisibleTarget])[];
const allPromptEntries = [
  ...BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS.activityPromptTargets.entries(),
  ...promptEntries,
] as readonly (readonly [string, BaseVisibleTarget])[];
const allAudioEntries = [
  ...BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS.audioTargets.entries(),
  ...audioEntries,
] as readonly (readonly [string, BaseVisibleTarget])[];
const allPatternEntries = [
  ...BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS.patternCellIdsByLesson.entries(),
  ...patternEntries,
] as readonly (readonly [string, readonly string[]])[];

export const BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS: BaseValidationCatalogs =
  deepFreeze({
    lexemes: BASE_LEXEME_BY_ID,
    concepts: BASE_CONCEPT_BY_ID,
    examples: immutableReadonlyMap(allExampleEntries),
    dialogues: immutableReadonlyMap(allDialogueEntries),
    audioTargets: immutableReadonlyMap(allAudioEntries),
    acceptedAnswerTargets: immutableReadonlyMap(allAcceptedEntries),
    activityPromptTargets: immutableReadonlyMap(allPromptEntries),
    copyIds: immutableReadonlySet(Object.keys(baseNavigationCopyEn.content)),
    contrastMapIds: immutableReadonlySet([]),
    referenceSnapshots: BASE_REFERENCE_SNAPSHOT_BY_ID,
    patternCellIds: immutableReadonlySet(
      allPatternEntries.flatMap(([, cells]) => cells),
    ),
    patternCellIdsByLesson: immutableReadonlyMap(allPatternEntries),
    systems: BASE_RETRIEVAL_SYSTEM_BY_ID,
  });

const RAW_BASE_TOPIC_QUESTIONS_MODULE: BaseTopicQuestionsModule = {
  id: "topic-questions",
  lessons: RAW_TOPIC_LESSONS,
  sequence: [...BASE_SENTENCE_FOUNDATIONS_LESSONS, ...BASE_TOPIC_QUESTIONS_LESSONS],
  worldFacts: {
    speaker: "university-student",
    tanaka: "nurse",
    yamada: "lawyer",
    satou: "student",
    suzuki: "teacher",
    mari: "doctor",
    yukiCountry: "italy",
    speakerCity: "tokyo",
  },
};

function denseArray(value: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    return undefined;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.keys(descriptors).length !== value.length + 1) return undefined;
  const dense = value.every((_, index) => {
    const descriptor = descriptors[String(index)];
    return descriptor !== undefined && "value" in descriptor;
  });
  return dense ? value : undefined;
}

function plainRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  if (Object.getPrototypeOf(value) !== Object.prototype) return undefined;
  if (Object.getOwnPropertySymbols(value).length > 0) return undefined;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) {
    return undefined;
  }
  return value as Readonly<Record<string, unknown>>;
}

function targetParticleSenses(value: unknown): readonly string[] | undefined {
  const target = plainRecord(value);
  const tokens = target ? denseArray(target.tokens) : undefined;
  if (!tokens) return undefined;
  const senses: string[] = [];
  for (const token of tokens) {
    const record = plainRecord(token);
    if (!record) return undefined;
    if (record.kind !== "particle") continue;
    const source = plainRecord(record.source);
    if (!source || typeof source.referenceId !== "string") return undefined;
    senses.push(source.referenceId);
  }
  return senses;
}

function validatesParticleCellRealization(lessonValue: unknown): boolean {
  const lesson = plainRecord(lessonValue);
  const designs = lesson ? denseArray(lesson.activityDesigns) : undefined;
  if (!designs) return false;
  for (const rawDesign of designs) {
    const design = plainRecord(rawDesign);
    const accepted = design ? plainRecord(design.acceptedAnswerTarget) : undefined;
    const senses = accepted ? targetParticleSenses(accepted) : undefined;
    const lexemeIds = accepted ? denseArray(accepted.lexemeIds) : undefined;
    if (
      !design ||
      !accepted ||
      !senses ||
      !lexemeIds ||
      typeof design.patternCellId !== "string"
    ) {
      return false;
    }
    const cell = design.patternCellId;
    const realized =
      cell.startsWith("tq1-")
        ? senses.includes("topic-wa")
        : cell === "tq2-focused-subject"
          ? senses.includes("focus-subject-ga")
          : cell === "tq2-wa-ga-contrast"
            ? senses.includes("topic-wa")
            : cell === "tq3-attributive-no"
              ? senses.includes("possessive-attributive-no")
              : cell === "tq3-additive-mo"
                ? senses.includes("additive-mo")
                : cell === "tq4-nominal-list"
                  ? senses.includes("listing-to") || senses.includes("nominal-to")
                  : cell === "tq4-companion"
                    ? senses.includes("companion-to")
                    : cell === "tq4-question-answer"
                      ? senses.includes("question-ka") ||
                        lexemeIds.includes("expression-hai") ||
                        lexemeIds.includes("expression-iie")
                      : false;
    if (!realized) return false;
  }
  return true;
}

export function validateBaseTopicQuestionsModule(
  value: unknown,
): Readonly<{
  readonly ok: boolean;
  readonly errors: readonly BaseTopicQuestionsModuleError[];
}> {
  const module = plainRecord(value);
  if (!module || module.id !== "topic-questions") {
    return { ok: false, errors: ["invalid-module-shape"] };
  }
  const errors = new Set<BaseTopicQuestionsModuleError>();
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
    worldFacts.satou !== "student" ||
    worldFacts.suzuki !== "teacher" ||
    worldFacts.mari !== "doctor" ||
    worldFacts.yukiCountry !== "italy"
    || worldFacts.speakerCity !== "tokyo"
  ) {
    errors.add("invalid-module-shape");
  }
  const expected = LESSON_SPECS.map(({ lessonId }) => lessonId);
  if (
    lessons.length !== expected.length ||
    lessons.some((lesson, index) => {
      const record = plainRecord(lesson);
      const content = record ? plainRecord(record.content) : undefined;
      return !content || content.lessonId !== expected[index];
    })
  ) {
    errors.add("invalid-lesson-allocation");
  }
  for (const lesson of lessons) {
    const record = plainRecord(lesson);
    if (!record?.content) {
      errors.add("invalid-lesson-shape");
      continue;
    }
    const sequence = denseArray(module.sequence);
    if (
      !sequence ||
      validateFirstTeachOrder(
        sequence,
        BASE_FIRST_TEACH_OWNERS,
        BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
      ).length > 0
    ) {
      errors.add("canonical-depth-failure");
    }
    if (
      validateBaseLessonDepth(
        record.content,
        BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
      ).length > 0
    ) {
      errors.add("canonical-depth-failure");
    }
    if (
      !validatePublishedSemanticActivities(record) ||
      !validatesParticleCellRealization(record)
    ) {
      errors.add("invalid-lesson-shape");
    }
  }
  const requiredCopyIds = RAW_TOPIC_LESSONS.flatMap((lesson) => [
    lesson.titleCopyId,
    lesson.objectiveCopyId,
    lesson.content.recapCopyId,
    ...Object.values(lesson.explanation),
    ...lesson.examples.flatMap((example) => [
      example.teachingPurposeCopyId,
      "copyId" in example.translationCopy ? example.translationCopy.copyId : "",
    ]),
    ...lesson.activityDesigns.map(({ promptContextCopyId }) => promptContextCopyId),
    ...lesson.content.activities.flatMap((activity) => [
      activity.instructionCopyId,
      activity.acceptedFeedbackCopyId,
      activity.retryFeedbackCopyId,
    ]),
    ...(lesson.dialogue
      ? [
          lesson.dialogue.practicalOutcomeCopyId,
          ...lesson.dialogue.turnCopy.flatMap(({ translationCopyId, purposeCopyId }) => [
            translationCopyId,
            purposeCopyId,
          ]),
        ]
      : []),
  ]);
  if (
    requiredCopyIds.some((id) => {
      const en = baseNavigationCopyEn.content[id];
      const it = baseNavigationCopyIt.content[id];
      return (
        id.length === 0 ||
        typeof en !== "string" ||
        en.trim().length === 0 ||
        typeof it !== "string" ||
        it.trim().length === 0
      );
    })
  ) {
    errors.add("invalid-copy");
  }
  return { ok: errors.size === 0, errors: [...errors] };
}

const moduleValidation = validateBaseTopicQuestionsModule(
  RAW_BASE_TOPIC_QUESTIONS_MODULE,
);
if (!moduleValidation.ok) {
  const details = BASE_TOPIC_QUESTIONS_LESSONS.flatMap((lesson) =>
    validateBaseLessonDepth(lesson, BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS),
  );
  const publicationDetails = RAW_TOPIC_LESSONS
    .filter(
      (lesson) =>
        !validatePublishedSemanticActivities(lesson) ||
        !validatesParticleCellRealization(lesson),
    )
    .map(({ content }) => content.lessonId);
  throw new Error(
    `Invalid Base topic-questions module: ${moduleValidation.errors.join(", ")} ${JSON.stringify(details)} ${JSON.stringify(publicationDetails)}`,
  );
}

export const BASE_TOPIC_QUESTIONS_MODULE: BaseTopicQuestionsModule = deepFreeze(
  RAW_BASE_TOPIC_QUESTIONS_MODULE,
);

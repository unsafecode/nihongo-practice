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
  BASE_SENTENCE_FOUNDATIONS_LESSONS,
  BASE_SENTENCE_FOUNDATIONS_VALIDATION_CATALOGS,
  type BaseAuthoredTokenPart,
  type BaseSemanticActivityDesign,
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
  readonly conceptIds: readonly string[];
}

interface ActivitySpec {
  readonly prompt: readonly BaseAuthoredTokenPart[];
  readonly answer: readonly BaseAuthoredTokenPart[];
  readonly options: readonly (readonly BaseAuthoredTokenPart[])[];
  readonly conceptIds: readonly string[];
  readonly correctOptionIndex: 0 | 1;
  readonly promptContextCopyId: string;
  readonly patternCellId: string;
  readonly informationStructure: BaseSemanticActivityDesign["informationStructure"];
}

interface DialogueTurnSpec {
  readonly speakerId: "learner" | "partner";
  readonly parts: readonly BaseAuthoredTokenPart[];
  readonly conceptIds: readonly string[];
  readonly frame: string;
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

const ACTIVITY_SHAPES: readonly Readonly<{
  category: BaseActivityDefinition["category"];
  interactionKind: BaseActivityDefinition["interactionKind"];
  mode: BaseActivityDefinition["mode"];
  operation: BaseActivityDefinition["operation"];
}>[] = deepFreeze([
  { category: "meaning-comprehension", interactionKind: "choice", mode: "non-spoken", operation: "recognize-meaning" },
  { category: "form-function-discrimination", interactionKind: "choice", mode: "non-spoken", operation: "discriminate-form-function" },
  { category: "ordering", interactionKind: "tile-ordering", mode: "non-spoken", operation: "order-chunks" },
  { category: "controlled-production", interactionKind: "completion", mode: "non-spoken", operation: "produce-controlled" },
  { category: "transformation", interactionKind: "transformation", mode: "non-spoken", operation: "transform-form" },
  { category: "error-diagnosis", interactionKind: "choice", mode: "non-spoken", operation: "diagnose-error" },
  { category: "contextual-response", interactionKind: "constrained-construction", mode: "non-spoken", operation: "select-contextual-response" },
  { category: "cumulative-retrieval", interactionKind: "completion", mode: "non-spoken", operation: "retrieve-cumulative" },
  { category: "listening", interactionKind: "listening", mode: "audio", operation: "identify-audio" },
  { category: "spoken", interactionKind: "spoken", mode: "audio", operation: "produce-spoken" },
]);

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
  declaredConceptIds: readonly string[],
  patternCellId: string,
): BaseVisibleTarget {
  const particleConcepts = parts.flatMap((part) => {
    const conceptId = PARTICLE_CONCEPT_BY_PART[part];
    if (part === "no") return ["possessive-no", "modifier-before-noun"];
    return conceptId ? [conceptId] : [];
  });
  return authoredVisibleTarget(
    parts,
    id,
    [...new Set([...declaredConceptIds, ...particleConcepts])],
    [patternCellId],
  );
}

function exampleFor(
  lessonId: TopicLessonId,
  spec: ExampleSpec,
  index: number,
): BaseExample {
  const id = `${lessonId}-example-${index + 1}`;
  return deepFreeze({
    ...targetFor(spec.parts, id, spec.conceptIds, spec.patternCellId),
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
      ...targetFor(spec.parts, `${id}-turn-${index + 1}`, spec.conceptIds, "tq4-question-answer"),
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
    const shape = ACTIVITY_SHAPES[index];
    const id = `${spec.lessonId}-activity-${index + 1}`;
    const cell = spec.patternCellIds[index % spec.patternCellIds.length];
    const promptTarget = targetFor(entry.prompt, `${id}-prompt`, entry.conceptIds, cell);
    const optionTargetIds = entry.options.map(
      (_, optionIndex) => `${id}-option-${optionIndex + 1}`,
    );
    const optionTargets = entry.options.map((parts, optionIndex) =>
      targetFor(parts, optionTargetIds[optionIndex], entry.conceptIds, cell),
    );
    const acceptedAnswerTarget = optionTargets[entry.correctOptionIndex];
    const answerId = optionTargetIds[entry.correctOptionIndex];
    const targetId =
      shape.category === "listening" ? `${id}-audio` : answerId;
    const options = entry.options.map((parts, optionIndex) =>
      japanese(targetFor(parts, `${id}-option-${optionIndex + 1}`, entry.conceptIds, cell)),
    );
    const answer = japanese(acceptedAnswerTarget);
    const assessedConceptIds = [...new Set([
      ...promptTarget.conceptIds,
      ...acceptedAnswerTarget.conceptIds,
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
      promptContextCopyId: `${id}-instruction`,
      reviewed: true,
      informationStructure: entry.informationStructure ?? "not-applicable",
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
  conceptIds: readonly string[] = [],
): ExampleSpec {
  return { parts, frame, patternCellId, conceptIds };
}

function act(
  prompt: readonly BaseAuthoredTokenPart[],
  answer: readonly BaseAuthoredTokenPart[],
  distractor: readonly BaseAuthoredTokenPart[],
  conceptIds: readonly string[],
  answerFirst: boolean,
  promptContextCopyId: string,
  patternCellId: string,
  informationStructure: BaseSemanticActivityDesign["informationStructure"] = "not-applicable",
): ActivitySpec {
  return {
    prompt,
    answer,
    options: answerFirst ? [answer, distractor] : [distractor, answer],
    conceptIds,
    correctOptionIndex: answerFirst ? 0 : 1,
    promptContextCopyId,
    patternCellId,
    informationStructure,
  };
}

const TOPIC_WA = ["topic-wa"] as const;
const FOCUS_GA = ["focus-subject-ga"] as const;
const NO_CONCEPTS = ["possessive-no", "modifier-before-noun"] as const;
const MO_CONCEPTS = ["additive-mo"] as const;
const TO_CONCEPTS = ["nominal-listing-to"] as const;
const COMPANION_CONCEPTS = ["companion-to"] as const;
const QUESTION_CONCEPTS = ["question-ka"] as const;

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
      act(["noun-tokyo"], ["anchor-shashin", "wa", "noun-tokyo", "desu"], ["anchor-shashin", "wa", "noun-toshi", "desu"], TOPIC_WA, true, "topic-questions-1-activity-1-context", "tq1-topic-comment", "not-applicable"),
      act(["noun-kyoto"], ["anchor-shashin", "wa", "noun-kyoto", "desu"], ["anchor-shashin", "wa", "noun-kazoku", "desu"], TOPIC_WA, false, "topic-questions-1-activity-2-context", "tq1-topic-contrast", "not-applicable"),
      act(["noun-osaka"], ["anchor-shashin", "wa", "noun-osaka", "desu"], ["anchor-shashin", "wa", "anchor-neko", "desu"], TOPIC_WA, true, "topic-questions-1-activity-3-context", "tq1-topic-comment", "not-applicable"),
      act(["noun-watashi"], ["noun-watashi", "wa", "noun-daigakusei", "desu"], ["noun-watashi", "wa", "noun-kangoshi", "desu"], TOPIC_WA, false, "topic-questions-1-activity-4-context", "tq1-topic-contrast", "not-applicable"),
      act(["noun-tanaka"], ["noun-tanaka", "wa", "noun-kangoshi", "desu"], ["noun-tanaka", "wa", "noun-bengoshi", "desu"], TOPIC_WA, true, "topic-questions-1-activity-5-context", "tq1-topic-comment", "not-applicable"),
      act(["noun-yamada"], ["noun-yamada", "wa", "noun-bengoshi", "desu"], ["noun-yamada", "wa", "noun-kangoshi", "desu"], TOPIC_WA, false, "topic-questions-1-activity-6-context", "tq1-topic-contrast", "not-applicable"),
      act(["noun-tomodachi"], ["noun-tomodachi", "wa", "noun-ryuugakusei", "desu"], ["noun-tomodachi", "wa", "noun-sensei", "desu"], TOPIC_WA, true, "topic-questions-1-activity-7-context", "tq1-topic-comment", "not-applicable"),
      act(["anchor-neko"], ["anchor-neko", "wa", "noun-kazoku", "desu"], ["anchor-neko", "wa", "noun-gakusei", "desu"], TOPIC_WA, false, "topic-questions-1-activity-8-context", "tq1-topic-contrast", "not-applicable"),
      act(["anchor-ie"], ["anchor-ie", "wa", "noun-tokyo", "desu"], ["anchor-ie", "wa", "noun-osaka", "desu"], TOPIC_WA, true, "topic-questions-1-activity-9-context", "tq1-topic-comment", "not-applicable"),
      act(["anchor-kippu"], ["anchor-kippu", "wa", "noun-kyoto", "desu"], ["anchor-kippu", "wa", "noun-osaka", "desu"], TOPIC_WA, false, "topic-questions-1-activity-10-context", "tq1-topic-contrast", "not-applicable"),
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
      ex(["noun-satou", "ga", "noun-gakusei", "desu"], "open-focus-answer", "tq2-focused-subject"),
      ex(["noun-suzuki", "ga", "noun-sensei", "desu"], "corrective-focus-answer", "tq2-focused-subject"),
      ex(["noun-mari", "ga", "noun-isha", "desu"], "exhaustive-role-selection", "tq2-focused-subject"),
      ex(["noun-satou", "wa", "noun-gakusei", "desu"], "established-student-topic", "tq2-wa-ga-contrast"),
      ex(["noun-suzuki", "wa", "noun-sensei", "desu"], "established-teacher-topic", "tq2-wa-ga-contrast"),
      ex(["noun-mari", "wa", "noun-isha", "desu"], "established-doctor-topic", "tq2-wa-ga-contrast"),
      ex(["noun-tanaka", "ga", "noun-kangoshi", "desu"], "corrective-focus", "tq2-focused-subject"),
      ex(["noun-yamada", "ga", "noun-bengoshi", "desu"], "corrective-focus", "tq2-focused-subject"),
      ex(["noun-watashi", "wa", "noun-daigakusei", "desu"], "self-topic", "tq2-wa-ga-contrast"),
      ex(["noun-tomodachi", "ga", "noun-ryuugakusei", "desu"], "new-participant", "tq2-focused-subject"),
    ],
    activities: [
      act(["noun-satou"], ["noun-tokyo", "ga", "noun-toshi", "desu"], ["noun-tokyo", "wa", "noun-toshi", "desu"], FOCUS_GA, false, "topic-questions-2-activity-1-context", "tq2-focused-subject", "focused-new-subject"),
      act(["noun-suzuki"], ["anchor-shashin", "wa", "noun-tokyo", "desu"], ["anchor-shashin", "ga", "noun-tokyo", "desu"], FOCUS_GA, true, "topic-questions-2-activity-2-context", "tq2-wa-ga-contrast", "established-topic"),
      act(["noun-mari"], ["noun-kyoto", "ga", "noun-toshi", "desu"], ["noun-kyoto", "wa", "noun-toshi", "desu"], FOCUS_GA, true, "topic-questions-2-activity-3-context", "tq2-focused-subject", "focused-new-subject"),
      act(["noun-satou"], ["anchor-ie", "wa", "noun-kyoto", "desu"], ["anchor-ie", "ga", "noun-kyoto", "desu"], FOCUS_GA, false, "topic-questions-2-activity-4-context", "tq2-wa-ga-contrast", "established-topic"),
      act(["noun-suzuki"], ["noun-osaka", "ga", "noun-toshi", "desu"], ["noun-osaka", "wa", "noun-toshi", "desu"], FOCUS_GA, false, "topic-questions-2-activity-5-context", "tq2-focused-subject", "focused-new-subject"),
      act(["noun-mari"], ["anchor-shashin", "wa", "noun-osaka", "desu"], ["anchor-shashin", "ga", "noun-osaka", "desu"], FOCUS_GA, true, "topic-questions-2-activity-6-context", "tq2-wa-ga-contrast", "established-topic"),
      act(["noun-tanaka"], ["noun-tanaka", "wa", "noun-kangoshi", "desu"], ["noun-tanaka", "ga", "noun-isha", "desu"], FOCUS_GA, false, "topic-questions-2-activity-7-context", "tq2-wa-ga-contrast", "established-topic"),
      act(["noun-yamada"], ["noun-yamada", "wa", "noun-bengoshi", "desu"], ["noun-yamada", "ga", "noun-isha", "desu"], FOCUS_GA, true, "topic-questions-2-activity-8-context", "tq2-wa-ga-contrast", "established-topic"),
      act(["noun-tomodachi"], ["noun-tomodachi", "wa", "noun-ryuugakusei", "desu"], ["noun-tomodachi", "ga", "noun-gakusei", "desu"], FOCUS_GA, true, "topic-questions-2-activity-9-context", "tq2-wa-ga-contrast", "established-topic"),
      act(["noun-watashi"], ["noun-watashi", "ga", "noun-daigakusei", "desu"], ["noun-watashi", "wa", "noun-gakusei", "desu"], FOCUS_GA, false, "topic-questions-2-activity-10-context", "tq2-focused-subject", "focused-new-subject"),
    ],
    dialogue: null,
    translationSemanticTags: [
      "focused-student",
      "focused-teacher",
      "focused-doctor",
      "established-student",
      "established-teacher",
      "established-doctor",
      "focused-nurse",
      "focused-lawyer",
      "speaker-topic",
      "focused-friend",
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
      act(["noun-tanaka"], ["noun-tanaka", "no", "noun-otousan", "mo", "noun-sensei", "desu"], ["noun-tanaka", "wa", "noun-otousan", "mo", "noun-sensei", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], true, "topic-questions-3-activity-1-context", "tq3-attributive-no", "not-applicable"),
      act(["noun-yamada"], ["noun-yamada", "no", "noun-okaasan", "mo", "noun-isha", "desu"], ["noun-yamada", "wa", "noun-okaasan", "mo", "noun-isha", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], true, "topic-questions-3-activity-2-context", "tq3-attributive-no", "not-applicable"),
      act(["noun-watashi"], ["noun-watashi", "no", "noun-ani", "mo", "noun-gakusei", "desu"], ["noun-watashi", "wa", "noun-ani", "mo", "noun-gakusei", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], false, "topic-questions-3-activity-3-context", "tq3-attributive-no", "not-applicable"),
      act(["noun-watashi"], ["noun-watashi", "no", "noun-ane", "mo", "noun-bengoshi", "desu"], ["noun-watashi", "wa", "noun-ane", "mo", "noun-bengoshi", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], false, "topic-questions-3-activity-4-context", "tq3-attributive-no", "not-applicable"),
      act(["noun-chichi"], ["noun-chichi", "wa", "noun-sensei", "desu"], ["noun-chichi", "ga", "noun-sensei", "desu"], TOPIC_WA, true, "topic-questions-3-activity-5-context", "tq3-additive-mo", "not-applicable"),
      act(["noun-haha"], ["noun-haha", "wa", "noun-isha", "desu"], ["noun-haha", "ga", "noun-isha", "desu"], TOPIC_WA, false, "topic-questions-3-activity-6-context", "tq3-additive-mo", "not-applicable"),
      act(["noun-ani"], ["noun-ani", "wa", "noun-gakusei", "desu"], ["noun-ani", "ga", "noun-gakusei", "desu"], TOPIC_WA, true, "topic-questions-3-activity-7-context", "tq3-additive-mo", "not-applicable"),
      act(["noun-ane"], ["noun-ane", "wa", "noun-bengoshi", "desu"], ["noun-ane", "ga", "noun-bengoshi", "desu"], TOPIC_WA, false, "topic-questions-3-activity-8-context", "tq3-additive-mo", "not-applicable"),
      act(["noun-otousan"], ["noun-otousan", "mo", "noun-sensei", "desu"], ["noun-otousan", "wa", "noun-sensei", "desu"], MO_CONCEPTS, false, "topic-questions-3-activity-9-context", "tq3-additive-mo", "not-applicable"),
      act(["noun-okaasan"], ["noun-okaasan", "mo", "noun-isha", "desu"], ["noun-okaasan", "ga", "noun-isha", "desu"], MO_CONCEPTS, true, "topic-questions-3-activity-10-context", "tq3-additive-mo", "not-applicable"),
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
      act(["noun-namae"], ["noun-yuki", "desu", "ka"], ["noun-yuki", "desu"], QUESTION_CONCEPTS, false, "topic-questions-4-activity-1-context", "tq4-question-answer", "not-applicable"),
      act(["noun-kuni"], ["noun-kuni", "wa", "noun-amerika", "desu", "ka"], ["noun-kuni", "wa", "noun-amerika", "desu"], QUESTION_CONCEPTS, false, "topic-questions-4-activity-2-context", "tq4-question-answer", "not-applicable"),
      act(["noun-amerika"], ["noun-amerika", "to-listing", "noun-itaria"], ["noun-amerika", "wa", "noun-itaria"], TO_CONCEPTS, true, "topic-questions-4-activity-3-context", "tq4-nominal-list", "not-applicable"),
      act(["noun-namae"], ["noun-kuni", "to-nominal", "noun-namae"], ["noun-kuni", "no", "noun-namae"], TO_CONCEPTS, true, "topic-questions-4-activity-4-context", "tq4-nominal-list", "not-applicable"),
      act(["noun-nan"], ["expression-sou", "desu", "ka"], ["noun-dare", "no", "noun-tomodachi", "desu", "ka"], QUESTION_CONCEPTS, false, "topic-questions-4-activity-5-context", "tq4-question-answer", "not-applicable"),
      act(["expression-hai"], ["expression-hai", "comma", "noun-amerika", "desu"], ["expression-hai", "comma", "noun-itaria", "desu"], QUESTION_CONCEPTS, true, "topic-questions-4-activity-6-context", "tq4-question-answer", "not-applicable"),
      act(["expression-iie"], ["expression-iie", "comma", "noun-amerika", "desu"], ["expression-hai", "comma", "noun-itaria", "desu"], QUESTION_CONCEPTS, true, "topic-questions-4-activity-7-context", "tq4-question-answer", "not-applicable"),
      act(["noun-yuki"], ["noun-yuki", "to-companion", "noun-tomodachi", "desu", "ka"], ["noun-yuki", "wa", "noun-tomodachi", "desu"], [...COMPANION_CONCEPTS, ...QUESTION_CONCEPTS], false, "topic-questions-4-activity-8-context", "tq4-companion", "not-applicable"),
      act(["noun-yuki"], ["noun-yuki", "to-companion", "noun-tomodachi", "desu"], ["noun-yuki", "no", "noun-tomodachi", "desu"], COMPANION_CONCEPTS, true, "topic-questions-4-activity-9-context", "tq4-companion", "not-applicable"),
      act(["noun-dare"], ["noun-dare", "to-companion", "noun-tomodachi", "desu", "ka"], ["noun-dare", "wa", "noun-tomodachi", "desu"], [...COMPANION_CONCEPTS, ...QUESTION_CONCEPTS], false, "topic-questions-4-activity-10-context", "tq4-question-answer", "not-applicable"),
    ],
    dialogue: [
      { speakerId: "learner", parts: ["noun-namae", "wa", "noun-nan", "desu", "ka"], conceptIds: [...TOPIC_WA, ...QUESTION_CONCEPTS], frame: "open-name-question" },
      { speakerId: "partner", parts: ["noun-yuki", "desu"], conceptIds: [], frame: "identity-answer" },
      { speakerId: "learner", parts: ["noun-kuni", "wa", "noun-itaria", "desu", "ka"], conceptIds: [...TOPIC_WA, ...QUESTION_CONCEPTS], frame: "country-clarification" },
      { speakerId: "partner", parts: ["expression-hai", "comma", "noun-itaria", "desu"], conceptIds: [], frame: "country-confirmation" },
      { speakerId: "learner", parts: ["noun-tanaka", "to-companion", "noun-tomodachi", "desu", "ka"], conceptIds: [...COMPANION_CONCEPTS, ...QUESTION_CONCEPTS], frame: "relationship-check" },
      { speakerId: "partner", parts: ["expression-hai", "comma", "expression-sou", "desu"], conceptIds: [], frame: "closing-confirmation" },
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
  throw new Error(
    `Invalid Base topic-questions module: ${moduleValidation.errors.join(", ")} ${JSON.stringify(details)}`,
  );
}

export const BASE_TOPIC_QUESTIONS_MODULE: BaseTopicQuestionsModule = deepFreeze(
  RAW_BASE_TOPIC_QUESTIONS_MODULE,
);

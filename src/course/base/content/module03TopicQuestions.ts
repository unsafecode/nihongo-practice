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
}

export interface BaseTopicQuestionsModule {
  readonly id: "topic-questions";
  readonly lessons: readonly BaseTopicQuestionsLesson[];
  readonly sequence: readonly BaseLessonContent[];
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
    const acceptedAnswerTarget = targetFor(
      entry.answer,
      `${id}-answer`,
      entry.conceptIds,
      cell,
    );
    const answerId = `${id}-answer`;
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
      acceptedFeedbackCopyId: `${spec.lessonId}-feedback-accepted`,
      retryFeedbackCopyId: `${spec.lessonId}-feedback-retry`,
      assessedConceptIds,
      assessedLexemeIds,
    });
    designs.push({
      id,
      prompt: japanese(promptTarget),
      options,
      acceptedAnswers: [answer],
      correctOptionIndex: options.length > 0 ? options.indexOf(answer) : null,
      promptTarget,
      acceptedAnswerTarget,
      audioTargetId: shape.category === "listening" ? targetId : null,
    });
    prompts.push([baseActivityPromptKey(spec.lessonId, id), promptTarget]);
    if (shape.category === "listening") audio.push([targetId, acceptedAnswerTarget]);
    else accepted.push([answerId, acceptedAnswerTarget]);
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
): ActivitySpec {
  return {
    prompt,
    answer,
    options: answerFirst ? [answer, distractor] : [distractor, answer],
    conceptIds,
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
    reviewLexemeIds: ["noun-watashi", "noun-gakusei", "noun-sensei", "noun-isha"],
    introducedConceptIds: ["topic-wa"],
    reviewedConceptIds: ["discourse-roles", "affirmative-desu"],
    patternCellIds: ["tq1-topic-comment", "tq1-topic-contrast"],
    examples: [
      ex(["noun-watashi", "wa", "noun-gakusei", "desu"], "self-topic", "tq1-topic-comment"),
      ex(["noun-tanaka", "wa", "noun-sensei", "desu"], "person-topic", "tq1-topic-comment"),
      ex(["noun-yamada", "wa", "noun-isha", "desu"], "person-contrast", "tq1-topic-contrast"),
      ex(["noun-tokyo", "wa", "noun-toshi", "desu"], "place-topic", "tq1-topic-comment"),
      ex(["noun-kyoto", "wa", "noun-toshi", "desu"], "place-contrast", "tq1-topic-contrast"),
      ex(["noun-osaka", "wa", "noun-toshi", "desu"], "place-contrast", "tq1-topic-contrast"),
      ex(["noun-tomodachi", "wa", "noun-bengoshi", "desu"], "person-topic", "tq1-topic-comment"),
      ex(["noun-kazoku", "wa", "noun-sensei", "desu"], "family-topic", "tq1-topic-comment"),
      ex(["anchor-neko", "wa", "noun-tomodachi", "desu"], "animal-topic", "tq1-topic-comment"),
      ex(["anchor-shashin", "wa", "noun-tokyo", "desu"], "photo-topic", "tq1-topic-contrast"),
    ],
    activities: [
      act(["noun-tokyo"], ["noun-tokyo", "wa", "noun-toshi", "comma", "noun-kyoto", "wa", "noun-toshi", "desu"], ["noun-tokyo", "noun-toshi", "desu"], TOPIC_WA, false),
      act(["noun-kyoto"], ["noun-kyoto", "wa", "noun-toshi", "comma", "noun-osaka", "wa", "noun-toshi", "desu"], ["noun-toshi", "wa", "noun-kyoto", "desu"], TOPIC_WA, true),
      act(["noun-osaka"], ["noun-osaka", "wa", "noun-toshi", "comma", "noun-tokyo", "wa", "noun-gakusei", "desu"], ["noun-osaka", "noun-toshi", "desu"], TOPIC_WA, false),
      act(["noun-toshi"], ["noun-toshi", "wa", "noun-tokyo", "comma", "noun-watashi", "wa", "noun-gakusei", "desu"], ["noun-tokyo", "wa", "noun-toshi", "desu"], TOPIC_WA, true),
      act(["noun-watashi"], ["noun-watashi", "wa", "noun-bengoshi", "comma", "noun-tokyo", "wa", "noun-toshi", "desu"], ["noun-watashi", "noun-bengoshi", "desu"], TOPIC_WA, false),
      act(["noun-tanaka"], ["noun-tanaka", "wa", "noun-isha", "comma", "noun-yamada", "wa", "noun-sensei", "desu"], ["noun-tanaka", "noun-isha", "desu"], TOPIC_WA, true),
      act(["noun-yamada"], ["noun-yamada", "wa", "noun-bengoshi", "comma", "noun-tanaka", "wa", "noun-sensei", "desu"], ["noun-yamada", "noun-bengoshi", "desu"], TOPIC_WA, false),
      act(["noun-gakusei"], ["noun-gakusei", "wa", "noun-tomodachi", "comma", "noun-sensei", "wa", "noun-isha", "desu"], ["noun-gakusei", "noun-tomodachi", "desu"], TOPIC_WA, true),
      act(["anchor-neko"], ["anchor-neko", "wa", "noun-kazoku", "comma", "noun-watashi", "wa", "noun-gakusei", "desu"], ["anchor-neko", "noun-kazoku", "desu"], TOPIC_WA, false),
      act(["anchor-shashin"], ["anchor-shashin", "wa", "noun-kyoto", "comma", "noun-osaka", "wa", "noun-toshi", "desu"], ["anchor-shashin", "noun-kyoto", "desu"], TOPIC_WA, true),
    ],
    dialogue: null,
  },
  {
    lessonId: "topic-questions-2",
    contract: "system",
    prerequisiteLessonIds: ["topic-questions-1"],
    newLexemeIds: ["noun-satou", "noun-suzuki", "noun-mari"],
    reviewLexemeIds: ["noun-gakusei", "noun-sensei", "noun-isha", "noun-bengoshi"],
    introducedConceptIds: ["focus-subject-ga"],
    reviewedConceptIds: ["topic-wa", "affirmative-desu"],
    patternCellIds: ["tq2-focused-subject", "tq2-wa-ga-contrast"],
    examples: [
      ex(["noun-satou", "ga", "noun-gakusei", "desu"], "focused-answer", "tq2-focused-subject"),
      ex(["noun-suzuki", "ga", "noun-sensei", "desu"], "focused-answer", "tq2-focused-subject"),
      ex(["noun-mari", "ga", "noun-isha", "desu"], "focused-answer", "tq2-focused-subject"),
      ex(["noun-satou", "wa", "noun-bengoshi", "desu"], "established-topic", "tq2-wa-ga-contrast"),
      ex(["noun-suzuki", "wa", "noun-gakusei", "desu"], "established-topic", "tq2-wa-ga-contrast"),
      ex(["noun-mari", "wa", "noun-sensei", "desu"], "established-topic", "tq2-wa-ga-contrast"),
      ex(["noun-tanaka", "ga", "noun-isha", "desu"], "corrective-focus", "tq2-focused-subject"),
      ex(["noun-yamada", "ga", "noun-bengoshi", "desu"], "corrective-focus", "tq2-focused-subject"),
      ex(["noun-watashi", "wa", "noun-gakusei", "desu"], "self-topic", "tq2-wa-ga-contrast"),
      ex(["noun-tomodachi", "ga", "noun-sensei", "desu"], "new-participant", "tq2-focused-subject"),
    ],
    activities: [
      act(["noun-satou", "wa"], ["noun-satou", "ga", "noun-isha", "comma", "noun-suzuki", "wa", "noun-sensei", "desu"], ["noun-satou", "wa", "noun-isha", "desu"], FOCUS_GA, false),
      act(["noun-suzuki", "wa"], ["noun-suzuki", "ga", "noun-bengoshi", "comma", "noun-mari", "wa", "noun-gakusei", "desu"], ["noun-suzuki", "wa", "noun-bengoshi", "desu"], FOCUS_GA, true),
      act(["noun-mari", "wa"], ["noun-mari", "ga", "noun-sensei", "comma", "noun-satou", "wa", "noun-isha", "desu"], ["noun-mari", "wa", "noun-sensei", "desu"], FOCUS_GA, false),
      act(["noun-satou", "ga"], ["noun-satou", "ga", "noun-gakusei", "comma", "noun-mari", "ga", "noun-isha", "desu"], ["noun-satou", "wa", "noun-gakusei", "desu"], FOCUS_GA, true),
      act(["noun-suzuki", "ga"], ["noun-suzuki", "ga", "noun-sensei", "comma", "noun-satou", "ga", "noun-bengoshi", "desu"], ["noun-suzuki", "wa", "noun-sensei", "desu"], FOCUS_GA, false),
      act(["noun-mari", "ga"], ["noun-mari", "ga", "noun-bengoshi", "comma", "noun-suzuki", "ga", "noun-gakusei", "desu"], ["noun-mari", "wa", "noun-bengoshi", "desu"], FOCUS_GA, true),
      act(["noun-tanaka", "wa"], ["noun-tanaka", "ga", "noun-sensei", "comma", "noun-yamada", "wa", "noun-isha", "desu"], ["noun-tanaka", "wa", "noun-sensei", "desu"], FOCUS_GA, false),
      act(["noun-yamada", "wa"], ["noun-yamada", "ga", "noun-gakusei", "comma", "noun-tanaka", "wa", "noun-bengoshi", "desu"], ["noun-yamada", "wa", "noun-gakusei", "desu"], FOCUS_GA, true),
      act(["noun-tomodachi", "wa"], ["noun-tomodachi", "ga", "noun-isha", "comma", "noun-mari", "wa", "noun-sensei", "desu"], ["noun-tomodachi", "wa", "noun-isha", "desu"], FOCUS_GA, false),
      act(["noun-watashi", "wa"], ["noun-watashi", "ga", "noun-bengoshi", "comma", "noun-satou", "wa", "noun-gakusei", "desu"], ["noun-watashi", "wa", "noun-bengoshi", "desu"], FOCUS_GA, true),
    ],
    dialogue: null,
  },
  {
    lessonId: "topic-questions-3",
    contract: "system",
    prerequisiteLessonIds: ["topic-questions-2"],
    newLexemeIds: ["noun-chichi", "noun-haha", "noun-ani", "noun-ane"],
    reviewLexemeIds: ["noun-watashi", "noun-tanaka", "noun-sensei", "noun-isha"],
    introducedConceptIds: ["possessive-no", "modifier-before-noun", "additive-mo"],
    reviewedConceptIds: ["topic-wa", "affirmative-desu"],
    patternCellIds: ["tq3-attributive-no", "tq3-additive-mo"],
    examples: [
      ex(["noun-watashi", "no", "noun-chichi", "desu"], "family-identification", "tq3-attributive-no"),
      ex(["noun-watashi", "no", "noun-haha", "desu"], "family-identification", "tq3-attributive-no"),
      ex(["noun-watashi", "no", "noun-ani", "desu"], "family-identification", "tq3-attributive-no"),
      ex(["noun-watashi", "no", "noun-ane", "desu"], "family-identification", "tq3-attributive-no"),
      ex(["noun-tanaka", "no", "noun-chichi", "desu"], "other-family", "tq3-attributive-no"),
      ex(["noun-yamada", "no", "noun-haha", "desu"], "other-family", "tq3-attributive-no"),
      ex(["noun-chichi", "mo", "noun-sensei", "desu"], "addition", "tq3-additive-mo"),
      ex(["noun-haha", "mo", "noun-isha", "desu"], "addition", "tq3-additive-mo"),
      ex(["noun-ani", "mo", "noun-gakusei", "desu"], "addition", "tq3-additive-mo"),
      ex(["noun-ane", "mo", "noun-bengoshi", "desu"], "addition", "tq3-additive-mo"),
    ],
    activities: [
      act(["noun-chichi"], ["noun-tanaka", "no", "noun-chichi", "comma", "noun-chichi", "mo", "noun-sensei", "desu"], ["noun-tanaka", "wa", "noun-chichi", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], false),
      act(["noun-haha"], ["noun-yamada", "no", "noun-haha", "comma", "noun-haha", "mo", "noun-isha", "desu"], ["noun-yamada", "ga", "noun-haha", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], true),
      act(["noun-ani"], ["noun-satou", "no", "noun-ani", "comma", "noun-ani", "mo", "noun-gakusei", "desu"], ["noun-satou", "wa", "noun-ani", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], false),
      act(["noun-ane"], ["noun-suzuki", "no", "noun-ane", "comma", "noun-ane", "mo", "noun-bengoshi", "desu"], ["noun-suzuki", "ga", "noun-ane", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], true),
      act(["noun-watashi", "no"], ["noun-watashi", "no", "noun-chichi", "comma", "noun-haha", "mo", "noun-sensei", "desu"], ["noun-watashi", "wa", "noun-chichi", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], false),
      act(["noun-tanaka", "no"], ["noun-tanaka", "no", "noun-ani", "comma", "noun-ane", "mo", "noun-isha", "desu"], ["noun-tanaka", "ga", "noun-ani", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], true),
      act(["noun-yamada", "no"], ["noun-yamada", "no", "noun-ane", "comma", "noun-chichi", "mo", "noun-bengoshi", "desu"], ["noun-yamada", "wa", "noun-ane", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], false),
      act(["noun-mari", "no"], ["noun-mari", "no", "noun-haha", "comma", "noun-ani", "mo", "noun-sensei", "desu"], ["noun-mari", "ga", "noun-haha", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], true),
      act(["noun-chichi", "mo"], ["noun-chichi", "mo", "noun-isha", "comma", "noun-watashi", "no", "noun-ane", "desu"], ["noun-chichi", "ga", "noun-isha", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], false),
      act(["noun-haha", "mo"], ["noun-haha", "mo", "noun-bengoshi", "comma", "noun-watashi", "no", "noun-ani", "desu"], ["noun-haha", "wa", "noun-bengoshi", "desu"], [...NO_CONCEPTS, ...MO_CONCEPTS], true),
    ],
    dialogue: null,
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
      ex(["noun-kuni", "wa", "noun-amerika", "desu", "ka"], "country-check", "tq4-question-answer"),
      ex(["noun-namae", "wa", "noun-yuki", "desu", "ka"], "name-check", "tq4-question-answer"),
      ex(["noun-amerika", "to-listing", "noun-itaria", "desu"], "country-list", "tq4-nominal-list"),
      ex(["noun-namae", "to-nominal", "noun-kuni"], "requested-details", "tq4-nominal-list"),
      ex(["noun-tanaka", "to-companion", "noun-tomodachi", "desu"], "companion-relation", "tq4-companion"),
      ex(["expression-hai", "comma", "expression-sou", "desu"], "confirmation", "tq4-question-answer"),
      ex(["expression-iie", "comma", "noun-itaria", "desu"], "correction", "tq4-question-answer"),
    ],
    activities: [
      act(["noun-namae"], ["noun-namae", "wa", "noun-yuki", "comma", "noun-dare", "desu", "ka"], ["noun-namae", "no", "noun-yuki", "desu"], QUESTION_CONCEPTS, false),
      act(["noun-kuni"], ["noun-kuni", "wa", "noun-itaria", "comma", "noun-amerika", "desu", "ka"], ["noun-kuni", "ga", "noun-itaria", "desu"], QUESTION_CONCEPTS, true),
      act(["noun-amerika"], ["noun-amerika", "to-listing", "noun-itaria", "comma", "noun-kuni", "desu"], ["noun-amerika", "no", "noun-itaria", "desu"], TO_CONCEPTS, false),
      act(["noun-itaria"], ["noun-itaria", "to-nominal", "noun-amerika", "comma", "noun-namae", "to-nominal", "noun-kuni"], ["noun-itaria", "wa", "noun-amerika", "desu"], TO_CONCEPTS, true),
      act(["noun-dare"], ["noun-dare", "desu", "ka", "comma", "noun-yuki", "desu"], ["noun-dare", "wa", "noun-yuki", "desu"], QUESTION_CONCEPTS, false),
      act(["expression-hai"], ["expression-hai", "comma", "expression-sou", "desu", "comma", "noun-yuki", "desu"], ["expression-hai", "wa", "expression-sou", "desu"], QUESTION_CONCEPTS, true),
      act(["expression-iie"], ["expression-iie", "comma", "noun-amerika", "desu", "comma", "noun-itaria", "desu"], ["expression-iie", "ka", "noun-amerika", "desu"], QUESTION_CONCEPTS, false),
      act(["expression-sou"], ["noun-tanaka", "to-companion", "noun-tomodachi", "comma", "expression-sou", "desu"], ["noun-tanaka", "wa", "noun-tomodachi", "desu"], COMPANION_CONCEPTS, true),
      act(["noun-yuki"], ["noun-yuki", "to-companion", "noun-tomodachi", "comma", "noun-dare", "desu", "ka"], ["noun-yuki", "no", "noun-tomodachi", "desu"], [...COMPANION_CONCEPTS, ...QUESTION_CONCEPTS], false),
      act(["noun-namae", "to-nominal", "noun-kuni"], ["noun-namae", "to-nominal", "noun-kuni", "comma", "expression-hai", "comma", "expression-sou", "desu"], ["noun-namae", "mo", "noun-kuni", "desu"], TO_CONCEPTS, true),
    ],
    dialogue: [
      { speakerId: "learner", parts: ["noun-namae", "wa", "noun-dare", "desu", "ka"], conceptIds: [...TOPIC_WA, ...QUESTION_CONCEPTS], frame: "open-identity-question" },
      { speakerId: "partner", parts: ["noun-yuki", "desu"], conceptIds: [], frame: "identity-answer" },
      { speakerId: "learner", parts: ["noun-amerika", "no", "noun-hito", "desu", "ka"], conceptIds: [...NO_CONCEPTS, ...QUESTION_CONCEPTS], frame: "country-clarification" },
      { speakerId: "partner", parts: ["expression-iie", "comma", "noun-itaria", "no", "noun-hito", "desu"], conceptIds: NO_CONCEPTS, frame: "country-correction" },
      { speakerId: "learner", parts: ["noun-tanaka", "to-companion", "noun-tomodachi", "desu", "ka"], conceptIds: [...COMPANION_CONCEPTS, ...QUESTION_CONCEPTS], frame: "relationship-check" },
      { speakerId: "partner", parts: ["expression-hai", "comma", "noun-tanaka", "to-companion", "noun-tomodachi", "desu"], conceptIds: COMPANION_CONCEPTS, frame: "closing-confirmation" },
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
    return deepFreeze({
      content,
      titleCopyId: `${spec.lessonId}-title`,
      objectiveCopyId: `${spec.lessonId}-objective`,
      explanation,
      patternCellIds: spec.patternCellIds,
      examples,
      activityDesigns: activities.designs,
      dialogue: dialogue?.wrapper ?? null,
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

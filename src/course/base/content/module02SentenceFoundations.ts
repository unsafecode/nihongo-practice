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
  readonly audioTargetId: string | null;
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
  | "wa"
  | "ga"
  | "no"
  | "mo"
  | "to-listing"
  | "to-nominal"
  | "to-companion"
  | "ka";
type TokenPart = BaseAuthoredTokenPart;

interface ExampleSpec {
  readonly parts: readonly TokenPart[];
  readonly frame: string;
  readonly patternCellId: string;
}

interface ActivitySpec {
  readonly prompt: readonly TokenPart[];
  readonly answer: readonly TokenPart[];
  readonly options: readonly (readonly TokenPart[])[];
}

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

const CATEGORY_SHAPES: readonly Readonly<{
  category: BaseActivityDefinition["category"];
  interactionKind: BaseActivityDefinition["interactionKind"];
  mode: BaseActivityDefinition["mode"];
  operation: BaseActivityDefinition["operation"];
}>[] = deepFreeze([
  {
    category: "meaning-comprehension",
    interactionKind: "choice",
    mode: "non-spoken",
    operation: "recognize-meaning",
  },
  {
    category: "form-function-discrimination",
    interactionKind: "choice",
    mode: "non-spoken",
    operation: "discriminate-form-function",
  },
  {
    category: "ordering",
    interactionKind: "tile-ordering",
    mode: "non-spoken",
    operation: "order-chunks",
  },
  {
    category: "controlled-production",
    interactionKind: "completion",
    mode: "non-spoken",
    operation: "produce-controlled",
  },
  {
    category: "transformation",
    interactionKind: "transformation",
    mode: "non-spoken",
    operation: "transform-form",
  },
  {
    category: "error-diagnosis",
    interactionKind: "choice",
    mode: "non-spoken",
    operation: "diagnose-error",
  },
  {
    category: "contextual-response",
    interactionKind: "constrained-construction",
    mode: "non-spoken",
    operation: "select-contextual-response",
  },
  {
    category: "cumulative-retrieval",
    interactionKind: "completion",
    mode: "non-spoken",
    operation: "retrieve-cumulative",
  },
  {
    category: "listening",
    interactionKind: "listening",
    mode: "audio",
    operation: "identify-audio",
  },
  {
    category: "spoken",
    interactionKind: "spoken",
    mode: "audio",
    operation: "produce-spoken",
  },
]);

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
    "wa",
    "ga",
    "no",
    "mo",
    "to-listing",
    "to-nominal",
    "to-companion",
    "ka",
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
  });
}

function activitiesFor(
  spec: LessonSpec,
  concepts: readonly string[],
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
    const shape = CATEGORY_SHAPES[index];
    const id = `${spec.lessonId}-activity-${index + 1}`;
    const answerId = `${id}-answer`;
    const promptId = `${id}-prompt`;
    const promptTarget = authoredVisibleTarget(
      activity.prompt,
      promptId,
      concepts,
      [spec.patternCellIds[index % spec.patternCellIds.length]],
    );
    const acceptedAnswerTarget = authoredVisibleTarget(
      activity.answer,
      answerId,
      concepts,
      [spec.patternCellIds[index % spec.patternCellIds.length]],
    );
    const targetId = shape.mode === "audio" && shape.category === "listening"
      ? `${id}-audio`
      : answerId;
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
      assessedConceptIds: concepts,
      assessedLexemeIds,
    });
    const options = activity.options.map((parts, optionIndex) =>
      japaneseFor(parts, `${id}-option-${optionIndex + 1}`),
    );
    const answer = japaneseFor(activity.answer, `${id}-accepted-surface`);
    designs.push({
      id,
      prompt: japaneseFor(activity.prompt, `${id}-prompt-surface`),
      options,
      acceptedAnswers: [answer],
      correctOptionIndex: options.length > 0 ? options.indexOf(answer) : null,
      promptTarget,
      acceptedAnswerTarget,
      audioTargetId: targetId.endsWith("-audio") ? targetId : null,
    });
    prompts.push([
      baseActivityPromptKey(spec.lessonId, id),
      promptTarget,
    ]);
    if (targetId.endsWith("-audio")) {
      audioTargets.push([targetId, acceptedAnswerTarget]);
    } else {
      acceptedAnswers.push([answerId, acceptedAnswerTarget]);
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

const SF1_EXAMPLE_PARTS: readonly TokenPart[][] = [
  ["noun-gakusei"],
  ["noun-sensei"],
  ["noun-watashi"],
  ["anchor-neko"],
  ["anchor-ie"],
  ["anchor-umi"],
  ["anchor-hon"],
  ["anchor-gakkou"],
  ["anchor-shashin"],
  ["anchor-kippu"],
];

const SF2_EXAMPLE_PARTS: readonly TokenPart[][] = [
  ["noun-tanaka"],
  ["noun-yamada"],
  ["noun-hito"],
  ["noun-gakusei"],
  ["noun-sensei"],
  ["noun-watashi"],
  ["anchor-neko"],
  ["anchor-hon"],
  ["anchor-ie"],
  ["anchor-shashin"],
];

const SF3_EXAMPLE_PARTS: readonly TokenPart[][] = [
  ["noun-kangoshi", "desu"],
  ["noun-bengoshi", "desu"],
  ["noun-tomodachi", "desu"],
  ["noun-isha", "desu"],
  ["noun-gakusei", "desu"],
  ["noun-sensei", "desu"],
  ["noun-watashi", "desu"],
  ["noun-hito", "desu"],
  ["anchor-neko", "desu"],
  ["anchor-ie", "desu"],
  ["anchor-umi", "desu"],
  ["anchor-kippu", "desu"],
];

const SF4_EXAMPLE_PARTS: readonly TokenPart[][] = [
  ["noun-daigakusei", "desu"],
  ["noun-ryuugakusei", "desu"],
  ["noun-kazoku", "desu"],
  ["noun-tanaka", "noun-sensei", "desu"],
  ["noun-yamada", "noun-sensei", "desu"],
  ["noun-tanaka", "noun-isha", "desu"],
  ["noun-yamada", "noun-bengoshi", "desu"],
  ["noun-watashi", "noun-bengoshi", "desu"],
  ["noun-watashi", "noun-daigakusei", "desu"],
  ["noun-tomodachi", "noun-ryuugakusei", "desu"],
];

function exampleSpecs(
  parts: readonly (readonly TokenPart[])[],
  patternCellIds: readonly string[],
): readonly ExampleSpec[] {
  const frames = ["self-identification", "person-identification", "object-identification"];
  return parts.map((entry, index) => ({
    parts: entry,
    frame: frames[index % frames.length],
    patternCellId: patternCellIds[index % patternCellIds.length],
  }));
}

function activitySpecs(
  answerParts: readonly (readonly TokenPart[])[],
): readonly ActivitySpec[] {
  return answerParts.map((answer, index) => {
    const prompt = answerParts[(index + 3) % answerParts.length];
    const distractor = answerParts[(index + 5) % answerParts.length];
    const options = index % 2 === 0
      ? [distractor, answer]
      : [answer, distractor];
    return { prompt, answer, options };
  });
}

const LESSON_SPECS: readonly LessonSpec[] = deepFreeze([
  {
    lessonId: "sentence-foundations-1",
    prerequisiteLessonIds: ["sounds-4"],
    newLexemeIds: ["noun-gakusei", "noun-sensei", "noun-watashi"],
    reviewLexemeIds: ["anchor-neko", "anchor-ie", "anchor-umi", "anchor-hon"],
    introducedConceptIds: ["sentence-chunks"],
    reviewedConceptIds: [],
    patternCellIds: ["sf1-identifying-chunk", "sf1-context-chunk"],
    examples: exampleSpecs(
      SF1_EXAMPLE_PARTS,
      ["sf1-identifying-chunk", "sf1-context-chunk"],
    ),
    activities: activitySpecs([
      ["noun-gakusei", "comma", "noun-sensei"],
      ["noun-sensei", "comma", "noun-watashi"],
      ["noun-watashi", "comma", "noun-gakusei"],
      ["noun-gakusei", "comma", "anchor-neko"],
      ["noun-sensei", "comma", "anchor-hon"],
      ["noun-watashi", "comma", "anchor-ie"],
      ["noun-gakusei", "comma", "anchor-umi"],
      ["noun-sensei", "comma", "anchor-shashin"],
      ["noun-watashi", "comma", "anchor-kippu"],
      ["noun-gakusei", "comma", "anchor-gakkou"],
    ]),
  },
  {
    lessonId: "sentence-foundations-2",
    prerequisiteLessonIds: ["sentence-foundations-1"],
    newLexemeIds: ["noun-tanaka", "noun-yamada", "noun-hito"],
    reviewLexemeIds: ["noun-gakusei", "noun-sensei", "noun-watashi"],
    introducedConceptIds: ["sentence-order", "sentence-omission"],
    reviewedConceptIds: ["sentence-chunks"],
    patternCellIds: ["sf2-predicate-final", "sf2-recoverable-omission"],
    examples: exampleSpecs(
      SF2_EXAMPLE_PARTS,
      ["sf2-predicate-final", "sf2-recoverable-omission"],
    ),
    activities: activitySpecs([
      ["noun-tanaka", "comma", "noun-gakusei"],
      ["noun-yamada", "comma", "noun-sensei"],
      ["noun-hito", "comma", "noun-watashi"],
      ["noun-tanaka", "comma", "noun-hito"],
      ["noun-yamada", "comma", "noun-gakusei"],
      ["noun-hito", "comma", "noun-sensei"],
      ["noun-tanaka", "comma", "anchor-neko"],
      ["noun-yamada", "comma", "anchor-hon"],
      ["noun-hito", "comma", "anchor-ie"],
      ["noun-tanaka", "comma", "anchor-shashin"],
    ]),
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
    reviewLexemeIds: ["noun-gakusei", "noun-sensei", "noun-watashi"],
    introducedConceptIds: ["affirmative-desu"],
    reviewedConceptIds: ["sentence-order", "sentence-omission"],
    patternCellIds: ["sf3-noun-predicate", "sf3-polite-copula"],
    examples: exampleSpecs(
      SF3_EXAMPLE_PARTS,
      ["sf3-noun-predicate", "sf3-polite-copula"],
    ),
    activities: activitySpecs([
      ["noun-watashi", "comma", "noun-kangoshi", "desu"],
      ["noun-tanaka", "comma", "noun-bengoshi", "desu"],
      ["noun-yamada", "comma", "noun-tomodachi", "desu"],
      ["noun-tanaka", "comma", "noun-isha", "desu"],
      ["noun-watashi", "comma", "noun-gakusei", "desu"],
      ["noun-yamada", "comma", "noun-sensei", "desu"],
      ["noun-tanaka", "comma", "noun-kangoshi", "desu"],
      ["noun-watashi", "comma", "noun-tomodachi", "desu"],
      ["noun-yamada", "comma", "noun-kangoshi", "desu"],
      ["noun-watashi", "comma", "noun-bengoshi", "desu"],
    ]),
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
    ],
    introducedConceptIds: ["discourse-roles"],
    reviewedConceptIds: ["sentence-order", "sentence-omission", "affirmative-desu"],
    patternCellIds: ["sf4-explicit-reference", "sf4-recoverable-reference"],
    examples: exampleSpecs(
      SF4_EXAMPLE_PARTS,
      ["sf4-explicit-reference", "sf4-recoverable-reference"],
    ),
    activities: activitySpecs([
      ["noun-tanaka", "comma", "noun-daigakusei", "desu"],
      ["noun-yamada", "comma", "noun-ryuugakusei", "desu"],
      ["noun-watashi", "comma", "noun-kazoku", "desu"],
      ["noun-watashi", "comma", "noun-daigakusei", "desu"],
      ["noun-tanaka", "comma", "noun-ryuugakusei", "desu"],
      ["noun-yamada", "comma", "noun-kazoku", "desu"],
      ["noun-tomodachi", "comma", "noun-daigakusei", "desu"],
      ["noun-tanaka", "comma", "noun-kangoshi", "desu"],
      ["noun-yamada", "comma", "noun-bengoshi", "desu"],
      ["noun-watashi", "comma", "noun-ryuugakusei", "desu"],
    ]),
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
    const activitySet = activitiesFor(spec, concepts);
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
      ]),
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
  deepFreeze(
    CATEGORY_SHAPES.slice(0, 8).map(
      ({ category }) => category as BaseActivityCategory,
    ),
  );

import type { AssembledToken } from "../../../romaji/types";
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
  type BaseInterpretationTag,
  type BaseLessonContent,
  type BaseParticleFrame,
  type BasePredicateAspect,
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
  composeBaseTokenSequences,
  type BaseTokenSequencePart,
} from "../forms/composeFormTokens";
import {
  baseParticleSurfaceTokens,
  particleSenseFirstTeachContentId,
  type BaseParticleSense,
} from "../forms/particleLicensing";
import {
  realizePoliteGrid,
  realizePoliteNonpast,
  realizePoliteStem,
  realizeVerbDictionary,
} from "../forms/verbForms";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateFirstTeachOrder } from "../validation/sequenceRules";
import {
  BASE_CONTEXT_ACTIVITY_SHAPE,
  BASE_CONTROLLED_ACTIVITY_SHAPE,
  BASE_ERROR_ACTIVITY_SHAPE,
  BASE_FORM_ACTIVITY_SHAPE,
  BASE_LISTENING_ACTIVITY_SHAPE,
  BASE_MEANING_ACTIVITY_SHAPE,
  BASE_ORDERING_ACTIVITY_SHAPE,
  BASE_RETRIEVAL_ACTIVITY_SHAPE,
  BASE_SPOKEN_ACTIVITY_SHAPE,
  BASE_TRANSFORMATION_ACTIVITY_SHAPE,
  validateNewLexemeMeaningCopies,
  validatePublishedSemanticActivities,
  validatePublishedWorldFactLedger,
  worldFactLedgerFor,
  type BaseSemanticActivityDesign,
  type BaseSemanticActivityShape,
  type BaseWorldFactRecord,
} from "./module02SentenceFoundations";
import {
  BASE_TOPIC_QUESTIONS_LESSONS,
  BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
} from "./module03TopicQuestions";

export type BaseTask11VerbFormKind =
  | "dictionary"
  | "polite-stem"
  | "polite-nonpast"
  | "nonpast-negative"
  | "past-affirmative"
  | "past-negative";

export type BaseTask11Part =
  | Readonly<{ readonly kind: "lexeme"; readonly lexemeId: string }>
  | Readonly<{ readonly kind: "particle"; readonly sense: BaseParticleSense }>
  | Readonly<{
      readonly kind: "verb-form";
      readonly lemmaId: string;
      readonly form: BaseTask11VerbFormKind;
    }>
  | Readonly<{ readonly kind: "punctuation"; readonly mark: "comma" | "period" }>;

export interface BaseTask11TargetSpec {
  readonly parts: readonly BaseTask11Part[];
  readonly conceptIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly semanticRoleIds: readonly (
    | "agent"
    | "theme"
    | "topic"
    | "location"
    | "time"
    | "means"
    | "source"
    | "limit"
    | "companion"
    | "goal"
  )[];
  readonly interpretationTags: readonly BaseInterpretationTag[];
  readonly predicateSenseId: string | null;
  readonly predicateLexemeId: string | null;
  readonly predicateAspect?: BasePredicateAspect;
  readonly particleFrame?: BaseParticleFrame;
}

export interface BaseTask11ExampleSpec {
  readonly target: BaseTask11TargetSpec;
  readonly frame: string;
  readonly utteranceKind: NonNullable<BaseExample["utteranceKind"]>;
  readonly en: string;
  readonly it: string;
  readonly purposeEn: string;
  readonly purposeIt: string;
  readonly semanticTag: string;
}

export interface BaseTask11ActivitySpec {
  readonly prompt: BaseTask11TargetSpec;
  readonly answer: BaseTask11TargetSpec;
  readonly distractor: BaseTask11TargetSpec;
  readonly correctOptionIndex: 0 | 1;
  readonly promptContextCopyId: string;
  readonly patternCellId: string;
  readonly shape: BaseSemanticActivityShape;
  readonly referentId: string | null;
  readonly worldFactId: string | null;
  readonly errorCode: string | null;
}

export interface BaseTask11DialogueTurnSpec {
  readonly speakerId: "learner" | "partner";
  readonly target: BaseTask11TargetSpec;
  readonly frame: string;
  readonly utteranceKind: NonNullable<BaseDialogueTurn["utteranceKind"]>;
  readonly en: string;
  readonly it: string;
  readonly purposeEn: string;
  readonly purposeIt: string;
}

export interface BaseTask11LessonSpec {
  readonly lessonId: string;
  readonly contract: "system" | "content";
  readonly prerequisiteLessonIds: readonly string[];
  readonly newLexemeIds: readonly string[];
  readonly reviewLexemeIds: readonly string[];
  readonly introducedConceptIds: readonly string[];
  readonly reviewedConceptIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly referenceSnapshotIds: readonly string[];
  readonly examples: readonly BaseTask11ExampleSpec[];
  readonly activities: readonly BaseTask11ActivitySpec[];
  readonly dialogue: readonly BaseTask11DialogueTurnSpec[] | null;
}

export interface BaseTask11ReviewedTranslation {
  readonly target: BaseVisibleTarget;
  readonly japanese: string;
  readonly copyId: string;
  readonly en: string;
  readonly it: string;
  readonly semanticTag: string;
  readonly enSemantic: string;
  readonly itSemantic: string;
}

export interface BaseTask11Dialogue extends BaseDialogue {
  readonly turns: readonly BaseDialogueTurn[];
  readonly turnCopy: readonly Readonly<{
    readonly translationCopyId: string;
    readonly purposeCopyId: string;
  }>[];
}

export interface BaseTask11Lesson {
  readonly content: BaseSystemLessonContent | BaseContentLessonContent;
  readonly titleCopyId: string;
  readonly objectiveCopyId: string;
  readonly explanation: Readonly<{
    readonly mainCopyId: string;
    readonly constructionCopyId: string;
    readonly constraintsCopyId: string;
    readonly commonErrorCopyId: string;
    readonly nearestContrastId: string;
  }>;
  readonly patternCellIds: readonly string[];
  readonly examples: readonly BaseExample[];
  readonly activityDesigns: readonly BaseSemanticActivityDesign[];
  readonly dialogue: BaseTask11Dialogue | null;
  readonly reviewedTranslations: readonly BaseTask11ReviewedTranslation[];
}

interface BuiltTask11Lesson {
  readonly lesson: BaseTask11Lesson;
  readonly exampleEntries: readonly (readonly [string, BaseExample])[];
  readonly dialogueEntries: readonly (readonly [string, BaseDialogue])[];
  readonly acceptedEntries: readonly (readonly [string, BaseVisibleTarget])[];
  readonly promptEntries: readonly (readonly [string, BaseVisibleTarget])[];
  readonly audioEntries: readonly (readonly [string, BaseVisibleTarget])[];
  readonly patternEntry: readonly [string, readonly string[]];
}

export type BaseTask11ModuleError =
  | "invalid-module-shape"
  | "invalid-lesson-shape"
  | "invalid-lesson-allocation"
  | "invalid-copy"
  | "canonical-depth-failure";

export interface BasePoliteVerbsModule {
  readonly id: "polite-verbs";
  readonly lessons: readonly BaseTask11Lesson[];
  readonly sequence: readonly BaseLessonContent[];
  readonly worldFacts: Readonly<{
    readonly learnerRoutine: "studies-and-rests";
    readonly tanakaRoutine: "works";
    readonly yamadaRoutine: "walks";
    readonly yukiRoutine: "sings";
  }>;
  readonly worldFactIds: readonly string[];
  readonly worldFactLedger: readonly BaseWorldFactRecord[];
}

export function task11Lexeme(lexemeId: string): BaseTask11Part {
  return { kind: "lexeme", lexemeId };
}

export function task11Particle(sense: BaseParticleSense): BaseTask11Part {
  return { kind: "particle", sense };
}

export function task11VerbForm(
  lemmaId: string,
  form: BaseTask11VerbFormKind,
): BaseTask11Part {
  return { kind: "verb-form", lemmaId, form };
}

export const TASK11_COMMA: BaseTask11Part = deepFreeze({
  kind: "punctuation",
  mark: "comma",
});
export const TASK11_PERIOD: BaseTask11Part = deepFreeze({
  kind: "punctuation",
  mark: "period",
});

function formTokens(
  lemmaId: string,
  form: BaseTask11VerbFormKind,
): readonly AssembledToken[] {
  if (form === "dictionary") {
    const result = realizeVerbDictionary(lemmaId);
    if (result.ok) return result.value;
    throw new Error(`Missing canonical Base form ${lemmaId}:${form}.`);
  }
  if (form === "polite-stem") {
    const result = realizePoliteStem(lemmaId);
    if (result.ok) return result.value;
    throw new Error(`Missing canonical Base form ${lemmaId}:${form}.`);
  }
  if (form === "polite-nonpast") {
    const result = realizePoliteNonpast(lemmaId);
    if (result.ok) return result.value;
    throw new Error(`Missing canonical Base form ${lemmaId}:${form}.`);
  }
  const result = realizePoliteGrid(lemmaId);
  if (!result.ok) {
    throw new Error(`Missing canonical Base form ${lemmaId}:${form}.`);
  }
  const grid = result.value;
  return form === "nonpast-negative"
    ? grid.negative
    : form === "past-affirmative"
      ? grid.pastAffirmative
      : grid.pastNegative;
}

function lexicalTokens(lexemeId: string, id: string): readonly AssembledToken[] {
  const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
  if (!lexeme) throw new Error(`Unknown Base lexeme "${lexemeId}".`);
  return deepFreeze([
    {
      id,
      jp: lexeme.kana,
      romaji: lexeme.romaji,
      kind: "lexical",
      boundaryBefore: "attach",
      source: { domain: "catalog", referenceId: lexeme.id },
    },
  ]);
}

function punctuationTokens(
  mark: "comma" | "period",
  id: string,
): readonly AssembledToken[] {
  return deepFreeze([
    {
      id,
      jp: mark === "comma" ? "、" : "。",
      romaji: mark === "comma" ? "," : ".",
      kind: "punctuation",
      boundaryBefore: "attach",
      source: {
        domain: "catalog",
        referenceId: mark === "comma" ? "japanese-comma" : "japanese-period",
      },
    },
  ]);
}

function sequencePart(part: BaseTask11Part, id: string): BaseTokenSequencePart {
  if (part.kind === "lexeme") {
    return { tokens: lexicalTokens(part.lexemeId, id) };
  }
  if (part.kind === "particle") {
    return {
      tokens: deepFreeze(
        baseParticleSurfaceTokens(part.sense).map((token) => ({
          ...token,
          id,
          source: { ...token.source },
        })),
      ),
      boundaryBefore: "space",
    };
  }
  if (part.kind === "verb-form") {
    return { tokens: formTokens(part.lemmaId, part.form), boundaryBefore: "space" };
  }
  return { tokens: punctuationTokens(part.mark, id), boundaryBefore: "attach" };
}

function partLexemeIds(parts: readonly BaseTask11Part[]): readonly string[] {
  return [
    ...new Set(
      parts.flatMap((part) =>
        part.kind === "lexeme"
          ? [part.lexemeId]
          : part.kind === "verb-form"
            ? [part.lemmaId]
            : [],
      ),
    ),
  ];
}

function partFormIds(parts: readonly BaseTask11Part[]): readonly string[] {
  return [
    ...new Set(
      parts.flatMap((part) => {
        if (part.kind !== "verb-form") return [];
        if (part.form === "dictionary") return ["dictionary-lemma"];
        if (part.form === "polite-stem") return ["polite-stems"];
        if (part.form === "polite-nonpast") return ["masu-nonpast"];
        return ["four-polite-tense-cells"];
      }),
    ),
  ];
}

function partConceptIds(parts: readonly BaseTask11Part[]): readonly string[] {
  return [
    ...new Set(
      parts.flatMap((part) =>
        part.kind === "particle"
          ? [particleSenseFirstTeachContentId(part.sense)]
          : [],
      ),
    ),
  ];
}

export function task11Target(
  parts: readonly BaseTask11Part[],
  values: Omit<BaseTask11TargetSpec, "parts">,
): BaseTask11TargetSpec {
  return {
    parts,
    ...values,
  };
}

export function task11VerbTarget(
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  prefix: readonly BaseTask11Part[],
  values: Omit<
    BaseTask11TargetSpec,
    "parts" | "predicateLexemeId" | "predicateAspect"
  > &
    Readonly<{ readonly predicateAspect?: BasePredicateAspect }>,
): BaseTask11TargetSpec {
  return task11Target([...prefix, task11VerbForm(lemmaId, form)], {
    ...values,
    predicateLexemeId: lemmaId,
    predicateAspect: values.predicateAspect ?? "dynamic",
  });
}

export function task11Cue(...parts: readonly BaseTask11Part[]): BaseTask11TargetSpec {
  return task11Target(parts, {
    conceptIds: [],
    patternCellIds: [],
    semanticRoleIds: [],
    interpretationTags: [],
    predicateSenseId: null,
    predicateLexemeId: null,
  });
}

function visibleTarget(spec: BaseTask11TargetSpec, id: string): BaseVisibleTarget {
  const composed = composeBaseTokenSequences(
    spec.parts.map((part, index) => sequencePart(part, `${id}-${index + 1}`)),
  );
  if (!composed.ok) {
    throw new Error(`Invalid Task 11 token sequence "${id}".`);
  }
  return deepFreeze({
    tokens: composed.value,
    lexemeIds: partLexemeIds(spec.parts),
    conceptIds: [...new Set([...partConceptIds(spec.parts), ...spec.conceptIds])],
    formIds: partFormIds(spec.parts),
    patternCellIds: spec.patternCellIds,
    semanticRoleIds: spec.semanticRoleIds,
    interpretationTags: spec.interpretationTags,
    predicateSenseId: spec.predicateSenseId,
    predicateLexemeId: spec.predicateLexemeId,
    ...(spec.predicateAspect === undefined
      ? {}
      : { predicateAspect: spec.predicateAspect }),
    ...(spec.particleFrame === undefined
      ? {}
      : { particleFrame: spec.particleFrame }),
  });
}

function japanese(target: BaseVisibleTarget): string {
  return target.tokens.map(({ jp }) => jp).join("");
}

function exampleFor(
  lessonId: string,
  spec: BaseTask11ExampleSpec,
  index: number,
): BaseExample {
  const id = `${lessonId}-example-${index + 1}`;
  const target = visibleTarget(spec.target, id);
  return deepFreeze({
    ...target,
    id,
    teachingPurposeCopyId: `${id}-purpose`,
    translationCopy: { copyId: `${id}-translation` },
    predicateAspect: spec.target.predicateAspect ?? "nominal",
    discourseFrameId: spec.frame,
    utteranceKind: spec.utteranceKind,
  });
}

function operationEvidence(
  shape: BaseSemanticActivityShape,
  promptId: string,
  optionTargetIds: readonly string[],
  optionTargets: readonly BaseVisibleTarget[],
  correctOptionIndex: 0 | 1,
  errorCode: string | null,
): BaseSemanticActivityDesign["operationEvidence"] {
  if (shape.operation === "order-chunks") {
    return {
      kind: shape.operation,
      tileTargetIds: optionTargets[correctOptionIndex].tokens.map(({ id }) => id),
      orderedAnswerTargetId: optionTargetIds[correctOptionIndex],
    };
  }
  if (shape.operation === "transform-form") {
    return { kind: shape.operation, sourceTargetId: promptId };
  }
  if (shape.operation === "diagnose-error") {
    return {
      kind: shape.operation,
      candidateTargetId: promptId,
      errorCode: errorCode ?? "context-form-mismatch",
    };
  }
  return { kind: shape.operation };
}

function activitiesFor(
  spec: BaseTask11LessonSpec,
): Readonly<{
  readonly definitions: readonly BaseActivityDefinition[];
  readonly designs: readonly BaseSemanticActivityDesign[];
  readonly acceptedEntries: readonly (readonly [string, BaseVisibleTarget])[];
  readonly promptEntries: readonly (readonly [string, BaseVisibleTarget])[];
  readonly audioEntries: readonly (readonly [string, BaseVisibleTarget])[];
}> {
  const definitions: BaseActivityDefinition[] = [];
  const designs: BaseSemanticActivityDesign[] = [];
  const acceptedEntries: (readonly [string, BaseVisibleTarget])[] = [];
  const promptEntries: (readonly [string, BaseVisibleTarget])[] = [];
  const audioEntries: (readonly [string, BaseVisibleTarget])[] = [];

  spec.activities.forEach((activity, index) => {
    const id = `${spec.lessonId}-activity-${index + 1}`;
    const promptId = baseActivityPromptKey(spec.lessonId, id);
    const promptTarget = visibleTarget(activity.prompt, `${id}-prompt`);
    const isSpoken = activity.shape.operation === "produce-spoken";
    const distractor = {
      ...activity.distractor,
      patternCellIds: activity.distractor.patternCellIds.includes(
        activity.patternCellId,
      )
        ? [activity.patternCellId]
        : [],
    };
    const orderedSpecs =
      activity.correctOptionIndex === 0
        ? [activity.answer, distractor]
        : [distractor, activity.answer];
    const authoredOptionTargetIds = orderedSpecs.map(
      (_, optionIndex) => `${id}-option-${optionIndex + 1}`,
    );
    const authoredOptionTargets = orderedSpecs.map((target, optionIndex) =>
      visibleTarget(target, authoredOptionTargetIds[optionIndex]),
    );
    const acceptedAnswerTargetId = isSpoken
      ? `${id}-answer`
      : authoredOptionTargetIds[activity.correctOptionIndex];
    const acceptedAnswerTarget = isSpoken
      ? visibleTarget(activity.answer, acceptedAnswerTargetId)
      : authoredOptionTargets[activity.correctOptionIndex];
    const optionTargetIds = isSpoken ? [] : authoredOptionTargetIds;
    const optionTargets = isSpoken ? [] : authoredOptionTargets;
    const targetId =
      activity.shape.operation === "identify-audio"
        ? `${id}-audio`
        : acceptedAnswerTargetId;
    const assessedTargets = [promptTarget, acceptedAnswerTarget, ...optionTargets];
    const assessedConceptIds = [
      ...new Set(
        assessedTargets.flatMap((target) => [
          ...target.conceptIds,
          ...target.formIds,
        ]),
      ),
    ];
    const assessedLexemeIds = [
      ...new Set(assessedTargets.flatMap(({ lexemeIds }) => lexemeIds)),
    ];
    definitions.push({
      id,
      category: activity.shape.category,
      interactionKind: activity.shape.interactionKind,
      mode: activity.shape.mode,
      targetId,
      operation: activity.shape.operation,
      instructionCopyId: `${id}-instruction`,
      acceptedFeedbackCopyId: `${id}-feedback-accepted`,
      retryFeedbackCopyId: `${id}-feedback-retry`,
      assessedConceptIds,
      assessedLexemeIds,
      optionTargetIds,
    });
    designs.push({
      id,
      prompt: japanese(promptTarget),
      options: optionTargets.map(japanese),
      acceptedAnswers: [japanese(acceptedAnswerTarget)],
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
      audioTargetId:
        activity.shape.operation === "identify-audio" ? targetId : null,
      promptContextCopyId: activity.promptContextCopyId,
      reviewed: true,
      informationStructure: "not-applicable",
      category: activity.shape.category,
      interactionKind: activity.shape.interactionKind,
      mode: activity.shape.mode,
      operation: activity.shape.operation,
      patternCellId: activity.patternCellId,
      contextTarget: {
        id: `${id}-context`,
        copyId: activity.promptContextCopyId,
        kind: activity.shape.contextKind,
        informationStructure: "not-applicable",
        revealsAnswer: false,
        audioRequired: activity.shape.operation === "identify-audio",
        recallRequired: activity.shape.operation === "produce-spoken",
      },
      operationEvidence: operationEvidence(
        activity.shape,
        promptId,
        optionTargetIds,
        optionTargets,
        activity.correctOptionIndex,
        activity.errorCode,
      ),
      referentId: activity.referentId,
      worldFactId: activity.worldFactId,
      audioContract:
        activity.shape.operation === "identify-audio"
          ? {
              kind: "semantic-synthesis",
              targetId,
              locale: "ja-JP",
              promptVisible: false,
            }
          : null,
    });
    promptEntries.push([promptId, promptTarget]);
    optionTargetIds.forEach((optionTargetId, optionIndex) => {
      acceptedEntries.push([optionTargetId, optionTargets[optionIndex]]);
    });
    if (isSpoken) {
      acceptedEntries.push([acceptedAnswerTargetId, acceptedAnswerTarget]);
    }
    if (activity.shape.operation === "identify-audio") {
      audioEntries.push([targetId, acceptedAnswerTarget]);
    }
  });
  return deepFreeze({
    definitions,
    designs,
    acceptedEntries,
    promptEntries,
    audioEntries,
  });
}

function dialogueFor(
  lessonId: string,
  specs: readonly BaseTask11DialogueTurnSpec[],
): Readonly<{
  readonly wrapper: BaseTask11Dialogue;
  readonly canonical: BaseDialogue;
}> {
  const id = `${lessonId}-practical-dialogue`;
  const turns = specs.map((spec, index) => {
    const target = visibleTarget(spec.target, `${id}-turn-${index + 1}`);
    return deepFreeze({
      ...target,
      speakerId: spec.speakerId,
      discourseFrameId: spec.frame,
      predicateAspect: spec.target.predicateAspect ?? "nominal",
      utteranceKind: spec.utteranceKind,
    });
  });
  const practicalOutcomeCopyId = `${id}-outcome`;
  return deepFreeze({
    wrapper: {
      id,
      turns,
      practicalOutcomeCopyId,
      turnCopy: turns.map((_, index) => ({
        translationCopyId: `${id}-turn-${index + 1}-translation`,
        purposeCopyId: `${id}-turn-${index + 1}-purpose`,
      })),
    },
    canonical: { id, turns, practicalOutcomeCopyId },
  });
}

export function buildTask11Lesson(spec: BaseTask11LessonSpec): BuiltTask11Lesson {
  const examples = spec.examples.map((example, index) =>
    exampleFor(spec.lessonId, example, index),
  );
  const activities = activitiesFor(spec);
  const dialogue = spec.dialogue ? dialogueFor(spec.lessonId, spec.dialogue) : null;
  const explanation = {
    mainCopyId: `${spec.lessonId}-explanation-main`,
    constructionCopyId: `${spec.lessonId}-explanation-construction`,
    constraintsCopyId: `${spec.lessonId}-explanation-constraints`,
    commonErrorCopyId: `${spec.lessonId}-explanation-common-error`,
    nearestContrastId: `${spec.lessonId}-explanation-nearest-contrast`,
  };
  let content: BaseSystemLessonContent | BaseContentLessonContent;
  try {
    content = defineBaseLessonContent({
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
      referenceSnapshotIds: spec.referenceSnapshotIds,
      interactive: dialogue !== null,
      retrievedSystemIds: [],
    } as BaseSystemLessonContent | BaseContentLessonContent);
  } catch (error) {
    throw new Error(`Unable to define ${spec.lessonId}: ${String(error)}`);
  }
  const lesson = deepFreeze({
    content,
    titleCopyId: `${spec.lessonId}-title`,
    objectiveCopyId: `${spec.lessonId}-objective`,
    explanation,
    patternCellIds: spec.patternCellIds,
    examples,
    activityDesigns: activities.designs,
    dialogue: dialogue?.wrapper ?? null,
    reviewedTranslations: examples.map((target, index) => {
      const authored = spec.examples[index];
      return {
        target,
        japanese: japanese(target),
        copyId: `${target.id}-translation`,
        en: authored.en,
        it: authored.it,
        semanticTag: authored.semanticTag,
        enSemantic: authored.semanticTag,
        itSemantic: authored.semanticTag,
      };
    }),
  });
  return deepFreeze({
    lesson,
    exampleEntries: examples.map((example) => [example.id, example] as const),
    dialogueEntries: dialogue
      ? ([[dialogue.canonical.id, dialogue.canonical]] as const)
      : [],
    acceptedEntries: activities.acceptedEntries,
    promptEntries: activities.promptEntries,
    audioEntries: activities.audioEntries,
    patternEntry: [spec.lessonId, spec.patternCellIds] as const,
  });
}

export function task11ValidationCatalogs(
  previous: BaseValidationCatalogs,
  built: readonly BuiltTask11Lesson[],
): BaseValidationCatalogs {
  const append = <T>(
    field:
      | "examples"
      | "dialogues"
      | "acceptedAnswerTargets"
      | "activityPromptTargets"
      | "audioTargets",
    entries: readonly (readonly [string, T])[],
  ): ReadonlyMap<string, T> =>
    immutableReadonlyMap([
      ...(previous[field] as ReadonlyMap<string, T>).entries(),
      ...entries,
    ]);
  const patterns = [
    ...previous.patternCellIdsByLesson.entries(),
    ...built.map(({ patternEntry }) => patternEntry),
  ] as readonly (readonly [string, readonly string[]])[];
  return deepFreeze({
    lexemes: BASE_LEXEME_BY_ID,
    concepts: BASE_CONCEPT_BY_ID,
    examples: append(
      "examples",
      built.flatMap(({ exampleEntries }) => exampleEntries),
    ),
    dialogues: append(
      "dialogues",
      built.flatMap(({ dialogueEntries }) => dialogueEntries),
    ),
    audioTargets: append(
      "audioTargets",
      built.flatMap(({ audioEntries }) => audioEntries),
    ),
    acceptedAnswerTargets: append(
      "acceptedAnswerTargets",
      built.flatMap(({ acceptedEntries }) => acceptedEntries),
    ),
    activityPromptTargets: append(
      "activityPromptTargets",
      built.flatMap(({ promptEntries }) => promptEntries),
    ),
    copyIds: immutableReadonlySet(Object.keys(baseNavigationCopyEn.content)),
    contrastMapIds: immutableReadonlySet([]),
    referenceSnapshots: BASE_REFERENCE_SNAPSHOT_BY_ID,
    patternCellIds: immutableReadonlySet(
      patterns.flatMap(([, patternCellIds]) => patternCellIds),
    ),
    patternCellIdsByLesson: immutableReadonlyMap(patterns),
    systems: BASE_RETRIEVAL_SYSTEM_BY_ID,
  });
}

function denseArray(value: unknown): readonly unknown[] | undefined {
  try {
    if (
      !Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Array.prototype
    ) {
      return undefined;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.keys(descriptors).length !== value.length + 1) return undefined;
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
        return undefined;
      }
    }
    return value;
  } catch {
    return undefined;
  }
}

function plainRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  try {
    if (
      value === null ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return undefined;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (
      Object.values(descriptors).some(
        (descriptor) => !("value" in descriptor) || !descriptor.enumerable,
      )
    ) {
      return undefined;
    }
    return value as Readonly<Record<string, unknown>>;
  } catch {
    return undefined;
  }
}

export function task11PlainDataEqual(
  actual: unknown,
  expected: unknown,
  active: WeakSet<object> = new WeakSet(),
): boolean {
  if (
    actual === null ||
    expected === null ||
    typeof actual !== "object" ||
    typeof expected !== "object"
  ) {
    return Object.is(actual, expected);
  }
  if (active.has(actual)) return false;
  active.add(actual);
  try {
    const actualArray = denseArray(actual);
    const expectedArray = denseArray(expected);
    if (actualArray || expectedArray) {
      return (
        actualArray !== undefined &&
        expectedArray !== undefined &&
        actualArray.length === expectedArray.length &&
        actualArray.every((value, index) =>
          task11PlainDataEqual(value, expectedArray[index], active),
        )
      );
    }
    const actualRecord = plainRecord(actual);
    const expectedRecord = plainRecord(expected);
    if (!actualRecord || !expectedRecord) return false;
    const actualKeys = Object.keys(actualRecord).sort();
    const expectedKeys = Object.keys(expectedRecord).sort();
    if (
      actualKeys.length !== expectedKeys.length ||
      actualKeys.some((key, index) => key !== expectedKeys[index])
    ) {
      return false;
    }
    return actualKeys.every((key) => {
      const actualDescriptor = Object.getOwnPropertyDescriptor(actualRecord, key);
      const expectedDescriptor = Object.getOwnPropertyDescriptor(expectedRecord, key);
      return (
        actualDescriptor !== undefined &&
        expectedDescriptor !== undefined &&
        "value" in actualDescriptor &&
        "value" in expectedDescriptor &&
        task11PlainDataEqual(
          actualDescriptor.value,
          expectedDescriptor.value,
          active,
        )
      );
    });
  } catch {
    return false;
  } finally {
    active.delete(actual);
  }
}

export function validateTask11ModuleBase(
  value: unknown,
  expectedModuleId: string,
  expectedLessonIds: readonly string[],
  catalogs: BaseValidationCatalogs,
): Readonly<{ readonly ok: boolean; readonly errors: readonly BaseTask11ModuleError[] }> {
  const module = plainRecord(value);
  if (!module || module.id !== expectedModuleId) {
    return { ok: false, errors: ["invalid-module-shape"] };
  }
  const errors = new Set<BaseTask11ModuleError>();
  const lessons = denseArray(module.lessons);
  const sequence = denseArray(module.sequence);
  const worldFacts = plainRecord(module.worldFacts);
  const worldFactIds = denseArray(module.worldFactIds);
  if (!lessons || !sequence || !worldFacts || !worldFactIds) {
    return { ok: false, errors: ["invalid-module-shape"] };
  }
  if (
    lessons.length !== expectedLessonIds.length ||
    lessons.some((lesson, index) => {
      const record = plainRecord(lesson);
      const content = record ? plainRecord(record.content) : undefined;
      return !content || content.lessonId !== expectedLessonIds[index];
    })
  ) {
    errors.add("invalid-lesson-allocation");
  }
  if (
    !validatePublishedWorldFactLedger(module) ||
    worldFactIds.some((id) => typeof id !== "string")
  ) {
    errors.add("invalid-module-shape");
  }
  if (
    !validateNewLexemeMeaningCopies(
      lessons,
      catalogs,
      baseNavigationCopyEn.content,
      baseNavigationCopyIt.content,
    )
  ) {
    errors.add("invalid-copy");
  }
  if (
    validateFirstTeachOrder(
      sequence as readonly BaseLessonContent[],
      BASE_FIRST_TEACH_OWNERS,
      catalogs,
    ).length > 0
  ) {
    errors.add("canonical-depth-failure");
  }
  for (const lesson of lessons) {
    const record = plainRecord(lesson);
    const content = record ? plainRecord(record.content) : undefined;
    if (!record || !content) {
      errors.add("invalid-lesson-shape");
      continue;
    }
    if (
      validateBaseLessonDepth(content, catalogs).length > 0 ||
      !validatePublishedSemanticActivities(record)
    ) {
      errors.add("canonical-depth-failure");
    }
    const requiredCopyIds = [
      record.titleCopyId,
      record.objectiveCopyId,
      content.recapCopyId,
      ...Object.values(plainRecord(record.explanation) ?? {}),
      ...(denseArray(record.examples) ?? []).flatMap((example) => {
        const item = plainRecord(example);
        const translation = item ? plainRecord(item.translationCopy) : undefined;
        return [
          item?.teachingPurposeCopyId,
          translation?.copyId,
        ];
      }),
      ...(denseArray(content.activities) ?? []).flatMap((activity) => {
        const item = plainRecord(activity);
        return [
          item?.instructionCopyId,
          item?.acceptedFeedbackCopyId,
          item?.retryFeedbackCopyId,
        ];
      }),
      ...(denseArray(record.activityDesigns) ?? []).map(
        (design) => plainRecord(design)?.promptContextCopyId,
      ),
    ];
    if (
      requiredCopyIds.some(
        (id) =>
          typeof id !== "string" ||
          typeof baseNavigationCopyEn.content[id] !== "string" ||
          typeof baseNavigationCopyIt.content[id] !== "string" ||
          baseNavigationCopyEn.content[id].trim() === "" ||
          baseNavigationCopyIt.content[id].trim() === "",
      )
    ) {
      errors.add("invalid-copy");
    }
  }
  return { ok: errors.size === 0, errors: [...errors] };
}

function t(
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  patternCellIds: readonly string[],
  conceptIds: readonly string[],
  prefix: readonly BaseTask11Part[] = [],
  interpretationTags: readonly BaseInterpretationTag[] = [],
  semanticRoleIds: BaseTask11TargetSpec["semanticRoleIds"] = [],
): BaseTask11TargetSpec {
  return task11VerbTarget(lemmaId, form, prefix, {
    conceptIds,
    patternCellIds,
    semanticRoleIds,
    interpretationTags:
      interpretationTags.length > 0 ||
      (form !== "dictionary" && form !== "polite-stem")
        ? interpretationTags
        : ["metalinguistic"],
    predicateSenseId: lemmaId.slice("verb-".length),
  });
}

function ex(
  target: BaseTask11TargetSpec,
  frame: string,
  en: string,
  it: string,
  purposeEn: string,
  purposeIt: string,
  semanticTag: string,
  utteranceKind: NonNullable<BaseExample["utteranceKind"]> = "contextual-fragment",
): BaseTask11ExampleSpec {
  return {
    target,
    frame,
    utteranceKind,
    en,
    it,
    purposeEn,
    purposeIt,
    semanticTag,
  };
}

function act(
  prompt: BaseTask11TargetSpec,
  answer: BaseTask11TargetSpec,
  distractor: BaseTask11TargetSpec,
  correctOptionIndex: 0 | 1,
  promptContextCopyId: string,
  patternCellId: string,
  shape: BaseSemanticActivityShape,
  referentId: string | null = null,
  worldFactId: string | null = null,
  errorCode: string | null = null,
): BaseTask11ActivitySpec {
  return {
    prompt,
    answer,
    distractor,
    correctOptionIndex,
    promptContextCopyId,
    patternCellId,
    shape,
    referentId,
    worldFactId,
    errorCode,
  };
}

const L = task11Lexeme;
const P = task11Particle;
const C = TASK11_COMMA;
const META_LOOKUP = ["dictionary-lemma", "verb-predicate-recognition"] as const;
const CLASS_BY_LEMMA: Readonly<Record<string, string>> = {
  "verb-kaku": "godan-verb-class",
  "verb-yomu": "godan-verb-class",
  "verb-nomu": "godan-verb-class",
  "verb-kau": "godan-verb-class",
  "verb-hataraku": "godan-verb-class",
  "verb-asobu": "godan-verb-class",
  "verb-oyogu": "godan-verb-class",
  "verb-kaeru": "godan-verb-class",
  "verb-taberu": "ichidan-verb-class",
  "verb-miru": "ichidan-verb-class",
  "verb-suru": "suru-verb-class",
  "verb-kuru": "kuru-verb-class",
};

function classTarget(
  lemmaId: string,
  patternCellId: string | null,
  extraConceptIds: readonly string[] = [],
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  return t(
    lemmaId,
    "dictionary",
    patternCellId === null ? [] : [patternCellId],
    [CLASS_BY_LEMMA[lemmaId], ...extraConceptIds],
    prefix,
  );
}

function permutedVerbTarget(
  lemmaId: string,
  parts: readonly BaseTask11Part[],
  patternCellId: string,
  conceptIds: readonly string[],
  interpretationTags: readonly BaseInterpretationTag[] = [],
  semanticRoleIds: BaseTask11TargetSpec["semanticRoleIds"] = [],
): BaseTask11TargetSpec {
  return task11Target(parts, {
    conceptIds,
    patternCellIds: [patternCellId],
    semanticRoleIds,
    interpretationTags:
      interpretationTags.length > 0 ? interpretationTags : ["metalinguistic"],
    predicateSenseId: lemmaId.slice("verb-".length),
    predicateLexemeId: lemmaId,
    predicateAspect: "dynamic",
  });
}

function stemTarget(
  lemmaId: string,
  patternCellId: string | null,
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  const lexeme = BASE_LEXEME_BY_ID.get(lemmaId);
  const classId =
    lexeme?.category === "verb"
      ? lexeme.verbClass === "godan"
        ? "godan-verb-class"
        : lexeme.verbClass === "ichidan"
          ? "ichidan-verb-class"
          : lexeme.verbClass === "suru"
            ? "suru-verb-class"
            : "kuru-verb-class"
      : "";
  return t(
    lemmaId,
    "polite-stem",
    patternCellId === null ? [] : [patternCellId],
    [classId],
    prefix,
  );
}

function politeTarget(
  lemmaId: string,
  patternCellId: string,
  prefix: readonly BaseTask11Part[],
  tag: "habitual" | "future" = "habitual",
): BaseTask11TargetSpec {
  return t(
    lemmaId,
    "polite-nonpast",
    [patternCellId],
    ["sentence-omission"],
    prefix,
    [tag],
    prefix.some(
      (part) =>
        part.kind === "particle" &&
        (part.sense === "topic-wa" || part.sense === "additive-mo"),
    )
      ? ["topic"]
      : [],
  );
}

function politeFinalTarget(
  lemmaId: string,
  patternCellId: string,
  prefix: readonly BaseTask11Part[],
  suffix: readonly BaseTask11Part[],
  tag: "habitual" | "future" = "habitual",
  semanticRoleIds: BaseTask11TargetSpec["semanticRoleIds"] = [],
): BaseTask11TargetSpec {
  return task11Target(
    [...prefix, task11VerbForm(lemmaId, "polite-nonpast"), ...suffix],
    {
      conceptIds: ["sentence-omission"],
      patternCellIds: [patternCellId],
      semanticRoleIds,
      interpretationTags: [tag],
      predicateSenseId: lemmaId.slice("verb-".length),
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
    },
  );
}

const LOOKUP_CELL = "pv1-dictionary-lookup";
const PREDICATE_CELL = "pv1-verb-predicate";
const L1: BaseTask11LessonSpec = {
  lessonId: "polite-verbs-1",
  contract: "system",
  prerequisiteLessonIds: ["topic-questions-4"],
  newLexemeIds: [
    "verb-kaku",
    "verb-yomu",
    "verb-nomu",
    "verb-kau",
    "verb-hataraku",
    "verb-asobu",
  ],
  reviewLexemeIds: [
    "anchor-hon",
    "anchor-pan",
    "anchor-kippu",
    "noun-gakusei",
    "noun-tomodachi",
    "noun-kazoku",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
  ],
  introducedConceptIds: [...META_LOOKUP],
  reviewedConceptIds: ["sentence-order"],
  patternCellIds: [LOOKUP_CELL, PREDICATE_CELL],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
  ],
  examples: [
    ex(t("verb-kaku", "dictionary", [LOOKUP_CELL], META_LOOKUP), "lookup-write", "Lookup form: かく, “to write.”", "Forma di consultazione: かく, «scrivere».", "Presents a dictionary form as a lookup label, not a tense.", "Presenta la forma dizionario come etichetta, non come tempo verbale.", "lookup"),
    ex(t("verb-yomu", "dictionary", [LOOKUP_CELL], META_LOOKUP), "lookup-read", "Lookup form: よむ, “to read.”", "Forma di consultazione: よむ, «leggere».", "Identifies the final verb predicate on a dictionary card.", "Individua il predicato verbale finale su una scheda.", "lookup"),
    ex(t("verb-nomu", "dictionary", [LOOKUP_CELL], META_LOOKUP), "lookup-drink", "Lookup form: のむ, “to drink.”", "Forma di consultazione: のむ, «bere».", "Keeps lemma recognition separate from time reference.", "Separa il riconoscimento del lemma dal riferimento temporale.", "lookup"),
    ex(t("verb-kau", "dictionary", [LOOKUP_CELL], META_LOOKUP), "lookup-buy", "Lookup form: かう, “to buy.”", "Forma di consultazione: かう, «comprare».", "Shows another complete lookup form ending in う.", "Mostra un'altra forma di consultazione completa in う.", "lookup"),
    ex(t("verb-hataraku", "dictionary", [LOOKUP_CELL], META_LOOKUP), "lookup-work", "Lookup form: はたらく, “to work.”", "Forma di consultazione: はたらく, «lavorare».", "Recognizes a longer verb as one predicate lexeme.", "Riconosce un verbo più lungo come un solo lessema predicativo.", "lookup"),
    ex(t("verb-asobu", "dictionary", [LOOKUP_CELL], META_LOOKUP), "lookup-play", "Lookup form: あそぶ, “to play.”", "Forma di consultazione: あそぶ, «giocare».", "Completes the six authored lookup lemmas.", "Completa i sei lemmi di consultazione.", "lookup"),
    ex(t("verb-yomu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("anchor-hon"), C]), "book-action-card", "Book scene — action word よむ.", "Scena con un libro — parola d'azione よむ.", "Places a known noun cue before the final lookup predicate.", "Mette un nome noto prima del predicato di consultazione finale.", "predicate-recognition"),
    ex(t("verb-kau", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("anchor-kagi"), C]), "key-action-card", "Key scene — action word かう.", "Scena con una chiave — parola d'azione かう.", "Uses a scene label without presenting a productive sentence.", "Usa un'etichetta di scena senza proporre una frase produttiva.", "predicate-recognition"),
    ex(t("verb-hataraku", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-gakusei"), C]), "student-work-card", "Student scene — action word はたらく.", "Scena con uno studente — parola d'azione はたらく.", "Recognizes the verb as the final predicate item.", "Riconosce il verbo come elemento predicativo finale.", "predicate-recognition"),
    ex(t("verb-asobu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-tomodachi"), C]), "friend-play-card", "Friend scene — action word あそぶ.", "Scena con un amico — parola d'azione あそぶ.", "Contrasts an action predicate with the preceding noun cue.", "Contrappone il predicato d'azione al nome che lo precede.", "predicate-recognition"),
  ],
  activities: [
    act(task11Cue(L("anchor-hon")), t("verb-yomu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-kazoku"), C]), t("verb-nomu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-kazoku"), C]), 0, "polite-verbs-1-activity-1-instruction", PREDICATE_CELL, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("anchor-kippu")), t("verb-kau", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("anchor-kippu"), C]), t("verb-hataraku", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("anchor-kippu"), C]), 1, "polite-verbs-1-activity-2-instruction", PREDICATE_CELL, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-sensei")), t("verb-hataraku", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-sensei"), C]), t("verb-asobu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-sensei"), C]), 0, "polite-verbs-1-activity-3-instruction", PREDICATE_CELL, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-watashi")), t("verb-nomu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-watashi"), C]), t("verb-hataraku", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-watashi"), C]), 1, "polite-verbs-1-activity-4-instruction", PREDICATE_CELL, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-gakusei"), L("verb-yomu")), t("verb-yomu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-gakusei"), C]), permutedVerbTarget("verb-yomu", [task11VerbForm("verb-yomu", "dictionary"), C, L("noun-gakusei")], PREDICATE_CELL, META_LOOKUP), 0, "polite-verbs-1-activity-5-instruction", PREDICATE_CELL, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-tanaka")), t("verb-hataraku", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-tanaka"), C]), t("verb-asobu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-tanaka"), C]), 1, "polite-verbs-1-activity-6-instruction", PREDICATE_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, "tanaka", "tanaka-works"),
    act(t("verb-nomu", "dictionary", [], META_LOOKUP, [L("anchor-pan"), C]), t("verb-kau", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("anchor-pan"), C]), t("verb-yomu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("anchor-pan"), C]), 1, "polite-verbs-1-activity-7-instruction", PREDICATE_CELL, BASE_ERROR_ACTIVITY_SHAPE, "bread-counter", "bread-is-bought", "world-fact-mismatch"),
    act(task11Cue(L("noun-yamada")), t("verb-asobu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-yamada"), C]), t("verb-kaku", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-yamada"), C]), 0, "polite-verbs-1-activity-8-instruction", PREDICATE_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE, "yamada", "yamada-plays"),
    act(task11Cue(L("noun-satou")), t("verb-yomu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-satou"), C]), t("verb-nomu", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-satou"), C]), 1, "polite-verbs-1-activity-9-instruction", PREDICATE_CELL, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-suzuki")), t("verb-hataraku", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-suzuki"), C]), t("verb-kau", "dictionary", [PREDICATE_CELL], META_LOOKUP, [L("noun-suzuki"), C]), 0, "polite-verbs-1-activity-10-instruction", PREDICATE_CELL, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const GODAN_CELL = "pv2-godan-class";
const ICHIDAN_CELL = "pv2-ichidan-class";
const SPECIAL_CELL = "pv2-special-class";
const EXCEPTION_CELL = "pv2-iru-eru-exception";
const L2: BaseTask11LessonSpec = {
  lessonId: "polite-verbs-2",
  contract: "system",
  prerequisiteLessonIds: ["polite-verbs-1"],
  newLexemeIds: [
    "verb-oyogu",
    "verb-taberu",
    "verb-miru",
    "verb-kaeru",
    "verb-suru",
    "verb-kuru",
  ],
  reviewLexemeIds: [
    "verb-kaku",
    "verb-yomu",
    "verb-nomu",
    "verb-kau",
    "verb-hataraku",
    "verb-asobu",
    "anchor-hon",
    "noun-gakusei",
    "noun-tomodachi",
    "noun-tanaka",
    "noun-yamada",
  ],
  introducedConceptIds: [
    "godan-verb-class",
    "ichidan-verb-class",
    "suru-verb-class",
    "kuru-verb-class",
    "verb-class-exceptions",
  ],
  reviewedConceptIds: ["dictionary-lemma", "verb-predicate-recognition"],
  patternCellIds: [GODAN_CELL, ICHIDAN_CELL, SPECIAL_CELL, EXCEPTION_CELL],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
  ],
  examples: [
    ex(classTarget("verb-oyogu", GODAN_CELL), "godan-oyogu", "およぐ is godan: its final row changes in polite forms.", "およぐ è godan: la riga finale cambia nelle forme cortesi.", "Classifies from the stored verb class, not the final sound alone.", "Classifica dalla classe registrata, non dal solo suono finale.", "godan"),
    ex(classTarget("verb-kaeru", GODAN_CELL, ["verb-class-exceptions"]), "godan-kaeru", "かえる is a reviewed -eru exception: it is godan.", "かえる è un'eccezione in -eru già esaminata: è godan.", "Makes the explicit -eru exception visible.", "Rende visibile l'eccezione esplicita in -eru.", "godan-exception"),
    ex(classTarget("verb-taberu", ICHIDAN_CELL), "ichidan-taberu", "たべる is ichidan.", "たべる è ichidan.", "Contrasts an ordinary -eru ichidan verb with かえる.", "Contrappone un normale verbo ichidan in -eru a かえる.", "ichidan"),
    ex(classTarget("verb-miru", ICHIDAN_CELL), "ichidan-miru", "みる is ichidan.", "みる è ichidan.", "Adds an owned -iru ichidan form.", "Aggiunge una forma ichidan in -iru.", "ichidan"),
    ex(classTarget("verb-suru", SPECIAL_CELL), "special-suru", "する has its own stored class.", "する ha una classe registrata propria.", "Names the special class before deriving its stem.", "Nomina la classe speciale prima di derivarne il tema.", "special-class"),
    ex(classTarget("verb-kuru", SPECIAL_CELL), "special-kuru", "くる has its own stored class.", "くる ha una classe registrata propria.", "Keeps くる separate from final-sound guessing.", "Tiene くる separato dalle supposizioni basate sul suono finale.", "special-class"),
    ex(task11Target([task11VerbForm("verb-taberu", "dictionary"), C, task11VerbForm("verb-kaeru", "dictionary")], { conceptIds: ["ichidan-verb-class", "godan-verb-class", "verb-class-exceptions"], patternCellIds: [EXCEPTION_CELL], semanticRoleIds: [], interpretationTags: ["metalinguistic"], predicateSenseId: null, predicateLexemeId: null, predicateAspect: "dynamic" }), "eru-comparison", "Compare たべる (ichidan) with かえる (godan).", "Confronta たべる (ichidan) e かえる (godan).", "Shows why -eru spelling alone cannot decide the class.", "Mostra perché la grafia in -eru non basta a decidere la classe.", "class-contrast"),
    ex(task11Target([task11VerbForm("verb-miru", "dictionary"), C, task11VerbForm("verb-suru", "dictionary")], { conceptIds: ["ichidan-verb-class", "suru-verb-class", "verb-class-exceptions"], patternCellIds: [EXCEPTION_CELL], semanticRoleIds: [], interpretationTags: ["metalinguistic"], predicateSenseId: null, predicateLexemeId: null, predicateAspect: "dynamic" }), "iru-special-comparison", "Compare みる (ichidan) with special する.", "Confronta みる (ichidan) con lo speciale する.", "Requires the stored class for two similar-looking endings.", "Richiede la classe registrata per due finali simili.", "class-contrast"),
    ex(classTarget("verb-oyogu", GODAN_CELL, [], [L("noun-tomodachi"), C]), "scene-godan", "Friend scene — およぐ is the godan predicate.", "Scena con un amico — およぐ è il predicato godan.", "Applies class recognition in a scene label.", "Applica il riconoscimento della classe in un'etichetta di scena.", "godan"),
    ex(classTarget("verb-kuru", SPECIAL_CELL, [], [L("noun-tanaka"), C]), "scene-kuru", "Tanaka scene — くる uses the special class.", "Scena con Tanaka — くる usa la classe speciale.", "Retrieves くる as a special lookup lemma.", "Recupera くる come lemma speciale.", "special-class"),
  ],
  activities: [
    act(task11Cue(L("anchor-umi")), classTarget("verb-oyogu", GODAN_CELL, [], [L("anchor-umi"), C]), classTarget("verb-miru", ICHIDAN_CELL, [], [L("anchor-umi"), C]), 1, "polite-verbs-2-activity-1-instruction", GODAN_CELL, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("anchor-hon")), classTarget("verb-miru", ICHIDAN_CELL, [], [L("anchor-hon"), C]), classTarget("verb-hataraku", GODAN_CELL, [], [L("anchor-hon"), C]), 0, "polite-verbs-2-activity-2-instruction", ICHIDAN_CELL, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-gakusei"), L("verb-taberu")), classTarget("verb-taberu", ICHIDAN_CELL, [], [L("noun-gakusei"), C]), permutedVerbTarget("verb-taberu", [task11VerbForm("verb-taberu", "dictionary"), C, L("noun-gakusei")], ICHIDAN_CELL, ["ichidan-verb-class"]), 0, "polite-verbs-2-activity-3-instruction", ICHIDAN_CELL, BASE_ORDERING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-yamada")), classTarget("verb-kaeru", EXCEPTION_CELL, ["verb-class-exceptions"], [L("noun-yamada"), C]), classTarget("verb-miru", ICHIDAN_CELL, [], [L("noun-yamada"), C]), 1, "polite-verbs-2-activity-4-instruction", EXCEPTION_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, "yamada", "yamada-returns"),
    act(classTarget("verb-kaeru", null, ["verb-class-exceptions"], [L("noun-tanaka"), C]), classTarget("verb-kaeru", EXCEPTION_CELL, ["verb-class-exceptions"], [L("noun-tanaka"), C, L("anchor-ie")]), classTarget("verb-taberu", ICHIDAN_CELL, [], [L("noun-tanaka"), C, L("anchor-ie")]), 0, "polite-verbs-2-activity-5-instruction", EXCEPTION_CELL, BASE_ERROR_ACTIVITY_SHAPE, "tanaka", "tanaka-return-class", "class-guess-mismatch"),
    act(task11Cue(L("noun-satou")), classTarget("verb-suru", SPECIAL_CELL, [], [L("noun-satou"), C]), classTarget("verb-kuru", SPECIAL_CELL, [], [L("noun-satou"), C, L("anchor-ie")]), 1, "polite-verbs-2-activity-6-instruction", SPECIAL_CELL, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-suzuki")), classTarget("verb-kuru", SPECIAL_CELL, [], [L("noun-suzuki"), C]), classTarget("verb-kaeru", GODAN_CELL, ["verb-class-exceptions"], [L("noun-suzuki"), C]), 0, "polite-verbs-2-activity-7-instruction", SPECIAL_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-mari")), classTarget("verb-miru", ICHIDAN_CELL, [], [L("noun-mari"), C]), classTarget("verb-oyogu", GODAN_CELL, [], [L("noun-mari"), C, L("anchor-umi")]), 1, "polite-verbs-2-activity-8-instruction", ICHIDAN_CELL, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-watashi")), classTarget("verb-taberu", ICHIDAN_CELL, [], [L("noun-watashi"), C]), classTarget("verb-kaeru", GODAN_CELL, ["verb-class-exceptions"], [L("noun-watashi"), C]), 0, "polite-verbs-2-activity-9-instruction", ICHIDAN_CELL, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-tomodachi")), classTarget("verb-oyogu", GODAN_CELL, [], [L("noun-tomodachi"), C, L("anchor-umi")]), classTarget("verb-suru", SPECIAL_CELL, [], [L("noun-tomodachi"), C]), 1, "polite-verbs-2-activity-10-instruction", GODAN_CELL, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const GODAN_STEM = "pv3-godan-stem";
const ICHIDAN_STEM = "pv3-ichidan-stem";
const SURU_STEM = "pv3-suru-stem";
const KURU_STEM = "pv3-kuru-stem";
const L3: BaseTask11LessonSpec = {
  lessonId: "polite-verbs-3",
  contract: "system",
  prerequisiteLessonIds: ["polite-verbs-2"],
  newLexemeIds: [
    "verb-benkyou-suru",
    "verb-denwa-suru",
    "verb-sanpo-suru",
    "verb-matsu",
  ],
  reviewLexemeIds: [
    "verb-kaku",
    "verb-yomu",
    "verb-kaeru",
    "verb-taberu",
    "verb-miru",
    "verb-suru",
    "verb-kuru",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
    "name-haru",
  ],
  introducedConceptIds: ["polite-stems"],
  reviewedConceptIds: [
    "godan-verb-class",
    "ichidan-verb-class",
    "suru-verb-class",
    "kuru-verb-class",
  ],
  patternCellIds: [GODAN_STEM, ICHIDAN_STEM, SURU_STEM, KURU_STEM],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
  ],
  examples: [
    ex(stemTarget("verb-kaku", GODAN_STEM), "stem-kaku", "かく changes to the polite stem かき.", "かく passa al tema cortese かき.", "Derives a godan stem through the canonical engine.", "Deriva un tema godan con il motore canonico.", "godan-stem"),
    ex(stemTarget("verb-matsu", GODAN_STEM), "stem-matsu", "まつ changes to まち.", "まつ passa a まち.", "Shows the godan つ-to-ち row change.", "Mostra il cambio di riga godan da つ a ち.", "godan-stem"),
    ex(stemTarget("verb-kaeru", GODAN_STEM), "stem-kaeru", "Godan かえる changes to かえり.", "Il godan かえる passa a かえり.", "Applies the stored exception class honestly.", "Applica correttamente la classe eccezionale registrata.", "godan-stem"),
    ex(stemTarget("verb-taberu", ICHIDAN_STEM), "stem-taberu", "Ichidan たべる changes to たべ.", "L'ichidan たべる passa a たべ.", "Removes the owned ichidan る.", "Rimuove il る dell'ichidan conosciuto.", "ichidan-stem"),
    ex(stemTarget("verb-miru", ICHIDAN_STEM), "stem-miru", "Ichidan みる changes to み.", "L'ichidan みる passa a み.", "Confirms the short ichidan stem.", "Conferma il tema ichidan breve.", "ichidan-stem"),
    ex(stemTarget("verb-suru", SURU_STEM), "stem-suru", "する has the explicit polite stem し.", "する ha il tema cortese esplicito し.", "Teaches the required する→し mapping.", "Insegna la corrispondenza richiesta する→し.", "suru-stem"),
    ex(stemTarget("verb-kuru", KURU_STEM), "stem-kuru", "くる has the explicit polite stem き.", "くる ha il tema cortese esplicito き.", "Teaches the required くる→き mapping.", "Insegna la corrispondenza richiesta くる→き.", "kuru-stem"),
    ex(stemTarget("verb-benkyou-suru", SURU_STEM), "stem-study", "べんきょうする keeps its noun and uses し.", "べんきょうする conserva il nome e usa し.", "Derives a compound する stem without duplicating a string.", "Deriva un tema composto in する senza duplicare stringhe.", "suru-compound-stem"),
    ex(stemTarget("verb-denwa-suru", SURU_STEM), "stem-call", "でんわする becomes でんわし.", "でんわする diventa でんわし.", "Applies the same canonical compound rule to calling.", "Applica la stessa regola canonica al telefonare.", "suru-compound-stem"),
    ex(stemTarget("verb-sanpo-suru", SURU_STEM), "stem-walk", "さんぽする becomes さんぽし.", "さんぽする diventa さんぽし.", "Adds a distinct compound-stem meaning.", "Aggiunge un significato distinto con tema composto.", "suru-compound-stem"),
  ],
  activities: [
    act(task11Cue(L("verb-kaku")), stemTarget("verb-kaku", GODAN_STEM, [L("noun-watashi"), C]), stemTarget("verb-matsu", GODAN_STEM, [L("name-haru"), C]), 0, "polite-verbs-3-activity-1-instruction", GODAN_STEM, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(L("verb-taberu")), stemTarget("verb-taberu", ICHIDAN_STEM, [L("noun-tanaka"), C]), stemTarget("verb-kaeru", GODAN_STEM, [L("noun-tanaka"), C]), 0, "polite-verbs-3-activity-2-instruction", ICHIDAN_STEM, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-yamada"), L("verb-benkyou-suru")), stemTarget("verb-benkyou-suru", SURU_STEM, [L("noun-yamada"), C]), permutedVerbTarget("verb-benkyou-suru", [task11VerbForm("verb-benkyou-suru", "polite-stem"), C, L("noun-yamada")], SURU_STEM, ["suru-verb-class"]), 1, "polite-verbs-3-activity-3-instruction", SURU_STEM, BASE_ORDERING_ACTIVITY_SHAPE),
    act(t("verb-suru", "dictionary", [], ["suru-verb-class"], [L("noun-satou"), C]), stemTarget("verb-suru", SURU_STEM, [L("noun-satou"), C]), stemTarget("verb-kuru", KURU_STEM, [L("noun-satou"), C]), 1, "polite-verbs-3-activity-4-instruction", SURU_STEM, BASE_TRANSFORMATION_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-suzuki")), stemTarget("verb-kuru", KURU_STEM, [L("noun-suzuki"), C]), stemTarget("verb-suru", SURU_STEM, [L("noun-suzuki"), C, L("anchor-ie")]), 0, "polite-verbs-3-activity-5-instruction", KURU_STEM, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(stemTarget("verb-kaeru", null, [L("noun-mari"), C]), stemTarget("verb-kaeru", GODAN_STEM, [L("noun-mari"), C, L("anchor-ie")]), stemTarget("verb-taberu", ICHIDAN_STEM, [L("noun-mari"), C]), 1, "polite-verbs-3-activity-6-instruction", GODAN_STEM, BASE_ERROR_ACTIVITY_SHAPE, "mari", "mari-return-stem", "class-stem-mismatch"),
    act(task11Cue(L("noun-watashi"), L("anchor-denwa")), stemTarget("verb-denwa-suru", SURU_STEM, [L("noun-watashi"), C]), stemTarget("verb-sanpo-suru", SURU_STEM, [L("noun-watashi"), C]), 0, "polite-verbs-3-activity-7-instruction", SURU_STEM, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-tomodachi")), stemTarget("verb-sanpo-suru", SURU_STEM, [L("noun-tomodachi"), C]), stemTarget("verb-benkyou-suru", SURU_STEM, [L("noun-tomodachi"), C, L("anchor-hon")]), 1, "polite-verbs-3-activity-8-instruction", SURU_STEM, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-gakusei")), stemTarget("verb-miru", ICHIDAN_STEM, [L("noun-gakusei"), C]), stemTarget("verb-yomu", GODAN_STEM, [L("noun-gakusei"), C]), 0, "polite-verbs-3-activity-9-instruction", ICHIDAN_STEM, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-tanaka")), stemTarget("verb-denwa-suru", SURU_STEM, [L("noun-tanaka"), C]), stemTarget("verb-kuru", KURU_STEM, [L("noun-tanaka"), C]), 1, "polite-verbs-3-activity-10-instruction", SURU_STEM, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: null,
};

const EXPLICIT_MASU = "pv4-explicit-topic-masu";
const OMITTED_MASU = "pv4-grounded-omission-masu";
const TOPIC = (id: string): readonly BaseTask11Part[] => [L(id), P("topic-wa")];
const L4: BaseTask11LessonSpec = {
  lessonId: "polite-verbs-4",
  contract: "content",
  prerequisiteLessonIds: ["polite-verbs-3"],
  newLexemeIds: [
    "verb-yasumu",
    "verb-okiru",
    "verb-neru",
    "verb-aruku",
    "verb-kiku",
    "verb-tsukuru",
    "verb-au",
    "verb-utau",
    "verb-hanasu",
    "verb-iku",
  ],
  reviewLexemeIds: [
    "verb-hataraku",
    "verb-matsu",
    "verb-benkyou-suru",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
    "noun-yuki-san",
    "noun-tomodachi",
    "noun-sensei",
    "noun-gakusei",
    "expression-hai",
    "expression-iie",
  ],
  introducedConceptIds: ["masu-nonpast"],
  reviewedConceptIds: [
    "polite-stems",
    "sentence-omission",
    "topic-wa",
    "question-ka",
    "additive-mo",
    "interactional-yo",
  ],
  patternCellIds: [EXPLICIT_MASU, OMITTED_MASU],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
  ],
  examples: [
    ex(politeTarget("verb-yasumu", EXPLICIT_MASU, TOPIC("noun-watashi")), "learner-rests", "I rest / take the day off.", "Io riposo / mi prendo un giorno libero.", "Models a habitual polite action with an explicit topic.", "Modella un'azione abituale cortese con tema esplicito.", "habitual", "complete-clause"),
    ex(politeTarget("verb-okiru", EXPLICIT_MASU, TOPIC("noun-tanaka")), "tanaka-wakes", "Tanaka wakes up.", "Tanaka si sveglia.", "Uses the owned ichidan stem plus ます.", "Usa il tema ichidan noto più ます.", "habitual", "complete-clause"),
    ex(politeTarget("verb-neru", EXPLICIT_MASU, TOPIC("noun-yamada")), "yamada-sleeps", "Yamada sleeps.", "Yamada dorme.", "Contrasts another ichidan action in a familiar topic frame.", "Contrappone un'altra azione ichidan in un tema noto.", "habitual", "complete-clause"),
    ex(politeTarget("verb-aruku", EXPLICIT_MASU, TOPIC("noun-satou")), "satou-walks", "Satou walks.", "Satou cammina.", "Builds a godan polite predicate from its generated stem.", "Costruisce un predicato cortese godan dal tema generato.", "habitual", "complete-clause"),
    ex(politeTarget("verb-kiku", EXPLICIT_MASU, TOPIC("noun-suzuki")), "suzuki-listens", "Suzuki listens.", "Suzuki ascolta.", "Leaves a recoverable theme unspoken without claiming it is overt.", "Lascia inespresso un tema recuperabile senza dichiararlo esplicito.", "habitual", "complete-clause"),
    ex(politeTarget("verb-tsukuru", EXPLICIT_MASU, TOPIC("noun-mari"), "future"), "mari-makes", "Mari will make it.", "Mari lo preparerà.", "Uses context to license a future nonpast reading.", "Usa il contesto per una lettura futura del non-passato.", "future", "complete-clause"),
    ex(politeTarget("verb-au", EXPLICIT_MASU, TOPIC("noun-yuki-san"), "future"), "yuki-meets", "Yuki will meet them.", "Yuki li incontrerà.", "Omits the recoverable person while keeping the predicate natural.", "Omette la persona recuperabile mantenendo naturale il predicato.", "future", "complete-clause"),
    ex(politeTarget("verb-utau", EXPLICIT_MASU, TOPIC("noun-tomodachi")), "friend-sings", "My friend sings.", "Il mio amico canta.", "Adds an intransitive habitual action.", "Aggiunge un'azione abituale intransitiva.", "habitual", "complete-clause"),
    ex(politeTarget("verb-hanasu", OMITTED_MASU, [], "future"), "grounded-speaks", "I will speak. (speaker recoverable)", "Parlerò. (parlante recuperabile)", "Models natural omission with no overt argument-role claim.", "Modella l'omissione naturale senza dichiarare ruoli assenti.", "future", "complete-clause"),
    ex(politeTarget("verb-iku", OMITTED_MASU, [], "future"), "grounded-goes", "I will go. (mover and goal recoverable)", "Andrò. (persona e meta recuperabili)", "Introduces going without naming a goal before argument particles.", "Introduce andare senza nominare una meta prima delle particelle argomentali.", "future", "complete-clause"),
  ],
  activities: [
    act(task11Cue(L("noun-watashi")), politeTarget("verb-okiru", EXPLICIT_MASU, TOPIC("noun-watashi")), politeTarget("verb-neru", EXPLICIT_MASU, TOPIC("noun-watashi")), 0, "polite-verbs-4-activity-1-instruction", EXPLICIT_MASU, BASE_MEANING_ACTIVITY_SHAPE, "learner", "learner-wakes"),
    act(task11Cue(L("noun-tanaka")), politeTarget("verb-hataraku", EXPLICIT_MASU, TOPIC("noun-tanaka")), politeTarget("verb-yasumu", EXPLICIT_MASU, TOPIC("noun-tanaka"), "future"), 1, "polite-verbs-4-activity-2-instruction", EXPLICIT_MASU, BASE_CONTEXT_ACTIVITY_SHAPE, "tanaka", "tanaka-works"),
    act(task11Cue(L("noun-yamada"), L("verb-aruku")), politeTarget("verb-aruku", EXPLICIT_MASU, TOPIC("noun-yamada")), permutedVerbTarget("verb-aruku", [task11VerbForm("verb-aruku", "polite-nonpast"), P("topic-wa"), L("noun-yamada")], EXPLICIT_MASU, ["sentence-omission"], ["habitual"], ["topic"]), 1, "polite-verbs-4-activity-3-instruction", EXPLICIT_MASU, BASE_ORDERING_ACTIVITY_SHAPE),
    act(stemTarget("verb-kiku", null, [L("noun-suzuki"), C]), politeTarget("verb-kiku", EXPLICIT_MASU, [L("noun-suzuki"), P("additive-mo")]), politeTarget("verb-tsukuru", EXPLICIT_MASU, [L("noun-suzuki"), P("additive-mo")], "future"), 0, "polite-verbs-4-activity-4-instruction", EXPLICIT_MASU, BASE_TRANSFORMATION_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-mari")), politeTarget("verb-tsukuru", EXPLICIT_MASU, [L("noun-mari"), P("additive-mo")], "future"), politeTarget("verb-utau", EXPLICIT_MASU, TOPIC("noun-mari")), 0, "polite-verbs-4-activity-5-instruction", EXPLICIT_MASU, BASE_CONTROLLED_ACTIVITY_SHAPE, "mari", "mari-makes"),
    act(t("verb-neru", "polite-nonpast", [], ["sentence-omission"], [], ["habitual"]), politeTarget("verb-hanasu", OMITTED_MASU, [L("expression-hai"), C], "future"), politeTarget("verb-matsu", OMITTED_MASU, [L("expression-iie"), C]), 1, "polite-verbs-4-activity-6-instruction", OMITTED_MASU, BASE_ERROR_ACTIVITY_SHAPE, "learner", "learner-will-speak", "context-action-mismatch"),
    act(task11Cue(L("noun-yuki-san")), politeTarget("verb-au", EXPLICIT_MASU, [L("noun-yuki-san"), P("additive-mo")], "future"), politeTarget("verb-iku", EXPLICIT_MASU, [L("expression-hai"), C, L("noun-yuki-san"), P("additive-mo")], "future"), 0, "polite-verbs-4-activity-7-instruction", EXPLICIT_MASU, BASE_FORM_ACTIVITY_SHAPE, "yuki", "yuki-meets"),
    act(task11Cue(L("noun-tomodachi")), politeTarget("verb-utau", EXPLICIT_MASU, [L("noun-tomodachi"), P("additive-mo")]), politeTarget("verb-aruku", EXPLICIT_MASU, TOPIC("noun-tomodachi")), 1, "polite-verbs-4-activity-8-instruction", EXPLICIT_MASU, BASE_RETRIEVAL_ACTIVITY_SHAPE, "friend", "friend-sings"),
    act(task11Cue(L("noun-sensei")), politeTarget("verb-hanasu", EXPLICIT_MASU, TOPIC("noun-sensei"), "future"), politeTarget("verb-matsu", EXPLICIT_MASU, TOPIC("noun-sensei")), 0, "polite-verbs-4-activity-9-instruction", EXPLICIT_MASU, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(L("noun-gakusei")), politeTarget("verb-matsu", EXPLICIT_MASU, TOPIC("noun-gakusei"), "future"), politeTarget("verb-yasumu", EXPLICIT_MASU, TOPIC("noun-gakusei")), 1, "polite-verbs-4-activity-10-instruction", EXPLICIT_MASU, BASE_SPOKEN_ACTIVITY_SHAPE),
  ],
  dialogue: [
    { speakerId: "learner", target: politeFinalTarget("verb-hataraku", EXPLICIT_MASU, TOPIC("noun-yuki-san"), [P("question-ka")], "habitual", ["topic"]), frame: "ask-yuki-routine", utteranceKind: "complete-clause", en: "Does Yuki work?", it: "Yuki lavora?", purposeEn: "Opens with a familiar topic and a polite routine question.", purposeIt: "Apre con un tema noto e una domanda cortese sulla routine." },
    { speakerId: "partner", target: politeTarget("verb-hataraku", OMITTED_MASU, [L("expression-hai"), C]), frame: "confirm-yuki-routine", utteranceKind: "complete-clause", en: "Yes, she does.", it: "Sì, lavora.", purposeEn: "Omits the recoverable Yuki topic in the answer.", purposeIt: "Omette il tema Yuki recuperabile nella risposta." },
    { speakerId: "learner", target: politeFinalTarget("verb-hataraku", EXPLICIT_MASU, [L("noun-tanaka"), P("additive-mo")], [P("question-ka")], "habitual", ["topic"]), frame: "ask-tanaka-addition", utteranceKind: "complete-clause", en: "Does Tanaka work too?", it: "Anche Tanaka lavora?", purposeEn: "Reuses the known additive topic in the same practical thread.", purposeIt: "Riusa il tema additivo noto nello stesso scambio pratico." },
    { speakerId: "partner", target: politeTarget("verb-yasumu", OMITTED_MASU, [L("expression-iie"), C]), frame: "correct-tanaka-routine", utteranceKind: "complete-clause", en: "No, he rests.", it: "No, riposa.", purposeEn: "Answers with a contrasting owned ます predicate.", purposeIt: "Risponde con un predicato in ます noto e contrastivo." },
    { speakerId: "learner", target: politeFinalTarget("verb-benkyou-suru", EXPLICIT_MASU, TOPIC("noun-mari"), [P("question-ka")], "habitual", ["topic"]), frame: "ask-mari-study", utteranceKind: "complete-clause", en: "Does Mari study?", it: "Mari studia?", purposeEn: "Checks another known routine without adding an argument particle.", purposeIt: "Controlla un'altra routine nota senza aggiungere particelle argomentali." },
    { speakerId: "partner", target: politeFinalTarget("verb-benkyou-suru", OMITTED_MASU, [L("expression-hai"), C], [P("interactional-yo")]), frame: "confirm-mari-study", utteranceKind: "complete-clause", en: "Yes, she studies.", it: "Sì, studia.", purposeEn: "Closes with natural omission and the known assertive particle.", purposeIt: "Chiude con omissione naturale e la particella assertiva nota." },
  ],
};

const POLITE_SPECS = deepFreeze([L1, L2, L3, L4]);
const BUILT_POLITE_LESSONS = POLITE_SPECS.map(buildTask11Lesson);
const RAW_POLITE_LESSONS = BUILT_POLITE_LESSONS.map(({ lesson }) => lesson);

export const BASE_POLITE_VERBS_LESSONS: readonly (
  BaseSystemLessonContent | BaseContentLessonContent
)[] = deepFreeze(RAW_POLITE_LESSONS.map(({ content }) => content));

export const BASE_POLITE_VERBS_EXAMPLES: readonly BaseExample[] = deepFreeze(
  RAW_POLITE_LESSONS.flatMap(({ examples }) => examples),
);

export const BASE_POLITE_VERBS_VALIDATION_CATALOGS: BaseValidationCatalogs =
  task11ValidationCatalogs(
    BASE_TOPIC_QUESTIONS_VALIDATION_CATALOGS,
    BUILT_POLITE_LESSONS,
  );

const RAW_POLITE_VERBS_MODULE: BasePoliteVerbsModule = {
  id: "polite-verbs",
  lessons: RAW_POLITE_LESSONS,
  sequence: [
    ...BASE_TOPIC_QUESTIONS_LESSONS,
    ...BASE_POLITE_VERBS_LESSONS,
  ],
  worldFacts: {
    learnerRoutine: "studies-and-rests",
    tanakaRoutine: "works",
    yamadaRoutine: "walks",
    yukiRoutine: "sings",
  },
  worldFactIds: RAW_POLITE_LESSONS.flatMap((lesson) =>
    lesson.activityDesigns.flatMap(({ worldFactId }) =>
      worldFactId ? [worldFactId] : [],
    ),
  ),
  worldFactLedger: worldFactLedgerFor(RAW_POLITE_LESSONS),
};

export function validateBasePoliteVerbsModule(
  value: unknown,
): Readonly<{ readonly ok: boolean; readonly errors: readonly BaseTask11ModuleError[] }> {
  const result = validateTask11ModuleBase(
    value,
    "polite-verbs",
    POLITE_SPECS.map(({ lessonId }) => lessonId),
    BASE_POLITE_VERBS_VALIDATION_CATALOGS,
  );
  return result.ok && !task11PlainDataEqual(value, RAW_POLITE_VERBS_MODULE)
    ? { ok: false, errors: ["invalid-module-shape"] }
    : result;
}

function formRecord(
  lemmaId: string,
  kind: BaseTask11VerbFormKind,
): Readonly<{
  readonly lemmaId: string;
  readonly kind: BaseTask11VerbFormKind;
  readonly tokens: readonly AssembledToken[];
}> {
  return deepFreeze({ lemmaId, kind, tokens: formTokens(lemmaId, kind) });
}

export const BASE_POLITE_VERB_FORM_RECORDS = deepFreeze([
  ...L1.newLexemeIds.map((lemmaId) => formRecord(lemmaId, "dictionary")),
  ...L2.newLexemeIds.map((lemmaId) => formRecord(lemmaId, "dictionary")),
  ...[
    "verb-kaku",
    "verb-yomu",
    "verb-kaeru",
    "verb-taberu",
    "verb-miru",
    "verb-suru",
    "verb-kuru",
    ...L3.newLexemeIds,
  ].map((lemmaId) => formRecord(lemmaId, "polite-stem")),
  ...L4.newLexemeIds.map((lemmaId) => formRecord(lemmaId, "polite-nonpast")),
]);

export const module04ConceptIds = deepFreeze(
  POLITE_SPECS.flatMap(({ introducedConceptIds }) => introducedConceptIds),
);

const validation = validateBasePoliteVerbsModule(RAW_POLITE_VERBS_MODULE);
if (!validation.ok) {
  const details = BASE_POLITE_VERBS_LESSONS.flatMap((lesson) =>
    validateBaseLessonDepth(lesson, BASE_POLITE_VERBS_VALIDATION_CATALOGS),
  );
  const sequenceDetails = validateFirstTeachOrder(
    RAW_POLITE_VERBS_MODULE.sequence,
    BASE_FIRST_TEACH_OWNERS,
    BASE_POLITE_VERBS_VALIDATION_CATALOGS,
  );
  const publicationDetails = RAW_POLITE_LESSONS.flatMap((lesson) =>
    validatePublishedSemanticActivities(lesson)
      ? []
      : [lesson.content.lessonId],
  );
  throw new Error(
    `Invalid Base polite-verbs module: ${validation.errors.join(", ")} ${JSON.stringify(details)} ${JSON.stringify(sequenceDetails)} ${JSON.stringify(publicationDetails)}`,
  );
}

export const BASE_POLITE_VERBS_MODULE: BasePoliteVerbsModule = deepFreeze(
  RAW_POLITE_VERBS_MODULE,
);

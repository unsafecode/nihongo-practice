import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import { immutableReadonlySet } from "../../foundations/immutableReadonlySet";
import type { SemanticArgumentRole } from "../../foundations/types";
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
  BASE_PARTICLE_SENSES,
  baseParticleSurfaceTokens,
  particleProvidedEntries,
  particleSenseFirstTeachContentId,
  type BaseParticleRole,
  type BaseParticleSense,
} from "../forms/particleLicensing";
import {
  realizeIAdjectivePredicate,
  realizeIAdjectiveAttributive,
  realizeNaAdjectiveAttributive,
  realizeNaAdjectivePredicate,
  realizeOwnedNounPredicate,
  type BasePredicateForm,
} from "../forms/adjectiveForms";
import {
  realizePoliteGrid,
  realizePoliteNonpast,
  realizePoliteStem,
  realizeTeConstruction,
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
  | "past-negative"
  | "te"
  | "te-request"
  | "te-sequence"
  | "te-imasu";

export type BaseTask11PredicateKind =
  | "noun"
  | "i-adjective"
  | "na-adjective";

export type BaseTask11Part =
  | Readonly<{ readonly kind: "lexeme"; readonly lexemeId: string }>
  | Readonly<{
      readonly kind: "particle";
      readonly sense: BaseParticleSense;
      readonly role: BaseParticleRole;
      readonly attachmentLexemeId: string;
    }>
  | Readonly<{
      readonly kind: "verb-form";
      readonly lemmaId: string;
      readonly form: BaseTask11VerbFormKind;
    }>
  | Readonly<{
      readonly kind: "predicate-form";
      readonly predicateKind: BaseTask11PredicateKind;
      readonly lexemeId: string;
      readonly form: BasePredicateForm;
    }>
  | Readonly<{
      readonly kind: "i-adjective-attributive";
      readonly lexemeId: string;
    }>
  | Readonly<{
      readonly kind: "na-adjective-attributive";
      readonly lexemeId: string;
    }>
  | Readonly<{
      readonly kind: "analysis-label";
      readonly analysisId: string;
    }>
  | Readonly<{
      readonly kind: "diagnostic-form";
      readonly lemmaId: string;
      readonly kana: string;
      readonly romaji: string;
      readonly errorCode: string;
    }>
  | Readonly<{ readonly kind: "punctuation"; readonly mark: "comma" | "period" }>;

export interface BaseTask11TargetSpec {
  readonly parts: readonly BaseTask11Part[];
  readonly conceptIds: readonly string[];
  readonly patternCellIds: readonly string[];
  readonly semanticRoleIds: readonly SemanticArgumentRole[];
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
  readonly answerFactStatus?:
    | "accepted-world"
    | "rejected-context";
  readonly distractorFactStatus?:
    | "accepted-world"
    | "rejected-context";
  readonly errorCode: string | null;
  readonly contrastAxis?: BaseTask11ContrastAxis;
  readonly heldConstantPredicateLexemeId?: string | null;
  readonly optionAnalysisIds?: readonly string[];
  readonly errorDefectAxis?: string | null;
  readonly changedTokenSourceIds?: readonly string[];
}

export type BaseTask11ContrastAxis =
  | "meaning"
  | "verb-class"
  | "polite-stem"
  | "polite-form"
  | "particle"
  | "time-marking"
  | "tense-polarity"
  | "interpretation"
  | "word-order"
  | "schedule-route";

export interface BaseTask11ReviewEvidence {
  readonly contrastAxis: BaseTask11ContrastAxis;
  readonly heldConstantPredicateLexemeId: string | null;
  readonly optionAnalysisIds: readonly string[];
  readonly error: Readonly<{
    readonly code: string;
    readonly defectAxis: string;
    readonly erroneousTargetId: string;
    readonly repairTargetId: string;
    readonly changedTokenSourceIds: readonly string[];
  }> | null;
}

export interface BaseTask11WorldFactGrounding {
  readonly factId: string;
  readonly referentId: string;
  readonly acceptedTargetId: string;
  readonly conflictingTargetIds: readonly string[];
}

export interface BaseTask11ActivityDesign extends BaseSemanticActivityDesign {
  readonly reviewEvidence: BaseTask11ReviewEvidence;
  readonly worldFactGrounding: BaseTask11WorldFactGrounding | null;
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
  readonly activityDesigns: readonly BaseTask11ActivityDesign[];
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
    readonly learnerRoutine: "wakes";
    readonly tanakaRoutine: "works";
    readonly yamadaRoutine: "walks";
    readonly yukiRoutine: "works";
    readonly friendRoutine: "sleeps";
  }>;
  readonly worldFactIds: readonly string[];
  readonly worldFactLedger: readonly BaseWorldFactRecord[];
}

export function task11Lexeme(lexemeId: string): BaseTask11Part {
  return { kind: "lexeme", lexemeId };
}

export function task11Particle(
  sense: BaseParticleSense,
  role: BaseParticleRole,
  attachmentLexemeId: string,
): BaseTask11Part {
  return { kind: "particle", sense, role, attachmentLexemeId };
}

export function task11VerbForm(
  lemmaId: string,
  form: BaseTask11VerbFormKind,
): BaseTask11Part {
  return { kind: "verb-form", lemmaId, form };
}

export function task11AnalysisLabel(analysisId: string): BaseTask11Part {
  return { kind: "analysis-label", analysisId };
}

export function task11DiagnosticForm(
  lemmaId: string,
  kana: string,
  romaji: string,
  errorCode: string,
): BaseTask11Part {
  return { kind: "diagnostic-form", lemmaId, kana, romaji, errorCode };
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
  if (
    form === "te" ||
    form === "te-request" ||
    form === "te-sequence" ||
    form === "te-imasu"
  ) {
    const construction =
      form === "te"
        ? "te"
        : form === "te-request"
          ? "request"
          : form === "te-sequence"
            ? "sequence"
            : "te-imasu";
    const result = realizeTeConstruction(lemmaId, construction);
    if (result.ok) return result.value;
    throw new Error(`Missing canonical Base form ${lemmaId}:${form}.`);
  }
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

function predicateFormTokens(
  predicateKind: BaseTask11PredicateKind,
  lexemeId: string,
  form: BasePredicateForm,
): readonly AssembledToken[] {
  const result =
    predicateKind === "noun"
      ? realizeOwnedNounPredicate(lexemeId)
      : predicateKind === "i-adjective"
        ? realizeIAdjectivePredicate(lexemeId)
        : realizeNaAdjectivePredicate(lexemeId);
  if (!result.ok) {
    throw new Error(`Missing canonical Base predicate form ${lexemeId}:${form}.`);
  }
  return result.value[form].tokens;
}

function naAdjectiveAttributiveTokens(
  lexemeId: string,
): readonly AssembledToken[] {
  const result = realizeNaAdjectiveAttributive(lexemeId);
  if (!result.ok) {
    throw new Error(`Missing canonical Base attributive form ${lexemeId}.`);
  }
  return result.value;
}

function iAdjectiveAttributiveTokens(
  lexemeId: string,
): readonly AssembledToken[] {
  const result = realizeIAdjectiveAttributive(lexemeId);
  if (!result.ok) {
    throw new Error(
      `Missing canonical Base i-adjective attributive form ${lexemeId}.`,
    );
  }
  return result.value;
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

const ANALYSIS_LABELS: Readonly<
  Record<string, Readonly<{ readonly kana: string; readonly romaji: string }>>
> = {
  "godan-verb-class": { kana: "ごだん", romaji: "godan" },
  "ichidan-verb-class": { kana: "いちだん", romaji: "ichidan" },
  "suru-verb-class": { kana: "するぐみ", romaji: "suru-gumi" },
  "kuru-verb-class": { kana: "くるぐみ", romaji: "kuru-gumi" },
  "analysis-habitual": { kana: "しゅうかん", romaji: "shuukan" },
  "analysis-future": { kana: "これから", romaji: "korekara" },
  "analysis-action-place": { kana: "ばしょ", romaji: "basho" },
  "analysis-means": { kana: "しゅだん", romaji: "shudan" },
  "analysis-dictionary": { kana: "じしょ", romaji: "jisho" },
  "analysis-headword": { kana: "みだし", romaji: "midashi" },
  "analysis-lemma": { kana: "げんけい", romaji: "genkei" },
  "analysis-predicate": { kana: "じゅつご", romaji: "jutsugo" },
  "analysis-verb": { kana: "どうし", romaji: "doushi" },
  "analysis-final-predicate": { kana: "ぶんまつ", romaji: "bunmatsu" },
  "analysis-stem": { kana: "ごかん", romaji: "gokan" },
  "analysis-classification": { kana: "ぶんるい", romaji: "bunrui" },
  "analysis-pair": {
    kana: "ふたつのぶんせき",
    romaji: "futatsu no bunseki",
  },
  "analysis-suffix-guess": { kana: "おとだけ", romaji: "oto dake" },
  "analysis-source": { kana: "もとのかたち", romaji: "moto no katachi" },
  "analysis-stem-source": { kana: "ごかんのもと", romaji: "gokan no moto" },
  "verb-class-exceptions": { kana: "れいがい", romaji: "reigai" },
  "analysis-goal": { kana: "もくてきち", romaji: "mokutekichi" },
  "analysis-direction": {
    kana: "しんこうほうこう",
    romaji: "shinkou houkou",
  },
};

function analysisTokens(analysisId: string, id: string): readonly AssembledToken[] {
  const label = ANALYSIS_LABELS[analysisId];
  if (!label) throw new Error(`Unknown Task 11 analysis label "${analysisId}".`);
  return deepFreeze([
    {
      id,
      jp: label.kana,
      romaji: label.romaji,
      kind: "morpheme",
      boundaryBefore: "attach",
      source: { domain: "catalog", referenceId: analysisId },
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
  if (part.kind === "predicate-form") {
    return {
      tokens: predicateFormTokens(
        part.predicateKind,
        part.lexemeId,
        part.form,
      ),
      boundaryBefore: "space",
    };
  }
  if (part.kind === "i-adjective-attributive") {
    return {
      tokens: iAdjectiveAttributiveTokens(part.lexemeId),
      boundaryBefore: "space",
    };
  }
  if (part.kind === "na-adjective-attributive") {
    return {
      tokens: naAdjectiveAttributiveTokens(part.lexemeId),
      boundaryBefore: "space",
    };
  }
  if (part.kind === "analysis-label") {
    return { tokens: analysisTokens(part.analysisId, id), boundaryBefore: "space" };
  }
  if (part.kind === "diagnostic-form") {
    return {
      tokens: deepFreeze([
        {
          id,
          jp: part.kana,
          romaji: part.romaji,
          kind: "morpheme",
          boundaryBefore: "attach",
          source: { domain: "catalog", referenceId: part.errorCode },
        },
      ]),
      boundaryBefore: "space",
    };
  }
  return { tokens: punctuationTokens(part.mark, id), boundaryBefore: "attach" };
}

function partLexemeIds(parts: readonly BaseTask11Part[]): readonly string[] {
  return [
    ...new Set(
      parts.flatMap((part) =>
        part.kind === "lexeme"
          ? [part.lexemeId]
          : part.kind === "verb-form" || part.kind === "diagnostic-form"
            ? [part.lemmaId]
            : part.kind === "predicate-form" ||
                part.kind === "i-adjective-attributive" ||
                part.kind === "na-adjective-attributive"
              ? [part.lexemeId]
            : [],
      ),
    ),
  ];
}

function partFormIds(parts: readonly BaseTask11Part[]): readonly string[] {
  return [
    ...new Set(
      parts.flatMap((part) => {
        if (part.kind !== "verb-form") return predicatePartFormIds(part);
        if (part.form === "dictionary") return ["dictionary-lemma"];
        if (part.form === "polite-stem") return ["polite-stems"];
        if (part.form === "polite-nonpast") return ["masu-nonpast"];
        if (part.form === "te") return ["base-form-te"];
        if (part.form === "te-request") {
          return ["base-form-te", "base-construction-te-kudasai"];
        }
        if (part.form === "te-sequence") {
          return ["base-form-te", "base-construction-sequential-te"];
        }
        if (part.form === "te-imasu") {
          return ["base-form-te", "base-construction-te-imasu"];
        }
        return ["four-polite-tense-cells"];
      }),
    ),
  ];
}

function predicatePartFormIds(part: BaseTask11Part): readonly string[] {
  if (part.kind === "na-adjective-attributive") {
    return ["base-form-na-adjective-attributive"];
  }
  if (part.kind === "i-adjective-attributive") {
    return ["base-form-i-adjective-affirmative"];
  }
  if (part.kind !== "predicate-form") return [];
  if (part.predicateKind === "noun") {
    return part.form === "affirmative"
      ? ["affirmative-desu"]
      : part.form === "negative"
        ? ["base-form-noun-predicate-negative"]
        : part.form === "pastAffirmative"
          ? ["base-form-noun-predicate-past-affirmative"]
          : ["base-form-noun-predicate-past-negative"];
  }
  const stem =
    part.predicateKind === "i-adjective"
      ? "base-form-i-adjective"
      : "base-form-na-adjective";
  const suffix =
    part.form === "affirmative"
      ? "affirmative"
      : part.form === "negative"
        ? "negative"
        : part.form === "pastAffirmative"
          ? "past-affirmative"
          : "past-negative";
  return [`${stem}-${suffix}`];
}

function partConceptIds(parts: readonly BaseTask11Part[]): readonly string[] {
  return [
    ...new Set(
      parts.flatMap((part) =>
        part.kind === "particle"
          ? [particleSenseFirstTeachContentId(part.sense)]
          : part.kind === "analysis-label" &&
              BASE_CONCEPT_BY_ID.has(part.analysisId)
            ? [part.analysisId]
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
  const semanticRoleByParticleRole: Readonly<Record<string, string>> = {
    topic: "topic",
    "additive-topic": "additive-topic",
    "focus-subject": "focus-subject",
    theme: "theme",
    goal: "goal",
    "action-place": "action-place",
    "existence-location": "existence-location",
    "existential-subject": "existential-subject",
    means: "means",
    time: "time",
    source: "source",
    limit: "limit",
    possessor: "possessor",
    listing: "listing",
    companion: "companion",
  };
  return task11Target(parts, {
    conceptIds: [],
    patternCellIds: [],
    semanticRoleIds: [
      ...new Set(
        parts.flatMap((part) => {
          if (part.kind !== "particle") return [];
          const semanticRole =
            part.role === "goal" && part.sense === "direction-he"
              ? "direction"
              : semanticRoleByParticleRole[part.role];
          return semanticRole
            ? [
                semanticRole as BaseTask11TargetSpec["semanticRoleIds"][number],
              ]
            : [];
        }),
      ),
    ],
    interpretationTags: [],
    predicateSenseId: null,
    predicateLexemeId: null,
  });
}

export function task11ClassAnalysisTarget(
  lemmaId: string,
  classId:
    | "godan-verb-class"
    | "ichidan-verb-class"
    | "suru-verb-class"
    | "kuru-verb-class",
  patternCellIds: readonly string[],
): BaseTask11TargetSpec {
  return task11Target(
    [
      task11VerbForm(lemmaId, "dictionary"),
      TASK11_COMMA,
      task11AnalysisLabel(classId),
    ],
    {
      conceptIds: [classId],
      patternCellIds,
      semanticRoleIds: [],
      interpretationTags: ["metalinguistic"],
      predicateSenseId: lemmaId.slice("verb-".length),
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
    },
  );
}

function exceptionClassAnalysisTarget(
  lemmaId: string,
  patternCellIds: readonly string[],
): BaseTask11TargetSpec {
  const target = task11ClassAnalysisTarget(
    lemmaId,
    "godan-verb-class",
    patternCellIds,
  );
  return {
    ...target,
    parts: [...target.parts, TASK11_COMMA, task11AnalysisLabel("verb-class-exceptions")],
    conceptIds: [...target.conceptIds, "verb-class-exceptions"],
  };
}

function labelFirstClassAnalysisTarget(
  lemmaId: string,
  classId:
    | "godan-verb-class"
    | "ichidan-verb-class"
    | "suru-verb-class"
    | "kuru-verb-class",
  patternCellId: string,
): BaseTask11TargetSpec {
  const target = task11ClassAnalysisTarget(
    lemmaId,
    classId,
    [patternCellId],
  );
  return {
    ...target,
    parts: [
      task11AnalysisLabel(classId),
      TASK11_COMMA,
      task11VerbForm(lemmaId, "dictionary"),
    ],
  };
}

function sourcedClassAnalysisTarget(
  lemmaId: string,
  classId: "godan-verb-class" | "ichidan-verb-class",
  patternCellId: string,
  analysisId = "analysis-source",
): BaseTask11TargetSpec {
  const target = task11ClassAnalysisTarget(
    lemmaId,
    classId,
    [patternCellId],
  );
  return {
    ...target,
    parts: [...target.parts, TASK11_COMMA, task11AnalysisLabel(analysisId)],
  };
}

function visibleTarget(spec: BaseTask11TargetSpec, id: string): BaseVisibleTarget {
  const composed = composeBaseTokenSequences(
    spec.parts.map((part, index) => sequencePart(part, `${id}-${index + 1}`)),
  );
  if (!composed.ok) {
    throw new Error(`Invalid Task 11 token sequence "${id}".`);
  }
  const particleFrame = spec.particleFrame
    ? {
        predicateSenseId: spec.particleFrame.predicateSenseId,
        provided: { ...spec.particleFrame.provided },
        attachmentLexemeIdByRole: {
          ...spec.particleFrame.attachmentLexemeIdByRole,
        },
      }
    : undefined;
  const particleBindings = spec.parts.flatMap((part) =>
    part.kind === "particle"
      ? [
          {
            role: part.role,
            particleSense: part.sense,
            attachmentLexemeId: part.attachmentLexemeId,
          },
        ]
      : [],
  );
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
    particleBindings,
    ...(spec.predicateAspect === undefined
      ? {}
      : { predicateAspect: spec.predicateAspect }),
    ...(particleFrame === undefined
      ? {}
      : { particleFrame }),
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

function defaultContrastAxis(lessonId: string): BaseTask11ContrastAxis {
  if (lessonId === "polite-verbs-1") return "meaning";
  if (lessonId === "polite-verbs-2") return "verb-class";
  if (lessonId === "polite-verbs-3") return "polite-stem";
  if (lessonId === "polite-verbs-4") return "polite-form";
  if (lessonId === "argument-particles-1") return "particle";
  if (lessonId.startsWith("argument-particles-")) return "particle";
  if (lessonId === "time-movement-1") return "interpretation";
  if (lessonId === "time-movement-2") return "time-marking";
  if (lessonId === "time-movement-3") return "tense-polarity";
  return "schedule-route";
}

function defectAxisFor(errorCode: string): string {
  if (errorCode.includes("class") || errorCode.includes("stem")) return "form";
  if (errorCode.includes("interpretation") || errorCode.includes("reading")) {
    return "interpretation";
  }
  if (errorCode.includes("particle") || errorCode.includes("bound")) {
    return "particle";
  }
  if (errorCode.includes("polarity")) return "polarity";
  return "context";
}

function changedSourceIds(
  source: BaseVisibleTarget,
  repair: BaseVisibleTarget,
): readonly string[] {
  const interpretationChanged =
    source.interpretationTags.join("|") !==
    repair.interpretationTags.join("|");
  if (
    japanese(source) === japanese(repair) &&
    interpretationChanged
  ) {
    return ["interpretation-tag"];
  }
  const sourceIds = source.tokens.map(({ source: { referenceId } }) => referenceId);
  const repairIds = repair.tokens.map(({ source: { referenceId } }) => referenceId);
  return [
    ...new Set(
      [
        ...sourceIds,
        ...repairIds,
        ...(interpretationChanged ? ["interpretation-tag"] : []),
      ].filter(
        (referenceId) =>
          referenceId === "interpretation-tag" ||
          ((referenceId !== "japanese-comma" &&
            referenceId !== "japanese-period") &&
            sourceIds.filter((id) => id === referenceId).length !==
              repairIds.filter((id) => id === referenceId).length),
      ),
    ),
  ];
}

function analysisIdFor(target: BaseVisibleTarget): string {
  return (
    target.conceptIds.find(
      (id) =>
        id.endsWith("-verb-class") ||
        id === "verb-class-exceptions" ||
        id.startsWith("analysis-"),
    ) ??
    target.formIds[0] ??
    target.patternCellIds[0] ??
    target.predicateSenseId ??
    "unclassified-target"
  );
}

function normalizedCueSurface(target: BaseVisibleTarget): string {
  return japanese(target)
    .normalize("NFKC")
    .replace(/[、。,\s]/gu, "");
}

function listeningCueRevealsAnswer(
  promptTarget: BaseVisibleTarget,
  optionTargets: readonly BaseVisibleTarget[],
): boolean {
  if (optionTargets.length !== 2) return false;
  for (const token of promptTarget.tokens.filter(
    ({ kind }) => kind !== "punctuation",
  )) {
    const occurrence = optionTargets.map((option) =>
      option.tokens.some(
        ({ source }) => source.referenceId === token.source.referenceId,
      ),
    );
    if (occurrence[0] !== occurrence[1]) return true;
  }
  const promptSurface = normalizedCueSurface(promptTarget);
  if (promptSurface.length <= 1) return false;
  const occurrence = optionTargets.map((option) =>
    normalizedCueSurface(option).includes(promptSurface),
  );
  return occurrence[0] !== occurrence[1];
}

function activitiesFor(
  spec: BaseTask11LessonSpec,
): Readonly<{
  readonly definitions: readonly BaseActivityDefinition[];
  readonly designs: readonly BaseTask11ActivityDesign[];
  readonly acceptedEntries: readonly (readonly [string, BaseVisibleTarget])[];
  readonly promptEntries: readonly (readonly [string, BaseVisibleTarget])[];
  readonly audioEntries: readonly (readonly [string, BaseVisibleTarget])[];
}> {
  const definitions: BaseActivityDefinition[] = [];
  const designs: BaseTask11ActivityDesign[] = [];
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
    const contextRevealsAnswer =
      activity.shape.operation === "identify-audio" &&
      listeningCueRevealsAnswer(promptTarget, optionTargets);
    const heldConstantPredicateLexemeId =
      activity.heldConstantPredicateLexemeId !== undefined
        ? activity.heldConstantPredicateLexemeId
        : optionTargets.length === 2 &&
            optionTargets[0].predicateLexemeId !== null &&
            optionTargets[0].predicateLexemeId ===
              optionTargets[1].predicateLexemeId
          ? optionTargets[0].predicateLexemeId
          : acceptedAnswerTarget.predicateLexemeId;
    const authoredAnalysisIds =
      activity.optionAnalysisIds ??
      [activity.answer, activity.distractor].map((target) =>
        analysisIdFor(visibleTarget(target, `${id}-analysis-probe`)),
      );
    const optionAnalysisIds = isSpoken
      ? []
      : activity.correctOptionIndex === 0
        ? authoredAnalysisIds
        : [authoredAnalysisIds[1], authoredAnalysisIds[0]];
    const reviewError =
      activity.errorCode === null
        ? null
        : {
            code: activity.errorCode,
            defectAxis:
              activity.errorDefectAxis ?? defectAxisFor(activity.errorCode),
            erroneousTargetId: promptId,
            repairTargetId: acceptedAnswerTargetId,
            changedTokenSourceIds:
              activity.changedTokenSourceIds ??
              changedSourceIds(promptTarget, acceptedAnswerTarget),
          };
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
      optionFactStatus: isSpoken
        ? []
        : activity.correctOptionIndex === 0
          ? [
              activity.answerFactStatus ?? "accepted-world",
              activity.distractorFactStatus ?? "rejected-context",
            ]
          : [
              activity.distractorFactStatus ?? "rejected-context",
              activity.answerFactStatus ?? "accepted-world",
            ],
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
        revealsAnswer: contextRevealsAnswer,
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
      reviewEvidence: {
        contrastAxis:
          activity.contrastAxis ?? defaultContrastAxis(spec.lessonId),
        heldConstantPredicateLexemeId,
        optionAnalysisIds,
        error: reviewError,
      },
      worldFactGrounding:
        activity.worldFactId !== null && activity.referentId !== null
          ? {
              factId: activity.worldFactId,
              referentId: activity.referentId,
              acceptedTargetId: acceptedAnswerTargetId,
              conflictingTargetIds: [
                ...optionTargetIds.filter(
                  (_, optionIndex) =>
                    optionIndex !== activity.correctOptionIndex,
                ),
                ...(activity.errorCode ? [promptId] : []),
              ],
            }
          : null,
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

export type BaseTask11SemanticReviewErrorCode =
  | "class-analysis-invalid"
  | "predicate-contrast-not-held"
  | "particle-contrast-not-isolated"
  | "error-delta-invalid"
  | "world-grounding-invalid"
  | "worked-surface-reused"
  | "option-punctuation-tell"
  | "kana-boundary-ambiguous"
  | "listening-cue-decisive"
  | "listening-option-analysis-invalid"
  | "listening-option-not-canonical"
  | "listening-terms-missing"
  | "instruction-answer-leakage";

export interface BaseTask11SemanticReviewError {
  readonly code: BaseTask11SemanticReviewErrorCode;
  readonly lessonId: string;
  readonly activityId: string;
  readonly detail?: string;
}

function canonicalVerbClassConcept(lexemeId: string): string | null {
  const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
  if (!lexeme || lexeme.category !== "verb") return null;
  return lexeme.verbClass === "godan"
    ? "godan-verb-class"
    : lexeme.verbClass === "ichidan"
      ? "ichidan-verb-class"
      : lexeme.verbClass === "suru"
        ? "suru-verb-class"
        : "kuru-verb-class";
}

function listeningOptionIsCanonical(target: BaseVisibleTarget): boolean {
  const signature = ({
    jp,
    romaji,
    kind,
    source,
  }: AssembledToken): string =>
    `${source.referenceId}:${kind}:${jp}:${romaji}`;
  const canonicalSignatures = new Set<string>();
  const addCanonical = (tokens: readonly AssembledToken[]) => {
    tokens.forEach((token) => canonicalSignatures.add(signature(token)));
  };
  for (const lexemeId of target.lexemeIds) {
    const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
    if (!lexeme) return false;
    if (lexeme.category !== "verb") {
      addCanonical(lexicalTokens(lexemeId, "listening-canonical-lexeme"));
      continue;
    }
    for (const form of [
      "dictionary",
      "polite-stem",
      "polite-nonpast",
      "nonpast-negative",
      "past-affirmative",
      "past-negative",
    ] as const) {
      addCanonical(formTokens(lexemeId, form));
    }
  }
  Object.keys(ANALYSIS_LABELS).forEach((analysisId) =>
    addCanonical(
      analysisTokens(analysisId, "listening-canonical-analysis"),
    ),
  );
  BASE_PARTICLE_SENSES.forEach(({ id }) =>
    addCanonical(baseParticleSurfaceTokens(id)),
  );
  addCanonical(punctuationTokens("comma", "listening-canonical-comma"));
  addCanonical(punctuationTokens("period", "listening-canonical-period"));
  if (
    target.tokens.some((token) => !canonicalSignatures.has(signature(token)))
  ) {
    return false;
  }
  if (target.predicateLexemeId === null) return true;
  const containsSequence = (expected: readonly AssembledToken[]) => {
    const expectedSignatures = expected.map(signature);
    return target.tokens.some((_, startIndex) =>
      expectedSignatures.every(
        (expectedSignature, offset) =>
          target.tokens[startIndex + offset] !== undefined &&
          signature(target.tokens[startIndex + offset]) === expectedSignature,
      ),
    );
  };
  if (
    (target.formIds.includes("dictionary-lemma") &&
      !containsSequence(formTokens(target.predicateLexemeId, "dictionary"))) ||
    (target.formIds.includes("polite-stems") &&
      !containsSequence(formTokens(target.predicateLexemeId, "polite-stem"))) ||
    (target.formIds.includes("masu-nonpast") &&
      !containsSequence(
        formTokens(target.predicateLexemeId, "polite-nonpast"),
      )) ||
    (target.formIds.includes("four-polite-tense-cells") &&
      ![
        formTokens(target.predicateLexemeId, "nonpast-negative"),
        formTokens(target.predicateLexemeId, "past-affirmative"),
        formTokens(target.predicateLexemeId, "past-negative"),
      ].some(containsSequence))
  ) {
    return false;
  }
  const canonicalClass = canonicalVerbClassConcept(target.predicateLexemeId);
  return target.conceptIds
    .filter((conceptId) => conceptId.endsWith("-verb-class"))
    .every((conceptId) => conceptId === canonicalClass);
}

function listeningOptionAnalysisIsConsistent(
  target: BaseVisibleTarget,
  analysisId: string,
): boolean {
  return (
    target.conceptIds.includes(analysisId) ||
    target.formIds.includes(analysisId) ||
    target.patternCellIds.includes(analysisId) ||
    target.predicateSenseId === analysisId ||
    target.predicateLexemeId === analysisId ||
    target.tokens.some(({ source }) => source.referenceId === analysisId)
  );
}

function normalizedTask11Surface(target: BaseVisibleTarget): string {
  return japanese(target)
    .normalize("NFKC")
    .trim()
    .replace(/^(?:はい|いいえ)[、,]?/u, "")
    .replace(/[、。,\s]/gu, "");
}

const TASK11_BOUNDARY_PARTICLE_SENSES: readonly BaseParticleSense[] = [
  "topic-wa",
  "action-place-de",
  "means-de",
  "goal-ni",
  "time-ni",
  "existence-location-ni",
  "additive-mo",
  "object-o",
  "direction-he",
  "companion-to",
  "listing-to",
  "focus-subject-ga",
  "existential-subject-ga",
  "source-kara",
  "limit-made",
];
const TASK11_BOUNDARY_PARTICLE_KANA = new Set(
  TASK11_BOUNDARY_PARTICLE_SENSES.flatMap((sense) =>
    baseParticleSurfaceTokens(sense).map(({ jp }) => jp),
  ),
);

function isCanonicalTimeLexeme(lexemeId: string): boolean {
  const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
  return lexeme?.category === "noun" && lexeme.timeSemantics !== undefined;
}

export function task11VerbNeedsKanaSeparator(lemmaId: string): boolean {
  const lexeme = BASE_LEXEME_BY_ID.get(lemmaId);
  return (
    lexeme?.category === "verb" &&
    [...TASK11_BOUNDARY_PARTICLE_KANA].some((kana) =>
      lexeme.kana.startsWith(kana),
    )
  );
}

function hasAmbiguousTimeVerbBoundary(target: BaseVisibleTarget): boolean {
  for (const [timeIndex, token] of target.tokens.entries()) {
    if (!isCanonicalTimeLexeme(token.source.referenceId)) continue;
    let nextIndex = timeIndex + 1;
    const separator = target.tokens[nextIndex];
    if (separator?.kind === "punctuation") continue;
    if (separator?.kind === "particle") {
      nextIndex += 1;
      if (target.tokens[nextIndex]?.kind === "punctuation") continue;
    }
    const next = target.tokens[nextIndex];
    if (
      next &&
      [...TASK11_BOUNDARY_PARTICLE_KANA].some((kana) =>
        next.jp.startsWith(kana),
      ) &&
      (next.source.referenceId === target.predicateLexemeId ||
        BASE_LEXEME_BY_ID.get(next.source.referenceId)?.category === "verb")
    ) {
      return true;
    }
  }
  return false;
}

function inferredPoliteCellId(target: BaseVisibleTarget): string | null {
  const surface = japanese(target);
  if (surface.endsWith("ませんでした")) {
    return "verb-polite-past-negative";
  }
  if (surface.endsWith("ました")) {
    return "verb-polite-past-affirmative";
  }
  if (surface.endsWith("ません")) {
    return "verb-polite-nonpast-negative";
  }
  if (surface.endsWith("ます")) {
    return "verb-polite-nonpast-affirmative";
  }
  return null;
}

const TASK11_PARTICLE_ANALYSIS_SOURCE_IDS = new Set([
  "analysis-action-place",
  "analysis-means",
  "analysis-goal",
  "analysis-direction",
]);

function normalizedParticleRole(role: string): string {
  if (role === "topic" || role === "additive-topic") return "discourse-topic";
  if (role === "goal" || role === "direction") return "movement-target";
  if (role === "action-place" || role === "means") return "de-argument";
  return role;
}

function particleContrastIsIsolated(
  targets: readonly [BaseVisibleTarget, BaseVisibleTarget],
): boolean {
  const [left, right] = targets;
  const tokenSignature = (target: BaseVisibleTarget) =>
    target.tokens.map(({ jp, kind, source }) =>
      kind === "particle"
        ? "<particle>"
        : TASK11_PARTICLE_ANALYSIS_SOURCE_IDS.has(source.referenceId)
          ? "<particle-analysis>"
          : `${source.referenceId}:${jp}`,
    );
  const roleSignature = (target: BaseVisibleTarget) =>
    [...target.semanticRoleIds].map(normalizedParticleRole).sort();
  const bindingSignature = (target: BaseVisibleTarget) =>
    (target.particleBindings ?? []).map(
      ({ role, attachmentLexemeId }) =>
        `${normalizedParticleRole(role)}@${attachmentLexemeId}`,
    );
  const particleSenseSignature = (target: BaseVisibleTarget) =>
    (target.particleBindings ?? []).map(({ particleSense }) => particleSense);
  const analysisSignature = (target: BaseVisibleTarget) =>
    target.tokens.flatMap(({ source }) =>
      TASK11_PARTICLE_ANALYSIS_SOURCE_IDS.has(source.referenceId)
        ? [source.referenceId]
        : [],
    );
  const equal = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

  return (
    left.predicateLexemeId !== null &&
    left.predicateLexemeId === right.predicateLexemeId &&
    equal(tokenSignature(left), tokenSignature(right)) &&
    equal([...left.lexemeIds].sort(), [...right.lexemeIds].sort()) &&
    equal(roleSignature(left), roleSignature(right)) &&
    equal(bindingSignature(left), bindingSignature(right)) &&
    (!equal(particleSenseSignature(left), particleSenseSignature(right)) ||
      !equal(analysisSignature(left), analysisSignature(right)))
  );
}

const TASK11_ERROR_CHANGED_SOURCES: Readonly<Record<string, readonly string[]>> =
  deepFreeze({
    "analysis-role-mismatch": ["analysis-lemma", "analysis-verb"],
    "verb-class-mismatch": [
      "ichidan-verb-class",
      "godan-verb-class",
      "verb-class-exceptions",
      "analysis-suffix-guess",
    ],
    "incorrect-ichidan-stem": ["incorrect-ichidan-stem", "verb-kaeru"],
    "malformed-polite-form": [
      "malformed-polite-form",
      "verb-hanasu",
      "masu",
    ],
    "object-topicalization-mismatch": ["topic-wa", "object-o"],
    "goal-direction-context-mismatch": ["direction-he", "goal-ni"],
    "de-role-context-mismatch": [
      "analysis-means",
      "analysis-action-place",
    ],
    "means-context-mismatch": ["noun-kasa", "noun-enpitsu"],
    "dynamic-nonpast-interpretation-mismatch": [
      "noun-maishuu",
      "noun-ashita",
      "interpretation-tag",
    ],
    "movement-bound-incomplete": ["noun-osaka", "limit-made"],
    "time-form-mismatch": ["mashita", "masen", "interpretation-tag"],
    "polarity-mismatch": ["masu", "masen", "interpretation-tag"],
  });
const TASK11_POSITIONAL_REPLACEMENT_ERRORS = new Set([
  "analysis-role-mismatch",
  "object-topicalization-mismatch",
  "goal-direction-context-mismatch",
  "de-role-context-mismatch",
  "means-context-mismatch",
  "dynamic-nonpast-interpretation-mismatch",
  "time-form-mismatch",
  "polarity-mismatch",
]);

export function validateTask11SemanticReview(
  lessons: readonly BaseTask11Lesson[],
  copyEn: Readonly<Record<string, string>> = baseNavigationCopyEn.content,
  copyIt: Readonly<Record<string, string>> = baseNavigationCopyIt.content,
): readonly BaseTask11SemanticReviewError[] {
  const errors: BaseTask11SemanticReviewError[] = [];
  const demonstrations = new Map<string, string>();
  const practiceSurfaces = new Map<string, string>();
  for (const lesson of lessons) {
    for (const target of [
      ...lesson.examples,
      ...(lesson.dialogue?.turns ?? []),
    ]) {
      const surface = normalizedTask11Surface(target);
      const id = "id" in target ? String(target.id) : lesson.dialogue?.id ?? "";
      const prior = demonstrations.get(surface);
      if (prior) {
        errors.push({
          code: "worked-surface-reused",
          lessonId: lesson.content.lessonId,
          activityId: "worked-corpus",
          detail: `${id}:${prior}`,
        });
      } else {
        demonstrations.set(surface, id);
      }
      if (hasAmbiguousTimeVerbBoundary(target)) {
        errors.push({
          code: "kana-boundary-ambiguous",
          lessonId: lesson.content.lessonId,
          activityId: id,
          detail: surface,
        });
      }
    }
  }

  const cellTerms = {
    en: new Map([
      [
        "verb-polite-nonpast-affirmative",
        ["nonpast affirmative", "non-past affirmative", "unnegated event"],
      ],
      [
        "verb-polite-nonpast-negative",
        [
          "nonpast negative",
          "non-past negative",
          "future negative",
          "negative polarity",
          "time and polarity",
          "crossed-out",
        ],
      ],
      [
        "verb-polite-past-affirmative",
        ["past affirmative", "past-affirmative", "completed time"],
      ],
      [
        "verb-polite-past-negative",
        [
          "past negative",
          "past-negative",
          "completed time and negative polarity",
          "negative polarity",
          "time and polarity",
          "crossed-out",
        ],
      ],
      [
        "tm2-relative-time-zero",
        ["without obligatory", "no obligatory particle", "unmarked relative"],
      ],
      [
        "tm2-time-bounds",
        [
          "bounded",
          "bounded reading",
          "bounded interval",
          "start and finish",
          "start-and-finish pattern",
        ],
      ],
      [
        "tm2-movement-bounds",
        ["bounded", "bounded route", "source-to-limit pattern"],
      ],
      ["ap2-motion-goal-ni", ["endpoint", "goal analysis"]],
      ["ap2-motion-direction-e", ["direction analysis"]],
      ["ap3-action-place-de", ["place analysis", "the setting"]],
      ["ap3-means-de", ["means analysis", "instrument"]],
    ]),
    it: new Map([
      [
        "verb-polite-nonpast-affirmative",
        ["non-passato affermativo", "evento non negato"],
      ],
      [
        "verb-polite-nonpast-negative",
        [
          "non-passato negativo",
          "futuro negativo",
          "polarità negativa",
          "tempo e polarità",
          "barrato",
        ],
      ],
      [
        "verb-polite-past-affirmative",
        ["passato affermativo", "tempo concluso"],
      ],
      [
        "verb-polite-past-negative",
        [
          "passato negativo",
          "passato-negativo",
          "tempo concluso e polarità negativa",
          "polarità negativa",
          "tempo e polarità",
          "barrato",
        ],
      ],
      [
        "tm2-relative-time-zero",
        ["senza particella obbligatoria", "non marcato relativo"],
      ],
      [
        "tm2-time-bounds",
        [
          "delimitato",
          "delimitata",
          "lettura delimitata",
          "intervallo delimitato",
          "inizio e fine",
          "schema di inizio e fine",
        ],
      ],
      [
        "tm2-movement-bounds",
        [
          "delimitato",
          "delimitata",
          "percorso delimitato",
          "schema di origine e limite",
          "origine-limite",
          "origine limite",
        ],
      ],
      ["ap2-motion-goal-ni", ["meta", "punto d'arrivo", "analisi di meta"]],
      ["ap2-motion-direction-e", ["analisi direzionale"]],
      ["ap3-action-place-de", ["analisi di luogo", "l'ambiente"]],
      ["ap3-means-de", ["analisi di mezzo", "lo strumento"]],
    ]),
  };
  const analysisTerms = {
    en: new Map<string, readonly string[]>([
      ["analysis-habitual", ["habitual", "habitual analysis"]],
      ["analysis-future", ["future", "future analysis"]],
      ["analysis-action-place", ["place analysis", "setting analysis"]],
      ["analysis-means", ["means analysis", "instrument analysis"]],
      ["analysis-goal", ["goal analysis", "endpoint analysis"]],
      ["analysis-direction", ["direction analysis"]],
      ["analysis-dictionary", ["dictionary analysis", "lookup analysis"]],
      ["analysis-headword", ["headword analysis", "lookup analysis"]],
      ["analysis-lemma", ["lemma analysis", "base-form analysis"]],
      ["analysis-predicate", ["predicate analysis"]],
      ["analysis-verb", ["verb analysis"]],
      ["analysis-final-predicate", ["final-predicate analysis"]],
      ["verb-class-exceptions", ["exception analysis"]],
    ]),
    it: new Map<string, readonly string[]>([
      ["analysis-habitual", ["abituale", "analisi abituale"]],
      ["analysis-future", ["futuro", "analisi futura"]],
      ["analysis-action-place", ["analisi di luogo", "analisi dell'ambiente"]],
      ["analysis-means", ["analisi di mezzo", "analisi strumentale"]],
      ["analysis-goal", ["analisi di meta", "analisi del punto d'arrivo"]],
      ["analysis-direction", ["analisi direzionale"]],
      ["analysis-dictionary", ["analisi dizionario", "analisi di consultazione"]],
      ["analysis-headword", ["analisi del lemma", "analisi di consultazione"]],
      ["analysis-lemma", ["analisi del lemma", "analisi della forma base"]],
      ["analysis-predicate", ["analisi predicativa"]],
      ["analysis-verb", ["analisi verbale"]],
      ["analysis-final-predicate", ["analisi del predicato finale"]],
      ["verb-class-exceptions", ["analisi dell'eccezione"]],
    ]),
  };
  const particleTerms = {
    en: new Map<string, readonly string[]>([
      ["object-o", ["object analysis", "theme analysis"]],
      ["goal-ni", ["endpoint", "goal analysis"]],
      ["direction-he", ["direction analysis"]],
      ["action-place-de", ["place analysis", "setting analysis"]],
      ["means-de", ["means analysis", "instrument analysis"]],
      ["time-ni", ["specific-time analysis"]],
      ["source-kara", ["source analysis"]],
      ["limit-made", ["limit analysis"]],
    ]),
    it: new Map<string, readonly string[]>([
      ["object-o", ["analisi dell'oggetto", "analisi del tema"]],
      ["goal-ni", ["meta", "punto d'arrivo", "analisi di meta"]],
      ["direction-he", ["analisi direzionale"]],
      ["action-place-de", ["analisi di luogo", "analisi dell'ambiente"]],
      ["means-de", ["analisi di mezzo", "analisi strumentale"]],
      ["time-ni", ["analisi del tempo specifico"]],
      ["source-kara", ["analisi dell'origine"]],
      ["limit-made", ["analisi del limite"]],
    ]),
  };
  const listeningFormTerms = {
    en: new Map<string, readonly string[]>([
      ["polite-stems", ["stem", "stems", "viewing-stem", "pre-masu", "pre-ます"]],
      ["dictionary-lemma", ["dictionary", "lookup", "headword"]],
    ]),
    it: new Map<string, readonly string[]>([
      [
        "polite-stems",
        ["tema", "radice", "base pre-masu", "base pre-ます", "base cortese"],
      ],
      ["dictionary-lemma", ["dizionario", "consultazione", "lemma"]],
    ]),
  };
  const listeningAnalysisTerms = {
    en: new Map<string, readonly string[]>([
      [
        "analysis-headword",
        ["headword", "entry title", "dictionary entry", "lookup analysis"],
      ],
      ["analysis-verb", ["verb analysis", "action word"]],
      [
        "analysis-source",
        ["source-form label", "original-form label"],
      ],
      [
        "analysis-classification",
        ["classification", "classification label"],
      ],
    ]),
    it: new Map<string, readonly string[]>([
      [
        "analysis-headword",
        ["analisi di consultazione", "lemma", "voce", "voce di dizionario"],
      ],
      ["analysis-verb", ["analisi verbale", "parola d'azione"]],
      [
        "analysis-source",
        ["etichetta della forma di partenza", "forma originale"],
      ],
      [
        "analysis-classification",
        ["classificazione", "etichetta di classificazione"],
      ],
    ]),
  };
  const listeningParticleTerms = {
    en: new Map<string, readonly string[]>([
      ["object-o", ["neutral", "new information", "object"]],
      ["topic-wa", ["under discussion", "established", "topical"]],
      ["goal-ni", ["endpoint", "final stop", "arrival", "trip ends"]],
      ["direction-he", ["direction", "directional", "toward", "heading"]],
      ["action-place-de", ["action place", "setting", "where the action happens"]],
      ["means-de", ["means", "instrument", "tool"]],
    ]),
    it: new Map<string, readonly string[]>([
      ["object-o", ["neutro", "neutra", "informazione nuova", "oggetto"]],
      ["topic-wa", ["al centro del discorso", "stabilito", "topicale"]],
      ["goal-ni", ["meta", "fermata finale", "arrivo", "termina"]],
      ["direction-he", ["direzione", "direzionale", "verso", "si dirige"]],
      ["action-place-de", ["luogo d'azione", "ambiente", "dove avviene"]],
      ["means-de", ["mezzo", "strumento"]],
    ]),
  };
  const listeningCellTerms = {
    en: new Map<string, readonly string[]>([
      [
        "verb-polite-nonpast-affirmative",
        ["affirmative", "unnegated", "scheduled", "planned", "will happen"],
      ],
      [
        "verb-polite-nonpast-negative",
        ["negative", "cancelled", "will not", "does not happen"],
      ],
      [
        "verb-polite-past-affirmative",
        [
          "affirmative",
          "completed",
          "happened",
          "past",
          "past-tense",
          "yesterday-writing",
          "writing sentence",
        ],
      ],
      [
        "verb-polite-past-negative",
        ["negative", "did not", "absent", "did not happen"],
      ],
    ]),
    it: new Map<string, readonly string[]>([
      [
        "verb-polite-nonpast-affirmative",
        [
          "affermativo",
          "affermativa",
          "non negato",
          "non negativo",
          "non negativa",
          "programmato",
          "pianificato",
          "avverrà",
        ],
      ],
      [
        "verb-polite-nonpast-negative",
        [
          "negativo",
          "annullato",
          "non affermativo",
          "al negativo",
          "non avverrà",
        ],
      ],
      [
        "verb-polite-past-affirmative",
        [
          "affermativo",
          "al passato",
          "completata",
          "concluso",
          "non negativo",
          "avvenuto",
          "scrittura di ieri",
        ],
      ],
      [
        "verb-polite-past-negative",
        [
          "negativo",
          "non affermativo",
          "al negativo",
          "non avvenuto",
          "assente",
        ],
      ],
    ]),
  };
  const listeningClassTerms = {
    en: new Map<string, readonly string[]>([
      ["godan-verb-class", ["godan"]],
      ["ichidan-verb-class", ["ichidan"]],
      ["suru-verb-class", ["suru class", "special class"]],
      ["kuru-verb-class", ["kuru class", "special class"]],
    ]),
    it: new Map<string, readonly string[]>([
      ["godan-verb-class", ["godan"]],
      ["ichidan-verb-class", ["ichidan"]],
      ["suru-verb-class", ["classe suru", "classe speciale"]],
      ["kuru-verb-class", ["classe kuru", "classe speciale"]],
    ]),
  };
  const listeningInterpretationTerms = {
    en: new Map<string, readonly string[]>([
      ["future", ["future", "one-off", "one off"]],
      ["habitual", ["habitual", "recurring", "routine"]],
    ]),
    it: new Map<string, readonly string[]>([
      ["future", ["futuro", "singolo", "una tantum"]],
      ["habitual", ["abituale", "ricorrente", "routine"]],
    ]),
  };
  const listeningClauseTerms = {
    en: {
      question: ["question", "interrogative"],
      statement: ["statement", "declaration"],
    },
    it: {
      question: ["domanda", "interrogativa"],
      statement: ["affermazione", "enunciato"],
    },
  } as const;
  const semanticIdTerms = (
    id: string,
    locale: "en" | "it",
  ): readonly string[] => {
    if (locale === "it") return [];
    const ignored = new Set([
      "analysis",
      "verb",
      "polite",
      "noun",
      "form",
      "pv1",
      "pv2",
      "pv3",
      "pv4",
      "ap1",
      "ap2",
      "ap3",
      "ap4",
      "tm1",
      "tm2",
      "tm3",
      "tm4",
    ]);
    const tokens = id
      .toLowerCase()
      .split("-")
      .filter(
        (token) =>
          token.length >= 3 &&
          !ignored.has(token) &&
          !/^\d+$/u.test(token),
      );
    return [
      ...tokens,
      ...(tokens.length > 1 ? [tokens.join(" ")] : []),
    ];
  };
  const localizedMeaningTerms = (
    target: BaseVisibleTarget,
    other: BaseVisibleTarget,
    locale: "en" | "it",
  ): readonly string[] =>
    target.lexemeIds
      .filter((lexemeId) => !other.lexemeIds.includes(lexemeId))
      .flatMap((lexemeId) => {
        const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
        const meaning = lexeme
          ? (locale === "en" ? copyEn : copyIt)[lexeme.meaningCopyId]
          : undefined;
        return typeof meaning === "string"
          ? [
              lexeme?.kana ?? "",
              ...meaning
                .toLowerCase()
                .split(/[;,/()]/u)
                .map((term) => term.trim()),
            ].filter((term) => term.length >= 2)
          : [];
      });
  const listeningTermsFor = (
    target: BaseVisibleTarget,
    other: BaseVisibleTarget,
    locale: "en" | "it",
  ): readonly string[] => {
    const terms = [
      ...localizedMeaningTerms(target, other, locale),
      ...target.formIds
        .filter((formId) => !other.formIds.includes(formId))
        .flatMap((formId) => [
          ...(listeningFormTerms[locale].get(formId) ?? []),
          ...semanticIdTerms(formId, locale),
        ]),
      ...target.conceptIds
        .filter((conceptId) => !other.conceptIds.includes(conceptId))
        .flatMap((conceptId) => [
          ...(listeningClassTerms[locale].get(conceptId) ?? []),
          ...semanticIdTerms(conceptId, locale),
        ]),
      ...(target.particleBindings ?? [])
        .filter(
          ({ particleSense, role, attachmentLexemeId }) =>
            !(other.particleBindings ?? []).some(
              (binding) =>
                binding.particleSense === particleSense &&
                binding.role === role &&
                binding.attachmentLexemeId === attachmentLexemeId,
            ),
        )
        .map(({ particleSense }) => particleSense)
        .flatMap(
          (particleSense) =>
            listeningParticleTerms[locale].get(particleSense) ?? [],
        ),
      ...target.tokens
        .map(({ source }) => source.referenceId)
        .filter(
          (sourceId) =>
            !other.tokens.some(
              ({ source }) => source.referenceId === sourceId,
            ),
        )
        .flatMap((sourceId) => [
          ...(listeningAnalysisTerms[locale].get(sourceId) ?? []),
          ...(analysisTerms[locale].get(sourceId) ?? []),
          ...semanticIdTerms(sourceId, locale),
        ]),
      ...target.interpretationTags
        .filter(
          (tag) => !other.interpretationTags.includes(tag),
        )
        .flatMap(
          (tag) => listeningInterpretationTerms[locale].get(tag) ?? [],
        ),
    ];
    const cellId = inferredPoliteCellId(target);
    const otherCellId = inferredPoliteCellId(other);
    if (cellId && cellId !== otherCellId) {
      terms.push(
        ...(listeningCellTerms[locale].get(cellId) ?? []),
        ...semanticIdTerms(cellId, locale),
      );
    }
    const hasQuestion = target.tokens.some(
      ({ source }) => source.referenceId === "question-ka",
    );
    const otherHasQuestion = other.tokens.some(
      ({ source }) => source.referenceId === "question-ka",
    );
    if (hasQuestion !== otherHasQuestion) {
      terms.push(
        ...(hasQuestion
          ? listeningClauseTerms[locale].question
          : listeningClauseTerms[locale].statement),
      );
    }
    return [...new Set(terms.map((term) => term.toLowerCase()))];
  };
  const listeningCommonTermsFor = (
    design: BaseTask11ActivityDesign,
    locale: "en" | "it",
  ): readonly string[] => {
    if (design.optionTargets.length !== 2) return [];
    const terms: string[] = [];
    if (
      design.optionTargets.every((target) =>
        target.conceptIds.some((id) => id.endsWith("-verb-class")),
      )
    ) {
      terms.push(...(locale === "en" ? ["class", "classification"] : ["classe"]));
    }
    if (
      design.patternCellId.includes("stem") ||
      design.optionTargets.every(
        (target) =>
          target.formIds.includes("polite-stems") ||
          target.conceptIds.includes("polite-stems"),
      )
    ) {
      terms.push(
        ...(locale === "en"
          ? ["stem", "stems", "root", "pre-masu", "pre-ます"]
          : ["tema", "radice", "base pre-masu", "base pre-ます"]),
      );
    }
    const cells = design.optionTargets.map(inferredPoliteCellId);
    if (
      cells.every((cell) => cell?.includes("past") === true) &&
      cells[0] !== cells[1]
    ) {
      terms.push(
        ...(locale === "en"
          ? ["past", "past-tense"]
          : ["passato", "al passato"]),
      );
    }
    return terms;
  };
  const normalizeListeningText = (value: string): string =>
    value
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[‐‑‒–—−-]/gu, " ")
      .replace(/[’‘`']/gu, " ")
      .replace(/[^\p{L}\p{N}\u3040-\u30ff]+/gu, " ")
      .trim()
      .replace(/\s+/gu, " ");
  const copyContainsTerm = (
    copy: string,
    term: string,
    locale: "en" | "it",
  ): boolean => {
    const copyWords = normalizeListeningText(copy).split(" ").filter(Boolean);
    const termWords = normalizeListeningText(term).split(" ").filter(Boolean);
    if (termWords.length === 0) return false;
    const variants = (word: string): ReadonlySet<string> => {
      const values = new Set([word]);
      if (locale === "en") {
        values.add(`${word}s`);
        values.add(`${word}es`);
        if (word.endsWith("y") && word.length > 1) {
          values.add(`${word.slice(0, -1)}ies`);
        }
      } else {
        if (word.endsWith("o")) {
          values.add(`${word.slice(0, -1)}a`);
          values.add(`${word.slice(0, -1)}i`);
          values.add(`${word.slice(0, -1)}e`);
        }
        if (word.endsWith("a")) {
          values.add(`${word.slice(0, -1)}o`);
          values.add(`${word.slice(0, -1)}i`);
          values.add(`${word.slice(0, -1)}e`);
        }
        if (word.endsWith("e")) {
          values.add(`${word.slice(0, -1)}i`);
        }
      }
      return values;
    };
    return copyWords.some((_, startIndex) =>
      (termWords[0] === "non" || copyWords[startIndex - 1] !== "non") &&
      termWords.every(
        (termWord, offset) =>
          copyWords[startIndex + offset] !== undefined &&
          variants(termWord).has(copyWords[startIndex + offset]),
      ),
    );
  };

  for (const lesson of lessons) {
    for (const [index, design] of lesson.activityDesigns.entries()) {
      const push = (
        code: BaseTask11SemanticReviewErrorCode,
        detail?: string,
      ) =>
        errors.push({
          code,
          lessonId: lesson.content.lessonId,
          activityId: design.id,
          ...(detail ? { detail } : {}),
        });

      for (const target of [
        design.promptTarget,
        ...design.optionTargets,
        design.acceptedAnswerTarget,
      ]) {
        if (hasAmbiguousTimeVerbBoundary(target)) {
          push("kana-boundary-ambiguous", normalizedTask11Surface(target));
        }
      }
      if (design.operation === "identify-audio") {
        const cueRevealsAnswer = listeningCueRevealsAnswer(
          design.promptTarget,
          design.optionTargets,
        );
        if (
          cueRevealsAnswer ||
          design.contextTarget.revealsAnswer !== cueRevealsAnswer
        ) {
          push(
            "listening-cue-decisive",
            cueRevealsAnswer ? "visible-cue" : "context-metadata",
          );
        }
        if (
          design.optionTargets.length !== 2 ||
          design.optionTargets.some(
            (target) => !listeningOptionIsCanonical(target),
          )
        ) {
          push("listening-option-not-canonical");
        }
        if (
          design.reviewEvidence.optionAnalysisIds.length !==
            design.optionTargets.length ||
          design.reviewEvidence.optionAnalysisIds.some(
            (analysisId, optionIndex) =>
              !listeningOptionAnalysisIsConsistent(
                design.optionTargets[optionIndex],
                analysisId,
              ),
          )
        ) {
          push("listening-option-analysis-invalid");
        }
      }

      if (
        lesson.content.lessonId === "polite-verbs-2" &&
        design.operation !== "produce-spoken" &&
        design.operation !== "identify-audio"
      ) {
        const held = design.reviewEvidence.heldConstantPredicateLexemeId;
        const canonicalClass = held ? canonicalVerbClassConcept(held) : null;
        const acceptedClass =
          design.acceptedAnswerTarget.conceptIds.find((id) =>
            id.endsWith("-verb-class"),
          ) ?? null;
        if (
          design.reviewEvidence.contrastAxis !== "verb-class" ||
          held === null ||
          design.reviewEvidence.optionAnalysisIds.length !== 2 ||
          new Set(design.reviewEvidence.optionAnalysisIds).size !== 2 ||
          design.reviewEvidence.optionAnalysisIds.some(
            (analysisId, optionIndex) =>
              !design.optionTargets[optionIndex]?.conceptIds.includes(
                analysisId,
              ),
          ) ||
          design.optionTargets.some(
            ({ predicateLexemeId }) => predicateLexemeId !== held,
          ) ||
          acceptedClass !== canonicalClass
        ) {
          push("class-analysis-invalid");
        }
      }

      if (
        design.optionTargets.length === 2 &&
        design.operation !== "identify-audio"
      ) {
        const held = design.reviewEvidence.heldConstantPredicateLexemeId;
        if (
          held === null ||
          design.optionTargets.some(
            ({ predicateLexemeId }) => predicateLexemeId !== held,
          )
        ) {
          push("predicate-contrast-not-held");
        }
        if (
          design.reviewEvidence.contrastAxis === "particle" &&
          !particleContrastIsIsolated([
            design.optionTargets[0],
            design.optionTargets[1],
          ])
        ) {
          push("particle-contrast-not-isolated");
        }
      }

      if (design.operation === "diagnose-error") {
        const error = design.reviewEvidence.error;
        const actualChanged = [
          ...changedSourceIds(
            design.promptTarget,
            design.acceptedAnswerTarget,
          ),
        ].sort();
        const declaredChanged = [...(error?.changedTokenSourceIds ?? [])].sort();
        if (
          !error ||
          error.code !== design.operationEvidence.errorCode ||
          error.erroneousTargetId !==
            baseActivityPromptKey(lesson.content.lessonId, design.id) ||
          error.repairTargetId !== design.acceptedAnswerTargetId ||
          error.changedTokenSourceIds.length === 0 ||
          actualChanged.length !== declaredChanged.length ||
          actualChanged.some(
            (referenceId, changedIndex) =>
              referenceId !== declaredChanged[changedIndex],
          ) ||
          (error.defectAxis !== "meaning" &&
            design.promptTarget.predicateLexemeId !==
              design.acceptedAnswerTarget.predicateLexemeId)
        ) {
          push("error-delta-invalid");
        }
        const causalSources =
          error && TASK11_ERROR_CHANGED_SOURCES[error.code];
        const expectedCausalSources = [...(causalSources ?? [])].sort();
        if (
          !causalSources ||
          actualChanged.length !== expectedCausalSources.length ||
          actualChanged.some(
            (referenceId, changedIndex) =>
              referenceId !== expectedCausalSources[changedIndex],
          )
        ) {
          push("error-delta-invalid", `causal:${error?.code ?? "missing"}`);
        }
        if (error && causalSources) {
          const changed = new Set(causalSources);
          const unchangedSources = (target: BaseVisibleTarget) =>
            target.tokens
              .map(({ source }) => source.referenceId)
              .filter(
                (sourceId) =>
                  !changed.has(sourceId) &&
                  sourceId !== "japanese-comma" &&
                  sourceId !== "japanese-period",
              );
          const promptUnchanged = unchangedSources(design.promptTarget);
          const answerUnchanged = unchangedSources(
            design.acceptedAnswerTarget,
          );
          const unchangedOrderMatches =
            promptUnchanged.length === answerUnchanged.length &&
            promptUnchanged.every(
              (sourceId, sourceIndex) =>
                sourceId === answerUnchanged[sourceIndex],
            );
          const changedIndexes = (target: BaseVisibleTarget) =>
            target.tokens.flatMap(({ source }, tokenIndex) =>
              changed.has(source.referenceId) ? [tokenIndex] : [],
            );
          const promptChangedIndexes = changedIndexes(design.promptTarget);
          const answerChangedIndexes = changedIndexes(
            design.acceptedAnswerTarget,
          );
          const replacementPositionsMatch =
            !TASK11_POSITIONAL_REPLACEMENT_ERRORS.has(error.code) ||
            (promptChangedIndexes.length === answerChangedIndexes.length &&
              promptChangedIndexes.every(
                (tokenIndex, changedIndex) =>
                  tokenIndex === answerChangedIndexes[changedIndex],
              ));
          if (!unchangedOrderMatches || !replacementPositionsMatch) {
            push("error-delta-invalid", `position:${error.code}`);
          }
        }
        if (
          error?.defectAxis === "interpretation" &&
          (design.promptTarget.predicateLexemeId !==
            design.acceptedAnswerTarget.predicateLexemeId ||
            !error.changedTokenSourceIds.includes("interpretation-tag") ||
            error.changedTokenSourceIds.some(
              (referenceId) =>
                referenceId !== "interpretation-tag" &&
                referenceId !== "noun-maishuu" &&
                referenceId !== "noun-ashita",
            ))
        ) {
          push("error-delta-invalid", "interpretation");
        }
        if (error?.code === "means-context-mismatch") {
          const expected = ["noun-enpitsu", "noun-kasa"].sort();
          const particleSources = (target: BaseVisibleTarget) =>
            target.tokens
              .filter(({ kind }) => kind === "particle")
              .map(({ source }) => source.referenceId);
          if (
            actualChanged.length !== expected.length ||
            actualChanged.some(
              (referenceId, changedIndex) =>
                referenceId !== expected[changedIndex],
            ) ||
            JSON.stringify(particleSources(design.promptTarget)) !==
              JSON.stringify(
                particleSources(design.acceptedAnswerTarget),
              )
          ) {
            push("error-delta-invalid", "means-context-mismatch");
          }
        }
      }

      if (design.worldFactId !== null) {
        const grounding = design.worldFactGrounding;
        const groundedLexemeId: Readonly<Record<string, string>> = {
          learner: "noun-watashi",
          tanaka: "noun-tanaka",
          yamada: "noun-yamada",
          satou: "noun-satou",
          suzuki: "noun-suzuki",
          mari: "noun-mari",
          yuki: "noun-yuki-san",
          friend: "noun-tomodachi",
          meeting: "noun-kaigi",
          "bread-counter": "anchor-pan",
        };
        const expectedGrounding =
          typeof design.referentId === "string"
            ? groundedLexemeId[design.referentId]
            : undefined;
        if (
          !grounding ||
          grounding.factId !== design.worldFactId ||
          grounding.referentId !== design.referentId ||
          grounding.acceptedTargetId !== design.acceptedAnswerTargetId ||
          grounding.conflictingTargetIds.includes(
            design.acceptedAnswerTargetId,
          ) ||
          !expectedGrounding ||
          !design.acceptedAnswerTarget.lexemeIds.includes(expectedGrounding)
        ) {
          push("world-grounding-invalid");
        }
      }

      for (const [kind, target] of [
        ["prompt", design.promptTarget],
        ...design.optionTargets.map(
          (target) => ["option", target] as const,
        ),
      ] as const) {
        const prior = demonstrations.get(normalizedTask11Surface(target));
        if (
          prior &&
          !(
            design.category === "cumulative-retrieval" &&
            typeof design.operationEvidence.sourceTargetId === "string" &&
            design.operation !== "diagnose-error"
          )
        ) {
          push("worked-surface-reused", `${kind}:${prior}`);
        }
      }

      const promptTokenCount = design.promptTarget.tokens.filter(
        ({ kind }) => kind !== "punctuation",
      ).length;
      if (promptTokenCount > 1) {
        const promptSurface = normalizedTask11Surface(design.promptTarget);
        const prior = practiceSurfaces.get(promptSurface);
        if (prior) {
          push("worked-surface-reused", `prompt:${prior}`);
        } else {
          practiceSurfaces.set(promptSurface, `${design.id}:prompt`);
        }
      }

      if (design.optionTargets.length === 2) {
        const punctuation = design.optionTargets.map(({ tokens }) =>
          tokens[tokens.length - 1]?.kind === "punctuation"
            ? tokens[tokens.length - 1].jp
            : "",
        );
        if (punctuation[0] !== punctuation[1]) {
          push("option-punctuation-tell", punctuation.join(":"));
        }
      }

      for (const target of [
        ...design.optionTargets,
        ...(design.operation === "produce-spoken"
          ? [design.acceptedAnswerTarget]
          : []),
      ]) {
        const surface = normalizedTask11Surface(target);
        const prior = practiceSurfaces.get(surface);
        const repeatedSourceCandidate =
          (design.operation === "diagnose-error" ||
            design.operation === "transform-form") &&
          prior === `${design.id}:prompt` &&
          surface === normalizedTask11Surface(design.promptTarget);
        if (prior && !repeatedSourceCandidate) {
          push("worked-surface-reused", `practice:${prior}`);
        } else if (!prior) {
          practiceSurfaces.set(surface, design.id);
        }
      }

      const activity = lesson.content.activities[index];
      for (const locale of ["en", "it"] as const) {
        const copy =
          (locale === "en" ? copyEn : copyIt)[activity.instructionCopyId]
            ?.toLowerCase() ?? "";
        const retryCopy =
          (locale === "en" ? copyEn : copyIt)[
            activity.retryFeedbackCopyId
          ]?.toLowerCase() ?? "";
        const roleTermPattern =
          locale === "en"
            ? /\b(?:theme|predicate|role|analysis label)\b/iu
            : /\b(?:tema|predicato|ruolo|etichetta di analisi)\b/iu;
        const analysisSourceIds =
          design.acceptedAnswerTarget.tokens.map(
            ({ source }) => source.referenceId,
          );
        const inferredCellId = inferredPoliteCellId(
          design.acceptedAnswerTarget,
        );
        const relevantCellIds = new Set([
          design.patternCellId,
          ...design.acceptedAnswerTarget.patternCellIds,
          ...(inferredCellId ? [inferredCellId] : []),
        ]);
        const localizedCellTerms = [...relevantCellIds].flatMap(
          (cellId) => cellTerms[locale].get(cellId) ?? [],
        );
        const providedParticleSenses = design.acceptedAnswerTarget.particleFrame
          ? particleProvidedEntries(
              design.acceptedAnswerTarget.particleFrame.provided,
            ).entries.map(([, sense]) => sense)
          : [];
        const forbidden = new Set<string>([
          japanese(design.acceptedAnswerTarget).toLowerCase(),
          ...design.acceptedAnswerTarget.lexemeIds.flatMap((id) => {
            const lexeme = BASE_LEXEME_BY_ID.get(id);
            return lexeme ? [lexeme.kana.toLowerCase()] : [];
          }),
          ...design.acceptedAnswerTarget.tokens.flatMap((token) =>
            token.kind === "particle" ? [token.jp] : [],
          ),
          ...(design.acceptedAnswerTarget.conceptIds.includes(
            "godan-verb-class",
          )
            ? ["godan"]
            : []),
          ...(design.acceptedAnswerTarget.conceptIds.includes(
            "ichidan-verb-class",
          )
            ? ["ichidan"]
            : []),
          ...(design.acceptedAnswerTarget.conceptIds.includes(
            "suru-verb-class",
          )
            ? locale === "en"
              ? ["suru", "special class", "special-class"]
              : ["suru", "classe speciale", "classe-speciale"]
            : []),
          ...(design.acceptedAnswerTarget.conceptIds.includes(
            "kuru-verb-class",
          )
            ? locale === "en"
              ? ["kuru", "special class", "special-class"]
              : ["kuru", "classe speciale", "classe-speciale"]
            : []),
          ...localizedCellTerms,
          ...analysisSourceIds.flatMap(
            (sourceId) => analysisTerms[locale].get(sourceId) ?? [],
          ),
          ...providedParticleSenses.flatMap(
            (sense) => particleTerms[locale].get(sense) ?? [],
          ),
          ...(design.acceptedAnswerTarget.conceptIds.includes(
            "relative-time-omission",
          )
            ? locale === "en"
              ? ["without obligatory", "no obligatory particle", "unmarked relative"]
              : ["senza particella obbligatoria", "non marcato relativo"]
            : []),
          ...(design.operation === "order-chunks"
            ? locale === "en"
              ? ["theme", "predicate"]
              : ["tema", "predicato"]
            : []),
        ]);
        const competingTargets =
          design.operation === "produce-spoken"
            ? [design.promptTarget]
            : design.optionTargets.filter(
              (_, optionIndex) => optionIndex !== design.correctOptionIndex,
            );
        const decisiveLexemeTerms = design.acceptedAnswerTarget.lexemeIds
          .filter((lexemeId) =>
            competingTargets.some(
              (target) => !target.lexemeIds.includes(lexemeId),
            ),
          )
          .flatMap((lexemeId) => {
            const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
            if (!lexeme) return [];
            const localizedMeaning = (locale === "en" ? copyEn : copyIt)[
              lexeme.meaningCopyId
            ];
            return typeof localizedMeaning === "string"
              ? localizedMeaning
                  .toLowerCase()
                  .split(/[;,/()]/u)
                  .map((term) => term.trim())
                  .filter((term) => term.length >= 3)
              : [];
          });
        const retryForbidden = new Set([
          ...forbidden,
          ...design.acceptedAnswerTarget.tokens.flatMap((token) =>
            token.kind === "punctuation" ? [] : [token.jp.toLowerCase()],
          ),
          ...decisiveLexemeTerms,
        ]);
        const retryPositionPattern =
          locale === "en"
            ? /\b(?:first|last|final|before|after|left|right|precede(?:s|d)?|position)\b|at the end|without (?:re)?moving/iu
            : /\b(?:prima|dopo|ultimo|ultima|finale|posizione|sinistra|destra)\b|alla fine|in fondo|senza (?:ri)?spostar/iu;
        const leaked = [...forbidden].find(
          (value) =>
            value.length > 0 && copyContainsTerm(copy, value, locale),
        );
        const retryLeaked = [...retryForbidden].find(
          (value) =>
            value.length > 0 && copyContainsTerm(retryCopy, value, locale),
        );
        if (leaked) push("instruction-answer-leakage", `${locale}:${leaked}`);
        if (retryLeaked) {
          push("instruction-answer-leakage", `${locale}:retry:${retryLeaked}`);
        }
        if (roleTermPattern.test(copy)) {
          push("instruction-answer-leakage", `${locale}:role-term`);
        }
        if (roleTermPattern.test(retryCopy)) {
          push("instruction-answer-leakage", `${locale}:retry-role-term`);
        }
        if (retryPositionPattern.test(retryCopy)) {
          push("instruction-answer-leakage", `${locale}:retry-position`);
        }
        if (
          design.operation === "identify-audio" &&
          design.optionTargets.length === 2 &&
          (design.correctOptionIndex === 0 || design.correctOptionIndex === 1)
        ) {
          const alternative =
            design.optionTargets[design.correctOptionIndex === 0 ? 1 : 0];
          const acceptedTerms = listeningTermsFor(
            design.acceptedAnswerTarget,
            alternative,
            locale,
          );
          const alternativeTerms = listeningTermsFor(
            alternative,
            design.acceptedAnswerTarget,
            locale,
          );
          if (acceptedTerms.length === 0 || alternativeTerms.length === 0) {
            push(
              "listening-terms-missing",
              `${locale}:${acceptedTerms.length}:${alternativeTerms.length}`,
            );
          }
          const commonTerms = listeningCommonTermsFor(design, locale);
          const namesOneSide = (value: string) => {
            const namesAccepted = acceptedTerms.some((term) =>
              copyContainsTerm(value, term, locale),
            );
            const namesAlternative = alternativeTerms.some((term) =>
              copyContainsTerm(value, term, locale),
            );
            return namesAccepted !== namesAlternative;
          };
          const namesCommon = (value: string) =>
            commonTerms.some((term) =>
              copyContainsTerm(value, term, locale),
            );
          if (
            namesOneSide(copy) ||
            namesOneSide(retryCopy) ||
            namesCommon(copy) ||
            namesCommon(retryCopy)
          ) {
            push(
              "instruction-answer-leakage",
              `${locale}:listening-one-sided`,
            );
          }
        }
      }
    }
  }
  return deepFreeze(errors);
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
  evidence: Readonly<{
    readonly contrastAxis?: BaseTask11ContrastAxis;
    readonly heldConstantPredicateLexemeId?: string | null;
    readonly optionAnalysisIds?: readonly string[];
    readonly errorDefectAxis?: string | null;
    readonly changedTokenSourceIds?: readonly string[];
  }> = {},
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
    ...evidence,
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
    [],
    [
      ...new Set(
        prefix.flatMap((part) =>
          part.kind === "particle" &&
          (part.role === "topic" || part.role === "additive-topic")
            ? [part.role]
            : [],
        ),
      ),
    ],
  );
}

function stemDerivationTarget(
  lemmaId: string,
  patternCellId: string,
): BaseTask11TargetSpec {
  const stem = stemTarget(lemmaId, patternCellId);
  return {
    ...stem,
    parts: [
      task11VerbForm(lemmaId, "dictionary"),
      C,
      task11VerbForm(lemmaId, "polite-stem"),
    ],
  };
}

function dictionaryAnalysisTarget(
  lemmaId: string,
  patternCellId: string,
): BaseTask11TargetSpec {
  const target = t(
    lemmaId,
    "dictionary",
    [patternCellId],
    ["dictionary-lemma"],
  );
  return {
    ...target,
    parts: [
      task11VerbForm(lemmaId, "dictionary"),
      C,
      task11AnalysisLabel("analysis-dictionary"),
    ],
  };
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
    [
      ...new Set(
        prefix.flatMap((part) =>
          part.kind === "particle" &&
          (part.role === "topic" || part.role === "additive-topic")
            ? [part.role]
            : [],
        ),
      ),
    ],
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
type Pv1AnalysisId =
  | "analysis-dictionary"
  | "analysis-headword"
  | "analysis-lemma"
  | "analysis-predicate"
  | "analysis-verb"
  | "analysis-final-predicate";

function pv1AnalysisTarget(
  lemmaId: string,
  analysisId: Pv1AnalysisId,
  cell: typeof LOOKUP_CELL | typeof PREDICATE_CELL,
  labelFirst = false,
): BaseTask11TargetSpec {
  const verb = task11VerbForm(lemmaId, "dictionary");
  const label = task11AnalysisLabel(analysisId);
  return task11Target(
    labelFirst ? [label, C, verb] : [verb, C, label],
    {
      conceptIds: [
        cell === LOOKUP_CELL
          ? "dictionary-lemma"
          : "verb-predicate-recognition",
      ],
      patternCellIds: [cell],
      semanticRoleIds: [],
      interpretationTags: ["metalinguistic"],
      predicateSenseId: lemmaId.slice("verb-".length),
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
    },
  );
}

function pv1PromptOf(target: BaseTask11TargetSpec): BaseTask11TargetSpec {
  return { ...target, patternCellIds: [] };
}

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
    ex(pv1AnalysisTarget("verb-kaku", "analysis-headword", LOOKUP_CELL), "lookup-write", "かく is shown as a headword form.", "かく è mostrato come forma da lemma.", "Presents a complete lookup form, not a tense.", "Presenta una forma completa di consultazione, non un tempo.", "lookup"),
    ex(pv1AnalysisTarget("verb-yomu", "analysis-dictionary", LOOKUP_CELL), "lookup-read", "よむ is identified as a dictionary form.", "よむ è identificato come forma dizionario.", "Keeps the full lemma intact for lookup.", "Mantiene intatto il lemma per la consultazione.", "lookup"),
    ex(pv1AnalysisTarget("verb-nomu", "analysis-lemma", LOOKUP_CELL), "lookup-drink", "のむ is the base lemma.", "のむ è il lemma di base.", "Separates lemma identity from time reference.", "Separa l'identità del lemma dal riferimento temporale.", "lookup"),
    ex(pv1AnalysisTarget("verb-kau", "analysis-headword", LOOKUP_CELL, true), "lookup-buy", "The headword is かう.", "Il lemma di consultazione è かう.", "Shows an explicit metalinguistic label before the verb.", "Mostra un'etichetta metalinguistica esplicita prima del verbo.", "lookup"),
    ex(pv1AnalysisTarget("verb-hataraku", "analysis-dictionary", LOOKUP_CELL, true), "lookup-work", "The dictionary form is はたらく.", "La forma dizionario è はたらく.", "Recognizes the longer verb as one lemma.", "Riconosce il verbo più lungo come un solo lemma.", "lookup"),
    ex(pv1AnalysisTarget("verb-asobu", "analysis-lemma", LOOKUP_CELL, true), "lookup-play", "The base lemma is あそぶ.", "Il lemma di base è あそぶ.", "Completes the six authored lookup lemmas.", "Completa i sei lemmi di consultazione.", "lookup"),
    ex(pv1AnalysisTarget("verb-kaku", "analysis-predicate", PREDICATE_CELL), "write-predicate-card", "かく is identified as the predicate.", "かく è identificato come predicato.", "Names the verb's sentence role without making a bare pseudo-sentence.", "Nomina il ruolo del verbo senza creare una pseudo-frase.", "predicate-recognition"),
    ex(pv1AnalysisTarget("verb-yomu", "analysis-verb", PREDICATE_CELL), "read-verb-card", "よむ is identified as a verb.", "よむ è identificato come verbo.", "Uses an explicit grammatical analysis label.", "Usa un'etichetta di analisi grammaticale esplicita.", "predicate-recognition"),
    ex(pv1AnalysisTarget("verb-hataraku", "analysis-final-predicate", PREDICATE_CELL), "work-final-card", "はたらく can occupy the predicate-final slot.", "はたらく può occupare la posizione predicativa finale.", "Recognizes the complete predicate item.", "Riconosce l'elemento predicativo completo.", "predicate-recognition"),
    ex(pv1AnalysisTarget("verb-asobu", "analysis-predicate", PREDICATE_CELL, true), "play-predicate-card", "The predicate item is あそぶ.", "L'elemento predicativo è あそぶ.", "Contrasts a predicate analysis with lookup analysis.", "Contrappone l'analisi predicativa a quella di consultazione.", "predicate-recognition"),
  ],
  activities: [
    act(task11Cue(task11VerbForm("verb-yomu", "dictionary")), pv1AnalysisTarget("verb-yomu", "analysis-predicate", PREDICATE_CELL), pv1AnalysisTarget("verb-yomu", "analysis-headword", LOOKUP_CELL), 0, "polite-verbs-1-activity-1-instruction", PREDICATE_CELL, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(task11VerbForm("verb-kau", "dictionary")), pv1AnalysisTarget("verb-kau", "analysis-headword", LOOKUP_CELL), pv1AnalysisTarget("verb-kau", "analysis-predicate", PREDICATE_CELL), 1, "polite-verbs-1-activity-2-instruction", LOOKUP_CELL, BASE_MEANING_ACTIVITY_SHAPE),
    act(task11Cue(task11VerbForm("verb-kaku", "dictionary")), pv1AnalysisTarget("verb-kaku", "analysis-verb", PREDICATE_CELL), pv1AnalysisTarget("verb-kaku", "analysis-lemma", LOOKUP_CELL), 0, "polite-verbs-1-activity-3-instruction", PREDICATE_CELL, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(task11VerbForm("verb-nomu", "dictionary")), pv1AnalysisTarget("verb-nomu", "analysis-dictionary", LOOKUP_CELL), pv1AnalysisTarget("verb-nomu", "analysis-final-predicate", PREDICATE_CELL), 1, "polite-verbs-1-activity-4-instruction", LOOKUP_CELL, BASE_FORM_ACTIVITY_SHAPE),
    act(task11Cue(task11VerbForm("verb-yomu", "dictionary")), task11Target([task11VerbForm("verb-yomu", "dictionary"), C, task11AnalysisLabel("analysis-verb"), C, task11AnalysisLabel("analysis-predicate")], { conceptIds: ["verb-predicate-recognition"], patternCellIds: [PREDICATE_CELL], semanticRoleIds: [], interpretationTags: ["metalinguistic"], predicateSenseId: "yomu", predicateLexemeId: "verb-yomu", predicateAspect: "dynamic" }), task11Target([task11VerbForm("verb-yomu", "dictionary"), C, task11AnalysisLabel("analysis-headword"), C, task11AnalysisLabel("analysis-dictionary")], { conceptIds: ["dictionary-lemma"], patternCellIds: [LOOKUP_CELL], semanticRoleIds: [], interpretationTags: ["metalinguistic"], predicateSenseId: "yomu", predicateLexemeId: "verb-yomu", predicateAspect: "dynamic" }), 0, "polite-verbs-1-activity-5-instruction", PREDICATE_CELL, BASE_CONTEXT_ACTIVITY_SHAPE),
    act(task11Cue(task11VerbForm("verb-hataraku", "dictionary")), pv1AnalysisTarget("verb-hataraku", "analysis-headword", LOOKUP_CELL, true), pv1AnalysisTarget("verb-hataraku", "analysis-predicate", PREDICATE_CELL, true), 1, "polite-verbs-1-activity-6-instruction", LOOKUP_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE),
    act(pv1PromptOf(pv1AnalysisTarget("verb-kau", "analysis-lemma", LOOKUP_CELL)), pv1AnalysisTarget("verb-kau", "analysis-verb", PREDICATE_CELL), pv1AnalysisTarget("verb-kau", "analysis-dictionary", LOOKUP_CELL), 1, "polite-verbs-1-activity-7-instruction", PREDICATE_CELL, BASE_ERROR_ACTIVITY_SHAPE, null, null, "analysis-role-mismatch", { contrastAxis: "meaning", heldConstantPredicateLexemeId: "verb-kau", errorDefectAxis: "context", changedTokenSourceIds: ["analysis-lemma", "analysis-verb"] }),
    act(task11Cue(task11VerbForm("verb-asobu", "dictionary")), task11Target([task11VerbForm("verb-asobu", "dictionary"), C, task11AnalysisLabel("analysis-verb"), C, task11AnalysisLabel("analysis-predicate")], { conceptIds: ["verb-predicate-recognition"], patternCellIds: [PREDICATE_CELL], semanticRoleIds: [], interpretationTags: ["metalinguistic"], predicateSenseId: "asobu", predicateLexemeId: "verb-asobu", predicateAspect: "dynamic" }), pv1AnalysisTarget("verb-asobu", "analysis-headword", LOOKUP_CELL), 0, "polite-verbs-1-activity-8-instruction", PREDICATE_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE),
    act(task11Cue(task11VerbForm("verb-yomu", "dictionary")), pv1AnalysisTarget("verb-yomu", "analysis-headword", LOOKUP_CELL, true), pv1AnalysisTarget("verb-yomu", "analysis-verb", PREDICATE_CELL, true), 1, "polite-verbs-1-activity-9-instruction", LOOKUP_CELL, BASE_LISTENING_ACTIVITY_SHAPE),
    act(task11Cue(task11VerbForm("verb-hataraku", "dictionary")), task11Target([task11VerbForm("verb-hataraku", "dictionary"), C, task11AnalysisLabel("analysis-verb"), C, task11AnalysisLabel("analysis-predicate")], { conceptIds: ["verb-predicate-recognition"], patternCellIds: [PREDICATE_CELL], semanticRoleIds: [], interpretationTags: ["metalinguistic"], predicateSenseId: "hataraku", predicateLexemeId: "verb-hataraku", predicateAspect: "dynamic" }), pv1AnalysisTarget("verb-hataraku", "analysis-lemma", LOOKUP_CELL), 0, "polite-verbs-1-activity-10-instruction", PREDICATE_CELL, BASE_SPOKEN_ACTIVITY_SHAPE),
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
    ex(labelFirstClassAnalysisTarget("verb-oyogu", "godan-verb-class", GODAN_CELL), "label-first-godan", "The godan label precedes およぐ.", "L'etichetta godan precede およぐ.", "Applies class recognition in an explicit analysis card.", "Applica il riconoscimento della classe in una scheda di analisi esplicita.", "godan"),
    ex(labelFirstClassAnalysisTarget("verb-kuru", "kuru-verb-class", SPECIAL_CELL), "label-first-kuru", "The くる-class label precedes くる.", "L'etichetta della classe くる precede くる.", "Retrieves くる with its own explicit class label.", "Recupera くる con la propria etichetta di classe esplicita.", "special-class"),
  ],
  activities: [
    act(task11Cue(task11VerbForm("verb-oyogu", "dictionary"), C, task11AnalysisLabel("analysis-source")), task11ClassAnalysisTarget("verb-oyogu", "godan-verb-class", [GODAN_CELL]), task11ClassAnalysisTarget("verb-oyogu", "ichidan-verb-class", [ICHIDAN_CELL]), 1, "polite-verbs-2-activity-1-instruction", GODAN_CELL, BASE_MEANING_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-oyogu", optionAnalysisIds: ["godan-verb-class", "ichidan-verb-class"] }),
    act(task11Cue(task11VerbForm("verb-miru", "dictionary"), C, task11AnalysisLabel("analysis-source")), task11ClassAnalysisTarget("verb-miru", "ichidan-verb-class", [ICHIDAN_CELL]), task11ClassAnalysisTarget("verb-miru", "kuru-verb-class", [SPECIAL_CELL]), 0, "polite-verbs-2-activity-2-instruction", ICHIDAN_CELL, BASE_FORM_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-miru", optionAnalysisIds: ["ichidan-verb-class", "kuru-verb-class"] }),
    act(task11Cue(task11VerbForm("verb-taberu", "dictionary"), C, task11AnalysisLabel("analysis-source")), task11ClassAnalysisTarget("verb-taberu", "ichidan-verb-class", [ICHIDAN_CELL]), task11ClassAnalysisTarget("verb-taberu", "godan-verb-class", [GODAN_CELL]), 0, "polite-verbs-2-activity-3-instruction", ICHIDAN_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-taberu", optionAnalysisIds: ["ichidan-verb-class", "godan-verb-class"] }),
    act(task11Cue(task11VerbForm("verb-kaeru", "dictionary"), C, task11AnalysisLabel("analysis-source")), task11ClassAnalysisTarget("verb-kaeru", "godan-verb-class", [EXCEPTION_CELL]), task11ClassAnalysisTarget("verb-kaeru", "ichidan-verb-class", [ICHIDAN_CELL]), 1, "polite-verbs-2-activity-4-instruction", EXCEPTION_CELL, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-kaeru", optionAnalysisIds: ["godan-verb-class", "ichidan-verb-class"] }),
    act((() => { const target = task11ClassAnalysisTarget("verb-kaeru", "ichidan-verb-class", []); return { ...target, parts: [...target.parts, C, task11AnalysisLabel("analysis-suffix-guess")] }; })(), exceptionClassAnalysisTarget("verb-kaeru", [EXCEPTION_CELL]), (() => { const target = task11ClassAnalysisTarget("verb-kaeru", "ichidan-verb-class", [ICHIDAN_CELL]); return { ...target, parts: [...target.parts, C, task11AnalysisLabel("analysis-dictionary")] }; })(), 0, "polite-verbs-2-activity-5-instruction", EXCEPTION_CELL, BASE_ERROR_ACTIVITY_SHAPE, null, null, "verb-class-mismatch", { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-kaeru", optionAnalysisIds: ["verb-class-exceptions", "ichidan-verb-class"], errorDefectAxis: "form", changedTokenSourceIds: ["ichidan-verb-class", "godan-verb-class", "verb-class-exceptions", "analysis-suffix-guess"] }),
    act(task11Cue(task11VerbForm("verb-suru", "dictionary"), C, task11AnalysisLabel("analysis-source")), task11ClassAnalysisTarget("verb-suru", "suru-verb-class", [SPECIAL_CELL]), task11ClassAnalysisTarget("verb-suru", "godan-verb-class", [GODAN_CELL]), 1, "polite-verbs-2-activity-6-instruction", SPECIAL_CELL, BASE_CONTEXT_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-suru", optionAnalysisIds: ["suru-verb-class", "godan-verb-class"] }),
    act(task11Cue(task11VerbForm("verb-kuru", "dictionary"), C, task11AnalysisLabel("analysis-source")), task11ClassAnalysisTarget("verb-kuru", "kuru-verb-class", [SPECIAL_CELL]), task11ClassAnalysisTarget("verb-kuru", "ichidan-verb-class", [ICHIDAN_CELL]), 0, "polite-verbs-2-activity-7-instruction", SPECIAL_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-kuru", optionAnalysisIds: ["kuru-verb-class", "ichidan-verb-class"] }),
    act(task11Cue(task11VerbForm("verb-yomu", "dictionary"), C, task11AnalysisLabel("analysis-source")), task11ClassAnalysisTarget("verb-yomu", "godan-verb-class", [GODAN_CELL]), task11ClassAnalysisTarget("verb-yomu", "ichidan-verb-class", [ICHIDAN_CELL]), 1, "polite-verbs-2-activity-8-instruction", GODAN_CELL, BASE_MEANING_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-yomu", optionAnalysisIds: ["godan-verb-class", "ichidan-verb-class"] }),
    act(task11Cue(task11VerbForm("verb-miru", "dictionary"), C, task11AnalysisLabel("ichidan-verb-class"), C, task11AnalysisLabel("analysis-pair")), sourcedClassAnalysisTarget("verb-miru", "ichidan-verb-class", ICHIDAN_CELL, "analysis-source"), sourcedClassAnalysisTarget("verb-miru", "ichidan-verb-class", ICHIDAN_CELL, "analysis-classification"), 0, "polite-verbs-2-activity-9-instruction", ICHIDAN_CELL, BASE_LISTENING_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-miru", optionAnalysisIds: ["analysis-source", "analysis-classification"] }),
    act(task11Cue(task11VerbForm("verb-hataraku", "dictionary")), task11ClassAnalysisTarget("verb-hataraku", "godan-verb-class", [GODAN_CELL]), task11ClassAnalysisTarget("verb-hataraku", "ichidan-verb-class", [ICHIDAN_CELL]), 1, "polite-verbs-2-activity-10-instruction", GODAN_CELL, BASE_SPOKEN_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "verb-class", heldConstantPredicateLexemeId: "verb-hataraku", optionAnalysisIds: ["godan-verb-class", "ichidan-verb-class"] }),
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
    act(task11Cue(task11VerbForm("verb-kaku", "dictionary")), stemDerivationTarget("verb-kaku", GODAN_STEM), dictionaryAnalysisTarget("verb-kaku", GODAN_STEM), 0, "polite-verbs-3-activity-1-instruction", GODAN_STEM, BASE_FORM_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: "verb-kaku" }),
    act(task11Cue(task11VerbForm("verb-matsu", "dictionary")), stemDerivationTarget("verb-matsu", GODAN_STEM), dictionaryAnalysisTarget("verb-matsu", GODAN_STEM), 0, "polite-verbs-3-activity-2-instruction", GODAN_STEM, BASE_MEANING_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: "verb-matsu" }),
    act(task11Cue(task11VerbForm("verb-benkyou-suru", "dictionary"), C, task11AnalysisLabel("analysis-stem-source")), stemDerivationTarget("verb-benkyou-suru", SURU_STEM), permutedVerbTarget("verb-benkyou-suru", [task11VerbForm("verb-benkyou-suru", "polite-stem"), C, task11VerbForm("verb-benkyou-suru", "dictionary")], SURU_STEM, ["suru-verb-class"]), 1, "polite-verbs-3-activity-3-instruction", SURU_STEM, BASE_ORDERING_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: "verb-benkyou-suru" }),
    act(task11Cue(task11VerbForm("verb-suru", "dictionary"), C, task11AnalysisLabel("analysis-stem-source")), stemDerivationTarget("verb-suru", SURU_STEM), dictionaryAnalysisTarget("verb-suru", SURU_STEM), 1, "polite-verbs-3-activity-4-instruction", SURU_STEM, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: "verb-suru" }),
    act(task11Cue(task11VerbForm("verb-kuru", "dictionary"), C, task11AnalysisLabel("analysis-stem-source")), stemDerivationTarget("verb-kuru", KURU_STEM), dictionaryAnalysisTarget("verb-kuru", KURU_STEM), 0, "polite-verbs-3-activity-5-instruction", KURU_STEM, BASE_CONTROLLED_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: "verb-kuru" }),
    act(task11Target([task11VerbForm("verb-kaeru", "dictionary"), C, task11DiagnosticForm("verb-kaeru", "かえ", "kae", "incorrect-ichidan-stem")], { conceptIds: ["verb-class-exceptions"], patternCellIds: [], semanticRoleIds: [], interpretationTags: ["metalinguistic"], predicateSenseId: "kaeru", predicateLexemeId: "verb-kaeru", predicateAspect: "dynamic" }), stemDerivationTarget("verb-kaeru", GODAN_STEM), dictionaryAnalysisTarget("verb-kaeru", GODAN_STEM), 1, "polite-verbs-3-activity-6-instruction", GODAN_STEM, BASE_ERROR_ACTIVITY_SHAPE, null, null, "incorrect-ichidan-stem", { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: "verb-kaeru", errorDefectAxis: "form", changedTokenSourceIds: ["incorrect-ichidan-stem", "verb-kaeru"] }),
    act(task11Cue(task11VerbForm("verb-denwa-suru", "dictionary"), C, task11AnalysisLabel("analysis-stem-source")), stemDerivationTarget("verb-denwa-suru", SURU_STEM), dictionaryAnalysisTarget("verb-denwa-suru", SURU_STEM), 0, "polite-verbs-3-activity-7-instruction", SURU_STEM, BASE_CONTEXT_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: "verb-denwa-suru" }),
    act(task11Cue(task11VerbForm("verb-sanpo-suru", "dictionary"), C, task11AnalysisLabel("analysis-stem-source")), stemDerivationTarget("verb-sanpo-suru", SURU_STEM), dictionaryAnalysisTarget("verb-sanpo-suru", SURU_STEM), 1, "polite-verbs-3-activity-8-instruction", SURU_STEM, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: "verb-sanpo-suru" }),
    act(task11Cue(task11AnalysisLabel("analysis-stem-source")), stemDerivationTarget("verb-miru", ICHIDAN_STEM), stemDerivationTarget("verb-taberu", ICHIDAN_STEM), 0, "polite-verbs-3-activity-9-instruction", ICHIDAN_STEM, BASE_LISTENING_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: null, optionAnalysisIds: ["polite-stems", "polite-stems"] }),
    act(task11Cue(task11VerbForm("verb-yomu", "dictionary")), stemDerivationTarget("verb-yomu", GODAN_STEM), dictionaryAnalysisTarget("verb-yomu", GODAN_STEM), 1, "polite-verbs-3-activity-10-instruction", GODAN_STEM, BASE_SPOKEN_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-stem", heldConstantPredicateLexemeId: "verb-yomu" }),
  ],
  dialogue: null,
};

const EXPLICIT_MASU = "pv4-explicit-topic-masu";
const OMITTED_MASU = "pv4-grounded-omission-masu";
const TOPIC = (id: string): readonly BaseTask11Part[] => [
  L(id),
  P("topic-wa", "topic", id),
];
function malformedPoliteClause(
  lemmaId: string,
  topicId: string,
  kana: string,
  romaji: string,
  tag: "habitual" | "future" = "habitual",
  discourse: "topic" | "additive-topic" = "additive-topic",
  errorCode = "dictionary-plus-masu",
  includePatternCell = true,
): BaseTask11TargetSpec {
  const particle =
    discourse === "topic"
      ? P("topic-wa", "topic", topicId)
      : P("additive-mo", "additive-topic", topicId);
  return task11Target(
    [
      L(topicId),
      particle,
      task11DiagnosticForm(lemmaId, kana, romaji, errorCode),
    ],
    {
      conceptIds: ["sentence-omission"],
      patternCellIds: includePatternCell ? [EXPLICIT_MASU] : [],
      semanticRoleIds: [discourse],
      interpretationTags: [tag],
      predicateSenseId: lemmaId.slice("verb-".length),
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
    },
  );
}
const L4: BaseTask11LessonSpec = {
  lessonId: "polite-verbs-4",
  contract: "content",
  prerequisiteLessonIds: ["polite-verbs-3"],
  newLexemeIds: [
    "verb-okiru",
    "verb-aruku",
    "verb-kiku",
    "verb-tsukuru",
    "verb-yasumu",
    "verb-neru",
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
    ex(politeTarget("verb-okiru", EXPLICIT_MASU, TOPIC("noun-tanaka")), "tanaka-wakes", "Tanaka wakes up.", "Tanaka si sveglia.", "Uses the owned ichidan stem plus ます.", "Usa il tema ichidan noto più ます.", "habitual", "complete-clause"),
    ex(politeTarget("verb-aruku", EXPLICIT_MASU, TOPIC("noun-satou")), "satou-walks", "Satou walks.", "Satou cammina.", "Builds a godan polite predicate from its generated stem.", "Costruisce un predicato cortese godan dal tema generato.", "habitual", "complete-clause"),
    ex(politeTarget("verb-kiku", EXPLICIT_MASU, TOPIC("noun-suzuki")), "suzuki-listens", "Suzuki listens.", "Suzuki ascolta.", "Leaves a recoverable theme unspoken without claiming it is overt.", "Lascia inespresso un tema recuperabile senza dichiararlo esplicito.", "habitual", "complete-clause"),
    ex(politeTarget("verb-tsukuru", EXPLICIT_MASU, TOPIC("noun-mari"), "future"), "mari-makes", "Mari will make it.", "Mari lo preparerà.", "Uses context to license a future nonpast reading.", "Usa il contesto per una lettura futura del non-passato.", "future", "complete-clause"),
    ex(politeTarget("verb-yasumu", EXPLICIT_MASU, TOPIC("noun-yuki-san")), "yuki-rests", "Yuki rests regularly.", "Yuki riposa regolarmente.", "Adds a habitual rest predicate with an explicit topic.", "Aggiunge un predicato abituale di riposo con tema esplicito.", "habitual", "complete-clause"),
    ex(politeTarget("verb-neru", EXPLICIT_MASU, TOPIC("noun-tomodachi"), "future"), "friend-sleeps", "My friend will sleep.", "Il mio amico dormirà.", "Uses the new sleep predicate for a future plan.", "Usa il nuovo predicato dormire per un piano futuro.", "future", "complete-clause"),
    ex(politeTarget("verb-hanasu", EXPLICIT_MASU, TOPIC("noun-sensei"), "future"), "teacher-speaks", "The teacher will speak.", "L’insegnante parlerà.", "Uses an explicit known topic with the new speaking predicate.", "Usa un tema esplicito noto con il nuovo predicato parlare.", "future", "complete-clause"),
    ex(politeTarget("verb-iku", OMITTED_MASU, [], "future"), "grounded-goes", "I will go. (mover and goal recoverable)", "Andrò. (persona e meta recuperabili)", "Introduces going without naming a goal before argument particles.", "Introduce andare senza nominare una meta prima delle particelle argomentali.", "future", "complete-clause"),
  ],
  activities: [
    act(task11Cue(L("noun-watashi")), politeTarget("verb-okiru", EXPLICIT_MASU, TOPIC("noun-watashi")), malformedPoliteClause("verb-okiru", "noun-watashi", "おきるます", "okiru masu", "habitual", "topic"), 0, "polite-verbs-4-activity-1-instruction", EXPLICIT_MASU, BASE_MEANING_ACTIVITY_SHAPE, "learner", "learner-wakes", null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-okiru" }),
    act(task11Cue(L("noun-yamada")), politeTarget("verb-iku", EXPLICIT_MASU, TOPIC("noun-yamada"), "future"), malformedPoliteClause("verb-iku", "noun-yamada", "いき", "iki", "future", "topic", "missing-masu"), 1, "polite-verbs-4-activity-2-instruction", EXPLICIT_MASU, BASE_CONTEXT_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-iku" }),
    act(task11Cue(L("noun-yamada")), politeTarget("verb-aruku", EXPLICIT_MASU, TOPIC("noun-yamada")), permutedVerbTarget("verb-aruku", [task11VerbForm("verb-aruku", "polite-nonpast"), L("noun-yamada"), P("topic-wa", "topic", "noun-yamada")], EXPLICIT_MASU, ["sentence-omission"], ["habitual"], ["topic"]), 1, "polite-verbs-4-activity-3-instruction", EXPLICIT_MASU, BASE_ORDERING_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-aruku" }),
    act(stemTarget("verb-kiku", null), politeTarget("verb-kiku", EXPLICIT_MASU, [L("noun-yamada"), P("additive-mo", "additive-topic", "noun-yamada")]), malformedPoliteClause("verb-kiku", "noun-yamada", "きくます", "kiku masu"), 0, "polite-verbs-4-activity-4-instruction", EXPLICIT_MASU, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-kiku" }),
    act(task11Cue(L("noun-tanaka")), politeTarget("verb-tsukuru", EXPLICIT_MASU, [L("noun-tanaka"), P("additive-mo", "additive-topic", "noun-tanaka")], "future"), malformedPoliteClause("verb-tsukuru", "noun-tanaka", "つくり", "tsukuri", "future", "additive-topic", "missing-masu"), 0, "polite-verbs-4-activity-5-instruction", EXPLICIT_MASU, BASE_CONTROLLED_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-tsukuru" }),
    act(malformedPoliteClause("verb-hanasu", "noun-watashi", "はなすます", "hanasu masu", "future", "topic", "malformed-polite-form", false), politeTarget("verb-hanasu", EXPLICIT_MASU, TOPIC("noun-watashi"), "future"), malformedPoliteClause("verb-hanasu", "noun-watashi", "はなすます", "hanasu masu", "future", "topic", "malformed-polite-form", false), 1, "polite-verbs-4-activity-6-instruction", EXPLICIT_MASU, BASE_ERROR_ACTIVITY_SHAPE, "learner", "learner-will-speak", "malformed-polite-form", { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-hanasu", errorDefectAxis: "form", changedTokenSourceIds: ["malformed-polite-form", "verb-hanasu", "masu"] }),
    act(task11Cue(L("noun-sensei")), politeTarget("verb-yasumu", EXPLICIT_MASU, [L("noun-sensei"), P("additive-mo", "additive-topic", "noun-sensei")]), malformedPoliteClause("verb-yasumu", "noun-sensei", "やすむます", "yasumu masu"), 0, "polite-verbs-4-activity-7-instruction", EXPLICIT_MASU, BASE_FORM_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-yasumu" }),
    act(task11Cue(L("noun-mari")), politeTarget("verb-neru", EXPLICIT_MASU, [L("noun-mari"), P("additive-mo", "additive-topic", "noun-mari")], "future"), malformedPoliteClause("verb-neru", "noun-mari", "ねるます", "neru masu", "future"), 1, "polite-verbs-4-activity-8-instruction", EXPLICIT_MASU, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-neru" }),
    act(task11Cue(L("noun-sensei")), politeTarget("verb-hataraku", EXPLICIT_MASU, TOPIC("noun-sensei"), "future"), politeFinalTarget("verb-hataraku", EXPLICIT_MASU, TOPIC("noun-sensei"), [P("question-ka", "question", "verb-hataraku")], "future", ["topic"]), 0, "polite-verbs-4-activity-9-instruction", EXPLICIT_MASU, BASE_LISTENING_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: "verb-hataraku" }),
    act(task11Cue(L("noun-gakusei")), politeTarget("verb-matsu", EXPLICIT_MASU, TOPIC("noun-gakusei"), "future"), stemTarget("verb-matsu", EXPLICIT_MASU), 1, "polite-verbs-4-activity-10-instruction", EXPLICIT_MASU, BASE_SPOKEN_ACTIVITY_SHAPE, null, null, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-matsu" }),
  ],
  dialogue: [
    { speakerId: "learner", target: politeFinalTarget("verb-hataraku", EXPLICIT_MASU, TOPIC("noun-yuki-san"), [P("question-ka", "question", "verb-hataraku")], "habitual", ["topic"]), frame: "ask-yuki-routine", utteranceKind: "complete-clause", en: "Does Yuki work?", it: "Yuki lavora?", purposeEn: "Opens with a familiar topic and a polite routine question.", purposeIt: "Apre con un tema noto e una domanda cortese sulla routine." },
    { speakerId: "partner", target: politeTarget("verb-hataraku", OMITTED_MASU, [L("expression-hai"), C]), frame: "confirm-yuki-routine", utteranceKind: "complete-clause", en: "Yes, she does.", it: "Sì, lavora.", purposeEn: "Omits the recoverable Yuki topic in the answer.", purposeIt: "Omette il tema Yuki recuperabile nella risposta." },
    { speakerId: "learner", target: politeFinalTarget("verb-aruku", EXPLICIT_MASU, [L("noun-yamada"), P("additive-mo", "additive-topic", "noun-yamada")], [P("question-ka", "question", "verb-aruku")], "habitual", ["additive-topic"]), frame: "ask-yamada-walk", utteranceKind: "complete-clause", en: "Does Yamada walk too?", it: "Anche Yamada cammina?", purposeEn: "Moves to Yamada's established walking routine.", purposeIt: "Passa alla routine di cammino stabilita per Yamada." },
    { speakerId: "partner", target: politeTarget("verb-aruku", OMITTED_MASU, [L("expression-hai"), C]), frame: "confirm-yamada-walk", utteranceKind: "complete-clause", en: "Yes, Yamada walks.", it: "Sì, Yamada cammina.", purposeEn: "Confirms the new referent without contradicting the work routine.", purposeIt: "Conferma il nuovo referente senza contraddire la routine di lavoro." },
    { speakerId: "learner", target: politeFinalTarget("verb-benkyou-suru", EXPLICIT_MASU, TOPIC("noun-mari"), [P("question-ka", "question", "verb-benkyou-suru")], "habitual", ["topic"]), frame: "ask-mari-study", utteranceKind: "complete-clause", en: "Does Mari study?", it: "Mari studia?", purposeEn: "Checks another known routine without adding an argument particle.", purposeIt: "Controlla un'altra routine nota senza aggiungere particelle argomentali." },
    { speakerId: "partner", target: politeFinalTarget("verb-benkyou-suru", OMITTED_MASU, [L("expression-hai"), C], [P("interactional-yo", "interaction", "verb-benkyou-suru")]), frame: "confirm-mari-study", utteranceKind: "complete-clause", en: "Yes, she studies.", it: "Sì, studia.", purposeEn: "Closes with natural omission and the known assertive particle.", purposeIt: "Chiude con omissione naturale e la particella assertiva nota." },
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
    learnerRoutine: "wakes",
    tanakaRoutine: "works",
    yamadaRoutine: "walks",
    yukiRoutine: "works",
    friendRoutine: "sleeps",
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
  if (!result.ok) return result;
  const semanticErrors = validateTask11SemanticReview(RAW_POLITE_LESSONS);
  if (semanticErrors.length > 0) {
    return {
      ok: false,
      errors: semanticErrors.some(
        ({ code }) => code === "instruction-answer-leakage",
      )
        ? ["invalid-copy"]
        : ["invalid-lesson-shape"],
    };
  }
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
    `Invalid Base polite-verbs module: ${validation.errors.join(", ")} ${JSON.stringify(details)} ${JSON.stringify(sequenceDetails)} ${JSON.stringify(publicationDetails)} ${JSON.stringify(validateTask11SemanticReview(RAW_POLITE_LESSONS))}`,
  );
}

export const BASE_POLITE_VERBS_MODULE: BasePoliteVerbsModule = deepFreeze(
  RAW_POLITE_VERBS_MODULE,
);

import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  BaseContentLessonContent,
  BaseExample,
  BaseSystemLessonContent,
  BaseValidationCatalogs,
  BaseVisibleTarget,
} from "../catalog/types";
import { BASE_LEXICON } from "../catalog/lexicon";
import {
  realizeIAdjectiveAttributive,
  realizeIAdjectivePredicate,
  realizeNaAdjectiveAttributive,
  realizeNaAdjectivePredicate,
  realizeOwnedNounPredicate,
  type BasePredicateForm,
} from "../forms/adjectiveForms";
import {
  hasAuthoredClauseFinalSuffix,
  isExactOrderChunkPermutation,
  strictTask11ModuleSnapshot,
  type StrictTask11CorpusTarget,
} from "../validation/moduleSnapshots";
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
  worldFactLedgerFor,
  type BaseSemanticActivityShape,
  type BaseWorldFactRecord,
} from "./module02SentenceFoundations";
import {
  buildTask11Lesson,
  task11Cue,
  task11DiagnosticForm,
  task11Lexeme,
  task11Particle,
  task11PlainDataEqual,
  task11PlainDataSnapshot,
  task11Target,
  task11ValidationCatalogs,
  validateTask11ModuleBase,
  type BaseTask11ActivitySpec,
  type BaseTask11ContrastAxis,
  type BaseTask11ExampleSpec,
  type BaseTask11Lesson,
  type BaseTask11LessonSpec,
  type BaseTask11ModuleError,
  type BaseTask11Part,
  type BaseTask11PredicateKind,
  type BaseTask11TargetSpec,
} from "./module04PoliteVerbs";
import {
  BASE_TIME_MOVEMENT_MODULE,
  BASE_TIME_MOVEMENT_VALIDATION_CATALOGS,
} from "./module06TimeMovement";

export interface BaseCopulaAdjectivesModule {
  readonly id: "copula-adjectives";
  readonly lessons: readonly BaseTask11Lesson[];
  readonly sequence: readonly (
    | BaseSystemLessonContent
    | BaseContentLessonContent
  )[];
  readonly worldFacts: Readonly<{ readonly scope: "predicate-system" }>;
  readonly worldFactIds: readonly string[];
  readonly worldFactLedger: readonly BaseWorldFactRecord[];
}

const L = task11Lexeme;
const P = task11Particle;

function predicatePart(
  predicateKind: BaseTask11PredicateKind,
  lexemeId: string,
  form: BasePredicateForm,
): BaseTask11Part {
  return { kind: "predicate-form", predicateKind, lexemeId, form };
}

function iAttributive(lexemeId: string): BaseTask11Part {
  return { kind: "i-adjective-attributive", lexemeId };
}

function naAttributive(lexemeId: string): BaseTask11Part {
  return { kind: "na-adjective-attributive", lexemeId };
}

function predicateTarget(
  predicateKind: BaseTask11PredicateKind,
  lexemeId: string,
  form: BasePredicateForm,
  patternCellId: string,
  topicId?: string,
  conceptIds: readonly string[] = [],
): BaseTask11TargetSpec {
  const predicateConceptIds =
    predicateKind === "noun"
      ? form === "negative"
        ? ["negative-noun-predicate-copula"]
        : form === "pastAffirmative" || form === "pastNegative"
          ? ["remaining-copula-cells"]
          : []
      : predicateKind === "i-adjective"
        ? ["i-adjective-class", "i-adjective-tense-polarity"]
        : ["na-adjective-class", "na-adjective-predicate-and-attributive"];
  return task11Target(
    [
      ...(topicId ? [L(topicId), P("topic-wa", "topic", topicId)] : []),
      predicatePart(predicateKind, lexemeId, form),
    ],
    {
      conceptIds: [...new Set([...predicateConceptIds, ...conceptIds])],
      patternCellIds: [patternCellId],
      semanticRoleIds: topicId ? ["topic"] : [],
      interpretationTags: [
        ...(form === "pastAffirmative" || form === "pastNegative"
          ? (["past"] as const)
          : (["present-state"] as const)),
        ...(form === "negative" || form === "pastNegative"
          ? (["negative"] as const)
          : []),
      ],
      predicateSenseId: `${predicateKind}-predicate`,
      predicateLexemeId: lexemeId,
      predicateAspect:
        predicateKind === "noun" ? "nominal" : "adjectival",
    },
  );
}

function modifierTarget(
  adjectiveKind: "i-adjective" | "na-adjective",
  adjectiveId: string,
  nounId: string,
  patternCellId: string,
  topicId?: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      ...(topicId ? [L(topicId), P("topic-wa", "topic", topicId)] : []),
      adjectiveKind === "i-adjective"
        ? iAttributive(adjectiveId)
        : naAttributive(adjectiveId),
      predicatePart("noun", nounId, "affirmative"),
    ],
    {
      conceptIds:
        adjectiveKind === "i-adjective"
          ? [
              "i-adjective-class",
              "i-adjective-tense-polarity",
              "modifier-before-noun",
            ]
          : [
              "na-adjective-class",
              "na-adjective-predicate-and-attributive",
              "modifier-before-noun",
            ],
      patternCellIds: [patternCellId],
      semanticRoleIds: topicId ? ["topic"] : [],
      interpretationTags: ["present-state"],
      predicateSenseId: "modified-noun-predicate",
      predicateLexemeId: nounId,
      predicateAspect: "nominal",
    },
  );
}

function ex(
  target: BaseTask11TargetSpec,
  frame: string,
  en: string,
  it: string,
  purposeEn: string,
  purposeIt: string,
  semanticTag: string,
): BaseTask11ExampleSpec {
  return {
    target,
    frame,
    utteranceKind: "complete-clause",
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
  lessonId: string,
  index: number,
  patternCellId: string,
  shape: BaseSemanticActivityShape,
  errorCode: string | null = null,
  evidence: Readonly<{
    readonly contrastAxis?: BaseTask11ContrastAxis;
    readonly heldConstantPredicateLexemeId?: string | null;
    readonly optionAnalysisIds?: readonly string[];
    readonly errorDefectAxis?: string | null;
    readonly changedTokenSourceIds?: readonly string[];
    readonly worldFactId?: string;
    readonly referentId?: string;
    readonly preserveDistractorPatternCellIds?: boolean;
  }> = {},
): BaseTask11ActivitySpec {
  return {
    prompt,
    answer,
    distractor,
    correctOptionIndex,
    promptContextCopyId: `${lessonId}-activity-${index}-instruction`,
    patternCellId,
    shape,
    referentId: evidence.referentId ?? null,
    worldFactId: evidence.worldFactId ?? null,
    answerFactStatus: "accepted-world",
    distractorFactStatus: "rejected-context",
    preserveDistractorPatternCellIds:
      evidence.preserveDistractorPatternCellIds ?? true,
    errorCode,
    ...evidence,
  };
}

function promptOf(target: BaseTask11TargetSpec): BaseTask11TargetSpec {
  return { ...target, patternCellIds: [] };
}

const NOUN_AFFIRMATIVE = "noun-predicate-affirmative";
const NOUN_NEGATIVE = "noun-predicate-negative";
const NOUN_PAST_AFFIRMATIVE = "noun-predicate-past-affirmative";
const NOUN_PAST_NEGATIVE = "noun-predicate-past-negative";
const I_AFFIRMATIVE = "i-adjective-affirmative";
const I_NEGATIVE = "i-adjective-negative";
const I_PAST_AFFIRMATIVE = "i-adjective-past-affirmative";
const I_PAST_NEGATIVE = "i-adjective-past-negative";
const I_ATTRIBUTIVE = "i-adjective-attributive";
const NA_AFFIRMATIVE = "na-adjective-affirmative";
const NA_NEGATIVE = "na-adjective-negative";
const NA_PAST_AFFIRMATIVE = "na-adjective-past-affirmative";
const NA_PAST_NEGATIVE = "na-adjective-past-negative";
const NA_ATTRIBUTIVE = "na-adjective-attributive";

const L1: BaseTask11LessonSpec = {
  lessonId: "copula-adjectives-1",
  contract: "system",
  prerequisiteLessonIds: ["time-movement-4", "sentence-foundations-3"],
  newLexemeIds: ["noun-kaishain", "noun-kenkyuusha", "noun-ryourinin"],
  reviewLexemeIds: [
    "noun-gakusei",
    "noun-sensei",
    "noun-kangoshi",
    "noun-bengoshi",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
  ],
  introducedConceptIds: [
    "negative-noun-predicate-copula",
    "base-form-noun-predicate-negative",
  ],
  reviewedConceptIds: ["affirmative-desu", "topic-wa"],
  patternCellIds: [NOUN_AFFIRMATIVE, NOUN_NEGATIVE],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "tense-polarity",
    "reference-adjective-grid",
  ],
  examples: [
    ex(predicateTarget("noun", "noun-kaishain", "affirmative", NOUN_AFFIRMATIVE, "noun-tanaka"), "tanaka-company-worker", "Tanaka is a company employee.", "Tanaka è un impiegato.", "Reviews affirmative です with a new profession.", "Ripassa です affermativo con una nuova professione.", "noun-present-affirmative"),
    ex(predicateTarget("noun", "noun-kaishain", "negative", NOUN_NEGATIVE, "noun-yamada"), "yamada-not-company-worker", "Yamada is not a company employee.", "Yamada non è un impiegato.", "Introduces polite negative noun predication.", "Introduce il predicato nominale negativo cortese.", "noun-present-negative"),
    ex(predicateTarget("noun", "noun-kenkyuusha", "affirmative", NOUN_AFFIRMATIVE, "noun-satou"), "satou-researcher", "Satou is a researcher.", "Satou è un ricercatore.", "Keeps the noun predicate affirmative.", "Mantiene affermativo il predicato nominale.", "noun-present-affirmative"),
    ex(predicateTarget("noun", "noun-kenkyuusha", "negative", NOUN_NEGATIVE, "noun-suzuki"), "suzuki-not-researcher", "Suzuki is not a researcher.", "Suzuki non è un ricercatore.", "Changes only polarity for a noun predicate.", "Cambia soltanto la polarità del predicato nominale.", "noun-present-negative"),
    ex(predicateTarget("noun", "noun-ryourinin", "affirmative", NOUN_AFFIRMATIVE, "noun-mari"), "mari-cook", "Mari is a cook.", "Mari è una cuoca.", "Uses the reviewed affirmative pattern with a person.", "Usa lo schema affermativo ripassato con una persona.", "noun-present-affirmative"),
    ex(predicateTarget("noun", "noun-ryourinin", "negative", NOUN_NEGATIVE, "noun-watashi"), "speaker-not-cook", "I am not a cook.", "Non sono un cuoco.", "Uses ではありません with a recoverable speaker.", "Usa ではありません con il parlante recuperabile.", "noun-present-negative"),
    ex(predicateTarget("noun", "noun-gakusei", "negative", NOUN_NEGATIVE, "noun-tanaka"), "tanaka-not-student", "Tanaka is not a student.", "Tanaka non è uno studente.", "Contrasts the earlier affirmative student predicate.", "Contrappone il precedente predicato studente affermativo.", "noun-present-negative"),
    ex(predicateTarget("noun", "noun-sensei", "affirmative", NOUN_AFFIRMATIVE, "noun-yamada"), "yamada-teacher", "Yamada is a teacher.", "Yamada è un insegnante.", "Retrieves affirmative noun predication.", "Recupera il predicato nominale affermativo.", "noun-present-affirmative"),
    ex(predicateTarget("noun", "noun-kangoshi", "negative", NOUN_NEGATIVE, "noun-satou"), "satou-not-nurse", "Satou is not a nurse.", "Satou non è infermiere.", "Applies the negative copula to a reviewed role.", "Applica la copula negativa a un ruolo ripassato.", "noun-present-negative"),
    ex(predicateTarget("noun", "noun-bengoshi", "affirmative", NOUN_AFFIRMATIVE, "noun-suzuki"), "suzuki-lawyer", "Suzuki is a lawyer.", "Suzuki è un avvocato.", "Closes with a clear affirmative contrast.", "Chiude con un chiaro contrasto affermativo.", "noun-present-affirmative"),
  ],
  activities: [
    act(task11Cue(L("noun-yuki-san")), predicateTarget("noun", "noun-kaishain", "affirmative", NOUN_AFFIRMATIVE, "noun-yuki-san"), predicateTarget("noun", "noun-kaishain", "negative", NOUN_NEGATIVE, "noun-yuki-san"), 0, "copula-adjectives-1", 1, NOUN_AFFIRMATIVE, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-yuki-company-employee", referentId: "noun-yuki-san" }),
    act(task11Cue(L("noun-mari")), predicateTarget("noun", "noun-kenkyuusha", "negative", NOUN_NEGATIVE, "noun-mari"), predicateTarget("noun", "noun-kenkyuusha", "affirmative", NOUN_AFFIRMATIVE, "noun-mari"), 1, "copula-adjectives-1", 2, NOUN_NEGATIVE, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-mari-not-researcher", referentId: "noun-mari" }),
    act(task11Cue(L("noun-satou")), predicateTarget("noun", "noun-ryourinin", "affirmative", NOUN_AFFIRMATIVE, "noun-satou"), { ...predicateTarget("noun", "noun-ryourinin", "affirmative", NOUN_AFFIRMATIVE, "noun-satou"), parts: [predicatePart("noun", "noun-ryourinin", "affirmative"), L("noun-satou"), P("topic-wa", "topic", "noun-satou")] }, 0, "copula-adjectives-1", 3, NOUN_AFFIRMATIVE, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", worldFactId: "fact-satou-cook", referentId: "noun-satou" }),
    act(task11Cue(L("noun-suzuki")), predicateTarget("noun", "noun-kaishain", "negative", NOUN_NEGATIVE, "noun-suzuki"), predicateTarget("noun", "noun-kaishain", "affirmative", NOUN_AFFIRMATIVE, "noun-suzuki"), 1, "copula-adjectives-1", 4, NOUN_NEGATIVE, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-suzuki-not-company-employee", referentId: "noun-suzuki" }),
    act(task11Cue(L("noun-yamada")), predicateTarget("noun", "noun-ryourinin", "affirmative", NOUN_AFFIRMATIVE, "noun-yamada"), predicateTarget("noun", "noun-ryourinin", "negative", NOUN_NEGATIVE, "noun-yamada"), 0, "copula-adjectives-1", 5, NOUN_AFFIRMATIVE, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-yamada-cook-updated", referentId: "noun-yamada" }),
    act(promptOf(predicateTarget("noun", "noun-ryourinin", "affirmative", NOUN_AFFIRMATIVE, "noun-yuki-san")), predicateTarget("noun", "noun-ryourinin", "negative", NOUN_NEGATIVE, "noun-yuki-san"), predicateTarget("noun", "noun-ryourinin", "affirmative", NOUN_AFFIRMATIVE, "noun-yuki-san"), 1, "copula-adjectives-1", 6, NOUN_NEGATIVE, BASE_ERROR_ACTIVITY_SHAPE, "noun-predicate-polarity-mismatch", { contrastAxis: "tense-polarity", errorDefectAxis: "polarity", changedTokenSourceIds: ["desu", "dewa-arimasen"], worldFactId: "fact-yuki-not-cook", referentId: "noun-yuki-san" }),
    act(task11Cue(L("noun-tomodachi")), predicateTarget("noun", "noun-kaishain", "negative", NOUN_NEGATIVE, "noun-tomodachi"), predicateTarget("noun", "noun-kaishain", "affirmative", NOUN_AFFIRMATIVE, "noun-tomodachi"), 0, "copula-adjectives-1", 7, NOUN_NEGATIVE, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-friend-not-company-employee", referentId: "noun-tomodachi" }),
    act(task11Cue(L("noun-watashi")), predicateTarget("noun", "noun-ryourinin", "affirmative", NOUN_AFFIRMATIVE, "noun-watashi"), predicateTarget("noun", "noun-kaishain", "affirmative", NOUN_AFFIRMATIVE, "noun-watashi"), 1, "copula-adjectives-1", 8, NOUN_AFFIRMATIVE, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null, worldFactId: "fact-speaker-cook", referentId: "noun-watashi" }),
    act(task11Cue(L("noun-tanaka")), predicateTarget("noun", "noun-ryourinin", "negative", NOUN_NEGATIVE, "noun-tanaka"), predicateTarget("noun", "noun-ryourinin", "affirmative", NOUN_AFFIRMATIVE, "noun-tanaka"), 0, "copula-adjectives-1", 9, NOUN_NEGATIVE, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-audio-tanaka-not-cook", referentId: "noun-tanaka" }),
    act(task11Cue(L("noun-satou")), predicateTarget("noun", "noun-kaishain", "negative", NOUN_NEGATIVE, "noun-satou"), predicateTarget("noun", "noun-kenkyuusha", "affirmative", NOUN_AFFIRMATIVE, "noun-tanaka"), 1, "copula-adjectives-1", 10, NOUN_NEGATIVE, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-hidden-satou-not-company-employee", referentId: "noun-satou" }),
  ],
  dialogue: null,
};

const L2: BaseTask11LessonSpec = {
  lessonId: "copula-adjectives-2",
  contract: "system",
  prerequisiteLessonIds: ["copula-adjectives-1"],
  newLexemeIds: ["noun-enjinia", "noun-ginkouin", "noun-koumuin"],
  reviewLexemeIds: [
    "noun-kaishain",
    "noun-kenkyuusha",
    "noun-ryourinin",
    "noun-gakusei",
    "noun-sensei",
    "noun-watashi",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
    "noun-yuki-san",
  ],
  introducedConceptIds: [
    "remaining-copula-cells",
    "base-form-noun-predicate-past-affirmative",
    "base-form-noun-predicate-past-negative",
  ],
  reviewedConceptIds: [
    "affirmative-desu",
    "negative-noun-predicate-copula",
    "base-form-noun-predicate-negative",
  ],
  patternCellIds: [
    NOUN_AFFIRMATIVE,
    NOUN_NEGATIVE,
    NOUN_PAST_AFFIRMATIVE,
    NOUN_PAST_NEGATIVE,
  ],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "tense-polarity",
    "reference-adjective-grid",
  ],
  examples: [
    ex(predicateTarget("noun", "noun-enjinia", "affirmative", NOUN_AFFIRMATIVE, "noun-tanaka"), "tanaka-engineer-now", "Tanaka is an engineer.", "Tanaka è un ingegnere.", "Shows the nonpast affirmative cell.", "Mostra la cella non-passata affermativa.", "noun-present-affirmative"),
    ex(predicateTarget("noun", "noun-enjinia", "negative", NOUN_NEGATIVE, "noun-yamada"), "yamada-not-engineer-now", "Yamada is not an engineer.", "Yamada non è un ingegnere.", "Shows the nonpast negative cell.", "Mostra la cella non-passata negativa.", "noun-present-negative"),
    ex(predicateTarget("noun", "noun-enjinia", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-satou"), "satou-engineer-before", "Satou was an engineer.", "Satou era un ingegnere.", "Introduces the past affirmative noun predicate.", "Introduce il predicato nominale passato affermativo.", "noun-past-affirmative"),
    ex(predicateTarget("noun", "noun-enjinia", "pastNegative", NOUN_PAST_NEGATIVE, "noun-suzuki"), "suzuki-not-engineer-before", "Suzuki was not an engineer.", "Suzuki non era un ingegnere.", "Introduces the past negative noun predicate.", "Introduce il predicato nominale passato negativo.", "noun-past-negative"),
    ex(predicateTarget("noun", "noun-ginkouin", "affirmative", NOUN_AFFIRMATIVE, "noun-mari"), "mari-bank-worker-now", "Mari is a bank employee.", "Mari è un'impiegata di banca.", "Applies the first grid cell to a new role.", "Applica la prima cella a un nuovo ruolo.", "noun-present-affirmative"),
    ex(predicateTarget("noun", "noun-ginkouin", "negative", NOUN_NEGATIVE, "noun-yuki-san"), "yuki-not-bank-worker", "Yuki is not a bank employee.", "Yuki non è un'impiegata di banca.", "Applies the second grid cell.", "Applica la seconda cella.", "noun-present-negative"),
    ex(predicateTarget("noun", "noun-ginkouin", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-watashi"), "speaker-bank-worker-before", "I was a bank employee.", "Ero un impiegato di banca.", "Applies the past affirmative cell.", "Applica la cella passata affermativa.", "noun-past-affirmative"),
    ex(predicateTarget("noun", "noun-koumuin", "pastNegative", NOUN_PAST_NEGATIVE, "noun-tanaka"), "tanaka-not-civil-servant-before", "Tanaka was not a civil servant.", "Tanaka non era un dipendente pubblico.", "Applies the full past-negative ending.", "Applica l'intera terminazione passata negativa.", "noun-past-negative"),
    ex(predicateTarget("noun", "noun-koumuin", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-yamada"), "yamada-civil-servant-before", "Yamada was a civil servant.", "Yamada era un dipendente pubblico.", "Contrasts past affirmative and past negative.", "Contrappone passato affermativo e negativo.", "noun-past-affirmative"),
    ex(predicateTarget("noun", "noun-koumuin", "negative", NOUN_NEGATIVE, "noun-satou"), "satou-not-civil-servant-now", "Satou is not a civil servant.", "Satou non è un dipendente pubblico.", "Returns to nonpast negative without changing the noun.", "Ritorna al non-passato negativo senza cambiare nome.", "noun-present-negative"),
  ],
  activities: [
    act(task11Cue(L("noun-tomodachi")), predicateTarget("noun", "noun-enjinia", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-tomodachi"), predicateTarget("noun", "noun-enjinia", "pastNegative", NOUN_PAST_NEGATIVE, "noun-tomodachi"), 0, "copula-adjectives-2", 1, NOUN_PAST_AFFIRMATIVE, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-friend-former-engineer", referentId: "noun-tomodachi" }),
    act(task11Cue(L("noun-mari")), predicateTarget("noun", "noun-ginkouin", "pastNegative", NOUN_PAST_NEGATIVE, "noun-mari"), predicateTarget("noun", "noun-ginkouin", "negative", NOUN_NEGATIVE, "noun-mari"), 1, "copula-adjectives-2", 2, NOUN_PAST_NEGATIVE, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-mari-not-bank-worker-before", referentId: "noun-mari" }),
    act(task11Cue(L("noun-yuki-san")), predicateTarget("noun", "noun-koumuin", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-yuki-san"), { ...predicateTarget("noun", "noun-koumuin", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-yuki-san"), parts: [predicatePart("noun", "noun-koumuin", "pastAffirmative"), L("noun-yuki-san"), P("topic-wa", "topic", "noun-yuki-san")] }, 1, "copula-adjectives-2", 3, NOUN_PAST_AFFIRMATIVE, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", worldFactId: "fact-yuki-former-civil-servant", referentId: "noun-yuki-san" }),
    act(task11Cue(L("noun-watashi")), predicateTarget("noun", "noun-enjinia", "pastNegative", NOUN_PAST_NEGATIVE, "noun-watashi"), predicateTarget("noun", "noun-enjinia", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-watashi"), 0, "copula-adjectives-2", 4, NOUN_PAST_NEGATIVE, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-speaker-not-former-engineer", referentId: "noun-watashi" }),
    act(task11Cue(L("noun-tomodachi")), predicateTarget("noun", "noun-ginkouin", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-tomodachi"), predicateTarget("noun", "noun-ginkouin", "affirmative", NOUN_AFFIRMATIVE, "noun-tomodachi"), 1, "copula-adjectives-2", 5, NOUN_PAST_AFFIRMATIVE, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-friend-former-bank-worker", referentId: "noun-tomodachi" }),
    act(promptOf(predicateTarget("noun", "noun-koumuin", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-sensei")), predicateTarget("noun", "noun-koumuin", "pastNegative", NOUN_PAST_NEGATIVE, "noun-sensei"), predicateTarget("noun", "noun-koumuin", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-sensei"), 1, "copula-adjectives-2", 6, NOUN_PAST_NEGATIVE, BASE_ERROR_ACTIVITY_SHAPE, "noun-predicate-past-polarity-mismatch", { contrastAxis: "tense-polarity", errorDefectAxis: "polarity", changedTokenSourceIds: ["deshita", "dewa-arimasen-deshita"], worldFactId: "fact-teacher-not-former-civil-servant", referentId: "noun-sensei" }),
    act(task11Cue(L("noun-gakusei")), predicateTarget("noun", "noun-enjinia", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-gakusei"), predicateTarget("noun", "noun-enjinia", "pastNegative", NOUN_PAST_NEGATIVE, "noun-gakusei"), 0, "copula-adjectives-2", 7, NOUN_PAST_AFFIRMATIVE, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-student-former-engineer", referentId: "noun-gakusei" }),
    act(task11Cue(L("noun-kaishain")), predicateTarget("noun", "noun-koumuin", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-kaishain"), predicateTarget("noun", "noun-enjinia", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-kaishain"), 0, "copula-adjectives-2", 8, NOUN_PAST_AFFIRMATIVE, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null, worldFactId: "fact-company-worker-former-civil-servant", referentId: "noun-kaishain" }),
    act(task11Cue(L("noun-kenkyuusha")), predicateTarget("noun", "noun-koumuin", "pastAffirmative", NOUN_PAST_AFFIRMATIVE, "noun-kenkyuusha"), predicateTarget("noun", "noun-koumuin", "pastNegative", NOUN_PAST_NEGATIVE, "noun-kenkyuusha"), 1, "copula-adjectives-2", 9, NOUN_PAST_AFFIRMATIVE, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-audio-researcher-former-civil-servant", referentId: "noun-kenkyuusha" }),
    act(task11Cue(L("noun-ryourinin")), predicateTarget("noun", "noun-enjinia", "pastNegative", NOUN_PAST_NEGATIVE, "noun-ryourinin"), predicateTarget("noun", "noun-ginkouin", "affirmative", NOUN_AFFIRMATIVE, "noun-tanaka"), 1, "copula-adjectives-2", 10, NOUN_PAST_NEGATIVE, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-hidden-cook-not-former-engineer", referentId: "noun-ryourinin" }),
  ],
  dialogue: null,
};

const L3: BaseTask11LessonSpec = {
  lessonId: "copula-adjectives-3",
  contract: "system",
  prerequisiteLessonIds: ["copula-adjectives-2"],
  newLexemeIds: ["adjective-oishii", "adjective-takai", "adjective-ii"],
  reviewLexemeIds: [
    "noun-gohan",
    "noun-kudamono",
    "noun-mizu",
    "anchor-hon",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
    "noun-yuki-san",
  ],
  introducedConceptIds: [
    "i-adjective-class",
    "i-adjective-tense-polarity",
    "base-form-i-adjective-affirmative",
    "base-form-i-adjective-negative",
    "base-form-i-adjective-past-affirmative",
    "base-form-i-adjective-past-negative",
  ],
  reviewedConceptIds: [
    "remaining-copula-cells",
    "modifier-before-noun",
    "topic-wa",
  ],
  patternCellIds: [
    I_AFFIRMATIVE,
    I_NEGATIVE,
    I_PAST_AFFIRMATIVE,
    I_PAST_NEGATIVE,
    I_ATTRIBUTIVE,
  ],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "tense-polarity",
    "reference-adjective-grid",
  ],
  examples: [
    ex(predicateTarget("i-adjective", "adjective-oishii", "affirmative", I_AFFIRMATIVE, "noun-gohan"), "rice-tasty-now", "The rice is tasty.", "Il riso è gustoso.", "Shows an い-adjective predicate with polite です.", "Mostra un predicato in い con です cortese.", "i-present-affirmative"),
    ex(predicateTarget("i-adjective", "adjective-oishii", "negative", I_NEGATIVE, "noun-kudamono"), "fruit-not-tasty-now", "The fruit is not tasty.", "La frutta non è gustosa.", "The adjective itself forms the negative.", "L'aggettivo forma da sé il negativo.", "i-present-negative"),
    ex(predicateTarget("i-adjective", "adjective-oishii", "pastAffirmative", I_PAST_AFFIRMATIVE, "noun-mizu"), "water-was-tasty", "The water tasted good.", "L'acqua era buona.", "Shows the self-conjugated past affirmative.", "Mostra il passato affermativo autoconjugato.", "i-past-affirmative"),
    ex(predicateTarget("i-adjective", "adjective-oishii", "pastNegative", I_PAST_NEGATIVE, "noun-hirugohan"), "lunch-was-not-tasty", "Lunch was not tasty.", "Il pranzo non era gustoso.", "Shows the full past-negative adjective ending.", "Mostra l'intera terminazione aggettivale passata negativa.", "i-past-negative"),
    ex(predicateTarget("i-adjective", "adjective-takai", "affirmative", I_AFFIRMATIVE, "noun-kasa"), "umbrella-expensive", "The umbrella is expensive.", "L'ombrello è costoso.", "Keeps です as politeness, never plain だ.", "Mantiene です come cortesia, mai だ piano.", "i-present-affirmative"),
    ex(predicateTarget("i-adjective", "adjective-takai", "negative", I_NEGATIVE, "noun-jitensha"), "bicycle-not-expensive", "The bicycle is not expensive.", "La bicicletta non è costosa.", "Changes only adjective polarity.", "Cambia soltanto la polarità dell'aggettivo.", "i-present-negative"),
    ex(predicateTarget("i-adjective", "adjective-ii", "pastAffirmative", I_PAST_AFFIRMATIVE, "noun-mise"), "shop-was-good", "The shop was good.", "Il negozio era buono.", "Uses the stored irregular stem for いい.", "Usa il tema irregolare registrato di いい.", "i-past-affirmative"),
    ex(predicateTarget("i-adjective", "adjective-ii", "pastNegative", I_PAST_NEGATIVE, "noun-shokudou"), "cafeteria-was-not-good", "The cafeteria was not good.", "La mensa non era buona.", "Completes the irregular いい grid.", "Completa la griglia irregolare di いい.", "i-past-negative"),
    ex(modifierTarget("i-adjective", "adjective-oishii", "noun-gohan", I_ATTRIBUTIVE), "tasty-rice", "It is tasty rice.", "È riso gustoso.", "Uses an い-adjective directly before a noun.", "Usa un aggettivo in い direttamente prima del nome.", "i-attributive"),
    ex(modifierTarget("i-adjective", "adjective-takai", "noun-jitensha", I_ATTRIBUTIVE), "expensive-bicycle", "It is an expensive bicycle.", "È una bicicletta costosa.", "Contrasts attributive use with predicative politeness.", "Contrappone uso attributivo e cortesia predicativa.", "i-attributive"),
  ],
  activities: [
    act(task11Cue(L("noun-mizu")), predicateTarget("i-adjective", "adjective-oishii", "affirmative", I_AFFIRMATIVE, "noun-mizu"), predicateTarget("i-adjective", "adjective-oishii", "negative", I_NEGATIVE, "noun-mizu"), 0, "copula-adjectives-3", 1, I_AFFIRMATIVE, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-water-tasty", referentId: "noun-mizu" }),
    act(task11Cue(L("noun-gohan")), predicateTarget("i-adjective", "adjective-takai", "negative", I_NEGATIVE, "noun-gohan"), predicateTarget("i-adjective", "adjective-takai", "affirmative", I_AFFIRMATIVE, "noun-gohan"), 1, "copula-adjectives-3", 2, I_NEGATIVE, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-rice-not-expensive", referentId: "noun-gohan" }),
    act(task11Cue(L("noun-toshokan")), predicateTarget("i-adjective", "adjective-ii", "pastAffirmative", I_PAST_AFFIRMATIVE, "noun-toshokan"), { ...predicateTarget("i-adjective", "adjective-ii", "pastAffirmative", I_PAST_AFFIRMATIVE, "noun-toshokan"), parts: [predicatePart("i-adjective", "adjective-ii", "pastAffirmative"), L("noun-toshokan"), P("topic-wa", "topic", "noun-toshokan")] }, 0, "copula-adjectives-3", 3, I_PAST_AFFIRMATIVE, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", worldFactId: "fact-library-good-before", referentId: "noun-toshokan" }),
    act(task11Cue(L("noun-gohan")), predicateTarget("i-adjective", "adjective-oishii", "pastNegative", I_PAST_NEGATIVE, "noun-gohan"), predicateTarget("i-adjective", "adjective-oishii", "pastAffirmative", I_PAST_AFFIRMATIVE, "noun-gohan"), 1, "copula-adjectives-3", 4, I_PAST_NEGATIVE, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-rice-not-tasty-before", referentId: "noun-gohan" }),
    act(task11Cue(L("noun-jitensha")), predicateTarget("i-adjective", "adjective-takai", "pastAffirmative", I_PAST_AFFIRMATIVE, "noun-jitensha"), predicateTarget("i-adjective", "adjective-takai", "affirmative", I_AFFIRMATIVE, "noun-jitensha"), 0, "copula-adjectives-3", 5, I_PAST_AFFIRMATIVE, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-bicycle-expensive-before", referentId: "noun-jitensha" }),
    act(task11Target([L("noun-mise"), P("topic-wa", "topic", "noun-mise"), task11DiagnosticForm("adjective-takai", "たかいだ", "takai da", "i-adjective-copula-da")], { conceptIds: ["i-adjective-class"], patternCellIds: [], semanticRoleIds: ["topic"], interpretationTags: ["present-state"], predicateSenseId: "i-adjective-predicate", predicateLexemeId: "adjective-takai", predicateAspect: "adjectival" }), predicateTarget("i-adjective", "adjective-takai", "affirmative", I_AFFIRMATIVE, "noun-mise"), predicateTarget("i-adjective", "adjective-takai", "negative", I_NEGATIVE, "noun-mise"), 0, "copula-adjectives-3", 6, I_AFFIRMATIVE, BASE_ERROR_ACTIVITY_SHAPE, "i-adjective-copula-da", { contrastAxis: "tense-polarity", errorDefectAxis: "form", changedTokenSourceIds: ["i-adjective-copula-da", "adjective-takai", "desu"], worldFactId: "fact-shop-expensive", referentId: "noun-mise" }),
    act(task11Cue(L("noun-shokudou")), predicateTarget("i-adjective", "adjective-ii", "negative", I_NEGATIVE, "noun-shokudou"), predicateTarget("i-adjective", "adjective-ii", "affirmative", I_AFFIRMATIVE, "noun-shokudou"), 1, "copula-adjectives-3", 7, I_NEGATIVE, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-cafeteria-not-good", referentId: "noun-shokudou" }),
    act(task11Cue(L("noun-kudamono")), modifierTarget("i-adjective", "adjective-oishii", "noun-kudamono", I_ATTRIBUTIVE), modifierTarget("i-adjective", "adjective-takai", "noun-hirugohan", I_ATTRIBUTIVE), 0, "copula-adjectives-3", 8, I_ATTRIBUTIVE, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null, worldFactId: "fact-fruit-tasty", referentId: "noun-kudamono" }),
    act(task11Cue(L("noun-enpitsu")), predicateTarget("i-adjective", "adjective-takai", "pastNegative", I_PAST_NEGATIVE, "noun-enpitsu"), predicateTarget("i-adjective", "adjective-takai", "pastAffirmative", I_PAST_AFFIRMATIVE, "noun-enpitsu"), 1, "copula-adjectives-3", 9, I_PAST_NEGATIVE, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-audio-pencil-not-expensive-before", referentId: "noun-enpitsu" }),
    act(task11Cue(L("noun-zasshi")), predicateTarget("i-adjective", "adjective-ii", "pastNegative", I_PAST_NEGATIVE, "noun-zasshi"), predicateTarget("i-adjective", "adjective-oishii", "affirmative", I_AFFIRMATIVE, "noun-mizu"), 1, "copula-adjectives-3", 10, I_PAST_NEGATIVE, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-hidden-magazine-not-good-before", referentId: "noun-zasshi" }),
  ],
  dialogue: null,
};

const L4: BaseTask11LessonSpec = {
  lessonId: "copula-adjectives-4",
  contract: "system",
  prerequisiteLessonIds: ["copula-adjectives-3"],
  newLexemeIds: [
    "adjective-shizuka",
    "adjective-kirei",
    "adjective-yuumei",
    "adjective-genki",
  ],
  reviewLexemeIds: [
    "adjective-oishii",
    "adjective-takai",
    "adjective-ii",
    "noun-jimusho",
    "noun-mise",
    "noun-kouen",
    "noun-gohan",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
    "noun-watashi",
  ],
  introducedConceptIds: [
    "na-adjective-class",
    "na-adjective-predicate-and-attributive",
    "base-form-na-adjective-affirmative",
    "base-form-na-adjective-negative",
    "base-form-na-adjective-past-affirmative",
    "base-form-na-adjective-past-negative",
    "base-form-na-adjective-attributive",
  ],
  reviewedConceptIds: [
    "i-adjective-class",
    "i-adjective-tense-polarity",
    "modifier-before-noun",
    "remaining-copula-cells",
  ],
  patternCellIds: [
    NA_AFFIRMATIVE,
    NA_NEGATIVE,
    NA_PAST_AFFIRMATIVE,
    NA_PAST_NEGATIVE,
    NA_ATTRIBUTIVE,
  ],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "tense-polarity",
    "reference-adjective-grid",
  ],
  examples: [
    ex(predicateTarget("na-adjective", "adjective-shizuka", "affirmative", NA_AFFIRMATIVE, "noun-jimusho"), "office-quiet", "The office is quiet.", "L'ufficio è tranquillo.", "Shows that predicative な-adjectives require the copula.", "Mostra che gli aggettivi in な predicativi richiedono la copula.", "na-present-affirmative"),
    ex(predicateTarget("na-adjective", "adjective-shizuka", "negative", NA_NEGATIVE, "noun-mise"), "shop-not-quiet", "The shop is not quiet.", "Il negozio non è tranquillo.", "Uses the nominal-type negative copula path.", "Usa il percorso negativo della copula nominale.", "na-present-negative"),
    ex(predicateTarget("na-adjective", "adjective-kirei", "pastAffirmative", NA_PAST_AFFIRMATIVE, "noun-kouen"), "park-was-pretty", "The park was pretty.", "Il parco era bello.", "Uses the past affirmative copula.", "Usa la copula passata affermativa.", "na-past-affirmative"),
    ex(predicateTarget("na-adjective", "adjective-kirei", "pastNegative", NA_PAST_NEGATIVE, "noun-jimusho"), "office-was-not-clean", "The office was not clean.", "L'ufficio non era pulito.", "Uses the complete past-negative copula.", "Usa la copula passata negativa completa.", "na-past-negative"),
    ex(predicateTarget("na-adjective", "adjective-yuumei", "affirmative", NA_AFFIRMATIVE, "noun-satou"), "satou-famous", "Satou is famous.", "Satou è famoso.", "Keeps the nominal-type predicate bounded.", "Mantiene delimitato il predicato di tipo nominale.", "na-present-affirmative"),
    ex(predicateTarget("na-adjective", "adjective-genki", "negative", NA_NEGATIVE, "noun-watashi"), "speaker-not-well", "I am not well.", "Non sto bene.", "Applies the same nominal-type copula path to a one-place description.", "Applica lo stesso percorso copulare nominale a una descrizione con un solo argomento.", "na-present-negative"),
    ex(modifierTarget("na-adjective", "adjective-shizuka", "noun-jimusho", NA_ATTRIBUTIVE), "quiet-office", "It is a quiet office.", "È un ufficio tranquillo.", "Requires な before the modified noun.", "Richiede な prima del nome modificato.", "na-attributive"),
    ex(modifierTarget("na-adjective", "adjective-kirei", "noun-gakusei", NA_ATTRIBUTIVE), "pretty-student", "It is a pretty student.", "È uno studente di bell'aspetto.", "Applies attributive な to another adjective.", "Applica il な attributivo a un altro aggettivo.", "na-attributive"),
    ex(predicateTarget("i-adjective", "adjective-ii", "affirmative", I_AFFIRMATIVE, "noun-kouen"), "contrast-good-park", "The park is nice.", "Il parco è bello.", "Keeps the い-adjective path distinct.", "Mantiene distinto il percorso degli aggettivi in い.", "i-present-affirmative"),
    ex(modifierTarget("i-adjective", "adjective-takai", "noun-kasa", I_ATTRIBUTIVE), "contrast-expensive-umbrella", "It is an expensive umbrella.", "È un ombrello costoso.", "Shows that an い-adjective never inserts な.", "Mostra che un aggettivo in い non inserisce mai な.", "i-attributive"),
  ],
  activities: [
    act(task11Cue(L("noun-mari")), predicateTarget("na-adjective", "adjective-shizuka", "affirmative", NA_AFFIRMATIVE, "noun-mari"), predicateTarget("na-adjective", "adjective-shizuka", "negative", NA_NEGATIVE, "noun-mari"), 0, "copula-adjectives-4", 1, NA_AFFIRMATIVE, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-mari-quiet", referentId: "noun-mari" }),
    act(task11Cue(L("noun-kasa")), predicateTarget("na-adjective", "adjective-kirei", "pastNegative", NA_PAST_NEGATIVE, "noun-kasa"), predicateTarget("na-adjective", "adjective-kirei", "pastAffirmative", NA_PAST_AFFIRMATIVE, "noun-kasa"), 1, "copula-adjectives-4", 2, NA_PAST_NEGATIVE, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-umbrella-not-clean-before", referentId: "noun-kasa" }),
    act(task11Cue(L("noun-watashi")), predicateTarget("na-adjective", "adjective-yuumei", "pastAffirmative", NA_PAST_AFFIRMATIVE, "noun-watashi"), { ...predicateTarget("na-adjective", "adjective-yuumei", "pastAffirmative", NA_PAST_AFFIRMATIVE, "noun-watashi"), parts: [predicatePart("na-adjective", "adjective-yuumei", "pastAffirmative"), L("noun-watashi"), P("topic-wa", "topic", "noun-watashi")] }, 0, "copula-adjectives-4", 3, NA_PAST_AFFIRMATIVE, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", worldFactId: "fact-speaker-famous-before", referentId: "noun-watashi" }),
    act(task11Cue(L("noun-tomodachi")), predicateTarget("na-adjective", "adjective-genki", "negative", NA_NEGATIVE, "noun-tomodachi"), predicateTarget("na-adjective", "adjective-genki", "affirmative", NA_AFFIRMATIVE, "noun-tomodachi"), 1, "copula-adjectives-4", 4, NA_NEGATIVE, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-friend-not-well", referentId: "noun-tomodachi" }),
    act(task11Cue(L("noun-kouen")), predicateTarget("na-adjective", "adjective-shizuka", "pastAffirmative", NA_PAST_AFFIRMATIVE, "noun-kouen"), predicateTarget("na-adjective", "adjective-shizuka", "affirmative", NA_AFFIRMATIVE, "noun-kouen"), 0, "copula-adjectives-4", 5, NA_PAST_AFFIRMATIVE, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-park-quiet-before", referentId: "noun-kouen" }),
    act(task11Target([L("adjective-shizuka"), predicatePart("noun", "noun-shokudou", "affirmative")], { conceptIds: ["na-adjective-predicate-and-attributive"], patternCellIds: [], semanticRoleIds: [], interpretationTags: ["present-state"], predicateSenseId: "modified-noun-predicate", predicateLexemeId: "noun-shokudou", predicateAspect: "nominal" }), modifierTarget("na-adjective", "adjective-shizuka", "noun-shokudou", NA_ATTRIBUTIVE), { ...modifierTarget("na-adjective", "adjective-shizuka", "noun-shokudou", NA_ATTRIBUTIVE), parts: [naAttributive("adjective-shizuka"), predicatePart("noun", "noun-shokudou", "negative")], patternCellIds: [NOUN_NEGATIVE], interpretationTags: ["present-state", "negative"] }, 0, "copula-adjectives-4", 6, NA_ATTRIBUTIVE, BASE_ERROR_ACTIVITY_SHAPE, "na-adjective-missing-na", { contrastAxis: "meaning", heldConstantPredicateLexemeId: "noun-shokudou", errorDefectAxis: "form", changedTokenSourceIds: ["na"], worldFactId: "fact-cafeteria-quiet", referentId: "noun-shokudou", preserveDistractorPatternCellIds: false }),
    act(task11Cue(L("noun-jimusho")), predicateTarget("na-adjective", "adjective-kirei", "affirmative", NA_AFFIRMATIVE, "noun-jimusho"), predicateTarget("na-adjective", "adjective-kirei", "negative", NA_NEGATIVE, "noun-jimusho"), 1, "copula-adjectives-4", 7, NA_AFFIRMATIVE, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-office-clean", referentId: "noun-jimusho" }),
    act(task11Cue(L("noun-mise")), modifierTarget("na-adjective", "adjective-shizuka", "noun-mise", NA_ATTRIBUTIVE), { ...modifierTarget("na-adjective", "adjective-kirei", "noun-mise", NA_ATTRIBUTIVE), predicateLexemeId: "noun-mise" }, 1, "copula-adjectives-4", 8, NA_ATTRIBUTIVE, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: "noun-mise", worldFactId: "fact-shop-quiet", referentId: "noun-mise" }),
    act(task11Cue(L("noun-mise")), predicateTarget("na-adjective", "adjective-shizuka", "pastNegative", NA_PAST_NEGATIVE, "noun-mise"), predicateTarget("na-adjective", "adjective-shizuka", "pastAffirmative", NA_PAST_AFFIRMATIVE, "noun-mise"), 0, "copula-adjectives-4", 9, NA_PAST_NEGATIVE, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-audio-shop-not-quiet-before", referentId: "noun-mise" }),
    act(task11Cue(L("noun-gakusei")), predicateTarget("na-adjective", "adjective-kirei", "affirmative", NA_AFFIRMATIVE, "noun-gakusei"), predicateTarget("na-adjective", "adjective-genki", "negative", NA_NEGATIVE, "noun-yamada"), 1, "copula-adjectives-4", 10, NA_AFFIRMATIVE, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "tense-polarity", worldFactId: "fact-hidden-student-pretty", referentId: "noun-gakusei" }),
  ],
  dialogue: null,
};

const SPECS = deepFreeze([L1, L2, L3, L4]);
const BUILT = SPECS.map(buildTask11Lesson);
const RAW_LESSONS = BUILT.map(({ lesson }) => lesson);

export const BASE_COPULA_ADJECTIVES_LESSONS: readonly (
  | BaseSystemLessonContent
  | BaseContentLessonContent
)[] = deepFreeze(RAW_LESSONS.map(({ content }) => content));

export const BASE_COPULA_ADJECTIVES_EXAMPLES: readonly BaseExample[] = deepFreeze(
  RAW_LESSONS.flatMap(({ examples }) => examples),
);

export const BASE_COPULA_ADJECTIVES_VALIDATION_CATALOGS: BaseValidationCatalogs =
  task11ValidationCatalogs(BASE_TIME_MOVEMENT_VALIDATION_CATALOGS, BUILT);

function predicateCellTokens(
  kind: BaseTask11PredicateKind,
  lexemeId: string,
  form: BasePredicateForm,
): readonly AssembledToken[] {
  const result =
    kind === "noun"
      ? realizeOwnedNounPredicate(lexemeId)
      : kind === "i-adjective"
        ? realizeIAdjectivePredicate(lexemeId)
        : realizeNaAdjectivePredicate(lexemeId);
  if (!result.ok) throw new Error(`Missing predicate grid for ${lexemeId}.`);
  return result.value[form].tokens;
}

const NA_ATTR = realizeNaAdjectiveAttributive("adjective-shizuka");
if (!NA_ATTR.ok) throw new Error("Missing canonical な-adjective attributive.");

export const BASE_COPULA_ADJECTIVES_PREDICATE_CELLS: readonly Readonly<{
  readonly lessonId: string;
  readonly id: string;
  readonly tokens: readonly AssembledToken[];
}>[] = deepFreeze([
  { lessonId: "copula-adjectives-1", id: NOUN_AFFIRMATIVE, tokens: predicateCellTokens("noun", "noun-gakusei", "affirmative") },
  { lessonId: "copula-adjectives-1", id: NOUN_NEGATIVE, tokens: predicateCellTokens("noun", "noun-gakusei", "negative") },
  { lessonId: "copula-adjectives-2", id: NOUN_PAST_AFFIRMATIVE, tokens: predicateCellTokens("noun", "noun-gakusei", "pastAffirmative") },
  { lessonId: "copula-adjectives-2", id: NOUN_PAST_NEGATIVE, tokens: predicateCellTokens("noun", "noun-gakusei", "pastNegative") },
  { lessonId: "copula-adjectives-3", id: I_AFFIRMATIVE, tokens: predicateCellTokens("i-adjective", "adjective-oishii", "affirmative") },
  { lessonId: "copula-adjectives-3", id: I_NEGATIVE, tokens: predicateCellTokens("i-adjective", "adjective-oishii", "negative") },
  { lessonId: "copula-adjectives-3", id: I_PAST_AFFIRMATIVE, tokens: predicateCellTokens("i-adjective", "adjective-oishii", "pastAffirmative") },
  { lessonId: "copula-adjectives-3", id: I_PAST_NEGATIVE, tokens: predicateCellTokens("i-adjective", "adjective-oishii", "pastNegative") },
  { lessonId: "copula-adjectives-4", id: NA_AFFIRMATIVE, tokens: predicateCellTokens("na-adjective", "adjective-shizuka", "affirmative") },
  { lessonId: "copula-adjectives-4", id: NA_NEGATIVE, tokens: predicateCellTokens("na-adjective", "adjective-shizuka", "negative") },
  { lessonId: "copula-adjectives-4", id: NA_PAST_AFFIRMATIVE, tokens: predicateCellTokens("na-adjective", "adjective-shizuka", "pastAffirmative") },
  { lessonId: "copula-adjectives-4", id: NA_PAST_NEGATIVE, tokens: predicateCellTokens("na-adjective", "adjective-shizuka", "pastNegative") },
  { lessonId: "copula-adjectives-4", id: NA_ATTRIBUTIVE, tokens: NA_ATTR.value },
]);

const RAW_COPULA_ADJECTIVES_MODULE: BaseCopulaAdjectivesModule = {
  id: "copula-adjectives",
  lessons: RAW_LESSONS,
  sequence: [
    ...BASE_TIME_MOVEMENT_MODULE.sequence,
    ...BASE_COPULA_ADJECTIVES_LESSONS,
  ],
  worldFacts: { scope: "predicate-system" },
  worldFactIds: RAW_LESSONS.flatMap((lesson) =>
    lesson.activityDesigns.flatMap(({ worldFactId }) =>
      worldFactId ? [worldFactId] : [],
    ),
  ),
  worldFactLedger: worldFactLedgerFor(RAW_LESSONS),
};

const PREDICATE_FORM_BY_CELL: Readonly<Record<string, BasePredicateForm>> =
  deepFreeze({
    [NOUN_AFFIRMATIVE]: "affirmative",
    [NOUN_NEGATIVE]: "negative",
    [NOUN_PAST_AFFIRMATIVE]: "pastAffirmative",
    [NOUN_PAST_NEGATIVE]: "pastNegative",
    [I_AFFIRMATIVE]: "affirmative",
    [I_NEGATIVE]: "negative",
    [I_PAST_AFFIRMATIVE]: "pastAffirmative",
    [I_PAST_NEGATIVE]: "pastNegative",
    [NA_AFFIRMATIVE]: "affirmative",
    [NA_NEGATIVE]: "negative",
    [NA_PAST_AFFIRMATIVE]: "pastAffirmative",
    [NA_PAST_NEGATIVE]: "pastNegative",
  });

const PREDICATE_FORM_ID_BY_CELL: Readonly<Record<string, string>> = deepFreeze({
  [NOUN_AFFIRMATIVE]: "affirmative-desu",
  [NOUN_NEGATIVE]: "base-form-noun-predicate-negative",
  [NOUN_PAST_AFFIRMATIVE]: "base-form-noun-predicate-past-affirmative",
  [NOUN_PAST_NEGATIVE]: "base-form-noun-predicate-past-negative",
  [I_AFFIRMATIVE]: "base-form-i-adjective-affirmative",
  [I_NEGATIVE]: "base-form-i-adjective-negative",
  [I_PAST_AFFIRMATIVE]: "base-form-i-adjective-past-affirmative",
  [I_PAST_NEGATIVE]: "base-form-i-adjective-past-negative",
  [NA_AFFIRMATIVE]: "base-form-na-adjective-affirmative",
  [NA_NEGATIVE]: "base-form-na-adjective-negative",
  [NA_PAST_AFFIRMATIVE]: "base-form-na-adjective-past-affirmative",
  [NA_PAST_NEGATIVE]: "base-form-na-adjective-past-negative",
  [I_ATTRIBUTIVE]: "base-form-i-adjective-affirmative",
  [NA_ATTRIBUTIVE]: "base-form-na-adjective-attributive",
});

const PREDICATE_FORM_IDS = deepFreeze([
  ...new Set(Object.values(PREDICATE_FORM_ID_BY_CELL)),
]);

const PREDICATE_MORPHEME_SOURCE_IDS = deepFreeze([
  ...new Set(
    BASE_COPULA_ADJECTIVES_PREDICATE_CELLS.flatMap(({ tokens }) =>
      tokens
        .filter(({ kind }) => kind === "morpheme")
        .map(({ source }) => source.referenceId),
    ),
  ),
]);

function hasExactPredicateFormMetadata(
  target: BaseVisibleTarget,
  cellId: string,
): boolean {
  const requiredFormId = PREDICATE_FORM_ID_BY_CELL[cellId];
  if (!requiredFormId) return false;
  const expected =
    cellId === I_ATTRIBUTIVE || cellId === NA_ATTRIBUTIVE
      ? [requiredFormId, "affirmative-desu"].sort()
      : [requiredFormId];
  const actual = target.formIds
    .filter((id) => PREDICATE_FORM_IDS.includes(id))
    .sort();
  return (
    actual.length === expected.length &&
    actual.every((id, index) => id === expected[index])
  );
}

function hasPredicateTokenEvidence(target: BaseVisibleTarget): boolean {
  return (
    target.tokens.some(({ source }) =>
      PREDICATE_MORPHEME_SOURCE_IDS.includes(source.referenceId),
    ) ||
    target.lexemeIds.some(
      (id) => BASE_LEXICON.find((lexeme) => lexeme.id === id)?.category === "adjective",
    ) ||
    target.tokens.some(
      ({ source }) =>
        BASE_LEXICON.find((lexeme) => lexeme.id === source.referenceId)
          ?.category === "adjective",
    )
  );
}

function isDeclaredPredicateDiagnostic(
  entry: StrictTask11CorpusTarget,
): boolean {
  return (
    entry.source === "prompt" &&
    entry.operation === "diagnose-error" &&
    entry.target.tokens.some(
      ({ source }) => source.referenceId === "i-adjective-copula-da",
    )
  );
}

function hasCanonicalPredicateRealization(
  target: BaseVisibleTarget,
  allowFormIdDerivation: boolean,
  allowOrderPermutation: boolean,
): boolean {
  const cellIds = target.patternCellIds.filter(
    (id) =>
      id in PREDICATE_FORM_BY_CELL ||
      id === I_ATTRIBUTIVE ||
      id === NA_ATTRIBUTIVE,
  );
  if (cellIds.length > 1) return false;
  const cellId = cellIds[0];
  if (cellId && !hasExactPredicateFormMetadata(target, cellId)) return false;
  type Requirement =
    | Readonly<{
        kind: "noun" | "i-adjective" | "na-adjective";
        lexemeId: string;
        form: BasePredicateForm;
      }>
    | Readonly<{
        kind: "i-attributive" | "na-attributive";
        lexemeId: string;
      }>;
  const lexemeFor = (lexemeId: string | null) =>
    lexemeId
      ? BASE_LEXICON.find(({ id }) => id === lexemeId)
      : undefined;
  const adjectiveId = (kind: "i" | "na"): string | undefined =>
    target.lexemeIds.find((id) => {
      const lexeme = lexemeFor(id);
      return (
        lexeme?.category === "adjective" && lexeme.adjectiveClass === kind
      );
    });
  const predicate = lexemeFor(target.predicateLexemeId);
  const requirements: Requirement[] = [];
  const addFinite = (
    kind: Requirement["kind"],
    form: BasePredicateForm,
  ): void => {
    if (
      kind === "i-attributive" ||
      kind === "na-attributive" ||
      !target.predicateLexemeId
    ) {
      return;
    }
    requirements.push({
      kind,
      lexemeId: target.predicateLexemeId,
      form,
    });
  };
  const addNounFormId = (formId: string): void => {
    if (predicate?.category !== "noun") return;
    const formById: Readonly<Record<string, BasePredicateForm>> = {
      "affirmative-desu": "affirmative",
      "base-form-noun-predicate-negative": "negative",
      "base-form-noun-predicate-past-affirmative": "pastAffirmative",
      "base-form-noun-predicate-past-negative": "pastNegative",
    };
    const form = formById[formId];
    if (form) addFinite("noun", form);
  };
  const addRequirementsFromFormIds = (
    includeAdjectivePredicate: boolean,
  ): void => {
    for (const formId of target.formIds) {
      addNounFormId(formId);
      const predicateFormById: Readonly<
        Record<string, BasePredicateForm>
      > = {
        "base-form-i-adjective-affirmative": "affirmative",
        "base-form-i-adjective-negative": "negative",
        "base-form-i-adjective-past-affirmative": "pastAffirmative",
        "base-form-i-adjective-past-negative": "pastNegative",
        "base-form-na-adjective-affirmative": "affirmative",
        "base-form-na-adjective-negative": "negative",
        "base-form-na-adjective-past-affirmative": "pastAffirmative",
        "base-form-na-adjective-past-negative": "pastNegative",
      };
      const form = predicateFormById[formId];
      if (
        includeAdjectivePredicate &&
        form &&
        predicate?.category === "adjective"
      ) {
        addFinite(
          predicate.adjectiveClass === "i" ? "i-adjective" : "na-adjective",
          form,
        );
      }
      if (
        formId === "base-form-i-adjective-affirmative" &&
        predicate?.category === "noun"
      ) {
        const lexemeId = adjectiveId("i");
        if (lexemeId) requirements.push({ kind: "i-attributive", lexemeId });
      }
      if (formId === "base-form-na-adjective-attributive") {
        const lexemeId = adjectiveId("na");
        if (lexemeId) requirements.push({ kind: "na-attributive", lexemeId });
      }
    }
  };
  if (cellId === I_ATTRIBUTIVE || cellId === NA_ATTRIBUTIVE) {
    const kind = cellId === I_ATTRIBUTIVE ? "i" : "na";
    const lexemeId = adjectiveId(kind);
    if (!lexemeId) return false;
    requirements.push({
      kind: kind === "i" ? "i-attributive" : "na-attributive",
      lexemeId,
    });
    addRequirementsFromFormIds(false);
  } else if (cellId) {
    const form = PREDICATE_FORM_BY_CELL[cellId];
    if (!form) return false;
    addFinite(
      cellId.startsWith("noun-")
        ? "noun"
        : cellId.startsWith("i-adjective-")
          ? "i-adjective"
          : "na-adjective",
      form,
    );
  } else {
    const isModeledModifiedNounPredicate =
      target.predicateSenseId === "modified-noun-predicate" &&
      predicate?.category === "noun" &&
      target.formIds.includes("base-form-na-adjective-attributive") &&
      adjectiveId("na") !== undefined;
    if (isModeledModifiedNounPredicate) {
      addRequirementsFromFormIds(false);
    } else {
      if (!allowFormIdDerivation) return false;
      addRequirementsFromFormIds(true);
    }
  }
  const uniqueRequirements = [
    ...new Map(
      requirements.map((requirement) => [
        JSON.stringify(requirement),
        requirement,
      ]),
    ).values(),
  ];
  if (uniqueRequirements.length === 0) return false;
  const tokenMatches = (
    actual: AssembledToken,
    expected: AssembledToken,
    offset: number,
  ): boolean =>
    actual.jp === expected.jp &&
    actual.romaji === expected.romaji &&
    actual.kind === expected.kind &&
    (offset === 0 || actual.boundaryBefore === expected.boundaryBefore) &&
    actual.source.domain === expected.source.domain &&
    actual.source.referenceId === expected.source.referenceId;
  const uniqueStart = (
    expected: readonly AssembledToken[],
  ): number | undefined => {
    const starts = target.tokens.flatMap((_, start) =>
      expected.every((token, offset) => {
        const actual = target.tokens[start + offset];
        return actual !== undefined && tokenMatches(actual, token, offset);
      })
        ? [start]
        : [],
    );
    return starts.length === 1 ? starts[0] : undefined;
  };
  return uniqueRequirements.every((requirement) => {
    const attributive =
      requirement.kind === "i-attributive" ||
      requirement.kind === "na-attributive";
    let expected: readonly AssembledToken[];
    if (requirement.kind === "i-attributive") {
      const realized = realizeIAdjectiveAttributive(requirement.lexemeId);
      if (!realized.ok) return false;
      expected = realized.value;
    } else if (requirement.kind === "na-attributive") {
      const realized = realizeNaAdjectiveAttributive(requirement.lexemeId);
      if (!realized.ok) return false;
      expected = realized.value;
    } else {
      const form = "form" in requirement ? requirement.form : undefined;
      if (!form) return false;
      const realized =
        requirement.kind === "noun"
          ? realizeOwnedNounPredicate(requirement.lexemeId)
          : requirement.kind === "i-adjective"
            ? realizeIAdjectivePredicate(requirement.lexemeId)
            : realizeNaAdjectivePredicate(requirement.lexemeId);
      if (!realized.ok) return false;
      expected = realized.value[form].tokens;
    }
    const start = uniqueStart(expected);
    if (start === undefined) return false;
    const end = start + expected.length;
    if (attributive) {
      const modified = target.tokens[end];
      return (
        modified?.kind === "lexical" &&
        lexemeFor(modified.source.referenceId)?.category === "noun"
      );
    }
    if (
      !hasAuthoredClauseFinalSuffix(target, end) &&
      !allowOrderPermutation
    ) {
      return false;
    }
    if (!allowFormIdDerivation) return true;
    const generatedMorphemeIds = new Set(
      expected
        .filter(({ kind }) => kind !== "lexical")
        .map(({ source }) => source.referenceId),
    );
    return target.tokens.every(
      ({ kind, source }, index) =>
        (index >= start && index < end) ||
        kind === "lexical" ||
        !generatedMorphemeIds.has(source.referenceId),
    );
  });
}

export function validateBaseCopulaAdjectivesModule(
  value: unknown,
): Readonly<{
  readonly ok: boolean;
  readonly errors: readonly BaseTask11ModuleError[];
}> {
  const sanitized = task11PlainDataSnapshot(value);
  if (!sanitized) {
    return { ok: false, errors: ["invalid-module-shape"] };
  }
  const base = validateTask11ModuleBase(
    sanitized.value,
    "copula-adjectives",
    SPECS.map(({ lessonId }) => lessonId),
    BASE_COPULA_ADJECTIVES_VALIDATION_CATALOGS,
  );
  if (!base.ok) return base;
  const snapshot = strictTask11ModuleSnapshot(sanitized.value);
  const semanticInvariantHolds = snapshot?.corpusTargets.every((entry) => {
    const { source, target } = entry;
    const orderPermutation = isExactOrderChunkPermutation(
      entry,
      snapshot.corpusTargets,
    );
    const hasPredicateEvidence =
      hasPredicateTokenEvidence(target) ||
      target.patternCellIds.some((id) => id in PREDICATE_FORM_ID_BY_CELL) ||
      target.formIds.some((id) => PREDICATE_FORM_IDS.includes(id));
    return (
      !hasPredicateEvidence ||
      isDeclaredPredicateDiagnostic(entry) ||
      hasCanonicalPredicateRealization(
        target,
        source === "prompt" || orderPermutation,
        orderPermutation,
      )
    );
  });
  if (!semanticInvariantHolds) {
    return { ok: false, errors: ["invalid-lesson-shape"] };
  }
  return task11PlainDataEqual(
    sanitized.value,
    RAW_COPULA_ADJECTIVES_MODULE,
  )
    ? base
    : { ok: false, errors: ["invalid-module-shape"] };
}

export const module07ConceptIds = deepFreeze(
  SPECS.flatMap(({ introducedConceptIds }) => introducedConceptIds),
);

export const BASE_COPULA_ADJECTIVES_MODULE: BaseCopulaAdjectivesModule =
  deepFreeze(RAW_COPULA_ADJECTIVES_MODULE);

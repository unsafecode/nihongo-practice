import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  BaseContentLessonContent,
  BaseExample,
  BaseInterpretationTag,
  BasePredicateAspect,
  BaseSystemLessonContent,
  BaseValidationCatalogs,
  BaseVisibleTarget,
} from "../catalog/types";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  realizePoliteNonpast,
  realizeTeConstruction,
} from "../forms/verbForms";
import {
  findExactGeneratedTokenSpans,
  hasAuthoredClauseFinalSuffix,
  isExactOrderChunkPermutation,
  strictTask11ModuleSnapshot,
  validateTask11CorpusDistinctness,
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
  BASE_SENTENCE_FOUNDATIONS_MODULE,
} from "./module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_MODULE } from "./module03TopicQuestions";
import {
  BASE_POLITE_VERBS_MODULE,
  buildTask11Lesson,
  TASK11_COMMA,
  task11AnalysisLabel,
  task11Cue,
  task11DiagnosticForm,
  task11Lexeme,
  task11Particle,
  task11PlainDataEqual,
  task11PlainDataSnapshot,
  task11Target,
  task11ValidationCatalogs,
  task11VerbForm,
  validateTask11ModuleBase,
  type BaseTask11ActivitySpec,
  type BaseTask11ContrastAxis,
  type BaseTask11DialogueTurnSpec,
  type BaseTask11ExampleSpec,
  type BaseTask11Lesson,
  type BaseTask11LessonSpec,
  type BaseTask11ModuleError,
  type BaseTask11Part,
  type BaseTask11TargetSpec,
  type BaseTask11VerbFormKind,
} from "./module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_MODULE } from "./module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_MODULE } from "./module06TimeMovement";
import { BASE_COPULA_ADJECTIVES_MODULE } from "./module07CopulaAdjectives";
import {
  BASE_EXISTENCE_LOCATION_MODULE,
  BASE_EXISTENCE_LOCATION_VALIDATION_CATALOGS,
} from "./module08ExistenceLocation";

export interface BaseTeAllomorphEvidence {
  readonly endingFamily:
    | "う/つ/る"
    | "む/ぶ/ぬ"
    | "く"
    | "ぐ"
    | "す"
    | "ichidan"
    | "する"
    | "くる"
    | "いく-exception";
  readonly lemmaId: string;
  readonly surface: string;
  readonly exception: boolean;
  readonly verbClass: "godan" | "ichidan" | "suru" | "kuru";
  readonly tokens: readonly AssembledToken[];
}

export interface BaseTeAllomorphRule {
  readonly endingFamily: BaseTeAllomorphEvidence["endingFamily"];
  readonly sourceEndings: readonly string[];
  readonly replacement: string;
  readonly exceptionLemmaId: string | null;
}

export interface BaseRequestsConnectionModule {
  readonly id: "requests-connection";
  readonly lessons: readonly BaseTask11Lesson[];
  readonly sequence: readonly (
    | BaseSystemLessonContent
    | BaseContentLessonContent
  )[];
  readonly worldFacts: Readonly<{ readonly scope: "requests-connection" }>;
  readonly worldFactIds: readonly string[];
  readonly worldFactLedger: readonly BaseWorldFactRecord[];
}

const L = task11Lexeme;
const P = task11Particle;

const TE_SOURCE = "te-source-form";
const TE_TTE = "te-allomorph-tte";
const TE_NDE = "te-allomorph-nde";
const TE_ITE = "te-allomorph-ite";
const TE_IDE = "te-allomorph-ide";
const TE_SHITE = "te-allomorph-shite";
const TE_ICHIDAN = "te-allomorph-ichidan";
const TE_SURU = "te-allomorph-suru";
const TE_KURU = "te-allomorph-kuru";
const TE_EXCEPTION = "te-exception";
const REQUEST_CELL = "te-kudasai-request";
const REQUEST_RESPONSE_CELL = "request-response";
const SEQUENCE_CELL = "sequential-te-actions";
const SEQUENCE_FINAL_CELL = "sequential-final-polite";
const TE_IMASU_ONGOING_CELL = "te-imasu-ongoing-action";
const TE_IMASU_STATE_CELL = "te-imasu-current-state";
const TE_IMASU_NONPAST_CONTRAST_CELL = "te-imasu-vs-ordinary-nonpast";

function japanese(tokens: readonly AssembledToken[]): string {
  return tokens.map(({ jp }) => jp).join("");
}

export const BASE_TE_ALLOMORPH_RULES: readonly BaseTeAllomorphRule[] =
  deepFreeze([
    {
      endingFamily: "う/つ/る",
      sourceEndings: ["う", "つ", "る"],
      replacement: "って",
      exceptionLemmaId: null,
    },
    {
      endingFamily: "む/ぶ/ぬ",
      sourceEndings: ["む", "ぶ", "ぬ"],
      replacement: "んで",
      exceptionLemmaId: null,
    },
    {
      endingFamily: "く",
      sourceEndings: ["く"],
      replacement: "いて",
      exceptionLemmaId: null,
    },
    {
      endingFamily: "ぐ",
      sourceEndings: ["ぐ"],
      replacement: "いで",
      exceptionLemmaId: null,
    },
    {
      endingFamily: "す",
      sourceEndings: ["す"],
      replacement: "して",
      exceptionLemmaId: null,
    },
    {
      endingFamily: "ichidan",
      sourceEndings: ["る"],
      replacement: "て",
      exceptionLemmaId: null,
    },
    {
      endingFamily: "する",
      sourceEndings: ["する"],
      replacement: "して",
      exceptionLemmaId: null,
    },
    {
      endingFamily: "くる",
      sourceEndings: ["くる"],
      replacement: "きて",
      exceptionLemmaId: null,
    },
    {
      endingFamily: "いく-exception",
      sourceEndings: ["いく"],
      replacement: "いって",
      exceptionLemmaId: "verb-iku",
    },
  ]);

function authoredTeRuleFor(
  lemmaId: string,
): BaseTeAllomorphRule | undefined {
  const lexeme = BASE_LEXEME_BY_ID.get(lemmaId);
  if (lexeme?.category !== "verb") return undefined;
  const exception = BASE_TE_ALLOMORPH_RULES.find(
    ({ exceptionLemmaId }) => exceptionLemmaId === lemmaId,
  );
  if (exception) return exception;
  const family =
    lexeme.verbClass === "ichidan"
      ? "ichidan"
      : lexeme.verbClass === "suru"
        ? "する"
        : lexeme.verbClass === "kuru"
          ? "くる"
          : lexeme.kana.endsWith("う") ||
              lexeme.kana.endsWith("つ") ||
              lexeme.kana.endsWith("る")
            ? "う/つ/る"
            : lexeme.kana.endsWith("む") ||
                lexeme.kana.endsWith("ぶ") ||
                lexeme.kana.endsWith("ぬ")
              ? "む/ぶ/ぬ"
              : lexeme.kana.endsWith("く")
                ? "く"
                : lexeme.kana.endsWith("ぐ")
                  ? "ぐ"
                  : lexeme.kana.endsWith("す")
                    ? "す"
                    : null;
  return family
    ? BASE_TE_ALLOMORPH_RULES.find(
        ({ endingFamily }) => endingFamily === family,
      )
    : undefined;
}

function authoredTeSurface(lemmaId: string): string | undefined {
  const lexeme = BASE_LEXEME_BY_ID.get(lemmaId);
  const rule = authoredTeRuleFor(lemmaId);
  if (lexeme?.category !== "verb" || !rule) return undefined;
  const sourceEnding = [...rule.sourceEndings]
    .sort((left, right) => right.length - left.length)
    .find((ending) => lexeme.kana.endsWith(ending));
  return sourceEnding
    ? `${lexeme.kana.slice(0, -sourceEnding.length)}${rule.replacement}`
    : undefined;
}

function generatedTeEvidence(
  endingFamily: BaseTeAllomorphEvidence["endingFamily"],
  lemmaId: string,
  exception: boolean,
  verbClass: BaseTeAllomorphEvidence["verbClass"],
): BaseTeAllomorphEvidence {
  const realized = realizeTeConstruction(lemmaId, "te");
  if (!realized.ok) {
    throw new Error(`Missing canonical て form for ${lemmaId}.`);
  }
  const authoredSurface = authoredTeSurface(lemmaId);
  if (
    !authoredSurface ||
    japanese(realized.value) !== authoredSurface ||
    authoredTeRuleFor(lemmaId)?.endingFamily !== endingFamily
  ) {
    throw new Error(`て engine disagrees with the authored rule for ${lemmaId}.`);
  }
  return {
    endingFamily,
    lemmaId,
    surface: authoredSurface,
    exception,
    verbClass,
    tokens: realized.value,
  };
}

export const BASE_TE_ALLOMORPH_EVIDENCE: readonly BaseTeAllomorphEvidence[] =
  deepFreeze([
    generatedTeEvidence("う/つ/る", "verb-kau", false, "godan"),
    generatedTeEvidence("む/ぶ/ぬ", "verb-nomu", false, "godan"),
    generatedTeEvidence("く", "verb-kaku", false, "godan"),
    generatedTeEvidence("ぐ", "verb-oyogu", false, "godan"),
    generatedTeEvidence("す", "verb-hanasu", false, "godan"),
    generatedTeEvidence("ichidan", "verb-taberu", false, "ichidan"),
    generatedTeEvidence("する", "verb-suru", false, "suru"),
    generatedTeEvidence("くる", "verb-kuru", false, "kuru"),
    generatedTeEvidence("いく-exception", "verb-iku", true, "godan"),
  ]);

function predicateSense(lemmaId: string): string {
  return lemmaId.slice("verb-".length);
}

function lexicalPredicateAspect(
  lemmaId: string,
  interpretationTags: readonly BaseInterpretationTag[] = [],
): BasePredicateAspect {
  if (interpretationTags.includes("resulting-state")) return "stative";
  const lexeme = BASE_LEXEME_BY_ID.get(lemmaId);
  return lexeme?.category === "verb" && lexeme.aspect === "stative"
    ? "stative"
    : "dynamic";
}

function plainVerbTarget(
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  conceptIds: readonly string[],
  patternCellIds: readonly string[],
  interpretationTags: readonly BaseInterpretationTag[],
  prefix: readonly BaseTask11Part[] = [],
  semanticRoleIds: BaseTask11TargetSpec["semanticRoleIds"] = [],
  predicateAspect: BasePredicateAspect = lexicalPredicateAspect(
    lemmaId,
    interpretationTags,
  ),
): BaseTask11TargetSpec {
  return task11Target([...prefix, task11VerbForm(lemmaId, form)], {
    conceptIds,
    patternCellIds,
    semanticRoleIds,
    interpretationTags,
    predicateSenseId: predicateSense(lemmaId),
    predicateLexemeId: lemmaId,
    predicateAspect,
  });
}

function teTarget(
  lemmaId: string,
  cellId: string,
  form: "dictionary" | "te" = "te",
): BaseTask11TargetSpec {
  return plainVerbTarget(
    lemmaId,
    form,
    form === "te" ? ["base-form-te"] : ["dictionary-lemma"],
    [form === "te" ? cellId : TE_SOURCE],
    ["metalinguistic"],
  );
}

function teMappingTarget(
  lemmaId: string,
  cellId: string,
  reverse = false,
  includeSourceCell = true,
): BaseTask11TargetSpec {
  const source = task11VerbForm(lemmaId, "dictionary");
  const result = task11VerbForm(lemmaId, "te");
  return task11Target(
    reverse
      ? [result, TASK11_COMMA, source]
      : [source, TASK11_COMMA, result],
    {
      conceptIds: ["base-form-te"],
      patternCellIds: includeSourceCell ? [TE_SOURCE, cellId] : [cellId],
      semanticRoleIds: [],
      interpretationTags: ["metalinguistic"],
      predicateSenseId: predicateSense(lemmaId),
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
    },
  );
}

function goalVerbFormTarget(
  placeId: string,
  lemmaId: string,
  form: "polite-nonpast" | "te",
  cellId: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(placeId),
      P("goal-ni", "goal", placeId),
      task11VerbForm(lemmaId, form),
    ],
    {
      conceptIds: form === "te" ? ["base-form-te"] : [],
      patternCellIds: [form === "te" ? cellId : TE_SOURCE],
      semanticRoleIds: ["goal"],
      interpretationTags: [form === "te" ? "metalinguistic" : "future"],
      predicateSenseId: "come-goal",
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "come-goal",
        provided: { goal: "goal-ni" },
        attachmentLexemeIdByRole: { goal: placeId },
      },
    },
  );
}

function themeSense(lemmaId: string): string {
  if (lemmaId === "verb-taberu") return "eat";
  if (lemmaId === "verb-nomu") return "drink";
  if (lemmaId === "verb-miru") return "see";
  if (lemmaId === "verb-yomu") return "read";
  if (lemmaId === "verb-kaku") return "write";
  if (lemmaId === "verb-kau") return "buy";
  if (lemmaId === "verb-suru") return "do";
  return "theme-object-action";
}

function objectVerbTarget(
  objectId: string,
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  conceptIds: readonly string[],
  patternCellIds: readonly string[],
  interpretationTags: readonly BaseInterpretationTag[],
  prefix: readonly BaseTask11Part[] = [],
  finalParts: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  const sense = themeSense(lemmaId);
  const interactionPart = finalParts.find(
    (part) => part.kind === "particle" && part.role === "interaction",
  );
  const hasInteraction = interactionPart?.kind === "particle";
  const hasQuestion = finalParts.some(
    (part) => part.kind === "particle" && part.role === "question",
  );
  return task11Target(
    [
      ...prefix,
      L(objectId),
      P("object-o", "theme", objectId),
      task11VerbForm(lemmaId, form),
      ...finalParts,
    ],
    {
      conceptIds,
      patternCellIds,
      semanticRoleIds: [
        "theme",
        ...(hasInteraction ? (["interaction"] as const) : []),
        ...(hasQuestion ? (["question"] as const) : []),
      ],
      interpretationTags,
      predicateSenseId: sense,
      predicateLexemeId: lemmaId,
      predicateAspect: lexicalPredicateAspect(lemmaId, interpretationTags),
      particleFrame: {
        predicateSenseId: sense,
        provided: {
          theme: "object-o",
          ...(hasInteraction
            ? { interaction: interactionPart.sense }
            : {}),
          ...(hasQuestion ? { question: "question-ka" as const } : {}),
        },
        attachmentLexemeIdByRole: {
          theme: objectId,
          ...(hasInteraction ? { interaction: lemmaId } : {}),
          ...(hasQuestion ? { question: lemmaId } : {}),
        },
      },
    },
  );
}

function requestTarget(
  objectId: string,
  lemmaId: string,
  prefix: readonly BaseTask11Part[] = [],
  finalParts: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  return objectVerbTarget(
    objectId,
    lemmaId,
    "te-request",
    ["base-construction-te-kudasai"],
    [REQUEST_CELL],
    ["future"],
    prefix,
    finalParts,
  );
}

function responseThenActionTarget(
  responseId: "expression-iie" | "expression-wakarimashita",
  objectId: string,
  lemmaId: string,
): BaseTask11TargetSpec {
  const sense = themeSense(lemmaId);
  return task11Target(
    [
      L(responseId),
      TASK11_COMMA,
      L(objectId),
      P("object-o", "theme", objectId),
      task11VerbForm(lemmaId, "polite-nonpast"),
    ],
    {
      conceptIds: [],
      patternCellIds: [REQUEST_RESPONSE_CELL],
      semanticRoleIds: ["theme"],
      interpretationTags: ["future"],
      predicateSenseId: sense,
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: sense,
        provided: { theme: "object-o" },
        attachmentLexemeIdByRole: { theme: objectId },
      },
    },
  );
}

function expressionTarget(
  expressionId: string,
  patternCellIds: readonly string[] = [REQUEST_RESPONSE_CELL],
): BaseTask11TargetSpec {
  return task11Target([L(expressionId)], {
    conceptIds: [],
    patternCellIds,
    semanticRoleIds: [],
    interpretationTags: ["present-state"],
    predicateSenseId: null,
    predicateLexemeId: null,
    predicateAspect: "nominal",
  });
}

function softenedExpressionTarget(expressionId: string): BaseTask11TargetSpec {
  return task11Target(
    [L("expression-sumimasen"), TASK11_COMMA, L(expressionId)],
    {
      conceptIds: [],
      patternCellIds: [REQUEST_RESPONSE_CELL],
      semanticRoleIds: [],
      interpretationTags: ["present-state"],
      predicateSenseId: null,
      predicateLexemeId: null,
      predicateAspect: "nominal",
    },
  );
}

function acknowledgedResponseTarget(
  expressionId: "expression-douzo" | "expression-wakarimashita",
): BaseTask11TargetSpec {
  return task11Target(
    [L("expression-hai"), TASK11_COMMA, L(expressionId)],
    {
      conceptIds: [],
      patternCellIds: [REQUEST_RESPONSE_CELL],
      semanticRoleIds: [],
      interpretationTags: ["present-state"],
      predicateSenseId: null,
      predicateLexemeId: null,
      predicateAspect: "nominal",
    },
  );
}

function sequenceTarget(
  firstLemmaId: string,
  finalLemmaId: string,
  reverse = false,
  activityCellId?: typeof SEQUENCE_CELL | typeof SEQUENCE_FINAL_CELL,
): BaseTask11TargetSpec {
  return task11Target(
    reverse
      ? [
          task11VerbForm(finalLemmaId, "polite-nonpast"),
          TASK11_COMMA,
          task11VerbForm(firstLemmaId, "te-sequence"),
        ]
      : [
          task11VerbForm(firstLemmaId, "te-sequence"),
          TASK11_COMMA,
          task11VerbForm(finalLemmaId, "polite-nonpast"),
        ],
    {
      conceptIds: ["base-construction-sequential-te"],
      patternCellIds: activityCellId
        ? [activityCellId]
        : [SEQUENCE_CELL, SEQUENCE_FINAL_CELL],
      semanticRoleIds: [],
      interpretationTags: ["future"],
      predicateSenseId: predicateSense(finalLemmaId),
      predicateLexemeId: finalLemmaId,
      predicateAspect: "dynamic",
    },
  );
}

function teImasuTarget(
  lemmaId: string,
  interpretation: "ongoing-now" | "resulting-state",
  prefix: readonly BaseTask11Part[] = [],
  semanticRoleIds: BaseTask11TargetSpec["semanticRoleIds"] = [],
): BaseTask11TargetSpec {
  return plainVerbTarget(
    lemmaId,
    "te-imasu",
    ["base-construction-te-imasu"],
    [
      interpretation === "ongoing-now"
        ? TE_IMASU_ONGOING_CELL
        : TE_IMASU_STATE_CELL,
    ],
    [interpretation],
    prefix,
    semanticRoleIds,
  );
}

function anchoredTeImasuSubjectTarget(
  subjectId: string,
  lemmaId: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(subjectId),
      P("topic-wa", "topic", subjectId),
      L("noun-ima"),
      task11VerbForm(lemmaId, "te-imasu"),
    ],
    {
      conceptIds: [
        "base-construction-te-imasu",
        "relative-time-omission",
      ],
      patternCellIds: [TE_IMASU_ONGOING_CELL],
      semanticRoleIds: ["topic", "time"],
      interpretationTags: ["ongoing-now"],
      predicateSenseId: "current-action-topic",
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "current-action-topic",
        provided: { topic: "topic-wa" },
        attachmentLexemeIdByRole: { topic: subjectId },
      },
    },
  );
}

function anchoredObjectVerbTarget(
  subjectId: string | null,
  objectId: string,
  lemmaId: string,
  form: "polite-nonpast" | "te-imasu",
  interpretation: "future" | "habitual" | "ongoing-now" | "resulting-state",
  patternCellId: string,
  options: Readonly<{
    readonly includeNow?: boolean;
    readonly question?: boolean;
    readonly prefix?: readonly BaseTask11Part[];
  }> = {},
): BaseTask11TargetSpec {
  const sense = themeSense(lemmaId);
  const question = options.question === true;
  return task11Target(
    [
      ...(options.prefix ?? []),
      ...(subjectId
        ? [L(subjectId), P("topic-wa", "topic", subjectId)]
        : []),
      ...(options.includeNow ? [L("noun-ima")] : []),
      L(objectId),
      P("object-o", "theme", objectId),
      task11VerbForm(lemmaId, form),
      ...(question ? [P("question-ka", "question", lemmaId)] : []),
    ],
    {
      conceptIds: [
        ...(form === "te-imasu"
          ? ["base-construction-te-imasu"]
          : []),
        ...(options.includeNow ? ["relative-time-omission"] : []),
      ],
      patternCellIds: [patternCellId],
      semanticRoleIds: [
        ...(subjectId ? (["topic"] as const) : []),
        ...(options.includeNow ? (["time"] as const) : []),
        "theme",
        ...(question ? (["question"] as const) : []),
      ],
      interpretationTags: [interpretation],
      predicateSenseId: sense,
      predicateLexemeId: lemmaId,
      predicateAspect: lexicalPredicateAspect(lemmaId, [interpretation]),
      particleFrame: {
        predicateSenseId: sense,
        provided: {
          ...(subjectId ? { topic: "topic-wa" as const } : {}),
          theme: "object-o",
          ...(question ? { question: "question-ka" as const } : {}),
        },
        attachmentLexemeIdByRole: {
          ...(subjectId ? { topic: subjectId } : {}),
          theme: objectId,
          ...(question ? { question: lemmaId } : {}),
        },
      },
    },
  );
}

function seatedTarget(
  subjectId: string | null,
  form: "polite-nonpast" | "te-imasu",
  question = false,
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  const interpretation =
    form === "te-imasu" ? "resulting-state" : "future";
  return task11Target(
    [
      ...prefix,
      ...(subjectId
        ? [L(subjectId), P("topic-wa", "topic", subjectId)]
        : []),
      L("noun-isu"),
      P("goal-ni", "goal", "noun-isu"),
      task11VerbForm("verb-suwaru", form),
      ...(question
        ? [P("question-ka", "question", "verb-suwaru")]
        : []),
    ],
    {
      conceptIds:
        form === "te-imasu" ? ["base-construction-te-imasu"] : [],
      patternCellIds: [
        form === "te-imasu"
          ? TE_IMASU_STATE_CELL
          : TE_IMASU_NONPAST_CONTRAST_CELL,
      ],
      semanticRoleIds: [
        ...(subjectId ? (["topic"] as const) : []),
        "goal",
        ...(question ? (["question"] as const) : []),
      ],
      interpretationTags: [interpretation],
      predicateSenseId: "sit-current-state",
      predicateLexemeId: "verb-suwaru",
      predicateAspect:
        form === "te-imasu" ? "stative" : "dynamic",
      particleFrame: {
        predicateSenseId: "sit-current-state",
        provided: {
          ...(subjectId ? { topic: "topic-wa" as const } : {}),
          goal: "goal-ni",
          ...(question ? { question: "question-ka" as const } : {}),
        },
        attachmentLexemeIdByRole: {
          ...(subjectId ? { topic: subjectId } : {}),
          goal: "noun-isu",
          ...(question ? { question: "verb-suwaru" } : {}),
        },
      },
    },
  );
}

function waitingAtStationTarget(subjectId: string): BaseTask11TargetSpec {
  return task11Target(
    [
      L(subjectId),
      P("topic-wa", "topic", subjectId),
      L("noun-ima"),
      L("noun-eki"),
      P("action-place-de", "action-place", "noun-eki"),
      task11VerbForm("verb-matsu", "te-imasu"),
    ],
    {
      conceptIds: [
        "base-construction-te-imasu",
        "relative-time-omission",
      ],
      patternCellIds: [TE_IMASU_ONGOING_CELL],
      semanticRoleIds: ["topic", "time", "action-place"],
      interpretationTags: ["ongoing-now"],
      predicateSenseId: "wait-current-place",
      predicateLexemeId: "verb-matsu",
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "wait-current-place",
        provided: {
          topic: "topic-wa",
          "action-place": "action-place-de",
        },
        attachmentLexemeIdByRole: {
          topic: subjectId,
          "action-place": "noun-eki",
        },
      },
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
  utteranceKind: NonNullable<BaseExample["utteranceKind"]> = "complete-clause",
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

function turn(
  speakerId: "learner" | "partner",
  target: BaseTask11TargetSpec,
  frame: string,
  en: string,
  it: string,
  purposeEn: string,
  purposeIt: string,
): BaseTask11DialogueTurnSpec {
  return {
    speakerId,
    target,
    frame,
    utteranceKind: "complete-clause",
    en,
    it,
    purposeEn,
    purposeIt,
  };
}

function promptOf(target: BaseTask11TargetSpec): BaseTask11TargetSpec {
  return { ...target, patternCellIds: [] };
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
    readonly errorDefectAxis?: string | null;
    readonly changedTokenSourceIds?: readonly string[];
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
    referentId: null,
    worldFactId: null,
    errorCode,
    ...evidence,
  };
}

const L1: BaseTask11LessonSpec = {
  lessonId: "requests-connection-1",
  contract: "system",
  prerequisiteLessonIds: ["existence-location-4", "polite-verbs-3"],
  newLexemeIds: [
    "verb-motte-kuru",
    "verb-shinu",
    "verb-toru",
    "verb-kesu",
    "verb-akeru",
  ],
  reviewLexemeIds: [
    "verb-kau",
    "verb-matsu",
    "verb-kaeru",
    "verb-nomu",
    "verb-asobu",
    "verb-kaku",
    "verb-oyogu",
    "verb-hanasu",
    "verb-taberu",
    "verb-miru",
    "verb-suru",
    "verb-kuru",
    "verb-iku",
    "noun-eki",
  ],
  introducedConceptIds: ["base-form-te"],
  reviewedConceptIds: [
    "dictionary-lemma",
    "godan-verb-class",
    "ichidan-verb-class",
    "suru-verb-class",
    "kuru-verb-class",
    "verb-class-exceptions",
  ],
  patternCellIds: [
    TE_SOURCE,
    TE_TTE,
    TE_NDE,
    TE_ITE,
    TE_IDE,
    TE_SHITE,
    TE_ICHIDAN,
    TE_SURU,
    TE_KURU,
    TE_EXCEPTION,
  ],
  referenceSnapshotIds: [
    "verb-classes-conjugation",
    "reference-te-forms",
  ],
  examples: [
    ex(teMappingTarget("verb-kau", TE_TTE), "kau-tte", "かう becomes かって.", "かう diventa かって.", "Shows the う member of the って family.", "Mostra il membro in う della famiglia って.", "te-tte", "anatomy-model"),
    ex(teMappingTarget("verb-matsu", TE_TTE), "matsu-tte", "まつ becomes まって.", "まつ diventa まって.", "Shows the つ member of the って family.", "Mostra il membro in つ della famiglia って.", "te-tte", "anatomy-model"),
    ex(teMappingTarget("verb-toru", TE_TTE), "toru-tte", "とる becomes とって.", "とる diventa とって.", "Shows the godan る member of the って family.", "Mostra il membro godan in る della famiglia って.", "te-tte", "anatomy-model"),
    ex(teMappingTarget("verb-nomu", TE_NDE), "nomu-nde", "のむ becomes のんで.", "のむ diventa のんで.", "Shows the む member of the んで family.", "Mostra il membro in む della famiglia んで.", "te-nde", "anatomy-model"),
    ex(teMappingTarget("verb-asobu", TE_NDE), "asobu-nde", "あそぶ becomes あそんで.", "あそぶ diventa あそんで.", "Shows the ぶ member of the んで family.", "Mostra il membro in ぶ della famiglia んで.", "te-nde", "anatomy-model"),
    ex(teMappingTarget("verb-shinu", TE_NDE), "shinu-nde", "しぬ becomes しんで.", "しぬ diventa しんで.", "Shows the ぬ member of the んで family.", "Mostra il membro in ぬ della famiglia んで.", "te-nde", "anatomy-model"),
    ex(teMappingTarget("verb-kaku", TE_ITE), "kaku-ite", "かく becomes かいて.", "かく diventa かいて.", "Shows the regular く to いて change.", "Mostra il passaggio regolare da く a いて.", "te-ite", "anatomy-model"),
    ex(teMappingTarget("verb-oyogu", TE_IDE), "oyogu-ide", "およぐ becomes およいで.", "およぐ diventa およいで.", "Shows the ぐ to いで change.", "Mostra il passaggio da ぐ a いで.", "te-ide", "anatomy-model"),
    ex(teMappingTarget("verb-kesu", TE_SHITE), "kesu-shite", "けす becomes けして.", "けす diventa けして.", "Shows the す to して change.", "Mostra il passaggio da す a して.", "te-shite", "anatomy-model"),
    ex(teMappingTarget("verb-akeru", TE_ICHIDAN), "akeru-te", "あける becomes あけて.", "あける diventa あけて.", "Shows the ichidan る replacement.", "Mostra la sostituzione di る negli ichidan.", "te-ichidan", "anatomy-model"),
    ex(teMappingTarget("verb-suru", TE_SURU), "suru-shite", "する becomes して.", "する diventa して.", "Keeps する as a stored special form.", "Mantiene する come forma speciale registrata.", "te-special", "anatomy-model"),
    ex(teMappingTarget("verb-kuru", TE_KURU), "kuru-kite", "くる becomes きて.", "くる diventa きて.", "Keeps くる as a stored special form.", "Mantiene くる come forma speciale registrata.", "te-special", "anatomy-model"),
    ex(teMappingTarget("verb-iku", TE_EXCEPTION), "iku-itte", "いく becomes いって.", "いく diventa いって.", "Records いって instead of overgeneralized いいて.", "Registra いって invece della generalizzazione いいて.", "te-exception", "anatomy-model"),
    ex(teMappingTarget("verb-motte-kuru", TE_KURU), "motte-kite", "もってくる becomes もってきて.", "もってくる diventa もってきて.", "Applies the stored くる change inside a compound.", "Applica il cambiamento registrato di くる in un composto.", "te-special", "anatomy-model"),
  ],
  activities: [
    act(task11Cue(task11VerbForm("verb-toru", "dictionary")), teTarget("verb-toru", TE_TTE), plainVerbTarget("verb-toru", "polite-nonpast", [], [TE_SOURCE], ["habitual"]), 0, "requests-connection-1", 1, TE_TTE, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-toru" }),
    act(task11Cue(task11VerbForm("verb-shinu", "dictionary"), TASK11_COMMA, task11AnalysisLabel("analysis-source")), teTarget("verb-shinu", TE_NDE), teTarget("verb-shinu", TE_NDE, "dictionary"), 1, "requests-connection-1", 2, TE_NDE, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-shinu" }),
    act(task11Cue(task11VerbForm("verb-hanasu", "dictionary")), teMappingTarget("verb-hanasu", TE_SHITE, false, false), teMappingTarget("verb-hanasu", TE_SHITE, true, false), 0, "requests-connection-1", 3, TE_SHITE, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", heldConstantPredicateLexemeId: "verb-hanasu" }),
    act(task11Cue(task11VerbForm("verb-kesu", "dictionary"), TASK11_COMMA, task11AnalysisLabel("analysis-source")), teTarget("verb-kesu", TE_SHITE), teTarget("verb-kesu", TE_SHITE, "dictionary"), 1, "requests-connection-1", 4, TE_SHITE, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-kesu" }),
    act(task11Cue(task11VerbForm("verb-akeru", "dictionary")), teTarget("verb-akeru", TE_ICHIDAN), teTarget("verb-akeru", TE_ICHIDAN, "dictionary"), 0, "requests-connection-1", 5, TE_ICHIDAN, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-akeru" }),
    act(task11Target([task11DiagnosticForm("verb-iku", "いいて", "iite", "te-iku-overgeneralization")], { conceptIds: ["base-form-te"], patternCellIds: [], semanticRoleIds: [], interpretationTags: ["metalinguistic"], predicateSenseId: "iku", predicateLexemeId: "verb-iku", predicateAspect: "dynamic" }), teTarget("verb-iku", TE_EXCEPTION), task11Target([task11DiagnosticForm("verb-iku", "いいて", "iite", "te-iku-overgeneralization")], { conceptIds: ["base-form-te"], patternCellIds: [], semanticRoleIds: [], interpretationTags: ["metalinguistic"], predicateSenseId: "iku", predicateLexemeId: "verb-iku", predicateAspect: "dynamic" }), 1, "requests-connection-1", 6, TE_EXCEPTION, BASE_ERROR_ACTIVITY_SHAPE, "te-iku-overgeneralization", { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-iku", errorDefectAxis: "form", changedTokenSourceIds: ["te-iku-overgeneralization", "verb-iku", "te"] }),
    act(task11Cue(task11VerbForm("verb-motte-kuru", "dictionary"), TASK11_COMMA, task11AnalysisLabel("analysis-source")), teTarget("verb-motte-kuru", TE_KURU), teTarget("verb-motte-kuru", TE_KURU, "dictionary"), 0, "requests-connection-1", 7, TE_KURU, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-motte-kuru" }),
    act(task11Cue(L("noun-eki"), TASK11_COMMA, task11VerbForm("verb-kuru", "dictionary")), goalVerbFormTarget("noun-eki", "verb-kuru", "te", TE_KURU), goalVerbFormTarget("noun-eki", "verb-kuru", "polite-nonpast", TE_KURU), 1, "requests-connection-1", 8, TE_KURU, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-kuru" }),
    act(task11Cue(task11AnalysisLabel("analysis-source")), teMappingTarget("verb-miru", TE_ICHIDAN, false, false), teMappingTarget("verb-taberu", TE_ICHIDAN, false, false), 0, "requests-connection-1", 9, TE_ICHIDAN, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
    act(task11Cue(task11VerbForm("verb-hanasu", "dictionary")), teTarget("verb-hanasu", TE_SHITE), teTarget("verb-hanasu", TE_SHITE, "dictionary"), 1, "requests-connection-1", 10, TE_SHITE, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-hanasu" }),
  ],
  dialogue: null,
};

const L2: BaseTask11LessonSpec = {
  lessonId: "requests-connection-2",
  contract: "content",
  prerequisiteLessonIds: ["requests-connection-1", "argument-particles-1"],
  newLexemeIds: [
    "verb-shimeru",
    "verb-miseru",
    "verb-tetsudau",
    "verb-yobu",
    "expression-sumimasen",
    "expression-onegaishimasu",
    "expression-douzo",
    "expression-wakarimashita",
    "noun-mado",
    "noun-shorui",
    "noun-nimotsu",
    "noun-shio",
  ],
  reviewLexemeIds: [
    "verb-toru",
    "verb-akeru",
    "verb-miru",
    "anchor-hon",
    "noun-shigoto",
    "noun-kasa",
    "noun-kaban",
    "noun-chizu",
    "noun-mizu",
    "noun-sensei",
    "noun-keisatsukan",
    "noun-ryuugakusei",
    "noun-tegami",
    "expression-hai",
    "expression-iie",
  ],
  introducedConceptIds: ["base-construction-te-kudasai"],
  reviewedConceptIds: [
    "base-form-te",
    "licensed-object-o",
    "question-ka",
    "interactional-ne",
  ],
  patternCellIds: [REQUEST_CELL, REQUEST_RESPONSE_CELL],
  referenceSnapshotIds: [
    "reference-te-forms",
    "sentence-anatomy",
    "particle-atlas",
  ],
  examples: [
    ex(requestTarget("noun-mado", "verb-shimeru", [L("expression-sumimasen"), TASK11_COMMA]), "close-window", "Excuse me, please close the window.", "Mi scusi, chiuda la finestra, per favore.", "Softens one explicit request without claiming universal politeness.", "Attenua una richiesta esplicita senza affermare una cortesia universale.", "request-softening"),
    ex(requestTarget("noun-shorui", "verb-miseru"), "show-documents", "Please show me the documents.", "Mi mostri i documenti, per favore.", "Applies てください to a bounded request.", "Applica てください a una richiesta delimitata.", "request"),
    ex(requestTarget("noun-shigoto", "verb-tetsudau"), "help-work", "Please help with the work.", "Dia una mano con il lavoro, per favore.", "Uses a natural task-specific request.", "Usa una richiesta naturale legata a un compito.", "request"),
    ex(requestTarget("noun-shio", "verb-toru"), "pass-salt", "Please pass the salt.", "Passi il sale, per favore.", "Shows a familiar table request.", "Mostra una richiesta comune a tavola.", "request"),
    ex(requestTarget("noun-sensei", "verb-yobu"), "call-teacher", "Please call the teacher.", "Chiami l'insegnante, per favore.", "Uses a person as the object of よぶ.", "Usa una persona come oggetto di よぶ.", "request"),
    ex(requestTarget("anchor-hon", "verb-miseru"), "show-book", "Please show me the book.", "Mi mostri il libro, per favore.", "Reuses a familiar object with the same construction.", "Riutilizza un oggetto noto con la stessa costruzione.", "request"),
    ex(requestTarget("noun-nimotsu", "verb-toru"), "take-luggage", "Please take the luggage.", "Prenda il bagaglio, per favore.", "Keeps the requested action explicit.", "Mantiene esplicita l'azione richiesta.", "request"),
    ex(requestTarget("noun-mado", "verb-akeru"), "open-window", "Please open the window.", "Apra la finestra, per favore.", "Contrasts opening with the earlier closing request.", "Contrappone l'apertura alla precedente richiesta di chiudere.", "request"),
    ex(softenedExpressionTarget("expression-onegaishimasu"), "accept-offer", "Excuse me—please do.", "Mi scusi; sì, grazie.", "Models a softened acceptance of a wanted offer.", "Modella un'accettazione attenuata di un'offerta desiderata.", "request-response", "contextual-fragment"),
  ],
  activities: [
    act(promptOf(objectVerbTarget("noun-shigoto", "verb-tetsudau", "polite-nonpast", [], [], ["future"])), expressionTarget("expression-onegaishimasu"), expressionTarget("expression-iie"), 0, "requests-connection-2", 1, REQUEST_RESPONSE_CELL, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-chizu")), requestTarget("noun-chizu", "verb-miseru", [L("expression-sumimasen"), TASK11_COMMA]), requestTarget("noun-chizu", "verb-miseru"), 1, "requests-connection-2", 2, REQUEST_CELL, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-miseru" }),
    act(task11Cue(L("noun-nimotsu")), requestTarget("noun-nimotsu", "verb-toru", [], [P("interactional-ne", "interaction", "verb-toru")]), { ...requestTarget("noun-nimotsu", "verb-toru", [], [P("interactional-ne", "interaction", "verb-toru")]), parts: [task11VerbForm("verb-toru", "te-request"), L("noun-nimotsu"), P("object-o", "theme", "noun-nimotsu"), P("interactional-ne", "interaction", "verb-toru")] }, 0, "requests-connection-2", 3, REQUEST_CELL, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", heldConstantPredicateLexemeId: "verb-toru" }),
    act(promptOf(requestTarget("noun-keisatsukan", "verb-yobu")), responseThenActionTarget("expression-wakarimashita", "noun-keisatsukan", "verb-yobu"), responseThenActionTarget("expression-iie", "noun-keisatsukan", "verb-yobu"), 1, "requests-connection-2", 4, REQUEST_RESPONSE_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: "verb-yobu" }),
    act(task11Cue(L("noun-kaban")), requestTarget("noun-kaban", "verb-miseru", [], [P("interactional-ne", "interaction", "verb-miseru")]), requestTarget("noun-shorui", "verb-miseru", [], [P("interactional-ne", "interaction", "verb-miseru")]), 0, "requests-connection-2", 5, REQUEST_CELL, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: "verb-miseru" }),
    act(promptOf(objectVerbTarget("noun-mado", "verb-shimeru", "te", ["base-form-te"], [], ["future"])), requestTarget("noun-mado", "verb-shimeru"), objectVerbTarget("noun-mado", "verb-shimeru", "te", ["base-form-te"], [], ["future"]), 1, "requests-connection-2", 6, REQUEST_CELL, BASE_ERROR_ACTIVITY_SHAPE, "request-ending-missing", { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-shimeru", errorDefectAxis: "construction", changedTokenSourceIds: ["kudasai"] }),
    act(task11Cue(L("noun-shio")), requestTarget("noun-shio", "verb-toru", [], [P("interactional-ne", "interaction", "verb-toru")]), requestTarget("noun-shio", "verb-toru", [], [P("interactional-yo", "interaction", "verb-toru")]), 0, "requests-connection-2", 7, REQUEST_CELL, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-toru" }),
    act(task11Cue(L("noun-kasa")), requestTarget("noun-kasa", "verb-miru", [L("expression-douzo"), TASK11_COMMA]), requestTarget("noun-kasa", "verb-miru"), 1, "requests-connection-2", 8, REQUEST_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-miru" }),
    act(task11Cue(task11VerbForm("verb-toru", "dictionary")), requestTarget("noun-chizu", "verb-toru"), requestTarget("noun-shorui", "verb-toru"), 0, "requests-connection-2", 9, REQUEST_CELL, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: "verb-toru" }),
    act(task11Cue(L("noun-sensei")), requestTarget("noun-sensei", "verb-yobu", [L("expression-sumimasen"), TASK11_COMMA]), requestTarget("noun-sensei", "verb-yobu"), 1, "requests-connection-2", 10, REQUEST_CELL, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-yobu" }),
  ],
  dialogue: [
    turn("learner", requestTarget("noun-shorui", "verb-miseru", [L("expression-sumimasen"), TASK11_COMMA]), "office-ask-documents", "Excuse me, please show me the documents.", "Mi scusi, mi mostri i documenti, per favore.", "Opens one office exchange with a softened document request.", "Apre un unico scambio in ufficio con una richiesta attenuata dei documenti."),
    turn("partner", acknowledgedResponseTarget("expression-douzo"), "office-handoff-documents", "Yes, here you are.", "Sì, ecco a lei.", "Responds naturally while handing over the documents.", "Risponde naturalmente mentre consegna i documenti."),
    turn("learner", requestTarget("noun-tegami", "verb-miseru"), "office-ask-letter", "Please show me the letter.", "Mi mostri la lettera, per favore.", "Makes a second document request in the same office.", "Formula una seconda richiesta di un documento nello stesso ufficio."),
    turn("partner", acknowledgedResponseTarget("expression-wakarimashita"), "office-agree-letter", "Yes, understood.", "Sì, ho capito.", "Accepts the letter request without unnaturally echoing the verb.", "Accetta la richiesta della lettera senza ripetere artificialmente il verbo."),
  ],
};

const L3: BaseTask11LessonSpec = {
  lessonId: "requests-connection-3",
  contract: "system",
  prerequisiteLessonIds: ["requests-connection-2", "polite-verbs-4"],
  newLexemeIds: ["verb-arau", "verb-hairu", "verb-deru", "verb-noru"],
  reviewLexemeIds: [
    "verb-okiru",
    "verb-taberu",
    "verb-nomu",
    "verb-kau",
    "verb-kaeru",
    "verb-kaku",
    "verb-yomu",
    "verb-iku",
    "verb-kuru",
    "verb-miru",
    "verb-yasumu",
    "verb-oyogu",
    "verb-hanasu",
  ],
  introducedConceptIds: ["base-construction-sequential-te"],
  reviewedConceptIds: ["base-form-te", "masu-nonpast"],
  patternCellIds: [SEQUENCE_CELL, SEQUENCE_FINAL_CELL],
  referenceSnapshotIds: [
    "reference-te-forms",
    "sentence-anatomy",
    "verb-classes-conjugation",
  ],
  examples: [
    ex(sequenceTarget("verb-okiru", "verb-taberu"), "wake-eat", "I will wake up and then eat.", "Mi alzerò e poi mangerò.", "Presents one explicit chronological sequence.", "Presenta una sequenza cronologica esplicita.", "sequence"),
    ex(sequenceTarget("verb-taberu", "verb-kaeru"), "eat-return", "I will eat and then return.", "Mangerò e poi tornerò.", "Keeps the relation to simple succession.", "Limita la relazione alla semplice successione.", "sequence"),
    ex(sequenceTarget("verb-kau", "verb-kaeru"), "buy-return", "I will buy something and then return.", "Comprerò qualcosa e poi tornerò.", "Connects two bounded actions.", "Collega due azioni delimitate.", "sequence"),
    ex(sequenceTarget("verb-kaku", "verb-yomu"), "write-read", "I will write and then read.", "Scriverò e poi leggerò.", "Shows that the final verb carries the polite ending.", "Mostra che il verbo finale porta la desinenza cortese.", "sequence"),
    ex(sequenceTarget("verb-arau", "verb-yasumu"), "wash-rest", "I will wash and then rest.", "Mi laverò e poi mi riposerò.", "Introduces あらう in a two-step sequence.", "Introduce あらう in una sequenza di due passi.", "sequence"),
    ex(sequenceTarget("verb-hairu", "verb-yasumu"), "enter-rest", "I will enter and then rest.", "Entrerò e poi mi riposerò.", "Keeps entering before resting.", "Mantiene l'ingresso prima del riposo.", "sequence"),
    ex(sequenceTarget("verb-deru", "verb-iku"), "leave-go", "I will leave and then go.", "Uscirò e poi andrò.", "Introduces でる as the first action.", "Introduce でる come prima azione.", "sequence"),
    ex(sequenceTarget("verb-noru", "verb-iku"), "board-go", "I will board and then go.", "Salirò a bordo e poi andrò.", "Uses のる without claiming a broader discourse relation.", "Usa のる senza affermare una relazione discorsiva più ampia.", "sequence"),
    ex(sequenceTarget("verb-kuru", "verb-taberu"), "come-eat", "I will come and then eat.", "Verrò e poi mangerò.", "Reuses the special くる form.", "Riutilizza la forma speciale di くる.", "sequence"),
    ex(sequenceTarget("verb-oyogu", "verb-kaeru"), "swim-return", "I will swim and then return.", "Nuoterò e poi tornerò.", "Reuses the voiced いで allomorph.", "Riutilizza l'allomorfo sonoro いで.", "sequence"),
    ex(sequenceTarget("verb-hanasu", "verb-kaku"), "speak-write", "I will speak and then write.", "Parlerò e poi scriverò.", "Connects two familiar actions in order.", "Collega in ordine due azioni note.", "sequence"),
    ex(sequenceTarget("verb-miru", "verb-kau"), "see-buy", "I will look and then buy.", "Guarderò e poi comprerò.", "Shows a practical inspect-then-buy order.", "Mostra un ordine pratico: guardare e poi comprare.", "sequence"),
  ],
  activities: [
    act(task11Cue(task11VerbForm("verb-arau", "dictionary"), TASK11_COMMA, task11VerbForm("verb-taberu", "dictionary")), sequenceTarget("verb-arau", "verb-taberu", false, SEQUENCE_CELL), sequenceTarget("verb-miru", "verb-iku", false, SEQUENCE_CELL), 0, "requests-connection-3", 1, SEQUENCE_CELL, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "schedule-route", heldConstantPredicateLexemeId: null }),
    act(task11Cue(task11VerbForm("verb-hairu", "dictionary"), TASK11_COMMA, task11VerbForm("verb-yomu", "dictionary")), sequenceTarget("verb-hairu", "verb-yomu", false, SEQUENCE_FINAL_CELL), sequenceTarget("verb-yomu", "verb-hairu", false, SEQUENCE_FINAL_CELL), 1, "requests-connection-3", 2, SEQUENCE_FINAL_CELL, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "schedule-route", heldConstantPredicateLexemeId: null }),
    act(task11Cue(task11VerbForm("verb-deru", "dictionary"), TASK11_COMMA, task11VerbForm("verb-kaeru", "dictionary")), sequenceTarget("verb-deru", "verb-kaeru", false, SEQUENCE_CELL), sequenceTarget("verb-deru", "verb-kaeru", true, SEQUENCE_CELL), 0, "requests-connection-3", 3, SEQUENCE_CELL, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", heldConstantPredicateLexemeId: "verb-kaeru" }),
    act(task11Cue(task11VerbForm("verb-noru", "dictionary"), TASK11_COMMA, task11VerbForm("verb-kuru", "dictionary")), sequenceTarget("verb-noru", "verb-kuru", false, SEQUENCE_FINAL_CELL), sequenceTarget("verb-miru", "verb-kuru", false, SEQUENCE_FINAL_CELL), 1, "requests-connection-3", 4, SEQUENCE_FINAL_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "schedule-route", heldConstantPredicateLexemeId: "verb-kuru" }),
    act(task11Cue(task11VerbForm("verb-kau", "dictionary"), TASK11_COMMA, task11VerbForm("verb-yomu", "dictionary")), sequenceTarget("verb-kau", "verb-yomu", false, SEQUENCE_CELL), sequenceTarget("verb-yomu", "verb-kau", false, SEQUENCE_CELL), 0, "requests-connection-3", 5, SEQUENCE_CELL, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "schedule-route", heldConstantPredicateLexemeId: null }),
    act(promptOf(task11Target([task11VerbForm("verb-taberu", "polite-nonpast"), TASK11_COMMA, task11VerbForm("verb-iku", "polite-nonpast")], { conceptIds: [], patternCellIds: [], semanticRoleIds: [], interpretationTags: ["future"], predicateSenseId: "iku", predicateLexemeId: "verb-iku", predicateAspect: "dynamic" })), sequenceTarget("verb-taberu", "verb-iku", false, SEQUENCE_FINAL_CELL), task11Target([task11VerbForm("verb-taberu", "polite-nonpast"), TASK11_COMMA, task11VerbForm("verb-iku", "polite-nonpast")], { conceptIds: [], patternCellIds: [SEQUENCE_FINAL_CELL], semanticRoleIds: [], interpretationTags: ["future"], predicateSenseId: "iku", predicateLexemeId: "verb-iku", predicateAspect: "dynamic" }), 1, "requests-connection-3", 6, SEQUENCE_FINAL_CELL, BASE_ERROR_ACTIVITY_SHAPE, "sequential-te-missing", { contrastAxis: "polite-form", heldConstantPredicateLexemeId: "verb-iku", errorDefectAxis: "construction", changedTokenSourceIds: ["verb-taberu", "te-sequence", "masu"] }),
    act(task11Cue(task11VerbForm("verb-arau", "dictionary"), TASK11_COMMA, task11VerbForm("verb-nomu", "dictionary")), sequenceTarget("verb-nomu", "verb-arau", false, SEQUENCE_CELL), sequenceTarget("verb-arau", "verb-nomu", false, SEQUENCE_CELL), 0, "requests-connection-3", 7, SEQUENCE_CELL, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "schedule-route", heldConstantPredicateLexemeId: null }),
    act(task11Cue(task11VerbForm("verb-noru", "dictionary"), TASK11_COMMA, task11VerbForm("verb-kaeru", "dictionary")), sequenceTarget("verb-kaeru", "verb-noru", false, SEQUENCE_FINAL_CELL), sequenceTarget("verb-noru", "verb-kaeru", false, SEQUENCE_FINAL_CELL), 1, "requests-connection-3", 8, SEQUENCE_FINAL_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "schedule-route", heldConstantPredicateLexemeId: null }),
    act(task11Cue(task11VerbForm("verb-yomu", "dictionary")), sequenceTarget("verb-miru", "verb-yomu", false, SEQUENCE_CELL), sequenceTarget("verb-hanasu", "verb-yomu", false, SEQUENCE_CELL), 0, "requests-connection-3", 9, SEQUENCE_CELL, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: "verb-yomu" }),
    act(task11Cue(task11VerbForm("verb-hairu", "dictionary"), TASK11_COMMA, task11VerbForm("verb-taberu", "dictionary")), sequenceTarget("verb-hairu", "verb-taberu", false, SEQUENCE_FINAL_CELL), sequenceTarget("verb-taberu", "verb-hairu", false, SEQUENCE_FINAL_CELL), 1, "requests-connection-3", 10, SEQUENCE_FINAL_CELL, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "schedule-route", heldConstantPredicateLexemeId: null }),
  ],
  dialogue: null,
};

function teImasuQuestion(
  subjectId: string,
  lemmaId: string,
  interpretation: "ongoing-now" | "resulting-state",
): BaseTask11TargetSpec {
  if (lemmaId === "verb-yomu" && interpretation === "ongoing-now") {
    return anchoredObjectVerbTarget(
      subjectId,
      "anchor-hon",
      lemmaId,
      "te-imasu",
      interpretation,
      TE_IMASU_ONGOING_CELL,
      { includeNow: true, question: true },
    );
  }
  if (lemmaId === "verb-suwaru" && interpretation === "resulting-state") {
    return seatedTarget(subjectId, "te-imasu", true);
  }
  throw new Error(`Unsupported ています question for ${lemmaId}.`);
}

const L4: BaseTask11LessonSpec = {
  lessonId: "requests-connection-4",
  contract: "system",
  prerequisiteLessonIds: ["requests-connection-3", "topic-questions-4"],
  newLexemeIds: [
    "verb-suwaru",
    "verb-kiru",
    "verb-shiru",
    "noun-ima",
    "noun-fuku",
  ],
  reviewLexemeIds: [
    "verb-taberu",
    "verb-miru",
    "verb-yomu",
    "verb-kaku",
    "verb-hanasu",
    "verb-oyogu",
    "verb-benkyou-suru",
    "verb-hataraku",
    "verb-matsu",
    "verb-motte-kuru",
    "verb-suru",
    "verb-denwa-suru",
    "noun-kyou",
    "noun-watashi",
    "noun-gohan",
    "noun-tegami",
    "noun-eki",
    "noun-isu",
    "anchor-hon",
    "noun-shorui",
    "noun-zasshi",
    "noun-yamada",
    "noun-tanaka",
    "noun-suzuki",
  ],
  introducedConceptIds: ["base-construction-te-imasu"],
  reviewedConceptIds: [
    "base-form-te",
    "licensed-object-o",
    "topic-wa",
    "question-ka",
  ],
  patternCellIds: [
    TE_IMASU_ONGOING_CELL,
    TE_IMASU_STATE_CELL,
    TE_IMASU_NONPAST_CONTRAST_CELL,
  ],
  referenceSnapshotIds: [
    "reference-te-forms",
    "sentence-anatomy",
    "tense-polarity",
  ],
  examples: [
    ex(anchoredObjectVerbTarget("noun-watashi", "noun-gohan", "verb-taberu", "te-imasu", "ongoing-now", TE_IMASU_ONGOING_CELL, { includeNow: true }), "eating-now", "I am eating rice now.", "Adesso sto mangiando riso.", "The Japanese clause names the current time, eater, and food.", "La frase giapponese nomina il momento attuale, chi mangia e il cibo.", "ongoing-action"),
    ex(anchoredObjectVerbTarget("noun-tanaka", "anchor-hon", "verb-yomu", "te-imasu", "ongoing-now", TE_IMASU_ONGOING_CELL, { includeNow: true }), "reading-now", "Tanaka is reading a book now.", "Tanaka sta leggendo un libro adesso.", "The visible time and book anchor reading in progress.", "Il tempo visibile e il libro ancorano la lettura in corso.", "ongoing-action"),
    ex(anchoredObjectVerbTarget("noun-yamada", "noun-tegami", "verb-kaku", "te-imasu", "ongoing-now", TE_IMASU_ONGOING_CELL, { includeNow: true }), "writing-now", "Yamada is writing a letter now.", "Yamada sta scrivendo una lettera adesso.", "The letter and current-time phrase make the ongoing event explicit.", "La lettera e l'espressione temporale rendono esplicito l'evento in corso.", "ongoing-action"),
    ex(anchoredTeImasuSubjectTarget("noun-suzuki", "verb-denwa-suru"), "calling-now", "Suzuki is on the phone now.", "Suzuki è al telefono adesso.", "The subject and visible current-time phrase anchor the call.", "Il soggetto e l'espressione temporale visibile ancorano la telefonata.", "ongoing-action"),
    ex(anchoredTeImasuSubjectTarget("noun-tanaka", "verb-oyogu"), "swimming-now", "Tanaka is swimming now.", "Tanaka sta nuotando adesso.", "The visible current-time phrase selects an ongoing swim.", "L'espressione temporale visibile seleziona una nuotata in corso.", "ongoing-action"),
    ex(anchoredTeImasuSubjectTarget("noun-yamada", "verb-benkyou-suru"), "studying-now", "Yamada is studying now.", "Yamada sta studiando adesso.", "The Japanese subject and time identify current study.", "Il soggetto e il tempo in giapponese identificano lo studio attuale.", "ongoing-action"),
    ex({ ...anchoredTeImasuSubjectTarget("noun-suzuki", "verb-hataraku"), patternCellIds: [TE_IMASU_ONGOING_CELL, TE_IMASU_NONPAST_CONTRAST_CELL] }, "working-now", "Suzuki is working now.", "Suzuki sta lavorando adesso.", "The visible time distinguishes current work from habitual nonpast.", "Il tempo visibile distingue il lavoro attuale dal non passato abituale.", "ongoing-action"),
    ex(anchoredObjectVerbTarget("noun-watashi", "noun-yamada", "verb-shiru", "te-imasu", "resulting-state", TE_IMASU_STATE_CELL), "knowing-yamada", "I know Yamada.", "Conosco Yamada.", "The named person is the object of a current knowledge state.", "La persona nominata è l'oggetto di uno stato attuale di conoscenza.", "current-state"),
    ex(anchoredObjectVerbTarget("noun-yamada", "noun-fuku", "verb-kiru", "te-imasu", "resulting-state", TE_IMASU_STATE_CELL), "wearing-clothes", "Yamada is wearing clothes.", "Yamada indossa dei vestiti.", "The explicit clothing object selects the wearing-state reading.", "L'oggetto vestiti esplicito seleziona la lettura di stato risultante.", "resulting-state"),
    ex(seatedTarget("noun-suzuki", "te-imasu"), "seated-on-chair", "Suzuki is seated on a chair.", "Suzuki è seduto su una sedia.", "The chair location anchors the state after sitting down.", "La sedia ancora lo stato dopo essersi seduto.", "resulting-state"),
    ex(waitingAtStationTarget("noun-tanaka"), "waiting-at-station-now", "Tanaka is waiting at the station now.", "Tanaka sta aspettando alla stazione adesso.", "The visible current time and action place anchor waiting as underway.", "Il tempo attuale e il luogo dell'azione visibili ancorano l'attesa in corso.", "ongoing-action"),
    ex(anchoredObjectVerbTarget("noun-suzuki", "noun-zasshi", "verb-miru", "te-imasu", "ongoing-now", TE_IMASU_ONGOING_CELL, { includeNow: true }), "watching-magazine-now", "Suzuki is looking at a magazine now.", "Suzuki sta guardando una rivista adesso.", "The visible time and object anchor the action in progress.", "Il tempo e l'oggetto visibili ancorano l'azione in corso.", "ongoing-action"),
  ],
  activities: [
    act(task11Cue(L("noun-tanaka"), L("noun-yamada")), anchoredObjectVerbTarget("noun-tanaka", "noun-yamada", "verb-shiru", "te-imasu", "resulting-state", TE_IMASU_STATE_CELL), anchoredObjectVerbTarget("noun-tanaka", "noun-zasshi", "verb-yomu", "te-imasu", "ongoing-now", TE_IMASU_ONGOING_CELL, { includeNow: true }), 0, "requests-connection-4", 1, TE_IMASU_STATE_CELL, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: null }),
    act(task11Cue(task11VerbForm("verb-taberu", "dictionary")), teImasuTarget("verb-taberu", "ongoing-now", [L("noun-yamada"), P("topic-wa", "topic", "noun-yamada")], ["topic"]), plainVerbTarget("verb-taberu", "polite-nonpast", [], [TE_IMASU_NONPAST_CONTRAST_CELL], ["future"], [L("noun-yamada"), P("topic-wa", "topic", "noun-yamada")], ["topic"]), 1, "requests-connection-4", 2, TE_IMASU_ONGOING_CELL, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-taberu" }),
    act(task11Cue(L("noun-zasshi")), objectVerbTarget("noun-zasshi", "verb-yomu", "te-imasu", ["base-construction-te-imasu"], [TE_IMASU_ONGOING_CELL], ["ongoing-now"]), { ...objectVerbTarget("noun-zasshi", "verb-yomu", "te-imasu", ["base-construction-te-imasu"], [TE_IMASU_ONGOING_CELL], ["ongoing-now"]), parts: [task11VerbForm("verb-yomu", "te-imasu"), L("noun-zasshi"), P("object-o", "theme", "noun-zasshi")] }, 0, "requests-connection-4", 3, TE_IMASU_ONGOING_CELL, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", heldConstantPredicateLexemeId: "verb-yomu" }),
    act(task11Cue(L("noun-yamada"), L("noun-isu")), seatedTarget("noun-yamada", "te-imasu"), anchoredObjectVerbTarget("noun-yamada", "noun-zasshi", "verb-yomu", "te-imasu", "ongoing-now", TE_IMASU_ONGOING_CELL, { includeNow: true }), 1, "requests-connection-4", 4, TE_IMASU_STATE_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: null }),
    act(task11Cue(task11VerbForm("verb-kaku", "dictionary")), teImasuTarget("verb-kaku", "ongoing-now", [L("noun-tanaka"), P("topic-wa", "topic", "noun-tanaka")], ["topic"]), plainVerbTarget("verb-kaku", "polite-nonpast", [], [TE_IMASU_NONPAST_CONTRAST_CELL], ["habitual"], [L("noun-tanaka"), P("topic-wa", "topic", "noun-tanaka")], ["topic"]), 0, "requests-connection-4", 5, TE_IMASU_ONGOING_CELL, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-kaku" }),
    act(promptOf(objectVerbTarget("noun-shorui", "verb-yomu", "polite-nonpast", [], [TE_IMASU_NONPAST_CONTRAST_CELL], ["habitual"])), objectVerbTarget("noun-shorui", "verb-yomu", "te-imasu", ["base-construction-te-imasu"], [TE_IMASU_ONGOING_CELL], ["ongoing-now"]), objectVerbTarget("noun-shorui", "verb-yomu", "polite-nonpast", [], [TE_IMASU_NONPAST_CONTRAST_CELL], ["habitual"]), 1, "requests-connection-4", 6, TE_IMASU_ONGOING_CELL, BASE_ERROR_ACTIVITY_SHAPE, "ongoing-construction-mismatch", { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-yomu", errorDefectAxis: "interpretation", changedTokenSourceIds: ["masu", "te", "imasu"] }),
    act(task11Cue(L("noun-suzuki"), L("noun-fuku")), anchoredObjectVerbTarget("noun-suzuki", "noun-fuku", "verb-kiru", "te-imasu", "resulting-state", TE_IMASU_STATE_CELL), anchoredObjectVerbTarget("noun-suzuki", "noun-fuku", "verb-kiru", "polite-nonpast", "future", TE_IMASU_NONPAST_CONTRAST_CELL), 0, "requests-connection-4", 7, TE_IMASU_STATE_CELL, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-kiru" }),
    act(task11Cue(L("noun-tanaka"), L("noun-suzuki")), anchoredObjectVerbTarget("noun-tanaka", "noun-suzuki", "verb-shiru", "te-imasu", "resulting-state", TE_IMASU_STATE_CELL), anchoredTeImasuSubjectTarget("noun-tanaka", "verb-hanasu"), 1, "requests-connection-4", 8, TE_IMASU_STATE_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-suzuki")), anchoredObjectVerbTarget("noun-suzuki", "anchor-hon", "verb-miru", "te-imasu", "ongoing-now", TE_IMASU_ONGOING_CELL, { includeNow: true }), anchoredObjectVerbTarget("noun-suzuki", "noun-shorui", "verb-miru", "te-imasu", "ongoing-now", TE_IMASU_ONGOING_CELL, { includeNow: true }), 0, "requests-connection-4", 9, TE_IMASU_ONGOING_CELL, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: "verb-miru" }),
    act(task11Cue(task11VerbForm("verb-suwaru", "dictionary"), L("noun-tanaka"), L("noun-isu")), seatedTarget("noun-tanaka", "te-imasu"), seatedTarget("noun-tanaka", "polite-nonpast"), 1, "requests-connection-4", 10, TE_IMASU_STATE_CELL, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: "verb-suwaru" }),
  ],
  dialogue: [
    turn("learner", teImasuQuestion("noun-tanaka", "verb-yomu", "ongoing-now"), "ask-tanaka-now", "Is Tanaka reading now?", "Tanaka sta leggendo adesso?", "Asks about an action visibly underway.", "Chiede di un'azione visibilmente in corso."),
    turn("partner", anchoredObjectVerbTarget(null, "anchor-hon", "verb-yomu", "te-imasu", "ongoing-now", TE_IMASU_ONGOING_CELL, { prefix: [L("expression-hai"), TASK11_COMMA] }), "tanaka-reading", "Yes, Tanaka is reading a book.", "Sì, Tanaka sta leggendo un libro.", "Answers with an ongoing dynamic action.", "Risponde con un'azione dinamica in corso."),
    turn("learner", teImasuQuestion("noun-suzuki", "verb-suwaru", "resulting-state"), "ask-suzuki-now", "Is Suzuki seated now?", "Suzuki è seduto adesso?", "Contrasts the current state with the ongoing action.", "Contrappone lo stato attuale all'azione in corso."),
    turn("partner", seatedTarget(null, "te-imasu", false, [L("expression-hai"), TASK11_COMMA]), "suzuki-seated", "Yes, Suzuki is seated on a chair.", "Sì, Suzuki è seduto su una sedia.", "Answers with the current state after sitting down.", "Risponde con lo stato attuale dopo essersi seduto."),
  ],
};

const SPECS = deepFreeze([L1, L2, L3, L4]);
const BUILT = SPECS.map(buildTask11Lesson);
const RAW_LESSONS = BUILT.map(({ lesson }) => lesson);

export const BASE_REQUESTS_CONNECTION_LESSONS: readonly (
  | BaseSystemLessonContent
  | BaseContentLessonContent
)[] = deepFreeze(RAW_LESSONS.map(({ content }) => content));

export const BASE_REQUESTS_CONNECTION_EXAMPLES: readonly BaseExample[] =
  deepFreeze(RAW_LESSONS.flatMap(({ examples }) => examples));

export const BASE_REQUESTS_CONNECTION_VALIDATION_CATALOGS: BaseValidationCatalogs =
  task11ValidationCatalogs(
    BASE_EXISTENCE_LOCATION_VALIDATION_CATALOGS,
    BUILT,
  );

const RAW_REQUESTS_CONNECTION_MODULE: BaseRequestsConnectionModule = {
  id: "requests-connection",
  lessons: RAW_LESSONS,
  sequence: [
    ...BASE_EXISTENCE_LOCATION_MODULE.sequence,
    ...BASE_REQUESTS_CONNECTION_LESSONS,
  ],
  worldFacts: { scope: "requests-connection" },
  worldFactIds: [],
  worldFactLedger: worldFactLedgerFor(RAW_LESSONS),
};

function hasCanonicalTeRealization(
  entry: StrictTask11CorpusTarget,
  corpusTargets: readonly StrictTask11CorpusTarget[],
): boolean {
  const { target } = entry;
  const construction = target.formIds.includes(
    "base-construction-te-kudasai",
  )
    ? "request"
    : target.formIds.includes("base-construction-sequential-te")
      ? "sequence"
      : target.formIds.includes("base-construction-te-imasu")
        ? "te-imasu"
        : target.formIds.includes("base-form-te")
          ? "te"
          : null;
  if (!construction) return true;
  const teLemmaIds = new Set(
    target.tokens
      .filter(({ id }) => id.endsWith("-te-stem"))
      .map(({ source }) => source.referenceId),
  );
  if (teLemmaIds.size === 0) return false;
  const orderPermutation = isExactOrderChunkPermutation(
    entry,
    corpusTargets,
  );
  return [...teLemmaIds].every((lemmaId) => {
    const baseTe = realizeTeConstruction(lemmaId, "te");
    const realized = realizeTeConstruction(lemmaId, construction);
    if (
      !baseTe.ok ||
      authoredTeSurface(lemmaId) !== japanese(baseTe.value) ||
      !realized.ok
    ) {
      return false;
    }
    const spans = findExactGeneratedTokenSpans(
      target.tokens,
      realized.value,
    );
    if (spans.length !== 1) return false;
    if (orderPermutation) return true;
    if (construction !== "sequence") {
      return spans.some(({ end }) =>
        hasAuthoredClauseFinalSuffix(target, end),
      );
    }
    if (target.predicateLexemeId === null) return false;
    const finalPredicate = realizePoliteNonpast(target.predicateLexemeId);
    if (!finalPredicate.ok) return false;
    const finalSpans = findExactGeneratedTokenSpans(
      target.tokens,
      finalPredicate.value,
    );
    return spans.some(({ end }) => {
      const separator = target.tokens[end];
      const finalSpan = finalSpans.find(
        ({ start }) => start === end + 1,
      );
      return (
        separator?.kind === "punctuation" &&
        finalSpan !== undefined &&
        hasAuthoredClauseFinalSuffix(target, finalSpan.end)
      );
    });
  });
}

function hasCanonicalTeImasuSemantics(
  lessonId: string,
  target: BaseVisibleTarget,
): boolean {
  const hasTeImasu = target.formIds.includes(
    "base-construction-te-imasu",
  );
  const constructionTags = target.interpretationTags.filter(
    (tag) => tag === "ongoing-now" || tag === "resulting-state",
  );
  if (!hasTeImasu) return constructionTags.length === 0;
  if (
    lessonId !== "requests-connection-4" ||
    target.predicateLexemeId === null
  ) {
    return false;
  }
  const lexeme = BASE_LEXEME_BY_ID.get(target.predicateLexemeId);
  if (lexeme?.category !== "verb") return false;
  const expectedTag =
    lexeme.eventClass === "activity"
      ? "ongoing-now"
      : "resulting-state";
  const expectedCell =
    expectedTag === "ongoing-now"
      ? TE_IMASU_ONGOING_CELL
      : TE_IMASU_STATE_CELL;
  const forbiddenCell =
    expectedTag === "ongoing-now"
      ? TE_IMASU_STATE_CELL
      : TE_IMASU_ONGOING_CELL;
  if (
    constructionTags.length !== 1 ||
    constructionTags[0] !== expectedTag ||
    (target.patternCellIds.length > 0 &&
      !target.patternCellIds.includes(expectedCell)) ||
    target.patternCellIds.includes(forbiddenCell) ||
    target.predicateAspect !==
      (expectedTag === "ongoing-now" ? "dynamic" : "stative")
  ) {
    return false;
  }
  const anchor = lexeme.teImasuAnchor;
  if (!anchor) return true;
  return (target.particleBindings ?? []).some(
    ({ role, attachmentLexemeId }) =>
      role === anchor.semanticRole &&
      (anchor.lexemeIds === undefined ||
        anchor.lexemeIds.includes(attachmentLexemeId)),
  );
}

function hasCanonicalTask12Semantics(
  targets: readonly Readonly<{
    readonly lessonId: string;
    readonly target: BaseVisibleTarget;
  }>[],
): boolean {
  return targets.every(({ lessonId, target }) => {
    return hasCanonicalTeImasuSemantics(lessonId, target);
  });
}

export function validateBaseRequestsConnectionModule(
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
    "requests-connection",
    SPECS.map(({ lessonId }) => lessonId),
    BASE_REQUESTS_CONNECTION_VALIDATION_CATALOGS,
  );
  if (!base.ok) return base;
  const snapshot = strictTask11ModuleSnapshot(sanitized.value);
  const corpusCollisions = validateTask11CorpusDistinctness(
    [
      BASE_SENTENCE_FOUNDATIONS_MODULE,
      BASE_TOPIC_QUESTIONS_MODULE,
      BASE_POLITE_VERBS_MODULE,
      BASE_ARGUMENT_PARTICLES_MODULE,
      BASE_TIME_MOVEMENT_MODULE,
      BASE_COPULA_ADJECTIVES_MODULE,
      BASE_EXISTENCE_LOCATION_MODULE,
      sanitized.value,
    ],
    baseNavigationCopyEn.content,
    baseNavigationCopyIt.content,
  );
  const task12CorpusCollisions = corpusCollisions?.filter(({ lessonId }) =>
    /^(?:copula-adjectives|existence-location|requests-connection)-/u.test(
      lessonId,
    ),
  );
  const semanticInvariantHolds =
    snapshot &&
    snapshot.corpusTargets.every((entry) =>
      hasCanonicalTeRealization(entry, snapshot.corpusTargets),
    ) &&
    hasCanonicalTask12Semantics(snapshot.targets) &&
    task12CorpusCollisions?.length === 0;
  if (!semanticInvariantHolds) {
    return { ok: false, errors: ["invalid-lesson-shape"] };
  }
  return task11PlainDataEqual(
    sanitized.value,
    RAW_REQUESTS_CONNECTION_MODULE,
  )
    ? base
    : { ok: false, errors: ["invalid-module-shape"] };
}

export const module09ConceptIds = deepFreeze(
  SPECS.flatMap(({ introducedConceptIds }) => introducedConceptIds),
);

export const BASE_REQUESTS_CONNECTION_MODULE: BaseRequestsConnectionModule =
  deepFreeze(RAW_REQUESTS_CONNECTION_MODULE);

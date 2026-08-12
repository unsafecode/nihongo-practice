import { deepFreeze } from "../../foundations/deepFreeze";
import type {
  BaseDialogueTurn,
  BaseExample,
  BaseInterpretationTag,
  BaseLessonContent,
  BaseSynthesisLessonContent,
  BaseValidationCatalogs,
} from "../catalog/types";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  strictTask11ModuleSnapshot,
  validateTask11CorpusDistinctness,
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
  worldFactLedgerFor,
  type BaseSemanticActivityShape,
  type BaseWorldFactRecord,
} from "./module02SentenceFoundations";
import { BASE_SENTENCE_FOUNDATIONS_MODULE } from "./module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_MODULE } from "./module03TopicQuestions";
import {
  BASE_POLITE_VERBS_MODULE,
  TASK11_COMMA,
  buildTask11Lesson,
  task11AnalysisLabel,
  task11ClassAnalysisTarget,
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
  type BaseTask11PredicateKind,
  type BaseTask11TargetSpec,
  type BaseTask11VerbFormKind,
} from "./module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_MODULE } from "./module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_MODULE } from "./module06TimeMovement";
import { BASE_COPULA_ADJECTIVES_MODULE } from "./module07CopulaAdjectives";
import { BASE_EXISTENCE_LOCATION_MODULE } from "./module08ExistenceLocation";
import {
  BASE_REQUESTS_CONNECTION_MODULE,
  BASE_REQUESTS_CONNECTION_VALIDATION_CATALOGS,
} from "./module09RequestsConnection";

export interface BaseSynthesisModule {
  readonly id: "base-synthesis";
  readonly lessons: readonly BaseTask11Lesson[];
  readonly sequence: readonly BaseLessonContent[];
  readonly worldFacts: Readonly<{ readonly scope: "synthesis-review" }>;
  readonly worldFactIds: readonly string[];
  readonly worldFactLedger: readonly BaseWorldFactRecord[];
}

type PredicateForm =
  | "affirmative"
  | "negative"
  | "pastAffirmative"
  | "pastNegative";

const L = task11Lexeme;
const P = task11Particle;

const CELLS = deepFreeze({
  sentenceOmission: "sf2-recoverable-omission",
  topic: "tq1-topic-contrast",
  nounAffirmative: "noun-predicate-affirmative",
  nounNegative: "noun-predicate-negative",
  iAffirmative: "i-adjective-affirmative",
  iNegative: "i-adjective-negative",
  iAttributive: "i-adjective-attributive",
  naAffirmative: "na-adjective-affirmative",
  naNegative: "na-adjective-negative",
  naAttributive: "na-adjective-attributive",
  habitual: "tm1-habitual-nonpast",
  future: "tm1-future-nonpast",
  timeNi: "tm2-specific-time-ni",
  timeBounds: "tm2-time-bounds",
  nonpastAffirmative: "verb-polite-nonpast-affirmative",
  nonpastNegative: "verb-polite-nonpast-negative",
  pastAffirmative: "verb-polite-past-affirmative",
  pastNegative: "verb-polite-past-negative",
  godan: "pv2-godan-class",
  ichidan: "pv2-ichidan-class",
  special: "pv2-special-class",
  existenceAru: "existence-inanimate-aru",
  existenceIru: "existence-animate-iru",
  existenceFrame: "existence-ni-entity-ga",
  existenceActionContrast: "existence-ni-vs-action-de",
  existenceTopicContrast: "existential-ga-vs-topic-wa",
  request: "te-kudasai-request",
  requestResponse: "request-response",
  sequence: "sequential-te-actions",
  sequenceFinal: "sequential-final-polite",
  teImasuOngoing: "te-imasu-ongoing-action",
  teImasuState: "te-imasu-current-state",
});

function predicatePart(
  predicateKind: BaseTask11PredicateKind,
  lexemeId: string,
  form: PredicateForm,
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
  form: PredicateForm,
  cellId: string,
  topicId: string | null = null,
  prefix: readonly BaseTask11Part[] = [],
  extraConceptIds: readonly string[] = [],
): BaseTask11TargetSpec {
  const concepts =
    predicateKind === "noun"
      ? form === "negative"
        ? ["negative-noun-predicate-copula"]
        : form === "pastAffirmative" || form === "pastNegative"
          ? ["remaining-copula-cells"]
          : ["affirmative-desu"]
      : predicateKind === "i-adjective"
        ? ["i-adjective-class", "i-adjective-tense-polarity"]
        : ["na-adjective-class", "na-adjective-predicate-and-attributive"];
  return task11Target(
    [
      ...prefix,
      ...(topicId ? [L(topicId), P("topic-wa", "topic", topicId)] : []),
      predicatePart(predicateKind, lexemeId, form),
    ],
    {
      conceptIds: [...new Set([...concepts, ...extraConceptIds])],
      patternCellIds: [cellId],
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

function relativeTimeTarget(
  timeId: string,
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  cellId: string,
  interpretation: "future" | "habitual" | "past",
): BaseTask11TargetSpec {
  return task11Target(
    [L(timeId), task11VerbForm(lemmaId, form)],
    {
      conceptIds: [
        "sentence-order",
        "relative-time-omission",
        ...(form === "polite-nonpast" || form === "nonpast-negative"
          ? ["dynamic-nonpast-semantics"]
          : ["four-polite-tense-cells"]),
      ],
      patternCellIds: [cellId],
      semanticRoleIds: ["time"],
      interpretationTags: [interpretation],
      predicateSenseId: lemmaId,
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
    },
  );
}

function predicateQuestionTarget(
  predicateKind: BaseTask11PredicateKind,
  lexemeId: string,
  cellId: string,
  extraConceptIds: readonly string[] = [],
): BaseTask11TargetSpec {
  const target = predicateTarget(
    predicateKind,
    lexemeId,
    "affirmative",
    cellId,
    null,
    [],
    extraConceptIds,
  );
  return {
    ...target,
    parts: [...target.parts, P("question-ka", "question", lexemeId)],
    semanticRoleIds: [...target.semanticRoleIds, "question"],
  };
}

function modifierTarget(
  adjectiveKind: "i-adjective" | "na-adjective",
  adjectiveId: string,
  nounId: string,
  cellId: string,
  topicId: string | null = null,
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
      patternCellIds: [cellId],
      semanticRoleIds: topicId ? ["topic"] : [],
      interpretationTags: ["present-state"],
      predicateSenseId: "modified-noun-predicate",
      predicateLexemeId: nounId,
      predicateAspect: "nominal",
    },
  );
}

function possessedTopicPredicate(
  ownerId: string,
  topicId: string,
  predicateKind: "i-adjective" | "na-adjective",
  predicateId: string,
  cellId: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(ownerId),
      P("possessive-attributive-no", "possessor", ownerId),
      L(topicId),
      P("topic-wa", "topic", topicId),
      predicatePart(predicateKind, predicateId, "affirmative"),
    ],
    {
      conceptIds:
        predicateKind === "i-adjective"
          ? ["i-adjective-class", "i-adjective-tense-polarity"]
          : ["na-adjective-class", "na-adjective-predicate-and-attributive"],
      patternCellIds: [cellId],
      semanticRoleIds: ["possessor", "topic"],
      interpretationTags: ["present-state"],
      predicateSenseId: `${predicateKind}-predicate`,
      predicateLexemeId: predicateId,
      predicateAspect: "adjectival",
    },
  );
}

function simpleVerbTarget(
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  cellId: string,
  interpretation: BaseInterpretationTag,
  subjectId: string | null = null,
  prefix: readonly BaseTask11Part[] = [],
  conceptIds: readonly string[] = [],
): BaseTask11TargetSpec {
  return task11Target(
    [
      ...prefix,
      ...(subjectId
        ? [L(subjectId), P("topic-wa", "topic", subjectId)]
        : []),
      task11VerbForm(lemmaId, form),
    ],
    {
      conceptIds,
      patternCellIds: [cellId],
      semanticRoleIds: subjectId ? ["topic"] : [],
      interpretationTags: [interpretation],
      predicateSenseId: lemmaId,
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
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
  cellId: string,
  interpretation: BaseInterpretationTag,
  prefix: readonly BaseTask11Part[] = [],
  conceptIds: readonly string[] = [],
): BaseTask11TargetSpec {
  const predicateSenseId = themeSense(lemmaId);
  return task11Target(
    [
      ...prefix,
      L(objectId),
      P("object-o", "theme", objectId),
      task11VerbForm(lemmaId, form),
    ],
    {
      conceptIds,
      patternCellIds: [cellId],
      semanticRoleIds: ["theme"],
      interpretationTags: [interpretation],
      predicateSenseId,
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId,
        provided: { theme: "object-o" },
        attachmentLexemeIdByRole: { theme: objectId },
      },
    },
  );
}

function actionTimeTarget(
  subjectId: string | null,
  timeId: string,
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  cellId: string,
  interpretation: BaseInterpretationTag,
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  return task11Target(
    [
      ...prefix,
      ...(subjectId
        ? [L(subjectId), P("topic-wa", "topic", subjectId)]
        : []),
      L(timeId),
      P("time-ni", "time", timeId),
      task11VerbForm(lemmaId, form),
    ],
    {
      conceptIds: [
        "time-ni",
        ...(form === "polite-nonpast" || form === "nonpast-negative"
          ? ["dynamic-nonpast-semantics"]
          : ["four-polite-tense-cells"]),
      ],
      patternCellIds: [cellId],
      semanticRoleIds: [
        ...(subjectId ? (["topic"] as const) : []),
        "time" as const,
      ],
      interpretationTags: [interpretation],
      predicateSenseId: "action-time",
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "action-time",
        provided: {
          ...(subjectId ? { topic: "topic-wa" } : {}),
          time: "time-ni",
        },
        attachmentLexemeIdByRole: {
          ...(subjectId ? { topic: subjectId } : {}),
          time: timeId,
        },
      },
    },
  );
}

function timeBoundsTarget(
  subjectId: string | null,
  sourceId: string,
  limitId: string,
  form: BaseTask11VerbFormKind = "polite-nonpast",
): BaseTask11TargetSpec {
  return task11Target(
    [
      ...(subjectId
        ? [L(subjectId), P("topic-wa", "topic", subjectId)]
        : []),
      L(sourceId),
      P("source-kara", "source", sourceId),
      L(limitId),
      P("limit-made", "limit", limitId),
      task11VerbForm("verb-benkyou-suru", form),
    ],
    {
      conceptIds: ["source-kara", "limit-made", "dynamic-nonpast-semantics"],
      patternCellIds: [CELLS.timeBounds],
      semanticRoleIds: [
        ...(subjectId ? (["topic"] as const) : []),
        "time" as const,
        "source" as const,
        "limit" as const,
      ],
      interpretationTags: ["future"],
      predicateSenseId: "time-bounds",
      predicateLexemeId: "verb-benkyou-suru",
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "time-bounds",
        provided: {
          ...(subjectId ? { topic: "topic-wa" } : {}),
          source: "source-kara",
          limit: "limit-made",
        },
        attachmentLexemeIdByRole: {
          ...(subjectId ? { topic: subjectId } : {}),
          source: sourceId,
          limit: limitId,
        },
      },
    },
  );
}

function goTimeGoalQuestion(
  relativeTimeId: string,
  timeId: string,
  goalId: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(relativeTimeId),
      L(timeId),
      P("time-ni", "time", timeId),
      L(goalId),
      P("goal-ni", "goal", goalId),
      task11VerbForm("verb-iku", "polite-nonpast"),
      P("question-ka", "question", "verb-iku"),
    ],
    {
      conceptIds: [
        "time-ni",
        "goal-ni",
        "dynamic-nonpast-semantics",
        "relative-time-omission",
      ],
      patternCellIds: [CELLS.timeNi],
      semanticRoleIds: ["time", "goal", "question"],
      interpretationTags: ["future"],
      predicateSenseId: "go-time-goal",
      predicateLexemeId: "verb-iku",
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "go-time-goal",
        provided: {
          time: "time-ni",
          goal: "goal-ni",
          question: "question-ka",
        },
        attachmentLexemeIdByRole: {
          time: timeId,
          goal: goalId,
          question: "verb-iku",
        },
      },
    },
  );
}

function fullExistence(
  placeId: string,
  entityId: string,
  verbId: "verb-aru" | "verb-iru",
  cellId = CELLS.existenceFrame,
): BaseTask11TargetSpec {
  const predicateSenseId = verbId === "verb-aru" ? "aru" : "iru";
  return task11Target(
    [
      L(placeId),
      P("existence-location-ni", "existence-location", placeId),
      L(entityId),
      P("existential-subject-ga", "existential-subject", entityId),
      task11VerbForm(verbId, "polite-nonpast"),
    ],
    {
      conceptIds: [
        "sentence-order",
        verbId === "verb-aru" ? "aru-existence" : "iru-existence",
        "existence-location-frame",
        "base-particle-existence-ni",
        "base-particle-existential-ga",
      ],
      patternCellIds: [cellId],
      semanticRoleIds: ["existence-location", "existential-subject"],
      interpretationTags: ["present-state"],
      predicateSenseId,
      predicateLexemeId: verbId,
      predicateAspect: "stative",
      particleFrame: {
        predicateSenseId,
        provided: {
          "existence-location": "existence-location-ni",
          "existential-subject": "existential-subject-ga",
        },
        attachmentLexemeIdByRole: {
          "existence-location": placeId,
          "existential-subject": entityId,
        },
      },
    },
  );
}

function topicLocation(
  entityId: string,
  placeId: string,
  verbId: "verb-aru" | "verb-iru",
): BaseTask11TargetSpec {
  const predicateSenseId =
    verbId === "verb-aru" ? "aru-topic-location" : "iru-topic-location";
  return task11Target(
    [
      L(entityId),
      P("topic-wa", "topic", entityId),
      L(placeId),
      P("existence-location-ni", "existence-location", placeId),
      task11VerbForm(verbId, "polite-nonpast"),
    ],
    {
      conceptIds: [
        verbId === "verb-aru" ? "aru-existence" : "iru-existence",
        "existence-location-frame",
        "base-particle-existence-ni",
        "existential-ga-vs-topic-wa",
      ],
      patternCellIds: [CELLS.existenceTopicContrast],
      semanticRoleIds: ["topic", "existence-location"],
      interpretationTags: ["present-state"],
      predicateSenseId,
      predicateLexemeId: verbId,
      predicateAspect: "stative",
      particleFrame: {
        predicateSenseId,
        provided: {
          topic: "topic-wa",
          "existence-location": "existence-location-ni",
        },
        attachmentLexemeIdByRole: {
          topic: entityId,
          "existence-location": placeId,
        },
      },
    },
  );
}

function whereQuestion(
  entityId: string,
  verbId: "verb-aru" | "verb-iru",
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  const target = topicLocation(entityId, "noun-doko", verbId);
  if (!target.particleFrame) return target;
  return {
    ...target,
    parts: [
      ...prefix,
      ...target.parts,
      P("question-ka", "question", verbId),
    ],
    semanticRoleIds: [...target.semanticRoleIds, "question"],
    particleFrame: {
      ...target.particleFrame,
      provided: {
        ...target.particleFrame.provided,
        question: "question-ka" as const,
      },
      attachmentLexemeIdByRole: {
        ...target.particleFrame.attachmentLexemeIdByRole,
        question: verbId,
      },
    },
  };
}

function goalTarget(
  placeId: string,
  lemmaId: "verb-iku" | "verb-kuru" | "verb-kaeru",
  form: BaseTask11VerbFormKind,
  interpretation: "future" | "habitual" | "past",
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  const predicateSenseId =
    lemmaId === "verb-iku"
      ? "go-goal"
      : lemmaId === "verb-kuru"
        ? "come-goal"
        : "return-goal";
  return task11Target(
    [
      ...prefix,
      L(placeId),
      P("goal-ni", "goal", placeId),
      task11VerbForm(lemmaId, form),
    ],
    {
      conceptIds: [
        "goal-ni",
        ...(form === "polite-nonpast" || form === "nonpast-negative"
          ? ["dynamic-nonpast-semantics"]
          : ["four-polite-tense-cells"]),
      ],
      patternCellIds: [
        form === "past-affirmative"
          ? CELLS.pastAffirmative
          : form === "past-negative"
            ? CELLS.pastNegative
            : interpretation === "habitual"
              ? CELLS.habitual
              : CELLS.future,
      ],
      semanticRoleIds: ["goal"],
      interpretationTags: [interpretation],
      predicateSenseId,
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId,
        provided: { goal: "goal-ni" },
        attachmentLexemeIdByRole: { goal: placeId },
      },
    },
  );
}

function asQuestion(
  target: BaseTask11TargetSpec,
  predicateLexemeId: string,
): BaseTask11TargetSpec {
  const particleFrame: BaseTask11TargetSpec["particleFrame"] = target.particleFrame
    ? {
        ...target.particleFrame,
        provided: {
          ...target.particleFrame.provided,
          question: "question-ka",
        },
        attachmentLexemeIdByRole: {
          ...target.particleFrame.attachmentLexemeIdByRole,
          question: predicateLexemeId,
        },
      }
    : undefined;
  return {
    ...target,
    parts: [
      ...target.parts,
      P("question-ka", "question", predicateLexemeId),
    ],
    semanticRoleIds: [...target.semanticRoleIds, "question"],
    ...(particleFrame ? { particleFrame } : {}),
  };
}

function withPrefix(
  target: BaseTask11TargetSpec,
  prefix: readonly BaseTask11Part[],
): BaseTask11TargetSpec {
  return { ...target, parts: [...prefix, ...target.parts] };
}

function actionPlace(
  placeId: string,
  verbId: "verb-asobu" | "verb-benkyou-suru" | "verb-hataraku",
  predicateSenseId: "play-place" | "study-place" | "work-place",
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(placeId),
      P("action-place-de", "action-place", placeId),
      task11VerbForm(verbId, "polite-nonpast"),
    ],
    {
      conceptIds: ["action-place-de", "existence-vs-action-location"],
      patternCellIds: [CELLS.existenceActionContrast],
      semanticRoleIds: ["action-place"],
      interpretationTags: ["habitual"],
      predicateSenseId,
      predicateLexemeId: verbId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId,
        provided: { "action-place": "action-place-de" },
        attachmentLexemeIdByRole: { "action-place": placeId },
      },
    },
  );
}

function requestTarget(
  objectId: string,
  lemmaId: string,
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  return objectVerbTarget(
    objectId,
    lemmaId,
    "te-request",
    CELLS.request,
    "future",
    prefix,
    ["base-construction-te-kudasai"],
  );
}

function sequenceTarget(
  firstLemmaId: string,
  finalLemmaId: string,
  activityCellId?: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      task11VerbForm(firstLemmaId, "te-sequence"),
      TASK11_COMMA,
      task11VerbForm(finalLemmaId, "polite-nonpast"),
    ],
    {
      conceptIds: ["base-construction-sequential-te"],
      patternCellIds: activityCellId
        ? [activityCellId]
        : [CELLS.sequence, CELLS.sequenceFinal],
      semanticRoleIds: [],
      interpretationTags: ["future"],
      predicateSenseId: finalLemmaId,
      predicateLexemeId: finalLemmaId,
      predicateAspect: "dynamic",
    },
  );
}

function reversedSequenceTarget(
  firstLemmaId: string,
  finalLemmaId: string,
  activityCellId: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      task11VerbForm(finalLemmaId, "polite-nonpast"),
      TASK11_COMMA,
      task11VerbForm(firstLemmaId, "te-sequence"),
    ],
    {
      conceptIds: ["base-construction-sequential-te"],
      patternCellIds: [activityCellId],
      semanticRoleIds: [],
      interpretationTags: ["future"],
      predicateSenseId: finalLemmaId,
      predicateLexemeId: finalLemmaId,
      predicateAspect: "dynamic",
    },
  );
}

function anchoredTeImasu(
  subjectId: string,
  lemmaId: string,
  interpretation: "ongoing-now" | "resulting-state",
  goalId: string | null = null,
): BaseTask11TargetSpec {
  if (goalId) {
    return task11Target(
      [
        L(subjectId),
        P("topic-wa", "topic", subjectId),
        L(goalId),
        P("goal-ni", "goal", goalId),
        task11VerbForm(lemmaId, "te-imasu"),
      ],
      {
        conceptIds: ["base-construction-te-imasu"],
        patternCellIds: [CELLS.teImasuState],
        semanticRoleIds: ["topic", "goal"],
        interpretationTags: [interpretation],
        predicateSenseId: "sit-current-state",
        predicateLexemeId: lemmaId,
        predicateAspect: "stative",
        particleFrame: {
          predicateSenseId: "sit-current-state",
          provided: { topic: "topic-wa", goal: "goal-ni" },
          attachmentLexemeIdByRole: { topic: subjectId, goal: goalId },
        },
      },
    );
  }
  return task11Target(
    [
      L(subjectId),
      P("topic-wa", "topic", subjectId),
      L("noun-ima"),
      task11VerbForm(lemmaId, "te-imasu"),
    ],
    {
      conceptIds: ["base-construction-te-imasu", "relative-time-omission"],
      patternCellIds: [CELLS.teImasuOngoing],
      semanticRoleIds: ["topic", "time"],
      interpretationTags: [interpretation],
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
    en,
    it,
    purposeEn,
    purposeIt,
    semanticTag,
    utteranceKind,
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
  utteranceKind: NonNullable<BaseDialogueTurn["utteranceKind"]> =
    "complete-clause",
): BaseTask11DialogueTurnSpec {
  return {
    speakerId,
    target,
    frame,
    en,
    it,
    purposeEn,
    purposeIt,
    utteranceKind,
  };
}

function act(
  lessonId: string,
  index: number,
  prompt: BaseTask11TargetSpec,
  answer: BaseTask11TargetSpec,
  distractor: BaseTask11TargetSpec,
  correctOptionIndex: 0 | 1,
  cellId: string,
  shape: BaseSemanticActivityShape,
  evidence: Readonly<{
    readonly contrastAxis?: BaseTask11ContrastAxis;
    readonly errorCode?: string;
    readonly errorDefectAxis?: string;
  }> = {},
): BaseTask11ActivitySpec {
  return {
    prompt,
    answer,
    distractor,
    correctOptionIndex,
    promptContextCopyId: `${lessonId}-activity-${index}-instruction`,
    patternCellId: cellId,
    shape,
    referentId: null,
    worldFactId: null,
    errorCode: evidence.errorCode ?? null,
    contrastAxis: evidence.contrastAxis,
    errorDefectAxis: evidence.errorDefectAxis,
  };
}

function errorTarget(
  lemmaId: string,
  kana: string,
  romaji: string,
  errorCode: string,
): BaseTask11TargetSpec {
  return task11Target(
    [task11DiagnosticForm(lemmaId, kana, romaji, errorCode)],
    {
      conceptIds: ["four-polite-tense-cells"],
      patternCellIds: [],
      semanticRoleIds: [],
      interpretationTags: ["past"],
      predicateSenseId: lemmaId,
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
    },
  );
}

const SYNTHESIS_1: BaseTask11LessonSpec = {
  lessonId: "base-synthesis-1",
  contract: "synthesis",
  prerequisiteLessonIds: ["requests-connection-4"],
  newLexemeIds: [],
  reviewLexemeIds: [
    "adjective-takai",
    "adjective-oishii",
    "adjective-shizuka",
    "adjective-kirei",
    "adjective-yuumei",
    "adjective-genki",
    "noun-kaishain",
    "noun-kenkyuusha",
    "noun-ryourinin",
    "noun-enjinia",
    "noun-ginkouin",
    "noun-koumuin",
  ],
  introducedConceptIds: [],
  reviewedConceptIds: [
    "sentence-order",
    "sentence-omission",
    "topic-wa",
    "possessive-no",
    "affirmative-desu",
    "negative-noun-predicate-copula",
    "i-adjective-class",
    "i-adjective-tense-polarity",
    "na-adjective-class",
    "na-adjective-predicate-and-attributive",
    "aru-existence",
    "iru-existence",
    "existence-location-frame",
  ],
  patternCellIds: [
    CELLS.sentenceOmission,
    CELLS.topic,
    CELLS.nounAffirmative,
    CELLS.nounNegative,
    CELLS.iAffirmative,
    CELLS.iNegative,
    CELLS.iAttributive,
    CELLS.naAffirmative,
    CELLS.naNegative,
    CELLS.naAttributive,
    CELLS.existenceFrame,
    CELLS.existenceTopicContrast,
    CELLS.pastAffirmative,
  ],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "reference-adjective-grid",
  ],
  retrievedSystemIds: [
    "sentence-anatomy",
    "particle-atlas",
    "adjective-copula",
    "existence-location",
  ],
  examples: [
    ex(
      modifierTarget(
        "na-adjective",
        "adjective-yuumei",
        "noun-kenkyuusha",
        CELLS.naAffirmative,
        "noun-tanaka",
      ),
      "known-researcher",
      "Tanaka is a famous researcher.",
      "Tanaka è un ricercatore famoso.",
      "Keeps the topic once, then places な before the profession.",
      "Mantiene il tema una volta e colloca な prima della professione.",
      "identity-famous-researcher",
    ),
    ex(
      modifierTarget(
        "na-adjective",
        "adjective-genki",
        "noun-enjinia",
        CELLS.naAffirmative,
        "noun-suzuki",
      ),
      "engineer-description",
      "Suzuki is an energetic engineer.",
      "Suzuki è un ingegnere pieno di energia.",
      "Combines a stable topic with a な-adjective noun description.",
      "Combina un tema stabile con una descrizione nominale in な.",
      "identity-energetic-engineer",
    ),
    ex(
      modifierTarget(
        "na-adjective",
        "adjective-shizuka",
        "noun-ryourinin",
        CELLS.naAttributive,
        "noun-yamada",
      ),
      "cook-description",
      "Yamada is a quiet cook.",
      "Yamada è un cuoco tranquillo.",
      "Uses one coherent description rather than repeating a pronoun.",
      "Usa una descrizione coerente senza ripetere un pronome.",
      "identity-quiet-cook",
    ),
    ex(
      modifierTarget(
        "na-adjective",
        "adjective-kirei",
        "noun-ginkouin",
        CELLS.naAttributive,
        "noun-mari",
      ),
      "bank-clerk-description",
      "Mari is a smartly presented bank clerk.",
      "Mari è un'impiegata di banca dall'aspetto curato.",
      "Reviews attributive な inside an identity statement.",
      "Ripassa な attributivo in una frase d'identità.",
      "identity-presentable-clerk",
    ),
    ex(
      modifierTarget(
        "i-adjective",
        "adjective-takai",
        "noun-tsukue",
        CELLS.iAttributive,
      ),
      "office-furniture",
      "It is an expensive desk.",
      "È una scrivania costosa.",
      "Places an い-adjective directly before its noun.",
      "Colloca un aggettivo in い direttamente prima del nome.",
      "description-expensive-desk",
    ),
    ex(
      possessedTopicPredicate(
        "noun-kaishain",
        "noun-hirugohan",
        "i-adjective",
        "adjective-oishii",
        CELLS.iAffirmative,
      ),
      "employee-lunch",
      "The company employee's lunch is tasty.",
      "Il pranzo dell'impiegato è gustoso.",
      "Maintains the possessed lunch as the topic of the evaluation.",
      "Mantiene il pranzo posseduto come tema della valutazione.",
      "description-tasty-lunch",
    ),
    ex(
      fullExistence("noun-uchi", "noun-isu", "verb-aru"),
      "room-inventory",
      "There is a chair in the house.",
      "Nella casa c'è una sedia.",
      "Reviews an inanimate existence frame within a description.",
      "Ripassa una struttura di esistenza inanimata nella descrizione.",
      "room-chair-existence",
    ),
    ex(
      fullExistence("noun-jimusho", "noun-hana", "verb-aru"),
      "garden-inventory",
      "There is a flower in the office.",
      "Nell'ufficio c'è un fiore.",
      "Keeps place に and existential が in their established roles.",
      "Mantiene に di luogo e が esistenziale nei ruoli già appresi.",
      "garden-flower-existence",
    ),
    ex(
      predicateTarget(
        "noun",
        "noun-koumuin",
        "affirmative",
        CELLS.nounAffirmative,
        "noun-satou",
      ),
      "civil-servant-identity",
      "Satou is a civil servant.",
      "Satou è un dipendente pubblico.",
      "Reviews a direct noun-predicate identity.",
      "Ripassa un'identità diretta con predicato nominale.",
      "identity-civil-servant",
    ),
  ],
  activities: [
    act(
      "base-synthesis-1",
      1,
      task11Cue(
        L("noun-kodomo"),
        TASK11_COMMA,
        L("noun-inu"),
        TASK11_COMMA,
        L("name-mika"),
        TASK11_COMMA,
        L("name-sora"),
        TASK11_COMMA,
        L("name-haru"),
        TASK11_COMMA,
        L("name-ai"),
      ),
      predicateTarget(
        "na-adjective",
        "adjective-genki",
        "affirmative",
        CELLS.naAffirmative,
        "noun-kodomo",
      ),
      predicateTarget(
        "na-adjective",
        "adjective-genki",
        "negative",
        CELLS.naAffirmative,
        "noun-kodomo",
      ),
      1,
      CELLS.naAffirmative,
      BASE_MEANING_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-1",
      2,
      task11Cue(
        L("noun-kuruma"),
        TASK11_COMMA,
        L("noun-kaban"),
        TASK11_COMMA,
        L("noun-nihon"),
        TASK11_COMMA,
        L("noun-chuugoku"),
        TASK11_COMMA,
        L("noun-kuni"),
        TASK11_COMMA,
        L("noun-toshi"),
      ),
      predicateTarget(
        "i-adjective",
        "adjective-takai",
        "negative",
        CELLS.iAffirmative,
        "noun-kuruma",
      ),
      predicateTarget(
        "i-adjective",
        "adjective-takai",
        "affirmative",
        CELLS.iAffirmative,
        "noun-kuruma",
      ),
      1,
      CELLS.iAffirmative,
      BASE_FORM_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-1",
      3,
      task11Cue(
        L("noun-uchi"),
        TASK11_COMMA,
        L("noun-kyoushitsu"),
        TASK11_COMMA,
        L("noun-chichi"),
        TASK11_COMMA,
        L("noun-haha"),
        TASK11_COMMA,
        L("noun-otousan"),
        TASK11_COMMA,
        L("noun-okaasan"),
      ),
      modifierTarget(
        "na-adjective",
        "adjective-shizuka",
        "noun-enjinia",
        CELLS.naAttributive,
        "noun-satou",
      ),
      {
        ...modifierTarget(
          "na-adjective",
          "adjective-shizuka",
          "noun-enjinia",
          CELLS.naAttributive,
          "noun-satou",
        ),
        parts: [
          L("noun-satou"),
          P("topic-wa", "topic", "noun-satou"),
          predicatePart("noun", "noun-enjinia", "affirmative"),
          naAttributive("adjective-shizuka"),
        ],
      },
      0,
      CELLS.naAttributive,
      BASE_ORDERING_ACTIVITY_SHAPE,
      { contrastAxis: "word-order" },
    ),
    act(
      "base-synthesis-1",
      4,
      task11Cue(
        L("noun-uketsuke"),
        TASK11_COMMA,
        L("noun-jimusho"),
        TASK11_COMMA,
        L("name-sakura"),
        TASK11_COMMA,
        L("name-ken"),
        TASK11_COMMA,
        L("noun-namae"),
      ),
      predicateTarget(
        "noun",
        "noun-koumuin",
        "affirmative",
        CELLS.nounAffirmative,
        "noun-keisatsukan",
      ),
      predicateTarget(
        "noun",
        "noun-koumuin",
        "negative",
        CELLS.nounAffirmative,
        "noun-keisatsukan",
      ),
      1,
      CELLS.nounAffirmative,
      BASE_CONTROLLED_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-1",
      5,
      task11Cue(
        L("noun-toire"),
        TASK11_COMMA,
        L("noun-konbini"),
        TASK11_COMMA,
        L("noun-dare"),
        TASK11_COMMA,
        L("noun-nan"),
        TASK11_COMMA,
        L("expression-sou"),
      ),
      simpleVerbTarget(
        "verb-kaku",
        "past-affirmative",
        CELLS.pastAffirmative,
        "past",
      ),
      errorTarget(
        "verb-kaku",
        "かきますた",
        "kakimasuta",
        "synthesis-past-suffix",
      ),
      0,
      CELLS.pastAffirmative,
      BASE_ERROR_ACTIVITY_SHAPE,
      {
        contrastAxis: "polite-form",
        errorCode: "synthesis-past-suffix",
        errorDefectAxis: "form",
      },
    ),
    act(
      "base-synthesis-1",
      6,
      task11Cue(
        L("noun-basutei"),
        TASK11_COMMA,
        L("noun-doko"),
        TASK11_COMMA,
        L("anchor-kyaku"),
        TASK11_COMMA,
        L("anchor-chuui"),
      ),
      topicLocation("noun-chizu", "noun-eki", "verb-aru"),
      fullExistence("noun-eki", "noun-chizu", "verb-aru"),
      1,
      CELLS.existenceTopicContrast,
      BASE_CONTEXT_ACTIVITY_SHAPE,
      { contrastAxis: "information-structure" },
    ),
    act(
      "base-synthesis-1",
      7,
      task11Cue(
        L("expression-hai"),
        TASK11_COMMA,
        L("adjective-takai"),
        TASK11_COMMA,
        L("adjective-oishii"),
        TASK11_COMMA,
        L("adjective-shizuka"),
        TASK11_COMMA,
        L("verb-denwa-suru"),
        TASK11_COMMA,
        L("verb-sanpo-suru"),
        TASK11_COMMA,
        L("verb-neru"),
        TASK11_COMMA,
        L("adjective-kirei"),
        TASK11_COMMA,
        L("adjective-yuumei"),
        TASK11_COMMA,
        L("adjective-genki"),
        TASK11_COMMA,
        L("adjective-ii"),
      ),
      predicateTarget(
        "na-adjective",
        "adjective-genki",
        "affirmative",
        CELLS.naAffirmative,
        "noun-yuki",
      ),
      predicateTarget(
        "na-adjective",
        "adjective-genki",
        "negative",
        CELLS.naAffirmative,
        "noun-yuki",
      ),
      0,
      CELLS.naAffirmative,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-1",
      8,
      task11Cue(
        L("noun-kaishain"),
        TASK11_COMMA,
        L("noun-kenkyuusha"),
        TASK11_COMMA,
        L("noun-ryourinin"),
        TASK11_COMMA,
        L("noun-enjinia"),
        TASK11_COMMA,
        L("noun-ginkouin"),
        TASK11_COMMA,
        L("noun-koumuin"),
        TASK11_COMMA,
        L("noun-sakana"),
      ),
      fullExistence(
        "noun-jimusho",
        "noun-kaishain",
        "verb-iru",
        CELLS.existenceTopicContrast,
      ),
      topicLocation("noun-kaishain", "noun-jimusho", "verb-iru"),
      1,
      CELLS.existenceTopicContrast,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "information-structure" },
    ),
    act(
      "base-synthesis-1",
      9,
      task11Cue(task11AnalysisLabel("analysis-pair")),
      predicateTarget(
        "i-adjective",
        "adjective-oishii",
        "negative",
        CELLS.iAffirmative,
        "noun-sakana",
      ),
      predicateTarget(
        "i-adjective",
        "adjective-oishii",
        "affirmative",
        CELLS.iAffirmative,
        "noun-sakana",
      ),
      0,
      CELLS.iAffirmative,
      BASE_LISTENING_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-1",
      10,
      task11Cue(L("noun-ekiin"), TASK11_COMMA, L("noun-ginkouin")),
      predicateTarget(
        "noun",
        "noun-ginkouin",
        "affirmative",
        CELLS.nounAffirmative,
        "noun-ekiin",
      ),
      predicateTarget(
        "noun",
        "noun-ginkouin",
        "negative",
        CELLS.nounAffirmative,
        "noun-ekiin",
      ),
      1,
      CELLS.nounAffirmative,
      BASE_SPOKEN_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
  ],
  dialogue: [
    turn(
      "partner",
      modifierTarget(
        "na-adjective",
        "adjective-shizuka",
        "noun-kenkyuusha",
        CELLS.naAttributive,
        "noun-tanaka",
      ),
      "introduce-tanaka",
      "Tanaka is a quiet researcher.",
      "Tanaka è un ricercatore tranquillo.",
      "Establishes Tanaka as the single topic.",
      "Stabilisce Tanaka come unico tema.",
    ),
    turn(
      "learner",
      predicateQuestionTarget(
        "na-adjective",
        "adjective-genki",
        CELLS.sentenceOmission,
        ["sentence-omission"],
      ),
      "ask-omitted-topic",
      "Is he well?",
      "Sta bene?",
      "Omits only the already established person.",
      "Omette soltanto la persona già stabilita.",
      "complete-clause",
    ),
    turn(
      "partner",
      predicateTarget(
        "na-adjective",
        "adjective-genki",
        "affirmative",
        CELLS.sentenceOmission,
        null,
        [L("expression-hai"), TASK11_COMMA],
        ["sentence-omission"],
      ),
      "confirm-omitted-topic",
      "Yes, he is well.",
      "Sì, sta bene.",
      "Continues the same recoverable topic naturally.",
      "Continua naturalmente lo stesso tema recuperabile.",
    ),
    turn(
      "learner",
      predicateQuestionTarget(
        "noun",
        "noun-enjinia",
        CELLS.sentenceOmission,
        ["sentence-omission"],
      ),
      "ask-profession",
      "Is he an engineer?",
      "È un ingegnere?",
      "Asks a second property without adding an unclear referent.",
      "Chiede una seconda proprietà senza introdurre un referente ambiguo.",
    ),
    turn(
      "partner",
      predicateTarget(
        "noun",
        "noun-kenkyuusha",
        "affirmative",
        CELLS.sentenceOmission,
        null,
        [L("expression-iie"), TASK11_COMMA],
        ["sentence-omission"],
      ),
      "correct-profession",
      "No, he is a researcher.",
      "No, è un ricercatore.",
      "Answers while retaining the same recoverable omitted topic.",
      "Risponde mantenendo lo stesso tema omesso e recuperabile.",
    ),
    turn(
      "learner",
      predicateTarget(
        "na-adjective",
        "adjective-yuumei",
        "affirmative",
        CELLS.sentenceOmission,
        null,
        [],
        ["sentence-omission"],
      ),
      "close-description",
      "He is famous.",
      "È famoso.",
      "Closes the coherent description chain without a repeated pronoun.",
      "Chiude la catena descrittiva coerente senza ripetere il pronome.",
    ),
  ],
};

const SYNTHESIS_2: BaseTask11LessonSpec = {
  lessonId: "base-synthesis-2",
  contract: "synthesis",
  prerequisiteLessonIds: ["base-synthesis-1"],
  newLexemeIds: [],
  reviewLexemeIds: [
    "verb-kaku",
    "verb-yomu",
    "verb-benkyou-suru",
    "verb-akeru",
    "verb-shimeru",
    "verb-toru",
    "verb-kesu",
    "noun-shichiji",
    "verb-iku",
    "verb-motte-kuru",
    "verb-miseru",
    "noun-shorui",
  ],
  introducedConceptIds: [],
  reviewedConceptIds: [
    "sentence-order",
    "topic-wa",
    "time-ni",
    "source-kara",
    "limit-made",
    "dynamic-nonpast-semantics",
    "four-polite-tense-cells",
    "godan-verb-class",
    "ichidan-verb-class",
    "suru-verb-class",
    "kuru-verb-class",
    "masu-nonpast",
    "base-construction-sequential-te",
    "base-construction-te-kudasai",
  ],
  patternCellIds: [
    CELLS.habitual,
    CELLS.future,
    CELLS.timeNi,
    CELLS.timeBounds,
    CELLS.nonpastAffirmative,
    CELLS.nonpastNegative,
    CELLS.pastAffirmative,
    CELLS.pastNegative,
    CELLS.godan,
    CELLS.ichidan,
    CELLS.special,
    CELLS.request,
    CELLS.requestResponse,
    CELLS.sequence,
    CELLS.sequenceFinal,
  ],
  referenceSnapshotIds: [
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  retrievedSystemIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(
      relativeTimeTarget(
        "noun-ashita",
        "verb-kaku",
        "polite-nonpast",
        CELLS.nonpastAffirmative,
        "future",
      ),
      "future-writing",
      "Tomorrow, I will write.",
      "Domani scriverò.",
      "Uses dynamic nonpast only for a future event.",
      "Usa il non-passato dinamico soltanto per un evento futuro.",
      "four-cell-nonpast-affirmative",
    ),
    ex(
      relativeTimeTarget(
        "noun-fudan",
        "verb-kaku",
        "nonpast-negative",
        CELLS.nonpastNegative,
        "habitual",
      ),
      "habitual-negative-writing",
      "I do not usually write.",
      "Di solito non scrivo.",
      "Uses dynamic nonpast negative for a habitual pattern.",
      "Usa il non-passato negativo dinamico per un'abitudine.",
      "four-cell-nonpast-negative",
    ),
    ex(
      relativeTimeTarget(
        "noun-kinou",
        "verb-kaku",
        "past-affirmative",
        CELLS.pastAffirmative,
        "past",
      ),
      "past-writing",
      "Yesterday, I wrote.",
      "Ieri ho scritto.",
      "Retrieves the polite past affirmative cell.",
      "Recupera la cella cortese passata affermativa.",
      "four-cell-past-affirmative",
    ),
    ex(
      relativeTimeTarget(
        "noun-senshuu",
        "verb-kaku",
        "past-negative",
        CELLS.pastNegative,
        "past",
      ),
      "past-negative-writing",
      "Last week, I did not write.",
      "La settimana scorsa non ho scritto.",
      "Completes the four-cell set with polite past negative.",
      "Completa le quattro celle con il passato negativo cortese.",
      "four-cell-past-negative",
    ),
    ex(
      actionTimeTarget(
        "noun-ryourinin",
        "noun-kuji",
        "verb-yomu",
        "polite-nonpast",
        CELLS.timeNi,
        "future",
      ),
      "specific-time-plan",
      "The cook will read at nine.",
      "Il cuoco leggerà alle nove.",
      "Attaches に only to the specific clock time.",
      "Collega に soltanto all'ora specifica.",
      "specific-time-future",
    ),
    ex(
      timeBoundsTarget(
        "noun-kaishain",
        "noun-shichiji",
        "noun-kuji",
      ),
      "bounded-study-plan",
      "The company employee will study from seven until nine.",
      "L'impiegato studierà dalle sette alle nove.",
      "Keeps から and まで as the two limits of one plan.",
      "Mantiene から e まで come i due limiti di un unico piano.",
      "time-bounds-future",
    ),
    ex(
      sequenceTarget("verb-akeru", "verb-shimeru"),
      "open-then-close",
      "I will open it and then close it.",
      "Lo aprirò e poi lo chiuderò.",
      "Connects two planned actions with bounded sequential て.",
      "Collega due azioni programmate con て sequenziale circoscritto.",
      "plan-open-close",
    ),
    ex(
      objectVerbTarget(
        "noun-shorui",
        "verb-toru",
        "polite-nonpast",
        CELLS.future,
        "future",
      ),
      "take-documents",
      "I will take the documents.",
      "Prenderò i documenti.",
      "Keeps the document argument visibly licensed by を.",
      "Mantiene l'argomento dei documenti visibilmente autorizzato da を.",
      "plan-take-documents",
    ),
    ex(
      actionTimeTarget(
        "noun-yamada",
        "noun-shichiji",
        "verb-yomu",
        "polite-nonpast",
        CELLS.habitual,
        "habitual",
      ),
      "known-office-routine",
      "Yamada reads at seven.",
      "Yamada legge alle sette.",
      "Retrieves a godan polite nonpast form in a habitual time frame.",
      "Recupera una forma cortese non-passata godan in un contesto abituale.",
      "routine-reading",
    ),
    ex(
      objectVerbTarget(
        "noun-namae",
        "verb-kesu",
        "polite-nonpast",
        CELLS.future,
        "future",
      ),
      "remove-name",
      "I will remove the name.",
      "Cancellerò il nome.",
      "Keeps the item being removed explicit with を.",
      "Mantiene esplicito con を l'elemento da cancellare.",
      "plan-remove-name",
    ),
  ],
  activities: [
    act(
      "base-synthesis-2",
      1,
      task11Cue(
        L("adjective-takai"),
        TASK11_COMMA,
        L("adjective-oishii"),
        TASK11_COMMA,
        L("adjective-shizuka"),
      ),
      simpleVerbTarget(
        "verb-miseru",
        "polite-nonpast",
        CELLS.future,
        "future",
        "noun-kenkyuusha",
        [],
        ["dynamic-nonpast-semantics"],
      ),
      simpleVerbTarget(
        "verb-miseru",
        "past-affirmative",
        CELLS.future,
        "past",
        "noun-kenkyuusha",
        [],
        ["four-polite-tense-cells"],
      ),
      1,
      CELLS.future,
      BASE_MEANING_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      2,
      task11Cue(
        L("adjective-kirei"),
        TASK11_COMMA,
        L("adjective-yuumei"),
        TASK11_COMMA,
        L("adjective-genki"),
        TASK11_COMMA,
        L("verb-shinu"),
        TASK11_COMMA,
        L("verb-kiku"),
        TASK11_COMMA,
        L("verb-tsukuru"),
        TASK11_COMMA,
        L("verb-hashiru"),
      ),
      simpleVerbTarget(
        "verb-shinu",
        "nonpast-negative",
        CELLS.nonpastNegative,
        "future",
      ),
      simpleVerbTarget(
        "verb-shinu",
        "past-negative",
        CELLS.nonpastNegative,
        "past",
      ),
      1,
      CELLS.nonpastNegative,
      BASE_FORM_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      3,
      task11Cue(
        L("noun-ryourinin"),
        TASK11_COMMA,
        L("noun-enjinia"),
        TASK11_COMMA,
        L("verb-kiru"),
        TASK11_COMMA,
        L("verb-suwaru"),
        TASK11_COMMA,
        L("verb-au"),
        TASK11_COMMA,
        L("verb-utau"),
        TASK11_COMMA,
        L("verb-noru"),
      ),
      sequenceTarget("verb-kiru", "verb-suwaru", CELLS.sequenceFinal),
      reversedSequenceTarget("verb-kiru", "verb-suwaru", CELLS.sequenceFinal),
      0,
      CELLS.sequenceFinal,
      BASE_ORDERING_ACTIVITY_SHAPE,
      { contrastAxis: "schedule-route" },
    ),
    act(
      "base-synthesis-2",
      4,
      task11Cue(
        L("noun-ginkouin"),
        TASK11_COMMA,
        L("noun-koumuin"),
        TASK11_COMMA,
        L("noun-fuku"),
        TASK11_COMMA,
        L("verb-ryokou-suru"),
        TASK11_COMMA,
        L("verb-ryouri-suru"),
        TASK11_COMMA,
        L("verb-dekakeru"),
      ),
      objectVerbTarget(
        "noun-fuku",
        "verb-kiru",
        "polite-nonpast",
        CELLS.future,
        "future",
      ),
      objectVerbTarget(
        "noun-fuku",
        "verb-kiru",
        "nonpast-negative",
        CELLS.future,
        "future",
      ),
      1,
      CELLS.future,
      BASE_CONTROLLED_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      5,
      task11Cue(
        L("noun-shorui"),
        TASK11_COMMA,
        L("verb-miseru"),
        TASK11_COMMA,
        L("noun-maishuu"),
        TASK11_COMMA,
        L("noun-getsuyoubi"),
        TASK11_COMMA,
        L("noun-konshuu"),
        TASK11_COMMA,
        L("noun-raishuu"),
      ),
      simpleVerbTarget(
        "verb-miseru",
        "past-affirmative",
        CELLS.pastAffirmative,
        "past",
      ),
      errorTarget(
        "verb-miseru",
        "みせましだ",
        "misemashida",
        "synthesis-past-voicing",
      ),
      0,
      CELLS.pastAffirmative,
      BASE_ERROR_ACTIVITY_SHAPE,
      {
        contrastAxis: "polite-form",
        errorCode: "synthesis-past-voicing",
        errorDefectAxis: "form",
      },
    ),
    act(
      "base-synthesis-2",
      6,
      task11Cue(
        L("expression-onegaishimasu"),
        TASK11_COMMA,
        L("noun-nimotsu"),
        TASK11_COMMA,
        L("noun-shio"),
        TASK11_COMMA,
        L("verb-arau"),
        TASK11_COMMA,
        L("noun-kaigi"),
        TASK11_COMMA,
        L("noun-shigoto"),
        TASK11_COMMA,
        L("noun-yotei"),
        TASK11_COMMA,
        L("noun-yoru"),
        TASK11_COMMA,
        L("noun-kinou"),
      ),
      simpleVerbTarget(
        "verb-shiru",
        "past-affirmative",
        CELLS.habitual,
        "past",
      ),
      simpleVerbTarget(
        "verb-shiru",
        "polite-nonpast",
        CELLS.habitual,
        "habitual",
      ),
      1,
      CELLS.habitual,
      BASE_CONTEXT_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      7,
      task11Cue(
        task11AnalysisLabel("analysis-future"),
        TASK11_COMMA,
        L("verb-kaku"),
        TASK11_COMMA,
        L("verb-yomu"),
        TASK11_COMMA,
        L("verb-benkyou-suru"),
        TASK11_COMMA,
        L("verb-akeru"),
        TASK11_COMMA,
        L("verb-shimeru"),
        TASK11_COMMA,
        L("verb-toru"),
        TASK11_COMMA,
        L("noun-kesa"),
        TASK11_COMMA,
        L("noun-konban"),
        TASK11_COMMA,
        L("noun-nichiyoubi"),
        TASK11_COMMA,
        L("noun-shichiji"),
      ),
      actionTimeTarget(
        "noun-kenkyuusha",
        "noun-goji",
        "verb-kaku",
        "polite-nonpast",
        CELLS.timeNi,
        "future",
      ),
      actionTimeTarget(
        "noun-kenkyuusha",
        "noun-goji",
        "verb-kaku",
        "past-affirmative",
        CELLS.timeNi,
        "past",
      ),
      0,
      CELLS.timeNi,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      8,
      task11Cue(
        task11AnalysisLabel("analysis-habitual"),
        TASK11_COMMA,
        L("verb-kesu"),
        TASK11_COMMA,
        L("verb-shiru"),
        TASK11_COMMA,
        L("verb-iku"),
        TASK11_COMMA,
        L("verb-motte-kuru"),
        TASK11_COMMA,
        L("verb-miseru"),
        TASK11_COMMA,
        L("noun-shorui"),
        TASK11_COMMA,
        L("verb-tetsudau"),
        TASK11_COMMA,
        L("verb-yobu"),
        TASK11_COMMA,
        L("verb-hairu"),
        TASK11_COMMA,
        L("verb-deru"),
        TASK11_COMMA,
        L("expression-sumimasen"),
        TASK11_COMMA,
        L("expression-douzo"),
      ),
      simpleVerbTarget(
        "verb-yomu",
        "polite-nonpast",
        CELLS.habitual,
        "habitual",
        "noun-suzuki",
        [],
        [
          "sentence-order",
          "dynamic-nonpast-semantics",
          "godan-verb-class",
          "masu-nonpast",
        ],
      ),
      simpleVerbTarget(
        "verb-yomu",
        "nonpast-negative",
        CELLS.habitual,
        "habitual",
        "noun-suzuki",
        [],
        [
          "sentence-order",
          "dynamic-nonpast-semantics",
          "godan-verb-class",
          "masu-nonpast",
        ],
      ),
      0,
      CELLS.habitual,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      9,
      task11Cue(task11AnalysisLabel("analysis-pair")),
      actionTimeTarget(
        "noun-koumuin",
        "noun-kuji",
        "verb-yomu",
        "past-negative",
        CELLS.pastAffirmative,
        "past",
      ),
      actionTimeTarget(
        "noun-koumuin",
        "noun-kuji",
        "verb-yomu",
        "past-affirmative",
        CELLS.pastAffirmative,
        "past",
      ),
      1,
      CELLS.pastAffirmative,
      BASE_LISTENING_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      10,
      task11Cue(
        L("noun-enjinia"),
        TASK11_COMMA,
        L("noun-shichiji"),
        TASK11_COMMA,
        L("noun-kuji"),
        TASK11_COMMA,
        L("verb-benkyou-suru"),
        TASK11_COMMA,
        L("expression-wakarimashita"),
      ),
      withPrefix(
        timeBoundsTarget("noun-enjinia", "noun-shichiji", "noun-kuji"),
        [L("expression-wakarimashita"), TASK11_COMMA],
      ),
      timeBoundsTarget(
        "noun-enjinia",
        "noun-shichiji",
        "noun-kuji",
        "past-affirmative",
      ),
      0,
      CELLS.timeBounds,
      BASE_SPOKEN_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
  ],
  dialogue: [
    turn(
      "partner",
      asQuestion(
        relativeTimeTarget(
          "noun-fudan",
          "verb-benkyou-suru",
          "polite-nonpast",
          CELLS.habitual,
          "habitual",
        ),
        "verb-benkyou-suru",
      ),
      "ask-study-routine",
      "Do you usually study?",
      "Di solito studi?",
      "Opens a practical schedule exchange with a habitual question.",
      "Apre uno scambio pratico sull'orario con una domanda abituale.",
    ),
    turn(
      "learner",
      timeBoundsTarget(null, "noun-shichiji", "noun-kuji"),
      "state-study-routine",
      "I study from seven until nine.",
      "Studio dalle sette alle nove.",
      "Answers with the two established time bounds.",
      "Risponde con i due limiti temporali già appresi.",
    ),
    turn(
      "partner",
      goTimeGoalQuestion("noun-ashita", "noun-kuji", "noun-jimusho"),
      "ask-arrival-plan",
      "Will you go to the office at nine tomorrow?",
      "Andrai in ufficio domani alle nove?",
      "Moves from the routine to one specific future arrival.",
      "Passa dall'abitudine a un arrivo futuro a un'ora precisa.",
    ),
    turn(
      "learner",
      actionTimeTarget(
        null,
        "noun-kuji",
        "verb-iku",
        "polite-nonpast",
        CELLS.timeNi,
        "future",
        [L("expression-hai"), TASK11_COMMA],
      ),
      "confirm-arrival-plan",
      "Yes, I will go at nine.",
      "Sì, andrò alle nove.",
      "Confirms the same future time without changing the event.",
      "Conferma lo stesso orario futuro senza cambiare l'evento.",
    ),
    turn(
      "partner",
      asQuestion(
        objectVerbTarget(
          "noun-shorui",
          "verb-miseru",
          "polite-nonpast",
          CELLS.future,
          "future",
        ),
        "verb-miseru",
      ),
      "ask-document-plan",
      "Will you show the documents?",
      "Mostrerai i documenti?",
      "Asks about the licensed object in the shared plan.",
      "Chiede dell'oggetto retto nel piano condiviso.",
    ),
    turn(
      "learner",
      withPrefix(sequenceTarget("verb-motte-kuru", "verb-miseru"), [
        L("expression-hai"),
        TASK11_COMMA,
      ]),
      "confirm-document-plan",
      "Yes, I will bring them and show them.",
      "Sì, li porterò e li mostrerò.",
      "Closes with a coherent two-action document plan.",
      "Chiude con un piano coerente di due azioni sui documenti.",
    ),
  ],
};

const SYNTHESIS_3: BaseTask11LessonSpec = {
  lessonId: "base-synthesis-3",
  contract: "synthesis",
  prerequisiteLessonIds: ["base-synthesis-2"],
  newLexemeIds: [],
  reviewLexemeIds: [
    "noun-heya",
    "noun-niwa",
    "noun-tsukue",
    "noun-isu",
    "noun-kyoushitsu",
    "noun-uchi",
    "noun-uketsuke",
    "noun-toire",
    "noun-konbini",
    "noun-basutei",
    "noun-chizu",
    "noun-kaban",
  ],
  introducedConceptIds: [],
  reviewedConceptIds: [
    "sentence-order",
    "topic-wa",
    "action-place-de",
    "existence-vs-action-location",
    "aru-existence",
    "iru-existence",
    "existence-location-frame",
    "base-particle-existence-ni",
    "base-particle-existential-ga",
    "existential-ga-vs-topic-wa",
    "base-construction-te-kudasai",
    "base-construction-sequential-te",
  ],
  patternCellIds: [
    CELLS.existenceAru,
    CELLS.existenceIru,
    CELLS.existenceFrame,
    CELLS.existenceActionContrast,
    CELLS.existenceTopicContrast,
    CELLS.request,
    CELLS.requestResponse,
    CELLS.sequence,
    CELLS.sequenceFinal,
    CELLS.pastAffirmative,
    CELLS.teImasuOngoing,
  ],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "reference-te-forms",
  ],
  retrievedSystemIds: [
    "sentence-anatomy",
    "particle-atlas",
    "existence-location",
    "bounded-te",
  ],
  examples: [
    ex(
      fullExistence("noun-heya", "noun-tsukue", "verb-aru"),
      "room-desk",
      "There is a desk in the room.",
      "Nella stanza c'è una scrivania.",
      "Uses location に and existential が for an inanimate entity.",
      "Usa に di luogo e が esistenziale per un'entità inanimata.",
      "existence-room-desk",
    ),
    ex(
      fullExistence("noun-niwa", "noun-kodomo", "verb-iru"),
      "garden-dog",
      "There is a child in the garden.",
      "Nel giardino c'è un bambino.",
      "Selects います for an animate entity.",
      "Seleziona います per un'entità animata.",
      "existence-garden-dog",
    ),
    ex(
      topicLocation("noun-isu", "noun-uchi", "verb-aru"),
      "chair-location",
      "The chair is in the house.",
      "La sedia è nella casa.",
      "Contrasts a known chair topic with an existential introduction.",
      "Contrappone una sedia già nota a un'introduzione esistenziale.",
      "topic-chair-location",
    ),
    ex(
      actionPlace(
        "noun-kyoushitsu",
        "verb-asobu",
        "play-place",
      ),
      "classroom-action",
      "I play in the classroom.",
      "Gioco in aula.",
      "Uses で for the place where an action happens.",
      "Usa で per il luogo in cui avviene un'azione.",
      "action-place-classroom",
    ),
    ex(
      requestTarget("noun-mado", "verb-akeru", [
        L("expression-sumimasen"),
        TASK11_COMMA,
      ]),
      "window-request",
      "Excuse me, please open the window.",
      "Scusi, apra la finestra, per favore.",
      "Makes a bounded practical request with てください.",
      "Formula una richiesta pratica circoscritta con てください.",
      "request-open-window",
    ),
    ex(
      sequenceTarget("verb-shimeru", "verb-deru"),
      "close-then-leave",
      "I will close it and then leave.",
      "Lo chiuderò e poi uscirò.",
      "Uses sequential て while keeping the final verb finite.",
      "Usa て sequenziale mantenendo finito il verbo finale.",
      "sequence-close-leave",
    ),
    ex(
      fullExistence("noun-uketsuke", "noun-kodomo", "verb-iru"),
      "reception-attendant",
      "There is a child at reception.",
      "Alla reception c'è un bambino.",
      "Introduces a person with existential が.",
      "Introduce una persona con が esistenziale.",
      "existence-reception-attendant",
    ),
    ex(
      requestTarget("noun-kaban", "verb-miseru", [
        L("expression-onegaishimasu"),
        TASK11_COMMA,
      ]),
      "bag-request",
      "Please show the bag.",
      "Mostri la borsa, per favore.",
      "Keeps the requested object licensed by を.",
      "Mantiene l'oggetto richiesto retto da を.",
      "request-show-bag",
    ),
  ],
  activities: [
    act(
      "base-synthesis-3",
      1,
      task11Cue(
        L("noun-kuruma"),
        TASK11_COMMA,
        L("noun-hana"),
        TASK11_COMMA,
        L("verb-motte-kuru"),
        TASK11_COMMA,
        L("expression-douzo"),
        TASK11_COMMA,
        L("expression-wakarimashita"),
      ),
      fullExistence("noun-niwa", "noun-kuruma", "verb-aru"),
      topicLocation("noun-kuruma", "noun-niwa", "verb-aru"),
      1,
      CELLS.existenceFrame,
      BASE_MEANING_ACTIVITY_SHAPE,
      { contrastAxis: "information-structure" },
    ),
    act(
      "base-synthesis-3",
      2,
      task11Cue(
        L("noun-kaban"),
        TASK11_COMMA,
        L("verb-arau"),
        TASK11_COMMA,
        L("noun-byouin"),
        TASK11_COMMA,
        L("noun-toshokan"),
        TASK11_COMMA,
        L("noun-nikki"),
      ),
      requestTarget("noun-kaban", "verb-arau"),
      objectVerbTarget(
        "noun-kaban",
        "verb-arau",
        "polite-nonpast",
        CELLS.request,
        "future",
      ),
      1,
      CELLS.request,
      BASE_FORM_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-3",
      3,
      task11Cue(
        L("noun-kodomo"),
        TASK11_COMMA,
        L("noun-sakana"),
        TASK11_COMMA,
        L("verb-yobu"),
        TASK11_COMMA,
        L("verb-deru"),
      ),
      sequenceTarget("verb-yobu", "verb-deru", CELLS.sequenceFinal),
      reversedSequenceTarget("verb-yobu", "verb-deru", CELLS.sequenceFinal),
      0,
      CELLS.sequenceFinal,
      BASE_ORDERING_ACTIVITY_SHAPE,
      { contrastAxis: "schedule-route" },
    ),
    act(
      "base-synthesis-3",
      4,
      task11Cue(
        L("noun-fuku"),
        TASK11_COMMA,
        L("noun-shio"),
        TASK11_COMMA,
        L("verb-arau"),
        TASK11_COMMA,
        L("verb-tetsudau"),
      ),
      requestTarget("noun-fuku", "verb-arau"),
      objectVerbTarget(
        "noun-fuku",
        "verb-arau",
        "polite-nonpast",
        CELLS.request,
        "future",
      ),
      1,
      CELLS.request,
      BASE_CONTROLLED_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-3",
      5,
      task11Cue(L("noun-fuku"), TASK11_COMMA, L("verb-arau")),
      simpleVerbTarget(
        "verb-arau",
        "past-affirmative",
        CELLS.pastAffirmative,
        "past",
      ),
      errorTarget(
        "verb-arau",
        "あらいましたた",
        "araimashitata",
        "synthesis-past-ending",
      ),
      0,
      CELLS.pastAffirmative,
      BASE_ERROR_ACTIVITY_SHAPE,
      {
        contrastAxis: "polite-form",
        errorCode: "synthesis-past-ending",
        errorDefectAxis: "form",
      },
    ),
    act(
      "base-synthesis-3",
      6,
      task11Cue(
        L("noun-keisatsukan"),
        TASK11_COMMA,
        L("verb-suwaru"),
        TASK11_COMMA,
        L("verb-shiru"),
      ),
      anchoredTeImasu(
        "noun-keisatsukan",
        "verb-hanasu",
        "ongoing-now",
      ),
      simpleVerbTarget(
        "verb-hanasu",
        "polite-nonpast",
        CELLS.teImasuOngoing,
        "habitual",
        "noun-keisatsukan",
      ),
      1,
      CELLS.teImasuOngoing,
      BASE_CONTEXT_ACTIVITY_SHAPE,
      { contrastAxis: "interpretation" },
    ),
    act(
      "base-synthesis-3",
      7,
      task11Cue(
        L("noun-heya"),
        TASK11_COMMA,
        L("noun-niwa"),
        TASK11_COMMA,
        L("noun-tsukue"),
        TASK11_COMMA,
        L("noun-isu"),
        TASK11_COMMA,
        L("noun-kyoushitsu"),
        TASK11_COMMA,
        L("noun-uchi"),
        TASK11_COMMA,
        L("verb-shinu"),
      ),
      {
        ...topicLocation("noun-chizu", "noun-jimusho", "verb-aru"),
        conceptIds: [
          "sentence-order",
          "topic-wa",
          "aru-existence",
          "existence-location-frame",
          "base-particle-existence-ni",
        ],
      },
      fullExistence("noun-jimusho", "noun-chizu", "verb-aru"),
      0,
      CELLS.existenceTopicContrast,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "information-structure" },
    ),
    act(
      "base-synthesis-3",
      8,
      task11Cue(
        L("noun-uketsuke"),
        TASK11_COMMA,
        L("noun-toire"),
        TASK11_COMMA,
        L("noun-konbini"),
        TASK11_COMMA,
        L("noun-basutei"),
        TASK11_COMMA,
        L("noun-chizu"),
        TASK11_COMMA,
        L("noun-kaban"),
        TASK11_COMMA,
        L("verb-kiru"),
        TASK11_COMMA,
        L("verb-kesu"),
        TASK11_COMMA,
        L("verb-hairu"),
      ),
      requestTarget("noun-kaban", "verb-toru"),
      objectVerbTarget(
        "noun-kaban",
        "verb-toru",
        "polite-nonpast",
        CELLS.request,
        "future",
      ),
      1,
      CELLS.request,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-3",
      9,
      task11Cue(task11AnalysisLabel("analysis-pair")),
      objectVerbTarget(
        "noun-chizu",
        "verb-yomu",
        "polite-nonpast",
        CELLS.request,
        "future",
      ),
      objectVerbTarget(
        "noun-chizu",
        "verb-yomu",
        "nonpast-negative",
        CELLS.request,
        "habitual",
      ),
      0,
      CELLS.request,
      BASE_LISTENING_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-3",
      10,
      task11Cue(
        L("expression-sumimasen"),
        TASK11_COMMA,
        L("noun-nimotsu"),
        TASK11_COMMA,
        L("verb-toru"),
      ),
      requestTarget("noun-nimotsu", "verb-toru", [
        L("expression-sumimasen"),
        TASK11_COMMA,
      ]),
      objectVerbTarget(
        "noun-nimotsu",
        "verb-toru",
        "polite-nonpast",
        CELLS.request,
        "future",
      ),
      0,
      CELLS.request,
      BASE_SPOKEN_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
  ],
  dialogue: [
    turn(
      "learner",
      whereQuestion("noun-konbini", "verb-aru"),
      "ask-convenience-store",
      "Where is the convenience store?",
      "Dov'è il minimarket?",
      "Asks for the location of an established destination.",
      "Chiede la posizione di una destinazione già stabilita.",
    ),
    turn(
      "partner",
      topicLocation("noun-konbini", "noun-basutei", "verb-aru"),
      "locate-convenience-store",
      "The convenience store is at the bus stop.",
      "Il minimarket è alla fermata dell'autobus.",
      "Answers with topic は and location に.",
      "Risponde con il tema は e il luogo に.",
    ),
    turn(
      "learner",
      whereQuestion("noun-toire", "verb-aru", [
        L("expression-sumimasen"),
        TASK11_COMMA,
      ]),
      "ask-restroom",
      "Excuse me, where is the restroom?",
      "Scusi, dov'è il bagno?",
      "Keeps the same practical location exchange.",
      "Mantiene lo stesso scambio pratico sulla posizione.",
    ),
    turn(
      "partner",
      topicLocation("noun-toire", "noun-eki", "verb-aru"),
      "locate-restroom",
      "The restroom is at the station.",
      "Il bagno è alla stazione.",
      "Supplies the requested place without changing the frame.",
      "Fornisce il luogo richiesto senza cambiare struttura.",
    ),
    turn(
      "learner",
      requestTarget("noun-chizu", "verb-miseru", [
        L("expression-onegaishimasu"),
        TASK11_COMMA,
      ]),
      "request-map",
      "Please show me the map.",
      "Mi mostri la mappa, per favore.",
      "Turns the location exchange into a practical request.",
      "Trasforma lo scambio sulla posizione in una richiesta pratica.",
    ),
    turn(
      "partner",
      simpleVerbTarget(
        "verb-miseru",
        "polite-nonpast",
        CELLS.requestResponse,
        "future",
        null,
        [L("expression-hai"), TASK11_COMMA],
        ["sentence-omission"],
      ),
      "offer-map",
      "Yes, I will show it.",
      "Sì, la mostrerò.",
      "Closes the request with an appropriate response.",
      "Chiude la richiesta con una risposta appropriata.",
    ),
  ],
};

const SYNTHESIS_4: BaseTask11LessonSpec = {
  lessonId: "base-synthesis-4",
  contract: "synthesis",
  prerequisiteLessonIds: ["base-synthesis-3"],
  newLexemeIds: [],
  reviewLexemeIds: [
    "noun-gakusei",
    "anchor-gakkou",
    "anchor-hon",
    "noun-watashi",
    "noun-tanaka",
    "noun-tomodachi",
    "verb-kaku",
    "verb-yomu",
    "verb-iku",
    "verb-benkyou-suru",
    "noun-eki",
    "noun-kyou",
  ],
  introducedConceptIds: [],
  reviewedConceptIds: [
    "sentence-order",
    "topic-wa",
    "licensed-object-o",
    "goal-ni",
    "action-place-de",
    "godan-verb-class",
    "ichidan-verb-class",
    "suru-verb-class",
    "kuru-verb-class",
    "four-polite-tense-cells",
    "na-adjective-predicate-and-attributive",
    "existence-location-frame",
    "base-construction-te-kudasai",
    "base-construction-sequential-te",
    "base-construction-te-imasu",
  ],
  patternCellIds: [
    CELLS.topic,
    CELLS.nounAffirmative,
    CELLS.nounNegative,
    CELLS.naAffirmative,
    CELLS.godan,
    CELLS.ichidan,
    CELLS.special,
    CELLS.future,
    CELLS.pastNegative,
    CELLS.existenceFrame,
    CELLS.existenceTopicContrast,
    CELLS.request,
    CELLS.sequence,
    CELLS.sequenceFinal,
    CELLS.teImasuOngoing,
    CELLS.teImasuState,
  ],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
    "reference-adjective-grid",
  ],
  retrievedSystemIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "bounded-te",
  ],
  examples: [
    ex(
      predicateTarget(
        "noun",
        "noun-gakusei",
        "negative",
        CELLS.nounNegative,
        "noun-watashi",
        [],
        ["sentence-order"],
      ),
      "speaker-identity",
      "I am not a student.",
      "Non sono uno studente.",
      "Samples sentence anatomy through a complete identity clause.",
      "Campiona l'anatomia della frase con una clausola d'identità completa.",
      "checkpoint-identity",
    ),
    ex(
      predicateTarget(
        "na-adjective",
        "adjective-shizuka",
        "affirmative",
        CELLS.naAffirmative,
        "noun-tanaka",
      ),
      "tanaka-description",
      "Tanaka is quiet.",
      "Tanaka è tranquillo.",
      "Samples the adjective and copula reference surface.",
      "Campiona la superficie di riferimento di aggettivi e copula.",
      "checkpoint-adjective",
    ),
    ex(
      objectVerbTarget(
        "anchor-hon",
        "verb-yomu",
        "past-negative",
        CELLS.godan,
        "past",
        [],
        ["godan-verb-class", "masu-nonpast"],
      ),
      "godan-reading",
      "I did not read a book.",
      "Non ho letto un libro.",
      "Samples a licensed object and a godan polite form.",
      "Campiona un oggetto retto correttamente e una forma cortese godan.",
      "checkpoint-godan",
    ),
    ex(
      objectVerbTarget(
        "noun-gohan",
        "verb-taberu",
        "nonpast-negative",
        CELLS.ichidan,
        "habitual",
        [],
        ["ichidan-verb-class", "masu-nonpast"],
      ),
      "ichidan-eating",
      "I do not eat rice.",
      "Non mangio riso.",
      "Samples the ichidan class through an approved generated form.",
      "Campiona la classe ichidan con una forma generata approvata.",
      "checkpoint-ichidan",
    ),
    ex(
      simpleVerbTarget(
        "verb-suru",
        "polite-nonpast",
        CELLS.special,
        "future",
        null,
        [],
        ["suru-verb-class", "masu-nonpast"],
      ),
      "suru-class",
      "I will do it.",
      "Lo farò.",
      "Samples the stored する class without inventing a form.",
      "Campiona la classe registrata di する senza inventare una forma.",
      "checkpoint-suru",
    ),
    ex(
      goalTarget(
        "anchor-gakkou",
        "verb-iku",
        "polite-nonpast",
        "future",
      ),
      "school-plan",
      "I will go to school.",
      "Andrò a scuola.",
      "Samples goal に and dynamic future nonpast.",
      "Campiona に di meta e il non-passato dinamico futuro.",
      "checkpoint-goal",
    ),
    ex(
      fullExistence("noun-eki", "noun-tomodachi", "verb-iru"),
      "friend-at-station",
      "There is a friend at the station.",
      "Alla stazione c'è un amico.",
      "Samples the animate existence frame.",
      "Campiona la struttura di esistenza animata.",
      "checkpoint-existence",
    ),
    ex(
      anchoredTeImasu(
        "noun-ekiin",
        "verb-hanasu",
        "ongoing-now",
      ),
      "ongoing-speaking",
      "The station attendant is speaking now.",
      "L'addetto della stazione sta parlando adesso.",
      "Reads ています as an action currently in progress.",
      "Legge ています come azione attualmente in corso.",
      "checkpoint-teimasu-ongoing",
    ),
    ex(
      anchoredTeImasu(
        "noun-tomodachi",
        "verb-suwaru",
        "resulting-state",
        "noun-isu",
      ),
      "seated-state",
      "The friend is seated on a chair.",
      "L'amico è seduto su una sedia.",
      "Reads ています as the current result of sitting down.",
      "Legge ています come risultato attuale dell'atto di sedersi.",
      "checkpoint-teimasu-state",
    ),
    ex(
      relativeTimeTarget(
        "noun-kyou",
        "verb-kaku",
        "past-negative",
        CELLS.pastNegative,
        "past",
      ),
      "today-past-negative",
      "Today, I did not write.",
      "Oggi non ho scritto.",
      "Samples the past-negative cell with a relative-time anchor.",
      "Campiona la cella passata negativa con un riferimento temporale relativo.",
      "checkpoint-past-negative",
    ),
  ],
  activities: [
    act(
      "base-synthesis-4",
      1,
      task11Cue(
        task11VerbForm("verb-benkyou-suru", "dictionary"),
        TASK11_COMMA,
        task11AnalysisLabel("analysis-source"),
        TASK11_COMMA,
        L("verb-sanpo-suru"),
        TASK11_COMMA,
        L("verb-kiku"),
        TASK11_COMMA,
        L("verb-tsukuru"),
        TASK11_COMMA,
        L("verb-au"),
        TASK11_COMMA,
        L("verb-utau"),
        TASK11_COMMA,
        L("verb-noru"),
        TASK11_COMMA,
        L("verb-hashiru"),
      ),
      task11ClassAnalysisTarget("verb-benkyou-suru", "suru-verb-class", [
        CELLS.special,
      ]),
      task11ClassAnalysisTarget("verb-benkyou-suru", "kuru-verb-class", [
        CELLS.special,
      ]),
      1,
      CELLS.special,
      BASE_MEANING_ACTIVITY_SHAPE,
      { contrastAxis: "verb-class" },
    ),
    act(
      "base-synthesis-4",
      2,
      task11Cue(
        L("adjective-kirei"),
        TASK11_COMMA,
        L("noun-mise"),
        TASK11_COMMA,
        L("name-mika"),
        TASK11_COMMA,
        L("name-sora"),
        TASK11_COMMA,
        L("name-haru"),
        TASK11_COMMA,
        L("name-ai"),
      ),
      predicateTarget(
        "na-adjective",
        "adjective-kirei",
        "affirmative",
        CELLS.naAffirmative,
        "noun-mise",
      ),
      predicateTarget(
        "na-adjective",
        "adjective-kirei",
        "negative",
        CELLS.naAffirmative,
        "noun-mise",
      ),
      1,
      CELLS.naAffirmative,
      BASE_FORM_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-4",
      3,
      task11Cue(
        L("verb-yomu"),
        TASK11_COMMA,
        L("verb-iku"),
        TASK11_COMMA,
        L("noun-chichi"),
        TASK11_COMMA,
        L("noun-haha"),
        TASK11_COMMA,
        L("noun-otousan"),
        TASK11_COMMA,
        L("noun-okaasan"),
      ),
      sequenceTarget("verb-yomu", "verb-iku", CELLS.sequenceFinal),
      reversedSequenceTarget("verb-yomu", "verb-iku", CELLS.sequenceFinal),
      0,
      CELLS.sequenceFinal,
      BASE_ORDERING_ACTIVITY_SHAPE,
      { contrastAxis: "schedule-route" },
    ),
    act(
      "base-synthesis-4",
      4,
      task11Cue(
        L("noun-jimusho"),
        TASK11_COMMA,
        L("noun-kaban"),
        TASK11_COMMA,
        L("noun-toshi"),
        TASK11_COMMA,
        L("noun-kuni"),
        TASK11_COMMA,
        L("noun-namae"),
        TASK11_COMMA,
        L("noun-dare"),
        TASK11_COMMA,
        L("noun-nan"),
        TASK11_COMMA,
        L("expression-sou"),
      ),
      topicLocation("noun-kaban", "noun-jimusho", "verb-aru"),
      fullExistence("noun-jimusho", "noun-kaban", "verb-aru"),
      1,
      CELLS.existenceTopicContrast,
      BASE_CONTROLLED_ACTIVITY_SHAPE,
      { contrastAxis: "information-structure" },
    ),
    act(
      "base-synthesis-4",
      5,
      task11Cue(
        L("noun-kyou"),
        TASK11_COMMA,
        L("verb-yomu"),
        TASK11_COMMA,
        L("noun-fudan"),
        TASK11_COMMA,
        L("noun-kuji"),
        TASK11_COMMA,
        L("noun-goji"),
        TASK11_COMMA,
        L("noun-kinou"),
        TASK11_COMMA,
        L("noun-senshuu"),
      ),
      simpleVerbTarget(
        "verb-yomu",
        "past-affirmative",
        CELLS.pastNegative,
        "past",
      ),
      errorTarget(
        "verb-yomu",
        "よみましたた",
        "yomimashitata",
        "synthesis-missing-past-final",
      ),
      0,
      CELLS.pastNegative,
      BASE_ERROR_ACTIVITY_SHAPE,
      {
        contrastAxis: "polite-form",
        errorCode: "synthesis-missing-past-final",
        errorDefectAxis: "form",
      },
    ),
    act(
      "base-synthesis-4",
      6,
      task11Cue(
        L("noun-ima"),
        TASK11_COMMA,
        L("noun-suzuki"),
        TASK11_COMMA,
        L("noun-konshuu"),
        TASK11_COMMA,
        L("noun-raishuu"),
        TASK11_COMMA,
        L("noun-kaigi"),
        TASK11_COMMA,
        L("noun-yotei"),
        TASK11_COMMA,
        L("noun-yoru"),
      ),
      anchoredTeImasu(
        "noun-suzuki",
        "verb-benkyou-suru",
        "ongoing-now",
      ),
      simpleVerbTarget(
        "verb-benkyou-suru",
        "polite-nonpast",
        CELLS.teImasuOngoing,
        "habitual",
        "noun-suzuki",
      ),
      1,
      CELLS.teImasuOngoing,
      BASE_CONTEXT_ACTIVITY_SHAPE,
      { contrastAxis: "interpretation" },
    ),
    act(
      "base-synthesis-4",
      7,
      task11Cue(
        L("noun-gakusei"),
        TASK11_COMMA,
        L("anchor-gakkou"),
        TASK11_COMMA,
        L("anchor-hon"),
        TASK11_COMMA,
        L("noun-watashi"),
        TASK11_COMMA,
        L("noun-tanaka"),
        TASK11_COMMA,
        L("noun-tomodachi"),
        TASK11_COMMA,
        L("noun-kesa"),
        TASK11_COMMA,
        L("noun-konban"),
        TASK11_COMMA,
        L("noun-nichiyoubi"),
      ),
      {
        ...anchoredTeImasu(
          "noun-tanaka",
          "verb-benkyou-suru",
          "ongoing-now",
        ),
        conceptIds: [
          "sentence-order",
          "topic-wa",
          "suru-verb-class",
          "masu-nonpast",
          "base-construction-te-imasu",
          "relative-time-omission",
        ],
      },
      simpleVerbTarget(
        "verb-benkyou-suru",
        "polite-nonpast",
        CELLS.teImasuOngoing,
        "habitual",
        "noun-tanaka",
      ),
      0,
      CELLS.teImasuOngoing,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "interpretation" },
    ),
    act(
      "base-synthesis-4",
      8,
      task11Cue(
        L("verb-kaku"),
        TASK11_COMMA,
        L("verb-yomu"),
        TASK11_COMMA,
        L("verb-iku"),
        TASK11_COMMA,
        L("verb-benkyou-suru"),
        TASK11_COMMA,
        L("noun-eki"),
        TASK11_COMMA,
        L("noun-kyou"),
        TASK11_COMMA,
        L("noun-nikki"),
        TASK11_COMMA,
        L("noun-mado"),
        TASK11_COMMA,
        L("anchor-chuui"),
      ),
      topicLocation("noun-nikki", "noun-jimusho", "verb-aru"),
      fullExistence("noun-jimusho", "noun-nikki", "verb-aru"),
      1,
      CELLS.existenceTopicContrast,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "information-structure" },
    ),
    act(
      "base-synthesis-4",
      9,
      task11Cue(task11AnalysisLabel("analysis-pair")),
      anchoredTeImasu(
        "noun-yuki",
        "verb-hataraku",
        "ongoing-now",
      ),
      simpleVerbTarget(
        "verb-hataraku",
        "polite-nonpast",
        CELLS.teImasuOngoing,
        "habitual",
        "noun-yuki",
      ),
      0,
      CELLS.teImasuOngoing,
      BASE_LISTENING_ACTIVITY_SHAPE,
      { contrastAxis: "interpretation" },
    ),
    act(
      "base-synthesis-4",
      10,
      task11Cue(
        L("noun-zasshi"),
        TASK11_COMMA,
        L("verb-yomu"),
        TASK11_COMMA,
        L("expression-onegaishimasu"),
      ),
      requestTarget("noun-zasshi", "verb-yomu", [
        L("expression-onegaishimasu"),
        TASK11_COMMA,
      ]),
      objectVerbTarget(
        "noun-zasshi",
        "verb-yomu",
        "polite-nonpast",
        CELLS.request,
        "future",
      ),
      0,
      CELLS.request,
      BASE_SPOKEN_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
  ],
  dialogue: [
    turn(
      "partner",
      predicateTarget(
        "noun",
        "noun-gakusei",
        "affirmative",
        CELLS.nounAffirmative,
        "noun-tomodachi",
      ),
      "introduce-friend",
      "My friend is a student.",
      "Il mio amico è uno studente.",
      "Establishes the person for the mixed interaction.",
      "Stabilisce la persona per l'interazione mista.",
    ),
    turn(
      "learner",
      actionPlace(
        "anchor-gakkou",
        "verb-benkyou-suru",
        "study-place",
      ),
      "school-routine",
      "They study at school.",
      "Studia a scuola.",
      "Checks action-place で inside the shared scenario.",
      "Verifica で di luogo d'azione nello scenario condiviso.",
    ),
    turn(
      "partner",
      {
        ...goalTarget(
          "noun-jimusho",
          "verb-iku",
          "polite-nonpast",
          "future",
          [L("noun-kyou")],
        ),
        conceptIds: ["goal-ni", "dynamic-nonpast-semantics", "relative-time-omission"],
        semanticRoleIds: ["time", "goal"],
      },
      "station-plan",
      "They will go to the office.",
      "Andrà in ufficio.",
      "Adds a future movement goal.",
      "Aggiunge una meta di movimento futura.",
    ),
    turn(
      "learner",
      topicLocation("noun-tomodachi", "noun-jimusho", "verb-iru"),
      "friend-at-office",
      "My friend is at the office.",
      "Il mio amico è in ufficio.",
      "Checks the existential frame before the request.",
      "Verifica la struttura esistenziale prima della richiesta.",
    ),
    turn(
      "partner",
      requestTarget("anchor-hon", "verb-yomu", [
        L("expression-onegaishimasu"),
        TASK11_COMMA,
      ]),
      "reading-request",
      "Please read the book.",
      "Legga il libro, per favore.",
      "Adds one practical, bounded request.",
      "Aggiunge una richiesta pratica e circoscritta.",
    ),
    turn(
      "learner",
      withPrefix(
        relativeTimeTarget(
          "noun-kyou",
          "verb-yomu",
          "polite-nonpast",
          CELLS.future,
          "future",
        ),
        [L("expression-hai"), TASK11_COMMA],
      ),
      "reading-response",
      "Yes, I will read it today.",
      "Sì, lo leggerò oggi.",
      "Closes with an observed plan, not a level decision.",
      "Chiude con un piano osservato, non con una decisione di livello.",
    ),
  ],
};

const SPECS = deepFreeze([
  SYNTHESIS_1,
  SYNTHESIS_2,
  SYNTHESIS_3,
  SYNTHESIS_4,
]);
const BUILT = SPECS.map(buildTask11Lesson);
const RAW_LESSONS = BUILT.map(({ lesson }) => lesson);

export const BASE_SYNTHESIS_LESSONS: readonly BaseTask11Lesson[] =
  deepFreeze(RAW_LESSONS);

export const BASE_SYNTHESIS_LESSON_CONTENTS: readonly BaseSynthesisLessonContent[] =
  deepFreeze(
    RAW_LESSONS.map(({ content }) => content as BaseSynthesisLessonContent),
  );

export const BASE_SYNTHESIS_VALIDATION_CATALOGS: BaseValidationCatalogs =
  task11ValidationCatalogs(
    BASE_REQUESTS_CONNECTION_VALIDATION_CATALOGS,
    BUILT,
  );

const RAW_SYNTHESIS_MODULE: BaseSynthesisModule = {
  id: "base-synthesis",
  lessons: RAW_LESSONS,
  sequence: [
    ...BASE_REQUESTS_CONNECTION_MODULE.sequence,
    ...BASE_SYNTHESIS_LESSON_CONTENTS,
  ],
  worldFacts: { scope: "synthesis-review" },
  worldFactIds: [],
  worldFactLedger: worldFactLedgerFor(RAW_LESSONS),
};

export function validateBaseSynthesisModule(
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
    "base-synthesis",
    SPECS.map(({ lessonId }) => lessonId),
    BASE_SYNTHESIS_VALIDATION_CATALOGS,
  );
  if (!base.ok) return base;
  const snapshot = strictTask11ModuleSnapshot(sanitized.value);
  const collisions = validateTask11CorpusDistinctness(
    [
      BASE_SENTENCE_FOUNDATIONS_MODULE,
      BASE_TOPIC_QUESTIONS_MODULE,
      BASE_POLITE_VERBS_MODULE,
      BASE_ARGUMENT_PARTICLES_MODULE,
      BASE_TIME_MOVEMENT_MODULE,
      BASE_COPULA_ADJECTIVES_MODULE,
      BASE_EXISTENCE_LOCATION_MODULE,
      BASE_REQUESTS_CONNECTION_MODULE,
      sanitized.value,
    ],
    baseNavigationCopyEn.content,
    baseNavigationCopyIt.content,
  );
  const synthesisCollisions = collisions?.filter(({ lessonId }) =>
    lessonId.startsWith("base-synthesis-"),
  );
  if (!snapshot || !synthesisCollisions || synthesisCollisions.length > 0) {
    return { ok: false, errors: ["invalid-lesson-shape"] };
  }
  return task11PlainDataEqual(sanitized.value, RAW_SYNTHESIS_MODULE)
    ? base
    : { ok: false, errors: ["invalid-module-shape"] };
}

export const BASE_SYNTHESIS_MODULE: BaseSynthesisModule = deepFreeze(
  RAW_SYNTHESIS_MODULE,
);

export const BASE_SYNTHESIS_VALIDATION = validateBaseSynthesisModule(
  BASE_SYNTHESIS_MODULE,
);

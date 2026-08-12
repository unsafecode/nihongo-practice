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
  TASK11_DESU,
  buildTask11Lesson,
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
  seatedTarget,
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
  teImasuNonpastContrast: "te-imasu-vs-ordinary-nonpast",
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

function famousGoodGuestTarget(): BaseTask11TargetSpec {
  return task11Target(
    [
      L("name-ken"),
      P("topic-wa", "topic", "name-ken"),
      naAttributive("adjective-yuumei"),
      iAttributive("adjective-ii"),
      predicatePart("noun", "anchor-kyaku", "affirmative"),
    ],
    {
      conceptIds: [
        "i-adjective-class",
        "i-adjective-tense-polarity",
        "na-adjective-class",
        "na-adjective-predicate-and-attributive",
        "modifier-before-noun",
        "topic-wa",
      ],
      patternCellIds: [CELLS.naAttributive],
      semanticRoleIds: ["topic"],
      interpretationTags: ["present-state"],
      predicateSenseId: "modified-noun-predicate",
      predicateLexemeId: "anchor-kyaku",
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

function possessedNounPredicate(
  ownerId: string,
  topicId: string,
  predicateId: string,
  form: PredicateForm = "affirmative",
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(ownerId),
      P("possessive-attributive-no", "possessor", ownerId),
      L(topicId),
      P("topic-wa", "topic", topicId),
      predicatePart("noun", predicateId, form),
    ],
    {
      conceptIds: [
        "sentence-order",
        "possessive-no",
        "topic-wa",
        form === "negative"
          ? "negative-noun-predicate-copula"
          : "affirmative-desu",
      ],
      patternCellIds: [
        form === "negative" ? CELLS.nounNegative : CELLS.nounAffirmative,
      ],
      semanticRoleIds: ["possessor", "topic"],
      interpretationTags: [
        "present-state",
        ...(form === "negative" ? (["negative"] as const) : []),
      ],
      predicateSenseId: "noun-predicate",
      predicateLexemeId: predicateId,
      predicateAspect: "nominal",
    },
  );
}

function timedMeetingPlanTarget(
  ownerId: string,
  timeId: string,
  form: "affirmative" | "negative",
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(timeId),
      P("time-ni", "time", timeId),
      TASK11_COMMA,
      L(ownerId),
      P("possessive-attributive-no", "possessor", ownerId),
      L("noun-yotei"),
      P("topic-wa", "topic", "noun-yotei"),
      predicatePart("noun", "noun-kaigi", form),
    ],
    {
      conceptIds: [
        "sentence-order",
        "possessive-no",
        "topic-wa",
        "time-ni",
        form === "negative"
          ? "negative-noun-predicate-copula"
          : "affirmative-desu",
      ],
      patternCellIds: [
        form === "negative" ? CELLS.nounNegative : CELLS.nounAffirmative,
      ],
      semanticRoleIds: ["time", "possessor", "topic"],
      interpretationTags: [
        "future",
        ...(form === "negative" ? (["negative"] as const) : []),
      ],
      predicateSenseId: null,
      predicateLexemeId: "noun-kaigi",
      predicateAspect: "nominal",
    },
  );
}

function possessedAdjectivePredicate(
  ownerId: string,
  topicId: string,
  adjectiveId: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(ownerId),
      P("possessive-attributive-no", "possessor", ownerId),
      L(topicId),
      P("topic-wa", "topic", topicId),
      predicatePart("na-adjective", adjectiveId, "affirmative"),
    ],
    {
      conceptIds: [
        "sentence-order",
        "possessive-no",
        "topic-wa",
        "na-adjective-class",
        "na-adjective-predicate-and-attributive",
      ],
      patternCellIds: [CELLS.naAffirmative],
      semanticRoleIds: ["possessor", "topic"],
      interpretationTags: ["present-state"],
      predicateSenseId: "na-adjective-predicate",
      predicateLexemeId: adjectiveId,
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

function describedObjectVerbTarget(
  subjectId: string,
  adjectiveId: string,
  objectId: string,
  lemmaId: string,
  form: BaseTask11VerbFormKind,
  cellId: string,
  interpretation: BaseInterpretationTag,
): BaseTask11TargetSpec {
  const predicateSenseId = themeSense(lemmaId);
  return task11Target(
    [
      L(subjectId),
      P("topic-wa", "topic", subjectId),
      naAttributive(adjectiveId),
      L(objectId),
      P("object-o", "theme", objectId),
      task11VerbForm(lemmaId, form),
    ],
    {
      conceptIds: [
        "na-adjective-predicate-and-attributive",
        ...(form === "te-imasu" ? ["base-construction-te-imasu"] : []),
      ],
      patternCellIds: [cellId],
      semanticRoleIds: ["topic", "theme"],
      interpretationTags: [interpretation],
      predicateSenseId,
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId,
        provided: { topic: "topic-wa", theme: "object-o" },
        attachmentLexemeIdByRole: { topic: subjectId, theme: objectId },
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

function describedSubjectActionTimeTarget(
  adjectiveId: string,
  subjectId: string,
  timeId: string,
  lemmaId: string,
  form: "polite-nonpast" | "nonpast-negative",
): BaseTask11TargetSpec {
  return task11Target(
    [
      naAttributive(adjectiveId),
      L(subjectId),
      P("topic-wa", "topic", subjectId),
      L(timeId),
      P("time-ni", "time", timeId),
      TASK11_COMMA,
      task11VerbForm(lemmaId, form),
    ],
    {
      conceptIds: [
        "na-adjective-predicate-and-attributive",
        "time-ni",
        "dynamic-nonpast-semantics",
      ],
      patternCellIds: [CELLS.timeNi],
      semanticRoleIds: ["topic", "time"],
      interpretationTags: ["future"],
      predicateSenseId: "action-time",
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "action-time",
        provided: { topic: "topic-wa", time: "time-ni" },
        attachmentLexemeIdByRole: { topic: subjectId, time: timeId },
      },
    },
  );
}

function dayNightTravelTarget(dayId: string): BaseTask11TargetSpec {
  return task11Target(
    [
      L(dayId),
      P("possessive-attributive-no", "possessor", dayId),
      L("noun-yoru"),
      P("time-ni", "time", "noun-yoru"),
      task11VerbForm("verb-ryokou-suru", "polite-nonpast"),
    ],
    {
      conceptIds: ["possessive-no", "time-ni", "dynamic-nonpast-semantics"],
      patternCellIds: [CELLS.timeNi],
      semanticRoleIds: ["possessor", "time"],
      interpretationTags: ["future"],
      predicateSenseId: "action-time",
      predicateLexemeId: "verb-ryokou-suru",
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "action-time",
        provided: {
          possessor: "possessive-attributive-no",
          time: "time-ni",
        },
        attachmentLexemeIdByRole: {
          possessor: dayId,
          time: "noun-yoru",
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
  lemmaId: "verb-iku" | "verb-kuru" | "verb-kaeru" | "verb-motte-kuru",
  form: BaseTask11VerbFormKind,
  interpretation: "future" | "habitual" | "past",
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  const predicateSenseId =
    lemmaId === "verb-iku"
      ? "go-goal"
      : lemmaId === "verb-kuru"
        ? "come-goal"
        : lemmaId === "verb-motte-kuru"
          ? "come"
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

function withTopic(
  target: BaseTask11TargetSpec,
  topicId: string,
): BaseTask11TargetSpec {
  const particleFrame = target.particleFrame
    ? {
        ...target.particleFrame,
        provided: {
          ...target.particleFrame.provided,
          topic: "topic-wa" as const,
        },
        attachmentLexemeIdByRole: {
          ...target.particleFrame.attachmentLexemeIdByRole,
          topic: topicId,
        },
      }
    : undefined;
  return {
    ...withPrefix(target, [L(topicId), P("topic-wa", "topic", topicId)]),
    semanticRoleIds: [...target.semanticRoleIds, "topic"],
    ...(particleFrame ? { particleFrame } : {}),
  };
}

function withPossessor(
  target: BaseTask11TargetSpec,
  possessorId: string,
): BaseTask11TargetSpec {
  const particleFrame = target.particleFrame
    ? {
        ...target.particleFrame,
        provided: {
          ...target.particleFrame.provided,
          possessor: "possessive-attributive-no" as const,
        },
        attachmentLexemeIdByRole: {
          ...target.particleFrame.attachmentLexemeIdByRole,
          possessor: possessorId,
        },
      }
    : undefined;
  return {
    ...withPrefix(target, [
      L(possessorId),
      P("possessive-attributive-no", "possessor", possessorId),
    ]),
    semanticRoleIds: [...target.semanticRoleIds, "possessor"],
    ...(particleFrame ? { particleFrame } : {}),
  };
}

function withUnmarkedTime(
  target: BaseTask11TargetSpec,
  timeId: string,
  conceptId: "habit-future-time-cues" | "relative-time-omission",
): BaseTask11TargetSpec {
  return {
    ...withPrefix(target, [L(timeId)]),
    conceptIds: [...target.conceptIds, conceptId],
    semanticRoleIds: [...target.semanticRoleIds, "time"],
  };
}

function withSeparatedUnmarkedTime(
  target: BaseTask11TargetSpec,
  timeId: string,
  conceptId: "habit-future-time-cues" | "relative-time-omission",
): BaseTask11TargetSpec {
  return withLeadingSeparator(withUnmarkedTime(target, timeId, conceptId));
}

function withAdditionalRelativeTime(
  target: BaseTask11TargetSpec,
  timeId: string,
): BaseTask11TargetSpec {
  return withLeadingSeparator({
    ...withPrefix(target, [L(timeId)]),
    conceptIds: [...target.conceptIds, "relative-time-omission"],
  });
}

function withLeadingSeparator(
  target: BaseTask11TargetSpec,
): BaseTask11TargetSpec {
  return {
    ...target,
    parts: [target.parts[0]!, TASK11_COMMA, ...target.parts.slice(1)],
  };
}

function withTimeNiSeparator(
  target: BaseTask11TargetSpec,
): BaseTask11TargetSpec {
  const timeParticleIndex = target.parts.findIndex(
    (part) => part.kind === "particle" && part.sense === "time-ni",
  );
  if (timeParticleIndex < 0) {
    throw new Error("A time に separator requires a licensed time particle.");
  }
  return {
    ...target,
    parts: [
      ...target.parts.slice(0, timeParticleIndex + 1),
      TASK11_COMMA,
      ...target.parts.slice(timeParticleIndex + 1),
    ],
  };
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

function goalRequestTarget(
  placeId: string,
  lemmaId: "verb-motte-kuru",
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  return task11Target(
    [
      ...prefix,
      L(placeId),
      P("goal-ni", "goal", placeId),
      task11VerbForm(lemmaId, "te-request"),
    ],
    {
      conceptIds: ["goal-ni", "base-construction-te-kudasai"],
      patternCellIds: [CELLS.request],
      semanticRoleIds: ["goal"],
      interpretationTags: ["future"],
      predicateSenseId: "come",
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "come",
        provided: { goal: "goal-ni" },
        attachmentLexemeIdByRole: { goal: placeId },
      },
    },
  );
}

function simpleRequestTarget(
  lemmaId: string,
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  return task11Target(
    [...prefix, task11VerbForm(lemmaId, "te-request")],
    {
      conceptIds: ["base-construction-te-kudasai"],
      patternCellIds: [CELLS.request],
      semanticRoleIds: [],
      interpretationTags: ["future"],
      predicateSenseId: lemmaId,
      predicateLexemeId: lemmaId,
      predicateAspect: "dynamic",
    },
  );
}

function expressionTarget(
  expressionId: string,
  prefix: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  return task11Target([...prefix, L(expressionId)], {
    conceptIds: ["sentence-omission"],
    patternCellIds: [CELLS.requestResponse],
    semanticRoleIds: [],
    interpretationTags: ["future"],
    predicateSenseId: expressionId,
    predicateLexemeId: expressionId,
    predicateAspect: "dynamic",
  });
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

function objectSequenceRequestTarget(
  objectId: string,
  firstLemmaId: string,
  finalLemmaId: string,
): BaseTask11TargetSpec {
  const predicateSenseId = themeSense(finalLemmaId);
  return task11Target(
    [
      L(objectId),
      P("object-o", "theme", objectId),
      task11VerbForm(firstLemmaId, "te-sequence"),
      TASK11_COMMA,
      task11VerbForm(finalLemmaId, "te-request"),
    ],
    {
      conceptIds: [
        "licensed-object-o",
        "base-construction-sequential-te",
        "base-construction-te-kudasai",
      ],
      patternCellIds: [CELLS.request],
      semanticRoleIds: ["theme"],
      interpretationTags: ["future"],
      predicateSenseId,
      predicateLexemeId: finalLemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId,
        provided: { theme: "object-o" },
        attachmentLexemeIdByRole: { theme: objectId },
      },
    },
  );
}

function timedSequenceTarget(
  timeId: string,
  firstLemmaId: string,
  finalLemmaId: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(timeId),
      P("time-ni", "time", timeId),
      task11VerbForm(firstLemmaId, "te-sequence"),
      TASK11_COMMA,
      task11VerbForm(finalLemmaId, "polite-nonpast"),
    ],
    {
      conceptIds: [
        "time-ni",
        "dynamic-nonpast-semantics",
        "base-construction-sequential-te",
      ],
      patternCellIds: [CELLS.timeNi, CELLS.sequence, CELLS.sequenceFinal],
      semanticRoleIds: ["time"],
      interpretationTags: ["future"],
      predicateSenseId: "action-time",
      predicateLexemeId: finalLemmaId,
      predicateAspect: "dynamic",
      particleFrame: {
        predicateSenseId: "action-time",
        provided: { time: "time-ni" },
        attachmentLexemeIdByRole: { time: timeId },
      },
    },
  );
}

function pastSequenceTarget(
  firstLemmaId: string,
  finalLemmaId: string,
  finalForm: "past-affirmative" | "past-negative",
  activityCellId?: string,
): BaseTask11TargetSpec {
  return task11Target(
    [
      task11VerbForm(firstLemmaId, "te-sequence"),
      TASK11_COMMA,
      task11VerbForm(finalLemmaId, finalForm),
    ],
    {
      conceptIds: [
        "base-construction-sequential-te",
        "four-polite-tense-cells",
      ],
      patternCellIds: activityCellId
        ? [activityCellId]
        : [CELLS.sequence, CELLS.pastAffirmative],
      semanticRoleIds: [],
      interpretationTags: [
        "past",
        ...(finalForm === "past-negative" ? (["negative"] as const) : []),
      ],
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
      TASK11_COMMA,
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

function objectErrorTarget(
  objectId: string,
  lemmaId: string,
  kana: string,
  romaji: string,
  errorCode: string,
): BaseTask11TargetSpec {
  const predicateSenseId = themeSense(lemmaId);
  return task11Target(
    [
      L(objectId),
      P("object-o", "theme", objectId),
      task11DiagnosticForm(lemmaId, kana, romaji, errorCode),
    ],
    {
      conceptIds: ["four-polite-tense-cells"],
      patternCellIds: [],
      semanticRoleIds: ["theme"],
      interpretationTags: ["past"],
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

const SYNTHESIS_1: BaseTask11LessonSpec = {
  lessonId: "base-synthesis-1",
  contract: "synthesis",
  prerequisiteLessonIds: ["requests-connection-4"],
  newLexemeIds: [],
  reviewLexemeIds: [
    "noun-eki",
    "verb-aru",
    "noun-jimusho",
    "verb-iru",
    "noun-kenkyuusha",
    "noun-hana",
    "adjective-yuumei",
    "noun-ryourinin",
    "noun-ginkouin",
    "adjective-shizuka",
    "adjective-genki",
    "noun-kaishain",
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
      withSeparatedUnmarkedTime(
        possessedNounPredicate("name-ken", "noun-yotei", "noun-kaigi"),
        "noun-raishuu",
        "habit-future-time-cues",
      ),
      "ken-meeting-plan",
      "Next week, Ken's plan is a meeting.",
      "La prossima settimana il programma di Ken prevede una riunione.",
      "Combines a relative time with a familiar person's meeting plan.",
      "Combina un tempo relativo con il programma di riunione di una persona nota.",
      "future-ken-meeting-plan",
    ),
    ex(
      possessedNounPredicate("noun-watashi", "noun-namae", "noun-yuki"),
      "self-yuki-name",
      "My name is Yuki.",
      "Mi chiamo Yuki.",
      "Uses the possessive name frame for a first-person introduction.",
      "Usa la struttura possessiva del nome per una presentazione in prima persona.",
      "identity-self-yuki",
    ),
    ex(
      famousGoodGuestTarget(),
      "famous-good-guest",
      "Ken is a famous, good customer.",
      "Ken è un cliente famoso e apprezzato.",
      "Combines familiar な- and い-adjectives before one noun.",
      "Combina aggettivi noti in な e in い prima di un unico nome.",
      "identity-famous-good-guest",
    ),
    ex(
      modifierTarget(
        "na-adjective",
        "adjective-shizuka",
        "noun-ryourinin",
        CELLS.naAttributive,
        "noun-otousan",
      ),
      "father-description",
      "Your father is a quiet cook.",
      "Tuo padre è un cuoco tranquillo.",
      "Places the familiar な-adjective before the profession in a description of the interlocutor's father.",
      "Colloca l'aggettivo in な già noto prima della professione in una descrizione del padre dell'interlocutore.",
      "identity-quiet-father",
    ),
    ex(
      modifierTarget(
        "na-adjective",
        "adjective-genki",
        "noun-ginkouin",
        CELLS.naAttributive,
        "noun-okaasan",
      ),
      "mother-description",
      "Your mother is an energetic bank clerk.",
      "Tua madre è un'impiegata di banca piena di energia.",
      "Continues the interlocutor's family description with a different person and profession.",
      "Continua la descrizione della famiglia dell'interlocutore con una persona e una professione diverse.",
      "identity-energetic-mother",
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
      asQuestion(
        topicLocation("noun-konbini", "noun-basutei", "verb-aru"),
        "verb-aru",
      ),
      "convenience-store-at-bus-stop-question",
      "Is the convenience store at the bus stop?",
      "Il minimarket è alla fermata dell'autobus?",
      "Checks one proposed location for an established destination.",
      "Verifica un luogo proposto per una destinazione già nota.",
      "location-convenience-store",
    ),
    ex(
      fullExistence("noun-jimusho", "noun-hana", "verb-aru"),
      "office-flower",
      "There is a flower in the office.",
      "Nell'ufficio c'è un fiore.",
      "Keeps place に and existential が in their established roles.",
      "Mantiene に di luogo e が esistenziale nei ruoli già appresi.",
      "office-flower-existence",
    ),
    ex(
      withPossessor(
        fullExistence("noun-toshi", "noun-byouin", "verb-aru"),
        "name-mika",
      ),
      "hospital-in-mika-city",
      "There is a hospital in Mika's city.",
      "Nella città di Mika c'è un ospedale.",
      "Uses a possessive place inside a complete existence frame.",
      "Usa un luogo possessivo in una struttura di esistenza completa.",
      "existence-mika-city-hospital",
    ),
    ex(
      fullExistence("noun-eki", "noun-keisatsukan", "verb-iru"),
      "officer-at-station",
      "There is a police officer at the station.",
      "Alla stazione c'è un poliziotto.",
      "Retrieves an animate existence frame in a plausible public place.",
      "Recupera una struttura di esistenza animata in un luogo pubblico plausibile.",
      "existence-station-officer",
    ),
  ],
  activities: [
    act(
      "base-synthesis-1",
      1,
      task11Cue(
        L("noun-kenkyuusha"),
        TASK11_COMMA,
        L("adjective-yuumei"),
      ),
      predicateTarget(
        "na-adjective",
        "adjective-yuumei",
        "negative",
        CELLS.naAffirmative,
        "noun-kenkyuusha",
      ),
      predicateTarget(
        "na-adjective",
        "adjective-yuumei",
        "affirmative",
        CELLS.naAffirmative,
        "noun-kenkyuusha",
      ),
      0,
      CELLS.naAffirmative,
      BASE_MEANING_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-1",
      2,
      task11Cue(
        L("name-ai"),
        TASK11_COMMA,
        L("noun-kuni"),
        TASK11_COMMA,
        L("noun-nihon"),
      ),
      possessedNounPredicate(
        "name-ai",
        "noun-kuni",
        "noun-nihon",
        "negative",
      ),
      possessedNounPredicate("name-ai", "noun-kuni", "noun-nihon"),
      1,
      CELLS.nounNegative,
      BASE_FORM_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-1",
      3,
      task11Cue(
        L("noun-satou"),
        TASK11_COMMA,
        L("adjective-shizuka"),
        TASK11_COMMA,
        L("noun-ryourinin"),
      ),
      modifierTarget(
        "na-adjective",
        "adjective-shizuka",
        "noun-ryourinin",
        CELLS.naAttributive,
        "noun-satou",
      ),
      {
        ...modifierTarget(
          "na-adjective",
          "adjective-shizuka",
          "noun-ryourinin",
          CELLS.naAttributive,
          "noun-satou",
        ),
        parts: [
          L("noun-satou"),
          P("topic-wa", "topic", "noun-satou"),
          predicatePart("noun", "noun-ryourinin", "affirmative"),
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
        L("noun-okaasan"),
        TASK11_COMMA,
        L("noun-ginkouin"),
      ),
      predicateTarget(
        "noun",
        "noun-ginkouin",
        "affirmative",
        CELLS.nounAffirmative,
        "noun-okaasan",
      ),
      predicateTarget(
        "noun",
        "noun-ginkouin",
        "negative",
        CELLS.nounAffirmative,
        "noun-okaasan",
      ),
      1,
      CELLS.nounAffirmative,
      BASE_CONTROLLED_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-1",
      5,
      errorTarget(
        "verb-kaku",
        "かきますた",
        "kakimasuta",
        "synthesis-past-suffix",
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
        L("noun-hana"),
        TASK11_COMMA,
        L("noun-eki"),
      ),
      topicLocation("noun-hana", "noun-eki", "verb-aru"),
      fullExistence("noun-eki", "noun-hana", "verb-aru"),
      1,
      CELLS.existenceTopicContrast,
      BASE_CONTEXT_ACTIVITY_SHAPE,
      { contrastAxis: "information-structure" },
    ),
    act(
      "base-synthesis-1",
      7,
      task11Cue(
        L("noun-yuki-san"),
        TASK11_COMMA,
        L("adjective-genki"),
      ),
      predicateTarget(
        "na-adjective",
        "adjective-genki",
        "affirmative",
        CELLS.naAffirmative,
        "noun-yuki-san",
      ),
      predicateTarget(
        "na-adjective",
        "adjective-genki",
        "negative",
        CELLS.naAffirmative,
        "noun-yuki-san",
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
        L("noun-jimusho"),
        TASK11_COMMA,
        L("noun-kaishain"),
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
      task11Cue(
        L("noun-hirugohan"),
        TASK11_COMMA,
        L("adjective-oishii"),
      ),
      predicateTarget(
        "i-adjective",
        "adjective-oishii",
        "affirmative",
        CELLS.iAffirmative,
        "noun-hirugohan",
      ),
      predicateTarget(
        "i-adjective",
        "adjective-oishii",
        "negative",
        CELLS.iNegative,
        "noun-hirugohan",
      ),
      0,
      CELLS.iAffirmative,
      BASE_LISTENING_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-1",
      10,
      task11Cue(
        L("noun-tanaka"),
        TASK11_COMMA,
        L("noun-ekiin"),
      ),
      predicateTarget(
        "noun",
        "noun-ekiin",
        "affirmative",
        CELLS.nounAffirmative,
        "noun-tanaka",
      ),
      predicateTarget(
        "noun",
        "noun-ekiin",
        "negative",
        CELLS.nounAffirmative,
        "noun-tanaka",
      ),
      0,
      CELLS.nounAffirmative,
      BASE_SPOKEN_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
  ],
  dialogue: [
    turn(
      "partner",
      asQuestion(
        possessedNounPredicate(
          "noun-otousan",
          "noun-namae",
          "noun-nan",
        ),
        "noun-nan",
      ),
      "ask-father-name",
      "What is your father's name?",
      "Come si chiama tuo padre?",
      "Opens a practical family exchange with one explicit name topic.",
      "Apre uno scambio pratico sulla famiglia con il tema esplicito del nome.",
    ),
    turn(
      "learner",
      possessedNounPredicate(
        "noun-chichi",
        "noun-namae",
        "name-sora",
      ),
      "give-father-name",
      "My father's name is Sora.",
      "Mio padre si chiama Sora.",
      "Answers with the corresponding in-group family term and the same name topic.",
      "Risponde con il termine familiare del proprio gruppo e lo stesso tema del nome.",
    ),
    turn(
      "partner",
      asQuestion(
        predicateTarget(
          "noun",
          "noun-kenkyuusha",
          "affirmative",
          CELLS.nounAffirmative,
          "noun-okaasan",
        ),
        "noun-kenkyuusha",
      ),
      "ask-mother-profession",
      "Is your mother a researcher?",
      "Tua madre è una ricercatrice?",
      "Moves to one related family profession without changing the interlocutor.",
      "Passa a una professione familiare collegata senza cambiare interlocutore.",
    ),
    turn(
      "learner",
      withPrefix(
        predicateTarget(
          "noun",
          "noun-kenkyuusha",
          "affirmative",
          CELLS.sentenceOmission,
          null,
          [],
          ["sentence-omission"],
        ),
        [L("expression-sou"), TASK11_DESU, TASK11_COMMA],
      ),
      "confirm-mother-profession",
      "That's right, she is a researcher.",
      "Esatto, è una ricercatrice.",
      "Confirms the same family fact with a brief polite response.",
      "Conferma lo stesso dato familiare con una breve risposta cortese.",
    ),
    turn(
      "partner",
      asQuestion(
        possessedAdjectivePredicate(
          "noun-okaasan",
          "noun-jimusho",
          "adjective-kirei",
        ),
        "adjective-kirei",
      ),
      "ask-office-clean",
      "Is your mother's office clean?",
      "L'ufficio di tua madre è pulito?",
      "Asks one connected question about the mother's workplace.",
      "Fa una domanda collegata sul luogo di lavoro della madre.",
    ),
    turn(
      "learner",
      predicateTarget(
        "na-adjective",
        "adjective-kirei",
        "affirmative",
        CELLS.sentenceOmission,
        null,
        [L("expression-hai"), TASK11_COMMA],
        ["sentence-omission"],
      ),
      "confirm-office-clean",
      "Yes, it is clean.",
      "Sì, è pulito.",
      "Closes the topic chain with the same recoverable office.",
      "Chiude la catena tematica mantenendo recuperabile lo stesso ufficio.",
    ),
    turn(
      "partner",
      asQuestion(
        possessedTopicPredicate(
          "noun-okaasan",
          "noun-kasa",
          "i-adjective",
          "adjective-takai",
          CELLS.iAffirmative,
        ),
        "adjective-takai",
      ),
      "ask-mother-umbrella-price",
      "Is your mother's umbrella expensive?",
      "L'ombrello di tua madre è costoso?",
      "Continues with one related possession and one clear adjective question.",
      "Continua con un possesso collegato e una chiara domanda aggettivale.",
    ),
    turn(
      "learner",
      predicateTarget(
        "i-adjective",
        "adjective-takai",
        "negative",
        CELLS.sentenceOmission,
        null,
        [L("expression-iie"), TASK11_COMMA],
        ["sentence-omission"],
      ),
      "answer-mother-umbrella-price",
      "No, it is not expensive.",
      "No, non è costoso.",
      "Answers about the same umbrella without repeating its recoverable owner.",
      "Risponde sullo stesso ombrello senza ripeterne la proprietaria recuperabile.",
    ),
  ],
};

const SYNTHESIS_2: BaseTask11LessonSpec = {
  lessonId: "base-synthesis-2",
  contract: "synthesis",
  prerequisiteLessonIds: ["base-synthesis-1"],
  newLexemeIds: [],
  reviewLexemeIds: [
    "noun-ashita",
    "verb-kaku",
    "noun-kinou",
    "noun-fudan",
    "noun-shigoto",
    "verb-suru",
    "verb-utau",
    "noun-yoru",
    "verb-kiku",
    "verb-tsukuru",
    "noun-fuku",
    "verb-kiru",
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
    "i-adjective-class",
    "modifier-before-noun",
    "affirmative-desu",
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
    CELLS.iAttributive,
    CELLS.nounAffirmative,
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
        "noun-maishuu",
        "verb-kaku",
        "nonpast-negative",
        CELLS.nonpastNegative,
        "habitual",
      ),
      "habitual-negative-writing",
      "I do not write every week.",
      "Non scrivo ogni settimana.",
      "Uses dynamic nonpast negative only for a repeated weekly pattern.",
      "Usa il non-passato negativo dinamico soltanto per un'abitudine settimanale.",
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
      withTimeNiSeparator(
        actionTimeTarget(
          null,
          "noun-getsuyoubi",
          "verb-dekakeru",
          "polite-nonpast",
          CELLS.timeNi,
          "future",
        ),
      ),
      "monday-outing",
      "I will go out on Monday.",
      "Uscirò lunedì.",
      "Places one future outing on a stated weekday.",
      "Colloca un'uscita futura in un giorno della settimana indicato.",
      "future-monday-outing",
    ),
    ex(
      timeBoundsTarget(
        "noun-chichi",
        "noun-shichiji",
        "noun-kuji",
      ),
      "bounded-study-plan",
      "My father will study from seven until nine.",
      "Mio padre studierà dalle sette alle nove.",
      "Keeps から and まで as the two limits of one plan.",
      "Mantiene から e まで come i due limiti di un unico piano.",
      "time-bounds-future",
    ),
    ex(
      objectVerbTarget(
        "noun-fuku",
        "verb-kiru",
        "past-affirmative",
        CELLS.pastAffirmative,
        "past",
      ),
      "wore-clothes",
      "I wore the clothes.",
      "Ho indossato i vestiti.",
      "Keeps the clothing argument licensed by を in a completed action.",
      "Mantiene l'argomento dei vestiti retto da を in un'azione conclusa.",
      "past-wore-clothes",
    ),
    ex(
      asQuestion(
        withUnmarkedTime(
          sequenceTarget("verb-kiku", "verb-tsukuru"),
          "noun-ashita",
          "habit-future-time-cues",
        ),
        "verb-tsukuru",
      ),
      "listen-then-make",
      "Will you listen and then make it tomorrow?",
      "Domani ascolterai e poi lo farai?",
      "Connects two planned actions while keeping their order explicit.",
      "Collega due azioni programmate mantenendone esplicito l'ordine.",
      "future-listen-make",
    ),
    ex(
      modifierTarget(
        "i-adjective",
        "adjective-ii",
        "anchor-kyaku",
        CELLS.iAttributive,
        "name-ken",
      ),
      "good-guest",
      "Ken is a good customer.",
      "Ken è un buon cliente.",
      "Uses a familiar い-adjective directly before one noun.",
      "Usa un aggettivo noto in い direttamente prima di un nome.",
      "description-good-guest",
    ),
    ex(
      withTimeNiSeparator(
        actionTimeTarget(
          null,
          "noun-kuji",
          "verb-neru",
          "polite-nonpast",
          CELLS.timeNi,
          "future",
        ),
      ),
      "sleep-at-nine",
      "I will sleep at nine.",
      "Dormirò alle nove.",
      "Places a familiar future action at a specific time.",
      "Colloca un'azione futura già nota a un'ora specifica.",
      "future-sleep-time",
    ),
  ],
  activities: [
    act(
      "base-synthesis-2",
      1,
      task11Cue(
        L("noun-ashita"),
        TASK11_COMMA,
        L("name-sora"),
        TASK11_COMMA,
        L("verb-kaku"),
      ),
      withSeparatedUnmarkedTime(
        simpleVerbTarget(
          "verb-kaku",
          "polite-nonpast",
          CELLS.future,
          "future",
          "name-sora",
          [],
          ["sentence-order", "dynamic-nonpast-semantics"],
        ),
        "noun-ashita",
        "habit-future-time-cues",
      ),
      withSeparatedUnmarkedTime(
        simpleVerbTarget(
          "verb-kaku",
          "past-affirmative",
          CELLS.future,
          "past",
          "name-sora",
          [],
          ["sentence-order", "four-polite-tense-cells"],
        ),
        "noun-ashita",
        "habit-future-time-cues",
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
        L("noun-tanaka"),
        TASK11_COMMA,
        L("noun-yoru"),
        TASK11_COMMA,
        L("verb-utau"),
      ),
      actionTimeTarget(
        "noun-tanaka",
        "noun-yoru",
        "verb-utau",
        "nonpast-negative",
        CELLS.nonpastNegative,
        "future",
      ),
      actionTimeTarget(
        "noun-tanaka",
        "noun-yoru",
        "verb-utau",
        "polite-nonpast",
        CELLS.nonpastNegative,
        "future",
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
        L("verb-kiku"),
        TASK11_COMMA,
        L("verb-tsukuru"),
      ),
      sequenceTarget("verb-kiku", "verb-tsukuru", CELLS.sequenceFinal),
      reversedSequenceTarget("verb-kiku", "verb-tsukuru", CELLS.sequenceFinal),
      0,
      CELLS.sequenceFinal,
      BASE_ORDERING_ACTIVITY_SHAPE,
      { contrastAxis: "schedule-route" },
    ),
    act(
      "base-synthesis-2",
      4,
      task11Cue(
        L("noun-fuku"),
        TASK11_COMMA,
        L("verb-kiru"),
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
      errorTarget(
        "verb-miseru",
        "みせましだ",
        "misemashida",
        "synthesis-past-voicing",
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
        L("noun-kinou"),
        TASK11_COMMA,
        L("verb-shiru"),
      ),
      withUnmarkedTime(
        simpleVerbTarget(
          "verb-shiru",
          "past-affirmative",
          CELLS.pastAffirmative,
          "past",
        ),
        "noun-kinou",
        "relative-time-omission",
      ),
      withUnmarkedTime(
        simpleVerbTarget(
          "verb-shiru",
          "past-negative",
          CELLS.pastAffirmative,
          "past",
        ),
        "noun-kinou",
        "relative-time-omission",
      ),
      0,
      CELLS.pastAffirmative,
      BASE_CONTEXT_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      7,
      task11Cue(
        L("noun-fudan"),
        TASK11_COMMA,
        L("noun-shigoto"),
        TASK11_COMMA,
        L("verb-suru"),
      ),
      withUnmarkedTime(
        objectVerbTarget(
          "noun-shigoto",
          "verb-suru",
          "nonpast-negative",
          CELLS.habitual,
          "habitual",
        ),
        "noun-fudan",
        "habit-future-time-cues",
      ),
      withUnmarkedTime(
        objectVerbTarget(
          "noun-shigoto",
          "verb-suru",
          "polite-nonpast",
          CELLS.habitual,
          "habitual",
        ),
        "noun-fudan",
        "habit-future-time-cues",
      ),
      0,
      CELLS.habitual,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      8,
      task11Cue(
        L("noun-kinou"),
        TASK11_COMMA,
        L("noun-yamada"),
        TASK11_COMMA,
        L("verb-yasumu"),
      ),
      withSeparatedUnmarkedTime(
        simpleVerbTarget(
          "verb-yasumu",
          "past-affirmative",
          CELLS.pastAffirmative,
          "past",
          "noun-yamada",
        ),
        "noun-kinou",
        "relative-time-omission",
      ),
      withSeparatedUnmarkedTime(
        simpleVerbTarget(
          "verb-yasumu",
          "past-negative",
          CELLS.pastAffirmative,
          "past",
          "noun-yamada",
        ),
        "noun-kinou",
        "relative-time-omission",
      ),
      0,
      CELLS.pastAffirmative,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-2",
      9,
      task11Cue(
        L("noun-kesa"),
        TASK11_COMMA,
        L("verb-sanpo-suru"),
        TASK11_COMMA,
        L("verb-hashiru"),
      ),
      withSeparatedUnmarkedTime(
        pastSequenceTarget(
          "verb-sanpo-suru",
          "verb-hashiru",
          "past-affirmative",
          CELLS.pastAffirmative,
        ),
        "noun-kesa",
        "relative-time-omission",
      ),
      withSeparatedUnmarkedTime(
        pastSequenceTarget(
          "verb-sanpo-suru",
          "verb-hashiru",
          "past-negative",
          CELLS.pastAffirmative,
        ),
        "noun-kesa",
        "relative-time-omission",
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
        L("expression-sumimasen"),
        TASK11_COMMA,
        L("noun-namae"),
        TASK11_COMMA,
        L("verb-kesu"),
      ),
      requestTarget("noun-namae", "verb-kesu", [
        L("expression-sumimasen"),
        TASK11_COMMA,
      ]),
      objectVerbTarget(
        "noun-namae",
        "verb-kesu",
        "polite-nonpast",
        CELLS.request,
        "future",
        [L("expression-sumimasen"), TASK11_COMMA],
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
      predicateTarget(
        "noun",
        "noun-yuki",
        "affirmative",
        CELLS.nounAffirmative,
        "noun-watashi",
      ),
      "introduce-yuki",
      "I am Yuki.",
      "Sono Yuki.",
      "Introduces the learner before the schedule exchange begins.",
      "Presenta lo studente prima dell'inizio dello scambio sugli orari.",
    ),
    turn(
      "partner",
      asQuestion(
        withUnmarkedTime(
          objectVerbTarget(
          "noun-shigoto",
          "verb-suru",
          "polite-nonpast",
          CELLS.habitual,
          "habitual",
          [],
          ["dynamic-nonpast-semantics"],
          ),
          "noun-fudan",
          "habit-future-time-cues",
        ),
        "verb-suru",
      ),
      "ask-work-routine",
      "Do you usually work?",
      "Di solito lavori?",
      "Opens a practical schedule exchange with a habitual work question.",
      "Apre uno scambio pratico sugli orari con una domanda sul lavoro abituale.",
    ),
    turn(
      "learner",
      withPrefix(
        objectVerbTarget(
          "noun-shigoto",
          "verb-suru",
          "polite-nonpast",
          CELLS.habitual,
          "habitual",
          [],
          ["dynamic-nonpast-semantics"],
        ),
        [L("expression-sou"), TASK11_DESU, TASK11_COMMA],
      ),
      "confirm-work-routine",
      "That's right, I work.",
      "Esatto, lavoro.",
      "Answers with the same licensed work object and habitual reading.",
      "Risponde con lo stesso oggetto del lavoro e la stessa lettura abituale.",
    ),
    turn(
      "learner",
      withTimeNiSeparator(
        actionTimeTarget(
          null,
          "noun-yoru",
          "verb-utau",
          "polite-nonpast",
          CELLS.future,
          "future",
        ),
      ),
      "state-evening-plan",
      "I will sing tonight.",
      "Canterò stasera.",
      "Adds one clear future plan after the work routine.",
      "Aggiunge un piano futuro chiaro dopo la routine di lavoro.",
    ),
    turn(
      "partner",
      asQuestion(
        withTimeNiSeparator(
          timedSequenceTarget(
            "noun-goji",
            "verb-denwa-suru",
            "verb-au",
          ),
        ),
        "verb-au",
      ),
      "ask-call-meeting-plan",
      "I see. Will you call and then meet at five?",
      "Capisco. Telefonerai e poi vi incontrerete alle cinque?",
      "Acknowledges the routine, then asks about two ordered actions at five.",
      "Riconosce l'abitudine, poi chiede di due azioni ordinate alle cinque.",
    ),
    turn(
      "learner",
      withPrefix(
        withLeadingSeparator(
          withUnmarkedTime(
            sequenceTarget("verb-denwa-suru", "verb-au", CELLS.sequenceFinal),
            "noun-ashita",
            "relative-time-omission",
          ),
        ),
        [L("expression-iie"), TASK11_COMMA],
      ),
      "move-call-meeting-plan",
      "No, I will call and then meet tomorrow.",
      "No, telefonerò e poi ci incontreremo domani.",
      "Keeps both actions in order while correcting only the date.",
      "Mantiene entrambe le azioni in ordine correggendo soltanto la data.",
    ),
    turn(
      "partner",
      expressionTarget("expression-onegaishimasu", [
        L("noun-shorui"),
        TASK11_COMMA,
      ]),
      "request-documents",
      "The documents, please.",
      "I documenti, per favore.",
      "Makes a concise request for the documents needed for the plan.",
      "Formula una richiesta concisa dei documenti necessari per il piano.",
    ),
    turn(
      "learner",
      withPrefix(
        simpleVerbTarget(
          "verb-motte-kuru",
          "polite-nonpast",
          CELLS.requestResponse,
          "future",
        ),
        [L("expression-wakarimashita"), TASK11_COMMA],
      ),
      "accept-document-request",
      "Understood, I will bring them.",
      "Ho capito, li porterò.",
      "Accepts the request while the documents remain recoverable.",
      "Accetta la richiesta mantenendo recuperabili i documenti.",
    ),
  ],
};

const SYNTHESIS_3: BaseTask11LessonSpec = {
  lessonId: "base-synthesis-3",
  contract: "synthesis",
  prerequisiteLessonIds: ["base-synthesis-2"],
  newLexemeIds: [],
  reviewLexemeIds: [
    "noun-mise",
    "noun-shio",
    "verb-aru",
    "noun-chizu",
    "noun-jimusho",
    "noun-mado",
    "verb-shimeru",
    "verb-arau",
    "verb-noru",
    "verb-deru",
    "verb-motte-kuru",
    "noun-tanaka",
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
    CELLS.nounAffirmative,
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
      asQuestion(
        fullExistence("noun-mise", "noun-shio", "verb-aru"),
        "verb-aru",
      ),
      "shop-salt-question",
      "Is there salt in the shop?",
      "C'è del sale nel negozio?",
      "Uses location に and existential が for an inanimate entity.",
      "Usa に di luogo e が esistenziale per un'entità inanimata.",
      "existence-shop-salt",
    ),
    ex(
      fullExistence("noun-niwa", "noun-yuki-san", "verb-iru"),
      "yuki-in-garden",
      "Yuki is in the garden.",
      "Yuki è in giardino.",
      "Selects います for an animate entity.",
      "Seleziona います per un'entità animata.",
      "existence-yuki-garden",
    ),
    ex(
      expressionTarget("expression-onegaishimasu", [
        L("noun-nimotsu"),
        TASK11_COMMA,
      ]),
      "luggage-please",
      "The luggage, please.",
      "Il bagaglio, per favore.",
      "Uses a concise familiar request for the luggage already under discussion.",
      "Usa una richiesta concisa già nota per il bagaglio al centro del discorso.",
      "request-luggage",
    ),
    ex(
      withSeparatedUnmarkedTime(
        actionPlace(
          "noun-kyoushitsu",
          "verb-asobu",
          "play-place",
        ),
        "noun-kyou",
        "relative-time-omission",
      ),
      "classroom-action-today",
      "I will play in the classroom today.",
      "Oggi giocherò in aula.",
      "Uses で for the place where an action happens.",
      "Usa で per il luogo in cui avviene un'azione.",
      "action-place-classroom",
    ),
    ex(
      requestTarget("noun-mado", "verb-shimeru", [
        L("expression-sumimasen"),
        TASK11_COMMA,
        L("noun-suzuki"),
        TASK11_COMMA,
      ]),
      "window-request",
      "Excuse me, Suzuki, please close the window.",
      "Mi scusi, Suzuki, chiuda la finestra, per favore.",
      "Makes a bounded practical request with てください.",
      "Formula una richiesta pratica circoscritta con てください.",
      "request-close-window",
    ),
    ex(
      asQuestion(
        withTopic(
          goalTarget(
            "noun-jimusho",
            "verb-motte-kuru",
            "polite-nonpast",
            "future",
          ),
          "noun-chizu",
        ),
        "verb-motte-kuru",
      ),
      "bring-map-question",
      "Will you bring the map to the office?",
      "Porterai la mappa in ufficio?",
      "Asks whether the map will be brought to the meeting place.",
      "Chiede se la mappa verrà portata al luogo dell'incontro.",
      "future-bring-map",
    ),
    ex(
      asQuestion(
        predicateTarget(
          "noun",
          "noun-dare",
          "affirmative",
          CELLS.nounAffirmative,
          "noun-ekiin",
        ),
        "noun-dare",
      ),
      "identify-station-attendant",
      "Who is the station attendant?",
      "Chi è l'addetto della stazione?",
      "Asks for the identity of the station attendant.",
      "Chiede l'identità dell'addetto della stazione.",
      "identity-station-attendant",
    ),
    ex(
      requestTarget("noun-kaban", "verb-miseru", [
        L("expression-sumimasen"),
        TASK11_COMMA,
      ]),
      "show-bag-request",
      "Excuse me, please show me the bag.",
      "Mi scusi, mi mostri la borsa, per favore.",
      "Keeps the requested object licensed by を in a polite request.",
      "Mantiene l'oggetto richiesto retto da を in una richiesta cortese.",
      "request-show-bag",
    ),
    ex(
      requestTarget("noun-fuku", "verb-arau", [
        L("expression-sumimasen"),
        TASK11_COMMA,
      ]),
      "wash-clothes-request",
      "Excuse me, please wash the clothes.",
      "Mi scusi, lavi i vestiti, per favore.",
      "Places すみません before a practical request with a licensed object.",
      "Colloca すみません prima di una richiesta pratica con un oggetto retto.",
      "request-wash-clothes",
    ),
    ex(
      asQuestion(
        sequenceTarget("verb-noru", "verb-deru"),
        "verb-deru",
      ),
      "board-then-leave",
      "Will you board and then leave?",
      "Salirai a bordo e poi partirai?",
      "Keeps the boarding action first and the finite movement action last.",
      "Mantiene prima l'azione di salire a bordo e per ultima l'azione di movimento finita.",
      "sequence-board-leave",
    ),
  ],
  activities: [
    act(
      "base-synthesis-3",
      1,
      task11Cue(
        L("noun-shio"),
        TASK11_COMMA,
        L("noun-mise"),
      ),
      fullExistence("noun-mise", "noun-shio", "verb-aru"),
      topicLocation("noun-shio", "noun-mise", "verb-aru"),
      1,
      CELLS.existenceFrame,
      BASE_MEANING_ACTIVITY_SHAPE,
      { contrastAxis: "information-structure" },
    ),
    act(
      "base-synthesis-3",
      2,
      task11Cue(
        L("noun-tanaka"),
        TASK11_COMMA,
        L("noun-nimotsu"),
        TASK11_COMMA,
        L("noun-jimusho"),
        TASK11_COMMA,
        L("verb-motte-kuru"),
      ),
      withPrefix(
        withTopic(
          goalRequestTarget("noun-jimusho", "verb-motte-kuru"),
          "noun-nimotsu",
        ),
        [L("noun-tanaka"), TASK11_COMMA],
      ),
      withPrefix(
        withTopic(
          {
            ...goalTarget(
              "noun-jimusho",
              "verb-motte-kuru",
              "polite-nonpast",
              "future",
            ),
            patternCellIds: [CELLS.request],
          },
          "noun-nimotsu",
        ),
        [L("noun-tanaka"), TASK11_COMMA],
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
        L("verb-noru"),
        TASK11_COMMA,
        L("verb-deru"),
      ),
      sequenceTarget("verb-noru", "verb-deru", CELLS.sequenceFinal),
      reversedSequenceTarget("verb-noru", "verb-deru", CELLS.sequenceFinal),
      0,
      CELLS.sequenceFinal,
      BASE_ORDERING_ACTIVITY_SHAPE,
      { contrastAxis: "schedule-route" },
    ),
    act(
      "base-synthesis-3",
      4,
      task11Cue(
        L("noun-konban"),
        TASK11_COMMA,
        L("expression-douzo"),
        TASK11_COMMA,
        L("verb-hairu"),
      ),
      withSeparatedUnmarkedTime(
        simpleRequestTarget("verb-hairu", [
          L("expression-douzo"),
          TASK11_COMMA,
        ]),
        "noun-konban",
        "habit-future-time-cues",
      ),
      asQuestion(
        withSeparatedUnmarkedTime(
          simpleVerbTarget(
            "verb-hairu",
            "polite-nonpast",
            CELLS.request,
            "future",
          ),
          "noun-konban",
          "habit-future-time-cues",
        ),
        "verb-hairu",
      ),
      1,
      CELLS.request,
      BASE_CONTROLLED_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-3",
      5,
      objectErrorTarget(
        "noun-fuku",
        "verb-arau",
        "あらいましたた",
        "araimashitata",
        "synthesis-past-ending",
      ),
      objectVerbTarget(
        "noun-fuku",
        "verb-arau",
        "past-affirmative",
        CELLS.pastAffirmative,
        "past",
      ),
      objectErrorTarget(
        "noun-fuku",
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
        L("noun-ima"),
        TASK11_COMMA,
        L("verb-hanasu"),
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
      0,
      CELLS.teImasuOngoing,
      BASE_CONTEXT_ACTIVITY_SHAPE,
      { contrastAxis: "interpretation" },
    ),
    act(
      "base-synthesis-3",
      7,
      task11Cue(
        L("noun-chizu"),
        TASK11_COMMA,
        L("noun-jimusho"),
      ),
      topicLocation("noun-chizu", "noun-jimusho", "verb-aru"),
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
        L("noun-tanaka"),
        TASK11_COMMA,
        L("noun-mado"),
        TASK11_COMMA,
        L("verb-shimeru"),
      ),
      requestTarget("noun-mado", "verb-shimeru", [
        L("noun-tanaka"),
        TASK11_COMMA,
      ]),
      objectVerbTarget(
        "noun-mado",
        "verb-shimeru",
        "polite-nonpast",
        CELLS.request,
        "future",
        [L("noun-tanaka"), TASK11_COMMA],
      ),
      1,
      CELLS.request,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-3",
      9,
      task11Cue(
        L("anchor-chuui"),
        TASK11_COMMA,
        L("verb-yomu"),
      ),
      objectVerbTarget(
        "anchor-chuui",
        "verb-yomu",
        "polite-nonpast",
        CELLS.request,
        "future",
      ),
      objectVerbTarget(
        "anchor-chuui",
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
        L("noun-kaban"),
        TASK11_COMMA,
        L("verb-akeru"),
        TASK11_COMMA,
        L("verb-toru"),
      ),
      withPrefix(
        objectSequenceRequestTarget(
          "noun-kaban",
          "verb-akeru",
          "verb-toru",
        ),
        [L("expression-sumimasen"), TASK11_COMMA],
      ),
      withPrefix(
        objectSequenceRequestTarget(
          "noun-kaban",
          "verb-toru",
          "verb-akeru",
        ),
        [L("expression-sumimasen"), TASK11_COMMA],
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
      withSeparatedUnmarkedTime(
        topicLocation("noun-toire", "noun-uketsuke", "verb-aru"),
        "noun-kyou",
        "relative-time-omission",
      ),
      "locate-restroom",
      "Today, the restroom is at reception.",
      "Oggi il bagno è alla reception.",
      "Supplies the requested place without changing the frame.",
      "Fornisce il luogo richiesto senza cambiare struttura.",
    ),
    turn(
      "learner",
      asQuestion(
        withAdditionalRelativeTime(
          dayNightTravelTarget("noun-getsuyoubi"),
          "noun-konshuu",
        ),
        "verb-ryokou-suru",
      ),
      "ask-travel-plan",
      "Will you travel on Monday night this week?",
      "Viaggerai lunedì sera questa settimana?",
      "Connects the location exchange to a specific travel plan.",
      "Collega lo scambio sui luoghi a un programma di viaggio specifico.",
    ),
    turn(
      "partner",
      withPrefix(
        withAdditionalRelativeTime(
          dayNightTravelTarget("noun-getsuyoubi"),
          "noun-konshuu",
        ),
        [L("expression-hai"), TASK11_COMMA],
      ),
      "confirm-travel-plan",
      "Yes, I will travel on Monday night this week.",
      "Sì, viaggerò lunedì sera questa settimana.",
      "Confirms the same weekday and time of day.",
      "Conferma lo stesso giorno della settimana e momento della giornata.",
    ),
    turn(
      "learner",
      requestTarget("noun-chizu", "verb-miseru", [
        L("expression-sumimasen"),
        TASK11_COMMA,
        L("noun-tanaka"),
        TASK11_COMMA,
      ]),
      "request-map",
      "Excuse me, Tanaka, please show me the map.",
      "Mi scusi, Tanaka, mi mostri la mappa, per favore.",
      "Turns the location exchange into a practical request addressed to Tanaka.",
      "Trasforma lo scambio sulla posizione in una richiesta pratica rivolta a Tanaka.",
    ),
    turn(
      "partner",
      simpleVerbTarget(
        "verb-miseru",
        "polite-nonpast",
        CELLS.requestResponse,
        "future",
        null,
        [L("expression-wakarimashita"), TASK11_COMMA],
        ["sentence-omission"],
      ),
      "offer-map",
      "Understood, I will show it.",
      "Ho capito, la mostrerò.",
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
    "noun-watashi",
    "noun-namae",
    "name-haru",
    "adjective-yuumei",
    "noun-enjinia",
    "verb-shiru",
    "verb-iru",
    "verb-ryouri-suru",
    "verb-yomu",
    "noun-suzuki",
    "noun-yuki-san",
    "verb-suwaru",
    "noun-ima",
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
    CELLS.habitual,
    CELLS.future,
    CELLS.timeNi,
    CELLS.pastAffirmative,
    CELLS.pastNegative,
    CELLS.existenceFrame,
    CELLS.existenceTopicContrast,
    CELLS.request,
    CELLS.sequence,
    CELLS.sequenceFinal,
    CELLS.teImasuOngoing,
    CELLS.teImasuState,
    CELLS.teImasuNonpastContrast,
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
      asQuestion(
        possessedNounPredicate("noun-okaasan", "noun-namae", "noun-nan"),
        "noun-nan",
      ),
      "mother-name-question",
      "What is your mother's name?",
      "Come si chiama tua madre?",
      "Samples sentence structure through a complete question about the interlocutor's mother.",
      "Ripassa la struttura della frase con una domanda completa sulla madre dell'interlocutore.",
      "checkpoint-identity",
    ),
    ex(
      describedObjectVerbTarget(
        "noun-suzuki",
        "adjective-yuumei",
        "noun-enjinia",
        "verb-shiru",
        "te-imasu",
        CELLS.teImasuState,
        "resulting-state",
      ),
      "known-famous-engineer",
      "Suzuki knows the famous engineer.",
      "Suzuki conosce l'ingegnere famoso.",
      "Uses attributive な and the current knowledge-state reading of ています.",
      "Usa il な attributivo e la lettura di stato attuale di ています.",
      "checkpoint-adjective",
    ),
    ex(
      relativeTimeTarget(
        "noun-kinou",
        "verb-yomu",
        "past-negative",
        CELLS.godan,
        "past",
      ),
      "yesterday-reading",
      "I did not read yesterday.",
      "Ieri non ho letto.",
      "Samples a past-negative godan polite form with a visible time.",
      "Campiona una forma cortese godan passata negativa con un tempo visibile.",
      "checkpoint-godan",
    ),
    ex(
      withSeparatedUnmarkedTime(
        withTopic(
          objectVerbTarget(
            "noun-gohan",
            "verb-taberu",
            "nonpast-negative",
            CELLS.ichidan,
            "future",
            [],
            ["ichidan-verb-class", "masu-nonpast"],
          ),
          "name-ai",
        ),
        "noun-konshuu",
        "habit-future-time-cues",
      ),
      "ichidan-eating",
      "Ai will not eat rice this week.",
      "Ai non mangerà riso questa settimana.",
      "Samples the ichidan class through an approved generated form.",
      "Campiona la classe ichidan con una forma generata approvata.",
      "checkpoint-ichidan",
    ),
    ex(
      withSeparatedUnmarkedTime(
        simpleVerbTarget(
          "verb-ryouri-suru",
          "past-affirmative",
          CELLS.special,
          "past",
          "noun-okaasan",
          [],
          ["suru-verb-class", "four-polite-tense-cells"],
        ),
        "noun-kesa",
        "relative-time-omission",
      ),
      "suru-class",
      "Your mother cooked this morning.",
      "Tua madre ha cucinato stamattina.",
      "Reviews the special する class while referring to the interlocutor's mother.",
      "Ripassa la classe speciale di する riferendosi alla madre dell'interlocutore.",
      "checkpoint-suru",
    ),
    ex(
      withSeparatedUnmarkedTime(
        simpleVerbTarget(
          "verb-utau",
          "polite-nonpast",
          CELLS.habitual,
          "habitual",
        ),
        "noun-fudan",
        "habit-future-time-cues",
      ),
      "usual-singing",
      "I usually sing.",
      "Di solito canto.",
      "Uses dynamic nonpast for a familiar repeated activity.",
      "Usa il non-passato dinamico per un'attività abituale già nota.",
      "checkpoint-habitual",
    ),
    ex(
      asQuestion(
        withPossessor(
          fullExistence("noun-toshi", "noun-byouin", "verb-aru"),
          "noun-kuni",
        ),
        "verb-aru",
      ),
      "country-city-hospital-question",
      "Is there a hospital in a city in the country?",
      "C'è un ospedale in una città del paese?",
      "Uses a possessive place inside a complete inanimate existence question.",
      "Usa un luogo possessivo in una domanda completa di esistenza inanimata.",
      "checkpoint-existence",
    ),
    ex(
      anchoredTeImasu(
        "noun-suzuki",
        "verb-hanasu",
        "ongoing-now",
      ),
      "ongoing-speaking",
      "Suzuki is speaking now.",
      "Suzuki sta parlando adesso.",
      "Reads ています as an action currently in progress.",
      "Legge ています come azione attualmente in corso.",
      "checkpoint-teimasu-ongoing",
    ),
    ex(
      asQuestion(
        anchoredTeImasu(
          "noun-yuki-san",
          "verb-suwaru",
          "resulting-state",
          "noun-isu",
        ),
        "verb-suwaru",
      ),
      "seated-state",
      "Is Yuki seated on a chair?",
      "Yuki è seduta su una sedia?",
      "Reads ています as the current result of sitting down.",
      "Legge ています come risultato attuale dell'atto di sedersi.",
      "checkpoint-teimasu-state",
    ),
    ex(
      asQuestion(
        withAdditionalRelativeTime(
          timedMeetingPlanTarget("name-mika", "noun-kuji", "affirmative"),
          "noun-raishuu",
        ),
        "noun-kaigi",
      ),
      "mika-meeting-plan-question",
      "Is Mika's plan at nine next week a meeting?",
      "Il programma di Mika alle nove della prossima settimana è una riunione?",
      "Checks a familiar person's meeting plan with relative and clock-time cues.",
      "Verifica il programma di riunione di una persona nota con indizi di tempo relativo e d'orologio.",
      "checkpoint-meeting-plan",
    ),
  ],
  activities: [
    act(
      "base-synthesis-4",
      1,
      task11Cue(
        L("adjective-genki"),
        TASK11_COMMA,
        L("noun-koumuin"),
        TASK11_COMMA,
        L("noun-nichiyoubi"),
        TASK11_COMMA,
        L("verb-hashiru"),
      ),
      describedSubjectActionTimeTarget(
        "adjective-genki",
        "noun-koumuin",
        "noun-nichiyoubi",
        "verb-hashiru",
        "polite-nonpast",
      ),
      describedSubjectActionTimeTarget(
        "adjective-genki",
        "noun-koumuin",
        "noun-nichiyoubi",
        "verb-hashiru",
        "nonpast-negative",
      ),
      1,
      CELLS.timeNi,
      BASE_MEANING_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-4",
      2,
      task11Cue(
        L("noun-haha"),
        TASK11_COMMA,
        L("noun-namae"),
        TASK11_COMMA,
        L("name-haru"),
      ),
      possessedNounPredicate(
        "noun-haha",
        "noun-namae",
        "name-haru",
      ),
      possessedNounPredicate(
        "noun-haha",
        "noun-namae",
        "name-haru",
        "negative",
      ),
      1,
      CELLS.nounAffirmative,
      BASE_FORM_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-4",
      3,
      task11Cue(
        L("verb-kiku"),
        TASK11_COMMA,
        L("verb-tetsudau"),
      ),
      sequenceTarget("verb-kiku", "verb-tetsudau", CELLS.sequenceFinal),
      reversedSequenceTarget("verb-kiku", "verb-tetsudau", CELLS.sequenceFinal),
      0,
      CELLS.sequenceFinal,
      BASE_ORDERING_ACTIVITY_SHAPE,
      { contrastAxis: "schedule-route" },
    ),
    act(
      "base-synthesis-4",
      4,
      task11Cue(
        L("noun-kodomo"),
        TASK11_COMMA,
        L("noun-sakana"),
        TASK11_COMMA,
        L("noun-uchi"),
        TASK11_COMMA,
        L("noun-uketsuke"),
      ),
      withPossessor(
        topicLocation("noun-sakana", "noun-uchi", "verb-iru"),
        "noun-kodomo",
      ),
      withPossessor(
        topicLocation("noun-sakana", "noun-uketsuke", "verb-iru"),
        "noun-kodomo",
      ),
      1,
      CELLS.existenceTopicContrast,
      BASE_CONTROLLED_ACTIVITY_SHAPE,
      { contrastAxis: "information-structure" },
    ),
    act(
      "base-synthesis-4",
      5,
      withSeparatedUnmarkedTime(
        objectErrorTarget(
          "noun-nikki",
          "verb-yomu",
          "よみまし",
          "yomimashi",
          "synthesis-missing-past-final",
        ),
        "noun-senshuu",
        "relative-time-omission",
      ),
      withSeparatedUnmarkedTime(
        objectVerbTarget(
          "noun-nikki",
          "verb-yomu",
          "past-affirmative",
          CELLS.pastAffirmative,
          "past",
        ),
        "noun-senshuu",
        "relative-time-omission",
      ),
      withSeparatedUnmarkedTime(
        objectErrorTarget(
          "noun-nikki",
          "verb-yomu",
          "よみまし",
          "yomimashi",
          "synthesis-missing-past-final",
        ),
        "noun-senshuu",
        "relative-time-omission",
      ),
      0,
      CELLS.pastAffirmative,
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
        L("noun-suzuki"),
        TASK11_COMMA,
        L("noun-goji"),
        TASK11_COMMA,
        L("noun-kuji"),
        TASK11_COMMA,
        L("verb-ryouri-suru"),
      ),
      actionTimeTarget(
        "noun-suzuki",
        "noun-goji",
        "verb-ryouri-suru",
        "polite-nonpast",
        CELLS.timeNi,
        "future",
      ),
      actionTimeTarget(
        "noun-suzuki",
        "noun-kuji",
        "verb-ryouri-suru",
        "polite-nonpast",
        CELLS.timeNi,
        "future",
      ),
      1,
      CELLS.timeNi,
      BASE_CONTEXT_ACTIVITY_SHAPE,
      { contrastAxis: "meaning" },
    ),
    act(
      "base-synthesis-4",
      7,
      task11Cue(
        L("noun-watashi"),
        TASK11_COMMA,
        L("adjective-yuumei"),
        TASK11_COMMA,
        L("noun-enjinia"),
        TASK11_COMMA,
        L("verb-shiru"),
      ),
      describedObjectVerbTarget(
        "noun-watashi",
        "adjective-yuumei",
        "noun-enjinia",
        "verb-shiru",
        "te-imasu",
        CELLS.teImasuState,
        "resulting-state",
      ),
      describedObjectVerbTarget(
        "noun-watashi",
        "adjective-yuumei",
        "noun-enjinia",
        "verb-shiru",
        "polite-nonpast",
        CELLS.teImasuState,
        "future",
      ),
      0,
      CELLS.teImasuState,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "polite-form" },
    ),
    act(
      "base-synthesis-4",
      8,
      task11Cue(
        L("noun-ima"),
        TASK11_COMMA,
        L("noun-yuki-san"),
        TASK11_COMMA,
        L("noun-isu"),
        TASK11_COMMA,
        L("verb-suwaru"),
      ),
      withSeparatedUnmarkedTime(
        seatedTarget("noun-yuki-san", "te-imasu"),
        "noun-ima",
        "relative-time-omission",
      ),
      withSeparatedUnmarkedTime(
        seatedTarget("noun-yuki-san", "polite-nonpast"),
        "noun-ima",
        "relative-time-omission",
      ),
      0,
      CELLS.teImasuState,
      BASE_RETRIEVAL_ACTIVITY_SHAPE,
      { contrastAxis: "interpretation" },
    ),
    act(
      "base-synthesis-4",
      9,
      task11Cue(
        L("noun-yuki-san"),
        TASK11_COMMA,
        L("verb-hataraku"),
      ),
      anchoredTeImasu("noun-yuki-san", "verb-hataraku", "ongoing-now"),
      simpleVerbTarget(
        "verb-hataraku",
        "polite-nonpast",
        CELLS.teImasuOngoing,
        "habitual",
        "noun-yuki-san",
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
        L("expression-sumimasen"),
        TASK11_COMMA,
        L("noun-zasshi"),
        TASK11_COMMA,
        L("verb-yomu"),
      ),
      requestTarget("noun-zasshi", "verb-yomu", [
        L("expression-sumimasen"),
        TASK11_COMMA,
      ]),
      objectVerbTarget(
        "noun-zasshi",
        "verb-yomu",
        "polite-nonpast",
        CELLS.request,
        "future",
        [L("expression-sumimasen"), TASK11_COMMA],
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
        "name-sakura",
        "affirmative",
        CELLS.nounAffirmative,
        "noun-watashi",
      ),
      "introduce-sakura",
      "I am Sakura.",
      "Sono Sakura.",
      "Opens the exchange with Sakura's direct first-person introduction.",
      "Apre lo scambio con l'autopresentazione diretta di Sakura.",
    ),
    turn(
      "learner",
      predicateTarget(
        "noun",
        "name-haru",
        "affirmative",
        CELLS.nounAffirmative,
        "noun-watashi",
      ),
      "introduce-haru",
      "I am Haru.",
      "Sono Haru.",
      "Returns the introduction before either speaker mentions another person.",
      "Ricambia la presentazione prima che uno dei due introduca un'altra persona.",
    ),
    turn(
      "learner",
      withPrefix(
        asQuestion(
          predicateTarget(
            "noun",
            "noun-dare",
            "affirmative",
            CELLS.nounAffirmative,
            "noun-tomodachi",
          ),
          "noun-dare",
        ),
        [L("expression-sumimasen"), TASK11_COMMA],
      ),
      "ask-friend",
      "Excuse me, who is your friend?",
      "Scusa, chi è il tuo amico?",
      "Asks Sakura to identify the friend who will anchor the rest of the exchange.",
      "Chiede a Sakura di identificare l'amica che resterà il riferimento dello scambio.",
    ),
    turn(
      "partner",
      predicateTarget(
        "noun",
        "noun-yuki-san",
        "affirmative",
        CELLS.nounAffirmative,
      ),
      "identify-yuki-friend",
      "My friend is Yuki.",
      "La mia amica è Yuki.",
      "Identifies Yuki with the respectful form ゆきさん.",
      "Identifica Yuki con la forma rispettosa ゆきさん.",
    ),
    turn(
      "learner",
      asQuestion(
        topicLocation("noun-yuki-san", "noun-jimusho", "verb-iru"),
        "verb-iru",
      ),
      "ask-friend-location",
      "Is Yuki at the office?",
      "Yuki è in ufficio?",
      "Checks one possible location for the friend just identified.",
      "Verifica un possibile luogo per l'amica appena identificata.",
    ),
    turn(
      "partner",
      withPrefix(
        topicLocation("noun-yuki-san", "anchor-gakkou", "verb-iru"),
        [L("expression-iie"), TASK11_COMMA],
      ),
      "locate-friend-at-school",
      "No, Yuki is at school.",
      "No, Yuki è a scuola.",
      "Corrects the proposed location while keeping Yuki as the same friend.",
      "Corregge il luogo proposto mantenendo Yuki come la stessa amica.",
    ),
    turn(
      "learner",
      requestTarget("noun-yuki-san", "verb-yobu", [
        L("expression-sumimasen"),
        TASK11_COMMA,
      ]),
      "request-friend-call",
      "Excuse me, please call Yuki.",
      "Mi scusi, chiami Yuki, per favore.",
      "Makes a motivated request to call the friend whose location was established.",
      "Formula una richiesta motivata di chiamare l'amica di cui è stato stabilito il luogo.",
    ),
    turn(
      "partner",
      simpleVerbTarget(
        "verb-yobu",
        "polite-nonpast",
        CELLS.requestResponse,
        "future",
        null,
        [L("expression-wakarimashita"), TASK11_COMMA],
        ["sentence-omission"],
      ),
      "accept-friend-call",
      "Understood, I will call her.",
      "Ho capito, la chiamerò.",
      "Accepts the request with Yuki still uniquely recoverable.",
      "Accetta la richiesta mantenendo Yuki come referente univoco.",
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

export interface BaseSynthesisCueFinding {
  readonly lessonId: string;
  readonly activityId: string;
  readonly lexemeId: string;
}

function dataRecord(value: unknown): Readonly<Record<string, unknown>> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : null;
}

function dataStringArray(value: unknown): readonly string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string")
    ? value
    : null;
}

const SYNTHESIS_TIME_CUE_TAGS: Readonly<Record<string, "future" | "past">> =
  deepFreeze({
    "noun-ashita": "future",
    "noun-kinou": "past",
  });

export function validateSynthesisCueRelevance(
  value: unknown,
): readonly BaseSynthesisCueFinding[] {
  const sanitized = task11PlainDataSnapshot(value);
  const moduleRecord = sanitized ? dataRecord(sanitized.value) : null;
  const lessons = moduleRecord?.lessons;
  if (!Array.isArray(lessons)) {
    return deepFreeze([
      { lessonId: "", activityId: "", lexemeId: "invalid-shape" },
    ]);
  }

  const findings: BaseSynthesisCueFinding[] = [];
  for (const lessonValue of lessons) {
    const lesson = dataRecord(lessonValue);
    const content = dataRecord(lesson?.content);
    const lessonId = content?.lessonId;
    const designs = lesson?.activityDesigns;
    if (typeof lessonId !== "string" || !Array.isArray(designs)) {
      findings.push({
        lessonId: typeof lessonId === "string" ? lessonId : "",
        activityId: "",
        lexemeId: "invalid-shape",
      });
      continue;
    }
    for (const designValue of designs) {
      const design = dataRecord(designValue);
      const activityId = design?.id;
      const prompt = dataRecord(design?.promptTarget);
      const accepted = dataRecord(design?.acceptedAnswerTarget);
      const optionTargets = design?.optionTargets;
      const promptLexemes = dataStringArray(prompt?.lexemeIds);
      const acceptedLexemes = dataStringArray(accepted?.lexemeIds);
      if (
        typeof activityId !== "string" ||
        !promptLexemes ||
        !acceptedLexemes ||
        !Array.isArray(optionTargets)
      ) {
        findings.push({
          lessonId,
          activityId: typeof activityId === "string" ? activityId : "",
          lexemeId: "invalid-shape",
        });
        continue;
      }
      const allowed = new Set(acceptedLexemes);
      const acceptedTags =
        dataStringArray(accepted?.interpretationTags) ?? [];
      const optionTagSets: ReadonlySet<string>[] = [];
      let optionsAreValid = true;
      for (const optionValue of optionTargets) {
        const option = dataRecord(optionValue);
        const optionLexemes = dataStringArray(option?.lexemeIds);
        const optionTags = dataStringArray(option?.interpretationTags);
        if (!optionLexemes || !optionTags) {
          optionsAreValid = false;
          break;
        }
        optionLexemes.forEach((lexemeId) => allowed.add(lexemeId));
        optionTagSets.push(new Set(optionTags));
      }
      if (!optionsAreValid) {
        findings.push({ lessonId, activityId, lexemeId: "invalid-shape" });
        continue;
      }
      promptLexemes
        .filter((lexemeId) => {
          if (allowed.has(lexemeId)) return false;
          const expectedTag = SYNTHESIS_TIME_CUE_TAGS[lexemeId];
          return !(
            expectedTag &&
            acceptedTags.includes(expectedTag) &&
            optionTagSets.some((tags) => !tags.has(expectedTag))
          );
        })
        .forEach((lexemeId) =>
          findings.push({ lessonId, activityId, lexemeId }),
        );
    }
  }
  return deepFreeze(findings);
}

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
  if (validateSynthesisCueRelevance(sanitized.value).length > 0) {
    return { ok: false, errors: ["irrelevant-activity-cue"] };
  }
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

import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import type {
  BaseContentLessonContent,
  BaseExample,
  BaseSystemLessonContent,
  BaseValidationCatalogs,
  BaseVisibleTarget,
} from "../catalog/types";
import { realizePoliteNonpast } from "../forms/verbForms";
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
} from "./module04PoliteVerbs";
import {
  BASE_COPULA_ADJECTIVES_MODULE,
  BASE_COPULA_ADJECTIVES_VALIDATION_CATALOGS,
} from "./module07CopulaAdjectives";
import {
  findExactGeneratedTokenSpans,
  hasAuthoredClauseFinalSuffix,
  isExactOrderChunkPermutation,
  strictTask11ModuleSnapshot,
  type StrictTask11CorpusTarget,
} from "../validation/moduleSnapshots";

export type BaseExistenceEntityClass = "animate" | "inanimate";

const ENTITY_CLASSES: readonly (readonly [string, BaseExistenceEntityClass])[] = [
  ["noun-tsukue", "inanimate"],
  ["noun-kuruma", "inanimate"],
  ["anchor-hon", "inanimate"],
  ["noun-kasa", "inanimate"],
  ["noun-enpitsu", "inanimate"],
  ["noun-jitensha", "inanimate"],
  ["noun-gohan", "inanimate"],
  ["noun-mizu", "inanimate"],
  ["noun-kudamono", "inanimate"],
  ["noun-mise", "inanimate"],
  ["noun-shokudou", "inanimate"],
  ["noun-jimusho", "inanimate"],
  ["noun-kouen", "inanimate"],
  ["noun-isu", "inanimate"],
  ["noun-hana", "inanimate"],
  ["noun-chizu", "inanimate"],
  ["noun-kaban", "inanimate"],
  ["noun-toire", "inanimate"],
  ["noun-konbini", "inanimate"],
  ["noun-basutei", "inanimate"],
  ["noun-inu", "animate"],
  ["noun-kodomo", "animate"],
  ["noun-sakana", "animate"],
  ["noun-hito", "animate"],
  ["noun-tomodachi", "animate"],
  ["noun-sensei", "animate"],
  ["noun-gakusei", "animate"],
  ["noun-tanaka", "animate"],
  ["noun-yamada", "animate"],
  ["noun-satou", "animate"],
  ["noun-suzuki", "animate"],
  ["noun-mari", "animate"],
  ["noun-yuki-san", "animate"],
  ["noun-keisatsukan", "animate"],
  ["noun-ekiin", "animate"],
] as const;

export const BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID: ReadonlyMap<
  string,
  BaseExistenceEntityClass
> = immutableReadonlyMap(ENTITY_CLASSES);

export interface BaseExistenceLocationModule {
  readonly id: "existence-location";
  readonly lessons: readonly BaseTask11Lesson[];
  readonly sequence: readonly (
    | BaseSystemLessonContent
    | BaseContentLessonContent
  )[];
  readonly worldFacts: Readonly<{ readonly scope: "existence-location" }>;
  readonly worldFactIds: readonly string[];
  readonly worldFactLedger: readonly BaseWorldFactRecord[];
}

const L = task11Lexeme;
const P = task11Particle;
const ARU = "verb-aru";
const IRU = "verb-iru";
const ARU_CELL = "existence-inanimate-aru";
const IRU_CELL = "existence-animate-iru";
const FRAME_CELL = "existence-ni-entity-ga";
const ACTION_CONTRAST_CELL = "existence-ni-vs-action-de";
const TOPIC_CONTRAST_CELL = "existential-ga-vs-topic-wa";
const FINDING_CELL = "finding-place-question-answer";

function existenceConceptIds(verbId: typeof ARU | typeof IRU): readonly string[] {
  return [
    verbId === ARU ? "aru-existence" : "iru-existence",
    "existence-location-frame",
  ];
}

function topicExistence(
  entityId: string,
  verbId: typeof ARU | typeof IRU,
  cellId = verbId === ARU ? ARU_CELL : IRU_CELL,
  finalParts: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(entityId),
      P("topic-wa", "topic", entityId),
      task11VerbForm(verbId, "polite-nonpast"),
      ...finalParts,
    ],
    {
      conceptIds: existenceConceptIds(verbId),
      patternCellIds: [cellId],
      semanticRoleIds: ["topic"],
      interpretationTags: ["present-state"],
      predicateSenseId: verbId === ARU ? "aru" : "iru",
      predicateLexemeId: verbId,
      predicateAspect: "stative",
    },
  );
}

function answeredTopicExistence(
  entityId: string,
  verbId: typeof ARU | typeof IRU,
): BaseTask11TargetSpec {
  const target = topicExistence(entityId, verbId);
  return {
    ...target,
    parts: [L("expression-hai"), { kind: "punctuation", mark: "comma" }, ...target.parts],
  };
}

function fullExistence(
  placeId: string,
  entityId: string,
  verbId: typeof ARU | typeof IRU,
  cellId = FRAME_CELL,
  finalParts: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  const predicateSenseId = verbId === ARU ? "aru" : "iru";
  return task11Target(
    [
      L(placeId),
      P("existence-location-ni", "existence-location", placeId),
      L(entityId),
      P("existential-subject-ga", "existential-subject", entityId),
      task11VerbForm(verbId, "polite-nonpast"),
      ...finalParts,
    ],
    {
      conceptIds: [
        ...existenceConceptIds(verbId),
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
  verbId: typeof ARU | typeof IRU,
  cellId = TOPIC_CONTRAST_CELL,
  finalParts: readonly BaseTask11Part[] = [],
): BaseTask11TargetSpec {
  const predicateSenseId =
    verbId === ARU ? "aru-topic-location" : "iru-topic-location";
  return task11Target(
    [
      L(entityId),
      P("topic-wa", "topic", entityId),
      L(placeId),
      P("existence-location-ni", "existence-location", placeId),
      task11VerbForm(verbId, "polite-nonpast"),
      ...finalParts,
    ],
    {
      conceptIds: [
        ...existenceConceptIds(verbId),
        "base-particle-existence-ni",
        "existential-ga-vs-topic-wa",
      ],
      patternCellIds: [cellId],
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
  verbId: typeof ARU | typeof IRU,
): BaseTask11TargetSpec {
  const target = topicLocation(entityId, "noun-doko", verbId, FINDING_CELL, [
    P("question-ka", "question", verbId),
  ]);
  if (!target.particleFrame) return target;
  return {
    ...target,
    particleFrame: {
      ...target.particleFrame,
      provided: {
        ...target.particleFrame.provided,
        question: "question-ka",
      },
      attachmentLexemeIdByRole: {
        ...target.particleFrame.attachmentLexemeIdByRole,
        question: verbId,
      },
    },
  };
}

function placeFirstTopicLocation(
  placeId: string,
  entityId: string,
  verbId: typeof ARU | typeof IRU,
): BaseTask11TargetSpec {
  const target = topicLocation(entityId, placeId, verbId);
  return {
    ...target,
    parts: [
      L(placeId),
      P("existence-location-ni", "existence-location", placeId),
      L(entityId),
      P("topic-wa", "topic", entityId),
      task11VerbForm(verbId, "polite-nonpast"),
    ],
  };
}

function actionPlace(
  placeId: string,
  verbId: "verb-asobu" | "verb-benkyou-suru" | "verb-hataraku",
  predicateSenseId: "play-place" | "study-place" | "work-place",
  cellId = ACTION_CONTRAST_CELL,
): BaseTask11TargetSpec {
  return task11Target(
    [
      L(placeId),
      P("action-place-de", "action-place", placeId),
      task11VerbForm(verbId, "polite-nonpast"),
    ],
    {
      conceptIds: ["action-place-de", "existence-vs-action-location"],
      patternCellIds: [cellId],
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
  lessonId: "existence-location-1",
  contract: "system",
  prerequisiteLessonIds: ["copula-adjectives-4"],
  newLexemeIds: [ARU, IRU, "noun-tsukue", "noun-inu", "noun-kuruma"],
  reviewLexemeIds: [
    "anchor-hon",
    "noun-kasa",
    "noun-enpitsu",
    "noun-jitensha",
    "noun-gohan",
    "noun-mizu",
    "noun-kudamono",
    "noun-kouen",
    "noun-daigaku",
    "noun-eki",
    "noun-jimusho",
    "noun-hito",
    "noun-tomodachi",
    "noun-sensei",
    "noun-gakusei",
    "noun-tanaka",
    "noun-yamada",
    "noun-satou",
    "noun-suzuki",
    "noun-mari",
    "noun-yuki-san",
    "expression-hai",
  ],
  introducedConceptIds: [
    "aru-existence",
    "iru-existence",
    "existence-location-frame",
  ],
  reviewedConceptIds: [
    "topic-wa",
    "masu-nonpast",
    "question-ka",
    "interactional-ne",
    "interactional-yo",
  ],
  patternCellIds: [ARU_CELL, IRU_CELL],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(answeredTopicExistence("noun-tsukue", ARU), "desk-available-answer", "Yes, the desk is available.", "Sì, la scrivania è disponibile.", "Answers about an already requested inanimate item with あります.", "Risponde su un oggetto inanimato già richiesto con あります.", "inanimate-topic-answer"),
    ex(answeredTopicExistence("noun-inu", IRU), "dog-present-answer", "Yes, the dog is here.", "Sì, il cane è qui.", "Answers about an established animate referent with います.", "Risponde su un referente animato già stabilito con います.", "animate-topic-answer"),
    ex(topicExistence("noun-kuruma", ARU, ARU_CELL, [P("interactional-ne", "interaction", ARU)]), "car-available-check", "The car is available, right?", "L'auto è disponibile, vero?", "Confirms availability of a known inanimate option.", "Conferma la disponibilità di un'opzione inanimata già nota.", "inanimate-topic-check"),
    ex(answeredTopicExistence("anchor-hon", ARU), "book-available-answer", "Yes, the book is available.", "Sì, il libro è disponibile.", "Answers about the requested book without introducing it neutrally.", "Risponde sul libro richiesto senza introdurlo in modo neutro.", "inanimate-topic-answer"),
    ex(topicExistence("noun-tomodachi", IRU, IRU_CELL, [P("interactional-yo", "interaction", IRU)]), "friend-present", "My friend is here.", "Il mio amico è qui.", "Reports the established friend as present.", "Segnala come presente l'amico già stabilito.", "animate-topic-statement"),
    ex(topicExistence("noun-kasa", ARU, ARU_CELL, [P("question-ka", "question", ARU)]), "umbrella-here-question", "Is the umbrella here?", "L'ombrello è qui?", "Checks for the previously mentioned umbrella.", "Verifica la presenza dell'ombrello già menzionato.", "inanimate-topic-question"),
    ex(topicExistence("noun-sensei", IRU, IRU_CELL, [P("interactional-ne", "interaction", IRU)]), "teacher-present-check", "The teacher is here, isn't she?", "L'insegnante è qui, vero?", "Confirms the presence of an established person.", "Conferma la presenza di una persona già stabilita.", "animate-topic-check"),
    ex(answeredTopicExistence("noun-enpitsu", ARU), "pencil-available-answer", "Yes, the pencil is available.", "Sì, la matita è disponibile.", "Answers a stock question about a known item.", "Risponde a una domanda di disponibilità su un oggetto noto.", "inanimate-topic-answer"),
    ex(topicExistence("noun-tanaka", IRU, IRU_CELL, [P("question-ka", "question", IRU)]), "tanaka-present-question", "Is Tanaka here?", "Tanaka è qui?", "Asks whether the named person is present.", "Chiede se la persona nominata è presente.", "animate-topic-question"),
    ex(topicExistence("noun-jitensha", ARU, ARU_CELL, [P("interactional-yo", "interaction", ARU)]), "bicycle-available", "The bicycle is available.", "La bicicletta è disponibile.", "Reports availability of an already selected vehicle.", "Segnala la disponibilità di un veicolo già selezionato.", "inanimate-topic-statement"),
  ],
  activities: [
    act(task11Cue(L("noun-inu")), topicExistence("noun-inu", IRU, IRU_CELL, [P("interactional-ne", "interaction", IRU)]), topicExistence("noun-inu", ARU, ARU_CELL, [P("interactional-ne", "interaction", ARU)]), 0, "existence-location-1", 1, IRU_CELL, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-kuruma")), topicExistence("noun-kuruma", ARU, ARU_CELL, [P("question-ka", "question", ARU)]), topicExistence("noun-kuruma", IRU, IRU_CELL, [P("question-ka", "question", IRU)]), 1, "existence-location-1", 2, ARU_CELL, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-yuki-san")), topicExistence("noun-yuki-san", IRU), { ...topicExistence("noun-yuki-san", IRU), parts: [task11VerbForm(IRU, "polite-nonpast"), L("noun-yuki-san"), P("topic-wa", "topic", "noun-yuki-san")] }, 0, "existence-location-1", 3, IRU_CELL, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", heldConstantPredicateLexemeId: IRU }),
    act(task11Cue(L("noun-tsukue")), topicExistence("noun-tsukue", ARU, ARU_CELL, [P("question-ka", "question", ARU)]), topicExistence("noun-tsukue", IRU, IRU_CELL, [P("question-ka", "question", IRU)]), 1, "existence-location-1", 4, ARU_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-mari")), topicExistence("noun-mari", IRU), topicExistence("noun-mari", ARU), 0, "existence-location-1", 5, IRU_CELL, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
    act(promptOf(topicExistence("noun-suzuki", ARU)), topicExistence("noun-suzuki", IRU), topicExistence("noun-suzuki", ARU), 1, "existence-location-1", 6, IRU_CELL, BASE_ERROR_ACTIVITY_SHAPE, "animate-existence-mismatch", { contrastAxis: "meaning", heldConstantPredicateLexemeId: null, errorDefectAxis: "entity-class", changedTokenSourceIds: [ARU, IRU] }),
    act(task11Cue(L("noun-satou")), topicExistence("noun-satou", IRU), topicExistence("noun-yamada", IRU), 0, "existence-location-1", 7, IRU_CELL, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: IRU }),
    act(task11Cue(L("noun-mizu")), topicExistence("noun-mizu", ARU), topicExistence("noun-gohan", ARU), 1, "existence-location-1", 8, ARU_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-tsukue")), topicExistence("noun-tsukue", ARU, ARU_CELL, [P("interactional-ne", "interaction", ARU)]), topicExistence("noun-tsukue", ARU, ARU_CELL, [P("interactional-yo", "interaction", ARU)]), 0, "existence-location-1", 9, ARU_CELL, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "interpretation", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-gakusei")), topicExistence("noun-gakusei", IRU), topicExistence("noun-kudamono", ARU), 1, "existence-location-1", 10, IRU_CELL, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
  ],
  dialogue: null,
};

const L2: BaseTask11LessonSpec = {
  lessonId: "existence-location-2",
  contract: "system",
  prerequisiteLessonIds: ["existence-location-1"],
  newLexemeIds: ["noun-heya", "noun-niwa", "noun-isu", "noun-kodomo"],
  reviewLexemeIds: [
    ARU,
    IRU,
    "noun-tsukue",
    "noun-inu",
    "noun-kuruma",
    "noun-kouen",
    "noun-jimusho",
    "noun-shokudou",
    "noun-mise",
    "anchor-hon",
    "noun-kasa",
    "noun-enpitsu",
    "noun-sensei",
    "noun-gakusei",
    "noun-tanaka",
    "noun-yamada",
    "noun-mari",
  ],
  introducedConceptIds: [
    "base-particle-existence-ni",
    "base-particle-existential-ga",
  ],
  reviewedConceptIds: [
    "aru-existence",
    "iru-existence",
    "existence-location-frame",
  ],
  patternCellIds: [FRAME_CELL, ARU_CELL, IRU_CELL],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(fullExistence("noun-heya", "noun-isu", ARU, ARU_CELL), "chair-in-room", "There is a chair in the room.", "Nella stanza c'è una sedia.", "Introduces the complete place に entity が frame.", "Introduce lo schema completo luogo に entità が.", "inanimate-location"),
    ex(fullExistence("noun-niwa", "noun-inu", IRU, IRU_CELL), "dog-in-garden", "There is a dog in the garden.", "In giardino c'è un cane.", "Uses the same frame with an animate entity.", "Usa lo stesso schema con un'entità animata.", "animate-location"),
    ex(fullExistence("noun-jimusho", "noun-tsukue", ARU), "desk-in-office", "There is a desk in the office.", "Nell'ufficio c'è una scrivania.", "Attaches に to the existence location.", "Collega に al luogo d'esistenza.", "inanimate-location"),
    ex(fullExistence("noun-kouen", "noun-kodomo", IRU), "child-in-park", "There is a child in the park.", "Nel parco c'è un bambino.", "Attaches が to the entity that exists.", "Collega が all'entità che esiste.", "animate-location"),
    ex(fullExistence("noun-shokudou", "noun-sensei", IRU), "teacher-in-cafeteria", "The teacher is in the cafeteria.", "L'insegnante è in mensa.", "Keeps いる stative in the nonpast.", "Mantiene いる stativo nel non-passato.", "animate-location"),
    ex(fullExistence("noun-mise", "noun-kuruma", ARU), "car-at-shop", "There is a car at the shop.", "Al negozio c'è un'auto.", "Keeps ある tied to an inanimate entity.", "Mantiene ある legato a un'entità inanimata.", "inanimate-location"),
    ex(fullExistence("noun-heya", "anchor-hon", ARU), "book-in-room", "There is a book in the room.", "Nella stanza c'è un libro.", "Reuses the full frame with a familiar object.", "Riusa lo schema completo con un oggetto noto.", "inanimate-location"),
    ex(fullExistence("noun-niwa", "noun-mari", IRU), "mari-in-garden", "Mari is in the garden.", "Mari è in giardino.", "Uses an independently animate person.", "Usa una persona classificata autonomamente come animata.", "animate-location"),
    ex(fullExistence("noun-jimusho", "noun-enpitsu", ARU), "pencil-in-office", "There is a pencil in the office.", "Nell'ufficio c'è una matita.", "Preserves exact particle attachment.", "Conserva l'esatto collegamento delle particelle.", "inanimate-location"),
    ex(fullExistence("noun-kouen", "noun-inu", IRU), "dog-in-park", "There is a dog in the park.", "Nel parco c'è un cane.", "Closes with a complete animate frame.", "Chiude con uno schema animato completo.", "animate-location"),
  ],
  activities: [
    act(task11Cue(L("noun-isu")), fullExistence("noun-jimusho", "noun-isu", ARU, ARU_CELL), fullExistence("noun-niwa", "noun-isu", ARU, ARU_CELL), 0, "existence-location-2", 1, ARU_CELL, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-kodomo")), fullExistence("noun-heya", "noun-kodomo", IRU, IRU_CELL), fullExistence("noun-heya", "noun-kuruma", ARU, ARU_CELL), 1, "existence-location-2", 2, IRU_CELL, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-tsukue")), fullExistence("noun-niwa", "noun-tsukue", ARU), { ...fullExistence("noun-niwa", "noun-tsukue", ARU), parts: [L("noun-niwa"), P("existence-location-ni", "existence-location", "noun-niwa"), task11VerbForm(ARU, "polite-nonpast"), L("noun-tsukue"), P("existential-subject-ga", "existential-subject", "noun-tsukue")] }, 0, "existence-location-2", 3, FRAME_CELL, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-inu")), fullExistence("noun-daigaku", "noun-inu", IRU), fullExistence("noun-eki", "noun-inu", IRU), 1, "existence-location-2", 4, FRAME_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: IRU }),
    act(task11Cue(L("noun-kasa")), fullExistence("noun-niwa", "noun-kasa", ARU), fullExistence("noun-kouen", "noun-kasa", ARU), 0, "existence-location-2", 5, FRAME_CELL, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: ARU }),
    act(promptOf(fullExistence("noun-heya", "noun-gakusei", ARU)), fullExistence("noun-heya", "noun-gakusei", IRU), fullExistence("noun-heya", "noun-gakusei", ARU), 1, "existence-location-2", 6, FRAME_CELL, BASE_ERROR_ACTIVITY_SHAPE, "animate-existence-mismatch", { contrastAxis: "meaning", heldConstantPredicateLexemeId: null, errorDefectAxis: "entity-class", changedTokenSourceIds: [ARU, IRU] }),
    act(task11Cue(L("noun-tanaka")), fullExistence("noun-mise", "noun-tanaka", IRU), fullExistence("noun-niwa", "noun-tanaka", IRU), 0, "existence-location-2", 7, FRAME_CELL, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: IRU }),
    act(task11Cue(L("noun-enpitsu")), fullExistence("noun-heya", "noun-enpitsu", ARU), fullExistence("noun-niwa", "noun-enpitsu", ARU), 1, "existence-location-2", 8, FRAME_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-inu")), fullExistence("noun-shokudou", "noun-inu", IRU), fullExistence("noun-mise", "noun-inu", IRU), 0, "existence-location-2", 9, FRAME_CELL, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: IRU }),
    act(task11Cue(L("noun-yamada")), fullExistence("noun-kouen", "noun-yamada", IRU), fullExistence("noun-jimusho", "noun-kuruma", ARU), 1, "existence-location-2", 10, FRAME_CELL, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
  ],
  dialogue: null,
};

const L3: BaseTask11LessonSpec = {
  lessonId: "existence-location-3",
  contract: "system",
  prerequisiteLessonIds: ["existence-location-2", "argument-particles-3"],
  newLexemeIds: ["noun-kyoushitsu", "noun-uchi", "noun-sakana", "noun-hana"],
  reviewLexemeIds: [
    ARU,
    IRU,
    "verb-asobu",
    "verb-benkyou-suru",
    "verb-hataraku",
    "noun-heya",
    "noun-niwa",
    "noun-isu",
    "noun-kodomo",
    "noun-inu",
    "noun-tsukue",
    "noun-kuruma",
    "noun-kouen",
    "noun-jimusho",
    "noun-shokudou",
    "noun-mise",
    "noun-sensei",
    "noun-gakusei",
    "noun-tanaka",
    "noun-mari",
  ],
  introducedConceptIds: [
    "existence-vs-action-location",
    "existential-ga-vs-topic-wa",
  ],
  reviewedConceptIds: [
    "base-particle-existence-ni",
    "base-particle-existential-ga",
    "action-place-de",
    "topic-wa",
  ],
  patternCellIds: [ACTION_CONTRAST_CELL, TOPIC_CONTRAST_CELL, FRAME_CELL],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(fullExistence("noun-kyoushitsu", "noun-isu", ARU), "chair-exists-classroom", "There is a chair in the classroom.", "Nell'aula c'è una sedia.", "Uses に for a state of existence.", "Usa に per uno stato d'esistenza.", "existence-location"),
    ex(actionPlace("noun-kyoushitsu", "verb-benkyou-suru", "study-place"), "study-in-classroom", "I study in the classroom.", "Studio nell'aula.", "Contrasts action-place で with existence に.", "Contrappone il で del luogo d'azione al に d'esistenza.", "action-location"),
    ex(fullExistence("noun-uchi", "noun-inu", IRU), "dog-at-home", "There is a dog at home.", "A casa c'è un cane.", "Keeps an animate existence frame.", "Mantiene uno schema d'esistenza animato.", "existence-location"),
    ex(actionPlace("noun-uchi", "verb-hataraku", "work-place"), "work-at-home", "I work at home.", "Lavoro a casa.", "Uses で because working is an action.", "Usa で perché lavorare è un'azione.", "action-location"),
    ex(fullExistence("noun-niwa", "noun-sakana", IRU), "fish-in-garden", "There is a fish in the garden.", "In giardino c'è un pesce.", "Treats a living fish as animate.", "Tratta un pesce vivo come animato.", "animate-location"),
    ex(fullExistence("noun-heya", "noun-hana", ARU), "flower-in-room", "There is a flower in the room.", "Nella stanza c'è un fiore.", "Treats a flower as inanimate for ある.", "Tratta un fiore come inanimato per ある.", "inanimate-location"),
    ex(topicLocation("noun-sakana", "noun-niwa", IRU), "fish-topic-garden", "As for the fish, it is in the garden.", "Quanto al pesce, è in giardino.", "Contrasts a continuing topic with existential が.", "Contrappone un tema continuato al が esistenziale.", "topic-location"),
    ex(topicLocation("noun-hana", "noun-heya", ARU), "flower-topic-room", "As for the flower, it is in the room.", "Quanto al fiore, è nella stanza.", "Uses は for an established entity, not new existence.", "Usa は per un'entità già stabilita, non per nuova esistenza.", "topic-location"),
    ex(actionPlace("noun-niwa", "verb-asobu", "play-place"), "play-in-garden", "I play in the garden.", "Gioco in giardino.", "Shows exact action-place attachment.", "Mostra l'esatto collegamento del luogo d'azione.", "action-location"),
    ex(fullExistence("noun-jimusho", "noun-sensei", IRU), "teacher-in-office", "The teacher is in the office.", "L'insegnante è nell'ufficio.", "Returns to the stative existence frame.", "Ritorna allo schema stativo d'esistenza.", "existence-location"),
  ],
  activities: [
    act(task11Cue(L("noun-hana")), fullExistence("noun-uchi", "noun-hana", ARU), actionPlace("noun-uchi", "verb-benkyou-suru", "study-place"), 0, "existence-location-3", 1, FRAME_CELL, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "particle", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-kyoushitsu")), fullExistence("noun-kyoushitsu", "noun-tsukue", ARU), actionPlace("noun-kyoushitsu", "verb-hataraku", "work-place"), 1, "existence-location-3", 2, FRAME_CELL, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "particle", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-sakana")), fullExistence("noun-heya", "noun-sakana", IRU), { ...fullExistence("noun-heya", "noun-sakana", IRU), parts: [L("noun-heya"), P("existence-location-ni", "existence-location", "noun-heya"), task11VerbForm(IRU, "polite-nonpast"), L("noun-sakana"), P("existential-subject-ga", "existential-subject", "noun-sakana")] }, 0, "existence-location-3", 3, FRAME_CELL, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", heldConstantPredicateLexemeId: IRU }),
    act(task11Cue(L("noun-hana")), topicLocation("noun-hana", "noun-niwa", ARU), fullExistence("noun-niwa", "noun-hana", ARU), 1, "existence-location-3", 4, TOPIC_CONTRAST_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "particle", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-kodomo")), fullExistence("noun-uchi", "noun-kodomo", IRU), actionPlace("noun-uchi", "verb-asobu", "play-place"), 0, "existence-location-3", 5, FRAME_CELL, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "particle", heldConstantPredicateLexemeId: null }),
    act(promptOf(placeFirstTopicLocation("noun-heya", "noun-inu", IRU)), fullExistence("noun-heya", "noun-inu", IRU), placeFirstTopicLocation("noun-heya", "noun-inu", IRU), 1, "existence-location-3", 6, FRAME_CELL, BASE_ERROR_ACTIVITY_SHAPE, "existential-topic-context-mismatch", { contrastAxis: "particle", heldConstantPredicateLexemeId: IRU, errorDefectAxis: "information-structure", changedTokenSourceIds: ["topic-wa", "existential-subject-ga"] }),
    act(task11Cue(L("noun-jimusho")), actionPlace("noun-jimusho", "verb-benkyou-suru", "study-place"), fullExistence("noun-jimusho", "noun-tanaka", IRU), 0, "existence-location-3", 7, ACTION_CONTRAST_CELL, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "particle", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-sensei")), topicLocation("noun-sensei", "noun-kyoushitsu", IRU), fullExistence("noun-kyoushitsu", "noun-sensei", IRU), 1, "existence-location-3", 8, TOPIC_CONTRAST_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "particle", heldConstantPredicateLexemeId: IRU }),
    act(task11Cue(L("noun-sakana")), fullExistence("noun-uchi", "noun-sakana", IRU), fullExistence("noun-kyoushitsu", "noun-sakana", IRU), 0, "existence-location-3", 9, FRAME_CELL, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: IRU }),
    act(task11Cue(L("noun-heya")), actionPlace("noun-heya", "verb-benkyou-suru", "study-place"), fullExistence("noun-mise", "noun-mari", IRU), 1, "existence-location-3", 10, ACTION_CONTRAST_CELL, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "particle", heldConstantPredicateLexemeId: null }),
  ],
  dialogue: null,
};

const L4: BaseTask11LessonSpec = {
  lessonId: "existence-location-4",
  contract: "content",
  prerequisiteLessonIds: ["existence-location-3", "topic-questions-4"],
  newLexemeIds: [
    "noun-doko",
    "noun-uketsuke",
    "noun-toire",
    "noun-konbini",
    "noun-basutei",
    "noun-chizu",
    "noun-kaban",
    "noun-keisatsukan",
    "noun-ekiin",
  ],
  reviewLexemeIds: [
    ARU,
    IRU,
    "noun-eki",
    "noun-heya",
    "noun-niwa",
    "noun-kyoushitsu",
    "noun-uchi",
    "noun-jimusho",
    "noun-mise",
    "noun-inu",
    "noun-kodomo",
    "noun-kuruma",
    "noun-tanaka",
    "noun-yamada",
  ],
  introducedConceptIds: [],
  reviewedConceptIds: [
    "aru-existence",
    "iru-existence",
    "base-particle-existence-ni",
    "base-particle-existential-ga",
    "topic-wa",
    "question-ka",
  ],
  patternCellIds: [FINDING_CELL, FRAME_CELL, TOPIC_CONTRAST_CELL],
  referenceSnapshotIds: [
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
  ],
  examples: [
    ex(whereQuestion("noun-toire", ARU), "ask-toilet", "Where is the restroom?", "Dov'è il bagno?", "Asks for the location of a thing with ある.", "Chiede il luogo di una cosa con ある.", "finding-place-question"),
    ex(topicLocation("noun-toire", "noun-uketsuke", ARU, FINDING_CELL), "toilet-at-reception", "The restroom is at reception.", "Il bagno è alla reception.", "Answers with a bounded location statement.", "Risponde con un enunciato di luogo delimitato.", "finding-place-answer"),
    ex(whereQuestion("noun-keisatsukan", IRU), "ask-police-officer", "Where is the police officer?", "Dov'è l'agente di polizia?", "Asks for a person's location with いる.", "Chiede il luogo di una persona con いる.", "finding-person-question"),
    ex(topicLocation("noun-keisatsukan", "noun-konbini", IRU, FINDING_CELL), "officer-at-store", "The police officer is at the convenience store.", "L'agente è al minimarket.", "Answers with an animate location.", "Risponde con un luogo animato.", "finding-person-answer"),
    ex(whereQuestion("noun-basutei", ARU), "ask-bus-stop", "Where is the bus stop?", "Dov'è la fermata dell'autobus?", "Uses ある for an inanimate landmark.", "Usa ある per un punto di riferimento inanimato.", "finding-place-question"),
    ex(topicLocation("noun-basutei", "noun-eki", ARU, FINDING_CELL), "bus-stop-at-station", "The bus stop is at the station.", "La fermata è alla stazione.", "Gives a practical landmark.", "Fornisce un punto di riferimento pratico.", "finding-place-answer"),
    ex(whereQuestion("noun-kaban", ARU), "ask-bag", "Where is the bag?", "Dov'è la borsa?", "Asks about a naturally located possession.", "Chiede di un oggetto personale collocato naturalmente.", "finding-object-question"),
    ex(fullExistence("noun-uketsuke", "noun-chizu", ARU), "map-at-reception", "There is a map at reception.", "Alla reception c'è una mappa.", "Uses existence naturally instead of teaching a universal have translation.", "Usa naturalmente l'esistenza senza insegnare un avere universale.", "finding-object-answer"),
  ],
  activities: [
    act(task11Cue(L("noun-kuruma")), whereQuestion("noun-kuruma", ARU), whereQuestion("noun-yamada", IRU), 0, "existence-location-4", 1, FINDING_CELL, BASE_MEANING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-keisatsukan")), topicLocation("noun-keisatsukan", "noun-heya", IRU, FINDING_CELL), topicLocation("noun-kuruma", "noun-heya", ARU, FINDING_CELL), 1, "existence-location-4", 2, FINDING_CELL, BASE_FORM_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
    act(task11Cue(L("noun-basutei")), topicLocation("noun-basutei", "noun-konbini", ARU, FINDING_CELL), { ...topicLocation("noun-basutei", "noun-konbini", ARU, FINDING_CELL), parts: [L("noun-konbini"), P("existence-location-ni", "existence-location", "noun-konbini"), task11VerbForm(ARU, "polite-nonpast"), L("noun-basutei"), P("topic-wa", "topic", "noun-basutei")] }, 0, "existence-location-4", 3, FINDING_CELL, BASE_ORDERING_ACTIVITY_SHAPE, null, { contrastAxis: "word-order", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-chizu")), fullExistence("noun-konbini", "noun-chizu", ARU), fullExistence("noun-uchi", "noun-chizu", ARU), 1, "existence-location-4", 4, FRAME_CELL, BASE_CONTROLLED_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-toire")), topicLocation("noun-toire", "noun-heya", ARU, FINDING_CELL), topicLocation("noun-kaban", "noun-heya", ARU, FINDING_CELL), 0, "existence-location-4", 5, FINDING_CELL, BASE_TRANSFORMATION_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: ARU }),
    act(promptOf(fullExistence("noun-uketsuke", "noun-ekiin", ARU, FINDING_CELL)), fullExistence("noun-uketsuke", "noun-ekiin", IRU, FINDING_CELL), fullExistence("noun-uketsuke", "noun-ekiin", ARU, FINDING_CELL), 1, "existence-location-4", 6, FINDING_CELL, BASE_ERROR_ACTIVITY_SHAPE, "animate-existence-mismatch", { contrastAxis: "meaning", heldConstantPredicateLexemeId: null, errorDefectAxis: "entity-class", changedTokenSourceIds: [ARU, IRU] }),
    act(task11Cue(L("noun-konbini")), topicLocation("noun-konbini", "noun-eki", ARU, FINDING_CELL), topicLocation("noun-konbini", "noun-uchi", ARU, FINDING_CELL), 0, "existence-location-4", 7, FINDING_CELL, BASE_CONTEXT_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-ekiin")), topicLocation("noun-ekiin", "noun-kyoushitsu", IRU, FINDING_CELL), topicLocation("noun-ekiin", "noun-jimusho", IRU, FINDING_CELL), 1, "existence-location-4", 8, FINDING_CELL, BASE_RETRIEVAL_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: IRU }),
    act(task11Cue(L("noun-kaban")), topicLocation("noun-kaban", "noun-uketsuke", ARU, FINDING_CELL), topicLocation("noun-kaban", "noun-konbini", ARU, FINDING_CELL), 0, "existence-location-4", 9, FINDING_CELL, BASE_LISTENING_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: ARU }),
    act(task11Cue(L("noun-keisatsukan")), topicLocation("noun-keisatsukan", "noun-eki", IRU, FINDING_CELL), topicLocation("noun-chizu", "noun-heya", ARU, FINDING_CELL), 1, "existence-location-4", 10, FINDING_CELL, BASE_SPOKEN_ACTIVITY_SHAPE, null, { contrastAxis: "meaning", heldConstantPredicateLexemeId: null }),
  ],
  dialogue: [
    turn("learner", whereQuestion("noun-chizu", ARU), "ask-map-dialogue", "Where is the map?", "Dov'è la mappa?", "Opens by asking for an inanimate object.", "Apre chiedendo dove si trova un oggetto inanimato."),
    turn("partner", topicLocation("noun-chizu", "noun-uketsuke", ARU, FINDING_CELL), "answer-map-dialogue", "The map is at reception.", "La mappa è alla reception.", "Provides the requested landmark.", "Fornisce il punto di riferimento richiesto."),
    turn("learner", whereQuestion("noun-ekiin", IRU), "ask-staff-dialogue", "Where is the station employee?", "Dov'è l'addetto della stazione?", "Continues by asking for a person.", "Continua chiedendo di una persona."),
    turn("partner", topicLocation("noun-ekiin", "noun-uketsuke", IRU, FINDING_CELL), "answer-staff-dialogue", "The station employee is at reception.", "L'addetto è alla reception.", "Closes with an animate location answer.", "Chiude con una risposta di luogo animata."),
  ],
};

const SPECS = deepFreeze([L1, L2, L3, L4]);
const BUILT = SPECS.map(buildTask11Lesson);
const RAW_LESSONS = BUILT.map(({ lesson }) => lesson);

export const BASE_EXISTENCE_LOCATION_LESSONS: readonly (
  | BaseSystemLessonContent
  | BaseContentLessonContent
)[] = deepFreeze(RAW_LESSONS.map(({ content }) => content));

export const BASE_EXISTENCE_LOCATION_EXAMPLES: readonly BaseExample[] =
  deepFreeze(RAW_LESSONS.flatMap(({ examples }) => examples));

export const BASE_EXISTENCE_LOCATION_VALIDATION_CATALOGS: BaseValidationCatalogs =
  task11ValidationCatalogs(BASE_COPULA_ADJECTIVES_VALIDATION_CATALOGS, BUILT);

function entityFor(target: BaseVisibleTarget): string | undefined {
  return (
    target.particleFrame?.attachmentLexemeIdByRole["existential-subject"] ??
    target.particleBindings?.find(({ role }) => role === "topic")
      ?.attachmentLexemeId
  );
}

function hasCorrectEntityClass(target: BaseVisibleTarget): boolean {
  if (
    target.predicateLexemeId !== ARU &&
    target.predicateLexemeId !== IRU
  ) {
    return true;
  }

  const entityId = entityFor(target);
  const entityClass = entityId
    ? BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID.get(entityId)
    : undefined;
  return (
    (target.predicateLexemeId === ARU && entityClass === "inanimate") ||
    (target.predicateLexemeId === IRU && entityClass === "animate")
  );
}

function hasCanonicalExistenceLicensing(
  lessonId: string,
  target: BaseVisibleTarget,
): boolean {
  const predicate =
    target.predicateLexemeId === "verb-aru"
      ? "aru"
      : target.predicateLexemeId === "verb-iru"
        ? "iru"
        : null;
  if (!predicate) return true;
  if (
    target.predicateAspect !== "stative" ||
    !target.interpretationTags.includes("present-state") ||
    target.interpretationTags.includes("ongoing-now")
  ) {
    return false;
  }
  if (lessonId === "existence-location-1") {
    return (
      target.predicateSenseId === predicate &&
      target.particleFrame === undefined &&
      target.semanticRoleIds.length === 1 &&
      target.semanticRoleIds[0] === "topic"
    );
  }
  const frame = target.particleFrame;
  const bindings = target.particleBindings ?? [];
  if (
    !frame ||
    frame.predicateSenseId !== target.predicateSenseId ||
    frame.provided["existence-location"] !== "existence-location-ni" ||
    !target.semanticRoleIds.includes("existence-location") ||
    target.semanticRoleIds.includes("action-place") ||
    frame.provided["action-place"] !== undefined ||
    bindings.some(
      ({ role, particleSense }) =>
        role === "action-place" || particleSense === "action-place-de",
    ) ||
    !bindings.some(
      ({ role, particleSense }) =>
        role === "existence-location" &&
        particleSense === "existence-location-ni",
    )
  ) {
    return false;
  }
  if (target.predicateSenseId === predicate) {
    return (
      frame.provided["existential-subject"] === "existential-subject-ga" &&
      target.semanticRoleIds.includes("existential-subject") &&
      bindings.some(
        ({ role, particleSense }) =>
          role === "existential-subject" &&
          particleSense === "existential-subject-ga",
      )
    );
  }
  return (
    target.predicateSenseId === `${predicate}-topic-location` &&
    frame.provided.topic === "topic-wa" &&
    target.semanticRoleIds.includes("topic") &&
    bindings.some(
      ({ role, particleSense }) =>
        role === "topic" && particleSense === "topic-wa",
    )
  );
}

const RAW_EXISTENCE_LOCATION_MODULE: BaseExistenceLocationModule = {
  id: "existence-location",
  lessons: RAW_LESSONS,
  sequence: [
    ...BASE_COPULA_ADJECTIVES_MODULE.sequence,
    ...BASE_EXISTENCE_LOCATION_LESSONS,
  ],
  worldFacts: { scope: "existence-location" },
  worldFactIds: [],
  worldFactLedger: worldFactLedgerFor(RAW_LESSONS),
};

function hasExactExistenceRealization(
  entry: StrictTask11CorpusTarget,
  corpusTargets: readonly StrictTask11CorpusTarget[],
): boolean {
  const { target } = entry;
  const predicateEvidence = [
    ...new Set(
      [...target.lexemeIds, ...target.tokens.map(({ source }) => source.referenceId)]
        .filter((id) => id === ARU || id === IRU),
    ),
  ];
  if (predicateEvidence.length === 0) return true;
  if (
    predicateEvidence.length !== 1 ||
    target.predicateLexemeId !== predicateEvidence[0] ||
    !target.lexemeIds.includes(predicateEvidence[0])
  ) {
    return false;
  }
  const realized = realizePoliteNonpast(predicateEvidence[0]);
  if (!realized.ok) return false;
  const spans = findExactGeneratedTokenSpans(target.tokens, realized.value);
  if (spans.length !== 1) return false;
  return (
    hasAuthoredClauseFinalSuffix(target, spans[0].end) ||
    isExactOrderChunkPermutation(entry, corpusTargets)
  );
}

export function validateBaseExistenceLocationModule(
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
    "existence-location",
    SPECS.map(({ lessonId }) => lessonId),
    BASE_EXISTENCE_LOCATION_VALIDATION_CATALOGS,
  );
  if (!base.ok) return base;
  const snapshot = strictTask11ModuleSnapshot(sanitized.value);
  const semanticInvariantHolds =
    snapshot &&
    snapshot.corpusTargets.every((entry) =>
      hasExactExistenceRealization(entry, snapshot.corpusTargets),
    ) &&
    snapshot.targets
      .filter(({ source }) => source !== "option")
      .every(
        ({ lessonId, target }) =>
          hasCorrectEntityClass(target) &&
          hasCanonicalExistenceLicensing(lessonId, target),
      );
  if (!semanticInvariantHolds) {
    return { ok: false, errors: ["invalid-lesson-shape"] };
  }
  return task11PlainDataEqual(
    sanitized.value,
    RAW_EXISTENCE_LOCATION_MODULE,
  )
    ? base
    : { ok: false, errors: ["invalid-module-shape"] };
}

export const module08ConceptIds = deepFreeze(
  SPECS.flatMap(({ introducedConceptIds }) => introducedConceptIds),
);

export const BASE_EXISTENCE_LOCATION_MODULE: BaseExistenceLocationModule =
  deepFreeze(RAW_EXISTENCE_LOCATION_MODULE);

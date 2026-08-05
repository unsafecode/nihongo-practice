/**
 * Staged learner content and catalog assembly for the final two Foundations
 * modules. This preview is deliberately outside the published 12-module A1
 * runtime until Task 5 promotes all sixteen Foundations lessons together.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import {
  buildLessonPositionRecords,
  toFoundationLessonDefinition,
} from "../../foundations/instructionalLessonKit";
import { buildLessonViewModel } from "../../foundations/buildLessonViewModel";
import type {
  FoundationCatalogs,
  FoundationModule,
  SentenceVariant,
} from "../../foundations/types";
import {
  a1CanonicalContexts,
  a1CanonicalLearningTargetSenses,
  a1CanonicalPersonRoles,
  a1CanonicalReferents,
  a1CanonicalSemanticValues,
  a1CanonicalSentenceFamilies,
} from "../catalog/a1SemanticCatalog";
import { a1SharedCopy } from "../catalog/a1CopyGloss";
import { a1ExpandedFoundationCanDos } from "../catalog/canDos";
import {
  FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON,
  FOUNDATIONS_LEXEME_IDS_BY_LESSON,
  a1ExpandedFoundationsLexemeByValueId,
  a1ExpandedFoundationsLexemes,
} from "../catalog/foundationsShared";
import {
  modulePoliteVerbsLessons,
  modulePoliteVerbsRecipe,
} from "../catalog/modulePoliteVerbs";
import {
  moduleTimeMovementLessons,
  moduleTimeMovementRecipe,
} from "../catalog/moduleTimeMovement";
import {
  a1ExpandedFoundationsVerbUseRecords,
  a1StagedFoundationsArea03to04VerbUseRecords,
} from "../catalog/foundationsRecurrence03to04";
import { A1_EXPANDED_CANONICAL_POSITIONS } from "../manifest";
import {
  a1FoundationsArea01to02BuiltLessons,
  a1FoundationsArea01to02Copy,
  a1FoundationsArea01to02Modules,
} from "./foundationsArea01to02";
import { defineA1LessonContent, type A1PracticeBlueprint } from "./types";

const STAGED_CATALOG_VERSION = "a1-foundations-staged-03to04";
const STAGED_SEED = "a1-foundations-staged-03to04";

export const a1FoundationsArea03to04BuiltLessons = deepFreeze([
  ...modulePoliteVerbsLessons,
  ...moduleTimeMovementLessons,
]);

export const a1FoundationsArea03to04Modules = deepFreeze([
  modulePoliteVerbsRecipe,
  moduleTimeMovementRecipe,
]);

export const a1FoundationsArea03to04ModuleRecipes =
  a1FoundationsArea03to04Modules;

const a1FoundationsArea03to04Variants: readonly SentenceVariant[] = deepFreeze(
  a1FoundationsArea03to04BuiltLessons.flatMap(({ variants }) => [...variants]),
);

const stagedVariantById = new Map(
  a1FoundationsArea03to04Variants.map((variant) => [variant.id, variant]),
);

const stagedModules: readonly FoundationModule[] = deepFreeze(
  a1FoundationsArea03to04Modules.map((module) => ({
    id: module.id,
    level: "a1" as const,
    order: module.order,
    canDoIds:
      module.id === "polite-verbs"
        ? ["a1-can-do-polite-verbs"]
        : ["a1-can-do-time-movement"],
    lessonIds: [...module.lessonIds],
  })),
);

const stagedCanDos = a1ExpandedFoundationCanDos.filter(({ id }) =>
  ["a1-can-do-polite-verbs", "a1-can-do-time-movement"].includes(id),
);

export interface A1FoundationsArea03to04Catalogs extends FoundationCatalogs {
  readonly lexemeByValueId: typeof a1ExpandedFoundationsLexemeByValueId;
}

/**
 * Complete catalog-neutral input for previewing the final eight lessons. It
 * has no route or runtime assembly import, so it cannot publish staged work.
 */
export const a1FoundationsArea03to04Catalogs: A1FoundationsArea03to04Catalogs =
  deepFreeze({
    levels: [],
    modules: stagedModules,
    checkpoints: [],
    canDos: stagedCanDos,
    contexts: a1CanonicalContexts,
    personRoles: a1CanonicalPersonRoles,
    referents: a1CanonicalReferents,
    learningTargetSenses: a1CanonicalLearningTargetSenses,
    semanticValues: a1CanonicalSemanticValues,
    sentenceFamilies: a1CanonicalSentenceFamilies,
    sentenceVariants: a1FoundationsArea03to04Variants,
    lessons: a1FoundationsArea03to04BuiltLessons.map(({ recipe }) =>
      toFoundationLessonDefinition(recipe, "a1", stagedVariantById),
    ),
    lessonPositions: buildLessonPositionRecords(
      a1FoundationsArea03to04BuiltLessons.map(({ recipe }) => recipe),
      "a1",
      A1_EXPANDED_CANONICAL_POSITIONS,
    ),
    verbUseRecords: a1StagedFoundationsArea03to04VerbUseRecords,
    lexemeByValueId: a1ExpandedFoundationsLexemeByValueId,
  });

const moduleCopy = {
  "a1-module-outcome-polite-verbs": {
    en: "You can use basic polite nonpast actions with objects, places, and clear subject omission.",
    it: "Sai usare azioni cortesi non-passate con oggetti, luoghi e un'omissione chiara del soggetto.",
  },
  "a1-module-outcome-time-movement": {
    en: "You can say when an action happened and describe a short trip with direction and transport.",
    it: "Sai dire quando è avvenuta un'azione e descrivere un breve spostamento con direzione e trasporto.",
  },
} as const;

function copyByLocale(
  locale: "en" | "it",
): Readonly<Record<string, string>> {
  const copy: Record<string, string> = {
    ...a1SharedCopy[locale],
  };
  for (const [id, bilingual] of Object.entries(moduleCopy)) {
    copy[id] = bilingual[locale];
  }
  for (const lesson of a1FoundationsArea03to04BuiltLessons) {
    Object.assign(copy, lesson[locale]);
  }
  return copy;
}

export const a1FoundationsArea03to04Copy = deepFreeze({
  en: copyByLocale("en"),
  it: copyByLocale("it"),
});

function semanticBlueprint(
  lessonId: string,
  spokenVariantId: string,
  fourth: "transformation" | "contextual-response",
): A1PracticeBlueprint {
  const built = buildLessonViewModel({
    catalogs: a1FoundationsArea03to04Catalogs,
    copy: a1FoundationsArea03to04Copy,
    lessonId,
    locale: "en",
    catalogVersion: STAGED_CATALOG_VERSION,
    seed: STAGED_SEED,
  });
  if (!built.ok) {
    throw new Error(
      `Staged Foundations practice blueprint cannot resolve "${lessonId}": ${built.error.code} (${built.error.detail ?? "no detail"}).`,
    );
  }

  const interactionFor = (
    round: "one" | "two",
    index: number,
  ): Exclude<A1PracticeBlueprint["activities"][number]["interactionKind"], "spoken"> => {
    const target = built.model.rounds[round === "one" ? 0 : 1].targets[index];
    if (!target) {
      throw new Error(
        `Staged Foundations practice blueprint cannot resolve ${lessonId}:${round}:${index}.`,
      );
    }
    return target.prompt.kind;
  };

  return {
    activities: [
      {
        id: `${lessonId}-meaning`,
        function: "meaning-comprehension",
        interactionKind: interactionFor("one", 1),
        targetRef: { round: "one", index: 1 },
      },
      {
        id: `${lessonId}-form`,
        function: "form-discrimination",
        interactionKind: interactionFor("two", 0),
        targetRef: { round: "two", index: 0 },
      },
      {
        id: `${lessonId}-production`,
        function: "controlled-production",
        interactionKind: interactionFor("one", 0),
        targetRef: { round: "one", index: 0 },
      },
      {
        id: `${lessonId}-transfer`,
        function: fourth,
        interactionKind: interactionFor("two", 1),
        targetRef: { round: "two", index: 1 },
      },
      {
        id: `${lessonId}-spoken`,
        function: "listening-speaking",
        interactionKind: "spoken",
        targetRef: { spokenVariantId },
      },
    ],
  };
}

const lessonContent = [
  defineA1LessonContent({
    lessonId: "polite-verbs-1",
    situation: {
      en: "You identify a dictionary-form verb, then use its learned polite nonpast form with only the person who acts.",
      it: "Riconosci un verbo nella forma di dizionario, poi usi la forma cortese non-passata imparata con solo la persona che agisce.",
    },
    prerequisiteLessonIds: ["topic-questions-4"],
    prerequisiteConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
      "a1-concept-nominative-ga",
      "a1-concept-interrogative-ka",
    ],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["polite-verbs-1"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["polite-verbs-1"],
    workedExampleVariantIds: [
      "polite-verbs-1-m1",
      "polite-verbs-1-m2",
      "polite-verbs-1-m4",
    ],
    practiceBlueprint: semanticBlueprint(
      "polite-verbs-1",
      "polite-verbs-1-m1",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Find the dictionary form first; then say the matching polite nonpast form.",
      it: "Trova prima la forma di dizionario; poi usa la forma cortese non-passata corrispondente.",
    },
  }),
  defineA1LessonContent({
    lessonId: "polite-verbs-2",
    situation: {
      en: "You say politely what someone eats, drinks, reads, or writes.",
      it: "Dici con cortesia che cosa qualcuno mangia, beve, legge o scrive.",
    },
    prerequisiteLessonIds: ["polite-verbs-1"],
    prerequisiteConceptIds: ["a1-concept-topic-wa"],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["polite-verbs-2"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["polite-verbs-2"],
    workedExampleVariantIds: [
      "polite-verbs-2-m1",
      "polite-verbs-2-m2",
      "polite-verbs-2-m3",
    ],
    practiceBlueprint: semanticBlueprint(
      "polite-verbs-2",
      "polite-verbs-2-m1",
      "transformation",
    ),
    retrievalCue: {
      en: "Put the thing before the direct-object marker, then finish with the polite action.",
      it: "Metti la cosa prima della particella dell'oggetto diretto, poi termina con l'azione cortese.",
    },
  }),
  defineA1LessonContent({
    lessonId: "polite-verbs-3",
    situation: {
      en: "You politely say that an action does not happen now or as a habit.",
      it: "Dici con cortesia che un'azione non avviene ora o come abitudine.",
    },
    prerequisiteLessonIds: ["polite-verbs-2"],
    prerequisiteConceptIds: ["a1-concept-object-wo"],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["polite-verbs-3"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["polite-verbs-3"],
    workedExampleVariantIds: [
      "polite-verbs-3-m1",
      "polite-verbs-3-m2",
      "polite-verbs-3-m4",
    ],
    practiceBlueprint: semanticBlueprint(
      "polite-verbs-3",
      "polite-verbs-3-m1",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Keep the learned polite stem and switch from the affirmative to the negative nonpast ending.",
      it: "Mantieni il tema cortese imparato e cambia dalla finale affermativa a quella negativa non-passata.",
    },
  }),
  defineA1LessonContent({
    lessonId: "polite-verbs-4",
    situation: {
      en: "You distinguish the place where someone works from the destination where they return.",
      it: "Distingui il luogo in cui qualcuno lavora dalla destinazione in cui torna.",
    },
    prerequisiteLessonIds: ["polite-verbs-3"],
    prerequisiteConceptIds: ["a1-concept-object-wo"],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["polite-verbs-4"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["polite-verbs-4"],
    workedExampleVariantIds: [
      "polite-verbs-4-m1",
      "polite-verbs-4-m2",
      "polite-verbs-4-m6",
    ],
    dialogue: {
      turnVariantIds: [
        "polite-verbs-4-m1",
        "polite-verbs-4-m6",
        "polite-verbs-4-m2",
      ],
    },
    practiceBlueprint: semanticBlueprint(
      "polite-verbs-4",
      "polite-verbs-4-m2",
      "transformation",
    ),
    retrievalCue: {
      en: "Ask whether a place is where the action happens or where the person is heading.",
      it: "Chiediti se un luogo indica dove avviene l'azione o dove la persona è diretta.",
    },
  }),
  defineA1LessonContent({
    lessonId: "time-movement-1",
    situation: {
      en: "You put a clock time into a short polite schedule.",
      it: "Inserisci un orario in un breve programma cortese.",
    },
    prerequisiteLessonIds: ["polite-verbs-4"],
    prerequisiteConceptIds: ["a1-concept-location-particle"],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["time-movement-1"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["time-movement-1"],
    workedExampleVariantIds: [
      "time-movement-1-m1",
      "time-movement-1-m2",
      "time-movement-1-m3",
    ],
    practiceBlueprint: semanticBlueprint(
      "time-movement-1",
      "time-movement-1-m1",
      "contextual-response",
    ),
    retrievalCue: {
      en: "For a specific clock time, say the time before the schedule marker and keep the action final.",
      it: "Per un orario preciso, metti l'ora prima della particella del programma e mantieni l'azione finale.",
    },
  }),
  defineA1LessonContent({
    lessonId: "time-movement-2",
    situation: {
      en: "You report a completed action in the morning, at noon, in the evening, or at night.",
      it: "Racconti un'azione conclusa la mattina, a mezzogiorno, la sera o di notte.",
    },
    prerequisiteLessonIds: ["time-movement-1"],
    prerequisiteConceptIds: ["a1-concept-time-schedule"],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["time-movement-2"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["time-movement-2"],
    workedExampleVariantIds: [
      "time-movement-2-m1",
      "time-movement-2-m2",
      "time-movement-2-m3",
    ],
    practiceBlueprint: semanticBlueprint(
      "time-movement-2",
      "time-movement-2-m1",
      "transformation",
    ),
    retrievalCue: {
      en: "Use the day-part word bare, then change the polite ending to the past affirmative.",
      it: "Usa senza particella la parola della parte del giorno, poi cambia la finale cortese al passato affermativo.",
    },
  }),
  defineA1LessonContent({
    lessonId: "time-movement-3",
    situation: {
      en: "You say what did not happen yesterday, today, last week, or as a repeated past habit.",
      it: "Dici ciò che non è avvenuto ieri, oggi, la settimana scorsa o come abitudine passata ripetuta.",
    },
    prerequisiteLessonIds: ["time-movement-2"],
    prerequisiteConceptIds: ["a1-concept-time-schedule"],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["time-movement-3"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["time-movement-3"],
    workedExampleVariantIds: [
      "time-movement-3-m1",
      "time-movement-3-m2",
      "time-movement-3-m3",
    ],
    practiceBlueprint: semanticBlueprint(
      "time-movement-3",
      "time-movement-3-m1",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Use one whole past-negative ending after the learned polite stem.",
      it: "Usa un'unica finale negativa passata dopo il tema cortese imparato.",
    },
  }),
  defineA1LessonContent({
    lessonId: "time-movement-4",
    situation: {
      en: "You ask about a return trip, then give its destination and transport in a short exchange.",
      it: "Chiedi di un viaggio di ritorno, poi indichi destinazione e mezzo in un breve scambio.",
    },
    prerequisiteLessonIds: ["time-movement-3"],
    prerequisiteConceptIds: ["a1-concept-location-particle"],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["time-movement-4"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["time-movement-4"],
    workedExampleVariantIds: [
      "time-movement-4-m1",
      "time-movement-4-m2",
      "time-movement-4-m3",
    ],
    dialogue: {
      turnVariantIds: [
        "time-movement-4-m1",
        "time-movement-4-m2",
        "time-movement-4-m3",
      ],
    },
    practiceBlueprint: semanticBlueprint(
      "time-movement-4",
      "time-movement-4-m2",
      "transformation",
    ),
    retrievalCue: {
      en: "Keep destination and transport roles separate: use the destination or direction marker, then the transport marker.",
      it: "Tieni separati i ruoli di destinazione e mezzo: usa la particella di destinazione o direzione, poi quella del mezzo.",
    },
  }),
];

export const a1FoundationsArea03to04LessonContent = deepFreeze(lessonContent);
export const a1FoundationsArea03to04LessonContents =
  a1FoundationsArea03to04LessonContent;

export const a1FoundationsArea03to04Lexemes =
  a1ExpandedFoundationsLexemes;

/**
 * The all-sixteen-lesson staged catalog. It exists solely for authoring tests
 * and previews; neither the published A1 catalog nor routes import it.
 */
export const a1AllStagedFoundationsBuiltLessons = deepFreeze([
  ...a1FoundationsArea01to02BuiltLessons,
  ...a1FoundationsArea03to04BuiltLessons,
]);

const allStagedVariants: readonly SentenceVariant[] = deepFreeze(
  a1AllStagedFoundationsBuiltLessons.flatMap(({ variants }) => [...variants]),
);
const allStagedVariantById = new Map(
  allStagedVariants.map((variant) => [variant.id, variant]),
);
const allStagedModules = deepFreeze([
  ...a1FoundationsArea01to02Modules,
  ...a1FoundationsArea03to04Modules,
]);

export const a1AllStagedFoundationsCatalogs: A1FoundationsArea03to04Catalogs =
  deepFreeze({
    levels: [],
    modules: allStagedModules.map((module) => ({
      id: module.id,
      level: "a1" as const,
      order: module.order,
      canDoIds:
        module.id === "sentence-foundations"
          ? ["a1-can-do-sentence-foundations"]
          : module.id === "topic-questions"
            ? ["a1-can-do-topic-questions"]
            : module.id === "polite-verbs"
              ? ["a1-can-do-polite-verbs"]
              : ["a1-can-do-time-movement"],
      lessonIds: [...module.lessonIds],
    })),
    checkpoints: [],
    canDos: a1ExpandedFoundationCanDos,
    contexts: a1CanonicalContexts,
    personRoles: a1CanonicalPersonRoles,
    referents: a1CanonicalReferents,
    learningTargetSenses: a1CanonicalLearningTargetSenses,
    semanticValues: a1CanonicalSemanticValues,
    sentenceFamilies: a1CanonicalSentenceFamilies,
    sentenceVariants: allStagedVariants,
    lessons: a1AllStagedFoundationsBuiltLessons.map(({ recipe }) =>
      toFoundationLessonDefinition(recipe, "a1", allStagedVariantById),
    ),
    lessonPositions: buildLessonPositionRecords(
      a1AllStagedFoundationsBuiltLessons.map(({ recipe }) => recipe),
      "a1",
      A1_EXPANDED_CANONICAL_POSITIONS,
    ),
    verbUseRecords: a1ExpandedFoundationsVerbUseRecords,
    lexemeByValueId: a1ExpandedFoundationsLexemeByValueId,
  });

export const a1AllStagedFoundationsCopy = deepFreeze({
  en: {
    ...a1FoundationsArea01to02Copy.en,
    ...a1FoundationsArea03to04Copy.en,
  },
  it: {
    ...a1FoundationsArea01to02Copy.it,
    ...a1FoundationsArea03to04Copy.it,
  },
});

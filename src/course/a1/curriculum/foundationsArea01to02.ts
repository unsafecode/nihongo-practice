/**
 * Compatibility preview exports for the first two published Foundations
 * modules. Every value is derived from the canonical release data.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import {
  buildLessonPositionRecords,
  toFoundationLessonDefinition,
} from "../../foundations/instructionalLessonKit";
import { buildA1LessonViewModel } from "../a1LessonViewModel";
import { a1FoundationCatalogs } from "../catalog/catalog";
import type {
  FoundationCatalogs,
  FoundationModule,
  SentenceVariant,
} from "../../foundations/types";
import {
  a1CanonicalLearningTargetSenses,
  a1CanonicalContexts,
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
  moduleSentenceFoundationsLessons,
  moduleSentenceFoundationsRecipe,
} from "../catalog/moduleSentenceFoundations";
import {
  moduleTopicQuestionsLessons,
  moduleTopicQuestionsRecipe,
} from "../catalog/moduleTopicQuestions";
import { a1StagedFoundationsArea01to02VerbUseRecords } from "../catalog/recurrence";
import { A1_EXPANDED_CANONICAL_POSITIONS } from "../manifest";
import { defineA1LessonContent, type A1PracticeBlueprint } from "./types";

export const a1FoundationsArea01to02BuiltLessons = deepFreeze([
  ...moduleSentenceFoundationsLessons,
  ...moduleTopicQuestionsLessons,
]);

export const a1FoundationsArea01to02Modules = deepFreeze([
  moduleSentenceFoundationsRecipe,
  moduleTopicQuestionsRecipe,
]);

export const a1FoundationsArea01to02ModuleRecipes =
  a1FoundationsArea01to02Modules;

const a1FoundationsArea01to02Variants: readonly SentenceVariant[] = deepFreeze(
  a1FoundationsArea01to02BuiltLessons.flatMap(({ variants }) => [...variants]),
);

const stagedVariantById = new Map(
  a1FoundationsArea01to02Variants.map((variant) => [variant.id, variant]),
);

const stagedModules: readonly FoundationModule[] = deepFreeze(
  a1FoundationsArea01to02Modules.map((module) => ({
    id: module.id,
    level: "a1" as const,
    order: module.order,
    canDoIds:
      module.id === "sentence-foundations"
        ? ["a1-can-do-sentence-foundations"]
        : ["a1-can-do-topic-questions"],
    lessonIds: [...module.lessonIds],
  })),
);

const stagedCanDos = a1ExpandedFoundationCanDos.filter(({ id }) =>
  [
    "a1-can-do-sentence-foundations",
    "a1-can-do-topic-questions",
  ].includes(id),
);

export interface A1FoundationsArea01to02Catalogs extends FoundationCatalogs {
  readonly lexemeByValueId: typeof a1ExpandedFoundationsLexemeByValueId;
}

/**
 * A catalog-neutral compatibility preview for focused lesson tests. It does
 * not alter canonical routes or runtime assembly.
 */
export const a1FoundationsArea01to02Catalogs: A1FoundationsArea01to02Catalogs =
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
    sentenceVariants: a1FoundationsArea01to02Variants,
    lessons: a1FoundationsArea01to02BuiltLessons.map(({ recipe }) =>
      toFoundationLessonDefinition(recipe, "a1", stagedVariantById),
    ),
    lessonPositions: buildLessonPositionRecords(
      a1FoundationsArea01to02BuiltLessons.map(({ recipe }) => recipe),
      "a1",
      A1_EXPANDED_CANONICAL_POSITIONS,
    ),
    verbUseRecords: a1StagedFoundationsArea01to02VerbUseRecords,
    lexemeByValueId: a1ExpandedFoundationsLexemeByValueId,
  });

const moduleCopy = {
  "a1-module-outcome-sentence-foundations": {
    en: "You can build short predicate-final identity sentences and omit a known topic.",
    it: "Sai costruire brevi frasi d'identità con predicato finale e omettere un tema noto.",
  },
  "a1-module-outcome-topic-questions": {
    en: "You can set a topic, focus an identity with が, and ask simple clarification questions.",
    it: "Sai impostare un tema, mettere a fuoco un'identità con が e fare semplici domande di chiarimento.",
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
  for (const lesson of a1FoundationsArea01to02BuiltLessons) {
    Object.assign(copy, lesson[locale]);
  }
  return copy;
}

export const a1FoundationsArea01to02Copy = deepFreeze({
  en: copyByLocale("en"),
  it: copyByLocale("it"),
});

function semanticBlueprint(
  lessonId: string,
  spokenVariantId: string,
  fourth: "transformation" | "contextual-response",
): A1PracticeBlueprint {
  const built = buildA1LessonViewModel(lessonId, "en");
  if (!built.ok) {
    throw new Error(
      `Foundations practice blueprint cannot resolve "${lessonId}": ${built.error.code}.`,
    );
  }

  const interactionFor = (
    round: "one" | "two",
    index: number,
  ): Exclude<A1PracticeBlueprint["activities"][number]["interactionKind"], "spoken"> => {
    const target = built.model.rounds[round === "one" ? 0 : 1].targets[index];
    if (!target) {
      throw new Error(
        `Foundations practice blueprint cannot resolve ${lessonId}:${round}:${index}.`,
      );
    }
    return target.prompt.kind;
  };

  const selectedVisibleTargets = new Set(
    built.model.rounds.flatMap((round) =>
      round.targets.map((target) => target.visibleTargetKey),
    ),
  );
  const candidateVariantIds = a1FoundationCatalogs.lessons
    .find((lesson) => lesson.id === lessonId)
    ?.practice.roundOne.candidateVariantIds.concat(
      a1FoundationCatalogs.lessons.find((lesson) => lesson.id === lessonId)
        ?.practice.roundTwo.candidateVariantIds ?? [],
    ) ?? [];
  const spoken =
    candidateVariantIds.find((variantId) => {
      const surface = built.model.tokensForExample(variantId)
        ?.map((token) => token.jp)
        .join("");
      return surface !== undefined && !selectedVisibleTargets.has(surface);
    }) ?? spokenVariantId;

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
        targetRef: { spokenVariantId: spoken },
      },
    ],
  };
}

const lessonContent = [
  defineA1LessonContent({
    lessonId: "sentence-foundations-1",
    situation: {
      en: "You put identity information before the final polite predicate.",
      it: "Metti le informazioni d'identità prima del predicato cortese finale.",
    },
    prerequisiteLessonIds: ["sounds-4"],
    prerequisiteConceptIds: [],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["sentence-foundations-1"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["sentence-foundations-1"],
    workedExampleVariantIds: [
      "sentence-foundations-1-m1",
      "sentence-foundations-1-m3",
    ],
    practiceBlueprint: semanticBlueprint(
      "sentence-foundations-1",
      "sentence-foundations-1-m1",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Keep the information together, then listen for the final polite predicate.",
      it: "Tieni insieme l'informazione, poi ascolta il predicato cortese finale.",
    },
  }),
  defineA1LessonContent({
    lessonId: "sentence-foundations-2",
    situation: {
      en: "You name Yuki, Ken, Mina, or a friend once and then leave the known person out.",
      it: "Nomini una volta Yuki, Ken, Mina o un amico e poi ometti la persona già nota.",
    },
    prerequisiteLessonIds: ["sentence-foundations-1"],
    prerequisiteConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
    ],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["sentence-foundations-2"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["sentence-foundations-2"],
    workedExampleVariantIds: [
      "sentence-foundations-2-m1",
      "sentence-foundations-2-m5",
    ],
    practiceBlueprint: semanticBlueprint(
      "sentence-foundations-2",
      "sentence-foundations-2-m5",
      "transformation",
    ),
    retrievalCue: {
      en: "Say the person once; omit it only while the reference remains clear.",
      it: "Nomina la persona una volta; omettila solo finché il riferimento resta chiaro.",
    },
  }),
  defineA1LessonContent({
    lessonId: "sentence-foundations-3",
    situation: {
      en: "You choose a name, title, or omission before the limited fallback あなた.",
      it: "Scegli un nome, un titolo o l'omissione prima del ripiego limitato あなた.",
    },
    prerequisiteLessonIds: ["sentence-foundations-2"],
    prerequisiteConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
    ],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["sentence-foundations-3"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["sentence-foundations-3"],
    workedExampleVariantIds: [
      "sentence-foundations-3-m1",
      "sentence-foundations-3-m2",
      "sentence-foundations-3-m5",
    ],
    practiceBlueprint: semanticBlueprint(
      "sentence-foundations-3",
      "sentence-foundations-3-m2",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Prefer a name, title, or omission; reserve あなた for the rare unavoidable reference.",
      it: "Preferisci un nome, un titolo o l'omissione; riserva あなた al raro riferimento inevitabile.",
    },
  }),
  defineA1LessonContent({
    lessonId: "sentence-foundations-4",
    situation: {
      en: "You exchange short identity details, first naming a person and then omitting a recoverable one.",
      it: "Scambi brevi dettagli d'identità, prima nominando una persona e poi omettendola se ricavabile.",
    },
    prerequisiteLessonIds: ["sentence-foundations-3"],
    prerequisiteConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
    ],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["sentence-foundations-4"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["sentence-foundations-4"],
    workedExampleVariantIds: [
      "sentence-foundations-4-m1",
      "sentence-foundations-4-m2",
      "sentence-foundations-4-m3",
    ],
    dialogue: {
      turnVariantIds: [
        "sentence-foundations-4-m1",
        "sentence-foundations-4-m2",
        "sentence-foundations-4-m3",
      ],
    },
    practiceBlueprint: semanticBlueprint(
      "sentence-foundations-4",
      "sentence-foundations-4-m2",
      "transformation",
    ),
    retrievalCue: {
      en: "Give one identity detail explicitly, then let the next speaker omit only what is clear.",
      it: "Dai esplicitamente un dettaglio d'identità, poi lascia che chi parla dopo ometta solo ciò che è chiaro.",
    },
  }),
  defineA1LessonContent({
    lessonId: "topic-questions-1",
    situation: {
      en: "You identify named people politely with は and です.",
      it: "Identifichi con cortesia persone nominate con は e です.",
    },
    prerequisiteLessonIds: ["sentence-foundations-4"],
    prerequisiteConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
    ],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["topic-questions-1"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["topic-questions-1"],
    workedExampleVariantIds: [
      "topic-questions-1-m1",
      "topic-questions-1-m2",
      "topic-questions-1-m3",
    ],
    practiceBlueprint: semanticBlueprint(
      "topic-questions-1",
      "topic-questions-1-m1",
      "contextual-response",
    ),
    retrievalCue: {
      en: "State the named topic, add は, then finish the identity with です.",
      it: "Indica il tema nominato, aggiungi は, poi completa l'identità con です.",
    },
  }),
  defineA1LessonContent({
    lessonId: "topic-questions-2",
    situation: {
      en: "You distinguish what a clause is about with は from a focused identity with が.",
      it: "Distingui ciò di cui parla la frase con は da un'identità in fuoco con が.",
    },
    prerequisiteLessonIds: ["topic-questions-1"],
    prerequisiteConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
    ],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["topic-questions-2"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["topic-questions-2"],
    workedExampleVariantIds: [
      "topic-questions-2-m1",
      "topic-questions-2-m2",
      "topic-questions-2-m8",
    ],
    practiceBlueprint: semanticBlueprint(
      "topic-questions-2",
      "topic-questions-2-m2",
      "transformation",
    ),
    retrievalCue: {
      en: "Use は to set the topic and が to identify the focused person; neither simply means an English subject.",
      it: "Usa は per impostare il tema e が per identificare la persona in fuoco; nessuna delle due equivale semplicemente al soggetto inglese.",
    },
  }),
  defineA1LessonContent({
    lessonId: "topic-questions-3",
    situation: {
      en: "You ask who, what, or where with a final polite か.",
      it: "Chiedi chi, che cosa o dove con un か cortese finale.",
    },
    prerequisiteLessonIds: ["topic-questions-2"],
    prerequisiteConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
      "a1-concept-nominative-ga",
    ],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["topic-questions-3"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["topic-questions-3"],
    workedExampleVariantIds: [
      "topic-questions-3-m1",
      "topic-questions-3-m2",
      "topic-questions-3-m4",
    ],
    practiceBlueprint: semanticBlueprint(
      "topic-questions-3",
      "topic-questions-3-m1",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Keep だれ, なに・なん, or どこ in the information slot and put か last.",
      it: "Tieni だれ, なに・なん o どこ nello spazio dell'informazione e metti か alla fine.",
    },
  }),
  defineA1LessonContent({
    lessonId: "topic-questions-4",
    situation: {
      en: "You clarify which familiar item is bread with this, that, that over there, and which one.",
      it: "Chiarisci quale oggetto familiare è pane con questo, quello, quello laggiù e quale.",
    },
    prerequisiteLessonIds: ["topic-questions-3"],
    prerequisiteConceptIds: [
      "a1-concept-topic-wa",
      "a1-concept-copula-desu",
      "a1-concept-nominative-ga",
      "a1-concept-interrogative-ka",
    ],
    newLexemeIds: [...FOUNDATIONS_LEXEME_IDS_BY_LESSON["topic-questions-4"]],
    learningNoteId:
      FOUNDATIONS_LEARNING_NOTE_IDS_BY_LESSON["topic-questions-4"],
    workedExampleVariantIds: [
      "topic-questions-4-m1",
      "topic-questions-4-m2",
      "topic-questions-4-m4",
    ],
    dialogue: {
      turnVariantIds: [
        "topic-questions-4-m1",
        "topic-questions-4-m2",
        "topic-questions-4-m4",
      ],
    },
    practiceBlueprint: semanticBlueprint(
      "topic-questions-4",
      "topic-questions-4-m4",
      "transformation",
    ),
    retrievalCue: {
      en: "Use これ, それ, and あれ for a known item; use どれ with が to ask which one fits.",
      it: "Usa これ, それ e あれ per un oggetto noto; usa どれ con が per chiedere quale va bene.",
    },
  }),
];

export const a1FoundationsArea01to02LessonContent = deepFreeze(lessonContent);
export const a1FoundationsArea01to02LessonContents =
  a1FoundationsArea01to02LessonContent;

export const a1FoundationsArea01to02Lexemes =
  a1ExpandedFoundationsLexemes;

import type {
  ConceptId,
  Lesson,
  LessonId,
  LexemeId,
  Step,
  StepId,
  UnitId,
} from "../types";

/**
 * Pilot lesson — a konbini exchange.
 *
 * An `immersion` lesson rendered with the stage layout. Where the polite
 * non-past block opens on a rule, this one opens on an eight-turn shop scene
 * and works backwards: comprehend the gist, dismantle three sentences, then
 * rebuild two of them. There is no rule step and no vocabulary batch here —
 * the shape is deliberately unlike the editorial block.
 *
 * Every Japanese string recomposes verified Base content: taught expressions
 * (すみません, はい, どうぞ, おねがいします, わかりました), taught nouns
 * (みず, ぱん, ざっし, きゃく, ひと), the object particle を and the topic
 * particle は, and the verb かう in its ます / ません forms.
 */

const id = (value: string): StepId => value as StepId;

export const konbiniImmersion: Lesson = {
  id: "pilot-konbini-immersion" as LessonId,
  unitId: "base-scenes" as UnitId,
  archetype: "immersion",
  title: {
    it: "Al konbini",
    en: "At the konbini",
  },
  canDo: {
    it: "So capire e rifare un breve scambio d'acquisto in un minimarket.",
    en: "I can follow and re-enact a short buying exchange in a convenience store.",
  },
  teaches: ["object-o", "topic-wa", "masu-nonpast", "question-ka"] as ConceptId[],
  requires: ["polite-stems", "godan-verb-class"] as ConceptId[],
  lexemes: [
    "expression-sumimasen",
    "expression-hai",
    "expression-douzo",
    "expression-onegaishimasu",
    "expression-wakarimashita",
    "noun-mizu",
    "anchor-pan",
    "noun-zasshi",
    "verb-kau",
    "anchor-kyaku",
    "noun-hito",
  ] as LexemeId[],
  steps: [
    {
      id: id("scene-konbini"),
      kind: "dialogueScene",
      estimateSeconds: 240,
      setting: {
        it: "Un cliente al konbini si rivolge alla persona alla cassa.",
        en: "A customer at the konbini speaks to the person at the till.",
      },
      turns: [
        {
          speaker: "きゃく",
          line: {
            kana: "すみません",
            romaji: "sumimasen",
            literal: { it: "scusa", en: "excuse me" },
            natural: { it: "Mi scusi.", en: "Excuse me." },
          },
        },
        {
          speaker: "ひと",
          line: {
            kana: "はい",
            romaji: "hai",
            literal: { it: "sì", en: "yes" },
            natural: { it: "Sì?", en: "Yes?" },
          },
        },
        {
          speaker: "きゃく",
          line: {
            kana: "みずをかいます",
            romaji: "mizu o kaimasu",
            literal: {
              it: "acqua-OGGETTO comprare-CORTESE",
              en: "water-OBJECT buy-POLITE",
            },
            natural: { it: "Prendo dell'acqua.", en: "I'll buy some water." },
          },
        },
        {
          speaker: "ひと",
          line: {
            kana: "はい、どうぞ",
            romaji: "hai, douzo",
            literal: { it: "sì, prego", en: "yes, here you are" },
            natural: { it: "Sì, ecco a lei.", en: "Yes, here you are." },
          },
        },
        {
          speaker: "きゃく",
          line: {
            kana: "ぱん、おねがいします",
            romaji: "pan, onegaishimasu",
            literal: { it: "pane, per favore", en: "bread, please" },
            natural: { it: "Del pane, per favore.", en: "Some bread, please." },
          },
        },
        {
          speaker: "ひと",
          line: {
            kana: "はい、どうぞ。ざっしをかいますか",
            romaji: "hai, douzo. zasshi o kaimasu ka",
            literal: {
              it: "sì, prego. rivista-OGGETTO comprare-CORTESE-DOMANDA",
              en: "yes, here you are. magazine-OBJECT buy-POLITE-QUESTION",
            },
            natural: {
              it: "Sì, ecco a lei. Prende anche una rivista?",
              en: "Yes, here you are. Are you buying a magazine?",
            },
          },
        },
        {
          speaker: "きゃく",
          line: {
            kana: "ざっしはかいません",
            romaji: "zasshi wa kaimasen",
            literal: {
              it: "rivista-TEMA comprare-CORTESE.NEGATIVO",
              en: "magazine-TOPIC buy-POLITE.NEGATIVE",
            },
            natural: {
              it: "La rivista invece non la prendo.",
              en: "The magazine, though, I won't buy.",
            },
          },
        },
        {
          speaker: "ひと",
          line: {
            kana: "わかりました",
            romaji: "wakarimashita",
            literal: { it: "capito", en: "understood" },
            natural: { it: "Va bene.", en: "All right." },
          },
        },
      ],
    },
    {
      id: id("grasp-buys-what"),
      kind: "comprehension",
      estimateSeconds: 100,
      question: {
        it: "Che cosa compra il cliente?",
        en: "What does the customer buy?",
      },
      options: [
        { it: "Acqua e pane", en: "Water and bread" },
        { it: "Solo una rivista", en: "Only a magazine" },
        { it: "Acqua e una rivista", en: "Water and a magazine" },
        { it: "Niente", en: "Nothing" },
      ],
      correctIndex: 0,
    },
    {
      id: id("grasp-refuses-what"),
      kind: "comprehension",
      estimateSeconds: 100,
      question: {
        it: "Che cosa NON compra il cliente?",
        en: "What does the customer NOT buy?",
      },
      options: [
        { it: "La rivista", en: "The magazine" },
        { it: "L'acqua", en: "The water" },
        { it: "Il pane", en: "The bread" },
        { it: "L'ombrello", en: "The umbrella" },
      ],
      correctIndex: 0,
    },
    {
      id: id("grasp-opening-line"),
      kind: "comprehension",
      estimateSeconds: 100,
      question: {
        it: "Come apre il cliente lo scambio?",
        en: "How does the customer open the exchange?",
      },
      options: [
        { it: "すみません (mi scusi)", en: "すみません (excuse me)" },
        { it: "わかりました (ho capito)", en: "わかりました (understood)" },
        { it: "どうぞ (prego)", en: "どうぞ (here you are)" },
        { it: "はい (sì)", en: "はい (yes)" },
      ],
      correctIndex: 0,
    },
    {
      id: id("dismantle-buy-water"),
      kind: "breakdown",
      estimateSeconds: 120,
      line: {
        kana: "みずをかいます",
        romaji: "mizu o kaimasu",
        literal: {
          it: "acqua-OGGETTO comprare-CORTESE",
          en: "water-OBJECT buy-POLITE",
        },
        natural: { it: "Prendo dell'acqua.", en: "I'll buy some water." },
      },
      parts: [
        {
          chunk: "みず",
          role: { it: "oggetto: acqua", en: "object: water" },
        },
        {
          chunk: "を",
          role: { it: "particella dell'oggetto", en: "object particle" },
        },
        {
          chunk: "かいます",
          role: {
            it: "verbo cortese non-passato (comprare)",
            en: "polite non-past verb (buy)",
          },
        },
      ],
    },
    {
      id: id("dismantle-refuse-magazine"),
      kind: "breakdown",
      estimateSeconds: 120,
      line: {
        kana: "ざっしはかいません",
        romaji: "zasshi wa kaimasen",
        literal: {
          it: "rivista-TEMA comprare-CORTESE.NEGATIVO",
          en: "magazine-TOPIC buy-POLITE.NEGATIVE",
        },
        natural: {
          it: "La rivista invece non la prendo.",
          en: "The magazine, though, I won't buy.",
        },
      },
      parts: [
        {
          chunk: "ざっし",
          role: { it: "tema: rivista", en: "topic: magazine" },
        },
        {
          chunk: "は",
          role: { it: "particella del tema", en: "topic particle" },
        },
        {
          chunk: "かいません",
          role: {
            it: "verbo cortese negativo (non comprare)",
            en: "polite negative verb (not buy)",
          },
        },
      ],
    },
    {
      id: id("dismantle-please"),
      kind: "breakdown",
      estimateSeconds: 120,
      line: {
        kana: "ぱん、おねがいします",
        romaji: "pan, onegaishimasu",
        literal: { it: "pane, per favore", en: "bread, please" },
        natural: { it: "Del pane, per favore.", en: "Some bread, please." },
      },
      parts: [
        {
          chunk: "ぱん",
          role: { it: "sostantivo: pane", en: "noun: bread" },
        },
        {
          chunk: "おねがいします",
          role: {
            it: "richiesta cortese: per favore",
            en: "polite request: please",
          },
        },
      ],
    },
    {
      id: id("reuse-build-water"),
      kind: "guidedBuild",
      estimateSeconds: 150,
      target: {
        kana: "みずをかいます",
        romaji: "mizu o kaimasu",
        literal: {
          it: "acqua-OGGETTO comprare-CORTESE",
          en: "water-OBJECT buy-POLITE",
        },
        natural: { it: "Prendo dell'acqua.", en: "I'll buy some water." },
      },
      fragments: ["みず", "を", "かいます"],
      distractors: ["ぱん", "かいません"],
    },
    {
      id: id("reuse-build-not-magazine"),
      kind: "guidedBuild",
      estimateSeconds: 150,
      target: {
        kana: "ざっしはかいません",
        romaji: "zasshi wa kaimasen",
        literal: {
          it: "rivista-TEMA comprare-CORTESE.NEGATIVO",
          en: "magazine-TOPIC buy-POLITE.NEGATIVE",
        },
        natural: {
          it: "La rivista invece non la prendo.",
          en: "The magazine, though, I won't buy.",
        },
      },
      fragments: ["ざっし", "は", "かいません"],
      distractors: ["を", "かいます"],
    },
    {
      id: id("close-recap"),
      kind: "recap",
      estimateSeconds: 120,
      learned: [
        {
          it: "を marca ciò che compri: みずをかいます.",
          en: "を marks what you buy: みずをかいます.",
        },
        {
          it: "は mette in tema, e con ません dici cosa non prendi: ざっしはかいません.",
          en: "は sets the topic, and with ません you say what you skip: ざっしはかいません.",
        },
        {
          it: "Espressioni da cassa: すみません, おねがいします, どうぞ, わかりました.",
          en: "Counter expressions: すみません, おねがいします, どうぞ, わかりました.",
        },
      ],
      next: {
        it: "Prossimo: altre scene brevi al konbini.",
        en: "Next: more short konbini scenes.",
      },
    },
  ] as readonly Step[],
};

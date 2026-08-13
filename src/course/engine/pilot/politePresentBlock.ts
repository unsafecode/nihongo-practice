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
 * Pilot lesson — the polite non-past (ます form).
 *
 * A `new-block` lesson rendered with the editorial layout: it opens on a hook,
 * teaches one rule plus two vocabulary batches, has the learner apply the form
 * in bare predicates, checks with quizzes, and closes on a recap.
 *
 * Every Japanese string here recomposes verified Base content: the twelve verbs
 * appear in their dictionary, ます, and ません forms exactly as the morphology
 * engine realizes them. No particles are introduced — the polite non-past rule
 * deliberately keeps its boundary clear of を, に and friends.
 */

const id = (value: string): StepId => value as StepId;

export const politePresentBlock: Lesson = {
  id: "pilot-polite-present" as LessonId,
  unitId: "base-verbs" as UnitId,
  archetype: "new-block",
  title: {
    it: "Il presente cortese (forma ます)",
    en: "The polite non-past (ます form)",
  },
  canDo: {
    it: "So dire cosa faccio, di solito o dopo, in modo cortese.",
    en: "I can say what I do, habitually or later, in a polite register.",
  },
  teaches: [
    "dictionary-lemma",
    "polite-stems",
    "masu-nonpast",
    "verb-predicate-recognition",
  ] as ConceptId[],
  requires: ["godan-verb-class", "ichidan-verb-class"] as ConceptId[],
  lexemes: [
    "verb-nomu",
    "verb-kau",
    "verb-taberu",
    "verb-yomu",
    "verb-kaku",
    "verb-miru",
    "verb-iku",
    "verb-kaeru",
  ] as LexemeId[],
  steps: [
    {
      id: id("open-hook"),
      kind: "hook",
      estimateSeconds: 60,
      situation: {
        it: "Vuoi raccontare le tue azioni quotidiane con un tono educato.",
        en: "You want to narrate your everyday actions in a polite tone.",
      },
      canDo: {
        it: "Alla fine dirai azioni cortesi come のみます e よみます.",
        en: "By the end you will say polite actions like のみます and よみます.",
      },
    },
    {
      id: id("teach-rule"),
      kind: "rule",
      estimateSeconds: 120,
      statement: {
        it: "Collega ます al tema cortese canonico. Con verbi dinamici, il contesto dà una lettura abituale o futura; questa lezione non significa mai un'azione in corso adesso.",
        en: "Attach ます to the canonical polite stem. With dynamic verbs, context gives a habitual or future reading; this lesson never means an action ongoing right now.",
      },
      boundary: {
        it: "Non aggiungere ancora を, に, へ, で, から, o まで. Un argomento omesso rimane implicito e non è mai etichettato esplicito.",
        en: "Do not add を, に, へ, で, から, or まで yet. An omitted argument stays implicit and is never labelled overt.",
      },
      counterExample: {
        it: "Non tradurre ます automaticamente come 'sta facendo adesso', e non collegarlo direttamente alla forma dizionario.",
        en: "Do not translate ます automatically as 'is doing now,' and do not attach it directly to the dictionary form.",
      },
    },
    {
      id: id("teach-batch-daily"),
      kind: "lexBatch",
      estimateSeconds: 150,
      lexemes: ["verb-nomu", "verb-kau", "verb-taberu", "verb-yomu"] as LexemeId[],
    },
    {
      id: id("teach-batch-moves"),
      kind: "lexBatch",
      estimateSeconds: 150,
      lexemes: ["verb-kaku", "verb-miru", "verb-iku", "verb-kaeru"] as LexemeId[],
    },
    {
      id: id("apply-build-drink"),
      kind: "guidedBuild",
      estimateSeconds: 150,
      target: {
        kana: "のみます",
        romaji: "nomimasu",
        literal: {
          it: "bere-CORTESE.NONPASSATO",
          en: "drink-POLITE.NONPAST",
        },
        natural: {
          it: "Bevo. / Berrò.",
          en: "I drink. / I will drink.",
        },
      },
      fragments: ["のみます"],
      distractors: ["のみません", "のむ"],
    },
    {
      id: id("apply-build-not-eat"),
      kind: "guidedBuild",
      estimateSeconds: 150,
      target: {
        kana: "たべません",
        romaji: "tabemasen",
        literal: {
          it: "mangiare-CORTESE.NEGATIVO",
          en: "eat-POLITE.NEGATIVE",
        },
        natural: {
          it: "Non mangio. / Non mangerò.",
          en: "I do not eat. / I will not eat.",
        },
      },
      fragments: ["たべません"],
      distractors: ["たべます", "たべる"],
    },
    {
      id: id("apply-examples"),
      kind: "examples",
      estimateSeconds: 120,
      lines: [
        {
          kana: "かいます",
          romaji: "kaimasu",
          literal: { it: "comprare-CORTESE", en: "buy-POLITE" },
          natural: { it: "Compro. / Comprerò.", en: "I buy. / I will buy." },
        },
        {
          kana: "よみます",
          romaji: "yomimasu",
          literal: { it: "leggere-CORTESE", en: "read-POLITE" },
          natural: { it: "Leggo. / Leggerò.", en: "I read. / I will read." },
        },
        {
          kana: "みます",
          romaji: "mimasu",
          literal: { it: "vedere-CORTESE", en: "see-POLITE" },
          natural: { it: "Guardo. / Guarderò.", en: "I watch. / I will watch." },
        },
        {
          kana: "いきます",
          romaji: "ikimasu",
          literal: { it: "andare-CORTESE", en: "go-POLITE" },
          natural: { it: "Vado. / Andrò.", en: "I go. / I will go." },
        },
        {
          kana: "かえりません",
          romaji: "kaerimasen",
          literal: { it: "tornare-CORTESE.NEGATIVO", en: "return-POLITE.NEGATIVE" },
          natural: {
            it: "Non torno. / Non tornerò.",
            en: "I do not go home. / I will not go home.",
          },
        },
      ],
    },
    {
      id: id("check-quiz-buy"),
      kind: "quiz",
      estimateSeconds: 90,
      prompt: {
        it: "Qual è la forma cortese non-passata affermativa di かう (comprare)?",
        en: "Which is the polite non-past affirmative of かう (to buy)?",
      },
      options: ["かいます", "かいません", "かう", "のみます"],
      correctIndex: 0,
    },
    {
      id: id("check-quiz-not-read"),
      kind: "quiz",
      estimateSeconds: 90,
      prompt: {
        it: "Quale forma dice 'non leggo / non leggerò' (よむ)?",
        en: "Which form says 'I do not / will not read' (よむ)?",
      },
      options: ["よみます", "よみません", "よむ", "かきます"],
      correctIndex: 1,
    },
    {
      id: id("check-quiz-irregular"),
      kind: "quiz",
      estimateSeconds: 90,
      prompt: {
        it: "Attenzione al tema: qual è la forma cortese di はなす (parlare)?",
        en: "Mind the stem: which is the polite form of はなす (to speak)?",
      },
      options: ["はなします", "かきます", "まちます", "はなす"],
      correctIndex: 0,
    },
    {
      id: id("close-recap"),
      kind: "recap",
      estimateSeconds: 90,
      learned: [
        {
          it: "La forma cortese non-passata attacca ます al tema cortese.",
          en: "The polite non-past attaches ます to the polite stem.",
        },
        {
          it: "La negazione cortese usa ません: たべます → たべません.",
          en: "Polite negation uses ません: たべます → たべません.",
        },
        {
          it: "Occhio ai temi irregolari: まつ → まちます, はなす → はなします.",
          en: "Watch the irregular stems: まつ → まちます, はなす → はなします.",
        },
      ],
      next: {
        it: "Prossimo: marcare l'oggetto con を.",
        en: "Next: marking the object with を.",
      },
    },
  ] as readonly Step[],
};

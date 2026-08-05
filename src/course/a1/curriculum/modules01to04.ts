import { module1ItemsByLesson } from "../catalog/module01Sounds";
import { deepFreeze } from "../../foundations/deepFreeze";
import { defineA1LessonContent, type A1LessonContent } from "./types";
import { phoneticBlueprint, semanticBlueprint } from "./lessonContentHelpers";

const phoneticItems = (
  lessonId: "sounds-1" | "sounds-2" | "sounds-3" | "sounds-4",
) => {
  const ids = module1ItemsByLesson[lessonId].map(({ id }) => id);
  return [ids[0], ids[1], ids[2], ids[3], ids[4]] as [
    string,
    string,
    string,
    string,
    string,
  ];
};

/** The four phonetic lessons, kept independently orderable around Foundations. */
export const a1SoundsLessonContent: readonly A1LessonContent[] = [
  defineA1LessonContent({
    lessonId: "sounds-1",
    situation: {
      en: "You start reading short familiar words one beat at a time.",
      it: "Inizi a leggere parole familiari, una mora alla volta.",
    },
    prerequisiteLessonIds: [],
    prerequisiteConceptIds: [],
    newLexemeIds: [
      "a1-lexeme-umi",
      "a1-lexeme-sumu",
      "a1-lexeme-sushi",
      "a1-lexeme-suki",
    ],
    learningNoteId: "a1-note-sounds-mora-vowels",
    workedExampleVariantIds: ["snd1-a", "snd1-ka", "snd1-sushi"],
    practiceBlueprint: phoneticBlueprint("sounds-1", phoneticItems("sounds-1")),
    retrievalCue: {
      en: "Tap the beats in a, i, u, e, o, then read a short word slowly.",
      it: "Batti le more di a, i, u, e, o, poi leggi lentamente una parola breve.",
    },
  }),
  defineA1LessonContent({
    lessonId: "sounds-2",
    situation: {
      en: "You notice a voiced mark or a small y sound while reading names and places.",
      it: "Noti un segno sonoro o una piccola y mentre leggi nomi e luoghi.",
    },
    prerequisiteLessonIds: ["sounds-1"],
    prerequisiteConceptIds: [],
    newLexemeIds: [
      "a1-lexeme-kyouto",
      "a1-lexeme-shashin",
      "a1-lexeme-shizuka",
      "a1-lexeme-goji",
    ],
    learningNoteId: "a1-note-sounds-gojuon-voicing",
    workedExampleVariantIds: ["snd2-ka", "snd2-ga", "snd2-kyo"],
    practiceBlueprint: phoneticBlueprint("sounds-2", phoneticItems("sounds-2")),
    retrievalCue: {
      en: "Compare an unmarked kana with its voiced partner, then say the whole word.",
      it: "Confronta un kana senza segno con il partner sonoro, poi pronuncia la parola intera.",
    },
  }),
  defineA1LessonContent({
    lessonId: "sounds-3",
    situation: {
      en: "You read a station sign and listen for a small pause or a long vowel.",
      it: "Leggi un cartello alla stazione e ascolti una piccola pausa o una vocale lunga.",
    },
    prerequisiteLessonIds: ["sounds-2"],
    prerequisiteConceptIds: [],
    newLexemeIds: [
      "a1-lexeme-happa",
      "a1-lexeme-kouen",
      "a1-lexeme-toukyou",
      "a1-lexeme-oosaka",
    ],
    learningNoteId: "a1-note-sounds-small-tsu-long-vowels",
    workedExampleVariantIds: ["snd3-kite", "snd3-kitte", "snd3-koukou"],
    practiceBlueprint: phoneticBlueprint("sounds-3", phoneticItems("sounds-3")),
    retrievalCue: {
      en: "Clap the pause in っ and stretch the long vowel for its extra beat.",
      it: "Batti la pausa di っ e allunga la vocale lunga per la sua mora in più.",
    },
  }),
  defineA1LessonContent({
    lessonId: "sounds-4",
    situation: {
      en: "You recognise everyday loanwords on a café menu and in a classroom.",
      it: "Riconosci prestiti di uso quotidiano su un menu del bar e in classe.",
    },
    prerequisiteLessonIds: ["sounds-3"],
    prerequisiteConceptIds: [],
    newLexemeIds: [
      "a1-lexeme-koohii",
      "a1-lexeme-resutoran",
      "a1-lexeme-pan",
      "a1-lexeme-terebi",
    ],
    learningNoteId: "a1-note-sounds-katakana-bridge",
    workedExampleVariantIds: ["snd4-koohii", "snd4-pan", "snd4-kafe"],
    practiceBlueprint: phoneticBlueprint("sounds-4", phoneticItems("sounds-4")),
    retrievalCue: {
      en: "Spot the long-vowel bar, then read the whole katakana word in mora beats.",
      it: "Individua la barra della vocale lunga, poi leggi tutta la parola katakana a more.",
    },
  }),
];

/** Existing introductions-through-actions learner content. */
export const a1Situations01to04LessonContent: readonly A1LessonContent[] = [
  defineA1LessonContent({
    lessonId: "introductions-1",
    situation: {
      en: "You meet a classmate and say who you are.",
      it: "Conosci un compagno di classe e dici chi sei.",
    },
    prerequisiteLessonIds: ["sounds-4"],
    prerequisiteConceptIds: [],
    newLexemeIds: [
      "a1-lexeme-aatisuto",
      "a1-lexeme-kangoshi",
      "a1-lexeme-shefu",
      "a1-lexeme-dezainaa",
      "a1-lexeme-kenkyuusha",
    ],
    learningNoteId: "a1-note-sentence-shape-omission",
    workedExampleVariantIds: ["introductions-1-m1", "introductions-1-m4"],
    dialogue: {
      turnVariantIds: [
        "introductions-1-m1",
        "introductions-1-m4",
        "introductions-1-m2",
      ],
    },
    practiceBlueprint: semanticBlueprint(
      "introductions-1",
      "introductions-1-m4",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Say who you are, then say it again without わたし when the context is clear.",
      it: "Dici chi sei, poi ripetilo senza わたし quando il contesto è chiaro.",
    },
  }),
  defineA1LessonContent({
    lessonId: "introductions-2",
    situation: {
      en: "You reinforce who people are and where they are from in a first conversation.",
      it: "Rafforzi chi sono le persone e da dove vengono in una prima conversazione.",
    },
    prerequisiteLessonIds: ["introductions-1"],
    prerequisiteConceptIds: ["a1-concept-topic-wa", "a1-concept-copula-desu"],
    newLexemeIds: [
      "a1-lexeme-burazirujin",
      "a1-lexeme-kanadajin",
      "a1-lexeme-kankokujin",
      "a1-lexeme-supeinjin",
    ],
    learningNoteId: "a1-note-topic-wa-copula-desu",
    workedExampleVariantIds: ["introductions-2-m1", "introductions-2-m7"],
    practiceBlueprint: semanticBlueprint(
      "introductions-2",
      "introductions-2-m7",
      "transformation",
    ),
    retrievalCue: {
      en: "State the topic once with は, then finish the origin or role with です.",
      it: "Indica il tema una volta con は, poi completa l'origine o il ruolo con です.",
    },
  }),
  defineA1LessonContent({
    lessonId: "introductions-3",
    situation: {
      en: "You match a dictionary form to the polite action you say in class or at work.",
      it: "Colleghi una forma di dizionario all'azione cortese che dici in classe o al lavoro.",
    },
    prerequisiteLessonIds: ["introductions-2"],
    prerequisiteConceptIds: ["a1-concept-topic-wa", "a1-concept-copula-desu"],
    newLexemeIds: [
      "a1-lexeme-rina",
      "a1-lexeme-taichi",
      "a1-lexeme-mei",
      "a1-lexeme-haru",
    ],
    learningNoteId: "a1-note-dictionary-masu-classes",
    workedExampleVariantIds: ["introductions-3-m1", "introductions-3-m2", "introductions-3-m3"],
    practiceBlueprint: semanticBlueprint(
      "introductions-3",
      "introductions-3-m2",
      "transformation",
    ),
    retrievalCue: {
      en: "Use the dictionary form to look up the verb, then say the polite ます form in the sentence.",
      it: "Usa la forma di dizionario per cercare il verbo, poi usa nella frase la forma cortese in ます.",
    },
  }),
  defineA1LessonContent({
    lessonId: "introductions-4",
    situation: {
      en: "You and a partner exchange short personal details without repeating pronouns.",
      it: "Tu e un compagno vi scambiate brevi dati personali senza ripetere i pronomi.",
    },
    prerequisiteLessonIds: ["introductions-3"],
    prerequisiteConceptIds: ["a1-concept-topic-wa", "a1-concept-copula-desu"],
    newLexemeIds: [
      "a1-lexeme-kurasumeeto",
      "a1-lexeme-shisho",
      "a1-lexeme-ongakuka",
      "a1-lexeme-sakka",
    ],
    learningNoteId: "a1-note-personal-reference",
    workedExampleVariantIds: [
      "introductions-4-m2",
      "introductions-4-m5",
      "introductions-4-m8",
    ],
    dialogue: {
      turnVariantIds: [
        "introductions-4-m2",
        "introductions-4-m5",
        "introductions-4-m8",
      ],
    },
    practiceBlueprint: semanticBlueprint(
      "introductions-4",
      "introductions-4-m5",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Answer about yourself, then ask back and omit a personal word when the partner is clear.",
      it: "Rispondi su di te, poi chiedi a tua volta e ometti una parola personale quando il partner è chiaro.",
    },
  }),
  defineA1LessonContent({
    lessonId: "essential-questions-1",
    situation: {
      en: "You point at objects in class and ask what they are.",
      it: "Indichi oggetti in classe e chiedi che cosa sono.",
    },
    prerequisiteLessonIds: ["introductions-4"],
    prerequisiteConceptIds: ["a1-concept-topic-wa", "a1-concept-copula-desu"],
    newLexemeIds: [
      "a1-lexeme-dono-hon",
      "a1-lexeme-passu",
      "a1-lexeme-menyuu",
      "a1-lexeme-posutaa",
      "a1-lexeme-raberu",
    ],
    learningNoteId: "a1-note-question-ka-words",
    workedExampleVariantIds: [
      "essential-questions-1-m1",
      "essential-questions-1-m2",
      "essential-questions-1-m5",
    ],
    practiceBlueprint: semanticBlueprint(
      "essential-questions-1",
      "essential-questions-1-m5",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Keep what in the information slot and let か make the question at the end.",
      it: "Tieni che cosa nello spazio dell'informazione e lascia che か renda interrogativa la frase alla fine.",
    },
  }),
  defineA1LessonContent({
    lessonId: "essential-questions-2",
    situation: {
      en: "You ask a station staff member who someone is and where to find a place.",
      it: "Chiedi a un addetto della stazione chi è qualcuno e dove trovare un posto.",
    },
    prerequisiteLessonIds: ["essential-questions-1"],
    prerequisiteConceptIds: ["a1-concept-interrogative-ka"],
    newLexemeIds: [
      "a1-lexeme-toire",
      "a1-lexeme-kodomo",
      "a1-lexeme-kauntaa",
      "a1-lexeme-deguchi",
      "a1-lexeme-rokkaa",
    ],
    learningNoteId: "a1-note-question-ka-words",
    workedExampleVariantIds: [
      "essential-questions-2-m1",
      "essential-questions-2-m2",
      "essential-questions-2-m5",
    ],
    practiceBlueprint: semanticBlueprint(
      "essential-questions-2",
      "essential-questions-2-m3",
      "transformation",
    ),
    retrievalCue: {
      en: "Use だれ for a person and どこ for a place, then keep か final in the familiar copular question.",
      it: "Usa だれ per una persona e どこ per un luogo, poi tieni か finale nella domanda copulare familiare.",
    },
  }),
  defineA1LessonContent({
    lessonId: "essential-questions-3",
    situation: {
      en: "You check a party time and ask practical prices and quantities in a shop.",
      it: "Controlli l'ora di una festa e chiedi prezzi e quantità pratiche in un negozio.",
    },
    prerequisiteLessonIds: ["essential-questions-2"],
    prerequisiteConceptIds: ["a1-concept-interrogative-ka"],
    newLexemeIds: [
      "a1-lexeme-paatii",
      "a1-lexeme-itsu",
      "a1-lexeme-ikura",
      "a1-lexeme-mikan",
      "a1-lexeme-ikutsu",
    ],
    learningNoteId: "a1-note-question-ka-words",
    workedExampleVariantIds: [
      "essential-questions-3-m1",
      "essential-questions-3-m2",
      "essential-questions-3-m6",
    ],
    practiceBlueprint: semanticBlueprint(
      "essential-questions-3",
      "essential-questions-3-m2",
      "transformation",
    ),
    retrievalCue: {
      en: "Choose the question word for time, price, or number; the polite question shape stays familiar.",
      it: "Scegli la parola interrogativa per ora, prezzo o numero; la forma cortese della domanda resta familiare.",
    },
  }),
  defineA1LessonContent({
    lessonId: "essential-questions-4",
    situation: {
      en: "You ask and answer which familiar language someone understands, noticing the focused information.",
      it: "Chiedi e rispondi quale lingua familiare qualcuno capisce, notando l'informazione a fuoco.",
    },
    prerequisiteLessonIds: ["essential-questions-3"],
    prerequisiteConceptIds: ["a1-concept-interrogative-ka", "a1-concept-topic-wa"],
    newLexemeIds: [
      "a1-lexeme-wakaru",
      "a1-lexeme-kankokugo",
      "a1-lexeme-supeingo",
      "a1-lexeme-doitsugo",
      "a1-lexeme-chuugokugo",
    ],
    learningNoteId: "a1-note-particle-ga",
    workedExampleVariantIds: [
      "essential-questions-4-m1",
      "essential-questions-4-m2",
      "essential-questions-4-m5",
    ],
    practiceBlueprint: semanticBlueprint(
      "essential-questions-4",
      "essential-questions-4-m1",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Keep the language before が; use the same shape to ask and to give the focused answer.",
      it: "Tieni la lingua prima di が; usa la stessa struttura per chiedere e per dare la risposta a fuoco.",
    },
  }),
  defineA1LessonContent({
    lessonId: "actions-1",
    situation: {
      en: "You say what you eat, drink, read, or do during a normal day.",
      it: "Dici che cosa mangi, bevi, leggi o fai in una giornata normale.",
    },
    prerequisiteLessonIds: ["essential-questions-4"],
    prerequisiteConceptIds: ["a1-concept-topic-wa"],
    newLexemeIds: [
      "a1-lexeme-hon",
      "a1-lexeme-shukudai",
      "a1-lexeme-sarada",
      "a1-lexeme-keeki",
      "a1-lexeme-suupu",
    ],
    learningNoteId: "a1-note-particle-o",
    workedExampleVariantIds: ["actions-1-m1", "actions-1-m3", "actions-1-m5"],
    practiceBlueprint: semanticBlueprint(
      "actions-1",
      "actions-1-m3",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Name the thing first, add を, and finish with the polite action.",
      it: "Nomina prima la cosa, aggiungi を e termina con l'azione cortese.",
    },
  }),
  defineA1LessonContent({
    lessonId: "actions-2",
    situation: {
      en: "You contrast a destination for going or coming with the place where an activity happens.",
      it: "Confronti la destinazione di andare o venire con il luogo in cui avviene un'attività.",
    },
    prerequisiteLessonIds: ["actions-1"],
    prerequisiteConceptIds: ["a1-concept-object-wo"],
    newLexemeIds: [
      "a1-lexeme-kuru",
      "a1-lexeme-hakubutsukan",
      "a1-lexeme-yuubinkyoku",
      "a1-lexeme-jimu",
      "a1-lexeme-daigaku",
    ],
    learningNoteId: "a1-note-location-ni-de-contrast",
    workedExampleVariantIds: ["actions-2-m1", "actions-2-m3", "actions-2-m7"],
    practiceBlueprint: semanticBlueprint(
      "actions-2",
      "actions-2-m7",
      "transformation",
    ),
    retrievalCue: {
      en: "For going or coming, put the destination before に; for an activity such as work, put its setting before で.",
      it: "Per andare o venire, metti la destinazione prima di に; per un'attività come lavorare, metti il luogo prima di で.",
    },
  }),
  defineA1LessonContent({
    lessonId: "actions-3",
    situation: {
      en: "You ask a clerk for help or say who studies and buys familiar things.",
      it: "Chiedi aiuto a un commesso o dici chi studia e compra cose familiari.",
    },
    prerequisiteLessonIds: ["actions-2"],
    prerequisiteConceptIds: ["a1-concept-location-particle"],
    newLexemeIds: [
      "a1-lexeme-tenin",
      "a1-lexeme-gaidobukku",
      "a1-lexeme-bentou",
      "a1-lexeme-hagaki",
    ],
    learningNoteId: "a1-note-particle-ni",
    workedExampleVariantIds: ["actions-3-m2", "actions-3-m4", "actions-3-m5"],
    practiceBlueprint: semanticBlueprint(
      "actions-3",
      "actions-3-m4",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Name the recipient before に; keep Japanese before を when you study it.",
      it: "Nomina il destinatario prima di に; tieni il giapponese prima di を quando lo studi.",
    },
  }),
  defineA1LessonContent({
    lessonId: "actions-4",
    situation: {
      en: "You combine familiar action shapes to say what people watch, hear, and write.",
      it: "Combini forme d'azione familiari per dire che cosa le persone guardano, ascoltano e scrivono.",
    },
    prerequisiteLessonIds: ["actions-3"],
    prerequisiteConceptIds: ["a1-concept-recipient-ni"],
    newLexemeIds: [
      "a1-lexeme-eiga",
      "a1-lexeme-ongaku",
      "a1-lexeme-tegami",
      "a1-lexeme-poddokyasuto",
      "a1-lexeme-meeru",
    ],
    learningNoteId: "a1-note-particle-o",
    workedExampleVariantIds: ["actions-4-m1", "actions-4-m3", "actions-4-m5"],
    practiceBlueprint: semanticBlueprint(
      "actions-4",
      "actions-4-m3",
      "contextual-response",
    ),
    retrievalCue: {
      en: "Reuse object plus を plus action, changing only the action and the thing.",
      it: "Riusa oggetto più を più azione, cambiando solo l'azione e la cosa.",
    },
  }),
];

/** @deprecated Use the named sounds and situations arrays for canonical assembly. */
export const a1Modules01to04LessonContent: readonly A1LessonContent[] = deepFreeze([
  ...a1SoundsLessonContent,
  ...a1Situations01to04LessonContent,
]);

import { defineA1LessonContent, type A1LessonContent } from "./types";
import { semanticBlueprint } from "./lessonContentHelpers";

type NewLexemes =
  | readonly [string, string, string, string]
  | readonly [string, string, string, string, string]
  | readonly [string, string, string, string, string, string];

function instructionalContent(
  lessonId: string,
  prerequisiteLessonId: string,
  newLexemeIds: NewLexemes,
  learningNoteId: string,
  workedExampleVariantIds: A1LessonContent["workedExampleVariantIds"],
  fourth: "contextual-response" | "transformation",
  situation: A1LessonContent["situation"],
  retrievalCue: A1LessonContent["retrievalCue"],
  dialogue?: A1LessonContent["dialogue"],
): A1LessonContent {
  return defineA1LessonContent({
    lessonId,
    situation,
    prerequisiteLessonIds: [prerequisiteLessonId],
    prerequisiteConceptIds: [],
    newLexemeIds,
    learningNoteId,
    workedExampleVariantIds,
    dialogue,
    practiceBlueprint: semanticBlueprint(
      lessonId,
      workedExampleVariantIds.at(-1)!,
      fourth,
    ),
    retrievalCue,
  });
}

function synthesisContent(
  lessonId: string,
  prerequisiteLessonId: string,
  workedExampleVariantIds: A1LessonContent["workedExampleVariantIds"],
  fourth: "contextual-response" | "transformation",
  situation: A1LessonContent["situation"],
  retrievalCue: A1LessonContent["retrievalCue"],
  dialogue: NonNullable<A1LessonContent["dialogue"]>,
): A1LessonContent {
  return defineA1LessonContent({
    lessonId,
    situation,
    prerequisiteLessonIds: [prerequisiteLessonId],
    prerequisiteConceptIds: [],
    newLexemeIds: [],
    vocabularyException: {
      kind: "synthesis",
      reason: {
        en: "This practical scenario recombines vocabulary already introduced in earlier lessons.",
        it: "Questo scenario pratico ricombina il vocabolario già introdotto nelle lezioni precedenti.",
      },
    },
    learningNoteId: "a1-note-synthesis-recombine",
    workedExampleVariantIds,
    dialogue,
    practiceBlueprint: semanticBlueprint(
      lessonId,
      workedExampleVariantIds.at(-1)!,
      fourth,
    ),
    retrievalCue,
  });
}

export const a1Modules09to12LessonContent: readonly A1LessonContent[] = [
  instructionalContent(
    "descriptions-1",
    "people-4",
    [
      "a1-lexeme-kyou",
      "a1-lexeme-atsui",
      "a1-lexeme-samui",
      "a1-lexeme-kono-hito",
    ],
    "a1-note-adjectives",
    ["descriptions-1-m1", "descriptions-1-m3", "descriptions-1-m7"],
    "contextual-response",
    {
      en: "You check the immediate weather and describe a calm town.",
      it: "Controlli il tempo immediato e descrivi una città tranquilla.",
    },
    {
      en: "Notice that i-adjectives and na-adjectives both finish politely, but their stems behave differently.",
      it: "Nota che gli aggettivi in i e in na terminano entrambi con cortesia, ma le loro basi si comportano diversamente.",
    },
  ),
  instructionalContent(
    "descriptions-2",
    "descriptions-1",
    [
      "a1-lexeme-kirai",
      "a1-lexeme-neko",
      "a1-lexeme-inu",
      "a1-lexeme-ban",
    ],
    "a1-note-preference-ga",
    ["descriptions-2-m3", "descriptions-2-m6", "descriptions-2-m7"],
    "transformation",
    {
      en: "You compare everyday likes and dislikes with a classmate.",
      it: "Confronti gusti e antipatie quotidiane con un compagno di classe.",
    },
    {
      en: "Keep the liked or disliked thing before が, then finish with the preference predicate.",
      it: "Tieni la cosa che piace o non piace prima di が, poi termina con il predicato di preferenza.",
    },
  ),
  instructionalContent(
    "descriptions-3",
    "descriptions-2",
    [
      "a1-lexeme-ookii",
      "a1-lexeme-chiisai",
      "a1-lexeme-pen",
      "a1-lexeme-koppu",
    ],
    "a1-note-comparison-yori",
    ["descriptions-3-m1", "descriptions-3-m3", "descriptions-3-m8"],
    "contextual-response",
    {
      en: "You compare familiar things while choosing what to carry.",
      it: "Confronti cose familiari mentre scegli che cosa portare.",
    },
    {
      en: "Say the thing being described first, then put the comparison point before より.",
      it: "Dici prima la cosa descritta, poi metti il termine di confronto prima di より.",
    },
  ),
  instructionalContent(
    "descriptions-4",
    "descriptions-3",
    [
      "a1-lexeme-hare",
      "a1-lexeme-kumori",
      "a1-lexeme-ame",
      "a1-lexeme-yuki-weather",
    ],
    "a1-note-synthesis-recombine",
    ["descriptions-4-m1", "descriptions-4-m2", "descriptions-4-m3"],
    "transformation",
    {
      en: "You give a short weather forecast using four common conditions.",
      it: "Dai una breve previsione del tempo usando quattro condizioni comuni.",
    },
    {
      en: "Keep today as the topic and use the familiar です frame to name the forecast condition.",
      it: "Mantieni oggi come tema e usa la struttura familiare con です per nominare la condizione prevista.",
    },
    {
      turnVariantIds: ["descriptions-4-m1", "descriptions-4-m4", "descriptions-4-m3"],
    },
  ),
  instructionalContent(
    "shopping-1",
    "descriptions-4",
    [
      "a1-lexeme-takai",
      "a1-lexeme-yasui",
      "a1-lexeme-enpitsu",
      "a1-lexeme-kagi",
    ],
    "a1-note-quantity",
    ["shopping-1-m1", "shopping-1-m3", "shopping-1-m6"],
    "contextual-response",
    {
      en: "You check prices and decide whether a small item is expensive or cheap.",
      it: "Controlli i prezzi e decidi se un piccolo oggetto è caro o economico.",
    },
    {
      en: "Keep the price or quantity close to the item it describes, then finish the polite statement.",
      it: "Tieni il prezzo o la quantità vicino all'oggetto che descrive, poi completa l'affermazione cortese.",
    },
  ),
  instructionalContent(
    "shopping-2",
    "shopping-1",
    [
      "a1-lexeme-hitotsu",
      "a1-lexeme-futatsu",
      "a1-lexeme-mittsu",
      "a1-lexeme-yottsu",
      "a1-lexeme-itsutsu",
    ],
    "a1-note-quantity",
    ["shopping-2-m1", "shopping-2-m5", "shopping-2-m6"],
    "transformation",
    {
      en: "You choose how many familiar items to buy, eat, or drink.",
      it: "Scegli quanti oggetti familiari comprare, mangiare o bere.",
    },
    {
      en: "Use the native item counter after the object phrase and before the polite action.",
      it: "Usa il contatore nativo per oggetti dopo la frase oggetto e prima dell'azione cortese.",
    },
    { turnVariantIds: ["shopping-2-m2", "shopping-2-m3"] },
  ),
  instructionalContent(
    "shopping-3",
    "shopping-2",
    [
      "a1-lexeme-kudasai",
      "a1-lexeme-juusu",
      "a1-lexeme-onigiri",
      "a1-lexeme-sandoicchi",
    ],
    "a1-note-request-kudasai",
    ["shopping-3-m1", "shopping-3-m2", "shopping-3-m3"],
    "contextual-response",
    {
      en: "You request a drink or a counted item politely at a counter.",
      it: "Richiedi con cortesia una bevanda o un oggetto contato al banco.",
    },
    {
      en: "Put the item before を and end the request with ください.",
      it: "Metti l'oggetto prima di を e termina la richiesta con ください.",
    },
  ),
  instructionalContent(
    "shopping-4",
    "shopping-3",
    [
      "a1-lexeme-fukuro",
      "a1-lexeme-keshigomu",
      "a1-lexeme-reshiito",
      "a1-lexeme-zasshi",
    ],
    "a1-note-synthesis-recombine",
    ["shopping-4-m1", "shopping-4-m2", "shopping-4-m3"],
    "transformation",
    {
      en: "You complete a small purchase by asking for shop items and checking a price.",
      it: "Completi un piccolo acquisto chiedendo articoli del negozio e controllando un prezzo.",
    },
    {
      en: "Use the familiar request, quantity, and price frames with the practical items in the transaction.",
      it: "Usa le strutture familiari di richiesta, quantità e prezzo con gli articoli pratici della transazione.",
    },
    {
      turnVariantIds: ["shopping-4-m4", "shopping-4-m7", "shopping-4-m1"],
    },
  ),
  instructionalContent(
    "existence-needs-1",
    "shopping-4",
    [
      "a1-lexeme-aru",
      "a1-lexeme-iru",
      "a1-lexeme-hana",
      "a1-lexeme-tori",
    ],
    "a1-note-existence-aru-iru",
    ["existence-needs-1-m1", "existence-needs-1-m5", "existence-needs-1-m8"],
    "contextual-response",
    {
      en: "You say what is there at home, distinguishing things from animals.",
      it: "Dici che cosa c'è a casa, distinguendo le cose dagli animali.",
    },
    {
      en: "Use あります for an inanimate thing and います for a person or animal.",
      it: "Usa あります per una cosa inanimata e います per una persona o un animale.",
    },
  ),
  instructionalContent(
    "existence-needs-2",
    "existence-needs-1",
    [
      "a1-lexeme-tsukue-no-ue",
      "a1-lexeme-kaban-no-naka",
      "a1-lexeme-isu-no-shita",
      "a1-lexeme-heya",
    ],
    "a1-note-location-relations",
    ["existence-needs-2-m1", "existence-needs-2-m2", "existence-needs-2-m7"],
    "transformation",
    {
      en: "You locate a familiar item or animal in a room.",
      it: "Localizzi un oggetto o un animale familiare in una stanza.",
    },
    {
      en: "Build the relation expression, add に, then use the familiar existence ending.",
      it: "Costruisci l'espressione di relazione, aggiungi に, poi usa la finale di esistenza familiare.",
    },
    {
      turnVariantIds: [
        "existence-needs-2-m1",
        "existence-needs-2-m3",
        "existence-needs-2-m7",
      ],
    },
  ),
  instructionalContent(
    "existence-needs-3",
    "existence-needs-2",
    [
      "a1-lexeme-hoshii",
      "a1-lexeme-okane",
      "a1-lexeme-kusuri",
      "a1-lexeme-pasupooto",
    ],
    "a1-note-needs-wants",
    ["existence-needs-3-m1", "existence-needs-3-m2", "existence-needs-3-m3"],
    "contextual-response",
    {
      en: "You say what you want in a shop or before a journey.",
      it: "Dici che cosa vuoi in un negozio o prima di un viaggio.",
    },
    {
      en: "Mark the wanted thing with が, just as in the familiar preference pattern.",
      it: "Segna la cosa desiderata con が, proprio come nella struttura di preferenza familiare.",
    },
  ),
  instructionalContent(
    "existence-needs-4",
    "existence-needs-3",
    [
      "a1-lexeme-kasa",
      "a1-lexeme-keitaidenwa",
      "a1-lexeme-chizu",
      "a1-lexeme-jisho",
    ],
    "a1-note-synthesis-recombine",
    ["existence-needs-4-m1", "existence-needs-4-m3", "existence-needs-4-m6"],
    "transformation",
    {
      en: "You locate practical travel items and say which one you need next.",
      it: "Localizzi oggetti pratici per il viaggio e dici quale ti serve dopo.",
    },
    {
      en: "Use the familiar location, existence, and need patterns with the new travel items.",
      it: "Usa le strutture familiari di luogo, esistenza e bisogno con i nuovi oggetti da viaggio.",
    },
    {
      turnVariantIds: [
        "existence-needs-4-m1",
        "existence-needs-4-m4",
        "existence-needs-4-m3",
      ],
    },
  ),
  synthesisContent(
    "capstones-1",
    "existence-needs-4",
    ["capstones-1-m1", "capstones-1-m7", "capstones-1-m3"],
    "contextual-response",
    {
      en: "You introduce yourself, answer a reciprocal question, and add one personal fact.",
      it: "Ti presenti, rispondi a una domanda reciproca e aggiungi un fatto personale.",
    },
    {
      en: "Choose known identity and action pieces for a real first meeting, then ask or answer naturally.",
      it: "Scegli elementi noti di identità e azione per un vero primo incontro, poi chiedi o rispondi in modo naturale.",
    },
    {
      turnVariantIds: ["capstones-1-m1", "capstones-1-m7", "capstones-1-m3"],
    },
  ),
  synthesisContent(
    "capstones-2",
    "capstones-1",
    ["capstones-2-m4", "capstones-2-m6", "capstones-2-m8"],
    "transformation",
    {
      en: "You combine a routine, a familiar place, a preference, and a small purchase.",
      it: "Combini una routine, un luogo familiare, una preferenza e un piccolo acquisto.",
    },
    {
      en: "Retrieve familiar daily-life pieces and connect them to the immediate café or shop situation.",
      it: "Recupera elementi familiari della vita quotidiana e collegali alla situazione immediata del bar o del negozio.",
    },
    {
      turnVariantIds: ["capstones-2-m4", "capstones-2-m6", "capstones-2-m8"],
    },
  ),
  synthesisContent(
    "capstones-3",
    "capstones-2",
    ["capstones-3-m7", "capstones-3-m3", "capstones-3-m8"],
    "contextual-response",
    {
      en: "You ask about a station, say how you are travelling, and state an immediate need.",
      it: "Chiedi della stazione, dici come viaggi e esprimi un bisogno immediato.",
    },
    {
      en: "Recombine a known route, transport phrase, question, and want without adding a new rule.",
      it: "Ricombina un percorso, una frase di trasporto, una domanda e un desiderio noti senza aggiungere una nuova regola.",
    },
    {
      turnVariantIds: ["capstones-3-m7", "capstones-3-m3", "capstones-3-m8"],
    },
  ),
  synthesisContent(
    "capstones-4",
    "capstones-3",
    ["capstones-4-m1", "capstones-4-m5", "capstones-4-m8"],
    "transformation",
    {
      en: "You combine identity, an action, nearby descriptions, and one clarification question.",
      it: "Combini identità, un'azione, descrizioni vicine e una domanda di chiarimento.",
    },
    {
      en: "Move from a known personal fact to a known surrounding only when the conversation needs that topic change.",
      it: "Passa da un fatto personale noto a un elemento dell'ambiente noto solo quando la conversazione richiede quel cambio di tema.",
    },
    {
      turnVariantIds: ["capstones-4-m1", "capstones-4-m5", "capstones-4-m8"],
    },
  ),
];

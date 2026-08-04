import { defineA1LessonContent, type A1LessonContent } from "./types";
import { semanticBlueprint } from "./lessonContentHelpers";

const content = (
  lessonId: string,
  prerequisiteLessonId: string,
  newLexemeIds: readonly [string, string, string, string] | readonly [string, string, string, string, string],
  learningNoteId: string,
  workedExampleVariantIds: readonly [string, string] | readonly [string, string, string],
  fourth: "contextual-response" | "transformation",
  situation: A1LessonContent["situation"],
  retrievalCue: A1LessonContent["retrievalCue"],
  dialogue?: A1LessonContent["dialogue"],
): A1LessonContent =>
  defineA1LessonContent({
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

export const a1Modules05to08LessonContent: readonly A1LessonContent[] = [
  content(
    "routines-1",
    "actions-4",
    [
      "a1-lexeme-rokuji",
      "a1-lexeme-okiru",
      "a1-lexeme-kuji",
      "a1-lexeme-dekakeru",
      "a1-lexeme-kaeru",
    ],
    "a1-note-time-ni",
    ["routines-1-m1", "routines-1-m4", "routines-1-m6"],
    "contextual-response",
    {
      en: "You compare a colleague's morning timetable with your own before leaving home.",
      it: "Confronti l'orario mattutino di un collega con il tuo prima di uscire di casa.",
    },
    {
      en: "Put a specific clock time before に, then finish with the polite routine action.",
      it: "Metti un'ora precisa prima di に, poi termina con l'azione di routine cortese.",
    },
  ),
  content(
    "routines-2",
    "routines-1",
    [
      "a1-lexeme-getsuyoubi",
      "a1-lexeme-benkyou-suru",
      "a1-lexeme-suiyoubi",
      "a1-lexeme-nichiyoubi",
    ],
    "a1-note-time-ni",
    ["routines-2-m1", "routines-2-m2", "routines-2-m6"],
    "transformation",
    {
      en: "You tell a classmate which weekday you study or read.",
      it: "Dici a un compagno in quale giorno della settimana studi o leggi.",
    },
    {
      en: "Use に with the scheduled weekday; do not extend that rule automatically to every time expression.",
      it: "Usa に con il giorno programmato; non estendere automaticamente la regola a ogni espressione di tempo.",
    },
  ),
  content(
    "routines-3",
    "routines-2",
    [
      "a1-lexeme-mainichi",
      "a1-lexeme-yoku",
      "a1-lexeme-tokidoki",
      "a1-lexeme-itsumo",
    ],
    "a1-note-frequency",
    ["routines-3-m1", "routines-3-m2", "routines-3-m4"],
    "contextual-response",
    {
      en: "You compare how often you and two classmates study or read.",
      it: "Confronti quanto spesso tu e due compagni studiate o leggete.",
    },
    {
      en: "Choose a frequency word before the action and leave it bare.",
      it: "Scegli una parola di frequenza prima dell'azione e lasciala senza particella.",
    },
    { turnVariantIds: ["routines-3-m2", "routines-3-m4", "routines-3-m8"] },
  ),
  content(
    "routines-4",
    "routines-3",
    [
      "a1-lexeme-shinbun",
      "a1-lexeme-maiasa",
      "a1-lexeme-juuichiji",
      "a1-lexeme-neru",
    ],
    "a1-note-synthesis-recombine",
    ["routines-4-m4", "routines-4-m5", "routines-4-m7"],
    "transformation",
    {
      en: "You exchange a short daily routine update with a housemate.",
      it: "Scambi un breve aggiornamento sulla routine quotidiana con un coinquilino.",
    },
    {
      en: "Recombine a known time, place, or object phrase with the familiar final action.",
      it: "Ricombina una frase nota di tempo, luogo o oggetto con l'azione finale familiare.",
    },
    { turnVariantIds: ["routines-4-m4", "routines-4-m5", "routines-4-m7"] },
  ),
  content(
    "past-negative-1",
    "routines-4",
    [
      "a1-lexeme-ringo",
      "a1-lexeme-mizu",
      "a1-lexeme-shichiji",
      "a1-lexeme-kayoubi",
    ],
    "a1-note-mashita",
    ["past-negative-1-m1", "past-negative-1-m6", "past-negative-1-m8"],
    "contextual-response",
    {
      en: "You report which everyday actions happened and when.",
      it: "Racconti quali azioni quotidiane sono avvenute e quando.",
    },
    {
      en: "Replace the familiar polite nonpast ending with ました for an action that happened.",
      it: "Sostituisci la finale cortese non-passata familiare con ました per un'azione avvenuta.",
    },
  ),
  content(
    "past-negative-2",
    "past-negative-1",
    [
      "a1-lexeme-ocha",
      "a1-lexeme-suupaa",
      "a1-lexeme-doyoubi",
      "a1-lexeme-juuji",
    ],
    "a1-note-masu-masen",
    ["past-negative-2-m1", "past-negative-2-m2", "past-negative-2-m3"],
    "transformation",
    {
      en: "You politely say which everyday actions you do not do at work, in a café, or in class.",
      it: "Dici con cortesia quali azioni quotidiane non fai al lavoro, al bar o in classe.",
    },
    {
      en: "Keep the known stem and choose ません, the polite nonpast negative.",
      it: "Mantieni il tema noto e scegli ません, il negativo cortese non-passato.",
    },
  ),
  content(
    "past-negative-3",
    "past-negative-2",
    [
      "a1-lexeme-eigo",
      "a1-lexeme-itaria-go",
      "a1-lexeme-hachiji",
      "a1-lexeme-yoru",
    ],
    "a1-note-mashita-masen-deshita",
    ["past-negative-3-m1", "past-negative-3-m2", "past-negative-3-m5"],
    "contextual-response",
    {
      en: "You explain which planned study and reading actions did not happen yesterday.",
      it: "Spieghi quali azioni programmate di studio e lettura non sono avvenute ieri.",
    },
    {
      en: "For a past action that did not happen, use the single ending ませんでした.",
      it: "Per un'azione passata che non è avvenuta, usa l'unica finale ませんでした.",
    },
  ),
  content(
    "past-negative-4",
    "past-negative-3",
    [
      "a1-lexeme-hyaku-en",
      "a1-lexeme-sanbyaku-en",
      "a1-lexeme-gohyaku-en",
      "a1-lexeme-sen-en",
    ],
    "a1-note-copula-tense-polarity",
    ["past-negative-4-m1", "past-negative-4-m3", "past-negative-4-m5"],
    "transformation",
    {
      en: "You correct present and past prices in a polite shop exchange.",
      it: "Correggi prezzi presenti e passati in uno scambio cortese in negozio.",
    },
    {
      en: "In a price statement, choose the copula ending for present, past, negative, or past negative.",
      it: "In una frase sul prezzo, scegli la finale della copula per presente, passato, negativo o negativo passato.",
    },
  ),
  content(
    "places-1",
    "past-negative-4",
    [
      "a1-lexeme-mise",
      "a1-lexeme-kuukou",
      "a1-lexeme-ginkou",
      "a1-lexeme-byouin",
    ],
    "a1-note-particle-ni-destination",
    ["places-1-m1", "places-1-m3", "places-1-m7"],
    "contextual-response",
    {
      en: "You tell a station helper where you are going or where you live.",
      it: "Dici a un addetto della stazione dove stai andando o dove abiti.",
    },
    {
      en: "Put the arrival destination before に with a movement verb.",
      it: "Metti la destinazione di arrivo prima di に con un verbo di movimento.",
    },
  ),
  content(
    "places-2",
    "places-1",
    [
      "a1-lexeme-densha",
      "a1-lexeme-basu",
      "a1-lexeme-kuruma",
      "a1-lexeme-jitensha",
    ],
    "a1-note-particle-he-contrast",
    ["places-2-m1", "places-2-m8"],
    "transformation",
    {
      en: "You describe the direction of a trip while comparing it with an arrival destination.",
      it: "Descrivi la direzione di un viaggio confrontandola con una destinazione di arrivo.",
    },
    {
      en: "Use へ, read e, when direction is the point; keep に for the arrival destination.",
      it: "Usa へ, letto e, quando conta la direzione; conserva に per la destinazione di arrivo.",
    },
    { turnVariantIds: ["places-2-m2", "places-2-m4", "places-2-m8"] },
  ),
  content(
    "places-3",
    "places-2",
    [
      "a1-lexeme-ie",
      "a1-lexeme-hoteru",
      "a1-lexeme-machi",
      "a1-lexeme-eki-no-chikaku",
    ],
    "a1-note-source-limit",
    ["places-3-m3", "places-3-m4", "places-3-m5"],
    "contextual-response",
    {
      en: "You explain where a familiar trip starts and where it ends.",
      it: "Spieghi dove inizia e dove finisce un viaggio familiare.",
    },
    {
      en: "Put the starting place before から and the endpoint before まで.",
      it: "Metti il luogo di partenza prima di から e il punto finale prima di まで.",
    },
  ),
  content(
    "places-4",
    "places-3",
    [
      "a1-lexeme-chikatetsu",
      "a1-lexeme-takushii",
      "a1-lexeme-hikouki",
      "a1-lexeme-fune",
    ],
    "a1-note-synthesis-recombine",
    ["places-4-m2", "places-4-m3", "places-4-m4"],
    "transformation",
    {
      en: "You give a concise route update: where a trip starts, ends, and how someone travels.",
      it: "Dai un breve aggiornamento sul percorso: dove un viaggio inizia, finisce e come qualcuno viaggia.",
    },
    {
      en: "Recombine the known destination, direction, transport, and route phrases for the update.",
      it: "Ricombina le frasi note di destinazione, direzione, trasporto e percorso per l'aggiornamento.",
    },
    { turnVariantIds: ["places-4-m2", "places-4-m3", "places-4-m4"] },
  ),
  content(
    "people-1",
    "places-4",
    [
      "a1-lexeme-haha",
      "a1-lexeme-chichi",
      "a1-lexeme-okaasan",
      "a1-lexeme-otousan",
    ],
    "a1-note-personal-reference",
    ["people-1-m1", "people-1-m3", "people-1-m4"],
    "contextual-response",
    {
      en: "You politely distinguish your family from another person's family in a short introduction.",
      it: "Distingui con cortesia la tua famiglia da quella di un'altra persona in una breve presentazione.",
    },
    {
      en: "Choose the family term that matches whose family you mean, and omit an obvious personal reference.",
      it: "Scegli il termine familiare che corrisponde alla famiglia di cui parli e ometti un riferimento personale ovvio.",
    },
  ),
  content(
    "people-2",
    "people-1",
    [
      "a1-lexeme-ani",
      "a1-lexeme-ane",
      "a1-lexeme-otouto",
      "a1-lexeme-imouto",
    ],
    "a1-note-personal-reference",
    ["people-2-m1", "people-2-m2", "people-2-m5"],
    "transformation",
    {
      en: "You share a few family routines using names and kin terms instead of repeated pronouns.",
      it: "Condividi alcune routine familiari usando nomi e termini di parentela invece di pronomi ripetuti.",
    },
    {
      en: "Name the person once when useful, then let the Japanese context carry the personal reference.",
      it: "Nomina la persona una volta quando serve, poi lascia che il contesto giapponese porti il riferimento personale.",
    },
  ),
  content(
    "people-3",
    "people-2",
    [
      "a1-lexeme-tomodachi",
      "a1-lexeme-kodomo",
      "a1-lexeme-hito",
      "a1-lexeme-kazoku",
    ],
    "a1-note-companion-to",
    ["people-3-m1", "people-3-m2", "people-3-m3"],
    "contextual-response",
    {
      en: "You say who goes with you, then keep that companion meaning separate from asking someone.",
      it: "Dici chi viene con te, poi tieni quel significato di compagno separato dal chiedere a qualcuno.",
    },
    {
      en: "Use と for a companion; use the already-known recipient に only when the person is the target of the action.",
      it: "Usa と per un compagno; usa il に del destinatario già noto solo quando la persona è il bersaglio dell'azione.",
    },
  ),
  content(
    "people-4",
    "people-3",
    [
      "a1-lexeme-raamen",
      "a1-lexeme-kippu",
      "a1-lexeme-kaban",
      "a1-lexeme-shashin",
    ],
    "a1-note-synthesis-recombine",
    ["people-4-m2", "people-4-m4", "people-4-m5"],
    "transformation",
    {
      en: "You and friends exchange small social updates about what each person buys, watches, or listens to.",
      it: "Tu e gli amici scambiate piccoli aggiornamenti sociali su ciò che ciascuno compra, guarda o ascolta.",
    },
    {
      en: "Keep the person clear when needed, then recombine a known object phrase with a familiar action.",
      it: "Rendi chiara la persona quando serve, poi ricombina una frase oggetto nota con un'azione familiare.",
    },
    { turnVariantIds: ["people-4-m2", "people-4-m4", "people-4-m5"] },
  ),
];

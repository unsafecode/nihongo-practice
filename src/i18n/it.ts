import type { LocalePack, PredicateForms } from "./types";

const p = (
  current: string,
  habitual: string,
  future: string,
  past: string,
  currentNegative: string,
  habitualNegative: string,
  futureNegative: string,
  pastNegative: string,
  suggestion: string,
  desire: string,
): PredicateForms => ({
  current, habitual, future, past,
  currentNegative, habitualNegative, futureNegative, pastNegative,
  suggestion, desire,
});

const faccio = p("faccio", "faccio", "farò", "ho fatto", "non faccio", "non faccio", "non farò", "non ho fatto", "facciamo", "voglio fare");
const consulto = p("consulto", "consulto", "consulterò", "ho consultato", "non consulto", "non consulto", "non consulterò", "non ho consultato", "consultiamo", "voglio consultare");

const concepts: LocalePack["concepts"] = {
  ramen: { label: "ramen", realizations: { object: "il ramen" } },
  sushi: { label: "sushi", realizations: { object: "il sushi" } },
  onigiri: { label: "onigiri", realizations: { object: "l'onigiri" } },
  water: { label: "acqua", realizations: { object: "dell'acqua" } },
  beer: { label: "birra", realizations: { object: "la birra" } },
  tea: { label: "tè", realizations: { object: "il tè" } },
  ticket: { label: "biglietto", realizations: { object: "un biglietto" } },
  souvenir: { label: "souvenir", realizations: { object: "un souvenir" } },
  movie: { label: "film", realizations: { object: "un film" } },
  map: { label: "mappa", realizations: { object: "la mappa" } },
  menu: { label: "menù", realizations: { object: "il menù" } },
  restaurant: { label: "ristorante", realizations: { actionPlace: "al ristorante" } },
  home: { label: "casa", realizations: { actionPlace: "a casa", destination: "a casa" } },
  bar: { label: "bar", realizations: { actionPlace: "al bar" } },
  shop: { label: "negozio", realizations: { actionPlace: "al negozio", destination: "al negozio" } },
  station: { label: "stazione", realizations: { actionPlace: "in stazione", destination: "alla stazione" } },
  hotel: { label: "hotel", realizations: { destination: "in hotel" } },
  airport: { label: "aeroporto", realizations: { destination: "all'aeroporto" } },
  japan: { label: "Giappone", realizations: { destination: "in Giappone" } },
  party: { label: "festa", realizations: { destination: "alla festa" } },
  train: { label: "treno", realizations: { transport: "in treno", vehicleBoarded: "il treno", object: "il treno" } },
  bus: { label: "autobus", realizations: { transport: "in autobus", vehicleBoarded: "l'autobus", object: "l'autobus" } },
  taxi: { label: "taxi", realizations: { transport: "in taxi", vehicleBoarded: "il taxi", object: "il taxi" } },
  friend: { label: "amico", realizations: { object: "un amico", personTarget: "un amico" } },
  teacher: { label: "insegnante", realizations: { personTarget: "l'insegnante" } },
  family: { label: "famiglia", realizations: { personTarget: "la mia famiglia" } },
  reservation: { label: "prenotazione", realizations: { object: "una prenotazione" } },
  shopping: { label: "acquisti", realizations: { object: "acquisti" } },
  phoneCall: { label: "telefonata", realizations: { object: "una telefonata" } },
  japaneseLanguage: { label: "giapponese", realizations: { object: "giapponese" } },
  englishLanguage: { label: "inglese", realizations: { object: "inglese" } },
};

const scenarios: LocalePack["scenarios"] = {
  eat: {
    title: "Mangiare qualcosa",
    slots: { object: { prompt: "Che cosa?", grammar: "oggetto diretto" }, place: { prompt: "Dove avviene?", grammar: "luogo dell'azione" } },
    predicate: p("mangio", "mangio", "mangerò", "ho mangiato", "non mangio", "non mangio", "non mangerò", "non ho mangiato", "mangiamo", "voglio mangiare"),
  },
  drink: {
    title: "Bere qualcosa",
    slots: { object: { prompt: "Che cosa?", grammar: "oggetto diretto" }, place: { prompt: "Dove avviene?", grammar: "luogo dell'azione" } },
    predicate: p("bevo", "bevo", "berrò", "ho bevuto", "non bevo", "non bevo", "non berrò", "non ho bevuto", "beviamo", "voglio bere"),
  },
  buy: {
    title: "Comprare qualcosa",
    slots: { object: { prompt: "Che cosa?", grammar: "oggetto diretto" }, place: { prompt: "Dove avviene?", grammar: "luogo dell'azione" } },
    predicate: p("compro", "compro", "comprerò", "ho comprato", "non compro", "non compro", "non comprerò", "non ho comprato", "compriamo", "voglio comprare"),
  },
  watch: {
    title: "Guardare o consultare",
    slots: { object: { prompt: "Che cosa?", grammar: "oggetto diretto" } },
    predicate: p("guardo", "guardo", "guarderò", "ho guardato", "non guardo", "non guardo", "non guarderò", "non ho guardato", "guardiamo", "voglio guardare"),
    predicateByOption: { map: consulto, menu: consulto },
  },
  go: {
    title: "Andare in un luogo",
    slots: { destination: { prompt: "Verso dove?", grammar: "destinazione" }, transport: { prompt: "Con quale mezzo?", grammar: "mezzo di trasporto" } },
    predicate: p("vado", "vado", "andrò", "sono andato/a", "non vado", "non vado", "non andrò", "non sono andato/a", "andiamo", "voglio andare"),
  },
  return: {
    title: "Tornare",
    slots: { destination: { prompt: "Verso dove?", grammar: "destinazione" } },
    predicate: p("torno", "torno", "tornerò", "sono tornato/a", "non torno", "non torno", "non tornerò", "non sono tornato/a", "torniamo", "voglio tornare"),
  },
  board: {
    title: "Salire su un mezzo",
    slots: { vehicle: { prompt: "Su quale mezzo?", grammar: "mezzo su cui si sale" } },
    predicate: p("prendo", "prendo", "prenderò", "ho preso", "non prendo", "non prendo", "non prenderò", "non ho preso", "prendiamo", "voglio prendere"),
  },
  wait: {
    title: "Aspettare qualcuno o qualcosa",
    slots: { target: { prompt: "Chi o che cosa?", grammar: "oggetto diretto" } },
    predicate: p("aspetto", "aspetto", "aspetterò", "ho aspettato", "non aspetto", "non aspetto", "non aspetterò", "non ho aspettato", "aspettiamo", "voglio aspettare"),
  },
  meet: {
    title: "Incontrare qualcuno",
    slots: { person: { prompt: "Chi incontri?", grammar: "persona incontrata" } },
    predicate: p("incontro", "incontro", "incontrerò", "ho incontrato", "non incontro", "non incontro", "non incontrerò", "non ho incontrato", "incontriamo", "voglio incontrare"),
  },
  do: {
    title: "Fare un'attività",
    slots: { activity: { prompt: "Quale attività?", grammar: "oggetto diretto" } },
    predicate: faccio,
    predicateByOption: { reservation: faccio, shopping: faccio, phoneCall: faccio },
  },
  come: {
    title: "Venire in un luogo",
    slots: { destination: { prompt: "Verso dove?", grammar: "destinazione" } },
    predicate: p("vengo", "vengo", "verrò", "sono venuto/a", "non vengo", "non vengo", "non verrò", "non sono venuto/a", "veniamo", "voglio venire"),
  },
  speak: {
    title: "Parlare una lingua",
    slots: { language: { prompt: "Quale lingua?", grammar: "oggetto diretto" } },
    predicate: p("parlo", "parlo", "parlerò", "ho parlato", "non parlo", "non parlo", "non parlerò", "non ho parlato", "parliamo", "voglio parlare"),
  },
};

const forms: LocalePack["forms"] = {
  pres: { label: "Ora / abitudine / futuro", grammar: "non-passato affermativo · 〜ます" },
  past: { label: "È successo", grammar: "passato affermativo · 〜ました" },
  neg: { label: "Non succede / non succederà", grammar: "non-passato negativo · 〜ません" },
  pastneg: { label: "Non è successo", grammar: "passato negativo · 〜ませんでした" },
  vol: { label: "Facciamo…?", grammar: "proposta / invito · 〜ましょう" },
  des: { label: "Voglio…", grammar: "desiderio · 〜たいです" },
};

const times: LocalePack["times"] = { today: "oggi", yesterday: "ieri", tomorrow: "domani", tonight: "stasera", everyDay: "ogni giorno", none: "" };

const ui: LocalePack["ui"] = {
  documentTitle: "Hanasō · Impara il giapponese",
  brand: { title: "Giapponese pratico", subtitle: "Parlato · costruzione delle frasi · hiragana prima di tutto" },
  nav: { modes: "Modalità di studio", syllabary: "Sillabario", phrasebook: "Frasario", laboratory: "Laboratorio" },
  settings: { language: "Lingua", writing: "Scrittura", reference: "Mostra l'inglese di riferimento", unavailable: "Le preferenze non possono essere salvate in questo browser." },
  common: { listen: "Ascolta", slow: "Lento", playing: "In riproduzione…", none: "—", optional: "opzionale", phrases: "frasi" },
  lab: {
    scenario: "Scenario", board: "Lavagna", verb: "Verbo", verbForm: "Che cosa succede al verbo?", when: "Quando?", rule: "Regola",
    base: "base della forma in ます:", ending: "desinenza:",
    particles: "Particelle: mostrano il ruolo delle parole.",
    endings: "Desinenze: mostrano la forma e se la frase è affermativa o negativa.",
    natural: "Combinazione naturale",
    contextual: "Possibile, ma il passato richiede un contesto: per esempio «ogni giorno, durante quel viaggio» oppure, più tardi nella stessa sera, «stasera ho mangiato presto».",
    incompatible: "Questa combinazione non concorda nel modello base. Con ieri scegli una forma passata; con domani una forma non-passata. Desideri e inviti riferiti al passato richiedono costruzioni non ancora incluse.",
  },
  speech: {
    unsupported: "Questo browser non supporta la sintesi vocale.",
    missingVoice: "Non è disponibile una voce giapponese; il testo resta utilizzabile.",
    failed: "Non è stato possibile riprodurre l'audio. Puoi continuare a usare il testo.",
  },
  syllabary: { title: "Sillabario · Hiragana", base: "Segni e suoni di base", voiced: "Dakuten e handakuten", combinations: "Combinazioni con ゃ・ゅ・ょ piccoli", notes: "Da ricordare" },
  phrasebook: { categoriesLabel: "Categorie di frasi" },
  footer: "Fatto per imparare · audio del browser · hiragana prima di tutto",
};

export const it = { locale: "it", ui, forms, times, concepts, scenarios } satisfies LocalePack;

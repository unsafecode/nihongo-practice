import type { CourseCopy } from "./types";
import { assembledCourseCopy } from "../catalog/assembleCourse";

const itUi = {
  home: {
    eyebrow: "Percorso guidato",
    title: "Costruisci il giapponese, un ingranaggio alla volta.",
    lead: "Parti dai suoni, impara a vedere i ruoli nella frase e arriva agli schemi più utili in viaggio.",
    continue: "Continua",
    start: "Inizia",
    review: "Ripassa",
    reset: "Azzera i progressi",
    resetConfirm: "Vuoi davvero azzerare i progressi del percorso?",
    corruptProgress: "I progressi del percorso erano illeggibili e sono stati azzerati. Lingua e scrittura non sono cambiate.",
    dismiss: "Chiudi",
    invalidRoute: (path: string) => `La pagina “${path}” non esiste. Sei tornato al percorso.`,
    missingAnchorTitle: "Sezione non trovata",
    missingAnchorBody:
      "Non è stato possibile raggiungere la sezione collegata della lezione, così sei rimasto all'inizio della lezione. Puoi scorrere per trovarla.",
    lessonsProgress: (visited: number, total: number) =>
      `${visited} di ${total} lezioni`,
    explorePractice: "Esplora la pratica libera",
    corruptProgressTitle: "Progressi azzerati",
    invalidRouteTitle: "Pagina non trovata",
    persistenceWarningTitle: "I progressi non verranno salvati",
    persistenceWarningBody:
      "Il browser non permette di salvare i progressi del percorso in questa sessione. Puoi continuare a usare l'app, ma alla chiusura le lezioni visitate non verranno ricordate.",
  },
  lesson: {
    back: "Tutti i moduli",
    modulePosition: (current: number, total: number) =>
      `Modulo ${current} di ${total}`,
    previous: "Lezione precedente",
    next: "Lezione successiva",
    map: "Mappa del percorso",
    listen: "Ascolta",
    playing: "In riproduzione…",
    legacyModuleNoticeTitle: "Link del modulo aggiornato",
    legacyModuleNoticeBody:
      "Questa lezione ora si trova in un altro modulo. Sei stato portato alla sua posizione attuale.",
    sections: {
      rule: "Regola",
      comparison: "Confronto",
      explore: "Esplora",
      recap: "Ripasso",
    },
    railLabel: "Sezioni della lezione",
    sectionMenuLabel: "Vai a una sezione",
    comparison: {
      before: "Prima",
      after: "Dopo",
      changed: "Cosa cambia",
      dimensions: {
        particle: "Particella",
        ending: "Desinenza",
        time: "Tempo",
        polarity: "Polarità",
        topic: "Tema",
        request: "Richiesta",
        question: "Domanda",
        existence: "Esistenza",
        "word-order": "Ordine delle parole",
        sound: "Suono",
      },
    },
    guided: {
      initial: "Punto di partenza",
      target: "Punto di arrivo",
      changed: "Ingranaggi che cambiano",
      openSyllabary: "Apri il Sillabario",
      journeyLabel: "Una giornata in viaggio, scena per scena",
    },
  },
  practice: {
    eyebrow: "Pratica libera",
    title: "Esplora senza perdere il filo.",
    lead: "Apri gli strumenti quando vuoi: il percorso resta sempre disponibile.",
    labTitle: "Laboratorio delle frasi",
    labBody: "Combina tempo, ruoli e forma verbale sulla lavagna.",
    syllabaryTitle: "Sillabario hiragana",
    syllabaryBody: "Ascolta i segni di base e allenati a riconoscerli.",
    open: "Apri",
    guidedBoard: "Lavagna guidata",
    openGuidedLab: "Apri il Laboratorio guidato",
    backToLesson: "Torna alla lezione",
    invalidPreset: "Il collegamento guidato non è valido: il Laboratorio è partito dai valori iniziali.",
    invalidPresetTitle: "Collegamento guidato non valido",
    invalidReturn: "Il collegamento di ritorno non è valido: usa la navigazione per tornare alla lezione.",
    invalidReturnTitle: "Ritorno non valido",
  },
  exercises: {
    heading: "Esercizi",
    intro: "Prova questi brevi esercizi. Usano solo ciò che questa lezione ti ha mostrato.",
    position: (index: number, total: number) => `Esercizio ${index} di ${total}`,
    submit: "Controlla",
    clear: "Ripulisci",
    accepted: "Corretto",
    retry: "Non ancora: riprova.",
    invalid: "Inserisci una risposta prima di controllare.",
    answerLabel: "La tua risposta, in giapponese",
    answerPlaceholder: "Scrivi in giapponese…",
    sourceLabel: "Frase di partenza",
    intentLabel: "Significato",
    optionsLabel: "Scegli una",
    bankLabel: "Tessere disponibili",
    answerAreaLabel: "La tua frase",
    answerEmpty: "Aggiungi le tessere per comporre la frase.",
    addTile: (tile: string) => `Aggiungi ${tile}`,
    removeTile: (tile: string) => `Rimuovi ${tile}`,
    moveTileBack: (tile: string) => `Sposta ${tile} prima`,
    moveTileForward: (tile: string) => `Sposta ${tile} dopo`,
    blank: "____",
    statusLabel: "Stato della lezione",
    statusVisited: "Aperta",
    statusPracticed: "Esercitata",
    statusConsolidated: "Consolidata",
    unavailableTitle: "Esercizi non disponibili",
    unavailableBody:
      "Non è stato possibile preparare gli esercizi di questa lezione. Puoi comunque leggere la lezione e usare il resto del percorso.",
  },
  review: {
    title: "Da ripassare",
    lead: "Gli esercizi sbagliati tornano qui così puoi rifarli.",
    empty: "Non c'è niente da ripassare. Gli esercizi sbagliati compariranno qui.",
    count: (n: number) => (n === 1 ? "1 da ripassare" : `${n} da ripassare`),
    fromLesson: (lessonTitle: string) => `Da: ${lessonTitle}`,
    mistakes: (n: number) => (n === 1 ? "1 errore" : `${n} errori`),
    practice: "Ripassa ora",
    openLesson: "Apri la lezione",
    resolved: "Ripassato: rimosso dalla tua lista.",
    orphaned: (n: number) =>
      n === 1
        ? "1 elemento salvato da ripassare è di una versione precedente ed è stato messo da parte."
        : `${n} elementi salvati da ripassare sono di una versione precedente e sono stati messi da parte.`,
    unresolvable: (n: number) =>
      n === 1
        ? "1 elemento di ripasso creato dal corso non può essere mostrato ora perché il suo esercizio non è più disponibile."
        : `${n} elementi di ripasso creati dal corso non possono essere mostrati ora perché i loro esercizi non sono più disponibili.`,
    unavailable:
      "Il browser non sta salvando i progressi in questa sessione, quindi questa lista si azzererà alla chiusura dell'app.",
  },
} satisfies Pick<CourseCopy, "home" | "lesson" | "practice" | "exercises" | "review">;

const itCourseMap: CourseCopy["courseMap"] = {
  heading: "Le fasi del percorso",
  phases: {
    orient: {
      title: "Orientati",
      purpose: "Suoni e struttura di base della frase.",
    },
    build: {
      title: "Costruisci",
      purpose: "Aggiungi azioni, oggetti e riferimenti di tempo.",
    },
    navigate: {
      title: "Naviga",
      purpose: "Muoviti tra luoghi, persone e richieste quotidiane.",
    },
    synthesize: {
      title: "Sintetizza",
      purpose: "Metti insieme tutto in una lezione conclusiva.",
    },
  },
  prerequisites: (moduleNames: string[]) =>
    moduleNames.length === 0
      ? "Nessuno: puoi iniziare da qui."
      : `Idealmente dopo: ${moduleNames.join(", ")}.`,
  estimatedMinutes: (minutes: number) => `Circa ${minutes} min`,
  coverageMetadata: (lessons, verbs, vocabularyItems) =>
    `${lessons} lezioni · ${verbs} verbi · ${vocabularyItems} parole`,
  stateCurrent: "Sei qui",
  stateRecommended: "Consigliato",
  stateVisited: "Visitato",
  expandLabel: (moduleTitle: string) => `Espandi le lezioni di ${moduleTitle}`,
  collapseLabel: (moduleTitle: string) => `Comprimi le lezioni di ${moduleTitle}`,
  revisitTitle: "Hai visitato tutte le lezioni",
  revisitBody:
    "Puoi rivedere qualunque lezione quando vuoi: non c'è un traguardo finale da raggiungere.",
};


export const it = {
  ...itUi,
  courseMap: itCourseMap,
  // Module/lesson/objective/outcome/block/example copy is projected from the
  // shared curriculum copy catalog (spec §9.1): Japanese never enters the
  // locale files, and IT/EN key parity is guaranteed by a single source.
  ...assembledCourseCopy.it,
} satisfies CourseCopy;

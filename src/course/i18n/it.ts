import type { CourseCopy } from "./types";
import { assembledCourseCopy } from "../catalog/assembleCourse";
import {
  a1RuntimeLessonCopy,
  a1RuntimeModuleCopy,
  a1RuntimeObjectiveCopy,
  a1RuntimeOutcomeCopy,
  a1RuntimePhoneticCopy,
} from "../a1/runtimeCopy";
import {
  a2RuntimeLessonCopy,
  a2RuntimeModuleCopy,
  a2RuntimeObjectiveCopy,
  a2RuntimeOutcomeCopy,
  a2RuntimeKanjiMeaningCopy,
} from "../a2/runtimeCopy";

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
    levelBadge: "A1, il nostro allineamento ai descrittori Can-do JF/CEFR",
    courseShape: (moduleCount: number, lessonCount: number) =>
      `${moduleCount} moduli, ${lessonCount} lezioni`,
  },
  canDoSummary: {
    heading: "Cosa sai già fare",
    demonstratedCount: (demonstrated: number, total: number) =>
      `${demonstrated} di ${total} Can-do hanno prove accettate`,
    tierNotStarted: "Non iniziato",
    tierVisited: "Visitato",
    tierPracticed: "Esercitato",
    tierDemonstrated: "Dimostrato",
  },
  checkpoint: {
    heading: "Verifica A1",
    notMet:
      "La verifica si completa automaticamente quando ogni lezione scenario è consolidata. Non c'è un test separato da sostenere.",
    met: "Verifica completata: tutte le lezioni scenario sono consolidate.",
    evidenceLink: "Vedi le prove dei tuoi Can-do",
  },
  courseLevels: {
    selectorLabel: "Livello del corso",
    a1: "A1",
    a2: "A2",
    a1Heading: "Corso A1",
    a2Heading: "Corso A2",
    a2Badge: "A2, il nostro allineamento ai descrittori Can-do JF/CEFR",
    a2AvailableHint:
      "A2 è disponibile quando vuoi. Si basa su A1, quindi affrontare prima A1 aiuta — ma nulla è bloccato.",
    a2RecommendedHint:
      "Hai affrontato la verifica A1, quindi A2 è un buon passo successivo. Era comunque sempre aperto — nulla era bloccato.",
    a2CheckpointHeading: "Verifica A2",
    resetLevel: (levelLabel: string) => `Azzera i progressi di ${levelLabel}`,
    resetLevelConfirm: (levelLabel: string) =>
      `Vuoi davvero azzerare i progressi del corso ${levelLabel}? I progressi dell'altro livello vengono mantenuti.`,
  },
  kanji: {
    sectionHeading: "Kanji di questa lezione",
    sectionIntro:
      "Ogni kanji è mostrato dentro la parola a cui appartiene. Riconoscilo lì: le frasi di pratica restano in kana e non c'è nulla da scrivere.",
    assessedExplanation: (glyph: string) =>
      `Su ${glyph} sei in fase di verifica, quindi la lettura non è mostrata qui.`,
    revealShow: "Mostra la lettura",
    revealHide: "Nascondi la lettura",
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
    legacyLessonConsolidatedNoticeTitle: "Questa lezione si trova qui",
    legacyLessonConsolidatedNoticeBody:
      "La vecchia lezione sounds-5 è confluita in questa, che ora copre anche i suoi contenuti in katakana.",
    sections: {
      rule: "Regola",
      comparison: "Confronto",
      explore: "Esplora",
      recap: "Ripasso",
    },
    railLabel: "Sezioni della lezione",
    sectionMenuLabel: "Vai a una sezione",
    contentFormattingError:
      "Non è stato possibile mostrare questo esempio in giapponese.",
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
    recap: {
      canDoLabel: "Can-do",
      variationLabel: "Cosa è cambiato",
      vocabLabel: "Parole di questa lezione",
      nextRetrievalTitle: "Tornerà nel ripasso",
      nextRetrievalBody:
        "Tutto ciò che non hai indovinato qui tornerà nella coda di ripasso, così potrai riprovare.",
    },
  },
  a1Lesson: {
    sections: {
      rule: "Obiettivo",
      vocabulary: "Parole nuove",
      grammar: "Grammatica",
      comparison: "Esempi",
      explore: "Pratica",
      recap: "Ripasso",
    },
    overview: {
      canDoLabel: "Can-do",
      situationLabel: "Situazione",
      prerequisitesLabel: "Si basa su",
    },
    vocabulary: {
      newWordsHeading: "Parole nuove",
      reviewWordsHeading: "Parole già note da riusare",
      reviewBadge: "Ripasso",
      reviewExceptionLabel: "Nota di ripasso",
      showMeanings: "Mostra i significati",
      hideMeanings: "Nascondi i significati",
      meaningLabel: "Significato",
      categoryLabel: "Categoria",
      categories: {
        pronoun: "Pronome",
        person: "Persona",
        noun: "Nome",
        verb: "Verbo",
        adjective: "Aggettivo",
        "question-word": "Parola interrogativa",
        time: "Tempo",
        expression: "Espressione",
      },
      verbFormsLabel: "Forme del verbo",
      dictionaryLabel: "Forma dizionario",
      politeLabel: "Forma cortese",
      classLabel: "Classe verbale",
      verbClasses: {
        godan: "Godan",
        ichidan: "Ichidan",
        irregular: "Irregolare",
      },
    },
    learningNote: {
      kindLabel: "Tipo di nota",
      kinds: {
        grammar: "Nota di grammatica",
        phonetic: "Nota sui suoni",
        synthesis: "Nota di sintesi",
      },
      meaningLabel: "Significato",
      useLabel: "Uso",
      constructionLabel: "Costruzione",
      typicalMistakeLabel: "Errore tipico",
      subjectOmissionLabel: "Omissione del soggetto",
      nearestContrastLabel: "Contrasto più vicino",
      patternLabel: "Schema",
    },
    examples: {
      translationLabel: "Traduzione naturale",
      glossesLabel: "Parola per parola",
      dialogueLabel: "Breve dialogo",
      turnLabel: (position: number) => `Turno ${position}`,
      optionalPattern: "Esplora lo schema",
    },
    practice: {
      functionLabel: "Funzione di pratica",
      functions: {
        "meaning-comprehension": "Capisci il significato",
        "form-discrimination": "Riconosci la forma",
        "controlled-production": "Costruisci la forma",
        transformation: "Trasforma lo schema",
        "contextual-response": "Rispondi nel contesto",
        "listening-speaking": "Ascolta e parla",
      },
    },
    audio: {
      play: "Ascolta",
      playing: "In riproduzione…",
      unavailable: "L'audio giapponese non è disponibile in questo browser.",
      failed: "La riproduzione audio non è riuscita. Riprova.",
      statusLabel: "Stato dell'audio",
    },
    recap: {
      meaningsAndFormsLabel: "Significati e forme",
      retrievalCueLabel: "Richiamo per il ripasso",
      reviewExceptionLabel: "Nota di ripasso",
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
  spokenAttempt: {
    heading: "Prova a dirla (facoltativo)",
    intro:
      "Questo passaggio è facoltativo. Ascolta il modello e ripeti la frase ad alta voce. Ogni lezione funziona del tutto anche senza.",
    targetLabel: "Frase da dire",
    meaningLabel: "Significato",
    listen: "Ascolta il modello",
    playing: "In riproduzione…",
    tryButton: "Prova a parlare",
    consentTitle: "Prima di usare il microfono",
    consentBody:
      "Parlare è facoltativo. L'app non salva alcun audio e non conserva il testo riconosciuto. Il browser, il sistema operativo o la sua voce possono elaborare l'audio per trasformarlo in testo. Se non attivi il microfono, tutti gli altri esercizi restano utilizzabili.",
    consentAcknowledge: "Ho capito, continua",
    consentDismiss: "Non ora",
    micStart: "Parla ora",
    micStop: "Interrompi",
    tryAgain: "Riprova",
    statusRegionLabel: "Stato della prova parlata",
    statusListening: "In ascolto…",
    statusProcessing: "Controllo che cosa ha sentito il browser…",
    resultMatched: "Il browser ha riconosciuto la frase.",
    resultClose: "Il browser ha riconosciuto quasi tutta la frase.",
    resultRetry: "Il browser non ha riconosciuto la frase. Riprova.",
    errorUnsupported:
      "Questo browser non trasforma la voce in testo. Puoi comunque ascoltare il modello e ripetere ad alta voce.",
    errorDenied:
      "Il microfono è bloccato. Puoi comunque ascoltare il modello e ripetere ad alta voce.",
    errorNoSpeech:
      "Il browser non ha sentito nulla. Riprova, oppure ascolta il modello e ripeti ad alta voce.",
    errorAborted: "La registrazione si è interrotta.",
    errorNetwork:
      "Per trasformare la voce in testo serve una connessione e ora il servizio non è raggiungibile. Puoi comunque ascoltare il modello e ripetere ad alta voce.",
    errorService:
      "La trasformazione della voce in testo non è disponibile ora. Puoi comunque ascoltare il modello e ripetere ad alta voce.",
    repeatTitle: "Ascolta e ripeti",
    repeatBody:
      "Ascolta il modello e ripeti la frase ad alta voce quando vuoi.",
    heardLabel: "Il browser ha sentito:",
    segmentsLabel: "Parola per parola",
    segmentMatched: "riconosciuta",
    segmentMissing: "non riconosciuta",
    criticalLabel: "parola chiave",
    segmentUnavailable: "Segmento non disponibile",
  },
  foundation: {
    matrixTitle: "Matrice delle frasi",
    matrixIntro:
      "Osserva come lo stesso schema funziona con persone e situazioni diverse. Mostra il resto quando vuoi.",
    showAll: "Mostra tutti gli esempi",
    showFewer: "Mostra meno esempi",
    speakerLabel: "Chi parla",
    contextLabel: "Situazione",
    omittedSubject: "Soggetto sottinteso",
    guidedTitle: "Costruzione guidata",
    initialLabel: "Parti da",
    targetLabel: "Arriva a",
    activeAxesLabel: "Cosa cambia",
    roundOneTitle: "Esercizi round 1",
    roundOneIntro: "Riconosci e costruisci gli schemi appena visti.",
    roundTwoTitle: "Esercizi round 2",
    roundTwoIntro:
      "Combina gli elementi in modi nuovi che non hai ancora esercitato.",
    transferLabel: "Nuova combinazione",
    unavailableTitle: "Non è stato possibile preparare questa lezione",
    unavailableBody:
      "Alcuni contenuti di questa lezione non si sono potuti costruire ora. Non è stato mostrato nulla, così non ti eserciti mai su un esempio incompleto.",
  },
  progressMigration: {
    noticeTitle: "I tuoi progressi nel percorso sono stati ricostruiti",
    noticeBody:
      "La struttura del percorso è cambiata. Ogni visita a una lezione che corrisponde in modo sicuro alla nuova struttura resta contrassegnata come visitata. Ogni visita senza una corrispondenza sicura nella nuova struttura è conservata solo come dati di recupero, senza risultare visitata. I tentativi di pratica, gli elementi di ripasso e i risultati delle verifiche legati agli esercizi rinnovati potrebbero dover essere ripetuti.",
    acknowledge: "Ho capito",
    helpTitle: "Informazioni sulla ricostruzione del percorso",
    helpBody:
      "Una versione precedente di questo percorso teneva traccia dei progressi in modo diverso. Quando la struttura è cambiata, ogni visita a una lezione che corrisponde in modo sicuro alla nuova struttura viene mantenuta automaticamente. I tentativi di pratica, gli elementi di ripasso salvati e i risultati delle verifiche legati agli esercizi rinnovati potrebbero dover essere completati di nuovo, perché non corrispondono più esattamente ai nuovi esercizi. Ogni vecchia visita senza una corrispondenza sicura nella nuova struttura è conservata come dati di recupero, senza essere considerata una lezione visitata equivalente.",
  },
} satisfies Pick<CourseCopy, "home" | "canDoSummary" | "checkpoint" | "courseLevels" | "kanji" | "lesson" | "a1Lesson" | "practice" | "exercises" | "review" | "spokenAttempt" | "foundation" | "progressMigration">;

const itCourseMap: CourseCopy["courseMap"] = {
  heading: "Il percorso",
  prerequisites: (moduleNames: string[]) =>
    moduleNames.length === 0
      ? "Nessuno: puoi iniziare da qui."
      : `Idealmente dopo: ${moduleNames.join(", ")}.`,
  stateCurrent: "Sei qui",
  stateRecommended: "Consigliato",
  stateVisited: "Visitato",
  statePracticed: "Esercitato",
  stateDemonstrated: "Dimostrato",
  expandLabel: (moduleTitle: string) => `Espandi le lezioni di ${moduleTitle}`,
  collapseLabel: (moduleTitle: string) => `Comprimi le lezioni di ${moduleTitle}`,
  revisitTitle: "Hai visitato tutte le lezioni",
  revisitBody:
    "Puoi rivedere qualunque lezione quando vuoi: non c'è un traguardo finale da raggiungere.",
};


export const it = {
  ...itUi,
  courseMap: itCourseMap,
  // Module/lesson titles and Can-do objective/module-outcome copy are
  // resolved from the validated A1 release catalog's own copy ids (Phase 2
  // Task 6) — never from the legacy, disjoint curriculum catalog. `blocks`
  // and `examples`, however, are keyed by fine-grained ids (per-example
  // translations, `${legacyLessonId}-rule/-comparison/-explore/-recap`
  // section copy) that never collide with the A1 module/lesson/objective/
  // outcome namespace, and the shared example catalog (`data/examples.ts`)
  // is the same one the legacy `assembleCourse` pipeline produces this copy
  // from — so they're kept from the legacy course copy, still genuinely used
  // by the legacy `spokenAttemptModel`/`TransformComparison`/`GuidedToolLink`
  // consumers. `journeyScenes` has no shipped content in either pipeline.
  modules: { ...a1RuntimeModuleCopy("it"), ...a2RuntimeModuleCopy("it") },
  lessons: { ...a1RuntimeLessonCopy("it"), ...a2RuntimeLessonCopy("it") },
  objectives: { ...a1RuntimeObjectiveCopy("it"), ...a2RuntimeObjectiveCopy("it") },
  outcomes: { ...a1RuntimeOutcomeCopy("it"), ...a2RuntimeOutcomeCopy("it") },
  blocks: assembledCourseCopy.it.blocks,
  examples: assembledCourseCopy.it.examples,
  journeyScenes: {} as CourseCopy["journeyScenes"],
  phonetics: a1RuntimePhoneticCopy("it"),
  kanjiMeanings: a2RuntimeKanjiMeaningCopy("it"),
} satisfies CourseCopy;

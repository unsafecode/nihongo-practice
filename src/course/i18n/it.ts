import type { CourseCopy } from "./types";
import { assembledCourseCopy } from "../catalog/assembleCourse";
import { mergeBaseNavigationDictionary } from "../base/copy/en";
import { baseNavigationCopyIt } from "../base/copy/it";
import { courseModulesByLevel } from "../data/course";
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
  progressMutation: {
    title: "I progressi non sono stati aggiornati",
    body: (lessonId: string) =>
      `Non è stato possibile registrare in modo sicuro i progressi per la lezione “${lessonId}”. Torna al percorso e riprova.`,
    dismiss: "Chiudi",
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
    recommendedMarker: "Consigliato",
    base: "Base",
    a1: "A1",
    a2: "A2",
    baseHeading: "Corso Base",
    a1Heading: "Corso A1",
    a2Heading: "Corso A2",
    baseBadge: "Base, fondamenta create dal prodotto per Can-do pratici A1",
    a1Badge: "A1, pratica quotidiana costruita sulle fondamenta Base",
    a2Badge: "A2, il nostro allineamento ai descrittori Can-do JF/CEFR",
    baseAvailableHint:
      "Fondamentali per suoni, kana e primi schemi di frase.",
    baseRecommendedHint:
      "Inizia da qui se il corso è nuovo per te e vuoi prima i fondamentali.",
    a1AvailableHint:
      "A1 resta aperto e applica i fondamentali nelle situazioni quotidiane.",
    a1RecommendedHint:
      "A1 è consigliato per chi è pronto ad applicare le basi del Base nelle situazioni quotidiane.",
    a2AvailableHint:
      "A2 resta aperto e costruisce conversazioni collegate.",
    a2RecommendedHint:
      "A2 resta aperto come buon passo successivo dopo A1 e costruisce conversazioni collegate.",
    baseCheckpointHeading: "Verifica Base",
    a1CheckpointHeading: "Verifica A1",
    a2CheckpointHeading: "Verifica A2",
    descriptorUnavailableTitle: "Dettagli Can-do non disponibili",
    descriptorUnavailableBody:
      "La descrizione di questo Can-do non è disponibile ora. La mappa del corso e i collegamenti alle lezioni restano disponibili.",
    checkpointNotAttempted: (levelLabel: string) =>
      `Non è ancora registrato alcun tentativo della verifica ${levelLabel}.`,
    checkpointAttemptRecorded: (levelLabel: string) =>
      `È registrato un tentativo della verifica ${levelLabel}.`,
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
      baseReferencesLabel: "Sistemi Base che stai riutilizzando",
      baseReferencesHint:
        "Questa lezione applica questi sistemi invece di insegnarli: apri un riferimento per rivedere l'intero schema.",
    },
  },
  baseLesson: {
    sections: {
      rule: "Regola",
      vocabulary: "Vocabolario",
      grammar: "Grammatica",
      comparison: "Esempi",
      explore: "Pratica",
      recap: "Riepilogo",
    },
    unavailableTitle: "Questa lezione non è disponibile",
    unavailableBody:
      "Non è stato possibile preparare parte del contenuto di questa lezione. Non è stato mostrato nulla, così non ti eserciti mai su un esempio non funzionante.",
    vocabulary: {
      heading: "Vocabolario",
      newWordsHeading: "Parole nuove",
      reviewWordsHeading: "Parole già note da riutilizzare",
      meaningLabel: "Significato",
    },
    explanation: {
      mainLabel: "Come funziona",
      constructionLabel: "Costruzione",
      constraintsLabel: "Dove si applica",
      commonErrorLabel: "Errore comune",
      nearestContrastLabel: "Contrasto più vicino",
      phoneticLabel: "Spiegazione del suono",
      contrastMapHeading: "Contrasti sonori",
    },
    examples: {
      heading: "Esempi svolti",
      dialogueHeading: "Dialogo",
      translationLabel: "Traduzione naturale",
      turnLabel: (position: number) => `Turno ${position}`,
    },
    reference: {
      heading: "Riferimento finora",
    },
    practice: {
      heading: "Pratica",
      intro: "Svolgi ogni passaggio in ordine; ognuno si basa sulla lezione qui sopra.",
      stageNonSpokenHeading: "Costruisci e riconosci",
      stageListeningHeading: "Ascolta",
      stageSpokenHeading: "Parla",
      submit: "Verifica",
      accepted: "Corretto",
      retry: "Non ancora — riprova.",
      optionsLabel: "Scegline una",
      tileBankLabel: "Tasselli disponibili",
      tileAnswerLabel: "La tua risposta",
      revealAnswer: "Mostra la risposta",
      selfCheckPrompt: "L'hai indovinata?",
      selfCheckCorrect: "Sì, l'avevo giusta",
      selfCheckRetry: "Non proprio — mi serve altra pratica",
    },
    audio: {
      idle: "Riproduci audio",
      playing: "Riproduzione…",
      stopped: "Fermato",
      unavailable: "L'audio non è disponibile in questo browser.",
      blocked: "La riproduzione audio è stata bloccata. Riprova.",
      failed: "La riproduzione audio non è riuscita. Riprova.",
      retry: "Riprova",
      statusLabel: "Stato dell'audio",
    },
    listening: {
      heading: "Ascolto",
      instruction: "Ascolta, poi scegli l'opzione che corrisponde a quello che hai sentito.",
    },
    recap: {
      heading: "Riepilogo",
      vocabularyHeading: "Vocabolario di questa lezione",
      canDoLabel: "Ora sai",
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
    variedTask: "Un compito di richiamo diverso sullo stesso focus della lezione.",
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
  baseReferencePage: {
    unknownReferenceTitle: "Riferimento non trovato",
    unknownReferenceBody:
      "Questo riferimento non esiste. Torna al percorso e riprova dal collegamento della lezione.",
    invalidThroughLessonTitle: "Collegamento non valido",
    invalidThroughLessonBody:
      "Il collegamento a questo riferimento indicava una lezione non riconosciuta, quindi non è stato mostrato nulla. Apri il riferimento da una lezione del percorso Base.",
    unavailableTitle: "Questo riferimento non è disponibile",
    unavailableBody:
      "Non è stato possibile preparare questo riferimento ora. Non è stato mostrato nulla, così non vedi mai una tabella incompleta.",
    tableViewLabel: "Vista tabella",
    cardsViewLabel: "Vista schede",
    whenToUseLabel: "Quando si usa",
  },
  baseDiagnostic: {
    heading: "Da dove iniziare?",
    intro:
      "Rispondi ad alcune domande veloci per scoprire da dove conviene iniziare. È facoltativo: puoi saltarlo e scegliere il livello quando vuoi dalla mappa del percorso.",
    dimensions: {
      "mora-timing": "Riesci già a leggere hiragana e katakana con un ritmo regolare, mora per mora?",
      "sentence-anatomy": "Riesci già a riconoscere tema, verbo e complementi in una frase semplice?",
      "particle-sense":
        "Conosci già il significato delle particelle di base (wa, o, ni, de, to)?",
      "polite-verb-form": "Riesci già a costruire la forma cortese -masu di un verbo?",
    },
    yes: "Sì",
    no: "No",
    skip: "Salta",
    submit: "Vedi il consiglio",
    skippedNotice:
      "Nessun problema: puoi scegliere il livello quando vuoi dalla mappa del percorso.",
    continueToCourse: "Vai alla mappa del percorso",
    resultHeading: "Ecco da dove iniziare",
    resultBody: (recommendedLevel) =>
      recommendedLevel === "a0"
        ? "Ti consigliamo di iniziare dal corso Base, per costruire prima queste fondamenta."
        : "Conosci già le fondamenta Base: puoi iniziare direttamente da A1.",
    goToRecommendation: "Vai alla lezione consigliata",
  },
} satisfies Pick<CourseCopy, "home" | "progressMutation" | "canDoSummary" | "checkpoint" | "courseLevels" | "kanji" | "lesson" | "a1Lesson" | "baseLesson" | "practice" | "exercises" | "review" | "spokenAttempt" | "foundation" | "progressMigration" | "baseReferencePage" | "baseDiagnostic">;

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

const itCourseAreas: CourseCopy["courseAreas"] = {
  sounds: {
    title: "Suoni",
    description: "Impara le basi dei suoni e dei kana.",
  },
  foundations: {
    title: "Fondamentali",
    description:
      "Costruisci la struttura della frase, riferimenti naturali, verbi cortesi, particelle e forme temporali di base prima della pratica negli scenari.",
  },
  situations: {
    title: "Situazioni quotidiane",
    description:
      "Applica le basi in conversazioni, routine, luoghi, persone, acquisti e bisogni.",
  },
  synthesis: {
    title: "Sintesi",
    description: "Combina ciò che conosci in dialoghi guidati.",
  },
};

function retainedA1Copy<T>(
  source: Readonly<Record<string, T>>,
  keys: readonly string[],
): Record<string, T> {
  return Object.fromEntries(keys.map((key) => [key, source[key]!]));
}

const itRetainedA1Modules = courseModulesByLevel.a1;
const itRetainedA1ModuleCopy = retainedA1Copy(
  a1RuntimeModuleCopy("it"),
  itRetainedA1Modules.map((module) => module.id),
);
const itRetainedA1LessonCopy = retainedA1Copy(
  a1RuntimeLessonCopy("it"),
  itRetainedA1Modules.flatMap((module) => module.lessons.map((lesson) => lesson.titleCopyId)),
);
const itRetainedA1ObjectiveCopy = retainedA1Copy(
  a1RuntimeObjectiveCopy("it"),
  itRetainedA1Modules.flatMap((module) =>
    module.lessons.flatMap((lesson) => lesson.objectiveCopyIds),
  ),
);
const itRetainedA1OutcomeCopy = retainedA1Copy(
  a1RuntimeOutcomeCopy("it"),
  itRetainedA1Modules.flatMap((module) => module.outcomeCopyIds),
);

export const it = {
  ...itUi,
  courseMap: itCourseMap,
  courseAreas: itCourseAreas,
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
  // Base deliberately wins only for the reviewed stable rehomes; the merge
  // helper throws for every other navigation-copy collision.
  modules: mergeBaseNavigationDictionary(
    "modules",
    itRetainedA1ModuleCopy,
    a2RuntimeModuleCopy("it"),
    baseNavigationCopyIt.modules,
  ),
  lessons: mergeBaseNavigationDictionary(
    "lessons",
    itRetainedA1LessonCopy,
    a2RuntimeLessonCopy("it"),
    baseNavigationCopyIt.lessons,
  ),
  objectives: mergeBaseNavigationDictionary(
    "objectives",
    itRetainedA1ObjectiveCopy,
    a2RuntimeObjectiveCopy("it"),
    baseNavigationCopyIt.objectives,
  ),
  outcomes: mergeBaseNavigationDictionary(
    "outcomes",
    itRetainedA1OutcomeCopy,
    a2RuntimeOutcomeCopy("it"),
    baseNavigationCopyIt.outcomes,
  ),
  baseContent: { ...baseNavigationCopyIt.content },
  blocks: assembledCourseCopy.it.blocks,
  examples: assembledCourseCopy.it.examples,
  journeyScenes: {} as CourseCopy["journeyScenes"],
  phonetics: a1RuntimePhoneticCopy("it"),
  kanjiMeanings: a2RuntimeKanjiMeaningCopy("it"),
} satisfies CourseCopy;

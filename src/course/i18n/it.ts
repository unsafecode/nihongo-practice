import type { CourseCopy } from "./types";

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
  },
} satisfies Pick<CourseCopy, "home" | "lesson" | "practice">;

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
  stateCurrent: "Sei qui",
  stateRecommended: "Consigliato",
  stateVisited: "Visitato",
  expandLabel: (moduleTitle: string) => `Espandi le lezioni di ${moduleTitle}`,
  collapseLabel: (moduleTitle: string) => `Comprimi le lezioni di ${moduleTitle}`,
  revisitTitle: "Hai visitato tutte le lezioni",
  revisitBody:
    "Puoi rivedere qualunque lezione quando vuoi: non c'è un traguardo finale da raggiungere.",
};

const itModules: CourseCopy["modules"] = {
  sounds: { title: "Suoni e hiragana" },
  "sentence-map": { title: "La mappa della frase" },
  actions: { title: "Azioni e oggetti" },
  time: { title: "Quando succede?" },
  places: { title: "Luoghi e movimento" },
  people: { title: "Persone, desideri e inviti" },
  "questions-existence": { title: "Domande, richieste e ciò che esiste" },
  capstone: { title: "Sintesi finale: verbi ed eccezioni" },
};

const itOutcomes: CourseCopy["outcomes"] = {
  sounds: "Leggi e ascolta i segni che userai in tutto il percorso.",
  "sentence-map": "Vedi dove vanno tema, dettagli e verbo.",
  actions: "Collega l'oggetto dell'azione al verbo con を.",
  time: "Cambia tempo e passa dall'affermativo al negativo senza perdere la struttura.",
  places: "Distingui dove agisci, dove vai e come ti muovi.",
  people: "Collega persone, desideri e proposte.",
  "questions-existence":
    "Fai domande con か, formula richieste con ください, di' che qualcosa o qualcuno c'è e riconosci le letture speciali di は・へ・を come particelle.",
  capstone: "Riconosci かえる come godan: る non basta per capire il gruppo di un verbo.",
};

const itLessons: CourseCopy["lessons"] = {
  "sounds-core": { title: "I cinque suoni di base" },
  "sounds-special": { title: "Piccoli segni, grandi differenze" },
  "sentence-order": { title: "Il verbo chiude la frase" },
  "sentence-omission": { title: "Di chi stiamo parlando?" },
  "actions-object": { title: "Che cosa riceve l'azione?" },
  "actions-masu": { title: "La base resta, la coda cambia" },
  "time-past": { title: "Oggi o ieri?" },
  "time-negative": { title: "Quando non succede" },
  "places-action": { title: "Dove avviene?" },
  "places-movement": { title: "Meta, mezzo o veicolo?" },
  "people-particles": { title: "La particella dipende dal verbo" },
  "people-desire": { title: "Voglio… Facciamo…?" },
  "travel-questions": { title: "Chiedere con cortesia" },
  "travel-existence": { title: "C'è qualcosa o qualcuno?" },
  "traps-particles": { title: "Si scrive così, si legge diversamente" },
  "traps-verbs": { title: "る non basta per riconoscere il gruppo" },
};

const itObjectives: CourseCopy["objectives"] = {
  "sounds-core": "Parti dalle vocali: restano riconoscibili in ogni riga.",
  "sounds-special": "っ e le vocali lunghe cambiano ritmo e significato.",
  "sentence-order": "I dettagli arrivano prima; l'azione principale arriva alla fine.",
  "sentence-omission": "は introduce il tema; ciò che è ovvio può sparire.",
  "actions-object": "を viene dopo l'oggetto diretto.",
  "actions-masu": "ます crea una forma cortese e riutilizzabile.",
  "time-past": "ます e ました mostrano se l'azione è conclusa.",
  "time-negative": "ません e ませんでした negano senza cambiare la base.",
  "places-action": "で marca il luogo in cui si svolge l'azione.",
  "places-movement": "に e で segnano ruoli diversi secondo ciò che vuoi dire.",
  "people-particles": "Incontri qualcuno con に, aspetti qualcuno con を.",
  "people-desire": "たいです esprime desiderio; ましょう propone.",
  "travel-questions": "か trasforma la frase in domanda; ください serve per fare una richiesta.",
  "travel-existence": "あります si usa per cose; います per persone e animali.",
  "traps-particles": "Come particelle, は・へ・を hanno pronunce speciali.",
  "traps-verbs": "かえる è godan; il futuro resta implicito.",
};

const itBlocks: CourseCopy["blocks"] = {
  "sounds-core-rule": {
    title: "Cinque vocali stabili",
    body: "Ogni riga combina una consonante con a・i・u・e・o.",
  },
  "sounds-core-comparison": {
    title: "Da vocale a sillaba",
    body: "Metti una consonante davanti alla vocale: あ diventa か.",
  },
  "sounds-core-explore": {
    title: "Esplora segni e suoni nel Sillabario",
    body: "Percorri i 46 segni di base e ascolta come cambiano con dakuten e handakuten.",
  },
  "sounds-core-recap": {
    title: "In sintesi",
    bullets: ["Ogni segno ha un ritmo breve", "Il rōmaji è un aiuto temporaneo", "Ascolta e ripeti"],
  },
  "sounds-special-rule": {
    title: "Il ritmo è scritto",
    body: "っ crea una pausa e raddoppia; una vocale lunga dura due tempi.",
  },
  "sounds-special-comparison": {
    title: "きて o きって?",
    body: "Il piccolo っ inserisce una pausa che cambia la parola.",
  },
  "sounds-special-explore": {
    title: "Cerca っ e i segni piccoli nel Sillabario",
    body: "Apri le sezioni speciali e confronta segni normali e piccoli.",
  },
  "sounds-special-recap": {
    title: "In sintesi",
    bullets: ["っ non si pronuncia da solo", "Una vocale lunga dura due battiti", "ん è una mora autonoma"],
  },
  "sentence-order-rule": {
    title: "I dettagli prima, il verbo alla fine",
    body: "Parti dall'azione e aggiungi ciò che serve davanti.",
  },
  "sentence-order-comparison": {
    title: "Aggiungi un riferimento di tempo",
    body: "Da “mangio il ramen” a “oggi mangio il ramen”: きょう apre la frase.",
  },
  "sentence-order-explore": {
    title: "Sposta il tempo in testa alla frase",
    body: "Confronta la frase con e senza きょう davanti.",
  },
  "sentence-order-recap": {
    title: "In sintesi",
    bullets: ["Il verbo tende a chiudere la frase", "Le particelle mostrano i ruoli", "L'ordine italiano non va copiato"],
  },
  "sentence-omission-rule": {
    title: "Ciò che è ovvio può sparire",
    body: "Se il contesto è chiaro, io, tu o lui/lei spesso non vengono detti.",
  },
  "sentence-omission-comparison": {
    title: "Con e senza tema",
    body: "わたしは può cadere quando il contesto è chiaro: resta りっちです.",
  },
  "sentence-omission-explore": {
    title: "Togli il tema esplicito",
    body: "Parti da わたしは…, poi osserva la frase senza tema.",
  },
  "sentence-omission-recap": {
    title: "In sintesi",
    bullets: ["は indica il tema", "です rende cortese la frase nominale", "Non aggiungere sempre わたし"],
  },
  "actions-object-rule": {
    title: "Nome + を + verbo",
    body: "を etichetta ciò su cui agisce il verbo.",
  },
  "actions-object-comparison": {
    title: "Aggiungi l'oggetto",
    body: "Da “mangio” a “mangio il ramen”: らーめん を precede il verbo.",
  },
  "actions-object-explore": {
    title: "Collega un oggetto al verbo",
    body: "Parti dal solo verbo e aggiungi らーめん を davanti.",
  },
  "actions-object-recap": {
    title: "In sintesi",
    bullets: ["を segue l'oggetto", "を si pronuncia o", "Il verbo resta in fondo"],
  },
  "actions-masu-rule": {
    title: "Base della forma in ます + desinenza",
    body: "La parte che precede ます si riusa nelle forme cortesi.",
  },
  "actions-masu-comparison": {
    title: "Dalla forma base a ます",
    body: "たべる diventa たべます: la base たべ resta, cambia la coda.",
  },
  "actions-masu-explore": {
    title: "Scambia la desinenza",
    body: "Confronta たべる e たべます tenendo la stessa base.",
  },
  "actions-masu-recap": {
    title: "In sintesi",
    bullets: ["ます è cortese", "La base dipende dal gruppo", "La desinenza è l'ingranaggio"],
  },
  "time-past-rule": {
    title: "ます → ました",
    body: "La base non cambia; ました indica azione conclusa.",
  },
  "time-past-comparison": {
    title: "Oggi o ieri?",
    body: "たべます diventa たべました quando l'azione è conclusa.",
  },
  "time-past-explore": {
    title: "Trasforma il tempo sulla lavagna",
    body: "Nel Laboratorio, passa da ます a ました e osserva la coda.",
  },
  "time-past-recap": {
    title: "In sintesi",
    bullets: ["ます è non-passato", "ました è passato", "Il futuro usa ancora ます"],
  },
  "time-negative-rule": {
    title: "ません e ませんでした",
    body: "La negazione vive nella desinenza.",
  },
  "time-negative-comparison": {
    title: "Affermo o nego?",
    body: "たべます diventa たべません senza toccare la base.",
  },
  "time-negative-explore": {
    title: "Accendi e spegni l'azione",
    body: "Nel Laboratorio, confronta affermativo e negativo.",
  },
  "time-negative-recap": {
    title: "In sintesi",
    bullets: ["ません nega il non-passato", "ませんでした nega il passato", "La base resta riconoscibile"],
  },
  "places-action-rule": {
    title: "Luogo + で",
    body: "で dice dove si svolge l'azione.",
  },
  "places-action-comparison": {
    title: "Aggiungi il luogo",
    body: "Da “mangio il ramen” a “mangio il ramen al ristorante”: れすとらん で.",
  },
  "places-action-explore": {
    title: "Aggiungi e togli il luogo",
    body: "Nel Laboratorio, inserisci un luogo con で e confronta.",
  },
  "places-action-recap": {
    title: "In sintesi",
    bullets: ["で = luogo dell'azione", "Non usare に per questa funzione", "Il luogo precede l'oggetto"],
  },
  "places-movement-rule": {
    title: "に per la meta, で per il mezzo",
    body: "Per indicare la direzione incontrerai anche へ, pronunciata e.",
  },
  "places-movement-comparison": {
    title: "Meta o mezzo?",
    body: "Da “vado alla stazione” a “vado in treno”: でんしゃ で indica il mezzo.",
  },
  "places-movement-explore": {
    title: "Costruisci un viaggio",
    body: "Nel Laboratorio, scegli meta e mezzo separatamente.",
  },
  "places-movement-recap": {
    title: "In sintesi",
    bullets: ["えきに = verso la stazione", "でんしゃで = in treno", "でんしゃにのる = salire sul treno"],
  },
  "people-particles-rule": {
    title: "Il verbo sceglie il collegamento",
    body: "あう usa に; まつ usa を.",
  },
  "people-particles-comparison": {
    title: "Aspetto o incontro?",
    body: "Da ともだち を まつ a ともだち に あう: cambiano particella e verbo.",
  },
  "people-particles-explore": {
    title: "Scambia verbo e particella",
    body: "Confronta “aspettare un amico” e “incontrare un amico”.",
  },
  "people-particles-recap": {
    title: "In sintesi",
    bullets: ["ともだちにあう", "ともだちをまつ", "Impara verbo + particella insieme"],
  },
  "people-desire-rule": {
    title: "Base + たいです",
    body: "たいです esprime il desiderio personale di fare qualcosa.",
  },
  "people-desire-comparison": {
    title: "Mangio o voglio mangiare?",
    body: "たべます diventa たべたいです per esprimere il desiderio.",
  },
  "people-desire-explore": {
    title: "Cambia intenzione sulla lavagna",
    body: "Nel Laboratorio, passa da “mangio” a “voglio mangiare”.",
  },
  "people-desire-recap": {
    title: "In sintesi",
    bullets: ["たいです = desiderio personale", "Si aggancia alla base ます", "Non è un tempo verbale"],
  },
  "travel-questions-rule": {
    title: "か chiude la domanda",
    body: "か alla fine trasforma un'affermazione in domanda cortese.",
  },
  "travel-questions-comparison": {
    title: "Manca solo か",
    body: "えきは どこです diventa una domanda cortese aggiungendo か.",
  },
  "travel-questions-explore": {
    title: "Aggiungi か in fondo",
    body: "Confronta la frase con e senza か finale.",
  },
  "travel-questions-recap": {
    title: "In sintesi",
    bullets: ["か crea la domanda", "です か = domanda cortese", "Serve spesso in viaggio"],
  },
  "travel-existence-rule": {
    title: "あります per cose; います per esseri animati",
    body: "Entrambi significano “esserci”, ma la scelta dipende da ciò che esiste.",
  },
  "travel-existence-comparison": {
    title: "Cosa o persona?",
    body: "といれ が あります (cosa) diventa せんせい が います (persona).",
  },
  "travel-existence-explore": {
    title: "Scambia cosa e persona",
    body: "Confronta “c'è un bagno” e “c'è un insegnante”.",
  },
  "travel-existence-recap": {
    title: "In sintesi",
    bullets: ["cose = あります", "persone/animali = います", "が marca ciò che esiste"],
  },
  "traps-particles-rule": {
    title: "Come particella, へ si legge e",
    body: "Per indicare la direzione, へ accompagna la meta e si pronuncia e.",
  },
  "traps-particles-comparison": {
    title: "に o へ?",
    body: "えきに いきます diventa えきへ いきます: へ segna la direzione.",
  },
  "traps-particles-explore": {
    title: "Scambia に e へ",
    body: "Confronta la meta con に e con へ.",
  },
  "traps-particles-recap": {
    title: "In sintesi",
    bullets: ["Come particella, へ si legge e", "へ segna la direzione", "に e へ possono alternarsi verso una meta"],
  },
  "traps-verbs-rule": {
    title: "かえる è godan",
    body: "Finire in る non basta: qui la base è かえり.",
  },
  "traps-verbs-comparison": {
    title: "Aggiungi quando",
    body: "かえります diventa あした かえります aggiungendo il riferimento di tempo.",
  },
  "traps-verbs-explore": {
    title: "Aggiungi あした",
    body: "Confronta la frase con e senza あした davanti.",
  },
  "traps-verbs-recap": {
    title: "In sintesi",
    bullets: ["かえる→かえります", "Il gruppo va imparato insieme al verbo", "Il futuro è espresso dal contesto"],
  },
};

const itExamples: CourseCopy["examples"] = {
  vowels: { translation: "a · i · u · e · o" },
  "k-row": { translation: "ka · ki · ku · ke · ko" },
  "small-tsu": { translation: "scuola" },
  "long-vowel": { translation: "oggi" },
  "sentence-order": { translation: "Oggi mangio il ramen." },
  "topic-copula": { translation: "Sono Ricchi." },
  "omitted-subject": { translation: "Sono Ricchi." },
  "this-water": { translation: "Questa è dell'acqua." },
  "eat-ramen": { translation: "Mangio il ramen." },
  "drink-water": { translation: "Bevo dell'acqua." },
  "eat-sushi": { translation: "Mangio il sushi." },
  "speak-english": { translation: "Parlo inglese." },
  "today-eat": { translation: "Oggi mangio il ramen." },
  "tomorrow-eat": { translation: "Domani mangerò il ramen." },
  "yesterday-ate": { translation: "Ieri ho mangiato il ramen." },
  "today-not-eat": { translation: "Oggi non mangio il ramen." },
  "yesterday-not-eat": { translation: "Ieri non ho mangiato il ramen." },
  "restaurant-eat": { translation: "Mangio il ramen al ristorante." },
  "home-drink": { translation: "Bevo il tè a casa." },
  "go-station": { translation: "Vado alla stazione." },
  "go-by-train": { translation: "Vado in treno." },
  "board-train": { translation: "Salgo sul treno." },
  "meet-friend": { translation: "Incontro un amico." },
  "wait-friend": { translation: "Aspetto un amico." },
  "want-sushi": { translation: "Voglio mangiare il sushi." },
  "lets-go": { translation: "Andiamo alla stazione." },
  "where-station": { translation: "Dov'è la stazione?" },
  "where-hotel": { translation: "Dov'è l'hotel?" },
  "where-shop": { translation: "Dov'è il negozio?" },
  "water-please": { translation: "Dell'acqua, per favore." },
  "menu-please": { translation: "Il menù, per favore." },
  "restroom-exists": { translation: "C'è un bagno." },
  "teacher-exists": { translation: "C'è un insegnante." },
  "particle-wa": { translation: "Buongiorno." },
  "particle-e": { translation: "Vado verso la stazione." },
  "return-godan": { translation: "Torno a casa." },
  "tomorrow-return": { translation: "Domani tornerò a casa." },
  "vowel-a": { translation: "a" },
  "syllable-ka": { translation: "ka" },
  "kana-kite": { translation: "vieni" },
  "kana-kitte": { translation: "francobollo" },
  "eat-dict": { translation: "mangiare" },
  "eat-masu": { translation: "Mangio." },
  "today-ate": { translation: "Oggi ho mangiato il ramen." },
  "station-copula": { translation: "La stazione, dov'è" },
};

export const it = {
  ...itUi,
  courseMap: itCourseMap,
  modules: itModules,
  lessons: itLessons,
  objectives: itObjectives,
  outcomes: itOutcomes,
  blocks: itBlocks,
  examples: itExamples,
} satisfies CourseCopy;

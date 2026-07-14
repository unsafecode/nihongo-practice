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
  "questions-existence": { title: "Domande, esistenza e direzione" },
  capstone: { title: "Sintesi: una giornata in viaggio" },
};

const itOutcomes: CourseCopy["outcomes"] = {
  sounds: "Leggi e ascolta i segni che userai in tutto il percorso.",
  "sentence-map": "Riconosci il tema con は e chiudi la frase con です.",
  actions: "Collega l'oggetto al verbo con を e chiedi qualcosa con ください.",
  time: "Cambia tempo e passa dall'affermativo al negativo senza perdere la struttura.",
  places: "Distingui dove agisci con で e dove vai con に.",
  people: "Collega persone con と e に, esprimi desideri e fai proposte.",
  "questions-existence":
    "Fai domande con か, di' che qualcosa o qualcuno c'è con あります・います e segna la direzione con へ.",
  capstone: "Ricombina tempo, luogo, persone e azioni in un'unica frase di viaggio.",
};

const itLessons: CourseCopy["lessons"] = {
  "sounds-core": { title: "I cinque suoni di base" },
  "sounds-special": { title: "Piccoli segni, grandi differenze" },
  "sentence-order": { title: "Questo è… (これは…です)" },
  "sentence-omission": { title: "Di chi stiamo parlando?" },
  "actions-object": { title: "Che cosa riceve l'azione?" },
  "actions-masu": { title: "Chiedere con ください" },
  "time-past": { title: "Oggi o ieri?" },
  "time-negative": { title: "Quando non succede" },
  "places-action": { title: "Dove avviene?" },
  "places-movement": { title: "Dove vai? La meta con に" },
  "people-particles": { title: "Con chi fai qualcosa?" },
  "people-desire": { title: "Voglio… Facciamo…?" },
  "travel-questions": { title: "Chiedere con cortesia" },
  "travel-existence": { title: "C'è qualcosa o qualcuno?" },
  "traps-particles": { title: "Si scrive così, si legge diversamente" },
  "traps-verbs": { title: "Una giornata in viaggio" },
};

const itObjectives: CourseCopy["objectives"] = {
  "sounds-core": "Parti dalle vocali: restano riconoscibili in ogni riga.",
  "sounds-special": "っ e le vocali lunghe cambiano ritmo e significato.",
  "sentence-order": "これは introduce il tema con は; です chiude la frase nominale.",
  "sentence-omission": "は introduce il tema; ciò che è ovvio può sparire.",
  "actions-object": "を viene dopo l'oggetto diretto.",
  "actions-masu": "ください trasforma la frase in una richiesta cortese.",
  "time-past": "ます è non-passato; ました indica che l'azione è conclusa.",
  "time-negative": "ません e ませんでした negano senza cambiare la base.",
  "places-action": "で marca il luogo in cui si svolge l'azione.",
  "places-movement": "に segna la meta verso cui ti muovi.",
  "people-particles": "に segna la persona che incontri; と segna con chi lo fai.",
  "people-desire":
    "たいです esprime un desiderio; ましょう propone («facciamo…»), ましょうか offre o chiede in modo tentativo («facciamo…? / vuoi che…?»).",
  "travel-questions": "か alla fine trasforma un'affermazione in domanda cortese.",
  "travel-existence": "あります si usa per cose; います per persone e animali.",
  "traps-particles": "Come particella di direzione, へ si scrive he ma si legge e.",
  "traps-verbs": "Combina で, と, を e ます in un'unica frase di viaggio.",
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
    title: "Tema + は + です",
    body: "これは segna il tema; です chiude la frase in modo cortese. Si scrive tutto unito: これはみずです.",
  },
  "sentence-order-comparison": {
    title: "Aggiungi il tema",
    body: "Da みずです a これはみずです: これは dice di che cosa parli.",
  },
  "sentence-order-explore": {
    title: "Aggiungi これは davanti",
    body: "Confronta la frase con e senza これは davanti.",
  },
  "sentence-order-recap": {
    title: "In sintesi",
    bullets: ["これは introduce il tema con は", "です rende cortese la frase nominale", "これはみずです si scrive senza spazi"],
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
    body: "Da たべます a ラーメンをたべます: ラーメンを precede il verbo.",
  },
  "actions-object-explore": {
    title: "Collega un oggetto al verbo",
    body: "Parti da たべます e aggiungi ラーメンを davanti.",
  },
  "actions-object-recap": {
    title: "In sintesi",
    bullets: ["を segue l'oggetto", "を si pronuncia o", "Il verbo resta in fondo"],
  },
  "actions-masu-rule": {
    title: "Oggetto + を + ください",
    body: "ください chiede qualcosa con cortesia: ラーメンをください.",
  },
  "actions-masu-comparison": {
    title: "Mangiare o ordinare?",
    body: "Da ラーメンをたべます a ラーメンをください: ください fa la richiesta.",
  },
  "actions-masu-explore": {
    title: "Trasforma in richiesta",
    body: "Parti da みず e aggiungi をください per chiedere: みずをください.",
  },
  "actions-masu-recap": {
    title: "In sintesi",
    bullets: ["ください = richiesta cortese", "を marca ciò che chiedi", "Utile per ordinare in viaggio"],
  },
  "time-past-rule": {
    title: "ます → ました",
    body: "La base non cambia; ました indica azione conclusa.",
  },
  "time-past-comparison": {
    title: "Non-passato o passato?",
    body: "たべます diventa たべました quando l'azione è conclusa.",
  },
  "time-past-explore": {
    title: "Trasforma il tempo sulla lavagna",
    body: "Nel Laboratorio, passa da ます a ました e osserva la coda.",
  },
  "time-past-recap": {
    title: "In sintesi",
    bullets: ["ます è non-passato", "ました è passato", "Il futuro si deduce dal contesto e dalle parole di tempo"],
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
    body: "Da “mangio il ramen” a “mangio il ramen al ristorante”: レストランで.",
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
    title: "Meta + に + verbo di movimento",
    body: "に segna il luogo verso cui ti muovi: えきにいきます.",
  },
  "places-movement-comparison": {
    title: "Aggiungi la meta",
    body: "Da いきます a えきにいきます: えきに indica dove vai.",
  },
  "places-movement-explore": {
    title: "Aggiungi えきに davanti",
    body: "Parti da いきます e aggiungi えきに per dire dove vai.",
  },
  "places-movement-recap": {
    title: "In sintesi",
    bullets: ["えきに = verso la stazione", "に segna la meta del movimento", "いきます = vado"],
  },
  "people-particles-rule": {
    title: "に per la persona, と per la compagnia",
    body: "せんせいにあいます: に segna chi incontri. ともだちと…: と segna con chi.",
  },
  "people-particles-comparison": {
    title: "Aggiungi la compagnia",
    body: "Da せんせいにあいます a ともだちとせんせいにあいます: ともだちと dice con chi.",
  },
  "people-particles-explore": {
    title: "Aggiungi ともだちと davanti",
    body: "Parti da せんせいにあいます e aggiungi ともだちと per dire con chi.",
  },
  "people-particles-recap": {
    title: "In sintesi",
    bullets: ["に segna la persona che incontri", "と segna con chi fai qualcosa", "せんせいにあいます / ともだちとあいます"],
  },
  "people-desire-rule": {
    title: "Base + たいです",
    body: "たいです esprime il desiderio di fare qualcosa: たべたいです.",
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
    bullets: [
      "たいです = «voglio…»",
      "いきましょう = proposta («andiamo»)",
      "いきましょうか = offerta tentativa («andiamo? / vuoi che andiamo?»)",
    ],
  },
  "travel-questions-rule": {
    title: "か chiude la domanda",
    body: "か alla fine trasforma un'affermazione in domanda cortese.",
  },
  "travel-questions-comparison": {
    title: "Manca solo か",
    body: "えきはどこです diventa えきはどこですか aggiungendo か.",
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
    body: "トイレがあります (cosa) diventa せんせいがいます (persona).",
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
    body: "えきにいきます diventa えきへいきます: へ segna la direzione.",
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
    title: "Ricombina gli ingranaggi",
    body: "Nessuna nuova grammatica: metti in fila tempo, luogo, persone, oggetto e verbo.",
  },
  "traps-verbs-comparison": {
    title: "Ricombina gli ingranaggi",
    body: "Da らーめんをたべます a あしたれすとらんでともだちとらーめんをたべます: entrano in gioco あした (quando), で (dove) e と (con chi).",
  },
  "traps-verbs-explore": {
    title: "Costruisci la giornata",
    body: "Parti da らーめんをたべます e aggiungi quando, dove e con chi.",
  },
  "traps-verbs-recap": {
    title: "In sintesi",
    bullets: [
      "Una frase può unire più ingranaggi",
      "Ordine: tempo → luogo → persone → oggetto → verbo",
      "Riusi ciò che sai, senza nuova grammatica",
    ],
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
  "this-water": { translation: "Questa è acqua." },
  "it-is-water": { translation: "È acqua." },
  "this-is-water": { translation: "Questa è acqua." },
  water: { translation: "Acqua." },
  "order-ramen-eat": { translation: "Mangio il ramen." },
  "order-ramen-please": { translation: "Un ramen, per favore." },
  "go-bare": { translation: "Vado." },
  "meet-teacher": { translation: "Incontro l'insegnante." },
  "meet-with-friend": { translation: "Incontro l'insegnante con un amico." },
  "travel-day": { translation: "Domani mangio il ramen al ristorante con un amico." },
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

import type { CourseCopy } from "./types";

const itUi = {
  home: {
    eyebrow: "Percorso guidato",
    title: "Costruisci il giapponese, un ingranaggio alla volta.",
    lead: "Parti dai suoni, impara a vedere i ruoli nella frase e arriva agli schemi più utili in viaggio.",
    continue: "Continua",
    allVisited: "Tutto visitato",
    start: "Inizia",
    review: "Ripassa",
    reset: "Azzera i progressi",
    resetConfirm: "Vuoi davvero azzerare i progressi del percorso?",
    corruptProgress: "I progressi del percorso erano illeggibili e sono stati azzerati. Lingua e scrittura non sono cambiate.",
    dismiss: "Chiudi",
    invalidRoute: (path: string) => `La pagina “${path}” non esiste. Sei tornato al percorso.`,
    lessonsProgress: (visited: number, total: number) =>
      `${visited} di ${total} lezioni`,
  },
  lesson: {
    back: "Tutti i moduli",
    modulePosition: (current: number, total: number) =>
      `Modulo ${current} di ${total}`,
    previous: "Lezione precedente",
    next: "Lezione successiva",
    listen: "Ascolta",
    playing: "In riproduzione…",
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
  "sounds-core-examples": {
    title: "Leggi per colonne",
    body: "Ascolta senza imporre il ritmo dell'italiano.",
  },
  "sounds-core-tool": {
    title: "Esplora segni base e suoni modificati",
    body: "Percorri i 46 segni, poi confronta dakuten e handakuten nel Sillabario.",
  },
  "sounds-core-summary": {
    title: "Ricorda",
    bullets: ["Ogni segno ha un ritmo breve", "Il rōmaji è un aiuto temporaneo", "Ascolta e ripeti"],
  },
  "sounds-special-rule": {
    title: "Il ritmo è scritto",
    body: "っ crea una pausa e raddoppia; una vocale lunga dura due tempi.",
  },
  "sounds-special-examples": {
    title: "Confronta durata e pausa",
    body: "Non saltare i piccoli segni.",
  },
  "sounds-special-tool": {
    title: "Cerca っ, ゃ, ゅ, ょ",
    body: "Usa le sezioni speciali del Sillabario.",
  },
  "sounds-special-summary": {
    title: "Ricorda",
    bullets: ["っ non si pronuncia da solo", "Una vocale lunga dura due battiti", "ん è una mora autonoma"],
  },
  "sentence-order-rule": {
    title: "I dettagli prima, il verbo alla fine",
    body: "Parti dall'azione e aggiungi ciò che serve davanti.",
  },
  "sentence-order-examples": {
    title: "Segui il percorso",
    body: "Tempo → oggetto → verbo.",
  },
  "sentence-order-topic": {
    title: "は mette il tema sul tavolo",
    body: "Non tradurre は parola per parola; quando è particella, si pronuncia wa.",
  },
  "sentence-order-tool": {
    title: "Apri la prima lavagna",
    body: "Osserva come tempo, oggetto e verbo occupano posizioni diverse.",
  },
  "sentence-order-summary": {
    title: "Ricorda",
    bullets: ["Il verbo tende a chiudere la frase", "Le particelle mostrano i ruoli", "L'ordine italiano non va copiato"],
  },
  "sentence-omission-rule": {
    title: "Ciò che è ovvio può sparire",
    body: "Se il contesto è chiaro, io, tu o lui/lei spesso non vengono detti.",
  },
  "sentence-omission-examples": {
    title: "Con e senza tema",
    body: "りっちです può bastare dopo “come ti chiami?”.",
  },
  "sentence-omission-summary": {
    title: "Ricorda",
    bullets: ["は indica il tema", "です rende cortese la frase nominale", "Non aggiungere sempre わたし"],
  },
  "actions-object-rule": {
    title: "Nome + を + verbo",
    body: "を etichetta ciò su cui agisce il verbo.",
  },
  "actions-object-examples": {
    title: "Stessa struttura, azioni diverse",
    body: "Cambiano nome e verbo; を mantiene il ruolo.",
  },
  "actions-object-tool": {
    title: "Muovi l'oggetto sulla lavagna",
    body: "Parti da “mangiare”, poi cambia scenario: bere, comprare, guardare o parlare.",
  },
  "actions-object-summary": {
    title: "Ricorda",
    bullets: ["を segue l'oggetto", "を si pronuncia o", "Il verbo resta in fondo"],
  },
  "actions-masu-rule": {
    title: "Base della forma in ます + desinenza",
    body: "La parte che precede ます si riusa nelle forme cortesi.",
  },
  "actions-masu-examples": {
    title: "Trova la base",
    body: "たべ・はなし restano visibili.",
  },
  "actions-masu-tool": {
    title: "Cambia verbo, conserva la forma",
    body: "Confronta parlare e mangiare.",
  },
  "actions-masu-summary": {
    title: "Ricorda",
    bullets: ["ます è cortese", "La base dipende dal gruppo", "La desinenza è l'ingranaggio"],
  },
  "time-past-rule": {
    title: "ます → ました",
    body: "La base non cambia; ました indica azione conclusa.",
  },
  "time-past-examples": {
    title: "Oggi e ieri",
    body: "L'avverbio e la desinenza devono raccontare lo stesso tempo.",
  },
  "time-past-tool": {
    title: "Trasforma la frase",
    body: "Passa da oggi a ieri e osserva la coda.",
  },
  "time-past-summary": {
    title: "Ricorda",
    bullets: ["ます è non-passato", "ました è passato", "Il futuro usa ancora ます"],
  },
  "time-negative-rule": {
    title: "ません e ませんでした",
    body: "La negazione vive nella desinenza.",
  },
  "time-negative-examples": {
    title: "Non ora, non ieri",
    body: "ません è non-passato; ませんでした è passato.",
  },
  "time-negative-tool": {
    title: "Accendi e spegni l'azione",
    body: "Confronta affermativo e negativo.",
  },
  "time-negative-summary": {
    title: "Ricorda",
    bullets: ["ません nega il non-passato", "ませんでした nega il passato", "La base resta riconoscibile"],
  },
  "places-action-rule": {
    title: "Luogo + で",
    body: "で dice dove si svolge l'azione.",
  },
  "places-action-examples": {
    title: "Ristorante o casa",
    body: "Il luogo cambia, l'azione resta.",
  },
  "places-action-tool": {
    title: "Aggiungi e togli il luogo",
    body: "Il luogo è opzionale se il contesto è chiaro.",
  },
  "places-action-summary": {
    title: "Ricorda",
    bullets: ["で = luogo dell'azione", "Non usare に per questa funzione", "Il luogo precede l'oggetto"],
  },
  "places-movement-rule": {
    title: "に per la meta, で per il mezzo",
    body: "Con のる, il veicolo usa に perché è ciò su cui sali. Per indicare la direzione incontrerai anche へ, pronunciata e.",
  },
  "places-movement-examples": {
    title: "Tre ruoli, due particelle",
    body: "Meta, mezzo e veicolo non sono la stessa cosa.",
  },
  "places-movement-tool": {
    title: "Costruisci un viaggio",
    body: "Scegli meta e mezzo separatamente.",
  },
  "places-movement-summary": {
    title: "Ricorda",
    bullets: ["えきに = verso la stazione", "でんしゃで = in treno", "でんしゃにのる = salire sul treno"],
  },
  "people-particles-rule": {
    title: "Il verbo sceglie il collegamento",
    body: "あう usa に; まつ usa を.",
  },
  "people-particles-examples": {
    title: "Incontrare e aspettare",
    body: "Non scegliere la particella traducendo “persona”.",
  },
  "people-particles-tool": {
    title: "Cambia persona",
    body: "Prova amico, insegnante e famiglia.",
  },
  "people-particles-summary": {
    title: "Ricorda",
    bullets: ["ともだちにあう", "ともだちをまつ", "Impara verbo + particella insieme"],
  },
  "people-desire-rule": {
    title: "Base + たいです; base + ましょう",
    body: "Una forma esprime desiderio, l'altra propone un'azione condivisa.",
  },
  "people-desire-examples": {
    title: "Voglio o facciamo?",
    body: "Guarda chi compie l'azione.",
  },
  "people-desire-tool": {
    title: "Cambia intenzione",
    body: "Passa da mangio a voglio mangiare.",
  },
  "people-desire-summary": {
    title: "Ricorda",
    bullets: ["たいです = desiderio personale", "ましょう = proposta", "Non sono tempi verbali"],
  },
  "travel-questions-rule": {
    title: "か chiude la domanda; ください formula una richiesta",
    body: "Sono schemi fissi molto utili in viaggio.",
  },
  "travel-questions-examples": {
    title: "Dove? Per favore.",
    body: "Ascolta l'intonazione ma riconosci anche la struttura.",
  },
  "travel-questions-tool": {
    title: "Porta lo schema alla stazione",
    body: "Apri una frase di movimento e osserva la destinazione con に.",
  },
  "travel-questions-summary": {
    title: "Ricorda",
    bullets: ["ですか = domanda cortese", "〜をください = vorrei…", "Evita di tradurre ogni parola"],
  },
  "travel-existence-rule": {
    title: "あります per cose; います per esseri animati",
    body: "Entrambi significano “esserci/esistere”, ma la scelta dipende da ciò che esiste.",
  },
  "travel-existence-examples": {
    title: "Bagno o insegnante?",
    body: "Una cosa usa あります; una persona usa います.",
  },
  "travel-existence-summary": {
    title: "Ricorda",
    bullets: ["cose = あります", "persone/animali = います", "が marca ciò che esiste"],
  },
  "traps-particles-rule": {
    title: "は→wa, へ→e, を→o",
    body: "Queste letture speciali compaiono quando i segni sono particelle.",
  },
  "traps-particles-examples": {
    title: "Leggi il ruolo, non solo il segno",
    body: "La stessa grafia può avere una lettura diversa fuori dalla particella.",
  },
  "traps-omission-callout": {
    title: "Il soggetto può restare sottinteso",
    body: "Se il contesto è chiaro, il giapponese non ripete io, tu o lui/lei: non aggiungere sempre わたし.",
  },
  "traps-existence-callout": {
    title: "Cose e persone non “esistono” allo stesso modo",
    body: "Usa あります per cose; usa います per persone e animali.",
  },
  "traps-loanwords-callout": {
    title: "Qui i prestiti restano in hiragana",
    body: "Per allenare la lettura, l'app mostra parole come れすとらん in hiragana; nel giapponese reale i prestiti si scrivono normalmente in katakana: レストラン.",
  },
  "traps-particles-summary": {
    title: "Ricorda",
    bullets: ["In こんにちは, は si legge wa", "Come particella, へ si legge e", "Come particella, を si legge o"],
  },
  "traps-verbs-rule": {
    title: "かえる è godan",
    body: "Finire in る non basta: qui la base è かえり.",
  },
  "traps-verbs-examples": {
    title: "Gruppo ed effetto del tempo",
    body: "あした cambia la traduzione, non la forma ます.",
  },
  "traps-verbs-tool": {
    title: "Verifica sulla lavagna",
    body: "Apri “Tornare” con domani.",
  },
  "traps-verbs-summary": {
    title: "Ricorda",
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
};

export const it = {
  ...itUi,
  modules: itModules,
  lessons: itLessons,
  objectives: itObjectives,
  outcomes: itOutcomes,
  blocks: itBlocks,
  examples: itExamples,
} satisfies CourseCopy;

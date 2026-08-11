import { deepFreeze } from "../../foundations/deepFreeze";
import type { BaseNavigationCopy } from "./en";

function semanticLessonCopy(
  lessonId: string,
  values: Readonly<{
    title: string;
    objective: string;
    main: string;
    construction: string;
    constraints: string;
    commonError: string;
    nearestContrast: string;
    recap: string;
    translations: readonly string[];
    purposes: readonly string[];
    instructions: readonly string[];
    accepted: string;
    retry: string;
  }>,
): Record<string, string> {
  return {
    [`${lessonId}-title`]: values.title,
    [`${lessonId}-objective`]: values.objective,
    [`${lessonId}-explanation-main`]: values.main,
    [`${lessonId}-explanation-construction`]: values.construction,
    [`${lessonId}-explanation-constraints`]: values.constraints,
    [`${lessonId}-explanation-common-error`]: values.commonError,
    [`${lessonId}-explanation-nearest-contrast`]: values.nearestContrast,
    [`${lessonId}-recap`]: values.recap,
    [`${lessonId}-feedback-accepted`]: values.accepted,
    [`${lessonId}-feedback-retry`]: values.retry,
    ...Object.fromEntries(
      values.translations.flatMap((translation, index) => [
        [`${lessonId}-example-${index + 1}-translation`, translation],
        [`${lessonId}-example-${index + 1}-purpose`, values.purposes[index]],
      ]),
    ),
    ...Object.fromEntries(
      values.instructions.map((instruction, index) => [
        `${lessonId}-activity-${index + 1}-instruction`,
        instruction,
      ]),
    ),
  };
}

const SENTENCE_ACTIVITY_INSTRUCTIONS_IT = [
  "Scegli il significato sostenuto dal contesto mostrato.",
  "Scegli la forma che svolge la funzione indicata.",
  "Metti i blocchi significativi nell'ordine richiesto.",
  "Completa la risposta con l'obiettivo guidato.",
  "Trasforma il materiale mostrato come richiesto.",
  "Scegli la diagnosi che individua l'errore reale.",
  "Costruisci la risposta adatta a questo breve contesto.",
  "Recupera il materiale precedente e completa la nuova risposta.",
  "Ascolta una volta e scegli la risposta corrispondente.",
  "Pronuncia la risposta richiesta senza leggere prima una soluzione.",
] as const;

const SENTENCE_FOUNDATIONS_COPY_IT: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("sentence-foundations-1", {
    title: "Blocchi significativi della frase",
    objective: "Riconoscere brevi blocchi nominali che possono svolgere un ruolo nella frase.",
    main:
      "Le frasi giapponesi si organizzano in blocchi significativi e il predicato è il blocco centrale finale. Questi primi elementi sono blocchi nominali, non l'affermazione che ogni nome isolato sia una frase completa.",
    construction:
      "Individua un'unità significativa, mantieni uniti i suoi suoni e trattala come un blocco che in seguito potrà precedere o far parte di un predicato.",
    constraints:
      "Soggetto grammaticale, tema discorsivo e informazione nuova focalizzata sono nozioni diverse. Questa lezione etichetta i blocchi senza assegnare tutti e tre i ruoli a un nome.",
    commonError:
      "Non tradurre l'ordine inglese parola per parola e non chiamare automaticamente soggetto il primo nome visibile.",
    nearestContrast:
      "Una voce lessicale nomina qualcosa; un blocco di frase è quella voce che funziona come unità in un enunciato preciso.",
    recap:
      "Recupera i significati di わたし, がくせい e せんせい, poi riconosci ciascuno come blocco nominale mobile.",
    translations: ["studente", "insegnante", "io; me", "gatto", "casa", "mare", "libro", "scuola", "fotografia", "biglietto"],
    purposes: [
      "Stabilisce un nome di categoria personale come blocco unico.",
      "Contrasta un titolo professionale con il blocco studente.",
      "Introduce il riferimento al parlante senza assegnare tema o soggetto.",
      "Riusa un nome animale noto come unità lessicale completa.",
      "Mantiene unito un nome di luogo familiare.",
      "Recupera un nome del modulo fonetico senza aggiungere grammatica.",
      "Tratta un oggetto concreto come unità.",
      "Mostra che una sequenza moraica lunga forma comunque un blocco.",
      "Recupera il nome noto di un oggetto visivo.",
      "Chiude l'insieme con un altro blocco nominale concreto.",
    ],
    instructions: SENTENCE_ACTIVITY_INSTRUCTIONS_IT,
    accepted: "La risposta conserva i blocchi significativi previsti.",
    retry: "Leggi ogni nome come unità; non dividerlo secondo le parole italiane.",
  }),
  ...semanticLessonCopy("sentence-foundations-2", {
    title: "Predicato finale e omissione recuperabile",
    objective: "Seguire un messaggio a predicato finale distinguendo ruoli grammaticali e discorsivi.",
    main:
      "Il predicato viene alla fine della proposizione. Il materiale già recuperabile dalla situazione può essere omesso, ma il giapponese ha comunque soggetti grammaticali quando la costruzione li richiede.",
    construction:
      "Stabilisci la persona o la cosa condivisa, colloca l'identificazione nel blocco predicativo finale e ometti solo ciò che l'interlocutore può recuperare con sicurezza.",
    constraints:
      "L'omissione dipende dal contesto, non da una regola secondo cui il giapponese sarebbe privo di soggetti. Tema, soggetto e focus possono coincidere, ma non significano la stessa cosa.",
    commonError:
      "Non inserire わたし in ogni risposta e non cancellare un soggetto necessario solo perché il giapponese omette spesso materiale recuperabile.",
    nearestContrast:
      "Un riferimento esplicito nomina il partecipante; un'omissione recuperabile lo lascia sottinteso mantenendo la stessa relazione grammaticale.",
    recap:
      "Ricorda たなかさん, やまださん e ひと, poi decidi quale informazione è finale e quale il contesto può recuperare.",
    translations: ["Tanaka", "Yamada", "persona", "studente", "insegnante", "io; me", "gatto", "libro", "casa", "fotografia"],
    purposes: [
      "Introduce un partecipante nominato per il riferimento esplicito.",
      "Aggiunge un secondo partecipante per un contrasto autentico.",
      "Fornisce un nome umano generale per il riferimento categoriale.",
      "Recupera un'identità nota come informazione finale.",
      "Recupera un'identità professionale in un contesto condiviso.",
      "Mostra un riferimento spesso recuperabile nella conversazione.",
      "Verifica l'omissione con un referente non umano.",
      "Estende la recuperabilità a un oggetto concreto.",
      "Distingue un referente di luogo dal suo stato discorsivo.",
      "Usa un nome noto in un nuovo contesto identificativo.",
    ],
    instructions: SENTENCE_ACTIVITY_INSTRUCTIONS_IT,
    accepted: "L'informazione finale è chiara e ogni omissione è recuperabile.",
    retry: "Trova il blocco identificativo finale, poi ripristina solo ciò che il contesto richiede.",
  }),
  ...semanticLessonCopy("sentence-foundations-3", {
    title: "Predicati nominali affermativi con です",
    objective: "Formare un predicato nominale affermativo cortese con nome più です.",
    main:
      "In un predicato nominale affermativo, です è la copula cortese che completa un'identificazione come がくせいです.",
    construction:
      "Scegli il nome che identifica la persona o la cosa, mettilo nella posizione predicativa finale e aggiungi il blocco copulare cortese です.",
    constraints:
      "Qui です appartiene ai predicati nominali. Con un aggettivo in い, più avanti, です segnalerà cortesia e non questa copula nominale: non è un collante universale.",
    commonError:
      "Non aggiungere です a ogni parola giapponese e non metterlo prima del nome che completa.",
    nearestContrast:
      "がくせい nomina la categoria; がくせいです rende quel nome un predicato affermativo cortese.",
    recap:
      "Produci かんごしです, べんごしです, ともだちです e いしゃです, distinguendo nome e copula.",
    translations: ["è infermiere", "è avvocato", "è un amico", "è medico", "è studente", "è insegnante", "sono io", "è una persona", "è un gatto", "è una casa", "è il mare", "è un biglietto"],
    purposes: [
      "Introduce per la prima volta la copula del predicato nominale affermativo.",
      "Applica です a un nome professionale.",
      "Applica です a un nome di relazione.",
      "Applica です a un nome di professione.",
      "Recupera una categoria nota con la nuova copula.",
      "Contrasta un secondo predicato categoriale noto.",
      "Permette un'identificazione naturale del parlante nel contesto.",
      "Abbina un nome umano generale alla copula.",
      "Estende il predicato nominale all'identità di un animale.",
      "Estende il predicato nominale a un luogo familiare.",
      "Estende il predicato a un elemento naturale noto.",
      "Estende il predicato a un oggetto concreto da viaggio.",
    ],
    instructions: SENTENCE_ACTIVITY_INSTRUCTIONS_IT,
    accepted: "Il predicato nominale termina correttamente con la copula affermativa です.",
    retry: "Mantieni il nome identificativo prima di です e non usare forme negative o passate.",
  }),
  ...semanticLessonCopy("sentence-foundations-4", {
    title: "Riferimento, tema, soggetto e focus",
    objective: "Distinguere soggetto grammaticale, tema discorsivo, focus nuovo e riferimento recuperabile.",
    main:
      "Il soggetto grammaticale appartiene alla struttura; il tema discorsivo stabilisce di cosa si parla; il focus presenta informazione nuova saliente. Un partecipante recuperabile può restare inespresso.",
    construction:
      "Individua prima il predicato strutturale, poi chiediti quale sia il tema, quale informazione sia nuova e quale partecipante sia già fornito dal contesto.",
    constraints:
      "Queste etichette rispondono a domande diverse. La lezione non assegna ancora は o が e non sostiene che un tema sostituisca meccanicamente un soggetto.",
    commonError:
      "Non chiamare tema ogni elemento omesso, soggetto ogni primo nome o focus ogni nome finale senza controllare il discorso.",
    nearestContrast:
      "La grammatica individua relazioni strutturali; il discorso spiega perché il parlante esprime o omette un blocco in quel contesto.",
    recap:
      "Recupera だいがくせい, りゅうがくせい e かぞく, poi indica il predicato e ciò che il contesto recupera.",
    translations: ["è studente universitario", "è studente internazionale", "è famiglia", "è il professor Tanaka", "è il professor Yamada", "è il dottor Tanaka", "è l'avvocato Yamada", "sono avvocato", "sono studente universitario", "il mio amico è studente internazionale"],
    purposes: [
      "Aggiunge un'identità studentesca precisa per l'analisi discorsiva.",
      "Contrasta una seconda identità studentesca come informazione nuova.",
      "Introduce un predicato di categoria familiare.",
      "Mostra un blocco predicativo con nome e titolo.",
      "Varia il titolo mantenendo l'ordine a predicato finale.",
      "Usa un nome proprio con un titolo professionale.",
      "Distingue riferimento e focus professionale.",
      "Rende esplicito il riferimento al parlante per il confronto.",
      "Contrasta riferimento al parlante esplicito e recuperabile.",
      "Separa l'amico recuperabile dalla nuova identità.",
    ],
    instructions: SENTENCE_ACTIVITY_INSTRUCTIONS_IT,
    accepted: "Le etichette strutturali e discorsive sono adatte al contesto.",
    retry: "Individua prima il predicato, poi distingui tema, soggetto, focus e omissione.",
  }),
  "sentence-anatomy-title": "Anatomia della frase",
  "particle-atlas-title": "Atlante delle particelle",
  "noun-watashi-meaning": "io; me",
  "noun-tanaka-meaning": "Tanaka (nome cortese)",
  "noun-yamada-meaning": "Yamada (nome cortese)",
  "noun-hito-meaning": "persona",
  "noun-kangoshi-meaning": "infermiere; infermiera",
  "noun-bengoshi-meaning": "avvocato; avvocata",
  "noun-tomodachi-meaning": "amico; amica",
  "noun-isha-meaning": "medico",
  "noun-daigakusei-meaning": "studente universitario",
  "noun-ryuugakusei-meaning": "studente internazionale",
  "noun-kazoku-meaning": "famiglia",
  "noun-tokyo-meaning": "Tokyo",
  "noun-kyoto-meaning": "Kyoto",
  "noun-osaka-meaning": "Osaka",
  "noun-satou-meaning": "Satou (nome cortese)",
  "noun-suzuki-meaning": "Suzuki (nome cortese)",
  "noun-mari-meaning": "Mari (nome cortese)",
  "noun-chichi-meaning": "mio padre",
  "noun-haha-meaning": "mia madre",
  "noun-ani-meaning": "mio fratello maggiore",
  "noun-ane-meaning": "mia sorella maggiore",
  "noun-namae-meaning": "nome",
  "noun-kuni-meaning": "paese",
  "noun-amerika-meaning": "Stati Uniti; America",
  "noun-itaria-meaning": "Italia",
  "noun-dare-meaning": "chi",
  "expression-hai-meaning": "sì",
  "expression-iie-meaning": "no",
  "expression-sou-meaning": "così; è corretto",
};

const TOPIC_ACTIVITY_INSTRUCTIONS_IT = [
  "Scegli l'interpretazione consentita dalla particella mostrata.",
  "Scegli la particella adatta alla funzione discorsiva indicata.",
  "Metti il tema o il blocco focalizzato prima del predicato.",
  "Completa la risposta con la relazione richiesta.",
  "Trasforma la frase precedente per esprimere il nuovo intento discorsivo.",
  "Scegli la spiegazione dell'errore nella particella.",
  "Costruisci la risposta che fa avanzare naturalmente lo scambio.",
  "Recupera lo schema precedente e aggiungi la distinzione attuale.",
  "Ascolta una volta, poi scegli la relazione espressa dalla particella.",
  "Pronuncia la risposta completa con una realizzazione naturale della particella.",
] as const;

const TOPIC_QUESTIONS_COPY_IT: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("topic-questions-1", {
    title: "Impostare un tema con は",
    objective: "Usare は, pronunciato wa, per stabilire o contrastare un tema discorsivo.",
    main:
      "La particella は qui si scrive は e si pronuncia wa. Segna ciò di cui parla l'enunciato o imposta un contrasto; non è un marcatore generico del soggetto.",
    construction:
      "Metti il nome già stabilito prima di は, poi concludi con il predicato nominale che commenta quel tema.",
    constraints:
      "In alcune frasi il tema può corrispondere al soggetto grammaticale, ma le due nozioni non sono intercambiabili.",
    commonError:
      "Non pronunciare は tematico come ha e non etichettare ogni sintagma con は come soggetto grammaticale.",
    nearestContrast:
      "は organizza un tema stabilito o contrastato; la lezione seguente usa が per presentare un soggetto focalizzato come informazione saliente.",
    recap:
      "Recupera とうきょう, きょうと, おおさか e とし, poi pronuncia ogni は tematico come wa.",
    translations: [
      "Quanto a me, sono studente.",
      "Quanto a Tanaka, è insegnante.",
      "Yamada, invece, è medico.",
      "Tokyo è una città.",
      "Kyoto è una città.",
      "Osaka è una città.",
      "Quanto al mio amico, è avvocato.",
      "Nella mia famiglia, la persona in questione è insegnante.",
      "Quanto al gatto, è un amico.",
      "Quanto alla fotografia, raffigura Tokyo.",
    ],
    purposes: [
      "Stabilisce il parlante come tema discorsivo.",
      "Usa una persona nominata come tema già stabilito.",
      "Attribuisce a は una vera lettura contrastiva.",
      "Introduce Tokyo in un semplice commento categoriale.",
      "Riusa il predicato città con un nuovo tema.",
      "Completa il contrasto tra tre città senza cambiare regola.",
      "Mantiene il tema distinto dal focus professionale.",
      "Mostra un familiare recuperabile sotto il tema famiglia.",
      "Applica il tema a un referente non umano.",
      "Usa una foto come tema e il luogo raffigurato come commento.",
    ],
    instructions: TOPIC_ACTIVITY_INSTRUCTIONS_IT,
    accepted: "Il blocco con は è un tema stabilito o contrastato, pronunciato wa.",
    retry: "Chiediti di cosa parla l'enunciato; non sostituire automaticamente l'etichetta soggetto.",
  }),
  ...semanticLessonCopy("topic-questions-2", {
    title: "Soggetti focalizzati con が",
    objective: "Usare が per un soggetto focalizzato e confrontare la scelta con は.",
    main:
      "La particella が marca un soggetto grammaticale quando quel partecipante viene presentato come focalizzato, appena identificato o selezionato per contrasto.",
    construction:
      "Metti il partecipante fornito come risposta focalizzata prima di が, poi enuncia il predicato che lo identifica.",
    constraints:
      "が non sostituisce meccanicamente は. La scelta cambia l'organizzazione discorsiva: soggetto focalizzato con が, tema stabilito o contrastato con は.",
    commonError:
      "Non memorizzare は uguale soggetto e が uguale marcatore sostitutivo; osserva ciò che è stabilito e ciò che è nuovo.",
    nearestContrast:
      "たなかさんは... commenta Tanaka come tema; たなかさんが... seleziona Tanaka come soggetto focalizzato.",
    recap:
      "Recupera さとうさん, すずきさん e まりさん, poi scegli が per una risposta focalizzata e は per un tema stabilito.",
    translations: [
      "È Satou a essere studente.",
      "È Suzuki a essere l'insegnante.",
      "È Mari a essere il medico.",
      "Quanto a Satou, è avvocato.",
      "Quanto a Suzuki, è studente.",
      "Quanto a Mari, è insegnante.",
      "È Tanaka a essere il medico.",
      "È Yamada a essere l'avvocato.",
      "Quanto a me, sono studente.",
      "È il mio amico a essere l'insegnante.",
    ],
    purposes: [
      "Introduce un nuovo soggetto nominato come risposta focalizzata.",
      "Varia il partecipante focalizzato con la stessa costruzione.",
      "Completa un insieme di tre risposte focalizzate.",
      "Contrasta il tema Satou già stabilito con が focalizzante.",
      "Contrasta il tema Suzuki già stabilito con が focalizzante.",
      "Contrasta il tema Mari già stabilito con が focalizzante.",
      "Usa が per la selezione correttiva di Tanaka.",
      "Usa が per la selezione correttiva di Yamada.",
      "Recupera は come vero tema.",
      "Mostra un nome di relazione appena reso saliente come soggetto.",
    ],
    instructions: TOPIC_ACTIVITY_INSTRUCTIONS_IT,
    accepted: "La particella corrisponde alla lettura di tema o soggetto focalizzato.",
    retry: "Decidi prima se il partecipante è stabilito o appena selezionato, poi scegli は o が.",
  }),
  ...semanticLessonCopy("topic-questions-3", {
    title: "の attributivo e も additivo",
    objective: "Collegare un attributo nominale con の e aggiungere un elemento parallelo con も.",
    main:
      "Tra due nomi, の collega un possessore o attributo al nome seguente. La particella も segna una relazione additiva come anche.",
    construction:
      "Con の, metti prima il possessore o attributo e poi il nome testa. Con も, metti l'elemento parallelo prima di も e completa il suo predicato.",
    constraints:
      "La lezione copre solo の possessivo o attributivo. Non introduce の nominalizzante, のです esplicativo o んです.",
    commonError:
      "Non invertire i due nomi intorno a の e non usare も se nel discorso manca un elemento parallelo.",
    nearestContrast:
      "の costruisce un sintagma nominale più grande; も collega additivamente un nuovo elemento a un'affermazione precedente.",
    recap:
      "Recupera ちち, はは, あに e あね; costruisci un sintagma con の e aggiungi un familiare parallelo con も.",
    translations: [
      "è mio padre",
      "è mia madre",
      "è mio fratello maggiore",
      "è mia sorella maggiore",
      "è il padre di Tanaka",
      "è la madre di Yamada",
      "anche mio padre è insegnante",
      "anche mia madre è medico",
      "anche mio fratello maggiore è studente",
      "anche mia sorella maggiore è avvocata",
    ],
    purposes: [
      "Introduce の possessivo con il parlante e il padre.",
      "Cambia il nome testa conservando l'ordine del modificatore.",
      "Estende il sintagma familiare al fratello maggiore.",
      "Estende il sintagma familiare alla sorella maggiore.",
      "Usa un possessore nominato senza cambiare la relazione の.",
      "Fornisce un secondo possessore nominato per contrasto.",
      "Introduce も additivo dopo una professione parallela.",
      "Varia il predicato additivo con l'identità di medico.",
      "Applica も al fratello maggiore come studente aggiuntivo.",
      "Applica も alla sorella maggiore come avvocata aggiuntiva.",
    ],
    instructions: TOPIC_ACTIVITY_INSTRUCTIONS_IT,
    accepted: "L'ordine nominale o la relazione additiva corrisponde al significato.",
    retry: "Mantieni il modificatore prima di の e il nome testa dopo; usa も solo per un'aggiunta parallela.",
  }),
  ...semanticLessonCopy("topic-questions-4", {
    title: "Chiarire con と e か",
    objective: "Elencare elementi nominali, segnare una relazione di compagnia e fare una domanda pratica con か.",
    main:
      "La particella と collega elementi nominali in un elenco delimitato o segna una relazione di compagnia. か finale trasforma il predicato nominale cortese in domanda.",
    construction:
      "Collega con と solo i nomi previsti; per la compagnia metti la persona prima di と. Metti か dopo il predicato cortese completo per chiedere conferma o informazione.",
    constraints:
      "La lezione non usa と citativo né i successivi schemi argomentali dei verbi. と è limitato al collegamento nominale, all'elenco e a una relazione trasparente di compagnia.",
    commonError:
      "Non trattare と come un e universale e non collocare か dentro il sintagma nominale interrogato.",
    nearestContrast:
      "と collega partecipanti nominali o elementi di elenco; か ha portata sulla domanda completa. Nessuno dei due svolge la funzione tematica di は.",
    recap:
      "Chiedi だれですか, conferma un くに, elenca アメリカとイタリア e chiarisci una relazione di compagnia prima di rispondere はい o いいえ.",
    translations: [
      "Chi è?",
      "Il paese sono gli Stati Uniti?",
      "Il nome è Yuki?",
      "Sono gli Stati Uniti e l'Italia.",
      "nome e paese",
      "Sono amico di Tanaka.",
      "Sì, è corretto.",
      "No, è l'Italia.",
    ],
    purposes: [
      "Introduce か finale in una domanda aperta d'identità.",
      "Usa か per una conferma pratica del paese.",
      "Controlla un nome con la stessa procedura interrogativa.",
      "Introduce と come elenco nominale delimitato.",
      "Usa と nominale nell'etichetta pratica dei dati richiesti.",
      "Introduce la lettura di compagnia senza uno schema verbale successivo.",
      "Fornisce una risposta affermativa naturale di chiarimento.",
      "Fornisce una correzione dopo aver respinto un'ipotesi.",
    ],
    instructions: TOPIC_ACTIVITY_INSTRUCTIONS_IT,
    accepted: "La relazione nominale o la domanda ottiene il chiarimento previsto.",
    retry: "Mantieni と nella relazione nominale e colloca か dopo il predicato completo.",
  }),
  "topic-questions-4-clarification-dialogue-outcome":
    "Gli interlocutori identificano Yuki, correggono il paese e confermano la relazione.",
  "topic-questions-4-clarification-dialogue-turn-1-translation": "Come ti chiami?",
  "topic-questions-4-clarification-dialogue-turn-1-purpose":
    "Apre lo scambio con una domanda informativa.",
  "topic-questions-4-clarification-dialogue-turn-2-translation": "È Yuki.",
  "topic-questions-4-clarification-dialogue-turn-2-purpose":
    "Risponde direttamente alla domanda aperta.",
  "topic-questions-4-clarification-dialogue-turn-3-translation":
    "È una persona degli Stati Uniti?",
  "topic-questions-4-clarification-dialogue-turn-3-purpose":
    "Controlla l'attributo del paese con の delimitato.",
  "topic-questions-4-clarification-dialogue-turn-4-translation":
    "No, è una persona italiana.",
  "topic-questions-4-clarification-dialogue-turn-4-purpose":
    "Respinge l'ipotesi e fornisce la correzione.",
  "topic-questions-4-clarification-dialogue-turn-5-translation":
    "È amico di Tanaka?",
  "topic-questions-4-clarification-dialogue-turn-5-purpose":
    "Controlla la relazione di compagnia.",
  "topic-questions-4-clarification-dialogue-turn-6-translation":
    "Sì, sono amico di Tanaka.",
  "topic-questions-4-clarification-dialogue-turn-6-purpose":
    "Chiude il chiarimento con una conferma.",
  "noun-toshi-meaning": "città",
  "noun-yuki-meaning": "Yuki",
};

export const baseNavigationCopyIt: BaseNavigationCopy = deepFreeze({
  modules: {
    sounds: { title: "Suoni e scrittura" },
    "sentence-foundations": { title: "Fondamenti della frase" },
    "topic-questions": { title: "Temi e domande" },
    "polite-verbs": { title: "Azioni cortesi" },
    "argument-particles": { title: "Ruoli e particelle" },
    "time-movement": { title: "Tempo e movimento" },
    "copula-adjectives": { title: "Descrizione e collegamento" },
    "existence-location": { title: "Esistenza e posizione" },
    "requests-connection": { title: "Richieste e collegamento" },
    "base-synthesis": { title: "Sintesi delle basi" },
  },
  lessons: {
    "sounds-1": { title: "Ascoltare i suoni giapponesi" },
    "sounds-2": { title: "Leggere gli schemi in hiragana" },
    "sounds-3": { title: "Notare i cambiamenti di suono" },
    "sounds-4": { title: "Leggere il katakana nel contesto" },
    "sentence-foundations-1": { title: "Costruire una frase breve" },
    "sentence-foundations-2": { title: "Nominare persone e cose" },
    "sentence-foundations-3": { title: "Scegliere un riferimento naturale" },
    "sentence-foundations-4": { title: "Scambiare informazioni semplici" },
    "topic-questions-1": { title: "Impostare un tema" },
    "topic-questions-2": { title: "Dare una risposta mirata" },
    "topic-questions-3": { title: "Chiedere chi, cosa e dove" },
    "topic-questions-4": { title: "Indicare persone e cose" },
    "polite-verbs-1": { title: "Riconoscere parole d'azione" },
    "polite-verbs-2": { title: "Parlare di un oggetto" },
    "polite-verbs-3": { title: "Dire un'azione con cortesia" },
    "polite-verbs-4": { title: "Collocare un'azione" },
    "argument-particles-1": { title: "Segnalare la persona coinvolta" },
    "argument-particles-2": { title: "Segnalare un oggetto" },
    "argument-particles-3": { title: "Segnalare una destinazione" },
    "argument-particles-4": { title: "Collegare i ruoli della frase" },
    "time-movement-1": { title: "Collocare un evento nel tempo" },
    "time-movement-2": { title: "Parlare di una routine" },
    "time-movement-3": { title: "Parlare di prima e dopo" },
    "time-movement-4": { title: "Descrivere un piccolo percorso" },
    "copula-adjectives-1": { title: "Descrivere con una copula" },
    "copula-adjectives-2": { title: "Aggiungere una qualità semplice" },
    "copula-adjectives-3": { title: "Collegare due descrizioni" },
    "copula-adjectives-4": { title: "Confrontare dettagli familiari" },
    "existence-location-1": { title: "Dire che qualcosa è presente" },
    "existence-location-2": { title: "Collocare una persona o una cosa" },
    "existence-location-3": { title: "Chiedere cosa c'è intorno" },
    "existence-location-4": { title: "Descrivere un luogo familiare" },
    "requests-connection-1": { title: "Fare una richiesta semplice" },
    "requests-connection-2": { title: "Rispondere con disponibilità" },
    "requests-connection-3": { title: "Collegare due idee brevi" },
    "requests-connection-4": { title: "Gestire un piccolo scambio" },
    "base-synthesis-1": { title: "Presentarsi con chiarezza" },
    "base-synthesis-2": { title: "Fare e rispondere alle domande di base" },
    "base-synthesis-3": { title: "Gestire una situazione familiare" },
    "base-synthesis-4": { title: "Combinare gli schemi fondamentali" },
  },
  objectives: {
    "a1-can-do-sounds-descriptor":
      "So riconoscere e leggere gli schemi di suono e scrittura usati nel corso di base.",
    "a1-can-do-sentence-foundations-descriptor":
      "So costruire frasi brevi e cortesi per identificare persone e cose in uno scambio familiare.",
    "a1-can-do-topic-questions-descriptor":
      "So impostare un tema e fare o rispondere a domande semplici su persone e cose familiari.",
    "a1-can-do-polite-verbs-descriptor":
      "So usare una breve frase d'azione cortese per una persona, un oggetto o un luogo familiare.",
    "base-can-do-argument-particles-descriptor":
      "So usare marcatori di ruolo di base per rendere più chiaro un breve messaggio familiare.",
    "a1-can-do-time-movement-descriptor":
      "So collocare un'attività familiare nel tempo e descrivere un movimento o una routine semplice.",
    "base-can-do-copula-adjectives-descriptor":
      "So creare una breve descrizione collegando informazioni familiari su identità e qualità.",
    "base-can-do-existence-location-descriptor":
      "So dire che una persona o una cosa familiare è presente e indicarne una semplice posizione.",
    "base-can-do-requests-connection-descriptor":
      "So fare o rispondere a una richiesta pratica semplice e collegare brevi idee familiari.",
    "base-can-do-synthesis-descriptor":
      "So combinare gli schemi fondamentali in un breve scambio quotidiano guidato.",
  },
  outcomes: {
    "base-module-outcome-sounds":
      "Usa l'attenzione a suoni e scrittura per affrontare con cura parole giapponesi brevi.",
    "base-module-outcome-sentence-foundations":
      "Costruisci brevi frasi cortesi di identità su persone e cose familiari.",
    "base-module-outcome-topic-questions":
      "Guida un breve scambio con un tema e semplici parole interrogative.",
    "base-module-outcome-polite-verbs":
      "Descrivi azioni familiari in brevi frasi cortesi.",
    "base-module-outcome-argument-particles":
      "Rendi più chiari i ruoli familiari nella frase con marcatori di collegamento di base.",
    "base-module-outcome-time-movement":
      "Parla in modo semplice di tempo, routine e movimento.",
    "base-module-outcome-copula-adjectives":
      "Descrivi persone e cose familiari con brevi affermazioni collegate.",
    "base-module-outcome-existence-location":
      "Di' cosa è presente e dove si trova in un luogo familiare.",
    "base-module-outcome-requests-connection":
      "Partecipa a un piccolo scambio pratico con una richiesta e una risposta.",
    "base-module-outcome-base-synthesis":
      "Usa insieme i meccanismi fondamentali in uno scambio quotidiano guidato.",
  },
  content: {
    ...SENTENCE_FOUNDATIONS_COPY_IT,
    ...TOPIC_QUESTIONS_COPY_IT,
    "base-audio-failed":
      "La registrazione canonica non è stata riprodotta. Kana, divisione in more e significato restano visibili.",
    "base-audio-unavailable":
      "La registrazione canonica non è disponibile. Non viene sostituita da una voce del browser.",
    "base-audio-retry": "Riprova la registrazione canonica",
    "base-sounds-feedback-accepted": "Il suono o la lettura corrisponde all'obiettivo.",
    "base-sounds-feedback-retry": "Confronta i kana visibili e la divisione in more, poi riprova.",
    "sounds-1-recap": "Hai distinto le cinque vocali, il gojuon di base e tutti i 46 hiragana moderni.",
    "sounds-1-phonetic-explanation": "La mora è un'unità ritmica. Parti dall'hiragana e qui conta ogni kana di base come una mora.",
    "sounds-1-contrast-map": "Confronta la qualità delle vocali, poi segui ogni riga gojuon non sonora.",
    "sounds-2-recap": "Hai confrontato grafie non sonore, con dakuten e con handakuten senza inventare una distinzione sonora universale per じ/ぢ o ず/づ.",
    "sounds-2-phonetic-explanation": "Il dakuten sonorizza una riga; l'handakuten segna la riga p. じ/ぢ e ず/づ restano distinzioni ortografiche importanti.",
    "sounds-2-contrast-map": "Confronta か/が, さ/ざ, た/だ e は/ば/ぱ, poi riconosci じ/ぢ e ず/づ.",
    "sounds-3-recap": "Hai contato vocali lunghe, piccolo っ e ん moraica come unità ritmiche.",
    "sounds-3-phonetic-explanation": "Il numero di caratteri kana non coincide sempre con le more: vocali lunghe, piccolo っ e ん portano ritmo.",
    "sounds-3-contrast-map": "Confronta vocali brevi/lunghe, consonanti semplici/geminate e forme con o senza ん moraica.",
    "sounds-4-recap": "Hai letto gli yoon comuni come una mora e usato un piccolo ponte pratico verso il katakana.",
    "sounds-4-phonetic-explanation": "Un kana grande più il piccolo ゃ, ゅ o ょ forma una sola mora yoon.",
    "sounds-4-contrast-map": "Confronta gli yoon comuni e riporta solo il gruppo limitato di katakana all'hiragana noto.",
    "snd1-discriminate-vowels-instruction": "Scegli il kana con cui inizia la parola mostrata.",
    "snd1-segment-asa-instruction": "Scegli l'opzione con i confini moraici corretti.",
    "snd1-recognize-gojuon-instruction": "Scegli la riga che completa lo schema kana mostrato.",
    "snd1-map-hiragana-row-instruction": "Scegli la riga che completa l'associazione di scrittura mostrata.",
    "snd1-match-ie-instruction": "Scegli la parola che corrisponde all'indizio moraico mostrato.",
    "snd1-assemble-umi-instruction": "Scegli la parola composta dalle tessere moraiche mostrate.",
    "snd1-listen-u-instruction": "Ascolta una volta, poi scegli il kana corrispondente.",
    "snd1-read-neko-instruction": "Leggi ad alta voce i kana mostrati con ritmo moraico uniforme.",
    "snd2-discriminate-kaga-instruction": "Scegli la coppia che conserva la riga consonantica aggiungendo sonorità.",
    "snd2-segment-kagi-instruction": "Scegli l'opzione con i confini moraici corretti.",
    "snd2-recognize-jidi-instruction": "Scegli la grafia che conserva il kana di base ripetuto quando si aggiunge il segno di sonorità.",
    "snd2-map-dakuten-instruction": "Scegli l'opzione che completa l'associazione dei segni mostrata.",
    "snd2-match-kaze-instruction": "Scegli la parola che corrisponde all'indizio moraico mostrato.",
    "snd2-assemble-denwa-instruction": "Scegli la parola composta dalle tessere moraiche mostrate.",
    "snd2-listen-kaga-instruction": "Ascolta una volta, poi scegli il kana corrispondente.",
    "snd2-read-panpu-instruction": "Leggi ad alta voce i kana mostrati con ritmo moraico uniforme.",
    "snd3-discriminate-obasan-instruction": "Scegli l'opzione che corrisponde agli spazi ritmici mostrati.",
    "snd3-segment-gakkou-instruction": "Scegli l'opzione con i confini moraici corretti.",
    "snd3-recognize-small-tsu-instruction": "Scegli l'opzione richiesta dal contrasto kana mostrato.",
    "snd3-map-moraic-n-instruction": "Scegli l'opzione che completa lo spazio ritmico mostrato.",
    "snd3-match-hon-instruction": "Scegli la parola che corrisponde all'indizio moraico mostrato.",
    "snd3-assemble-kippu-instruction": "Scegli la parola composta dalle tessere moraiche mostrate.",
    "snd3-listen-kan-instruction": "Ascolta una volta, poi scegli il kana corrispondente.",
    "snd3-read-obaasan-instruction": "Leggi ad alta voce i kana mostrati con ritmo moraico uniforme.",
    "snd4-discriminate-yoon-instruction": "Scegli l'opzione che segue lo schema kana mostrato.",
    "snd4-segment-ryokou-instruction": "Scegli l'opzione con i confini moraici corretti.",
    "snd4-recognize-small-yoon-instruction": "Scegli l'opzione che segue lo schema kana mostrato.",
    "snd4-map-katakana-instruction": "Scegli l'opzione che completa l'associazione di scrittura mostrata.",
    "snd4-match-shashin-instruction": "Scegli la parola che corrisponde all'indizio moraico mostrato.",
    "snd4-assemble-kyaku-instruction": "Scegli la parola composta dalle tessere moraiche mostrate.",
    "snd4-listen-nyuryo-instruction": "Ascolta una volta, poi scegli il kana corrispondente.",
    "snd4-read-chuui-instruction": "Leggi ad alta voce i kana mostrati con ritmo moraico uniforme.",
    "anchor-asa-meaning": "mattina",
    "anchor-ie-meaning": "casa",
    "anchor-umi-meaning": "mare",
    "anchor-neko-meaning": "gatto",
    "anchor-kagi-meaning": "chiave",
    "anchor-kaze-meaning": "vento",
    "anchor-denwa-meaning": "telefono",
    "anchor-pan-meaning": "pane",
    "anchor-obaasan-meaning": "nonna",
    "anchor-gakkou-meaning": "scuola",
    "anchor-hon-meaning": "libro",
    "anchor-kippu-meaning": "biglietto",
    "anchor-kyaku-meaning": "ospite; cliente",
    "anchor-shashin-meaning": "fotografia",
    "anchor-chuui-meaning": "attenzione; cautela",
    "anchor-ryokou-meaning": "viaggio",
  },
});

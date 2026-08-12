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
    accepted: readonly string[];
    retry: readonly string[];
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
    ...Object.fromEntries(
      values.accepted.map((feedback, index) => [
        `${lessonId}-activity-${index + 1}-feedback-accepted`,
        feedback,
      ]),
    ),
    ...Object.fromEntries(
      values.retry.map((feedback, index) => [
        `${lessonId}-activity-${index + 1}-feedback-retry`,
        feedback,
      ]),
    ),
  };
}

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
    translations: [
      "Io—studente. (frammento di autopresentazione)",
      "Nonna—insegnante. (frammento di didascalia)",
      "Famiglia—fotografia. (frammento di album)",
      "Mattina—scuola. (frammento di agenda)",
      "Viaggio—mare. (frammento di itinerario)",
      "Telefono—nonna. (frammento di instradamento)",
      "Chiave—casa. (frammento di abbinamento)",
      "Biglietto—viaggio. (frammento al banco)",
      "Fotografia—Sakura. (frammento d’identità)",
      "Fotografia—Ken. (frammento d’identità)",
    ],
    purposes: [
      "Modella un’autopresentazione naturale in due blocchi prima della copula.",
      "Modella una didascalia persona-più-ruolo.",
      "Modella un’intestazione d’album seguita dal tipo di supporto.",
      "Modella il contesto temporale seguito dalla voce finale dell’agenda.",
      "Modella un’intestazione d’itinerario seguita dalla meta.",
      "Modella un’etichetta telefonica seguita dalla persona prevista.",
      "Modella un oggetto-indizio seguito dal luogo abbinato.",
      "Modella un documento seguito dal suo scopo pratico.",
      "Modella una fotografia seguita dal nome Sakura.",
      "Modella una seconda fotografia seguita dal nome Ken.",
    ],
    instructions: [
      'In una foto di gruppo chi porta il badge del parlante è in primo piano. Scegli il frammento.',
      'Un’etichetta scolastica richiede il ruolo nello spazio finale. Scegli il frammento coerente.',
      'Un’etichetta telefonica richiede la persona prevista nello spazio finale. Scegli il frammento.',
      'Un’etichetta fotografica richiede il gruppo raffigurato nello spazio finale. Fornisci il frammento.',
      'Un inventario scolastico richiede l’oggetto mancante. Scegli il frammento coerente.',
      'La nota telefonica mostrata termina con un valore errato. Scegli la correzione.',
      'Un’etichetta di abbinamento richiede il luogo associato alla chiave. Scegli il frammento.',
      'Un’etichetta di biglietto richiede il titolare nominato. Recupera il frammento.',
      'Ascolta il frammento completo di consegna a casa, poi scegli la forma scritta.',
      'Ricorda la nota sul vento mattutino e pronuncia il frammento in due blocchi.',
    ],
    accepted: [
      "Il frammento identifica il partecipante evidenziato senza fingere di essere una frase completa.",
      "Il nome di ruolo scelto completa il campo come blocco unico.",
      "Il titolo personale finale completa il frammento di instradamento.",
      "Il nome famiglia completa l’etichetta fotografica come frammento coerente.",
      "Il frammento-oggetto completa la lista senza aggiungere materiale estraneo.",
      "La correzione sostituisce il valore finale estraneo con il destinatario previsto.",
      "Il valore scuola completa il frammento di assegnazione della chiave.",
      "Il nome del titolare completa il frammento del biglietto.",
      "Il frammento di consegna a casa corrisponde alla registrazione.",
      "Il frammento orale sul vento mattutino conserva l’ordine.",
    ],
    retry: [
      "Usa il partecipante evidenziato, non un’altra persona nella stessa scena.",
      "Completa un campo di ruolo con un nome di ruolo, non con un evento.",
      "Scegli il titolo personale richiesto dall’etichetta, non un valore meteorologico.",
      "L’etichetta fotografica richiede il gruppo raffigurato, non una persona estranea.",
      "Torna all’oggetto mancante nella lista e scarta l’etichetta di evento.",
      "Tratta il valore telefonico mostrato come errore, poi scegli la persona prevista.",
      "Mantieni prima la chiave e scegli l’edificio assegnato.",
      "Mantieni prima il biglietto e recupera il titolare nominato.",
      "Riascolta entrambi i blocchi della consegna a casa.",
      "Ricorda i blocchi del vento mattutino; non leggere un’opzione.",
    ],
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
    translations: [
      "Fotografia—Tanaka. (frammento con contesto esplicito)",
      "Tanaka. (l’etichetta fotografia è recuperabile)",
      "Fotografia—Yamada. (frammento con contesto esplicito)",
      "Yamada. (l’etichetta fotografia è recuperabile)",
      "Nonna—persona. (frammento categoriale esplicito)",
      "Una persona. (il referente raffigurato è recuperabile)",
      "Scuola—studente. (frammento di ruolo esplicito)",
      "Studente. (il campo scuola è recuperabile)",
      "Telefono—fotografia. (frammento di schermo esplicito)",
      "Fotografia. (il campo telefono è recuperabile)",
    ],
    purposes: [
      "Esprime insieme il campo fotografia e il valore Tanaka.",
      "Si abbina al precedente per mostrare l’omissione del campo fotografia.",
      "Esprime un secondo campo fotografia e il valore Yamada.",
      "Si abbina al precedente con un referente diverso.",
      "Esprime insieme la persona visibile e la categoria ampia.",
      "Si abbina al precedente omettendo soltanto la persona recuperabile.",
      "Esprime insieme il campo scuola e il valore di ruolo.",
      "Si abbina al precedente omettendo il campo scuola condiviso.",
      "Esprime insieme il campo telefono e la fotografia mostrata.",
      "Si abbina al precedente omettendo il campo telefono condiviso.",
    ],
    instructions: [
      'Trasforma la prima coppia fotografica in una nota persona-categoria di due blocchi.',
      'Trasforma la seconda coppia in una diversa nota persona-categoria.',
      'La nonna raffigurata appartiene all’unità familiare. Scegli la nota di relazione.',
      'L’elenco scolastico chiede quale persona ricopra il ruolo mostrato. Scegli la nota.',
      'Una chiamata in aula richiede il titolo della persona; il canale è visibile. Scegli il blocco.',
      'Una coppia fotografica esplicita termina con un oggetto estraneo. Scegli la persona corretta.',
      'Una fotografia mostra chiaramente un animale. Scegli il blocco animale sufficiente.',
      'Uno scaffale scolastico evidenzia un elemento da leggere. Recupera il blocco.',
      'È mostrata una chiave. Ascolta il luogo abbinato, poi scegli il valore sufficiente.',
      'Ricorda il dispositivo abbinato alla fotografia mostrata e pronuncialo a memoria.',
    ],
    accepted: [
      "Tanaka resta al primo posto e la categoria persona completa il secondo blocco.",
      "Yamada resta al primo posto e la categoria persona completa il secondo blocco.",
      "La nonna è collegata all’unità famiglia; la risposta nomina entrambi i blocchi.",
      "Il ruolo studente è seguito dall’identità del parlante.",
      "Il canale visibile è recuperabile e il titolo scelto è sufficiente.",
      "La correzione sostituisce l’oggetto estraneo con la persona richiesta dalla fotografia.",
      "Il blocco animale corrisponde al contesto fotografico visibile.",
      "Il blocco-oggetto corrisponde all’elemento evidenziato sullo scaffale.",
      "Il valore di luogo scritto corrisponde alla parola registrata abbinata alla chiave.",
      "L’etichetta orale del dispositivo corrisponde alla coppia di schermo stabilita.",
    ],
    retry: [
      "Mantieni Tanaka per primo e la categoria persona per seconda.",
      "Mantieni Yamada per primo e la categoria persona per seconda.",
      "Usa la relazione familiare, non una categoria professionale.",
      "Mantieni il ruolo per primo e identifica il parlante nel secondo blocco.",
      "Usa il titolo personale richiesto, non una categoria familiare.",
      "Diagnostica l’oggetto finale come errato prima di scegliere la persona.",
      "Usa l’animale visibilmente stabilito dalla fotografia.",
      "Ricorda l’elemento da leggere evidenziato sullo scaffale.",
      "Riascolta la parola di luogo abbinata alla chiave visibile.",
      "Ricorda il dispositivo dalla coppia precedente senza leggere un’opzione.",
    ],
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
    translations: ["È infermiere.", "È avvocato.", "È un amico.", "È medico.", "Sono studente.", "È insegnante.", "Sono io.", "È una persona.", "È un gatto.", "È una casa."],
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
    ],
    instructions: [
      'Una scheda con nome e una fotografia identificano una persona. Scegli l’identificazione completa.',
      'Una seconda scheda con nome identifica un’altra persona. Scegli l’identificazione completa.',
      'Disponi il nome e il finale cortese forniti in un predicato completo.',
      'Una fotografia del campus evidenzia l’edificio scolastico. Completa il predicato.',
      'Trasforma il frammento nominale mostrato in un predicato cortese completo.',
      'È mostrata una chiave, ma il candidato nomina il pane. Scegli la correzione completa.',
      'Un professionista indica un oggetto sulla scrivania. Scegli la risposta contestuale completa.',
      'Entra un cliente e il ruolo è recuperabile. Recupera la risposta cortese completa.',
      'Ascolta una volta, poi scegli il predicato nominale completo corrispondente.',
      'Recupera la scheda-evento precedente e pronuncia il predicato cortese a memoria.',
    ],
    accepted: [
      "Il predicato completo identifica la persona fotografata e termina con la copula cortese.",
      "La frase scelta identifica la seconda persona invece di lasciare isolato il nome professionale.",
      "Il nome fornito precede la copula nell’unico ordinamento grammaticale.",
      "Il nome dell’edificio forma un’identificazione nominale cortese completa.",
      "Il frammento iniziale ora funziona come predicato nominale affermativo completo.",
      "La correzione nomina l’oggetto mostrato e fornisce il finale predicativo richiesto.",
      "L’oggetto indicato, non il professionista, è il referente recuperabile della risposta.",
      "Il ruolo del cliente viene recuperato ed espresso come predicato completo.",
      "Il predicato scritto corrisponde sia al nome sia al finale della registrazione.",
      "La risposta orale recupera l’evento e fornisce un predicato cortese completo.",
    ],
    retry: [
      "Scegli l’identificazione completa: qui il solo nome professionale resta un frammento.",
      "Controlla che l’identificazione personale sia completa e non un ruolo isolato.",
      "Mantieni il nome prima della copula; invertire i blocchi non forma un predicato giapponese.",
      "Usa l’edificio evidenziato come nome predicativo e chiudi cortesemente la frase.",
      "Conserva il nome sorgente e aggiungi soltanto il finale predicativo affermativo.",
      "Il predicato mostrato nomina l’oggetto sbagliato: sostituisci il nome mantenendo il finale completo.",
      "Segui ciò che viene indicato invece di nominare il ruolo del professionista.",
      "Recupera il ruolo della persona in entrata e rendilo un predicato nominale completo.",
      "Ascolta il nome iniziale e la copula finale prima di scegliere.",
      "Produci il predicato ricordato senza leggere un’opzione visibile.",
    ],
  }),
  ...semanticLessonCopy("sentence-foundations-4", {
    title: "Ordine dei modificatori e frasi brevi complete",
    objective: "Mettere il nome prima del titolo e costruire predicati nominali brevi senza copiare l’ordine italiano.",
    main:
      "In giapponese il modificatore precede il nome descritto. Un nome proprio semplice può precedere un titolo, mentre il predicato nominale breve mantiene il nome identificativo prima di です.",
    construction:
      "Nell’unità nome-titolo, metti prima il nome e poi il titolo. Nel predicato breve, metti il nome identificativo prima di です.",
    constraints:
      "L’unità nome-titolo è un modello delimitato. Il の possessivo e la modifica nominale produttiva iniziano in TQ3.",
    commonError:
      "Non invertire titolo e nome, non inserire さん prima di せんせい e non mettere です prima del nome.",
    nearestContrast:
      "SF2 mostrava ciò che il contesto può omettere; SF4 mostra l’ordine interno e il predicato breve completo.",
    recap:
      "Recupera i nomi semplici e i ruoli studenteschi; metti il nome prima di せんせい e il nome identificativo prima di です.",
    translations: [
      "È la professoressa Sakura.",
      "È il professor Ken.",
      "È un libro.",
      "È un biglietto.",
      "Quanto a me, sono studente universitario.",
      "Quanto al mio amico, è studente internazionale.",
      "Quanto a Mika, è studente.",
      "Quanto a Sora, è studente.",
      "Quanto a Haru, è studente.",
      "Quanto ad Ai, è studente.",
    ],
    purposes: [
      "Introduce il modello nome-semplice-prima-del-titolo.",
      "Recupera lo stesso ordine con un secondo nome.",
      "Mostra un predicato-oggetto breve completo.",
      "Mostra un altro predicato breve senza inversione italiana.",
      "Contrasta un referente esplicito con il ruolo finale.",
      "Mantiene il referente di relazione distinto dal ruolo finale.",
      "Contrasta Mika come tema sospeso con l’unità titolo.",
      "Contrasta Sora come tema sospeso con l’unità titolo.",
      "Contrasta Haru come tema sospeso con l’unità titolo.",
      "Contrasta Ai come tema sospeso con l’unità titolo.",
    ],
    instructions: [
      'Una scheda del personale richiede un’unità nome-titolo. Scegli l’identificazione completa.',
      'Il contesto richiede un composto con titolo, non una pausa parlata. Scegli la forma.',
      'Disponi il nome fornito prima del titolo e mantieni il finale predicativo per ultimo.',
      'Una scheda di ruolo richiede un predicato nominale breve completo. Scegli la forma.',
      'Il profilo richiede la categoria umana più ampia per il parlante visibile. Scegli il predicato.',
      'L’unità mostrata inverte modificatore e testa. Scegli la correzione ordinata.',
      'L’amico stabilito richiede il ruolo registrato nel profilo. Scegli il predicato breve.',
      'La fotografia condivisa richiede il valore di gruppo registrato. Recupera il predicato.',
      'Ascolta il predicato professionale e scegli la corrispondenza esatta.',
      'Ricorda il secondo profilo professionale e pronuncia il predicato breve a memoria.',
    ],
    accepted: [
      "Il nome semplice precede il titolo e il predicato completo termina correttamente.",
      "La forma scelta è un’unità nome-titolo, non un tema sospeso.",
      "I blocchi conservano l’ordine nome-prima-del-titolo e il predicato finale.",
      "Il nome di ruolo forma ora un predicato breve completo.",
      "Il predicato breve fornisce la categoria umana ampia richiesta.",
      "La correzione ripristina l’ordine modificatore-prima-della-testa.",
      "Il predicato studente internazionale corrisponde all’amico stabilito.",
      "Il predicato famiglia corrisponde alla fotografia condivisa.",
      "Il predicato infermiere scritto corrisponde alla registrazione.",
      "Il predicato avvocato orale corrisponde al profilo ricordato.",
    ],
    retry: [
      "Mantieni il nome semplice prima del titolo; non sostituire l’unità con un ruolo estraneo.",
      "Scegli l’unità con titolo invece di separare le parole con una pausa.",
      "Usa gli stessi blocchi e metti il nome prima del titolo.",
      "Qui il solo ruolo resta un frammento: scegli la forma completata da です.",
      "Scegli la categoria umana ampia, non il ruolo studente più ristretto.",
      "Diagnostica l’unità invertita e ripristina l’ordine modificatore-testa.",
      "Usa il ruolo registrato per l’amico, non un titolo estraneo.",
      "Recupera il valore di gruppo registrato per la fotografia.",
      "Riascolta il nome professionale e il finale predicativo completo.",
      "Ricorda il profilo professionale e produci il predicato senza leggere opzioni.",
    ],
  }),
  "sentence-anatomy-title": "Anatomia della frase",
  "particle-atlas-title": "Atlante delle particelle",
  "noun-watashi-meaning": "io; me",
  "noun-gakusei-meaning": "studente; studentessa",
  "noun-sensei-meaning": "insegnante; titolo per docente o professionista",
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
  "noun-namae-meaning": "nome",
  "noun-kuni-meaning": "paese",
  "noun-nihon-meaning": "Giappone",
  "noun-chuugoku-meaning": "Cina",
  "noun-dare-meaning": "chi",
  "expression-hai-meaning": "sì",
  "expression-iie-meaning": "no",
  "expression-sou-meaning": "così; è corretto",
};

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
      "Quanto all’infermiere, è Tanaka.",
      "Quanto all’avvocato, invece, è Yamada.",
      "Tokyo è una città.",
      "Tornando a Kyoto: è una città.",
      "Quanto a Osaka, la categoria corretta è città.",
      "Quanto allo studente internazionale, è il mio amico.",
      "Quanto alla fotografia, mostra la mia famiglia.",
      "È Tokyo. (risposta breve da contesto condiviso)",
      "Quanto al biglietto, è per Osaka.",
    ],
    purposes: [
      "Stabilisce il parlante come tema discorsivo.",
      "Usa una professione come tema già stabilito nell’elenco.",
      "Attribuisce a は una vera lettura contrastiva con un secondo ruolo.",
      "Introduce Tokyo in un semplice commento categoriale.",
      "Riprende Kyoto come tema già menzionato.",
      "Usa は per correggere la categoria di Osaka senza presentarla come soggetto nuovo.",
      "Usa un ruolo stabilito come tema e ne fornisce il valore-persona.",
      "Usa la fotografia come tema e identifica il gruppo raffigurato come famiglia.",
      "Modella una risposta breve con referente stabilito dal contesto.",
      "Usa un documento al banco come tema in una scelta di destinazione recuperabile.",
    ],
    instructions: [
      'Una foto dello skyline di Tokyo stabilisce il luogo come tema. Scegli il commento.',
      'Scegli la versione con marcatura tematica esplicita invece della pausa parlata.',
      'Disponi il blocco fotografia prima del marcatore e il commento identificativo alla fine.',
      'Il parlante è già in discussione. Scegli il ruolo coerente con il profilo.',
      'Trasforma un tema sospeso in una frase con tema marcato senza cambiare il fatto.',
      'La frase mostrata contraddice il profilo stabilito. Scegli la riparazione fattuale.',
      'Una relazione familiare è già tema. Scegli il commento di profilo adatto.',
      'Un animale domestico è già in discussione. Recupera la relazione stabilita prima.',
      'Ascolta una volta la frase tematica registrata, poi scegli il commento esatto.',
      'Ricorda la destinazione stabilita per il biglietto e pronuncia la risposta breve.',
    ],
    accepted: [
      "La fotografia marcata è l’ancora discorsiva e il commento finale identifica ciò che raffigura.",
      "Il marcatore tematico esplicito, pronunciato wa, sostituisce la pausa senza cambiare il fatto.",
      "La fotografia resta tema e il valore identificativo rimane nel predicato finale.",
      "Il parlante è il tema stabilito e il ruolo scelto corrisponde al profilo condiviso.",
      "La trasformazione conserva la professione di Tanaka sostituendo la pausa con il tema marcato.",
      "La correzione ripristina la professione registrata di Yamada sotto il tema stabilito.",
      "La relazione nota resta tematica e riceve il commento di profilo corretto.",
      "L’animale domestico è trattato in contrasto mantenendo la relazione stabilita.",
      "La frase registrata identifica il partecipante raffigurato sotto un tema esplicito.",
      "La risposta orale breve conserva Osaka come destinazione stabilita del biglietto.",
    ],
    retry: [
      "Mantieni l’ancora stabilita prima del marcatore tematico e il commento alla fine.",
      "Scegli la marcatura tematica esplicita, non la pausa sospesa pur possibile nel parlato.",
      "Usa la fotografia come tema; invertire tema e valore cambia il messaggio.",
      "Continua il tema del parlante con il ruolo del profilo condiviso.",
      "Cambia solo l’organizzazione discorsiva; la professione di Tanaka deve restare invariata.",
      "Il candidato contraddice l’elenco: correggi il ruolo di Yamada, non la struttura tematica.",
      "Recupera il profilo stabilito dell’amico prima di scegliere il commento.",
      "Usa la relazione stabilita per l’animale, non una professione umana.",
      "Riascolta sia il nome tematico sia il valore identificativo finale.",
      "Ricorda il fatto al banco e produci soltanto il valore di destinazione.",
    ],
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
      "È Tanaka a essere l'infermiere.",
      "No: è Yamada a essere l'avvocato.",
      "È il mio amico a essere studente internazionale.",
      "Lo studente è Satou.",
      "L'insegnante è Suzuki.",
      "Il medico è Mari.",
      "Quanto a Tanaka, è l’infermiere.",
      "Quanto a Yamada, è l’avvocato.",
      "Quanto a me, sono studente universitario.",
      "Quanto allo studente universitario, sono io.",
    ],
    purposes: [
      "Introduce Tanaka come infermiere appena selezionato.",
      "Usa が come focus correttivo su Yamada avvocato.",
      "Seleziona l'amico come studente internazionale.",
      "Usa il ruolo studente stabilito come tema e identifica Satou.",
      "Usa il ruolo insegnante stabilito come tema e identifica Suzuki.",
      "Usa il ruolo medico come tema stabilito e identifica Mari.",
      "Riorganizza il fatto su Tanaka infermiere come tema stabilito per confrontarlo con が.",
      "Riorganizza il fatto su Yamada avvocato come tema stabilito per confrontarlo con が.",
      "Recupera il parlante come tema stabilito.",
      "Usa il ruolo studente universitario come tema stabilito e identifica il parlante.",
    ],
    instructions: [
      'Dopo una voce dell’elenco si apre un nuovo campo personale. Scegli l’identificazione focalizzata.',
      'Una persona è già il tema discorsivo. Scegli la frase che continua quel tema.',
      'Disponi la persona appena selezionata prima del marcatore focalizzante e il predicato alla fine.',
      'Applica il modello di tema stabilito alla persona successiva dell’elenco.',
      'Riorganizza lo stesso fatto da tema sospeso a risposta correttiva focalizzata.',
      'Il candidato identifica la persona sbagliata in un campo di ruolo aperto. Scegli la riparazione focalizzata.',
      'Un ruolo professionale è già tema. Scegli il valore-persona stabilito dall’elenco.',
      'Recupera il modello ruolo-come-tema e applicalo alla voce successiva.',
      'Ascolta un ruolo stabilito seguito dal valore-persona, poi scegli la frase esatta.',
      'Un elenco d’iscrizione apre il campo persona per il ruolo studente universitario già stabilito. Dai l’identificazione focalizzata a memoria.',
    ],
    accepted: [
      "La persona appena selezionata riceve il focus e corrisponde al campo aperto dell’elenco.",
      "La persona già stabilita continua come tema invece di essere presentata come nuovo focus.",
      "La persona selezionata precede il marcatore di focus e la professione resta finale.",
      "La persona successiva è stabilita come tema e riceve la professione registrata.",
      "La risposta correttiva focalizza la persona che possiede davvero il ruolo stabilito.",
      "La correzione focalizza Suzuki come insegnante appena identificato.",
      "La professione è tema stabilito e Tanaka ne fornisce il valore-persona registrato.",
      "Il modello ruolo-come-tema recupera correttamente Yamada come avvocato.",
      "La frase scritta corrisponde alla struttura ruolo-stabilito ascoltata.",
      "L’autoidentificazione orale focalizza il parlante come valore-persona mancante.",
    ],
    retry: [
      "Usa il focus per la persona che riempie il campo aperto, poi controlla l’identità.",
      "La persona è già in discussione: continua quel tema invece di rifocalizzarla.",
      "Ordina gli stessi blocchi persona, marcatore e professione senza invertire ruolo e identità.",
      "Continua la persona stabilita e scegli la professione assegnata nell’elenco.",
      "Conserva la relazione di amicizia di Mari cambiando il tema sospeso in focus correttivo.",
      "Il candidato nomina il titolare sbagliato: mantieni が e focalizza la persona corretta.",
      "Mantieni tematica la professione e recupera dall’elenco il valore-persona.",
      "Applica il modello ruolo-tema alla voce dell’avvocato, non a un medico estraneo.",
      "Ascolta se il ruolo è stabilito o la persona è focalizzata prima di scegliere.",
      "Ricorda il campo personale aperto della registrazione e produci la risposta focalizzata.",
    ],
  }),
  ...semanticLessonCopy("topic-questions-3", {
    title: "Relazioni nominali con の, も e と",
    objective: "Costruire sintagmi possessivi, aggiungere elementi paralleli ed esprimere elenchi o compagnia.",
    main:
      "Tra due nomi, の collega possessore o attributo alla testa seguente. も aggiunge un elemento parallelo. と collega un elenco delimitato o una relazione di compagnia.",
    construction:
      "Mantieni il modificatore prima di の e la testa dopo. Metti l’elemento aggiunto prima di も. Metti と fra nomi elencati o dopo il compagno.",
    constraints:
      "の è soltanto possessivo o attributivo. と è soltanto nominale, di elenco o di compagnia; citazione e argomenti verbali restano successivi.",
    commonError:
      "Non invertire i nomi intorno a の, usare も senza contesto parallelo o trattare と come un e universale.",
    nearestContrast:
      "の costruisce un sintagma, も aggiunge un partecipante parallelo e と collega nomi pari o un compagno.",
    recap:
      "Recupera i quattro termini familiari e i due paesi; costruisci una frase con の, una con も, un elenco con と e una relazione di compagnia.",
    translations: [
      "È mio padre.",
      "È mia madre.",
      "È il padre di Tanaka (riferimento rispettoso).",
      "È la madre di Yamada (riferimento rispettoso).",
      "Anche mio padre è insegnante.",
      "Anche mia madre è medico.",
      "L’elenco comprende il Giappone e la Cina.",
      "L’elenco comprende Tokyo e Kyoto.",
      "Sono amico di Tanaka.",
      "Questa persona è mia amica o un mio amico.",
    ],
    purposes: [
      "Introduce の possessivo con il parlante e il padre.",
      "Cambia il nome testa conservando l'ordine del modificatore.",
      "Usa un possessore nominato senza cambiare la relazione の.",
      "Fornisce un secondo possessore nominato per contrasto.",
      "Introduce も additivo dopo una professione parallela.",
      "Varia il predicato additivo con l'identità di medico.",
      "Introduce と come elenco delimitato di paesi.",
      "Applica と nominale a un elenco di città.",
      "Introduce la lettura di compagnia con una persona nominata.",
      "Cambia prospettiva conservando la relazione di compagnia.",
    ],
    instructions: [
      'Una scheda familiare appartiene alla persona nominata. Scegli l’identificazione possessiva.',
      'Una scheda nominata richiede una relazione attributiva, non tematica. Scegli la forma.',
      'Disponi il possessore nominato prima del nome di parentela rispettoso.',
      'Una professione parallela è stabilita. Completa la frase familiare additiva.',
      'Trasforma la frase familiare tematica in frase additiva senza cambiare il fatto.',
      'La frase familiare mostrata usa la relazione nominale errata. Scegli la correzione.',
      'Due valori di paese devono restare elementi pari. Scegli l’elenco delimitato.',
      'Il contesto richiede compagnia, non possesso. Recupera la frase corrispondente.',
      'Ascolta l’elenco completo di due città e scegli la relazione esatta.',
      'Ricorda la relazione con la persona nominata e pronuncia la frase a memoria.',
    ],
    accepted: [
      "Il possessore nominato resta prima di の e il nome familiare lo segue.",
      "Possessore nominato e parentela rispettosa formano il sintagma attributivo previsto.",
      "I blocchi conservano l’ordine possessore-prima-della-testa.",
      "La madre si aggiunge all’insieme dei medici con も.",
      "La trasformazione cambia il tema in relazione additiva senza modificare il fatto.",
      "La correzione sostituisce la relazione di soggetto con quella attributiva.",
      "I due paesi restano elementi pari collegati da と di elenco.",
      "La relazione di compagnia resta distinta dal possesso.",
      "L’elenco scritto corrisponde alla relazione nominale ascoltata.",
      "La frase orale conserva la relazione di compagnia nominata.",
    ],
    retry: [
      "Mantieni il possessore nominato prima di の e la testa familiare dopo.",
      "Scegli la relazione attributiva; il tema assegna una struttura diversa.",
      "Usa gli stessi blocchi e mantieni per primo il possessore.",
      "Usa も soltanto dopo aver stabilito la professione parallela.",
      "Conserva il fatto familiare e cambia soltanto il tema in marcatura additiva.",
      "Il candidato identifica un soggetto invece della parentela: ripristina の.",
      "Mantieni と fra i due paesi pari; の creerebbe modificazione.",
      "Usa と di compagnia, non の possessivo, per la relazione.",
      "Riascolta il collegamento fra entrambi i nomi di città.",
      "Ricorda la frase di compagnia senza leggere opzioni.",
    ],
  }),
  ...semanticLessonCopy("topic-questions-4", {
    title: "Domande e finali interazionali",
    objective: "Fare domande con か, cercare accordo con ね e presentare un aggiornamento con よ.",
    main:
      "か finale marca una domanda aperta o sì-no. ね invita o riconosce accordo condiviso; よ presenta un’informazione come aggiornamento.",
    construction:
      "Completa prima il predicato nominale, poi colloca か, ね o よ alla fine secondo lo scopo interazionale.",
    constraints:
      "Usa un solo finale interazionale alla volta. ね non addolcisce ogni frase e よ non trasforma un’affermazione in domanda.",
    commonError:
      "Non mettere か nel sintagma, rispondere はい a un valore negato o usare ね per una correzione nuova.",
    nearestContrast:
      "か domanda, ね cerca allineamento e よ segnala un aggiornamento. Il と precedente resta nominale o di compagnia.",
    recap:
      "Chiedi だれですか e なまえはなんですか, conferma un paese e contrasta ね condiviso con よ informativo.",
    translations: [
      "Chi è?",
      "Il nome è Yuki?",
      "Il tuo paese è il Giappone?",
      "Che cos’è?",
      "Sì—sono Yuki, te lo dico.",
      "No—è il Giappone.",
      "È il Giappone, vero?",
      "È studente?",
      "È così, vero?",
    ],
    purposes: [
      "Introduce か finale in una domanda aperta d'identità.",
      "Controlla un nome con la stessa procedura interrogativa.",
      "Usa か per una conferma pratica del paese.",
      "Usa なん in una domanda aperta completa.",
      "Introduce よ come aggiornamento assertivo d’identità.",
      "Usa いいえ più よ per correggere il paese.",
      "Introduce ね per una conferma condivisa.",
      "Controlla il ruolo studente con una domanda sì-no completa.",
      "Usa ね in un breve riconoscimento condiviso.",
    ],
    instructions: [
      'La risposta fornisce un valore del profilo prima ignoto. Scegli la richiesta aperta che l’ha suscitata.',
      'Un visitatore diverso richiede una conferma sì-no su un campo del profilo. Scegli la domanda completa.',
      'Disponi il predicato nominale e colloca il marcatore interrogativo dopo la forma completa.',
      'Una fotografia richiede una conferma sì-no del ruolo, non una domanda aperta.',
      'Trasforma l’affermazione di conferma completa in una domanda di conferma.',
      'La conferma mostrata contraddice il profilo stabilito. Scegli la riparazione fattuale.',
      'Il parlante cerca una conferma condivisa del valore stabilito. Scegli il finale.',
      'Una domanda aperta ha ricevuto informazione nuova. Scegli l’aggiornamento assertivo.',
      'Ascolta se il breve riconoscimento cerca accordo o fornisce un aggiornamento.',
      'Ricorda la richiesta aperta sul profilo e formulala ad alta voce.',
    ],
    accepted: [
      "La domanda aperta richiede il campo mancante senza proporre un valore ipotetico.",
      "Il marcatore finale trasforma la frase completa in una conferma sì-no.",
      "Gli stessi blocchi nominali formano una domanda solo con か dopo la forma completa.",
      "Il nome di ruolo forma la domanda sì-no prevista.",
      "La trasformazione conserva il contenuto e cambia l’affermazione in domanda.",
      "La correzione rifiuta il valore falso con いいえ e fornisce il Giappone come aggiornamento.",
      "Il ね finale invita alla conferma condivisa del paese.",
      "Il よ finale presenta l’identità di Yuki come informazione nuova.",
      "Il riconoscimento scelto corrisponde al finale ascoltato.",
      "La domanda orale aperta richiede il valore mancante del profilo.",
    ],
    retry: [
      "Scegli una richiesta informativa aperta; un’ipotesi sì-no non completa questo campo.",
      "Mantieni intatta la frase e aggiungi il marcatore interrogativo soltanto alla fine.",
      "Usa gli stessi blocchi e mantieni か dopo il predicato completo.",
      "Scegli la conferma del ruolo, non l’alternativa aperta.",
      "Conserva l’espressione di conferma e cambia soltanto la forza della frase.",
      "Il valore è negato: servono いいえ, il valore stabilito e よ.",
      "Usa ね per l’allineamento; よ presenterebbe un aggiornamento.",
      "Usa よ dopo la risposta quando l’interlocutore riceve informazione nuova.",
      "Riascolta il finale e la sua forza interazionale.",
      "Ricorda la richiesta aperta senza leggere una risposta visibile.",
    ],
  }),
  "topic-questions-4-clarification-dialogue-outcome":
    "Gli interlocutori apprendono il nome Yuki, confermano il Giappone e l'amicizia con Tanaka.",
  "topic-questions-4-clarification-dialogue-turn-1-translation": "È Yuki?",
  "topic-questions-4-clarification-dialogue-turn-1-purpose":
    "Apre con una conferma rispettosa dell’identità.",
  "topic-questions-4-clarification-dialogue-turn-2-translation": "Sì, sono Yuki.",
  "topic-questions-4-clarification-dialogue-turn-2-purpose":
    "Conferma direttamente l’identità senza aggiungere un nuovo ruolo.",
  "topic-questions-4-clarification-dialogue-turn-3-translation":
    "Il paese di Yuki è il Giappone?",
  "topic-questions-4-clarification-dialogue-turn-3-purpose":
    "Stabilisce esplicitamente come tema il paese di Yuki e chiede conferma.",
  "topic-questions-4-clarification-dialogue-turn-4-translation":
    "Sì, è il Giappone.",
  "topic-questions-4-clarification-dialogue-turn-4-purpose":
    "Conferma il paese senza cambiare referente.",
  "topic-questions-4-clarification-dialogue-turn-5-translation":
    "Sei amico di Tanaka?",
  "topic-questions-4-clarification-dialogue-turn-5-purpose":
    "Controlla la relazione di compagnia.",
  "topic-questions-4-clarification-dialogue-turn-6-translation":
    "Sì, è corretto.",
  "topic-questions-4-clarification-dialogue-turn-6-purpose":
    "Chiude il chiarimento con una conferma assertiva.",
  "noun-toshi-meaning": "città",
  "name-sakura-meaning": "Sakura (nome usato prima di un titolo)",
  "name-ken-meaning": "Ken (nome usato prima di un titolo)",
  "name-mika-meaning": "Mika (nome usato prima di un titolo)",
  "name-sora-meaning": "Sora (nome usato prima di un titolo)",
  "name-haru-meaning": "Haru (nome usato prima di un titolo)",
  "name-ai-meaning": "Ai (nome usato prima di un titolo)",
  "noun-yuki-meaning": "Yuki",
  "noun-yuki-san-meaning": "Yuki (riferimento rispettoso in terza persona)",
};

const POLITE_VERBS_COPY_IT: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("polite-verbs-1", {
    title: "La forma dizionario serve per la consultazione",
    objective:
      "Riconoscere il lemma verbale e l'elemento predicativo finale senza assegnargli un tempo.",
    main:
      "La forma dizionario è la forma stabile con cui si consulta un verbo. Qui identifica il lessema d'azione; da sola non corrisponde a un «presente» sul modello italiano.",
    construction:
      "Leggi il lemma completo, trattalo come un solo elemento predicativo e usa l'etichetta di scena precedente soltanto come indizio.",
    constraints:
      "Queste schede sono etichette metalinguistiche, non frasi d'azione produttive. Particelle argomentali e finali cortesi arriveranno dopo.",
    commonError:
      "Non chiamare «presente» ogni forma dizionario e non dedurre la classe da un solo suono finale.",
    nearestContrast:
      "Una scheda nominale indica un partecipante o una cosa; un lemma verbale identifica il lessema predicativo di un'azione.",
    recap:
      "Recupera かく, よむ, のむ, かう, はたらく e あそぶ come lemmi completi di consultazione.",
    translations: [
      "かく è mostrato come forma da lemma.",
      "よむ è identificato come forma dizionario.",
      "のむ è il lemma di base.",
      "Il lemma di consultazione è かう.",
      "La forma dizionario è はたらく.",
      "Il lemma di base è あそぶ.",
      "かく è identificato come predicato.",
      "よむ è identificato come verbo.",
      "はたらく può occupare la posizione predicativa finale.",
      "L'elemento predicativo è あそぶ.",
    ],
    purposes: [
      "Presenta una forma completa di consultazione, non un tempo.",
      "Mantiene intatto il lemma per la consultazione.",
      "Separa l'identità del lemma dal riferimento temporale.",
      "Mostra un'etichetta metalinguistica esplicita prima del verbo.",
      "Riconosce il verbo più lungo come un solo lemma.",
      "Completa i sei lemmi di consultazione.",
      "Nomina il ruolo del verbo senza creare una pseudo-frase.",
      "Usa un'etichetta di analisi grammaticale esplicita.",
      "Riconosce l'elemento predicativo completo.",
      "Contrappone l'analisi predicativa a quella di consultazione.",
    ],
    instructions: [
      "L'elemento evidenziato riempie l'ultimo spazio in un modello di frase. Scegli l'annotazione corrispondente.",
      "Una bibliotecaria archivia la scheda mostrata in cima a una voce verbale. Scegli l'annotazione corrispondente.",
      "Un docente cerchia l'elemento che porta l'azione in un modello. Scegli la scheda corrispondente.",
      "La scheda di citazione invariata viene aggiunta a un glossario. Scegli l'annotazione corrispondente.",
      "Il foglio chiede come funziona l'elemento mostrato dentro una frase. Scegli la scheda completa in tre parti.",
      "Nel glossario un'intestazione precede il verbo in grassetto. Completa la scheda.",
      "L'annotazione mostrata appartiene al glossario, ma la scheda proviene da una frase. Ripara soltanto l'annotazione.",
      "Nel foglio di Yamada l'elemento evidenziato porta l'azione. Recupera la scheda annotata.",
      "Ascolta l'intera scheda di analisi di Satou, poi scegli la forma scritta.",
      "La forma mostrata è cerchiata dentro una frase modello. Da quel contesto, pronuncia la scheda di analisi nascosta con due etichette.",
    ],
    accepted: [
      "L'elemento della frase è annotato correttamente come じゅつご.",
      "La scheda di catalogo usa l'annotazione みだし.",
      "L'elemento che porta l'azione è marcato correttamente どうし.",
      "La scheda di citazione è marcata correttamente じしょ.",
      "La scheda scelta combina よむ con どうし e じゅつご.",
      "L'intestazione precede il verbo nella scheda completata.",
      "La riparazione cambia l'annotazione del glossario in quella del ruolo nella frase.",
      "La scheda recuperata marca l'elemento come どうし.",
      "L'analisi scelta corrisponde alla registrazione completa.",
      "La scheda pronunciata combina le etichette nascoste di verbo e predicato.",
    ],
    retry: [
      "Rileggi che cosa chiede di identificare il modello di frase.",
      "Usa il contesto della voce di catalogo, non quello della frase.",
      "Scegli l'annotazione grammaticale sostenuta dal cerchio del docente.",
      "Mantieni invariato il verbo e classifica l'uso della scheda.",
      "Usa il foglio della frase, non il contesto di archiviazione nel glossario.",
      "Usa come prova la disposizione mostrata nel glossario.",
      "Cambia soltanto l'annotazione incompatibile; conserva il verbo.",
      "Recupera l'analisi richiesta dal foglio.",
      "Riascolta l’intera registrazione e confronta le due schede complete.",
      "Usa il contesto della frase modello per ricostruire l’analisi nascosta; non è mostrata alcuna risposta.",
    ],
  }),
  ...semanticLessonCopy("polite-verbs-2", {
    title: "La classe verbale appartiene al lemma",
    objective:
      "Distinguere godan, ichidan, する e くる senza fidarsi ciecamente delle grafie in -iru/-eru.",
    main:
      "La classe verbale è informazione lessicale canonica. Molti verbi in -iru/-eru sono ichidan, ma un'eccezione esplicita come かえる resta godan.",
    construction:
      "Confronta la forma dizionario completa con la classe registrata e mantieni する e くる in classi speciali proprie.",
    constraints:
      "Il solo る finale non dimostra che un verbo sia ichidan. Qui si classificano forme, non si producono ancora temi.",
    commonError:
      "Non eliminare る da ogni verbo in -iru/-eru: il godan かえる deve seguire la classe registrata.",
    nearestContrast:
      "たべる è ichidan e かえる è godan, benché entrambi finiscano visibilmente in -eru.",
    recap:
      "Classifica およぐ e かえる come godan, たべる e みる come ichidan, e mantieni espliciti する/くる.",
    translations: [
      "およぐ è godan: la riga finale cambia nelle forme cortesi.",
      "かえる è un'eccezione in -eru già esaminata: è godan.",
      "たべる è ichidan.",
      "みる è ichidan.",
      "する ha una classe registrata propria.",
      "くる ha una classe registrata propria.",
      "Confronta たべる (ichidan) e かえる (godan).",
      "Confronta みる (ichidan) con lo speciale する.",
      "L'etichetta godan precede およぐ.",
      "L'etichetta della classe くる precede くる.",
    ],
    purposes: [
      "Classifica dalla classe registrata, non dal solo suono finale.",
      "Rende visibile l'eccezione esplicita in -eru.",
      "Contrappone un normale verbo ichidan in -eru a かえる.",
      "Aggiunge una forma ichidan in -iru.",
      "Nomina la classe speciale prima di derivarne il tema.",
      "Tiene くる separato dalle supposizioni basate sul suono finale.",
      "Mostra perché la grafia in -eru non basta a decidere la classe.",
      "Richiede la classe registrata per due finali simili.",
      "Applica il riconoscimento della classe in una scheda di analisi esplicita.",
      "Recupera くる con la propria etichetta di classe esplicita.",
    ],
    instructions: [
      "Una scheda di scena marina richiede un’analisi di classe. Scegli quella sostenuta dal lemma registrato.",
      "Una scheda sull’azione del guardare richiede un’analisi di classe. Scegli quella sostenuta.",
      "Una scheda di menu mostra il verbo usato per mangiare. Scegli la classificazione sostenuta dalla voce registrata.",
      "La scheda dell’eccezione in -eru richiede l’analisi registrata. Scegli quella sostenuta.",
      "La scheda è stata classificata solo dalla grafia. Scegli la riparazione.",
      "La tabella ha una riga separata per il verbo di base usato per fare un'azione. Scegli la voce registrata.",
      "La tabella ha una riga separata per il verbo usato quando qualcuno viene. Recupera la voce registrata.",
      "Una scheda sull’azione di leggere richiede un’analisi di classe. Scegli quella sostenuta.",
      "Ascolta quale delle due schede di analisi viene letta, poi scegli la corrispondenza scritta esatta.",
      "Dalla scheda verbale mostrata, pronuncia a memoria la scheda nascosta di analisi della classe.",
    ],
    accepted: [
      "およぐ è correttamente classificato come godan.",
      "みる segue la classe ichidan registrata.",
      "Il verbo del mangiare segue la classificazione ichidan registrata.",
      "かえる resta godan nonostante la grafia in -eru.",
      "La riparazione usa l'informazione lessicale della classe.",
      "する resta nella sua classe speciale esplicita.",
      "くる è recuperato come classe speciale propria.",
      "La scheda dell’azione leggere è analizzata correttamente.",
      "La scheda scritta corrisponde alla registrazione.",
      "La scheda orale dà l'analisi godan registrata per il verbo mostrato.",
    ],
    retry: [
      "Usa la voce registrata, non il significato della scena.",
      "Controlla la voce registrata completa, non soltanto il kana conclusivo.",
      "Confronta il lemma completo del mangiare con le due classificazioni proposte.",
      "Usa la nota di eccezione associata alla voce mostrata.",
      "Individua come errore l'ipotesi basata sul suffisso.",
      "Usa la riga della tabella riservata alla voce mostrata.",
      "Recupera la riga separata della tabella per la voce mostrata.",
      "Confronta il lemma completo registrato con entrambe le analisi proposte.",
      "Riascolta la registrazione completa e confronta le due schede scritte.",
      "Produci la scheda nascosta, non leggere una scelta.",
    ],
  }),
  ...semanticLessonCopy("polite-verbs-3", {
    title: "Costruire il tema cortese dalla classe canonica",
    objective:
      "Derivare i temi cortesi godan e ichidan e usare le corrispondenze esplicite する→し e くる→き.",
    main:
      "Il tema cortese è generato dalla classe registrata. Il godan passa alla riga in i, l'ichidan perde る, する usa し e くる usa き.",
    construction:
      "Parti dal lemma dizionario noto, applica una volta la regola della classe e fermati al tema; ます si aggiungerà nella prossima lezione.",
    constraints:
      "Il tema è un componente per costruire forme, non una frase produttiva completa.",
    commonError:
      "Non produrre すり o くり trattando i verbi speciali come godan regolari.",
    nearestContrast:
      "Il godan かえる dà かえり, mentre l'ichidan たべる dà たべ.",
    recap:
      "Recupera かき, たべ, し e き, poi estendi し ai tre composti in する noti.",
    translations: [
      "かく passa al tema cortese かき.",
      "まつ passa a まち.",
      "Il godan かえる passa a かえり.",
      "L'ichidan たべる passa a たべ.",
      "L'ichidan みる passa a み.",
      "する ha il tema cortese esplicito し.",
      "くる ha il tema cortese esplicito き.",
      "べんきょうする conserva il nome e usa し.",
      "でんわする diventa でんわし.",
      "さんぽする diventa さんぽし.",
    ],
    purposes: [
      "Deriva un tema godan con il motore canonico.",
      "Mostra il cambio di riga godan da つ a ち.",
      "Applica correttamente la classe eccezionale registrata.",
      "Rimuove il る dell'ichidan conosciuto.",
      "Conferma il tema ichidan breve.",
      "Insegna la corrispondenza richiesta する→し.",
      "Insegna la corrispondenza richiesta くる→き.",
      "Deriva un tema composto in する senza duplicare stringhe.",
      "Applica la stessa regola canonica al telefonare.",
      "Aggiunge un significato distinto con tema composto.",
    ],
    instructions: [
      "Una scheda sull’azione di scrivere richiede la base pre-ます generata. Scegli la derivazione corretta.",
      "Una scheda sull'azione di aspettare richiede la base pre-ます generata. Scegli la derivazione corretta.",
      "Disponi ogni tessera secondo la scheda delle forme di studio mostrata.",
      "Trasforma la scheda di consultazione dell’azione fare nell’analisi della base pre-ます nota.",
      "Completa la scheda mostrata del verbo venire con l'analisi della base pre-ます nota.",
      "La forma di ritorno segue la classe sbagliata. Scegli la riparazione.",
      "Una scheda sull’azione di telefonare richiede l’analisi della base pre-ます generata. Scegli la derivazione corretta.",
      "Recupera l'analisi della base pre-ます generata per il composto passeggiare mostrato.",
      "Ascolta quale delle due analisi proposte viene letta, poi scegli la corrispondenza scritta esatta.",
      "Dalla forma di consultazione di leggere, pronuncia l'analisi nascosta della base pre-ます.",
    ],
    accepted: [
      "Il motore godan produce かき.",
      "Il motore godan trasforma まつ in まち.",
      "Il tema di studio resta un solo elemento predicativo finale.",
      "La fonte する è trasformata correttamente in し.",
      "La corrispondenza esplicita di くる produce き.",
      "La riparazione segue il godan かえる e produce かえり.",
      "Il composto telefonico conserva でんわ e usa し.",
      "Il composto della passeggiata conserva さんぽ e usa し.",
      "La scheda scelta corrisponde alla registrazione.",
      "La scheda pronunciata riproduce l'analisi nascosta よむ→よみ.",
    ],
    retry: [
      "Riapplica alla forma di consultazione la regola registrata.",
      "Riapplica la regola registrata alla scheda dell’attesa.",
      "Ricontrolla come la scheda di studio corrisponde a un’analisi completa.",
      "Riapplica la corrispondenza eccezionale mostrata nella lezione; il suffisso della lezione successiva non appartiene a questo compito.",
      "Riapplica la corrispondenza separata mostrata per la scheda del venire.",
      "Usa la nota di eccezione registrata, non la scorciatoia apparentemente regolare.",
      "Riapplica la regola dei composti alla scheda del telefono.",
      "Riapplica la regola dei composti alla scheda della passeggiata.",
      "Riascolta l’intera registrazione e confronta le due schede complete.",
      "Ricorda e pronuncia la base pre-ます nascosta di leggere; non ci sono opzioni.",
    ],
  }),
  ...semanticLessonCopy("polite-verbs-4", {
    title: "Azioni cortesi non-passate con ます",
    objective:
      "Usare brevi frasi naturali in ます con temi noti e omissioni recuperabili.",
    main:
      "Aggiungi ます al tema cortese canonico. Con i verbi dinamici il contesto dà una lettura abituale o futura; qui non significa mai un'azione in corso adesso.",
    construction:
      "Usa un tema noto quando serve, oppure ometti un partecipante recuperabile, e metti alla fine il predicato in ます generato.",
    constraints:
      "Non aggiungere ancora を, に, へ, で, から o まで. Un argomento omesso resta implicito e non viene mai etichettato come esplicito.",
    commonError:
      "Non tradurre automaticamente ます come «sta facendo» e non aggiungerlo direttamente alla forma dizionario.",
    nearestContrast:
      "かく è il lemma; かき è il tema cortese; かきます è il predicato produttivo noto.",
    recap:
      "Usa ます per un'abitudine o un'azione programmata, scegliendo il tema esplicito solo quando serve al discorso.",
    translations: [
      "Tanaka si sveglia.",
      "Satou cammina.",
      "Suzuki ascolta.",
      "Mari lo preparerà.",
      "Yuki riposa regolarmente.",
      "Il mio amico dormirà.",
      "L’insegnante parlerà.",
      "Andrò. (persona e meta recuperabili)",
    ],
    purposes: [
      "Usa il tema ichidan noto più ます.",
      "Costruisce un predicato cortese godan dal tema generato.",
      "Lascia inespresso un tema recuperabile senza dichiararlo esplicito.",
      "Usa il contesto per una lettura futura del non-passato.",
      "Aggiunge un predicato abituale di riposo con tema esplicito.",
      "Usa il nuovo predicato dormire per un piano futuro.",
      "Usa un tema esplicito noto con il nuovo predicato parlare.",
      "Introduce andare senza nominare una meta prima delle particelle argomentali.",
    ],
    instructions: [
      "La sveglia di chi studia suona ogni giorno alle sette. Scegli l'enunciato cortese completo adatto alla routine.",
      "La scheda del percorso di Yamada è datata domani. Scegli l'enunciato cortese completo.",
      "È mostrato il piano di percorso di Yamada. Ordina tutte le tessere in una frase completa.",
      "Suzuki ascolta per primo; l'elenco aggiunge Yamada alla stessa routine. Trasforma la forma mostrata nell'enunciato completo di Yamada.",
      "Mari preparerà un oggetto; il programma aggiunge Tanaka allo stesso piano. Completa l'enunciato di Tanaka.",
      "La forma completa mostrata collega il finale cortese alla base sbagliata. Ripara soltanto questo difetto.",
      "Yuki riposa per prima; l'elenco aggiunge l'insegnante alla stessa routine. Scegli l'enunciato dell'insegnante.",
      "L'amico dormirà per primo; il programma aggiunge Mari allo stesso piano. Recupera l'enunciato di Mari.",
      "Ascolta se la frase sul lavoro dell’insegnante è un’affermazione o una domanda, poi scegli la corrispondenza scritta esatta.",
      "Dall'indizio studente, pronuncia la frase nascosta sull'attesa.",
    ],
    accepted: [
      "Il predicato in ます esprime la routine di chi parla.",
      "La forma completa corrisponde al piano di viaggio indicato per Yamada.",
      "Il tema esplicito precede il predicato camminare finale.",
      "Yamada è aggiunto con も e il tema generato prende correttamente ます.",
      "Tanaka è aggiunto con も al piano futuro già stabilito.",
      "La riparazione usa il predicato parlare richiesto dal contesto.",
      "L'insegnante è aggiunto con も alla routine di riposo già stabilita.",
      "Mari è aggiunta con も al piano di sonno già stabilito.",
      "La frase scelta corrisponde alla registrazione completa.",
      "L'obiettivo orale è nascosto, fondato e completo.",
    ],
    retry: [
      "Usa l'enunciato cortese completo per la routine del risveglio indicata.",
      "Usa la scheda datata del percorso di Yamada e scegli la forma completa.",
      "Ricontrolla come il percorso mostrato corrisponde a una frase completa.",
      "Usa il contesto dell’elenco per ricostruire l’enunciato completo di Yamada.",
      "Usa il contesto del programma per ricostruire l’enunciato completo di Tanaka.",
      "Confronta la forma malformata mostrata con la riparazione di un solo difetto.",
      "Usa il contesto dell’elenco per ricostruire l’enunciato completo dell’insegnante.",
      "Recupera il piano aggiuntivo di Mari per dormire.",
      "Riascolta tutta la registrazione e confronta le due frasi scritte.",
      "Ricorda dall'indizio la frase nascosta sull'attesa.",
    ],
  }),
  "polite-verbs-4-practical-dialogue-outcome":
    "Conferma le routine di tre persone usando soltanto temi e schemi in ます già noti.",
  "polite-verbs-4-practical-dialogue-turn-1-translation": "Yuki lavora?",
  "polite-verbs-4-practical-dialogue-turn-1-purpose":
    "Apre con un tema noto e una domanda cortese sulla routine.",
  "polite-verbs-4-practical-dialogue-turn-2-translation": "Sì, lavora.",
  "polite-verbs-4-practical-dialogue-turn-2-purpose":
    "Omette il tema Yuki recuperabile nella risposta.",
  "polite-verbs-4-practical-dialogue-turn-3-translation": "Anche Yamada cammina?",
  "polite-verbs-4-practical-dialogue-turn-3-purpose":
    "Passa alla routine di cammino stabilita per Yamada.",
  "polite-verbs-4-practical-dialogue-turn-4-translation": "Sì, Yamada cammina.",
  "polite-verbs-4-practical-dialogue-turn-4-purpose":
    "Conferma il nuovo referente senza contraddire la routine di lavoro.",
  "polite-verbs-4-practical-dialogue-turn-5-translation": "Mari studia?",
  "polite-verbs-4-practical-dialogue-turn-5-purpose":
    "Controlla un'altra routine nota senza aggiungere particelle argomentali.",
  "polite-verbs-4-practical-dialogue-turn-6-translation": "Sì, studia.",
  "polite-verbs-4-practical-dialogue-turn-6-purpose":
    "Chiude con omissione naturale e la particella assertiva nota.",
  "verb-kaku-meaning": "scrivere",
  "verb-yomu-meaning": "leggere",
  "verb-nomu-meaning": "bere",
  "verb-kau-meaning": "comprare",
  "verb-hataraku-meaning": "lavorare",
  "verb-asobu-meaning": "giocare; trascorrere il tempo libero",
  "verb-oyogu-meaning": "nuotare",
  "verb-taberu-meaning": "mangiare",
  "verb-miru-meaning": "vedere; guardare",
  "verb-kaeru-meaning": "tornare; rientrare a casa",
  "verb-suru-meaning": "fare",
  "verb-kuru-meaning": "venire",
  "verb-benkyou-suru-meaning": "studiare",
  "verb-denwa-suru-meaning": "telefonare",
  "verb-sanpo-suru-meaning": "fare una passeggiata",
  "verb-yasumu-meaning": "riposare; prendersi un giorno libero",
  "verb-okiru-meaning": "svegliarsi",
  "verb-neru-meaning": "dormire; andare a letto",
  "verb-aruku-meaning": "camminare",
  "verb-kiku-meaning": "ascoltare; chiedere",
  "verb-tsukuru-meaning": "fare; preparare",
  "verb-au-meaning": "incontrare",
  "verb-utau-meaning": "cantare",
  "verb-hanasu-meaning": "parlare",
  "verb-matsu-meaning": "aspettare",
  "verb-classes-conjugation-title": "Classi verbali e coniugazione",
  "tense-polarity-title": "Tempo e polarità",
  "reference-particle-frames-title": "Schemi particellari del predicato",
};

const ARGUMENT_PARTICLES_COPY_IT: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("argument-particles-1", {
    title: "Il predicato ammette il proprio tema",
    objective:
      "Usare を, pronunciato o, per il tema transitivo e capire la topicalizzazione dell'oggetto con は.",
    main:
      "Un senso predicativo transitivo ammette un tema. Il marcatore esplicito normale è を (o); quando il tema diventa tema discorsivo, は sostituisce il を visibile, mentre il predicato continua ad ammettere lo stesso ruolo.",
    construction:
      "Scegli prima il senso predicativo, individua il tema e poi usa を oppure lo schema esplicito del tema topicalizzato.",
    constraints:
      "を si pronuncia o. は non è uno scambio decorativo: topicalizza il tema ammesso e cambia l'organizzazione discorsiva.",
    commonError:
      "Non scegliere la particella da una preposizione italiana e non lasciare を accanto a は sullo stesso tema.",
    nearestContrast:
      "ごはんをたべます presenta il pasto come oggetto; ごはんはたべます rende tema quello stesso argomento ammesso.",
    recap:
      "Recupera i sensi di mangiare, bere, scrivere, comprare, leggere e guardare, poi marca o topicalizza i temi.",
    translations: [
      "Mangio riso / un pasto.",
      "Bevo acqua.",
      "Scrivo una lettera.",
      "Compro della frutta.",
      "Leggo una rivista.",
      "Leggo un libro.",
      "Guardo una fotografia.",
      "Quanto alla frutta, la compro.",
      "Quanto all'acqua, la bevo.",
      "Quanto alla lettera, la scriverò.",
    ],
    purposes: [
      "Segna con を il tema ammesso da mangiare.",
      "Abbina il senso bere al suo tema esplicito.",
      "Usa il senso scrivere che ammette un tema.",
      "Usa を per la cosa comprata.",
      "Collega la rivista al predicato leggere.",
      "Recupera un nome noto nello stesso schema ammesso.",
      "Usa il senso guardare, non una regola basata su preposizioni.",
      "Sostituisce を esplicito con は conservando la cosa comprata.",
      "Contrappone un tema topicalizzato al normale を.",
      "Mostra un contesto futuro recuperabile con topicalizzazione.",
    ],
    instructions: [
      "La scheda dei compiti identifica chi studia come persona che mangia e introduce il riso come informazione nuova. Scegli la frase neutra.",
      "L'acqua è un'informazione nuova nell'ordine di Tanaka. Scegli l'organizzazione neutra.",
      "Disponi ogni tessera secondo la scheda della lettera mostrata.",
      "Lo scontrino di Satou introduce la frutta come informazione nuova. Scegli la frase neutra sull'acquisto.",
      "La scheda dei compiti identifica chi studia come persona che compra e la rivista è già al centro del discorso. Cambia soltanto il suo stato informativo.",
      "L'acquisto del libro dovrebbe essere neutro, ma la scheda mostrata rende il libro contrastivo. Ripara soltanto l'organizzazione.",
      "La fotografia è un'informazione nuova nel resoconto di Tanaka. Scegli l'organizzazione neutra.",
      "L’elenco identifica chi studia come autore e introduce la lettera come informazione nuova. Recupera la frase neutra.",
      "Ascolta se l'acquisto dell'acqua di Mari è neutro o già al centro del discorso, poi scegli la forma scritta.",
      "Dall'indizio rivista, pronuncia la frase nascosta di Yamada.",
    ],
    accepted: [
      "Mangiare ammette il tema riso e il relativo を.",
      "Il predicato bere resta fisso e l'informazione nuova usa l'organizzazione neutra con を.",
      "Tutte le tessere sono usate e il predicato resta finale.",
      "La frutta è marcata come tema di comprare.",
      "L'acquisto resta fisso mentre は marca la rivista già stabilita.",
      "La riparazione mantiene fisso comprare e ripristina l'organizzazione neutra dell'oggetto.",
      "Guardare ammette il tema fotografia.",
      "La frase recuperata riguarda la lettera prevista.",
      "La registrazione introduce l'acqua in modo neutro con を.",
      "L'obiettivo orale mantiene la pronuncia o di を.",
    ],
    retry: [
      "Mantieni fissi chi studia e mangiare; segui il contesto di informazione nuova.",
      "Mantieni fisso bere e segui il contesto di informazione nuova.",
      "Ricontrolla come la scheda della lettera corrisponde a una frase completa.",
      "Mantieni fissi Satou e comprare; segui il contesto di informazione nuova.",
      "Usa lo stato informativo della scheda e confronta la fonte con entrambi i risultati.",
      "Mantieni fisso l'acquisto del libro e ripara soltanto l'organizzazione neutra o topicale.",
      "Mantieni fisso guardare e segui il contesto di informazione nuova.",
      "Usa lo stato informativo dell’elenco mantenendo invariati tutti i partecipanti.",
      "Riascolta tutta la registrazione e confronta le due frasi complete.",
      "Ricorda la frase nascosta; la risposta non è mostrata.",
    ],
  }),
  ...semanticLessonCopy("argument-particles-2", {
    title: "Meta に e direzione へ nel movimento",
    objective:
      "Scegliere に di meta o へ direzionale, pronunciato e, dal senso di movimento previsto.",
    main:
      "I verbi di movimento possono presentare una destinazione come meta concreta con に oppure come direzione/percorso con へ. Il senso predicativo e la prospettiva voluta autorizzano la scelta.",
    construction:
      "Individua andare, venire o tornare; decidi se il messaggio mette a fuoco l'arrivo o la direzione; poi metti に o へ dopo la destinazione.",
    constraints:
      "へ si pronuncia e. Negli obiettivi proposti に e へ non sono sostituti decorativi.",
    commonError:
      "Non memorizzare entrambe le particelle come un unico «a» italiano e non scambiarle senza cambiare prospettiva.",
    nearestContrast:
      "えきにいきます indica la stazione come meta; えきへいきます presenta il movimento in quella direzione.",
    recap:
      "Usa il senso esatto di andare, venire o tornare con una meta o una direzione ammessa.",
    translations: [
      "Vado alla stazione.",
      "Vado all'università.",
      "Mi dirigo verso l'ospedale.",
      "Mi dirigo verso il negozio.",
      "Tanaka viene a scuola.",
      "Tanaka torna a casa.",
      "Anche Suzuki si dirige verso Tokyo.",
      "Mari viene a Kyoto?",
      "Yamada si dirige verso Osaka.",
      "Tornano a casa.",
    ],
    purposes: [
      "Usa に per una meta concreta ammessa da andare.",
      "Aggiunge il tema esplicito del parlante a un movimento verso la meta.",
      "Usa へ, pronunciato e, per la direzione.",
      "Mantiene distinto へ direzionale da に di meta.",
      "Il senso venire ammette la meta d'arrivo esplicita di Tanaka.",
      "Presenta casa come meta naturale del ritorno di Tanaka.",
      "Combina un tema additivo con una direzione di percorso.",
      "Trasforma la meta d'arrivo in una domanda di conferma.",
      "Presenta come informazione nuova la direzione di Yamada.",
      "Usa casa come meta naturale del ritorno.",
    ],
    instructions: [
      "Il biglietto indica la stazione come fermata in cui termina il viaggio. Scegli la frase corrispondente.",
      "La freccia del percorso di Tanaka prosegue oltre l'università. Scegli la frase corrispondente.",
      "Yamada ha un appuntamento in ospedale, dove termina il viaggio. Ordina ogni tessera.",
      "Completa il percorso di Satou verso il negozio.",
      "La mappa aggiornata di Suzuki mostra una freccia che prosegue verso la scuola invece di fermarsi lì. Trasforma la frase.",
      "L'itinerario di Mari mostra soltanto un proseguimento, anche se il viaggio termina a casa. Ripara soltanto la prospettiva.",
      "La freccia sulla mappa di Tanaka punta verso Tokyo e prosegue oltre. Scegli la frase.",
      "Il biglietto di Yamada indica Kyoto come fermata in cui termina il viaggio. Recupera il percorso.",
      "Ascolta quale lettura del percorso presenta la registrazione, poi scegli la corrispondenza scritta esatta.",
      "La freccia sulla mappa di Suzuki punta verso l'ospedale. Pronuncia la frase nascosta.",
    ],
    accepted: [
      "La stazione è ammessa come meta di andare.",
      "へ direzionale corrisponde alla prospettiva di percorso.",
      "La particella resta unita al blocco ospedale.",
      "Il negozio è presentato come direzione di Satou.",
      "La frase trasformata usa il senso direzionale noto.",
      "La riparazione cambia soltanto la prospettiva da direzione a meta.",
      "Tokyo è presentata come direzione.",
      "Kyoto è la meta dell'evento di andare di Yamada.",
      "La registrazione corrisponde alla frase con casa come meta.",
      "Nell'obiettivo orale へ si pronuncia e.",
    ],
    retry: [
      "Rileggi se il biglietto descrive una fermata o un percorso aperto.",
      "Usa la freccia che prosegue come prova del viaggio.",
      "Ricontrolla come l’appuntamento mostrato corrisponde a una frase completa.",
      "Usa come prova la freccia sulla scheda del percorso di Satou.",
      "Cambia la prospettiva ammessa, non soltanto il segno grafico.",
      "Controlla l’intero itinerario rispetto a entrambe le alternative complete.",
      "Usa come prova la freccia della mappa che prosegue.",
      "Usa la condizione di fermata del biglietto e confronta i due percorsi completi.",
      "Riascolta tutta la registrazione e confronta le due frasi scritte sul viaggio.",
      "Usa la freccia della mappa per ricostruire tutto il percorso nascosto; non sono mostrate opzioni.",
    ],
  }),
  ...semanticLessonCopy("argument-particles-3", {
    title: "Luogo d'azione e mezzo con で",
    objective:
      "Distinguere dove avviene un'azione dal mezzo o strumento usato, grazie a predicato e contesto.",
    main:
      "La stessa forma で può segnare un luogo d'azione o un mezzo. Lo schema del predicato e la situazione indicano quale ruolo è esplicito.",
    construction:
      "Chiedi se il nome indica l'ambiente dell'azione o ciò che viene usato per compierla, poi scegli il senso predicativo ammesso.",
    constraints:
      "Un nome di luogo non determina da solo il ruolo. Il treno è un mezzo nel viaggio; la biblioteca è un luogo per studiare.",
    commonError:
      "Non tradurre ogni frase in で con «a» né ogni mezzo di trasporto con «in» senza controllare il predicato.",
    nearestContrast:
      "としょかんでべんきょうします dà un luogo d'azione; でんしゃでいきます dà un mezzo.",
    recap:
      "Usa で di luogo per studio, lavoro, gioco o pasto, e で di mezzo per trasporto o strumento.",
    translations: [
      "Studio in biblioteca.",
      "Gioco al parco.",
      "Lavoro all'università.",
      "Lavoro al negozio.",
      "Vado in treno.",
      "Vado in bicicletta.",
      "Scrivo con una matita.",
      "Lavoro all'ospedale.",
      "Gioco a casa.",
      "Torno in bicicletta.",
    ],
    purposes: [
      "Segna il luogo in cui avviene lo studio.",
      "Usa で come luogo dell'azione.",
      "Il senso lavorare ammette un luogo d'azione.",
      "Cambia il luogo di lavoro senza cambiare lo schema.",
      "Usa で per un mezzo di trasporto.",
      "Contrappone un altro mezzo a un luogo d'azione.",
      "Usa il contesto strumentale per scegliere で di mezzo.",
      "Aggiunge un terzo luogo di lavoro fondato.",
      "Mostra che sono predicato e contesto a scegliere il ruolo.",
      "Applica で di mezzo al ritorno.",
    ],
    instructions: [
      "La nota dice che chi studia resta in biblioteca mentre scrive. Scegli la frase corrispondente.",
      "Tanaka resta al negozio mentre scrive la sua nota. Scegli la frase corrispondente.",
      "Il biglietto di Yamada mostra un viaggio in treno. Ordina ogni tessera nella frase corrispondente.",
      "L'abbonamento di Satou mostra l'icona di una bicicletta. Scegli la frase corrispondente.",
      "La nota di Suzuki dice che la matita è ciò che usa per scrivere. Scegli la frase corrispondente.",
      "Mari scrive mentre si trova al negozio, ma l'annotazione mostrata indica qualcosa che usa. Ripara soltanto l'annotazione.",
      "Recupera la frase di Satou sulla scrittura mentre si trova al parco.",
      "Completa la frase di Yamada sulla scrittura mentre si trova a scuola.",
      "Ascolta se Mari viaggia in treno o in bicicletta, poi scegli la forma scritta.",
      "Pronuncia la frase nascosta di Mari con la matita.",
    ],
    accepted: [
      "La biblioteca è ammessa come luogo d'azione per la scrittura.",
      "Il negozio è ammesso come luogo della scrittura di Tanaka.",
      "Il treno resta il blocco del mezzo e il verbo è finale.",
      "La bicicletta è esplicita come mezzo di Satou.",
      "La matita è uno strumento: questo è で di mezzo.",
      "La riparazione cambia soltanto l’etichetta nell’analisi di luogo d’azione sostenuta.",
      "Il parco è recuperato come luogo della scrittura di Satou.",
      "La scuola è il luogo della scrittura di Yamada.",
      "La forma scritta corrisponde alla registrazione.",
      "La risposta orale mantiene fondato il ruolo strumentale.",
    ],
    retry: [
      "Usa la distinzione tra permanenza e strumento nella nota e confronta le due frasi.",
      "Usa la situazione di scrittura dichiarata per Tanaka e confronta le due frasi.",
      "Ricontrolla come il biglietto mostrato corrisponde a una frase completa.",
      "Usa l’icona sull’abbonamento di Satou e confronta i due percorsi.",
      "Usa la situazione di scrittura dichiarata da Suzuki e confronta le due frasi.",
      "Individua l'etichetta incompatibile senza cambiare la forma di scrivere.",
      "Usa i dettagli dichiarati e recupera la frase completa.",
      "Usa i dettagli dichiarati per Yamada e confronta le due frasi.",
      "Riascolta tutta la registrazione e confronta i due percorsi scritti.",
      "Ricostruisci la frase nascosta di scrittura dall’indizio mostrato.",
    ],
  }),
  ...semanticLessonCopy("argument-particles-4", {
    title: "Scelta della particella guidata dal predicato",
    objective:
      "Scegliere を, に, へ o で dal senso verbale e dal ruolo esplicito in contesti misti.",
    main:
      "La scelta parte dal senso predicativo e dai suoi ruoli semantici. Le traduzioni italiane controllano il significato, ma non formano un elenco atomico di preposizioni.",
    construction:
      "Individua l'evento, nomina il ruolo esplicito, consulta lo schema ammesso e soltanto allora realizza la particella.",
    constraints:
      "Lo scambio di un segno è rifiutato quando il senso esatto non lo ammette.",
    commonError:
      "Non scegliere prima una particella familiare per poi forzare il resto della frase.",
    nearestContrast:
      "かさをかいます ha un tema comprato; しょくどうでたべます ha il luogo in cui si mangia.",
    recap:
      "Parti dal predicato: tema, meta, direzione, luogo d'azione e mezzo hanno realizzazioni ammesse.",
    translations: [
      "Mangio in mensa.",
      "Lavoro in ufficio.",
      "Compro un ombrello.",
      "Scrivo un diario.",
      "Mi dirigo verso la stazione.",
      "Vengono in ufficio.",
      "Torno in treno.",
      "Quanto al libro, lo leggo.",
      "Mangio della frutta.",
      "Mangio al parco.",
    ],
    purposes: [
      "Seleziona で di luogo dal mangiare in un locale.",
      "Abbina il luogo al senso lavorare.",
      "Il senso comprare seleziona を di tema.",
      "Il senso scrivere seleziona il diario come tema.",
      "Sceglie へ direzionale per una prospettiva di percorso.",
      "Sceglie に di meta per un punto d'arrivo.",
      "Seleziona で di mezzo dal contesto di trasporto.",
      "Mantiene il tema di leggere ammesso sotto topicalizzazione.",
      "Recupera il tema di mangiare con un oggetto diverso.",
      "Recupera で di luogo attraverso il posto del pasto.",
    ],
    instructions: [
      "Il viaggio è assegnato a chi studia e il biglietto indica la mensa come luogo in cui termina. Scegli la frase corrispondente.",
      "Tanaka resta in ufficio mentre scrive. Scegli la frase corrispondente.",
      "Disponi ogni tessera secondo la scheda dell'ombrello di Yamada.",
      "Il resoconto identifica Satou come persona che mangia e introduce il riso come informazione nuova. Completa la frase neutra.",
      "La freccia sulla mappa di Suzuki prosegue verso e oltre la stazione. Scegli la frase corrispondente.",
      "La scheda sulla scrivania di Mari contraddice il nome implausibile nella frase mostrata. Sostituisci soltanto quel nome.",
      "Il diario è già al centro del discorso. Recupera la frase di lettura corrispondente.",
      "Il biglietto di Yamada indica l'università come fermata in cui termina il viaggio. Completa la scheda.",
      "Ascolta quale lettura del percorso presenta la registrazione, poi scegli la corrispondenza scritta esatta.",
      "Pronuncia la frase nascosta di Suzuki sull'ombrello.",
    ],
    accepted: [
      "La mensa è il punto d’arrivo del viaggio assegnato a chi studia.",
      "L'ufficio è ammesso come luogo della scrittura di Tanaka.",
      "L'ombrello resta il tema comprato.",
      "Il riso è introdotto in modo neutro nella frase in cui Satou mangia.",
      "へ direzionale corrisponde al percorso.",
      "La matita è un mezzo coerente per scrivere.",
      "Il diario resta un tema di lettura ammesso sotto は.",
      "L'università è la meta di andare.",
      "La frase scelta corrisponde alla registrazione completa.",
      "La risposta orale usa を con pronuncia o.",
    ],
    retry: [
      "Usa la situazione di viaggio dichiarata e confronta le due frasi complete.",
      "Usa la distinzione tra permanenza e strumento e confronta le due frasi di scrittura.",
      "Ricontrolla come la scheda dell’acquisto corrisponde a una frase completa.",
      "Usa il resoconto e confronta i due enunciati completi sul pasto.",
      "Usa la freccia che prosegue e confronta le due prospettive di percorso.",
      "Usa la scheda sulla scrivania per individuare l’unico elemento implausibile.",
      "Mantieni fisso leggere e presenta il diario come elemento già stabilito.",
      "Usa la condizione di fermata del biglietto e confronta le due schede.",
      "Riascolta tutta la registrazione e confronta i due percorsi scritti.",
      "Ricorda l'obiettivo nascosto sull'acquisto.",
    ],
  }),
  "verb-iku-meaning": "andare",
  "noun-gohan-meaning": "riso cotto; pasto",
  "noun-mizu-meaning": "acqua",
  "noun-tegami-meaning": "lettera",
  "noun-kudamono-meaning": "frutta",
  "noun-zasshi-meaning": "rivista",
  "noun-eki-meaning": "stazione",
  "noun-daigaku-meaning": "università",
  "noun-byouin-meaning": "ospedale",
  "noun-mise-meaning": "negozio",
  "noun-toshokan-meaning": "biblioteca",
  "noun-kouen-meaning": "parco",
  "noun-densha-meaning": "treno",
  "noun-jitensha-meaning": "bicicletta",
  "noun-enpitsu-meaning": "matita",
  "noun-shokudou-meaning": "mensa; sala da pranzo",
  "noun-jimusho-meaning": "ufficio",
  "noun-kasa-meaning": "ombrello",
  "noun-nikki-meaning": "diario",
};

const TIME_MOVEMENT_COPY_IT: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("time-movement-1", {
    title: "Il non-passato dinamico indica abitudine o futuro",
    objective:
      "Usare ふだん o まいしゅう rispetto ad あした per interpretare i predicati dinamici in ます come abituali o futuri.",
    main:
      "Prove temporali giapponesi reali selezionano la lettura: ふだん e まいしゅう sostengono la ricorrenza, mentre あした sostiene un evento futuro. Nessuna descrive un'azione in corso.",
    construction:
      "Leggi prima l'espressione temporale visibile, mantieni invariato il predicato e allinea il significato abituale o futuro in italiano e inglese.",
    constraints:
      "Ogni obiettivo è esplicitamente abituale o futuro; nessuno descrive un'azione in corso.",
    commonError:
      "Non tradurre automaticamente ogni forma in ます con «stare + gerundio».",
    nearestContrast:
      "ふだんあるきます è abituale; あしたあるきます è futuro e nessuna delle due forme descrive un camminare in corso.",
    recap:
      "Usa la prova temporale giapponese visibile per giustificare ogni lettura abituale o futura.",
    translations: [
      "Tanaka corre di solito.",
      "Satou lavorerà domani.",
      "Mari cucina ogni settimana.",
      "Yuki uscirà domani.",
      "Camminerò domani. (parlante recuperabile)",
      "Studieremo domani. (gruppo recuperabile)",
      "Suzuki cucina ogni settimana.",
      "Il mio amico esce ogni settimana.",
      "Riposo ogni settimana.",
      "Suzuki dormirà domani.",
    ],
    purposes: [
      "Usa ふだん come prova reale dell'abitudine.",
      "Usa あした come prova reale del futuro.",
      "Aggiunge una prova abituale a un composto in する.",
      "Usa un tempo futuro senza significato progressivo.",
      "Mostra il futuro non-passato con omissione naturale.",
      "Mantiene implicito il gruppo del piano.",
      "Combina un tema esplicito con la prova settimanale.",
      "Contrappone un'uscita ricorrente al piano di domani.",
      "Ripassa riposare con una prova temporale ricorrente.",
      "Usa un evento di sonno programmato, mai una lettura progressiva.",
    ],
    instructions: [
      "La scheda di chi studia indica la corsa come routine abituale. Scegli la frase corrispondente.",
      "L'impegno di lavoro di Tanaka è datato domani. Scegli la frase corrispondente.",
      "Ordina ogni tessera sulla scheda della cucina settimanale di Yamada.",
      "Il biglietto di Satou è datato domani. Completa la frase corrispondente.",
      "La scheda della corsa di Suzuki è archiviata sotto ogni settimana. Scegli la frase corrispondente.",
      "L'uscita di Mari è prenotata per domani, ma la frase mostrata dice ogni settimana. Ripara soltanto l'espressione temporale.",
      "Il calendario di Yuki segna riposo ogni settimana. Recupera la frase corrispondente.",
      "L'ora di dormire dell'amico è nel programma di domani. Completa la frase corrispondente.",
      "Ascolta se Yamada studia domani o ogni settimana, poi scegli la forma scritta.",
      "L'uscita di Suzuki è nel calendario di domani. Pronuncia la frase nascosta.",
    ],
    accepted: [
      "ふだん fornisce una prova esplicita della corsa abituale.",
      "あした fornisce una prova esplicita del piano di lavoro di Tanaka.",
      "L'espressione settimanale e il tema precedono il predicato cucinare.",
      "La frase di Satou contiene la prova temporale di domani.",
      "La frase di Suzuki contiene la prova temporale settimanale.",
      "La riparazione sostituisce soltanto l'espressione settimanale con domani.",
      "Il riposo regolare di Yuki è recuperato con まいしゅう.",
      "Il sonno dell'amico è fondato da あした.",
      "La frase sullo studio di domani corrisponde alla registrazione.",
      "L'obiettivo orale è futuro, non progressivo.",
    ],
    retry: [
      "Rileggi se la scheda descrive una routine o un piano datato.",
      "Usa la data dell’impegno di lavoro e confronta le due frasi complete.",
      "Ricontrolla come la scheda della cucina corrisponde a una frase completa.",
      "Usa la data stampata sul biglietto di Satou e confronta le due frasi.",
      "Usa la categoria di archiviazione della scheda di Suzuki e confronta le due frasi.",
      "Usa il conflitto nella prenotazione e cambia soltanto la prova temporale incompatibile.",
      "Usa i segni di ricorrenza sul calendario e recupera la frase completa.",
      "Usa la data nel programma del sonno e confronta le due frasi.",
      "Riascolta tutta la registrazione e confronta le due frasi scritte.",
      "Ricostruisci la frase nascosta sull’uscita da entrambi gli indizi mostrati.",
    ],
  }),
  ...semanticLessonCopy("time-movement-2", {
    title: "Tempo specifico, tempo relativo e limiti",
    objective:
      "Usare に con tempi specifici, ometterlo dopo tempi relativi e delimitare tempo o movimento con から/まで.",
    main:
      "I tempi specifici programmati possono prendere に. Espressioni relative come きょう e あした normalmente non richiedono に. Qui から e まで segnano soltanto limiti temporali o di movimento.",
    construction:
      "Classifica l'espressione temporale, aggiungi に solo nell'obiettivo di tempo specifico e usa から per l'inizio e まで per il termine.",
    constraints:
      "Qui から non indica mai una causa e まで non introduce estensioni avanzate. I limiti sono espliciti nel contesto.",
    commonError:
      "Non aggiungere automaticamente に dopo きょう o あした e non trattare から/まで come una coppia vaga.",
    nearestContrast:
      "しちじにおきます usa に di tempo specifico; きょうやすみます usa un tempo relativo senza に.",
    recap:
      "Distingui un punto temporale, un tempo relativo, un intervallo e un percorso.",
    translations: [
      "Mi sveglio alle sette.",
      "Uscirò alle nove.",
      "Studierò lunedì.",
      "Oggi riposerò.",
      "Andrò domani.",
      "Lavorerò dalle nove alle cinque.",
      "Viaggerò da Tokyo fino a Kyoto.",
      "Lavorerò dalle sette.",
      "Studierò fino alle cinque.",
      "Tornerò dalla stazione.",
    ],
    purposes: [
      "Usa に con un'ora specifica.",
      "Collega un'ora specifica a una partenza puntuale.",
      "Usa に con un giorno programmato.",
      "Mostra che il relativo きょう non richiede に.",
      "Omette に dopo il tempo relativo あした.",
      "Delimita il lavoro nel tempo con から e まで.",
      "Usa soltanto i limiti di origine e arrivo del movimento.",
      "Usa から come inizio temporale, non come causa.",
      "Usa まで per un limite temporale.",
      "Usa から per l'origine del movimento.",
    ],
    instructions: [
      "La scheda della sveglia mostra le sette. Scegli la frase corrispondente.",
      "La nota sul giorno libero di Tanaka è datata oggi. Scegli la frase corrispondente.",
      "Disponi ogni tessera secondo il programma di lunedì mostrato.",
      "Completa il piano di Satou per domani.",
      "La scheda di studio di Tanaka indica l’inizio alle nove e la fine alle cinque. Scegli la frase corrispondente.",
      "La scheda di percorso di Mari indica solo l’origine, ma il piano richiede entrambi i limiti. Aggiungi soltanto il termine mancante.",
      "Recupera la frase di Suzuki sullo studio fino alle cinque.",
      "Completa il ritorno di Yamada dalla stazione.",
      "Ascolta quale espressione temporale usa la registrazione, poi scegli la corrispondenza scritta esatta.",
      "Pronuncia il percorso nascosto di Satou dalla stazione all'università.",
    ],
    accepted: [
      "Le sette sono un'ora specifica marcata da に.",
      "Oggi compare naturalmente senza に obbligatorio.",
      "Il blocco giorno più に precede il predicato.",
      "Domani resta non marcato in questo obiettivo.",
      "L’intervallo di studio ha inizio e termine espliciti.",
      "La riparazione usa limiti di movimento con un verbo di movimento.",
      "Le cinque sono il limite temporale dichiarato.",
      "La stazione è l'origine del ritorno.",
      "La registrazione corrisponde alla frase col tempo relativo non marcato.",
      "Il percorso orale mantiene entrambi i limiti espliciti.",
    ],
    retry: [
      "Usa l’orario sulla scheda della sveglia e confronta i due enunciati.",
      "Usa la data stampata sulla nota del giorno libero e confronta i due enunciati.",
      "Ricontrolla come il programma mostrato corrisponde a una frase completa.",
      "Usa la scheda del programma di Satou e confronta i due piani.",
      "Usa entrambi i confini dichiarati dell’intervallo e confronta le frasi complete.",
      "Usa il requisito di un percorso completo e ripara soltanto il confine mancante.",
      "Controlla se la scheda di studio indica un termine o un singolo appuntamento.",
      "Usa l’origine mostrata sulla scheda del ritorno e confronta i due enunciati.",
      "Riascolta tutta la registrazione e confronta i due piani scritti.",
      "Ricostruisci il percorso nascosto da tutti gli indizi mostrati.",
    ],
  }),
  ...semanticLessonCopy("time-movement-3", {
    title: "Quattro celle cortesi di tempo e polarità",
    objective:
      "Usare ます, ません, ました e ませんでした nell'ordine canonico delle quattro celle.",
    main:
      "Il motore delle forme del Task 7 fornisce esattamente quattro celle cortesi: non-passata affermativa, non-passata negativa, passata affermativa e passata negativa.",
    construction:
      "Scegli prima il tempo, poi la polarità e recupera il finale generato senza modificarne le stringhe.",
    constraints:
      "Il non-passato dinamico resta abituale o futuro. Le forme passate descrivono eventi conclusi o non avvenuti, mai progressivi.",
    commonError:
      "Non abbreviare ませんでした e non unire un tempo passato a una forma non-passata senza un contesto che lo permetta.",
    nearestContrast:
      "かきません è non-passato negativo; かきませんでした è passato negativo.",
    recap:
      "Ricorda le quattro celle in ordine e selezionale da tempo più polarità.",
    translations: [
      "Lavorerò questa settimana.",
      "Viaggerò la prossima settimana.",
      "Questa settimana non lavorerò.",
      "Non lo comprerò la prossima settimana.",
      "Ieri ho lavorato.",
      "La settimana scorsa ho studiato.",
      "Ieri non ho lavorato.",
      "La settimana scorsa non ho giocato.",
      "Tanaka lo ha scritto ieri.",
      "Yamada non studierà la prossima settimana.",
      "La settimana scorsa non ho cantato.",
      "Non li incontrerò la prossima settimana.",
    ],
    purposes: [
      "Presenta la cella non-passata affermativa con lettura futura.",
      "Usa la stessa cella per un piano futuro.",
      "Contrappone lo stesso predicato lavorare con polarità negativa.",
      "Usa ません per un futuro negativo.",
      "Presenta la cella passata affermativa in ました.",
      "Applica il passato affermativo a un composto in する.",
      "Completa la griglia dello stesso verbo con ませんでした.",
      "Usa il passato negativo con un altro predicato godan.",
      "Combina un tema esplicito con un oggetto recuperabile.",
      "Completa il contrasto delle quattro celle in un piano fondato.",
      "Applica la cella passata negativa al nuovo verbo cantare.",
      "Applica il futuro negativo in ません al nuovo verbo incontrare.",
    ],
    instructions: [
      "L'elenco di questa settimana include il turno di lavoro di chi studia. Scegli la frase corrispondente.",
      "Il turno di Tanaka compare nell'elenco della prossima settimana. Scegli la frase corrispondente.",
      "Il registro presenze mostra un turno concluso ieri per Yamada. Ordina ogni tessera.",
      "Il registro della settimana scorsa indica la sessione di studio come conclusa. Trasforma la base pre-ます mostrata.",
      "Nel registro di ieri non compare alcun turno per Suzuki. Scegli la frase corrispondente.",
      "Mari ha annullato l'acquisto della prossima settimana, ma la forma mostrata lo presenta come concluso. Ripara la forma.",
      "Nel registro di Tanaka non compare alcun canto la settimana scorsa. Recupera la frase.",
      "Nel calendario di Yamada non compare alcun incontro questa settimana. Scegli la frase.",
      "Ascolta quale polarità presenta la registrazione, poi scegli la corrispondenza scritta esatta.",
      "Nel calendario di Suzuki non c'è alcuna sessione di studio la prossima settimana. Pronuncia la frase nascosta.",
    ],
    accepted: [
      "Il contesto di lavoro futuro seleziona ます.",
      "Anche il piano futuro seleziona il non-passato affermativo.",
      "Il blocco temporale passato precede la forma ました generata.",
      "La trasformazione produce il passato affermativo completo.",
      "Tempo passato più negazione produce ませんでした.",
      "La riparazione usa ません per un futuro negativo.",
      "L'evento di canto recuperato è passato e negativo.",
      "Il piano dell'incontro è futuro/non-passato e negativo.",
      "La frase scelta corrisponde alla registrazione passata.",
      "L'obiettivo orale conserva il finale ません completo.",
    ],
    retry: [
      "Usa il turno programmato e confronta le due forme complete.",
      "Usa la data dell’elenco e controlla quale forma completa è adatta.",
      "Ricontrolla come il registro presenze corrisponde a una frase completa.",
      "Usa il segno di completamento nel registro e applica la trasformazione nota.",
      "Usa il registro presenze vuoto e confronta le due forme complete.",
      "Usa insieme l’annullamento e la data del programma; ripara soltanto la forma.",
      "Usa la voce vuota del registro e confronta le due forme complete.",
      "Usa il segno di assenza sul calendario e confronta le due date.",
      "Riascolta tutta la registrazione e confronta le due forme scritte.",
      "Ricostruisci il piano nascosto da tutti gli indizi mostrati.",
    ],
  }),
  ...semanticLessonCopy("time-movement-4", {
    title: "Un programma e un percorso pratici",
    objective:
      "Combinare tempo, movimento, particelle e forme delle quattro celle in un piano coerente.",
    main:
      "Un programma seleziona interpretazione temporale e polarità; un percorso seleziona meta, limiti o mezzo. Ogni frase conserva la licenza guidata dal predicato.",
    construction:
      "Fissa il giorno o il tempo relativo, scegli la forma dell'evento e aggiungi soltanto i ruoli espliciti necessari.",
    constraints:
      "Nessuna azione è in corso adesso. から resta un inizio, まで un limite e compaiono solo forme già note.",
    commonError:
      "Non unire ieri a un finale futuro e non usare un mezzo di trasporto come luogo d'azione.",
    nearestContrast:
      "けさあるきました riferisce un evento passato; こんばんかいぎをします programma un evento futuro.",
    recap:
      "Esprimi un evento in agenda, un percorso delimitato, un mezzo e un piano cambiato.",
    translations: [
      "Ho camminato stamattina.",
      "Terrò la riunione stasera.",
      "Farò il lavoro domani.",
      "Oggi pranzerò.",
      "Yamada studia di sera ogni settimana.",
      "Cucinerò stasera.",
      "La domenica riposo.",
      "Controllerò il programma domani.",
      "Stasera mi dirigerò verso la stazione.",
      "Non terrò la riunione stasera.",
    ],
    purposes: [
      "Usa un tempo passato relativo senza に.",
      "Combina un tempo futuro relativo con un tema ammesso.",
      "Mantiene domani senza に obbligatorio.",
      "Usa il pasto come tema di mangiare.",
      "Combina la prova settimanale con に sull'espressione serale.",
      "Usa una lettura futura, mai progressiva.",
      "Usa に con un giorno ricorrente nominato.",
      "Rende il programma il tema ammesso di controllare.",
      "Aggiunge al programma un movimento futuro coerente.",
      "Usa il non-passato negativo per un evento futuro annullato.",
    ],
    instructions: [
      "Il registro del mattino indica la camminata come conclusa. Scegli la frase corrispondente.",
      "La riunione è domani. Scegli l'evento programmato.",
      "Disponi ogni tessera secondo la scheda del lavoro serale mostrata.",
      "Il pranzo di Yamada è segnato per domani. Completa la frase corrispondente.",
      "La scheda di studio di Tanaka indica ogni settimana di sera, non oggi. Scegli la frase corrispondente.",
      "La riunione è annullata, ma la frase mostrata dice ancora che avverrà. Ripara soltanto il finale.",
      "Recupera la routine di riposo domenicale di Tanaka.",
      "La revisione del programma di Yamada è segnata per stasera. Completa la frase.",
      "Ascolta quale polarità presenta la frase di viaggio registrata, poi scegli la corrispondenza scritta esatta.",
      "La riunione di Suzuki è nel calendario di stasera. Pronuncia la frase nascosta.",
    ],
    accepted: [
      "L'evento mattutino concluso usa ました.",
      "La riunione è collocata nel piano futuro.",
      "Il tema lavoro resta prima del predicato finale.",
      "Il pranzo è il tema ammesso di mangiare.",
      "La frase indica sia ogni settimana sia la sera.",
      "La riparazione usa il futuro negativo ません.",
      "La domenica prende に nella routine proposta.",
      "Il programma è il tema di controllare.",
      "Il percorso scelto corrisponde alla registrazione completa.",
      "Il piano pronunciato è futuro e affermativo.",
    ],
    retry: [
      "Usa l’evento concluso nel registro mattutino e confronta le due forme.",
      "Usa la data stampata sulla scheda della riunione e confronta i due piani.",
      "Ricontrolla come la scheda del lavoro corrisponde a una frase completa.",
      "Usa la data nel programma del pranzo e confronta i due enunciati.",
      "Usa entrambi i segni di ricorrenza sulla scheda di studio e confronta i due enunciati.",
      "Usa il segno di annullamento e ripara soltanto lo stato incompatibile dell’evento.",
      "Usa il giorno indicato sul calendario e recupera la routine completa.",
      "Usa l’indicazione temporale sul programma di controllo e confronta i due enunciati.",
      "Riascolta tutta la registrazione e confronta le due frasi scritte sul viaggio.",
      "Ricostruisci la frase nascosta sull’evento da entrambi gli indizi mostrati.",
    ],
  }),
  "time-movement-4-practical-dialogue-outcome":
    "Conferma percorso del lunedì, ora di partenza, mezzo e programma serale.",
  "time-movement-4-practical-dialogue-turn-1-translation":
    "Andrai all'università lunedì?",
  "time-movement-4-practical-dialogue-turn-1-purpose":
    "Apre combinando un giorno specifico e una meta.",
  "time-movement-4-practical-dialogue-turn-2-translation":
    "Sì, andrò alle sette.",
  "time-movement-4-practical-dialogue-turn-2-purpose":
    "Risponde omettendo la destinazione recuperabile.",
  "time-movement-4-practical-dialogue-turn-3-translation":
    "Andrai dalla stazione fino all'università?",
  "time-movement-4-practical-dialogue-turn-3-purpose":
    "Controlla il percorso delimitato senza altri sensi di から.",
  "time-movement-4-practical-dialogue-turn-4-translation":
    "Sì, andrò in treno.",
  "time-movement-4-practical-dialogue-turn-4-purpose":
    "Risponde alla domanda sul percorso con un mezzo coerente.",
  "time-movement-4-practical-dialogue-turn-5-translation":
    "Terrai la riunione stasera?",
  "time-movement-4-practical-dialogue-turn-5-purpose":
    "Passa in modo coerente dal viaggio al programma serale.",
  "time-movement-4-practical-dialogue-turn-6-translation":
    "No, lo farò domani.",
  "time-movement-4-practical-dialogue-turn-6-purpose":
    "Chiude rimandando a domani la riunione recuperabile.",
  "verb-hashiru-meaning": "correre",
  "verb-ryokou-suru-meaning": "viaggiare",
  "verb-ryouri-suru-meaning": "cucinare",
  "verb-dekakeru-meaning": "uscire",
  "noun-kyou-meaning": "oggi",
  "noun-ashita-meaning": "domani; il giorno dopo",
  "noun-maishuu-meaning": "ogni settimana",
  "noun-fudan-meaning": "di solito; normalmente",
  "noun-getsuyoubi-meaning": "lunedì",
  "noun-shichiji-meaning": "le sette",
  "noun-kuji-meaning": "le nove",
  "noun-goji-meaning": "le cinque",
  "noun-kinou-meaning": "ieri",
  "noun-senshuu-meaning": "la settimana scorsa",
  "noun-konshuu-meaning": "questa settimana",
  "noun-raishuu-meaning": "la prossima settimana",
  "noun-kaigi-meaning": "riunione",
  "noun-shigoto-meaning": "lavoro; compito",
  "noun-hirugohan-meaning": "pranzo",
  "noun-yoru-meaning": "sera; notte",
  "noun-kesa-meaning": "stamattina",
  "noun-konban-meaning": "stasera",
  "noun-nichiyoubi-meaning": "domenica",
  "noun-yotei-meaning": "programma; piano",
};

const COPULA_ADJECTIVES_COPY_IT: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("copula-adjectives-1", {
    title: "Predicati nominali affermativi e negativi",
    objective:
      "Ripassa です affermativo e usa ではありません per un predicato nominale negativo cortese.",
    main:
      "Un predicato nominale identifica o classifica una persona o una cosa. Mantieni です per l'affermazione e usa ではありません per la corrispondente negazione cortese.",
    construction:
      "Mantieni lo stesso tema e nome predicativo; scegli です quando la classificazione vale e ではありません quando non vale.",
    constraints:
      "La negazione canonica qui è ではありません. じゃありません è soltanto una variante collegata per il riconoscimento, mai il riferimento sostitutivo.",
    commonError:
      "Non negare soltanto il nome e non aggiungere a un nome una terminazione aggettivale.",
    nearestContrast:
      "たなかさんはかいしゃいんです afferma un ruolo; やまださんはかいしゃいんではありません lo nega.",
    recap:
      "Recupera il predicato nominale affermativo e contrapponilo al negativo cortese mantenendo invariato il nome.",
    translations: [
      "Tanaka è un impiegato.",
      "Yamada non è un impiegato.",
      "Satou è un ricercatore.",
      "Suzuki non è un ricercatore.",
      "Mari è una cuoca.",
      "Non sono un cuoco.",
      "Tanaka non è uno studente.",
      "Yamada è un insegnante.",
      "Satou non è infermiere.",
      "Suzuki è un avvocato.",
    ],
    purposes: [
      "Ripassa です affermativo con una nuova professione.",
      "Introduce il predicato nominale negativo cortese.",
      "Mantiene affermativo il predicato nominale.",
      "Cambia soltanto la polarità del predicato nominale.",
      "Usa lo schema affermativo ripassato con una persona.",
      "Usa ではありません con il parlante recuperabile.",
      "Contrappone il precedente predicato studente affermativo.",
      "Recupera il predicato nominale affermativo.",
      "Applica la copula negativa a un ruolo ripassato.",
      "Chiude con un chiaro contrasto affermativo.",
    ],
    instructions: [
      "Una scheda del personale conferma il ruolo mostrato. Scegli l'enunciato completo corrispondente.",
      "Un elenco barra il ruolo proposto. Scegli l'enunciato che corrisponde al dato.",
      "Ordina i blocchi del personale mostrati in un unico enunciato completo.",
      "Un elenco corretto rifiuta la classificazione precedente. Completa la risposta.",
      "Aggiorna la scheda evidenziata dopo il cambio di stato.",
      "L'enunciato mostrato contraddice il dato segnato. Scegli la riparazione con una sola modifica.",
      "Il profilo visibile dell'amico barra il ruolo di impiegato per l'amico. Scegli l'enunciato corrispondente.",
      "Un elenco della cucina identifica il lavoro del parlante. Recupera l'enunciato identificativo corrispondente.",
      "Ascolta l'intero enunciato sul personale, poi scegli la corrispondenza scritta esatta.",
      "Il dato nascosto dice che Satou non è un impiegato di azienda. Pronuncia a memoria questa correzione giapponese completa.",
    ],
    accepted: [
      "L'enunciato afferma il ruolo registrato sulla scheda.",
      "L'enunciato nega cortesemente il ruolo barrato.",
      "La persona resta il tema e il nome identificativo completa l'enunciato.",
      "La risposta completata corrisponde al dato corretto.",
      "Cambia soltanto lo stato richiesto.",
      "La riparazione cambia la polarità e conserva persona e ruolo.",
      "La risposta corrisponde al profilo visibile.",
      "L'enunciato identificativo corrisponde all'elenco della cucina.",
      "L'enunciato scritto corrisponde alla registrazione completa.",
      "L'enunciato pronunciato conserva la correzione nascosta.",
    ],
    retry: [
      "Confronta entrambi gli enunciati completi con il segno di conferma.",
      "Usa lo stato barrato invece di dedurre dal nome della persona.",
      "Mantieni insieme i blocchi come un'unica affermazione completa.",
      "Usa soltanto il dato corretto mostrato nella situazione.",
      "Mantieni fissi persona e ruolo mentre applichi l'aggiornamento.",
      "Cambia soltanto la parte contraddetta dal dato.",
      "Torna al profilo visibile prima di scegliere.",
      "Usa l'indizio sul luogo di lavoro mantenendo lo schema identificativo completo.",
      "Riascolta l'intera registrazione e confronta entrambi gli enunciati.",
      "Recupera la persona nominata, il ruolo registrato e lo stato segnato senza leggere una scelta.",
    ],
  }),
  ...semanticLessonCopy("copula-adjectives-2", {
    title: "Le quattro celle del predicato nominale",
    objective:
      "Usa i predicati nominali nel non-passato e nel passato, affermativo e negativo.",
    main:
      "I predicati nominali cortesi hanno quattro celle canoniche: です, ではありません, でした e ではありませんでした.",
    construction:
      "Colloca prima la situazione nel presente o nel passato, poi conserva il nome predicativo scegliendo se la classificazione vale.",
    constraints:
      "Tempo passato e polarità negativa sono scelte separate; il passato negativo completo deve conservare entrambi.",
    commonError:
      "Non usare una terminazione non-passata per un ruolo esplicitamente precedente e non eliminare でした dal passato negativo.",
    nearestContrast:
      "えんじにあでした dice che il ruolo precedente valeva; えんじにあではありませんでした dice che non valeva.",
    recap:
      "Recupera tutte e quattro le celle del predicato nominale variando soltanto tempo e polarità.",
    translations: [
      "Tanaka è un ingegnere.",
      "Yamada non è un ingegnere.",
      "Satou era un ingegnere.",
      "Suzuki non era un ingegnere.",
      "Mari è un'impiegata di banca.",
      "Yuki non è un'impiegata di banca.",
      "Ero un impiegato di banca.",
      "Tanaka non era un dipendente pubblico.",
      "Yamada era un dipendente pubblico.",
      "Satou non è un dipendente pubblico.",
    ],
    purposes: [
      "Mostra la cella non-passata affermativa.",
      "Mostra la cella non-passata negativa.",
      "Introduce il predicato nominale passato affermativo.",
      "Introduce il predicato nominale passato negativo.",
      "Applica la prima cella a un nuovo ruolo.",
      "Applica la seconda cella.",
      "Applica la cella passata affermativa.",
      "Applica l'intera terminazione passata negativa.",
      "Contrappone passato affermativo e negativo.",
      "Ritorna al non-passato negativo senza cambiare nome.",
    ],
    instructions: [
      "Una scheda di lavoro precedente conferma il ruolo registrato. Scegli l'enunciato corrispondente.",
      "Un dato bancario datato rifiuta lo stato proposto. Scegli l'enunciato corrispondente.",
      "Ordina i blocchi storici mostrati in un unico enunciato completo.",
      "Un curriculum segna come assente il ruolo precedente. Completa il dato.",
      "Sposta il profilo dalla voce attuale a quella precedente.",
      "Lo stato storico nell'enunciato mostrato è errato. Scegli la riparazione con una sola modifica.",
      "Usa il dato dell'ex studente e scegli l'enunciato supportato.",
      "Un archivio del servizio pubblico identifica il ruolo precedente. Recupera l'enunciato corrispondente.",
      "Ascolta l'intero enunciato storico, poi scegli la corrispondenza scritta esatta.",
      "Il dato nascosto dice che il cuoco non lavorava come ingegnere in passato. Pronuncia a memoria questo dato giapponese completo.",
    ],
    accepted: [
      "L'enunciato corrisponde al ruolo precedente confermato.",
      "Tempo e stato corrispondono entrambi al dato datato.",
      "I blocchi storici formano un enunciato con predicato finale.",
      "La risposta conserva la persona e registra il ruolo precedente assente.",
      "L'enunciato trasformato corrisponde alla voce precedente.",
      "La riparazione cambia soltanto lo stato contraddetto.",
      "L'enunciato segue il dato visibile dell'ex studente.",
      "L'enunciato recuperato corrisponde al ruolo archiviato nel servizio pubblico.",
      "L'enunciato scritto corrisponde alla registrazione completa.",
      "La risposta pronunciata conserva lo stato storico nascosto.",
    ],
    retry: [
      "Usa insieme data e segno di conferma.",
      "Confronta gli enunciati completi con lo stato datato.",
      "Mantieni il dato storico come un'unica affermazione completa.",
      "Usa il segno del curriculum senza cambiare persona o ruolo.",
      "Mantieni fisso il profilo e usa la voce precedente.",
      "Ripara soltanto ciò che il dato storico contraddice.",
      "Torna al dato visibile dell'ex studente.",
      "Usa l'indizio del luogo di lavoro archiviato in un enunciato passato completo.",
      "Riascolta tutto prima di confrontare i due enunciati.",
      "Recupera la persona, il ruolo precedente, il tempo e lo stato segnato senza leggere un'opzione.",
    ],
  }),
  ...semanticLessonCopy("copula-adjectives-3", {
    title: "Aggettivi descrittivi che si coniugano",
    objective:
      "Usa gli aggettivi in い come predicati e modificatori nominali nella griglia Base di tempo e polarità.",
    main:
      "Un aggettivo in い porta la propria flessione. Il です cortese segue la forma aggettivale completa come marcatore di cortesia; non è la copula piana だ.",
    construction:
      "Per おいしい usa おいしい, おいしくない, おいしかった o おいしくなかった prima di です cortese. Prima di un nome, mantieni direttamente l'aggettivo di dizionario.",
    constraints:
      "Non aggiungere mai だ piano dopo un aggettivo in い. Il motore registrato fornisce anche le forme irregolari in よ- di いい.",
    commonError:
      "たかいだ non è un predicato valido in い; ripara soltanto quella terminazione.",
    nearestContrast:
      "おいしいです è predicativo e cortese; おいしいごはん colloca lo stesso aggettivo direttamente prima del nome.",
    recap:
      "Recupera le quattro forme predicative, lo schema modificatore diretto e la regola che qui です marca la cortesia.",
    translations: [
      "Il riso è gustoso.",
      "La frutta non è gustosa.",
      "L'acqua era buona.",
      "Il pranzo non era gustoso.",
      "L'ombrello è costoso.",
      "La bicicletta non è costosa.",
      "Il negozio era buono.",
      "La mensa non era buona.",
      "È riso gustoso.",
      "È una bicicletta costosa.",
    ],
    purposes: [
      "Mostra un predicato in い con です cortese.",
      "L'aggettivo forma da sé il negativo.",
      "Mostra il passato affermativo autoconjugato.",
      "Mostra l'intera terminazione aggettivale passata negativa.",
      "Mantiene です come cortesia, mai だ piano.",
      "Cambia soltanto la polarità dell'aggettivo.",
      "Usa il tema irregolare registrato di いい.",
      "Completa la griglia irregolare di いい.",
      "Usa un aggettivo in い direttamente prima del nome.",
      "Contrappone uso attributivo e cortesia predicativa.",
    ],
    instructions: [
      "Una scheda di assaggio indica che l'acqua mostrata è buona. Scegli l'enunciato corrispondente.",
      "Un cartellino indica che il riso mostrato non è costoso. Scegli l'enunciato supportato.",
      "Ordina i blocchi della recensione in un unico enunciato completo.",
      "Una nota datata rifiuta la valutazione precedente. Completa la nota.",
      "Sposta la recensione mostrata dalla voce attuale a quella datata.",
      "La valutazione mostrata contiene una terminazione malformata. Scegli la riparazione con una sola modifica.",
      "Usa la scheda dei punteggi del parlante e scegli l'enunciato supportato.",
      "Una nota del mercato descrive la frutta assaggiata. Recupera la descrizione nominale corrispondente.",
      "Ascolta l'intera valutazione, poi scegli la corrispondenza scritta esatta.",
      "La recensione nascosta dice che la rivista non era buona. Pronuncia a memoria questa valutazione giapponese completa.",
    ],
    accepted: [
      "La forma aggettivale completa corrisponde alla scheda di assaggio.",
      "La valutazione del prezzo corrisponde alla proposta rifiutata.",
      "I blocchi della recensione formano un enunciato con predicato finale.",
      "La risposta conserva l'elemento e corrisponde alla valutazione datata.",
      "Cambia soltanto l'impostazione temporale richiesta.",
      "La riparazione elimina la costruzione con copula piana non valida.",
      "La risposta corrisponde alla scheda visibile.",
      "La descrizione nominale corrisponde alla frutta assaggiata.",
      "L'enunciato scritto corrisponde alla registrazione completa.",
      "La valutazione pronunciata è la risposta nascosta univocamente recuperabile.",
    ],
    retry: [
      "Confronta entrambe le valutazioni complete con il segno di assaggio.",
      "Mantieni fisso il riso mostrato e usa l'indicazione del prezzo.",
      "Mantieni insieme i blocchi come un'unica affermazione completa.",
      "Usa il segno datato e mantieni fisso l'elemento valutato.",
      "Mantieni fissa la valutazione mentre applichi la data.",
      "Ripara soltanto la terminazione malformata mostrata.",
      "Torna alla scheda visibile.",
      "Usa l'indizio del mercato e mantieni l'aggettivo direttamente prima del nome.",
      "Riascolta tutto prima di confrontare entrambi gli enunciati.",
      "Recupera l'oggetto recensito, il giudizio datato e se quel giudizio valeva senza leggere una scelta.",
    ],
  }),
  ...semanticLessonCopy("copula-adjectives-4", {
    title: "Aggettivi di tipo nominale e modifica del nome",
    objective:
      "Usa gli aggettivi in な con una copula come predicati e con な prima di un nome modificato.",
    main:
      "Un aggettivo in な si comporta come un predicato di tipo nominale: richiede una copula in posizione predicativa, ma prende な direttamente prima di un nome.",
    construction:
      "Usa です, ではありません, でした o ではありませんでした dopo l'aggettivo predicativo; inserisci な fra aggettivo e nome nell'uso attributivo.",
    constraints:
      "Non omettere la copula predicativa né il な attributivo e non imporre questa regola agli aggettivi in い.",
    commonError:
      "しずかしょくどうです manca del な attributivo richiesto; aggiungi soltanto quel collegamento.",
    nearestContrast:
      "しずかです richiede una copula come predicato; しずかなしょくどう richiede な prima del nome; たかいかさ non usa nessuna delle due regole.",
    recap:
      "Recupera le quattro celle predicative copulari e lo schema attributivo separato in な mantenendo distinti gli aggettivi in い.",
    translations: [
      "L'ufficio è tranquillo.",
      "Il negozio non è tranquillo.",
      "Il parco era bello.",
      "L'ufficio non era pulito.",
      "Satou è famoso.",
      "Non sto bene.",
      "È un ufficio tranquillo.",
      "È uno studente di bell'aspetto.",
      "Il parco è bello.",
      "È un ombrello costoso.",
    ],
    purposes: [
      "Mostra che gli aggettivi in な predicativi richiedono la copula.",
      "Usa il percorso negativo della copula nominale.",
      "Usa la copula passata affermativa.",
      "Usa la copula passata negativa completa.",
      "Mantiene delimitato il predicato di tipo nominale.",
      "Applica lo stesso percorso copulare nominale.",
      "Richiede な prima del nome modificato.",
      "Applica il な attributivo a un altro aggettivo.",
      "Mantiene distinto il percorso degli aggettivi in い.",
      "Mostra che un aggettivo in い non inserisce mai な.",
    ],
    instructions: [
      "Il profilo di Mari la descrive come tranquilla. Scegli l'enunciato corrispondente.",
      "Un'ispezione datata dice che l'ombrello mostrato non era pulito. Scegli l'enunciato supportato.",
      "Ordina i blocchi del profilo in un unico enunciato completo.",
      "Una scheda sanitaria dice che l'amico mostrato non sta bene. Completa la risposta.",
      "Sposta il rapporto sul parco dalla voce attuale a quella datata.",
      "Alla descrizione della mensa mostrata manca un collegamento richiesto. Scegli la riparazione con una sola modifica.",
      "Il rapporto di un visitatore indica che l'ufficio mostrato è pulito. Scegli l'enunciato supportato.",
      "Un rapporto precedente definisce tranquillo il negozio mostrato. Recupera la descrizione nominale.",
      "Ascolta l'intera descrizione del luogo, poi scegli la corrispondenza scritta esatta.",
      "Il profilo nascosto attuale dice che lo studente è di bell'aspetto ora. Pronuncia a memoria questa descrizione giapponese completa.",
    ],
    accepted: [
      "La descrizione usa il percorso predicativo copulare richiesto.",
      "L'enunciato datato corrisponde alla scheda.",
      "I blocchi del profilo formano un enunciato con predicato finale.",
      "La risposta completata corrisponde alla scheda sanitaria.",
      "Il rapporto trasformato mantiene fisso il luogo.",
      "La riparazione inserisce il collegamento richiesto senza altre modifiche.",
      "L'enunciato corrisponde al rapporto del visitatore.",
      "La descrizione recuperata segue lo schema del modificatore nominale.",
      "La descrizione scritta corrisponde alla registrazione completa.",
      "Il profilo pronunciato conserva la descrizione nascosta.",
    ],
    retry: [
      "Confronta entrambe le descrizioni complete con il rapporto.",
      "Usa insieme data e segno sulla scheda.",
      "Mantieni insieme i blocchi come un'unica affermazione completa.",
      "Usa la scheda sanitaria visibile senza cambiare il partecipante.",
      "Mantieni fissi luogo e descrizione mentre applichi la data.",
      "Aggiungi soltanto il collegamento mancante mostrato dal contesto.",
      "Torna al rapporto visibile del visitatore.",
      "Usa lo schema descrittivo precedente con questo luogo.",
      "Riascolta tutto prima di confrontare entrambi gli enunciati.",
      "Recupera la persona, la descrizione attuale e se vale senza leggere una scelta.",
    ],
  }),
  "noun-kaishain-meaning": "impiegato di azienda",
  "noun-kenkyuusha-meaning": "ricercatore",
  "noun-ryourinin-meaning": "cuoco; chef",
  "noun-enjinia-meaning": "ingegnere",
  "noun-ginkouin-meaning": "impiegato di banca",
  "noun-koumuin-meaning": "dipendente pubblico",
  "adjective-oishii-meaning": "gustoso; delizioso",
  "adjective-takai-meaning": "costoso; alto",
  "adjective-ii-meaning": "buono",
  "adjective-shizuka-meaning": "tranquillo",
  "adjective-kirei-meaning": "bello; pulito",
  "adjective-yuumei-meaning": "famoso",
  "adjective-genki-meaning": "in salute; energico",
};

const EXISTENCE_ACCEPTED_IT = [
  "La risposta completa corrisponde alla situazione visibile.",
  "L'enunciato scelto conserva tutte le informazioni della scheda.",
  "I blocchi formano un unico enunciato completo.",
  "La risposta completata segue il dato visibile.",
  "L'aggiornamento mantiene fissi gli elementi non modificati.",
  "La riparazione cambia soltanto la parte incompatibile.",
  "La risposta corrisponde al contesto mostrato.",
  "La forma recuperata conserva il significato della scheda.",
  "L'enunciato scritto corrisponde all'intera registrazione.",
  "La risposta pronunciata conserva il dato nascosto.",
] as const;

const EXISTENCE_RETRY_IT = [
  "Confronta entrambi gli enunciati completi con la stessa situazione.",
  "Usa il dato visibile senza dedurre dalla lunghezza delle opzioni.",
  "Mantieni insieme tutti i blocchi mostrati.",
  "Torna alla scheda prima di completare la risposta.",
  "Mantieni fissi gli elementi che la situazione non cambia.",
  "Ripara soltanto la parte contraddetta dal contesto.",
  "Usa esclusivamente il dato visibile.",
  "Ricostruisci l'intero enunciato dalla scheda.",
  "Riascolta tutto prima di confrontare le opzioni.",
  "Ricorda il dato nascosto senza leggere una scelta.",
] as const;

const EXISTENCE_LOCATION_COPY_IT: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("existence-location-1", {
    title: "Scegliere l'esistenza animata o inanimata",
    objective:
      "Scegli ある per le cose e いる per persone e animali negli enunciati d'esistenza.",
    main:
      "Il giapponese usa due verbi d'esistenza. Nelle domande e risposte di questa lezione su un tema già stabilito, ある indica una cosa inanimata disponibile o presente; いる indica una persona o un animale presente.",
    construction:
      "Parti da un referente già stabilito dalla situazione, segnalo come tema con は e poi scegli あります o います cortese in base alla sua classe.",
    constraints:
      "Questi predicati non-passati descrivono uno stato presente. Non indicano che l'entità stia svolgendo un'azione proprio ora.",
    commonError:
      "Non scegliere il verbo soltanto dalla traduzione italiana; stabilisci prima se il referente giapponese è animato.",
    nearestContrast:
      "Queste frasi con は chiedono o rispondono su un referente già stabilito; non ne introducono uno nuovo in modo neutro.",
    recap:
      "Recupera la classe indipendente dell'entità, poi usa あります per una cosa o います per una persona o un animale.",
    translations: [
      "Sì, la scrivania è disponibile.",
      "Sì, il cane è qui.",
      "L'auto è disponibile, vero?",
      "Sì, il libro è disponibile.",
      "Il mio amico è qui.",
      "L'ombrello è qui?",
      "L'insegnante è qui, vero?",
      "Sì, la matita è disponibile.",
      "Tanaka è qui?",
      "La bicicletta è disponibile.",
    ],
    purposes: [
      "Risponde su una cosa già richiesta con あります.",
      "Risponde su un animale già stabilito con います.",
      "Conferma la disponibilità di un'opzione inanimata già nota.",
      "Risponde su un oggetto richiesto.",
      "Segnala come presente una persona già stabilita.",
      "Verifica la presenza di un oggetto già menzionato.",
      "Conferma la presenza di una persona già stabilita.",
      "Risponde sulla disponibilità di un oggetto noto.",
      "Chiede se una persona nominata è presente.",
      "Segnala la disponibilità di un veicolo selezionato.",
    ],
    instructions: [
      "Una scheda del canile conferma che il cane mostrato è presente. Scegli l'enunciato completo corrispondente.",
      "Un inventario chiede se l'auto mostrata è presente. Scegli la domanda corrispondente.",
      "Ordina i blocchi delle presenze in un unico enunciato completo.",
      "Un controllo chiede se la scrivania mostrata è presente. Completa il controllo.",
      "Aggiorna l'enunciato delle presenze per la persona mostrata.",
      "L'enunciato mostrato contraddice la scheda della persona. Scegli la riparazione con una sola modifica.",
      "Un registro dei visitatori identifica quale persona mostrata è presente. Scegli l'enunciato supportato.",
      "Un registro della dispensa identifica quale elemento mostrato è disponibile. Recupera l'enunciato supportato.",
      "Ascolta l'intero commento sulla scrivania, poi scegli la corrispondenza scritta esatta.",
      "Ricorda la presenza nascosta dello studente e pronuncia l'enunciato completo.",
    ],
    accepted: EXISTENCE_ACCEPTED_IT,
    retry: EXISTENCE_RETRY_IT,
  }),
  ...semanticLessonCopy("existence-location-2", {
    title: "Luogo ed entità negli enunciati di esistenza",
    objective:
      "Costruisci lo schema esatto luogo に entità が あります o います.",
    main:
      "Un enunciato d'esistenza colloca prima la scena con に e poi marca con が l'entità introdotta in quella scena.",
    construction:
      "Di' il luogo con に, l'entità con が e termina con あります per un'entità inanimata o います per una animata.",
    constraints:
      "Le due particelle si collegano a significati diversi: に marca il luogo d'esistenza, mentre が marca ciò che esiste lì.",
    commonError:
      "Non scambiare i due collegamenti e non scegliere il verbo d'esistenza senza controllare l'entità.",
    nearestContrast:
      "へやにいすがあります colloca una sedia; にわにいぬがいます colloca un cane.",
    recap:
      "Recupera l'intero schema luogo に entità が e conserva entrambi i collegamenti prima di scegliere il verbo.",
    translations: [
      "Nella stanza c'è una sedia.",
      "In giardino c'è un cane.",
      "Nell'ufficio c'è una scrivania.",
      "Nel parco c'è un bambino.",
      "L'insegnante è in mensa.",
      "Al negozio c'è un'auto.",
      "Nella stanza c'è un libro.",
      "Mari è in giardino.",
      "Nell'ufficio c'è una matita.",
      "Nel parco c'è un cane.",
    ],
    purposes: [
      "Introduce lo schema completo.",
      "Usa lo schema con un'entità vivente.",
      "Fissa il collegamento del luogo.",
      "Fissa il collegamento dell'entità.",
      "Mantiene stativo il predicato.",
      "Usa un'altra cosa e un altro luogo.",
      "Recupera un oggetto noto.",
      "Colloca una persona nominata.",
      "Conserva entrambi i collegamenti.",
      "Chiude con uno schema animato.",
    ],
    instructions: [
      "La pianta colloca la sedia mostrata nell'ufficio. Scegli l'enunciato completo corrispondente.",
      "Un registro della stanza indica chi è presente. Scegli l'enunciato completo supportato.",
      "Ordina i blocchi di luogo mostrati in un enunciato con predicato finale.",
      "Il registro aggiornato colloca il cane mostrato all'università. Completa l'enunciato.",
      "La pianta colloca l'ombrello mostrato in giardino. Aggiorna l'enunciato.",
      "L'enunciato della stanza usa il verbo d'esistenza sbagliato per l'entità. Scegli la riparazione con una sola modifica.",
      "Un registro del negozio riporta il visitatore mostrato. Scegli l'enunciato supportato.",
      "La pianta colloca la matita mostrata nella stanza. Recupera lo schema completo.",
      "Ascolta l'intero enunciato sul luogo del cane, poi scegli la corrispondenza scritta esatta.",
      "Ricorda la presenza nascosta nel parco e pronuncia l'enunciato completo.",
    ],
    accepted: EXISTENCE_ACCEPTED_IT,
    retry: EXISTENCE_RETRY_IT,
  }),
  ...semanticLessonCopy("existence-location-3", {
    title: "Luogo d'esistenza, luogo d'azione e tema",
    objective:
      "Distingui il に del luogo d'esistenza dal で del luogo d'azione e il が esistenziale dal は tematico.",
    main:
      "La marcatura del luogo segue il rapporto del predicato con quel luogo. L'esistenza seleziona に; un'azione svolta in un luogo seleziona で.",
    construction:
      "Usa luogo に entità が quando introduci ciò che esiste. Usa entità は luogo に quando continui un tema stabilito. Usa luogo で con un predicato d'azione.",
    constraints:
      "Il luogo superficiale non sceglie da solo una particella. Il predicato e la struttura informativa determinano la relazione.",
    commonError:
      "Non sostituire il が esistenziale con は quando il contesto introduce in modo neutro una nuova entità.",
    nearestContrast:
      "きょうしつにいすがあります dice che lì esiste una sedia; きょうしつでべんきょうします dice che lì avviene lo studio.",
    recap:
      "Recupera prima la relazione del predicato, poi distingui il nuovo が esistenziale dal は di un tema già stabilito.",
    translations: [
      "Nell'aula c'è una sedia.",
      "Studio nell'aula.",
      "A casa c'è un cane.",
      "Lavoro a casa.",
      "In giardino c'è un pesce.",
      "Nella stanza c'è un fiore.",
      "Quanto al pesce, è in giardino.",
      "Quanto al fiore, è nella stanza.",
      "Gioco in giardino.",
      "L'insegnante è nell'ufficio.",
    ],
    purposes: [
      "Usa に per l'esistenza.",
      "Contrappone il で d'azione.",
      "Mantiene uno schema animato.",
      "Usa で con lavorare.",
      "Classifica un pesce vivo.",
      "Classifica un fiore per ある.",
      "Continua un tema stabilito.",
      "Contrappone tema e fuoco esistenziale.",
      "Mostra un altro luogo d'azione.",
      "Ritorna a un luogo stativo.",
    ],
    instructions: [
      "Una scheda domestica descrive ciò che è presente, non un'attività. Scegli l'enunciato corrispondente.",
      "Una scheda dell'aula identifica ciò che è presente lì. Scegli l'enunciato supportato.",
      "Ordina i blocchi del luogo del pesce in un unico enunciato completo.",
      "Una conversazione continua a parlare del fiore mostrato. Completa la risposta.",
      "Trasforma una scheda d'attività nel rapporto di presenza mostrato accanto.",
      "L'enunciato mostrato introduce un nuovo cane ma usa la marcatura di tema continuato. Scegli la riparazione con una sola modifica.",
      "Un orario di lavoro riporta un'attività. Scegli l'enunciato corrispondente.",
      "Recupera l'enunciato di luogo per l'insegnante già stabilito.",
      "Ascolta l'intero enunciato sul luogo del pesce, poi scegli la corrispondenza scritta esatta.",
      "Ricorda la scheda nascosta del luogo di studio e pronuncia l'enunciato completo.",
    ],
    accepted: EXISTENCE_ACCEPTED_IT,
    retry: EXISTENCE_RETRY_IT,
  }),
  ...semanticLessonCopy("existence-location-4", {
    title: "Trovare persone e cose",
    objective:
      "Chiedi dove si trova una persona o una cosa e comprendi una risposta pratica sul luogo.",
    main:
      "Usa どこに in una domanda cortese d'esistenza, con ある per una cosa o un luogo e いる per una persona o un animale.",
    construction:
      "Rendi tema l'entità cercata, aggiungi どこに, termina con il verbo d'esistenza adatto e か, poi rispondi con un luogo concreto.",
    constraints:
      "L'esistenza può descrivere dove si trova un oggetto personale, ma questa lezione non trasforma ある o いる in una traduzione universale di avere.",
    commonError:
      "Mantieni distinti l'entità cercata e il luogo della risposta e conserva la classe dell'entità stabilita autonomamente.",
    nearestContrast:
      "といれはどこにありますか chiede di una cosa o un luogo; けいさつかんはどこにいますか chiede di una persona.",
    recap:
      "Recupera la classe dell'entità, chiedi con どこに e rispondi con un luogo d'esistenza coerente.",
    translations: [
      "Dov'è il bagno?",
      "Il bagno è alla reception.",
      "Dov'è l'agente di polizia?",
      "L'agente è al minimarket.",
      "Dov'è la fermata dell'autobus?",
      "La fermata è alla stazione.",
      "Dov'è la borsa?",
      "Alla reception c'è una mappa.",
    ],
    purposes: [
      "Chiede di una cosa.",
      "Risponde con un punto di riferimento.",
      "Chiede di una persona.",
      "Risponde con un luogo animato.",
      "Chiede di un punto di riferimento.",
      "Fornisce un luogo pratico.",
      "Chiede di un oggetto personale.",
      "Usa naturalmente un'esistenza simile al possesso.",
    ],
    instructions: [
      "Un conducente cerca l'auto mostrata. Scegli la domanda di luogo corrispondente.",
      "Una scheda della stanza mostra chi è presente. Scegli l'enunciato di luogo supportato.",
      "Ordina i blocchi del luogo della fermata in un'unica risposta completa.",
      "La pianta colloca la mappa mostrata al minimarket. Completa la risposta.",
      "Aggiorna la risposta di luogo per il bagno mostrato mantenendo fissa la stanza.",
      "L'enunciato della reception usa il verbo d'esistenza sbagliato per l'addetto. Scegli la riparazione con una sola modifica.",
      "La mappa colloca il minimarket mostrato alla stazione. Scegli la risposta supportata.",
      "Il registro del personale colloca l'addetto già stabilito nell'aula. Recupera la risposta.",
      "Ascolta l'intera risposta sul luogo della borsa, poi scegli la corrispondenza scritta esatta.",
      "La scheda nascosta della stazione colloca l'agente di polizia alla stazione. Pronuncia a memoria questa risposta giapponese completa.",
    ],
    accepted: EXISTENCE_ACCEPTED_IT,
    retry: EXISTENCE_RETRY_IT,
  }),
  "existence-location-4-practical-dialogue-outcome":
    "Chiedere una mappa, trovarla alla reception e poi chiedere dove sia l'addetto.",
  "existence-location-4-practical-dialogue-turn-1-translation":
    "Dov'è la mappa?",
  "existence-location-4-practical-dialogue-turn-1-purpose":
    "Apre chiedendo di un oggetto inanimato.",
  "existence-location-4-practical-dialogue-turn-2-translation":
    "La mappa è alla reception.",
  "existence-location-4-practical-dialogue-turn-2-purpose":
    "Fornisce il punto di riferimento richiesto.",
  "existence-location-4-practical-dialogue-turn-3-translation":
    "Dov'è l'addetto della stazione?",
  "existence-location-4-practical-dialogue-turn-3-purpose":
    "Continua chiedendo di una persona.",
  "existence-location-4-practical-dialogue-turn-4-translation":
    "L'addetto è alla reception.",
  "existence-location-4-practical-dialogue-turn-4-purpose":
    "Chiude con una risposta di luogo animata.",
  ...semanticLessonCopy("requests-connection-1", {
    title: "Formare tutte le forme delimitate in te",
    objective:
      "Produrre la forma pratica in te per ogni classe verbale e famiglia di terminazioni della Base.",
    main:
      "La forma in te segue la classe e la terminazione registrate del verbo: う・つ・る diventano って; む・ぶ・ぬ diventano んで; く diventa いて; ぐ diventa いで; す diventa して.",
    construction:
      "Nei verbi ichidan sostituisci il る finale con て. Memorizza separatamente する→して e くる→きて e conserva l'eccezione già vista いく→いって.",
    constraints:
      "Questi cambiamenti forniscono soltanto la forma delimitata in te usata in questo modulo; non introducono un sistema completo di coniugazione informale.",
    commonError:
      "Non estendere a いく lo schema regolare di く: la forma canonica è いって, non いいて.",
    nearestContrast:
      "La forma di dizionario identifica la voce lessicale; la forma in te è la forma collegata usata nelle tre costruzioni successive.",
    recap:
      "Scegli la classe e la famiglia del suono finale registrate, applica l'unico cambiamento canonico e conserva いく come いって.",
    translations: [
      "かう diventa かって.",
      "まつ diventa まって.",
      "とる diventa とって.",
      "のむ diventa のんで.",
      "あそぶ diventa あそんで.",
      "しぬ diventa しんで.",
      "かく diventa かいて.",
      "およぐ diventa およいで.",
      "けす diventa けして.",
      "あける diventa あけて.",
      "する diventa して.",
      "くる diventa きて.",
      "いく diventa いって.",
      "もってくる diventa もってきて.",
    ],
    purposes: [
      "Mostra il membro in う della famiglia って.",
      "Mostra il membro in つ della famiglia って.",
      "Mostra il membro godan in る della famiglia って.",
      "Mostra il membro in む della famiglia んで.",
      "Mostra il membro in ぶ della famiglia んで.",
      "Mostra il membro in ぬ della famiglia んで.",
      "Mostra il passaggio regolare da く a いて.",
      "Mostra il passaggio da ぐ a いで.",
      "Mostra il passaggio da す a して.",
      "Mostra la sostituzione di る negli ichidan.",
      "Mantiene する come forma speciale registrata.",
      "Mantiene くる come forma speciale registrata.",
      "Registra いって invece della generalizzazione いいて.",
      "Applica il cambiamento registrato di くる in un composto.",
    ],
    instructions: [
      "Usa la scheda dell'azione mostrata per completare il cambiamento collegato.",
      "Mantieni fissa l'azione e scegli la scheda del risultato corrispondente.",
      "Costruisci la scheda di confronto con tutti gli elementi mostrati.",
      "Usa la scheda registrata per l'azione di spegnere.",
      "Completa il cambiamento mostrato per aprire.",
      "La scheda di movimento non coincide con la forma già vista. Ripara soltanto quella forma.",
      "Recupera la forma collegata per portare qualcosa.",
      "Richiama la forma registrata per venire.",
      "Ascolta tutta la registrazione, poi scegli la scheda completa corrispondente.",
      "Richiama a voce la forma collegata senza leggere un'opzione.",
    ],
    accepted: [
      "Giusto: とる si collega a とって.",
      "Giusto: しぬ si collega a しんで.",
      "Giusto: fonte e risultato sono in un ordine utilizzabile.",
      "Giusto: けす si collega a けして.",
      "Giusto: あける si collega a あけて.",
      "Giusto: la forma registrata del movimento è いって.",
      "Giusto: もってくる si collega a もってきて.",
      "Giusto: くる si collega a きて.",
      "Giusto: la scheda corrisponde alla registrazione.",
      "Giusto: はなす si collega a はなして.",
    ],
    retry: [
      "Mantieni la stessa azione e rivedi la famiglia della terminazione registrata.",
      "Mantieni fissa la scheda di partenza prima di riprovare.",
      "Usa una volta ogni elemento mostrato.",
      "Torna alla scheda dell'azione visibile.",
      "Mantieni invariata l'azione di aprire.",
      "Confronta l'intera scheda del movimento con l'eccezione già vista.",
      "Mantieni intatta l'azione composta.",
      "Torna all'azione speciale registrata.",
      "Riascolta tutta la registrazione prima di scegliere.",
      "Richiama l'azione mostrata senza aggiungerne un'altra.",
    ],
  }),
  ...semanticLessonCopy("requests-connection-2", {
    title: "Fare richieste delimitate",
    objective:
      "Fare richieste pratiche con てください e rispondere naturalmente in un breve scambio.",
    main:
      "Aggiungi ください a una forma in te generata per formulare una richiesta pratica esplicita. Un breve すみません può richiamare l'attenzione prima della richiesta.",
    construction:
      "Indica l'oggetto con を, usa la forma in te dell'azione richiesta e aggiungi ください. Aggiungi ね soltanto quando il rapporto e la situazione specifici sostengono questa attenuazione.",
    constraints:
      "てください è una richiesta esplicita, non una garanzia universale di cortesia né una formula di permesso. Scegli parole adatte al rapporto e alla situazione.",
    commonError:
      "Fermarsi alla sola forma in te non completa la richiesta esplicita in てください praticata qui.",
    nearestContrast:
      "Una richiesta chiede all'altra persona di agire; おねがいします può invece accettare un'offerta nello scambio mostrato.",
    recap:
      "Usa una forma in te generata più ください per una richiesta delimitata e attenuala soltanto quando il contesto lo consente.",
    translations: [
      "Mi scusi, chiuda la finestra, per favore.",
      "Mi mostri i documenti, per favore.",
      "Dia una mano con il lavoro, per favore.",
      "Passi il sale, per favore.",
      "Chiami l'insegnante, per favore.",
      "Mi mostri il libro, per favore.",
      "Prenda il bagaglio, per favore.",
      "Apra la finestra, per favore.",
      "Mi scusi; sì, grazie.",
    ],
    purposes: [
      "Attenua una richiesta esplicita senza affermare una cortesia universale.",
      "Applica てください a una richiesta delimitata.",
      "Usa una richiesta naturale legata a un compito.",
      "Mostra una richiesta comune a tavola.",
      "Usa una persona come oggetto di よぶ.",
      "Riutilizza un oggetto noto con la stessa costruzione.",
      "Mantiene esplicita l'azione richiesta.",
      "Contrappone l'apertura alla precedente richiesta di chiudere.",
      "Modella un'accettazione attenuata di un'offerta desiderata.",
    ],
    instructions: [
      "Un collega offre aiuto con il lavoro e tu vuoi l'aiuto. Scegli l'accettazione.",
      "Devi vedere la mappa e prima richiamare l'attenzione dell'altra persona. Scegli la battuta completa.",
      "Costruisci la richiesta sul bagaglio con tutti i segmenti mostrati.",
      "Un responsabile ti chiede di chiamare l'agente. Scegli la risposta completa e il seguito coerenti.",
      "Chiedi che venga mostrata la borsa indicata nel passaggio.",
      "La battuta sulla finestra si ferma prima di completare la richiesta prevista. Ripara soltanto la fine.",
      "A tavola, formula con delicatezza la richiesta del sale in questo scambio familiare.",
      "Inviti un collega a guardare l'ombrello che stai mostrando. Scegli la battuta adatta a questo passaggio.",
      "Ascolta tutta la registrazione, poi scegli la richiesta completa corrispondente.",
      "Nell'ufficio scolastico, prima richiama l'attenzione dell'addetto e poi chiedigli di chiamare l'insegnante. Richiama a voce questa richiesta giapponese completa.",
    ],
    accepted: [
      "Giusto: qui おねがいします accetta naturalmente l'offerta.",
      "Giusto: richiamo e richiesta formano una battuta completa.",
      "Giusto: il bagaglio precede la richiesta con predicato finale.",
      "Giusto: la risposta accetta la richiesta e nomina l'azione promessa.",
      "Giusto: l'oggetto richiesto è la borsa mostrata.",
      "Giusto: ください completa la richiesta prevista.",
      "Giusto: qui ね attenua in modo adatto al contesto.",
      "Giusto: どうぞ si adatta all'invito a guardare l'ombrello.",
      "Giusto: la richiesta corrisponde alla registrazione.",
      "Giusto: la risposta nascosta si recupera univocamente dalla scheda dell'insegnante.",
    ],
    retry: [
      "Torna all'offerta e alla risposta che invita.",
      "Mantieni visibili sia il richiamo sia la situazione della mappa.",
      "Usa una volta ogni segmento della richiesta sul bagaglio in una battuta con predicato finale.",
      "Mantieni fissi la persona richiesta e il seguito promesso.",
      "Mantieni fissi la borsa e il risultato richiesto.",
      "Conserva la richiesta visibile e ripara solo ciò che è incompleto.",
      "Tieni presente il rapporto familiare a tavola.",
      "Mantieni fissi l'ombrello e la situazione d'invito.",
      "Riascolta tutta la registrazione prima di scegliere.",
      "Mantieni fissi il bisogno in ufficio, la persona da chiamare e la situazione che richiede attenzione.",
    ],
  }),
  ...semanticLessonCopy("requests-connection-3", {
    title: "Collegare due azioni in sequenza",
    objective:
      "Collegare due azioni semplici con la forma in te quando la relazione prevista è una successione cronologica.",
    main:
      "Metti la prima azione nella forma in te generata e colloca dopo la seconda. Questa lezione usa il collegamento soltanto per una semplice sequenza prima-poi.",
    construction:
      "Genera la forma in te del primo verbo, poi termina con il secondo verbo nella forma cortese adatta all'enunciato.",
    constraints:
      "La forma sequenziale in te non afferma da sola ogni relazione possibile, come causa, contrasto o simultaneità.",
    commonError:
      "Due desinenze cortesi separate non realizzano l'unica sequenza collegata praticata qui; la prima azione richiede la forma di collegamento.",
    nearestContrast:
      "Il verbo cortese finale chiude la frase, mentre la prima forma in te lascia aperta la sequenza per l'azione successiva.",
    recap:
      "Usa la forma in te generata sulla prima azione e un verbo cortese finale sulla seconda, formulando soltanto un'affermazione cronologica delimitata.",
    translations: [
      "Mi alzerò e poi mangerò.",
      "Mangerò e poi tornerò.",
      "Comprerò qualcosa e poi tornerò.",
      "Scriverò e poi leggerò.",
      "Mi laverò e poi mi riposerò.",
      "Entrerò e poi mi riposerò.",
      "Uscirò e poi andrò.",
      "Salirò a bordo e poi andrò.",
      "Verrò e poi mangerò.",
      "Nuoterò e poi tornerò.",
      "Parlerò e poi scriverò.",
      "Guarderò e poi comprerò.",
    ],
    purposes: [
      "Presenta una sequenza cronologica esplicita.",
      "Limita la relazione alla semplice successione.",
      "Collega due azioni delimitate.",
      "Mostra che il verbo finale porta la desinenza cortese.",
      "Introduce あらう in una sequenza di due passi.",
      "Mantiene l'ingresso prima del riposo.",
      "Introduce でる come prima azione.",
      "Usa のる senza affermare una relazione discorsiva più ampia.",
      "Riutilizza la forma speciale di くる.",
      "Riutilizza l'allomorfo sonoro いで.",
      "Collega in ordine due azioni note.",
      "Mostra un ordine pratico: guardare e poi comprare.",
    ],
    instructions: [
      "Il programma dice di lavare prima e mangiare dopo. Scegli la battuta che conserva questa cronologia.",
      "Il programma dice di entrare prima e leggere dopo. Completa la sequenza.",
      "Costruisci la battuta uscire-poi-tornare con ogni segmento mostrato.",
      "Il viaggiatore sale a bordo prima e poi viene qui. Conserva questa cronologia.",
      "Trasforma le due azioni mostrate in un'unica sequenza dichiarata.",
      "La battuta vuole esprimere una sequenza mangiare-poi-andare ma chiude separatamente entrambe le azioni. Ripara soltanto il primo sintagma verbale.",
      "A pranzo, bevi prima e lava dopo. Rispetta l'ordine visibile.",
      "La scheda di viaggio mostra prima il ritorno e poi l'imbarco. Recupera quest'ordine.",
      "Ascolta tutta la sequenza, poi scegli la battuta completa corrispondente.",
      "Richiama a voce la sequenza entrare-poi-mangiare senza leggere un'opzione.",
    ],
    accepted: [
      "Giusto: lavare è collegato prima di mangiare.",
      "Giusto: entrare è collegato prima di leggere.",
      "Giusto: i segmenti formano una sequenza con predicato finale.",
      "Giusto: in questo piano salire a bordo precede venire.",
      "Giusto: comprare è collegato prima di leggere.",
      "Giusto: la prima azione ora si collega all'azione finale.",
      "Giusto: la battuta conserva bere-poi-lavare.",
      "Giusto: la battuta conserva tornare-poi-salire.",
      "Giusto: la sequenza corrisponde alla registrazione.",
      "Giusto: la sequenza nascosta è recuperata nell'ordine indicato.",
    ],
    retry: [
      "Mantieni fissi i due eventi mostrati e la loro cronologia.",
      "Torna al programma prima di scegliere.",
      "Usa una volta ogni segmento mostrato.",
      "Mantieni per primo l'evento di salire a bordo.",
      "Conserva l'ordine mostrato sulla scheda delle azioni.",
      "Ripara soltanto il collegamento fra le due azioni.",
      "Rileggi la cronologia visibile.",
      "Torna alla scheda del percorso prima di riprovare.",
      "Riascolta tutta la registrazione prima di scegliere.",
      "Mantieni entrare per primo e mangiare per secondo.",
    ],
  }),
  ...semanticLessonCopy("requests-connection-4", {
    title: "Azioni in corso e stati attuali",
    objective:
      "Usare ています per un'azione delimitata in corso o uno stato risultante/attuale sostenuto dal lessico.",
    main:
      "La forma in te generata più います può descrivere un'azione dinamica visibilmente in corso adesso. Con predicati selezionati descrive invece uno stato attuale o risultante.",
    construction:
      "Genera la forma in te del verbo e aggiungi います. Interpreta il risultato dal predicato e dalla situazione visibile: azione in corso oppure stato attuale sostenuto.",
    constraints:
      "Non chiamare ogni verbo al non passato presente progressivo. Fuori da questa costruzione delimitata, il non passato dinamico della Base resta abituale o futuro.",
    commonError:
      "Il normale non passato cortese non codifica la lettura in corso richiesta da una scena che mostra visibilmente un'azione già in svolgimento.",
    nearestContrast:
      "わたしはいまごはんをたべています ancora un'azione in corso; わたしはやまださんをしっています è conoscenza attuale, mentre すずきさんはいすにすわっています e やまださんはふくをきています sono stati mantenuti.",
    recap:
      "Usa ています soltanto con una lettura esplicita di azione-in-corso-ora o di stato sostenuto e lascia che predicato e scena decidano tra le due.",
    translations: [
      "Adesso sto mangiando riso.",
      "Tanaka sta leggendo un libro adesso.",
      "Yamada sta scrivendo una lettera adesso.",
      "Suzuki è al telefono adesso.",
      "Tanaka sta nuotando adesso.",
      "Yamada sta studiando adesso.",
      "Suzuki sta lavorando adesso.",
      "Conosco Yamada.",
      "Yamada indossa dei vestiti.",
      "Suzuki è seduto su una sedia.",
      "Tanaka sta aspettando alla stazione adesso.",
      "Suzuki sta guardando una rivista adesso.",
    ],
    purposes: [
      "Nomina in giapponese il momento attuale, chi mangia e il cibo.",
      "Usa il tempo visibile e il libro per ancorare la lettura in corso.",
      "Usa la lettera e l'espressione temporale per rendere esplicito l'evento in corso.",
      "Usa un soggetto e il momento attuale visibile per ancorare la telefonata.",
      "Usa l'espressione temporale per selezionare una nuotata in corso.",
      "Nomina soggetto e tempo in giapponese per lo studio attuale.",
      "Usa il tempo visibile per distinguere il lavoro attuale dal non passato abituale.",
      "Nomina l'oggetto di uno stato attuale di conoscenza.",
      "Usa un oggetto vestiti esplicito per selezionare la lettura di stato.",
      "Usa il luogo sedia per ancorare lo stato dopo essersi seduto.",
      "Usa tempo attuale e luogo dell'azione per ancorare l'attesa in corso.",
      "Usa tempo e oggetto visibili per ancorare l'azione in corso.",
    ],
    instructions: [
      "Tanaka conosce già Yamada. Scegli l'enunciato di questa conoscenza attuale.",
      "Una scena dal vivo mostra Yamada mentre mangia in questo momento. Completa il resoconto.",
      "Costruisci il resoconto dal vivo della lettura della rivista con tutti i segmenti mostrati.",
      "Yamada si è seduto sulla sedia mostrata e rimane lì. Scegli la condizione attuale visibile.",
      "Una scena dal vivo mostra Tanaka mentre scrive. Trasforma l'azione mostrata in quel resoconto.",
      "Una telecamera mostra che la lettura dei documenti è già in corso. Ripara soltanto il sintagma verbale.",
      "Nel controllo dell'abbigliamento, riferisci la condizione di Suzuki con i vestiti mostrati dopo essersi vestito.",
      "Tanaka conosce già Suzuki. Recupera il resoconto di questa conoscenza attuale.",
      "Ascolta tutta la registrazione, poi scegli il resoconto completo dell'azione attuale corrispondente.",
      "Tanaka si è seduto sulla sedia mostrata. Richiama a voce il resoconto della condizione attuale.",
    ],
    accepted: [
      "Giusto: しっています esprime conoscenza attuale.",
      "Giusto: la scena è codificata come azione in corso.",
      "Giusto: oggetto e predicato in corso formano una battuta completa.",
      "Giusto: すわっています esprime lo stato seduto mantenuto.",
      "Giusto: la scrittura è segnata come in corso adesso.",
      "Giusto: il sintagma verbale riparato corrisponde alla scena dal vivo.",
      "Giusto: qui きています esprime lo stato risultante dell'indossare.",
      "Giusto: しっています corrisponde alla conoscenza stabilita.",
      "Giusto: il resoconto dell'azione in corso corrisponde alla registrazione.",
      "Giusto: すわっています è recuperato come condizione attuale di Tanaka.",
    ],
    retry: [
      "Mantieni fissa la situazione di conoscenza stabilita.",
      "Torna a ciò che mostra visibilmente la scena dal vivo.",
      "Usa una volta ogni segmento mostrato.",
      "Mantieni visibile la condizione successiva al sedersi.",
      "Mantieni fissi Tanaka e la scena di scrittura dal vivo.",
      "Ripara soltanto il sintagma verbale contraddetto dalla telecamera.",
      "Torna al risultato del controllo dell'abbigliamento.",
      "Mantieni fisse entrambe le persone nel dato di conoscenza stabilito.",
      "Riascolta tutta la registrazione prima di scegliere.",
      "Mantieni visibile la condizione di Tanaka dopo essersi seduto.",
    ],
  }),
  "requests-connection-2-practical-dialogue-outcome":
    "Formula e soddisfa due richieste pratiche in un unico scambio in ufficio.",
  "requests-connection-2-practical-dialogue-turn-1-translation":
    "Mi scusi, mi mostri i documenti, per favore.",
  "requests-connection-2-practical-dialogue-turn-1-purpose":
    "Apre un unico scambio in ufficio con una richiesta attenuata dei documenti.",
  "requests-connection-2-practical-dialogue-turn-2-translation":
    "Sì, ecco a lei.",
  "requests-connection-2-practical-dialogue-turn-2-purpose":
    "Risponde naturalmente mentre consegna i documenti.",
  "requests-connection-2-practical-dialogue-turn-3-translation":
    "Mi mostri la lettera, per favore.",
  "requests-connection-2-practical-dialogue-turn-3-purpose":
    "Formula una seconda richiesta di un documento nello stesso ufficio.",
  "requests-connection-2-practical-dialogue-turn-4-translation":
    "Sì, ho capito.",
  "requests-connection-2-practical-dialogue-turn-4-purpose":
    "Accetta la richiesta della lettera senza ripetere artificialmente il verbo.",
  "requests-connection-4-practical-dialogue-outcome":
    "Verifica un'azione di lettura dal vivo e uno stato seduto attuale.",
  "requests-connection-4-practical-dialogue-turn-1-translation":
    "Tanaka sta leggendo adesso?",
  "requests-connection-4-practical-dialogue-turn-1-purpose":
    "Chiede di un'azione visibilmente in corso.",
  "requests-connection-4-practical-dialogue-turn-2-translation":
    "Sì, Tanaka sta leggendo un libro.",
  "requests-connection-4-practical-dialogue-turn-2-purpose":
    "Risponde con un'azione dinamica in corso.",
  "requests-connection-4-practical-dialogue-turn-3-translation":
    "Suzuki è seduto adesso?",
  "requests-connection-4-practical-dialogue-turn-3-purpose":
    "Contrappone lo stato attuale all'azione in corso.",
  "requests-connection-4-practical-dialogue-turn-4-translation":
    "Sì, Suzuki è seduto su una sedia.",
  "requests-connection-4-practical-dialogue-turn-4-purpose":
    "Risponde con lo stato attuale dopo essersi seduto.",
  "verb-motte-kuru-meaning": "portare",
  "verb-shinu-meaning": "morire",
  "verb-toru-meaning": "prendere; passare",
  "verb-kesu-meaning": "spegnere; cancellare",
  "verb-akeru-meaning": "aprire",
  "verb-shimeru-meaning": "chiudere",
  "verb-miseru-meaning": "mostrare",
  "verb-tetsudau-meaning": "aiutare; dare una mano",
  "verb-yobu-meaning": "chiamare",
  "expression-sumimasen-meaning": "mi scusi; scusa",
  "expression-onegaishimasu-meaning": "per favore; sì, grazie",
  "expression-douzo-meaning": "ecco a lei; prego",
  "expression-wakarimashita-meaning": "ho capito; va bene",
  "noun-mado-meaning": "finestra",
  "noun-shorui-meaning": "documenti",
  "noun-nimotsu-meaning": "bagaglio",
  "noun-shio-meaning": "sale",
  "noun-ima-meaning": "adesso",
  "noun-fuku-meaning": "vestiti",
  "verb-arau-meaning": "lavare",
  "verb-hairu-meaning": "entrare",
  "verb-deru-meaning": "uscire",
  "verb-noru-meaning": "salire a bordo; prendere un mezzo",
  "verb-suwaru-meaning": "sedersi",
  "verb-kiru-meaning": "indossare",
  "verb-shiru-meaning": "sapere; conoscere",
  "verb-aru-meaning": "esistere; essere presente (inanimato)",
  "verb-iru-meaning": "esistere; essere presente (animato)",
  "noun-tsukue-meaning": "scrivania",
  "noun-inu-meaning": "cane",
  "noun-kuruma-meaning": "auto",
  "noun-heya-meaning": "stanza",
  "noun-niwa-meaning": "giardino",
  "noun-isu-meaning": "sedia",
  "noun-kodomo-meaning": "bambino",
  "noun-kyoushitsu-meaning": "aula",
  "noun-uchi-meaning": "casa",
  "noun-sakana-meaning": "pesce",
  "noun-hana-meaning": "fiore",
  "noun-doko-meaning": "dove",
  "noun-uketsuke-meaning": "reception",
  "noun-toire-meaning": "bagno",
  "noun-konbini-meaning": "minimarket",
  "noun-basutei-meaning": "fermata dell'autobus",
  "noun-chizu-meaning": "mappa",
  "noun-kaban-meaning": "borsa",
  "noun-keisatsukan-meaning": "agente di polizia",
  "noun-ekiin-meaning": "addetto della stazione",
};

const SYNTHESIS_ACCEPTED_IT = [
  "La frase scelta è adatta alla situazione completa.",
  "Il contrasto scelto è realizzato in modo coerente.",
  "La frase mantiene la relazione prevista tra le sue parti.",
  "La risposta completata rimane coerente e cortese.",
  "La correzione modifica soltanto il difetto visibile.",
  "La risposta corrisponde al contesto indicato.",
  "La risposta recupera insieme i sistemi già appresi.",
  "La risposta mantiene coerenti tutti i dettagli forniti.",
  "Il testo scelto corrisponde esattamente alla registrazione.",
  "La risposta orale è ricavabile dagli indizi visibili.",
] as const;

const SYNTHESIS_RETRY_IT = [
  "Rileggi l'intera situazione e confronta entrambe le scelte prima di riprovare.",
  "Confronta soltanto il contrasto richiesto, poi riprova.",
  "Ricostruisci l'enunciato completo dai blocchi visibili prima di riprovare.",
  "Controlla ogni indizio visibile senza aggiungere informazioni, poi riprova.",
  "Individua l'unico difetto visibile e riprova.",
  "Torna alla situazione indicata prima di scegliere di nuovo.",
  "Rivedi come funzionano insieme i dettagli forniti, poi riprova.",
  "Rivedi tutto l'elenco di parole, torna all'indizio della frase e riprova.",
  "Riascolta la registrazione e confronta gli enunciati completi, poi riprova.",
  "Rivedi gli indizi visibili, poi fai un nuovo tentativo.",
] as const;

const SYNTHESIS_COPY_IT: Readonly<Record<string, string>> = {
  ...semanticLessonCopy("base-synthesis-1", {
    title: "Mantenere una descrizione naturale",
    objective:
      "Sostenere uno scambio su identità e descrizione omettendo soltanto un tema recuperabile.",
    main:
      "Una descrizione naturale stabilisce il tema una volta e poi aggiunge identità o qualità senza ripetere un pronome esplicito a ogni turno.",
    construction:
      "Usa come unità complete le strutture già apprese per tema, predicato nominale, aggettivi, modificazione ed esistenza.",
    constraints:
      "Ometti il tema soltanto finché la stessa persona o cosa rimane recuperabile in modo univoco dallo scambio.",
    commonError:
      "Non eliminare il referente dopo che la conversazione è passata a un'altra persona o a un altro oggetto.",
    nearestContrast:
      "Confronta un'entità introdotta con が, un tema stabilito con は e un tema omesso ma recuperabile.",
    recap:
      "Hai mantenuto una catena tematica coerente combinando descrizioni di identità, qualità e luogo.",
    translations: [
      "Tanaka è un ricercatore famoso.",
      "Suzuki è un ingegnere pieno di energia.",
      "Yamada è un cuoco tranquillo.",
      "Mari è un'impiegata di banca dall'aspetto curato.",
      "È una scrivania costosa.",
      "Il pranzo dell'impiegato è gustoso.",
      "Nella casa c'è una sedia.",
      "Nell'ufficio c'è un fiore.",
      "Satou è un dipendente pubblico.",
    ],
    purposes: [
      "Mantiene il tema una volta e colloca な prima della professione.",
      "Combina un tema stabile con una descrizione nominale in な.",
      "Usa una descrizione coerente senza ripetere un pronome.",
      "Ripassa な attributivo in una frase d'identità.",
      "Colloca un aggettivo in い direttamente prima del nome.",
      "Mantiene il pranzo posseduto come tema della valutazione.",
      "Ripassa una struttura di esistenza inanimata nella descrizione.",
      "Mantiene に di luogo e が esistenziale nei ruoli già appresi.",
      "Ripassa un'identità diretta con predicato nominale.",
    ],
    instructions: [
      "Rivedi l'elenco di parole visibile. Nella descrizione condivisa il bambino è pieno di energia; scegli la frase che mantiene questo dato.",
      "Rivedi l'elenco di parole visibile. In questa situazione l'auto non è costosa; scegli la frase corrispondente.",
      "Rivedi l'elenco di parole visibile, poi scegli la frase i cui blocchi formano una descrizione naturale di Satou.",
      "Rivedi l'elenco di parole visibile. Qui il poliziotto è un dipendente pubblico; completa la risposta.",
      "Rivedi l'elenco di parole visibile, poi correggi l'unica terminazione passata cortese malformata.",
      "Rivedi l'elenco di parole visibile. La mappa è già l'oggetto di cui si parla; scegli l'indicazione di luogo corrispondente.",
      "Rivedi ogni voce dell'elenco di parole descrittive. In questa situazione Yuki sta bene; scegli la frase corrispondente.",
      "Rivedi ogni voce dell'elenco di parole su persone e ruoli, poi scegli la frase che introduce l'impiegato in ufficio.",
      "Ascolta una volta o riascolta, poi scegli la frase che senti davvero.",
      "Usa le due voci nell'ordine mostrato: identifica la prima come la seconda in una frase cortese.",
    ],
    accepted: SYNTHESIS_ACCEPTED_IT,
    retry: SYNTHESIS_RETRY_IT,
  }),
  "base-synthesis-1-practical-dialogue-outcome":
    "Mantenere la descrizione di una persona senza pronomi ripetitivi né omissioni ambigue.",
  "base-synthesis-1-practical-dialogue-turn-1-translation":
    "Tanaka è un ricercatore tranquillo.",
  "base-synthesis-1-practical-dialogue-turn-1-purpose":
    "Stabilisce Tanaka come unico tema.",
  "base-synthesis-1-practical-dialogue-turn-2-translation": "Sta bene?",
  "base-synthesis-1-practical-dialogue-turn-2-purpose":
    "Omette soltanto la persona già stabilita.",
  "base-synthesis-1-practical-dialogue-turn-3-translation": "Sì, sta bene.",
  "base-synthesis-1-practical-dialogue-turn-3-purpose":
    "Continua naturalmente lo stesso tema recuperabile.",
  "base-synthesis-1-practical-dialogue-turn-4-translation":
    "È un ingegnere?",
  "base-synthesis-1-practical-dialogue-turn-4-purpose":
    "Chiede una seconda proprietà senza introdurre un referente ambiguo.",
  "base-synthesis-1-practical-dialogue-turn-5-translation":
    "No, è un ricercatore.",
  "base-synthesis-1-practical-dialogue-turn-5-purpose":
    "Risponde sullo stesso tema con la professione corretta.",
  "base-synthesis-1-practical-dialogue-turn-6-translation":
    "È famoso.",
  "base-synthesis-1-practical-dialogue-turn-6-purpose":
    "Chiude la catena descrittiva coerente senza ripetere il pronome.",

  ...semanticLessonCopy("base-synthesis-2", {
    title: "Coordinare un'abitudine e un piano",
    objective:
      "Collocare azioni familiari in un'abitudine o in un piano con argomenti retti e tutte le quattro celle cortesi.",
    main:
      "Un'abitudine usa il non-passato dinamico per uno schema ripetuto; un piano lo usa per un evento futuro. Le forme passate e negative restano scelte distinte.",
    construction:
      "Collega に a un'ora specifica, usa から e まで per due limiti e realizza ogni verbo attraverso la classe registrata.",
    constraints:
      "Non interpretare un evento dinamico al non-passato come azione in corso senza un segnale esplicito.",
    commonError:
      "Non combinare una base passata con una terminazione non-passata e non trattare un tempo relativo come un'espressione d'ora con に.",
    nearestContrast:
      "Confronta non-passato abituale e futuro, poi ciascuno con passato affermativo e passato negativo.",
    recap:
      "Hai coordinato un'abitudine e un piano futuro usando punti temporali, limiti e quattro celle cortesi.",
    translations: [
      "Domani scriverò.",
      "Di solito non scrivo.",
      "Ieri ho scritto.",
      "La settimana scorsa non ho scritto.",
      "Il cuoco leggerà alle nove.",
      "L'impiegato studierà dalle sette alle nove.",
      "Lo aprirò e poi lo chiuderò.",
      "Prenderò i documenti.",
      "Yamada legge alle sette.",
      "Cancellerò il nome.",
    ],
    purposes: [
      "Usa il non-passato dinamico soltanto per un evento futuro.",
      "Usa il non-passato negativo dinamico per un'abitudine.",
      "Recupera la cella cortese passata affermativa.",
      "Completa le quattro celle con il passato negativo cortese.",
      "Collega に soltanto all'ora specifica.",
      "Mantiene から e まで come i due limiti di un unico piano.",
      "Collega due azioni programmate con て sequenziale circoscritto.",
      "Mantiene l'argomento dei documenti visibilmente autorizzato da を.",
      "Recupera il non-passato cortese godan come stato stabile.",
      "Mantiene esplicito con を l'elemento da cancellare.",
    ],
    instructions: [
      "Rivedi l'elenco di parole visibile. Il ricercatore prepara una dimostrazione successiva; scegli la frase adatta al piano.",
      "Rivedi l'elenco di parole visibile. La persona sarà ancora viva domani; scegli l'enunciato adatto.",
      "Rivedi l'elenco di parole visibile. L'ingegnere si veste prima di sedersi; scegli l'enunciato corrispondente.",
      "Rivedi l'elenco di parole visibile. I vestiti fanno parte del piano successivo; completa l'enunciato corrispondente.",
      "Rivedi l'elenco di parole visibile, poi correggi l'unico suono malformato nella terminazione passata cortese.",
      "Rivedi l'elenco di parole visibile. Il parlante ha appreso il piano ieri; scegli l'enunciato concluso corrispondente.",
      "Rivedi ogni voce dell'elenco di parole sulle azioni future, poi usa l'indizio temporale per scegliere la frase corrispondente.",
      "Rivedi ogni voce dell'elenco di parole sulla routine. Suzuki legge come parte di questa routine; scegli la frase corrispondente.",
      "Ascolta l'enunciato temporale completo, poi scegli la corrispondenza esatta.",
      "Usa ogni voce dell'elenco di parole sull'orario per produrre una risposta cortese completa.",
    ],
    accepted: SYNTHESIS_ACCEPTED_IT,
    retry: SYNTHESIS_RETRY_IT,
  }),
  "base-synthesis-2-practical-dialogue-outcome":
    "Coordinare un breve piano di studio e documenti con indizi abituali e futuri.",
  "base-synthesis-2-practical-dialogue-turn-1-translation":
    "Di solito studi?",
  "base-synthesis-2-practical-dialogue-turn-1-purpose":
    "Apre uno scambio pratico sull'orario con una domanda abituale.",
  "base-synthesis-2-practical-dialogue-turn-2-translation":
    "Studio dalle sette alle nove.",
  "base-synthesis-2-practical-dialogue-turn-2-purpose":
    "Risponde con i due limiti temporali già appresi.",
  "base-synthesis-2-practical-dialogue-turn-3-translation":
    "Andrai in ufficio domani alle nove?",
  "base-synthesis-2-practical-dialogue-turn-3-purpose":
    "Passa dall'abitudine a un arrivo futuro a un'ora precisa.",
  "base-synthesis-2-practical-dialogue-turn-4-translation":
    "Sì, andrò alle nove.",
  "base-synthesis-2-practical-dialogue-turn-4-purpose":
    "Conferma lo stesso orario futuro senza cambiare l'evento.",
  "base-synthesis-2-practical-dialogue-turn-5-translation":
    "Mostrerai i documenti?",
  "base-synthesis-2-practical-dialogue-turn-5-purpose":
    "Chiede dell'oggetto retto nel piano condiviso.",
  "base-synthesis-2-practical-dialogue-turn-6-translation":
    "Sì, li porterò e li mostrerò.",
  "base-synthesis-2-practical-dialogue-turn-6-purpose":
    "Chiude con un piano coerente di due azioni sui documenti.",

  ...semanticLessonCopy("base-synthesis-3", {
    title: "Trovare oggetti e fare una richiesta",
    objective:
      "Distinguere il luogo di esistenza dal luogo d'azione, poi formulare e collegare una richiesta pratica.",
    main:
      "L'esistenza usa il luogo con に e あります o います; il luogo d'azione usa で con un verbo d'azione.",
    construction:
      "Introduci un'entità con が esistenziale, mantieni un'entità già stabilita con は e usa てください soltanto per la richiesta circoscritta.",
    constraints:
      "Non sostituire に di esistenza con で di luogo d'azione e non lasciare incompiuto il verbo finale di una sequenza.",
    commonError:
      "Un luogo non determina da solo una particella: sono il predicato e il ruolo previsto a determinarla.",
    nearestContrast:
      "Confronta luogo に con predicato di esistenza e luogo で con predicato d'azione.",
    recap:
      "Hai localizzato persone e cose, distinto に da で e completato una sequenza pratica di richiesta.",
    translations: [
      "Nella stanza c'è una scrivania.",
      "Nel giardino c'è un bambino.",
      "La sedia è nella casa.",
      "Gioco in aula.",
      "Scusi, apra la finestra, per favore.",
      "Lo chiuderò e poi uscirò.",
      "Alla reception c'è un bambino.",
      "Mostri la borsa, per favore.",
    ],
    purposes: [
      "Usa に di luogo e が esistenziale per un'entità inanimata.",
      "Seleziona います per un'entità animata.",
      "Contrappone una sedia già nota a un'introduzione esistenziale.",
      "Usa で per il luogo in cui avviene un'azione.",
      "Formula una richiesta pratica circoscritta con てください.",
      "Usa て sequenziale mantenendo finito il verbo finale.",
      "Introduce una persona con が esistenziale.",
      "Mantiene l'oggetto richiesto retto da を.",
    ],
    instructions: [
      "Rivedi l'elenco di parole visibile. L'auto viene introdotta come appena presente nel giardino; scegli l'enunciato corrispondente.",
      "Rivedi l'elenco di parole visibile. La borsa è l'oggetto di una richiesta pratica di lavaggio; scegli l'enunciato corrispondente.",
      "Rivedi l'elenco di parole visibile. Chiama il bambino prima di uscire; scegli l'enunciato adatto.",
      "Rivedi l'elenco di parole visibile, poi trasforma l'indizio sui vestiti in una richiesta pratica cortese.",
      "Rivedi l'elenco di parole visibile, poi correggi soltanto la terminazione malformata nella forma passata.",
      "Rivedi l'elenco di parole visibile. Il poliziotto sta parlando in questo momento; scegli l'enunciato corrispondente.",
      "Rivedi ogni voce dell'elenco di parole su stanze e luoghi, poi scegli l'enunciato sulla mappa già discussa.",
      "Rivedi ogni voce dell'elenco di parole sui luoghi pratici, poi scegli la richiesta cortese sulla borsa.",
      "Ascolta l'enunciato completo sulla lettura, poi scegli la frase esatta.",
      "Usa ogni voce dell'elenco di parole visibile per formulare una richiesta cortese.",
    ],
    accepted: SYNTHESIS_ACCEPTED_IT,
    retry: SYNTHESIS_RETRY_IT,
  }),
  "base-synthesis-3-practical-dialogue-outcome":
    "Trovare due luoghi familiari e chiedere una mappa in uno scambio coerente.",
  "base-synthesis-3-practical-dialogue-turn-1-translation":
    "Dov'è il minimarket?",
  "base-synthesis-3-practical-dialogue-turn-1-purpose":
    "Chiede la posizione di una destinazione già stabilita.",
  "base-synthesis-3-practical-dialogue-turn-2-translation":
    "Il minimarket è alla fermata dell'autobus.",
  "base-synthesis-3-practical-dialogue-turn-2-purpose":
    "Risponde con il tema は e il luogo に.",
  "base-synthesis-3-practical-dialogue-turn-3-translation":
    "Scusi, dov'è il bagno?",
  "base-synthesis-3-practical-dialogue-turn-3-purpose":
    "Mantiene lo stesso scambio pratico sulla posizione.",
  "base-synthesis-3-practical-dialogue-turn-4-translation":
    "Il bagno è alla stazione.",
  "base-synthesis-3-practical-dialogue-turn-4-purpose":
    "Fornisce il luogo richiesto senza cambiare struttura.",
  "base-synthesis-3-practical-dialogue-turn-5-translation":
    "Mi mostri la mappa, per favore.",
  "base-synthesis-3-practical-dialogue-turn-5-purpose":
    "Trasforma lo scambio sulla posizione in una richiesta pratica.",
  "base-synthesis-3-practical-dialogue-turn-6-translation":
    "Sì, la mostrerò.",
  "base-synthesis-3-practical-dialogue-turn-6-purpose":
    "Chiude la richiesta con una risposta appropriata.",

  ...semanticLessonCopy("base-synthesis-4", {
    title: "Combinare i meccanismi di base",
    objective:
      "Usare tutte le cinque superfici di riferimento in un'interazione mista senza trattarla come certificazione.",
    main:
      "Questa sintesi campiona anatomia della frase, particelle, classi verbali, tempo e polarità, aggettivi e copula in un'unica interazione guidata.",
    construction:
      "Mantieni ogni forma già appresa nel percorso di realizzazione approvato e ogni particella collegata al ruolo esatto retto.",
    constraints:
      "Questa interazione registra soltanto evidenze di pratica osservate; non certifica né sblocca un livello.",
    commonError:
      "Non ridurre ています in corso e ています di stato risultante a un'unica interpretazione.",
    nearestContrast:
      "Confronta un'azione visibilmente in corso con il risultato attuale di un cambiamento completato.",
    recap:
      "Hai combinato tutte le cinque superfici di riferimento in un'interazione mista senza introdurre contenuti nuovi.",
    translations: [
      "Non sono uno studente.",
      "Tanaka è tranquillo.",
      "Non ho letto un libro.",
      "Non mangio riso.",
      "Lo farò.",
      "Andrò a scuola.",
      "Alla stazione c'è un amico.",
      "L'addetto della stazione sta parlando adesso.",
      "L'amico è seduto su una sedia.",
      "Oggi non ho scritto.",
    ],
    purposes: [
      "Campiona l'anatomia della frase con una clausola d'identità completa.",
      "Campiona la superficie di riferimento di aggettivi e copula.",
      "Campiona un oggetto retto correttamente e una forma cortese godan.",
      "Campiona la classe ichidan con una forma generata approvata.",
      "Campiona la classe registrata di する senza inventare una forma.",
      "Campiona に di meta e il non-passato dinamico futuro.",
      "Campiona la struttura di esistenza animata.",
      "Legge ています come azione attualmente in corso.",
      "Legge ています come risultato attuale dell'atto di sedersi.",
      "Campiona la cella passata negativa con un riferimento temporale relativo.",
    ],
    instructions: [
      "Rivedi l'elenco di parole visibile, poi usa l'indizio di consultazione per scegliere la classificazione corrispondente.",
      "Rivedi l'elenco di parole visibile. In questa situazione il negozio è pulito; scegli la descrizione corrispondente.",
      "Rivedi l'elenco di parole visibile. Leggi prima di andare; scegli l'enunciato adatto.",
      "Rivedi l'elenco di parole visibile. La borsa è già l'argomento della conversazione; scegli l'indicazione di luogo corrispondente.",
      "Rivedi l'elenco di parole visibile, poi rimuovi l'unico suono finale in più dalla terminazione passata cortese malformata.",
      "Rivedi l'elenco di parole visibile. Suzuki sta studiando in questo momento; scegli l'enunciato corrispondente.",
      "Rivedi ogni voce dell'elenco di parole su persone e studio, poi scegli l'enunciato per un'azione in corso adesso.",
      "Rivedi ogni voce dell'elenco di parole su azioni e luoghi, poi scegli l'enunciato sul diario già discusso.",
      "Ascolta l'enunciato completo sull'attività, poi scegli la corrispondenza esatta.",
      "Usa ogni voce dell'elenco di parole visibile per formulare una richiesta cortese di lettura.",
    ],
    accepted: SYNTHESIS_ACCEPTED_IT,
    retry: SYNTHESIS_RETRY_IT,
  }),
  "base-synthesis-4-practical-dialogue-outcome":
    "Completare un'interazione mista di base registrando soltanto evidenze di pratica.",
  "base-synthesis-4-practical-dialogue-turn-1-translation":
    "Il mio amico è uno studente.",
  "base-synthesis-4-practical-dialogue-turn-1-purpose":
    "Stabilisce la persona per l'interazione mista.",
  "base-synthesis-4-practical-dialogue-turn-2-translation":
    "Studia a scuola.",
  "base-synthesis-4-practical-dialogue-turn-2-purpose":
    "Verifica で di luogo d'azione nello scenario condiviso.",
  "base-synthesis-4-practical-dialogue-turn-3-translation":
    "Oggi andrà in ufficio.",
  "base-synthesis-4-practical-dialogue-turn-3-purpose":
    "Aggiunge una meta di movimento futura.",
  "base-synthesis-4-practical-dialogue-turn-4-translation":
    "Il mio amico è in ufficio.",
  "base-synthesis-4-practical-dialogue-turn-4-purpose":
    "Verifica la struttura esistenziale prima della richiesta.",
  "base-synthesis-4-practical-dialogue-turn-5-translation":
    "Legga il libro, per favore.",
  "base-synthesis-4-practical-dialogue-turn-5-purpose":
    "Aggiunge una richiesta pratica e circoscritta.",
  "base-synthesis-4-practical-dialogue-turn-6-translation":
    "Sì, lo leggerò oggi.",
  "base-synthesis-4-practical-dialogue-turn-6-purpose":
    "Chiude con un piano osservato, non con una decisione di livello.",
};

const SEMANTIC_OPERATION_COPY_IT: Readonly<Record<string, string>> = {
  "recognize-meaning-feedback-accepted":
    "L'enunciato scelto corrisponde al significato stabilito dal contesto.",
  "recognize-meaning-feedback-retry":
    "Rileggi chi o che cosa viene identificato prima di scegliere il significato.",
  "discriminate-form-function-feedback-accepted":
    "La forma scelta svolge la funzione discorsiva richiesta.",
  "discriminate-form-function-feedback-retry":
    "Distingui la forma visibile dalla funzione richiesta dal contesto.",
  "order-chunks-feedback-accepted":
    "I blocchi conservano l'organizzazione prevista con predicato finale.",
  "order-chunks-feedback-retry":
    "Individua il blocco predicativo identificativo e mantienilo alla fine.",
  "produce-controlled-feedback-accepted":
    "La risposta guidata esprime l'identificazione richiesta.",
  "produce-controlled-feedback-retry":
    "Usa solo i blocchi consentiti e completa l'identificazione richiesta.",
  "transform-form-feedback-accepted":
    "L'enunciato trasformato conserva il fatto cambiando l'organizzazione richiesta.",
  "transform-form-feedback-retry":
    "Mantieni costante il fatto e cambia solo l'organizzazione discorsiva richiesta.",
  "diagnose-error-feedback-accepted":
    "La diagnosi individua la reale incompatibilità di forma, struttura informativa o fatto.",
  "diagnose-error-feedback-retry":
    "Controlla il contesto, poi isola se il candidato contraddice forma, ruolo discorsivo o fatto dichiarato.",
  "select-contextual-response-feedback-accepted":
    "La risposta è grammaticale e fa avanzare naturalmente il contesto.",
  "select-contextual-response-feedback-retry":
    "Scegli l'enunciato che risponde senza aggiungere una proposizione estranea.",
  "retrieve-cumulative-feedback-accepted":
    "La risposta recupera lo schema precedente e applica la distinzione attuale.",
  "retrieve-cumulative-feedback-retry":
    "Recupera il predicato nominale precedente prima di applicare la nuova distinzione.",
  "identify-audio-feedback-accepted":
    "L'enunciato scritto scelto corrisponde alla registrazione completa.",
  "identify-audio-feedback-retry":
    "Ascolta l'intera sequenza, compresa la particella o il です finale.",
  "produce-spoken-feedback-accepted":
    "La risposta orale conserva i blocchi e la pronuncia prevista della particella.",
  "produce-spoken-feedback-retry":
    "Pronuncia un solo enunciato coerente, con は come wa e il finale predicativo intatto.",
  "noun-otousan-meaning": "padre altrui; papà (rispettoso)",
  "noun-okaasan-meaning": "madre altrui; mamma (rispettoso)",
  "noun-nan-meaning": "che cosa",
};

const SENTENCE_EXAMPLE_CONTEXT_COPY_IT: Readonly<Record<string, string>> = {
  "sentence-foundations-1-example-1-context": "Un’autopresentazione informale usa due blocchi nominali; resta un frammento.",
  "sentence-foundations-1-example-2-context": "Una didascalia mette la persona prima del ruolo finale.",
  "sentence-foundations-1-example-3-context": "Una nota d’album mette l’intestazione famiglia prima del supporto.",
  "sentence-foundations-1-example-4-context": "Una nota d’agenda mette il tempo prima della destinazione.",
  "sentence-foundations-1-example-5-context": "Un itinerario mette l’intestazione prima del luogo scelto.",
  "sentence-foundations-1-example-6-context": "Una nota telefonica mette il canale prima della persona prevista.",
  "sentence-foundations-1-example-7-context": "Una nota di abbinamento mette l’oggetto prima del luogo associato.",
  "sentence-foundations-1-example-8-context": "Una nota al banco mette il documento prima dello scopo.",
  "sentence-foundations-1-example-9-context": "Un’etichetta fotografica mette il supporto prima del nome Sakura.",
  "sentence-foundations-1-example-10-context": "Una seconda etichetta mette il supporto prima del nome Ken.",
  "sentence-foundations-2-example-1-context": "Il campo fotografia e il valore Tanaka sono entrambi espliciti.",
  "sentence-foundations-2-example-2-context": "Lo stesso campo è recuperabile, quindi resta soltanto Tanaka.",
  "sentence-foundations-2-example-3-context": "Un secondo campo fotografia e il valore Yamada sono espliciti.",
  "sentence-foundations-2-example-4-context": "Il secondo campo è recuperabile, quindi resta soltanto Yamada.",
  "sentence-foundations-2-example-5-context": "La persona raffigurata e la categoria umana sono esplicite.",
  "sentence-foundations-2-example-6-context": "La persona è recuperabile, quindi resta soltanto la categoria.",
  "sentence-foundations-2-example-7-context": "Il campo scuola e il ruolo studente sono espliciti.",
  "sentence-foundations-2-example-8-context": "Il campo scuola è recuperabile, quindi resta soltanto il ruolo.",
  "sentence-foundations-2-example-9-context": "Il campo telefono e la fotografia mostrata sono espliciti.",
  "sentence-foundations-2-example-10-context": "Il campo telefono è recuperabile, quindi resta soltanto la fotografia.",
  "sentence-foundations-3-example-1-context": "Alla domanda sul lavoro di Tanaka, il parlante fornisce il predicato completo «infermiere + です».",
  "sentence-foundations-3-example-2-context": "Alla domanda sul lavoro di Yamada, il parlante fornisce il predicato completo «avvocato + です».",
  "sentence-foundations-3-example-3-context": "Alla domanda sulla relazione, il parlante identifica la persona come amico.",
  "sentence-foundations-3-example-4-context": "Alla domanda sulla professione, il parlante identifica la persona come medico.",
  "sentence-foundations-3-example-5-context": "Alla domanda sul ruolo del parlante, la risposta è il predicato completo studente.",
  "sentence-foundations-3-example-6-context": "Alla domanda sul ruolo in aula, la risposta è il predicato completo insegnante.",
  "sentence-foundations-3-example-7-context": "Alla domanda su chi appare nella foto, il parlante risponde «io».",
  "sentence-foundations-3-example-8-context": "Alla domanda se la figura è umana, la risposta identifica una persona.",
  "sentence-foundations-3-example-9-context": "Alla domanda su quale animale sia mostrato, la risposta identifica un gatto.",
  "sentence-foundations-3-example-10-context": "Alla domanda su quale luogo sia mostrato, la risposta identifica una casa.",
  "sentence-foundations-4-example-1-context": "Il nome semplice Sakura modifica il titolo seguente in un’unità delimitata.",
  "sentence-foundations-4-example-2-context": "Il nome semplice Ken offre un secondo modello nome-prima-del-titolo.",
  "sentence-foundations-4-example-3-context": "Il nome libro precede il finale cortese in un predicato breve completo.",
  "sentence-foundations-4-example-4-context": "Il nome biglietto offre un secondo predicato breve completo.",
  "sentence-foundations-4-example-5-context": "Il parlante è esplicito prima della pausa; studente universitario resta finale.",
  "sentence-foundations-4-example-6-context": "L’amico è esplicito prima della pausa; studente internazionale resta finale.",
  "sentence-foundations-4-example-7-context": "Mika prima della pausa contrasta con l’unità nome-titolo.",
  "sentence-foundations-4-example-8-context": "Sora prima della pausa contrasta con l’unità nome-titolo.",
  "sentence-foundations-4-example-9-context": "Haru è esplicito e studente è il predicato finale.",
  "sentence-foundations-4-example-10-context": "Ai è esplicito e studente è il predicato finale.",
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
    "polite-verbs-1": { title: "La forma dizionario come forma di consultazione" },
    "polite-verbs-2": { title: "Distinguere le classi verbali" },
    "polite-verbs-3": { title: "Costruire i temi cortesi" },
    "polite-verbs-4": { title: "Usare il non-passato cortese" },
    "argument-particles-1": { title: "Temi transitivi e topicalizzazione" },
    "argument-particles-2": { title: "Mete e direzioni del movimento" },
    "argument-particles-3": { title: "Luoghi d'azione e mezzi" },
    "argument-particles-4": { title: "Scegliere la particella dal predicato" },
    "time-movement-1": { title: "Non-passato abituale e futuro" },
    "time-movement-2": { title: "Punti temporali e limiti" },
    "time-movement-3": { title: "Quattro forme cortesi di tempo e polarità" },
    "time-movement-4": { title: "Pianificare programma e percorso" },
    "copula-adjectives-1": { title: "Negativi cortesi dei predicati nominali" },
    "copula-adjectives-2": { title: "Predicati nominali nel tempo e nella polarità" },
    "copula-adjectives-3": { title: "Aggettivi descrittivi che si coniugano" },
    "copula-adjectives-4": { title: "Aggettivi di tipo nominale e modifica del nome" },
    "existence-location-1": { title: "Scegliere l'esistenza animata o inanimata" },
    "existence-location-2": { title: "Luogo ed entità negli enunciati di esistenza" },
    "existence-location-3": { title: "Luogo d'esistenza, luogo d'azione e tema" },
    "existence-location-4": { title: "Trovare persone e cose" },
    "requests-connection-1": { title: "Formare tutte le forme delimitate in te" },
    "requests-connection-2": { title: "Fare richieste delimitate" },
    "requests-connection-3": { title: "Collegare due azioni in sequenza" },
    "requests-connection-4": { title: "Azioni in corso e stati attuali" },
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
    ...POLITE_VERBS_COPY_IT,
    ...ARGUMENT_PARTICLES_COPY_IT,
    ...TIME_MOVEMENT_COPY_IT,
    ...COPULA_ADJECTIVES_COPY_IT,
    ...EXISTENCE_LOCATION_COPY_IT,
    ...SYNTHESIS_COPY_IT,
    ...SEMANTIC_OPERATION_COPY_IT,
    ...SENTENCE_EXAMPLE_CONTEXT_COPY_IT,
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

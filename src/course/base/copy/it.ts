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
      "Fotografia—famiglia. (frammento di selezione)",
      "Mattina—scuola. (frammento di agenda)",
      "Viaggio—mare. (frammento di itinerario)",
      "Telefono—nonna. (frammento di instradamento)",
      "Chiave—casa. (frammento di abbinamento)",
      "Biglietto—viaggio. (frammento al banco)",
      "Pane—mattina. (frammento per la colazione)",
      "Raffreddore—casa. (frammento di promemoria)",
    ],
    purposes: [
      "Modella un’autopresentazione naturale in due blocchi prima della copula.",
      "Modella una didascalia persona-più-ruolo.",
      "Modella un’etichetta mediale seguita dal contenuto scelto.",
      "Modella il contesto temporale seguito dalla voce finale dell’agenda.",
      "Modella un’intestazione d’itinerario seguita dalla meta.",
      "Modella un’etichetta telefonica seguita dalla persona prevista.",
      "Modella un oggetto-indizio seguito dal luogo abbinato.",
      "Modella un documento seguito dal suo scopo pratico.",
      "Modella un alimento seguito dal momento del pasto.",
      "Modella una condizione seguita dal luogo di cura recuperabile.",
    ],
    instructions: [
      'Un’etichetta fotografica richiede il partecipante evidenziato nello spazio finale. Scegli il frammento.',
      'Un’etichetta scolastica richiede il ruolo nello spazio finale. Scegli il frammento coerente.',
      'Un’etichetta telefonica richiede la persona prevista nello spazio finale. Scegli il frammento.',
      'Un’etichetta fotografica richiede il gruppo raffigurato nello spazio finale. Fornisci il frammento.',
      'Un inventario scolastico richiede l’oggetto mancante. Scegli il frammento coerente.',
      'La nota telefonica mostrata termina con un valore errato. Scegli la correzione.',
      'Un’etichetta di abbinamento richiede il luogo associato alla chiave. Scegli il frammento.',
      'Un’etichetta di biglietto richiede lo scopo previsto. Recupera il frammento.',
      'Ascolta il frammento completo della colazione, poi scegli la forma scritta.',
      'Ricorda il promemoria di cura e pronuncia a memoria il frammento in due blocchi.',
    ],
    accepted: [
      "Il frammento identifica il partecipante evidenziato senza fingere di essere una frase completa.",
      "Il nome di ruolo scelto completa il campo come blocco unico.",
      "Il titolo personale finale completa il frammento di instradamento.",
      "Il nome famiglia completa l’etichetta fotografica come frammento coerente.",
      "Il frammento-oggetto completa la lista senza aggiungere materiale estraneo.",
      "La correzione sostituisce il valore finale estraneo con il destinatario previsto.",
      "Il luogo completa il frammento di abbinamento con la chiave.",
      "Lo scopo completa il frammento del biglietto.",
      "Il frammento scritto in due blocchi corrisponde alla registrazione completa.",
      "Il frammento orale conserva l’ordine del promemoria di cura.",
    ],
    retry: [
      "Usa il partecipante evidenziato, non un’altra persona nella stessa scena.",
      "Completa un campo di ruolo con un nome di ruolo, non con un evento.",
      "Scegli il titolo personale richiesto dall’etichetta, non un valore meteorologico.",
      "L’etichetta fotografica richiede il gruppo raffigurato, non una persona estranea.",
      "Torna all’oggetto mancante nella lista e scarta l’etichetta di evento.",
      "Tratta il valore telefonico mostrato come errore, poi scegli la persona prevista.",
      "Mantieni prima la chiave e scegli il luogo associato per lo spazio finale.",
      "Mantieni prima il biglietto e recupera il suo scopo per lo spazio finale.",
      "Riascolta entrambi i blocchi invece di abbinare un solo nome.",
      "Ricorda entrambi i blocchi e il loro ordine; non leggere un’opzione.",
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
      'L’etichetta fotografica esplicita è già condivisa. Scegli il nome restante sufficiente.',
      'Una seconda etichetta fotografica è già condivisa. Scegli il nome restante sufficiente.',
      'Una scheda di categoria chiede quale partecipante sia evidenziato. Scegli il frammento contestuale.',
      'La coppia esplicita scuola-ruolo è condivisa. Scegli il ruolo finale sufficiente.',
      'La coppia esplicita telefono-ruolo è condivisa. Scegli il ruolo finale sufficiente.',
      'Una coppia fotografica esplicita termina con un oggetto estraneo. Scegli la persona corretta.',
      'Una coppia fotografica esplicita è condivisa. Scegli il valore animale sufficiente.',
      'Una coppia scuola-oggetto è condivisa. Recupera il valore-oggetto sufficiente.',
      'È mostrata una chiave. Ascolta il luogo abbinato, poi scegli il valore sufficiente.',
      'Ricorda il dispositivo abbinato alla fotografia mostrata e pronuncialo a memoria.',
    ],
    accepted: [
      "Il campo fotografia è recuperabile, quindi basta il nome corrispondente.",
      "Il secondo campo fotografia consente la risposta con il nome diverso.",
      "Il nome di categoria riempie il campo identificativo senza materiale aggiuntivo.",
      "Il campo scuola è recuperabile e il ruolo scelto resta informazione finale.",
      "Il campo telefono è recuperabile e il titolo scelto resta informazione finale.",
      "La correzione sostituisce l’oggetto estraneo con la persona richiesta dalla fotografia.",
      "Il valore animale basta perché il campo fotografia è già condiviso.",
      "Il valore-oggetto recupera correttamente la coppia scuola-oggetto.",
      "Il valore di luogo scritto corrisponde alla parola registrata abbinata alla chiave.",
      "L’etichetta orale del dispositivo corrisponde alla coppia di schermo stabilita.",
    ],
    retry: [
      "Ometti soltanto il campo fotografia condiviso e conserva il nome abbinato.",
      "Tieni distinte le due coppie fotografiche e conserva il secondo nome.",
      "Il campo richiede una categoria umana, non un oggetto estraneo.",
      "Ometti il campo scuola condiviso e fornisci soltanto il ruolo.",
      "Ometti il campo telefono e conserva il titolo personale, non un elemento di viaggio.",
      "Diagnostica l’oggetto finale come errato prima di scegliere la persona.",
      "Il campo fotografia è già visibile: rispondi soltanto con il valore animale.",
      "Ricorda l’oggetto abbinato al campo scuola esplicito.",
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
      'Una mappa evidenzia un edificio. Completa la risposta predicativa cortese.',
      'Trasforma il frammento nominale mostrato in un predicato cortese completo.',
      'Il candidato mostrato nomina l’oggetto sbagliato. Scegli la riparazione completa.',
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
      "Quanto a Sora, è insegnante.",
      "Quanto a Mika, è insegnante.",
      "Quanto a Tanaka, è infermiere.",
      "Quanto a Yamada, è avvocato.",
    ],
    purposes: [
      "Introduce il modello nome-semplice-prima-del-titolo.",
      "Recupera lo stesso ordine con un secondo nome.",
      "Mostra un predicato-oggetto breve completo.",
      "Mostra un altro predicato breve senza inversione italiana.",
      "Contrasta un referente esplicito con il ruolo finale.",
      "Mantiene il referente di relazione distinto dal ruolo finale.",
      "Contrasta Sora come tema sospeso con l’unità titolo.",
      "Contrasta il tema sospeso con l’unità nome-titolo.",
      "Separa Tanaka dal predicato infermiere.",
      "Separa Yamada dal predicato avvocato.",
    ],
    instructions: [
      'Una scheda del personale richiede un’unità nome-titolo. Scegli l’identificazione completa.',
      'Il contesto richiede un composto con titolo, non una pausa parlata. Scegli la forma.',
      'Disponi il nome fornito prima del titolo e mantieni il finale predicativo per ultimo.',
      'Una scheda di ruolo richiede un predicato nominale breve completo. Scegli la forma.',
      'Accorcia la fonte esplicita conservando il predicato di ruolo finale.',
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
      "Il predicato breve conserva il fatto sorgente perché il referente resta recuperabile.",
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
      "Elimina solo il referente recuperabile; il fatto predicativo deve restare invariato.",
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
      'Una fotografia è l’ancora discorsiva stabilita. Scegli il commento corrispondente.',
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
      'Recupera l’autoidentificazione focalizzata della scena d’iscrizione e pronunciala.',
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
      "Conserva il fatto sul parlante studente cambiando il tema sospeso in focus correttivo.",
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
      "È amico mio.",
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
      'Due destinazioni di viaggio devono restare elementi pari. Scegli l’elenco delimitato.',
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
      "Le due destinazioni restano elementi pari collegate da と di elenco.",
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
      "Mantieni と fra le due destinazioni pari; の creerebbe modificazione.",
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
      "È Yuki?",
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
      "Usa il nome rispettoso in terza persona in una domanda di identificazione.",
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
  "topic-questions-4-clarification-dialogue-turn-1-translation": "Chi sei?",
  "topic-questions-4-clarification-dialogue-turn-1-purpose":
    "Apre lo scambio con una domanda d’identità.",
  "topic-questions-4-clarification-dialogue-turn-2-translation": "Sono Yuki.",
  "topic-questions-4-clarification-dialogue-turn-2-purpose":
    "Risponde alla domanda aperta con よ assertivo.",
  "topic-questions-4-clarification-dialogue-turn-3-translation":
    "Il tuo paese è il Giappone?",
  "topic-questions-4-clarification-dialogue-turn-3-purpose":
    "Controlla il paese della stessa persona con は e か.",
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
  "noun-yuki-meaning": "Yuki",
  "noun-yuki-san-meaning": "Yuki (riferimento rispettoso in terza persona)",
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
  "sentence-foundations-1-example-3-context": "Una nota di selezione mette il mezzo prima del gruppo raffigurato.",
  "sentence-foundations-1-example-4-context": "Una nota d’agenda mette il tempo prima della destinazione.",
  "sentence-foundations-1-example-5-context": "Un itinerario mette l’intestazione prima del luogo scelto.",
  "sentence-foundations-1-example-6-context": "Una nota telefonica mette il canale prima della persona prevista.",
  "sentence-foundations-1-example-7-context": "Una nota di abbinamento mette l’oggetto prima del luogo associato.",
  "sentence-foundations-1-example-8-context": "Una nota al banco mette il documento prima dello scopo.",
  "sentence-foundations-1-example-9-context": "Una nota per la colazione mette l’alimento prima del momento.",
  "sentence-foundations-1-example-10-context": "Un promemoria mette la condizione prima del luogo di cura.",
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
  "sentence-foundations-4-example-7-context": "Sora prima della pausa contrasta con l’unità nome-titolo.",
  "sentence-foundations-4-example-8-context": "Mika prima della pausa contrasta con l’unità nome-titolo.",
  "sentence-foundations-4-example-9-context": "Tanaka è esplicito e infermiere è il predicato finale.",
  "sentence-foundations-4-example-10-context": "Yamada è esplicito e avvocato è il predicato finale.",
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

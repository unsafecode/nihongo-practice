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
      "Io. (frammento contestuale)",
      "Studente. (frammento contestuale)",
      "Insegnante. (frammento contestuale)",
      "Un gatto. (frammento contestuale)",
      "Casa. (frammento contestuale)",
      "Il mare. (frammento contestuale)",
      "Un libro. (frammento contestuale)",
      "Scuola. (frammento contestuale)",
      "Una fotografia. (frammento contestuale)",
      "Un biglietto. (frammento contestuale)",
    ],
    purposes: [
      "Mostra un frammento del parlante consentito da una fotografia condivisa.",
      "Mostra un frammento di ruolo consentito da un campo d’iscrizione.",
      "Mostra un frammento di titolo consentito da una scena in aula.",
      "Mostra un frammento animale consentito da una figura visibile.",
      "Mostra un frammento di luogo consentito da una mappa condivisa.",
      "Mostra un frammento di scena consentito dall’ambiente visibile.",
      "Mostra un frammento-oggetto consentito da una richiesta condivisa.",
      "Mostra un frammento di luogo consentito da una scheda di percorso.",
      "Mostra un frammento-oggetto consentito da uno schermo condiviso.",
      "Mostra un frammento di viaggio consentito da uno scambio al banco.",
    ],
    instructions: [
      'Una foto di gruppo evidenzia un partecipante. Scegli il frammento adatto alla situazione.',
      'Una fotografia scolastica ha un campo di ruolo nella didascalia. Scegli il frammento che lo completa.',
      'In una chiamata all’aula manca l’identità della persona prevista. Scegli il frammento corrispondente.',
      'Una figura evidenzia un animale. Fornisci soltanto il frammento contestuale.',
      'In una lista scolastica manca un oggetto. Scegli il frammento che la completa.',
      'Uno scenario con mappa e chiave contiene una risposta errata. Scegli la riparazione adatta.',
      'Una scena costiera stabilisce visivamente il referente. Scegli il frammento naturale.',
      'Un percorso mattutino richiama una scheda di luogo precedente. Recupera il frammento.',
      'Ascolta una volta la parola-oggetto registrata, poi scegli il frammento corrispondente.',
      'Recupera la richiesta al banco viaggi e pronuncia il frammento a memoria.',
    ],
    accepted: [
      "Il frammento identifica il partecipante evidenziato senza fingere di essere una frase completa.",
      "Il nome di ruolo scelto completa il campo come blocco unico.",
      "Il titolo personale corrisponde al referente stabilito dalla scena in aula.",
      "Il nome dell’animale è un frammento sufficiente per l’immagine condivisa.",
      "Il frammento-oggetto completa la lista senza aggiungere materiale estraneo.",
      "La correzione sostituisce il frammento estraneo con il luogo consentito dalla mappa.",
      "Il contesto costiero rende recuperabile il nome della scena scelto.",
      "Il percorso recupera correttamente il frammento di luogo precedente.",
      "Il frammento scritto corrisponde alla parola-oggetto registrata per intero.",
      "Il frammento orale fornisce esattamente l’elemento richiesto al banco.",
    ],
    retry: [
      "Usa il partecipante evidenziato, non un’altra persona nella stessa scena.",
      "Completa un campo di ruolo con un nome di ruolo, non con un evento.",
      "Scegli il titolo umano stabilito dall’aula, non un nome meteorologico.",
      "L’immagine richiede il referente animale; limita la risposta a un frammento.",
      "Torna all’oggetto mancante nella lista e scarta l’etichetta di evento.",
      "Tratta la risposta mostrata come errore, poi scegli il luogo associato alla chiave.",
      "Recupera il referente costiero visibile prima di scegliere il frammento.",
      "Ricorda quale luogo era stabilito dalla scheda del percorso.",
      "Riascolta l’intera registrazione e abbina il nome come unità.",
      "Ricorda l’elemento richiesto; non leggere ad alta voce le opzioni.",
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
      "Tanaka. (frammento di risposta sufficiente)",
      "Yamada. (frammento di risposta sufficiente)",
      "Una persona. (frammento di risposta sufficiente)",
      "Io. (frammento con contesto recuperabile)",
      "Studente. (frammento con contesto recuperabile)",
      "Insegnante. (frammento con contesto recuperabile)",
      "Un gatto. (frammento con contesto recuperabile)",
      "Un libro. (frammento con contesto recuperabile)",
      "Casa. (frammento con contesto recuperabile)",
      "Una fotografia. (frammento con contesto recuperabile)",
    ],
    purposes: [
      "Usa una fotografia condivisa per consentire una risposta con un solo nome.",
      "Usa una seconda fotografia per consentire un altro nome sufficiente.",
      "Usa un campo categoriale visibile per consentire un nome sufficiente.",
      "Mostra l’omissione di una persona fotografata recuperabile.",
      "Mostra l’omissione di un campo d’iscrizione recuperabile.",
      "Mostra l’omissione di un partecipante d’aula recuperabile.",
      "Mostra l’omissione di un referente raffigurato recuperabile.",
      "Mostra l’omissione di un oggetto indicato recuperabile.",
      "Mostra l’omissione di un luogo sulla mappa recuperabile.",
      "Mostra l’omissione di un campo sullo schermo recuperabile.",
    ],
    instructions: [
      'Un elenco di viaggio richiede un partecipante nominato. Scegli il frammento sufficiente.',
      'Un elenco scolastico richiede un altro partecipante. Scegli il frammento sufficiente.',
      'Una scheda di categoria chiede quale partecipante sia evidenziato. Scegli il frammento contestuale.',
      'In un modello strutturale manca il campo del ruolo. Completa solo il frammento finale.',
      'Una scheda-contatto sul telefono stabilisce il referente; scegli il frammento di ruolo.',
      'Un campo relativo al partecipante ha ricevuto una risposta-oggetto estranea. Scegli la correzione.',
      'Il referente raffigurato sul telefono è già condiviso. Scegli la risposta minima sufficiente.',
      'Un oggetto è già indicato. Recupera il frammento sufficiente dal modello precedente.',
      'Ascolta la risposta di luogo registrata, poi scegli il frammento che senti.',
      'Recupera l’oggetto mostrato sullo schermo precedente e pronuncia solo il frammento sufficiente.',
    ],
    accepted: [
      "Il partecipante nominato è recuperabile dall’elenco di viaggio, quindi la risposta breve basta.",
      "Il secondo nome identifica il referente diverso stabilito dall’elenco scolastico.",
      "Il nome di categoria riempie il campo identificativo senza materiale aggiuntivo.",
      "Il frammento di ruolo occupa il campo informativo finale del modello strutturale.",
      "Il titolo scelto fornisce il ruolo del contatto mentre la persona resta recuperabile.",
      "La correzione sostituisce un oggetto estraneo con il partecipante richiesto dal campo.",
      "Il frammento animale basta perché l’immagine sul telefono condivide già il referente.",
      "Il nome-oggetto recupera correttamente il modello dell’elemento indicato.",
      "Il frammento di luogo scritto corrisponde alla registrazione completa.",
      "Il frammento-oggetto orale è sufficiente per lo schermo condiviso.",
    ],
    retry: [
      "Usa l’elenco di viaggio per recuperare quale partecipante va identificato.",
      "Tieni distinti i due referenti degli elenchi e scegli il nome della voce scolastica.",
      "Il campo richiede una categoria umana, non un oggetto estraneo.",
      "Fornisci soltanto il ruolo che completa l’informazione finale del modello.",
      "Distingui un titolo personale da un elemento di viaggio estraneo.",
      "Diagnostica l’oggetto come errato per il campo personale prima di scegliere la persona.",
      "Il referente è già visibile sul telefono: rispondi soltanto con il nome animale corrispondente.",
      "Ricorda l’oggetto indicato invece di scegliere un altro elemento di viaggio.",
      "Riascolta il nome di luogo; qui non è stata ancora introdotta una frase più ampia.",
      "Ricorda l’oggetto sullo schermo condiviso e pronuncia soltanto quel frammento.",
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
      'Una scheda professionale e una fotografia identificano una persona. Scegli l’identificazione completa.',
      'Una seconda scheda professionale identifica un’altra persona. Scegli l’identificazione completa.',
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
    translations: [
      "Quanto a me, sono studente.",
      "Quanto a Tanaka, è infermiere.",
      "Quanto a Yamada, è una persona.",
      "Quanto al mio amico, è studente internazionale.",
      "Sono studente universitario. (Il parlante è recuperabile.)",
      "È studente internazionale. (L'amico è recuperabile.)",
      "Sono la mia famiglia. (Le persone nella foto sono recuperabili.)",
      "È studente. (La persona è recuperabile.)",
      "È insegnante. (La persona è recuperabile.)",
      "È una persona. (Il referente è recuperabile.)",
    ],
    purposes: [
      "Etichetta un tema sospeso parlato e il suo predicato finale.",
      "Separa Tanaka dal predicato infermiere senza fondere due nomi.",
      "Usa Yamada come tema sospeso esplicito prima di una categoria umana ampia.",
      "Usa un nome di relazione come tema sospeso esplicito.",
      "Omette il parlante recuperabile lasciando un predicato completo.",
      "Omette l'amico recuperabile conservando l'identità.",
      "Recupera dalla foto un gruppo già visibile.",
      "Mostra una risposta di ruolo generale con persona recuperabile.",
      "Mostra una risposta di titolo con persona recuperabile.",
      "Mostra che l'omissione dipende da un referente stabilito.",
    ],
    instructions: [
      'Il parlante viene reintrodotto prima di una pausa. Scegli l’identità coerente con i fatti condivisi.',
      'Un partecipante nominato viene reintrodotto prima di una pausa. Scegli la categoria umana con riferimento esplicito.',
      'Disponi il partecipante prima della pausa e l’informazione identificativa dopo.',
      'Un referente di relazione è esplicito. Completa la categoria più ampia richiesta dal contesto.',
      'Trasforma la fonte con riferimento esplicito nella risposta breve consentita dal contesto.',
      'Il candidato mostrato identifica male l’animale evidenziato. Scegli la riparazione contestuale.',
      'L’oggetto discusso è recuperabile. Scegli il predicato completo sufficiente.',
      'Il luogo discusso è recuperabile. Recupera il predicato completo sufficiente.',
      'Ascolta la risposta al banco, poi scegli il predicato completo che senti.',
      'Recupera l’edificio dal percorso precedente e pronuncia il predicato completo a memoria.',
    ],
    accepted: [
      "Il tema sospeso nomina il parlante e il predicato finale rispetta il profilo condiviso.",
      "Il partecipante esplicito e il predicato di categoria umana formano un tema sospeso naturale.",
      "Il partecipante precede la pausa e il predicato identificativo resta alla fine.",
      "Il referente di relazione è seguito dal ruolo più ampio come informazione nuova.",
      "Il predicato breve conserva il fatto sorgente perché il referente resta recuperabile.",
      "La correzione identifica l’animale evidenziato invece della categoria errata.",
      "Il predicato-oggetto basta perché il referente discorsivo è già stabilito.",
      "Il predicato di luogo recupera un posto noto senza ripetere il referente.",
      "Il predicato scritto corrisponde esattamente alla risposta registrata.",
      "Il predicato orale recupera l’edificio lasciando inespresso il referente condiviso.",
    ],
    retry: [
      "Dopo la pausa usa il profilo condiviso del parlante, non un ruolo estraneo.",
      "Mantieni il partecipante prima della pausa quando si richiede il riferimento esplicito.",
      "Metti il partecipante prima della pausa e l’identità in posizione predicativa finale.",
      "Tieni esplicito il referente di relazione e fornisci la categoria richiesta.",
      "Elimina solo il referente recuperabile; il fatto predicativo deve restare invariato.",
      "Diagnostica la categoria mostrata come errata, poi identifica l’animale raffigurato.",
      "Il referente è recuperabile, ma il predicato deve comunque nominare l’oggetto corretto.",
      "Recupera il luogo stabilito dalla scena precedente, non un oggetto portatile.",
      "Riascolta sia il nome al banco sia il finale predicativo completo.",
      "Ricorda l’edificio del percorso e pronuncia il predicato senza leggere le opzioni.",
    ],
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
      "Quanto alla fotografia, mostra un gatto.",
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
      "Usa una fotografia come tema e identifica l’animale raffigurato.",
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
      'Recupera lo scenario del biglietto e pronuncia la frase tematica a memoria.',
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
      "La frase orale mantiene tematico il documento e finale il valore scelto.",
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
      "Ricorda lo scenario al banco e produci a memoria l’intera frase tema-commento.",
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
      "Identifica Satou a partire dal ruolo studente focalizzato.",
      "Identifica Suzuki a partire dal ruolo insegnante focalizzato.",
      "Usa il ruolo medico come tema stabilito e identifica Mari.",
      "Riorganizza il fatto su Tanaka infermiere come tema stabilito per confrontarlo con が.",
      "Riorganizza il fatto su Yamada avvocato come tema stabilito per confrontarlo con が.",
      "Recupera il parlante come tema stabilito.",
      "Usa il ruolo studente universitario come tema stabilito e identifica il parlante.",
    ],
    instructions: [
      'Una fotografia evidenzia una persona appena selezionata. Scegli l’identificazione che riempie il campo aperto.',
      'Una persona è già il tema discorsivo. Scegli la frase che continua quel tema.',
      'Disponi la persona appena selezionata prima del marcatore focalizzante e il predicato alla fine.',
      'Una persona è già in discussione. Completa il commento identificativo continuativo.',
      'Riorganizza lo stesso fatto da tema sospeso a risposta correttiva focalizzata.',
      'Il candidato seleziona la persona sbagliata per un ruolo stabilito. Scegli la riparazione.',
      'Un ruolo professionale è già tema. Scegli il valore-persona stabilito dall’elenco.',
      'Recupera il modello ruolo-come-tema e applicalo alla voce successiva.',
      'Ascolta un ruolo stabilito seguito dal valore-persona, poi scegli la frase esatta.',
      'Recupera l’autoidentificazione focalizzata della scena d’iscrizione e pronunciala.',
    ],
    accepted: [
      "La persona appena selezionata riceve il focus e corrisponde al campo identificativo aperto.",
      "La persona già stabilita continua come tema invece di essere presentata come nuovo focus.",
      "La persona selezionata precede il marcatore di focus e la professione resta finale.",
      "Il tema personale continuativo riceve la professione registrata nell’elenco.",
      "La risposta correttiva focalizza la persona che possiede davvero il ruolo stabilito.",
      "La correzione sostituisce la persona errata e riprende il ruolo stabilito come tema.",
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
      "Conserva il fatto su Suzuki cambiando il tema sospeso in focus correttivo.",
      "Il candidato nomina il titolare sbagliato: correggi sia persona sia organizzazione discorsiva.",
      "Mantieni tematica la professione e recupera dall’elenco il valore-persona.",
      "Applica il modello ruolo-tema alla voce dell’avvocato, non a un medico estraneo.",
      "Ascolta se il ruolo è stabilito o la persona è focalizzata prima di scegliere.",
      "Ricorda il campo personale aperto della registrazione e produci la risposta focalizzata.",
    ],
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
      "È mio padre.",
      "È mia madre.",
      "È mio fratello maggiore.",
      "È mia sorella maggiore.",
      "È il padre di Tanaka (riferimento rispettoso).",
      "È la madre di Yamada (riferimento rispettoso).",
      "Anche mio padre è insegnante.",
      "Anche mia madre è medico.",
      "Anche mio fratello maggiore è studente.",
      "Anche mia sorella maggiore è avvocata.",
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
    instructions: [
      'È appena stato menzionato un altro professionista. Scegli la frase che aggiunge il genitore nominato.',
      'Una professione parallela è già attiva nel discorso. Scegli la frase che aggiunge il genitore.',
      'Disponi possessore e nome di parentela come sintagma unico prima della relazione additiva.',
      'Completa la frase familiare parallela mantenendo il possessore nel sintagma nominale.',
      'Trasforma la frase familiare tematica in frase additiva senza cambiare il fatto.',
      'Il candidato usa una relazione focalizzante dove serve una relazione additiva. Scegli la riparazione.',
      'È appena stato menzionato un ruolo parallelo. Scegli la frase rispettosa che aggiunge una persona.',
      'Recupera il modello familiare additivo per il termine rispettoso successivo.',
      'Ascolta possessore e nome di parentela rispettoso, poi scegli la frase esatta.',
      'Recupera la frase di parentela rispettosa dalla scheda precedente e pronunciala a memoria.',
    ],
    accepted: [
      "Il possessore nominato precede il nome di parentela e il nuovo familiare si aggiunge al ruolo condiviso.",
      "Il sintagma rispettoso resta integro e il marcatore additivo lo collega alla professione parallela.",
      "Il possessore precede il nome di parentela, seguito dalla relazione additiva e dal predicato.",
      "Il sintagma familiare del parlante resta integro mentre si aggiunge la professione parallela.",
      "La trasformazione cambia il tema in relazione additiva senza modificare il fatto.",
      "La correzione sostituisce il focus improprio con l’aggiunta richiesta dal contesto.",
      "Il sintagma rispettoso di terza persona aggiunge un altro titolare del ruolo stabilito.",
      "Il secondo sintagma rispettoso continua l’insieme professionale additivo.",
      "Il sintagma scritto corrisponde al possessore e al nome rispettoso registrati.",
      "Il sintagma orale conserva il possessore nominato prima del nome rispettoso.",
    ],
    retry: [
      "Mantieni il possessore unito al nome di parentela e usa l’aggiunta solo per il ruolo parallelo.",
      "Non trasformare il familiare parallelo in semplice tema; conserva la relazione additiva.",
      "Usa gli stessi blocchi nell’ordine modificatore–testa prima del predicato professionale.",
      "Mantieni il parlante come possessore interno al sintagma prima del ruolo parallelo.",
      "Conserva il fatto familiare e cambia soltanto il tema in marcatura additiva.",
      "Il contesto contiene già un medico parallelo: diagnostica il focus come relazione errata.",
      "Usa il termine rispettoso con il possessore nominato, poi marca l’aggiunta.",
      "Recupera il modello additivo e mantieni esplicito il riferimento rispettoso.",
      "Riascolta il confine del possessore e il nome-testa rispettoso.",
      "Ricorda l’intero sintagma rispettoso; non sostituire il possesso con il focus.",
    ],
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
      "Sono gli Stati Uniti?",
      "Il nome è Yuki?",
      "L'elenco comprende gli Stati Uniti e l'Italia.",
      "nome e paese",
      "Sono amico di Tanaka.",
      "Sì, è Yuki.",
      "No, è l'Italia.",
      "È Yuki?",
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
      "Usa il nome rispettoso in terza persona in una domanda di identificazione.",
    ],
    instructions: [
      'La risposta fornisce un valore del profilo prima ignoto. Scegli la richiesta aperta che l’ha suscitata.',
      'Un visitatore diverso richiede una conferma sì-no su un campo del profilo. Scegli la domanda completa.',
      'Disponi i due nomi forniti con il collegamento di elenco delimitato fra loro.',
      'Sono richiesti due campi del modulo. Fornisci l’elenco nominale come frammento contestuale.',
      'Trasforma l’affermazione di conferma completa in una domanda di conferma.',
      'La conferma mostrata contraddice il profilo stabilito. Scegli la riparazione fattuale.',
      'Rifiuta l’affermazione mostrata e fornisci il valore stabilito in una risposta coerente.',
      'All’interlocutore viene chiesto se condivide la relazione dichiarata. Scegli la domanda completa.',
      'Ascolta una volta la frase di relazione e scegli la forma esatta.',
      'Recupera la richiesta sulla relazione mancante e formulala ad alta voce a memoria.',
    ],
    accepted: [
      "La domanda aperta richiede il campo mancante senza proporre un valore ipotetico.",
      "Il marcatore finale trasforma la frase completa in una conferma sì-no.",
      "L’elenco delimitato colloca il collegamento nominale fra i due nomi forniti.",
      "Il frammento contestuale elenca due campi invece di subordinare un nome all’altro.",
      "La trasformazione conserva il contenuto e cambia l’affermazione in domanda.",
      "La correzione ripristina il valore stabilito mantenendo la risposta affermativa.",
      "La risposta rifiuta l’ipotesi falsa e fornisce il valore stabilito nello stesso turno.",
      "La domanda verifica se l’interlocutore condivide con Yuki la relazione dichiarata.",
      "La frase scritta corrisponde alla relazione e al marcatore ascoltati.",
      "La domanda orale aperta richiede la persona mancante nella relazione.",
    ],
    retry: [
      "Scegli una richiesta informativa aperta; un’ipotesi sì-no non completa questo campo.",
      "Mantieni intatta la frase e aggiungi il marcatore interrogativo soltanto alla fine.",
      "Usa gli stessi due blocchi nominali e tieni fra loro la relazione di elenco.",
      "Il compito richiede due campi coordinati, non un sintagma possessivo.",
      "Conserva l’espressione di conferma e cambia soltanto la forza della frase.",
      "Il valore mostrato contraddice il registro: scegli la correzione affermativa stabilita.",
      "Una correzione richiede sia il rifiuto sia il valore sostitutivo del registro.",
      "Usa la relazione di compagnia in una domanda completa, non in una frase tematica.",
      "Riascolta il marcatore di relazione: l’alternativa possessiva esprime altro.",
      "Ricorda la richiesta relazionale aperta invece di produrre un’asserzione tematica.",
    ],
  }),
  "topic-questions-4-clarification-dialogue-outcome":
    "Gli interlocutori apprendono il nome Yuki, confermano l'Italia e l'amicizia con Tanaka.",
  "topic-questions-4-clarification-dialogue-turn-1-translation": "Come ti chiami?",
  "topic-questions-4-clarification-dialogue-turn-1-purpose":
    "Apre lo scambio con una domanda informativa.",
  "topic-questions-4-clarification-dialogue-turn-2-translation": "Sono Yuki.",
  "topic-questions-4-clarification-dialogue-turn-2-purpose":
    "Risponde direttamente alla domanda aperta.",
  "topic-questions-4-clarification-dialogue-turn-3-translation":
    "Il tuo paese è l'Italia?",
  "topic-questions-4-clarification-dialogue-turn-3-purpose":
    "Controlla il paese della stessa persona con は e か.",
  "topic-questions-4-clarification-dialogue-turn-4-translation":
    "Sì, è l'Italia.",
  "topic-questions-4-clarification-dialogue-turn-4-purpose":
    "Conferma il paese senza cambiare referente.",
  "topic-questions-4-clarification-dialogue-turn-5-translation":
    "Sei amico di Tanaka?",
  "topic-questions-4-clarification-dialogue-turn-5-purpose":
    "Controlla la relazione di compagnia.",
  "topic-questions-4-clarification-dialogue-turn-6-translation":
    "Sì, è corretto.",
  "topic-questions-4-clarification-dialogue-turn-6-purpose":
    "Chiude il chiarimento con una conferma.",
  "noun-toshi-meaning": "città",
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
  "sentence-foundations-1-example-1-context": 'Una fotografia di gruppo rende recuperabile il parlante; la risposta pronunciata è solo un frammento.',
  "sentence-foundations-1-example-2-context": 'Un campo d’iscrizione rende recuperabile il ruolo richiesto; la risposta è solo un frammento.',
  "sentence-foundations-1-example-3-context": 'Una scena in aula rende recuperabile il titolo richiesto; la risposta è solo un frammento.',
  "sentence-foundations-1-example-4-context": 'Una figura visibile rende recuperabile l’animale; la risposta è solo un frammento.',
  "sentence-foundations-1-example-5-context": 'Una mappa condivisa rende recuperabile il campo del luogo; la risposta è solo un frammento.',
  "sentence-foundations-1-example-6-context": 'L’ambiente visibile rende recuperabile la scena; la risposta è solo un frammento.',
  "sentence-foundations-1-example-7-context": 'Una richiesta-oggetto condivisa rende recuperabile il campo mancante; la risposta è un frammento.',
  "sentence-foundations-1-example-8-context": 'Una scheda di percorso rende recuperabile la destinazione; la risposta è un frammento.',
  "sentence-foundations-1-example-9-context": 'Uno schermo condiviso rende recuperabile il campo-oggetto; la risposta è un frammento.',
  "sentence-foundations-1-example-10-context": 'Uno scambio al banco rende recuperabile il documento richiesto; la risposta è un frammento.',
  "sentence-foundations-2-example-1-context": 'Una fotografia condivisa rende recuperabile il nome richiesto; un nome è sufficiente.',
  "sentence-foundations-2-example-2-context": 'Una seconda fotografia stabilisce un altro referente; un nome è sufficiente.',
  "sentence-foundations-2-example-3-context": 'Un campo categoriale visibile rende recuperabile la categoria richiesta; un nome è sufficiente.',
  "sentence-foundations-2-example-4-context": 'La persona fotografata è già condivisa, quindi la risposta omette il referente.',
  "sentence-foundations-2-example-5-context": 'Il campo d’iscrizione è già condiviso, quindi la risposta omette la domanda completa.',
  "sentence-foundations-2-example-6-context": 'Il partecipante d’aula è già condiviso, quindi la risposta omette il referente.',
  "sentence-foundations-2-example-7-context": 'L’animale raffigurato è già condiviso, quindi la risposta omette l’identificazione completa.',
  "sentence-foundations-2-example-8-context": 'L’oggetto indicato è già condiviso, quindi la risposta omette l’identificazione completa.',
  "sentence-foundations-2-example-9-context": 'Il luogo sulla mappa è già condiviso, quindi la risposta omette l’identificazione completa.',
  "sentence-foundations-2-example-10-context": 'Il campo sullo schermo è già condiviso, quindi la risposta omette l’identificazione completa.',
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
  "sentence-foundations-4-example-1-context": "Nel parlato rilassato, わたし è tema sospeso prima della pausa, seguito dal predicato studente.",
  "sentence-foundations-4-example-2-context": "Tanaka viene reintrodotto come tema sospeso parlato; infermiere resta il predicato finale.",
  "sentence-foundations-4-example-3-context": "Yamada viene reintrodotto come tema sospeso parlato; la categoria umana ampia resta il predicato finale.",
  "sentence-foundations-4-example-4-context": "L'amico viene reintrodotto prima della pausa; studente internazionale è l'informazione nuova.",
  "sentence-foundations-4-example-5-context": "La domanda riguarda il parlante, che viene omesso; resta studente universitario.",
  "sentence-foundations-4-example-6-context": "La domanda riguarda l'amico, che viene omesso; resta studente internazionale.",
  "sentence-foundations-4-example-7-context": "Le persone nella foto sono già visibili; la risposta le identifica come famiglia.",
  "sentence-foundations-4-example-8-context": "La persona discussa è recuperabile; viene pronunciato solo il predicato studente.",
  "sentence-foundations-4-example-9-context": "La persona discussa è recuperabile; viene pronunciato solo il predicato insegnante.",
  "sentence-foundations-4-example-10-context": "Il referente è stabilito; la risposta fornisce solo la categoria umana.",
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

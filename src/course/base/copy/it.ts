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
      "blocco del parlante: io → identità finale: studente",
      "blocco del parlante: io → identità finale: insegnante",
      "blocco del ruolo: studente → persona: me",
      "blocco fotografia → animale identificato: gatto",
      "blocco chiave → luogo associato: casa",
      "blocco vento → scena: mare",
      "blocco biglietto → evento: viaggio",
      "blocco temporale: mattina → luogo: scuola",
      "blocco telefono → persona prevista: insegnante",
      "blocco pane → oggetto in contrasto: libro",
    ],
    purposes: [
      "Separa il blocco del parlante dal blocco finale del ruolo.",
      "Contrasta un titolo professionale con il blocco precedente del parlante.",
      "Mostra che l'indizio di ruolo e la risposta personale sono blocchi distinti.",
      "Usa un contesto visivo per selezionare un blocco animale concreto.",
      "Usa un'associazione con un oggetto per recuperare un luogo senza creare una frase.",
      "Usa un indizio ambientale per recuperare il blocco della scena.",
      "Distingue il blocco biglietto dal blocco evento che evoca.",
      "Contrasta un blocco temporale con il luogo fornito dal contesto.",
      "Usa il mezzo di comunicazione per recuperare la persona prevista.",
      "Contrasta due oggetti senza trattarli come sintassi.",
    ],
    instructions: [
      "In una foto di gruppo, scegli il frammento che indica il parlante.",
      "All'iscrizione, scegli il frammento che indica il ruolo di studente.",
      "Disponi insegnante come blocco-indizio e io come blocco-risposta finale.",
      "Indicando l'animale nella foto, scegli il frammento gatto.",
      "Trasforma il modello scuola→viaggio sostituendo solo il blocco finale con libro.",
      "Il candidato dice telefono nel contesto chiave-mappa: diagnostica scegliendo casa.",
      "Per la scena con le onde, scegli il frammento mare.",
      "Per l'edificio sul percorso mattutino, scegli il frammento scuola.",
      "Ascolta il nome dell'oggetto registrato, poi scegli il frammento corrispondente.",
      "Recupera il documento richiesto nella precedente scena al banco e pronuncia solo quel frammento.",
    ],
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
    translations: [
      "indizio fotografia → risposta finale: Tanaka",
      "indizio fotografia → risposta finale: Yamada",
      "blocco persona → persona focalizzata: me",
      "indizio fotografia → risposta finale recuperabile: gatto",
      "indizio scuola → risposta finale recuperabile: libro",
      "indizio chiave → risposta finale recuperabile: casa",
      "indizio telefono → risposta finale recuperabile: fotografia",
      "indizio viaggio → risposta finale recuperabile: biglietto",
      "indizio mattina → risposta finale recuperabile: scuola",
      "indizio casa → risposta finale recuperabile: telefono",
    ],
    purposes: [
      "Mostra un indizio fotografico seguito dalla risposta personale finale.",
      "Contrasta una seconda risposta nominata nello stesso contesto fotografico.",
      "Usa un indizio categoriale per focalizzare il riferimento al parlante.",
      "Mostra come il contesto visivo condiviso consenta una risposta animale di un blocco.",
      "Mostra come la scuola condivisa consenta una risposta oggetto di un blocco.",
      "Mostra come una chiave associata consenta una risposta di luogo recuperabile.",
      "Usa uno schermo condiviso per consentire una risposta fotografia di un blocco.",
      "Usa la situazione di viaggio per consentire la risposta finale biglietto.",
      "Usa un quadro temporale condiviso per consentire la risposta scuola.",
      "Usa un campo di modulo condiviso per consentire la risposta telefono.",
    ],
    instructions: [
      "Dalla scheda con il nome, recupera soltanto il frammento Tanaka.",
      "Dalla seconda scheda, recupera soltanto il frammento Yamada.",
      "Disponi io come primo blocco e persona come categoria finale.",
      "Nello spazio finale del modello, scegli studente.",
      "Trasforma persona→studente in persona→insegnante senza invertire i blocchi.",
      "Il candidato risponde telefono per la fotografia condivisa: diagnostica scegliendo io.",
      "Con l'animale già condiviso, rispondi soltanto gatto.",
      "Con l'oggetto già indicato, rispondi soltanto libro.",
      "Ascolta la risposta di luogo registrata per la mappa condivisa, poi scegli il frammento corrispondente.",
      "Recupera l'oggetto della precedente scena sullo schermo e pronuncia solo quel frammento.",
    ],
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
      "L'infermiere è la persona nella prima foto: scegli la risposta completa Tanaka.",
      "L'avvocato è la persona nella seconda foto: scegli la risposta completa Yamada.",
      "Disponi biglietto prima di です per costruire il predicato completo.",
      "La mappa indica la scuola: scegli l'identificazione cortese completa.",
      "Trasforma i blocchi mattina e です mostrati nell'ordine predicativo corretto.",
      "Il candidato identifica la chiave come mare: diagnostica scegliendo il predicato chiave.",
      "Il medico indica l'oggetto sulla scrivania: scegli il predicato completo telefono.",
      "Arriva un cliente: scegli il predicato completo che lo identifica.",
      "Ascolta senza leggere una risposta, poi scegli il predicato nominale completo che corrisponde alla registrazione.",
      "Recupera l'evento nominato nella precedente scena del biglietto e pronuncia il predicato cortese completo.",
    ],
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
    translations: [
      "Quanto a me, sono studente.",
      "Quanto a Tanaka, è infermiere.",
      "Quanto a Yamada, è avvocato.",
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
      "Separa Yamada dal predicato avvocato.",
      "Usa un nome di relazione come tema sospeso esplicito.",
      "Omette il parlante recuperabile lasciando un predicato completo.",
      "Omette l'amico recuperabile conservando l'identità.",
      "Recupera dalla foto un gruppo già visibile.",
      "Mostra una risposta di ruolo generale con persona recuperabile.",
      "Mostra una risposta di titolo con persona recuperabile.",
      "Mostra che l'omissione dipende da un referente stabilito.",
    ],
    instructions: [
      "Reintroducendo il parlante, scegli «Quanto a me, studente universitario».",
      "Reintroducendo Tanaka come tema sospeso, indica la relazione di amicizia.",
      "Disponi Yamada prima della pausa e amico nel predicato finale.",
      "Con l'amico esplicito, scegli studente invece del candidato estraneo studente internazionale.",
      "Trasforma «Quanto a me, il mare» nella risposta breve che omette il parlante recuperabile.",
      "La foto di famiglia condivisa richiede l'animale: diagnostica il candidato che risponde «famiglia» e identifica il gatto.",
      "L'oggetto è condiviso: rispondi soltanto che è un telefono.",
      "Il luogo è condiviso: rispondi soltanto che è una casa.",
      "Ascolta la risposta al banco, poi scegli il predicato completo che corrisponde all'oggetto registrato.",
      "Recupera l'edificio condiviso nel percorso precedente e pronuncia il suo predicato completo.",
    ],
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
      "Quanto a Tanaka, è un amico.",
      "Yamada, invece, è un amico.",
      "Tokyo è una città.",
      "Tornando a Kyoto: è una città.",
      "Quanto a Osaka, la categoria corretta è città.",
      "Quanto al mio amico, è studente.",
      "Quanto al familiare in questione, è Tanaka.",
      "Quanto al gatto, è un amico.",
      "Quanto a me, la mia risposta sulla città è Tokyo.",
    ],
    purposes: [
      "Stabilisce il parlante come tema discorsivo.",
      "Usa una persona nominata come tema già stabilito.",
      "Attribuisce a は una vera lettura contrastiva.",
      "Introduce Tokyo in un semplice commento categoriale.",
      "Riprende Kyoto come tema già menzionato.",
      "Usa は per correggere la categoria di Osaka senza presentarla come soggetto nuovo.",
      "Mantiene il tema distinto dal focus professionale.",
      "Usa il tema famiglia per selezionare il membro identificato come Tanaka.",
      "Applica il tema a un referente non umano.",
      "Usa una foto come tema e il luogo raffigurato come commento.",
    ],
    instructions: [
      "La foto mostra Tokyo: identifica Tokyo, non la categoria generica città.",
      "Scegli la versione che marca esplicitamente la fotografia come tema con は, non quella con pausa da tema sospeso.",
      "Disponi fotografia + は prima di Osaka e です per formare il commento tematico.",
      "Sei il tema stabilito e il ruolo noto è studente universitario, non infermiere.",
      "Trasforma la frase con Tanaka-infermiere come tema sospeso in una frase con tema esplicito は senza cambiare il fatto.",
      "Il candidato assegna a Yamada il ruolo infermiere: diagnostica l'errore fattuale e scegli avvocato.",
      "Il tuo amico è il tema stabilito: identificalo come studente internazionale.",
      "Il gatto è già discusso come parte della casa: scegli il commento famiglia.",
      "Ascolta la frase registrata con la casa come tema e scegli il commento di città corrispondente.",
      "Recupera la destinazione dalla precedente scena del biglietto e pronuncia la frase tematica contrastiva completa.",
    ],
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
      "È Tanaka a essere l'infermiere.",
      "No: è Yamada a essere l'avvocato.",
      "È il mio amico a essere studente internazionale.",
      "Lo studente è Satou.",
      "L'insegnante è Suzuki.",
      "Il medico è Mari.",
      "La persona sono io.",
      "Il familiare è Tanaka.",
      "Quanto a me, sono studente universitario.",
      "Quanto al familiare, è Tanaka.",
    ],
    purposes: [
      "Introduce Tanaka come infermiere appena selezionato.",
      "Usa が come focus correttivo su Yamada avvocato.",
      "Seleziona l'amico come studente internazionale.",
      "Identifica Satou a partire dal ruolo studente focalizzato.",
      "Identifica Suzuki a partire dal ruolo insegnante focalizzato.",
      "Usa il ruolo medico come tema stabilito e identifica Mari.",
      "Seleziona la persona nella foto come parlante.",
      "Seleziona Tanaka come familiare pertinente.",
      "Recupera il parlante come tema stabilito.",
      "Contrasta il tema famiglia con la selezione di un familiare.",
    ],
    instructions: [
      "La persona evidenziata nella fotografia è Satou: scegli l'identificazione che corrisponde a questa nuova selezione.",
      "La conversazione ha già stabilito Satou e ora conferma il ruolo studente: scegli l'organizzazione che continua il tema.",
      "Disponi i blocchi per presentare Mari come medico appena selezionato.",
      "La conversazione riguarda già Mari e ora conferma il ruolo medico: completa il commento continuativo.",
      "Riorganizza lo stesso fatto Suzuki–insegnante da tema sospeso a risposta correttiva focalizzata.",
      "Il candidato contraddice l'elenco: Suzuki, non Mari, è l'insegnante già in discussione.",
      "Il ruolo infermiere è già il tema: identifica Tanaka come valore.",
      "Il ruolo avvocato è già il tema: identifica Yamada come valore.",
      "Ascolta il ruolo studente internazionale come tema e scegli il nome di relazione nella registrazione.",
      "Recupera l'autoidentificazione focalizzata dalla precedente scena d'iscrizione e pronunciala.",
    ],
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
      "Dopo un altro insegnante, di' che anche il padre di Tanaka è insegnante.",
      "Dopo un altro medico, di' che anche la madre di Yamada è medico.",
      "Disponi わたし + の + あに come sintagma unico prima di も additivo e del predicato studente.",
      "Aggiungi che anche mia sorella è avvocata, mantenendo わたしの.",
      "Trasforma la frase sul padre da tema con は ad aggiunta con も dopo aver menzionato un altro insegnante.",
      "Il candidato usa が benché sia appena stato menzionato un altro medico: diagnostica con も additivo.",
      "Dopo un altro insegnante, aggiungi il termine rispettoso おとうさん con も.",
      "Dopo un altro medico, aggiungi il termine rispettoso おかあさん con も.",
      "Ascolta un possessore seguito da un nome paterno rispettoso e scegli la frase esatta.",
      "Recupera la frase con il termine rispettoso おかあさん dalla precedente scheda familiare e pronunciala.",
    ],
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
      "Sono gli Stati Uniti?",
      "Il nome è Yuki?",
      "L'elenco comprende gli Stati Uniti e l'Italia.",
      "nome e paese",
      "Sono amico di Tanaka.",
      "Sì, è Yuki.",
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
    instructions: [
      "Chiedi il nome con la domanda naturale completa なまえはなんですか.",
      "Per un visitatore diverso, conferma se il paese sono gli Stati Uniti.",
      "Disponi America + と + Italia in quest'ordine per costruire l'elenco nominale delimitato.",
      "Alla domanda sui due dati richiesti, rispondi paese e nome.",
      "Trasforma l'affermazione completa そうです nella domanda di conferma そうですか.",
      "Il paese di Yuki è l'Italia: diagnostica il candidato che conferma erroneamente gli Stati Uniti e scegli la conferma Italia.",
      "Rifiuta l'affermazione Stati Uniti e correggi Yuki con «No: quanto al paese, è l'Italia».",
      "Chiedi se l'interlocutore è amico/a di Yuki, usando と di compagnia e か: «Sei amico/a di Yuki?»",
      "Ascolta la frase di compagnia e scegli l'esatta relazione che senti.",
      "Chiedi ad alta voce con chi è amico/a l'interlocutore, usando と e か.",
    ],
    accepted: "La relazione nominale o la domanda ottiene il chiarimento previsto.",
    retry: "Mantieni と nella relazione nominale e colloca か dopo il predicato completo.",
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
  "sentence-foundations-1-example-1-context": "Un diagramma collega il blocco del parlante all'identità finale di studente; non viene presentato come frase parlata.",
  "sentence-foundations-1-example-2-context": "Un secondo diagramma collega il parlante all'identità di insegnante per il confronto strutturale.",
  "sentence-foundations-1-example-3-context": "Il diagramma inverte la direzione informativa: il ruolo studente conduce alla persona io.",
  "sentence-foundations-1-example-4-context": "Una fotografia fornisce il contesto; gatto è il blocco nominale selezionato.",
  "sentence-foundations-1-example-5-context": "Una chiave fornisce un'associazione contestuale con il blocco casa.",
  "sentence-foundations-1-example-6-context": "Il vento fornisce l'indizio della scena; mare è il blocco selezionato.",
  "sentence-foundations-1-example-7-context": "Un biglietto fornisce l'indizio per il blocco viaggio.",
  "sentence-foundations-1-example-8-context": "La mattina fornisce l'indizio temporale per il blocco scuola.",
  "sentence-foundations-1-example-9-context": "Il contesto telefonico identifica il blocco insegnante previsto.",
  "sentence-foundations-1-example-10-context": "Si contrastano due blocchi di oggetti senza sostenere che formino una proposizione.",
  "sentence-foundations-2-example-1-context": "In un compito di identificazione fotografica, l'indizio conduce alla risposta finale Tanaka.",
  "sentence-foundations-2-example-2-context": "Una seconda fotografia conduce alla risposta finale Yamada.",
  "sentence-foundations-2-example-3-context": "La categoria persona è l'indizio; la risposta focalizzata finale è io.",
  "sentence-foundations-2-example-4-context": "Poiché la fotografia è condivisa, la risposta finale può essere il solo frammento gatto.",
  "sentence-foundations-2-example-5-context": "Poiché la scuola è condivisa, l'oggetto richiesto può essere risposto come libro.",
  "sentence-foundations-2-example-6-context": "Poiché chiave e mappa sono condivise, casa è recuperabile come risposta finale.",
  "sentence-foundations-2-example-7-context": "Lo schermo telefonico condiviso rende fotografia una risposta sufficiente.",
  "sentence-foundations-2-example-8-context": "Al banco viaggi, la situazione condivisa rende biglietto una risposta sufficiente.",
  "sentence-foundations-2-example-9-context": "Sul percorso mattutino, la destinazione condivisa può essere risposta come scuola.",
  "sentence-foundations-2-example-10-context": "In un modulo di contatto domestico, il campo condiviso può essere risposto come telefono.",
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
  "sentence-foundations-4-example-3-context": "Yamada viene reintrodotto come tema sospeso parlato; avvocato resta il predicato finale.",
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

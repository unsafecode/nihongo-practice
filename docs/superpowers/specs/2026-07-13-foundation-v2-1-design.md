# Fondazione didattica v2.1 — Design

**Stato:** approvato dall'utente il 2026-07-13  
**Base:** branch `unsafecode-sentence-lab-v2`  
**Output previsto:** percorso didattico bilingue IT/EN, review linguistica completa, progresso locale e deploy GitHub Pages pronto ma non attivato.

## 1. Contesto

La v2 ha introdotto tre strumenti utili:

- il **Sillabario** con audio;
- il **Frasario** da viaggio;
- il **Laboratorio**, che visualizza frase, particelle e desinenze come ingranaggi.

La meccanica del Laboratorio funziona, ma il modello dati confonde il testo da mostrare nei controlli con il frammento usato per costruire la traduzione. Per esempio, la stessa proprietà `it` produce sia l'etichetta dell'opzione sia la sua resa nella frase:

- controllo: `れすとらん` → “al ristorante”;
- frase: “Oggi mangio il ramen al ristorante”.

La seconda resa è utile per la frase, la prima è un'etichetta innaturale. Lo stesso limite rende difficile aggiungere l'inglese senza duplicare gli errori.

Inoltre, il Laboratorio permette ogni combinazione di avverbio e forma verbale. Questo è utile per esplorare la meccanica, ma può produrre esempi pedagogicamente sbagliati, come “ieri + non-passato” o “domani + passato”, senza spiegare il problema.

La v2.1 trasforma questi strumenti in un primo percorso didattico compatto, senza introdurre ancora quiz valutati o riconoscimento vocale.

## 2. Obiettivi

1. Rendere tutto il testo italiano naturale, coerente e didatticamente accurato.
2. Aggiungere l'inglese come seconda lingua sorgente completa.
3. Permettere di scegliere IT o EN come lingua principale e mostrare, su richiesta, l'altra come traduzione di controllo.
4. Separare il core giapponese dalle localizzazioni.
5. Organizzare l'app in un percorso consigliato di 8 capitoli, sempre accessibili.
6. Integrare Sillabario e Laboratorio nel percorso senza rimuovere la pratica libera.
7. Salvare localmente lingua, scrittura, traduzione di controllo e progresso.
8. Preparare un workflow GitHub Pages manuale, senza pubblicare il sito.
9. Preparare confini dati stabili per esercizi e parlato futuri senza implementarli prematuramente.

## 3. Non obiettivi

La v2.1 non include:

- quiz con punteggio;
- esercizi di riordino, particelle o ascolto;
- riconoscimento vocale;
- valutazione della pronuncia;
- account, login o sincronizzazione cloud;
- backend o database;
- contenuti generati o tradotti da AI;
- kanji o katakana come scrittura principale;
- pubblicazione effettiva su GitHub Pages.

Questi elementi sono descritti nella roadmap, ma non devono produrre codice vuoto o astrazioni speculative nella v2.1.

## 4. Audit linguistico della v2

### 4.1 Problemi strutturali

| Problema | Esempio attuale | Correzione |
|---|---|---|
| Etichetta e frase condividono la stessa stringa | “al ristorante” nel bottone | `label: "ristorante"` separato da `realization.place: "al ristorante"` |
| Ruoli diversi hanno la stessa etichetta | “Dove” per で e に | “Dove avviene?” per で; “Verso dove?” per に |
| Ruolo modellato come destinazione per ottenere に | のる mostra “Cosa (に)” | ruolo semantico `vehicleBoarded`, UI “Su quale mezzo?” |
| Etichette delle forme non omogenee | “invito / volitiva”, “voglio…” | nomi didattici coerenti, con spiegazione pratica |
| Terminologia troppo letterale | “gambo”, “terminazione” | “base in ます” e “desinenza” |
| Legenda particelle troppo generica | “を chi/cosa, で dove, に verso” | descrizione per ruolo: oggetto, luogo dell'azione, mezzo, destinazione, persona |
| Combinazioni temporali non controllate | ieri + ます | stato di naturalezza con spiegazione |
| Collocazioni italiane innaturali | かいものをします → “faccio spese” | “faccio acquisti / faccio shopping” |

### 4.2 Glossario delle forme

La UI usa un'etichetta pratica in primo piano e il termine grammaticale come supporto.

| ID | Etichetta pratica IT | Supporto grammaticale IT |
|---|---|---|
| `pres` | Ora / abitudine / futuro | non-passato affermativo · 〜ます |
| `past` | È successo | passato affermativo · 〜ました |
| `neg` | Non succede / non succederà | non-passato negativo · 〜ません |
| `pastneg` | Non è successo | passato negativo · 〜ませんでした |
| `vol` | Facciamo…? | proposta / invito · 〜ましょう |
| `des` | Voglio… | desiderio · 〜たいです |

L'inglese applica la stessa gerarchia:

| ID | Etichetta pratica EN | Supporto grammaticale EN |
|---|---|---|
| `pres` | Now / habit / future | non-past affirmative · 〜ます |
| `past` | It happened | past affirmative · 〜ました |
| `neg` | It doesn't / won't happen | non-past negative · 〜ません |
| `pastneg` | It didn't happen | past negative · 〜ませんでした |
| `vol` | Shall we…? | suggestion / invitation · 〜ましょう |
| `des` | I want to… | desire · 〜たいです |

### 4.3 Etichette dei ruoli

| Ruolo semantico | Etichetta pratica IT | Supporto IT | Particella |
|---|---|---|---|
| `object` | Che cosa? | oggetto diretto | を |
| `actionPlace` | Dove avviene? | luogo dell'azione | で |
| `destination` | Verso dove? | destinazione | に / へ secondo il caso |
| `transport` | Con quale mezzo? | mezzo di trasporto | で |
| `personTarget` | Chi incontri / aspetti? | persona collegata al verbo | に oppure を secondo il verbo |
| `vehicleBoarded` | Su quale mezzo? | mezzo su cui si sale | に |

Il ruolo semantico non determina da solo la particella. La particella appartiene allo slot dello scenario, perché verbi diversi possono collegare concetti simili in modo diverso.

### 4.4 Titoli degli scenari

I titoli devono descrivere l'azione praticata, non tradurre il verbo isolato:

- Mangiare qualcosa;
- Bere qualcosa;
- Comprare qualcosa;
- Guardare / consultare;
- Andare in un luogo;
- Tornare;
- Prendere / salire su un mezzo;
- Aspettare qualcuno o qualcosa;
- Incontrare qualcuno;
- Fare un'attività;
- Venire in un luogo;
- Parlare una lingua.

Le opzioni mostrano nomi puliti: “ristorante”, “casa”, “treno”, “amico”. Articoli e preposizioni compaiono solo nella frase localizzata.

## 5. Architettura dei contenuti e delle lingue

### 5.1 Tre livelli separati

#### Core giapponese

Il core contiene solo informazioni indipendenti dalla lingua sorgente:

```ts
interface JapaneseConcept {
  id: ConceptId;
  jp: string;
  romaji: string;
}

interface ScenarioSlot {
  id: string;
  semanticRole: SemanticRole;
  particle: { jp: string; romaji: string };
  optionIds: ConceptId[];
  optional: boolean;
}
```

Il core non contiene campi `it`, `en`, articoli, preposizioni o etichette UI.

#### Pacchetto locale

Ogni locale definisce:

```ts
type Locale = "it" | "en";

interface LocalizedConcept {
  label: string;
  realizations: Partial<Record<SemanticRole, string>>;
}

interface LocalePack {
  ui: UiMessages;
  grammar: GrammarGlossary;
  concepts: Record<ConceptId, LocalizedConcept>;
  scenarios: Record<ScenarioId, LocalizedScenario>;
  chapters: Record<ChapterId, LocalizedChapter>;
}
```

Esempio:

```ts
// Core
{ id: "restaurant", jp: "れすとらん", romaji: "resutoran" }

// Italiano
{
  label: "ristorante",
  realizations: { actionPlace: "al ristorante" }
}

// English
{
  label: "restaurant",
  realizations: { actionPlace: "at the restaurant" }
}
```

#### Realizzatore di frase

Un realizzatore per locale riceve lo stato semantico:

- scenario;
- forma;
- avverbio di tempo;
- opzioni selezionate;

e restituisce una frase completa e naturale.

Il realizzatore controlla:

- ordine dei costituenti;
- forme verbali;
- articoli e preposizioni;
- posizione dell'avverbio;
- collocazioni idiomatiche;
- override autoriali di scenario.

Non usa etichette UI come token della frase e non traduce automaticamente.

### 5.2 Impostazioni

Un `LocaleContext` distinto dallo `ScriptContext` gestisce:

```ts
interface LocaleSettings {
  primaryLocale: "it" | "en";
  showReferenceTranslation: boolean;
}
```

Persistenza:

- `nihongo.locale.primary`;
- `nihongo.locale.reference`;
- `nihongo.script` già esistente.

Comportamento:

- menu, spiegazioni e controlli usano solo la lingua primaria;
- esempi, frasi del Laboratorio e riepiloghi possono mostrare sotto la lingua di controllo;
- la lingua di controllo è sempre l'altra fra IT ed EN;
- hiragana/rōmaji resta una preferenza indipendente.

### 5.3 Completezza locale

IT ed EN hanno la stessa struttura tipizzata. Una chiave mancante è un errore di build/test, non un fallback silenzioso.

I contenuti localizzati vengono verificati con:

- controllo delle chiavi;
- casi d'oro bilingui;
- snapshot testuali revisionabili;
- audit manuale del corpus esposto all'utente.

## 6. Naturalezza delle combinazioni

Il Laboratorio libero continua a permettere l'esplorazione, ma ogni combinazione riceve uno stato:

```ts
type Naturalness = "natural" | "contextual" | "incompatible";
```

- **natural:** esempio normale per un principiante;
- **contextual:** grammaticalmente possibile, ma richiede un contesto non visibile;
- **incompatible:** conflitto temporale o semantico nel contesto didattico corrente.

Esempi:

| Combinazione | Stato | Spiegazione |
|---|---|---|
| きょう + ます | natural | presente, abitudine o azione prevista oggi |
| あした + ます | natural | il tempo futuro è espresso da あした |
| きのう + ました | natural | passato con avverbio passato |
| まいにち + ました | contextual | richiede un periodo passato delimitato |
| きのう + ます | incompatible | il non-passato non concorda con “ieri” nell'esempio base |
| あした + ました | incompatible | il passato non concorda con “domani” |

Gli stati non vengono usati come regole universali sulla lingua giapponese. Sono indicazioni pedagogiche per il contesto mostrato.

Comportamento UI:

- `natural`: nessun avviso;
- `contextual`: callout informativo con esempio di contesto;
- `incompatible`: frase ancora visibile per confrontare gli ingranaggi, ma traduzione marcata come non valida e spiegazione chiara.

Nei capitoli vengono usate solo combinazioni curate e naturali.

## 7. Percorso didattico

### 7.1 Struttura generale

Il percorso è consigliato ma non bloccante:

- tutti gli 8 capitoli sono sempre accessibili;
- ogni capitolo contiene lezioni brevi;
- una lezione segue il ritmo **Capisci → Osserva → Esplora → Riepiloga**;
- l'utente usa “Segna come completato” in modo esplicito;
- il progresso è locale e reversibile;
- “Continua da…” apre l'ultima lezione visitata non completata.

### 7.2 Blocchi di lezione

Le lezioni sono dati tipizzati, non JSX duplicato:

```ts
type LessonBlock =
  | RuleBlock
  | ExampleBlock
  | ComparisonBlock
  | CalloutBlock
  | GuidedLabBlock
  | SummaryBlock;
```

- `RuleBlock`: regola pratica + termine grammaticale;
- `ExampleBlock`: frase, audio, rōmaji, traduzione primaria e opzionale;
- `ComparisonBlock`: due o più frasi con differenza evidenziata;
- `CalloutBlock`: attenzione, eccezione o nota d'uso;
- `GuidedLabBlock`: apre un preset del Laboratorio;
- `SummaryBlock`: punti da ricordare e completamento.

### 7.3 Gli 8 capitoli

#### 1. Suoni e hiragana

- vocali e ritmo moraico;
- 46 segni di base;
- dakuten e handakuten;
- yōon;
- っ, ん e vocali lunghe;
- uso del Sillabario con audio.

Correzione terminologica: la UI parla di “segni e suoni di base”, non di “46 sillabe” in senso rigido.

#### 2. La mappa della frase

- verbo tendenzialmente in fondo;
- soggetto spesso omesso;
- tema con は;
- は pronunciato *wa* come particella;
- frasi nominali cortesi con です;
- prima lavagna statica della frase.

#### 3. Azioni e oggetti

- oggetto diretto を;
- を pronunciato *o*;
- forma cortese in ます;
- scenari: mangiare, bere, comprare, guardare, parlare;
- preset guidati del Laboratorio.

#### 4. Quando succede?

- non-passato e passato;
- forme affermative e negative;
- avverbi di tempo;
- presente e futuro condividono la forma giapponese;
- contrasti oggi / ieri / domani;
- compatibilità temporale.

#### 5. Luoghi e movimento

- luogo dell'azione con で;
- destinazione con に e introduzione a へ;
- mezzo con で;
- salire su un mezzo con に;
- scenari: andare, tornare, prendere un mezzo.

#### 6. Persone, desideri e inviti

- persone collegate a incontrare e aspettare;
- differenza fra に e を determinata dal verbo;
- 〜たいです per desiderio;
- 〜ましょう per proposta o invito;
- esempi pratici di viaggio.

#### 7. Schemi pratici da viaggio

Contenuti autoriali, senza estendere il motore dinamico:

- domande cortesi con か;
- richieste con ください;
- esistenza di cose con あります;
- esistenza di persone/animali con います;
- esempi per hotel, ristorante, stazione e negozio.

#### 8. Trappole ed eccezioni comuni

- は → *wa*, へ → *e*, を → *o*;
- verbi godan che terminano in る, incluso かえる;
- ある vs いる;
- soggetto omesso;
- futuro implicito;
- prestiti mostrati in hiragana nell'app e nota sull'ortografia reale in katakana.

## 8. Informazione e navigazione

La navigazione primaria diventa:

1. **Percorso**
2. **Pratica libera**
3. **Frasario**

`Pratica libera` contiene:

- Laboratorio;
- Sillabario.

Entrambi restano raggiungibili direttamente e vengono anche aperti con preset dai capitoli.

Routing:

- `#/percorso`;
- `#/percorso/:chapterId/:lessonId`;
- `#/pratica/laboratorio`;
- `#/pratica/sillabario`;
- `#/frasario`.

Si usa `HashRouter`, così GitHub Pages gestisce refresh e deep link senza regole server.

Una route non valida porta a `#/percorso` e mostra un messaggio non invasivo.

## 9. Direzione visuale approvata

La direzione è **Caldo editoriale**, evoluzione della v2:

- carta crema;
- accento corallo;
- teal per progresso e orientamento;
- lavagna antracite;
- particelle ambra;
- desinenze corallo chiaro;
- più spazio, gerarchia tipografica e contenuto editoriale;
- niente estetica da dashboard grigia;
- niente gamification aggressiva.

### 9.1 Desktop

Lezione:

- header compatto con Percorso / Pratica libera / Frasario;
- controlli lingua e scrittura nell'area strumenti;
- sidebar sinistra sticky con capitolo e passi della lezione;
- contenuto principale ampio;
- regola in alto;
- esempi affiancati;
- Lavagna guidata scura;
- azioni precedente / completa.

Laboratorio:

- mantiene la lavagna sticky a sinistra e controlli a destra;
- riceve etichette linguistiche corrette;
- aggiunge stato di naturalezza e traduzione di controllo;
- può aprirsi con un preset guidato e tornare alla lezione.

### 9.2 Mobile

- header ridotto;
- sidebar trasformata in selettore del capitolo/lezione;
- esempi su una colonna;
- Lavagna e controlli in sequenza;
- azioni principali sempre raggiungibili;
- nessuna dipendenza da hover.

### 9.3 Accessibilità

- contrasto AA per testo e controlli;
- particelle/desinenze distinguibili anche da etichetta, non solo colore;
- stato attivo con `aria-current` / `aria-pressed`;
- navigazione tastiera;
- focus visibile;
- pulsanti audio con stato testuale;
- supporto a `prefers-reduced-motion`.

Il mockup approvato è conservato insieme alla spec come riferimento visuale, non come codice da copiare senza adattamento.

## 10. Progresso locale

Schema:

```ts
interface CourseProgressV1 {
  schemaVersion: 1;
  completedLessonIds: string[];
  lastVisitedLessonId: string | null;
  updatedAt: string;
}
```

Chiave: `nihongo.course.progress`.

Regole:

- il completamento è esplicito;
- una lezione completata può essere riaperta o marcata non completata;
- il progresso non blocca capitoli;
- “Azzera progresso” richiede conferma;
- dati corrotti resettano solo questa chiave e mostrano un avviso;
- future versioni migrano in base a `schemaVersion`.

Non viene simulata sincronizzazione fra dispositivi.

## 11. GitHub Pages

La v2.1 resta una SPA statica.

Preparazione:

- base path Vite configurabile per `nihongo-practice`;
- build con `npm test` e `npm run build`;
- GitHub Actions Pages artifact;
- workflow con solo `workflow_dispatch`;
- routing hash;
- nessuna chiave o secret;
- README con procedura di attivazione.

Il workflow non deve avere trigger `push` finché l'utente non approva la pubblicazione.

Speech synthesis continua a usare il browser. Un backend non è necessario per:

- corso;
- localizzazione;
- progresso locale;
- Laboratorio;
- Sillabario;
- esercizi deterministici futuri;
- TTS del browser.

## 12. Errori e fallback

- locale mancante: errore in test/build;
- concetto senza realizzazione richiesta: errore di validazione dati;
- route invalida: redirect con avviso;
- progresso corrotto: reset isolato con avviso;
- voce giapponese assente: avviso esistente, contenuto sempre leggibile;
- localStorage non disponibile: sessione usabile senza persistenza, con avviso;
- combinazione incompatibile: spiegazione, non traduzione inventata;
- audio fallito: stato del pulsante ripristinato e messaggio accessibile.

Non si usano catch generici che trasformano errori reali in successo apparente.

## 13. Test

### 13.1 Dati e lingue

- parità delle chiavi IT/EN;
- ogni concetto richiesto esiste;
- ogni ruolo usato ha una realizzazione locale;
- ogni capitolo e lezione ha un ID univoco;
- ogni preset punta a scenario, forma, tempo e opzioni valide.

### 13.2 Frasi

- casi d'oro IT/EN per tutti i 12 scenari;
- casi presente, passato, negativo e futuro contestuale;
- collocazioni con override;
- ordine naturale italiano e inglese;
- nessuna etichetta UI riutilizzata come frase;
- stati natural/contextual/incompatible.

### 13.3 Corso e progresso

- route e deep link;
- calcolo progresso;
- completa / annulla completamento;
- ultimo visitato;
- reset;
- migrazione schema;
- dati corrotti.

### 13.4 Regressione

- tutti i test del motore v2 restano verdi;
- Frasario e Sillabario mantengono audio e script toggle;
- Laboratorio produce lo stesso giapponese per gli stessi input validi;
- build TypeScript strict;
- verifica responsive e accessibilità delle schermate principali.

## 14. Migrazione dalla v2

1. Introdurre i tipi del core e i pacchetti locale.
2. Migrare scenari e opzioni senza cambiare l'output giapponese.
3. Sostituire `Option.it`, `ItalianVerb` e `TimeOption.it`.
4. Aggiungere realizzatori e casi d'oro.
5. Migrare copy del Laboratorio.
6. Migrare Frasario e Sillabario.
7. Aggiungere corso, routing e progresso.
8. Applicare la UI approvata.
9. Aggiungere workflow Pages manuale.

La migrazione deve rimanere incrementale e testabile; non si riscrive il motore di coniugazione.

## 15. Roadmap successiva

### v2.2 — Esercizi

- riordino dei blocchi;
- scelta della particella;
- trasformazione della forma;
- ascolto e scelta/costruzione;
- verifica deterministica;
- progresso per esercizio.

### v2.3 — Parlato

Primo livello:

- `SpeechRecognition` browser in `ja-JP`;
- confronto della trascrizione normalizzata;
- feedback “frase riconosciuta / non riconosciuta”;
- fallback di ascolto/ripetizione;
- informativa sul possibile processamento da parte del fornitore del browser.

Il risultato non viene presentato come voto di pronuncia.

Secondo livello opzionale:

- pronunciation assessment reale;
- provider dietro backend/serverless;
- chiavi protette;
- valutazione di accuratezza, fluidità e fonemi.

Il backend viene introdotto solo se questo secondo livello viene approvato.

## 16. Criteri di accettazione

La v2.1 è completa quando:

1. tutte le stringhe visibili sono localizzate in IT ed EN;
2. l'italiano è revisionato e non mostra frammenti grammaticali come etichette;
3. la lingua primaria e la traduzione di controllo funzionano ovunque previsto;
4. il giapponese generato dalla v2 non regredisce;
5. le combinazioni libere mostrano uno stato di naturalezza;
6. gli 8 capitoli sono navigabili e contengono lezioni complete;
7. ogni capitolo apre almeno un preset rilevante del Laboratorio o del Sillabario;
8. il progresso locale è persistente, reversibile e resettabile;
9. la UI implementa la direzione Caldo editoriale approvata;
10. test e build passano;
11. il workflow Pages è presente ma non pubblica automaticamente;
12. nessun backend è richiesto per eseguire l'app.

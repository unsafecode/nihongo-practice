# はなそう · Giapponese pratico

Piccola app locale per imparare il **giapponese parlato da viaggio**: frasi pratiche per
cavarsela sul posto (saluti, ristorante, shopping, indicazioni, emergenze…), da **ascoltare**
grazie alla sintesi vocale del browser.

> Progetto fatto per divertimento e per uso personale — non è un corso strutturato né materiale "business".

## Le tre modalità (v2)

Un interruttore in alto sceglie la modalità:

- **🧑‍🏫 Laboratorio** (default) — la *lavagna delle frasi*. Parti da un caso reale
  (mangiare, andare, comprare…), scegli **forma del verbo**, **tempo** e complementi,
  e guarda la frase montarsi pezzo per pezzo. Le **particelle** (を, で, に…) e le
  **terminazioni** del verbo (ます, ました, ません…) sono evidenziate come "ingranaggi",
  così si vede *a colpo d'occhio* cosa dà il ruolo alle parole e cosa dà tempo/polarità.
  Ogni frase si può ascoltare.
- **🈂️ Sillabario** — tavola hiragana interattiva (gojūon, dakuten/handakuten, yōon).
  Tocca una casella per **sentirne il suono**. È la base per imparare a leggere tutto
  il resto dell'app. Include note su っ (raddoppio), ー (allungamento) e ん.
- **📖 Frasario** — il frasario da viaggio della v1 (vedi sotto), invariato.

### Impostazione scrittura: hiragana / rōmaji

Un secondo interruttore, valido in **tutte** le modalità, sceglie quale testo è
**primario (grande)**: hiragana (default) o rōmaji (latino). L'altro resta sempre
visibile in piccolo, così chi non sa ancora leggere l'hiragana "legge bene" comunque.
La scelta è **persistita in `localStorage`**.

### Interfaccia bilingue

Un interruttore **IT / EN** cambia la lingua dell'interfaccia e delle traduzioni in tutte le modalità. Una casella **traduzione di riferimento** mostra opzionalmente la traduzione nell'altra lingua, utile per confrontare al volo i significati. Anche questa scelta è **persistita in `localStorage`**.

### Il motore di coniugazione

Il Laboratorio è costruito su un motore **puro** (senza React) in `src/lab/engine/`.
Intuizione chiave: **le 6 forme cortesi derivano tutte dallo stesso gambo (masu-stem)** —
`gambo + ます / ました / ません / ませんでした / ましょう / たいです`. L'unica cosa che
cambia per verbo è come si ottiene il gambo:

| gruppo | regola | esempio |
|---|---|---|
| ichidan | togli る | たべる → たべ |
| godan | ultima kana riga-う → riga-い | のむ → のみ, **かえる → かえり** |
| irregolare | tabella fissa | する → し, くる → き |

> Nota: **かえる ("tornare") è godan**, non ichidan (gambo かえり) — un tranello classico,
> coperto da un test apposta.

In giapponese **presente e futuro sono la stessa forma**: è l'avverbio di tempo a
disambiguare. La traduzione italiana usa il futuro solo quando la forma è
presente/negativa **e** il tempo è futuro (あした / こんばん). Il rōmaji non è
traslitterato a runtime: è memorizzato nei dati.

Gli scenari, l'integrità dei dati e l'assemblatore giapponese sono coperti dai test:

```bash
npm test
```

### Stati di naturalezza del Laboratorio

Alcune combinazioni forma+tempo sono **naturali**, altre **contestuali** (accettabili con una spiegazione) o **incompatibili**. Quando una frase suona strana, il Laboratorio mostra il perché invece di lasciarla passare senza contesto.

## Scelte di design (v1)

- **Solo hiragana per la scrittura.** Niente kanji né katakana: chi impara deve leggere un
  solo sillabario. I prestiti normalmente in katakana (es. `トイレ`) sono resi in hiragana
  (`といれ`). Non è ortografia "ufficiale", ma è voluto: serve a leggere senza barriere.
- **Focus sul parlato.** Ogni frase ha un pulsante **Ascolta** (velocità normale) e **Lento**
  (per lo studio). Il testo mostrato è: hiragana grande + romaji (pronuncia) + traduzione italiana.
- **Audio = sintesi vocale del browser (Web Speech API).** Zero configurazione, zero costi,
  funziona in locale. Su macOS la voce giapponese (Kyoko) suona molto bene.
- **Audio disaccoppiato dalla UI.** L'hook `useSpeech` è l'unico punto che parla con la Web
  Speech API: domani si può sostituire con una TTS neurale in cloud senza toccare i componenti.

## Come si usa

```bash
npm install
npm run dev
```

Poi apri l'URL mostrato (di default http://localhost:5173).

Build di produzione:

```bash
npm run build
npm run preview
```

Test (motore di coniugazione, integrità dati, assemblatore giapponese):

```bash
npm test
```

### Audio: se non senti nulla

L'app funziona anche senza audio, ma per sentire le frasi serve una **voce giapponese** installata:

- **macOS:** Impostazioni → Accessibilità → Contenuto vocale → Voce di sistema → Gestisci voci →
  Giapponese (es. *Kyoko*).
- **Windows:** Impostazioni → Ora e lingua → Lingua e voce → aggiungi il pacchetto voce giapponese.

Se non c'è nessuna voce ja-JP, l'app mostra un avviso ma resta usabile (hiragana + romaji + traduzione).

## Esperienza v2.1

L'app è organizzata in tre aree:

- **Percorso** — 8 capitoli e 16 lezioni compatte, dai suoni alle trappole comuni. Tutti i capitoli sono sempre aperti.
- **Pratica libera** — Laboratorio delle frasi e Sillabario hiragana, accessibili anche dai collegamenti guidati nelle lezioni.
- **Frasario** — frasi pratiche da viaggio con testo e audio.

Italiano e inglese sono entrambi completi. Una lingua è primaria; l'altra può comparire sotto esempi, frasi e riepiloghi come traduzione di controllo. Hiragana/rōmaji è un'impostazione indipendente.

La conclusione di una lezione è un'azione esplicita e reversibile. I progressi restano solo nel browser e non bloccano mai i contenuti.

### Dati locali

Non esistono account né un backend. `localStorage` contiene soltanto:

- `nihongo.locale.primary`
- `nihongo.locale.reference`
- `nihongo.script`
- `nihongo.course.progress`

Se lo storage non è disponibile, l'app continua a funzionare per la sessione corrente.

### Fuori dallo scope v2.1

Gli esercizi deterministici sono previsti per v2.2. Il riconoscimento vocale è previsto per v2.3 e non verrà presentato come valutazione della pronuncia. Una valutazione fonetica reale richiederebbe un servizio con credenziali protette.

## Contenuti

8 categorie pratiche: Saluti, Parole base, Presentarsi, Mangiare e bere, Shopping, Indicazioni,
Emergenze, Numeri. Le frasi bilingui sono in `src/data/phrases.ts` — facilissime da estendere.

## Stack

- [Vite](https://vite.dev/) + React + TypeScript
- [Vitest](https://vitest.dev/) per i test del motore di coniugazione e dei dati
- CSS scritto a mano (nessun framework di stile, per tenere le dipendenze al minimo)
- Web Speech API (`speechSynthesis`) per l'audio

## Struttura

```
src/
  content/                 # scenari, concetti, tempi, selezione (dati JP neutri)
  data/phrases.ts          # contenuti bilingui del Frasario (categorie + frasi)
  hooks/useSpeech.ts       # layer audio condiviso (Web Speech API)
  i18n/                    # cataloghi IT/EN + contesto locale
  settings/
    ScriptContext.tsx      # impostazione globale hiragana/rōmaji (localStorage)
  components/
    Header.tsx             # brand + nav modalità + toggle scrittura
    CategoryNav.tsx        # navigazione categorie del Frasario
    PhraseCard.tsx         # card frase (rispetta l'impostazione scrittura)
    SpeechNotice.tsx       # avviso se manca il supporto audio
    Phrasebook.tsx         # modalità Frasario (v1, estratta da App.tsx)
  lab/                     # modalità Laboratorio
    engine/
      conjugate.ts         # gambo + 6 forme cortesi (+ test)
      assemble.ts          # assemblatore frase giapponese (+ test)
      japanese.ts          # costruzione frase JP: chip + frase + audio (fonte unica)
      realize.ts           # realizzazione bilingue della frase (IT/EN, + test)
      naturalness.ts       # stato naturale / contestuale / incompatibile (+ test)
    components/            # Board, Chip, ControlPanel, TeachNote, Lab
    lab.css
  syllabary/               # modalità Sillabario
    kana.ts                # tavola hiragana (gojūon + dakuten + yōon)
    Syllabary.tsx
    syllabary.css
  App.tsx                  # switch a 3 modalità + LocaleProvider/ScriptProvider
  styles.css
```

## Idee per la v3 (non incluse)

- TTS neurale in cloud (Azure Speech / OpenAI / ElevenLabs) per voci più naturali
- Quiz / drill del Sillabario e del Laboratorio
- Preferiti e progresso di apprendimento
- Riconoscimento vocale per esercitare la pronuncia
- Toggle opzionale per mostrare anche katakana/kanji quando si è più avanti


## GitHub Pages (predisposto, non pubblicato)

L'app è interamente statica. Percorso, traduzioni bilingui, progressi,
Laboratorio, Sillabario e sintesi vocale del browser non richiedono un backend.

Il repository include il workflow esclusivamente manuale
`.github/workflows/deploy-pages.yml`.

Per pubblicare dopo un'approvazione esplicita:

1. Creare o collegare il repository GitHub come `nihongo-practice`.
2. Eseguire il push del branch approvato per la pubblicazione.
3. In **Settings → Pages**, scegliere **GitHub Actions** come sorgente.
4. Aprire **Actions → Deploy GitHub Pages → Run workflow**.
5. Verificare l'URL generato e tutte le route hash.

Il workflow non ha trigger `push` e non può pubblicare automaticamente.

### English

The app is fully static. The course, bilingual translations, progress,
Sentence Lab, Hiragana chart, and browser speech synthesis do not require a
backend.

The repository includes the manual-only workflow
`.github/workflows/deploy-pages.yml`.

To publish after explicit approval:

1. Create or connect the GitHub repository as `nihongo-practice`.
2. Push the branch approved for publication.
3. In **Settings → Pages**, select **GitHub Actions** as the source.
4. Open **Actions → Deploy GitHub Pages → Run workflow**.
5. Verify the generated URL and every hash route.

The workflow has no `push` trigger and cannot publish automatically.

### Dati locali e voce

Le preferenze e i progressi restano sul browser e dispositivo correnti nelle
chiavi `nihongo.script`, `nihongo.locale.primary`,
`nihongo.locale.reference` e `nihongo.course.progress`.

La v2.1 usa soltanto la sintesi vocale fornita dal browser o dal sistema
operativo. L'app non registra audio e non invia testo o audio a un proprio
backend; l'eventuale elaborazione online di una voce dipende dal browser,
dal sistema e dalla voce scelta.

Un futuro riconoscimento vocale del browser potrebbe usare server del
fornitore e richiederà un avviso visibile. Una valutazione reale della
pronuncia richiederebbe invece un servizio con credenziali protette.

#### Local data and speech

Preferences and progress stay on the current browser and device under
`nihongo.script`, `nihongo.locale.primary`, `nihongo.locale.reference`, and
`nihongo.course.progress`.

V2.1 only uses speech synthesis supplied by the browser or operating system.
The app records no audio and sends no text or audio to an application backend;
whether a voice is processed online depends on the browser, operating system,
and selected voice.

Future browser speech recognition may use vendor servers and will require a
visible notice. Real pronunciation assessment would require a service with
protected credentials.

### Disattivare o ripristinare Pages

- In **Settings → Pages**, usare **Unpublish site** per rimuovere il sito; oppure
- rieseguire il workflow di una distribuzione precedente già verificata, o
  eseguirlo manualmente da un branch che punta al commit desiderato.

La disattivazione di Pages non modifica lo sviluppo locale né i progressi già
salvati nei browser.

#### Disable or roll back Pages

- In **Settings → Pages**, use **Unpublish site** to remove the site; or
- rerun the workflow for a previously verified deployment, or run it manually
  from a branch that points to the desired commit.

Disabling Pages does not affect local development or progress already stored
in browsers.

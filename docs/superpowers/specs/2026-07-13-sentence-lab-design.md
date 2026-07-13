# v2 — Laboratorio delle frasi (Sentence Lab)

**Progetto:** nihongo-practice
**Data:** 2026-07-13
**Stato:** design approvato (in attesa di review della spec)

## 1. Obiettivo

Aggiungere alla app una seconda modalità, il **Laboratorio**, che insegna a
**costruire** le frasi (non solo a ripeterle). Si parte da un caso reale
("oggi mangio il ramen") e si vede la frase **trasformarsi** lungo più assi —
tempo verbale, avverbio di tempo, oggetto, luogo/persona — su una **lavagna**
che scompone la frase in blocchi colorati. Il cervello visualizza così i
percorsi di costruzione.

**Idea pedagogica centrale — gli "ingranaggi":** le **particelle**
(を・に・で・は…) dicono il *ruolo* delle parole; le **terminazioni verbali**
(ます・ました・ません・ませんでした・ましょう・たいです) dicono *tempo e
polarità*. Sono i pezzi che "girano" e vanno **evidenziati ovunque**.

**Vincoli ereditati dalla v1:** solo hiragana, forma cortese (-masu), focus
sul parlato, audio via `useSpeech`, italiano come lingua di supporto.

## 2. Architettura & integrazione

L'app diventa a **tre modalità** con uno switch in alto:

- **Sillabario** — tavola hiragana interattiva per imparare a leggere (§2.1).
- **Frasario** — la v1 attuale, invariata.
- **Laboratorio** — la v2 (la lavagna).

`App.tsx` gestisce `mode` con `useState` e monta `<Syllabary/>`, `<Phrasebook/>`
(estratto dall'attuale contenuto v1) o `<Lab/>`. Condivisi: palette/token CSS,
`useSpeech`, `SpeechNotice`, e l'**impostazione globale di scrittura** (§2.2).
Nessuna riscrittura del Frasario.

Il nuovo codice vive isolato in `src/lab/` e `src/syllabary/`.

## 2.1 Modalità Sillabario (imparare hiragana)

Perché il Laboratorio sia davvero pratico serve poter **imparare a leggere**.
Il Sillabario è una tavola interattiva che copre tutto ciò che serve per leggere
i contenuti dell'app:

- **Gojūon base** (46 kana) in griglia.
- **Dakuten / handakuten** (が ざ だ ば / ぱ).
- **Yōon** (きゃ きゅ きょ, しゃ, ちゃ, …).
- Note brevi per **っ** (raddoppio), **ー** (allungamento), **ん**.

Ogni cella mostra **kana + rōmaji** e, al tocco, lo **pronuncia** con `useSpeech`
(voce ja-JP). Nessun quiz nella v2 (candidato v3): solo esplorazione + ascolto.
Dati in `src/syllabary/kana.ts` (tabella statica kana→romaji).

## 2.2 Impostazione globale: scrittura (hiragana / rōmaji)

Un interruttore in header, valido in **tutte** le modalità, sceglie quale testo
è **primario (grande)**:

- **Hiragana** (default) — giapponese grande, rōmaji piccolo di supporto.
- **Rōmaji (latino)** — rōmaji grande, hiragana piccolo di supporto.

Entrambi restano sempre visibili: cambia solo l'enfasi/dimensione, così chi non
sa ancora leggere l'hiragana "legge bene" comunque. Stato in un piccolo
`ScriptContext` (hook `useScript`), **persistito in `localStorage`** (unica cosa
persistita; preferiti/progresso restano fuori scope). Nel Laboratorio i chip e la
frase rispettano questa impostazione; le **particelle e le terminazioni restano
evidenziate in entrambe le scritture**.

## 3. Il motore di coniugazione (`src/lab/engine/`)

Funzioni **pure**, senza React. Intuizione chiave: **tutte le 6 forme cortesi
derivano dallo stesso gambo (masu-stem)**. L'unica cosa che varia per verbo è
come si ottiene il gambo dalla forma del dizionario:

| gruppo | regola gambo | esempio |
|---|---|---|
| ichidan | togli る | たべる → たべ |
| godan | ultima kana riga-う → riga-い | のむ → のみ, かう → かい |
| irregolare | tabella fissa | する → し, くる → き |

Mappa godan (ultima kana): `う→い く→き ぐ→ぎ す→し つ→ち ぬ→に ぶ→び む→み る→り`.

Dal gambo, le terminazioni sono **uniformi per tutti i verbi**:

| forma | terminazione | romaji |
|---|---|---|
| presente/futuro | ます | masu |
| passato | ました | mashita |
| negativo | ません | masen |
| passato negativo | ませんでした | masen deshita |
| volitiva/invito | ましょう | mashō |
| desiderativa | たいです | tai desu |

**Perché memorizzo il `gruppo` nei dati:** verbi come かえる ("tornare")
*sembrano* ichidan ma sono **godan** (→ かえり, non かえ). Salvando il gruppo
elimino ogni ambiguità — ed è un ottimo punto didattico da mostrare.

### API
```ts
type Form = 'pres'|'past'|'neg'|'pastneg'|'vol'|'des';
type Group = 'ichidan'|'godan'|'irregular';
interface Verb { dict: string; group: Group; stemRomaji: string; }

stem(verb): string                       // deriva il gambo (hiragana)
conjugate(verb, form): { jp: string; romaji: string }
```

`conjugate` restituisce anche il romaji componendo `stemRomaji` + suffisso.

## 4. Ground truth dei 12 verbi (base dei test)

Ogni verbo, gambo e le 6 forme (per i test unitari):

| # | dict | gruppo | gambo | pres | past | neg | pastneg | vol | des |
|---|---|---|---|---|---|---|---|---|---|
| 1 | たべる | ichidan | たべ | たべます | たべました | たべません | たべませんでした | たべましょう | たべたいです |
| 2 | のむ | godan | のみ | のみます | のみました | のみません | のみませんでした | のみましょう | のみたいです |
| 3 | かう | godan | かい | かいます | かいました | かいません | かいませんでした | かいましょう | かいたいです |
| 4 | みる | ichidan | み | みます | みました | みません | みませんでした | みましょう | みたいです |
| 5 | いく | godan | いき | いきます | いきました | いきません | いきませんでした | いきましょう | いきたいです |
| 6 | かえる | godan | かえり | かえります | かえりました | かえりません | かえりませんでした | かえりましょう | かえりたいです |
| 7 | のる | godan | のり | のります | のりました | のりません | のりませんでした | のりましょう | のりたいです |
| 8 | まつ | godan | まち | まちます | まちました | まちません | まちませんでした | まちましょう | まちたいです |
| 9 | あう | godan | あい | あいます | あいました | あいません | あいませんでした | あいましょう | あいたいです |
| 10 | はなす | godan | はなし | はなします | はなしました | はなしません | はなしませんでした | はなしましょう | はなしたいです |
| 11 | する | irregular | し | します | しました | しません | しませんでした | しましょう | したいです |
| 12 | くる | irregular | き | きます | きました | きません | きませんでした | きましょう | きたいです |

## 5. Modello dati: scenari e slot (particle-aware)

Uno **scenario** = un verbo + slot componibili. **Ogni slot porta la sua
particella**, così le particelle non sono hardcoded e gli scenari di movimento
(に) convivono con i transitivi (を).

```ts
type Role = 'tempo'|'oggetto'|'destinazione'|'persona'|'luogo'|'mezzo';
interface Option { jp: string; romaji: string; it: string; }   // it = frammento italiano
interface Slot { role: Role; particle: string|null; label: string; options: Option[]; optional?: boolean; }
interface Scenario {
  id: string; emoji: string; label: string;      // etichetta IT
  verb: Verb;
  italian: Record<Form, string> & { future: Partial<Record<Form,string>> }; // vedi §7
  slots: Slot[];
}
```

**Ordine canonico di assemblaggio (giapponese):** tempo · luogo(で) · mezzo(で) ·
**argomento principale** (oggetto を / destinazione に / persona に) · **verbo**.
L'argomento principale sta sempre subito prima del verbo (らーめんを たべます,
ともだちに あいます, えきに いきます). Gli slot opzionali offrono una scelta
**"nessuno"** (valore `null`): se selezionata, lo slot è **omesso**
dall'assemblaggio.

### I 12 scenari (contenuto iniziale, ampliabile a costo ~zero)

| # | scenario | verbo | particella chiave | opzioni principali |
|---|---|---|---|---|
| 1 | 🍜 Mangiare | たべる | を | らーめん, すし, おにぎり (+ luogo で: れすとらん/いえ) |
| 2 | 🍵 Bere | のむ | を | みず, びーる, おちゃ (+ で: ばー/いえ) |
| 3 | 🛍️ Comprare | かう | を | きっぷ, おみやげ, みず (+ で: みせ/えき) |
| 4 | 🎬 Guardare | みる | を | えいが, ちず, めにゅー |
| 5 | 🚉 Andare | いく | **に** (dest.) | えき, ほてる, くうこう (+ mezzo で: でんしゃ/ばす/たくしー) |
| 6 | 🏨 Tornare | かえる | **に** (dest.) | いえ, ほてる, にほん |
| 7 | 🚃 Prendere (mezzo) | のる | **に** | でんしゃ, ばす, たくしー |
| 8 | ⏳ Aspettare | まつ | を | ともだち, ばす, たくしー |
| 9 | 🤝 Incontrare | あう | **に** (persona) | ともだち, せんせい, かぞく |
| 10 | 📝 Fare | する | を | よやく, かいもの, でんわ |
| 11 | 🧳 Venire | くる | **に** (dest.) | にほん, みせ, ぱーてぃー (opzionale) |
| 12 | 🗣️ Parlare | はなす | を | にほんご, えいご |

**Avverbi di tempo (condivisi):** きょう "oggi", きのう "ieri", あした "domani",
こんばん "stasera", まいにち "ogni giorno", + (nessuno).

## 6. La lavagna: layout, componenti & stato (`src/lab/components/`)

**Layout — regola in cima, poi due colonne (esempi):**

```
┌──────────────────────────────────────────────────────┐
│  🧭 REGOLA (TeachNote) — a tutta larghezza, in cima   │
│     gambo + terminazione · presente=futuro · particella│
├──────────────────────────────┬───────────────────────┤
│  LAVAGNA (sinistra, sticky)  │  CONTROLLI (destra)   │
│  • blocchi-frase colorati    │  • Forma verbo        │
│  • frase completa (grande)   │  • Tempo              │
│  • rōmaji + IT               │  • Oggetto/…          │
│  • ▶ Ascolta + legenda       │  • (uno per slot)     │
└──────────────────────────────┴───────────────────────┘
```

**Ordine didattico "regola → esempi":** la nota-regola (TeachNote) sta **in
cima, a tutta larghezza**, sempre visibile; sotto, la lavagna (l'esempio vivo)
a sinistra e i controlli a destra. Griglia CSS: colonna sinistra ampia
(lavagna) + colonna destra fissa per i pannelli. La lavagna è **`position:
sticky`** in alto, così cambiando le opzioni a destra la frase resta in vista.
Su schermo stretto le due colonne si impilano (regola sopra, poi lavagna).

- **`Lab.tsx`** — contenitore: selettore scenario + `TeachNote` (regola, in
  cima) + griglia a due colonne `Board` (sinistra) + `ControlPanel`×N (destra).
  Stato = selezione corrente `{ form, valori-per-slot }`, derivato dal motore.
- **`Board.tsx`** — la lavagna scura: i blocchi-frase colorati per ruolo, poi la
  frase completa + tasto **Ascolta** (`useSpeech`). Rispetta l'impostazione di
  scrittura (§2.2): hiragana o rōmaji come testo primario.
- **`Chip.tsx`** — un blocco: filler + **particella evidenziata** + rōmaji. Il
  blocco-verbo mostra **gambo (neutro) + terminazione (evidenziata)**.
- **`ControlPanel.tsx`** — un pannello per asse (forma verbo, tempo, e uno per
  ogni slot) con i bottoni-opzione. Sta nella **colonna destra**.
- **`TeachNote.tsx`** — nota didattica dinamica **in cima** (la regola
  gambo+terminazione; il punto d'oro presente=futuro; cosa fa la particella
  dello scenario).

### UX — "ingranaggi" (richiesta esplicita)
- **Testo giapponese grande:** chip ≥ `1.9rem`, frase completa ≥ `2.2rem`.
- **Particelle** (を・に・で・は・へ) evidenziate ovunque compaiano — nei chip
  **e** nella frase completa — con uno stile pill/underline ambra.
- **Terminazioni verbali** in accento coral, con il **gambo** in colore neutro:
  il "pezzo che gira" è sempre chiaro a colpo d'occhio.
- **Legenda "gli ingranaggi":** particelle = ruolo delle parole; terminazioni =
  tempo/polarità.
- **Micro-animazione (bump)** sul pezzo che cambia quando si trasforma la frase
  (rispetta `prefers-reduced-motion`).
- L'evidenziazione degli ingranaggi vale **in entrambe le scritture**: se il
  primario è rōmaji, particelle (wa/o/ni/de) e terminazioni (masu/mashita/…)
  restano evidenziate.


## 7. Traduzione italiana (parte "a mano", per qualità)

Il giapponese è **generato** dal motore; l'italiano è un **template
per-scenario** scritto a mano per suonare naturale.

- **Verbo IT per forma**, con variante *futura* quando l'avverbio è futuro
  (あした/こんばん) — perché in giapponese pres=fut ma in italiano no. Tabelle
  (default soggetto "io" maschile singolare; il genere al passato con *essere*
  è una semplificazione nota della v2):

| verbo | pres | fut | passato | neg | neg-fut | pass-neg | vol | des |
|---|---|---|---|---|---|---|---|---|
| たべる | mangio | mangerò | ho mangiato | non mangio | non mangerò | non ho mangiato | mangiamo | voglio mangiare |
| のむ | bevo | berrò | ho bevuto | non bevo | non berrò | non ho bevuto | beviamo | voglio bere |
| かう | compro | comprerò | ho comprato | non compro | non comprerò | non ho comprato | compriamo | voglio comprare |
| みる | guardo | guarderò | ho guardato | non guardo | non guarderò | non ho guardato | guardiamo | voglio guardare |
| いく | vado | andrò | sono andato | non vado | non andrò | non sono andato | andiamo | voglio andare |
| かえる | torno | tornerò | sono tornato | non torno | non tornerò | non sono tornato | torniamo | voglio tornare |
| のる | prendo | prenderò | ho preso | non prendo | non prenderò | non ho preso | prendiamo | voglio prendere |
| まつ | aspetto | aspetterò | ho aspettato | non aspetto | non aspetterò | non ho aspettato | aspettiamo | voglio aspettare |
| あう | incontro | incontrerò | ho incontrato | non incontro | non incontrerò | non ho incontrato | incontriamo | voglio incontrare |
| する | faccio | farò | ho fatto | non faccio | non farò | non ho fatto | facciamo | voglio fare |
| くる | vengo | verrò | sono venuto | non vengo | non verrò | non sono venuto | veniamo | voglio venire |
| はなす | parlo | parlerò | ho parlato | non parlo | non parlerò | non ho parlato | parliamo | voglio parlare |

- **Frammento IT per ogni opzione** (con preposizione/articolo giusti), salvato
  nel campo `Option.it` — es. destinazione えき = "alla stazione", ほてる =
  "in hotel", にほん = "in Giappone".
- **Regola del futuro:** la variante *futura* del verbo IT si usa **solo** quando
  `form ∈ {pres, neg}` **e** il tempo selezionato è あした o こんばん; in tutti
  gli altri casi si usa l'italiano base della forma scelta. (Il Laboratorio è
  permissivo: combinazioni semanticamente strane restano possibili — è una
  lavagna di esplorazione.)
- **Assemblaggio IT:** `[tempo] [verboIT] [oggetto/dest IT] [luogo IT]`,
  ripulito e con iniziale maiuscola.

## 8. Romaji

Nessun transliteratore: il romaji è **memorizzato nei dati** (ogni `Option` ha
`romaji`; ogni verbo ha `stemRomaji`; le terminazioni hanno romaji fisso). Zero
casi limite, sempre corretto.

## 9. Testing

- **`vitest`** aggiunto come devDependency + script `"test"`.
- **`conjugate.test.ts`:** per ognuno dei 12 verbi, asserisce le 6 forme contro
  la tabella §4 → **correttezza del giapponese garantita**.
- **`assemble.test.ts`:** 3-4 casi canonici end-to-end, incluso il caso
  dell'influencer (きょう→きのう / pres→past) e uno con particella に (いく).

## 10. Struttura file

```
src/
  App.tsx                    # + switch a 3 modalità
  settings/
    ScriptContext.tsx        # useScript(): 'hiragana'|'romaji', localStorage
  components/                # v1 (Header, PhraseCard, ...) — Header prende lo switch scrittura
  syllabary/
    kana.ts                  # tavola hiragana (base + dakuten + yōon)
    Syllabary.tsx            # tavola interattiva con Ascolta
    syllabary.css
  lab/
    engine/
      conjugate.ts
      conjugate.test.ts
      assemble.ts
      assemble.test.ts
    data/
      types.ts
      scenarios.ts           # i 12 scenari + tabelle IT
    components/
      Lab.tsx                # layout a 2 colonne
      Board.tsx
      Chip.tsx
      ControlPanel.tsx
      TeachNote.tsx
    lab.css
```

## 11. Fuori scope per la v2 (YAGNI)

- Forma piana (dizionario), keigo, altri modi/tempi.
- Frasi con più oggetti, subordinate, congiunzioni.
- Genere/numero del soggetto nel passato italiano con *essere*.
- Katakana/kanji (resta hiragana-only).
- Quiz/drill del Sillabario e preferiti/progresso (candidati per la v3).
  L'unica cosa persistita nella v2 è l'impostazione di scrittura (§2.2).

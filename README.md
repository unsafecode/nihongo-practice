# はなそう · Hanasō

App bilingue (IT/EN) per imparare il **giapponese pratico da viaggio**.
Offre un percorso guidato più tre aree di pratica libera (Laboratorio frasi, Sillabario hiragana, Frasario da viaggio).
SPA statica: nessun account, nessun backend, nessuna analisi, nessun tracker, nessuna registrazione, nessun servizio esterno dell'app.

---

## Percorso completo A0→A1

Il percorso guidato è il corso **A0→A1 completo**: **12 moduli in quattro fasi** (Orientati · Costruisci · Naviga · Sintetizza) per un totale di **40 lezioni** compatte da 6 a 10 minuti, che coprono **42 verbi** e **270 vocaboli contestuali**.

L'approccio è **hiragana-first con katakana assistita**: i prestiti in katakana (es. コーヒー) mostrano, alla prima esposizione, una lettura in hiragana affiancata (ruby), mai al posto della grafia autentica.

I 12 moduli, in ordine:

1. **Suoni, hiragana e il ponte katakana** — l'alfabeto sillabico, la lettura hiragana e i primi prestiti in katakana
2. **Presentarsi** — nome, provenienza, lingua, occupazione ed età
3. **Domande essenziali** — chi, cosa, dove, quando, quale, come e quanto
4. **Azioni e oggetti** — frasi d'azione cortesi con oggetti e compagni
5. **Routine, orario e frequenza** — giornata, giorni della settimana, frequenza
6. **Passato e negativo** — presente/passato, affermativo/negativo
7. **Luoghi, movimento e trasporti** — particelle di luogo, verbi di spostamento
8. **Persone, famiglia e relazioni** — relazioni di base, piani condivisi
9. **Descrizioni, preferenze e meteo** — condizioni familiari, gusti e preferenze
10. **Acquisti, quantità e richieste** — prezzi, quantità, richieste cortesi
11. **Esistenza, posizione e bisogni** — あります/います, posizione, bisogni
12. **Sintesi pratica** — tre prove finali circoscritte: una presentazione, un'uscita quotidiana e una giornata di viaggio

Ogni lezione combina **regola · confronto · esplorazione guidata · esercizi · riepilogo**. Ogni lezione include da **3 a 5 esercizi deterministici** — riordino di tessere, scelta di particella o desinenza, trasformazione di tempo/polarità, completamento e costruzione guidata da un'intenzione in italiano o inglese. Gli esercizi sono generati da dati condivisi (concetti, lessico ed esempi): nessuna risposta canonica è duplicata nel codice e ogni esercizio resta completamente utilizzabile anche senza voce.

Il progresso locale distingue tre livelli di evidenza — **lezioni visitate**, **esercitate** e **consolidate** — senza punteggi, padronanza né completamento obbligatorio: aprire una lezione la segna solo come visitata. Gli esercizi sbagliati alimentano la coda leggera **«Da ripassare»** nella pratica libera; un ripasso corretto in modalità ripasso risolve la voce, mentre una correzione immediata nella stessa lezione non la rimuove. Non ci sono intervalli, scadenze o punteggi nascosti. Italiano/inglese e hiragana/rōmaji sono impostazioni indipendenti e funzionano su tutto il percorso completo.

**Prova parlata (facoltativa):** dopo gli esercizi, ogni lezione propone un passaggio di parlato **facoltativo** basato sul **riconoscimento vocale del browser** (Web Speech API), quando disponibile. Ti dice soltanto se il browser ha riconosciuto la frase (riconosciuta · quasi · riprova): non assegna voti e non valuta la pronuncia. L'app **non salva l'audio** e non conserva il testo riconosciuto; l'eventuale elaborazione dell'audio dipende dal browser, dal sistema operativo o dalla voce scelta. Prima del primo uso del microfono compare un avviso esplicito sulla privacy e il consenso resta in memoria solo per la sessione. Se il browser non supporta il riconoscimento o se neghi il microfono, la lezione resta completa: puoi comunque ascoltare il modello e ripetere ad alta voce. La sintesi vocale del browser (`speechSynthesis`) resta la sola riproduzione audio dei modelli.

## Pratica libera

- **Da ripassare** — la coda leggera degli esercizi sbagliati: ogni voce rimanda alla sua lezione e può essere ripassata sul posto; un ripasso corretto la risolve.
- **Laboratorio frasi** — costruisci frasi scegliendo verbo, forma, tempo e complementi; le particelle e le terminazioni sono evidenziate come "ingranaggi".
- **Sillabario** — tavola hiragana interattiva (gojūon, dakuten/handakuten, yōon) con sintesi audio per ogni sillaba.
- **Frasario** — frasi pratiche da viaggio con testo e audio, organizzate per categoria.

## Dati locali e voce

Nessun account, nessun backend. `localStorage` contiene soltanto:

- `nihongo.locale.primary`
- `nihongo.locale.reference`
- `nihongo.script`
- `nihongo.course.progress`

Se lo storage non è disponibile, l'app continua a funzionare per la sessione corrente.
`nihongo.course.progress` usa uno schema v3 versionato e migra in modo
idempotente i dati v1/v2. Lo schema distingue visite, pratica e consolidamento:
aprire una lezione la segna come visitata, mentre gli esercizi corretti fanno
avanzare gli stati **esercitata** e **consolidata**. La prova parlata è solo
pratica e non registra alcuna evidenza di progresso.

L'app usa la **sintesi vocale** del browser o del sistema operativo
(`speechSynthesis`) per la riproduzione audio dei modelli. La **prova parlata
facoltativa** usa il **riconoscimento vocale** del browser (Web Speech API) solo
su richiesta esplicita, dopo un avviso sulla privacy: l'app non registra né salva
audio, non conserva il testo riconosciuto e non invia audio o testo a un backend
dell'applicazione. L'eventuale elaborazione dell'audio o della voce dipende dal
browser, dal sistema operativo e dalla voce scelta. Sui browser che non
supportano il riconoscimento la funzione resta assente e ogni lezione rimane
comunque completa.

## Sviluppo locale

Richiede **Node 22+**.

```bash
npm ci
npm run dev
```

L'app è disponibile su <http://localhost:5173>.

## Verifica

Esistono **due insiemi di gate** e non coincidono. Chi esegue solo quello breve
deve sapere che cosa non copre.

**Insieme di sviluppo** — i quattro comandi del piano di fase, il ciclo rapido
usato durante lo sviluppo:

```bash
npx vitest run       # Vitest: motore coniugazione, dati, metadati
npx tsc --noEmit     # TypeScript: nessun errore di tipo
npm run prebuild     # validatori di rilascio A1/A2 + lint no-Japanese
npm run build        # tsc --noEmit && vite build
```

Questi quattro comandi valgono **meno di quattro** controlli distinti: `npm run
build` è `tsc --noEmit && vite build`, quindi **assorbe** il type-check autonomo
(`npx tsc --noEmit`); e `prebuild` è uno *pre-script* npm, quindi gira
**automaticamente** prima di `npm run build` e non è mai un gate a sé. Di fatto
l'insieme si riduce a `npx vitest run` più `npm run build`.

**Insieme di rilascio** — il gate canonico completo, **sei** comandi:

```bash
npm test                          # Vitest: motore coniugazione, dati, metadati
npm run build                     # TypeScript + Vite (build da solo non è sufficiente)
npm run test:e2e                  # Playwright: flussi desktop e mobile (accettazione)
GITHUB_PAGES=true npm run build   # build con prefisso /nihongo-practice/
npm audit --omit=dev              # solo dipendenze di produzione
npm audit                         # tutte le dipendenze
```

L'insieme di sviluppo è un **sottoinsieme stretto** di quello di rilascio:
rispetto ai sei comandi canonici omette i test di accettazione Playwright
(`npm run test:e2e`), la build con prefisso Pages (`GITHUB_PAGES=true npm run
build`) ed **entrambi** gli audit delle dipendenze (`npm audit --omit=dev`,
`npm audit`).

La suite completa comprende **Vitest** (unit/integrazione) e **Playwright** (desktop e mobile). La build da sola non sostituisce i test: TypeScript non cattura errori runtime né regressioni di comportamento.

C'è inoltre un controllo che non compare in **nessuno** dei due insiemi:
`npm run check:bundle` (`vite-node scripts/checkBundleBudget.ts`) verifica che
ogni chunk emesso resti sotto i 500 kB. Esiste in `package.json` ed è verificato
funzionante ("bundle budget OK", previa una build), ma non è cablato in
`prebuild`, in `build`, né in alcun workflow: gira solo se eseguito a mano.
Andrebbe eseguito come parte dell'insieme di rilascio finché non viene
automatizzato.

**Principio.** Un gate che è un sottoinsieme ma non dichiara di esserlo riporta
la copertura del superinsieme: il segnale è indistinguibile — stessa parola
"green", stessa forma di output. È così che un insieme di sviluppo riportato come
"tutti e quattro i gate verdi" fu scambiato per la copertura del gate canonico, e
il marciume dei test di accettazione è rimasto invisibile per un'intera fase.

## Architettura

- **React 18** + TypeScript
- **React Router** con `HashRouter` (routing hash, nessun server-side routing)
- **Vite** come bundler e dev server
- **Vitest** per i test unit/integrazione
- **Playwright** per i test end-to-end
- **Web Speech API** (`speechSynthesis` e, in modo facoltativo, `SpeechRecognition`) per sintesi e riconoscimento vocale
- CSS scritto a mano + font **Manrope** self-hosted

Routing statico hash; nessuna API esterna, nessun service worker, nessuna dipendenza esterna a runtime.

## GitHub Pages

Il repository include il workflow esclusivamente manuale `.github/workflows/deploy-pages.yml`. Non ha trigger `push` né `pull_request` e rifiuta qualsiasi ref diverso da `master`.

**Passi per l'attivazione:**

1. Creare o collegare il repository GitHub come <https://github.com/unsafecode/nihongo-practice>.
2. Eseguire il push del branch `master` approvato.
3. In **Settings → Pages**, scegliere **GitHub Actions** come sorgente.
4. Aprire **Actions → Deploy GitHub Pages → Run workflow**, scegliere `master` e avviare.
5. Verificare l'URL <https://unsafecode.github.io/nihongo-practice/> e tutte le route hash.

**Disattivare o ripristinare Pages:**

- In **Settings → Pages**, usare **Unpublish site** per rimuovere il sito; oppure
- rieseguire il workflow di una distribuzione precedente già verificata, o eseguirlo manualmente da un branch che punta al commit desiderato.

## Documentazione di progetto

Le specifiche e i piani di sviluppo in `docs/superpowers/` sono intenzionalmente pubblici.

## Licenza

Distribuita con [licenza MIT](./LICENSE).

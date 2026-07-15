# はなそう · Hanasō

App bilingue (IT/EN) per imparare il **giapponese pratico da viaggio**.
Offre un percorso guidato più tre aree di pratica libera (Laboratorio frasi, Sillabario hiragana, Frasario da viaggio).
SPA statica: nessun account, nessun backend, nessuna analisi, nessun tracker, nessuna registrazione, nessun servizio esterno dell'app.

---

## Esperienza v2.1 corretta

Il percorso è composto da **sette moduli guidati e un capstone**, ciascuno con una o più lezioni compatte.

I moduli coprono in sequenza:

1. **Suoni** — l'alfabeto sillabico e la lettura hiragana
2. **Riconoscimento e struttura della frase** — ordine SOV, particelle, predicato finale
3. **Ordinare e fare richieste** — forme cortesi al presente
4. **Tempo e polarità** — passato, negativo, negativo passato
5. **Movimento e luoghi** — particelle di luogo, verbi di spostamento
6. **Persone, desideri e inviti** — たい, ましょう, contesti sociali
7. **Domande ed esistenza** — か, あります/います
8. **Capstone** — sintesi di una giornata da viaggio

Ogni lezione combina **regola · confronto · esplorazione guidata · riepilogo**.

Il progresso è espresso solo in **lezioni visitate**: nessun punteggio, nessuna padronanza, nessun completamento obbligatorio. Italiano/inglese e hiragana/rōmaji sono impostazioni indipendenti.

## Pratica libera

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

La v2.1 usa esclusivamente la sintesi vocale del browser o del sistema operativo. L'app non registra audio e non invia testo o audio a un backend dell'applicazione; l'eventuale elaborazione online di una voce dipende dal browser, dal sistema e dalla voce scelta.

## Sviluppo locale

Richiede **Node 22+**.

```bash
npm ci
npm run dev
```

L'app è disponibile su <http://localhost:5173>.

## Verifica

```bash
npm test                          # Vitest: motore coniugazione, dati, metadati
npm run build                     # TypeScript + Vite (build da solo non è sufficiente)
npm run test:e2e                  # Playwright: flussi desktop e mobile
GITHUB_PAGES=true npm run build   # build con prefisso /nihongo-practice/
npm audit --omit=dev              # solo dipendenze di produzione
npm audit                         # tutte le dipendenze
```

La suite completa comprende **Vitest** (unit/integrazione) e **Playwright** (desktop e mobile). La build da sola non sostituisce i test: TypeScript non cattura errori runtime né regressioni di comportamento.

## Architettura

- **React 18** + TypeScript
- **React Router** con `HashRouter` (routing hash, nessun server-side routing)
- **Vite** come bundler e dev server
- **Vitest** per i test unit/integrazione
- **Playwright** per i test end-to-end
- **Web Speech API** (`speechSynthesis`) per la sintesi vocale
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

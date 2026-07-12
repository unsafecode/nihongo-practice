# はなそう · Giapponese pratico

Piccola app locale per imparare il **giapponese parlato da viaggio**: frasi pratiche per
cavarsela sul posto (saluti, ristorante, shopping, indicazioni, emergenze…), da **ascoltare**
grazie alla sintesi vocale del browser.

> Progetto fatto per divertimento e per uso personale — non è un corso strutturato né materiale "business".

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

### Audio: se non senti nulla

L'app funziona anche senza audio, ma per sentire le frasi serve una **voce giapponese** installata:

- **macOS:** Impostazioni → Accessibilità → Contenuto vocale → Voce di sistema → Gestisci voci →
  Giapponese (es. *Kyoko*).
- **Windows:** Impostazioni → Ora e lingua → Lingua e voce → aggiungi il pacchetto voce giapponese.

Se non c'è nessuna voce ja-JP, l'app mostra un avviso ma resta usabile (hiragana + romaji + traduzione).

## Contenuti

8 categorie pratiche: Saluti, Parole base, Presentarsi, Mangiare e bere, Shopping, Indicazioni,
Emergenze, Numeri. Le frasi sono in `src/data/phrases.ts` — facilissime da estendere.

## Stack

- [Vite](https://vite.dev/) + React + TypeScript
- CSS scritto a mano (nessun framework di stile, per tenere le dipendenze al minimo)
- Web Speech API (`speechSynthesis`) per l'audio

## Struttura

```
src/
  data/phrases.ts        # tutti i contenuti (categorie + frasi)
  hooks/useSpeech.ts     # layer audio (Web Speech API)
  components/
    Header.tsx
    CategoryNav.tsx      # navigazione categorie (sidebar / scroll su mobile)
    PhraseCard.tsx       # card frase con pulsanti Ascolta / Lento
    SpeechNotice.tsx     # avviso se manca il supporto audio
  App.tsx
  styles.css
```

## Idee per la v2 (non incluse nella v1)

- TTS neurale in cloud (Azure Speech / OpenAI / ElevenLabs) per voci più naturali
- Modalità "quiz / flashcard" (nascondi la traduzione, prova a ricordare)
- Ricerca e preferiti tra le frasi
- Riconoscimento vocale per esercitare la pronuncia
- Toggle opzionale per mostrare anche katakana/kanji quando si è più avanti

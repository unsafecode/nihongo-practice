/**
 * Authored bilingual semantic glosses for every A2 contextual kanji (Phase 3
 * Task 8 spec-fix, ISSUE 2).
 *
 * Task 3 froze the 120-glyph {@link ../kanji/a2KanjiCatalog} with a
 * `meaningCopyId` per entry, but never authored the copy those ids point at,
 * so the A2 lesson page had a dangling, never-rendered gloss reference. This
 * module supplies the missing authoritative meaning data at the kanji-catalog
 * boundary: one short EN + IT gloss keyed by the *exact* `meaningCopyId` the
 * catalog generates for each entry, so the runtime can render a real,
 * localized meaning next to each glyph.
 *
 * Design constraints (verified by `kanjiMeanings.test.ts`):
 *   - Exactly one gloss per catalog entry — full key parity, no orphans.
 *   - Every value is real EN/IT UI copy, never empty and never Japanese
 *     (kana/CJK), so it is safe to surface as learner-facing support text and
 *     never smuggles a Japanese literal past the no-Japanese content policy.
 *   - Glyphs that share a contextual lexeme (e.g. 名/前 in 名前) carry
 *     *independent* glosses because they carry distinct `meaningCopyId`s — a
 *     shared glyph's meaning is never collapsed onto its neighbour's.
 *
 * Each gloss describes the glyph's own meaning inside its taught lexeme; it is
 * intentionally terse (a word or two) — recognition support, not a dictionary.
 */

export interface KanjiMeaningGloss {
  readonly en: string;
  readonly it: string;
}

/**
 * Keyed by the catalog entry's `meaningCopyId`. Grouped by teaching module for
 * legibility; the key is the single source of truth the runtime resolves.
 */
export const A2_KANJI_MEANINGS: Readonly<Record<string, KanjiMeaningGloss>> = {
  // ── Module 1 — connected-conversation ──────────────────────────────────
  "a2-kanji-hanasu-meaning": { en: "to speak, to talk", it: "parlare" },
  "a2-kanji-iu-meaning": { en: "to say", it: "dire" },
  "a2-kanji-kiku-meaning": { en: "to listen, to hear, to ask", it: "ascoltare, sentire" },
  "a2-kanji-tomodachi-meaning": { en: "friend", it: "amico" },
  "a2-kanji-omou-meaning": { en: "to think, to feel", it: "pensare" },
  "a2-kanji-namae-na-meaning": { en: "name", it: "nome" },
  "a2-kanji-namae-mae-meaning": { en: "front, before", it: "davanti, prima" },
  "a2-kanji-nani-meaning": { en: "what, how many", it: "che cosa, quanti" },

  // ── Module 2 — plans-invitations ───────────────────────────────────────
  "a2-kanji-yotei-yo-meaning": { en: "beforehand, in advance", it: "in anticipo, prima" },
  "a2-kanji-yotei-tei-meaning": { en: "fixed, settled", it: "fissato, stabilito" },
  "a2-kanji-youbi-you-meaning": { en: "day of the week", it: "giorno della settimana" },
  "a2-kanji-au-meaning": { en: "to meet", it: "incontrare" },
  "a2-kanji-konshuu-kon-meaning": { en: "now, this (current)", it: "ora, questo (attuale)" },
  "a2-kanji-youbi-bi-meaning": { en: "day, sun", it: "giorno, sole" },
  "a2-kanji-konshuu-shuu-meaning": { en: "week", it: "settimana" },
  "a2-kanji-shuumatsu-meaning": { en: "end, close", it: "fine, termine" },
  "a2-kanji-machimasu-meaning": { en: "to wait", it: "aspettare" },
  "a2-kanji-yakusoku-meaning": { en: "promise, appointment", it: "promessa, impegno" },
  "a2-kanji-raigetsu-rai-meaning": { en: "to come, next", it: "venire, prossimo" },
  "a2-kanji-raigetsu-getsu-meaning": { en: "month, moon", it: "mese, luna" },

  // ── Module 3 — experiences-narratives ──────────────────────────────────
  "a2-kanji-kyonen-kyo-meaning": { en: "past, to leave", it: "passato, andarsene" },
  "a2-kanji-tanoshii-meaning": { en: "fun, enjoyable", it: "divertente, piacevole" },
  "a2-kanji-hajimete-meaning": { en: "first, beginning", it: "primo, inizio" },
  "a2-kanji-ichido-meaning": { en: "time, occasion, degree", it: "volta, grado" },
  "a2-kanji-kyonen-nen-meaning": { en: "year", it: "anno" },
  "a2-kanji-yuumei-meaning": { en: "to have, to exist", it: "avere, esistere" },
  "a2-kanji-oyogu-meaning": { en: "to swim", it: "nuotare" },
  "a2-kanji-noboru-meaning": { en: "to climb", it: "salire, scalare" },
  "a2-kanji-ryokou-meaning": { en: "travel, journey", it: "viaggio" },

  // ── Module 4 — reasons-opinions ────────────────────────────────────────
  "a2-kanji-riyuu-ri-meaning": { en: "reason, logic", it: "ragione, logica" },
  "a2-kanji-riyuu-yuu-meaning": { en: "cause, origin", it: "causa, origine" },
  "a2-kanji-kangaeru-meaning": { en: "to think over, to consider", it: "considerare, riflettere" },
  "a2-kanji-iken-i-meaning": { en: "meaning, intention, mind", it: "significato, intenzione" },
  "a2-kanji-iken-ken-meaning": { en: "to see, to look", it: "vedere, guardare" },
  "a2-kanji-kimochi-ki-meaning": { en: "spirit, feeling, mood", it: "spirito, umore" },
  "a2-kanji-kimochi-mo-meaning": { en: "to hold, to carry", it: "tenere, portare" },
  "a2-kanji-warui-meaning": { en: "bad, wrong", it: "cattivo, sbagliato" },

  // ── Module 5 — sequencing-ongoing ──────────────────────────────────────
  "a2-kanji-okiru-meaning": { en: "to get up, to wake", it: "alzarsi, svegliarsi" },
  "a2-kanji-neru-meaning": { en: "to sleep, to go to bed", it: "dormire, coricarsi" },
  "a2-kanji-tsukau-meaning": { en: "to use", it: "usare" },
  "a2-kanji-tsukuru-meaning": { en: "to make", it: "fare, creare" },
  "a2-kanji-mainichi-meaning": { en: "every, each", it: "ogni, ciascuno" },
  "a2-kanji-arau-meaning": { en: "to wash", it: "lavare" },
  "a2-kanji-owaru-meaning": { en: "to finish, to end", it: "finire, terminare" },
  "a2-kanji-hajimaru-meaning": { en: "to begin, to start", it: "iniziare, cominciare" },
  "a2-kanji-hataraku-meaning": { en: "to work", it: "lavorare" },

  // ── Module 6 — permission-requests ─────────────────────────────────────
  "a2-kanji-hairu-meaning": { en: "to enter", it: "entrare" },
  "a2-kanji-iriguchi-meaning": { en: "mouth, opening", it: "bocca, apertura" },
  "a2-kanji-deguchi-meaning": { en: "to go out, to exit", it: "uscire" },
  "a2-kanji-tomaru-stop-meaning": { en: "to stop", it: "fermare, fermarsi" },
  "a2-kanji-kinshi-meaning": { en: "prohibition, forbidden", it: "divieto, proibito" },
  "a2-kanji-kesu-meaning": { en: "to erase, to switch off", it: "cancellare, spegnere" },
  "a2-kanji-suwaru-meaning": { en: "to sit", it: "sedersi" },
  "a2-kanji-tatsu-meaning": { en: "to stand", it: "stare in piedi, alzarsi" },

  // ── Module 7 — neighborhood-services ───────────────────────────────────
  "a2-kanji-byouin-byou-meaning": { en: "illness, sickness", it: "malattia" },
  "a2-kanji-byouin-in-meaning": { en: "institution, building", it: "istituto, edificio" },
  "a2-kanji-ginkou-gin-meaning": { en: "silver", it: "argento" },
  "a2-kanji-ginkou-kou-meaning": { en: "to go, line", it: "andare, riga" },
  "a2-kanji-yuubinkyoku-meaning": { en: "office, bureau", it: "ufficio" },
  "a2-kanji-benri-meaning": { en: "convenience, mail service", it: "comodità, servizio postale" },
  "a2-kanji-toshokan-to-meaning": { en: "diagram, plan", it: "mappa, schema" },
  "a2-kanji-toshokan-kan-meaning": { en: "hall, large building", it: "sala, edificio" },

  // ── Module 8 — restaurant-problems ─────────────────────────────────────
  "a2-kanji-taberu-meaning": { en: "to eat, food", it: "mangiare, cibo" },
  "a2-kanji-nomu-meaning": { en: "to drink", it: "bere" },
  "a2-kanji-gohan-meaning": { en: "cooked rice, meal", it: "riso cotto, pasto" },
  "a2-kanji-ocha-meaning": { en: "tea", it: "tè" },
  "a2-kanji-niku-meaning": { en: "meat", it: "carne" },
  "a2-kanji-sakana-meaning": { en: "fish", it: "pesce" },
  "a2-kanji-atsui-meaning": { en: "hot, heat, fever", it: "caldo, febbre" },
  "a2-kanji-tsumetai-meaning": { en: "cold, to cool", it: "freddo, raffreddare" },

  // ── Module 9 — shopping-returns ────────────────────────────────────────
  "a2-kanji-kau-meaning": { en: "to buy", it: "comprare" },
  "a2-kanji-mise-meaning": { en: "shop, store", it: "negozio" },
  "a2-kanji-senen-en-meaning": { en: "yen, circle", it: "yen, cerchio" },
  "a2-kanji-ichiban-meaning": { en: "number, turn, most", it: "numero, turno" },
  "a2-kanji-senen-sen-meaning": { en: "thousand", it: "mille" },
  "a2-kanji-ichiman-meaning": { en: "ten thousand", it: "diecimila" },
  "a2-kanji-yasui-meaning": { en: "cheap, inexpensive", it: "economico, a buon mercato" },
  "a2-kanji-takai-meaning": { en: "expensive, high, tall", it: "caro, alto" },

  // ── Module 10 — health-advice ──────────────────────────────────────────
  "a2-kanji-isha-i-meaning": { en: "medicine, medical", it: "medicina, medico" },
  "a2-kanji-isha-sha-meaning": { en: "person", it: "persona" },
  "a2-kanji-kusuri-meaning": { en: "medicine, drug", it: "medicina, farmaco" },
  "a2-kanji-karada-meaning": { en: "body", it: "corpo" },
  "a2-kanji-atama-meaning": { en: "head", it: "testa" },
  "a2-kanji-itai-meaning": { en: "pain, painful", it: "dolore, dolente" },
  "a2-kanji-genki-meaning": { en: "origin, energy, health", it: "origine, energia" },
  "a2-kanji-yasumu-meaning": { en: "to rest, to take a break", it: "riposare" },

  // ── Module 11 — work-study-messages ────────────────────────────────────
  "a2-kanji-kaisha-meaning": { en: "company, firm", it: "azienda, società" },
  "a2-kanji-shigoto-shi-meaning": { en: "to serve, to do", it: "servire, fare" },
  "a2-kanji-shigoto-goto-meaning": { en: "thing, matter, affair", it: "cosa, faccenda" },
  "a2-kanji-oshieru-meaning": { en: "to teach", it: "insegnare" },
  "a2-kanji-gakkou-gaku-meaning": { en: "study, learning", it: "studio, apprendimento" },
  "a2-kanji-gakkou-kou-meaning": { en: "school", it: "scuola" },
  "a2-kanji-sensei-meaning": { en: "ahead, previous", it: "prima, davanti" },
  "a2-kanji-gakusei-meaning": { en: "life, to be born", it: "vita, nascere" },

  // ── Module 12 — travel-reservations ────────────────────────────────────
  "a2-kanji-kuukou-kuu-meaning": { en: "sky, empty", it: "cielo, vuoto" },
  "a2-kanji-kuukou-kou-meaning": { en: "harbor, port", it: "porto" },
  "a2-kanji-eki-meaning": { en: "station", it: "stazione" },
  "a2-kanji-densha-den-meaning": { en: "electricity", it: "elettricità" },
  "a2-kanji-yama-meaning": { en: "mountain", it: "montagna" },
  "a2-kanji-densha-sha-meaning": { en: "car, vehicle", it: "auto, veicolo" },
  "a2-kanji-tsuku-arrive-meaning": { en: "to arrive, to wear", it: "arrivare, indossare" },
  "a2-kanji-shuppatsu-meaning": { en: "departure, to set off", it: "partenza" },
  "a2-kanji-tomaru-stay-meaning": { en: "to stay overnight, to lodge", it: "pernottare, alloggiare" },

  // ── Module 13 — relationships-events ───────────────────────────────────
  "a2-kanji-haha-meaning": { en: "mother", it: "madre" },
  "a2-kanji-chichi-meaning": { en: "father", it: "padre" },
  "a2-kanji-kazoku-ka-meaning": { en: "house, home, family", it: "casa, famiglia" },
  "a2-kanji-kazoku-zoku-meaning": { en: "family group, tribe", it: "gruppo familiare, clan" },
  "a2-kanji-kekkon-kek-meaning": { en: "to tie, to bind, to join", it: "legare, unire" },
  "a2-kanji-kekkon-kon-meaning": { en: "marriage", it: "matrimonio" },
  "a2-kanji-tanjoubi-meaning": { en: "birth", it: "nascita" },
  "a2-kanji-okuru-meaning": { en: "to send, to see off", it: "inviare, accompagnare" },

  // ── Module 14 — practical-texts ────────────────────────────────────────
  "a2-kanji-jikan-ji-meaning": { en: "time, hour", it: "tempo, ora" },
  "a2-kanji-jikan-kan-meaning": { en: "interval, between", it: "intervallo, tra" },
  "a2-kanji-gofun-meaning": { en: "minute, part", it: "minuto, parte" },
  "a2-kanji-han-meaning": { en: "half", it: "metà, mezzo" },
  "a2-kanji-hon-meaning": { en: "book, origin", it: "libro, origine" },
  "a2-kanji-ryoukin-ryou-meaning": { en: "fee, materials", it: "tariffa, materiali" },
  "a2-kanji-ryoukin-kin-meaning": { en: "money, gold", it: "denaro, oro" },
  "a2-kanji-aku-meaning": { en: "to open", it: "aprire" },
  "a2-kanji-shimaru-meaning": { en: "to close, to shut", it: "chiudere" },
};

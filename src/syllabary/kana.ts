import type { Locale } from "../i18n/LocaleContext";

/**
 * Tavola statica dell'hiragana (kana → rōmaji).
 *
 * Copre tutto ciò che serve per leggere i contenuti dell'app (spec §2.1):
 * gojūon di base (46), dakuten/handakuten, yōon. Il rōmaji è memorizzato qui
 * (niente traslitterazione a runtime), in stile Hepburn come nel resto dell'app
 * (shi, chi, tsu, fu, ji, zu).
 */

export interface Kana {
  kana: string;
  romaji: string;
}

/** Riga con etichetta (per intestazioni/gruppi nella griglia). */
export interface KanaRow {
  label: string; // es. "k", "g", "きゃ"
  cells: (Kana | null)[];
}

const k = (kana: string, romaji: string): Kana => ({ kana, romaji });

/** Gojūon di base: 46 kana + ん. Le caselle vuote sono `null`. */
export const GOJUON: KanaRow[] = [
  { label: "—", cells: [k("あ", "a"), k("い", "i"), k("う", "u"), k("え", "e"), k("お", "o")] },
  { label: "k", cells: [k("か", "ka"), k("き", "ki"), k("く", "ku"), k("け", "ke"), k("こ", "ko")] },
  { label: "s", cells: [k("さ", "sa"), k("し", "shi"), k("す", "su"), k("せ", "se"), k("そ", "so")] },
  { label: "t", cells: [k("た", "ta"), k("ち", "chi"), k("つ", "tsu"), k("て", "te"), k("と", "to")] },
  { label: "n", cells: [k("な", "na"), k("に", "ni"), k("ぬ", "nu"), k("ね", "ne"), k("の", "no")] },
  { label: "h", cells: [k("は", "ha"), k("ひ", "hi"), k("ふ", "fu"), k("へ", "he"), k("ほ", "ho")] },
  { label: "m", cells: [k("ま", "ma"), k("み", "mi"), k("む", "mu"), k("め", "me"), k("も", "mo")] },
  { label: "y", cells: [k("や", "ya"), null, k("ゆ", "yu"), null, k("よ", "yo")] },
  { label: "r", cells: [k("ら", "ra"), k("り", "ri"), k("る", "ru"), k("れ", "re"), k("ろ", "ro")] },
  { label: "w", cells: [k("わ", "wa"), null, null, null, k("を", "o")] },
  { label: "ん", cells: [k("ん", "n"), null, null, null, null] },
];

/** Intestazioni di colonna della griglia gojūon (vocali). */
export const VOWELS = ["a", "i", "u", "e", "o"];

/** Dakuten (sonore) e handakuten (ぱ): la voce cambia con i due punti / il pallino. */
export const DAKUTEN: KanaRow[] = [
  { label: "g", cells: [k("が", "ga"), k("ぎ", "gi"), k("ぐ", "gu"), k("げ", "ge"), k("ご", "go")] },
  { label: "z", cells: [k("ざ", "za"), k("じ", "ji"), k("ず", "zu"), k("ぜ", "ze"), k("ぞ", "zo")] },
  { label: "d", cells: [k("だ", "da"), k("ぢ", "ji"), k("づ", "zu"), k("で", "de"), k("ど", "do")] },
  { label: "b", cells: [k("ば", "ba"), k("び", "bi"), k("ぶ", "bu"), k("べ", "be"), k("ぼ", "bo")] },
  { label: "p", cells: [k("ぱ", "pa"), k("ぴ", "pi"), k("ぷ", "pu"), k("ぺ", "pe"), k("ぽ", "po")] },
];

/** Yōon: kana + piccolo ゃ/ゅ/ょ. Tre colonne (a / u / o). */
export const YOON_VOWELS = ["ya", "yu", "yo"];

export const YOON: KanaRow[] = [
  { label: "ky", cells: [k("きゃ", "kya"), k("きゅ", "kyu"), k("きょ", "kyo")] },
  { label: "sh", cells: [k("しゃ", "sha"), k("しゅ", "shu"), k("しょ", "sho")] },
  { label: "ch", cells: [k("ちゃ", "cha"), k("ちゅ", "chu"), k("ちょ", "cho")] },
  { label: "ny", cells: [k("にゃ", "nya"), k("にゅ", "nyu"), k("にょ", "nyo")] },
  { label: "hy", cells: [k("ひゃ", "hya"), k("ひゅ", "hyu"), k("ひょ", "hyo")] },
  { label: "my", cells: [k("みゃ", "mya"), k("みゅ", "myu"), k("みょ", "myo")] },
  { label: "ry", cells: [k("りゃ", "rya"), k("りゅ", "ryu"), k("りょ", "ryo")] },
  { label: "gy", cells: [k("ぎゃ", "gya"), k("ぎゅ", "gyu"), k("ぎょ", "gyo")] },
  { label: "j", cells: [k("じゃ", "ja"), k("じゅ", "ju"), k("じょ", "jo")] },
  { label: "by", cells: [k("びゃ", "bya"), k("びゅ", "byu"), k("びょ", "byo")] },
  { label: "py", cells: [k("ぴゃ", "pya"), k("ぴゅ", "pyu"), k("ぴょ", "pyo")] },
];

export interface SpecialNote {
  kana: string;
  title: Record<Locale, string>;
  body: Record<Locale, string>;
}

/** Note brevi su っ (raddoppio), ー (allungamento), ん (nasale). */
export const NOTES: SpecialNote[] = [
  { kana: "っ",
    title: { it: "Piccolo つ — raddoppio consonantico", en: "Small つ — consonant doubling" },
    body: { it: "Il piccolo つ raddoppia la consonante successiva: がっこう = gakkō, きって = kitte. Segna una breve pausa, non un suono autonomo.", en: "A small つ doubles the next consonant: がっこう = gakkō, きって = kitte. It is a short pause, not a separate sound." } },
  { kana: "ー",
    title: { it: "Segno di vocale lunga", en: "Long-vowel mark" },
    body: { it: "Allunga la vocale precedente, soprattutto nei prestiti scritti in katakana. In hiragana, una vocale lunga si scrive di solito aggiungendo una vocale.", en: "It lengthens the previous vowel, especially in katakana loanwords. In hiragana, long vowels are usually written with an additional vowel." } },
  { kana: "ん",
    title: { it: "ん — nasale moraica", en: "ん — the moraic nasal" },
    body: { it: "È l'unico suono simile a una consonante che può occupare da solo un'unità ritmica. La pronuncia si adatta al suono successivo.", en: "It is the only consonant-like sound that stands alone. Its pronunciation adapts to the following sound." } },
];

export const INTRO = {
  it: "L'hiragana è uno dei sistemi di scrittura del giapponese: ogni segno rappresenta un suono ritmico. Impara a leggerlo per usare tutto il resto dell'app. Tocca una casella per ascoltare.",
  en: "Hiragana is one of the Japanese writing systems: each sign represents a rhythmic sound unit. Learn it to use the rest of the app. Tap a cell to listen.",
} satisfies Record<Locale, string>;

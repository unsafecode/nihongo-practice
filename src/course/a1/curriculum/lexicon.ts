import { deepFreeze } from "../../foundations/deepFreeze";
import { a1SemanticValues } from "../catalog/a1SemanticCatalog";
import type { A1Lexeme, Bilingual } from "./types";

const LEXEME_CATEGORIES = new Set<A1Lexeme["category"]>([
  "pronoun",
  "person",
  "noun",
  "verb",
  "adjective",
  "question-word",
  "time",
  "expression",
]);
const VERB_CLASSES = new Set<NonNullable<A1Lexeme["verb"]>["class"]>([
  "godan",
  "ichidan",
  "irregular",
]);

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertBilingual(value: Bilingual, label: string): void {
  assertNonEmptyString(value.en, `${label}.en`);
  assertNonEmptyString(value.it, `${label}.it`);
}

/**
 * Validates one learner-facing lexeme without changing any authored form or
 * meaning, then deeply freezes it for safe catalog sharing.
 */
export function defineA1Lexeme(input: A1Lexeme): A1Lexeme {
  assertNonEmptyString(input.id, "Lexeme id");
  assertNonEmptyString(input.kana, "Lexeme kana");
  assertNonEmptyString(input.romaji, "Lexeme romaji");
  assertBilingual(input.meaning, "Lexeme meaning");

  if (!Array.isArray(input.valueIds) || input.valueIds.length === 0) {
    throw new Error("Lexeme value ids must be a non-empty array.");
  }
  const valueIds = new Set<string>();
  for (const valueId of input.valueIds) {
    assertNonEmptyString(valueId, "Lexeme value id");
    if (valueIds.has(valueId)) {
      throw new Error(`Duplicate lexeme value id "${valueId}".`);
    }
    valueIds.add(valueId);
  }

  if (!LEXEME_CATEGORIES.has(input.category)) {
    throw new Error(`Unknown lexeme category "${input.category}".`);
  }
  if (input.category !== "verb" && input.verb !== undefined) {
    throw new Error("Non-verb lexemes cannot define verb forms.");
  }
  if (input.category === "verb") {
    if (input.verb === undefined) {
      throw new Error("Verb lexemes require verb forms.");
    }
    assertNonEmptyString(input.verb.dictionary.kana, "Verb dictionary kana");
    assertNonEmptyString(input.verb.dictionary.romaji, "Verb dictionary romaji");
    assertNonEmptyString(input.verb.polite.kana, "Verb polite kana");
    assertNonEmptyString(input.verb.polite.romaji, "Verb polite romaji");
    if (!VERB_CLASSES.has(input.verb.class)) {
      throw new Error(`Unknown verb class "${input.verb.class}".`);
    }
  }

  return deepFreeze(input);
}

export const a1Lexemes: readonly A1Lexeme[] = deepFreeze([
  defineA1Lexeme({ id: "a1-lexeme-watashi", valueIds: ["a1-value-watashi"], kana: "わたし", romaji: "watashi", category: "pronoun", meaning: { en: "I; me", it: "io; me" } }),
  defineA1Lexeme({ id: "a1-lexeme-gakusei", valueIds: ["a1-value-obj-student"], kana: "がくせい", romaji: "gakusei", category: "person", meaning: { en: "student", it: "studente; studentessa" } }),
  defineA1Lexeme({ id: "a1-lexeme-taberu", valueIds: ["a1-value-eat", "a1-value-eat-routine"], kana: "たべる", romaji: "taberu", category: "verb", meaning: { en: "to eat", it: "mangiare" }, verb: { dictionary: { kana: "たべる", romaji: "taberu" }, polite: { kana: "たべます", romaji: "tabemasu" }, class: "ichidan" } }),

  defineA1Lexeme({ id: "a1-lexeme-yuki", valueIds: ["a1-value-yuki"], kana: "ゆき", romaji: "yuki", category: "person", meaning: { en: "Yuki", it: "Yuki" } }),
  defineA1Lexeme({ id: "a1-lexeme-ken", valueIds: ["a1-value-ken"], kana: "けん", romaji: "ken", category: "person", meaning: { en: "Ken", it: "Ken" } }),
  defineA1Lexeme({ id: "a1-lexeme-mina", valueIds: ["a1-value-mina"], kana: "みな", romaji: "mina", category: "person", meaning: { en: "Mina", it: "Mina" } }),
  defineA1Lexeme({ id: "a1-lexeme-sensei", valueIds: ["a1-value-teacher-subject", "a1-value-obj-teacher", "a1-value-recipient-teacher", "a1-value-companion-teacher"], kana: "せんせい", romaji: "sensei", category: "person", meaning: { en: "teacher", it: "insegnante" } }),
  defineA1Lexeme({ id: "a1-lexeme-kurasumeeto", valueIds: ["a1-value-classmate-subject", "a1-value-companion-classmate"], kana: "クラスメート", romaji: "kurasumeeto", category: "person", meaning: { en: "classmate", it: "compagno; compagna di classe" } }),
  defineA1Lexeme({ id: "a1-lexeme-tomodachi", valueIds: ["a1-value-friend-subject", "a1-value-companion-friend", "a1-value-recipient-friend"], kana: "ともだち", romaji: "tomodachi", category: "person", meaning: { en: "friend", it: "amico; amica" } }),
  defineA1Lexeme({ id: "a1-lexeme-tenin", valueIds: ["a1-value-clerk-subject", "a1-value-obj-clerk", "a1-value-recipient-clerk"], kana: "てんいん", romaji: "ten'in", category: "person", meaning: { en: "shop clerk", it: "commesso; commessa" } }),
  defineA1Lexeme({ id: "a1-lexeme-kore", valueIds: ["a1-value-kore", "a1-value-obj-kore"], kana: "これ", romaji: "kore", category: "pronoun", meaning: { en: "this; this one", it: "questo; questa cosa" } }),
  defineA1Lexeme({ id: "a1-lexeme-sore", valueIds: ["a1-value-sore", "a1-value-obj-sore"], kana: "それ", romaji: "sore", category: "pronoun", meaning: { en: "that; that one", it: "quello; quella cosa" } }),
  defineA1Lexeme({ id: "a1-lexeme-are", valueIds: ["a1-value-are", "a1-value-obj-are"], kana: "あれ", romaji: "are", category: "pronoun", meaning: { en: "that over there", it: "quello laggiù" } }),
  defineA1Lexeme({ id: "a1-lexeme-kono-hito", valueIds: ["a1-value-kono-hito"], kana: "このひと", romaji: "kono hito", category: "expression", meaning: { en: "this person", it: "questa persona" } }),
  defineA1Lexeme({ id: "a1-lexeme-sono-hito", valueIds: ["a1-value-sono-hito"], kana: "そのひと", romaji: "sono hito", category: "expression", meaning: { en: "that person", it: "quella persona" } }),
  defineA1Lexeme({ id: "a1-lexeme-ano-hito", valueIds: ["a1-value-ano-hito"], kana: "あのひと", romaji: "ano hito", category: "expression", meaning: { en: "that person over there", it: "quella persona laggiù" } }),
  defineA1Lexeme({ id: "a1-lexeme-toire", valueIds: ["a1-value-toire-subject"], kana: "トイレ", romaji: "toire", category: "noun", meaning: { en: "toilet; restroom", it: "bagno; toilette" } }),
  defineA1Lexeme({ id: "a1-lexeme-paatii", valueIds: ["a1-value-paatii-subject"], kana: "パーティー", romaji: "paatii", category: "noun", meaning: { en: "party", it: "festa" } }),
  defineA1Lexeme({ id: "a1-lexeme-mikan", valueIds: ["a1-value-mikan-subject", "a1-value-obj-mikan"], kana: "みかん", romaji: "mikan", category: "noun", meaning: { en: "mandarin orange", it: "mandarino" } }),
  defineA1Lexeme({ id: "a1-lexeme-eki", valueIds: ["a1-value-eki-subject", "a1-value-loc-station"], kana: "えき", romaji: "eki", category: "noun", meaning: { en: "station", it: "stazione" } }),

  defineA1Lexeme({ id: "a1-lexeme-sumu", valueIds: ["a1-value-live"], kana: "すむ", romaji: "sumu", category: "verb", meaning: { en: "to live; reside", it: "abitare; risiedere" }, verb: { dictionary: { kana: "すむ", romaji: "sumu" }, polite: { kana: "すみます", romaji: "sumimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-hataraku", valueIds: ["a1-value-work"], kana: "はたらく", romaji: "hataraku", category: "verb", meaning: { en: "to work", it: "lavorare" }, verb: { dictionary: { kana: "はたらく", romaji: "hataraku" }, polite: { kana: "はたらきます", romaji: "hatarakimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-benkyou-suru", valueIds: ["a1-value-study", "a1-value-study-routine"], kana: "べんきょうする", romaji: "benkyou suru", category: "verb", meaning: { en: "to study", it: "studiare" }, verb: { dictionary: { kana: "べんきょうする", romaji: "benkyou suru" }, polite: { kana: "べんきょうします", romaji: "benkyou shimasu" }, class: "irregular" } }),
  defineA1Lexeme({ id: "a1-lexeme-wakaru", valueIds: ["a1-value-understand"], kana: "わかる", romaji: "wakaru", category: "verb", meaning: { en: "to understand", it: "capire" }, verb: { dictionary: { kana: "わかる", romaji: "wakaru" }, polite: { kana: "わかります", romaji: "wakarimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-suru", valueIds: ["a1-value-do"], kana: "する", romaji: "suru", category: "verb", meaning: { en: "to do", it: "fare" }, verb: { dictionary: { kana: "する", romaji: "suru" }, polite: { kana: "します", romaji: "shimasu" }, class: "irregular" } }),
  defineA1Lexeme({ id: "a1-lexeme-iku", valueIds: ["a1-value-go", "a1-value-accompany"], kana: "いく", romaji: "iku", category: "verb", meaning: { en: "to go", it: "andare" }, verb: { dictionary: { kana: "いく", romaji: "iku" }, polite: { kana: "いきます", romaji: "ikimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-kuru", valueIds: ["a1-value-come"], kana: "くる", romaji: "kuru", category: "verb", meaning: { en: "to come", it: "venire" }, verb: { dictionary: { kana: "くる", romaji: "kuru" }, polite: { kana: "きます", romaji: "kimasu" }, class: "irregular" } }),
  defineA1Lexeme({ id: "a1-lexeme-nomu", valueIds: ["a1-value-drink"], kana: "のむ", romaji: "nomu", category: "verb", meaning: { en: "to drink", it: "bere" }, verb: { dictionary: { kana: "のむ", romaji: "nomu" }, polite: { kana: "のみます", romaji: "nomimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-yomu", valueIds: ["a1-value-read", "a1-value-read-routine"], kana: "よむ", romaji: "yomu", category: "verb", meaning: { en: "to read", it: "leggere" }, verb: { dictionary: { kana: "よむ", romaji: "yomu" }, polite: { kana: "よみます", romaji: "yomimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-kaku", valueIds: ["a1-value-write"], kana: "かく", romaji: "kaku", category: "verb", meaning: { en: "to write", it: "scrivere" }, verb: { dictionary: { kana: "かく", romaji: "kaku" }, polite: { kana: "かきます", romaji: "kakimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-kau", valueIds: ["a1-value-buy"], kana: "かう", romaji: "kau", category: "verb", meaning: { en: "to buy", it: "comprare" }, verb: { dictionary: { kana: "かう", romaji: "kau" }, polite: { kana: "かいます", romaji: "kaimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-miru", valueIds: ["a1-value-see"], kana: "みる", romaji: "miru", category: "verb", meaning: { en: "to see; watch", it: "vedere; guardare" }, verb: { dictionary: { kana: "みる", romaji: "miru" }, polite: { kana: "みます", romaji: "mimasu" }, class: "ichidan" } }),
  defineA1Lexeme({ id: "a1-lexeme-kiku", valueIds: ["a1-value-listen", "a1-value-ask"], kana: "きく", romaji: "kiku", category: "verb", meaning: { en: "to listen; ask", it: "ascoltare; chiedere" }, verb: { dictionary: { kana: "きく", romaji: "kiku" }, polite: { kana: "ききます", romaji: "kikimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-okiru", valueIds: ["a1-value-wake"], kana: "おきる", romaji: "okiru", category: "verb", meaning: { en: "to get up; wake up", it: "alzarsi; svegliarsi" }, verb: { dictionary: { kana: "おきる", romaji: "okiru" }, polite: { kana: "おきます", romaji: "okimasu" }, class: "ichidan" } }),
  defineA1Lexeme({ id: "a1-lexeme-neru", valueIds: ["a1-value-sleep"], kana: "ねる", romaji: "neru", category: "verb", meaning: { en: "to sleep; go to bed", it: "dormire; andare a letto" }, verb: { dictionary: { kana: "ねる", romaji: "neru" }, polite: { kana: "ねます", romaji: "nemasu" }, class: "ichidan" } }),
  defineA1Lexeme({ id: "a1-lexeme-dekakeru", valueIds: ["a1-value-go-out"], kana: "でかける", romaji: "dekakeru", category: "verb", meaning: { en: "to go out", it: "uscire" }, verb: { dictionary: { kana: "でかける", romaji: "dekakeru" }, polite: { kana: "でかけます", romaji: "dekakemasu" }, class: "ichidan" } }),
  defineA1Lexeme({ id: "a1-lexeme-kaeru", valueIds: ["a1-value-return"], kana: "かえる", romaji: "kaeru", category: "verb", meaning: { en: "to return; go home", it: "tornare" }, verb: { dictionary: { kana: "かえる", romaji: "kaeru" }, polite: { kana: "かえります", romaji: "kaerimasu" }, class: "godan" } }),

  defineA1Lexeme({ id: "a1-lexeme-isha", valueIds: ["a1-value-obj-doctor"], kana: "いしゃ", romaji: "isha", category: "person", meaning: { en: "doctor", it: "medico; dottoressa" } }),
  defineA1Lexeme({ id: "a1-lexeme-kaishain", valueIds: ["a1-value-obj-office-worker"], kana: "かいしゃいん", romaji: "kaishain", category: "person", meaning: { en: "company employee", it: "impiegato; impiegata" } }),
  defineA1Lexeme({ id: "a1-lexeme-enjinia", valueIds: ["a1-value-obj-engineer"], kana: "エンジニア", romaji: "enjinia", category: "person", meaning: { en: "engineer", it: "ingegnere; ingegnera" } }),
  defineA1Lexeme({ id: "a1-lexeme-nihonjin", valueIds: ["a1-value-obj-japanese-person"], kana: "にほんじん", romaji: "nihonjin", category: "person", meaning: { en: "Japanese person", it: "persona giapponese" } }),
  defineA1Lexeme({ id: "a1-lexeme-itaria-jin", valueIds: ["a1-value-obj-italian-person"], kana: "イタリアじん", romaji: "itariajin", category: "person", meaning: { en: "Italian person", it: "persona italiana" } }),
  defineA1Lexeme({ id: "a1-lexeme-amerika-jin", valueIds: ["a1-value-obj-american-person"], kana: "アメリカじん", romaji: "amerikajin", category: "person", meaning: { en: "American person", it: "persona americana" } }),
  defineA1Lexeme({ id: "a1-lexeme-nihongo", valueIds: ["a1-value-obj-japanese"], kana: "にほんご", romaji: "nihongo", category: "noun", meaning: { en: "Japanese language", it: "lingua giapponese" } }),
  defineA1Lexeme({ id: "a1-lexeme-eigo", valueIds: ["a1-value-obj-english"], kana: "えいご", romaji: "eigo", category: "noun", meaning: { en: "English language", it: "lingua inglese" } }),
  defineA1Lexeme({ id: "a1-lexeme-itaria-go", valueIds: ["a1-value-obj-italian"], kana: "イタリアご", romaji: "itariago", category: "noun", meaning: { en: "Italian language", it: "lingua italiana" } }),
  defineA1Lexeme({ id: "a1-lexeme-koohii", valueIds: ["a1-value-obj-coffee"], kana: "コーヒー", romaji: "koohii", category: "noun", meaning: { en: "coffee", it: "caffè" } }),
  defineA1Lexeme({ id: "a1-lexeme-mizu", valueIds: ["a1-value-obj-water"], kana: "みず", romaji: "mizu", category: "noun", meaning: { en: "water", it: "acqua" } }),
  defineA1Lexeme({ id: "a1-lexeme-ocha", valueIds: ["a1-value-obj-tea"], kana: "おちゃ", romaji: "ocha", category: "noun", meaning: { en: "tea", it: "tè" } }),
  defineA1Lexeme({ id: "a1-lexeme-sushi", valueIds: ["a1-value-obj-sushi"], kana: "すし", romaji: "sushi", category: "noun", meaning: { en: "sushi", it: "sushi" } }),
  defineA1Lexeme({ id: "a1-lexeme-pan", valueIds: ["a1-value-obj-bread"], kana: "パン", romaji: "pan", category: "noun", meaning: { en: "bread", it: "pane" } }),
  defineA1Lexeme({ id: "a1-lexeme-raamen", valueIds: ["a1-value-obj-ramen"], kana: "ラーメン", romaji: "raamen", category: "noun", meaning: { en: "ramen", it: "ramen" } }),
  defineA1Lexeme({ id: "a1-lexeme-hon", valueIds: ["a1-value-obj-book", "a1-value-ex-book"], kana: "ほん", romaji: "hon", category: "noun", meaning: { en: "book", it: "libro" } }),
  defineA1Lexeme({ id: "a1-lexeme-tegami", valueIds: ["a1-value-obj-letter"], kana: "てがみ", romaji: "tegami", category: "noun", meaning: { en: "letter", it: "lettera" } }),
  defineA1Lexeme({ id: "a1-lexeme-shinbun", valueIds: ["a1-value-obj-newspaper"], kana: "しんぶん", romaji: "shinbun", category: "noun", meaning: { en: "newspaper", it: "giornale" } }),
  defineA1Lexeme({ id: "a1-lexeme-eiga", valueIds: ["a1-value-obj-movie"], kana: "えいが", romaji: "eiga", category: "noun", meaning: { en: "movie", it: "film" } }),
  defineA1Lexeme({ id: "a1-lexeme-shashin", valueIds: ["a1-value-obj-photo"], kana: "しゃしん", romaji: "shashin", category: "noun", meaning: { en: "photo; photograph", it: "foto; fotografia" } }),
  defineA1Lexeme({ id: "a1-lexeme-ongaku", valueIds: ["a1-value-obj-music"], kana: "おんがく", romaji: "ongaku", category: "noun", meaning: { en: "music", it: "musica" } }),
  defineA1Lexeme({ id: "a1-lexeme-terebi", valueIds: ["a1-value-obj-tv"], kana: "テレビ", romaji: "terebi", category: "noun", meaning: { en: "television; TV", it: "televisione; TV" } }),
  defineA1Lexeme({ id: "a1-lexeme-shukudai", valueIds: ["a1-value-obj-homework"], kana: "しゅくだい", romaji: "shukudai", category: "noun", meaning: { en: "homework", it: "compiti" } }),

  defineA1Lexeme({ id: "a1-lexeme-nan", valueIds: ["a1-value-q-nan"], kana: "なん", romaji: "nan", category: "question-word", meaning: { en: "what", it: "che cosa" } }),
  defineA1Lexeme({ id: "a1-lexeme-nani", valueIds: ["a1-value-q-nani"], kana: "なに", romaji: "nani", category: "question-word", meaning: { en: "what", it: "che cosa" } }),
  defineA1Lexeme({ id: "a1-lexeme-dare", valueIds: ["a1-value-q-dare"], kana: "だれ", romaji: "dare", category: "question-word", meaning: { en: "who", it: "chi" } }),
  defineA1Lexeme({ id: "a1-lexeme-doko", valueIds: ["a1-value-q-doko"], kana: "どこ", romaji: "doko", category: "question-word", meaning: { en: "where", it: "dove" } }),
  defineA1Lexeme({ id: "a1-lexeme-itsu", valueIds: ["a1-value-q-itsu"], kana: "いつ", romaji: "itsu", category: "question-word", meaning: { en: "when", it: "quando" } }),
  defineA1Lexeme({ id: "a1-lexeme-ikura", valueIds: ["a1-value-q-ikura"], kana: "いくら", romaji: "ikura", category: "question-word", meaning: { en: "how much", it: "quanto costa" } }),
  defineA1Lexeme({ id: "a1-lexeme-ikutsu", valueIds: ["a1-value-q-ikutsu"], kana: "いくつ", romaji: "ikutsu", category: "question-word", meaning: { en: "how many; how old", it: "quanti; quanti anni" } }),
  defineA1Lexeme({ id: "a1-lexeme-dore", valueIds: ["a1-value-q-dore"], kana: "どれ", romaji: "dore", category: "question-word", meaning: { en: "which one", it: "quale" } }),
  defineA1Lexeme({ id: "a1-lexeme-dono-hon", valueIds: ["a1-value-q-dono-hon"], kana: "どのほん", romaji: "dono hon", category: "expression", meaning: { en: "which book", it: "quale libro" } }),

  defineA1Lexeme({ id: "a1-lexeme-densha", valueIds: ["a1-value-transport-train"], kana: "でんしゃ", romaji: "densha", category: "noun", meaning: { en: "train", it: "treno" } }),
  defineA1Lexeme({ id: "a1-lexeme-basu", valueIds: ["a1-value-transport-bus"], kana: "バス", romaji: "basu", category: "noun", meaning: { en: "bus", it: "autobus" } }),
  defineA1Lexeme({ id: "a1-lexeme-kuruma", valueIds: ["a1-value-transport-car"], kana: "くるま", romaji: "kuruma", category: "noun", meaning: { en: "car", it: "automobile" } }),
  defineA1Lexeme({ id: "a1-lexeme-jitensha", valueIds: ["a1-value-transport-bicycle"], kana: "じてんしゃ", romaji: "jitensha", category: "noun", meaning: { en: "bicycle", it: "bicicletta" } }),
  defineA1Lexeme({ id: "a1-lexeme-chikatetsu", valueIds: ["a1-value-transport-subway"], kana: "ちかてつ", romaji: "chikatetsu", category: "noun", meaning: { en: "subway", it: "metropolitana" } }),
  defineA1Lexeme({ id: "a1-lexeme-takushii", valueIds: ["a1-value-transport-taxi"], kana: "タクシー", romaji: "takushii", category: "noun", meaning: { en: "taxi", it: "taxi" } }),
  defineA1Lexeme({ id: "a1-lexeme-hikouki", valueIds: ["a1-value-transport-airplane"], kana: "ひこうき", romaji: "hikouki", category: "noun", meaning: { en: "airplane", it: "aereo" } }),
  defineA1Lexeme({ id: "a1-lexeme-fune", valueIds: ["a1-value-transport-ship"], kana: "ふね", romaji: "fune", category: "noun", meaning: { en: "ship; boat", it: "nave; barca" } }),
  defineA1Lexeme({ id: "a1-lexeme-toukyou", valueIds: ["a1-value-loc-tokyo"], kana: "とうきょう", romaji: "toukyou", category: "noun", meaning: { en: "Tokyo", it: "Tokyo" } }),
  defineA1Lexeme({ id: "a1-lexeme-oosaka", valueIds: ["a1-value-loc-osaka"], kana: "おおさか", romaji: "oosaka", category: "noun", meaning: { en: "Osaka", it: "Osaka" } }),
  defineA1Lexeme({ id: "a1-lexeme-kyouto", valueIds: ["a1-value-loc-kyoto"], kana: "きょうと", romaji: "kyouto", category: "noun", meaning: { en: "Kyoto", it: "Kyoto" } }),
  defineA1Lexeme({ id: "a1-lexeme-kaisha", valueIds: ["a1-value-loc-company"], kana: "かいしゃ", romaji: "kaisha", category: "noun", meaning: { en: "company; office", it: "azienda; ufficio" } }),
  defineA1Lexeme({ id: "a1-lexeme-gakkou", valueIds: ["a1-value-loc-school"], kana: "がっこう", romaji: "gakkou", category: "noun", meaning: { en: "school", it: "scuola" } }),
  defineA1Lexeme({ id: "a1-lexeme-toshokan", valueIds: ["a1-value-loc-library"], kana: "としょかん", romaji: "toshokan", category: "noun", meaning: { en: "library", it: "biblioteca" } }),
  defineA1Lexeme({ id: "a1-lexeme-mise", valueIds: ["a1-value-loc-shop"], kana: "みせ", romaji: "mise", category: "noun", meaning: { en: "shop; store", it: "negozio" } }),
  defineA1Lexeme({ id: "a1-lexeme-resutoran", valueIds: ["a1-value-loc-restaurant"], kana: "レストラン", romaji: "resutoran", category: "noun", meaning: { en: "restaurant", it: "ristorante" } }),
  defineA1Lexeme({ id: "a1-lexeme-suupaa", valueIds: ["a1-value-loc-supermarket"], kana: "スーパー", romaji: "suupaa", category: "noun", meaning: { en: "supermarket", it: "supermercato" } }),
  defineA1Lexeme({ id: "a1-lexeme-kafe", valueIds: ["a1-value-loc-cafe"], kana: "カフェ", romaji: "kafe", category: "noun", meaning: { en: "café", it: "caffè; bar" } }),
  defineA1Lexeme({ id: "a1-lexeme-kouen", valueIds: ["a1-value-loc-park"], kana: "こうえん", romaji: "kouen", category: "noun", meaning: { en: "park", it: "parco" } }),
  defineA1Lexeme({ id: "a1-lexeme-ie", valueIds: ["a1-value-loc-home"], kana: "いえ", romaji: "ie", category: "noun", meaning: { en: "home; house", it: "casa" } }),
  defineA1Lexeme({ id: "a1-lexeme-kuukou", valueIds: ["a1-value-loc-airport"], kana: "くうこう", romaji: "kuukou", category: "noun", meaning: { en: "airport", it: "aeroporto" } }),
  defineA1Lexeme({ id: "a1-lexeme-ginkou", valueIds: ["a1-value-loc-bank"], kana: "ぎんこう", romaji: "ginkou", category: "noun", meaning: { en: "bank", it: "banca" } }),
  defineA1Lexeme({ id: "a1-lexeme-byouin", valueIds: ["a1-value-loc-hospital"], kana: "びょういん", romaji: "byouin", category: "noun", meaning: { en: "hospital", it: "ospedale" } }),
  defineA1Lexeme({ id: "a1-lexeme-hoteru", valueIds: ["a1-value-loc-hotel"], kana: "ホテル", romaji: "hoteru", category: "noun", meaning: { en: "hotel", it: "hotel; albergo" } }),

  defineA1Lexeme({ id: "a1-lexeme-haha", valueIds: ["a1-value-kin-mother"], kana: "はは", romaji: "haha", category: "person", meaning: { en: "my mother", it: "mia madre" } }),
  defineA1Lexeme({ id: "a1-lexeme-chichi", valueIds: ["a1-value-kin-father"], kana: "ちち", romaji: "chichi", category: "person", meaning: { en: "my father", it: "mio padre" } }),
  defineA1Lexeme({ id: "a1-lexeme-ani", valueIds: ["a1-value-kin-older-brother"], kana: "あに", romaji: "ani", category: "person", meaning: { en: "my older brother", it: "mio fratello maggiore" } }),
  defineA1Lexeme({ id: "a1-lexeme-ane", valueIds: ["a1-value-kin-older-sister"], kana: "あね", romaji: "ane", category: "person", meaning: { en: "my older sister", it: "mia sorella maggiore" } }),
  defineA1Lexeme({ id: "a1-lexeme-otouto", valueIds: ["a1-value-kin-younger-brother"], kana: "おとうと", romaji: "otouto", category: "person", meaning: { en: "my younger brother", it: "mio fratello minore" } }),
  defineA1Lexeme({ id: "a1-lexeme-imouto", valueIds: ["a1-value-kin-younger-sister"], kana: "いもうと", romaji: "imouto", category: "person", meaning: { en: "my younger sister", it: "mia sorella minore" } }),
  defineA1Lexeme({ id: "a1-lexeme-okaasan", valueIds: ["a1-value-kin-mother-hon"], kana: "おかあさん", romaji: "okaasan", category: "person", meaning: { en: "someone else's mother", it: "madre altrui" } }),
  defineA1Lexeme({ id: "a1-lexeme-otousan", valueIds: ["a1-value-kin-father-hon"], kana: "おとうさん", romaji: "otousan", category: "person", meaning: { en: "someone else's father", it: "padre altrui" } }),
  defineA1Lexeme({ id: "a1-lexeme-kazoku", valueIds: ["a1-value-companion-family"], kana: "かぞく", romaji: "kazoku", category: "noun", meaning: { en: "family", it: "famiglia" } }),

  defineA1Lexeme({ id: "a1-lexeme-goji", valueIds: ["a1-value-time-5"], kana: "ごじ", romaji: "goji", category: "time", meaning: { en: "five o'clock", it: "le cinque" } }),
  defineA1Lexeme({ id: "a1-lexeme-rokuji", valueIds: ["a1-value-time-6"], kana: "ろくじ", romaji: "rokuji", category: "time", meaning: { en: "six o'clock", it: "le sei" } }),
  defineA1Lexeme({ id: "a1-lexeme-shichiji", valueIds: ["a1-value-time-7"], kana: "しちじ", romaji: "shichiji", category: "time", meaning: { en: "seven o'clock", it: "le sette" } }),
  defineA1Lexeme({ id: "a1-lexeme-hachiji", valueIds: ["a1-value-time-8"], kana: "はちじ", romaji: "hachiji", category: "time", meaning: { en: "eight o'clock", it: "le otto" } }),
  defineA1Lexeme({ id: "a1-lexeme-kuji", valueIds: ["a1-value-time-9"], kana: "くじ", romaji: "kuji", category: "time", meaning: { en: "nine o'clock", it: "le nove" } }),
  defineA1Lexeme({ id: "a1-lexeme-juuji", valueIds: ["a1-value-time-10"], kana: "じゅうじ", romaji: "juuji", category: "time", meaning: { en: "ten o'clock", it: "le dieci" } }),
  defineA1Lexeme({ id: "a1-lexeme-juuichiji", valueIds: ["a1-value-time-11"], kana: "じゅういちじ", romaji: "juuichiji", category: "time", meaning: { en: "eleven o'clock", it: "le undici" } }),
  defineA1Lexeme({ id: "a1-lexeme-getsuyoubi", valueIds: ["a1-value-day-monday"], kana: "げつようび", romaji: "getsuyoubi", category: "time", meaning: { en: "Monday", it: "lunedì" } }),
  defineA1Lexeme({ id: "a1-lexeme-kayoubi", valueIds: ["a1-value-day-tuesday"], kana: "かようび", romaji: "kayoubi", category: "time", meaning: { en: "Tuesday", it: "martedì" } }),
  defineA1Lexeme({ id: "a1-lexeme-suiyoubi", valueIds: ["a1-value-day-wednesday"], kana: "すいようび", romaji: "suiyoubi", category: "time", meaning: { en: "Wednesday", it: "mercoledì" } }),
  defineA1Lexeme({ id: "a1-lexeme-mokuyoubi", valueIds: ["a1-value-day-thursday"], kana: "もくようび", romaji: "mokuyoubi", category: "time", meaning: { en: "Thursday", it: "giovedì" } }),
  defineA1Lexeme({ id: "a1-lexeme-kinyoubi", valueIds: ["a1-value-day-friday"], kana: "きんようび", romaji: "kinyoubi", category: "time", meaning: { en: "Friday", it: "venerdì" } }),
  defineA1Lexeme({ id: "a1-lexeme-doyoubi", valueIds: ["a1-value-day-saturday"], kana: "どようび", romaji: "doyoubi", category: "time", meaning: { en: "Saturday", it: "sabato" } }),
  defineA1Lexeme({ id: "a1-lexeme-nichiyoubi", valueIds: ["a1-value-day-sunday"], kana: "にちようび", romaji: "nichiyoubi", category: "time", meaning: { en: "Sunday", it: "domenica" } }),
  defineA1Lexeme({ id: "a1-lexeme-asa", valueIds: ["a1-value-seq-morning"], kana: "あさ", romaji: "asa", category: "time", meaning: { en: "morning", it: "mattina" } }),
  defineA1Lexeme({ id: "a1-lexeme-hiru", valueIds: ["a1-value-seq-noon"], kana: "ひる", romaji: "hiru", category: "time", meaning: { en: "noon; daytime", it: "mezzogiorno; giorno" } }),
  defineA1Lexeme({ id: "a1-lexeme-yoru", valueIds: ["a1-value-seq-night"], kana: "よる", romaji: "yoru", category: "time", meaning: { en: "night", it: "notte" } }),
  defineA1Lexeme({ id: "a1-lexeme-ban", valueIds: ["a1-value-seq-evening"], kana: "ばん", romaji: "ban", category: "time", meaning: { en: "evening", it: "sera" } }),
  defineA1Lexeme({ id: "a1-lexeme-mainichi", valueIds: ["a1-value-freq-everyday"], kana: "まいにち", romaji: "mainichi", category: "time", meaning: { en: "every day", it: "ogni giorno" } }),
  defineA1Lexeme({ id: "a1-lexeme-maiasa", valueIds: ["a1-value-freq-every-morning"], kana: "まいあさ", romaji: "maiasa", category: "time", meaning: { en: "every morning", it: "ogni mattina" } }),
  defineA1Lexeme({ id: "a1-lexeme-yoku", valueIds: ["a1-value-freq-often"], kana: "よく", romaji: "yoku", category: "time", meaning: { en: "often", it: "spesso" } }),
  defineA1Lexeme({ id: "a1-lexeme-tokidoki", valueIds: ["a1-value-freq-sometimes"], kana: "ときどき", romaji: "tokidoki", category: "time", meaning: { en: "sometimes", it: "qualche volta" } }),
  defineA1Lexeme({ id: "a1-lexeme-itsumo", valueIds: ["a1-value-freq-always"], kana: "いつも", romaji: "itsumo", category: "time", meaning: { en: "always", it: "sempre" } }),

  defineA1Lexeme({ id: "a1-lexeme-kyou", valueIds: ["a1-value-today"], kana: "きょう", romaji: "kyou", category: "time", meaning: { en: "today", it: "oggi" } }),
  defineA1Lexeme({ id: "a1-lexeme-heya", valueIds: ["a1-value-heya", "a1-value-loc-room"], kana: "へや", romaji: "heya", category: "noun", meaning: { en: "room", it: "stanza" } }),
  defineA1Lexeme({ id: "a1-lexeme-machi", valueIds: ["a1-value-machi", "a1-value-loc-town"], kana: "まち", romaji: "machi", category: "noun", meaning: { en: "town", it: "città; paese" } }),
  defineA1Lexeme({ id: "a1-lexeme-atsui", valueIds: ["a1-value-hot"], kana: "あつい", romaji: "atsui", category: "adjective", meaning: { en: "hot", it: "caldo" } }),
  defineA1Lexeme({ id: "a1-lexeme-samui", valueIds: ["a1-value-cold"], kana: "さむい", romaji: "samui", category: "adjective", meaning: { en: "cold", it: "freddo" } }),
  defineA1Lexeme({ id: "a1-lexeme-ookii", valueIds: ["a1-value-big"], kana: "おおきい", romaji: "ookii", category: "adjective", meaning: { en: "big", it: "grande" } }),
  defineA1Lexeme({ id: "a1-lexeme-chiisai", valueIds: ["a1-value-small"], kana: "ちいさい", romaji: "chiisai", category: "adjective", meaning: { en: "small", it: "piccolo" } }),
  defineA1Lexeme({ id: "a1-lexeme-shizuka", valueIds: ["a1-value-quiet"], kana: "しずか", romaji: "shizuka", category: "adjective", meaning: { en: "quiet", it: "tranquillo; silenzioso" } }),
  defineA1Lexeme({ id: "a1-lexeme-suki", valueIds: ["a1-value-like"], kana: "すき", romaji: "suki", category: "adjective", meaning: { en: "liked; fond of", it: "piacere; essere appassionato di" } }),
  defineA1Lexeme({ id: "a1-lexeme-kirai", valueIds: ["a1-value-dislike"], kana: "きらい", romaji: "kirai", category: "adjective", meaning: { en: "disliked; not fond of", it: "non piacere; non amare" } }),
  defineA1Lexeme({ id: "a1-lexeme-hyaku-en", valueIds: ["a1-value-price-100"], kana: "ひゃくえん", romaji: "hyaku en", category: "expression", meaning: { en: "one hundred yen", it: "cento yen" } }),
  defineA1Lexeme({ id: "a1-lexeme-sanbyaku-en", valueIds: ["a1-value-price-300"], kana: "さんびゃくえん", romaji: "sanbyaku en", category: "expression", meaning: { en: "three hundred yen", it: "trecento yen" } }),
  defineA1Lexeme({ id: "a1-lexeme-gohyaku-en", valueIds: ["a1-value-price-500"], kana: "ごひゃくえん", romaji: "gohyaku en", category: "expression", meaning: { en: "five hundred yen", it: "cinquecento yen" } }),
  defineA1Lexeme({ id: "a1-lexeme-sen-en", valueIds: ["a1-value-price-1000"], kana: "せんえん", romaji: "sen en", category: "expression", meaning: { en: "one thousand yen", it: "mille yen" } }),
  defineA1Lexeme({ id: "a1-lexeme-takai", valueIds: ["a1-value-expensive"], kana: "たかい", romaji: "takai", category: "adjective", meaning: { en: "expensive; high", it: "costoso; alto" } }),
  defineA1Lexeme({ id: "a1-lexeme-yasui", valueIds: ["a1-value-cheap"], kana: "やすい", romaji: "yasui", category: "adjective", meaning: { en: "cheap; inexpensive", it: "economico" } }),
  defineA1Lexeme({ id: "a1-lexeme-ringo", valueIds: ["a1-value-obj-apple"], kana: "りんご", romaji: "ringo", category: "noun", meaning: { en: "apple", it: "mela" } }),
  defineA1Lexeme({ id: "a1-lexeme-kippu", valueIds: ["a1-value-obj-ticket"], kana: "きっぷ", romaji: "kippu", category: "noun", meaning: { en: "ticket", it: "biglietto" } }),
  defineA1Lexeme({ id: "a1-lexeme-kaban", valueIds: ["a1-value-obj-bag"], kana: "かばん", romaji: "kaban", category: "noun", meaning: { en: "bag", it: "borsa" } }),
  defineA1Lexeme({ id: "a1-lexeme-okane", valueIds: ["a1-value-obj-money", "a1-value-ex-money"], kana: "おかね", romaji: "okane", category: "noun", meaning: { en: "money", it: "denaro" } }),
  defineA1Lexeme({ id: "a1-lexeme-hitotsu", valueIds: ["a1-value-qty-1"], kana: "ひとつ", romaji: "hitotsu", category: "expression", meaning: { en: "one item", it: "un pezzo" } }),
  defineA1Lexeme({ id: "a1-lexeme-futatsu", valueIds: ["a1-value-qty-2"], kana: "ふたつ", romaji: "futatsu", category: "expression", meaning: { en: "two items", it: "due pezzi" } }),
  defineA1Lexeme({ id: "a1-lexeme-mittsu", valueIds: ["a1-value-qty-3"], kana: "みっつ", romaji: "mittsu", category: "expression", meaning: { en: "three items", it: "tre pezzi" } }),
  defineA1Lexeme({ id: "a1-lexeme-yottsu", valueIds: ["a1-value-qty-4"], kana: "よっつ", romaji: "yottsu", category: "expression", meaning: { en: "four items", it: "quattro pezzi" } }),
  defineA1Lexeme({ id: "a1-lexeme-itsutsu", valueIds: ["a1-value-qty-5"], kana: "いつつ", romaji: "itsutsu", category: "expression", meaning: { en: "five items", it: "cinque pezzi" } }),
  defineA1Lexeme({ id: "a1-lexeme-kudasai", valueIds: ["a1-value-request"], kana: "ください", romaji: "kudasai", category: "expression", meaning: { en: "please give me", it: "per favore; mi dia" } }),

  defineA1Lexeme({ id: "a1-lexeme-pen", valueIds: ["a1-value-ex-pen"], kana: "ペン", romaji: "pen", category: "noun", meaning: { en: "pen", it: "penna" } }),
  defineA1Lexeme({ id: "a1-lexeme-kagi", valueIds: ["a1-value-ex-key"], kana: "かぎ", romaji: "kagi", category: "noun", meaning: { en: "key", it: "chiave" } }),
  defineA1Lexeme({ id: "a1-lexeme-neko", valueIds: ["a1-value-ex-cat"], kana: "ねこ", romaji: "neko", category: "noun", meaning: { en: "cat", it: "gatto" } }),
  defineA1Lexeme({ id: "a1-lexeme-inu", valueIds: ["a1-value-ex-dog"], kana: "いぬ", romaji: "inu", category: "noun", meaning: { en: "dog", it: "cane" } }),
  defineA1Lexeme({ id: "a1-lexeme-kodomo", valueIds: ["a1-value-ex-child", "a1-value-companion-child"], kana: "こども", romaji: "kodomo", category: "person", meaning: { en: "child", it: "bambino; bambina" } }),
  defineA1Lexeme({ id: "a1-lexeme-hito", valueIds: ["a1-value-ex-person", "a1-value-recipient-person"], kana: "ひと", romaji: "hito", category: "person", meaning: { en: "person", it: "persona" } }),
  defineA1Lexeme({ id: "a1-lexeme-tsukue-no-ue", valueIds: ["a1-value-loc-on-desk"], kana: "つくえのうえ", romaji: "tsukue no ue", category: "expression", meaning: { en: "on the desk", it: "sulla scrivania" } }),
  defineA1Lexeme({ id: "a1-lexeme-kaban-no-naka", valueIds: ["a1-value-loc-in-bag"], kana: "かばんのなか", romaji: "kaban no naka", category: "expression", meaning: { en: "in the bag", it: "nella borsa" } }),
  defineA1Lexeme({ id: "a1-lexeme-isu-no-shita", valueIds: ["a1-value-loc-under-chair"], kana: "いすのした", romaji: "isu no shita", category: "expression", meaning: { en: "under the chair", it: "sotto la sedia" } }),
  defineA1Lexeme({ id: "a1-lexeme-eki-no-chikaku", valueIds: ["a1-value-loc-near-station"], kana: "えきのちかく", romaji: "eki no chikaku", category: "expression", meaning: { en: "near the station", it: "vicino alla stazione" } }),
  defineA1Lexeme({ id: "a1-lexeme-hoshii", valueIds: ["a1-value-want"], kana: "ほしい", romaji: "hoshii", category: "adjective", meaning: { en: "wanted; desired", it: "volere; desiderare" } }),
  defineA1Lexeme({ id: "a1-lexeme-aru", valueIds: ["a1-value-exist-inanimate"], kana: "ある", romaji: "aru", category: "verb", meaning: { en: "to exist; there is (inanimate)", it: "esserci; avere (inanimato)" }, verb: { dictionary: { kana: "ある", romaji: "aru" }, polite: { kana: "あります", romaji: "arimasu" }, class: "godan" } }),
  defineA1Lexeme({ id: "a1-lexeme-iru", valueIds: ["a1-value-exist-animate"], kana: "いる", romaji: "iru", category: "verb", meaning: { en: "to exist; there is (animate)", it: "esserci (animato)" }, verb: { dictionary: { kana: "いる", romaji: "iru" }, polite: { kana: "います", romaji: "imasu" }, class: "ichidan" } }),
]);

type LexemeIndex = Readonly<Record<string, A1Lexeme | undefined>>;

function buildLexemeIndexes(lexemes: readonly A1Lexeme[]): Readonly<{
  byId: LexemeIndex;
  byValueId: LexemeIndex;
}> {
  const knownValueIds = new Set(a1SemanticValues.map((value) => value.id));
  const byId: Record<string, A1Lexeme | undefined> = {};
  const byValueId: Record<string, A1Lexeme | undefined> = {};

  for (const lexeme of lexemes) {
    if (byId[lexeme.id] !== undefined) {
      throw new Error(`Duplicate A1 lexeme id "${lexeme.id}".`);
    }
    byId[lexeme.id] = lexeme;

    for (const valueId of lexeme.valueIds) {
      if (!knownValueIds.has(valueId)) {
        throw new Error(`A1 lexeme "${lexeme.id}" references missing semantic value "${valueId}".`);
      }
      if (byValueId[valueId] !== undefined) {
        throw new Error(`Semantic value "${valueId}" has more than one A1 lexeme owner.`);
      }
      byValueId[valueId] = lexeme;
    }
  }

  return deepFreeze({ byId, byValueId });
}

const a1LexemeIndexes = buildLexemeIndexes(a1Lexemes);

export const a1LexemeById: LexemeIndex = a1LexemeIndexes.byId;
export const a1LexemeByValueId: LexemeIndex = a1LexemeIndexes.byValueId;

import type { LexemeCatalogEntry, LexemeId } from "./types";

/**
 * The shared A0→A1 lexicon: the Japanese source of truth for every learner
 * facing word (design spec §6.1-§6.4, §7 and §9.1). This catalog owns Japanese
 * kana forms, hiragana readings, lexical category, and script metadata only. It
 * never owns IT/EN sentence copy; localized prose lives in the copy catalogs.
 *
 * Editorial rules encoded here (proven by `lexicon.test.ts`):
 *   - exactly 270 unique learner-facing lexeme IDs (spec editorial target);
 *   - exactly 42 `verb` lexemes covering the required semantic senses (§6.3),
 *     where shared-orthography senses (listen/ask under きく, exist-animate/need
 *     under いる) are separately traceable IDs sharing the same kana;
 *   - hiragana is always the answer source — kanji never appears (§7);
 *   - authentic katakana loanwords carry adjacent hiragana reading assistance
 *     for first exposure (§7);
 *   - words are grouped by the module that first introduces them so the module
 *     budget is machine-derivable rather than hand-counted (§6.2);
 *   - particles, endings, and persona names are not lexemes (§6.1).
 *
 * IDs are stable semantic identifiers, never inflected forms or translations.
 */

type LexicalCategory = LexemeCatalogEntry["category"];

/** Hiragana entry: the hiragana form is also its own reading. */
function hira(
  id: string,
  japanese: string,
  category: LexicalCategory,
): LexemeCatalogEntry {
  return Object.freeze({
    id,
    japanese,
    reading: japanese,
    category,
    script: "hiragana",
  });
}

/**
 * Katakana loanword entry carrying explicit hiragana reading assistance for
 * first exposure (spec §7). The authentic katakana lives in `japanese`; the
 * hiragana `reading` is the ruby/adjacent aid a beginner reads it with.
 */
function kata(
  id: string,
  japanese: string,
  reading: string,
  category: LexicalCategory,
): LexemeCatalogEntry {
  return Object.freeze({
    id,
    japanese,
    reading,
    category,
    script: "katakana",
  });
}

// — Module 1: Sounds, hiragana, and katakana bridge (20) —
// Greetings plus assisted high-frequency loanwords that recur from Module 2 on.
const MODULE_1: readonly LexemeCatalogEntry[] = [
  hira("hello", "こんにちは", "expression"),
  hira("good-morning", "おはよう", "expression"),
  hira("good-evening", "こんばんは", "expression"),
  hira("goodbye", "さようなら", "expression"),
  hira("thank-you", "ありがとう", "expression"),
  hira("excuse-me", "すみません", "expression"),
  hira("yes", "はい", "expression"),
  hira("no", "いいえ", "expression"),
  hira("nice-to-meet-you", "はじめまして", "expression"),
  hira("best-regards", "よろしく", "expression"),
  kata("coffee", "コーヒー", "こーひー", "noun"),
  kata("juice", "ジュース", "じゅーす", "noun"),
  kata("milk", "ミルク", "みるく", "noun"),
  kata("bread", "パン", "ぱん", "noun"),
  kata("television", "テレビ", "てれび", "noun"),
  kata("radio", "ラジオ", "らじお", "noun"),
  kata("camera", "カメラ", "かめら", "noun"),
  kata("bus", "バス", "ばす", "noun"),
  kata("taxi", "タクシー", "たくしー", "noun"),
  kata("restaurant", "レストラン", "れすとらん", "noun"),
];

// — Module 2: Introducing oneself (25 = 21 + 4 verbs) —
const MODULE_2: readonly LexemeCatalogEntry[] = [
  hira("name", "なまえ", "noun"),
  hira("i", "わたし", "other"),
  hira("you", "あなた", "other"),
  hira("student", "がくせい", "noun"),
  hira("teacher", "せんせい", "noun"),
  hira("doctor", "いしゃ", "noun"),
  hira("office-worker", "かいしゃいん", "noun"),
  hira("job", "しごと", "noun"),
  hira("company", "かいしゃ", "noun"),
  hira("country", "くに", "noun"),
  hira("japan", "にほん", "noun"),
  kata("italy", "イタリア", "いたりあ", "noun"),
  kata("america", "アメリカ", "あめりか", "noun"),
  hira("japanese-language", "にほんご", "noun"),
  hira("english-language", "えいご", "noun"),
  hira("word", "ことば", "noun"),
  hira("friend", "ともだち", "noun"),
  hira("age", "とし", "noun"),
  hira("years-old", "さい", "other"),
  hira("origin", "しゅっしん", "noun"),
  hira("phone-number", "でんわばんごう", "noun"),
  // verbs (4)
  hira("do", "する", "verb"),
  hira("study", "べんきょうする", "verb"),
  hira("live", "すむ", "verb"),
  hira("understand", "わかる", "verb"),
];

// — Module 3: Essential questions (20 = 18 + 2 verbs) —
const MODULE_3: readonly LexemeCatalogEntry[] = [
  hira("this", "これ", "other"),
  hira("that", "それ", "other"),
  hira("that-yonder", "あれ", "other"),
  hira("which", "どれ", "other"),
  hira("this-n", "この", "other"),
  hira("that-n", "その", "other"),
  hira("that-yonder-n", "あの", "other"),
  hira("here", "ここ", "other"),
  hira("there", "そこ", "other"),
  hira("over-there", "あそこ", "other"),
  hira("where", "どこ", "other"),
  hira("what", "なに", "other"),
  hira("who", "だれ", "other"),
  hira("when", "いつ", "other"),
  hira("how", "どう", "other"),
  hira("how-much", "いくら", "other"),
  hira("how-many", "いくつ", "other"),
  hira("why", "どうして", "other"),
  // verbs (2)
  hira("go", "いく", "verb"),
  hira("come", "くる", "verb"),
];

// — Module 4: Actions and objects (25 = 17 + 8 verbs) —
const MODULE_4: readonly LexemeCatalogEntry[] = [
  hira("water", "みず", "noun"),
  hira("rice-meal", "ごはん", "noun"),
  hira("tea", "おちゃ", "noun"),
  hira("book", "ほん", "noun"),
  hira("newspaper", "しんぶん", "noun"),
  hira("letter", "てがみ", "noun"),
  kata("pen", "ペン", "ぺん", "noun"),
  hira("pencil", "えんぴつ", "noun"),
  kata("notebook", "ノート", "のーと", "noun"),
  hira("bag", "かばん", "noun"),
  hira("photo", "しゃしん", "noun"),
  hira("music", "おんがく", "noun"),
  hira("movie", "えいが", "noun"),
  hira("food", "たべもの", "noun"),
  hira("beverage", "のみもの", "noun"),
  hira("thing-object", "もの", "noun"),
  kata("email", "メール", "めーる", "noun"),
  // verbs (8)
  hira("eat", "たべる", "verb"),
  hira("drink", "のむ", "verb"),
  hira("watch", "みる", "verb"),
  hira("read", "よむ", "verb"),
  hira("write", "かく", "verb"),
  hira("buy", "かう", "verb"),
  hira("use", "つかう", "verb"),
  hira("take", "とる", "verb"),
];

// — Module 5: Routines, clock time, and frequency (25 = 19 + 6 verbs) —
const MODULE_5: readonly LexemeCatalogEntry[] = [
  hira("morning", "あさ", "noun"),
  hira("daytime", "ひる", "noun"),
  hira("night", "よる", "noun"),
  hira("today", "きょう", "noun"),
  hira("tomorrow", "あした", "noun"),
  hira("yesterday", "きのう", "noun"),
  hira("every-day", "まいにち", "other"),
  hira("always", "いつも", "other"),
  hira("often", "よく", "other"),
  hira("sometimes", "ときどき", "other"),
  hira("duration", "じかん", "noun"),
  hira("clock", "とけい", "noun"),
  hira("weekend", "しゅうまつ", "noun"),
  hira("morning-am", "ごぜん", "noun"),
  hira("afternoon-pm", "ごご", "noun"),
  hira("half-past", "はん", "other"),
  hira("minute", "ふん", "other"),
  hira("monday", "げつようび", "noun"),
  hira("sunday", "にちようび", "noun"),
  // verbs (6)
  hira("wake", "おきる", "verb"),
  hira("sleep", "ねる", "verb"),
  hira("work", "はたらく", "verb"),
  hira("speak", "はなす", "verb"),
  hira("listen", "きく", "verb"),
  hira("call", "かける", "verb"),
];

// — Module 6: Past and negative (20 = 17 + 3 verbs) —
const MODULE_6: readonly LexemeCatalogEntry[] = [
  hira("last-week", "せんしゅう", "noun"),
  hira("next-week", "らいしゅう", "noun"),
  hira("last-month", "せんげつ", "noun"),
  hira("next-month", "らいげつ", "noun"),
  hira("last-year", "きょねん", "noun"),
  hira("next-year", "らいねん", "noun"),
  hira("this-week", "こんしゅう", "noun"),
  hira("this-month", "こんげつ", "noun"),
  hira("this-year", "ことし", "noun"),
  hira("this-morning", "けさ", "noun"),
  hira("tonight", "こんばん", "noun"),
  kata("party", "パーティー", "ぱーてぃー", "noun"),
  kata("test", "テスト", "てすと", "noun"),
  hira("homework", "しゅくだい", "noun"),
  hira("meeting", "かいぎ", "noun"),
  hira("day-off", "やすみ", "noun"),
  hira("birthday", "たんじょうび", "noun"),
  // verbs (3)
  hira("ask", "きく", "verb"),
  hira("wait", "まつ", "verb"),
  hira("meet", "あう", "verb"),
];

// — Module 7: Places, movement, and transport (25 = 18 + 7 verbs) —
const MODULE_7: readonly LexemeCatalogEntry[] = [
  hira("station", "えき", "noun"),
  hira("airport", "くうこう", "noun"),
  hira("school", "がっこう", "noun"),
  hira("hospital", "びょういん", "noun"),
  hira("shop", "みせ", "noun"),
  hira("bank", "ぎんこう", "noun"),
  hira("post-office", "ゆうびんきょく", "noun"),
  hira("library", "としょかん", "noun"),
  hira("park", "こうえん", "noun"),
  hira("house", "いえ", "noun"),
  hira("room", "へや", "noun"),
  hira("town", "まち", "noun"),
  hira("train", "でんしゃ", "noun"),
  hira("car", "くるま", "noun"),
  hira("bicycle", "じてんしゃ", "noun"),
  hira("airplane", "ひこうき", "noun"),
  hira("subway", "ちかてつ", "noun"),
  hira("road", "みち", "noun"),
  // verbs (7)
  hira("return", "かえる", "verb"),
  hira("walk", "あるく", "verb"),
  hira("enter", "はいる", "verb"),
  hira("leave", "でる", "verb"),
  hira("board", "のる", "verb"),
  hira("alight", "おりる", "verb"),
  hira("carry", "もつ", "verb"),
];

// — Module 8: People, family, and relationships (25 = 22 + 3 verbs) —
const MODULE_8: readonly LexemeCatalogEntry[] = [
  hira("family", "かぞく", "noun"),
  hira("father", "ちち", "noun"),
  hira("mother", "はは", "noun"),
  hira("older-brother", "あに", "noun"),
  hira("older-sister", "あね", "noun"),
  hira("younger-brother", "おとうと", "noun"),
  hira("younger-sister", "いもうと", "noun"),
  hira("parents", "りょうしん", "noun"),
  hira("child", "こども", "noun"),
  hira("son", "むすこ", "noun"),
  hira("daughter", "むすめ", "noun"),
  hira("husband", "おっと", "noun"),
  hira("wife", "つま", "noun"),
  hira("grandfather", "そふ", "noun"),
  hira("grandmother", "そぼ", "noun"),
  hira("man", "おとこ", "noun"),
  hira("woman", "おんな", "noun"),
  hira("boy", "おとこのこ", "noun"),
  hira("girl", "おんなのこ", "noun"),
  hira("he", "かれ", "other"),
  hira("she", "かのじょ", "other"),
  hira("person", "ひと", "noun"),
  // verbs (3)
  hira("give", "あげる", "verb"),
  hira("receive", "もらう", "verb"),
  hira("teach-tell", "おしえる", "verb"),
];

// — Module 9: Descriptions, preferences, and weather (25 = 22 + 3 verbs) —
const MODULE_9: readonly LexemeCatalogEntry[] = [
  hira("big", "おおきい", "adjective"),
  hira("small", "ちいさい", "adjective"),
  hira("new", "あたらしい", "adjective"),
  hira("old", "ふるい", "adjective"),
  hira("hot", "あつい", "adjective"),
  hira("cold", "さむい", "adjective"),
  hira("expensive", "たかい", "adjective"),
  hira("cheap", "やすい", "adjective"),
  hira("delicious", "おいしい", "adjective"),
  hira("fun", "たのしい", "adjective"),
  hira("interesting", "おもしろい", "adjective"),
  hira("difficult", "むずかしい", "adjective"),
  hira("easy", "かんたん", "adjective"),
  hira("pretty", "きれい", "adjective"),
  hira("busy", "いそがしい", "adjective"),
  hira("good", "いい", "adjective"),
  hira("like", "すき", "adjective"),
  hira("dislike", "きらい", "adjective"),
  hira("good-at", "じょうず", "adjective"),
  hira("weather", "てんき", "noun"),
  hira("rain", "あめ", "noun"),
  hira("cloudy", "くもり", "noun"),
  // verbs (3)
  hira("stand", "たつ", "verb"),
  hira("sit", "すわる", "verb"),
  hira("learn", "ならう", "verb"),
];

// — Module 10: Shopping, quantities, and requests (30 = 27 + 3 verbs) —
const MODULE_10: readonly LexemeCatalogEntry[] = [
  hira("money", "おかね", "noun"),
  hira("yen", "えん", "noun"),
  hira("price", "ねだん", "noun"),
  hira("change-money", "おつり", "noun"),
  hira("wallet", "さいふ", "noun"),
  hira("clothes", "ふく", "noun"),
  hira("shoes", "くつ", "noun"),
  kata("shirt", "シャツ", "しゃつ", "noun"),
  hira("hat", "ぼうし", "noun"),
  hira("fruit", "くだもの", "noun"),
  hira("vegetable", "やさい", "noun"),
  hira("fish", "さかな", "noun"),
  hira("meat", "にく", "noun"),
  hira("egg", "たまご", "noun"),
  hira("apple", "りんご", "noun"),
  kata("supermarket", "スーパー", "すーぱー", "noun"),
  kata("convenience-store", "コンビニ", "こんびに", "noun"),
  hira("one-thing", "ひとつ", "other"),
  hira("two-things", "ふたつ", "other"),
  hira("three-things", "みっつ", "other"),
  hira("many", "たくさん", "other"),
  hira("a-little", "すこし", "other"),
  hira("half-portion", "はんぶん", "other"),
  hira("hundred", "ひゃく", "other"),
  hira("thousand", "せん", "other"),
  hira("all", "ぜんぶ", "other"),
  kata("size", "サイズ", "さいず", "noun"),
  // verbs (3)
  hira("borrow", "かりる", "verb"),
  hira("open", "あける", "verb"),
  hira("close", "しめる", "verb"),
];

// — Module 11: Existence, position, and needs (30 = 27 + 3 verbs) —
const MODULE_11: readonly LexemeCatalogEntry[] = [
  hira("on-top", "うえ", "other"),
  hira("under", "した", "other"),
  hira("front", "まえ", "other"),
  hira("behind", "うしろ", "other"),
  hira("inside", "なか", "other"),
  hira("outside", "そと", "other"),
  hira("right-side", "みぎ", "other"),
  hira("left-side", "ひだり", "other"),
  hira("next-to", "となり", "noun"),
  hira("near", "ちかく", "noun"),
  hira("between", "あいだ", "noun"),
  hira("beside", "よこ", "noun"),
  hira("medicine", "くすり", "noun"),
  hira("key", "かぎ", "noun"),
  hira("glasses", "めがね", "noun"),
  hira("umbrella", "かさ", "noun"),
  hira("ticket", "きっぷ", "noun"),
  kata("passport", "パスポート", "ぱすぽーと", "noun"),
  hira("telephone", "でんわ", "noun"),
  kata("computer", "パソコン", "ぱそこん", "noun"),
  kata("toilet", "トイレ", "といれ", "noun"),
  kata("hotel", "ホテル", "ほてる", "noun"),
  hira("map", "ちず", "noun"),
  hira("chair", "いす", "noun"),
  hira("desk", "つくえ", "noun"),
  kata("door", "ドア", "どあ", "noun"),
  hira("window", "まど", "noun"),
  // verbs (3)
  hira("exist-inanimate", "ある", "verb"),
  hira("exist-animate", "いる", "verb"),
  hira("need", "いる", "verb"),
];

// — Module 12: Practical synthesis (0) — introduces no new vocabulary (§6.2).
const MODULE_12: readonly LexemeCatalogEntry[] = [];

/**
 * Lexemes grouped by the module that first introduces them (index 0 = Module 1
 * … index 11 = Module 12). The module introduction budget is derived from these
 * group sizes rather than hand-entered, so the coverage matrix stays honest.
 */
export const lexemesByIntroModule: readonly (readonly LexemeCatalogEntry[])[] =
  Object.freeze([
    MODULE_1,
    MODULE_2,
    MODULE_3,
    MODULE_4,
    MODULE_5,
    MODULE_6,
    MODULE_7,
    MODULE_8,
    MODULE_9,
    MODULE_10,
    MODULE_11,
    MODULE_12,
  ]);

/** The full, immutable, order-stable lexicon (design spec §6.1). */
export const lexicon: readonly LexemeCatalogEntry[] = Object.freeze(
  lexemesByIntroModule.flat(),
);

/** Stable index for reference resolution and reuse checks. */
export const lexiconById: ReadonlyMap<LexemeId, LexemeCatalogEntry> = new Map(
  lexicon.map((entry) => [entry.id, entry]),
);

/** The 42 verb lexemes, in introduction order (design spec §6.3). */
export const verbLexemes: readonly LexemeCatalogEntry[] = Object.freeze(
  lexicon.filter((entry) => entry.category === "verb"),
);

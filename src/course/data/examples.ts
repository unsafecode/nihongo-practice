import type { StaticExample } from "./types";

function segmentedExample(
  id: string,
  segments: NonNullable<StaticExample["segments"]>,
): StaticExample {
  const withIds = segments.map((segment, index) => ({
    ...segment,
    id: segment.id ?? String(index),
  }));
  return {
    id,
    jp: withIds.map((segment) => segment.jp).join(""),
    romaji: withIds.map((segment) => segment.romaji).join(""),
    segments: withIds,
  };
}

const list: StaticExample[] = [
  { id: "vowels", jp: "あ・い・う・え・お", romaji: "a · i · u · e · o" },
  { id: "k-row", jp: "か・き・く・け・こ", romaji: "ka · ki · ku · ke · ko" },
  { id: "small-tsu", jp: "がっこう", romaji: "gakkō" },
  { id: "long-vowel", jp: "きょう", romaji: "kyō" },
  segmentedExample("sentence-order", [
    { jp: "きょう ", romaji: "kyō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("topic-copula", [
    { jp: "わたし", romaji: "watashi ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "りっち", romaji: "Ricchi ", kind: "word" },
    { jp: "です", romaji: "desu", kind: "ending" },
  ]),
  segmentedExample("omitted-subject", [
    { jp: "りっち", romaji: "Ricchi ", kind: "word" },
    { jp: "です", romaji: "desu", kind: "ending" },
  ]),
  // Module 2 (topic/copula) minimal pair. `these` segments carry NO trailing
  // jp space so the changed sentence renders continuously as これはみずです
  // (design spec §8.3, Task B): the romaji keeps its spaces for readability.
  segmentedExample("it-is-water", [
    { jp: "みず", romaji: "mizu ", kind: "word" },
    { jp: "です", romaji: "desu", kind: "ending" },
  ]),
  segmentedExample("this-is-water", [
    { jp: "これ", romaji: "kore ", kind: "word" },
    { jp: "は", romaji: "wa ", kind: "particle" },
    { jp: "みず", romaji: "mizu ", kind: "word" },
    { jp: "です", romaji: "desu", kind: "ending" },
  ]),
  segmentedExample("this-water", [
    { jp: "これ", romaji: "kore ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "みず", romaji: "mizu ", kind: "word" },
    { jp: "です", romaji: "desu", kind: "ending" },
  ]),
  segmentedExample("eat-ramen", [
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("drink-water", [
    { jp: "みず", romaji: "mizu ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "のみ", romaji: "nomi", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("eat-sushi", [
    { jp: "すし", romaji: "sushi ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("speak-english", [
    { jp: "えいご", romaji: "eigo ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "はなし", romaji: "hanashi", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("today-eat", [
    { jp: "きょう ", romaji: "kyō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("tomorrow-eat", [
    { jp: "あした ", romaji: "ashita ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("yesterday-ate", [
    { jp: "きのう ", romaji: "kinō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ました", romaji: "mashita", kind: "ending" },
  ]),
  segmentedExample("today-not-eat", [
    { jp: "きょう ", romaji: "kyō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ません", romaji: "masen", kind: "ending" },
  ]),
  segmentedExample("yesterday-not-eat", [
    { jp: "きのう ", romaji: "kinō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ませんでした", romaji: "masen deshita", kind: "ending" },
  ]),
  segmentedExample("restaurant-eat", [
    { jp: "レストラン", reading: "れすとらん", romaji: "resutoran ", kind: "word" },
    { jp: "で ", romaji: "de ", kind: "particle" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("home-drink", [
    { jp: "いえ", romaji: "ie ", kind: "word" },
    { jp: "で ", romaji: "de ", kind: "particle" },
    { jp: "おちゃ", romaji: "ocha ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "のみ", romaji: "nomi", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("go-station", [
    { jp: "えき", romaji: "eki ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "いき", romaji: "iki", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("go-by-train", [
    { jp: "でんしゃ", romaji: "densha ", kind: "word" },
    { jp: "で ", romaji: "de ", kind: "particle" },
    { jp: "いき", romaji: "iki", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("board-train", [
    { jp: "でんしゃ", romaji: "densha ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "のり", romaji: "nori", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("meet-friend", [
    { jp: "ともだち", romaji: "tomodachi ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "あい", romaji: "ai", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("wait-friend", [
    { jp: "ともだち", romaji: "tomodachi ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "まち", romaji: "machi", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("want-sushi", [
    { jp: "すし", romaji: "sushi ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "たいです", romaji: "tai desu", kind: "ending" },
  ]),
  segmentedExample("lets-go", [
    { jp: "えき", romaji: "eki ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "いき", romaji: "iki", kind: "word" },
    { jp: "ましょう", romaji: "mashō", kind: "ending" },
  ]),
  segmentedExample("where-station", [
    { jp: "えき", romaji: "eki ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "どこ", romaji: "doko ", kind: "word" },
    { jp: "です", romaji: "desu ", kind: "ending" },
    { jp: "か", romaji: "ka", kind: "particle" },
  ]),
  segmentedExample("water-please", [
    { jp: "みず", romaji: "mizu ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "ください", romaji: "kudasai", kind: "ending" },
  ]),
  segmentedExample("where-hotel", [
    { jp: "ほてる", romaji: "hoteru ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "どこ", romaji: "doko ", kind: "word" },
    { jp: "です", romaji: "desu ", kind: "ending" },
    { jp: "か", romaji: "ka", kind: "particle" },
  ]),
  segmentedExample("menu-please", [
    { jp: "めにゅー", romaji: "menyū ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "ください", romaji: "kudasai", kind: "ending" },
  ]),
  segmentedExample("where-shop", [
    { jp: "みせ", romaji: "mise ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "どこ", romaji: "doko ", kind: "word" },
    { jp: "です", romaji: "desu ", kind: "ending" },
    { jp: "か", romaji: "ka", kind: "particle" },
  ]),
  segmentedExample("restroom-exists", [
    { jp: "トイレ", reading: "といれ", romaji: "toire ", kind: "word" },
    { jp: "が ", romaji: "ga ", kind: "particle" },
    { jp: "あり", romaji: "ari", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("teacher-exists", [
    { jp: "せんせい", romaji: "sensei ", kind: "word" },
    { jp: "が ", romaji: "ga ", kind: "particle" },
    { jp: "い", romaji: "i", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("particle-wa", [
    { jp: "こんにち", romaji: "konnichi", kind: "word" },
    { jp: "は", romaji: "wa", kind: "particle" },
  ]),
  segmentedExample("particle-e", [
    { jp: "えき", romaji: "eki ", kind: "word" },
    { jp: "へ ", romaji: "e ", kind: "particle" },
    { jp: "いき", romaji: "iki", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("return-godan", [
    { jp: "いえ", romaji: "ie ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "かえり", romaji: "kaeri", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("tomorrow-return", [
    { jp: "あした ", romaji: "ashita ", kind: "word" },
    { jp: "いえ", romaji: "ie ", kind: "word" },
    { jp: "に ", romaji: "ni ", kind: "particle" },
    { jp: "かえり", romaji: "kaeri", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  // --- Task 6: prerequisite-led situational spiral endpoints (design spec
  // §§2.6-2.7, 6.2-6.6, 8.3). Loanwords make their first appearance in the
  // standard katakana spelling with a hiragana `reading` for reading support;
  // these authored sentences carry NO trailing jp space so they render
  // continuously, while the romaji keeps its spaces for readability. ---
  segmentedExample("water", [{ jp: "みず", romaji: "mizu", kind: "word" }]),
  segmentedExample("order-ramen-eat", [
    { jp: "ラーメン", reading: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("order-ramen-please", [
    { jp: "ラーメン", reading: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を", romaji: "o ", kind: "particle" },
    { jp: "ください", romaji: "kudasai", kind: "ending" },
  ]),
  segmentedExample("go-bare", [
    { jp: "いき", romaji: "iki", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("meet-teacher", [
    { jp: "せんせい", romaji: "sensei ", kind: "word" },
    { jp: "に", romaji: "ni ", kind: "particle" },
    { jp: "あい", romaji: "ai", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("meet-with-friend", [
    { jp: "ともだち", romaji: "tomodachi ", kind: "word" },
    { jp: "と", romaji: "to ", kind: "particle" },
    { jp: "せんせい", romaji: "sensei ", kind: "word" },
    { jp: "に", romaji: "ni ", kind: "particle" },
    { jp: "あい", romaji: "ai", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("travel-day", [
    { jp: "あした", romaji: "ashita ", kind: "word" },
    { jp: "れすとらん", romaji: "resutoran ", kind: "word" },
    { jp: "で", romaji: "de ", kind: "particle" },
    { jp: "ともだち", romaji: "tomodachi ", kind: "word" },
    { jp: "と", romaji: "to ", kind: "particle" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  // --- Task 5: minimal-pair / before-state endpoints for the rebuilt
  // comparison + guided-exploration contracts (design spec §6.3-§6.4). ---
  segmentedExample("vowel-a", [{ jp: "あ", romaji: "a", kind: "word" }]),
  segmentedExample("syllable-ka", [{ jp: "か", romaji: "ka", kind: "word" }]),
  segmentedExample("kana-kite", [
    { jp: "き", romaji: "ki", kind: "word" },
    { jp: "て", romaji: "te", kind: "word" },
  ]),
  segmentedExample("kana-kitte", [
    { jp: "き", romaji: "ki", kind: "word" },
    { jp: "っ", romaji: "t", kind: "word" },
    { jp: "て", romaji: "te", kind: "word" },
  ]),
  segmentedExample("eat-dict", [
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "る", romaji: "ru", kind: "ending" },
  ]),
  segmentedExample("eat-masu", [
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ます", romaji: "masu", kind: "ending" },
  ]),
  segmentedExample("today-ate", [
    { jp: "きょう ", romaji: "kyō ", kind: "word" },
    { jp: "らーめん", romaji: "rāmen ", kind: "word" },
    { jp: "を ", romaji: "o ", kind: "particle" },
    { jp: "たべ", romaji: "tabe", kind: "word" },
    { jp: "ました", romaji: "mashita", kind: "ending" },
  ]),
  segmentedExample("station-copula", [
    { jp: "えき", romaji: "eki ", kind: "word" },
    { jp: "は ", romaji: "wa ", kind: "particle" },
    { jp: "どこ", romaji: "doko ", kind: "word" },
    { jp: "です", romaji: "desu ", kind: "ending" },
  ]),
];

export const examples = Object.fromEntries(
  list.map((example) => [example.id, example]),
) as Record<string, StaticExample>;

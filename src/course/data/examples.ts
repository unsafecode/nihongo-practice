import type { StaticExample } from "./types";

function segmentedExample(
  id: string,
  segments: NonNullable<StaticExample["segments"]>,
): StaticExample {
  return {
    id,
    jp: segments.map((segment) => segment.jp).join(""),
    romaji: segments.map((segment) => segment.romaji).join(""),
    segments,
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
    { jp: "れすとらん", romaji: "resutoran ", kind: "word" },
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
    { jp: "といれ", romaji: "toire ", kind: "word" },
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
];

export const examples = Object.fromEntries(
  list.map((example) => [example.id, example]),
) as Record<string, StaticExample>;

/**
 * Locale-independent loanword registry (design spec §8.3, Task C). Each entry
 * pairs a loanword's standard katakana spelling with its hiragana reading and
 * romaji. The course must show the katakana `katakana` field at a loanword's
 * first on-screen exposure (with the `hiragana` field as reading support),
 * never hiragana pretending to be the standard spelling. This is a small fixed
 * registry of the loanwords the curriculum references — not a katakana
 * curriculum. Localized explanation lives in the copy catalog; this data stays
 * locale-independent so the same validator guards it in every locale.
 */
export type LoanwordId =
  | "ramen"
  | "restaurant"
  | "toilet"
  | "coffee"
  | "hotel"
  | "taxi"
  | "menu"
  | "bus"
  | "beer"
  | "bar"
  | "party";

export interface Loanword {
  readonly id: LoanwordId;
  /** Standard katakana spelling shown at first exposure. */
  readonly katakana: string;
  /** Hiragana reading support (also how the Lab engine renders the word). */
  readonly hiragana: string;
  readonly romaji: string;
}

export const loanwords: Record<LoanwordId, Loanword> = {
  ramen: { id: "ramen", katakana: "ラーメン", hiragana: "らーめん", romaji: "rāmen" },
  restaurant: {
    id: "restaurant",
    katakana: "レストラン",
    hiragana: "れすとらん",
    romaji: "resutoran",
  },
  toilet: { id: "toilet", katakana: "トイレ", hiragana: "といれ", romaji: "toire" },
  coffee: { id: "coffee", katakana: "コーヒー", hiragana: "こーひー", romaji: "kōhī" },
  hotel: { id: "hotel", katakana: "ホテル", hiragana: "ほてる", romaji: "hoteru" },
  taxi: { id: "taxi", katakana: "タクシー", hiragana: "たくしー", romaji: "takushī" },
  menu: { id: "menu", katakana: "メニュー", hiragana: "めにゅー", romaji: "menyū" },
  bus: { id: "bus", katakana: "バス", hiragana: "ばす", romaji: "basu" },
  beer: { id: "beer", katakana: "ビール", hiragana: "びーる", romaji: "bīru" },
  bar: { id: "bar", katakana: "バー", hiragana: "ばー", romaji: "bā" },
  party: { id: "party", katakana: "パーティー", hiragana: "ぱーてぃー", romaji: "pātī" },
};

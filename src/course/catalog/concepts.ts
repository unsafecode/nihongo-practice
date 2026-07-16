import type { ConceptCatalogEntry, ConceptId } from "./types";

/**
 * The shared grammar/semantic concept catalog for the A0→A1 course (design spec
 * §5.1, §6.4, §9.1). Each concept names one locale-independent "gear" a lesson
 * introduces; later lessons declare earlier concepts as prerequisites. This
 * catalog owns prerequisites and surface gears only — never localized prose or
 * duplicated examples.
 *
 * Concepts are authored in strict introduction order so that every
 * `prerequisiteIds` entry refers to a concept defined earlier in the array.
 * That ordering is what makes the prerequisite graph provably acyclic
 * (`lexicon.test.ts`) and lets `validateCurriculum` prove a concept is never
 * assessed before it is introduced.
 *
 * `surfaceGears` are the locale-independent kana glyph(s) that realize the
 * concept. Purely structural concepts (sentence order) carry no glyph and use
 * an empty gear list. No gear is ever kanji: hiragana remains the answer source
 * (spec §7).
 */
const CONCEPTS = [
  // — Foundations: frame, topic, copula, questions —
  {
    id: "sentence-order",
    prerequisiteIds: [],
    surfaceGears: [],
  },
  {
    id: "topic-wa",
    prerequisiteIds: ["sentence-order"],
    surfaceGears: ["は"],
  },
  {
    id: "copula-desu",
    prerequisiteIds: ["sentence-order", "topic-wa"],
    surfaceGears: ["です"],
  },
  {
    id: "topic-omission",
    prerequisiteIds: ["topic-wa"],
    surfaceGears: ["は"],
  },
  {
    id: "question-ka",
    prerequisiteIds: ["copula-desu"],
    surfaceGears: ["か"],
  },
  {
    id: "demonstratives",
    prerequisiteIds: ["copula-desu"],
    surfaceGears: ["これ", "それ", "あれ", "どれ", "この", "その", "あの"],
  },
  {
    id: "question-words",
    prerequisiteIds: ["question-ka"],
    surfaceGears: ["なに", "だれ", "どこ", "いつ", "いくら"],
  },
  // — Actions: object, polite verbs, subject —
  {
    id: "object-o",
    prerequisiteIds: ["sentence-order"],
    surfaceGears: ["を"],
  },
  {
    id: "polite-masu",
    prerequisiteIds: ["sentence-order", "topic-wa"],
    surfaceGears: ["ます"],
  },
  {
    id: "subject-ga",
    prerequisiteIds: ["topic-wa"],
    surfaceGears: ["が"],
  },
  // — Movement, place, and companion particles —
  {
    id: "destination-ni",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["に"],
  },
  {
    id: "direction-e",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["へ"],
  },
  {
    id: "location-de",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["で"],
  },
  {
    id: "source-kara",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["から"],
  },
  {
    id: "companion-to",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["と"],
  },
  {
    id: "person-ni",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["に"],
  },
  // — Time and frequency —
  {
    id: "time-expressions",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["に"],
  },
  {
    id: "frequency-adverbs",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["まいにち", "いつも", "ときどき"],
  },
  // — Tense and polarity —
  {
    id: "past-mashita",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["ました"],
  },
  {
    id: "negative-masen",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["ません"],
  },
  {
    id: "past-negative-masendeshita",
    prerequisiteIds: ["past-mashita", "negative-masen"],
    surfaceGears: ["ませんでした"],
  },
  // — Adjectives and comparison —
  {
    id: "i-adjective",
    prerequisiteIds: ["copula-desu"],
    surfaceGears: ["い"],
  },
  {
    id: "na-adjective",
    prerequisiteIds: ["copula-desu"],
    surfaceGears: ["な"],
  },
  {
    id: "adjective-past",
    prerequisiteIds: ["i-adjective", "na-adjective", "past-mashita"],
    surfaceGears: ["かった", "でした"],
  },
  {
    id: "comparison",
    prerequisiteIds: ["i-adjective"],
    surfaceGears: ["より", "ほう", "いちばん"],
  },
  // — Counters and quantities —
  {
    id: "counters",
    prerequisiteIds: ["question-words"],
    surfaceGears: ["ひとつ", "まい", "こ", "えん"],
  },
  // — Requests, desire, and offers —
  {
    id: "request-kudasai",
    prerequisiteIds: ["object-o", "polite-masu"],
    surfaceGears: ["ください"],
  },
  {
    id: "desire-tai",
    prerequisiteIds: ["object-o", "polite-masu"],
    surfaceGears: ["たい"],
  },
  {
    id: "volitional-mashou",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["ましょう"],
  },
  {
    id: "offer-mashouka",
    prerequisiteIds: ["polite-masu"],
    surfaceGears: ["ましょうか", "ましょう", "か"],
  },
  // — Existence, position, and needs —
  {
    id: "existence-arimasu",
    prerequisiteIds: ["polite-masu", "subject-ga"],
    surfaceGears: ["あります"],
  },
  {
    id: "existence-imasu",
    prerequisiteIds: ["polite-masu", "subject-ga"],
    surfaceGears: ["います"],
  },
  {
    id: "position-words",
    prerequisiteIds: ["existence-arimasu"],
    surfaceGears: ["うえ", "した", "なか", "となり"],
  },
  {
    id: "needs",
    prerequisiteIds: ["desire-tai", "existence-arimasu"],
    surfaceGears: ["ほしい", "いります"],
  },
] as const satisfies readonly ConceptCatalogEntry[];

/** Immutable ordered concept catalog. */
export const concepts: readonly ConceptCatalogEntry[] = Object.freeze(
  CONCEPTS.map((concept) =>
    Object.freeze({
      ...concept,
      prerequisiteIds: Object.freeze([...concept.prerequisiteIds]),
      surfaceGears: Object.freeze([...concept.surfaceGears]),
    }),
  ),
);

/** Stable index for prerequisite/reference lookups. */
export const conceptsById: ReadonlyMap<ConceptId, ConceptCatalogEntry> =
  new Map(concepts.map((concept) => [concept.id, concept]));

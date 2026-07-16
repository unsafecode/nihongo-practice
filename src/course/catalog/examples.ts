import { personasById } from "../data/personas";
import type {
  ConceptId,
  ExampleCatalogEntry,
  ExampleId,
  LexemeId,
} from "./types";

/**
 * The shared A0→A1 example catalog (design spec §6.3, §9.1 and Slice B plan
 * Task 3 step 4). This file is the Japanese source of truth for every practical
 * sentence a lesson shows: comparison pairs, guided constructions, and spoken
 * targets all live here as ordered kana segments with stable references.
 *
 * Editorial rules encoded (proven by `curriculum.test.ts`):
 *   - Japanese is kana only; romaji is derived later (spec §7), never stored;
 *   - every katakana loanword segment carries its hiragana `reading` for
 *     assisted first exposure;
 *   - each entry references only catalog lexeme/concept IDs so the validator can
 *     prove content is shared, not copied into a lesson;
 *   - answer literals live here once; locale copy owns only translations.
 *
 * Segment IDs are stable within an example (`w1`, `p1`, `e1`, …) so a speech
 * prompt can name the exact critical segments without duplicating the string.
 */

type SegmentKind = "word" | "particle" | "ending";

interface RawSegment {
  readonly jp: string;
  readonly kind: SegmentKind;
  readonly reading?: string;
}

export interface CurriculumExampleSegment extends RawSegment {
  /** Stable within-example id, assigned by kind (`w1`, `p1`, `e1`, …). */
  readonly id: string;
}

export interface CurriculumExampleEntry extends ExampleCatalogEntry {
  readonly id: ExampleId;
  /** Concatenated kana form, derived from the segments (never hand-entered). */
  readonly jp: string;
  readonly segments: readonly CurriculumExampleSegment[];
  readonly lexemeIds: readonly LexemeId[];
  readonly conceptIds: readonly ConceptId[];
}

/** A learner-facing content word (verb stem, noun, adjective, persona name). */
const w = (jp: string): RawSegment => ({ jp, kind: "word" });
/** A grammatical particle segment (は, を, に, か, …). */
const p = (jp: string): RawSegment => ({ jp, kind: "particle" });
/** A predicate ending segment (です, ます, ました, ください, …). */
const e = (jp: string): RawSegment => ({ jp, kind: "ending" });
/** A katakana loanword word carrying its hiragana reading for assistance. */
const k = (jp: string, reading: string): RawSegment => ({
  jp,
  kind: "word",
  reading,
});
/** A sentence break inside a multi-clause recombination example. */
const stop = (): RawSegment => ({ jp: "。", kind: "word" });

const YUKI = personasById.yuki.japaneseName;
const KEN = personasById.ken.japaneseName;
const MINA = personasById.mina.japaneseName;

function example(
  id: ExampleId,
  segments: readonly RawSegment[],
  lexemeIds: readonly LexemeId[],
  conceptIds: readonly ConceptId[],
): CurriculumExampleEntry {
  const counters: Record<SegmentKind, number> = {
    word: 0,
    particle: 0,
    ending: 0,
  };
  const abbrev: Record<SegmentKind, string> = {
    word: "w",
    particle: "p",
    ending: "e",
  };
  const withIds = segments.map((segment) => {
    counters[segment.kind] += 1;
    return Object.freeze({
      ...segment,
      id: `${abbrev[segment.kind]}${counters[segment.kind]}`,
    });
  });
  return Object.freeze({
    id,
    jp: withIds.map((segment) => segment.jp).join(""),
    segments: Object.freeze(withIds),
    lexemeIds: Object.freeze([...lexemeIds]),
    conceptIds: Object.freeze([...conceptIds]),
  });
}

const list: readonly CurriculumExampleEntry[] = [
  // ── Module 1 · Sounds, hiragana, and the katakana bridge ───────────────────
  example("sounds-1-base", [w("おはよう")], ["good-morning"], []),
  example("sounds-1-changed", [w("こんばんは")], ["good-evening"], []),
  example("sounds-1-say", [w("こんにちは")], ["hello"], []),
  example("sounds-1-r1", [w("さようなら")], ["goodbye"], []),
  example("sounds-2-base", [w("ありがとう")], ["thank-you"], []),
  example("sounds-2-changed", [w("すみません")], ["excuse-me"], []),
  example("sounds-2-say", [w("はい")], ["yes"], []),
  example("sounds-2-r1", [w("いいえ")], ["no"], []),
  example("sounds-3-base", [w("はじめまして")], ["nice-to-meet-you"], []),
  example("sounds-3-changed", [w("よろしく")], ["best-regards"], []),
  example(
    "sounds-3-say",
    [w("はじめまして"), w("よろしく")],
    ["nice-to-meet-you", "best-regards"],
    [],
  ),
  example("sounds-4-base", [k("コーヒー", "こーひー")], ["coffee"], []),
  example("sounds-4-changed", [k("ジュース", "じゅーす")], ["juice"], []),
  example("sounds-4-say", [k("ミルク", "みるく")], ["milk"], []),
  example("sounds-4-r1", [k("パン", "ぱん")], ["bread"], []),
  example("sounds-4-r2", [k("テレビ", "てれび")], ["television"], []),
  example("sounds-5-base", [k("ラジオ", "らじお")], ["radio"], []),
  example("sounds-5-changed", [k("カメラ", "かめら")], ["camera"], []),
  example("sounds-5-say", [k("バス", "ばす")], ["bus"], []),
  example("sounds-5-r1", [k("タクシー", "たくしー")], ["taxi"], []),
  example("sounds-5-r2", [k("レストラン", "れすとらん")], ["restaurant"], []),

  // ── Module 2 · Introducing oneself ─────────────────────────────────────────
  example(
    "introductions-1-base",
    [w("わたし"), p("は"), w("がくせい"), e("です")],
    ["i", "student"],
    ["sentence-order", "topic-wa", "copula-desu"],
  ),
  example(
    "introductions-1-changed",
    [w("あなた"), p("は"), w("がくせい"), e("です")],
    ["you", "student"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "introductions-1-say",
    [w("わたし"), p("の"), w("なまえ"), p("は"), w(YUKI), e("です")],
    ["i", "name"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "introductions-1-r1",
    [w("しゅっしん"), p("は"), w("にほん"), e("です")],
    ["origin", "japan"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "introductions-1-r2",
    [w(MINA), p("は"), w("にほんご"), p("の"), w("せんせい"), e("です")],
    ["japanese-language", "teacher"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "introductions-2-base",
    [w("しゅっしん"), p("は"), k("イタリア", "いたりあ"), e("です")],
    ["origin", "italy"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "introductions-2-changed",
    [w("しゅっしん"), p("は"), k("アメリカ", "あめりか"), e("です")],
    ["origin", "america"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "introductions-2-say",
    [k("イタリア", "いたりあ"), p("に"), w("すみ"), e("ます")],
    ["italy", "live"],
    ["destination-ni", "polite-masu"],
  ),
  example(
    "introductions-2-r1",
    [w("いしゃ"), e("です")],
    ["doctor"],
    ["topic-omission", "copula-desu"],
  ),
  example(
    "introductions-2-r2",
    [w(KEN), p("は"), w("かいしゃいん"), e("です")],
    ["office-worker"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "introductions-2-r3",
    [w("とし"), p("は"), w("にじゅうご"), w("さい"), e("です")],
    ["age", "years-old"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "introductions-2-r4",
    [w("くに"), p("は"), w("にほん"), e("です")],
    ["country", "japan"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "introductions-3-base",
    [w("にほんご"), p("を"), w("べんきょうし"), e("ます")],
    ["japanese-language", "study"],
    ["object-o", "polite-masu"],
  ),
  example(
    "introductions-3-changed",
    [w("えいご"), p("を"), w("べんきょうし"), e("ます")],
    ["english-language", "study"],
    ["object-o", "polite-masu"],
  ),
  example(
    "introductions-3-say",
    [w("かいしゃ"), p("の"), w("しごと"), p("を"), w("し"), e("ます")],
    ["company", "job", "do"],
    ["object-o", "polite-masu"],
  ),
  example(
    "introductions-3-r1",
    [w("にほんご"), p("は"), w("わかり"), e("ます")],
    ["japanese-language", "understand"],
    ["topic-wa", "polite-masu"],
  ),
  example(
    "introductions-3-r2",
    [w("ともだち"), p("の"), w("ことば"), p("を"), w("べんきょうし"), e("ます")],
    ["friend", "word", "study"],
    ["object-o", "polite-masu"],
  ),
  example(
    "introductions-3-r3",
    [w("でんわばんごう"), p("は"), w("わかり"), e("ます")],
    ["phone-number", "understand"],
    ["topic-wa", "polite-masu"],
  ),

  // ── Module 3 · Essential questions ─────────────────────────────────────────
  example(
    "essential-questions-1-base",
    [w("これ"), p("は"), k("コーヒー", "こーひー"), e("です")],
    ["this", "coffee"],
    ["demonstratives", "copula-desu"],
  ),
  example(
    "essential-questions-1-changed",
    [w("これ"), p("は"), k("コーヒー", "こーひー"), e("です"), p("か")],
    ["this", "coffee"],
    ["demonstratives", "question-ka"],
  ),
  example(
    "essential-questions-1-say",
    [w("その"), k("カメラ", "かめら"), p("は"), w("にほん"), p("の"), e("です"), p("か")],
    ["that-n", "camera", "japan"],
    ["demonstratives", "question-ka"],
  ),
  example(
    "essential-questions-1-r1",
    [w("わたし"), p("の"), k("カメラ", "かめら"), p("は"), w("どれ"), e("です"), p("か")],
    ["i", "camera", "which"],
    ["demonstratives", "question-ka"],
  ),
  example(
    "essential-questions-1-r2",
    [w("それ"), p("と"), w("あれ"), p("と"), w("あの"), k("ラジオ", "らじお")],
    ["that", "that-yonder", "that-yonder-n", "radio"],
    ["demonstratives"],
  ),
  example(
    "essential-questions-2-base",
    [k("レストラン", "れすとらん"), p("は"), w("どこ"), e("です"), p("か")],
    ["restaurant", "where"],
    ["question-words", "question-ka"],
  ),
  example(
    "essential-questions-2-changed",
    [k("レストラン", "れすとらん"), p("は"), w("ここ"), e("です")],
    ["restaurant", "here"],
    ["question-words", "copula-desu"],
  ),
  example(
    "essential-questions-2-say",
    [w("あなた"), p("は"), w("どこ"), p("に"), w("いき"), e("ます"), p("か")],
    ["you", "where", "go"],
    ["question-words", "destination-ni", "polite-masu"],
  ),
  example(
    "essential-questions-2-r1",
    [w("そこ"), p("は"), k("レストラン", "れすとらん"), e("です")],
    ["there", "restaurant"],
    ["question-words", "copula-desu"],
  ),
  example(
    "essential-questions-2-r2",
    [w("あそこ"), p("に"), w("いき"), e("ます")],
    ["over-there", "go"],
    ["destination-ni", "polite-masu"],
  ),
  example(
    "essential-questions-2-r3",
    [w("あれ"), p("は"), w("なに"), e("です"), p("か"), stop(), w("だれ"), p("の"), e("です"), p("か")],
    ["that-yonder", "what", "who"],
    ["question-words", "question-ka"],
  ),
  example(
    "essential-questions-3-base",
    [w("いつ"), w("き"), e("ます"), p("か")],
    ["when", "come"],
    ["question-words", "polite-masu"],
  ),
  example(
    "essential-questions-3-changed",
    [w("どうして"), w("き"), e("ます"), p("か")],
    ["why", "come"],
    ["question-words", "polite-masu"],
  ),
  example(
    "essential-questions-3-say",
    [w("この"), k("コーヒー", "こーひー"), p("は"), w("いくら"), e("です"), p("か")],
    ["this-n", "coffee", "how-much"],
    ["demonstratives", "question-words", "question-ka"],
  ),
  example(
    "essential-questions-3-r1",
    [k("コーヒー", "こーひー"), p("は"), w("いくつ"), e("です"), p("か")],
    ["coffee", "how-many"],
    ["question-words", "question-ka"],
  ),
  example(
    "essential-questions-3-r2",
    [w("にほんご"), p("は"), w("どう"), e("です"), p("か")],
    ["japanese-language", "how"],
    ["question-words", "question-ka"],
  ),

  // ── Module 4 · Actions and objects ─────────────────────────────────────────
  example(
    "actions-1-base",
    [w("ごはん"), p("を"), w("たべ"), e("ます")],
    ["rice-meal", "eat"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-1-changed",
    [k("レストラン", "れすとらん"), p("で"), w("ごはん"), p("を"), w("たべ"), e("ます")],
    ["restaurant", "rice-meal", "eat"],
    ["location-de", "object-o", "polite-masu"],
  ),
  example(
    "actions-1-say",
    [w("みず"), p("を"), w("のみ"), e("ます")],
    ["water", "drink"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-1-r1",
    [k("レストラン", "れすとらん"), p("で"), w("おちゃ"), p("を"), w("のみ"), e("ます")],
    ["restaurant", "tea", "drink"],
    ["location-de", "object-o", "polite-masu"],
  ),
  example(
    "actions-2-base",
    [w("ほん"), p("を"), w("よみ"), e("ます")],
    ["book", "read"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-2-changed",
    [w("ともだち"), p("と"), w("えいが"), p("を"), w("み"), e("ます")],
    ["friend", "movie", "watch"],
    ["companion-to", "object-o", "polite-masu"],
  ),
  example(
    "actions-2-say",
    [w("ともだち"), p("と"), w("てがみ"), p("を"), w("かき"), e("ます")],
    ["friend", "letter", "write"],
    ["companion-to", "object-o", "polite-masu"],
  ),
  example(
    "actions-2-r1",
    [w("しんぶん"), p("を"), w("よみ"), e("ます")],
    ["newspaper", "read"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-2-r2",
    [w("ともだち"), p("の"), w("てがみ"), p("を"), w("よみ"), e("ます")],
    ["friend", "letter", "read"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-3-base",
    [w("かばん"), p("を"), w("かい"), e("ます")],
    ["bag", "buy"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-3-changed",
    [k("ペン", "ぺん"), p("を"), w("つかい"), e("ます")],
    ["pen", "use"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-3-say",
    [w("しゃしん"), p("を"), w("とり"), e("ます")],
    ["photo", "take"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-3-r1",
    [k("ノート", "のーと"), p("と"), w("えんぴつ"), p("を"), w("かい"), e("ます")],
    ["notebook", "pencil", "buy"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-3-r2",
    [k("メール", "めーる"), p("を"), w("かき"), e("ます")],
    ["email", "write"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-3-r3",
    [w("たべもの"), p("と"), w("のみもの"), p("を"), w("かい"), e("ます")],
    ["food", "beverage", "buy"],
    ["object-o", "polite-masu"],
  ),
  example(
    "actions-3-r4",
    [w("この"), w("もの"), p("を"), w("つかい"), e("ます")],
    ["thing-object", "use"],
    ["demonstratives", "object-o", "polite-masu"],
  ),

  // ── Module 5 · Routines, clock time, and frequency ─────────────────────────
  example(
    "routines-1-base",
    [w("あさ"), w("しちじ"), p("に"), w("おき"), e("ます")],
    ["morning", "wake"],
    ["time-expressions", "polite-masu"],
  ),
  example(
    "routines-1-changed",
    [w("よる"), w("じゅういちじ"), p("に"), w("ね"), e("ます")],
    ["night", "sleep"],
    ["time-expressions", "polite-masu"],
  ),
  example(
    "routines-1-say",
    [w("あさ"), w("ごはん"), p("を"), w("たべ"), e("ます")],
    ["morning", "rice-meal", "eat"],
    ["time-expressions", "object-o", "polite-masu"],
  ),
  example(
    "routines-1-r1",
    [w("ひる"), p("に"), w("おちゃ"), p("を"), w("のみ"), e("ます")],
    ["daytime", "tea", "drink"],
    ["time-expressions", "object-o", "polite-masu"],
  ),
  example(
    "routines-2-base",
    [w("まいにち"), w("はたらき"), e("ます")],
    ["every-day", "work"],
    ["frequency-adverbs", "polite-masu"],
  ),
  example(
    "routines-2-changed",
    [w("ときどき"), w("にほんご"), p("を"), w("はなし"), e("ます")],
    ["sometimes", "japanese-language", "speak"],
    ["frequency-adverbs", "object-o", "polite-masu"],
  ),
  example(
    "routines-2-say",
    [w("いつも"), w("しゅうまつ"), p("に"), w("えいが"), p("を"), w("み"), e("ます")],
    ["always", "weekend", "movie", "watch"],
    ["frequency-adverbs", "time-expressions", "object-o"],
  ),
  example(
    "routines-2-r1",
    [w("よく"), w("ほん"), p("を"), w("よみ"), e("ます")],
    ["often", "book", "read"],
    ["frequency-adverbs", "object-o", "polite-masu"],
  ),
  example(
    "routines-3-base",
    [w("あさ"), w("おんがく"), p("を"), w("き"), e("ます")],
    ["morning", "music", "listen"],
    ["object-o", "polite-masu"],
  ),
  example(
    "routines-3-changed",
    [w("よる"), w("でんわ"), p("を"), w("かけ"), e("ます")],
    ["night", "telephone", "call"],
    ["object-o", "polite-masu"],
  ),
  example(
    "routines-3-say",
    [w("げつようび"), p("に"), w("にほんご"), p("を"), w("べんきょうし"), e("ます")],
    ["monday", "japanese-language", "study"],
    ["time-expressions", "object-o", "polite-masu"],
  ),
  example(
    "routines-3-r1",
    [w("にちようび"), p("に"), w("ともだち"), p("と"), w("はなし"), e("ます")],
    ["sunday", "friend", "speak"],
    ["time-expressions", "companion-to", "polite-masu"],
  ),
  example(
    "routines-3-r2",
    [w("ごぜん"), w("くじ"), p("と"), w("ごご"), w("さんじ"), w("はん")],
    ["morning-am", "afternoon-pm", "half-past"],
    ["time-expressions"],
  ),
  example(
    "routines-3-r3",
    [w("いちじかん"), w("にほんご"), p("を"), w("べんきょうし"), e("ます")],
    ["duration", "japanese-language", "study"],
    ["object-o", "polite-masu"],
  ),
  example(
    "routines-3-r4",
    [w("とけい"), p("を"), w("み"), e("ます")],
    ["clock", "watch"],
    ["object-o", "polite-masu"],
  ),
  example(
    "routines-3-r5",
    [w("ごぜん"), w("ろくじ"), w("ごふん"), p("に"), w("おき"), e("ます")],
    ["morning-am", "minute", "wake"],
    ["time-expressions", "polite-masu"],
  ),

  // ── Module 6 · Past and negative ───────────────────────────────────────────
  example(
    "past-negative-1-base",
    [w("きょう"), w("ともだち"), p("と"), w("えいが"), p("を"), w("み"), e("ました")],
    ["today", "friend", "movie", "watch"],
    ["past-mashita", "companion-to", "object-o"],
  ),
  example(
    "past-negative-1-changed",
    [w("きょう"), w("ともだち"), p("と"), w("えいが"), p("を"), w("み"), e("ます")],
    ["today", "friend", "movie", "watch"],
    ["polite-masu", "companion-to", "object-o"],
  ),
  example(
    "past-negative-1-say",
    [w("せんしゅう"), k("テスト", "てすと"), p("を"), w("し"), e("ました")],
    ["last-week", "test", "do"],
    ["past-mashita", "object-o"],
  ),
  example(
    "past-negative-1-r1",
    [w("けさ"), w("しんぶん"), p("を"), w("よみ"), e("ました")],
    ["this-morning", "newspaper", "read"],
    ["past-mashita", "object-o"],
  ),
  example(
    "past-negative-1-r2",
    [w("きょねん"), w("にほんご"), p("を"), w("べんきょうし"), e("ました")],
    ["last-year", "japanese-language", "study"],
    ["past-mashita", "object-o"],
  ),
  example(
    "past-negative-2-base",
    [w("きょう"), w("しゅくだい"), p("を"), w("し"), e("ます")],
    ["today", "homework", "do"],
    ["polite-masu", "object-o"],
  ),
  example(
    "past-negative-2-changed",
    [w("きょう"), w("しゅくだい"), p("を"), w("し"), e("ません")],
    ["today", "homework", "do"],
    ["negative-masen", "object-o"],
  ),
  example(
    "past-negative-2-say",
    [w("こんばん"), w("かいぎ"), p("に"), w("いき"), e("ません")],
    ["tonight", "meeting", "go"],
    ["negative-masen", "destination-ni"],
  ),
  example(
    "past-negative-2-r1",
    [w("らいしゅう"), w("ともだち"), p("を"), w("まち"), e("ます")],
    ["next-week", "friend", "wait"],
    ["polite-masu", "object-o"],
  ),
  example(
    "past-negative-3-base",
    [w("せんげつ"), w("ともだち"), p("と"), w("あい"), e("ました")],
    ["last-month", "friend", "meet"],
    ["past-mashita", "companion-to"],
  ),
  example(
    "past-negative-3-changed",
    [w("せんげつ"), w("ともだち"), p("と"), w("あい"), e("ませんでした")],
    ["last-month", "friend", "meet"],
    ["past-negative-masendeshita", "companion-to"],
  ),
  example(
    "past-negative-3-say",
    [w("たんじょうび"), p("に"), w("みち"), p("を"), w("きき"), e("ました")],
    ["birthday", "road", "ask"],
    ["past-mashita", "object-o"],
  ),
  example(
    "past-negative-3-r1",
    [w("こんしゅう"), p("と"), w("こんげつ"), p("は"), w("やすみ"), e("です"), stop(), w("らいげつ"), w("にほん"), p("へ"), w("いき"), e("ます"), stop(), w("ことし"), w("ともだち"), p("と"), w("あい"), e("ます")],
    ["this-week", "this-month", "day-off", "next-month", "japan", "go", "this-year", "friend", "meet"],
    ["topic-wa", "copula-desu", "direction-e", "companion-to"],
  ),
  example(
    "past-negative-3-r2",
    [w("らいねん"), w("やすみ"), p("に"), w("ともだち"), p("と"), w("あい"), e("ます")],
    ["next-year", "day-off", "friend", "meet"],
    ["polite-masu", "companion-to"],
  ),

  // ── Module 7 · Places, movement, and transport ─────────────────────────────
  example(
    "places-1-base",
    [w("いえ"), p("へ"), w("かえり"), e("ます")],
    ["house", "return"],
    ["direction-e", "polite-masu"],
  ),
  example(
    "places-1-changed",
    [w("えき"), p("へ"), w("あるき"), e("ます")],
    ["station", "walk"],
    ["direction-e", "polite-masu"],
  ),
  example(
    "places-1-say",
    [w("まち"), p("の"), w("こうえん"), p("へ"), w("いき"), e("ます")],
    ["town", "park", "go"],
    ["direction-e", "polite-masu"],
  ),
  example(
    "places-1-r1",
    [w("がっこう"), p("から"), w("いえ"), p("へ"), w("かえり"), e("ます")],
    ["school", "house", "return"],
    ["source-kara", "direction-e"],
  ),
  example(
    "places-2-base",
    [w("みせ"), p("に"), w("はいり"), e("ます")],
    ["shop", "enter"],
    ["destination-ni", "polite-masu"],
  ),
  example(
    "places-2-changed",
    [w("みせ"), p("を"), w("で"), e("ます")],
    ["shop", "leave"],
    ["object-o", "polite-masu"],
  ),
  example(
    "places-2-say",
    [w("ぎんこう"), p("と"), w("ゆうびんきょく"), p("に"), w("いき"), e("ます")],
    ["bank", "post-office", "go"],
    // と here coordinates two inanimate places ("bank and post office"), not a
    // companion — companion-to is only for a real accompanying person.
    ["destination-ni"],
  ),
  example(
    "places-2-r1",
    [w("びょういん"), p("から"), w("あるき"), e("ます")],
    ["hospital", "walk"],
    ["source-kara", "polite-masu"],
  ),
  example(
    "places-2-r2",
    [w("としょかん"), p("で"), w("ほん"), p("を"), w("よみ"), e("ます")],
    ["library", "book", "read"],
    ["location-de", "object-o"],
  ),
  example(
    "places-3-base",
    [w("えき"), p("で"), w("でんしゃ"), p("に"), w("のり"), e("ます")],
    ["station", "train", "board"],
    ["location-de", "destination-ni"],
  ),
  example(
    "places-3-changed",
    [w("えき"), p("で"), w("でんしゃ"), p("を"), w("おり"), e("ます")],
    ["station", "train", "alight"],
    ["location-de", "object-o"],
  ),
  example(
    "places-3-say",
    [w("くうこう"), p("へ"), k("タクシー", "たくしー"), p("に"), w("のり"), e("ます")],
    ["airport", "taxi", "board"],
    ["direction-e", "destination-ni"],
  ),
  example(
    "places-3-r1",
    [w("ちかてつ"), p("と"), k("バス", "ばす"), p("で"), w("いき"), e("ます")],
    ["subway", "bus", "go"],
    // と coordinates two inanimate transport modes ("subway and bus"), not a
    // companion — companion-to is only for a real accompanying person.
    ["location-de"],
  ),
  example(
    "places-3-r2",
    [w("くるま"), p("と"), w("じてんしゃ"), p("と"), w("ひこうき")],
    ["car", "bicycle", "airplane"],
    [],
  ),
  example(
    "places-4-base",
    [w("かばん"), p("を"), w("もち"), e("ます")],
    ["bag", "carry"],
    ["object-o", "polite-masu"],
  ),
  example(
    "places-4-changed",
    [w("えき"), p("で"), w("みち"), p("を"), w("きき"), e("ます")],
    ["station", "road", "ask"],
    ["location-de", "object-o"],
  ),
  example(
    "places-4-say",
    [w("えき"), p("は"), w("どこ"), e("です"), p("か")],
    ["station", "where"],
    ["question-words", "question-ka"],
  ),
  example(
    "places-4-r1",
    [w("へや"), p("で"), k("パソコン", "ぱそこん"), p("を"), w("つかい"), e("ます")],
    ["room", "computer", "use"],
    ["location-de", "object-o"],
  ),

  // ── Module 8 · People, family, and relationships ───────────────────────────
  example(
    "people-1-base",
    [w("これ"), p("は"), w("わたし"), p("の"), w("かぞく"), e("です")],
    ["this", "i", "family"],
    ["demonstratives", "copula-desu"],
  ),
  example(
    "people-1-changed",
    [w("この"), w("ひと"), p("は"), w("わたし"), p("の"), w("ちち"), e("です")],
    ["this-n", "person", "i", "father"],
    ["demonstratives", "copula-desu"],
  ),
  example(
    "people-1-say",
    [w("ともだち"), p("に"), w("にほんご"), p("を"), w("おしえ"), e("ます")],
    ["friend", "japanese-language", "teach-tell"],
    ["person-ni", "object-o"],
  ),
  example(
    "people-1-r1",
    [w("はは"), p("と"), w("あね"), p("と"), w("いもうと"), p("は"), w("かぞく"), e("です")],
    ["mother", "older-sister", "younger-sister", "family"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "people-1-r2",
    [w("あに"), p("と"), w("おとうと"), p("は"), w("がくせい"), e("です")],
    ["older-brother", "younger-brother", "student"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "people-1-r3",
    [w("りょうしん"), p("は"), w("こうえん"), p("を"), w("あるき"), e("ます")],
    ["parents", "park", "walk"],
    ["object-o", "polite-masu"],
  ),
  example(
    "people-2-base",
    [w("ともだち"), p("に"), w("てがみ"), p("を"), w("あげ"), e("ます")],
    ["friend", "letter", "give"],
    ["person-ni", "object-o"],
  ),
  example(
    "people-2-changed",
    [w("ちち"), p("に"), w("てがみ"), p("を"), w("もらい"), e("ます")],
    ["father", "letter", "receive"],
    ["person-ni", "object-o"],
  ),
  example(
    "people-2-say",
    [w("むすこ"), p("と"), w("むすめ"), p("に"), w("ほん"), p("を"), w("よみ"), e("ます")],
    ["son", "daughter", "book", "read"],
    ["person-ni", "object-o"],
  ),
  example(
    "people-2-r1",
    [w("これ"), p("は"), w("そふ"), p("と"), w("そぼ"), e("です")],
    ["grandfather", "grandmother"],
    ["demonstratives", "copula-desu"],
  ),
  example(
    "people-2-r2",
    [w("おっと"), p("と"), w("つま"), p("は"), w("えいが"), p("を"), w("み"), e("ます")],
    ["husband", "wife", "movie", "watch"],
    ["object-o", "polite-masu"],
  ),
  example(
    "people-2-r3",
    [w("こども"), p("に"), w("にほんご"), p("を"), w("おしえ"), e("ます")],
    ["child", "japanese-language", "teach-tell"],
    ["person-ni", "object-o"],
  ),
  example(
    "people-3-base",
    [w("ともだち"), p("と"), w("こうえん"), p("に"), w("いき"), e("ましょう")],
    ["friend", "park", "go"],
    ["volitional-mashou", "destination-ni"],
  ),
  example(
    "people-3-changed",
    [w("かばん"), p("を"), w("もち"), e("ましょうか")],
    ["bag", "carry"],
    ["offer-mashouka", "object-o"],
  ),
  example(
    "people-3-say",
    [w("こうえん"), p("で"), w("ごはん"), p("を"), w("たべ"), e("ましょう")],
    ["park", "rice-meal", "eat"],
    ["volitional-mashou", "object-o"],
  ),
  example(
    "people-3-r1",
    [w("かれ"), p("と"), w("かのじょ"), p("は"), w("ともだち"), e("です")],
    ["he", "she", "friend"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "people-3-r2",
    [w("おとこ"), p("の"), w("ひと"), p("と"), w("おんな"), p("の"), w("ひと"), p("は"), w("せんせい"), e("です")],
    ["man", "person", "woman", "teacher"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "people-3-r3",
    [w("おとこのこ"), p("と"), w("おんなのこ"), p("を"), w("まち"), e("ます")],
    ["boy", "girl", "wait"],
    ["object-o", "polite-masu"],
  ),

  // ── Module 9 · Descriptions, preferences, and weather ──────────────────────
  example(
    "descriptions-1-base",
    [w("おおきい"), w("いえ"), e("です")],
    ["big", "house"],
    ["i-adjective", "copula-desu"],
  ),
  example(
    "descriptions-1-changed",
    [w("ちいさい"), w("いえ"), e("です")],
    ["small", "house"],
    ["i-adjective", "copula-desu"],
  ),
  example(
    "descriptions-1-say",
    [w("きれい"), p("な"), w("へや"), p("で"), w("すわり"), e("ます")],
    ["pretty", "room", "sit"],
    ["na-adjective", "location-de"],
  ),
  example(
    "descriptions-1-r1",
    [w("あたらしい"), w("くるま"), p("と"), w("ふるい"), w("じてんしゃ")],
    ["new", "car", "old", "bicycle"],
    ["i-adjective"],
  ),
  example(
    "descriptions-1-r2",
    [w("この"), w("ほん"), p("は"), w("おもしろい"), e("です")],
    ["this-n", "book", "interesting"],
    ["i-adjective", "copula-desu"],
  ),
  example(
    "descriptions-1-r3",
    [w("むずかしい"), w("しごと"), p("は"), w("たのしい"), e("です")],
    ["difficult", "job", "fun"],
    ["i-adjective", "copula-desu"],
  ),
  example(
    "descriptions-2-base",
    [w("にほんご"), p("が"), w("すき"), e("です")],
    ["japanese-language", "like"],
    ["subject-ga", "na-adjective"],
  ),
  example(
    "descriptions-2-changed",
    [w("えいが"), p("が"), w("きらい"), e("です")],
    ["movie", "dislike"],
    ["subject-ga", "na-adjective"],
  ),
  example(
    "descriptions-2-say",
    [w("おんがく"), p("が"), w("すき"), e("です"), stop(), w("にほんご"), p("が"), w("じょうず"), e("です")],
    ["music", "like", "japanese-language", "good-at"],
    ["subject-ga", "na-adjective"],
  ),
  example(
    "descriptions-2-r1",
    [w("この"), w("たべもの"), p("は"), w("おいしい"), e("です")],
    ["this-n", "food", "delicious"],
    ["i-adjective", "copula-desu"],
  ),
  example(
    "descriptions-2-r2",
    [w("きょう"), p("の"), w("てんき"), p("は"), w("いい"), e("です")],
    ["today", "weather", "good"],
    ["i-adjective", "copula-desu"],
  ),
  example(
    "descriptions-3-base",
    [w("でんしゃ"), p("より"), k("バス", "ばす"), p("が"), w("やすい"), e("です")],
    ["train", "bus", "cheap"],
    ["comparison", "subject-ga"],
  ),
  example(
    "descriptions-3-changed",
    [w("でんしゃ"), p("より"), k("バス", "ばす"), p("が"), w("たかい"), e("です")],
    ["train", "bus", "expensive"],
    ["comparison", "subject-ga"],
  ),
  example(
    "descriptions-3-say",
    [w("にほんご"), p("を"), w("ならい"), e("ます")],
    ["japanese-language", "learn"],
    ["object-o", "polite-masu"],
  ),
  example(
    "descriptions-3-r1",
    [w("てんき"), p("が"), w("あつい"), e("です"), w("あめ"), p("と"), w("くもり")],
    ["weather", "hot", "rain", "cloudy"],
    ["i-adjective", "subject-ga"],
  ),
  example(
    "descriptions-3-r2",
    [w("せんせい"), p("の"), w("まえ"), p("で"), w("たち"), e("ます")],
    ["teacher", "front", "stand"],
    ["location-de", "polite-masu"],
  ),
  example(
    "descriptions-3-r3",
    [w("かんたん"), p("な"), w("しごと"), p("は"), w("たのしかった"), e("です")],
    ["easy", "job", "fun"],
    ["na-adjective", "adjective-past"],
  ),
  example(
    "descriptions-3-r7",
    [w("きのう"), p("は"), w("さむかった"), e("です")],
    ["yesterday", "cold"],
    ["adjective-past"],
  ),

  // ── Module 10 · Shopping, quantities, and requests ─────────────────────────
  example(
    "shopping-1-base",
    [w("りんご"), p("を"), w("ひとつ"), w("かい"), e("ます")],
    ["apple", "one-thing", "buy"],
    ["counters", "object-o"],
  ),
  example(
    "shopping-1-changed",
    [w("りんご"), p("を"), w("みっつ"), w("かい"), e("ます")],
    ["apple", "three-things", "buy"],
    ["counters", "object-o"],
  ),
  example(
    "shopping-1-say",
    [w("この"), k("シャツ", "しゃつ"), p("は"), w("いくら"), e("です"), p("か")],
    ["shirt", "how-much"],
    ["demonstratives", "question-words"],
  ),
  example(
    "shopping-1-r1",
    [w("たまご"), p("を"), w("ふたつ"), p("と"), w("にく"), p("を"), w("すこし"), w("かい"), e("ます")],
    ["egg", "two-things", "meat", "a-little", "buy"],
    ["counters", "object-o"],
  ),
  example(
    "shopping-1-r2",
    [w("やさい"), p("と"), w("さかな"), p("を"), w("ぜんぶ"), w("かい"), e("ます")],
    ["vegetable", "fish", "all", "buy"],
    ["object-o", "counters"],
  ),
  example(
    "shopping-2-base",
    [w("みず"), p("を"), e("ください")],
    ["water"],
    ["request-kudasai", "object-o"],
  ),
  example(
    "shopping-2-changed",
    [k("コーヒー", "こーひー"), p("を"), w("のみ"), e("たいです")],
    ["coffee", "drink"],
    ["desire-tai", "object-o"],
  ),
  example(
    "shopping-2-say",
    [w("くだもの"), p("を"), w("かい"), e("たいです")],
    ["fruit", "buy"],
    ["desire-tai", "object-o"],
  ),
  example(
    "shopping-2-r1",
    [w("おちゃ"), p("を"), w("はんぶん"), e("ください")],
    ["tea", "half-portion"],
    ["request-kudasai", "object-o"],
  ),
  example(
    "shopping-2-r2",
    [k("スーパー", "すーぱー"), p("で"), w("くだもの"), p("を"), w("たくさん"), w("かい"), e("ます")],
    ["supermarket", "fruit", "many", "buy"],
    ["location-de", "object-o"],
  ),
  example(
    "shopping-3-base",
    [w("みせ"), p("を"), w("あけ"), e("ます")],
    ["shop", "open"],
    ["object-o", "polite-masu"],
  ),
  example(
    "shopping-3-changed",
    [w("みせ"), p("を"), w("しめ"), e("ます")],
    ["shop", "close"],
    ["object-o", "polite-masu"],
  ),
  example(
    "shopping-3-say",
    [w("ともだち"), p("に"), w("ほん"), p("を"), w("かり"), e("ます")],
    ["friend", "book", "borrow"],
    ["person-ni", "object-o"],
  ),
  example(
    "shopping-3-r1",
    [w("さいふ"), p("の"), w("おかね"), p("を"), w("ぜんぶ"), w("つかい"), e("ました")],
    ["wallet", "money", "all", "use"],
    ["object-o", "past-mashita"],
  ),
  example(
    "shopping-3-r2",
    [w("ふく"), p("の"), w("ねだん"), p("は"), w("たかい"), e("です")],
    ["clothes", "price", "expensive"],
    ["topic-wa", "i-adjective"],
  ),
  example(
    "shopping-3-r3",
    [w("ぼうし"), p("を"), w("みっつ"), p("と"), k("サイズ", "さいず"), p("を"), w("きき"), e("ます")],
    ["hat", "three-things", "size", "ask"],
    ["counters", "object-o"],
  ),
  example(
    "shopping-3-r4",
    [w("せん"), w("えん"), p("と"), w("ひゃく"), w("えん")],
    ["thousand", "yen", "hundred"],
    ["counters"],
  ),

  // ── Module 11 · Existence, position, and needs ─────────────────────────────
  example(
    "existence-needs-1-base",
    [w("つくえ"), p("の"), w("うえ"), p("に"), w("ほん"), p("が"), w("あり"), e("ます")],
    ["desk", "on-top", "book", "exist-inanimate"],
    ["existence-arimasu", "position-words", "subject-ga"],
  ),
  example(
    "existence-needs-1-changed",
    [w("つくえ"), p("の"), w("した"), p("に"), w("かばん"), p("が"), w("あり"), e("ます")],
    ["desk", "under", "bag", "exist-inanimate"],
    ["existence-arimasu", "position-words", "subject-ga"],
  ),
  example(
    "existence-needs-1-say",
    [w("いす"), p("の"), w("よこ"), p("に"), w("かぎ"), p("と"), w("めがね"), p("が"), w("あり"), e("ます")],
    ["chair", "beside", "key", "glasses", "exist-inanimate"],
    ["existence-arimasu", "position-words"],
  ),
  example(
    "existence-needs-1-r1",
    [w("いす"), p("の"), w("うえ"), p("に"), w("めがね"), p("が"), w("あり"), e("ます")],
    ["chair", "on-top", "glasses", "exist-inanimate"],
    ["existence-arimasu", "position-words"],
  ),
  example(
    "existence-needs-1-r2",
    [w("そと"), p("に"), w("くるま"), p("が"), w("あり"), e("ます")],
    ["outside", "car", "exist-inanimate"],
    ["existence-arimasu", "position-words"],
  ),
  example(
    "existence-needs-2-base",
    [w("へや"), p("の"), w("なか"), p("に"), w("ひと"), p("が"), w("い"), e("ます")],
    ["room", "inside", "person", "exist-animate"],
    ["existence-imasu", "position-words", "subject-ga"],
  ),
  example(
    "existence-needs-2-changed",
    [w("いえ"), p("の"), w("まえ"), p("に"), w("こども"), p("が"), w("い"), e("ます")],
    ["house", "front", "child", "exist-animate"],
    ["existence-imasu", "position-words", "subject-ga"],
  ),
  example(
    "existence-needs-2-say",
    [w("となり"), p("の"), w("へや"), p("に"), w("かぞく"), p("が"), w("い"), e("ます")],
    ["next-to", "room", "family", "exist-animate"],
    ["existence-imasu", "position-words"],
  ),
  example(
    "existence-needs-2-r1",
    [w("うしろ"), p("と"), w("みぎ"), p("と"), w("ひだり"), p("と"), w("あいだ")],
    ["behind", "right-side", "left-side", "between"],
    ["position-words"],
  ),
  example(
    "existence-needs-2-r2",
    [w("えき"), p("の"), w("ちかく"), p("に"), w("ともだち"), p("が"), w("い"), e("ます")],
    ["station", "near", "friend", "exist-animate"],
    ["existence-imasu", "position-words"],
  ),
  example(
    "existence-needs-3-base",
    [w("くすり"), p("が"), w("いり"), e("ます")],
    ["medicine", "need"],
    ["needs", "subject-ga"],
  ),
  example(
    "existence-needs-3-changed",
    [w("みず"), p("が"), w("ほしい"), e("です")],
    ["water"],
    ["needs", "subject-ga"],
  ),
  example(
    "existence-needs-3-say",
    [w("きっぷ"), p("と"), k("パスポート", "ぱすぽーと"), p("が"), w("いり"), e("ます")],
    ["ticket", "passport", "need"],
    ["needs", "subject-ga"],
  ),
  example(
    "existence-needs-3-r1",
    [w("ちず"), p("と"), w("かさ"), p("が"), w("いり"), e("ます")],
    ["map", "umbrella", "need"],
    ["needs", "subject-ga"],
  ),
  example(
    "existence-needs-3-r2",
    [k("ホテル", "ほてる"), p("に"), k("トイレ", "といれ"), p("が"), w("あり"), e("ます")],
    ["hotel", "toilet", "exist-inanimate"],
    ["existence-arimasu", "position-words"],
  ),

  // ── Spiral review · earlier verbs retrieved in later modules ───────────────
  // These recombination examples are the engine of genuine verb reuse (spec
  // §6.1): each retrieves earlier verbs in a new, later module so a verb earns
  // its three-module, four-example reuse honestly rather than by prose mention.
  example(
    "past-negative-1-r3",
    [w("けさ"), w("おき"), e("ました"), stop(), w("てがみ"), p("を"), w("かき"), e("ました"), stop(), w("しんぶん"), p("を"), w("よみ"), e("ました")],
    ["this-morning", "wake", "letter", "write", "newspaper", "read"],
    ["past-mashita", "object-o"],
  ),
  example(
    "past-negative-2-r2",
    [w("こんばん"), w("はたらき"), e("ません"), stop(), w("ね"), e("ません")],
    ["tonight", "work", "sleep"],
    ["negative-masen"],
  ),
  example(
    "past-negative-3-r3",
    [w("ともだち"), p("と"), w("はなし"), e("ました"), stop(), w("おんがく"), p("を"), w("きき"), e("ました"), stop(), w("でんわ"), p("を"), w("かけ"), e("ました")],
    ["friend", "speak", "music", "listen", "telephone", "call"],
    ["past-mashita", "companion-to", "object-o"],
  ),
  example(
    "places-1-r2",
    [w("ともだち"), p("は"), w("まち"), p("に"), w("すみ"), e("ます"), stop(), w("にほんご"), p("を"), w("はなし"), e("ます")],
    ["friend", "town", "live", "japanese-language", "speak"],
    ["destination-ni", "object-o"],
  ),
  example(
    "places-4-r2",
    [w("えき"), p("で"), w("ともだち"), p("を"), w("まち"), e("ます"), stop(), w("しゃしん"), p("を"), w("とり"), e("ます")],
    ["station", "friend", "wait", "photo", "take"],
    ["location-de", "object-o"],
  ),
  example(
    "people-1-r4",
    [w("ともだち"), p("が"), w("いえ"), p("に"), w("き"), e("ます"), stop(), w("てがみ"), p("を"), w("かき"), e("ます")],
    ["friend", "house", "come", "letter", "write"],
    ["destination-ni", "object-o"],
  ),
  example(
    "people-1-r5",
    [w("そふ"), p("は"), w("にほん"), p("に"), w("すみ"), e("ます"), stop(), w("おんがく"), p("を"), w("きき"), e("ます")],
    ["grandfather", "japan", "live", "music", "listen"],
    ["destination-ni", "object-o"],
  ),
  example(
    "people-2-r4",
    [w("ともだち"), p("に"), w("でんわ"), p("を"), w("かけ"), e("ます"), stop(), w("ことば"), p("を"), w("おしえ"), e("ます")],
    ["friend", "telephone", "call", "word", "teach-tell"],
    ["person-ni", "object-o"],
  ),
  example(
    "people-2-r5",
    [w("こども"), p("の"), w("ことば"), p("は"), w("わかり"), e("ます")],
    ["child", "word", "understand"],
    ["topic-wa", "polite-masu"],
  ),
  example(
    "people-3-r4",
    [w("ともだち"), p("と"), w("まち"), p("で"), w("あい"), e("ます"), stop(), w("かばん"), p("を"), w("もち"), e("ます")],
    ["friend", "town", "meet", "bag", "carry"],
    ["companion-to", "object-o"],
  ),
  example(
    "descriptions-1-r4",
    [w("あさ"), w("おき"), e("ます"), stop(), w("まいにち"), w("はたらき"), e("ます"), stop(), w("よる"), w("ね"), e("ます")],
    ["morning", "wake", "every-day", "work", "night", "sleep"],
    ["frequency-adverbs", "polite-masu"],
  ),
  example(
    "descriptions-2-r3",
    [w("ともだち"), p("に"), w("ほん"), p("を"), w("あげ"), e("ます"), stop(), w("ちち"), p("に"), w("ほん"), p("を"), w("もらい"), e("ます")],
    ["friend", "book", "give", "father", "receive"],
    ["person-ni", "object-o"],
  ),
  example(
    "descriptions-3-r4",
    [w("こども"), p("に"), w("にほんご"), p("を"), w("おしえ"), e("ます"), stop(), w("しゃしん"), p("を"), w("とり"), e("ます")],
    ["child", "japanese-language", "teach-tell", "photo", "take"],
    ["person-ni", "object-o"],
  ),
  example(
    "shopping-1-r3",
    [w("みせ"), p("に"), w("はいり"), e("ます"), stop(), w("くつ"), p("を"), w("かい"), e("ます"), stop(), w("みせ"), p("を"), w("で"), e("ます")],
    ["shop", "enter", "shoes", "buy", "leave"],
    ["destination-ni", "object-o"],
  ),
  example(
    "shopping-2-r3",
    [w("えき"), p("で"), w("でんしゃ"), p("に"), w("のり"), e("ます"), stop(), w("くうこう"), p("で"), w("おり"), e("ます")],
    ["station", "train", "board", "airport", "alight"],
    ["location-de", "destination-ni"],
  ),
  example(
    "shopping-2-r4",
    [w("みせ"), p("で"), w("ともだち"), p("に"), w("おかね"), p("を"), w("あげ"), e("ます"), stop(), w("おつり"), p("を"), w("もらい"), e("ます")],
    ["shop", "friend", "money", "give", "change-money", "receive"],
    ["location-de", "person-ni", "object-o"],
  ),
  example(
    "shopping-3-r5",
    [w("みせ"), p("から"), w("いえ"), p("に"), w("かえり"), e("ます"), stop(), w("にほんご"), p("を"), w("ならい"), e("ます")],
    ["shop", "house", "return", "japanese-language", "learn"],
    ["source-kara", "object-o"],
  ),
  example(
    "shopping-3-r6",
    [w("でんしゃ"), p("で"), w("たち"), e("ます"), stop(), w("いす"), p("に"), w("すわり"), e("ます")],
    ["train", "stand", "chair", "sit"],
    // No を anywhere in this pair (でんしゃで stand, いすに sit) — object-o
    // was a false tag; に here is the same goal/target marker as destination-ni.
    ["location-de", "destination-ni"],
  ),
  example(
    "shopping-3-r7",
    [w("まいにち"), w("みせ"), p("で"), w("はたらき"), e("ます"), stop(), w("ともだち"), p("に"), w("ほん"), p("を"), w("かり"), e("ます")],
    ["every-day", "shop", "work", "friend", "book", "borrow"],
    ["location-de", "person-ni", "object-o"],
  ),
  example(
    "shopping-3-r8",
    [w("さいふ"), p("を"), w("あけ"), e("ます"), stop(), w("さいふ"), p("を"), w("しめ"), e("ます")],
    ["wallet", "open", "close"],
    ["object-o", "polite-masu"],
  ),
  example(
    "existence-needs-1-r3",
    [w("いす"), p("に"), w("すわり"), e("ます"), stop(), w("ほん"), p("を"), w("よみ"), e("ます")],
    ["chair", "sit", "book", "read"],
    ["object-o", "polite-masu"],
  ),
  example(
    "existence-needs-1-r4",
    [w("えき"), p("で"), w("でんしゃ"), p("を"), w("おり"), e("ます"), stop(), w("かばん"), p("を"), w("もち"), e("ます")],
    ["station", "train", "alight", "bag", "carry"],
    ["location-de", "object-o"],
  ),
  example(
    "existence-needs-2-r3",
    [k("ドア", "どあ"), p("の"), w("まえ"), p("に"), w("たち"), e("ます"), stop(), k("ドア", "どあ"), p("を"), w("あけ"), e("ます")],
    ["door", "front", "stand", "open"],
    ["position-words", "object-o"],
  ),
  example(
    "existence-needs-2-r4",
    [w("ともだち"), p("が"), w("えき"), p("に"), w("き"), e("ます"), stop(), w("ともだち"), p("と"), w("あい"), e("ます")],
    ["friend", "station", "come", "meet"],
    ["destination-ni", "companion-to"],
  ),
  example(
    "existence-needs-3-r3",
    [k("ホテル", "ほてる"), p("で"), w("かさ"), p("を"), w("かり"), e("ます"), stop(), w("まど"), p("を"), w("しめ"), e("ます")],
    ["hotel", "umbrella", "borrow", "window", "close"],
    ["location-de", "object-o"],
  ),
  example(
    "existence-needs-3-r4",
    [k("ホテル", "ほてる"), p("に"), w("はいり"), e("ます"), stop(), w("へや"), p("を"), w("で"), e("ます")],
    ["hotel", "enter", "room", "leave"],
    ["destination-ni", "object-o"],
  ),
  example(
    "existence-needs-3-r5",
    [w("ともだち"), p("に"), w("くすり"), p("を"), w("あげ"), e("ます"), stop(), w("ちち"), p("に"), w("ちず"), p("を"), w("もらい"), e("ます")],
    ["friend", "medicine", "give", "father", "map", "receive"],
    ["person-ni", "object-o"],
  ),
  example(
    "existence-needs-3-r6",
    [w("こども"), p("に"), w("にほんご"), p("を"), w("おしえ"), e("ます"), stop(), w("にほんご"), p("を"), w("ならい"), e("ます")],
    ["child", "japanese-language", "teach-tell", "learn"],
    ["person-ni", "object-o"],
  ),
  example(
    "descriptions-3-r5",
    [w("よる"), w("じゅうじ"), p("に"), w("ね"), e("ます")],
    ["night", "sleep"],
    ["time-expressions", "polite-masu"],
  ),
  example(
    "people-3-r5",
    [w("みせ"), p("を"), w("で"), e("ます"), stop(), w("かばん"), p("を"), w("もち"), e("ます")],
    ["shop", "leave", "bag", "carry"],
    ["object-o", "polite-masu"],
  ),
  example(
    "existence-needs-2-r5",
    [w("そふ"), p("は"), w("いす"), p("に"), w("すわり"), e("ます")],
    ["grandfather", "chair", "sit"],
    // No を present — object-o was a false tag; に marks the sit target the
    // same way destination-ni does elsewhere in this catalog.
    ["destination-ni", "polite-masu"],
  ),
  example(
    "existence-needs-3-r7",
    [w("まど"), p("の"), w("まえ"), p("に"), w("たち"), e("ます")],
    ["window", "front", "stand"],
    ["position-words", "polite-masu"],
  ),
  // Coverage: the last four vocabulary items taught through a practical sentence.
  example(
    "routines-3-r6",
    [w("あした"), w("にほんご"), p("を"), w("べんきょうし"), e("ます")],
    ["tomorrow", "japanese-language", "study"],
    ["object-o", "polite-masu"],
  ),
  example(
    "past-negative-3-r5",
    [w("たんじょうび"), p("の"), k("パーティー", "ぱーてぃー"), p("に"), w("いき"), e("ました")],
    ["birthday", "party", "go"],
    ["past-mashita", "destination-ni"],
  ),
  example(
    "descriptions-2-r4",
    [w("きょう"), p("は"), w("いそがしい"), e("です")],
    ["today", "busy"],
    ["i-adjective", "copula-desu"],
  ),
  example(
    "descriptions-3-r6",
    [w("この"), k("カメラ", "かめら"), p("は"), w("たかい"), e("です")],
    ["camera", "expensive"],
    ["demonstratives", "i-adjective"],
  ),

  // ── Module 12 · Practical synthesis (capstones) ────────────────────────────
  // Orientation reviews prior gears; the three capstones recombine them in
  // bounded scenarios and introduce nothing new (spec §5.2).
  example(
    "capstones-orientation-base",
    [w("わたし"), p("は"), w("にほんご"), p("の"), w("がくせい"), e("です")],
    ["i", "japanese-language", "student"],
    ["topic-wa", "copula-desu"],
  ),
  example(
    "capstones-orientation-changed",
    [w("わたし"), p("は"), w("にほんご"), p("の"), w("がくせい"), e("です"), p("か")],
    ["i", "japanese-language", "student"],
    ["topic-wa", "question-ka"],
  ),
  example(
    "capstones-orientation-say",
    [w("まいにち"), w("にほんご"), p("を"), w("べんきょうし"), e("ます")],
    ["every-day", "japanese-language", "study"],
    ["frequency-adverbs", "object-o"],
  ),
  example(
    "capstones-self-introduction-base",
    [w("はじめまして"), w(YUKI), e("です")],
    ["nice-to-meet-you"],
    ["copula-desu"],
  ),
  example(
    "capstones-self-introduction-changed",
    [w("しゅっしん"), p("は"), k("イタリア", "いたりあ"), e("です"), stop(), w("にほんご"), p("を"), w("はなし"), e("ます")],
    ["origin", "italy", "japanese-language", "speak"],
    ["topic-wa", "object-o"],
  ),
  example(
    "capstones-self-introduction-say",
    [w("しごと"), p("を"), w("し"), e("ます"), stop(), w("えいご"), p("が"), w("わかり"), e("ます"), p("か")],
    ["job", "do", "english-language", "understand"],
    ["object-o", "subject-ga"],
  ),
  example(
    "capstones-self-introduction-r1",
    [w("いえ"), p("に"), w("すみ"), e("ます"), stop(), w("かぞく"), p("が"), w("い"), e("ます")],
    ["house", "live", "family", "exist-animate"],
    ["destination-ni", "existence-imasu"],
  ),
  example(
    "capstones-self-introduction-r2",
    [w("ともだち"), p("と"), w("あい"), e("ます"), stop(), w("にほんご"), p("を"), w("ならい"), e("ます")],
    ["friend", "meet", "japanese-language", "learn"],
    ["companion-to", "object-o"],
  ),
  example(
    "capstones-self-introduction-r3",
    [w("にほんご"), p("を"), w("べんきょうし"), e("たいです"), stop(), w("えいご"), p("は"), w("はなし"), e("ません")],
    ["japanese-language", "study", "english-language", "speak"],
    ["desire-tai", "negative-masen", "object-o", "topic-wa"],
  ),
  example(
    "capstones-everyday-outing-base",
    [k("バス", "ばす"), p("に"), w("のり"), e("ます"), stop(), w("まち"), p("へ"), w("いき"), e("ます")],
    ["bus", "board", "town", "go"],
    ["destination-ni", "direction-e"],
  ),
  example(
    "capstones-everyday-outing-changed",
    [k("レストラン", "れすとらん"), p("で"), w("ともだち"), p("と"), w("ごはん"), p("を"), w("たべ"), e("ます")],
    ["restaurant", "friend", "rice-meal", "eat"],
    ["location-de", "companion-to"],
  ),
  example(
    "capstones-everyday-outing-say",
    [k("コンビニ", "こんびに"), p("で"), w("くだもの"), p("を"), w("かい"), e("ます"), stop(), w("いえ"), p("へ"), w("かえり"), e("ます")],
    ["convenience-store", "fruit", "buy", "house", "return"],
    ["location-de", "direction-e"],
  ),
  example(
    "capstones-everyday-outing-r1",
    [w("こうえん"), p("を"), w("あるき"), e("ます"), stop(), w("しゃしん"), p("を"), w("とり"), e("ます")],
    ["park", "walk", "photo", "take"],
    ["object-o", "polite-masu"],
  ),
  example(
    "capstones-everyday-outing-r2",
    [w("えき"), p("で"), w("ともだち"), p("を"), w("まち"), e("ます"), stop(), w("えいが"), p("を"), w("み"), e("ましょう")],
    ["station", "friend", "wait", "movie", "watch"],
    ["object-o", "volitional-mashou"],
  ),
  example(
    "capstones-everyday-outing-r3",
    [w("おんがく"), p("を"), w("き"), e("ます"), stop(), w("ともだち"), p("に"), w("でんわ"), p("を"), w("かけ"), e("ます")],
    ["music", "listen", "friend", "telephone", "call"],
    ["object-o", "person-ni"],
  ),
  example(
    "capstones-everyday-outing-r4",
    [w("でんしゃ"), p("は"), k("タクシー", "たくしー"), p("より"), w("やすい"), e("です"), stop(), w("えいが"), p("は"), w("たのしかった"), e("です")],
    ["train", "taxi", "cheap", "movie", "fun"],
    ["comparison", "adjective-past", "topic-wa"],
  ),
  example(
    "capstones-everyday-outing-r5",
    [w("しゃしん"), p("を"), w("とり"), e("ましょうか")],
    ["photo", "take"],
    ["offer-mashouka", "object-o"],
  ),
  example(
    "capstones-travel-day-base",
    [w("くうこう"), p("で"), w("ひこうき"), p("に"), w("のり"), e("ます"), stop(), w("えき"), p("で"), w("でんしゃ"), p("を"), w("おり"), e("ます")],
    ["airport", "airplane", "board", "station", "train", "alight"],
    ["location-de", "destination-ni"],
  ),
  example(
    "capstones-travel-day-changed",
    [w("みち"), p("を"), w("きき"), e("ます"), stop(), w("ちず"), p("が"), w("いり"), e("ます")],
    ["road", "ask", "map", "need"],
    ["object-o", "needs"],
  ),
  example(
    "capstones-travel-day-say",
    [k("ホテル", "ほてる"), p("で"), k("パスポート", "ぱすぽーと"), p("を"), w("つかい"), e("ます"), stop(), k("ドア", "どあ"), p("を"), w("あけ"), e("ます")],
    ["hotel", "passport", "use", "door", "open"],
    ["location-de", "object-o"],
  ),
  example(
    "capstones-travel-day-r1",
    [w("かさ"), p("を"), w("かり"), e("ます"), stop(), w("かばん"), p("を"), w("もち"), e("ます")],
    ["umbrella", "borrow", "bag", "carry"],
    ["object-o", "polite-masu"],
  ),
  example(
    "capstones-travel-day-r2",
    [k("ホテル", "ほてる"), p("に"), w("はいり"), e("ます"), stop(), w("まど"), p("を"), w("しめ"), e("ます")],
    ["hotel", "enter", "window", "close"],
    ["destination-ni", "object-o"],
  ),
  example(
    "capstones-travel-day-r3",
    [w("いえ"), p("へ"), w("かえり"), e("ます"), stop(), w("ともだち"), p("に"), k("メール", "めーる"), p("を"), w("かき"), e("ます")],
    ["house", "return", "friend", "email", "write"],
    ["direction-e", "person-ni"],
  ),
  example(
    "capstones-travel-day-r4",
    [w("きっぷ"), p("を"), e("ください"), stop(), w("みち"), p("が"), w("わかり"), e("ませんでした")],
    ["ticket", "road", "understand"],
    ["request-kudasai", "past-negative-masendeshita", "subject-ga"],
  ),
];

/** The immutable, order-stable curriculum example catalog. */
export const curriculumExamples: readonly CurriculumExampleEntry[] =
  Object.freeze(list);

/** Stable index for reference resolution and speech-prompt segment lookup. */
export const curriculumExamplesById: ReadonlyMap<
  ExampleId,
  CurriculumExampleEntry
> = new Map(curriculumExamples.map((entry) => [entry.id, entry]));

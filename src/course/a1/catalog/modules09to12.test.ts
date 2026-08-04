/**
 * A1 Modules 9–12 — deep authoring gate + release synthesis (Phase 2, Task 4).
 *
 * The authoring contract for descriptions (M9), shopping (M10), existence &
 * needs (M11) and the four capstone synthesis scenarios (M12). It assembles the
 * full release catalog (modules 2–12) wired with the recurrence-complete
 * release verb-use records, realizes every Module 9–12 instructional variant,
 * and asserts:
 *   • every realized sentence's exact natural Japanese + rōmaji (full 208-row
 *     table), rendered through the shared production formatter;
 *   • adjective morphology (i-/na-, present/past × affirmative/negative) is
 *     produced *generically from sense metadata* by the realizer — proven by
 *     conjugating the same authored sense through all four form cells — never a
 *     hard-coded Japanese string;
 *   • counter/price readings & particles, the standalone `… を ください`
 *     boundary, existence あります/います animacy + position frames, and the
 *     `… が ほしい/すき です` object-subject case are exact and natural;
 *   • per-lesson metrics (8 models / 5 transfers / 4 selected exercises,
 *     ≥3 predicate senses, ≥3 discourse roles, ≥2 contexts, ≥5 unique visible
 *     targets, reuse ≤2, ≥2 constructing transfers) in EN and IT;
 *   • the four capstones introduce NO new content — every value, sense,
 *     concept, form, role and context is drawn from the modules 1–11 prior set;
 *   • the 37-record release recurrence table (each sense reused ≥2× later);
 *   • bilingual copy parity/coverage with no Japanese and no cert language;
 *   • a Modules 2–8 realization regression (prior content unchanged).
 */

import { describe, expect, it } from "vitest";

import {
  a1SentenceFamilies,
  a1Contexts,
  a1PersonRoles,
  a1Referents,
  a1SemanticValues,
  a1LearningTargetSenses,
  assembleA1FoundationCatalogs,
} from "./shared";
import { module2Lessons } from "./module02Introductions";
import { module3Lessons } from "./module03Questions";
import { module4Lessons } from "./module04Actions";
import { module5Lessons } from "./module05Routines";
import { module6Lessons } from "./module06TensePolarity";
import { module7Lessons } from "./module07Places";
import { module8Lessons } from "./module08People";
import { module9Lessons } from "./module09Descriptions";
import { module10Lessons } from "./module10Shopping";
import { module11Lessons } from "./module11ExistenceNeeds";
import { module12Lessons } from "./module12Capstones";
import { a1ReleaseVerbUseRecords } from "./recurrence";
import { a1CopyEn } from "../copy/en";
import { a1CopyIt } from "../copy/it";
import { realizeVariant } from "../../foundations/realizeFamily";
import { buildLessonViewModel } from "../../foundations/buildLessonViewModel";
import type { SentenceVariant, SentenceFamily } from "../../foundations/types";
import { formatRomaji } from "../../../romaji/formatRomaji";
import type { AssembledToken } from "../../../romaji/types";

// ---------------------------------------------------------------------------
// Assemble ONE release catalog from every instructional lesson (modules 2–12),
// wired with the release verb-use records so intro + capstone reuses resolve.
// ---------------------------------------------------------------------------

const priorBuilt = [
  ...module2Lessons,
  ...module3Lessons,
  ...module4Lessons,
  ...module5Lessons,
  ...module6Lessons,
  ...module7Lessons,
  ...module8Lessons,
];
const newBuilt = [
  ...module9Lessons,
  ...module10Lessons,
  ...module11Lessons,
  ...module12Lessons,
];
const instructionalBuilt = [...priorBuilt, ...newBuilt];
const allVariants: SentenceVariant[] = instructionalBuilt.flatMap((b) => [...b.variants]);

const catalogs = assembleA1FoundationCatalogs({
  lessons: instructionalBuilt.map((b) => b.recipe),
  variants: allVariants,
  verbUseRecords: a1ReleaseVerbUseRecords,
});
const copy = { en: a1CopyEn, it: a1CopyIt };

const famById = new Map<string, SentenceFamily>(a1SentenceFamilies.map((f) => [f.id, f]));
const realizeCatalogs = {
  contexts: a1Contexts,
  personRoles: a1PersonRoles,
  referents: a1Referents,
  semanticValues: a1SemanticValues,
  learningTargetSenses: a1LearningTargetSenses,
};

function realize(variant: SentenceVariant) {
  const fam = famById.get(variant.sentenceFamilyId);
  expect(fam, `family ${variant.sentenceFamilyId}`).toBeDefined();
  const r = realizeVariant(fam as SentenceFamily, variant, realizeCatalogs, {
    availableConceptIds: [...(fam as SentenceFamily).requiredConceptIds],
  });
  if (!r.ok) {
    throw new Error(`realize ${variant.id} failed: ${JSON.stringify(r.errors)}`);
  }
  return r.sentence;
}

const romajiOf = (tokens: readonly AssembledToken[]): string => {
  const result = formatRomaji(tokens);
  if (!result.ok) {
    throw new Error(`formatRomaji failed: ${JSON.stringify(result.errors)}`);
  }
  return result.text;
};

const variantById = new Map(allVariants.map((v) => [v.id, v]));
const jpOf = (id: string): string => realize(variantById.get(id) as SentenceVariant).canonicalJapanese;
const romajiFor = (id: string): string => romajiOf(realize(variantById.get(id) as SentenceVariant).tokens);

// ---------------------------------------------------------------------------
// 1. The exact realized-sentence table — every Modules 9–12 variant.
// [variantId, canonicalJapanese, rōmaji]. Authored from realized output and
// re-verified on every run through the shared formatter.
// ---------------------------------------------------------------------------

const EXPECTED_SENTENCES: readonly (readonly [string, string, string])[] = [
  ["descriptions-1-m1", "きょうはあついです", "kyou wa atsui desu"],
  ["descriptions-1-m2", "あついです", "atsui desu"],
  ["descriptions-1-m3", "このひとはしずかです", "kono hito wa shizuka desu"],
  ["descriptions-1-m4", "しずかです", "shizuka desu"],
  ["descriptions-1-m5", "まちはしずかです", "machi wa shizuka desu"],
  ["descriptions-1-m6", "しずかです", "shizuka desu"],
  ["descriptions-1-m7", "きょうはさむいです", "kyou wa samui desu"],
  ["descriptions-1-m8", "きょうはあついです", "kyou wa atsui desu"],
  ["descriptions-1-t1", "まちはあついです", "machi wa atsui desu"],
  ["descriptions-1-t2", "まちはさむいです", "machi wa samui desu"],
  ["descriptions-1-t3", "きょうはしずかです", "kyou wa shizuka desu"],
  ["descriptions-1-t4", "あついです", "atsui desu"],
  ["descriptions-1-t5", "まちはしずかです", "machi wa shizuka desu"],
  ["descriptions-2-m1", "わたしはコーヒーがすきです", "watashi wa koohii ga suki desu"],
  ["descriptions-2-m2", "すしがすきです", "sushi ga suki desu"],
  ["descriptions-2-m3", "ゆきはねこがすきです", "yuki wa neko ga suki desu"],
  ["descriptions-2-m4", "りんごがすきです", "ringo ga suki desu"],
  ["descriptions-2-m5", "わたしはみずがきらいです", "watashi wa mizu ga kirai desu"],
  ["descriptions-2-m6", "いぬがきらいです", "inu ga kirai desu"],
  ["descriptions-2-m7", "けんはばんがすきです", "ken wa ban ga suki desu"],
  ["descriptions-2-m8", "きょうはあついです", "kyou wa atsui desu"],
  ["descriptions-2-t1", "わたしはねこがすきです", "watashi wa neko ga suki desu"],
  ["descriptions-2-t2", "すしがきらいです", "sushi ga kirai desu"],
  ["descriptions-2-t3", "けんはコーヒーがすきです", "ken wa koohii ga suki desu"],
  ["descriptions-2-t4", "ばんがすきです", "ban ga suki desu"],
  ["descriptions-2-t5", "わたしはねこがきらいです", "watashi wa neko ga kirai desu"],
  ["descriptions-3-m1", "ねこはりんごよりおおきいです", "neko wa ringo yori ookii desu"],
  ["descriptions-3-m2", "それよりおおきいです", "sore yori ookii desu"],
  ["descriptions-3-m3", "ほんはかばんよりちいさいです", "hon wa kaban yori chiisai desu"],
  ["descriptions-3-m4", "かばんよりちいさいです", "kaban yori chiisai desu"],
  ["descriptions-3-m5", "まちはあれよりさむいです", "machi wa are yori samui desu"],
  ["descriptions-3-m6", "あれよりさむいです", "are yori samui desu"],
  ["descriptions-3-m7", "いぬはかばんよりおおきいです", "inu wa kaban yori ookii desu"],
  ["descriptions-3-m8", "ペンはみかんよりちいさいです", "pen wa mikan yori chiisai desu"],
  ["descriptions-3-t1", "ほんはりんごよりおおきいです", "hon wa ringo yori ookii desu"],
  ["descriptions-3-t2", "ペンはかばんよりちいさいです", "pen wa kaban yori chiisai desu"],
  ["descriptions-3-t3", "まちはそれよりさむいです", "machi wa sore yori samui desu"],
  ["descriptions-3-t4", "みかんよりちいさいです", "mikan yori chiisai desu"],
  ["descriptions-3-t5", "ペンはみかんよりちいさいです", "pen wa mikan yori chiisai desu"],
  ["descriptions-4-m1", "きょうはあついです", "kyou wa atsui desu"],
  ["descriptions-4-m2", "さむいです", "samui desu"],
  ["descriptions-4-m3", "まちはしずかです", "machi wa shizuka desu"],
  ["descriptions-4-m4", "まちはおおきいです", "machi wa ookii desu"],
  ["descriptions-4-m5", "まちはちいさいです", "machi wa chiisai desu"],
  ["descriptions-4-m6", "きょうはしずかです", "kyou wa shizuka desu"],
  ["descriptions-4-m7", "あついです", "atsui desu"],
  ["descriptions-4-m8", "まちはしずかです", "machi wa shizuka desu"],
  ["descriptions-4-t1", "きょうはさむいです", "kyou wa samui desu"],
  ["descriptions-4-t2", "まちはおおきいです", "machi wa ookii desu"],
  ["descriptions-4-t3", "まちはちいさいです", "machi wa chiisai desu"],
  ["descriptions-4-t4", "ちいさいです", "chiisai desu"],
  ["descriptions-4-t5", "まちはさむいです", "machi wa samui desu"],
  ["shopping-1-m1", "ほんはたかいです", "hon wa takai desu"],
  ["shopping-1-m2", "たかいです", "takai desu"],
  ["shopping-1-m3", "ペンはやすいです", "pen wa yasui desu"],
  ["shopping-1-m4", "やすいです", "yasui desu"],
  ["shopping-1-m5", "ほんはひゃくえんです", "hon wa hyaku en desu"],
  ["shopping-1-m6", "かぎはごひゃくえんです", "kagi wa gohyaku en desu"],
  ["shopping-1-m7", "かぎはたかいです", "kagi wa takai desu"],
  ["shopping-1-m8", "ペンはひゃくえんです", "pen wa hyaku en desu"],
  ["shopping-1-t1", "ペンはたかいです", "pen wa takai desu"],
  ["shopping-1-t2", "ほんはやすいです", "hon wa yasui desu"],
  ["shopping-1-t3", "かぎはひゃくえんです", "kagi wa hyaku en desu"],
  ["shopping-1-t4", "ほんはごひゃくえんです", "hon wa gohyaku en desu"],
  ["shopping-1-t5", "かぎはやすいです", "kagi wa yasui desu"],
  ["shopping-2-m1", "わたしはりんごをみっつかいます", "watashi wa ringo o mittsu kaimasu"],
  ["shopping-2-m2", "りんごをふたつかいます", "ringo o futatsu kaimasu"],
  ["shopping-2-m3", "ゆきはみかんをいつつかいます", "yuki wa mikan o itsutsu kaimasu"],
  ["shopping-2-m4", "きっぷをひとつかいます", "kippu o hitotsu kaimasu"],
  ["shopping-2-m5", "けんはコーヒーをひとつのみます", "ken wa koohii o hitotsu nomimasu"],
  ["shopping-2-m6", "すしをよっつたべます", "sushi o yottsu tabemasu"],
  ["shopping-2-m7", "みなはりんごをひとつたべます", "mina wa ringo o hitotsu tabemasu"],
  ["shopping-2-m8", "わたしはきっぷをふたつかいます", "watashi wa kippu o futatsu kaimasu"],
  ["shopping-2-t1", "わたしはみかんをふたつかいます", "watashi wa mikan o futatsu kaimasu"],
  ["shopping-2-t2", "りんごをいつつたべます", "ringo o itsutsu tabemasu"],
  ["shopping-2-t3", "ゆきはきっぷをふたつかいます", "yuki wa kippu o futatsu kaimasu"],
  ["shopping-2-t4", "きっぷをみっつかいます", "kippu o mittsu kaimasu"],
  ["shopping-2-t5", "けんはすしをひとつたべます", "ken wa sushi o hitotsu tabemasu"],
  ["shopping-3-m1", "みずをください", "mizu o kudasai"],
  ["shopping-3-m2", "りんごをみっつください", "ringo o mittsu kudasai"],
  ["shopping-3-m3", "コーヒーをください", "koohii o kudasai"],
  ["shopping-3-m4", "きっぷをふたつください", "kippu o futatsu kudasai"],
  ["shopping-3-m5", "ほんはたかいです", "hon wa takai desu"],
  ["shopping-3-m6", "みかんをいつつください", "mikan o itsutsu kudasai"],
  ["shopping-3-m7", "ほんはひゃくえんです", "hon wa hyaku en desu"],
  ["shopping-3-m8", "ペンはやすいです", "pen wa yasui desu"],
  ["shopping-3-t1", "みかんをください", "mikan o kudasai"],
  ["shopping-3-t2", "コーヒーをふたつください", "koohii o futatsu kudasai"],
  ["shopping-3-t3", "ペンはたかいです", "pen wa takai desu"],
  ["shopping-3-t4", "りんごをください", "ringo o kudasai"],
  ["shopping-3-t5", "ほんはやすいです", "hon wa yasui desu"],
  ["shopping-4-m1", "りんごをみっつください", "ringo o mittsu kudasai"],
  ["shopping-4-m2", "わたしはみかんをふたつかいます", "watashi wa mikan o futatsu kaimasu"],
  ["shopping-4-m3", "ほんはたかいです", "hon wa takai desu"],
  ["shopping-4-m4", "みずをください", "mizu o kudasai"],
  ["shopping-4-m5", "きっぷをふたつかいます", "kippu o futatsu kaimasu"],
  ["shopping-4-m6", "ほんはひゃくえんです", "hon wa hyaku en desu"],
  ["shopping-4-m7", "ゆきはコーヒーをひとつのみます", "yuki wa koohii o hitotsu nomimasu"],
  ["shopping-4-m8", "ペンはやすいです", "pen wa yasui desu"],
  ["shopping-4-t1", "みかんをください", "mikan o kudasai"],
  ["shopping-4-t2", "わたしはりんごをふたつかいます", "watashi wa ringo o futatsu kaimasu"],
  ["shopping-4-t3", "ペンはたかいです", "pen wa takai desu"],
  ["shopping-4-t4", "コーヒーをください", "koohii o kudasai"],
  ["shopping-4-t5", "ほんはやすいです", "hon wa yasui desu"],
  ["existence-needs-1-m1", "ほんがあります", "hon ga arimasu"],
  ["existence-needs-1-m2", "ほんがつくえのうえにあります", "hon ga tsukue no ue ni arimasu"],
  ["existence-needs-1-m3", "ねこがいます", "neko ga imasu"],
  ["existence-needs-1-m4", "ねこがいすのしたにいます", "neko ga isu no shita ni imasu"],
  ["existence-needs-1-m5", "かぎがあります", "kagi ga arimasu"],
  ["existence-needs-1-m6", "いぬがいます", "inu ga imasu"],
  ["existence-needs-1-m7", "まちはおおきいです", "machi wa ookii desu"],
  ["existence-needs-1-m8", "こどもがいます", "kodomo ga imasu"],
  ["existence-needs-1-t1", "ほんがいすのしたにあります", "hon ga isu no shita ni arimasu"],
  ["existence-needs-1-t2", "ねこがつくえのうえにいます", "neko ga tsukue no ue ni imasu"],
  ["existence-needs-1-t3", "かぎがつくえのうえにあります", "kagi ga tsukue no ue ni arimasu"],
  ["existence-needs-1-t4", "いぬがいすのしたにいます", "inu ga isu no shita ni imasu"],
  ["existence-needs-1-t5", "こどもがいすのしたにいます", "kodomo ga isu no shita ni imasu"],
  ["existence-needs-2-m1", "ほんがつくえのうえにあります", "hon ga tsukue no ue ni arimasu"],
  ["existence-needs-2-m2", "ペンがかばんのなかにあります", "pen ga kaban no naka ni arimasu"],
  ["existence-needs-2-m3", "ねこがいすのしたにいます", "neko ga isu no shita ni imasu"],
  ["existence-needs-2-m4", "いぬがえきのちかくにいます", "inu ga eki no chikaku ni imasu"],
  ["existence-needs-2-m5", "かぎがかばんのなかにあります", "kagi ga kaban no naka ni arimasu"],
  ["existence-needs-2-m6", "こどもがえきのちかくにいます", "kodomo ga eki no chikaku ni imasu"],
  ["existence-needs-2-m7", "へやはおおきいです", "heya wa ookii desu"],
  ["existence-needs-2-m8", "まちはしずかです", "machi wa shizuka desu"],
  ["existence-needs-2-t1", "ペンがつくえのうえにあります", "pen ga tsukue no ue ni arimasu"],
  ["existence-needs-2-t2", "ほんがかばんのなかにあります", "hon ga kaban no naka ni arimasu"],
  ["existence-needs-2-t3", "ねこがえきのちかくにいます", "neko ga eki no chikaku ni imasu"],
  ["existence-needs-2-t4", "いぬがいすのしたにいます", "inu ga isu no shita ni imasu"],
  ["existence-needs-2-t5", "かぎがつくえのうえにあります", "kagi ga tsukue no ue ni arimasu"],
  ["existence-needs-3-m1", "わたしはおかねがほしいです", "watashi wa okane ga hoshii desu"],
  ["existence-needs-3-m2", "みずがほしいです", "mizu ga hoshii desu"],
  ["existence-needs-3-m3", "ゆきはきっぷがほしいです", "yuki wa kippu ga hoshii desu"],
  ["existence-needs-3-m4", "わたしはりんごがほしいです", "watashi wa ringo ga hoshii desu"],
  ["existence-needs-3-m5", "わたしはコーヒーがすきです", "watashi wa koohii ga suki desu"],
  ["existence-needs-3-m6", "けんはすしがすきです", "ken wa sushi ga suki desu"],
  ["existence-needs-3-m7", "わたしはみずがきらいです", "watashi wa mizu ga kirai desu"],
  ["existence-needs-3-m8", "ほんがあります", "hon ga arimasu"],
  ["existence-needs-3-t1", "わたしはきっぷがほしいです", "watashi wa kippu ga hoshii desu"],
  ["existence-needs-3-t2", "コーヒーがほしいです", "koohii ga hoshii desu"],
  ["existence-needs-3-t3", "ゆきはりんごがすきです", "yuki wa ringo ga suki desu"],
  ["existence-needs-3-t4", "わたしはすしがきらいです", "watashi wa sushi ga kirai desu"],
  ["existence-needs-3-t5", "わたしはおかねがすきです", "watashi wa okane ga suki desu"],
  ["existence-needs-4-m1", "ほんがつくえのうえにあります", "hon ga tsukue no ue ni arimasu"],
  ["existence-needs-4-m2", "ねこがいすのしたにいます", "neko ga isu no shita ni imasu"],
  ["existence-needs-4-m3", "わたしはきっぷがほしいです", "watashi wa kippu ga hoshii desu"],
  ["existence-needs-4-m4", "かぎがかばんのなかにあります", "kagi ga kaban no naka ni arimasu"],
  ["existence-needs-4-m5", "いぬがえきのちかくにいます", "inu ga eki no chikaku ni imasu"],
  ["existence-needs-4-m6", "わたしはおかねがほしいです", "watashi wa okane ga hoshii desu"],
  ["existence-needs-4-m7", "へやはおおきいです", "heya wa ookii desu"],
  ["existence-needs-4-m8", "こどもがいます", "kodomo ga imasu"],
  ["existence-needs-4-t1", "ほんがかばんのなかにあります", "hon ga kaban no naka ni arimasu"],
  ["existence-needs-4-t2", "ねこがえきのちかくにいます", "neko ga eki no chikaku ni imasu"],
  ["existence-needs-4-t3", "かぎがつくえのうえにあります", "kagi ga tsukue no ue ni arimasu"],
  ["existence-needs-4-t4", "いぬがいすのしたにいます", "inu ga isu no shita ni imasu"],
  ["existence-needs-4-t5", "こどもがえきのちかくにいます", "kodomo ga eki no chikaku ni imasu"],
  ["capstones-1-m1", "がくせいです", "gakusei desu"],
  ["capstones-1-m2", "イタリアじんです", "itariajin desu"],
  ["capstones-1-m3", "にほんごをべんきょうします", "nihongo o benkyoushimasu"],
  ["capstones-1-m4", "へやはおおきいです", "heya wa ookii desu"],
  ["capstones-1-m5", "まちはちいさいです", "machi wa chiisai desu"],
  ["capstones-1-m6", "にほんごがわかります", "nihongo ga wakarimasu"],
  ["capstones-1-m7", "なにをしますか", "nani o shimasu ka"],
  ["capstones-1-m8", "なにがわかりますか", "nani ga wakarimasu ka"],
  ["capstones-1-t1", "おおきいです", "ookii desu"],
  ["capstones-1-t2", "なにをべんきょうしますか", "nani o benkyoushimasu ka"],
  ["capstones-1-t3", "ちいさいです", "chiisai desu"],
  ["capstones-1-t4", "イタリアじんですか", "itariajin desu ka"],
  ["capstones-1-t5", "にほんごがわかりますか", "nihongo ga wakarimasu ka"],
  ["capstones-2-m1", "しちじにおきます", "shichiji ni okimasu"],
  ["capstones-2-m2", "ほんはたかいです", "hon wa takai desu"],
  ["capstones-2-m3", "ペンはやすいです", "pen wa yasui desu"],
  ["capstones-2-m4", "けんはレストランではたらきます", "ken wa resutoran de hatarakimasu"],
  ["capstones-2-m5", "きっぷをふたつください", "kippu o futatsu kudasai"],
  ["capstones-2-m6", "わたしはコーヒーがすきです", "watashi wa koohii ga suki desu"],
  ["capstones-2-m7", "わたしはりんごをみっつかいます", "watashi wa ringo o mittsu kaimasu"],
  ["capstones-2-m8", "コーヒーをください", "koohii o kudasai"],
  ["capstones-2-t1", "けんはしちじにおきます", "ken wa shichiji ni okimasu"],
  ["capstones-2-t2", "やすいです", "yasui desu"],
  ["capstones-2-t3", "レストランではたらきます", "resutoran de hatarakimasu"],
  ["capstones-2-t4", "けんはコーヒーがすきです", "ken wa koohii ga suki desu"],
  ["capstones-2-t5", "けんはりんごをみっつかいます", "ken wa ringo o mittsu kaimasu"],
  ["capstones-3-m1", "えきにいきます", "eki ni ikimasu"],
  ["capstones-3-m2", "ゆきはみずがきらいです", "yuki wa mizu ga kirai desu"],
  ["capstones-3-m3", "でんしゃでえきにいきます", "densha de eki ni ikimasu"],
  ["capstones-3-m4", "かぎがえきのちかくにあります", "kagi ga eki no chikaku ni arimasu"],
  ["capstones-3-m5", "とうきょうからおおさかまでいきます", "toukyou kara oosaka made ikimasu"],
  ["capstones-3-m6", "いぬがえきのちかくにいます", "inu ga eki no chikaku ni imasu"],
  ["capstones-3-m7", "えきはどこですか", "eki wa doko desu ka"],
  ["capstones-3-m8", "わたしはきっぷがほしいです", "watashi wa kippu ga hoshii desu"],
  ["capstones-3-t1", "わたしはみずがきらいです", "watashi wa mizu ga kirai desu"],
  ["capstones-3-t2", "かぎがあります", "kagi ga arimasu"],
  ["capstones-3-t3", "いぬがいます", "inu ga imasu"],
  ["capstones-3-t4", "ゆきはきっぷがほしいです", "yuki wa kippu ga hoshii desu"],
  ["capstones-3-t5", "ゆきはとうきょうからおおさかまでいきます", "yuki wa toukyou kara oosaka made ikimasu"],
  ["capstones-4-m1", "がくせいです", "gakusei desu"],
  ["capstones-4-m2", "イタリアじんです", "itariajin desu"],
  ["capstones-4-m3", "すしをたべます", "sushi o tabemasu"],
  ["capstones-4-m4", "にほんごをべんきょうします", "nihongo o benkyoushimasu"],
  ["capstones-4-m5", "きょうはあついです", "kyou wa atsui desu"],
  ["capstones-4-m6", "へやはさむいです", "heya wa samui desu"],
  ["capstones-4-m7", "まちはしずかです", "machi wa shizuka desu"],
  ["capstones-4-m8", "これはなんですか", "kore wa nan desu ka"],
  ["capstones-4-t1", "きょうはさむいです", "kyou wa samui desu"],
  ["capstones-4-t2", "へやはあついです", "heya wa atsui desu"],
  ["capstones-4-t3", "まちはさむいです", "machi wa samui desu"],
  ["capstones-4-t4", "きょうはしずかです", "kyou wa shizuka desu"],
  ["capstones-4-t5", "へやはしずかです", "heya wa shizuka desu"],
];

describe("A1 modules 9–12 · exact realized-sentence table", () => {
  it("realizes every Module 9–12 variant to its inspected JP + rōmaji", () => {
    expect(EXPECTED_SENTENCES.length).toBe(208);
    const covered = new Set<string>();
    for (const [variantId, expectedJp, expectedRomaji] of EXPECTED_SENTENCES) {
      const variant = variantById.get(variantId);
      expect(variant, variantId).toBeDefined();
      const sentence = realize(variant as SentenceVariant);
      expect(sentence.canonicalJapanese, variantId).toBe(expectedJp);
      expect(romajiOf(sentence.tokens), variantId).toBe(expectedRomaji);
      covered.add(variantId);
    }
    for (const built of newBuilt) {
      for (const v of built.variants) {
        expect(covered.has(v.id), `${v.id} missing from table`).toBe(true);
      }
    }
  });

  it("renders every table row's rōmaji through the shared formatter", () => {
    for (const [variantId, , expectedRomaji] of EXPECTED_SENTENCES) {
      expect(romajiFor(variantId), variantId).toBe(expectedRomaji);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Adjective morphology comes from sense metadata, not string switches.
// ---------------------------------------------------------------------------

describe("A1 modules 9–12 · adjective morphology (generic realizer)", () => {
  const conjugate = (baseId: string, polarity: "affirmative" | "negative", tense: "present" | "past") => {
    const base = variantById.get(baseId) as SentenceVariant;
    const variant: SentenceVariant = { ...base, id: `${base.id}-probe`, form: { ...base.form, polarity, tense } };
    const sentence = realize(variant);
    return { jp: sentence.canonicalJapanese, romaji: romajiOf(sentence.tokens) };
  };

  it("conjugates an i-adjective through all four polite form cells", () => {
    // descriptions-1-m1 = 今日は暑いです (i-adjective, adjectiveClass "i").
    expect(conjugate("descriptions-1-m1", "affirmative", "present")).toEqual({
      jp: "きょうはあついです",
      romaji: "kyou wa atsui desu",
    });
    expect(conjugate("descriptions-1-m1", "negative", "present")).toEqual({
      jp: "きょうはあつくないです",
      romaji: "kyou wa atsukunai desu",
    });
    expect(conjugate("descriptions-1-m1", "affirmative", "past")).toEqual({
      jp: "きょうはあつかったです",
      romaji: "kyou wa atsukatta desu",
    });
    expect(conjugate("descriptions-1-m1", "negative", "past")).toEqual({
      jp: "きょうはあつくなかったです",
      romaji: "kyou wa atsukunakatta desu",
    });
  });

  it("conjugates a na-adjective through the polite copula cells", () => {
    // descriptions-1-m5 = 町は静かです (na-adjective, adjectiveClass "na").
    expect(conjugate("descriptions-1-m5", "affirmative", "present")).toEqual({
      jp: "まちはしずかです",
      romaji: "machi wa shizuka desu",
    });
    expect(conjugate("descriptions-1-m5", "negative", "present")).toEqual({
      jp: "まちはしずかではありません",
      romaji: "machi wa shizuka dewa arimasen",
    });
    expect(conjugate("descriptions-1-m5", "affirmative", "past")).toEqual({
      jp: "まちはしずかでした",
      romaji: "machi wa shizuka deshita",
    });
    expect(conjugate("descriptions-1-m5", "negative", "past")).toEqual({
      jp: "まちはしずかではありませんでした",
      romaji: "machi wa shizuka dewa arimasen deshita",
    });
  });

  it("keeps the invariant です spaced off the i-adjective stem in every authored row", () => {
    // Authored A1 content is present-affirmative (A1-safe); the copula is always
    // its own spaced word (`atsui desu`), never fused onto the stem.
    for (const [variantId, , romaji] of EXPECTED_SENTENCES) {
      if (!variantId.startsWith("descriptions-1")) continue;
      expect(romaji.endsWith(" desu"), variantId).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Shopping: counters/prices, and the standalone を ください boundary.
// ---------------------------------------------------------------------------

describe("A1 modules 9–12 · counters, prices & polite requests", () => {
  it("reads prices with 円 as its own spaced word after the number", () => {
    expect(jpOf("shopping-1-m5")).toBe("ほんはひゃくえんです");
    expect(romajiFor("shopping-1-m5")).toBe("hon wa hyaku en desu");
    expect(jpOf("shopping-1-m6")).toBe("かぎはごひゃくえんです");
    expect(romajiFor("shopping-1-m6")).toBe("kagi wa gohyaku en desu");
  });

  it("attaches native counters directly and spaces を ください as a standalone request", () => {
    expect(jpOf("shopping-3-m1")).toBe("みずをください");
    expect(romajiFor("shopping-3-m1")).toBe("mizu o kudasai");
    expect(jpOf("shopping-3-m2")).toBe("りんごをみっつください");
    expect(romajiFor("shopping-3-m2")).toBe("ringo o mittsu kudasai");
  });

  it("marks the requested/bought item with を, never が/は", () => {
    for (const [variantId, , romaji] of EXPECTED_SENTENCES) {
      if (!romaji.endsWith(" kudasai")) continue;
      expect(romaji.includes(" o "), variantId).toBe(true);
      expect(romaji.includes(" ga "), variantId).toBe(false);
    }
  });

  it("uses countable purchase items instead of an uncountable quantity filler", () => {
    expect(jpOf("shopping-2-m4")).toBe("きっぷをひとつかいます");
    expect(romajiFor("shopping-2-m4")).toBe("kippu o hitotsu kaimasu");
  });
});

// ---------------------------------------------------------------------------
// 4. Existence: あります/います animacy, position frames, and が-marked wants.
// ---------------------------------------------------------------------------

describe("A1 modules 9–12 · existence, position & needs", () => {
  it("uses あります for inanimate and います for animate subjects", () => {
    expect(jpOf("existence-needs-1-m1")).toBe("ほんがあります");
    expect(romajiFor("existence-needs-1-m1")).toBe("hon ga arimasu");
    expect(jpOf("existence-needs-1-m3")).toBe("ねこがいます");
    expect(romajiFor("existence-needs-1-m3")).toBe("neko ga imasu");
  });

  it("realizes a location-relation frame with の <relation> に", () => {
    expect(jpOf("existence-needs-1-m2")).toBe("ほんがつくえのうえにあります");
    expect(romajiFor("existence-needs-1-m2")).toBe("hon ga tsukue no ue ni arimasu");
    expect(jpOf("existence-needs-1-m4")).toBe("ねこがいすのしたにいます");
    expect(romajiFor("existence-needs-1-m4")).toBe("neko ga isu no shita ni imasu");
  });

  it("marks the desired object of ほしい/すき with が, and the experiencer with は", () => {
    expect(jpOf("existence-needs-3-m5")).toBe("わたしはコーヒーがすきです");
    expect(romajiFor("existence-needs-3-m5")).toBe("watashi wa koohii ga suki desu");
    expect(jpOf("existence-needs-3-m1")).toBe("わたしはおかねがほしいです");
    expect(romajiFor("existence-needs-3-m1")).toBe("watashi wa okane ga hoshii desu");
  });

  it("marks the existing subject with が, never を", () => {
    for (const [variantId, , romaji] of EXPECTED_SENTENCES) {
      if (!(romaji.endsWith(" arimasu") || romaji.endsWith(" imasu"))) continue;
      expect(romaji.includes(" ga "), variantId).toBe(true);
      expect(romaji.includes(" o "), variantId).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Per-lesson authoring metrics (8 models / 5 transfers / 10 exercises).
// ---------------------------------------------------------------------------

const NEW_LESSON_IDS = newBuilt.map((b) => b.recipe.id);

describe("A1 modules 9–12 · lesson metrics", () => {
  it.each(NEW_LESSON_IDS)("%s satisfies the authoring depth contract", (lessonId) => {
    const built = newBuilt.find((b) => b.recipe.id === lessonId);
    expect(built, lessonId).toBeDefined();
    const b = built as (typeof newBuilt)[number];
    const models = b.variants.filter((v) => v.pedagogicalUse === "model");
    const transfers = b.variants.filter((v) => v.pedagogicalUse === "transfer");
    expect(models.length, `${lessonId} models`).toBe(8);
    expect(transfers.length, `${lessonId} transfers`).toBe(5);

    const modelSentences = models.map(realize);
    const transferSentences = transfers.map(realize);

    // ≥3 predicate senses, ≥3 discourse roles, ≥2 contexts across the models.
    const predicates = new Set(modelSentences.map((s) => s.predicateSenseId));
    const roles = new Set(models.map((v) => v.discourse.speakerRoleId));
    const contexts = new Set(models.map((v) => v.contextId));
    expect(predicates.size, `${lessonId} predicates`).toBeGreaterThanOrEqual(3);
    expect(roles.size, `${lessonId} roles`).toBeGreaterThanOrEqual(3);
    expect(contexts.size, `${lessonId} contexts`).toBeGreaterThanOrEqual(2);

    // ≥5 unique visible targets across all 13 variants, none reused >2×.
    const targetCounts = new Map<string, number>();
    for (const s of [...modelSentences, ...transferSentences]) {
      targetCounts.set(s.visibleTargetKey, (targetCounts.get(s.visibleTargetKey) ?? 0) + 1);
    }
    expect(targetCounts.size, `${lessonId} unique targets`).toBeGreaterThanOrEqual(5);
    expect(Math.max(...targetCounts.values()), `${lessonId} max reuse`).toBeLessThanOrEqual(2);

    // ≥2 constructing transfers: every transfer fingerprint is unseen among the
    // models (genuine controlled construction, not a model echo).
    const modelFingerprints = new Set(modelSentences.map((s) => s.semanticFingerprint));
    const constructing = transferSentences.filter((s) => !modelFingerprints.has(s.semanticFingerprint));
    expect(constructing.length, `${lessonId} constructing transfers`).toBeGreaterThanOrEqual(2);
    for (const s of transferSentences) {
      expect(modelFingerprints.has(s.semanticFingerprint), `${lessonId} transfer ${s.variantId}`).toBe(false);
    }

    // Every transfer recombines only pieces taught by this lesson's models.
    const modelPieces = new Set<string>();
    for (const s of modelSentences) modelPieces.add(s.predicateSenseId);
    for (const v of models) for (const value of Object.values(v.slotValues)) modelPieces.add(value);
    transferSentences.forEach((ts, i) => {
      expect(modelPieces.has(ts.predicateSenseId), `${lessonId} transfer predicate ${transfers[i].id}`).toBe(true);
      for (const value of Object.values(transfers[i].slotValues)) {
        expect(modelPieces.has(value), `${lessonId} transfer piece ${value} in ${transfers[i].id}`).toBe(true);
      }
    });

    // View-model selection yields exactly 4 exercises (2 + 2) in EN and IT.
    expect(b.recipe.practice.roundOne.targetCount).toBe(2);
    expect(b.recipe.practice.roundTwo.targetCount).toBe(2);
    for (const locale of ["en", "it"] as const) {
      const vm = buildLessonViewModel({
        catalogs,
        copy,
        lessonId,
        locale,
        catalogVersion: "a1-task4-test",
        seed: `seed-${lessonId}-${locale}`,
      });
      expect(vm.ok, vm.ok ? "" : `${lessonId} ${locale}: ${JSON.stringify((vm as { error: unknown }).error)}`).toBe(true);
      if (vm.ok) {
        expect(vm.model.rounds[0].targets.length).toBe(2);
        expect(vm.model.rounds[1].targets.length).toBe(2);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Capstones introduce NO new content beyond modules 1–11.
// ---------------------------------------------------------------------------

describe("A1 modules 9–12 · capstone no-new-content synthesis", () => {
  const isCapstone = (id: string) => id.startsWith("capstones-");
  const formKey = (form: SentenceVariant["form"]) =>
    `${form.polarity}:${form.tense}:${form.formality}${form.interrogative ? ":interrogative" : ""}`;

  it("draws every capstone value, sense, concept, form, role & context from prior modules", () => {
    const prior = {
      value: new Set<string>(),
      sense: new Set<string>(),
      concept: new Set<string>(),
      form: new Set<string>(),
      role: new Set<string>(),
      context: new Set<string>(),
    };
    const capstones: SentenceVariant[] = [];
    for (const v of allVariants) {
      if (isCapstone(v.id)) {
        capstones.push(v);
        continue;
      }
      const s = realize(v);
      for (const value of Object.values(v.slotValues)) prior.value.add(value);
      prior.form.add(formKey(v.form));
      prior.role.add(v.discourse.speakerRoleId);
      if (v.discourse.addresseeRoleId) prior.role.add(v.discourse.addresseeRoleId);
      prior.context.add(v.contextId);
      for (const id of s.usedLexemeSenseIds) prior.sense.add(id);
      for (const id of s.usedConceptIds) prior.concept.add(id);
    }
    expect(capstones.length).toBe(52);

    const introduced: string[] = [];
    for (const v of capstones) {
      const s = realize(v);
      for (const value of Object.values(v.slotValues)) if (!prior.value.has(value)) introduced.push(`${v.id}:value:${value}`);
      if (!prior.form.has(formKey(v.form))) introduced.push(`${v.id}:form:${formKey(v.form)}`);
      if (!prior.role.has(v.discourse.speakerRoleId)) introduced.push(`${v.id}:role:${v.discourse.speakerRoleId}`);
      if (!prior.context.has(v.contextId)) introduced.push(`${v.id}:context:${v.contextId}`);
      for (const id of s.usedLexemeSenseIds) if (!prior.sense.has(id)) introduced.push(`${v.id}:sense:${id}`);
      for (const id of s.usedConceptIds) if (!prior.concept.has(id)) introduced.push(`${v.id}:concept:${id}`);
    }
    expect(introduced, `capstones introduced new content: ${introduced.join(", ")}`).toEqual([]);
  });

  it("capstone-4 changes subject-referent topic exactly once across its 8 models", () => {
    // A genuine topic change is a single transition in *what is being talked
    // about* across the ordered models — not merely "some Japanese was
    // realized" (which every variant trivially satisfies). We read the
    // authored subject-referent sequence directly off discourse metadata and
    // count referent transitions between consecutive models.
    const ids = Array.from({ length: 8 }, (_, i) => `capstones-4-m${i + 1}`);
    const referents = ids.map((id) => (variantById.get(id) as SentenceVariant).discourse.subjectReferentId);
    expect(referents.every((r) => r !== null), "capstones-4 models all have a subject referent").toBe(true);
    let transitions = 0;
    for (let i = 1; i < referents.length; i += 1) {
      if (referents[i] !== referents[i - 1]) transitions += 1;
    }
    expect(transitions, `capstones-4 referent sequence: ${referents.join(" -> ")}`).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 6b. Each capstone must synthesize its *required whole-level scenario* —
// the real spec-review fix (B1/B2): wrong scenarios (a shopping remix, a
// home/weather remix, a finding-things-at-home remix, a café topic change
// drawing only on Modules 9-11) must not satisfy these checks. Coverage is
// asserted on stable semantic metadata (family ids, referents, slot values,
// interrogative mood, discourse roles) — never on localized prose — so the
// checks cannot be satisfied by superficially plausible but wrong content.
// ---------------------------------------------------------------------------

describe("A1 modules 9–12 · capstone required scenario coverage", () => {
  const idsFor = (lessonId: string, use: "model" | "transfer") =>
    allVariants.filter((v) => v.id.startsWith(`${lessonId}-${use === "model" ? "m" : "t"}`));
  const familiesOf = (variants: readonly SentenceVariant[]) =>
    new Set(variants.map((v) => v.sentenceFamilyId));

  const COP = "a1-family-topic-copular";
  const OBJ = "a1-family-object-action";
  const NOM = "a1-family-nominative-action";
  const LOCF = "a1-family-location-action";
  const DIR = "a1-family-direction-action";
  const TRANS = "a1-family-transport-action";
  const ROUTE = "a1-family-route-action";
  const SCHED = "a1-family-schedule-action";
  const ADV = "a1-family-adverbial-time-action";
  const PREF = "a1-family-preference";
  const QUANT = "a1-family-quantified-action";
  const REQ = "a1-family-request";
  const DESC = "a1-family-description";
  const SELF = "a1-referent-self";
  const THING = "a1-referent-thing";
  const LEARNER = "a1-role-learner";

  it("capstones-1 synthesizes self-introduction plus a reciprocal question", () => {
    const models = idsFor("capstones-1", "model");
    const transfers = idsFor("capstones-1", "transfer");
    const all = [...models, ...transfers];
    const families = familiesOf(models);
    // Self-introduction: identity (copular) and at least one further
    // predicated fact about the learner (object/nominative-action).
    expect(families.has(COP), "capstones-1 uses topic-copular (identity)").toBe(true);
    expect(families.has(OBJ) || families.has(NOM), "capstones-1 predicates a fact about self").toBe(true);
    const selfModels = models.filter((v) => v.discourse.subjectReferentId === SELF);
    expect(selfModels.length, "capstones-1 self-referent models").toBeGreaterThanOrEqual(4);
    // Reciprocal question: someone other than the learner asks the learner an
    // interrogative *about the learner themself* (self-referent), the exact
    // pattern a real self-introduction exchange requires and B2 found absent.
    const reciprocal = all.filter(
      (v) =>
        v.form.interrogative === true &&
        v.discourse.subjectReferentId === SELF &&
        v.discourse.addresseeRoleId === LEARNER &&
        v.discourse.speakerRoleId !== LEARNER,
    );
    expect(reciprocal.length, "capstones-1 reciprocal questions").toBeGreaterThanOrEqual(1);
  });

  it("capstones-1 t4/t5 truthfully attribute the learner-asks-back subject to the addressee, not the learner (quality-review M2)", () => {
    // t4 ("Are you Italian?") and t5 ("Do you understand Japanese?") are the
    // learner asking *the classmate* about the classmate — the topic is the
    // addressee, never the learner — so their discourse metadata must say so
    // truthfully, even though the natural omitted-subject Japanese surface
    // form never spells out the referent. (t5 targets the classmate rather
    // than the teacher: the catalog has no pre-Module-12 "teacher-as-subject"
    // value, so attributing it to the teacher would either violate the
    // capstone no-new-content rule or leave the value/referent mismatched;
    // reusing the classmate keeps the fix zero-new-content and, as a bonus,
    // more natural — a learner asking their Japanese teacher whether *they*
    // understand Japanese doesn't make sense, while asking a fellow
    // classmate does.)
    const t4 = allVariants.find((v) => v.id === "capstones-1-t4")!;
    const t5 = allVariants.find((v) => v.id === "capstones-1-t5")!;
    expect(t4.discourse.speakerRoleId).toBe(LEARNER);
    expect(t4.discourse.addresseeRoleId).toBe("a1-role-classmate");
    expect(t4.discourse.subjectReferentId, "t4 subject is the addressed classmate, not the learner").toBe(
      "a1-referent-classmate",
    );
    expect(t4.slotValues.subject).toBe("a1-value-classmate-subject");

    expect(t5.discourse.speakerRoleId).toBe(LEARNER);
    expect(t5.discourse.addresseeRoleId).toBe("a1-role-classmate");
    expect(t5.discourse.subjectReferentId, "t5 subject is the addressed classmate, not the learner").toBe(
      "a1-referent-classmate",
    );
    expect(t5.slotValues.subject).toBe("a1-value-classmate-subject");

    // The surface Japanese is unaffected: both stay natural omitted-subject
    // questions (no literal "you"/name token appears either way).
    expect(t4.discourse.subjectRealization).toBe("omitted");
    expect(t5.discourse.subjectRealization).toBe("omitted");
  });

  it("capstones-2 synthesizes routine + time + person + place + preference + purchase/request", () => {
    const models = idsFor("capstones-2", "model");
    const transfers = idsFor("capstones-2", "transfer");
    const all = [...models, ...transfers];
    const families = familiesOf(all);
    expect(families.has(SCHED) || families.has(ADV), "capstones-2 uses a routine/time family").toBe(true);
    expect(families.has(LOCF), "capstones-2 uses a place family").toBe(true);
    expect(families.has(PREF), "capstones-2 uses a preference family").toBe(true);
    expect(families.has(REQ) || families.has(QUANT), "capstones-2 uses a purchase/request family").toBe(true);
    const namedPersonModels = models.filter((v) =>
      ["a1-referent-yuki", "a1-referent-ken", "a1-referent-mina"].includes(v.discourse.subjectReferentId ?? ""),
    );
    expect(namedPersonModels.length, "capstones-2 named-person subjects").toBeGreaterThanOrEqual(1);
  });

  it("capstones-3 synthesizes movement + transport + a route question + an immediate need", () => {
    const models = idsFor("capstones-3", "model");
    const transfers = idsFor("capstones-3", "transfer");
    const all = [...models, ...transfers];
    const families = familiesOf(all);
    expect(families.has(LOCF) || families.has(DIR), "capstones-3 uses a movement family").toBe(true);
    expect(families.has(TRANS), "capstones-3 uses the transport family").toBe(true);
    expect(families.has(ROUTE), "capstones-3 uses the route family").toBe(true);
    expect(families.has(PREF), "capstones-3 uses preference for an immediate need").toBe(true);
    // Route/location question: a COP interrogative about a THING (a place),
    // asking どこ — "Where is X?" — the exact pattern B2 found absent.
    const routeQuestions = all.filter(
      (v) =>
        v.sentenceFamilyId === COP &&
        v.form.interrogative === true &&
        v.discourse.subjectReferentId === THING &&
        Object.values(v.slotValues).includes("a1-value-q-doko"),
    );
    expect(routeQuestions.length, "capstones-3 route/location questions").toBeGreaterThanOrEqual(1);
    // The immediate need is a want-sense preference variant (…がほしいです).
    const wantModels = all.filter((v) => v.sentenceFamilyId === PREF && Object.values(v.slotValues).includes("a1-value-want"));
    expect(wantModels.length, "capstones-3 immediate-need (want) variants").toBeGreaterThanOrEqual(1);
  });

  it("capstones-4 synthesizes identity + action + description + a clarification question", () => {
    const models = idsFor("capstones-4", "model");
    const transfers = idsFor("capstones-4", "transfer");
    const all = [...models, ...transfers];
    const families = familiesOf(all);
    expect(families.has(COP), "capstones-4 uses topic-copular (identity)").toBe(true);
    expect(families.has(OBJ), "capstones-4 uses object-action (an action)").toBe(true);
    expect(families.has(DESC), "capstones-4 uses description").toBe(true);
    // Clarification question: a COP interrogative about a THING, asking なん —
    // "What is this/that?" — the exact pattern B2 found absent.
    const clarification = all.filter(
      (v) =>
        v.sentenceFamilyId === COP &&
        v.form.interrogative === true &&
        v.discourse.subjectReferentId === THING &&
        Object.values(v.slotValues).includes("a1-value-q-nan"),
    );
    expect(clarification.length, "capstones-4 clarification questions").toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 7. Release recurrence — 37 sense records, each reused ≥2× later.
// ---------------------------------------------------------------------------

describe("A1 modules 9–12 · release recurrence completeness", () => {
  it("wires every productive sense to ≥2 later uses (37 records)", () => {
    expect(a1ReleaseVerbUseRecords.length).toBe(37);
    for (const record of a1ReleaseVerbUseRecords) {
      expect(record.laterUses.length, record.id).toBeGreaterThanOrEqual(2);
    }
    const ids = new Set(a1ReleaseVerbUseRecords.map((r) => r.id));
    expect(ids.size, "record ids unique").toBe(37);
  });
});

// ---------------------------------------------------------------------------
// 8. Copy parity / coverage — no Japanese, no certification language.
// ---------------------------------------------------------------------------

describe("A1 modules 9–12 · bilingual copy hygiene", () => {
  const JAPANESE_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u;

  it("keeps EN/IT copy keys in parity", () => {
    expect(Object.keys(a1CopyEn).sort()).toEqual(Object.keys(a1CopyIt).sort());
  });

  it("never leaks Japanese or cert language into copy values", () => {
    for (const table of [a1CopyEn, a1CopyIt]) {
      for (const [key, text] of Object.entries(table)) {
        expect(JAPANESE_RE.test(text), `${key} japanese`).toBe(false);
        expect(/certif|certificate|certified/i.test(text), `${key} cert`).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 9. Regression — Modules 2–8 realize exactly as before.
// ---------------------------------------------------------------------------

describe("A1 modules 9–12 · prior-module regression", () => {
  it("keeps a spot-check of Modules 2–8 realizations stable", () => {
    expect(jpOf("routines-1-m1")).toBe("ゆきはろくじにおきます");
    expect(romajiFor("routines-1-m1")).toBe("yuki wa rokuji ni okimasu");
    expect(jpOf("places-1-m2")).toBe("ゆきはくうこうへいきます");
    expect(romajiFor("places-1-m2")).toBe("yuki wa kuukou e ikimasu");
    expect(jpOf("people-1-m1")).toBe("はははせんせいです");
    expect(romajiFor("people-1-m1")).toBe("haha wa sensei desu");
  });
});

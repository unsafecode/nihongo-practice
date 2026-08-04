/**
 * A1 Modules 5–8 — deep authoring gate (Phase 2, Task 3).
 *
 * The authoring contract for routines (M5), tense/polarity (M6), places (M7)
 * and people (M8), plus the productive-verb *recurrence* wiring that threads
 * every sense introduced in Modules 2–5 into later, spaced reuses. It assembles
 * one release catalog (modules 2–8), realizes every instructional variant, and
 * asserts:
 *   • every realized sentence's exact natural Japanese + rōmaji (full table),
 *     rendered through the shared production formatter (never a naive join);
 *   • explicit conjugation / case-frame / naturalness regressions
 *     (past ました, negative ません, past-negative ませんでした, copula
 *     でした/ではありません spacing, bare frequency adverbs, destination に vs
 *     direction へ→`e`, transport で vs action-place で, route から/まで,
 *     companion と vs recipient に, plain vs honorific kin terms);
 *   • per-lesson metrics (8 models / 5 transfers / 5+5 practice, ≥3 predicate
 *     senses, ≥3 discourse roles, ≥2 contexts, ≥10 unique visible targets,
 *     reuse ≤2, transfer fingerprints unseen) + view-model selection/generation
 *     yielding exactly 10 exercises in EN and IT;
 *   • the exact productive-verb recurrence table computed in-test from real
 *     structure keys, canonical positions, later-module status and position
 *     gaps — with the raw intro records still `laterUses: []`;
 *   • bilingual copy parity/coverage with no Japanese and no cert language;
 *   • answer-integrity scans (blank fields stay blank, no disguised duplicate
 *     answers, canonical lesson ids only);
 *   • a Modules 2–4 realization regression (prior content unchanged).
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
  a1StructureKey,
} from "./shared";
import { module2Lessons, module2Recipe, module2VerbUseRecords } from "./module02Introductions";
import { module3Lessons, module3Recipe } from "./module03Questions";
import { module4Lessons, module4Recipe, module4VerbUseRecords } from "./module04Actions";
import { module5Lessons, module5Recipe, module5VerbUseRecords } from "./module05Routines";
import { module6Lessons, module6Recipe } from "./module06TensePolarity";
import { module7Lessons, module7Recipe } from "./module07Places";
import { module8Lessons, module8Recipe } from "./module08People";
import { a1AugmentedVerbUseRecords } from "./recurrence";
import { a1CopyEn } from "../copy/en";
import { a1CopyIt } from "../copy/it";
import {
  A1_MODULE_MANIFEST,
  A1_LESSON_MANIFEST,
  A1_CANONICAL_POSITIONS,
  A1_LEGACY_LESSON_ALIASES,
} from "../manifest";
import { realizeVariant } from "../../foundations/realizeFamily";
import { buildLessonViewModel } from "../../foundations/buildLessonViewModel";
import type { SentenceVariant, SentenceFamily } from "../../foundations/types";
import { formatRomaji } from "../../../romaji/formatRomaji";
import type { AssembledToken } from "../../../romaji/types";

// ---------------------------------------------------------------------------
// Assemble ONE release catalog from every instructional lesson (modules 2–8),
// wired with the augmented (recurrence-complete) verb-use records so intro and
// later variants both resolve.
// ---------------------------------------------------------------------------

const priorBuilt = [...module2Lessons, ...module3Lessons, ...module4Lessons];
const deepBuilt = [...module5Lessons, ...module6Lessons, ...module7Lessons, ...module8Lessons];
const instructionalBuilt = [...priorBuilt, ...deepBuilt];
const allVariants: SentenceVariant[] = instructionalBuilt.flatMap((b) => [...b.variants]);

const catalogs = assembleA1FoundationCatalogs({
  lessons: instructionalBuilt.map((b) => b.recipe),
  variants: allVariants,
  verbUseRecords: a1AugmentedVerbUseRecords,
});
const copy = { en: a1CopyEn, it: a1CopyIt };

const famById = new Map<string, SentenceFamily>(
  a1SentenceFamilies.map((f) => [f.id, f]),
);
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

// Render rōmaji through the *shared* production formatter — never a naive
// `tokens.map(t => t.romaji).join(" ")` — so this gate exercises the exact
// boundary/morphology rules learners see. A formatter failure is a hard error.
const romajiOf = (tokens: readonly AssembledToken[]): string => {
  const result = formatRomaji(tokens);
  if (!result.ok) {
    throw new Error(`formatRomaji failed: ${JSON.stringify(result.errors)}`);
  }
  return result.text;
};

const variantById = new Map(allVariants.map((v) => [v.id, v]));

// ---------------------------------------------------------------------------
// 1. The exact realized-sentence table — every Modules 5–8 variant, inspected.
// [variantId, canonicalJapanese, rōmaji]. Authored from realized output and
// re-verified on every run.
// ---------------------------------------------------------------------------

const EXPECTED_SENTENCES: readonly (readonly [string, string, string])[] = [
  ["routines-1-m1", "ゆきはろくじにおきます", "yuki wa rokuji ni okimasu"],
  ["routines-1-m2", "しちじにおきます", "shichiji ni okimasu"],
  ["routines-1-m3", "けんははちじにでかけます", "ken wa hachiji ni dekakemasu"],
  ["routines-1-m4", "くじにでかけます", "kuji ni dekakemasu"],
  ["routines-1-m5", "みなはろくじにかえります", "mina wa rokuji ni kaerimasu"],
  ["routines-1-m6", "ごじにかえります", "goji ni kaerimasu"],
  ["routines-1-m7", "ゆきはじゅういちじにねます", "yuki wa juuichiji ni nemasu"],
  ["routines-1-m8", "じゅうじにねます", "juuji ni nemasu"],
  ["routines-1-t1", "ごじにおきます", "goji ni okimasu"],
  ["routines-1-t2", "みなはしちじにでかけます", "mina wa shichiji ni dekakemasu"],
  ["routines-1-t3", "じゅういちじにねます", "juuichiji ni nemasu"],
  ["routines-1-t4", "けんはくじにかえります", "ken wa kuji ni kaerimasu"],
  ["routines-1-t5", "はちじにおきます", "hachiji ni okimasu"],
  ["routines-2-m1", "げつようびにべんきょうします", "getsuyoubi ni benkyoushimasu"],
  ["routines-2-m2", "ゆきはすいようびにべんきょうします", "yuki wa suiyoubi ni benkyoushimasu"],
  ["routines-2-m3", "あさたべます", "asa tabemasu"],
  ["routines-2-m4", "みなはよるたべます", "mina wa yoru tabemasu"],
  ["routines-2-m5", "よるよみます", "yoru yomimasu"],
  ["routines-2-m6", "けんはにちようびによみます", "ken wa nichiyoubi ni yomimasu"],
  ["routines-2-m7", "どようびにでかけます", "doyoubi ni dekakemasu"],
  ["routines-2-m8", "みなはあさおきます", "mina wa asa okimasu"],
  ["routines-2-t1", "みなはげつようびにべんきょうします", "mina wa getsuyoubi ni benkyoushimasu"],
  ["routines-2-t2", "よるたべます", "yoru tabemasu"],
  ["routines-2-t3", "けんはよるよみます", "ken wa yoru yomimasu"],
  ["routines-2-t4", "にちようびによみます", "nichiyoubi ni yomimasu"],
  ["routines-2-t5", "ゆきはあさおきます", "yuki wa asa okimasu"],
  ["routines-3-m1", "まいにちべんきょうします", "mainichi benkyoushimasu"],
  ["routines-3-m2", "ゆきはよくべんきょうします", "yuki wa yoku benkyoushimasu"],
  ["routines-3-m3", "よくよみます", "yoku yomimasu"],
  ["routines-3-m4", "けんはときどきよみます", "ken wa tokidoki yomimasu"],
  ["routines-3-m5", "まいにちたべます", "mainichi tabemasu"],
  ["routines-3-m6", "みなはときどきでかけます", "mina wa tokidoki dekakemasu"],
  ["routines-3-m7", "まいあさおきます", "maiasa okimasu"],
  ["routines-3-m8", "ゆきはいつもべんきょうします", "yuki wa itsumo benkyoushimasu"],
  ["routines-3-t1", "みなはまいにちべんきょうします", "mina wa mainichi benkyoushimasu"],
  ["routines-3-t2", "まいにちよみます", "mainichi yomimasu"],
  ["routines-3-t3", "けんはよくたべます", "ken wa yoku tabemasu"],
  ["routines-3-t4", "よくでかけます", "yoku dekakemasu"],
  ["routines-3-t5", "ゆきはまいあさおきます", "yuki wa maiasa okimasu"],
  ["routines-4-m1", "ろくじにおきます", "rokuji ni okimasu"],
  ["routines-4-m2", "パンをたべます", "pan o tabemasu"],
  ["routines-4-m3", "がっこうにいきます", "gakkou ni ikimasu"],
  ["routines-4-m4", "まいにちべんきょうします", "mainichi benkyoushimasu"],
  ["routines-4-m5", "ゆきはしんぶんをよみます", "yuki wa shinbun o yomimasu"],
  ["routines-4-m6", "けんはいえにきます", "ken wa ie ni kimasu"],
  ["routines-4-m7", "じゅういちじにねます", "juuichiji ni nemasu"],
  ["routines-4-m8", "みなはすしをたべます", "mina wa sushi o tabemasu"],
  ["routines-4-t1", "しんぶんをよみます", "shinbun o yomimasu"],
  ["routines-4-t2", "みなはがっこうにいきます", "mina wa gakkou ni ikimasu"],
  ["routines-4-t3", "けんはパンをたべます", "ken wa pan o tabemasu"],
  ["routines-4-t4", "ゆきはろくじにおきます", "yuki wa rokuji ni okimasu"],
  ["routines-4-t5", "いえにきます", "ie ni kimasu"],
  ["past-negative-1-m1", "すしをたべました", "sushi o tabemashita"],
  ["past-negative-1-m2", "ゆきはしゅくだいをしました", "yuki wa shukudai o shimashita"],
  ["past-negative-1-m3", "ほんをかいました", "hon o kaimashita"],
  ["past-negative-1-m4", "けんはてがみをかきました", "ken wa tegami o kakimashita"],
  ["past-negative-1-m5", "みなはともだちといきました", "mina wa tomodachi to ikimashita"],
  ["past-negative-1-m6", "しちじにおきました", "shichiji ni okimashita"],
  ["past-negative-1-m7", "じゅういちじにねました", "juuichiji ni nemashita"],
  ["past-negative-1-m8", "けんはろくじにかえりました", "ken wa rokuji ni kaerimashita"],
  ["past-negative-1-t1", "けんはすしをたべました", "ken wa sushi o tabemashita"],
  ["past-negative-1-t2", "みなはほんをかいました", "mina wa hon o kaimashita"],
  ["past-negative-1-t3", "ともだちといきました", "tomodachi to ikimashita"],
  ["past-negative-1-t4", "ゆきはしちじにおきました", "yuki wa shichiji ni okimashita"],
  ["past-negative-1-t5", "ろくじにかえりました", "rokuji ni kaerimashita"],
  ["past-negative-2-m1", "コーヒーをのみません", "koohii o nomimasen"],
  ["past-negative-2-m2", "ゆきはかいしゃではたらきません", "yuki wa kaisha de hatarakimasen"],
  ["past-negative-2-m3", "にほんごがわかりません", "nihongo ga wakarimasen"],
  ["past-negative-2-m4", "みなはせんせいにききません", "mina wa sensei ni kikimasen"],
  ["past-negative-2-m5", "えいがをみません", "eiga o mimasen"],
  ["past-negative-2-m6", "けんはおんがくをききません", "ken wa ongaku o kikimasen"],
  ["past-negative-2-m7", "はちじにでかけません", "hachiji ni dekakemasen"],
  ["past-negative-2-m8", "みなはろくじにかえりません", "mina wa rokuji ni kaerimasen"],
  ["past-negative-2-t1", "けんはコーヒーをのみません", "ken wa koohii o nomimasen"],
  ["past-negative-2-t2", "せんせいにききません", "sensei ni kikimasen"],
  ["past-negative-2-t3", "みなはえいがをみません", "mina wa eiga o mimasen"],
  ["past-negative-2-t4", "ゆきはおんがくをききません", "yuki wa ongaku o kikimasen"],
  ["past-negative-2-t5", "ろくじにかえりません", "rokuji ni kaerimasen"],
  ["past-negative-3-m1", "にほんごをべんきょうしませんでした", "nihongo o benkyoushimasen deshita"],
  ["past-negative-3-m2", "ゆきはほんをよみませんでした", "yuki wa hon o yomimasen deshita"],
  ["past-negative-3-m3", "しちじにおきませんでした", "shichiji ni okimasen deshita"],
  ["past-negative-3-m4", "けんはじゅういちじにねませんでした", "ken wa juuichiji ni nemasen deshita"],
  ["past-negative-3-m5", "はちじにでかけませんでした", "hachiji ni dekakemasen deshita"],
  ["past-negative-3-m6", "みなはげつようびにべんきょうしませんでした", "mina wa getsuyoubi ni benkyoushimasen deshita"],
  ["past-negative-3-m7", "よるよみませんでした", "yoru yomimasen deshita"],
  ["past-negative-3-m8", "ゆきはあさたべませんでした", "yuki wa asa tabemasen deshita"],
  ["past-negative-3-t1", "ゆきはにほんごをべんきょうしませんでした", "yuki wa nihongo o benkyoushimasen deshita"],
  ["past-negative-3-t2", "ほんをよみませんでした", "hon o yomimasen deshita"],
  ["past-negative-3-t3", "みなはしちじにおきませんでした", "mina wa shichiji ni okimasen deshita"],
  ["past-negative-3-t4", "げつようびにべんきょうしませんでした", "getsuyoubi ni benkyoushimasen deshita"],
  ["past-negative-3-t5", "けんはよるよみませんでした", "ken wa yoru yomimasen deshita"],
  ["past-negative-4-m1", "がくせいでした", "gakusei deshita"],
  ["past-negative-4-m2", "けんはいしゃでした", "ken wa isha deshita"],
  ["past-negative-4-m3", "せんせいではありません", "sensei dewa arimasen"],
  ["past-negative-4-m4", "みなはかいしゃいんではありません", "mina wa kaishain dewa arimasen"],
  ["past-negative-4-m5", "がくせいではありませんでした", "gakusei dewa arimasen deshita"],
  ["past-negative-4-m6", "ゆきはにほんじんではありませんでした", "yuki wa nihonjin dewa arimasen deshita"],
  ["past-negative-4-m7", "えいごがわかりません", "eigo ga wakarimasen"],
  ["past-negative-4-m8", "けんはにほんごをべんきょうしました", "ken wa nihongo o benkyoushimashita"],
  ["past-negative-4-t1", "けんはがくせいでした", "ken wa gakusei deshita"],
  ["past-negative-4-t2", "いしゃではありません", "isha dewa arimasen"],
  ["past-negative-4-t3", "みなはがくせいではありませんでした", "mina wa gakusei dewa arimasen deshita"],
  ["past-negative-4-t4", "ゆきはえいごがわかりません", "yuki wa eigo ga wakarimasen"],
  ["past-negative-4-t5", "せんせいではありませんでした", "sensei dewa arimasen deshita"],
  ["places-1-m1", "えきにいきます", "eki ni ikimasu"],
  ["places-1-m2", "ゆきはえきへいきます", "yuki wa eki e ikimasu"],
  ["places-1-m3", "いえにきます", "ie ni kimasu"],
  ["places-1-m4", "けんはいえへきます", "ken wa ie e kimasu"],
  ["places-1-m5", "がっこうへいきます", "gakkou e ikimasu"],
  ["places-1-m6", "みなはがっこうにきます", "mina wa gakkou ni kimasu"],
  ["places-1-m7", "とうきょうにすみます", "toukyou ni sumimasu"],
  ["places-1-m8", "ゆきはおおさかにすみます", "yuki wa oosaka ni sumimasu"],
  ["places-1-t1", "けんはえきへいきます", "ken wa eki e ikimasu"],
  ["places-1-t2", "いえへきます", "ie e kimasu"],
  ["places-1-t3", "みなはがっこうにいきます", "mina wa gakkou ni ikimasu"],
  ["places-1-t4", "けんはとうきょうにすみます", "ken wa toukyou ni sumimasu"],
  ["places-1-t5", "がっこうへきます", "gakkou e kimasu"],
  ["places-2-m1", "でんしゃでえきにいきます", "densha de eki ni ikimasu"],
  ["places-2-m2", "ゆきはバスでがっこうにいきます", "yuki wa basu de gakkou ni ikimasu"],
  ["places-2-m3", "でんしゃでいえにきます", "densha de ie ni kimasu"],
  ["places-2-m4", "けんはくるまでえきにきます", "ken wa kuruma de eki ni kimasu"],
  ["places-2-m5", "かいしゃではたらきます", "kaisha de hatarakimasu"],
  ["places-2-m6", "みなはレストランではたらきます", "mina wa resutoran de hatarakimasu"],
  ["places-2-m7", "じてんしゃでがっこうにいきます", "jitensha de gakkou ni ikimasu"],
  ["places-2-m8", "ゆきはがっこうへいきます", "yuki wa gakkou e ikimasu"],
  ["places-2-t1", "けんはでんしゃでえきにいきます", "ken wa densha de eki ni ikimasu"],
  ["places-2-t2", "バスでがっこうにきます", "basu de gakkou ni kimasu"],
  ["places-2-t3", "みなはかいしゃではたらきます", "mina wa kaisha de hatarakimasu"],
  ["places-2-t4", "くるまでえきにいきます", "kuruma de eki ni ikimasu"],
  ["places-2-t5", "ゆきはレストランではたらきます", "yuki wa resutoran de hatarakimasu"],
  ["places-3-m1", "とうきょうからおおさかまでいきます", "toukyou kara oosaka made ikimasu"],
  ["places-3-m2", "ゆきはおおさかからきょうとまでいきます", "yuki wa oosaka kara kyouto made ikimasu"],
  ["places-3-m3", "いえからえきまできます", "ie kara eki made kimasu"],
  ["places-3-m4", "けんはとうきょうからきょうとまでいきます", "ken wa toukyou kara kyouto made ikimasu"],
  ["places-3-m5", "えきからがっこうまできます", "eki kara gakkou made kimasu"],
  ["places-3-m6", "みなはいえからかいしゃまでいきます", "mina wa ie kara kaisha made ikimasu"],
  ["places-3-m7", "とうきょうにすみます", "toukyou ni sumimasu"],
  ["places-3-m8", "ゆきはおおさかにすみます", "yuki wa oosaka ni sumimasu"],
  ["places-3-t1", "けんはとうきょうからおおさかまでいきます", "ken wa toukyou kara oosaka made ikimasu"],
  ["places-3-t2", "おおさかからきょうとまでいきます", "oosaka kara kyouto made ikimasu"],
  ["places-3-t3", "みなはいえからえきまできます", "mina wa ie kara eki made kimasu"],
  ["places-3-t4", "けんはとうきょうにすみます", "ken wa toukyou ni sumimasu"],
  ["places-3-t5", "ゆきはえきからがっこうまできます", "yuki wa eki kara gakkou made kimasu"],
  ["places-4-m1", "えきにいきます", "eki ni ikimasu"],
  ["places-4-m2", "ゆきはでんしゃでがっこうにいきます", "yuki wa densha de gakkou ni ikimasu"],
  ["places-4-m3", "いえからかいしゃまでいきます", "ie kara kaisha made ikimasu"],
  ["places-4-m4", "けんはいえへきます", "ken wa ie e kimasu"],
  ["places-4-m5", "かいしゃではたらきます", "kaisha de hatarakimasu"],
  ["places-4-m6", "みなはがっこうへいきます", "mina wa gakkou e ikimasu"],
  ["places-4-m7", "バスでえきにきます", "basu de eki ni kimasu"],
  ["places-4-m8", "ゆきはレストランではたらきます", "yuki wa resutoran de hatarakimasu"],
  ["places-4-t1", "けんはえきにいきます", "ken wa eki ni ikimasu"],
  ["places-4-t2", "でんしゃでがっこうにいきます", "densha de gakkou ni ikimasu"],
  ["places-4-t3", "みなはいえからかいしゃまでいきます", "mina wa ie kara kaisha made ikimasu"],
  ["places-4-t4", "いえへきます", "ie e kimasu"],
  ["places-4-t5", "ゆきはかいしゃではたらきます", "yuki wa kaisha de hatarakimasu"],
  ["people-1-m1", "はははせんせいです", "haha wa sensei desu"],
  ["people-1-m2", "ちちはいしゃです", "chichi wa isha desu"],
  ["people-1-m3", "おかあさんはせんせいです", "okaasan wa sensei desu"],
  ["people-1-m4", "おとうさんはかいしゃいんです", "otousan wa kaishain desu"],
  ["people-1-m5", "はははコーヒーをのみます", "haha wa koohii o nomimasu"],
  ["people-1-m6", "あにはおちゃをのみます", "ani wa ocha o nomimasu"],
  ["people-1-m7", "ちちはとうきょうにすみます", "chichi wa toukyou ni sumimasu"],
  ["people-1-m8", "あねはおおさかにすみます", "ane wa oosaka ni sumimasu"],
  ["people-1-t1", "ちちはせんせいです", "chichi wa sensei desu"],
  ["people-1-t2", "おかあさんはいしゃです", "okaasan wa isha desu"],
  ["people-1-t3", "あにはコーヒーをのみます", "ani wa koohii o nomimasu"],
  ["people-1-t4", "はははとうきょうにすみます", "haha wa toukyou ni sumimasu"],
  ["people-1-t5", "あねはかいしゃいんです", "ane wa kaishain desu"],
  ["people-2-m1", "ちちはとうきょうにすみます", "chichi wa toukyou ni sumimasu"],
  ["people-2-m2", "はははにほんごをべんきょうします", "haha wa nihongo o benkyoushimasu"],
  ["people-2-m3", "あにはしゅくだいをします", "ani wa shukudai o shimasu"],
  ["people-2-m4", "あねはてがみをかきます", "ane wa tegami o kakimasu"],
  ["people-2-m5", "おとうとはげつようびにべんきょうします", "otouto wa getsuyoubi ni benkyoushimasu"],
  ["people-2-m6", "いもうとはあさたべます", "imouto wa asa tabemasu"],
  ["people-2-m7", "ちちはよるよみます", "chichi wa yoru yomimasu"],
  ["people-2-m8", "はははてがみをかきます", "haha wa tegami o kakimasu"],
  ["people-2-t1", "はははとうきょうにすみます", "haha wa toukyou ni sumimasu"],
  ["people-2-t2", "ちちはにほんごをべんきょうします", "chichi wa nihongo o benkyoushimasu"],
  ["people-2-t3", "あねはしゅくだいをします", "ane wa shukudai o shimasu"],
  ["people-2-t4", "おとうとはあさたべます", "otouto wa asa tabemasu"],
  ["people-2-t5", "あにはよるよみます", "ani wa yoru yomimasu"],
  ["people-3-m1", "ともだちといきます", "tomodachi to ikimasu"],
  ["people-3-m2", "ゆきはクラスメートといきます", "yuki wa kurasumeeto to ikimasu"],
  ["people-3-m3", "せんせいにききます", "sensei ni kikimasu"],
  ["people-3-m4", "けんはともだちにききます", "ken wa tomodachi ni kikimasu"],
  ["people-3-m5", "みなはせんせいといきます", "mina wa sensei to ikimasu"],
  ["people-3-m6", "えいがをみます", "eiga o mimasu"],
  ["people-3-m7", "ゆきはえいがをみます", "yuki wa eiga o mimasu"],
  ["people-3-m8", "てんいんにききます", "ten'in ni kikimasu"],
  ["people-3-t1", "けんはともだちといきます", "ken wa tomodachi to ikimasu"],
  ["people-3-t2", "クラスメートといきます", "kurasumeeto to ikimasu"],
  ["people-3-t3", "みなはせんせいにききます", "mina wa sensei ni kikimasu"],
  ["people-3-t4", "ともだちにききます", "tomodachi ni kikimasu"],
  ["people-3-t5", "けんはえいがをみます", "ken wa eiga o mimasu"],
  ["people-4-m1", "ほんをかいます", "hon o kaimasu"],
  ["people-4-m2", "ゆきはほんをかいます", "yuki wa hon o kaimasu"],
  ["people-4-m3", "えいがをみます", "eiga o mimasu"],
  ["people-4-m4", "けんはテレビをみます", "ken wa terebi o mimasu"],
  ["people-4-m5", "みなはおんがくをききます", "mina wa ongaku o kikimasu"],
  ["people-4-m6", "おんがくをききます", "ongaku o kikimasu"],
  ["people-4-m7", "ゆきはしんぶんをかいます", "yuki wa shinbun o kaimasu"],
  ["people-4-m8", "みなはえいがをみます", "mina wa eiga o mimasu"],
  ["people-4-t1", "けんはほんをかいます", "ken wa hon o kaimasu"],
  ["people-4-t2", "テレビをみます", "terebi o mimasu"],
  ["people-4-t3", "ゆきはおんがくをききます", "yuki wa ongaku o kikimasu"],
  ["people-4-t4", "しんぶんをかいます", "shinbun o kaimasu"],
  ["people-4-t5", "けんはおんがくをききます", "ken wa ongaku o kikimasu"],
];

describe("A1 modules 5–8 · exact realized-sentence table", () => {
  it("realizes every deep-module variant to its inspected JP + rōmaji", () => {
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
    // Every authored deep-module variant appears in the table (no gaps).
    for (const built of deepBuilt) {
      for (const v of built.variants) {
        expect(covered.has(v.id), `${v.id} missing from table`).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 1b. Explicit conjugation / case-frame / naturalness regressions.
// ---------------------------------------------------------------------------

const jpOf = (id: string) => realize(variantById.get(id) as SentenceVariant).canonicalJapanese;
const romajiFor = (id: string) => romajiOf(realize(variantById.get(id) as SentenceVariant).tokens);

describe("A1 modules 5–8 · conjugation & case-frame regressions", () => {
  it("realizes polite past ました, negative ません and past-negative ませんでした", () => {
    // Past affirmative attaches ました (tabe+mashita), never a copula.
    expect(jpOf("past-negative-1-m1")).toBe("すしをたべました");
    expect(romajiFor("past-negative-1-m1")).toBe("sushi o tabemashita");
    // Negative present ません.
    expect(jpOf("past-negative-2-m1")).toBe("コーヒーをのみません");
    expect(romajiFor("past-negative-2-m1")).toBe("koohii o nomimasen");
    // Past-negative ませんでした — the copula でした spaces off the verbal
    // negative (…masen deshita), never a run-on.
    expect(jpOf("past-negative-3-m1")).toBe("にほんごをべんきょうしませんでした");
    expect(romajiFor("past-negative-3-m1")).toBe("nihongo o benkyoushimasen deshita");
    expect(romajiFor("past-negative-3-m1")).toMatch(/masen deshita$/);
  });

  it("keeps the copula predicate spaced in every copular row (past/neg boundaries)", () => {
    // でした / ではありません / ではありませんでした are standalone predicates:
    // no letter may run directly into desu/deshita, and では spaces as `dewa`.
    const copular: readonly (readonly [string, string, string])[] = [
      ["past-negative-4-m1", "がくせいでした", "gakusei deshita"],
      ["past-negative-4-m3", "せんせいではありません", "sensei dewa arimasen"],
      ["past-negative-4-m5", "がくせいではありませんでした", "gakusei dewa arimasen deshita"],
    ];
    for (const [id, jp, romaji] of copular) {
      expect(jpOf(id), id).toBe(jp);
      const text = romajiFor(id);
      expect(text, id).toBe(romaji);
      expect(text, id).not.toMatch(/\wdesu/);
      expect(text, id).not.toMatch(/\wdeshita/);
    }
    // Copula boundaries stay spaced across ALL realized rows.
    for (const [variantId, , expectedRomaji] of EXPECTED_SENTENCES) {
      const text = romajiFor(variantId);
      expect(text, variantId).toBe(expectedRomaji);
      expect(text, variantId).not.toMatch(/\wdeshita/);
      expect(text, variantId).not.toMatch(/[a-z]desu/);
    }
  });

  it("attaches frequency adverbs with NO particle (bare まいにち/よく/ときどき/いつも)", () => {
    const adverbial: readonly (readonly [string, string])[] = [
      ["routines-3-m1", "まいにちべんきょうします"],
      ["routines-3-m2", "ゆきはよくべんきょうします"],
      ["routines-3-m4", "けんはときどきよみます"],
      ["routines-3-m8", "ゆきはいつもべんきょうします"],
      ["routines-3-m7", "まいあさおきます"],
    ];
    for (const [id, jp] of adverbial) {
      expect(jpOf(id), id).toBe(jp);
      // No particle immediately after the frequency adverb.
      expect(jp, id).not.toMatch(/(まいにち|よく|ときどき|いつも|まいあさ)(は|を|に|が|で)/);
    }
  });

  it("marks time-of-clock and day with に but bare time-of-day frames without", () => {
    // Clock/day take に; あさ/よる (time-of-day) are bare adverbials.
    expect(jpOf("routines-1-m2")).toBe("しちじにおきます");
    expect(jpOf("routines-2-m1")).toBe("げつようびにべんきょうします");
    expect(jpOf("routines-2-m3")).toBe("あさたべます");
    expect(jpOf("routines-2-m3")).not.toMatch(/あさ(に|は|を)/);
  });

  it("distinguishes destination に from direction へ→`e` and route から/まで", () => {
    // Destination に stays `ni`; directional へ renders as `e` (topic は→`wa`
    // analogue), never `he`.
    expect(jpOf("places-1-m1")).toBe("えきにいきます");
    expect(romajiFor("places-1-m1")).toBe("eki ni ikimasu");
    expect(jpOf("places-1-m2")).toBe("ゆきはえきへいきます");
    expect(romajiFor("places-1-m2")).toBe("yuki wa eki e ikimasu");
    expect(romajiFor("places-1-m2")).not.toContain(" he ");
    // Route: departure から + limit まで, both spaced particles.
    expect(jpOf("places-3-m1")).toBe("とうきょうからおおさかまでいきます");
    expect(romajiFor("places-3-m1")).toBe("toukyou kara oosaka made ikimasu");
  });

  it("keeps transport で and action-place で as distinct case frames", () => {
    // Means-of-transport で (densha de …) precedes a destination clause;
    // action-place で (kaisha de hatarakimasu) marks where the action happens.
    expect(jpOf("places-2-m1")).toBe("でんしゃでえきにいきます");
    expect(romajiFor("places-2-m1")).toBe("densha de eki ni ikimasu");
    expect(jpOf("places-2-m5")).toBe("かいしゃではたらきます");
    expect(romajiFor("places-2-m5")).toBe("kaisha de hatarakimasu");
  });

  it("distinguishes companion と from recipient に", () => {
    // Companion と (…to ikimasu) vs person-target に (…ni kikimasu).
    expect(jpOf("people-3-m1")).toBe("ともだちといきます");
    expect(romajiFor("people-3-m1")).toBe("tomodachi to ikimasu");
    expect(jpOf("people-3-m3")).toBe("せんせいにききます");
    expect(romajiFor("people-3-m3")).toBe("sensei ni kikimasu");
  });

  it("uses plain kin terms for own family and honorific for others', with copula は", () => {
    // Own family: はは/ちち (plain); referring to a listener's family:
    // おかあさん/おとうさん (honorific). Never mixed on the own-family subject.
    expect(jpOf("people-1-m1")).toBe("はははせんせいです");
    expect(jpOf("people-1-m2")).toBe("ちちはいしゃです");
    expect(jpOf("people-1-m3")).toBe("おかあさんはせんせいです");
    expect(jpOf("people-1-m4")).toBe("おとうさんはかいしゃいんです");
    // The own-family topic marks with は→`wa`, honorific likewise.
    expect(romajiFor("people-1-m1")).toBe("haha wa sensei desu");
    expect(romajiFor("people-1-m3")).toBe("okaasan wa sensei desu");
  });
});

// ---------------------------------------------------------------------------
// 2. Per-lesson metrics + view-model selection/generation (EN + IT).
// ---------------------------------------------------------------------------

describe("A1 modules 5–8 · lesson metrics", () => {
  it.each(deepBuilt.map((b) => [b.recipe.id, b] as const))(
    "%s satisfies the A1 depth contract",
    (lessonId, built) => {
      const models = built.variants.filter((v) => v.pedagogicalUse === "model");
      const transfers = built.variants.filter((v) => v.pedagogicalUse === "transfer");
      expect(models.length).toBe(8);
      expect(transfers.length).toBe(5);

      const modelSentences = models.map(realize);
      const transferSentences = transfers.map(realize);

      const predicateSenses = new Set(modelSentences.map((s) => s.predicateSenseId));
      const discourseRoles = new Set(models.map((v) => v.discourse.speakerRoleId));
      const contexts = new Set(models.map((v) => v.contextId));
      expect(predicateSenses.size, `${lessonId} predicate senses`).toBeGreaterThanOrEqual(3);
      expect(discourseRoles.size, `${lessonId} roles`).toBeGreaterThanOrEqual(3);
      expect(contexts.size, `${lessonId} contexts`).toBeGreaterThanOrEqual(2);

      // Unique visible targets and reuse across all 13 variants.
      const targetCounts = new Map<string, number>();
      for (const s of [...modelSentences, ...transferSentences]) {
        targetCounts.set(s.visibleTargetKey, (targetCounts.get(s.visibleTargetKey) ?? 0) + 1);
      }
      expect(targetCounts.size, `${lessonId} unique targets`).toBeGreaterThanOrEqual(10);
      expect(Math.max(...targetCounts.values()), `${lessonId} reuse`).toBeLessThanOrEqual(2);

      // Transfer fingerprints must be genuinely unseen among the models.
      const modelFingerprints = new Set(modelSentences.map((s) => s.semanticFingerprint));
      for (const t of transferSentences) {
        expect(modelFingerprints.has(t.semanticFingerprint), `${lessonId} transfer ${t.variantId}`).toBe(false);
      }

      // Every transfer piece (predicate sense + slot values) must be reused
      // from some MODEL of the same lesson — genuine controlled construction.
      const modelPieces = new Set<string>();
      models.forEach((v, i) => {
        modelPieces.add(modelSentences[i].predicateSenseId);
        for (const value of Object.values(v.slotValues)) modelPieces.add(String(value));
      });
      transfers.forEach((tv, i) => {
        expect(modelPieces.has(transferSentences[i].predicateSenseId), `${lessonId} transfer predicate ${tv.id}`).toBe(true);
        for (const value of Object.values(tv.slotValues)) {
          expect(modelPieces.has(String(value)), `${lessonId} transfer piece ${String(value)} in ${tv.id}`).toBe(true);
        }
      });

      expect(built.recipe.practice.roundOne.targetCount).toBe(5);
      expect(built.recipe.practice.roundTwo.targetCount).toBe(5);

      for (const locale of ["en", "it"] as const) {
        const vm = buildLessonViewModel({
          catalogs,
          copy,
          lessonId,
          locale,
          catalogVersion: "a1-task3-test",
          seed: `seed-${lessonId}-${locale}`,
        });
        expect(vm.ok, vm.ok ? "" : `${lessonId} ${locale}: ${JSON.stringify((vm as { error: unknown }).error)}`).toBe(true);
        if (vm.ok) {
          expect(vm.model.rounds[0].targets.length).toBe(5);
          expect(vm.model.rounds[1].targets.length).toBe(5);
        }
      }
    },
  );
});

// ---------------------------------------------------------------------------
// 3. Productive-verb recurrence — computed in-test from real structure keys,
// canonical positions, later-module status and gaps; asserted as an exact table.
// ---------------------------------------------------------------------------

function moduleOf(lessonId: string): string | undefined {
  return A1_LESSON_MANIFEST[lessonId]?.moduleId;
}
function positionOf(lessonId: string): number {
  return A1_CANONICAL_POSITIONS[lessonId] ?? -1;
}

/** The authoritative expected recurrence assignment (senseId → later lessons). */
const EXPECTED_RECURRENCE: Readonly<Record<string, readonly string[]>> = {
  "a1-sense-be": ["past-negative-4", "people-1"],
  "a1-sense-live": ["people-1", "people-2"],
  "a1-sense-study": ["past-negative-3", "people-2"],
  "a1-sense-work": ["past-negative-2", "places-2"],
  "a1-sense-understand": ["past-negative-2", "past-negative-4"],
  "a1-sense-do": ["past-negative-1", "people-2"],
  "a1-sense-eat": ["routines-4", "past-negative-1"],
  "a1-sense-drink": ["past-negative-2", "people-1"],
  "a1-sense-read": ["routines-4", "past-negative-3"],
  "a1-sense-go": ["routines-4", "places-1"],
  "a1-sense-come": ["routines-4", "places-1"],
  "a1-sense-accompany": ["past-negative-1", "people-3"],
  "a1-sense-ask": ["past-negative-2", "people-3"],
  "a1-sense-buy": ["past-negative-1", "people-4"],
  "a1-sense-see": ["past-negative-2", "people-4"],
  "a1-sense-listen": ["past-negative-2", "people-4"],
  "a1-sense-write": ["past-negative-1", "people-2"],
  "a1-sense-wake": ["past-negative-1", "past-negative-3"],
  "a1-sense-sleep": ["past-negative-1", "past-negative-3"],
  "a1-sense-go-out": ["past-negative-2", "past-negative-3"],
  "a1-sense-return": ["past-negative-1", "past-negative-2"],
  "a1-sense-study-routine": ["past-negative-3", "people-2"],
  "a1-sense-eat-routine": ["past-negative-3", "people-2"],
  "a1-sense-read-routine": ["past-negative-3", "people-2"],
};

describe("A1 productive-verb recurrence (§9.3 rules 3-5)", () => {
  it("covers every productive sense introduced in Modules 2, 4 and 5", () => {
    const augmentedSenses = new Set(a1AugmentedVerbUseRecords.map((r) => r.senseId));
    expect(augmentedSenses.size).toBe(24);
    for (const senseId of Object.keys(EXPECTED_RECURRENCE)) {
      expect(augmentedSenses.has(senseId), senseId).toBe(true);
    }
  });

  it("keeps the RAW module records at laterUses: [] (intro timeline untouched)", () => {
    for (const raw of [...module2VerbUseRecords, ...module4VerbUseRecords, ...module5VerbUseRecords]) {
      expect(raw.laterUses.length, raw.senseId).toBe(0);
      expect(raw.learningUse).toBe("productive");
    }
  });

  it.each(a1AugmentedVerbUseRecords.map((r) => [r.senseId, r] as const))(
    "%s satisfies intro-structure, spaced reuse, later-module and structure-reuse",
    (senseId, record) => {
      // Intro: ≥2 variants with ≥2 distinct structure keys + correctness-bearing exercise.
      expect(record.introductionVariantIds.length).toBeGreaterThanOrEqual(2);
      const introVariants = record.introductionVariantIds.map((id) => variantById.get(id));
      for (const v of introVariants) expect(v, `${senseId} intro variant`).toBeDefined();
      const introStructures = new Set(introVariants.map((v) => a1StructureKey(v as SentenceVariant)));
      expect(introStructures.size, `${senseId} intro structures`).toBeGreaterThanOrEqual(2);
      expect(
        ["tile-ordering", "choice", "transformation", "completion", "constrained-construction"],
      ).toContain(record.introductionExercise.exerciseKind);
      expect(record.introductionVariantIds).toContain(record.introductionExercise.targetVariantId);

      // Later uses: ≥2, each resolving to a genuine variant reusing this sense.
      expect(record.laterUses.length, `${senseId} laterUses`).toBeGreaterThanOrEqual(2);
      const introModule = moduleOf(record.introductionLessonId);
      const introPos = positionOf(record.introductionLessonId);
      let maxGap = 0;
      let hasLaterModule = false;
      const allStructures = new Set(introStructures);
      for (const use of record.laterUses) {
        const laterVariant = variantById.get(use.variantId);
        expect(laterVariant, `${senseId} later variant ${use.variantId}`).toBeDefined();
        // The later variant must belong to the referenced lesson and genuinely
        // realize THIS sense (a correctness-bearing building block, not a mention).
        const realized = realize(laterVariant as SentenceVariant);
        expect(realized.predicateSenseId, `${senseId} reuse ${use.variantId}`).toBe(senseId);
        expect(use.variantId.startsWith(use.lessonId + "-"), `${use.variantId} in ${use.lessonId}`).toBe(true);
        allStructures.add(a1StructureKey(laterVariant as SentenceVariant));
        const pos = positionOf(use.lessonId);
        if (pos >= 0 && introPos >= 0) maxGap = Math.max(maxGap, pos - introPos);
        if (moduleOf(use.lessonId) !== introModule) hasLaterModule = true;
      }
      expect(maxGap, `${senseId} spaced gap`).toBeGreaterThanOrEqual(2);
      expect(hasLaterModule, `${senseId} later module`).toBe(true);
      expect(allStructures.size, `${senseId} structure reuse`).toBeGreaterThanOrEqual(2);

      // Exact assignment table.
      const laterLessons = record.laterUses.map((u) => u.lessonId);
      expect(laterLessons, senseId).toEqual(EXPECTED_RECURRENCE[senseId]);
    },
  );

  it("threads later uses across ≥2 distinct structures for every sense", () => {
    for (const record of a1AugmentedVerbUseRecords) {
      const structures = new Set(
        [...record.introductionVariantIds, ...record.laterUses.map((u) => u.variantId)]
          .map((id) => variantById.get(id))
          .filter((v): v is SentenceVariant => v !== undefined)
          .map(a1StructureKey),
      );
      expect(structures.size, record.senseId).toBeGreaterThanOrEqual(2);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Answer-integrity scans (blanks stay blank; no disguised duplicate answers;
// canonical lesson ids only).
// ---------------------------------------------------------------------------

describe("A1 modules 5–8 · answer integrity", () => {
  it("never pre-fills a blank segment and never disguises duplicate answers", () => {
    for (const built of deepBuilt) {
      const vm = buildLessonViewModel({
        catalogs,
        copy,
        lessonId: built.recipe.id,
        locale: "en",
        catalogVersion: "a1-task3-test",
        seed: `seed-answers-${built.recipe.id}`,
      });
      expect(vm.ok, built.recipe.id).toBe(true);
      if (!vm.ok) continue;
      const targets = [...vm.model.rounds[0].targets, ...vm.model.rounds[1].targets];
      expect(targets.length).toBe(10);

      // Blank fields stay blank (no leaked answer text).
      for (const target of targets) {
        const p = target.prompt;
        if (p.kind === "choice") {
          const blank = p.sentenceSegments.find((s) => s.id === p.blankSegmentId);
          expect(blank?.isBlank, `${built.recipe.id} choice blank`).toBe(true);
          expect(p.options.length, `${built.recipe.id} choice distractors`).toBeGreaterThanOrEqual(2);
          expect(p.options.some((o) => o.id === p.correctOptionId), `${built.recipe.id} choice answer present`).toBe(true);
        } else if (p.kind === "completion") {
          for (const bid of p.blankSegmentIds) {
            const seg = p.sentenceSegments.find((s) => s.id === bid);
            expect(seg?.isBlank, `${built.recipe.id} completion blank`).toBe(true);
          }
        }
        // No round target should expose a plaintext `answer` field on the target itself.
        expect(Object.prototype.hasOwnProperty.call(target, "answer")).toBe(false);
      }

      // No two of the ten exercises may resolve to the same full answer
      // sentence (a genuinely disguised duplicate), and no single sentence may
      // appear under two different exercise kinds.
      const answerKeys = new Set<string>();
      const kindByAnswer = new Map<string, string>();
      for (const target of targets) {
        const full = realize(variantById.get(target.variantId) as SentenceVariant).visibleTargetKey;
        expect(answerKeys.has(full), `${built.recipe.id} duplicate answer ${full}`).toBe(false);
        answerKeys.add(full);
        const priorKind = kindByAnswer.get(full);
        if (priorKind !== undefined) {
          expect(priorKind, `${built.recipe.id} disguised ${full}`).toBe(target.prompt.kind);
        }
        kindByAnswer.set(full, target.prompt.kind);
      }
      expect(answerKeys.size).toBe(10);
    }
  });

  it("references only canonical (non-alias) lesson ids", () => {
    const aliasKeys = new Set(Object.keys(A1_LEGACY_LESSON_ALIASES));
    for (const built of deepBuilt) {
      expect(aliasKeys.has(built.recipe.id), built.recipe.id).toBe(false);
    }
    for (const record of a1AugmentedVerbUseRecords) {
      expect(aliasKeys.has(record.introductionLessonId)).toBe(false);
      for (const use of record.laterUses) {
        expect(aliasKeys.has(use.lessonId), use.lessonId).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Copy parity, coverage, no-Japanese, no-cert (Modules 5–8).
// ---------------------------------------------------------------------------

const JP_RE = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff66-\uff9f]/;

describe("A1 modules 5–8 · copy parity & coverage", () => {
  it("en/it share an identical key set with no Japanese and no empty values", () => {
    expect(Object.keys(a1CopyEn).sort()).toEqual(Object.keys(a1CopyIt).sort());
    for (const [locale, map] of [["en", a1CopyEn], ["it", a1CopyIt]] as const) {
      for (const [key, value] of Object.entries(map)) {
        expect(value.length, `${locale}:${key}`).toBeGreaterThan(0);
        expect(JP_RE.test(value), `${locale}:${key} has Japanese`).toBe(false);
      }
    }
  });

  it("has no certification / mastery language", () => {
    const banned = /\b(certified|mastered|fluent|native-level)\b/i;
    for (const map of [a1CopyEn, a1CopyIt]) {
      for (const value of Object.values(map)) {
        expect(banned.test(value)).toBe(false);
      }
    }
  });

  it("covers every translation + scenario key referenced by Modules 5–8 lessons", () => {
    for (const built of deepBuilt) {
      for (const key of Object.keys(built.en)) {
        expect(a1CopyEn[key], `en ${key}`).toBeDefined();
        expect(a1CopyIt[key], `it ${key}`).toBeDefined();
      }
      // Italian keys mirror English on every lesson map.
      expect(Object.keys(built.en).sort()).toEqual(Object.keys(built.it).sort());
    }
  });

  it("covers the module outcome copy id for routines, past-negative, places, people", () => {
    for (const moduleId of ["routines", "past-negative", "places", "people"] as const) {
      const outcomeId = A1_MODULE_MANIFEST[moduleId].outcomeCopyId;
      expect(a1CopyEn[outcomeId], outcomeId).toBeDefined();
      expect(a1CopyIt[outcomeId], outcomeId).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Modules 2–4 realization regression — prior content unchanged by the
// realizer/catalog extensions this task introduced.
// ---------------------------------------------------------------------------

describe("A1 modules 2–4 · realization regression", () => {
  it("still realizes every prior instructional variant and builds every view model", () => {
    for (const built of priorBuilt) {
      for (const v of built.variants) {
        const sentence = realize(v);
        expect(sentence.canonicalJapanese.length, v.id).toBeGreaterThan(0);
        expect(romajiOf(sentence.tokens).length, v.id).toBeGreaterThan(0);
      }
      const vm = buildLessonViewModel({
        catalogs,
        copy,
        lessonId: built.recipe.id,
        locale: "en",
        catalogVersion: "a1-task3-test",
        seed: `seed-regress-${built.recipe.id}`,
      });
      expect(vm.ok, built.recipe.id).toBe(true);
    }
  });

  it("preserves canonical prior rows (spot check)", () => {
    expect(jpOf("introductions-1-m1")).toBe("ゆきはがくせいです");
    expect(jpOf("actions-1-m2")).toBe("ラーメンをたべます");
    expect(jpOf("essential-questions-1-m1")).toBe("これはなんですか");
  });

  it("keeps the manifest lesson order and recipe ids for all eight modules", () => {
    expect(module2Recipe.lessonIds).toEqual(["introductions-1", "introductions-2", "introductions-3", "introductions-4"]);
    expect(module3Recipe.lessonIds).toEqual(["essential-questions-1", "essential-questions-2", "essential-questions-3", "essential-questions-4"]);
    expect(module4Recipe.lessonIds).toEqual(["actions-1", "actions-2", "actions-3", "actions-4"]);
    expect(module5Recipe.lessonIds).toEqual(["routines-1", "routines-2", "routines-3", "routines-4"]);
    expect(module6Recipe.lessonIds).toEqual(["past-negative-1", "past-negative-2", "past-negative-3", "past-negative-4"]);
    expect(module7Recipe.lessonIds).toEqual(["places-1", "places-2", "places-3", "places-4"]);
    expect(module8Recipe.lessonIds).toEqual(["people-1", "people-2", "people-3", "people-4"]);
  });
});

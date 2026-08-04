/**
 * A1 Modules 1–4 — module-local depth gate (Phase 2, Task 2).
 *
 * This suite is the authoring contract for the four A1 modules. It assembles a
 * single foundation catalog from the release data (never the Phase-1 fixtures),
 * realizes every instructional variant, and asserts:
 *   • every realized sentence's exact natural Japanese + rōmaji (full table);
 *   • per-lesson metrics (8 models / 5 transfers / 2+2 practice, ≥3 predicate
 *     senses, ≥3 discourse roles, ≥2 contexts, ≥10 unique visible targets,
 *     reuse ≤2, and transfer fingerprints absent from the model set);
 *   • ≥2 structurally-distinct intro variants per productive verb;
 *   • the phonetic contract for the four sounds lessons;
 *   • bilingual copy parity/coverage with no Japanese leaking into copy;
 *   • no foundation-fixture imports or fixture rule IDs in the release data;
 *   • cumulative introduced-sense gating across the manifest order.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import {
  a1SentenceFamilies,
  a1Contexts,
  a1PersonRoles,
  a1Referents,
  a1SemanticValues,
  a1LearningTargetSenses,
  assembleA1FoundationCatalogs,
  a1StructureKey,
  a1TranslationCopyId,
} from "./shared";
import { module2Lessons, module2Recipe, module2VerbUseRecords } from "./module02Introductions";
import { module3Lessons, module3Recipe, module3VerbUseRecords } from "./module03Questions";
import { module4Lessons, module4Recipe, module4VerbUseRecords } from "./module04Actions";
import {
  module1PhoneticItems,
  module1ItemsByLesson,
  module1Lessons,
  module1Recipe,
} from "./module01Sounds";
import { a1CopyEn } from "../copy/en";
import { a1CopyIt } from "../copy/it";
import { A1_MODULE_MANIFEST, A1_LEGACY_LESSON_ALIASES } from "../manifest";
import { realizeVariant } from "../../foundations/realizeFamily";
import { buildLessonViewModel } from "../../foundations/buildLessonViewModel";
import type { SentenceVariant, SentenceFamily } from "../../foundations/types";
import { formatRomaji } from "../../../romaji/formatRomaji";
import type { AssembledToken } from "../../../romaji/types";

// ---------------------------------------------------------------------------
// Assemble ONE release catalog from all instructional lessons (modules 2–4).
// ---------------------------------------------------------------------------

const instructionalBuilt = [...module2Lessons, ...module3Lessons, ...module4Lessons];
const allVariants: SentenceVariant[] = instructionalBuilt.flatMap((b) => [...b.variants]);
const catalogs = assembleA1FoundationCatalogs({
  lessons: instructionalBuilt.map((b) => b.recipe),
  variants: allVariants,
  verbUseRecords: [
    ...module2VerbUseRecords,
    ...module3VerbUseRecords,
    ...module4VerbUseRecords,
  ],
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
// join — so this gate exercises the exact boundary/morphology rules learners
// see (lexical/particle spaces; morphology and punctuation attach). A formatter
// failure is a hard error surfaced loudly, never silently coerced to text.
const romajiOf = (tokens: readonly AssembledToken[]): string => {
  const result = formatRomaji(tokens);
  if (!result.ok) {
    throw new Error(`formatRomaji failed: ${JSON.stringify(result.errors)}`);
  }
  return result.text;
};

const variantById = new Map(allVariants.map((v) => [v.id, v]));

// ---------------------------------------------------------------------------
// The exact realized-sentence table — every instructional variant, inspected.
// [variantId, canonicalJapanese, rōmaji]. Authored from realized output and
// re-verified here on every run: the "inspect every realized sentence" gate.
// ---------------------------------------------------------------------------

const EXPECTED_SENTENCES: readonly (readonly [string, string, string])[] = [
    ["introductions-1-m1", "ゆきはがくせいです", "yuki wa gakusei desu"],
    ["introductions-1-m2", "けんはせんせいです", "ken wa sensei desu"],
    ["introductions-1-m3", "わたしはがくせいです", "watashi wa gakusei desu"],
    ["introductions-1-m4", "せんせいです", "sensei desu"],
    ["introductions-1-m5", "せんせいはいしゃです", "sensei wa isha desu"],
    ["introductions-1-m6", "わたしはいしゃです", "watashi wa isha desu"],
    ["introductions-1-m7", "ゆきはいしゃです", "yuki wa isha desu"],
    ["introductions-1-m8", "がくせいです", "gakusei desu"],
    ["introductions-1-t1", "けんはがくせいです", "ken wa gakusei desu"],
    ["introductions-1-t2", "いしゃです", "isha desu"],
    ["introductions-1-t3", "ゆきはせんせいです", "yuki wa sensei desu"],
    ["introductions-1-t4", "ゆきはがくせいです", "yuki wa gakusei desu"],
    ["introductions-1-t5", "わたしはせんせいです", "watashi wa sensei desu"],
    ["introductions-2-m1", "みなはにほんじんです", "mina wa nihonjin desu"],
    ["introductions-2-m2", "けんはイタリアじんです", "ken wa itariajin desu"],
    ["introductions-2-m3", "ゆきはアメリカじんです", "yuki wa amerikajin desu"],
    ["introductions-2-m4", "わたしはにほんじんです", "watashi wa nihonjin desu"],
    ["introductions-2-m5", "イタリアじんです", "itariajin desu"],
    ["introductions-2-m6", "みなはアメリカじんです", "mina wa amerikajin desu"],
    ["introductions-2-m7", "けんはせんせいです", "ken wa sensei desu"],
    ["introductions-2-m8", "ゆきはがくせいです", "yuki wa gakusei desu"],
    ["introductions-2-t1", "みなはイタリアじんです", "mina wa itariajin desu"],
    ["introductions-2-t2", "けんはアメリカじんです", "ken wa amerikajin desu"],
    ["introductions-2-t3", "にほんじんです", "nihonjin desu"],
    ["introductions-2-t4", "ゆきはにほんじんです", "yuki wa nihonjin desu"],
    ["introductions-2-t5", "みなはがくせいです", "mina wa gakusei desu"],
    ["introductions-3-m1", "ゆきははたらきます", "yuki wa hatarakimasu"],
    ["introductions-3-m2", "べんきょうします", "benkyoushimasu"],
    ["introductions-3-m3", "けんはします", "ken wa shimasu"],
    ["introductions-3-m4", "はたらきます", "hatarakimasu"],
    ["introductions-3-m5", "あのひとはべんきょうします", "ano hito wa benkyoushimasu"],
    ["introductions-3-m6", "します", "shimasu"],
    ["introductions-3-m7", "みなははたらきます", "mina wa hatarakimasu"],
    ["introductions-3-m8", "ゆきはべんきょうします", "yuki wa benkyoushimasu"],
    ["introductions-3-t1", "みなはべんきょうします", "mina wa benkyoushimasu"],
    ["introductions-3-t2", "けんははたらきます", "ken wa hatarakimasu"],
    ["introductions-3-t3", "します", "shimasu"],
    ["introductions-3-t4", "あのひとははたらきます", "ano hito wa hatarakimasu"],
    ["introductions-3-t5", "べんきょうします", "benkyoushimasu"],
    ["introductions-4-m1", "ゆきはがくせいです", "yuki wa gakusei desu"],
    ["introductions-4-m2", "けんはエンジニアです", "ken wa enjinia desu"],
    ["introductions-4-m3", "ゆきはかいしゃいんです", "yuki wa kaishain desu"],
    ["introductions-4-m4", "そのひとはエンジニアです", "sono hito wa enjinia desu"],
    ["introductions-4-m5", "クラスメートはべんきょうします", "kurasumeeto wa benkyoushimasu"],
    ["introductions-4-m6", "はたらきます", "hatarakimasu"],
    ["introductions-4-m7", "けんはします", "ken wa shimasu"],
    ["introductions-4-m8", "べんきょうします", "benkyoushimasu"],
    ["introductions-4-t1", "みなはかいしゃいんです", "mina wa kaishain desu"],
    ["introductions-4-t2", "そのひとははたらきます", "sono hito wa hatarakimasu"],
    ["introductions-4-t3", "クラスメートはがくせいです", "kurasumeeto wa gakusei desu"],
    ["introductions-4-t4", "します", "shimasu"],
    ["introductions-4-t5", "ゆきはべんきょうします", "yuki wa benkyoushimasu"],
    ["essential-questions-1-m1", "これはなんですか", "kore wa nan desu ka"],
    ["essential-questions-1-m2", "それはなんですか", "sore wa nan desu ka"],
    ["essential-questions-1-m3", "これはなにですか", "kore wa nani desu ka"],
    ["essential-questions-1-m4", "それはなにですか", "sore wa nani desu ka"],
    ["essential-questions-1-m5", "これはどのほんですか", "kore wa dono hon desu ka"],
    ["essential-questions-1-m6", "これはせんせいですか", "kore wa sensei desu ka"],
    ["essential-questions-1-m7", "それはがくせいですか", "sore wa gakusei desu ka"],
    ["essential-questions-1-m8", "これはいしゃですか", "kore wa isha desu ka"],
    ["essential-questions-1-t1", "それはどのほんですか", "sore wa dono hon desu ka"],
    ["essential-questions-1-t2", "これはがくせいですか", "kore wa gakusei desu ka"],
    ["essential-questions-1-t3", "それはせんせいですか", "sore wa sensei desu ka"],
    ["essential-questions-1-t4", "それはいしゃですか", "sore wa isha desu ka"],
    ["essential-questions-1-t5", "これはなんですか", "kore wa nan desu ka"],
    ["essential-questions-2-m1", "トイレはどこですか", "toire wa doko desu ka"],
    ["essential-questions-2-m2", "えきはどこですか", "eki wa doko desu ka"],
    ["essential-questions-2-m3", "あのひとはだれですか", "ano hito wa dare desu ka"],
    ["essential-questions-2-m4", "クラスメートはだれですか", "kurasumeeto wa dare desu ka"],
    ["essential-questions-2-m5", "あのひとはこどもですか", "ano hito wa kodomo desu ka"],
    ["essential-questions-2-m6", "クラスメートはがくせいですか", "kurasumeeto wa gakusei desu ka"],
    ["essential-questions-2-m7", "そのひとはだれですか", "sono hito wa dare desu ka"],
    ["essential-questions-2-m8", "そのひとはせんせいですか", "sono hito wa sensei desu ka"],
    ["essential-questions-2-t1", "そのひとはがくせいですか", "sono hito wa gakusei desu ka"],
    ["essential-questions-2-t2", "あのひとはがくせいですか", "ano hito wa gakusei desu ka"],
    ["essential-questions-2-t3", "クラスメートはだれですか", "kurasumeeto wa dare desu ka"],
    ["essential-questions-2-t4", "そのひとはこどもですか", "sono hito wa kodomo desu ka"],
    ["essential-questions-2-t5", "あのひとはこどもですか", "ano hito wa kodomo desu ka"],
    ["essential-questions-3-m1", "パーティーはいつですか", "paatii wa itsu desu ka"],
    ["essential-questions-3-m2", "これはいくらですか", "kore wa ikura desu ka"],
    ["essential-questions-3-m3", "それはいくらですか", "sore wa ikura desu ka"],
    ["essential-questions-3-m4", "みかんはいくつですか", "mikan wa ikutsu desu ka"],
    ["essential-questions-3-m5", "これはいくつですか", "kore wa ikutsu desu ka"],
    ["essential-questions-3-m6", "それはどれですか", "sore wa dore desu ka"],
    ["essential-questions-3-m7", "みかんはいくらですか", "mikan wa ikura desu ka"],
    ["essential-questions-3-m8", "それはいつですか", "sore wa itsu desu ka"],
    ["essential-questions-3-t1", "これはどれですか", "kore wa dore desu ka"],
    ["essential-questions-3-t2", "パーティーはいつですか", "paatii wa itsu desu ka"],
    ["essential-questions-3-t3", "それはいくつですか", "sore wa ikutsu desu ka"],
    ["essential-questions-3-t4", "みかんはいくらですか", "mikan wa ikura desu ka"],
    ["essential-questions-3-t5", "これはいくらですか", "kore wa ikura desu ka"],
    ["essential-questions-4-m1", "にほんごがわかりますか", "nihongo ga wakarimasu ka"],
    ["essential-questions-4-m2", "ゆきはえいごがわかりますか", "yuki wa eigo ga wakarimasu ka"],
    ["essential-questions-4-m3", "けんはイタリアごがわかりますか", "ken wa itariago ga wakarimasu ka"],
    ["essential-questions-4-m4", "みなはにほんごがわかりますか", "mina wa nihongo ga wakarimasu ka"],
    ["essential-questions-4-m5", "にほんごがわかります", "nihongo ga wakarimasu"],
    ["essential-questions-4-m6", "ゆきはえいごがわかります", "yuki wa eigo ga wakarimasu"],
    ["essential-questions-4-m7", "けんはイタリアごがわかります", "ken wa itariago ga wakarimasu"],
    ["essential-questions-4-m8", "みなはにほんごがわかります", "mina wa nihongo ga wakarimasu"],
    ["essential-questions-4-t1", "みなはイタリアごがわかりますか", "mina wa itariago ga wakarimasu ka"],
    ["essential-questions-4-t2", "みなはイタリアごがわかります", "mina wa itariago ga wakarimasu"],
    ["essential-questions-4-t3", "ゆきはにほんごがわかりますか", "yuki wa nihongo ga wakarimasu ka"],
    ["essential-questions-4-t4", "けんはえいごがわかります", "ken wa eigo ga wakarimasu"],
    ["essential-questions-4-t5", "えいごがわかります", "eigo ga wakarimasu"],
    ["actions-1-m1", "ゆきはすしをたべます", "yuki wa sushi o tabemasu"],
    ["actions-1-m2", "みかんをたべます", "mikan o tabemasu"],
    ["actions-1-m3", "コーヒーをのみます", "koohii o nomimasu"],
    ["actions-1-m4", "みなはコーヒーをのみます", "mina wa koohii o nomimasu"],
    ["actions-1-m5", "ゆきはほんをよみます", "yuki wa hon o yomimasu"],
    ["actions-1-m6", "ほんをよみます", "hon o yomimasu"],
    ["actions-1-m7", "ゆきはしゅくだいをします", "yuki wa shukudai o shimasu"],
    ["actions-1-m8", "しゅくだいをします", "shukudai o shimasu"],
    ["actions-1-t1", "みなはほんをよみます", "mina wa hon o yomimasu"],
    ["actions-1-t2", "すしをたべます", "sushi o tabemasu"],
    ["actions-1-t3", "けんはコーヒーをのみます", "ken wa koohii o nomimasu"],
    ["actions-1-t4", "ほんをよみます", "hon o yomimasu"],
    ["actions-1-t5", "みなはみかんをたべます", "mina wa mikan o tabemasu"],
    ["actions-2-m1", "ゆきはとしょかんにいきます", "yuki wa toshokan ni ikimasu"],
    ["actions-2-m2", "がっこうにいきます", "gakkou ni ikimasu"],
    ["actions-2-m3", "みなはカフェにきます", "mina wa kafe ni kimasu"],
    ["actions-2-m4", "カフェにきます", "kafe ni kimasu"],
    ["actions-2-m5", "ゆきはとうきょうにすみます", "yuki wa toukyou ni sumimasu"],
    ["actions-2-m6", "おおさかにすみます", "oosaka ni sumimasu"],
    ["actions-2-m7", "けんはかいしゃではたらきます", "ken wa kaisha de hatarakimasu"],
    ["actions-2-m8", "カフェではたらきます", "kafe de hatarakimasu"],
    ["actions-2-t1", "がっこうにいきます", "gakkou ni ikimasu"],
    ["actions-2-t2", "ゆきはとしょかんにきます", "yuki wa toshokan ni kimasu"],
    ["actions-2-t3", "みなはとしょかんにいきます", "mina wa toshokan ni ikimasu"],
    ["actions-2-t4", "カフェにいきます", "kafe ni ikimasu"],
    ["actions-2-t5", "みなはかいしゃではたらきます", "mina wa kaisha de hatarakimasu"],
    ["actions-3-m1", "ゆきはにほんごをべんきょうします", "yuki wa nihongo o benkyoushimasu"],
    ["actions-3-m2", "せんせいにききます", "sensei ni kikimasu"],
    ["actions-3-m3", "みなはせんせいにききます", "mina wa sensei ni kikimasu"],
    ["actions-3-m4", "てんいんにききます", "ten'in ni kikimasu"],
    ["actions-3-m5", "けんはほんをかいます", "ken wa hon o kaimasu"],
    ["actions-3-m6", "あれをかいます", "are o kaimasu"],
    ["actions-3-m7", "にほんごをべんきょうします", "nihongo o benkyoushimasu"],
    ["actions-3-m8", "クラスメートはコーヒーをかいます", "kurasumeeto wa koohii o kaimasu"],
    ["actions-3-t1", "みなはにほんごをべんきょうします", "mina wa nihongo o benkyoushimasu"],
    ["actions-3-t2", "せんせいにききます", "sensei ni kikimasu"],
    ["actions-3-t3", "みなはほんをかいます", "mina wa hon o kaimasu"],
    ["actions-3-t4", "てんいんにききます", "ten'in ni kikimasu"],
    ["actions-3-t5", "ほんをかいます", "hon o kaimasu"],
    ["actions-4-m1", "ゆきはえいがをみます", "yuki wa eiga o mimasu"],
    ["actions-4-m2", "テレビをみます", "terebi o mimasu"],
    ["actions-4-m3", "みなはおんがくをききます", "mina wa ongaku o kikimasu"],
    ["actions-4-m4", "おんがくをききます", "ongaku o kikimasu"],
    ["actions-4-m5", "けんはてがみをかきます", "ken wa tegami o kakimasu"],
    ["actions-4-m6", "てがみをかきます", "tegami o kakimasu"],
    ["actions-4-m7", "ゆきはほんをよみます", "yuki wa hon o yomimasu"],
    ["actions-4-m8", "えいがをみます", "eiga o mimasu"],
    ["actions-4-t1", "けんはおんがくをききます", "ken wa ongaku o kikimasu"],
    ["actions-4-t2", "みなはテレビをみます", "mina wa terebi o mimasu"],
    ["actions-4-t3", "ゆきはてがみをかきます", "yuki wa tegami o kakimasu"],
    ["actions-4-t4", "ほんをよみます", "hon o yomimasu"],
    ["actions-4-t5", "みなはえいがをみます", "mina wa eiga o mimasu"],
];

// ---------------------------------------------------------------------------
// 1. Every instructional variant realizes its exact natural JP + rōmaji.
// ---------------------------------------------------------------------------

describe("A1 modules 2–4 · exact realized sentences", () => {
  it("covers every authored instructional variant exactly once", () => {
    const tableIds = EXPECTED_SENTENCES.map((r) => r[0]).sort();
    const variantIds = allVariants.map((v) => v.id).sort();
    expect(tableIds).toEqual(variantIds);
    expect(new Set(tableIds).size).toBe(tableIds.length);
  });

  it.each(EXPECTED_SENTENCES)(
    "%s realizes the expected Japanese and rōmaji",
    (variantId, expectedJp, expectedRomaji) => {
      const variant = variantById.get(variantId);
      expect(variant, variantId).toBeDefined();
      const sentence = realize(variant as SentenceVariant);
      expect(sentence.canonicalJapanese).toBe(expectedJp);
      expect(sentence.visibleTargetKey).toBe(expectedJp.normalize("NFC"));
      expect(romajiOf(sentence.tokens)).toBe(expectedRomaji);
    },
  );

  it("uses nominative が substantively in the final questions lesson", () => {
    const question = variantById.get("essential-questions-4-m1");
    const answer = variantById.get("essential-questions-4-m5");
    expect(question?.sentenceFamilyId).toBe("a1-family-nominative-action");
    expect(answer?.sentenceFamilyId).toBe("a1-family-nominative-action");
    expect(realize(question as SentenceVariant).canonicalJapanese).toBe(
      "にほんごがわかりますか",
    );
    expect(realize(answer as SentenceVariant).canonicalJapanese).toBe(
      "にほんごがわかります",
    );
    expect(copy.en["essential-questions-4-m1-translation"]).toBe(
      "Do you understand Japanese?",
    );
    expect(copy.it["essential-questions-4-m5-translation"]).toBe(
      "Capisco il giapponese.",
    );
    for (const variant of module3Lessons.find(
      (lesson) => lesson.recipe.id === "essential-questions-4",
    )?.variants ?? []) {
      const sentence = realize(variant);
      expect(sentence.canonicalJapanese).toContain("が");
      expect(sentence.canonicalJapanese).not.toContain("を");
    }
  });

  it("compares every one of the 156 instructional rows through the shared formatter", () => {
    expect(EXPECTED_SENTENCES.length).toBe(156);
    for (const [variantId, , expectedRomaji] of EXPECTED_SENTENCES) {
      const sentence = realize(variantById.get(variantId) as SentenceVariant);
      const result = formatRomaji(sentence.tokens);
      expect(result.ok, `formatRomaji failed for ${variantId}`).toBe(true);
      if (result.ok) expect(result.text).toBe(expectedRomaji);
    }
  });

  it("attaches the -masu morpheme to its verb stem (tabe + masu → tabemasu)", () => {
    // Regression for the naive `tokens.map(t => t.romaji).join(" ")` bug: the
    // -masu morpheme must attach to the preceding stem with no space, so
    // たべ+ます renders as `tabemasu`, never `tabe masu`.
    const sentence = realize(variantById.get("actions-1-m2") as SentenceVariant);
    const masu = sentence.tokens.find((t) => t.romaji === "masu");
    expect(masu, "-masu morpheme token present").toBeDefined();
    expect((masu as AssembledToken).kind).toBe("morpheme");
    expect((masu as AssembledToken).boundaryBefore).toBe("attach");

    const result = formatRomaji(sentence.tokens);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toBe("mikan o tabemasu");
      expect(result.text).toContain("tabemasu");
      expect(result.text).not.toContain("tabe masu");
    }

    // A naive space-join would wrongly separate the morpheme; assert the shared
    // formatter diverges from that naive rendering here.
    const naive = sentence.tokens.map((t) => t.romaji).join(" ");
    expect(naive).toContain("tabe masu");
    if (result.ok) expect(result.text).not.toBe(naive);
  });

  it("spaces the standalone copula predicate in every copular row — no `\\wdesu` run-on, no `tabe masu`", () => {
    // Regression for the copula boundary bug: the polite copula (です/でした/
    // では ありません…) is a space-bound standalone predicate, so no formatted
    // row may contain a letter immediately followed by `desu`/`deshita`, and
    // bound verb inflection must still attach (never `tabe masu`).
    let copularRows = 0;
    for (const [variantId, expectedJp, expectedRomaji] of EXPECTED_SENTENCES) {
      const sentence = realize(variantById.get(variantId) as SentenceVariant);
      const text = romajiOf(sentence.tokens);
      expect(text, variantId).toBe(expectedRomaji);
      expect(text, variantId).not.toMatch(/\wdesu/);
      expect(text, variantId).not.toMatch(/\wdeshita/);
      expect(text, variantId).not.toContain("tabe masu");
      if (expectedJp.includes("です")) {
        copularRows += 1;
        expect(text, variantId).toMatch(/ desu( ka)?$/);
      }
    }
    // This literal pins the expected corpus count; a broad nonzero check would
    // let accidental model churn silently weaken the copula-boundary regression.
    expect(copularRows).toBe(71);
  });
});

// ---------------------------------------------------------------------------
// 2. Per-lesson metrics + view-model selection/generation success.
// ---------------------------------------------------------------------------

interface LessonMetrics {
  readonly lessonId: string;
  readonly models: number;
  readonly transfers: number;
  readonly roundOne: number;
  readonly roundTwo: number;
  readonly predicateSenses: number;
  readonly discourseRoles: number;
  readonly contexts: number;
  readonly uniqueTargets: number;
  readonly maxReuse: number;
}

const metricsByLesson = new Map<string, LessonMetrics>();

describe("A1 modules 2–4 · lesson metrics", () => {
  it("uses only model-introduced values in introductions-1 transfers", () => {
    const introductions1 = module2Lessons.find(
      (built) => built.recipe.id === "introductions-1",
    );
    expect(introductions1).toBeDefined();

    const modelValueIds = new Set(
      introductions1!.variants
        .filter((variant) => variant.pedagogicalUse === "model")
        .flatMap((variant) => Object.values(variant.slotValues)),
    );
    const transfers = introductions1!.variants.filter(
      (variant) => variant.pedagogicalUse === "transfer",
    );

    expect(transfers).toHaveLength(5);
    for (const transfer of transfers) {
      expect(
        Object.values(transfer.slotValues).filter((valueId) => !modelValueIds.has(valueId)),
        `${transfer.id} uses a value absent from introductions-1 models`,
      ).toEqual([]);
    }
  });

  it.each(instructionalBuilt.map((b) => [b.recipe.id, b] as const))(
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
      expect(predicateSenses.size).toBeGreaterThanOrEqual(
        built.recipe.diversityConstraints.minPredicates,
      );
      expect(discourseRoles.size).toBeGreaterThanOrEqual(3);
      expect(contexts.size).toBeGreaterThanOrEqual(2);

      // Unique visible targets and reuse across the whole lesson (13 variants).
      const targetCounts = new Map<string, number>();
      for (const s of [...modelSentences, ...transferSentences]) {
        targetCounts.set(s.visibleTargetKey, (targetCounts.get(s.visibleTargetKey) ?? 0) + 1);
      }
      const uniqueTargets = targetCounts.size;
      const maxReuse = Math.max(...targetCounts.values());
      expect(uniqueTargets).toBeGreaterThanOrEqual(10);
      expect(maxReuse).toBeLessThanOrEqual(2);

      // Transfer fingerprints must be genuinely unseen among the models.
      const modelFingerprints = new Set(modelSentences.map((s) => s.semanticFingerprint));
      for (const t of transferSentences) {
        expect(modelFingerprints.has(t.semanticFingerprint), `${lessonId} transfer ${t.variantId}`).toBe(false);
      }

      // Practice rounds: 2 guided + 2 transfer targets.
      expect(built.recipe.practice.roundOne.targetCount).toBe(2);
      expect(built.recipe.practice.roundTwo.targetCount).toBe(2);

      // View model: selection + generation succeed → exactly 4 exercises.
      const vm = buildLessonViewModel({
        catalogs,
        copy,
        lessonId,
        locale: "en",
        catalogVersion: "a1-task2-test",
        seed: `seed-${lessonId}`,
      });
      expect(vm.ok, vm.ok ? "" : JSON.stringify((vm as { error: unknown }).error)).toBe(true);
      if (vm.ok) {
        const exercises = vm.model.rounds[0].targets.length + vm.model.rounds[1].targets.length;
        expect(exercises).toBe(4);
        expect(vm.model.rounds[0].targets.length).toBe(2);
        expect(vm.model.rounds[1].targets.length).toBe(2);
      }

      metricsByLesson.set(lessonId, {
        lessonId,
        models: models.length,
        transfers: transfers.length,
        roundOne: 2,
        roundTwo: 2,
        predicateSenses: predicateSenses.size,
        discourseRoles: discourseRoles.size,
        contexts: contexts.size,
        uniqueTargets,
        maxReuse,
      });
    },
  );

  it("also builds every lesson view model in Italian", () => {
    for (const built of instructionalBuilt) {
      const vm = buildLessonViewModel({
        catalogs,
        copy,
        lessonId: built.recipe.id,
        locale: "it",
        catalogVersion: "a1-task2-test",
        seed: `seed-it-${built.recipe.id}`,
      });
      expect(vm.ok, built.recipe.id).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 2.5. Explicit-subject prompts must not be ambiguous across distinct
// Japanese referents (e.g. あの人 "that person over there" vs その人 "that
// person" must never share one undifferentiated English/Italian gloss).
//
// Scoped to pairs where BOTH rows realize their subject explicitly (i.e. the
// referent is actually pronounced in the Japanese), so intentional
// topic-omission structure pairs — where a model line drops the topic and a
// paired transfer spells it out, both naming the very same person — are never
// mistaken for referent ambiguity.
// ---------------------------------------------------------------------------

describe("A1 modules 2–4 · demonstrative/referent prompts are unambiguous", () => {
  it.each(instructionalBuilt.map((b) => [b.recipe.id, b] as const))(
    "%s never maps one explicit-subject gloss to two different Japanese targets",
    (lessonId, built) => {
      for (const locale of ["en", "it"] as const) {
        const copy = locale === "en" ? built.en : built.it;
        const glossToTargets = new Map<string, Map<string, string>>();
        for (const variant of built.variants) {
          if (variant.discourse.subjectRealization !== "explicit") continue;
          const gloss = copy[a1TranslationCopyId(variant.id)];
          expect(gloss, `${variant.id} ${locale} gloss`).toBeTruthy();
          const jp = realize(variant).visibleTargetKey;
          const targets = glossToTargets.get(gloss) ?? new Map<string, string>();
          targets.set(jp, variant.id);
          glossToTargets.set(gloss, targets);
        }
        for (const [gloss, targets] of glossToTargets) {
          expect(
            targets.size,
            `${lessonId} (${locale}) gloss "${gloss}" maps to distinct Japanese targets: ` +
              `${[...targets.entries()].map(([jp, id]) => `${id}=${jp}`).join(", ")}`,
          ).toBe(1);
        }
      }
    },
  );
});

// ---------------------------------------------------------------------------
// 3. Productive verbs: ≥2 structurally-distinct intro variants each.
// ---------------------------------------------------------------------------

describe("A1 productive verbs · structural intro diversity", () => {
  const records = [
    ...module2VerbUseRecords,
    ...module3VerbUseRecords,
    ...module4VerbUseRecords,
  ];

  it("declares at least the module 2 & 4 productive senses", () => {
    const senseIds = new Set(records.map((r) => r.senseId));
    for (const s of [
      "a1-sense-be", "a1-sense-live", "a1-sense-study", "a1-sense-work",
      "a1-sense-work-bare", "a1-sense-study-bare", "a1-sense-do-bare",
      "a1-sense-understand", "a1-sense-do", "a1-sense-eat", "a1-sense-drink",
      "a1-sense-read", "a1-sense-go", "a1-sense-come",
      "a1-sense-ask", "a1-sense-buy", "a1-sense-see", "a1-sense-listen",
      "a1-sense-write",
    ]) {
      // Every listed productive sense must actually be declared.
      expect(senseIds.has(s), s).toBe(true);
    }
    expect(records.length).toBeGreaterThanOrEqual(11);
  });

  it.each(
    [
      ...module2VerbUseRecords,
      ...module3VerbUseRecords,
      ...module4VerbUseRecords,
    ].map((r) => [r.senseId, r] as const),
  )("%s has ≥2 structurally distinct intro variants", (_senseId, record) => {
    expect(record.introductionVariantIds.length).toBeGreaterThanOrEqual(2);
    const structures = new Set(
      record.introductionVariantIds.map((id) => {
        const v = variantById.get(id);
        expect(v, id).toBeDefined();
        return a1StructureKey(v as SentenceVariant);
      }),
    );
    expect(structures.size).toBeGreaterThanOrEqual(2);
    // Later spaced reuse is a future slice — never pre-claimed here.
    expect(record.laterUses.length).toBe(0);
    expect(record.learningUse).toBe("productive");
  });

  it("keeps bare action senses attached to their canonical learner lexemes", () => {
    const senseById = new Map(a1LearningTargetSenses.map((sense) => [sense.id, sense]));
    expect(senseById.get("a1-sense-work-bare")?.lexemeId).toBe(
      "a1-lexeme-hataraku",
    );
    expect(senseById.get("a1-sense-study-bare")?.lexemeId).toBe(
      "a1-lexeme-benkyou-suru",
    );
    expect(senseById.get("a1-sense-do-bare")?.lexemeId).toBe(
      "a1-lexeme-suru",
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Phonetic contract (module 1).
// ---------------------------------------------------------------------------

describe("A1 module 1 · phonetic contract", () => {
  it("has four lessons with 10–12 contrastive items and matching practice refs", () => {
    expect(module1Lessons.length).toBe(4);
    expect(module1Recipe.lessonIds).toEqual([
      "sounds-1", "sounds-2", "sounds-3", "sounds-4",
    ]);
    for (const lesson of module1Lessons) {
      expect(lesson.contract).toBe("phonetic");
      expect(lesson.contrastiveItemIds.length).toBeGreaterThanOrEqual(10);
      expect(lesson.contrastiveItemIds.length).toBeLessThanOrEqual(12);
      expect(lesson.practiceTargetRefs.length).toBe(lesson.contrastiveItemIds.length);
      expect(new Set(lesson.contrastiveItemIds).size).toBe(lesson.contrastiveItemIds.length);
      expect(new Set(lesson.practiceTargetRefs).size).toBe(lesson.practiceTargetRefs.length);

      const items = module1ItemsByLesson[lesson.id];
      expect(items.length).toBe(lesson.contrastiveItemIds.length);
      const glyphs = items.map((i) => i.glyph);
      expect(new Set(glyphs).size).toBeGreaterThanOrEqual(5);
      const glyphReuse = new Map<string, number>();
      for (const g of glyphs) glyphReuse.set(g, (glyphReuse.get(g) ?? 0) + 1);
      expect(Math.max(...glyphReuse.values())).toBeLessThanOrEqual(2);

      for (const item of items) {
        for (const field of [item.id, item.glyph, item.kana, item.roman, item.contrastWithId, item.contrastFeature, item.exerciseRefId, item.hintCopyId]) {
          expect(typeof field).toBe("string");
          expect(field.length).toBeGreaterThan(0);
        }
        expect(["minimal-pair-listening", "mora-tiling", "reading-choice"]).toContain(item.exerciseKind);
        expect(/^[a-z0-9'-]+$/.test(item.roman)).toBe(true);
      }
    }
  });

  it("keeps every phonetic item id and exercise ref globally unique", () => {
    const ids = module1PhoneticItems.map((i) => i.id);
    const refs = module1PhoneticItems.map((i) => i.exerciseRefId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(refs).size).toBe(refs.length);
    expect(module1PhoneticItems.length).toBe(40);
  });

  it("consolidated sounds-5 breadth into sounds-4 (legacy alias preserved)", () => {
    expect(A1_LEGACY_LESSON_ALIASES["sounds-5"]).toBe("sounds-4");
  });

  it("preserves the koohii long-vowel policy in sounds-4 katakana", () => {
    const koohii = module1ItemsByLesson["sounds-4"].find((i) => i.roman === "koohii");
    expect(koohii, "koohii item present").toBeDefined();
    expect((koohii as { glyph: string }).glyph).toContain("コーヒー");
  });
});

// ---------------------------------------------------------------------------
// 5. Copy parity, coverage, and no-Japanese.
// ---------------------------------------------------------------------------

const JP_RE = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff66-\uff9f]/;

describe("A1 copy · parity, coverage, no Japanese", () => {
  it("en/it have identical key sets", () => {
    expect(Object.keys(a1CopyEn).sort()).toEqual(Object.keys(a1CopyIt).sort());
  });

  it("has no empty values and no Japanese, in either locale", () => {
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

  it("covers every copy id referenced by instructional lessons", () => {
    const referenced = new Set<string>();
    for (const built of instructionalBuilt) {
      for (const key of Object.keys(built.en)) referenced.add(key);
      referenced.add(built.recipe.primaryCanDoId + "-descriptor");
    }
    // translation + scenario keys are stored on the built lesson copy maps.
    for (const key of referenced) {
      if (key.endsWith("-descriptor")) continue; // descriptor copy is Task 4
      expect(a1CopyEn[key], `en ${key}`).toBeDefined();
      expect(a1CopyIt[key], `it ${key}`).toBeDefined();
    }
  });

  it("covers every module and phonetic outcome copy id", () => {
    for (const moduleId of ["sounds", "introductions", "essential-questions", "actions"] as const) {
      const outcomeId = A1_MODULE_MANIFEST[moduleId].outcomeCopyId;
      expect(a1CopyEn[outcomeId], outcomeId).toBeDefined();
      expect(a1CopyIt[outcomeId], outcomeId).toBeDefined();
    }
    for (const lesson of module1Lessons) {
      expect(a1CopyEn[lesson.outcomeCopyId]).toBeDefined();
      expect(a1CopyIt[lesson.outcomeCopyId]).toBeDefined();
    }
    for (const item of module1PhoneticItems) {
      expect(a1CopyEn[item.hintCopyId], item.hintCopyId).toBeDefined();
      expect(a1CopyIt[item.hintCopyId], item.hintCopyId).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Architecture guard: no fixture imports / fixture rule IDs in a1 catalog.
// ---------------------------------------------------------------------------

describe("A1 release data · architecture guard", () => {
  const catalogDir = __dirname;
  const sources = readdirSync(catalogDir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .map((f) => ({ f, text: readFileSync(join(catalogDir, f), "utf8") }));

  it("never imports the Phase-1 foundation fixtures", () => {
    for (const { f, text } of sources) {
      expect(/from\s+["'].*fixtures["']/.test(text), `${f} imports fixtures`).toBe(false);
      expect(text.includes("fixture-"), `${f} references a fixture id`).toBe(false);
    }
  });

  it("assembles a foundation catalog with no fixture ids anywhere", () => {
    const json = JSON.stringify({
      contexts: a1Contexts,
      personRoles: a1PersonRoles,
      referents: a1Referents,
      senses: a1LearningTargetSenses,
      values: a1SemanticValues,
      families: a1SentenceFamilies,
      variants: allVariants,
    });
    expect(json.includes("fixture-")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 7. Cumulative introduced-sense gating (manifest order).
// ---------------------------------------------------------------------------

describe("A1 introduced-sense gating", () => {
  it("never uses a predicate sense before it is introduced", () => {
    const order = [
      ...module2Recipe.lessonIds,
      ...module3Recipe.lessonIds,
      ...module4Recipe.lessonIds,
    ];
    const recipeById = new Map(instructionalBuilt.map((b) => [b.recipe.id, b.recipe]));
    const builtById = new Map(instructionalBuilt.map((b) => [b.recipe.id, b]));
    const introduced = new Set<string>();
    for (const lessonId of order) {
      const recipe = recipeById.get(lessonId);
      const built = builtById.get(lessonId);
      expect(recipe, lessonId).toBeDefined();
      if (!recipe || !built) continue;
      for (const s of recipe.introducedSenseIds) introduced.add(s);
      for (const v of built.variants) {
        const sentence = realize(v);
        expect(
          introduced.has(sentence.predicateSenseId),
          `${lessonId}/${v.id} uses ${sentence.predicateSenseId} before it is introduced`,
        ).toBe(true);
      }
    }
  });
});

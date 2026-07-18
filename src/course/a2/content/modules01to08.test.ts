/**
 * A2 Modules 1-8 — full cumulative aggregate validation (Phase 3 Task 5).
 *
 * The final, authoritative integration gate: assembles all 32 authored
 * M1-M8 lessons into one real `FoundationCatalogs` (never a fixture),
 * derives the honest M1-M8-served Can-do subset via `buildA2CanDos`,
 * computes cumulative introduced-content availability in canonical position
 * order, and runs the shared `validateFoundations` pipeline end-to-end
 * against real release data — exactly the same validator A1's own release
 * relies on. Extends every Task 4 exhaustive editorial audit
 * (malformed-conjugation guard, vocative-mistake/double-topic/speaker-label
 * detectors, I2 genuine-transfer-novelty, honest invariant FormSelection
 * metadata) to the complete 32-lesson set. No validator is ever weakened
 * here; a failure here must be fixed by correcting content/wiring, never by
 * loosening a check.
 */
import { describe, expect, it } from "vitest";

import { formatRomaji } from "../../../romaji/formatRomaji";
import { realizeVariant } from "../../foundations/realizeFamily";
import { validateFoundations } from "../../foundations/validateFoundations";
import type {
  CheckpointDefinition,
  CourseLevel,
  FoundationModule,
  SentenceFamily,
  SentenceVariant,
} from "../../foundations/types";
import {
  assembleA2FoundationCatalogs,
  computeAvailableContentByLesson,
  type A2BuiltLesson,
} from "../catalog/a2LessonBuilders";
import {
  A2_M1_M8_SERVED_CANDO_IDS,
  a2CanDoDescriptorCopy,
  buildA2CanDos,
} from "../catalog/canDos";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
  a2SharedCopy,
} from "../catalog/a2SemanticCatalog";
import { A2_CANONICAL_POSITIONS, A2_MODULE_MANIFEST } from "../manifest";
import { module1Lessons } from "./module01ConnectedConversation";
import { module2Lessons } from "./module02PlansInvitations";
import { module3Lessons } from "./module03ExperiencesNarratives";
import { module4Lessons } from "./module04ReasonsOpinions";
import { module5Lessons } from "./module05SequencingOngoing";
import { module6Lessons } from "./module06PermissionRequests";
import { module7Lessons } from "./module07NeighborhoodServices";
import { module8Lessons } from "./module08RestaurantProblems";

// ---------------------------------------------------------------------------
// Assemble the real, cumulative M1-M8 catalog (32 lessons, 8 modules)
// ---------------------------------------------------------------------------

const allBuiltLessonsUnsorted: readonly A2BuiltLesson[] = [
  ...module1Lessons,
  ...module2Lessons,
  ...module3Lessons,
  ...module4Lessons,
  ...module5Lessons,
  ...module6Lessons,
  ...module7Lessons,
  ...module8Lessons,
];

// Never assume authoring order is canonical order — sort explicitly by the
// real manifest's canonical position, exactly as `computeAvailableContentByLesson`'s
// own contract requires of its caller.
const allBuiltLessons: readonly A2BuiltLesson[] = [...allBuiltLessonsUnsorted].sort(
  (a, b) => A2_CANONICAL_POSITIONS[a.recipe.id] - A2_CANONICAL_POSITIONS[b.recipe.id],
);

const a2M1M8CanDos = buildA2CanDos(A2_M1_M8_SERVED_CANDO_IDS, allBuiltLessons);

const M1_M8_MODULE_IDS = [
  "connected-conversation",
  "plans-invitations",
  "experiences-narratives",
  "reasons-opinions",
  "sequencing-ongoing",
  "permission-requests",
  "neighborhood-services",
  "restaurant-problems",
] as const;

const foundationModules: readonly FoundationModule[] = M1_M8_MODULE_IDS.map((moduleId) => {
  const manifestEntry = A2_MODULE_MANIFEST[moduleId];
  const lessonsInModule = allBuiltLessons.filter((built) => built.recipe.moduleId === moduleId);
  const canDoIds = [
    ...new Set(
      lessonsInModule.flatMap((built) => [
        built.recipe.primaryCanDoId,
        ...built.recipe.supportingCanDoIds,
      ]),
    ),
  ].sort();
  return {
    id: moduleId,
    level: "a2",
    order: manifestEntry.order,
    canDoIds,
    lessonIds: [...manifestEntry.lessonIds],
  };
});

const foundationLevel: CourseLevel = {
  id: "a2",
  alignmentCopyId: "a2-level-alignment",
  moduleIds: [...M1_M8_MODULE_IDS],
  canDoIds: [...A2_M1_M8_SERVED_CANDO_IDS],
};

// A synthetic, interim checkpoint sampling exactly the M1-M8 taught primary
// Can-dos (no real A2 checkpoint module exists yet — that is a later task's
// deliverable).
const TAUGHT_PRIMARY_CAN_DO_IDS = [
  ...new Set(allBuiltLessons.map((built) => built.recipe.primaryCanDoId)),
].sort();

const interimCheckpoint: CheckpointDefinition = {
  id: "a2-checkpoint-m1-m8-interim",
  level: "a2",
  sampledCanDoIds: TAUGHT_PRIMARY_CAN_DO_IDS,
  minAcceptedTransferTargetsPerCanDo: 3,
};

const catalogs = assembleA2FoundationCatalogs({
  lessons: allBuiltLessons.map((built) => built.recipe),
  variants: allBuiltLessons.flatMap((built) => built.variants),
  canDos: a2M1M8CanDos,
  modules: foundationModules,
  levels: [foundationLevel],
  checkpoints: [interimCheckpoint],
});

// Unlike the M1-M4-only and M5-M8-only slice aggregates, this full M1-M8
// aggregate needs no `sentenceFamilies` scoping fix: `a2SentenceFamilies`
// (the complete, shared array) currently contains exactly the 33 families
// M1-M8's own 32 lessons collectively reference — zero orphans, zero
// out-of-scope families — so `catalogs.sentenceFamilies` is used as-is.
const availableContentByLesson = computeAvailableContentByLesson(allBuiltLessons, catalogs);

function mergeCopy(
  ...sources: readonly Readonly<Record<string, string>>[]
): Readonly<Record<string, string>> {
  const merged: Record<string, string> = {};
  for (const source of sources) Object.assign(merged, source);
  return merged;
}

const foundationCopy = {
  en: mergeCopy(
    a2SharedCopy.en,
    a2CanDoDescriptorCopy.en,
    { "a2-level-alignment": "A2 (CEFR) — elementary proficiency, building on A1." },
    ...allBuiltLessons.map((built) => built.en),
  ),
  it: mergeCopy(
    a2SharedCopy.it,
    a2CanDoDescriptorCopy.it,
    { "a2-level-alignment": "A2 (QCER) — competenza elementare, sopra le fondamenta dell'A1." },
    ...allBuiltLessons.map((built) => built.it),
  ),
};

describe("A2 M1-M8 aggregate — exactly 32 lessons across 8 modules in canonical order", () => {
  it("has exactly 32 lessons total", () => {
    expect(allBuiltLessons).toHaveLength(32);
  });

  it("lists each module's exact 4 lesson ids in the real manifest", () => {
    for (const moduleId of M1_M8_MODULE_IDS) {
      expect(A2_MODULE_MANIFEST[moduleId].lessonIds).toHaveLength(4);
    }
  });

  it("is sorted strictly ascending by canonical position", () => {
    const positions = allBuiltLessons.map((built) => A2_CANONICAL_POSITIONS[built.recipe.id]);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });
});

describe("A2 M1-M8 aggregate — buildA2CanDos honest subset", () => {
  it("materializes exactly the 31 M1-M8-served Can-dos, each with >=1 real lessonId", () => {
    expect(a2M1M8CanDos).toHaveLength(31);
    for (const canDo of a2M1M8CanDos) {
      expect(canDo.lessonIds.length, canDo.id).toBeGreaterThan(0);
    }
  });
});

describe("A2 M1-M8 aggregate — foundation copy parity", () => {
  it("has identical EN/IT key sets across the full aggregate", () => {
    expect(Object.keys(foundationCopy.en).sort()).toEqual(Object.keys(foundationCopy.it).sort());
  });

  it("has no Japanese literal in any aggregate copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const value of [...Object.values(foundationCopy.en), ...Object.values(foundationCopy.it)]) {
      expect(JAPANESE_PATTERN.test(value), value).toBe(false);
    }
  });
});

describe("A2 M1-M8 aggregate — validateFoundations end-to-end", () => {
  it("is valid against the real, cumulative M1-M8 release data (never weakened to pass)", () => {
    const result = validateFoundations({
      catalogs,
      foundationCopy,
      catalogVersion: "a2-m1-m8-task5",
      seed: "a2-task5-full-aggregate-seed",
      availableContentByLesson,
    });
    if (!result.valid) {
      throw new Error(
        `validateFoundations reported ${result.errors.length} error(s):\n` +
          JSON.stringify(result.errors, null, 2),
      );
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("A2 M1-M8 aggregate — Task4 editorial regression (malformed conjugation guard), extended to all 32 lessons", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  // The exact malformed sequences a fresh M1-M4 spec review found; never
  // recurs anywhere in the full 32-lesson release.
  const MALFORMED_SEQUENCES = ["はなます", "たべるませんか", "いくませんか", "みよてい"] as const;

  it("realizes every currently authored M1-M8 model+transfer variant with no known-malformed conjugation sequence, and formatRomaji().ok === true", () => {
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const family = famById.get(variant.sentenceFamilyId);
        expect(family, `${variant.id} family ${variant.sentenceFamilyId}`).toBeDefined();
        const result = realizeVariant(family as SentenceFamily, variant, realizeCatalogs, {
          availableConceptIds: [...(family as SentenceFamily).requiredConceptIds],
        });
        if (!result.ok) {
          throw new Error(`realize ${variant.id} failed: ${JSON.stringify(result.errors)}`);
        }
        const romaji = formatRomaji(result.sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
        for (const malformed of MALFORMED_SEQUENCES) {
          expect(
            result.sentence.canonicalJapanese,
            `${variant.id} must not contain malformed sequence "${malformed}"`,
          ).not.toContain(malformed);
        }
      }
    }
  });
});

// Task 4 final spec-fix ("keep transfer Japanese natural"), extended to
// M5-M8: a *named individual* (Sora/Emi) must never be marked as an
// explicit topic-marked subject (そらは/えみは) on a family whose own
// content is a complete direct-address speech act. M1-M4's own four
// direct-address families (invite/respond-invite/arrange-meeting/
// clarify-repeat) and M6-M8's nine direct-address families (permission/
// prohibition/request/negative-request/confirm-understanding/ask-where/
// ask-for-help) are combined into one allowlist here — M5's te-sequence/
// ongoing-teiru and M8's recount-experience are deliberately excluded
// (their "explicit" sora/emi usage is a genuine third-party narrative
// statement, e.g. so1's "そらは おきて、かおをあらいます", exactly like M1-M4's
// own cc1 precedent "そらはどうりょうとはなします" — never a vocative mistake).
describe("A2 M1-M8 aggregate — Task4 final spec-fix editorial audit (vocative mistakes, double-topic, speaker-label copy), extended to all 32 lessons", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const valueById = new Map(a2SemanticValues.map((value) => [value.id, value]));

  const DIRECT_ADDRESS_FAMILY_IDS: ReadonlySet<string> = new Set([
    // M1-M4
    "a2-family-invite",
    "a2-family-respond-invite",
    "a2-family-arrange-meeting",
    "a2-family-clarify-repeat",
    // M6-M8
    "a2-family-permission-temoii",
    "a2-family-permission-temoii-location",
    "a2-family-prohibition-tewaikenai",
    "a2-family-prohibition-tewaikenai-location",
    "a2-family-request-tekudasai",
    "a2-family-negative-request",
    "a2-family-confirm-understanding",
    "a2-family-ask-where",
    "a2-family-ask-for-help",
  ]);
  const NAMED_INDIVIDUAL_REFERENT_IDS: ReadonlySet<string> = new Set(["a2-referent-sora", "a2-referent-emi"]);

  function isVocativeMistake(variant: SentenceVariant, family: SentenceFamily): boolean {
    return (
      DIRECT_ADDRESS_FAMILY_IDS.has(family.id) &&
      variant.discourse.subjectRealization === "explicit" &&
      variant.discourse.subjectReferentId !== null &&
      NAMED_INDIVIDUAL_REFERENT_IDS.has(variant.discourse.subjectReferentId)
    );
  }

  function predicateOpensWithBakedTopic(predicateValueId: string | undefined): boolean {
    if (!predicateValueId) return false;
    const value = valueById.get(predicateValueId);
    if (!value) return false;
    const [first, second] = value.tokenFragments;
    if (!first || first.kind !== "lexical") return false;
    if (first.jp.endsWith("は")) return true;
    return second?.kind === "particle" && second.jp === "は";
  }

  const DOUBLE_TOPIC_RISK_FAMILY_IDS: ReadonlySet<string> = new Set([
    "a2-family-connector-utterance",
    "a2-family-plan-yotei",
    "a2-family-plan-tsumori",
  ]);

  function isDoubleTopic(variant: SentenceVariant): boolean {
    return (
      DOUBLE_TOPIC_RISK_FAMILY_IDS.has(variant.sentenceFamilyId) &&
      variant.discourse.subjectRealization === "explicit" &&
      predicateOpensWithBakedTopic(variant.slotValues.predicate)
    );
  }

  it("flags zero vocative mistakes across every currently authored M1-M8 model+transfer", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const family = famById.get(variant.sentenceFamilyId);
        if (!family) continue;
        if (isVocativeMistake(variant, family)) {
          violations.push(
            `${variant.id}: explicit subject "${variant.discourse.subjectReferentId}" on direct-address family "${family.id}" — should be vocative, not explicit`,
          );
        }
      }
    }
    expect(violations, `${violations.length} vocative mistake(s):\n${violations.join("\n")}`).toEqual([]);
  });

  it("flags zero double-topic transfers across every currently authored M1-M8 model+transfer", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        if (isDoubleTopic(variant)) {
          violations.push(
            `${variant.id}: explicit subject recombined with predicate "${variant.slotValues.predicate}", whose own content already opens with a baked topic marker`,
          );
        }
      }
    }
    expect(violations, `${violations.length} double-topic transfer(s):\n${violations.join("\n")}`).toEqual([]);
  });

  it('never uses the "Name: ..." colon speaker-label copy convention in any EN/IT copy', () => {
    const SPEAKER_LABEL_PATTERN = /^[A-ZÀ-Ý][\p{L}]*:\s/u;
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const [copyId, value] of Object.entries(built.en)) {
        if (SPEAKER_LABEL_PATTERN.test(value)) violations.push(`en/${copyId}: "${value}"`);
      }
      for (const [copyId, value] of Object.entries(built.it)) {
        if (SPEAKER_LABEL_PATTERN.test(value)) violations.push(`it/${copyId}: "${value}"`);
      }
    }
    expect(violations, `${violations.length} speaker-label colon copy violation(s):\n${violations.join("\n")}`).toEqual(
      [],
    );
  });
});

// I2 spec-fix ("true transfer failure"), extended to all 32 lessons: a
// transfer is only a genuine test of transfer if its *visible* answer
// (visibleTargetKey — canonicalJapanese-only, never discourse/context
// metadata) is something the learner has never been shown as a model in
// this same lesson.
describe("A2 M1-M8 aggregate — I2 spec-fix (genuine round-two transfers, not hidden-metadata duplicates), extended to all 32 lessons", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  function realizeI2(variant: (typeof allBuiltLessons)[number]["variants"][number]) {
    const family = famById.get(variant.sentenceFamilyId);
    expect(family, `${variant.id} family ${variant.sentenceFamilyId}`).toBeDefined();
    const result = realizeVariant(family as SentenceFamily, variant, realizeCatalogs, {
      availableConceptIds: [...(family as SentenceFamily).requiredConceptIds],
    });
    if (!result.ok) {
      throw new Error(`realize ${variant.id} failed: ${JSON.stringify(result.errors)}`);
    }
    return result.sentence;
  }

  it("every lesson's transfer visible targets all differ from every model visible target in that same lesson", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      const models = built.variants.filter((v) => v.pedagogicalUse === "model");
      const transfers = built.variants.filter((v) => v.pedagogicalUse === "transfer");
      const modelKeys = new Map<string, string>();
      for (const model of models) {
        modelKeys.set(realizeI2(model).visibleTargetKey, model.id);
      }
      for (const transfer of transfers) {
        const key = realizeI2(transfer).visibleTargetKey;
        const duplicatedModelId = modelKeys.get(key);
        if (duplicatedModelId) {
          violations.push(
            `${built.recipe.id}: transfer "${transfer.id}" duplicates model "${duplicatedModelId}"'s visible target "${key}"`,
          );
        }
      }
    }
    expect(violations, `${violations.length} transfer(s) duplicate a same-lesson model:\n${violations.join("\n")}`).toEqual(
      [],
    );
  });

  it("every lesson has at least 5 transfers, each genuinely novel relative to that lesson's models", () => {
    for (const built of allBuiltLessons) {
      const models = built.variants.filter((v) => v.pedagogicalUse === "model");
      const transfers = built.variants.filter((v) => v.pedagogicalUse === "transfer");
      expect(transfers.length, built.recipe.id).toBeGreaterThanOrEqual(5);
      const modelKeys = new Set(models.map((v) => realizeI2(v).visibleTargetKey));
      const genuineTransferCount = transfers.filter((t) => !modelKeys.has(realizeI2(t).visibleTargetKey)).length;
      expect(genuineTransferCount, `${built.recipe.id} genuine transfer count`).toBeGreaterThanOrEqual(2);
    }
  });

  it("collects zero total transfer-novelty collisions across the entire 32-lesson release", () => {
    let collisionCount = 0;
    for (const built of allBuiltLessons) {
      const models = built.variants.filter((v) => v.pedagogicalUse === "model");
      const transfers = built.variants.filter((v) => v.pedagogicalUse === "transfer");
      const modelKeys = new Set(models.map((v) => realizeI2(v).visibleTargetKey));
      collisionCount += transfers.filter((t) => modelKeys.has(realizeI2(t).visibleTargetKey)).length;
    }
    expect(collisionCount).toBe(0);
  });
});

// M4 spec-fix ("form metadata"), extended to M5-M8: audits every
// invariant-family variant's `FormSelection` against the honest register
// its own baked Japanese actually realizes, across the full M1-M8 release.
describe("A2 M1-M8 aggregate — M4-style honest invariant FormSelection metadata, extended to all 32 lessons", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  const MOOD_CARVEOUT_FAMILIES: ReadonlySet<string> = new Set([
    "a2-family-invite",
    "a2-family-respond-invite",
    "a2-family-arrange-meeting",
  ]);

  const HONEST_FORM_BY_VALUE_ID: Readonly<Record<string, { polarity: string; tense: string; formality: string }>> = {
    // --- M1-M4 ---
    "a2-value-plain-iku-dict": { polarity: "affirmative", tense: "present", formality: "plain" },
    "a2-value-plain-iku-neg": { polarity: "negative", tense: "present", formality: "plain" },
    "a2-value-plain-taberu-past": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-plain-hanasu-dict": { polarity: "affirmative", tense: "present", formality: "plain" },
    "a2-value-plain-matsu-past-neg": { polarity: "negative", tense: "past", formality: "plain" },
    "a2-value-plain-oyogu-dict": { polarity: "affirmative", tense: "present", formality: "plain" },
    "a2-value-plain-asobu-dict": { polarity: "affirmative", tense: "present", formality: "plain" },
    "a2-value-plain-yomu-neg": { polarity: "negative", tense: "present", formality: "plain" },
    "a2-value-plain-tanoshikatta": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-plain-yuumei-datta": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-plain-warukatta": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-narrate-asagohan-gakkou": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-narrate-umi-yama": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-narrate-matsu-tabeta": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-narrate-kyouto-tanoshikatta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-ame-ie": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-isogashikatta-dekakenakatta": { polarity: "negative", tense: "past", formality: "polite" },
    "a2-value-node-densha-kaigi": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-ame-futta-uchi": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-jikanganakatta-takushii": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-samukatta-kooto": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-shigoto-owatta-kaetta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-byouki-yasunda": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-kara-isogashii-tsukareta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-connector-test-demo-ganbatta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-connector-ame-sorekara-hare": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-connector-shigoto-sorekara-kaeru": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-connector-tsukareta-demo-ureshii": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-clarify-wakarimasen": { polarity: "negative", tense: "present", formality: "polite" },
    "a2-value-clarify-wakarimashita": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-clarify-kikoemasen": { polarity: "negative", tense: "past", formality: "polite" },
    "a2-value-disagree-omoimasen": { polarity: "negative", tense: "present", formality: "polite" },
    // --- M5-M8 ---
    "a2-value-seq-hataraite-tsukareta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-oyoide-tsukareta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-onegaishite-harau": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-kazoete-harau": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-tabete-harau": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-nonde-harau": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-mite-tanomu": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-problem-konai": { polarity: "negative", tense: "present", formality: "polite" },
    "a2-value-problem-tarinai": { polarity: "negative", tense: "present", formality: "polite" },
    "a2-value-problem-machigai": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-problem-daremo-konai": { polarity: "negative", tense: "present", formality: "polite" },
  };

  const DEFAULT_HONEST_FORM = { polarity: "affirmative", tense: "present", formality: "polite" } as const;

  it("every invariant-family M1-M8 variant's FormSelection matches the honest register its own baked Japanese actually is", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const family = famById.get(variant.sentenceFamilyId);
        if (!family || family.realizationRuleId !== "rule-invariant-utterance") continue;
        if (MOOD_CARVEOUT_FAMILIES.has(family.id)) continue;
        const predicateValueId = variant.slotValues.predicate;
        const expected = HONEST_FORM_BY_VALUE_ID[predicateValueId] ?? DEFAULT_HONEST_FORM;
        const actual = variant.form;
        if (
          actual.polarity !== expected.polarity ||
          actual.tense !== expected.tense ||
          actual.formality !== expected.formality
        ) {
          const result = realizeVariant(family, variant, realizeCatalogs, {
            availableConceptIds: [...family.requiredConceptIds],
          });
          const jp = result.ok ? result.sentence.canonicalJapanese : "<realize failed>";
          violations.push(
            `${variant.id} (${predicateValueId} => "${jp}"): form is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
          );
        }
      }
    }
    expect(violations, `${violations.length} dishonest FormSelection(s):\n${violations.join("\n")}`).toEqual([]);
  });

  it("keeps たことがあります (experience-takoto) and other final-polite constructions honestly polite even though their embedded base is past", () => {
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const family = famById.get(variant.sentenceFamilyId);
        if (!family || family.id !== "a2-family-experience-takoto") continue;
        expect(variant.form.formality, variant.id).toBe("polite");
        expect(variant.form.polarity, variant.id).toBe("affirmative");
        expect(variant.form.tense, variant.id).toBe("present");
      }
    }
  });
});

describe("A2 M1-M8 aggregate — kanji exposure wiring across all 32 lessons", () => {
  it("every lesson's kanjiExposureIds resolves from the real Task 3 catalog (no omissions/inventions)", () => {
    for (const built of allBuiltLessons) {
      expect(built.recipe.kanjiExposureIds.length, built.recipe.id).toBeGreaterThan(0);
    }
  });
});

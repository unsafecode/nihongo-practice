/**
 * A2 Modules 5-8 — cross-module aggregate validation (Phase 3 Task 5).
 *
 * The M5-M8-only integration gate: assembles all 16 authored M5-M8 lessons
 * into one real `FoundationCatalogs` (never a fixture), derives the honest
 * M5-M8-served Can-do subset via `buildA2CanDos`, computes cumulative
 * introduced-content availability in canonical position order, and runs the
 * shared `validateFoundations` pipeline end-to-end against real release
 * data. Mirrors `modules01to04.test.ts`'s structure exactly (Task 4's
 * exhaustive editorial audits — malformed conjugation, vocative mistakes,
 * double topic, I2 genuine-transfer novelty, honest FormSelection metadata
 * — extended to the 16 new M5-M8 lessons). No validator is ever weakened
 * here; a failure here must be fixed by correcting content/wiring, never by
 * loosening a check. The full 32-lesson M1-M8 aggregate lives in
 * `modules01to08.test.ts`.
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
} from "../../foundations/types";
import {
  assembleA2FoundationCatalogs,
  computeAvailableContentByLesson,
  type A2BuiltLesson,
} from "../catalog/a2LessonBuilders";
import {
  A2_M5_M8_SERVED_CANDO_IDS,
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
import { module5Lessons } from "./module05SequencingOngoing";
import { module6Lessons } from "./module06PermissionRequests";
import { module7Lessons } from "./module07NeighborhoodServices";
import { module8Lessons } from "./module08RestaurantProblems";

// ---------------------------------------------------------------------------
// Assemble the real, cumulative M5-M8 catalog
// ---------------------------------------------------------------------------

const allBuiltLessonsUnsorted: readonly A2BuiltLesson[] = [
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

const a2M5M8CanDos = buildA2CanDos(A2_M5_M8_SERVED_CANDO_IDS, allBuiltLessons);

const M5_M8_MODULE_IDS = [
  "sequencing-ongoing",
  "permission-requests",
  "neighborhood-services",
  "restaurant-problems",
] as const;

const foundationModules: readonly FoundationModule[] = M5_M8_MODULE_IDS.map((moduleId) => {
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
  moduleIds: [...M5_M8_MODULE_IDS],
  canDoIds: [...A2_M5_M8_SERVED_CANDO_IDS],
};

// A synthetic, interim checkpoint sampling exactly the M5-M8 taught primary
// Can-dos (mirrors modules01to04.test.ts's own interim checkpoint).
const TAUGHT_PRIMARY_CAN_DO_IDS = [
  ...new Set(allBuiltLessons.map((built) => built.recipe.primaryCanDoId)),
].sort();

const interimCheckpoint: CheckpointDefinition = {
  id: "a2-checkpoint-m5-m8-interim",
  level: "a2",
  sampledCanDoIds: TAUGHT_PRIMARY_CAN_DO_IDS,
  minAcceptedTransferTargetsPerCanDo: 3,
};

const catalogs = assembleA2FoundationCatalogs({
  lessons: allBuiltLessons.map((built) => built.recipe),
  variants: allBuiltLessons.flatMap((built) => built.variants),
  canDos: a2M5M8CanDos,
  modules: foundationModules,
  levels: [foundationLevel],
  checkpoints: [interimCheckpoint],
});

// Mirrors modules01to04.test.ts's own `scopedCatalogs` fix: `assembleA2FoundationCatalogs`
// always exposes the complete, ever-growing shared `a2SentenceFamilies`
// array (by design), so an M5-M8-only aggregate must scope `sentenceFamilies`
// down to exactly the families the 16 M5-M8 lessons' own variants actually
// reference — never a validator weakening, just correctly-scoped input data
// for an intentionally M5-M8-only test.
const m5m8FamilyIds = new Set(
  allBuiltLessons.flatMap((built) => built.variants.map((variant) => variant.sentenceFamilyId)),
);
const scopedCatalogs = {
  ...catalogs,
  sentenceFamilies: catalogs.sentenceFamilies.filter((family) => m5m8FamilyIds.has(family.id)),
};

const availableContentByLesson = computeAvailableContentByLesson(allBuiltLessons, scopedCatalogs);

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

describe("A2 M5-M8 aggregate — exactly 16 lessons across 4 modules in canonical order", () => {
  it("has exactly 16 lessons total", () => {
    expect(allBuiltLessons).toHaveLength(16);
  });

  it("lists each module's exact 4 lesson ids in the real manifest", () => {
    for (const moduleId of M5_M8_MODULE_IDS) {
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

describe("A2 M5-M8 aggregate — buildA2CanDos honest subset", () => {
  it("materializes exactly the 17 M5-M8-served Can-dos, each with >=1 real lessonId", () => {
    expect(a2M5M8CanDos).toHaveLength(17);
    for (const canDo of a2M5M8CanDos) {
      expect(canDo.lessonIds.length, canDo.id).toBeGreaterThan(0);
    }
  });
});

describe("A2 M5-M8 aggregate — foundation copy parity", () => {
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

describe("A2 M5-M8 aggregate — validateFoundations end-to-end", () => {
  it("is valid against the real, cumulative M5-M8 release data (never weakened to pass)", () => {
    const result = validateFoundations({
      catalogs: scopedCatalogs,
      foundationCopy,
      catalogVersion: "a2-m5-m8-task5",
      seed: "a2-task5-aggregate-seed",
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

describe("A2 M5-M8 aggregate — realization soundness (romaji formats OK for every variant)", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  it("realizes every currently authored M5-M8 model+transfer variant with formatRomaji().ok === true", () => {
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
      }
    }
  });
});

// Task 4 final spec-fix, extended to M5-M8: a *named individual* (Sora/Emi)
// must never be marked as an explicit topic-marked subject (そらは/えみは) on
// a family whose own content is a complete direct-address speech act
// (permission/prohibition/request/special-request/ask-for-help) — natural
// Japanese addresses that person with a vocative (そらさん、) instead.
// Mirrors M1-M4's own narrow, explicit-allowlist scoping exactly: M5's
// te-sequence/ongoing-teiru and M8's recount-experience content
// legitimately use "explicit" sora/emi as third-party narrative-statement
// subjects (e.g. so1's "そらは おきて、かおをあらいます" — "Sora gets up, then
// washes his face" — a genuine statement *about* Sora, not a vocative
// mistake, exactly like M1-M4's cc1 precedent), so those families are
// deliberately excluded from this specific check.
describe("A2 M5-M8 aggregate — vocative-mistake audit (never sora/emi as an explicit topic-marked subject on a direct-address family)", () => {
  const NAMED_INDIVIDUAL_REFERENT_IDS: ReadonlySet<string> = new Set(["a2-referent-sora", "a2-referent-emi"]);
  const DIRECT_ADDRESS_FAMILY_IDS: ReadonlySet<string> = new Set([
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

  it("flags zero vocative mistakes across every currently authored M5-M8 model+transfer", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        if (
          DIRECT_ADDRESS_FAMILY_IDS.has(variant.sentenceFamilyId) &&
          variant.discourse.subjectRealization === "explicit" &&
          variant.discourse.subjectReferentId !== null &&
          NAMED_INDIVIDUAL_REFERENT_IDS.has(variant.discourse.subjectReferentId)
        ) {
          violations.push(
            `${variant.id}: explicit subject "${variant.discourse.subjectReferentId}" on direct-address family "${variant.sentenceFamilyId}" — should be vocative, not explicit`,
          );
        }
      }
    }
    expect(violations, `${violations.length} vocative mistake(s):\n${violations.join("\n")}`).toEqual([]);
  });
});

// I2 spec-fix, extended to M5-M8: a round-two transfer must realize a
// genuinely novel *visible* answer relative to every same-lesson model —
// deliberately independent of `semanticFingerprint` (context/speaker alone
// can never satisfy this), checked via `visibleTargetKey`
// (canonicalJapanese-only).
describe("A2 M5-M8 aggregate — I2 spec-fix (genuine round-two transfers, not hidden-metadata duplicates)", () => {
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
});

// M4 spec-fix, extended to M5-M8's own new "rule-invariant-utterance"
// families (a2-family-te-sequence/-ask-where/-ask-for-help/
// -confirm-understanding/-recount-experience): audits every such variant's
// `FormSelection` against the honest register its own baked Japanese
// actually realizes. Compositional families (temoii/tewaikenai/tekudasai/
// naidekudasai/possibility/express-ability/describe-facility) are out of
// scope here exactly like M4's own audit — their predicate senses are each
// a single verb conjugation form via `newVerbSuffixKana`/`suffixKana`, which
// by construction always produces the same honest present-tense-shaped
// register, so the builder's own default can never mismatch for them.
describe("A2 M5-M8 aggregate — M4-style honest invariant FormSelection metadata, extended to M5-M8", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  // Every currently-authored M5-M8 "rule-invariant-utterance" predicate
  // value whose own final clause is genuinely negative and/or past — one
  // flat source of truth, exhaustive over both the dishonest ones (mapped
  // to their corrected form below) and the honest ones (left absent, so the
  // default-expectation fallback proves they stay honest).
  const HONEST_FORM_BY_VALUE_ID: Readonly<Record<string, { polarity: string; tense: string; formality: string }>> = {
    // --- a2-family-te-sequence: mostly present (X-te, Y-masu), but these
    // end their final clause in ました (a genuine past narrative) ---
    "a2-value-seq-hataraite-tsukareta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-oyoide-tsukareta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-onegaishite-harau": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-kazoete-harau": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-tabete-harau": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-nonde-harau": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-seq-mite-tanomu": { polarity: "affirmative", tense: "past", formality: "polite" },
    // --- a2-family-recount-experience: mostly present, but these four's
    // own final clause is genuinely negative-present or past ---
    "a2-value-problem-konai": { polarity: "negative", tense: "present", formality: "polite" },
    "a2-value-problem-tarinai": { polarity: "negative", tense: "present", formality: "polite" },
    "a2-value-problem-machigai": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-problem-daremo-konai": { polarity: "negative", tense: "present", formality: "polite" },
  };

  const DEFAULT_HONEST_FORM = { polarity: "affirmative", tense: "present", formality: "polite" } as const;

  const M5_M8_INVARIANT_UTTERANCE_FAMILY_IDS: ReadonlySet<string> = new Set([
    "a2-family-te-sequence",
    "a2-family-ask-where",
    "a2-family-ask-for-help",
    "a2-family-confirm-understanding",
    "a2-family-recount-experience",
  ]);

  it("every M5-M8 rule-invariant-utterance variant's FormSelection matches the honest register its own baked Japanese actually is", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const family = famById.get(variant.sentenceFamilyId);
        if (!family || family.realizationRuleId !== "rule-invariant-utterance") continue;
        if (!M5_M8_INVARIANT_UTTERANCE_FAMILY_IDS.has(family.id)) continue;
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
});

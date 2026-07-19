/**
 * A2 Modules 9-12 — cross-module aggregate validation (Phase 3 Task 6).
 *
 * The M9-M12-only integration gate: assembles all 16 authored M9-M12
 * lessons into one real `FoundationCatalogs` (never a fixture), derives the
 * honest M9-M12-served Can-do subset via `buildA2CanDos`, computes
 * cumulative introduced-content availability in canonical position order,
 * and runs the shared `validateFoundations` pipeline end-to-end against
 * real release data. Mirrors `modules05to08.test.ts`'s structure exactly
 * (Task 4/5's exhaustive editorial audits — malformed conjugation, vocative
 * mistakes, double topic, I2 genuine-transfer novelty, honest FormSelection
 * metadata — extended to the 16 new M9-M12 lessons, plus the new
 * comparison/superlative realizer rules and the genuinely compositional
 * families this task adds). No validator is ever weakened here; a failure
 * here must be fixed by correcting content/wiring, never by loosening a
 * check. The full 48-lesson M1-M12 aggregate lives in
 * `modules01to12.test.ts`.
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
  A2_M9_M12_SERVED_CANDO_IDS,
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
import { module9Lessons } from "./module09ShoppingReturns";
import { module10Lessons } from "./module10HealthAdvice";
import { module11Lessons } from "./module11WorkStudyMessages";
import { module12Lessons } from "./module12TravelReservations";

// ---------------------------------------------------------------------------
// Assemble the real, cumulative M9-M12 catalog
// ---------------------------------------------------------------------------

const allBuiltLessonsUnsorted: readonly A2BuiltLesson[] = [
  ...module9Lessons,
  ...module10Lessons,
  ...module11Lessons,
  ...module12Lessons,
];

// Never assume authoring order is canonical order — sort explicitly by the
// real manifest's canonical position, exactly as `computeAvailableContentByLesson`'s
// own contract requires of its caller.
const allBuiltLessons: readonly A2BuiltLesson[] = [...allBuiltLessonsUnsorted].sort(
  (a, b) => A2_CANONICAL_POSITIONS[a.recipe.id] - A2_CANONICAL_POSITIONS[b.recipe.id],
);

const a2M9M12CanDos = buildA2CanDos(A2_M9_M12_SERVED_CANDO_IDS, allBuiltLessons);

// Every sentence family actually referenced by an M9-M12 variant — computed
// early since both `allReferencedCanDoIds` below and the `sentenceFamilies`
// scoping fix further down need it.
const m9m12FamilyIds = new Set(
  allBuiltLessons.flatMap((built) => built.variants.map((variant) => variant.sentenceFamilyId)),
);

// Unlike M5-M8 (whose own supportingCanDoIds never referenced an M1-M4 id),
// M9-M12's own recipes genuinely recombine several already-served M1-M8
// grammar families as support (a2-family-opinion-toomou/possibility/
// reason-kara/reason-node/request-tekudasai/ongoing-teiru/
// experience-takoto/intentions-plans/negative-request — every one of them
// a real, honest "true transfer" per the task recipe). For this
// M9-M12-only aggregate's own referential integrity, `catalogs.canDos`
// needs every Can-do id any M9-M12 lesson actually names as primary or
// support — the honest 15 M9-M12-served ids UNION the already-served
// grammar ids these 16 lessons legitimately reuse.
const primaryOrSupportCanDoIds = new Set(
  allBuiltLessons.flatMap((built) => [built.recipe.primaryCanDoId, ...built.recipe.supportingCanDoIds]),
);
const catalogsCanDos = buildA2CanDos([...primaryOrSupportCanDoIds].sort(), allBuiltLessons);

const M9_M12_MODULE_IDS = [
  "shopping-returns",
  "health-advice",
  "work-study-messages",
  "travel-reservations",
] as const;

const foundationModules: readonly FoundationModule[] = M9_M12_MODULE_IDS.map((moduleId) => {
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
  moduleIds: [...M9_M12_MODULE_IDS],
  canDoIds: [...A2_M9_M12_SERVED_CANDO_IDS],
};

// A synthetic, interim checkpoint sampling exactly the M9-M12 taught primary
// Can-dos (mirrors modules05to08.test.ts's own interim checkpoint).
const TAUGHT_PRIMARY_CAN_DO_IDS = [
  ...new Set(allBuiltLessons.map((built) => built.recipe.primaryCanDoId)),
].sort();

const interimCheckpoint: CheckpointDefinition = {
  id: "a2-checkpoint-m9-m12-interim",
  level: "a2",
  sampledCanDoIds: TAUGHT_PRIMARY_CAN_DO_IDS,
  minAcceptedTransferTargetsPerCanDo: 3,
};

const catalogs = assembleA2FoundationCatalogs({
  lessons: allBuiltLessons.map((built) => built.recipe),
  variants: allBuiltLessons.flatMap((built) => built.variants),
  canDos: catalogsCanDos,
  modules: foundationModules,
  levels: [foundationLevel],
  checkpoints: [interimCheckpoint],
});

// Mirrors modules01to04.test.ts/modules05to08.test.ts's own `scopedCatalogs`
// fix: `assembleA2FoundationCatalogs` always exposes the complete,
// ever-growing shared `a2SentenceFamilies` array (by design), so an
// M9-M12-only aggregate must scope `sentenceFamilies` down to exactly the
// families the 16 M9-M12 lessons' own variants actually reference (the
// `m9m12FamilyIds` set computed above) — never a validator weakening, just
// correctly-scoped input data for an intentionally M9-M12-only test.
//
// Several of those *reused* families (a2-family-request-tekudasai,
// a2-family-experience-takoto, a2-family-reason-kara,
// a2-family-ongoing-teiru, a2-family-possibility) were originally
// introduced back in M3-M7, and each one's own static `canDoIds` array —
// declared once, shared across every module that ever uses the family —
// also names a *topical* Can-do id from that earlier module (e.g.
// a2-family-request-tekudasai also names `a2-cando-ask-directions`, M7's
// neighborhood-services-3 primary; see each family's own doc-comment in
// a2SemanticCatalog.ts). Those earlier-module topical ids are genuinely
// out of scope here (no M9-M12 lesson ever teaches or transfers them), so
// this test's own scoped view of each reused family trims `canDoIds` down
// to just the ids this M9-M12 slice actually serves or reuses — never a
// validator weakening (`checkReferences` itself is untouched and still
// demands 100% integrity against whatever catalogs it is given), just
// correctly-scoped input data, exactly like the family-list filter already
// above it. The FULL, untrimmed canDoIds for every family (spanning its
// entire real cross-module usage) is verified end-to-end by
// `modules01to12.test.ts`.
const scopedCatalogs = {
  ...catalogs,
  sentenceFamilies: catalogs.sentenceFamilies
    .filter((family) => m9m12FamilyIds.has(family.id))
    .map((family) => ({
      ...family,
      canDoIds: family.canDoIds.filter((id) => primaryOrSupportCanDoIds.has(id)),
    })),
};

const availableContentByLesson = computeAvailableContentByLesson(allBuiltLessons, scopedCatalogs);

// Several M9-M12 "true transfer" lines legitimately reuse a sense/value
// that was REALLY, already introduced by an earlier M1-M8 model (e.g.
// shopping-returns-3-t4 reuses `a2-family-possibility`'s own
// "tsukau"+"kaado" pairing verbatim from neighborhood-services-2's own
// models; travel-reservations-1-t2 the same; work-study-messages-2-t5
// reuses `a2-family-request-tekudasai`'s own "hanasu" sense verbatim from
// permission-requests-3's own models; shopping-returns-4/health-advice-1
// use the ordinary "sora"/"emi" referent values, introduced far earlier
// than M9). `computeAvailableContentByLesson` can only see the 16 M9-M12
// lessons actually passed to it, so these real, already-cumulatively-true
// facts about the wider M1-M8 catalog are invisible to it here — exactly
// the same scoping tension as the Can-do/family fixes above, just for
// sense/value availability instead. Rather than either (a) importing
// modules 1-8 into an "M9-M12-only" test, or (b) fabricating availability
// that isn't real, this test seeds the REAL ids (verified directly against
// module06PermissionRequests.ts/module07NeighborhoodServices.ts's own
// models) into every M9-M12 lesson's availability from the very first
// lesson onward — never a validator weakening, just correctly-scoped
// input data. The full M1-M12 aggregate needs no such seed at all, since
// M6/M7 are genuinely present there.
const M1_M8_REUSED_SENSE_IDS = [
  "a2-sense-possibility-tsukau", // neighborhood-services-2-m1
  "a2-sense-possibility-hanasu", // neighborhood-services-2-m3
  "a2-sense-tekudasai-hanasu", // permission-requests-3-m7
];
const M1_M8_REUSED_VALUE_IDS = [
  "a2-value-sora", // referent, introduced at A1
  "a2-value-emi", // referent, introduced at A1
  "a2-value-possibility-tsukau", // neighborhood-services-2-m1
  "a2-value-possibility-hanasu", // neighborhood-services-2-m3
  "a2-value-obj-kaado", // neighborhood-services-1/2's own object
  "a2-value-obj-nihongo-m7", // neighborhood-services-2's own object
  "a2-value-tekudasai-hanasu", // permission-requests-3-m7
];
const availableContentByLessonWithM1M8Reuse: Readonly<
  Record<string, (typeof availableContentByLesson)[string]>
> = Object.fromEntries(
  Object.entries(availableContentByLesson).map(([lessonId, availability]) => [
    lessonId,
    {
      conceptIds: availability.conceptIds,
      senseIds: [...new Set([...availability.senseIds, ...M1_M8_REUSED_SENSE_IDS])].sort(),
      semanticValueIds: [...new Set([...availability.semanticValueIds, ...M1_M8_REUSED_VALUE_IDS])].sort(),
      forms: availability.forms,
    },
  ]),
);

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

describe("A2 M9-M12 aggregate — exactly 16 lessons across 4 modules in canonical order", () => {
  it("has exactly 16 lessons total", () => {
    expect(allBuiltLessons).toHaveLength(16);
  });

  it("lists each module's exact 4 lesson ids in the real manifest", () => {
    for (const moduleId of M9_M12_MODULE_IDS) {
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

describe("A2 M9-M12 aggregate — buildA2CanDos honest subset", () => {
  it("materializes exactly the 15 M9-M12-served Can-dos, each with >=1 real lessonId", () => {
    expect(a2M9M12CanDos).toHaveLength(15);
    for (const canDo of a2M9M12CanDos) {
      expect(canDo.lessonIds.length, canDo.id).toBeGreaterThan(0);
    }
  });
});

describe("A2 M9-M12 aggregate — foundation copy parity", () => {
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

describe("A2 M9-M12 aggregate — validateFoundations end-to-end", () => {
  it("is valid against the real, cumulative M9-M12 release data (never weakened to pass)", () => {
    const result = validateFoundations({
      catalogs: scopedCatalogs,
      foundationCopy,
      catalogVersion: "a2-m9-m12-task6",
      seed: "a2-task6-aggregate-seed",
      availableContentByLesson: availableContentByLessonWithM1M8Reuse,
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

describe("A2 M9-M12 aggregate — realization soundness (romaji formats OK for every variant)", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  it("realizes every currently authored M9-M12 model+transfer variant with formatRomaji().ok === true", () => {
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

// Task 4 final spec-fix, extended to M9-M12: a *named individual* (Sora/Emi)
// must never be marked as an explicit topic-marked subject (そらは/えみは) on
// a family whose own content is a complete direct-address speech act
// (permission/prohibition/request/special-request/ask-for-help). Natural
// Japanese addresses that person with a vocative (そらさん、) instead.
describe("A2 M9-M12 aggregate — vocative-mistake audit (never sora/emi as an explicit topic-marked subject on a direct-address family)", () => {
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
    "a2-family-ask-colleague",
    "a2-family-change-cancel",
  ]);

  it("flags zero vocative mistakes across every currently authored M9-M12 model+transfer", () => {
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

// I2 spec-fix, extended to M9-M12: a *social* role referent
// (teacher/friend/colleague) can never be vocative-addressed. Real Japanese
// never says 先生さん/友達さん/同僚さん — a generic social-role noun does not
// take さん in direct address the way a real name does. Only `"persona"`
// (sora/emi) and `"unnamed"` (clerk) referent kinds naturally take vocative
// さん.
describe("A2 M9-M12 aggregate — social-role vocative audit (teacher/friend/colleague can never be vocative-addressed)", () => {
  const referentById = new Map(a2Referents.map((r) => [r.id, r]));
  const roleById = new Map(a2PersonRoles.map((r) => [r.id, r]));

  function isSocialRoleVocativeMistake(variant: SentenceVariant): boolean {
    if (variant.discourse.subjectRealization !== "vocative") return false;
    const referentId = variant.discourse.subjectReferentId;
    if (!referentId) return false;
    const referent = referentById.get(referentId);
    if (!referent) return false;
    const role = roleById.get(referent.personRoleId);
    return role?.kind === "social";
  }

  it("flags zero social-role vocative mistakes across every currently authored M9-M12 model+transfer", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        if (isSocialRoleVocativeMistake(variant)) {
          violations.push(
            `${variant.id}: vocative-addressed "${variant.discourse.subjectReferentId}" has person-role kind "social" — teacher/friend/colleague cannot naturally take vocative さん; use a persona (sora/emi) or unnamed (clerk) referent instead`,
          );
        }
      }
    }
    expect(violations, `${violations.length} social-role vocative mistake(s):\n${violations.join("\n")}`).toEqual([]);
  });
});

// I2 spec-fix, extended to M9-M12: a round-two transfer must realize a
// genuinely novel *visible* answer relative to every same-lesson model —
// deliberately independent of `semanticFingerprint` (context/speaker alone
// can never satisfy this), checked via `visibleTargetKey`
// (canonicalJapanese-only).
describe("A2 M9-M12 aggregate — I2 spec-fix (genuine round-two transfers, not hidden-metadata duplicates)", () => {
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

// M4-style honest invariant FormSelection metadata, extended to M9-M12's own
// new "rule-invariant-utterance"/"rule-invariant-object" families: audits
// every such variant's `FormSelection` against the honest register its own
// baked Japanese actually realizes. Compositional families (comparison-
// favor/superlative/symptom/wellbeing/symptom-exist/travel-arrival, and
// every suffix-composed request/permission-shaped family) are out of scope
// here exactly like the M4/M5-M8 audits — their predicate senses either
// genuinely conjugate from the variant's own FormSelection, or are built via
// newVerbSuffixKana/suffixKana, which by construction always produces the
// same honest present-tense-shaped register, so the builder's own default
// can never mismatch for them.
describe("A2 M9-M12 aggregate — M4-style honest invariant FormSelection metadata, extended to M9-M12", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  // Every currently-authored M9-M12 "invariant" (rule-invariant-utterance/
  // rule-invariant-object) predicate value whose own final clause is
  // genuinely negative and/or past — one flat source of truth, exhaustive
  // over both the dishonest-by-default ones (mapped to their corrected form
  // below) and the honest ones (left absent, so the default-expectation
  // fallback proves they stay honest).
  const HONEST_FORM_BY_VALUE_ID: Readonly<Record<string, { polarity: string; tense: string; formality: string }>> = {
    "a2-value-return-tsukatteinai": { polarity: "negative", tense: "present", formality: "polite" },
    "a2-value-better-genki-ni-natta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-better-naotta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-reply-wakarimashita": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-reply-shouchishimashita": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-problem-nakusu": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-problem-machigaeru": { polarity: "affirmative", tense: "past", formality: "polite" },
  };

  const DEFAULT_HONEST_FORM = { polarity: "affirmative", tense: "present", formality: "polite" } as const;

  const M9_M12_INVARIANT_UTTERANCE_FAMILY_IDS: ReadonlySet<string> = new Set([
    "a2-family-ask-price-decide",
    "a2-family-return-exchange",
    "a2-family-tahouga-advice",
    "a2-family-get-better",
    "a2-family-clinic-appointment",
    "a2-family-message-late-absent",
    "a2-family-reply-confirm",
    "a2-family-make-reservation",
    "a2-family-travel-schedule-other",
    "a2-family-travel-problem",
    "a2-family-change-cancel",
  ]);

  it("every M9-M12 invariant-family variant's FormSelection matches the honest register its own baked Japanese actually is", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const family = famById.get(variant.sentenceFamilyId);
        if (!family) continue;
        if (family.realizationRuleId !== "rule-invariant-utterance" && family.realizationRuleId !== "rule-invariant-object") continue;
        if (!M9_M12_INVARIANT_UTTERANCE_FAMILY_IDS.has(family.id)) continue;
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

// New realizer/family editorial gates specific to Phase 3 Task 6: no new
// dead values/families — every semantic value and family this task adds is
// genuinely referenced by at least one authored M9-M12 variant.
describe("A2 M9-M12 aggregate — no new dead values/families (Phase 3 Task 6)", () => {
  const M9_M12_FAMILY_IDS: readonly string[] = [
    "a2-family-comparison-favor",
    "a2-family-superlative",
    "a2-family-ask-price-decide",
    "a2-family-return-exchange",
    "a2-family-symptom",
    "a2-family-wellbeing",
    "a2-family-symptom-exist",
    "a2-family-tahouga-advice",
    "a2-family-get-better",
    "a2-family-clinic-appointment",
    "a2-family-message-late-absent",
    "a2-family-ask-colleague",
    "a2-family-reply-confirm",
    "a2-family-make-reservation",
    "a2-family-travel-arrival",
    "a2-family-travel-schedule-other",
    "a2-family-travel-problem",
    "a2-family-change-cancel",
  ];

  it("every M9-M12 family is referenced by at least one authored variant (no dead families)", () => {
    const liveFamilyIds = new Set(allBuiltLessons.flatMap((built) => built.variants.map((v) => v.sentenceFamilyId)));
    for (const familyId of M9_M12_FAMILY_IDS) {
      expect(liveFamilyIds.has(familyId), familyId).toBe(true);
    }
  });

  it("every semantic value referenced by an M9-M12 variant's slotValues resolves to a real catalog entry (no dangling references)", () => {
    const valueIds = new Set(a2SemanticValues.map((v) => v.id));
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        for (const valueId of Object.values(variant.slotValues)) {
          expect(valueIds.has(valueId), `${variant.id} -> ${valueId}`).toBe(true);
        }
      }
    }
  });
});

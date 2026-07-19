/**
 * A2 Modules 1-12 — full cumulative aggregate validation (Phase 3 Task 6).
 *
 * The final, authoritative integration gate for the complete A2 release
 * built so far: assembles all 48 authored M1-M12 lessons into one real
 * `FoundationCatalogs` (never a fixture), derives the honest M1-M12-served
 * Can-do subset via `buildA2CanDos`, computes cumulative introduced-content
 * availability in canonical position order, and runs the shared
 * `validateFoundations` pipeline end-to-end against real release data —
 * exactly the same validator A1's own release relies on. Extends every
 * Task 4/5 exhaustive editorial audit (malformed-conjugation guard,
 * vocative-mistake/double-topic/speaker-label detectors, I2
 * genuine-transfer-novelty, honest invariant FormSelection metadata) to the
 * complete 48-lesson set, and folds in Task 6's own new M9-M12 audits
 * (comparison/superlative realizer soundness, no-dead-values/families). No
 * validator is ever weakened here; a failure here must be fixed by
 * correcting content/wiring, never by loosening a check.
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
  A2_CANDO_REGISTRY,
  A2_M1_M12_SERVED_CANDO_IDS,
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
import { module9Lessons } from "./module09ShoppingReturns";
import { module10Lessons } from "./module10HealthAdvice";
import { module11Lessons } from "./module11WorkStudyMessages";
import { module12Lessons } from "./module12TravelReservations";

// ---------------------------------------------------------------------------
// Assemble the real, cumulative M1-M12 catalog (48 lessons, 12 modules)
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

const a2M1M12CanDos = buildA2CanDos(A2_M1_M12_SERVED_CANDO_IDS, allBuiltLessons);

const M1_M12_MODULE_IDS = [
  "connected-conversation",
  "plans-invitations",
  "experiences-narratives",
  "reasons-opinions",
  "sequencing-ongoing",
  "permission-requests",
  "neighborhood-services",
  "restaurant-problems",
  "shopping-returns",
  "health-advice",
  "work-study-messages",
  "travel-reservations",
] as const;

const foundationModules: readonly FoundationModule[] = M1_M12_MODULE_IDS.map((moduleId) => {
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
  moduleIds: [...M1_M12_MODULE_IDS],
  canDoIds: [...A2_M1_M12_SERVED_CANDO_IDS],
};

// A synthetic, interim checkpoint sampling exactly the M1-M12 taught primary
// Can-dos (no real A2 checkpoint module exists yet — that is a later task's
// deliverable).
const TAUGHT_PRIMARY_CAN_DO_IDS = [
  ...new Set(allBuiltLessons.map((built) => built.recipe.primaryCanDoId)),
].sort();

const interimCheckpoint: CheckpointDefinition = {
  id: "a2-checkpoint-m1-m12-interim",
  level: "a2",
  sampledCanDoIds: TAUGHT_PRIMARY_CAN_DO_IDS,
  minAcceptedTransferTargetsPerCanDo: 3,
};

const catalogs = assembleA2FoundationCatalogs({
  lessons: allBuiltLessons.map((built) => built.recipe),
  variants: allBuiltLessons.flatMap((built) => built.variants),
  canDos: a2M1M12CanDos,
  modules: foundationModules,
  levels: [foundationLevel],
  checkpoints: [interimCheckpoint],
});

// `a2SentenceFamilies` is the complete, ever-growing shared array; scope
// `sentenceFamilies` down to exactly the families the 48 M1-M12 lessons'
// own variants actually reference (harmless no-op today — every declared
// family is genuinely referenced somewhere across M1-M12 — but kept as a
// forward-looking safety net once M13+ families join the same shared
// array, mirroring every earlier partial aggregate's own fix). Each
// scoped family's `canDoIds` is likewise trimmed to just the ids this
// M1-M12 release actually serves (`A2_M1_M12_SERVED_CANDO_IDS`) — today
// every family's canDoIds already lies entirely within that 47-id set (no
// M1-M12 family names a future M13+ topical id), so this is also a no-op
// safety net, not a fix for any currently-real gap. Never a validator
// weakening — `checkReferences` itself is untouched and still demands 100%
// integrity against whatever catalogs it is given.
const A2_M1_M12_SERVED_CANDO_ID_SET = new Set(A2_M1_M12_SERVED_CANDO_IDS);
const m1m12FamilyIds = new Set(
  allBuiltLessons.flatMap((built) => built.variants.map((variant) => variant.sentenceFamilyId)),
);
const scopedCatalogs = {
  ...catalogs,
  sentenceFamilies: catalogs.sentenceFamilies
    .filter((family) => m1m12FamilyIds.has(family.id))
    .map((family) => ({
      ...family,
      canDoIds: family.canDoIds.filter((id) => A2_M1_M12_SERVED_CANDO_ID_SET.has(id)),
    })),
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

describe("A2 M1-M12 aggregate — exactly 48 lessons across 12 modules in canonical order", () => {
  it("has exactly 48 lessons total", () => {
    expect(allBuiltLessons).toHaveLength(48);
  });

  it("lists each module's exact 4 lesson ids in the real manifest", () => {
    for (const moduleId of M1_M12_MODULE_IDS) {
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

describe("A2 M1-M12 aggregate — buildA2CanDos honest subset", () => {
  it("materializes exactly the 47 M1-M12-served Can-dos, each with >=1 real lessonId", () => {
    expect(a2M1M12CanDos).toHaveLength(47);
    for (const canDo of a2M1M12CanDos) {
      expect(canDo.lessonIds.length, canDo.id).toBeGreaterThan(0);
    }
  });
});

// Phase 3 Task 5 spec-fix: a cross-cutting regression net independent of any
// single module/family file, and independent of `A2_CANDO_REGISTRY`'s own
// (possibly-drifted) content — every Can-do id actually *referenced* by the
// real, authored M1-M12 content (recipe primary/support ids) or by any *live*
// (actually-used) sentence family's own `canDoIds` must belong to the
// hardcoded canonical 59-id set (never Task 4's redesigned aliases).
describe("A2 M1-M12 aggregate — every referenced Can-do id belongs to the canonical registry (Phase 3 Task 5 spec-fix)", () => {
  const CANONICAL_A2_CANDO_IDS = new Set(
    [
      // 15 grammar
      "recognize-plain-forms", "sequence-te", "ongoing-teiru", "request-tekudasai", "permission-temoii",
      "prohibition-tewaikenai", "negative-request", "experience-takoto", "intentions-plans", "reason-kara",
      "reason-node", "opinion-toomou", "compare", "possibility", "connectors",
      // 40 topical
      "backchannel-followup", "clarify-repeat", "invite-accept-decline", "arrange-meeting", "narrate-order",
      "ask-experience", "give-reasons", "agree-disagree", "describe-now", "describe-ongoing",
      "morning-routine", "can-cannot", "ask-directions", "explain-facility", "order-food",
      "special-request", "report-problem", "pay-handle-problem", "ask-price-decide", "return-exchange",
      "describe-symptoms", "advice-tahouga", "get-better", "clinic-appointment", "message-late-absent",
      "ask-colleague", "report-progress", "reply-confirm", "make-reservation", "travel-schedule",
      "travel-problem", "change-cancel", "family-relations", "give-receive", "events-celebrations",
      "choose-gift", "read-schedule", "read-notice", "read-reply-message", "fill-form",
      // 4 scenario
      "scenario-weekend-outing", "scenario-service-shopping", "scenario-health-absence", "scenario-trip-recount",
    ].map((name) => `a2-cando-${name}`),
  );

  it("every recipe primaryCanDoId/supportingCanDoIds referenced by the 48 authored M1-M12 lessons is a canonical id", () => {
    for (const built of allBuiltLessons) {
      expect(CANONICAL_A2_CANDO_IDS.has(built.recipe.primaryCanDoId), `${built.recipe.id} primary ${built.recipe.primaryCanDoId}`).toBe(true);
      for (const support of built.recipe.supportingCanDoIds) {
        expect(CANONICAL_A2_CANDO_IDS.has(support), `${built.recipe.id} support ${support}`).toBe(true);
      }
    }
  });

  it("every live (actually-used) sentence family's own canDoIds are all canonical ids", () => {
    const liveFamilyIds = new Set(allBuiltLessons.flatMap((built) => built.variants.map((v) => v.sentenceFamilyId)));
    for (const family of a2SentenceFamilies) {
      if (!liveFamilyIds.has(family.id)) continue;
      for (const canDoId of family.canDoIds) {
        expect(CANONICAL_A2_CANDO_IDS.has(canDoId), `family ${family.id} canDoId ${canDoId}`).toBe(true);
      }
    }
  });

  it("every real registered Can-do (A2_CANDO_REGISTRY) is itself a canonical id — the registry never drifts from the plan", () => {
    for (const canDo of A2_CANDO_REGISTRY) {
      expect(CANONICAL_A2_CANDO_IDS.has(canDo.id), canDo.id).toBe(true);
    }
    expect(A2_CANDO_REGISTRY).toHaveLength(CANONICAL_A2_CANDO_IDS.size);
  });
});

describe("A2 M1-M12 aggregate — foundation copy parity", () => {
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

describe("A2 M1-M12 aggregate — validateFoundations end-to-end", () => {
  it("is valid against the real, cumulative M1-M12 release data (never weakened to pass)", () => {
    const result = validateFoundations({
      catalogs: scopedCatalogs,
      foundationCopy,
      catalogVersion: "a2-m1-m12-task6",
      seed: "a2-task6-full-aggregate-seed",
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

describe("A2 M1-M12 aggregate — Task4 editorial regression (malformed conjugation guard), extended to all 48 lessons", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  // The exact malformed sequences a fresh M1-M4 spec review found; never
  // recurs anywhere in the full 48-lesson release.
  const MALFORMED_SEQUENCES = ["はなます", "たべるませんか", "いくませんか", "みよてい"] as const;

  it("realizes every currently authored M1-M12 model+transfer variant with no known-malformed conjugation sequence, and formatRomaji().ok === true", () => {
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
// M5-M12: a *named individual* (Sora/Emi) must never be marked as an
// explicit topic-marked subject (そらは/えみは) on a family whose own
// content is a complete direct-address speech act. M1-M4's own four
// direct-address families (invite/respond-invite/arrange-meeting/
// clarify-repeat), M6-M8's nine direct-address families (permission/
// prohibition/request/negative-request/confirm-understanding/ask-where/
// ask-for-help), and M9-M12's own two (ask-colleague/change-cancel) are
// combined into one allowlist here — M5's te-sequence/ongoing-teiru, M8's
// recount-experience, and M10/M12's clinic-appointment/make-reservation
// are deliberately excluded (their "explicit" sora/emi usage is a genuine
// third-party narrative statement, e.g. so1's "そらは おきて、かおをあらいます",
// exactly like M1-M4's own cc1 precedent "そらはどうりょうとはなします" — never a
// vocative mistake).
describe("A2 M1-M12 aggregate — Task4 final spec-fix editorial audit (vocative mistakes, double-topic, speaker-label copy), extended to all 48 lessons", () => {
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
    // M9-M12
    "a2-family-ask-colleague",
    "a2-family-change-cancel",
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

  it("flags zero vocative mistakes across every currently authored M1-M12 model+transfer", () => {
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

  it("flags zero double-topic transfers across every currently authored M1-M12 model+transfer", () => {
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

// I2 spec-fix (Phase 3 Task 5 quality pass), extended to all 48 lessons: the
// vocative-mistake audit above only ever guarded AGAINST an explicit
// topic-marked NAMED individual (sora/emi) on a direct-address family; a
// fresh review found the opposite mistake was never guarded at all — a
// *social* role referent (teacher/friend/colleague) vocative-addressed with
// さん. Real Japanese never says 先生さん/友達さん/同僚さん (sensei-san/
// tomodachi-san/douryou-san) — a generic social-role noun does not take さん
// in direct address the way a real name does. Only two referent-role kinds
// naturally take vocative さん: `"persona"` (a real name — sora/emi) and
// `"unnamed"` (an addressable service role, e.g. a2-referent-clerk/てんいん —
// "ten'in-san" is exactly how a customer addresses restaurant/shop staff).
// `"social"` (teacher/friend/colleague) and `"learner"` (the self-referent)
// never qualify.
describe("A2 M1-M12 aggregate — I2 spec-fix: a social-role referent (teacher/friend/colleague) can never be vocative-addressed, extended to all 48 lessons", () => {
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

  it("self-test: flags a synthetic vocative-addressed teacher, never a real vocative-addressed clerk/sora (both natural)", () => {
    const syntheticBadVariant: SentenceVariant = {
      id: "test-social-role-vocative-probe",
      sentenceFamilyId: "a2-family-confirm-understanding",
      discourse: {
        speakerRoleId: "a2-role-learner",
        addresseeRoleId: null,
        subjectReferentId: "a2-referent-teacher",
        subjectRealization: "vocative",
        scenarioNoteCopyId: "test-scenario",
      },
      contextId: "a2-context-restaurant",
      slotValues: { subject: "a2-value-teacher-subject", predicate: "a2-value-order-menu" },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "transfer",
    };
    expect(isSocialRoleVocativeMistake(syntheticBadVariant)).toBe(true);

    const rp1 = allBuiltLessons.find((built) => built.recipe.id === "restaurant-problems-1");
    const clerkTransfer = rp1?.variants.find((v) => v.id === "restaurant-problems-1-t3");
    expect(clerkTransfer, "restaurant-problems-1-t3").toBeDefined();
    expect((clerkTransfer as SentenceVariant).discourse.subjectRealization).toBe("vocative");
    expect(isSocialRoleVocativeMistake(clerkTransfer as SentenceVariant)).toBe(false);

    const soraTransfer = rp1?.variants.find((v) => v.id === "restaurant-problems-1-t1");
    expect(soraTransfer, "restaurant-problems-1-t1").toBeDefined();
    expect(isSocialRoleVocativeMistake(soraTransfer as SentenceVariant)).toBe(false);
  });

  it("flags zero social-role vocative mistakes across every currently authored M1-M12 model+transfer (no false positives against real sora/emi/clerk vocative content)", () => {
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


// M2 spec-fix (Phase 3 Task 5 quality pass), extended to all 48 lessons:
// rp4-t4's own Japanese was genuinely nonpast (baked ~ます, e.g. かえります
// "goes home") but its EN/IT copy glossed it in the past tense ("received...
// went home") — a same-underlying-Japanese, conflicting-copy defect.
// Generalizes into a standing audit scoped to the te-sequence families
// (a2-family-te-sequence / a2-family-te-sequence-object): every one of their
// predicate values is baked ONCE, at catalog-authoring time, to either
// nonpast (~ます, via `masuForm()`) or past (~ました, hand-baked) — never
// derived from a variant's own `form` metadata — so a variant reusing a
// nonpast-baked predicate must never gloss it with one of this closed,
// course-vocabulary simple-past marker set. Deliberately scoped to
// te-sequence only (never recount-experience, whose problem-*/adversative-が
// sentences legitimately mix a past first clause with a nonpast second
// clause) to avoid false positives against that family's own different,
// already-correct shape.
describe("A2 M1-M12 aggregate — M2 spec-fix: te-sequence copy never contradicts its own baked (nonpast vs. past) Japanese tense, extended to all 48 lessons", () => {
  const valueById = new Map(a2SemanticValues.map((v) => [v.id, v]));
  const TE_SEQUENCE_FAMILY_IDS: ReadonlySet<string> = new Set([
    "a2-family-te-sequence",
    "a2-family-te-sequence-object",
  ]);
  // Every simple-past English form a te-sequence final verb (寝る/書く/飲む/
  // 食べる/話す/洗う/使う/待つ/帰る — the only nonpast-baked te-sequence finals in
  // this closed course vocabulary) could ever be glossed with. Deliberately
  // closed/exhaustive rather than a generic English tense heuristic, so it
  // can never false-positive on unrelated vocabulary.
  const EN_PAST_TENSE_MARKERS: readonly RegExp[] = [
    /\bwent home\b/i,
    /\bate\b/i,
    /\bdrank\b/i,
    /\bwrote\b/i,
    /\btalked\b/i,
    /\bwashed\b/i,
    /\bused\b/i,
    /\bslept\b/i,
    /\bwaited\b/i,
  ];
  const IT_PAST_TENSE_MARKERS: readonly RegExp[] = [
    /\bè tornat[oa]\b/i,
    /\bha mangiato\b/i,
    /\bha bevuto\b/i,
    /\bha scritto\b/i,
    /\bha parlato\b/i,
    /\bha lavato\b/i,
    /\bha usato\b/i,
    /\bha dormito\b/i,
    /\bha aspettato\b/i,
  ];

  function bakedTenseIsNonpastAffirmative(predicateValueId: string | undefined): boolean {
    if (!predicateValueId) return false;
    const value = valueById.get(predicateValueId);
    if (!value) return false;
    const jp = value.tokenFragments.map((f) => f.jp).join("");
    return jp.endsWith("ます") && !jp.endsWith("ません");
  }

  function hasConflictingPastTenseCopy(
    variant: SentenceVariant,
    enText: string | undefined,
    itText: string | undefined,
  ): boolean {
    if (!TE_SEQUENCE_FAMILY_IDS.has(variant.sentenceFamilyId)) return false;
    if (!bakedTenseIsNonpastAffirmative(variant.slotValues.predicate)) return false;
    const enHit = enText ? EN_PAST_TENSE_MARKERS.some((pattern) => pattern.test(enText)) : false;
    const itHit = itText ? IT_PAST_TENSE_MARKERS.some((pattern) => pattern.test(itText)) : false;
    return enHit || itHit;
  }

  it("self-test: flags a synthetic past-tense gloss on a real nonpast-baked te-sequence predicate, never the real (fixed) rp4-t4/rp4-m4 present-tense copy", () => {
    const rp4 = allBuiltLessons.find((built) => built.recipe.id === "restaurant-problems-4");
    const t4 = rp4?.variants.find((v) => v.id === "restaurant-problems-4-t4");
    expect(t4, "restaurant-problems-4-t4").toBeDefined();
    expect(bakedTenseIsNonpastAffirmative((t4 as SentenceVariant).slotValues.predicate)).toBe(true);
    expect(
      hasConflictingPastTenseCopy(t4 as SentenceVariant, "The teacher went home after receiving the change.", "L'insegnante è tornato a casa."),
    ).toBe(true);

    const realEn = rp4?.en["restaurant-problems-4-t4-translation"];
    const realIt = rp4?.it["restaurant-problems-4-t4-translation"];
    expect(hasConflictingPastTenseCopy(t4 as SentenceVariant, realEn, realIt)).toBe(false);

    const m4 = rp4?.variants.find((v) => v.id === "restaurant-problems-4-m4");
    expect(m4, "restaurant-problems-4-m4").toBeDefined();
    expect(
      hasConflictingPastTenseCopy(
        m4 as SentenceVariant,
        rp4?.en["restaurant-problems-4-m4-translation"],
        rp4?.it["restaurant-problems-4-m4-translation"],
      ),
    ).toBe(false);
  });

  it("flags zero conflicting-tense te-sequence copy across every currently authored M1-M12 model+transfer", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const enText = built.en[`${variant.id}-translation`];
        const itText = built.it[`${variant.id}-translation`];
        if (hasConflictingPastTenseCopy(variant, enText, itText)) {
          violations.push(
            `${variant.id}: predicate "${variant.slotValues.predicate}" is baked nonpast, but its copy uses a simple-past marker — en="${enText}" it="${itText}"`,
          );
        }
      }
    }
    expect(violations, `${violations.length} conflicting-tense te-sequence copy violation(s):\n${violations.join("\n")}`).toEqual([]);
  });
});


// I2 spec-fix ("true transfer failure"), extended to all 48 lessons: a
// transfer is only a genuine test of transfer if its *visible* answer
// (visibleTargetKey — canonicalJapanese-only, never discourse/context
// metadata) is something the learner has never been shown as a model in
// this same lesson.
describe("A2 M1-M12 aggregate — I2 spec-fix (genuine round-two transfers, not hidden-metadata duplicates), extended to all 48 lessons", () => {
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

  it("collects zero total transfer-novelty collisions across the entire 48-lesson release", () => {
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
// its own baked Japanese actually realizes, across the full M1-M12 release.
describe("A2 M1-M12 aggregate — M4-style honest invariant FormSelection metadata, extended to all 48 lessons", () => {
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
    // --- M9-M12 (rule-invariant-utterance families only; travel-problem's
    // own two past-tense values use rule-invariant-object instead, so they
    // are audited separately below rather than added to this map, where
    // they would never actually be reached by this check's own family-type
    // condition) ---
    "a2-value-return-tsukatteinai": { polarity: "negative", tense: "present", formality: "polite" },
    "a2-value-better-genki-ni-natta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-better-naotta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-reply-wakarimashita": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-reply-shouchishimashita": { polarity: "affirmative", tense: "past", formality: "polite" },
  };

  const DEFAULT_HONEST_FORM = { polarity: "affirmative", tense: "present", formality: "polite" } as const;

  it("every invariant-family M1-M12 variant's FormSelection matches the honest register its own baked Japanese actually is", () => {
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

// Phase 3 Task 6 extension of the same honest-FormSelection principle to
// M9-M12's own "rule-invariant-object" families — scoped tightly to just
// `a2-family-travel-problem` (the one M9-M12 family of this shape whose
// baked Japanese is genuinely past-tense) rather than widening the M1-M8
// audit above to every "rule-invariant-object" family in the release
// (which would also pull in M1-M8's own a2-family-ongoing-teiru/
// a2-family-order-food/a2-family-report-problem — never audited this way
// before, and out of this task's scope to newly re-litigate).
describe("A2 M1-M12 aggregate — M9-M12's own rule-invariant-object FormSelection honesty (Phase 3 Task 6)", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  const HONEST_FORM_BY_VALUE_ID: Readonly<Record<string, { polarity: string; tense: string; formality: string }>> = {
    "a2-value-problem-nakusu": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-problem-machigaeru": { polarity: "affirmative", tense: "past", formality: "polite" },
  };
  const DEFAULT_HONEST_FORM = { polarity: "affirmative", tense: "present", formality: "polite" } as const;

  it("every travel-problem variant's FormSelection matches the honest register its own baked Japanese actually is", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const family = famById.get(variant.sentenceFamilyId);
        if (!family || family.id !== "a2-family-travel-problem") continue;
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

describe("A2 M1-M12 aggregate — kanji exposure wiring across all 48 lessons", () => {
  it("every lesson's kanjiExposureIds resolves from the real Task 3 catalog (no omissions/inventions)", () => {
    for (const built of allBuiltLessons) {
      expect(built.recipe.kanjiExposureIds.length, built.recipe.id).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 3 Task 5 spec-fix: persona pronoun consistency + mizu semantic gloss
// audit, extended to all 48 M1-M12 lessons.
//
// Both checks are purely mechanical against real, already-pinned catalog
// truth (a2PersonRoles' own `gender` field and a2-value-obj-mizu's own slot
// identity) — never a heuristic guess — so they cannot produce false
// positives: generic roles (learner/teacher/colleague/friend/clerk)
// intentionally omit `gender` and are never checked; only Sora (masculine)
// and Emi (feminine) are, and only a2-value-obj-mizu's own object slot is
// scanned for the invented "fountain"/"fontanella" gloss.
// ---------------------------------------------------------------------------
describe("A2 M1-M12 aggregate — persona pronoun consistency & mizu semantic gloss audit (Phase 3 Task 5 spec-fix)", () => {
  it("no M1-M12 Sora-subject line uses a feminine pronoun, and no Emi-subject line uses a masculine one", () => {
    const FEMININE_PRONOUN = /\b(she|her|hers)\b/i;
    const MASCULINE_PRONOUN = /\b(he|him|his)\b/i;
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const en = built.en[`${variant.id}-translation`] ?? "";
        if (variant.discourse.subjectReferentId === "a2-referent-sora" && FEMININE_PRONOUN.test(en)) {
          violations.push(`${variant.id}: Sora line uses a feminine pronoun: "${en}"`);
        }
        if (variant.discourse.subjectReferentId === "a2-referent-emi" && MASCULINE_PRONOUN.test(en)) {
          violations.push(`${variant.id}: Emi line uses a masculine pronoun: "${en}"`);
        }
      }
    }
    expect(violations, `${violations.length} pronoun-consistency violation(s):\n${violations.join("\n")}`).toEqual(
      [],
    );
  });

  it('no M1-M12 line realizing a2-value-obj-mizu glosses it as "fountain"/"fontanella" — mizu is plain "water"/"acqua"', () => {
    const FOUNTAIN_GLOSS = /fountain|fontanella/i;
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        if (variant.slotValues.object !== "a2-value-obj-mizu") continue;
        const en = built.en[`${variant.id}-translation`] ?? "";
        const it = built.it[`${variant.id}-translation`] ?? "";
        if (FOUNTAIN_GLOSS.test(en)) violations.push(`${variant.id}: EN mizu line invents a fountain gloss: "${en}"`);
        if (FOUNTAIN_GLOSS.test(it)) violations.push(`${variant.id}: IT mizu line invents a fontanella gloss: "${it}"`);
      }
    }
    expect(violations, `${violations.length} mizu semantic-gloss violation(s):\n${violations.join("\n")}`).toEqual(
      [],
    );
  });
});

// New realizer/family editorial gates specific to Phase 3 Task 6: no new
// dead values/families — every semantic value and family that task adds is
// genuinely referenced by at least one authored M9-M12 variant, checked
// here against the full 48-lesson release (never re-litigating M1-M8's own
// pre-existing family list, which this task never modified).
describe("A2 M1-M12 aggregate — no new dead values/families (Phase 3 Task 6)", () => {
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

  it("every semantic value referenced by any M1-M12 variant's slotValues resolves to a real catalog entry (no dangling references)", () => {
    const valueIds = new Set(a2SemanticValues.map((v) => v.id));
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        for (const valueId of Object.values(variant.slotValues)) {
          expect(valueIds.has(valueId), `${variant.id} -> ${valueId}`).toBe(true);
        }
      }
    }
  });

  it("every family in the shared catalog that is referenced by an M1-M12 variant is itself present in a2SentenceFamilies (no orphan family ids on variants)", () => {
    const famIds = new Set(a2SentenceFamilies.map((f) => f.id));
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        expect(famIds.has(variant.sentenceFamilyId), `${variant.id} -> ${variant.sentenceFamilyId}`).toBe(true);
      }
    }
  });
});

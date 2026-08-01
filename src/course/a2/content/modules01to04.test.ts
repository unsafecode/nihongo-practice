/**
 * A2 Modules 1-4 — cross-module aggregate validation (Phase 3 Task 4).
 *
 * The final integration gate: assembles all 16 authored M1-M4 lessons into
 * one real `FoundationCatalogs` (never a fixture), derives the honest
 * M1-M4-served Can-do subset via `buildA2CanDos`, computes cumulative
 * introduced-content availability in canonical position order, and runs the
 * shared `validateFoundations` pipeline end-to-end against real release
 * data — exactly the same validator A1's own release relies on. No
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
  A2_M1_M4_SERVED_CANDO_IDS,
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

// ---------------------------------------------------------------------------
// Assemble the real, cumulative M1-M4 catalog
// ---------------------------------------------------------------------------

const allBuiltLessonsUnsorted: readonly A2BuiltLesson[] = [
  ...module1Lessons,
  ...module2Lessons,
  ...module3Lessons,
  ...module4Lessons,
];

// Never assume authoring order is canonical order — sort explicitly by the
// real manifest's canonical position, exactly as `computeAvailableContentByLesson`'s
// own contract requires of its caller.
const allBuiltLessons: readonly A2BuiltLesson[] = [...allBuiltLessonsUnsorted].sort(
  (a, b) => A2_CANONICAL_POSITIONS[a.recipe.id] - A2_CANONICAL_POSITIONS[b.recipe.id],
);

const a2M1M4CanDos = buildA2CanDos(A2_M1_M4_SERVED_CANDO_IDS, allBuiltLessons);

const M1_M4_MODULE_IDS = [
  "connected-conversation",
  "plans-invitations",
  "experiences-narratives",
  "reasons-opinions",
] as const;

const foundationModules: readonly FoundationModule[] = M1_M4_MODULE_IDS.map((moduleId) => {
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
  moduleIds: [...M1_M4_MODULE_IDS],
  canDoIds: [...A2_M1_M4_SERVED_CANDO_IDS],
};

// A synthetic, interim checkpoint sampling exactly the M1-M4 taught primary
// Can-dos (no real A2 checkpoint module exists yet — that is a later task's
// deliverable). `minAcceptedTransferTargetsPerCanDo: 3` matches every
// registered Can-do's own `checkpointEvidenceRule.minAcceptedTransferTargets`.
const TAUGHT_PRIMARY_CAN_DO_IDS = [
  ...new Set(allBuiltLessons.map((built) => built.recipe.primaryCanDoId)),
].sort();

const interimCheckpoint: CheckpointDefinition = {
  id: "a2-checkpoint-m1-m4-interim",
  level: "a2",
  sampledCanDoIds: TAUGHT_PRIMARY_CAN_DO_IDS,
  minAcceptedTransferTargetsPerCanDo: 3,
};

const catalogs = assembleA2FoundationCatalogs({
  lessons: allBuiltLessons.map((built) => built.recipe),
  variants: allBuiltLessons.flatMap((built) => built.variants),
  canDos: a2M1M4CanDos,
  modules: foundationModules,
  levels: [foundationLevel],
  checkpoints: [interimCheckpoint],
});

// Phase 3 Task 5 note: `assembleA2FoundationCatalogs` always exposes the
// complete, ever-growing shared `a2SentenceFamilies` (by design — a single
// source of truth every module reads from), so once M5-M8 add their own
// families to that same shared array, this M1-M4-only aggregate would
// otherwise see M5-M8 families whose canDoIds this test's own M1-M4-only
// `canDos` can never resolve (a real, but out-of-scope-for-this-suite,
// "missing-can-do-reference"). Scope `sentenceFamilies` down to exactly the
// families the 16 M1-M4 lessons' own variants actually reference — mirrors
// the same "only what this slice needs" scoping `a2M1M4CanDos` already
// applies to `canDos` — never a validator weakening, just correctly-scoped
// input data for an intentionally M1-M4-only test.
//
// Phase 3 Task 7 note: several of these SAME M1-M4-owned families (e.g.
// `a2-family-plan-yotei`, `a2-family-experience-takoto`,
// `a2-family-reason-kara`) now ALSO name a later a2-synthesis scenario
// Can-do in their static `canDoIds` array (reused verbatim for M15 — see
// each family's own doc-comment in a2SemanticCatalog.ts). Those scenario
// ids are genuinely out of scope here (no M1-M4 lesson ever teaches or
// transfers them), so every scoped family's `canDoIds` is additionally
// trimmed down to just the ids this M1-M4 slice actually serves — mirrors
// `modules01to08.test.ts`'s own identical trim exactly; never a validator
// weakening, just correctly-scoped input data.
const A2_M1_M4_SERVED_CANDO_ID_SET = new Set(A2_M1_M4_SERVED_CANDO_IDS);
const m1m4FamilyIds = new Set(
  allBuiltLessons.flatMap((built) => built.variants.map((variant) => variant.sentenceFamilyId)),
);
const scopedCatalogs = {
  ...catalogs,
  sentenceFamilies: catalogs.sentenceFamilies
    .filter((family) => m1m4FamilyIds.has(family.id))
    .map((family) => ({
      ...family,
      canDoIds: family.canDoIds.filter((id) => A2_M1_M4_SERVED_CANDO_ID_SET.has(id)),
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

describe("A2 M1-M4 aggregate — exactly 16 lessons across 4 modules in canonical order", () => {
  it("has exactly 16 lessons total", () => {
    expect(allBuiltLessons).toHaveLength(16);
  });

  it("lists each module's exact 4 lesson ids in the real manifest", () => {
    for (const moduleId of M1_M4_MODULE_IDS) {
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

describe("A2 M1-M4 aggregate — buildA2CanDos honest subset", () => {
  it("materializes exactly the 15 M1-M4-served Can-dos, each with >=1 real lessonId", () => {
    expect(a2M1M4CanDos).toHaveLength(15);
    for (const canDo of a2M1M4CanDos) {
      expect(canDo.lessonIds.length, canDo.id).toBeGreaterThan(0);
    }
  });
});

describe("A2 M1-M4 aggregate — foundation copy parity", () => {
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

describe("A2 M1-M4 aggregate — validateFoundations end-to-end", () => {
  it("is valid against the real, cumulative M1-M4 release data (never weakened to pass)", () => {
    const result = validateFoundations({
      catalogs: scopedCatalogs,
      foundationCopy,
      catalogVersion: "a2-m1-m4-task4",
      seed: "a2-task4-aggregate-seed",
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

describe("A2 M1-M4 aggregate — Task4 editorial regression (malformed conjugation guard)", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  // The exact malformed sequences a fresh spec review found across M1-M4: an
  // unconjugated verb root left before ます (はなます — should be the ます-stem
  // はなします), a plain dictionary form left before an invitation's ませんか
  // (たべるませんか, いくませんか — should be the ます-stem たべ/いき), and a
  // ます-stem left before a よてい plan where the dictionary form is required
  // (みよてい — should be みるよてい). None of these are valid Japanese; a
  // `formatRomaji`-ok check alone can never catch them, because every
  // individual token is still well-formed — only scanning the assembled
  // string catches an invalid *sequence* of otherwise-valid tokens. Exact
  // row assertions for the concrete fixed variants (cc1-m1/t3,
  // pi3-m3/t2/m7) live in their own module test files
  // (`module01ConnectedConversation.test.ts`, `module02PlansInvitations.test.ts`);
  // this aggregate guard's job is the broad net across every authored
  // M1-M4 variant, so this whole class of error can never recur anywhere
  // in the release, not just at the five spots found this time.
  const MALFORMED_SEQUENCES = ["はなます", "たべるませんか", "いくませんか", "みよてい"] as const;

  it("realizes every currently authored M1-M4 model+transfer variant with no known-malformed conjugation sequence", () => {
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

// Task 4 final spec-fix ("keep M1-M4 transfer Japanese natural"): a fresh
// spec re-review found two further, distinct classes of unnatural transfer
// Japanese the malformed-conjugation guard above can never catch (every
// token involved is individually well-formed — the defect is a discourse
// choice, not a conjugation error):
//
// 1. "Vocative mistakes": a *named individual* (Sora/Emi) marked as an
//    explicit topic-marked subject (そらは/えみは) on a family whose own
//    content is already a complete direct-address speech act — an
//    invitation, a response to one, an arrange-meeting proposal, or a
//    clarification request. Natural Japanese addresses that person with a
//    vocative (そらさん、) instead of topicalizing them. Scope is
//    deliberately closed and narrow to avoid false positives: only these
//    four direct-address families, only the two named-individual referents
//    — never the self-referent (there is no vocative address to oneself)
//    and never cc1's real subject-predicate-object families, where marking
//    a third party explicit is a genuinely natural statement *about* them
//    (e.g. "そらはどうりょうとはなします", "Sora talks with a colleague"), not a
//    vocative mistake at all.
// 2. "Double topic": an explicit subject recombined with a predicate value
//    whose own baked content already opens with its own topic marker
//    (きょうは/しごとは/...), producing an unnatural stacked topic
//    (わたしは きょうは...).
//
// Both are checked mechanically from the variant's own discourse/slot data
// and the referenced semantic value's own token-fragment shape — never a
// per-lesson id allowlist — so any future M1-M4 authoring mistake of either
// shape is caught here too, not just the ones this review found. A third,
// narrower copy-editorial check guards the specific mismatch that made the
// pi3-t3/t4 vocative mistake easy to miss: EN/IT copy using a
// "Name: ..." speaker-label convention that no Japanese construction here
// (vocative or plain) ever actually realizes.
describe("A2 M1-M4 aggregate — Task4 final spec-fix editorial audit (vocative mistakes, double-topic, speaker-label copy)", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const valueById = new Map(a2SemanticValues.map((value) => [value.id, value]));

  // Families whose own content is already a complete, self-contained
  // direct-address utterance — the only families where marking a named
  // individual explicit (instead of vocative) is ever a mistake.
  const DIRECT_ADDRESS_FAMILY_IDS: ReadonlySet<string> = new Set([
    "a2-family-invite",
    "a2-family-respond-invite",
    "a2-family-arrange-meeting",
    "a2-family-clarify-repeat",
  ]);
  // The only two named-individual referents this release ever authors as a
  // subject. Never the self-referent, never a common-noun referent
  // (friend/colleague/teacher) — those raise a different concern (see the
  // colon-copy check below) and are never flagged as a vocative mistake by
  // this detector.
  const NAMED_INDIVIDUAL_REFERENT_IDS: ReadonlySet<string> = new Set(["a2-referent-sora", "a2-referent-emi"]);

  function isVocativeMistake(variant: SentenceVariant, family: SentenceFamily): boolean {
    return (
      DIRECT_ADDRESS_FAMILY_IDS.has(family.id) &&
      variant.discourse.subjectRealization === "explicit" &&
      variant.discourse.subjectReferentId !== null &&
      NAMED_INDIVIDUAL_REFERENT_IDS.has(variant.discourse.subjectReferentId)
    );
  }

  // A predicate value's own baked content already opens with a topic
  // marker — either a single fused lexical fragment ending in は (e.g.
  // "しごとは") or a split lexical+は-particle pair (e.g. "きょう" + は). Only
  // the first one or two fragments are inspected, never the whole value, so
  // a later, unrelated word that merely happens to start with は (e.g.
  // はやく, "quickly") is never mistaken for a second topic marker.
  function predicateOpensWithBakedTopic(predicateValueId: string | undefined): boolean {
    if (!predicateValueId) return false;
    const value = valueById.get(predicateValueId);
    if (!value) return false;
    const [first, second] = value.tokenFragments;
    if (!first || first.kind !== "lexical") return false;
    if (first.jp.endsWith("は")) return true;
    return second?.kind === "particle" && second.jp === "は";
  }

  // Families whose own content is a flat, single-clause-chain personal
  // statement (a plan, an intention, a でも/それから-linked pair of clauses)
  // — the only families where an explicit subject genuinely competes with
  // the predicate's own baked topic for the same flat-clause "topic" slot.
  // Deliberately excludes M4's opinion/reason families
  // (a2-family-opinion-toomou, -reason-kara, -reason-node,
  // -agree-disagree): those legitimately nest a *matrix*-clause topic (the
  // opinion holder, これは いい と "思います") in front of an *embedded*-clause
  // topic (what's being evaluated) — a well-formed double-subject/topic
  // construction across a clause boundary (like 象は鼻が長い), not the flat,
  // same-clause double topic this check targets. Out of Task 4's M1/M2
  // scope in any case.
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

  it("self-test: the vocative-mistake detector flags a synthetic そらは-marked invite and never flags a real cc1 third-party statement (そらは on a plain subject-predicate family is genuinely natural)", () => {
    const inviteFamily = famById.get("a2-family-invite");
    expect(inviteFamily, "a2-family-invite").toBeDefined();
    const badVariant: SentenceVariant = {
      id: "test-vocative-mistake-probe",
      sentenceFamilyId: "a2-family-invite",
      discourse: {
        speakerRoleId: "a2-role-learner",
        addresseeRoleId: null,
        subjectReferentId: "a2-referent-sora",
        subjectRealization: "explicit",
        scenarioNoteCopyId: "test-scenario",
      },
      contextId: "a2-context-plans",
      slotValues: { subject: "a2-value-sora", predicate: "a2-value-invite-eiga" },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "transfer",
    };
    expect(isVocativeMistake(badVariant, inviteFamily as SentenceFamily)).toBe(true);

    const cc1 = allBuiltLessons.find((built) => built.recipe.id === "connected-conversation-1");
    const talkCompanionVariant = cc1?.variants.find((v) => v.id === "connected-conversation-1-t1");
    expect(talkCompanionVariant, "connected-conversation-1-t1").toBeDefined();
    const talkCompanionFamily = famById.get((talkCompanionVariant as SentenceVariant).sentenceFamilyId);
    expect(talkCompanionFamily, "a2-family-talk-companion").toBeDefined();
    expect(
      isVocativeMistake(talkCompanionVariant as SentenceVariant, talkCompanionFamily as SentenceFamily),
    ).toBe(false);
  });

  it("self-test: the double-topic detector flags a synthetic わたしは + きょうは-opening connector and never flags the real (fixed) cc2-t1 が-marked pairing", () => {
    const syntheticBadVariant: SentenceVariant = {
      id: "test-double-topic-probe",
      sentenceFamilyId: "a2-family-connector-utterance",
      discourse: {
        speakerRoleId: "a2-role-learner",
        addresseeRoleId: null,
        subjectReferentId: "a2-referent-self",
        subjectRealization: "explicit",
        scenarioNoteCopyId: "test-scenario",
      },
      contextId: "a2-context-plans",
      slotValues: { subject: "a2-value-watashi", predicate: "a2-value-connector-ame-demo-dekakeru" },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "transfer",
    };
    expect(isDoubleTopic(syntheticBadVariant)).toBe(true);

    const cc2 = allBuiltLessons.find((built) => built.recipe.id === "connected-conversation-2");
    const t1 = cc2?.variants.find((v) => v.id === "connected-conversation-2-t1");
    expect(t1, "connected-conversation-2-t1").toBeDefined();
    expect(isDoubleTopic(t1 as SentenceVariant)).toBe(false);
  });

  it("self-test: the double-topic detector never flags M4's real reasons-opinions-3-t1 (これは いい と思います), a well-formed matrix-topic + embedded-clause-topic construction, not a flat double topic, and out of Task 4's M1/M2 scope in any case", () => {
    const module4 = allBuiltLessons.find((built) => built.recipe.id === "reasons-opinions-3");
    const t1 = module4?.variants.find((v) => v.id === "reasons-opinions-3-t1");
    expect(t1, "reasons-opinions-3-t1").toBeDefined();
    // Confirms the fixture actually exercises the family/shape this test
    // means to probe (predicateOpensWithBakedTopic would say yes) — the
    // family scope, not the topic shape, is what excludes it.
    expect((t1 as SentenceVariant).sentenceFamilyId).toBe("a2-family-opinion-toomou");
    expect((t1 as SentenceVariant).discourse.subjectRealization).toBe("explicit");
    expect(isDoubleTopic(t1 as SentenceVariant)).toBe(false);
  });

  it("flags zero vocative mistakes across every currently authored M1-M4 model+transfer", () => {
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

  it("flags zero double-topic transfers across every currently authored M1-M4 model+transfer", () => {
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

  it('never uses the "Name: ..." colon speaker-label copy convention in any EN/IT copy — a speaker label is never realized in the Japanese itself, so it can only ever mismatch whatever construction (vocative or plain) the sentence actually uses', () => {
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

// I2 spec-fix ("true transfer failure"): round-two transfers used to realize
// byte-identical Japanese to a round-one model, differing only in hidden
// discourse metadata (speaker/context) that never reaches the learner. A
// transfer is only a genuine test of transfer if its *visible* answer is
// something the learner has never been shown as a model in this lesson.
// This is deliberately independent of `semanticFingerprint` (which already
// differs via context/speaker and so can never catch this failure mode) —
// it compares `visibleTargetKey`, the same normalized-canonical-Japanese-only
// key `RealizedSentence` itself documents as "Never derived from or mixed
// with discourse/context/form metadata".
describe("A2 M1-M4 aggregate — I2 spec-fix (genuine round-two transfers, not hidden-metadata duplicates)", () => {
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

  it("every lesson's transfer visible targets (visibleTargetKey — canonicalJapanese only, never context/speaker) all differ from every model visible target in that same lesson", () => {
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

  it("every lesson has at least 5 transfers, each genuinely novel relative to that lesson's models (>=2 required; this release holds every lesson to the full 5)", () => {
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

// M4 spec-fix ("form metadata"): audits every invariant-family variant's
// `FormSelection` against the honest register its own baked Japanese
// actually realizes. `KIT_AFFIRMATIVE_PRESENT_POLITE` is a real, correct
// form for most invariant content (backchannel reactions, yotei/tsumori
// plans, opinions, たことがあります experience statements — every one of
// these is a genuine present-tense polite utterance even when an *embedded*
// clause is past/negative), but a `plain-recognition`/`narrate-order`/
// `reason-node` (etc.) variant whose own final predicate is plain, negative,
// past, or past-negative must say so. This table is deliberately exhaustive
// over every currently-authored invariant predicate value — both the
// dishonest ones (mapped to their corrected form below) and the honest ones
// (left absent, so the default-expectation fallback proves they stay
// honest) — one flat source of truth checked against every lesson's real
// variants, never a fixture.
describe("A2 M1-M4 aggregate — M4 spec-fix (honest invariant FormSelection metadata)", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  // Invariant families whose predicate value's own baked content is
  // genuinely mixed-mood (ましょう volitional / ませんか negative-question
  // invitations) rather than a plain declarative the four-way
  // polarity×tense grid can honestly describe — `FormSelection` has no
  // "volitional"/"invitational" mood axis, exactly like question mood is
  // its own separate `interrogative` flag rather than living on `polarity`.
  // Excluded from this specific polarity/tense/formality audit; never
  // excluded from any other check.
  const MOOD_CARVEOUT_FAMILIES: ReadonlySet<string> = new Set([
    "a2-family-invite",
    "a2-family-respond-invite",
    "a2-family-arrange-meeting",
  ]);

  // Semantic value id -> the honest FormSelection (polarity/tense/formality
  // only — `interrogative` is separately correct already) its own realized
  // Japanese actually carries. Every entry here was hand-verified against
  // the real realized canonicalJapanese (see the session's form-audit dump).
  const HONEST_FORM_BY_VALUE_ID: Readonly<Record<string, { polarity: string; tense: string; formality: string }>> = {
    // --- a2-family-plain-recognition: the WHOLE point is plain forms ---
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
    // --- a2-family-narrate-order: ordered PAST narratives; all plain past ---
    "a2-value-narrate-asagohan-gakkou": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-narrate-umi-yama": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-narrate-matsu-tabeta": { polarity: "affirmative", tense: "past", formality: "plain" },
    "a2-value-narrate-kyouto-tanoshikatta": { polarity: "affirmative", tense: "past", formality: "plain" },
    // --- a2-family-reason-node: ので gives a reason that already happened —
    // every currently-authored value's own final clause is past polite ---
    "a2-value-node-ame-ie": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-isogashikatta-dekakenakatta": { polarity: "negative", tense: "past", formality: "polite" },
    "a2-value-node-densha-kaigi": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-ame-futta-uchi": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-jikanganakatta-takushii": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-samukatta-kooto": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-shigoto-owatta-kaetta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-node-byouki-yasunda": { polarity: "affirmative", tense: "past", formality: "polite" },
    // --- a2-family-reason-kara: mostly present/future から-clauses, but this
    // one's own final clause (つかれました) is genuinely past ---
    "a2-value-kara-isogashii-tsukareta": { polarity: "affirmative", tense: "past", formality: "polite" },
    // --- a2-family-connector-utterance: mostly present, but these four's
    // own final clause is genuinely past ---
    "a2-value-connector-test-demo-ganbatta": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-connector-ame-sorekara-hare": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-connector-shigoto-sorekara-kaeru": { polarity: "affirmative", tense: "past", formality: "polite" },
    // Task 4 final spec-fix: now wired in (cc2-m6, recombined with an
    // explicit watashi to keep introducing a2-value-watashi via a real
    // model without colliding with a baked topic — see
    // module01ConnectedConversation.ts) — its own final clause
    // (うれしかったです) is genuinely past, same rationale as the three above.
    "a2-value-connector-tsukareta-demo-ureshii": { polarity: "affirmative", tense: "past", formality: "polite" },
    // --- a2-family-clarify-repeat: わかりません/わかりました/きこえませんでした
    // are genuine negative-present / past / past-negative statements ---
    "a2-value-clarify-wakarimasen": { polarity: "negative", tense: "present", formality: "polite" },
    "a2-value-clarify-wakarimashita": { polarity: "affirmative", tense: "past", formality: "polite" },
    "a2-value-clarify-kikoemasen": { polarity: "negative", tense: "past", formality: "polite" },
    // --- a2-family-agree-disagree: そうおもいません is a genuine present negative ---
    "a2-value-disagree-omoimasen": { polarity: "negative", tense: "present", formality: "polite" },
  };

  const DEFAULT_HONEST_FORM = { polarity: "affirmative", tense: "present", formality: "polite" } as const;

  it("every invariant-family M1-M4 variant's FormSelection matches the honest register its own baked Japanese actually is", () => {
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

/**
 * A2 Can-do registry tests (Phase 3 Task 4).
 *
 * `canDos.ts` is the complete, stable Can-do identity/domain registry for all
 * 59 Phase-3 Can-dos (15 grammar, 40 topical, 4 scenario). These tests use a
 * small, self-contained fake set of "built lessons" (never the real M1-M4
 * module content) so `buildA2CanDos`/`buildA2CanDoLessonMap`'s derivation
 * logic — grammar Can-dos from the grammar-spiral union recipe, topical/
 * scenario Can-dos from primary/supporting scans, fail-closed for an
 * unserved definition — is proven independently of any authored content.
 * The real M1-M4 authored subset (`a2M1M4CanDos`) is asserted separately in
 * the cross-module aggregate suite once the real module content exists.
 */
import { describe, expect, it } from "vitest";

import {
  A2_CANDO_REGISTRY,
  A2_M1_M4_SERVED_CANDO_IDS,
  A2_M1_M8_SERVED_CANDO_IDS,
  A2_M5_M8_SERVED_CANDO_IDS,
  a2CanDoDescriptorCopy,
  buildA2CanDoLessonMap,
  buildA2CanDos,
  type A2CanDoStub,
} from "./canDos";
import { A2_GRAMMAR_SPIRAL } from "../forms/grammarSpiral";

interface FakeBuiltLesson {
  readonly recipe: {
    readonly id: string;
    readonly primaryCanDoId: string;
    readonly supportingCanDoIds: readonly string[];
  };
  readonly variants: readonly { readonly contextId: string }[];
}

function fakeLesson(
  id: string,
  primaryCanDoId: string,
  supportingCanDoIds: readonly string[] = [],
  contextIds: readonly string[] = ["fake-context"],
): FakeBuiltLesson {
  return {
    recipe: { id, primaryCanDoId, supportingCanDoIds },
    variants: contextIds.map((contextId) => ({ contextId })),
  };
}

describe("A2_CANDO_REGISTRY — the complete stable identity/domain registry", () => {
  it("declares exactly 59 Can-dos", () => {
    expect(A2_CANDO_REGISTRY).toHaveLength(59);
  });

  it("has 15 grammar, 40 topical, and 4 scenario Can-dos", () => {
    const byGroup = { grammar: 0, topical: 0, scenario: 0 };
    for (const stub of A2_CANDO_REGISTRY) {
      byGroup[stub.group]++;
    }
    expect(byGroup).toEqual({ grammar: 15, topical: 40, scenario: 4 });
  });

  it("has unique ids across all 59 entries", () => {
    const ids = A2_CANDO_REGISTRY.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no placeholder descriptorCopyId or empty domain for any entry", () => {
    for (const stub of A2_CANDO_REGISTRY) {
      expect(stub.descriptorCopyId.length).toBeGreaterThan(0);
      expect(stub.descriptorCopyId).not.toMatch(/TODO|TBD|placeholder/i);
      expect(["interaction", "spoken-production", "listening", "reading", "writing"]).toContain(
        stub.domain,
      );
    }
  });

  it("declares every A2 level to be 'a2'", () => {
    for (const stub of A2_CANDO_REGISTRY) {
      expect(stub.level).toBe("a2");
    }
  });

  it("covers every domain at least once (domain coverage)", () => {
    const domains = new Set(A2_CANDO_REGISTRY.map((c) => c.domain));
    expect(domains).toEqual(
      new Set(["interaction", "spoken-production", "listening", "reading", "writing"]),
    );
  });

  it("exactly matches the 15 grammar-spiral row ids as a2-cando-<id> for the grammar group", () => {
    const grammarIds = A2_CANDO_REGISTRY.filter((c) => c.group === "grammar").map((c) => c.id);
    const spiralIds = A2_GRAMMAR_SPIRAL.map((row) => row.canDoId);
    expect(grammarIds.sort()).toEqual([...spiralIds].sort());
  });

  it("carries a checkpoint-sampled evidence rule requiring at least 1 accepted transfer target for every entry", () => {
    for (const stub of A2_CANDO_REGISTRY) {
      expect(stub.checkpointEvidenceRule.evidenceKind).toBe("checkpoint-sampled");
      expect(stub.checkpointEvidenceRule.minAcceptedTransferTargets).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("buildA2CanDoLessonMap — grammar Can-dos derive lessonIds from the grammar-spiral union", () => {
  it("unions intro/controlled-practice/transfer/recurrence lesson ids for a grammar Can-do, filtered to lessons that actually exist", () => {
    const spiralRow = A2_GRAMMAR_SPIRAL.find((r) => r.id === "connectors");
    if (!spiralRow) throw new Error("fixture assumption: 'connectors' spiral row must exist");
    // Only some of the spiral row's lessons "exist" in this fake built set —
    // proving the derivation filters to what's actually provided, not the
    // full (possibly not-yet-authored) spiral schedule.
    const built = [
      fakeLesson(spiralRow.introLessonId, "a2-cando-backchannel-followup"),
      fakeLesson(spiralRow.transferLessonId, "a2-cando-narrate-order", ["a2-cando-connectors"]),
    ];
    const map = buildA2CanDoLessonMap(["a2-cando-connectors"], built);
    const lessonIds = map.get("a2-cando-connectors");
    expect(lessonIds).toBeDefined();
    expect(lessonIds).toContain(spiralRow.introLessonId);
    expect(lessonIds).toContain(spiralRow.transferLessonId);
    expect(lessonIds).not.toContain(spiralRow.controlledPracticeLessonId);
  });

  it("derives a topical Can-do's lessonIds from every built lesson naming it as primary or supporting", () => {
    const built = [
      fakeLesson("fake-lesson-1", "a2-cando-backchannel-followup"),
      fakeLesson("fake-lesson-2", "a2-cando-connectors", ["a2-cando-backchannel-followup"]),
      fakeLesson("fake-lesson-3", "a2-cando-unrelated"),
    ];
    const map = buildA2CanDoLessonMap(["a2-cando-backchannel-followup"], built);
    expect(map.get("a2-cando-backchannel-followup")).toEqual(["fake-lesson-1", "fake-lesson-2"]);
  });

  it("fails closed (throws) when asked to materialize a Can-do id with zero serving lessons", () => {
    const built = [fakeLesson("fake-lesson-1", "a2-cando-backchannel-followup")];
    expect(() => buildA2CanDoLessonMap(["a2-cando-arrange-meeting"], built)).toThrow(
      /arrange-meeting/,
    );
  });

  it("fails closed for a grammar Can-do whose full spiral schedule lessons are all absent from the built set", () => {
    const built = [fakeLesson("fake-lesson-1", "a2-cando-backchannel-followup")];
    expect(() => buildA2CanDoLessonMap(["a2-cando-compare"], built)).toThrow();
  });

  it("also includes any built lesson naming a grammar Can-do as primary/supporting even when the spiral row itself does not list that lesson (e.g. a second intro of the same competency, like pi2's tsumori alongside pi1's yotei both naming intentions-plans)", () => {
    const spiralRow = A2_GRAMMAR_SPIRAL.find((r) => r.id === "intentions-plans");
    if (!spiralRow) throw new Error("fixture assumption: 'intentions-plans' spiral row must exist");
    const built = [
      fakeLesson(spiralRow.introLessonId, "a2-cando-intentions-plans"),
      // A lesson the spiral row's own intro/controlled-practice/transfer/
      // recurrence fields never mention, yet which legitimately names this
      // same grammar Can-do as its own primary (a second, related intro).
      fakeLesson("fake-second-intro-lesson", "a2-cando-intentions-plans"),
      fakeLesson(spiralRow.controlledPracticeLessonId, "a2-cando-invite-accept-decline", ["a2-cando-intentions-plans"]),
    ];
    const map = buildA2CanDoLessonMap(["a2-cando-intentions-plans"], built);
    const lessonIds = map.get("a2-cando-intentions-plans");
    expect(lessonIds).toContain(spiralRow.introLessonId);
    expect(lessonIds).toContain("fake-second-intro-lesson");
  });
});

describe("buildA2CanDos — materializes real CanDo objects", () => {
  const built = [
    fakeLesson("fake-lesson-1", "a2-cando-backchannel-followup", [], ["fake-context-a"]),
    fakeLesson("fake-lesson-2", "a2-cando-clarify-repeat", ["a2-cando-backchannel-followup"], ["fake-context-b"]),
  ];

  it("returns a CanDo per requested id with real lessonIds, sorted-unique contextIds, and the JF/CEFR sourceNote", () => {
    const canDos = buildA2CanDos(["a2-cando-backchannel-followup", "a2-cando-clarify-repeat"], built);
    expect(canDos).toHaveLength(2);
    const backchannel = canDos.find((c) => c.id === "a2-cando-backchannel-followup");
    expect(backchannel).toBeDefined();
    expect(backchannel?.lessonIds).toEqual(["fake-lesson-1", "fake-lesson-2"]);
    expect(backchannel?.contextIds).toEqual(["fake-context-a", "fake-context-b"]);
    expect(backchannel?.sourceNote).toBe("product-authored-jf-cefr-aligned");
    expect(backchannel?.level).toBe("a2");
  });

  it("throws for a requested id that is not in the 59-entry registry at all", () => {
    expect(() => buildA2CanDos(["a2-cando-not-a-real-id"], built)).toThrow();
  });
});

describe("<=2 supports per recipe (structural contract A2 lessons must honor)", () => {
  it("flags a fake recipe that supplies more than 2 supporting Can-do ids", () => {
    const tooMany = fakeLesson("bad-lesson", "a2-cando-backchannel-followup", [
      "a2-cando-connectors",
      "a2-cando-clarify-repeat",
      "a2-cando-recognize-plain-forms",
    ]);
    expect(tooMany.recipe.supportingCanDoIds.length).toBeGreaterThan(2);
  });
});

describe("current 16-lesson M1-M4 recipe mapping (documented contract)", () => {
  // Pins the exact primary/support mapping the task specifies, independent of
  // the real module content — a fast, standalone regression guard for the
  // mapping table itself.
  const EXPECTED: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
    "connected-conversation-1": { primary: "a2-cando-backchannel-followup", supports: [] },
    "connected-conversation-2": { primary: "a2-cando-connectors", supports: [] },
    "connected-conversation-3": { primary: "a2-cando-clarify-repeat", supports: [] },
    "connected-conversation-4": { primary: "a2-cando-recognize-plain-forms", supports: [] },
    "plans-invitations-1": { primary: "a2-cando-intentions-plans", supports: [] },
    "plans-invitations-2": { primary: "a2-cando-intentions-plans", supports: ["a2-cando-recognize-plain-forms"] },
    "plans-invitations-3": { primary: "a2-cando-invite-accept-decline", supports: ["a2-cando-intentions-plans"] },
    "plans-invitations-4": { primary: "a2-cando-arrange-meeting", supports: ["a2-cando-intentions-plans"] },
    "experiences-narratives-1": { primary: "a2-cando-experience-takoto", supports: [] },
    "experiences-narratives-2": { primary: "a2-cando-narrate-order", supports: ["a2-cando-connectors", "a2-cando-recognize-plain-forms"] },
    "experiences-narratives-3": { primary: "a2-cando-experience-takoto", supports: ["a2-cando-recognize-plain-forms"] },
    "experiences-narratives-4": { primary: "a2-cando-ask-experience", supports: ["a2-cando-experience-takoto"] },
    "reasons-opinions-1": { primary: "a2-cando-give-reasons", supports: ["a2-cando-reason-kara"] },
    "reasons-opinions-2": { primary: "a2-cando-reason-node", supports: ["a2-cando-give-reasons"] },
    "reasons-opinions-3": { primary: "a2-cando-opinion-toomou", supports: ["a2-cando-recognize-plain-forms"] },
    "reasons-opinions-4": { primary: "a2-cando-agree-disagree", supports: ["a2-cando-opinion-toomou", "a2-cando-connectors"] },
  };

  it("documents exactly 16 lessons, each with <=2 supports", () => {
    expect(Object.keys(EXPECTED)).toHaveLength(16);
    for (const [lessonId, mapping] of Object.entries(EXPECTED)) {
      expect(mapping.supports.length, lessonId).toBeLessThanOrEqual(2);
    }
  });

  it("every primary/support id referenced by the mapping exists in the 59-entry registry", () => {
    const registryIds = new Set(A2_CANDO_REGISTRY.map((c) => c.id));
    for (const [lessonId, mapping] of Object.entries(EXPECTED)) {
      expect(registryIds.has(mapping.primary), `${lessonId} primary ${mapping.primary}`).toBe(true);
      for (const support of mapping.supports) {
        expect(registryIds.has(support), `${lessonId} support ${support}`).toBe(true);
      }
    }
  });
});

describe("Phase 3 Task 5 — 16-lesson M5-M8 recipe mapping (documented contract)", () => {
  // Pins the exact primary/support mapping the task specifies. The task's
  // recipe text quotes several Can-do names verbatim from an earlier design
  // doc (docs/superpowers/plans/2026-07-17-a1-a2-phase-3-a2-kanji.md) that
  // predates the actual, frozen 59-entry canDos.ts registry Task 4 shipped —
  // that registry renamed/consolidated several topical Can-do ids (e.g.
  // "describe-ongoing" -> "describe-ongoing-action", "can-cannot" ->
  // "express-ability", "order-food"/"special-request"/"report-problem"/
  // "pay-handle-problem" have no literal registry counterpart at all). Every
  // id below is mapped to its real, registered equivalent — never invented —
  // and every *grammar* id (sequence-te/ongoing-teiru/permission-temoii/
  // prohibition-tewaikenai/request-tekudasai/negative-request/possibility)
  // matches `A2_GRAMMAR_SPIRAL`'s own frozen intro/practice/transfer lesson
  // ids exactly (see forms/grammarSpiral.ts).
  const EXPECTED: Readonly<Record<string, { primary: string; supports: readonly string[] }>> = {
    "sequencing-ongoing-1": { primary: "a2-cando-sequence-te", supports: [] },
    "sequencing-ongoing-2": { primary: "a2-cando-describe-now", supports: ["a2-cando-sequence-te"] },
    "sequencing-ongoing-3": { primary: "a2-cando-describe-ongoing-action", supports: ["a2-cando-ongoing-teiru"] },
    "sequencing-ongoing-4": { primary: "a2-cando-describe-routine", supports: ["a2-cando-sequence-te", "a2-cando-ongoing-teiru"] },
    "permission-requests-1": { primary: "a2-cando-permission-temoii", supports: [] },
    "permission-requests-2": { primary: "a2-cando-prohibition-tewaikenai", supports: [] },
    "permission-requests-3": { primary: "a2-cando-request-tekudasai", supports: ["a2-cando-permission-temoii"] },
    "permission-requests-4": { primary: "a2-cando-negative-request", supports: ["a2-cando-prohibition-tewaikenai"] },
    "neighborhood-services-1": { primary: "a2-cando-possibility", supports: ["a2-cando-permission-temoii"] },
    "neighborhood-services-2": { primary: "a2-cando-express-ability", supports: ["a2-cando-possibility"] },
    "neighborhood-services-3": { primary: "a2-cando-ask-for-help", supports: [] },
    "neighborhood-services-4": { primary: "a2-cando-describe-facility", supports: ["a2-cando-ongoing-teiru"] },
    "restaurant-problems-1": { primary: "a2-cando-confirm-understanding", supports: [] },
    "restaurant-problems-2": { primary: "a2-cando-ask-for-help", supports: ["a2-cando-request-tekudasai", "a2-cando-permission-temoii"] },
    "restaurant-problems-3": { primary: "a2-cando-recount-experience", supports: [] },
    "restaurant-problems-4": { primary: "a2-cando-negotiate-price", supports: ["a2-cando-sequence-te"] },
  };

  it("documents exactly 16 lessons, each with <=2 supports", () => {
    expect(Object.keys(EXPECTED)).toHaveLength(16);
    for (const [lessonId, mapping] of Object.entries(EXPECTED)) {
      expect(mapping.supports.length, lessonId).toBeLessThanOrEqual(2);
    }
  });

  it("every primary/support id referenced by the mapping exists in the 59-entry registry", () => {
    const registryIds = new Set(A2_CANDO_REGISTRY.map((c) => c.id));
    for (const [lessonId, mapping] of Object.entries(EXPECTED)) {
      expect(registryIds.has(mapping.primary), `${lessonId} primary ${mapping.primary}`).toBe(true);
      for (const support of mapping.supports) {
        expect(registryIds.has(support), `${lessonId} support ${support}`).toBe(true);
      }
    }
  });

  it("every grammar Can-do's lesson role matches A2_GRAMMAR_SPIRAL's own frozen schedule exactly", () => {
    const spiralByCanDoId = new Map(A2_GRAMMAR_SPIRAL.map((row) => [row.canDoId, row]));
    const GRAMMAR_ROLE_CHECKS: readonly { canDoId: string; lessonId: string; role: "introLessonId" | "controlledPracticeLessonId" | "transferLessonId" }[] = [
      { canDoId: "a2-cando-sequence-te", lessonId: "sequencing-ongoing-1", role: "introLessonId" },
      { canDoId: "a2-cando-sequence-te", lessonId: "sequencing-ongoing-2", role: "controlledPracticeLessonId" },
      { canDoId: "a2-cando-sequence-te", lessonId: "sequencing-ongoing-4", role: "transferLessonId" },
      { canDoId: "a2-cando-ongoing-teiru", lessonId: "sequencing-ongoing-3", role: "introLessonId" },
      { canDoId: "a2-cando-ongoing-teiru", lessonId: "sequencing-ongoing-4", role: "controlledPracticeLessonId" },
      { canDoId: "a2-cando-permission-temoii", lessonId: "permission-requests-1", role: "introLessonId" },
      { canDoId: "a2-cando-permission-temoii", lessonId: "permission-requests-3", role: "controlledPracticeLessonId" },
      { canDoId: "a2-cando-permission-temoii", lessonId: "neighborhood-services-1", role: "transferLessonId" },
      { canDoId: "a2-cando-prohibition-tewaikenai", lessonId: "permission-requests-2", role: "introLessonId" },
      { canDoId: "a2-cando-prohibition-tewaikenai", lessonId: "permission-requests-4", role: "controlledPracticeLessonId" },
      { canDoId: "a2-cando-request-tekudasai", lessonId: "permission-requests-3", role: "introLessonId" },
      { canDoId: "a2-cando-request-tekudasai", lessonId: "restaurant-problems-2", role: "controlledPracticeLessonId" },
      { canDoId: "a2-cando-negative-request", lessonId: "permission-requests-4", role: "introLessonId" },
      { canDoId: "a2-cando-possibility", lessonId: "neighborhood-services-1", role: "introLessonId" },
      { canDoId: "a2-cando-possibility", lessonId: "neighborhood-services-2", role: "controlledPracticeLessonId" },
    ];
    for (const check of GRAMMAR_ROLE_CHECKS) {
      const row = spiralByCanDoId.get(check.canDoId);
      expect(row, check.canDoId).toBeDefined();
      expect(row?.[check.role], `${check.canDoId} ${check.role}`).toBe(check.lessonId);
    }
  });
});

describe("a2CanDoDescriptorCopy — bilingual Can-do descriptor statements for the M1-M8 served subset", () => {
  it("has an EN and IT entry for every descriptorCopyId of the 15 M1-M4-served Can-dos, with no Japanese literal", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const id of A2_M1_M4_SERVED_CANDO_IDS) {
      const registered = A2_CANDO_REGISTRY.find((c) => c.id === id);
      expect(registered, id).toBeDefined();
      const copyId = (registered as A2CanDoStub).descriptorCopyId;
      expect(a2CanDoDescriptorCopy.en[copyId], `${id} en`).toBeTruthy();
      expect(a2CanDoDescriptorCopy.it[copyId], `${id} it`).toBeTruthy();
      expect(JAPANESE_PATTERN.test(a2CanDoDescriptorCopy.en[copyId]), `${id} en`).toBe(false);
      expect(JAPANESE_PATTERN.test(a2CanDoDescriptorCopy.it[copyId]), `${id} it`).toBe(false);
    }
  });

  it("has an EN and IT entry for every descriptorCopyId of the 16 new M5-M8-served Can-dos, with no Japanese literal", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const id of A2_M5_M8_SERVED_CANDO_IDS) {
      const registered = A2_CANDO_REGISTRY.find((c) => c.id === id);
      expect(registered, id).toBeDefined();
      const copyId = (registered as A2CanDoStub).descriptorCopyId;
      expect(a2CanDoDescriptorCopy.en[copyId], `${id} en`).toBeTruthy();
      expect(a2CanDoDescriptorCopy.it[copyId], `${id} it`).toBeTruthy();
      expect(JAPANESE_PATTERN.test(a2CanDoDescriptorCopy.en[copyId]), `${id} en`).toBe(false);
      expect(JAPANESE_PATTERN.test(a2CanDoDescriptorCopy.it[copyId]), `${id} it`).toBe(false);
    }
  });

  it("has identical EN/IT key sets (parity)", () => {
    expect(Object.keys(a2CanDoDescriptorCopy.en).sort()).toEqual(
      Object.keys(a2CanDoDescriptorCopy.it).sort(),
    );
  });
});

describe("A2_M1_M8_SERVED_CANDO_IDS — the honest staged M1-M8 authored subset (Phase 3 Task 5)", () => {
  it("is exactly the union of the 15 M1-M4-served ids and the 16 new M5-M8-served ids, with no duplicates", () => {
    expect(A2_M5_M8_SERVED_CANDO_IDS).toHaveLength(16);
    expect(new Set(A2_M5_M8_SERVED_CANDO_IDS).size).toBe(16);
    for (const id of A2_M5_M8_SERVED_CANDO_IDS) {
      expect(A2_M1_M4_SERVED_CANDO_IDS, id).not.toContain(id);
    }
    expect(A2_M1_M8_SERVED_CANDO_IDS).toHaveLength(31);
    expect(new Set(A2_M1_M8_SERVED_CANDO_IDS)).toEqual(
      new Set([...A2_M1_M4_SERVED_CANDO_IDS, ...A2_M5_M8_SERVED_CANDO_IDS]),
    );
  });

  it("every id is registered in the 59-entry A2_CANDO_REGISTRY", () => {
    const registryIds = new Set(A2_CANDO_REGISTRY.map((c) => c.id));
    for (const id of A2_M1_M8_SERVED_CANDO_IDS) {
      expect(registryIds.has(id), id).toBe(true);
    }
  });
});

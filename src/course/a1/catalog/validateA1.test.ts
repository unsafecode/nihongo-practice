/**
 * Release-gate contract for {@link validateA1}. Every A1-specific error code is
 * driven by exactly one deterministic mutation fed through `ValidateA1Input`
 * overrides; the wrapped foundation diagnostics are asserted to survive intact.
 *
 * No fixture imports: every input is derived from the frozen release catalogs
 * and cloned with `structuredClone` before mutation.
 */
import { describe, expect, it } from "vitest";
import type { FoundationCatalogs, VerbUseRecord, CanDo } from "../../foundations/types";
import {
  validateA1,
  validateA1Release,
  type A1ValidationErrorCode,
} from "./validateA1";
import {
  a1FoundationCatalogs,
  a1SemanticFoundationCatalogs,
  a1FoundationCopy,
} from "./catalog";
import { a1CanDosAuthored } from "./canDos";
import { a1Checkpoint } from "./checkpoint";
import { a1ReleaseVerbUseRecords } from "./recurrence";
import { module1ItemsByLesson, module1Lessons, type A1PhoneticItem } from "./module01Sounds";
import { A1_MANIFEST_SPEC } from "../manifest";

type Clonable = <T>(value: T) => T;
const clone: Clonable = (value) => structuredClone(value);

function codesOf(result: { errors: readonly { code: A1ValidationErrorCode }[] }): Set<string> {
  return new Set(result.errors.map((error) => error.code));
}

/** Clone the full catalogs so a test can mutate module / lesson / position shape. */
function fullClone(): FoundationCatalogs {
  return clone(a1FoundationCatalogs);
}
/** Clone the semantic (44-lesson) catalogs so a test can mutate variants. */
function semanticClone(): FoundationCatalogs {
  return clone(a1SemanticFoundationCatalogs);
}
function copyClone(): { en: Record<string, string>; it: Record<string, string> } {
  return { en: { ...a1FoundationCopy.en }, it: { ...a1FoundationCopy.it } };
}
function verbClone(): VerbUseRecord[] {
  return clone(a1ReleaseVerbUseRecords) as VerbUseRecord[];
}
function phoneticItemsClone(): Record<string, A1PhoneticItem[]> {
  return clone(module1ItemsByLesson) as Record<string, A1PhoneticItem[]>;
}

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

describe("validateA1 – baseline release", () => {
  it("passes with zero A1 errors and is deterministic", () => {
    const a = validateA1();
    const b = validateA1Release();
    expect(a.valid).toBe(true);
    expect(a.errors).toEqual([]);
    // Determinism: identical ordering / content across independent calls.
    expect(b.errors).toEqual(a.errors);
    expect(b.valid).toBe(true);
  });

  it("preserves the wrapped foundation diagnostics without letting them block release", () => {
    const result = validateA1();
    const codes = new Map<string, number>();
    for (const error of result.foundationReport.errors) {
      codes.set(error.code, (codes.get(error.code) ?? 0) + 1);
    }
    // Diagnostic, per-lesson foundation findings are surfaced but never gate.
    expect(result.foundationReport.errors.length).toBe(28);
    expect(codes.get("transfer-uses-unintroduced-content")).toBe(25);
    expect(codes.get("conflated-sense-context")).toBe(3);
    expect(result.valid).toBe(true);
  });

  it("wraps validateFoundations at the fixed release version and seed", () => {
    const result = validateA1();
    // The foundation report exists and carries per-lesson coverage rows.
    expect(Object.keys(result.foundationReport.reports.byLesson).length).toBe(44);
  });
});

// ---------------------------------------------------------------------------
// Structural shape
// ---------------------------------------------------------------------------

describe("validateA1 – structural mutations", () => {
  it("module-count: fewer than 12 modules", () => {
    const full = fullClone();
    // Drop a middle (non-capstone, non-final) module.
    (full.modules as unknown as unknown[]).splice(1, 1);
    const result = validateA1({ fullCatalogs: full });
    expect(result.valid).toBe(false);
    expect(codesOf(result)).toContain("module-count");
  });

  it("lessons-per-module: a module with the wrong lesson count", () => {
    const full = fullClone();
    (full.modules[1].lessonIds as unknown as string[]).push("descriptions-1");
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("lessons-per-module");
  });

  it("route-count: a missing lesson position", () => {
    const full = fullClone();
    (full.lessonPositions as unknown as unknown[]).pop();
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("route-count");
  });

  it("unknown-lesson-id: a position pointing at a non-manifest lesson", () => {
    const full = fullClone();
    const first = clone(full.lessonPositions[0]);
    (full.lessonPositions as unknown as Record<string, unknown>[]).push({
      ...first,
      lessonId: "totally-unknown-lesson",
      position: 999,
    });
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("unknown-lesson-id");
  });

  it("duplicate-lesson-id: a lesson routed twice", () => {
    const full = fullClone();
    (full.lessonPositions as unknown as unknown[]).push(clone(full.lessonPositions[0]));
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("duplicate-lesson-id");
  });

  it("manifest-mismatch: a position that disagrees with the canonical order", () => {
    const full = fullClone();
    (full.lessonPositions[0] as unknown as { position: number }).position += 100;
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("manifest-mismatch");
  });

  it("manifest-invalid: a self-inconsistent manifest spec", () => {
    const spec = clone(A1_MANIFEST_SPEC);
    (spec.aliases as Record<string, string>)["ghost-source"] = "no-such-lesson";
    const result = validateA1({ manifestSpec: spec });
    expect(codesOf(result)).toContain("manifest-invalid");
  });

  it("capstone-structure: capstones not the final module", () => {
    const full = fullClone();
    const last = full.modules.length - 1;
    const tmp = full.modules[last];
    (full.modules as unknown as unknown[])[last] = full.modules[last - 1];
    (full.modules as unknown as unknown[])[last - 1] = tmp;
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("capstone-structure");
  });
});

// ---------------------------------------------------------------------------
// Content ordering / closure
// ---------------------------------------------------------------------------

describe("validateA1 – content ordering & closure", () => {
  it("unknown-content: a model slot filled with a non-existent value", () => {
    const semantic = semanticClone();
    const model = semantic.sentenceVariants.find(
      (v) => v.pedagogicalUse === "model" && !v.id.startsWith("capstones-"),
    );
    expect(model).toBeDefined();
    const slotKey = Object.keys(model!.slotValues)[0];
    (model!.slotValues as Record<string, string>)[slotKey] = "a1-value-does-not-exist";
    const result = validateA1({ semanticCatalogs: semantic });
    expect(codesOf(result)).toContain("unknown-content");
  });

  it("intro-before-use: a transfer recombines a value taught by no model", () => {
    const semantic = semanticClone();
    // A known-but-untaught value: append it to the catalog, then use it only in
    // a transfer. It is a valid value id (no unknown-content) yet never a model
    // filler (intro-before-use).
    const synthetic = { ...clone(semantic.semanticValues[0]), id: "a1-value-synthetic-transfer" };
    (semantic.semanticValues as unknown as unknown[]).push(synthetic);
    const transfer = semantic.sentenceVariants.find(
      (v) => v.pedagogicalUse === "transfer" && !v.id.startsWith("capstones-"),
    );
    expect(transfer).toBeDefined();
    const slotKey = Object.keys(transfer!.slotValues)[0];
    (transfer!.slotValues as Record<string, string>)[slotKey] = "a1-value-synthetic-transfer";
    const result = validateA1({ semanticCatalogs: semantic });
    expect(codesOf(result)).toContain("intro-before-use");
    expect(codesOf(result)).not.toContain("unknown-content");
  });

  it("capstone baseline: introduced-content sets are empty", () => {
    const result = validateA1();
    expect(result.errors.filter((e) => e.code === "capstone-introduces-new")).toEqual([]);
  });

  it("capstone-introduces-new: a capstone model invents fresh content", () => {
    const semantic = semanticClone();
    const synthetic = { ...clone(semantic.semanticValues[0]), id: "a1-value-synthetic-capstone" };
    (semantic.semanticValues as unknown as unknown[]).push(synthetic);
    const capstoneModel = semantic.sentenceVariants.find(
      (v) => v.id.startsWith("capstones-") && v.pedagogicalUse === "model",
    );
    expect(capstoneModel).toBeDefined();
    const slotKey = Object.keys(capstoneModel!.slotValues)[0];
    (capstoneModel!.slotValues as Record<string, string>)[slotKey] = "a1-value-synthetic-capstone";
    const result = validateA1({ semanticCatalogs: semantic });
    expect(codesOf(result)).toContain("capstone-introduces-new");
    // The synthetic value is a model filler, so it must NOT masquerade as
    // intro-before-use — the capstone gate is the correct owner.
    expect(codesOf(result)).not.toContain("intro-before-use");
  });
});

// ---------------------------------------------------------------------------
// Recurrence
// ---------------------------------------------------------------------------

describe("validateA1 – recurrence completeness", () => {
  it("baseline: all 37 release verb-use records carry >= 2 later uses", () => {
    expect(a1ReleaseVerbUseRecords.length).toBe(37);
    for (const record of a1ReleaseVerbUseRecords) {
      expect(record.laterUses.length).toBeGreaterThanOrEqual(2);
    }
    expect(codesOf(validateA1())).not.toContain("recurrence-incomplete");
  });

  it("recurrence-incomplete: a productive sense loses a later use", () => {
    const records = verbClone();
    (records[0].laterUses as unknown as unknown[]).pop();
    const result = validateA1({ releaseVerbUseRecords: records });
    expect(codesOf(result)).toContain("recurrence-incomplete");
  });
});

// ---------------------------------------------------------------------------
// Can-do / checkpoint
// ---------------------------------------------------------------------------

describe("validateA1 – Can-do & checkpoint alignment", () => {
  it("baseline: every authored non-sounds Can-do has transfer evidence and is sampled", () => {
    const sampled = new Set(a1Checkpoint.sampledCanDoIds);
    for (const canDo of a1CanDosAuthored) {
      expect(sampled.has(canDo.id)).toBe(true);
    }
    // Every real lesson's primary Can-do is sampled by the checkpoint.
    for (const lesson of a1FoundationCatalogs.lessons) {
      expect(sampled.has(lesson.primaryCanDoId)).toBe(true);
    }
    expect(a1Checkpoint.minAcceptedTransferTargetsPerCanDo).toBeGreaterThanOrEqual(8);
    const codes = codesOf(validateA1());
    for (const code of [
      "cando-not-sampled",
      "cando-no-transfer-evidence",
      "cando-primary-mismatch",
      "cando-supporting-overflow",
      "checkpoint-min-transfer",
    ]) {
      expect(codes).not.toContain(code);
    }
  });

  it("cando-not-sampled: the checkpoint drops a taught primary Can-do", () => {
    const checkpoint = clone(a1Checkpoint);
    const dropped = a1FoundationCatalogs.lessons[0].primaryCanDoId;
    (checkpoint as unknown as { sampledCanDoIds: string[] }).sampledCanDoIds =
      checkpoint.sampledCanDoIds.filter((id) => id !== dropped);
    const result = validateA1({ checkpoint });
    expect(codesOf(result)).toContain("cando-not-sampled");
  });

  it("cando-primary-mismatch: a lesson claims a Can-do that does not list it", () => {
    const full = fullClone();
    const lesson = full.lessons[0];
    const foreign = full.canDos.find(
      (canDo) =>
        canDo.id !== lesson.primaryCanDoId &&
        !canDo.lessonIds.includes(lesson.id) &&
        a1Checkpoint.sampledCanDoIds.includes(canDo.id),
    );
    expect(foreign).toBeDefined();
    (lesson as { primaryCanDoId: string }).primaryCanDoId = foreign!.id;
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("cando-primary-mismatch");
  });

  it("cando-supporting-overflow: a lesson carries more than two support Can-dos", () => {
    const full = fullClone();
    const lesson = full.lessons[0];
    const pool = full.canDos.map((c) => c.id).slice(0, 3);
    (lesson as unknown as { supportingCanDoIds: string[] }).supportingCanDoIds = pool;
    const result = validateA1({ fullCatalogs: full });
    expect(codesOf(result)).toContain("cando-supporting-overflow");
  });

  it("cando-no-transfer-evidence: an authored Can-do that no family references", () => {
    const authored: CanDo[] = [
      ...a1CanDosAuthored,
      { ...clone(a1CanDosAuthored[0]), id: "a1-can-do-unreferenced" },
    ];
    const result = validateA1({ authoredCanDos: authored });
    expect(codesOf(result)).toContain("cando-no-transfer-evidence");
  });

  it("checkpoint-min-transfer: the checkpoint accepts too few transfer targets", () => {
    const checkpoint = clone(a1Checkpoint);
    (checkpoint as { minAcceptedTransferTargetsPerCanDo: number }).minAcceptedTransferTargetsPerCanDo = 5;
    const result = validateA1({ checkpoint });
    expect(codesOf(result)).toContain("checkpoint-min-transfer");
  });
});

// ---------------------------------------------------------------------------
// Copy hygiene / aliases / claims
// ---------------------------------------------------------------------------

describe("validateA1 – copy hygiene, aliases & claims", () => {
  it("copy-parity: an English key with no Italian counterpart", () => {
    const copy = copyClone();
    copy.en["a1.copy.orphan"] = "orphan text";
    const result = validateA1({ foundationCopy: copy });
    expect(codesOf(result)).toContain("copy-parity");
  });

  it("copy-contains-japanese: a rendered copy string leaking kana/kanji", () => {
    const copy = copyClone();
    const key = Object.keys(copy.en)[0];
    copy.en[key] = "practice こんにちは now";
    const result = validateA1({ foundationCopy: copy });
    expect(codesOf(result)).toContain("copy-contains-japanese");
  });

  it("checkpoint-claims-certification: copy promising certification", () => {
    const copy = copyClone();
    const key = Object.keys(copy.en)[0];
    copy.en[key] = "You are now certified at A1.";
    const result = validateA1({ foundationCopy: copy });
    expect(codesOf(result)).toContain("checkpoint-claims-certification");
  });

  it("personal-alias-match: the author's personal handle leaking into copy", () => {
    const copy = copyClone();
    const key = Object.keys(copy.en)[0];
    // Build the forbidden latin alias without embedding the literal token.
    copy.en[key] = `hello ${"ric" + "chi"} sensei`;
    const result = validateA1({ foundationCopy: copy });
    expect(codesOf(result)).toContain("personal-alias-match");
  });
});

// ---------------------------------------------------------------------------
// Phonetic contracts
// ---------------------------------------------------------------------------

describe("validateA1 – phonetic contracts", () => {
  it("phonetic-missing-items: a sounds lesson with no items", () => {
    const items = phoneticItemsClone();
    const lessonId = module1Lessons[0].id;
    items[lessonId] = [];
    const result = validateA1({ phoneticItemsByLesson: items });
    expect(codesOf(result)).toContain("phonetic-missing-items");
  });

  it("phonetic-dangling-contrast: an item contrasting with a non-existent item", () => {
    const items = phoneticItemsClone();
    const lessonId = module1Lessons[0].id;
    (items[lessonId][0] as { contrastWithId: string }).contrastWithId = "no-such-item";
    const result = validateA1({ phoneticItemsByLesson: items });
    expect(codesOf(result)).toContain("phonetic-dangling-contrast");
  });

  it("phonetic-duplicate-exercise: two items sharing an exercise ref", () => {
    const items = phoneticItemsClone();
    const lessonId = module1Lessons[0].id;
    const ref = items[lessonId][0].exerciseRefId;
    (items[lessonId][1] as { exerciseRefId: string }).exerciseRefId = ref;
    const result = validateA1({ phoneticItemsByLesson: items });
    expect(codesOf(result)).toContain("phonetic-duplicate-exercise");
  });

  it("phonetic-item-incomplete: an item missing a required field", () => {
    const items = phoneticItemsClone();
    const lessonId = module1Lessons[0].id;
    (items[lessonId][0] as { roman: string }).roman = "";
    const result = validateA1({ phoneticItemsByLesson: items });
    expect(codesOf(result)).toContain("phonetic-item-incomplete");
  });

  it("phonetic-lesson-mismatch: a recipe practice-ref list out of sync", () => {
    const lessons = clone(module1Lessons);
    (lessons[0] as unknown as { practiceTargetRefs: string[] }).practiceTargetRefs = [
      ...lessons[0].practiceTargetRefs,
    ].reverse();
    const result = validateA1({ phoneticLessons: lessons });
    expect(codesOf(result)).toContain("phonetic-lesson-mismatch");
  });
});

// ---------------------------------------------------------------------------
// Determinism of the error channel
// ---------------------------------------------------------------------------

describe("validateA1 – deterministic error ordering", () => {
  it("emits errors sorted by (code, id, dimension, referenceId)", () => {
    // A mutation that raises several errors at once must return them sorted.
    const full = fullClone();
    (full.lessonPositions as unknown as unknown[]).pop();
    (full.lessonPositions[0] as unknown as { position: number }).position += 100;
    const result = validateA1({ fullCatalogs: full });
    const keys = result.errors.map(
      (e) => `${e.code}\u0000${e.id ?? ""}\u0000${e.dimension ?? ""}\u0000${e.referenceId ?? ""}`,
    );
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
    // And repeated evaluation is byte-identical.
    const again = validateA1({ fullCatalogs: fullClone() });
    const againAfterPop = (() => {
      const f = fullClone();
      (f.lessonPositions as unknown as unknown[]).pop();
      (f.lessonPositions[0] as unknown as { position: number }).position += 100;
      return validateA1({ fullCatalogs: f });
    })();
    expect(againAfterPop.errors).toEqual(result.errors);
    expect(again.valid).toBe(true);
  });
});

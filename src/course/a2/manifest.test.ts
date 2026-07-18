import { describe, expect, it } from "vitest";
import {
  A2_CANONICAL_POSITIONS,
  A2_LEGACY_LESSON_ALIASES,
  A2_LESSON_IDS,
  A2_LESSON_IDS_BY_MODULE,
  A2_LESSON_MANIFEST,
  A2_MANIFEST_SPEC,
  A2_MODULE_IDS,
  A2_MODULE_MANIFEST,
  A2_SYNTHESIS_LESSON_IDS,
  validateA2ManifestSpec,
} from "./manifest";
import { A2_RELEASE_ERROR_CODES } from "./types";
import type { A2ManifestSpec } from "./types";

/**
 * The locked 15-module / 60-lesson A2 manifest (Phase 3 Task 1). There is no
 * content yet — this suite only proves the frozen structural spine: exact
 * module order, stable lesson ids, canonical positions, contract assignment,
 * absence of a phonetic module, and a clean canonical validation pass.
 */

const EXPECTED_MODULE_ORDER = [
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
  "relationships-events",
  "practical-texts",
  "a2-synthesis",
] as const;

describe("A2 manifest", () => {
  it("declares the exact 15 module ids in exact prerequisite order", () => {
    expect(A2_MODULE_IDS).toEqual(EXPECTED_MODULE_ORDER);
  });

  it("declares exactly 60 stable lesson ids as `${moduleId}-1..4`", () => {
    expect(A2_LESSON_IDS).toHaveLength(60);
    for (const moduleId of EXPECTED_MODULE_ORDER) {
      expect(A2_LESSON_IDS_BY_MODULE[moduleId]).toEqual([
        `${moduleId}-1`,
        `${moduleId}-2`,
        `${moduleId}-3`,
        `${moduleId}-4`,
      ]);
    }
    // Every lesson id is unique.
    expect(new Set(A2_LESSON_IDS).size).toBe(60);
  });

  it("assigns canonical positions 1..60 in module/lesson order", () => {
    const positions = A2_LESSON_IDS.map((id) => A2_CANONICAL_POSITIONS[id]);
    expect(positions).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
  });

  it("marks a2-synthesis as the only synthesis module; every other module instructional", () => {
    expect(A2_SYNTHESIS_LESSON_IDS).toEqual([
      "a2-synthesis-1",
      "a2-synthesis-2",
      "a2-synthesis-3",
      "a2-synthesis-4",
    ]);
    for (const moduleId of EXPECTED_MODULE_ORDER) {
      const expectedContract =
        moduleId === "a2-synthesis" ? "synthesis" : "instructional";
      expect(A2_MANIFEST_SPEC.moduleContracts[moduleId]).toBe(expectedContract);
    }
  });

  it("has no phonetic module (A2 declares no phonetic contract anywhere)", () => {
    const contracts = Object.values(A2_MANIFEST_SPEC.moduleContracts);
    expect(contracts).not.toContain("phonetic");
    expect(new Set(contracts)).toEqual(new Set(["instructional", "synthesis"]));
  });

  it("validates the canonical spec with zero errors, and has an empty legacy alias map", () => {
    const result = validateA2ManifestSpec(A2_MANIFEST_SPEC);
    expect(result).toEqual({ ok: true });
    expect(A2_LEGACY_LESSON_ALIASES).toEqual({});
  });

  it("reports typed structural errors for a broken spec", () => {
    const broken: A2ManifestSpec = {
      moduleIds: ["only-one-module"],
      lessonIdsByModule: {
        "only-one-module": ["only-one-module-1", "only-one-module-1"],
      },
      modulePrerequisites: { "only-one-module": ["only-one-module"] },
      moduleContracts: { "only-one-module": "instructional" },
      synthesisModuleId: "missing-module",
      aliases: { "alias-1": "missing-target" },
    };
    const result = validateA2ManifestSpec(broken);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const codes = result.errors.map((e) => e.code).sort();
    expect(codes).toEqual(
      [
        "module-count",
        "lessons-per-module",
        "duplicate-lesson-id",
        "unknown-synthesis-module",
        "prerequisite-cycle",
        "alias-target-missing",
      ].sort(),
    );
  });

  it("reports duplicate-module-id when the same module id is declared twice", () => {
    const broken: A2ManifestSpec = {
      moduleIds: ["mod-a", "mod-a"],
      lessonIdsByModule: {
        "mod-a": ["mod-a-1", "mod-a-2", "mod-a-3", "mod-a-4"],
      },
      modulePrerequisites: { "mod-a": [] },
      moduleContracts: { "mod-a": "instructional" },
      synthesisModuleId: "mod-a",
      aliases: {},
    };
    const result = validateA2ManifestSpec(broken);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain("duplicate-module-id");
  });

  it("reports unknown-prerequisite for a dangling prerequisite id, not prerequisite-cycle", () => {
    const broken: A2ManifestSpec = {
      moduleIds: ["mod-a", "mod-b"],
      lessonIdsByModule: {
        "mod-a": ["mod-a-1", "mod-a-2", "mod-a-3", "mod-a-4"],
        "mod-b": ["mod-b-1", "mod-b-2", "mod-b-3", "mod-b-4"],
      },
      modulePrerequisites: {
        "mod-a": [],
        "mod-b": ["mod-nonexistent"],
      },
      moduleContracts: { "mod-a": "instructional", "mod-b": "synthesis" },
      synthesisModuleId: "mod-b",
      aliases: {},
    };
    const result = validateA2ManifestSpec(broken);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain("unknown-prerequisite");
    expect(codes).not.toContain("prerequisite-cycle");
  });

  it("does not silently accept a dangling prerequisite id (regression: previously ok:true)", () => {
    const withDanglingPrereq: A2ManifestSpec = {
      ...A2_MANIFEST_SPEC,
      moduleIds: [...A2_MANIFEST_SPEC.moduleIds],
      modulePrerequisites: {
        ...A2_MANIFEST_SPEC.modulePrerequisites,
        "connected-conversation": ["module-that-does-not-exist"],
      },
    };
    const result = validateA2ManifestSpec(withDanglingPrereq);
    expect(result.ok).toBe(false);
  });
});

describe("A2 derived manifest exports", () => {
  it("derives A2_MODULE_MANIFEST with correct ordering, prerequisite, contract, and outcome ids", () => {
    expect(Object.keys(A2_MODULE_MANIFEST)).toHaveLength(15);
    A2_MODULE_IDS.forEach((moduleId, index) => {
      const entry = A2_MODULE_MANIFEST[moduleId];
      expect(entry.id).toBe(moduleId);
      expect(entry.order).toBe(index + 1);
      expect(entry.contract).toBe(A2_MANIFEST_SPEC.moduleContracts[moduleId]);
      expect(entry.prerequisiteIds).toEqual(
        A2_MANIFEST_SPEC.modulePrerequisites[moduleId],
      );
      expect(entry.lessonIds).toEqual(A2_LESSON_IDS_BY_MODULE[moduleId]);
      expect(entry.outcomeCopyId).toBe(`a2-module-outcome-${moduleId}`);
    });
    // First module has no prerequisites; every later module's prerequisite
    // is exactly the module immediately before it in canonical order.
    expect(A2_MODULE_MANIFEST[A2_MODULE_IDS[0]].prerequisiteIds).toEqual([]);
    for (let i = 1; i < A2_MODULE_IDS.length; i++) {
      expect(A2_MODULE_MANIFEST[A2_MODULE_IDS[i]].prerequisiteIds).toEqual([
        A2_MODULE_IDS[i - 1],
      ]);
    }
  });

  it("derives A2_LESSON_MANIFEST endpoints, positions, and outcome/order ids", () => {
    expect(Object.keys(A2_LESSON_MANIFEST)).toHaveLength(60);

    const firstLessonId = A2_LESSON_IDS[0];
    const lastLessonId = A2_LESSON_IDS[A2_LESSON_IDS.length - 1];
    expect(A2_LESSON_MANIFEST[firstLessonId]).toMatchObject({
      lessonId: firstLessonId,
      moduleId: A2_MODULE_IDS[0],
      order: 1,
      position: 1,
    });
    expect(A2_LESSON_MANIFEST[lastLessonId]).toMatchObject({
      lessonId: lastLessonId,
      moduleId: A2_MODULE_IDS[A2_MODULE_IDS.length - 1],
      order: 4,
      position: 60,
    });

    for (const lessonId of A2_LESSON_IDS) {
      const entry = A2_LESSON_MANIFEST[lessonId];
      expect(entry.position).toBe(A2_CANONICAL_POSITIONS[lessonId]);
      expect(entry.contract).toBe(
        A2_MANIFEST_SPEC.moduleContracts[entry.moduleId],
      );
      expect([1, 2, 3, 4]).toContain(entry.order);
    }
  });
});

describe("A2_RELEASE_ERROR_CODES", () => {
  it("declares a non-empty, duplicate-free release error code vocabulary", () => {
    expect(A2_RELEASE_ERROR_CODES.length).toBeGreaterThan(0);
    expect(new Set(A2_RELEASE_ERROR_CODES).size).toBe(
      A2_RELEASE_ERROR_CODES.length,
    );
  });

  it("includes representative manifest, grammar-form, and kanji release codes", () => {
    expect(A2_RELEASE_ERROR_CODES).toContain("module-count");
    expect(A2_RELEASE_ERROR_CODES).toContain("lessons-per-module");
    expect(A2_RELEASE_ERROR_CODES).toContain("route-count");
    expect(A2_RELEASE_ERROR_CODES).toContain("grammar-form-missing-cando");
    expect(A2_RELEASE_ERROR_CODES).toContain("grammar-role-before-intro");
    expect(A2_RELEASE_ERROR_CODES).toContain("kanji-count");
    expect(A2_RELEASE_ERROR_CODES).toContain("kanji-distribution-sum");
  });
});

import { describe, expect, it } from "vitest";
import {
  A2_CANONICAL_POSITIONS,
  A2_LEGACY_LESSON_ALIASES,
  A2_LESSON_IDS,
  A2_LESSON_IDS_BY_MODULE,
  A2_MANIFEST_SPEC,
  A2_MODULE_IDS,
  A2_SYNTHESIS_LESSON_IDS,
  validateA2ManifestSpec,
} from "./manifest";
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
});

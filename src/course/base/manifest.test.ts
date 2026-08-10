import { describe, expect, it } from "vitest";
import type { CanDo, CheckpointDefinition } from "../foundations/types";
import {
  BASE_LESSON_IDS,
  BASE_LESSON_IDS_BY_MODULE,
  BASE_LESSON_MANIFEST,
  BASE_MANIFEST_SPEC,
  BASE_MODULE_IDS,
  BASE_MODULE_MANIFEST,
  baseCanonicalPosition,
  baseLessonManifestEntry,
  validateBaseManifestSpec,
  validateBaseManifest,
} from "./manifest";
import {
  BASE_CAN_DO_IDS,
  BASE_MODULE_CAN_DO_IDS_BY_MODULE,
  baseCanDoById,
  baseCanDos,
} from "./catalog/canDos";
import {
  BASE_CHECKPOINT_ID,
  BASE_CHECKPOINT_MIN_TRANSFER_TARGETS,
  BASE_CHECKPOINT_SCENARIO_LESSON_IDS,
  baseCheckpoint,
} from "./catalog/checkpoint";

const BASE_MODULE_ORDER = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "argument-particles",
  "time-movement",
  "copula-adjectives",
  "existence-location",
  "requests-connection",
  "base-synthesis",
] as const;

const CONTENT_LESSON_IDS = new Set([
  "topic-questions-4",
  "polite-verbs-4",
  "time-movement-4",
  "existence-location-4",
  "requests-connection-2",
]);

function fourLessons(moduleId: string): string[] {
  return [1, 2, 3, 4].map((n) => `${moduleId}-${n}`);
}

function assertFrozenArray(value: readonly unknown[]): void {
  expect(Object.isFrozen(value)).toBe(true);
}

function mutableBaseManifestSpec() {
  return {
    moduleIds: [...BASE_MANIFEST_SPEC.moduleIds],
    lessonIdsByModule: Object.fromEntries(
      Object.entries(BASE_MANIFEST_SPEC.lessonIdsByModule).map(([moduleId, lessonIds]) => [
        moduleId,
        [...lessonIds],
      ]),
    ),
    modulePrerequisites: Object.fromEntries(
      Object.entries(BASE_MANIFEST_SPEC.modulePrerequisites).map(([moduleId, prerequisiteIds]) => [
        moduleId,
        [...prerequisiteIds],
      ]),
    ),
    lessonContracts: { ...BASE_MANIFEST_SPEC.lessonContracts },
  };
}

describe("Base manifest", () => {
  it("locks the exact 10-module / 40-lesson order", () => {
    expect(BASE_MODULE_IDS).toEqual(BASE_MODULE_ORDER);
    expect(BASE_MODULE_IDS).toHaveLength(10);

    const expectedLessonIds = BASE_MODULE_ORDER.flatMap(fourLessons);
    expect(BASE_LESSON_IDS).toEqual(expectedLessonIds);
    expect(BASE_LESSON_IDS).toHaveLength(40);

    for (const moduleId of BASE_MODULE_ORDER) {
      expect(BASE_LESSON_IDS_BY_MODULE[moduleId]).toEqual(fourLessons(moduleId));
    }
    expect(Object.keys(BASE_LESSON_MANIFEST)).toEqual(expectedLessonIds);
    expect(Object.keys(BASE_MODULE_MANIFEST)).toEqual([...BASE_MODULE_ORDER]);
  });

  it("assigns the exact phonetic, content, system, and synthesis contracts", () => {
    const contractCounts = new Map<string, number>();
    for (const lessonId of BASE_LESSON_IDS) {
      const entry = BASE_LESSON_MANIFEST[lessonId];
      contractCounts.set(entry.contract, (contractCounts.get(entry.contract) ?? 0) + 1);

      if (lessonId.startsWith("sounds-")) {
        expect(entry.contract).toBe("phonetic");
      } else if (lessonId.startsWith("base-synthesis-")) {
        expect(entry.contract).toBe("synthesis");
      } else if (CONTENT_LESSON_IDS.has(lessonId)) {
        expect(entry.contract).toBe("content");
      } else {
        expect(entry.contract).toBe("system");
      }
    }

    expect(Object.fromEntries(contractCounts)).toEqual({
      phonetic: 4,
      system: 27,
      content: 5,
      synthesis: 4,
    });
  });

  it("keeps lesson contracts only on lesson manifest entries", () => {
    expect(BASE_LESSON_MANIFEST["topic-questions-4"].contract).toBe("content");
    expect(BASE_LESSON_MANIFEST["topic-questions-1"].contract).toBe("system");
    expect(BASE_MODULE_MANIFEST["topic-questions"]).not.toHaveProperty("contract");
  });

  it("resolves only canonical lesson IDs through prototype-safe lookups", () => {
    expect(baseLessonManifestEntry("sounds-1")?.contract).toBe("phonetic");
    expect(baseCanonicalPosition("sounds-1")).toBe(1);

    for (const id of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(baseLessonManifestEntry(id)).toBeNull();
      expect(baseCanonicalPosition(id)).toBeNull();
    }
  });

  it("deep-freezes all exported manifest arrays, maps, entries, and nested arrays", () => {
    assertFrozenArray(BASE_MODULE_IDS);
    assertFrozenArray(BASE_LESSON_IDS);
    expect(Object.isFrozen(BASE_MANIFEST_SPEC)).toBe(true);
    expect(Object.isFrozen(BASE_LESSON_IDS_BY_MODULE)).toBe(true);
    expect(Object.isFrozen(BASE_LESSON_MANIFEST)).toBe(true);
    expect(Object.isFrozen(BASE_MODULE_MANIFEST)).toBe(true);

    for (const moduleId of BASE_MODULE_IDS) {
      assertFrozenArray(BASE_LESSON_IDS_BY_MODULE[moduleId]);
      expect(Object.isFrozen(BASE_MODULE_MANIFEST[moduleId])).toBe(true);
      assertFrozenArray(BASE_MODULE_MANIFEST[moduleId].lessonIds);
      assertFrozenArray(BASE_MODULE_MANIFEST[moduleId].prerequisiteIds);
    }
    for (const lessonId of BASE_LESSON_IDS) {
      expect(Object.isFrozen(BASE_LESSON_MANIFEST[lessonId])).toBe(true);
    }
  });

  it("uses a linear previous-module prerequisite chain", () => {
    expect(BASE_MODULE_MANIFEST[BASE_MODULE_ORDER[0]].prerequisiteIds).toEqual([]);
    for (let index = 1; index < BASE_MODULE_ORDER.length; index += 1) {
      expect(BASE_MODULE_MANIFEST[BASE_MODULE_ORDER[index]].prerequisiteIds).toEqual([
        BASE_MODULE_ORDER[index - 1],
      ]);
    }
    expect(validateBaseManifest()).toEqual({ ok: true });
  });

  it("rejects a lesson contract that does not match the fixed Base classification", () => {
    const spec = mutableBaseManifestSpec();
    spec.lessonContracts["sounds-1"] = "system";

    const result = validateBaseManifestSpec(spec);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "lesson-contract-classification",
            message: expect.stringContaining('"sounds-1"'),
          }),
        ]),
      );
    }
  });

  it("rejects a missing modulePrerequisites record instead of treating it as an empty list", () => {
    const spec = mutableBaseManifestSpec();
    delete spec.modulePrerequisites.sounds;

    const result = validateBaseManifestSpec(spec);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "missing-prerequisite-record",
            message: expect.stringContaining('"sounds"'),
          }),
        ]),
      );
    }
  });

  it("fails closed when a manifest spec supplies a prototype-named module ID", () => {
    const spec = mutableBaseManifestSpec();
    (spec as unknown as { moduleIds: string[] }).moduleIds = ["constructor"];

    expect(() => validateBaseManifestSpec(spec)).not.toThrow();
    expect(validateBaseManifestSpec(spec).ok).toBe(false);
  });
});

describe("Base Can-dos and checkpoint", () => {
  it("defines exactly one a0 Can-do per Base module with stable IDs and four lessons each", () => {
    const expectedCanDoIds = [
      "a1-can-do-sounds",
      "a1-can-do-sentence-foundations",
      "a1-can-do-topic-questions",
      "a1-can-do-polite-verbs",
      "base-can-do-argument-particles",
      "a1-can-do-time-movement",
      "base-can-do-copula-adjectives",
      "base-can-do-existence-location",
      "base-can-do-requests-connection",
      "base-can-do-synthesis",
    ];

    expect(BASE_CAN_DO_IDS).toEqual(expectedCanDoIds);
    expect(baseCanDos).toHaveLength(10);
    expect(BASE_MODULE_CAN_DO_IDS_BY_MODULE).toEqual(
      Object.fromEntries(BASE_MODULE_ORDER.map((moduleId, index) => [moduleId, [expectedCanDoIds[index]]])),
    );

    for (const [index, canDo] of baseCanDos.entries()) {
      const moduleId = BASE_MODULE_ORDER[index];
      expect(canDo).toMatchObject<Partial<CanDo>>({
        id: expectedCanDoIds[index],
        level: "a0",
        descriptorCopyId: `${expectedCanDoIds[index]}-descriptor`,
        lessonIds: fourLessons(moduleId),
        sourceNote: "product-authored-jf-cefr-aligned",
      });
      expect(canDo.contextIds).toEqual([]);
      expect(canDo.checkpointEvidenceRule).toEqual({
        evidenceKind: "checkpoint-sampled",
        minAcceptedTransferTargets: 2,
      });
      expect(baseCanDoById.get(canDo.id)).toBe(canDo);
    }
  });

  it("exposes Base Can-do lookup data through an immutable runtime view", () => {
    const first = baseCanDos[0];
    const mutable = baseCanDoById as unknown as {
      clear?: () => void;
      delete?: (id: string) => boolean;
      set?: (id: string, value: CanDo) => unknown;
    };

    mutable.clear?.();
    mutable.delete?.(first.id);
    mutable.set?.("mutated-can-do", { ...first, id: "mutated-can-do" });

    expect("clear" in baseCanDoById).toBe(false);
    expect("delete" in baseCanDoById).toBe(false);
    expect("set" in baseCanDoById).toBe(false);
    expect(baseCanDoById.size).toBe(baseCanDos.length);
    expect(baseCanDoById.get(first.id)).toBe(first);
    expect([...baseCanDoById.keys()]).toEqual(BASE_CAN_DO_IDS);
  });

  it("defines the Base checkpoint over synthesis scenarios and all system-reference families", () => {
    expect(BASE_CHECKPOINT_ID).toBe("base-checkpoint-1");
    expect(BASE_CHECKPOINT_MIN_TRANSFER_TARGETS).toBeGreaterThan(0);
    expect(BASE_CHECKPOINT_SCENARIO_LESSON_IDS).toEqual(fourLessons("base-synthesis"));
    expect(baseCheckpoint).toMatchObject<Partial<CheckpointDefinition>>({
      id: "base-checkpoint-1",
      level: "a0",
      sampledCanDoIds: [...BASE_CAN_DO_IDS],
      minAcceptedTransferTargetsPerCanDo: BASE_CHECKPOINT_MIN_TRANSFER_TARGETS,
    });

    expect(baseCheckpoint.sampledCanDoIds).toEqual(BASE_CAN_DO_IDS);
    expect(baseCheckpoint.sampledCanDoIds).toEqual(
      expect.arrayContaining([
        "a1-can-do-sentence-foundations",
        "base-can-do-argument-particles",
        "a1-can-do-polite-verbs",
        "base-can-do-copula-adjectives",
        "base-can-do-existence-location",
      ]),
    );
  });
});

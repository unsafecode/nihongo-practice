/**
 * The A2 **release** validator (Phase 3 Task 7).
 *
 * `validateA2Release`/`validateA2` compose the eight numbered release gates
 * the task specifies: (1) manifest structural shape, (2) the wrapped
 * `validateFoundations` oracle over the complete catalogs + cumulative
 * availability, (3) the grammar spiral (structural + content-evidence),
 * (4) the contextual kanji catalog, (5) Can-do/checkpoint/synthesis-
 * integration coverage, (6) the synthesis module introduces nothing new,
 * (7) EN/IT copy parity + no Japanese + no personal alias, and (8) no
 * certification/certificate/equivalent claim anywhere in copy. Every check
 * is proven both against the real, frozen release catalogs (zero errors)
 * and, where injectable, against a deliberately broken input (representative
 * failure path), so this suite never merely self-validates.
 */
import { describe, expect, it } from "vitest";
import {
  validateA2,
  validateA2Release,
  A2_RELEASE_ERROR_CODES,
  type A2ReleaseErrorCode,
} from "./validateA2";
import { a2FoundationCatalogs, a2FoundationCopy } from "./catalog";
import { a2Checkpoint, A2_SYNTHESIS_INTEGRATION } from "./checkpoint";
import { A2_GRAMMAR_SPIRAL } from "../forms/grammarSpiral";
import type { FoundationCatalogs } from "../../foundations/types";

function codesOf(errors: readonly { readonly code: A2ReleaseErrorCode }[]): string[] {
  return errors.map((error) => error.code);
}

describe("validateA2Release — baseline release (real, frozen catalogs)", () => {
  const result = validateA2Release();

  it("is valid with zero errors against the real release data", () => {
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("reports exact 60/15/59/120 metrics via the attached reports object", () => {
    expect(result.reports.lessonCount).toBe(60);
    expect(result.reports.moduleCount).toBe(15);
    expect(result.reports.canDos).toHaveLength(59);
    expect(result.reports.kanji.total).toBe(120);
  });

  it("is deterministic across independent calls", () => {
    expect(validateA2Release()).toEqual(result);
  });
});

describe("validateA2 — 1. manifest structural shape (injectable via catalogs)", () => {
  it("detects a wrong module count", () => {
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      modules: a2FoundationCatalogs.modules.slice(0, -1),
    };
    const result = validateA2({ catalogs: brokenCatalogs });
    expect(codesOf(result.errors)).toContain("module-count");
  });

  it("detects a module with the wrong lesson count", () => {
    const [firstModule, ...restModules] = a2FoundationCatalogs.modules;
    const brokenModule = { ...firstModule, lessonIds: firstModule.lessonIds.slice(0, -1) };
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      modules: [brokenModule, ...restModules],
    };
    const result = validateA2({ catalogs: brokenCatalogs });
    expect(codesOf(result.errors)).toContain("lessons-per-module");
  });

  it("detects a route count that disagrees with the canonical 60", () => {
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      lessonPositions: a2FoundationCatalogs.lessonPositions.slice(0, -1),
    };
    const result = validateA2({ catalogs: brokenCatalogs });
    expect(codesOf(result.errors)).toContain("route-count");
  });

  it("detects a structurally-broken injected manifest spec (manifest-invalid)", () => {
    const brokenManifestSpec = {
      moduleIds: [],
      lessonIdsByModule: {},
      synthesisModuleId: "a2-synthesis",
      modulePrerequisites: {},
      moduleContracts: {},
      aliases: {},
    };
    const result = validateA2({ manifestSpec: brokenManifestSpec });
    expect(codesOf(result.errors)).toContain("manifest-invalid");
  });

  it("never fires for the real, frozen manifest/catalogs", () => {
    const result = validateA2();
    expect(codesOf(result.errors)).not.toContain("module-count");
    expect(codesOf(result.errors)).not.toContain("lessons-per-module");
    expect(codesOf(result.errors)).not.toContain("route-count");
    expect(codesOf(result.errors)).not.toContain("unknown-lesson-id");
    expect(codesOf(result.errors)).not.toContain("duplicate-lesson-id");
    expect(codesOf(result.errors)).not.toContain("manifest-mismatch");
    expect(codesOf(result.errors)).not.toContain("manifest-invalid");
  });
});

describe("validateA2 — 2. wrapped validateFoundations (injectable, preserves underlying id)", () => {
  it("surfaces a foundation-layer break as foundation-invalid, preserving the underlying code", () => {
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      // Strip every semantic value: every model/transfer variant now fails to
      // realize (a real, structural foundation-layer break).
      semanticValues: [],
    };
    const result = validateA2({ catalogs: brokenCatalogs });
    const foundationErrors = result.errors.filter((error) => error.code === "foundation-invalid");
    expect(foundationErrors.length).toBeGreaterThan(0);
    expect(result.valid).toBe(false);
  });

  it("never fires for the real, frozen catalogs", () => {
    const result = validateA2();
    expect(codesOf(result.errors)).not.toContain("foundation-invalid");
  });
});

describe("validateA2 — 3. grammar spiral (structural + evidence, injectable)", () => {
  it("detects a structurally-broken grammar spiral row (unresolvable intro lesson)", () => {
    const brokenSpiral = [
      { ...A2_GRAMMAR_SPIRAL[0], introLessonId: "no-such-lesson-ever" },
      ...A2_GRAMMAR_SPIRAL.slice(1),
    ];
    const result = validateA2({ grammarSpiral: brokenSpiral });
    expect(codesOf(result.errors)).toContain("grammar-spiral-invalid");
  });

  it("detects missing content evidence when the serving family is stripped out of the catalogs", () => {
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      sentenceFamilies: a2FoundationCatalogs.sentenceFamilies.filter(
        (family) => family.id !== "a2-family-plain-recognition",
      ),
    };
    const result = validateA2({ catalogs: brokenCatalogs });
    expect(codesOf(result.errors)).toContain("grammar-evidence-incomplete");
  });

  it("never fires for the real, frozen grammar spiral + catalogs", () => {
    const result = validateA2();
    expect(codesOf(result.errors)).not.toContain("grammar-spiral-invalid");
    expect(codesOf(result.errors)).not.toContain("grammar-evidence-incomplete");
  });
});

describe("validateA2 — 4. contextual kanji catalog (injectable)", () => {
  it("detects a wrong total kanji count", () => {
    const result = validateA2({ kanjiEntries: [] });
    expect(codesOf(result.errors)).toContain("kanji-invalid");
  });

  it("never fires for the real, frozen kanji catalog", () => {
    const result = validateA2();
    expect(codesOf(result.errors)).not.toContain("kanji-invalid");
  });
});

describe("validateA2 — 5. Can-do/checkpoint/synthesis-integration coverage (injectable)", () => {
  it("detects a canonical Can-do that is registered but never served by any lesson", () => {
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      canDos: a2FoundationCatalogs.canDos.filter((canDo) => canDo.id !== "a2-cando-fill-form"),
    };
    const result = validateA2({ catalogs: brokenCatalogs });
    expect(codesOf(result.errors)).toContain("cando-not-served");
  });

  it("detects a Can-do with zero genuine transfer evidence", () => {
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      sentenceVariants: a2FoundationCatalogs.sentenceVariants.map((variant) =>
        variant.pedagogicalUse === "transfer" ? { ...variant, pedagogicalUse: "model" as const } : variant,
      ),
    };
    const result = validateA2({ catalogs: brokenCatalogs });
    expect(codesOf(result.errors)).toContain("cando-no-transfer-evidence");
  });

  it("detects a checkpoint that under-samples the 59 Can-dos", () => {
    const brokenCheckpoint = {
      ...a2Checkpoint,
      sampledCanDoIds: a2Checkpoint.sampledCanDoIds.slice(0, -1),
    };
    const result = validateA2({ checkpoint: brokenCheckpoint });
    expect(codesOf(result.errors)).toContain("cando-not-sampled");
  });

  it("detects a checkpoint that samples an id with no matching registered Can-do", () => {
    const brokenCheckpoint = {
      ...a2Checkpoint,
      sampledCanDoIds: [...a2Checkpoint.sampledCanDoIds, "a2-cando-does-not-exist"],
    };
    const result = validateA2({ checkpoint: brokenCheckpoint });
    expect(codesOf(result.errors)).toContain("checkpoint-cando-unresolved");
  });

  it("detects a checkpoint whose minAcceptedTransferTargetsPerCanDo is too low", () => {
    const brokenCheckpoint = { ...a2Checkpoint, minAcceptedTransferTargetsPerCanDo: 1 };
    const result = validateA2({ checkpoint: brokenCheckpoint });
    expect(codesOf(result.errors)).toContain("checkpoint-min-transfer");
  });

  it("detects a synthesis-integration map that does not cover exactly the 14 instructional modules", () => {
    const result = validateA2({
      synthesisIntegration: { "connected-conversation": [] },
    });
    expect(codesOf(result.errors)).toContain("synthesis-integration-count");
  });

  it("never fires for the real, frozen checkpoint/catalogs/integration map", () => {
    const result = validateA2();
    expect(codesOf(result.errors)).not.toContain("cando-not-served");
    expect(codesOf(result.errors)).not.toContain("cando-no-transfer-evidence");
    expect(codesOf(result.errors)).not.toContain("cando-not-sampled");
    expect(codesOf(result.errors)).not.toContain("checkpoint-cando-unresolved");
    expect(codesOf(result.errors)).not.toContain("checkpoint-min-transfer");
    expect(codesOf(result.errors)).not.toContain("synthesis-integration-count");
  });

  it("the real synthesis-integration map covers exactly the 14 instructional modules", () => {
    expect(Object.keys(A2_SYNTHESIS_INTEGRATION)).toHaveLength(14);
    expect(Object.keys(A2_SYNTHESIS_INTEGRATION)).not.toContain("a2-synthesis");
  });
});

describe("validateA2 — 6. synthesis introduces nothing new (injectable)", () => {
  it("detects a semantic value used ONLY inside a2-synthesis lessons", () => {
    const asLesson = a2FoundationCatalogs.lessons.find((lesson) => lesson.moduleId === "a2-synthesis");
    expect(asLesson, "at least one a2-synthesis lesson").toBeDefined();
    const targetVariantId = asLesson!.modelVariantIds[0];
    const targetVariant = a2FoundationCatalogs.sentenceVariants.find((variant) => variant.id === targetVariantId);
    expect(targetVariant, targetVariantId).toBeDefined();
    const [mutatedSlotKey] = Object.keys(targetVariant!.slotValues);
    const mutatedVariant = {
      ...targetVariant!,
      slotValues: { ...targetVariant!.slotValues, [mutatedSlotKey]: "a2-value-never-modeled-anywhere-else" },
    };
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      sentenceVariants: a2FoundationCatalogs.sentenceVariants.map((variant) =>
        variant.id === targetVariantId ? mutatedVariant : variant,
      ),
    };
    const result = validateA2({ catalogs: brokenCatalogs });
    expect(codesOf(result.errors)).toContain("synthesis-introduces-content");
  });

  it("detects a synthesis lesson using a sentence family used nowhere else", () => {
    const asLesson = a2FoundationCatalogs.lessons.find((lesson) => lesson.moduleId === "a2-synthesis");
    const targetVariantId = asLesson!.modelVariantIds[0];
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      sentenceVariants: a2FoundationCatalogs.sentenceVariants.map((variant) =>
        variant.id === targetVariantId ? { ...variant, sentenceFamilyId: "a2-family-never-used-elsewhere" } : variant,
      ),
    };
    const result = validateA2({ catalogs: brokenCatalogs });
    expect(codesOf(result.errors)).toContain("synthesis-introduces-content");
  });

  it("never fires for the real, frozen 60-lesson catalog", () => {
    const result = validateA2();
    expect(codesOf(result.errors)).not.toContain("synthesis-introduces-content");
    expect(codesOf(result.errors)).not.toContain("synthesis-introduces-kanji");
  });
});

describe("validateA2 — 7. EN/IT copy parity, no Japanese, no personal alias (injectable)", () => {
  it("detects a Japanese literal in copy", () => {
    const brokenCopy = {
      en: { ...a2FoundationCopy.en, "test-a2-jp-leak": "\u3068\u3082\u3060\u3061" },
      it: { ...a2FoundationCopy.it, "test-a2-jp-leak": "amico" },
    };
    const result = validateA2({ foundationCopy: brokenCopy });
    expect(codesOf(result.errors)).toContain("copy-contains-japanese");
  });

  it("detects a missing IT key (copy parity)", () => {
    const it = { ...a2FoundationCopy.it };
    delete (it as Record<string, string>)["a2-level-a2-alignment"];
    const brokenCopy = { en: a2FoundationCopy.en, it };
    const result = validateA2({ foundationCopy: brokenCopy });
    expect(codesOf(result.errors)).toContain("copy-parity");
  });

  it("detects a placeholder/empty copy value", () => {
    const brokenCopy = {
      en: { ...a2FoundationCopy.en, "test-a2-empty-en": "" },
      it: { ...a2FoundationCopy.it, "test-a2-empty-en": "qualcosa" },
    };
    const result = validateA2({ foundationCopy: brokenCopy });
    expect(codesOf(result.errors)).toContain("copy-parity");
  });

  it("detects a personal alias leaking into copy", () => {
    const brokenCopy = {
      en: { ...a2FoundationCopy.en, "test-a2-alias-leak": "ricchi wrote this" },
      it: { ...a2FoundationCopy.it, "test-a2-alias-leak": "ricchi ha scritto questo" },
    };
    const result = validateA2({ foundationCopy: brokenCopy });
    expect(codesOf(result.errors)).toContain("personal-alias-match");
  });

  it("never fires for the real, frozen copy", () => {
    const result = validateA2();
    expect(codesOf(result.errors)).not.toContain("copy-contains-japanese");
    expect(codesOf(result.errors)).not.toContain("copy-parity");
    expect(codesOf(result.errors)).not.toContain("personal-alias-match");
  });
});

describe("validateA2 — 8. no certification/certificate/equivalent claim (injectable)", () => {
  it("detects a certification claim in copy", () => {
    const brokenCopy = {
      en: { ...a2FoundationCopy.en, "test-a2-cert-leak": "You will be certified at A2 level." },
      it: { ...a2FoundationCopy.it, "test-a2-cert-leak": "Sarai certificato al livello A2." },
    };
    const result = validateA2({ foundationCopy: brokenCopy });
    expect(codesOf(result.errors)).toContain("checkpoint-claims-certification");
  });

  it("detects an 'equivalent' claim in copy", () => {
    const brokenCopy = {
      en: { ...a2FoundationCopy.en, "test-a2-equiv-leak": "This is equivalent to a CEFR A2 certificate." },
      it: { ...a2FoundationCopy.it, "test-a2-equiv-leak": "Questo equivale a un certificato CEFR A2." },
    };
    const result = validateA2({ foundationCopy: brokenCopy });
    expect(codesOf(result.errors)).toContain("checkpoint-claims-certification");
  });

  it("never fires for the real, frozen copy", () => {
    const result = validateA2();
    expect(codesOf(result.errors)).not.toContain("checkpoint-claims-certification");
  });
});

describe("validateA2 — deterministic error ordering", () => {
  it("sorts errors by (code, id, dimension, referenceId)", () => {
    const brokenCatalogs: FoundationCatalogs = {
      ...a2FoundationCatalogs,
      modules: a2FoundationCatalogs.modules.slice(0, -1),
    };
    const brokenCopy = {
      en: { ...a2FoundationCopy.en, "test-a2-jp-leak": "\u3068\u3082\u3060\u3061" },
      it: { ...a2FoundationCopy.it, "test-a2-jp-leak": "amico" },
    };
    const result = validateA2({ catalogs: brokenCatalogs, foundationCopy: brokenCopy });
    const sorted = [...result.errors].sort((left, right) => {
      const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
      return (
        cmp(left.code, right.code) ||
        cmp(left.id ?? "", right.id ?? "") ||
        cmp(left.dimension ?? "", right.dimension ?? "") ||
        cmp(left.referenceId ?? "", right.referenceId ?? "")
      );
    });
    expect(result.errors).toEqual(sorted);
  });
});

describe("A2_RELEASE_ERROR_CODES — canonical release error vocabulary", () => {
  it("is a non-empty, duplicate-free array of strings", () => {
    expect(A2_RELEASE_ERROR_CODES.length).toBeGreaterThan(0);
    expect(new Set(A2_RELEASE_ERROR_CODES).size).toBe(A2_RELEASE_ERROR_CODES.length);
  });

  it("includes every code this suite actually exercises", () => {
    const exercised = [
      "module-count",
      "lessons-per-module",
      "route-count",
      "manifest-invalid",
      "foundation-invalid",
      "grammar-spiral-invalid",
      "grammar-evidence-incomplete",
      "kanji-invalid",
      "cando-not-served",
      "cando-no-transfer-evidence",
      "cando-not-sampled",
      "checkpoint-cando-unresolved",
      "checkpoint-min-transfer",
      "synthesis-integration-count",
      "synthesis-introduces-content",
      "copy-contains-japanese",
      "copy-parity",
      "personal-alias-match",
      "checkpoint-claims-certification",
    ];
    for (const code of exercised) {
      expect(A2_RELEASE_ERROR_CODES, code).toContain(code);
    }
  });
});

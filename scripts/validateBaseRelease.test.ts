import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The official Base prebuild release gate — `scripts/validateBaseRelease.ts`,
 * the first entry in the npm `prebuild` chain, so it always runs before
 * `vite build` both locally and in the Pages workflow.
 *
 * Two branches are proved here:
 *
 *  - a content-valid release exits cleanly and prints one compact summary
 *    line built entirely from *measured* report values; and
 *  - an invalid one refuses the build (non-zero exit) and prints every
 *    structured error, never swallowing or downgrading them.
 *
 * The third case is the honest one this task turns on: the naturalness ledger
 * and the human-ear audio sign-off are legitimately still `pending` while
 * external review runs in parallel. Unresolved external acceptance is
 * reported as a finding *count* and must not fail the build; only a *stale*
 * review (content changed after it was reviewed) is a hard error.
 */

const VALIDATE_BASE_MODULE_PATH = "../src/course/base/validateBase";

function report(overrides: Record<string, unknown> = {}) {
  return {
    modules: 10,
    lessons: 40,
    lexemes: 231,
    examples: 214,
    dialogueTurns: 96,
    activities: 288,
    categories: { "meaning-comprehension": 40, ordering: 36 },
    contracts: { phonetic: 4, content: 20, system: 12, synthesis: 4 },
    patternCells: 57,
    references: 5,
    referenceEntries: 41,
    audioReviews: 120,
    reviewedAudio: 0,
    pendingAudioReviews: 120,
    naturalnessReviews: 900,
    pendingNaturalnessReviews: 900,
    unresolvedFindings: 1020,
    a1Modules: 11,
    a1Lessons: 44,
    a2Lessons: 60,
    byLesson: [],
    ...overrides,
  };
}

describe("scripts/validateBaseRelease — the Base prebuild release gate", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let exitCode: number | undefined;

  beforeEach(() => {
    exitCode = undefined;
    exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("exits cleanly and prints the measured summary when the release is valid", async () => {
    vi.doMock(VALIDATE_BASE_MODULE_PATH, () => ({
      buildBaseReleaseInput: () => ({}),
      validateBaseRelease: () => ({ valid: true, errors: [], report: report() }),
    }));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("./validateBaseRelease");

    expect(exitSpy).not.toHaveBeenCalled();
    expect(exitCode).toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join(" ");
    expect(output).toContain("validateBaseRelease: OK (errors=0;");
    expect(output).toContain("modules=10");
    expect(output).toContain("lessons=40");
    expect(output).toContain("lexemes=231");
    expect(output).toContain("examples=214");
    expect(output).toContain("dialogueTurns=96");
    expect(output).toContain("activities=288");
    expect(output).toContain("categories=meaning-comprehension=40, ordering=36");
    expect(output).toContain("patternCells=57");
    expect(output).toContain("references=41");
    expect(output).toContain("reviewedAudio=0");
    expect(output).toContain("naturalnessAccepted=0");
    expect(output).toContain("pendingNaturalness=900");
    expect(output).toContain("pendingAudio=120");
    expect(output).toContain("unresolved=1020");
  });

  it("does not fail the build merely because external review acceptance is still pending", async () => {
    vi.doMock(VALIDATE_BASE_MODULE_PATH, () => ({
      buildBaseReleaseInput: () => ({}),
      validateBaseRelease: () => ({
        valid: true,
        errors: [],
        report: report({ unresolvedFindings: 1020 }),
      }),
    }));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await import("./validateBaseRelease");

    expect(exitSpy).not.toHaveBeenCalled();
    const warned = warnSpy.mock.calls.flat().join(" ");
    // Reported, explicitly, as an unresolved external finding — never
    // silently upgraded into an acceptance, never a fabricated pass.
    expect(warned).toContain("1020");
    expect(warned).toContain("900 naturalness");
    expect(warned).toContain("120 canonical audio");
    expect(warned).toMatch(/pending external review/i);
    expect(logSpy.mock.calls.flat().join(" ")).toContain("unresolved=1020");
  });

  it("refuses the build and prints every structured error when the release is invalid", async () => {
    vi.doMock(VALIDATE_BASE_MODULE_PATH, () => ({
      buildBaseReleaseInput: () => ({}),
      validateBaseRelease: () => ({
        valid: false,
        report: report(),
        errors: [
          { code: "naturalness-review-stale", contentId: "example:tm3-ex-1", lessonId: "time-movement-3" },
          { code: "audio-review-stale", contentId: "asset:snd2-ji", detail: "sha256" },
          { code: "pattern-cell-missing", lessonId: "polite-verbs-4", referenceId: "masu-nonpast" },
        ],
      }),
    }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("./validateBaseRelease")).rejects.toThrow("process.exit(1)");

    expect(exitCode).toBe(1);
    const allErrorText = errorSpy.mock.calls.flat().join(" ");
    expect(allErrorText).toContain("3 release error(s)");
    expect(allErrorText).toContain("naturalness-review-stale");
    expect(allErrorText).toContain("contentId=example:tm3-ex-1");
    expect(allErrorText).toContain("lesson=time-movement-3");
    expect(allErrorText).toContain("audio-review-stale");
    expect(allErrorText).toContain("detail=sha256");
    expect(allErrorText).toContain("pattern-cell-missing");
    expect(allErrorText).toContain("ref=masu-nonpast");
  });
});

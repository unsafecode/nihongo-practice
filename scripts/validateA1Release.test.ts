import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The official prebuild content-validation gate (Phase 2 Task 6, finding
 * I3): `scripts/validateA1Release.ts`, wired as the npm `prebuild` script, so
 * it always runs before `vite build` — both locally and in the Pages
 * workflow (`.github/workflows/deploy-pages.yml`'s `npm run build` step) —
 * and is the one place the full, content-cross-referencing
 * `validateA1Release()` release gate still runs against a release build,
 * now that the production runtime (`src/course/data/course.ts`) only calls
 * the small, always-bundled `assertA1CourseShape()` structural check
 * instead (see `runtimeShapeAssertion.test.ts` and `prodBundle.test.ts`).
 *
 * This proves the script's own two branches genuinely fail-closed: a valid
 * catalog exits cleanly, and — this is the case that matters for the I3
 * guarantee — an invalid one exits non-zero (refusing the build) and prints
 * every structured error, never swallowing or silently downgrading them.
 */

const VALIDATE_A1_MODULE_PATH = "../src/course/a1/catalog/validateA1";

describe("scripts/validateA1Release — the prebuild content-validation gate (I3)", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let exitCode: number | undefined;

  beforeEach(() => {
    exitCode = undefined;
    exitSpy = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      exitCode = code;
      // A real `process.exit` never returns — throwing here stops the
      // script's remaining top-level statements from running, the same as
      // a genuine exit would, without actually killing the test process.
      throw new Error(`process.exit(${code})`);
    }) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("exits cleanly and prints the compact canonical area/module/lesson summary when validateA1Release() reports valid", async () => {
    vi.doMock(VALIDATE_A1_MODULE_PATH, () => ({
      validateA1Release: () => ({
        valid: true,
        errors: [],
        foundationReport: {},
        curriculumReport: {
          reports: {
            byLesson: Array.from({ length: 64 }, (_, index) => ({ lessonId: `lesson-${index}` })),
            practiceFunctionDistribution: {
              "meaning-comprehension": 64,
              "listening-speaking": 64,
            },
          },
        },
      }),
    }));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("./validateA1Release");

    expect(exitSpy).not.toHaveBeenCalled();
    expect(exitCode).toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join(" ")).toMatch(/OK/);
    const output = logSpy.mock.calls.flat().join(" ");
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(output.length).toBeLessThan(500);
    expect(output).toMatch(/areas=4/);
    expect(output).toMatch(/modules=16/);
    expect(output).toMatch(/lessons=64/);
    expect(output).toMatch(/semantic=60/);
    expect(output).toMatch(/phonetic=4/);
    expect(output).toMatch(/capstones=4/);
    expect(output).toMatch(/meaning-comprehension=64/);
  });

  it("refuses the build — exits non-zero and prints every structured error — when validateA1Release() reports invalid", async () => {
    vi.doMock(VALIDATE_A1_MODULE_PATH, () => ({
      validateA1Release: () => ({
        valid: false,
        errors: [
          { code: "manifest-invalid", id: "sounds-1", dimension: "structure" },
          {
            code: "invalid-section-order",
            lessonId: "introductions-1",
            stage: "sections",
            referenceId: "rule,vocabulary,grammar,comparison,explore,recap",
          },
          {
            code: "area-copy-parity",
            id: "sounds",
            referenceId: "a1-area-sounds-title",
            dimension: "en:title",
            underlyingCode: "missing-en-area-title",
          },
        ],
        foundationReport: {},
      }),
    }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("./validateA1Release")).rejects.toThrow("process.exit(1)");

    expect(exitCode).toBe(1);
    const allErrorText = errorSpy.mock.calls.flat().join(" ");
    expect(allErrorText).toContain("manifest-invalid");
    expect(allErrorText).toContain("sounds-1");
    expect(allErrorText).toContain("invalid-section-order");
    expect(allErrorText).toContain("lesson=introductions-1");
    expect(allErrorText).toContain("stage=sections");
    expect(allErrorText).toContain("area-copy-parity");
    expect(allErrorText).toContain("underlying=missing-en-area-title");
  });
});

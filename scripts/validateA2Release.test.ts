import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The official A2 prebuild content-validation gate (Phase 3 Task 7):
 * `scripts/validateA2Release.ts`, wired as the second stage of the npm
 * `prebuild` chain (`validateA1Release.ts && validateA2Release.ts &&
 * lintA2NoJapanese.ts`), so it always runs before `vite build` — both
 * locally and in the Pages workflow — mirroring
 * `validateA1Release.test.ts`'s own proof exactly: the script's two
 * branches genuinely fail-closed, a valid catalog exits cleanly, and an
 * invalid one exits non-zero (refusing the build) and prints every
 * structured error, never swallowing or silently downgrading them.
 */

const VALIDATE_A2_MODULE_PATH = "../src/course/a2/catalog/validateA2";

describe("scripts/validateA2Release — the A2 prebuild content-validation gate", () => {
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
    vi.doUnmock(VALIDATE_A2_MODULE_PATH);
    vi.resetModules();
  });

  it("the real script reports valid with zero errors against the actual frozen A2 release catalogs", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("./validateA2Release");

    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join(" ")).toMatch(/OK/);
  });

  it("exits cleanly and prints an OK message with exact 60/15/59/120 metrics when validateA2Release() reports valid", async () => {
    vi.doMock(VALIDATE_A2_MODULE_PATH, () => ({
      validateA2Release: () => ({
        valid: true,
        errors: [],
        reports: { lessonCount: 60, moduleCount: 15, canDos: new Array(59).fill(0), kanji: { total: 120 } },
      }),
    }));
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("./validateA2Release");

    expect(exitSpy).not.toHaveBeenCalled();
    expect(exitCode).toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();
    const allLogText = logSpy.mock.calls.flat().join(" ");
    expect(allLogText).toMatch(/OK/);
    expect(allLogText).toMatch(/60/);
    expect(allLogText).toMatch(/15/);
    expect(allLogText).toMatch(/59/);
    expect(allLogText).toMatch(/120/);
    expect(allLogText).toMatch(/0 errors/);
  });

  it("refuses the build — exits non-zero and prints every structured error — when validateA2Release() reports invalid", async () => {
    vi.doMock(VALIDATE_A2_MODULE_PATH, () => ({
      validateA2Release: () => ({
        valid: false,
        errors: [
          { code: "manifest-invalid", id: "relationships-events-1", dimension: "structure" },
          { code: "cando-not-served", id: "a2-cando-fill-form", underlyingCode: "missing-lesson" },
        ],
        reports: { lessonCount: 60, moduleCount: 15, canDos: [], kanji: { total: 120 } },
      }),
    }));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("./validateA2Release")).rejects.toThrow("process.exit(1)");

    expect(exitCode).toBe(1);
    const allErrorText = errorSpy.mock.calls.flat().join(" ");
    expect(allErrorText).toContain("manifest-invalid");
    expect(allErrorText).toContain("relationships-events-1");
    expect(allErrorText).toContain("cando-not-served");
    expect(allErrorText).toContain("a2-cando-fill-form");
    expect(allErrorText).toContain("missing-lesson");
  });
});

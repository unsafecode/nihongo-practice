/**
 * The A2 no-Japanese-in-module-files guard (Phase 3 Task 4).
 *
 * Drives `scripts/lintA2NoJapanese.ts`: the pure `findJapaneseViolations`
 * character scan, the `module*.ts`-excluding-`*.test.ts` file filter, the
 * directory-scanning aggregator, and the script's own fail-closed exit
 * behaviour (mirrors `scripts/validateA1Release.test.ts`'s mocking shape).
 * The final describe block scans the *real* `src/course/a2/content`
 * directory with no mocking at all — the actual gate every later module
 * content file must pass.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  A2_CONTENT_DIR,
  findJapaneseViolations,
  isA2ContentModuleFile,
  lintA2NoJapanese,
  listA2ContentModuleFiles,
} from "../../../../scripts/lintA2NoJapanese";

describe("findJapaneseViolations — pure character scan", () => {
  it("flags a hiragana literal", () => {
    const violations = findJapaneseViolations("x.ts", 'const s = "ともだち";');
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ filePath: "x.ts", line: 1 });
  });

  it("flags a katakana literal", () => {
    const violations = findJapaneseViolations("x.ts", 'const s = "コーヒー";');
    expect(violations).toHaveLength(1);
  });

  it("flags a halfwidth katakana literal", () => {
    const violations = findJapaneseViolations("x.ts", 'const s = "ｺｰﾋｰ";');
    expect(violations).toHaveLength(1);
  });

  it("flags a CJK kanji ideograph", () => {
    const violations = findJapaneseViolations("x.ts", 'const s = "友達";');
    expect(violations).toHaveLength(1);
  });

  it("flags ideographic punctuation (、 and 。) and the iteration mark 々", () => {
    expect(findJapaneseViolations("x.ts", "const s = '。';")).toHaveLength(1);
    expect(findJapaneseViolations("x.ts", "const s = '、';")).toHaveLength(1);
    expect(findJapaneseViolations("x.ts", "const s = '々';")).toHaveLength(1);
  });

  it("flags fullwidth ASCII (fullwidth romaji/digits smuggled past an ASCII check)", () => {
    const violations = findJapaneseViolations("x.ts", "const s = 'Ａ１';");
    expect(violations).toHaveLength(1);
  });

  it("does not flag plain English or Italian copy", () => {
    const content = [
      'const en = "I can chat with a friend and follow up naturally.";',
      'const it = "Posso chiacchierare con un amico e continuare la conversazione.";',
    ].join("\n");
    expect(findJapaneseViolations("x.ts", content)).toHaveLength(0);
  });

  it("does not flag semantic/copy IDs that merely contain the word family/context/etc.", () => {
    const content = 'const id = "a2-family-backchannel-followup-conversation";';
    expect(findJapaneseViolations("x.ts", content)).toHaveLength(0);
  });

  it("reports the correct line and 1-based column for a violation on a non-first line", () => {
    const content = ["line one is clean", 'const s = "だめ";', "line three is clean"].join("\n");
    const violations = findJapaneseViolations("x.ts", content);
    expect(violations).toHaveLength(1);
    expect(violations[0].line).toBe(2);
    expect(violations[0].column).toBe(content.split("\n")[1].indexOf("だ") + 1);
  });

  it("reports one violation per offending line, not one per character", () => {
    const content = 'const s = "ともだち";';
    expect(findJapaneseViolations("x.ts", content)).toHaveLength(1);
  });
});

describe("isA2ContentModuleFile — the guarded file filter", () => {
  it("matches module*.ts files", () => {
    expect(isA2ContentModuleFile("module01ConnectedConversation.ts")).toBe(true);
    expect(isA2ContentModuleFile("module04ReasonsOpinions.ts")).toBe(true);
  });

  it("excludes module*.test.ts files", () => {
    expect(isA2ContentModuleFile("module01ConnectedConversation.test.ts")).toBe(false);
  });

  it("excludes files that do not start with module", () => {
    expect(isA2ContentModuleFile("noJapaneseLint.test.ts")).toBe(false);
    expect(isA2ContentModuleFile("helpers.ts")).toBe(false);
  });
});

describe("scripts/lintA2NoJapanese — the script's fail-closed exit behaviour", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    vi.doUnmock("node:fs");
  });

  // The pure helpers above are statically imported at the top of this file,
  // which already executed the script's top-level side effects once (with
  // the real, unmocked filesystem) at module-collection time. Reset the
  // module registry before each dynamic re-import here so it genuinely
  // re-runs the script's top-level code under *this* test's `node:fs` mock,
  // rather than returning the already-cached, already-executed instance.
  beforeEach(() => {
    vi.resetModules();
  });

  it("exits cleanly and prints OK when every guarded file is clean", async () => {
    vi.doMock("node:fs", () => ({
      readdirSync: vi.fn(() => ["module01Foo.ts", "module01Foo.test.ts", "helpers.ts"]),
      readFileSync: vi.fn(() => 'export const en = "hello";'),
    }));
    const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("process.exit should not be called");
    }) as never);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await import("../../../../scripts/lintA2NoJapanese");

    expect(exitSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join(" ")).toMatch(/OK/);
  });

  it("refuses (exits non-zero) and prints every violation with file/line/column when a guarded file has Japanese", async () => {
    vi.doMock("node:fs", () => ({
      readdirSync: vi.fn(() => ["module01Foo.ts"]),
      readFileSync: vi.fn(() => 'export const en = "ともだち";'),
    }));
    let exitCode: number | undefined;
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      exitCode = code;
      throw new Error(`process.exit(${code})`);
    }) as never);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../../../../scripts/lintA2NoJapanese")).rejects.toThrow(
      "process.exit(1)",
    );

    expect(exitCode).toBe(1);
    const allErrorText = errorSpy.mock.calls.flat().join(" ");
    expect(allErrorText).toContain("module01Foo.ts");
    expect(allErrorText).toContain("1 Japanese-literal violation");
  });
});

describe("the real A2 content directory (unmocked filesystem)", () => {
  it("has no Japanese literal in any guarded module file", () => {
    const violations = lintA2NoJapanese(A2_CONTENT_DIR);
    expect(violations).toEqual([]);
  });

  it("guards at least the 4 M1-M4 module content files once authored", () => {
    const files = listA2ContentModuleFiles(A2_CONTENT_DIR);
    expect(files.length).toBeGreaterThanOrEqual(4);
  });

  it("cross-checks lintA2NoJapanese against a raw independent directory scan (no shared caching)", () => {
    const rawFiles = readdirSync(A2_CONTENT_DIR).filter(
      (f) => f.startsWith("module") && f.endsWith(".ts") && !f.endsWith(".test.ts"),
    );
    for (const fileName of rawFiles) {
      const content = readFileSync(join(A2_CONTENT_DIR, fileName), "utf8");
      expect(findJapaneseViolations(fileName, content)).toEqual([]);
    }
  });
});

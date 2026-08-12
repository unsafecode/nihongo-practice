/**
 * Whole-level coverage report contract. Asserts the retained 44-lesson release
 * view exposes exact structural metrics, that every table is deterministically
 * ordered, that the rendered Markdown is byte-stable across rebuilds, and that
 * the printed report is gated behind `A1_REPORT=1`.
 *
 * Task 16 rehomed the phonetic `sounds` module and the four Foundations
 * modules to Base, which reports on them itself; A1's report covers exactly
 * the eleven modules / forty-four routes A1 still owns, at their unchanged
 * canonical positions 21–64.
 *
 * No fixture imports: all figures derive from the frozen release catalogs.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildA1Reports, a1ReportMarkdown } from "./reports";

const reports = buildA1Reports();

describe("buildA1Reports – exact level metrics", () => {
  it("derives two complete area rows from the retained partition and actual module rows", () => {
    const areas = reports.byArea;

    expect(areas).toHaveLength(2);
    expect(areas).toEqual([
      expect.objectContaining({
        areaId: "situations",
        moduleCount: 10,
        lessonCount: 40,
        semanticLessonCount: 40,
        phoneticLessonCount: 0,
        capstoneLessonCount: 0,
        complete: true,
      }),
      expect.objectContaining({
        areaId: "synthesis",
        moduleIds: ["capstones"],
        moduleCount: 1,
        lessonCount: 4,
        semanticLessonCount: 4,
        phoneticLessonCount: 0,
        capstoneLessonCount: 4,
        complete: true,
      }),
    ]);
  });

  it("routes exactly the 44 retained semantic lessons and no phonetic row", () => {
    expect(reports.byLesson.length).toBe(44);
    expect(reports.byLesson.filter((row) => row.kind === "semantic").length).toBe(44);
    expect(reports.byLesson.filter((row) => row.kind === "phonetic").length).toBe(0);
  });

  it("reports 11 modules, one level row, 25 verb records, 14 Can-dos, 1 checkpoint, 1 alias", () => {
    expect(reports.byModule.length).toBe(11);
    expect(reports.verbUse.length).toBe(25);
    expect(reports.canDos.length).toBe(14);
    expect(reports.checkpoints.length).toBe(1);
    expect(reports.aliases.length).toBe(1);
  });

  it("aggregates the exact level totals", () => {
    expect(reports.level).toEqual({
      level: "a1",
      moduleCount: 11,
      areaCount: 2,
      lessonCount: 44,
      semanticLessonCount: 44,
      phoneticLessonCount: 0,
      capstoneLessonCount: 4,
      modelCount: 352,
      exerciseCount: 176,
      transferCount: 88,
      phoneticItemCount: 0,
      verbRecordCount: 25,
      complete: true,
    });
  });

  it("surfaces the release gate result (valid, complete, no error codes)", () => {
    expect(reports.validation.valid).toBe(true);
    expect(reports.validation.foundationComplete).toBe(true);
    expect(reports.validation.errorCodes).toEqual([]);
    expect(reports.validation.foundationDiagnostics).toEqual([]);
  });

  it("classifies Can-dos as 10 module + 4 scenario", () => {
    expect(reports.canDos.filter((row) => row.scope === "module").length).toBe(10);
    expect(reports.canDos.filter((row) => row.scope === "scenario").length).toBe(4);
  });

  it("claims no phonetic lesson, item, or Can-do that Base now owns", () => {
    expect(reports.byLesson.filter((row) => row.phonetic !== undefined)).toEqual([]);
    expect(reports.level.phoneticItemCount).toBe(0);
    expect(reports.byModule.every((row) => row.phoneticItemCount === 0)).toBe(true);
    expect(reports.byLesson.some((row) => row.lessonId.startsWith("sounds-"))).toBe(
      false,
    );
    expect(reports.canDos.some((row) => row.canDoId === "a1-can-do-sounds")).toBe(
      false,
    );
  });

  it("gives every semantic lesson eight models and no phonetic block", () => {
    for (const row of reports.byLesson.filter((r) => r.kind === "semantic")) {
      expect(row.modelCount).toBe(8);
      expect(row.transferCount).toBe(2);
      expect(row.phonetic).toBeUndefined();
    }
  });
});

describe("buildA1Reports – deterministic ordering", () => {
  it("orders lessons by strictly ascending canonical position 21..64", () => {
    // Retained A1 keeps its published canonical positions; Base owns 1–20.
    const positions = reports.byLesson.map((row) => row.position);
    expect(positions).toEqual(Array.from({ length: 44 }, (_, index) => index + 21));
  });

  it("orders modules by ascending order 1..11", () => {
    const orders = reports.byModule.map((row) => row.order);
    expect(orders).toEqual(Array.from({ length: 11 }, (_, index) => index + 1));
  });

  it("keeps a stable build: two independent builds are deeply equal", () => {
    expect(buildA1Reports()).toEqual(reports);
  });
});

describe("a1ReportMarkdown – stable rendering", () => {
  it("renders byte-identical Markdown across rebuilds", () => {
    const first = a1ReportMarkdown(reports);
    const second = a1ReportMarkdown(buildA1Reports());
    expect(second).toBe(first);
  });

  it("includes every table section and the release verdict", () => {
    const markdown = a1ReportMarkdown(reports);
    for (const heading of [
      "# A1 release report",
      "Release valid: yes",
      "Foundation complete: yes",
      "## Level",
      "## Areas",
      "## Modules",
      "## Lessons",
      "## Phonetic detail",
      "## Verb recurrence",
      "## Can-dos",
      "## Checkpoints",
      "## Legacy aliases",
    ]) {
      expect(markdown).toContain(heading);
    }
    // 44 lesson rows + 11 module rows must all appear.
    for (const row of reports.byLesson) {
      expect(markdown).toContain(`| ${row.lessonId} |`);
    }
  });

  it("contains no Japanese script in the rendered report", () => {
    const markdown = a1ReportMarkdown(reports);
    // The phonetic detail table intentionally lists glyphs, so scope the
    // no-Japanese assertion to the non-phonetic sections.
    const withoutPhonetic = markdown.split("## Phonetic detail")[0] + markdown.split("## Verb recurrence")[1];
    expect(/[\u3040-\u30ff\u4e00-\u9fff]/u.test(withoutPhonetic)).toBe(false);
  });
});

describe("a1ReportMarkdown – A1_REPORT print gate", () => {
  const modulePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "reports.ts");
  const runImport = (flag: string | undefined): string => {
    const env = { ...process.env };
    if (flag === undefined) delete env.A1_REPORT;
    else env.A1_REPORT = flag;
    const viteNodePath = path.resolve(process.cwd(), "node_modules/vite-node/vite-node.mjs");
    const result = spawnSync(
      process.execPath,
      [viteNodePath, modulePath],
      { encoding: "utf8", env, cwd: process.cwd() },
    );
    if (result.status !== 0) {
      throw new Error(`A1 report child import failed (${result.status}): ${result.stderr}`);
    }
    return result.stdout ?? "";
  };

  it("prints the report only when A1_REPORT=1", () => {
    expect(runImport("1")).toContain("# A1 release report");
  }, 60_000);

  it("stays silent when the flag is absent", () => {
    expect(runImport(undefined)).not.toContain("# A1 release report");
  }, 60_000);
});

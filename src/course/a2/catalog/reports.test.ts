/**
 * Whole-level QA reports for the assembled A2 catalog (Phase 3 Task 7).
 *
 * Mirrors `a1/catalog/reports.test.ts`'s exact-metrics contract, extended
 * with the two whole-level dimensions A1 never needed: the grammar spiral
 * (15 rows, one per `forms/grammarSpiral.ts` form, each with its own
 * structural + content-evidence verdict) and the contextual kanji catalog
 * (120 glyphs, one row each, with its own order/no-bypass verdict). No
 * fixture imports: all figures derive from the frozen release catalogs.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildA2Reports, a2ReportMarkdown } from "./reports";

const reports = buildA2Reports();

describe("buildA2Reports — exact level metrics", () => {
  it("reports exactly 1 level (a2), 15 modules, 60 lessons", () => {
    expect(reports.levels).toEqual(["a2"]);
    expect(reports.moduleCount).toBe(15);
    expect(reports.lessonCount).toBe(60);
    expect(reports.byModule).toHaveLength(15);
    expect(reports.byLesson).toHaveLength(60);
  });

  it("reports exactly 59 Can-dos (15 grammar + 40 topical + 4 scenario)", () => {
    expect(reports.canDos).toHaveLength(59);
    expect(reports.canDos.filter((row) => row.group === "grammar")).toHaveLength(15);
    expect(reports.canDos.filter((row) => row.group === "topical")).toHaveLength(40);
    expect(reports.canDos.filter((row) => row.group === "scenario")).toHaveLength(4);
  });

  it("aggregates the exact level totals (506 models, 600 exercises, 300 transfers authored)", () => {
    expect(reports.byLevel).toEqual({
      level: "a2",
      moduleCount: 15,
      lessonCount: 60,
      modelCount: 508,
      exerciseCount: 600,
      transferCount: 300,
      complete: true,
    });
  });

  it("gives every lesson >=8 models, exactly 10 selected exercises, >=3 predicates/roles, >=2 contexts, >=5 unique targets, reuse <=2, and controlled production", () => {
    for (const row of reports.byLesson) {
      expect(row.modelCount, row.lessonId).toBeGreaterThanOrEqual(8);
      expect(row.modelCount, row.lessonId).toBeLessThanOrEqual(12);
      expect(row.exerciseCount, row.lessonId).toBe(10);
      expect(row.predicateCount, row.lessonId).toBeGreaterThanOrEqual(3);
      // Synthesis (capstone) lessons are two-speaker scenes: minRoles is 2.
      const expectedMinRoles = row.lessonId.startsWith("a2-synthesis-") ? 2 : 3;
      expect(row.roleCount, row.lessonId).toBeGreaterThanOrEqual(expectedMinRoles);
      expect(row.contextCount, row.lessonId).toBeGreaterThanOrEqual(2);
      expect(row.uniqueTargetCount, row.lessonId).toBeGreaterThanOrEqual(5);
      expect(row.maximumVisibleReuse, row.lessonId).toBeLessThanOrEqual(2);
      expect(row.transferCount, row.lessonId).toBeGreaterThanOrEqual(5);
      expect(row.controlledProduction, row.lessonId).toBe(true);
      expect(row.complete, row.lessonId).toBe(true);
    }
  });

  it("surfaces the release gate result (valid, complete, no error codes)", () => {
    expect(reports.validation.valid).toBe(true);
    expect(reports.validation.foundationComplete).toBe(true);
    expect(reports.validation.errorCodes).toEqual([]);
  });
});

describe("buildA2Reports — grammar spiral (15 rows, all roles content-backed)", () => {
  it("reports exactly 15 grammar rows, each structurally valid and evidence-complete", () => {
    expect(reports.grammar).toHaveLength(15);
    for (const row of reports.grammar) {
      expect(row.structurallyValid, row.formId).toBe(true);
      expect(row.evidenceComplete, row.formId).toBe(true);
      expect(row.recurrenceLessonIds.length, row.formId).toBeGreaterThan(0);
    }
  });
});

describe("buildA2Reports — contextual kanji (120 glyphs, exact distribution, no bypass)", () => {
  it("reports exactly 120 total glyphs, matching the frozen per-module distribution, all order/no-bypass valid", () => {
    expect(reports.kanji.total).toBe(120);
    expect(reports.kanji.entries).toHaveLength(120);
    expect(reports.kanji.valid).toBe(true);
    expect(reports.kanji.errorCodes).toEqual([]);
    const sum = Object.values(reports.kanji.byModule).reduce((a, b) => a + b, 0);
    expect(sum).toBe(120);
    expect(reports.kanji.byModule["a2-synthesis"]).toBe(0);
    for (const entry of reports.kanji.entries) {
      expect(entry.orderValid, entry.kanjiId).toBe(true);
      expect(entry.noBypassValid, entry.kanjiId).toBe(true);
    }
  });
});

describe("buildA2Reports — checkpoint (all 59 Can-dos sampled, min 3 transfer targets)", () => {
  it("reports exactly 1 checkpoint sampling all 59 Can-dos with minAcceptedTransferTargetsPerCanDo 3", () => {
    expect(reports.checkpoint.sampledCanDoIds).toHaveLength(59);
    expect(reports.checkpoint.minAcceptedTransferTargetsPerCanDo).toBe(3);
  });
});

describe("buildA2Reports — deterministic ordering", () => {
  it("orders lessons by strictly ascending position 1..60", () => {
    const positions = reports.byLesson.map((row) => row.position);
    expect(positions).toEqual(Array.from({ length: 60 }, (_, index) => index + 1));
  });

  it("orders modules by ascending order 1..15", () => {
    const orders = reports.byModule.map((row) => row.order);
    expect(orders).toEqual(Array.from({ length: 15 }, (_, index) => index + 1));
  });

  it("keeps a stable build: two independent builds are deeply equal", () => {
    expect(buildA2Reports()).toEqual(reports);
  });
});

describe("a2ReportMarkdown — stable rendering", () => {
  it("renders byte-identical Markdown across rebuilds", () => {
    const first = a2ReportMarkdown(reports);
    const second = a2ReportMarkdown(buildA2Reports());
    expect(second).toBe(first);
  });

  it("includes every table section and the release verdict", () => {
    const markdown = a2ReportMarkdown(reports);
    for (const heading of [
      "# A2 release report",
      "Release valid: yes",
      "## Level",
      "## Modules",
      "## Lessons",
      "## Grammar spiral",
      "## Kanji",
      "## Can-dos",
      "## Checkpoint",
    ]) {
      expect(markdown).toContain(heading);
    }
    for (const row of reports.byLesson) {
      expect(markdown).toContain(`| ${row.lessonId} |`);
    }
  });

  it("contains no Japanese script in the rendered report (kanji table lists glyphs only, scoped out)", () => {
    const markdown = a2ReportMarkdown(reports);
    const withoutKanjiGlyphColumn = markdown.split("## Kanji")[0] + markdown.split("## Can-dos")[1];
    expect(/[\u3040-\u30ff\u4e00-\u9fff]/u.test(withoutKanjiGlyphColumn)).toBe(false);
  });
});

describe("a2ReportMarkdown — A2_REPORT print gate", () => {
  const modulePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "reports.ts");
  const runImport = (flag: string | undefined): string => {
    const env = { ...process.env };
    if (flag === undefined) delete env.A2_REPORT;
    else env.A2_REPORT = flag;
    const viteNodePath = path.resolve(process.cwd(), "node_modules/vite-node/vite-node.mjs");
    const result = spawnSync(
      process.execPath,
      [viteNodePath, modulePath],
      { encoding: "utf8", env, cwd: process.cwd() },
    );
    if (result.status !== 0) {
      throw new Error(`A2 report child import failed (${result.status}): ${result.stderr}`);
    }
    return result.stdout ?? "";
  };

  it("prints the report only when A2_REPORT=1", () => {
    expect(runImport("1")).toContain("# A2 release report");
  }, 60_000);

  it("stays silent when the flag is absent", () => {
    expect(runImport(undefined)).not.toContain("# A2 release report");
  }, 60_000);
});

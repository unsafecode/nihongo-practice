/**
 * Whole-level coverage report contract. Asserts the combined 48-lesson release
 * view exposes exact structural metrics, that every table is deterministically
 * ordered, that the rendered Markdown is byte-stable across rebuilds, and that
 * the printed report is gated behind `A1_REPORT=1`.
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
  it("combines 44 semantic + 4 phonetic lessons into 48 routed rows", () => {
    expect(reports.byLesson.length).toBe(48);
    expect(reports.byLesson.filter((row) => row.kind === "semantic").length).toBe(44);
    expect(reports.byLesson.filter((row) => row.kind === "phonetic").length).toBe(4);
  });

  it("reports 12 modules, one level row, 40 verb records, 15 Can-dos, 1 checkpoint, 1 alias", () => {
    expect(reports.byModule.length).toBe(12);
    expect(reports.verbUse.length).toBe(40);
    expect(reports.canDos.length).toBe(15);
    expect(reports.checkpoints.length).toBe(1);
    expect(reports.aliases.length).toBe(1);
  });

  it("aggregates the exact level totals", () => {
    expect(reports.level).toEqual({
      level: "a1",
      moduleCount: 12,
      lessonCount: 48,
      modelCount: 352,
      exerciseCount: 216,
      transferCount: 88,
      phoneticItemCount: 40,
      verbRecordCount: 40,
      complete: true,
    });
  });

  it("surfaces the release gate result (valid, complete, no error codes)", () => {
    expect(reports.validation.valid).toBe(true);
    expect(reports.validation.foundationComplete).toBe(true);
    expect(reports.validation.errorCodes).toEqual([]);
    expect(reports.validation.foundationDiagnostics).toEqual([]);
  });

  it("classifies Can-dos as 11 module + 4 scenario", () => {
    expect(reports.canDos.filter((row) => row.scope === "module").length).toBe(11);
    expect(reports.canDos.filter((row) => row.scope === "scenario").length).toBe(4);
  });

  it("gives every phonetic lesson meaningful sound-specific fields", () => {
    const phonetic = reports.byLesson.filter((row) => row.phonetic);
    expect(phonetic.length).toBe(4);
    for (const row of phonetic) {
      expect(row.kind).toBe("phonetic");
      expect(row.phonetic!.itemCount).toBe(10);
      expect(row.phonetic!.exerciseRefCount).toBe(10);
      expect(row.exerciseCount).toBe(10);
      expect(row.phonetic!.contrastFeatures.length).toBeGreaterThan(0);
      expect(row.phonetic!.glyphs.length).toBe(10);
      // Phonetic lessons carry no sentence-level metrics.
      expect(row.modelCount).toBe(0);
      expect(row.transferCount).toBe(0);
    }
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
  it("orders lessons by strictly ascending position 1..48", () => {
    const positions = reports.byLesson.map((row) => row.position);
    expect(positions).toEqual(Array.from({ length: 48 }, (_, index) => index + 1));
  });

  it("orders modules by ascending order 1..12", () => {
    const orders = reports.byModule.map((row) => row.order);
    expect(orders).toEqual(Array.from({ length: 12 }, (_, index) => index + 1));
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
    // 48 lesson rows + 12 module rows must all appear.
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

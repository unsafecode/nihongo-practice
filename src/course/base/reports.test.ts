import { describe, expect, it } from "vitest";
import {
  buildBaseLessonReports,
  buildBaseReleaseReport,
  formatDistribution,
} from "./reports";
import { buildBaseReleaseInput } from "./validateBase";
import { BASE_LESSON_IDS } from "./manifest";

/**
 * Task 17 reporting. Every number in a Base release report is *measured* from
 * the release input — nothing is hardcoded — so a report that disagrees with
 * the shipped catalogs is itself a release finding.
 */

const input = buildBaseReleaseInput();
const lessonReports = buildBaseLessonReports(input);
const report = buildBaseReleaseReport(input);

describe("buildBaseLessonReports", () => {
  it("reports exactly one entry per published lesson, in manifest order", () => {
    expect(lessonReports.map(({ lessonId }) => lessonId)).toEqual([
      ...BASE_LESSON_IDS,
    ]);
  });

  it("carries the owner and contract for every lesson", () => {
    for (const lesson of lessonReports) {
      expect(lesson.moduleId).not.toBe("");
      expect(["phonetic", "content", "system", "synthesis"]).toContain(
        lesson.contract,
      );
      expect(lesson.position).toBeGreaterThan(0);
    }
  });

  it("measures new, reviewed and recurring lexemes per lesson", () => {
    const totalNew = lessonReports.reduce(
      (sum, lesson) => sum + lesson.newLexemes,
      0,
    );
    expect(totalNew).toBeGreaterThan(0);
    for (const lesson of lessonReports) {
      expect(lesson.newLexemes).toBeGreaterThanOrEqual(0);
      expect(lesson.reviewedLexemes).toBeGreaterThanOrEqual(0);
      expect(lesson.recurringLexemes).toBeGreaterThanOrEqual(0);
      // A recurring lexeme is one this lesson makes visible that an *earlier*
      // lesson first taught, so it can never exceed the visible total.
      expect(lesson.recurringLexemes).toBeLessThanOrEqual(lesson.visibleLexemes);
    }
  });

  it("fingerprints every example, dialogue turn and activity target", () => {
    for (const lesson of lessonReports) {
      expect(lesson.exampleFingerprints).toHaveLength(lesson.examples);
      expect(lesson.dialogueFingerprints).toHaveLength(lesson.dialogueTurns);
      expect(lesson.activityFingerprints).toHaveLength(lesson.activities);
      for (const fingerprint of lesson.exampleFingerprints) {
        expect(fingerprint).toMatch(/^[a-f0-9]{16,64}$/);
      }
    }
  });

  it("records explanation blocks, pattern cells and reference entries", () => {
    const semantic = lessonReports.filter(({ contract }) => contract !== "phonetic");
    expect(semantic.length).toBe(36);
    for (const lesson of semantic) {
      expect(lesson.explanationBlocks).toBe(5);
    }
    expect(
      lessonReports.reduce((sum, lesson) => sum + lesson.patternCells, 0),
    ).toBeGreaterThan(0);
    expect(
      lessonReports.reduce((sum, lesson) => sum + lesson.referenceEntries, 0),
    ).toBeGreaterThan(0);
  });

  it("records first-teach and prerequisite closure per lesson", () => {
    for (const lesson of lessonReports) {
      expect(lesson.firstTeachOwned).toBeGreaterThanOrEqual(0);
      expect(lesson.prerequisiteClosure).toBe(true);
    }
  });

  it("records locale and script render status per lesson", () => {
    for (const lesson of lessonReports) {
      expect(lesson.locales).toEqual(["en", "it"]);
      expect(lesson.scripts).toEqual(["kana", "romaji"]);
      expect(lesson.rendered).toBe(true);
    }
  });

  it("records the review fingerprints that cover each lesson", () => {
    const withNaturalness = lessonReports.filter(
      (lesson) => lesson.naturalnessFingerprints.length > 0,
    );
    expect(withNaturalness.length).toBeGreaterThan(0);
    for (const lesson of lessonReports) {
      for (const fingerprint of lesson.naturalnessFingerprints) {
        expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
      }
      for (const fingerprint of lesson.audioFingerprints) {
        expect(fingerprint).toMatch(/^[a-f0-9]{64}$/);
      }
    }
  });
});

describe("buildBaseReleaseReport", () => {
  it("aggregates measured totals that match the per-lesson reports", () => {
    expect(report.modules).toBe(10);
    expect(report.lessons).toBe(lessonReports.length);
    expect(report.examples).toBe(
      lessonReports.reduce((sum, lesson) => sum + lesson.examples, 0),
    );
    expect(report.dialogueTurns).toBe(
      lessonReports.reduce((sum, lesson) => sum + lesson.dialogueTurns, 0),
    );
    expect(report.activities).toBe(
      lessonReports.reduce((sum, lesson) => sum + lesson.activities, 0),
    );
    expect(report.patternCells).toBeGreaterThan(0);
    expect(report.lexemes).toBeGreaterThan(0);
    expect(report.lexemes).toBeLessThanOrEqual(250);
  });

  it("publishes distributions rather than hardcoded constants", () => {
    expect(Object.keys(report.contracts).sort()).toEqual([
      "content",
      "phonetic",
      "synthesis",
      "system",
    ]);
    expect(
      Object.values(report.contracts).reduce((sum, count) => sum + count, 0),
    ).toBe(40);
    expect(Object.keys(report.categories).length).toBeGreaterThan(0);
    expect(
      Object.values(report.categories).reduce((sum, count) => sum + count, 0),
    ).toBe(report.activities);
  });

  it("counts unresolved external-review findings without inventing acceptance", () => {
    expect(report.audioReviews).toBeGreaterThan(0);
    expect(report.naturalnessReviews).toBeGreaterThan(0);
    expect(report.unresolvedFindings).toBe(
      report.pendingAudioReviews + report.pendingNaturalnessReviews,
    );
    expect(report.reviewedAudio).toBe(
      report.audioReviews - report.pendingAudioReviews,
    );
  });

  it("carries the per-lesson reports it aggregated", () => {
    expect(report.byLesson).toEqual(lessonReports);
  });
});

describe("formatDistribution", () => {
  it("renders a stable, alphabetically-keyed name=count summary", () => {
    expect(formatDistribution({ beta: 2, alpha: 1 })).toBe("alpha=1, beta=2");
  });

  it("renders an explicit marker for an empty distribution", () => {
    expect(formatDistribution({})).toBe("none");
  });
});

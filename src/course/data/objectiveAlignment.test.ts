import { describe, expect, it } from "vitest";
import { lessonPath } from "../../routing/routePaths";
import { courseModules } from "./course";
import { examples } from "./examples";
import { validateExploration } from "./validate";
import type {
  ExampleSegment,
  GuidedExploration,
  RouteReturnTarget,
  StaticExample,
} from "./types";

/**
 * Objective/exploration alignment (design spec §6.4, Task D). A guided
 * transformation must genuinely target one of its lesson's declared objective
 * gears: the before/after gear delta has to intersect the grammar the lesson
 * teaches (from its introduced concepts, or — for the capstone that introduces
 * nothing — its required concepts). A matching `objectiveId` string alone must
 * never certify an honest exploration.
 */
function seg(jp: string, kind: ExampleSegment["kind"], id: string): ExampleSegment {
  return { id, jp, romaji: jp, kind };
}

function example(id: string, segments: ExampleSegment[]): StaticExample {
  return {
    id,
    jp: segments.map((segment) => segment.jp).join(""),
    romaji: segments.map((segment) => segment.romaji).join(""),
    segments,
  };
}

function returnTarget(): RouteReturnTarget {
  return { pathname: lessonPath("mx", "lx"), sectionId: "explore" };
}

const alignmentExamples: Record<string, StaticExample> = {
  plain: example("plain", [seg("たべ", "word", "0"), seg("ます", "ending", "1")]),
  object: example("object", [
    seg("を", "particle", "0"),
    seg("たべ", "word", "1"),
    seg("ます", "ending", "2"),
  ]),
  timed: example("timed", [
    seg("きょう", "word", "0"),
    seg("たべ", "word", "1"),
    seg("ます", "ending", "2"),
  ]),
};

function objLesson(introduced: string[]) {
  return {
    id: "lx",
    moduleId: "mx",
    objectiveCopyIds: ["lx"],
    introducedConceptIds: introduced as never,
    requiredConceptIds: [] as never,
  };
}

function exploration(
  targetExampleId: string,
  changedGearIds: string[],
): GuidedExploration {
  return {
    kind: "transformation",
    data: {
      id: "exp",
      objectiveId: "lx",
      initialSelection: { exampleId: "plain", segmentIds: ["0"] },
      targetSelection: { exampleId: targetExampleId, segmentIds: ["0"] },
      changedGearIds,
      returnTarget: returnTarget(),
    },
  };
}

describe("validateExploration — objective gear alignment (synthetic)", () => {
  it("rejects a transformation whose delta misses every objective gear", () => {
    // Lesson teaches the object marker を, but the exploration only adds a time
    // word — the changed gear never touches the declared objective.
    expect(
      validateExploration(
        exploration("timed", ["きょう"]),
        objLesson(["object-o"]),
        alignmentExamples,
      ),
    ).toContain("exploration-objective-gear-miss:exp");
  });

  it("accepts a transformation whose delta hits a declared objective gear", () => {
    expect(
      validateExploration(
        exploration("object", ["を"]),
        objLesson(["object-o"]),
        alignmentExamples,
      ),
    ).toEqual([]);
  });
});

function realExploration(lessonId: string) {
  for (const courseModule of courseModules) {
    const lesson = courseModule.lessons.find((entry) => entry.id === lessonId);
    if (lesson) {
      return { lesson, exploration: lesson.sections[2].exploration };
    }
  }
  throw new Error(`lesson not found: ${lessonId}`);
}

describe("validateExploration — real shipped explorations target their objective", () => {
  // Each of these guards a previously-known mismatch the redesign must fix:
  //  - travel-questions once opened an affirmative movement sentence (no か);
  //  - traps-verbs (capstone) once changed only a time word, never a real gear;
  //  - sentence-order once added an unrelated time word instead of は/です;
  //  - actions-masu once assumed a dictionary form instead of forming ください.
  it.each([
    "sentence-order",
    "actions-masu",
    "travel-questions",
    "traps-verbs",
  ])("%s exploration delta genuinely targets its objective", (lessonId) => {
    const { lesson, exploration: real } = realExploration(lessonId);
    expect(validateExploration(real, lesson, examples)).toEqual([]);
  });
});

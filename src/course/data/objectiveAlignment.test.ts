import { describe, expect, it } from "vitest";
import { lessonPath } from "../../routing/routePaths";
import { courseModules as legacyCourseModules } from "../catalog/assembleCourse";
import { examples } from "./examples";
import { legacySegmentKindToTokenKind } from "./romajiTokens";
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
  return {
    id,
    jp,
    romaji: jp,
    kind,
    tokenKind: legacySegmentKindToTokenKind(kind),
    boundaryBefore: "attach",
    source: { domain: "test", referenceId: `segment:${id}` },
  };
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

/**
 * These fixtures deliberately read the legacy, fully-populated
 * `assembleCourse` lesson set (with its per-section guided explorations)
 * rather than the live A1 release's `courseModules` (`./course`), because the
 * live A1 lesson definitions carry no `sections` at all — the deep lesson
 * experience is now driven by the generic release view model instead. This
 * describe block still proves `validateExploration` accepts genuinely honest,
 * previously-shipped guided transformations; it is a pure-function property
 * test, independent of which lessons are live in the current runtime.
 */
function realExploration(lessonId: string) {
  for (const courseModule of legacyCourseModules) {
    const lesson = courseModule.lessons.find((entry) => entry.id === lessonId);
    if (lesson && lesson.sections) {
      return { lesson, exploration: lesson.sections[2].exploration };
    }
  }
  throw new Error(`lesson not found: ${lessonId}`);
}

describe("validateExploration — real shipped explorations are well-formed", () => {
  // The catalog is the single source of truth for concept order and reuse
  // (validateCurriculum). Runtime lessons carry no concept ids, so the objective
  // gear-alignment check is exercised by the synthetic cases above; here we
  // prove each real transformation lesson's guided exploration is structurally
  // honest — its declared changed gears equal the endpoint delta, its endpoints
  // differ, its objective id is declared, and its return target is this lesson's
  // own explore anchor.
  it.each([
    "introductions-1",
    "actions-1",
    "past-negative-2",
    "places-1",
  ])("%s exploration is a valid guided transformation", (lessonId) => {
    const { lesson, exploration: real } = realExploration(lessonId);
    expect(validateExploration(real, lesson, examples)).toEqual([]);
  });
});

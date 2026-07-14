import { describe, expect, it } from "vitest";
import { lessonPath } from "../../routing/routePaths";
import { validateExploration } from "./validate";
import type {
  ExampleSegment,
  GuidedExploration,
  GuidedTransformationData,
  RouteReturnTarget,
  StaticExample,
} from "./types";

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

const LESSON = { id: "lx", moduleId: "mx", objectiveCopyIds: ["lx"] };

function returnTarget(): RouteReturnTarget {
  return { pathname: lessonPath("mx", "lx"), sectionId: "explore" };
}

const authoredExamples: Record<string, StaticExample> = {
  "a-init": example("a-init", [seg("たべ", "word", "0"), seg("る", "ending", "1")]),
  "a-target": example("a-target", [
    seg("たべ", "word", "0"),
    seg("ます", "ending", "1"),
  ]),
};

function authored(): GuidedExploration {
  return {
    kind: "transformation",
    data: {
      id: "exp",
      objectiveId: "lx",
      initialSelection: { exampleId: "a-init", segmentIds: ["1"] },
      targetSelection: { exampleId: "a-target", segmentIds: ["1"] },
      changedGearIds: ["る", "ます"],
      returnTarget: returnTarget(),
    },
  };
}

describe("validateExploration — common contract", () => {
  it("accepts a genuine authored transformation", () => {
    expect(validateExploration(authored(), LESSON, authoredExamples)).toEqual([]);
  });

  it("rejects an objective the lesson does not declare", () => {
    const exploration = authored();
    const bad: GuidedExploration = {
      kind: "transformation",
      data: { ...exploration.data as GuidedTransformationData, objectiveId: "ghost" },
    };
    expect(validateExploration(bad, LESSON, authoredExamples)).toContain(
      "exploration-unknown-objective:exp:ghost",
    );
  });

  it("rejects a return target that is not this lesson's explore anchor (wrong section)", () => {
    const exploration = authored();
    const bad: GuidedExploration = {
      kind: "transformation",
      data: {
        ...(exploration.data as GuidedTransformationData),
        returnTarget: { pathname: lessonPath("mx", "lx"), sectionId: "rule" },
      },
    };
    expect(validateExploration(bad, LESSON, authoredExamples)).toContain(
      "exploration-bad-return:exp",
    );
  });

  it("rejects a return target pointing at a different lesson path", () => {
    const exploration = authored();
    const bad: GuidedExploration = {
      kind: "transformation",
      data: {
        ...(exploration.data as GuidedTransformationData),
        returnTarget: { pathname: lessonPath("other", "other"), sectionId: "explore" },
      },
    };
    expect(validateExploration(bad, LESSON, authoredExamples)).toContain(
      "exploration-bad-return:exp",
    );
  });
});

describe("validateExploration — authored transformation", () => {
  it("rejects identical endpoints (same example both sides)", () => {
    const bad: GuidedExploration = {
      kind: "transformation",
      data: {
        ...(authored().data as GuidedTransformationData),
        targetSelection: { exampleId: "a-init", segmentIds: ["1"] },
        changedGearIds: ["る"],
      },
    };
    expect(validateExploration(bad, LESSON, authoredExamples)).toContain(
      "exploration-identical-endpoints:exp",
    );
  });

  it("rejects an empty changed-gear declaration", () => {
    const bad: GuidedExploration = {
      kind: "transformation",
      data: { ...(authored().data as GuidedTransformationData), changedGearIds: [] },
    };
    expect(validateExploration(bad, LESSON, authoredExamples)).toContain(
      "exploration-empty-gears:exp",
    );
  });

  it("rejects changed gears that do not equal the endpoint difference", () => {
    const bad: GuidedExploration = {
      kind: "transformation",
      data: { ...(authored().data as GuidedTransformationData), changedGearIds: ["を"] },
    };
    expect(validateExploration(bad, LESSON, authoredExamples)).toContain(
      "exploration-gear-diff-mismatch:exp",
    );
  });

  it("rejects an unknown authored example", () => {
    const bad: GuidedExploration = {
      kind: "transformation",
      data: {
        ...(authored().data as GuidedTransformationData),
        initialSelection: { exampleId: "ghost", segmentIds: [] },
      },
    };
    expect(validateExploration(bad, LESSON, authoredExamples)).toContain(
      "exploration-unknown-example:exp:ghost",
    );
  });

  it("rejects an authored segment id absent from its example", () => {
    const bad: GuidedExploration = {
      kind: "transformation",
      data: {
        ...(authored().data as GuidedTransformationData),
        initialSelection: { exampleId: "a-init", segmentIds: ["9"] },
      },
    };
    expect(validateExploration(bad, LESSON, authoredExamples)).toContain(
      "exploration-unknown-segment:exp:9",
    );
  });
});

describe("validateExploration — Lab transformation reuses the engine", () => {
  it("accepts a natural present->past lab pair whose gear diff is declared", () => {
    const exploration: GuidedExploration = {
      kind: "transformation",
      data: {
        id: "lab",
        objectiveId: "lx",
        initialSelection: {
          scenarioId: "eat",
          form: "pres",
          timeId: "today",
          options: { object: "ramen", place: null },
        },
        targetSelection: {
          scenarioId: "eat",
          form: "past",
          timeId: "today",
          options: { object: "ramen", place: null },
        },
        changedGearIds: ["ます", "ました"],
        returnTarget: returnTarget(),
      },
    };
    expect(validateExploration(exploration, LESSON, {})).toEqual([]);
  });

  it("rejects a non-natural lab endpoint", () => {
    const exploration: GuidedExploration = {
      kind: "transformation",
      data: {
        id: "lab",
        objectiveId: "lx",
        initialSelection: {
          scenarioId: "eat",
          form: "pres",
          timeId: "today",
          options: { object: "ramen", place: null },
        },
        targetSelection: {
          scenarioId: "eat",
          form: "pres",
          timeId: "yesterday",
          options: { object: "ramen", place: null },
        },
        changedGearIds: ["を"],
        returnTarget: returnTarget(),
      },
    };
    expect(
      validateExploration(exploration, LESSON, {}).some((error) =>
        error.startsWith("exploration-non-natural:lab"),
      ),
    ).toBe(true);
  });
});

describe("validateExploration — tool exploration", () => {
  it("accepts a syllabary tool exploration that only claims to open the syllabary", () => {
    const exploration: GuidedExploration = {
      kind: "tool",
      data: {
        id: "tool",
        objectiveId: "lx",
        target: "syllabary",
        returnTarget: returnTarget(),
      },
    };
    expect(validateExploration(exploration, LESSON, {})).toEqual([]);
  });

  it("rejects a tool exploration with a bad return target", () => {
    const exploration: GuidedExploration = {
      kind: "tool",
      data: {
        id: "tool",
        objectiveId: "lx",
        target: "syllabary",
        returnTarget: { pathname: "/nope", sectionId: "explore" },
      },
    };
    expect(validateExploration(exploration, LESSON, {})).toContain(
      "exploration-bad-return:tool",
    );
  });
});

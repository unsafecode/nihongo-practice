import { describe, expect, it } from "vitest";
import { courseModules } from "../data/course";
import { examples } from "../data/examples";
import { it as itCopy } from "./it";
import { en as enCopy } from "./en";
import type { CourseCopy } from "./types";

function collectStaticStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStaticStrings);
  if (typeof value === "object" && value !== null) {
    return Object.values(value).flatMap(collectStaticStrings);
  }
  return [];
}

describe.each([itCopy, enCopy])("course locale", (copy) => {
  it("covers every module, lesson, block and example", () => {
    for (const courseModule of courseModules) {
      expect(copy.modules[courseModule.id]).toBeTruthy();
      for (const outcomeId of courseModule.outcomeCopyIds) {
        expect(copy.outcomes[outcomeId]).toBeTruthy();
      }
      for (const lesson of courseModule.lessons) {
        expect(copy.lessons[lesson.titleCopyId]).toBeTruthy();
        for (const objectiveId of lesson.objectiveCopyIds) {
          expect(copy.objectives[objectiveId]).toBeTruthy();
        }
        for (const section of lesson.sections) {
          for (const block of section.blocks) {
            const blockCopy = copy.blocks[block.copyId];
            expect(blockCopy).toBeTruthy();
            if (block.type === "summary") {
              expect(blockCopy.bullets?.length).toBeGreaterThan(0);
            }
            if ("exampleIds" in block) {
              for (const exampleId of block.exampleIds) {
                expect(examples[exampleId]).toBeTruthy();
                expect(copy.examples[exampleId]).toBeTruthy();
              }
            }
          }
        }
      }
    }
  });

  it("contains no blank visible copy", () => {
    const staticCopy = collectStaticStrings({
      home: copy.home,
      lesson: copy.lesson,
      practice: copy.practice,
      courseMap: copy.courseMap,
      modules: copy.modules,
      lessons: copy.lessons,
      objectives: copy.objectives,
      outcomes: copy.outcomes,
      blocks: copy.blocks,
      examples: copy.examples,
    });
    expect(staticCopy.length).toBeGreaterThan(0);
    expect(staticCopy.every((value) => value.trim().length > 0)).toBe(true);
    expect(copy.home.invalidRoute("/missing").trim().length).toBeGreaterThan(0);
    expect(copy.home.lessonsProgress(1, 16).trim().length).toBeGreaterThan(0);
    expect(copy.lesson.modulePosition(1, 8).trim().length).toBeGreaterThan(0);
    expect(copy.courseMap.prerequisites([]).trim().length).toBeGreaterThan(0);
    expect(
      copy.courseMap.prerequisites(["Suoni e hiragana"]).trim().length,
    ).toBeGreaterThan(0);
    expect(copy.courseMap.estimatedMinutes(12).trim().length).toBeGreaterThan(0);
    expect(copy.courseMap.expandLabel("X").trim().length).toBeGreaterThan(0);
    expect(copy.courseMap.collapseLabel("X").trim().length).toBeGreaterThan(0);
  });

  it("has no orphan localized keys beyond what course data references", () => {
    const knownModuleIds = new Set(courseModules.map((m) => m.id));
    const knownLessonTitleIds = new Set(
      courseModules.flatMap((m) => m.lessons.map((l) => l.titleCopyId)),
    );
    const knownObjectiveIds = new Set(
      courseModules.flatMap((m) => m.lessons.flatMap((l) => l.objectiveCopyIds)),
    );
    const knownOutcomeIds = new Set(
      courseModules.flatMap((m) => m.outcomeCopyIds),
    );
    const knownBlockCopyIds = new Set(
      courseModules.flatMap((m) =>
        m.lessons.flatMap((l) =>
          l.sections.flatMap((s) => s.blocks.map((b) => b.copyId)),
        ),
      ),
    );
    const knownExampleIds = new Set(Object.keys(examples));

    expect(orphanKeys(copy.modules, knownModuleIds)).toEqual([]);
    expect(orphanKeys(copy.lessons, knownLessonTitleIds)).toEqual([]);
    expect(orphanKeys(copy.objectives, knownObjectiveIds)).toEqual([]);
    expect(orphanKeys(copy.outcomes, knownOutcomeIds)).toEqual([]);
    expect(orphanKeys(copy.blocks, knownBlockCopyIds)).toEqual([]);
    expect(orphanKeys(copy.examples, knownExampleIds)).toEqual([]);
  });
});

function orphanKeys(
  dictionary: Record<string, unknown>,
  knownIds: ReadonlySet<string>,
): string[] {
  return Object.keys(dictionary).filter((key) => !knownIds.has(key));
}

describe("locale parity", () => {
  it("shares identical key sets between it and en for every dictionary", () => {
    const dictionaries: Array<
      keyof Pick<
        CourseCopy,
        "modules" | "lessons" | "objectives" | "outcomes" | "blocks" | "examples"
      >
    > = ["modules", "lessons", "objectives", "outcomes", "blocks", "examples"];

    for (const key of dictionaries) {
      const itKeys = Object.keys(itCopy[key]).sort();
      const enKeys = Object.keys(enCopy[key]).sort();
      expect(itKeys).toEqual(enKeys);
    }
  });
});

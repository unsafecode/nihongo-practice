import { describe, expect, it } from "vitest";
import { courseModules as legacyCourseModules } from "../catalog/assembleCourse";
import { examples } from "./examples";
import type { AuthoredSelection, Lesson } from "./types";

/**
 * Prerequisite-honesty guard on the *shipped* course data (design spec
 * §2.7/§8.1, §5.2): the sounds bridge (Module 1) is the pre-grammar orientation
 * module, so no example it puts on screen may contain a grammatical particle or
 * ending. Object `を`, polite `ます`, requests `ください`, past/negative
 * `ました`/`ません`, and the later particles `で`/`に`/`へ`/`か` are all
 * introduced from Module 2 onward; the full assessment-before-introduction
 * invariant across every module is proven on the shared catalogs by
 * `validateCurriculum`.
 */
const PREMATURE_GRAMMAR = [
  "を",
  "ます",
  "ました",
  "ません",
  "ください",
  "で",
  "に",
  "へ",
  "か",
  "たい",
  "ましょう",
];

function referencedExampleIds(lesson: Lesson): string[] {
  const ids: string[] = [];
  // These fixtures read the legacy, fully-populated `assembleCourse` lesson
  // set (with sections), not the live A1 release's sections-less
  // `courseModules` (`./course`) — see the module-level comment above.
  const [, comparison, explore] = lesson.sections!;
  ids.push(comparison.comparison.baseExampleId);
  ids.push(comparison.comparison.changedExampleId);
  if (explore.exploration.kind === "transformation") {
    for (const selection of [
      explore.exploration.data.initialSelection,
      explore.exploration.data.targetSelection,
    ]) {
      if ("exampleId" in selection) {
        ids.push((selection as AuthoredSelection).exampleId);
      }
    }
  }
  return ids;
}

describe("the sounds bridge never uses not-yet-taught grammar (real data)", () => {
  const soundsLessons = legacyCourseModules
    .filter((courseModule) => courseModule.order === 1)
    .flatMap((courseModule) => courseModule.lessons);

  it("keeps the sounds module to pure syllables — no grammatical particle/ending gears", () => {
    for (const lesson of soundsLessons) {
      for (const exampleId of referencedExampleIds(lesson)) {
        const example = examples[exampleId];
        expect(example, `${lesson.id} -> ${exampleId}`).toBeDefined();
        for (const segment of example.segments ?? []) {
          expect(
            segment.kind,
            `${lesson.id} example ${exampleId} segment "${segment.jp}" is grammatical`,
          ).toBe("word");
        }
      }
    }
  });

  it("keeps the sounds module free of any grammar gear a later module introduces", () => {
    for (const lesson of soundsLessons) {
      for (const exampleId of referencedExampleIds(lesson)) {
        const example = examples[exampleId];
        expect(example, `${lesson.id} -> ${exampleId}`).toBeDefined();
        for (const segment of example.segments ?? []) {
          const gear = segment.jp.trim();
          expect(
            PREMATURE_GRAMMAR.includes(gear),
            `${lesson.id} example ${exampleId} segment "${gear}" uses premature grammar`,
          ).toBe(false);
        }
      }
    }
  });
});

import { describe, expect, it } from "vitest";
import { courseModules } from "./course";
import { examples } from "./examples";
import type { AuthoredSelection, Lesson } from "./types";

/**
 * Prerequisite-honesty guard on the *shipped* course data (design spec
 * §2.7/§8.1, Task A/B): the orientation modules (1 = sounds, 2 = topic/copula)
 * may not silently use grammar the learner has not met yet. Object `を`, polite
 * `ます`, requests `ください`, past/negative `ました`/`ません`, and the later
 * particles `で`/`に`/`へ`/`か` are all introduced in module 3 or later, so no
 * example any module-1/2 lesson puts on screen may contain them.
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
  const [, comparison, explore] = lesson.sections;
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

describe("orientation modules never use not-yet-taught grammar (real data)", () => {
  const soundsLessons = courseModules
    .filter((courseModule) => courseModule.order === 1)
    .flatMap((courseModule) => courseModule.lessons);
  const topicLessons = courseModules
    .filter((courseModule) => courseModule.order === 2)
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

  it("keeps the topic/copula module free of module-3+ grammar", () => {
    for (const lesson of topicLessons) {
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

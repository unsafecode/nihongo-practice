/**
 * The four synthesis lessons must read as scenes, not as eight unrelated
 * utterances. Before Phase 4 each lesson cycled four speaker roles
 * mechanically (learner, friend, colleague, teacher, repeat) across
 * alternating contexts, which is why no lesson read as an exchange.
 */
import { describe, expect, it } from "vitest";

import { module15Lessons } from "./module15Synthesis";

const SYNTHESIS_IDS = ["a2-synthesis-1", "a2-synthesis-2", "a2-synthesis-3", "a2-synthesis-4"] as const;

describe("synthesis lessons are scenes", () => {
  it.each(SYNTHESIS_IDS)("%s has exactly two speakers across its models", (lessonId) => {
    const lesson = module15Lessons.find((entry) => entry.recipe.id === lessonId);
    expect(lesson, `lesson ${lessonId} not found`).toBeDefined();
    if (!lesson) return;
    const models = lesson.variants.filter((v) => v.pedagogicalUse === "model");
    const roles = new Set(models.map((v) => v.discourse.speakerRoleId));
    expect([...roles].sort()).toHaveLength(2);
  });

  it.each(SYNTHESIS_IDS)("%s never labels a scene line as casual-speech recognition", (lessonId) => {
    const lesson = module15Lessons.find((entry) => entry.recipe.id === lessonId);
    expect(lesson, `lesson ${lessonId} not found`).toBeDefined();
    if (!lesson) return;
    const models = lesson.variants.filter((v) => v.pedagogicalUse === "model");
    const misplaced = models
      .filter((v) => v.sentenceFamilyId !== "a2-family-plain-recognition")
      .filter((v) => {
        const en = lesson.en[`${v.id}-translation`] ?? "";
        const it = lesson.it[`${v.id}-translation`] ?? "";
        return /casual speech|discorso informale|parlato informale/i.test(`${en} ${it}`);
      })
      .map((v) => v.id);
    expect(misplaced).toEqual([]);
  });

  it.each(SYNTHESIS_IDS)("%s groups every casual-speech recognition item at the end", (lessonId) => {
    const lesson = module15Lessons.find((entry) => entry.recipe.id === lessonId);
    expect(lesson, `lesson ${lessonId} not found`).toBeDefined();
    if (!lesson) return;
    const models = lesson.variants.filter((v) => v.pedagogicalUse === "model");
    const flags = models.map((v) => v.sentenceFamilyId === "a2-family-plain-recognition");
    const firstRecognition = flags.indexOf(true);
    if (firstRecognition === -1) return;
    expect(flags.slice(firstRecognition).every(Boolean)).toBe(true);
  });
});

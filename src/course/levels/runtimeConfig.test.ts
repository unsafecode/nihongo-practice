import { describe, expect, it } from "vitest";
import { A1_RETAINED_MODULE_IDS } from "../a1/manifest";
import { baseCanDos } from "../base/catalog/canDos";
import { courseModulesByLevel } from "../data/course";
import { getCourseCopy } from "../i18n/catalog";
import { COURSE_LEVEL_IDS } from "./types";
import { LEVEL_RUNTIME_CONFIG } from "./runtimeConfig";

describe("LEVEL_RUNTIME_CONFIG", () => {
  it("configures each runtime level with its exact module totals", () => {
    expect(Object.keys(LEVEL_RUNTIME_CONFIG)).toEqual(COURSE_LEVEL_IDS);
    expect(LEVEL_RUNTIME_CONFIG.a0.modules).toBe(courseModulesByLevel.a0);
    expect(LEVEL_RUNTIME_CONFIG.a1.modules).toBe(courseModulesByLevel.a1);
    expect(LEVEL_RUNTIME_CONFIG.a2.modules).toBe(courseModulesByLevel.a2);
    expect(LEVEL_RUNTIME_CONFIG.a0.modules).toHaveLength(10);
    expect(LEVEL_RUNTIME_CONFIG.a1.modules).toHaveLength(11);
    expect(LEVEL_RUNTIME_CONFIG.a2.modules).toHaveLength(15);
    expect(LEVEL_RUNTIME_CONFIG.a0.modules.flatMap((module) => module.lessons)).toHaveLength(40);
    expect(LEVEL_RUNTIME_CONFIG.a1.modules.flatMap((module) => module.lessons)).toHaveLength(44);
    expect(LEVEL_RUNTIME_CONFIG.a2.modules.flatMap((module) => module.lessons)).toHaveLength(60);
  });

  it("keeps only retained authored modules and Can-dos in the A1 runtime", () => {
    expect(LEVEL_RUNTIME_CONFIG.a1.modules.map((module) => module.id)).toEqual([
      ...A1_RETAINED_MODULE_IDS,
    ]);
    const ownedLessons = new Set(
      LEVEL_RUNTIME_CONFIG.a1.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)),
    );
    expect(LEVEL_RUNTIME_CONFIG.a1.canDos).not.toHaveLength(0);
    for (const canDo of LEVEL_RUNTIME_CONFIG.a1.canDos) {
      expect(canDo.lessonIds.some((lessonId) => ownedLessons.has(lessonId))).toBe(true);
    }
    for (const baseOwnedCanDoId of [
      "a1-can-do-sounds",
      "a1-can-do-sentence-foundations",
      "a1-can-do-topic-questions",
      "a1-can-do-polite-verbs",
      "a1-can-do-time-movement",
    ]) {
      expect(LEVEL_RUNTIME_CONFIG.a1.canDos.map((canDo) => canDo.id)).not.toContain(
        baseOwnedCanDoId,
      );
    }
    const moduleIds = new Set(LEVEL_RUNTIME_CONFIG.a1.modules.map((module) => module.id));
    for (const area of LEVEL_RUNTIME_CONFIG.a1.areas) {
      expect(area.moduleIds).not.toEqual([]);
      expect(area.moduleIds.every((moduleId) => moduleIds.has(moduleId))).toBe(true);
    }
  });

  it("uses Base's authored Can-dos and resolves every configured descriptor in both locales", () => {
    expect(LEVEL_RUNTIME_CONFIG.a0.canDos).toBe(baseCanDos);
    for (const locale of ["en", "it"] as const) {
      const copy = getCourseCopy(locale);
      for (const level of COURSE_LEVEL_IDS) {
        for (const canDo of LEVEL_RUNTIME_CONFIG[level].canDos) {
          const descriptor = LEVEL_RUNTIME_CONFIG[level].resolveDescriptor(
            locale,
            canDo.descriptorCopyId,
          );
          if (level !== "a2") {
            expect(descriptor).toBe(copy.objectives[canDo.descriptorCopyId] ?? null);
          }
          expect(descriptor, `${level}:${locale}:${canDo.descriptorCopyId}`).not.toBeNull();
        }
      }
    }
    expect(LEVEL_RUNTIME_CONFIG.a0.resolveDescriptor("en", "unknown")).toBeNull();
  });

  it("provides typed navigation and checkpoint copy keys for every level", () => {
    for (const locale of ["en", "it"] as const) {
      const levelCopy = getCourseCopy(locale).courseLevels;
      for (const level of COURSE_LEVEL_IDS) {
        const config = LEVEL_RUNTIME_CONFIG[level];
        expect(levelCopy[config.copy.shortLabelKey]).not.toBe("");
        expect(levelCopy[config.copy.headingKey]).not.toBe("");
        expect(levelCopy[config.copy.badgeKey]).not.toBe("");
        expect(levelCopy[config.copy.checkpointHeadingKey]).not.toBe("");
        expect(config.checkpoint.level).toBe(level);
      }
    }
  });
});

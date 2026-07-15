import { describe, expect, it } from "vitest";
import { lessonPath } from "../../routing/routePaths";
import { courseModules } from "../data/course";
import type { CourseModule, Lesson, LessonSections } from "../data/types";
import {
  isLegacyModuleRedirectState,
  LEGACY_CHAPTER_ROUTES,
  LEGACY_MODULE_REDIRECT_STATE,
  resolveLessonRoute,
} from "./lessonRouteResolution";

function emptySections(): LessonSections {
  return [
    { id: "rule", copyId: "fixture-rule", gear: "x" },
    {
      id: "comparison",
      copyId: "fixture-comparison",
      comparison: {
        id: "fixture-cmp",
        baseExampleId: "fixture-a",
        changedExampleId: "fixture-b",
        contrastDimension: "sound",
        changedGearIds: ["x"],
        changedSegmentIds: ["s"],
      },
    },
    {
      id: "explore",
      copyId: "fixture-explore",
      exploration: {
        kind: "tool",
        data: {
          id: "fixture-expl",
          objectiveId: "fixture-obj",
          target: "syllabary",
          returnTarget: { pathname: "/percorso/mx/lx", sectionId: "explore" },
        },
      },
    },
    { id: "recap", copyId: "fixture-recap" },
  ];
}

function makeLesson(id: string, moduleId: string): Lesson {
  return {
    id,
    moduleId,
    order: 1,
    titleCopyId: id,
    objectiveCopyIds: [],
    introducedConceptIds: [],
    requiredConceptIds: [],
    estimatedMinutes: 1,
    sections: emptySections(),
  };
}

function makeModule(id: string, lessons: Lesson[]): CourseModule {
  return {
    id,
    phase: "orient",
    order: 1,
    prerequisiteIds: [],
    outcomeCopyIds: [],
    estimatedMinutes: 1,
    coverage: { verbCount: 0, vocabularyCount: 0 },
    iconId: "sounds",
    lessons,
  };
}

describe("LEGACY_CHAPTER_ROUTES", () => {
  it("contains exactly the historical chapter+lesson pairs from the Task 3 split", () => {
    expect(LEGACY_CHAPTER_ROUTES).toEqual([
      {
        chapterId: "traps",
        lessonId: "traps-particles",
        moduleId: "questions-existence",
      },
      { chapterId: "traps", lessonId: "traps-verbs", moduleId: "capstone" },
      {
        chapterId: "travel-patterns",
        lessonId: "travel-questions",
        moduleId: "questions-existence",
      },
      {
        chapterId: "travel-patterns",
        lessonId: "travel-existence",
        moduleId: "questions-existence",
      },
    ]);
  });
});

describe("resolveLessonRoute: canonical match", () => {
  it("resolves a canonical module+lesson pair normally", () => {
    const result = resolveLessonRoute("sounds", "sounds-core", courseModules);
    expect(result.kind).toBe("match");
    if (result.kind !== "match") throw new Error("expected match");
    expect(result.courseModule.id).toBe("sounds");
    expect(result.lesson.id).toBe("sounds-core");
  });
});

describe("resolveLessonRoute: legacy aliases", () => {
  it("redirects the former travel-patterns/travel-questions pair to questions-existence", () => {
    const result = resolveLessonRoute(
      "travel-patterns",
      "travel-questions",
      courseModules,
    );
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") throw new Error("expected redirect");
    expect(result.courseModule.id).toBe("questions-existence");
    expect(result.lesson.id).toBe("travel-questions");
  });

  it("redirects the former travel-patterns/travel-existence pair to questions-existence", () => {
    const result = resolveLessonRoute(
      "travel-patterns",
      "travel-existence",
      courseModules,
    );
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") throw new Error("expected redirect");
    expect(result.courseModule.id).toBe("questions-existence");
    expect(result.lesson.id).toBe("travel-existence");
  });

  // Regression: the old traps chapter was split across two modules. A
  // module-level "traps -> capstone" alias alone makes this real legacy
  // route (traps/traps-particles) wrongly invalid.
  it("redirects the former traps/traps-particles pair to questions-existence", () => {
    const result = resolveLessonRoute(
      "traps",
      "traps-particles",
      courseModules,
    );
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") throw new Error("expected redirect");
    expect(result.courseModule.id).toBe("questions-existence");
    expect(result.lesson.id).toBe("traps-particles");
  });

  it("redirects the former traps/traps-verbs pair to capstone", () => {
    const result = resolveLessonRoute(
      "traps",
      "traps-verbs",
      courseModules,
    );
    expect(result.kind).toBe("redirect");
    if (result.kind !== "redirect") throw new Error("expected redirect");
    expect(result.courseModule.id).toBe("capstone");
    expect(result.lesson.id).toBe("traps-verbs");
  });
});

describe("resolveLessonRoute: mismatches are invalid", () => {
  it("rejects a canonical module paired with a lesson from another module (the traps-verbs regression)", () => {
    const result = resolveLessonRoute("sounds", "traps-verbs", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects a legacy alias paired with a lesson outside its canonical module", () => {
    const result = resolveLessonRoute(
      "travel-patterns",
      "sounds-core",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects the traps alias paired with a lesson that moved to questions-existence, not capstone", () => {
    const result = resolveLessonRoute(
      "traps",
      "travel-questions",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });

  // Membership rejection: traps-particles now lives in questions-existence,
  // but the travel-patterns chapter never owned it -- only the traps
  // chapter did. A route map keyed by lesson id alone would wrongly accept
  // this pairing just because both legacy chapters resolve to the same
  // current module.
  it("rejects the travel-patterns alias paired with traps-particles, which travel-patterns never owned", () => {
    const result = resolveLessonRoute(
      "travel-patterns",
      "traps-particles",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects the traps alias paired with travel-existence, which traps never owned", () => {
    const result = resolveLessonRoute(
      "traps",
      "travel-existence",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });
});

describe("resolveLessonRoute: unknown segments are invalid", () => {
  it("rejects an unknown module id", () => {
    const result = resolveLessonRoute(
      "bogus-module",
      "sounds-core",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects an unknown lesson id under a real module", () => {
    const result = resolveLessonRoute("sounds", "bogus-lesson", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects an unknown lesson id even under a recognized legacy alias", () => {
    const result = resolveLessonRoute(
      "travel-patterns",
      "bogus-lesson",
      courseModules,
    );
    expect(result).toEqual({ kind: "invalid" });
  });

  it("never accepts a lesson by id alone: missing moduleId is invalid", () => {
    const result = resolveLessonRoute(undefined, "sounds-core", courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });

  it("rejects a missing lessonId", () => {
    const result = resolveLessonRoute("sounds", undefined, courseModules);
    expect(result).toEqual({ kind: "invalid" });
  });
});

describe("resolveLessonRoute: isolated fixtures (no dependency on real course data)", () => {
  it("still matches/redirects/rejects the same way against a small synthetic module set", () => {
    const modules: CourseModule[] = [
      makeModule("alpha", [makeLesson("alpha-1", "alpha")]),
      makeModule("beta", [makeLesson("beta-1", "beta")]),
    ];

    expect(resolveLessonRoute("alpha", "alpha-1", modules).kind).toBe(
      "match",
    );
    expect(resolveLessonRoute("beta", "alpha-1", modules)).toEqual({
      kind: "invalid",
    });
    expect(resolveLessonRoute("gamma", "alpha-1", modules)).toEqual({
      kind: "invalid",
    });
  });
});

describe("resolveLessonRoute: canonical redirect target/state contract", () => {
  it("provides enough data to build the canonical lessonPath for a redirect", () => {
    const result = resolveLessonRoute(
      "travel-patterns",
      "travel-questions",
      courseModules,
    );
    if (result.kind !== "redirect") throw new Error("expected redirect");
    const target = lessonPath(result.courseModule.id, result.lesson.id);
    expect(target).toBe("/percorso/questions-existence/travel-questions");
  });

  it("exposes a one-time redirect notice state marker distinguishable from any other router state", () => {
    expect(isLegacyModuleRedirectState(LEGACY_MODULE_REDIRECT_STATE)).toBe(
      true,
    );
    expect(isLegacyModuleRedirectState(null)).toBe(false);
    expect(isLegacyModuleRedirectState(undefined)).toBe(false);
    expect(isLegacyModuleRedirectState({})).toBe(false);
    expect(isLegacyModuleRedirectState({ invalidPath: "/x" })).toBe(false);
    expect(
      isLegacyModuleRedirectState({ legacyModuleRedirect: false }),
    ).toBe(false);
  });
});

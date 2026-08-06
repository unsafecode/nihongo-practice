import { describe, expect, it } from "vitest";
import { BASE_LESSON_IDS, BASE_LESSON_IDS_BY_MODULE } from "../base/manifest";
import {
  A1_RETAINED_LESSON_IDS,
  A1_RETAINED_LESSON_IDS_BY_MODULE,
} from "../a1/manifest";
import { A2_LESSON_IDS } from "../a2/manifest";
import { COURSE_LEVEL_IDS, levelParam } from "./types";
import {
  currentLessonRouteRegistry,
  lessonIdsForLevel,
  lessonOwner,
  moduleOwner,
  publishedRouteAliasRegistry,
} from "./ownership";

describe("shared course level identity", () => {
  it("exposes the three stable level ids and route params", () => {
    expect(COURSE_LEVEL_IDS).toEqual(["a0", "a1", "a2"]);
    expect(levelParam("a0")).toBe("base");
    expect(levelParam("a1")).toBe("a1");
    expect(levelParam("a2")).toBe("a2");
  });
});

describe("course ownership registry", () => {
  function currentEntries() {
    return [...currentLessonRouteRegistry.values()];
  }

  function aliasEntries() {
    return [...publishedRouteAliasRegistry.values()];
  }

  it("resolves canonical lesson and module owners without defaulting unknown ids", () => {
    expect(lessonOwner("sounds-1")).toEqual({ levelId: "a0", moduleId: "sounds" });
    expect(moduleOwner("sounds")).toBe("a0");

    expect(lessonOwner("introductions-1")).toEqual({
      levelId: "a1",
      moduleId: "introductions",
    });
    expect(moduleOwner("introductions")).toBe("a1");

    expect(lessonOwner("connected-conversation-1")).toEqual({
      levelId: "a2",
      moduleId: "connected-conversation",
    });
    expect(moduleOwner("connected-conversation")).toBe("a2");

    expect(lessonOwner("sounds-5")).toBeNull();
    expect(lessonOwner("unknown-lesson")).toBeNull();
    expect(moduleOwner("unknown-module")).toBeNull();
  });

  it("owns exactly the Base 40, retained A1 44, and A2 60 current lessons in canonical order", () => {
    expect(lessonIdsForLevel("a0")).toEqual(BASE_LESSON_IDS);
    expect(lessonIdsForLevel("a1")).toEqual(A1_RETAINED_LESSON_IDS);
    expect(lessonIdsForLevel("a2")).toEqual(A2_LESSON_IDS);

    expect(lessonIdsForLevel("a0")).toHaveLength(40);
    expect(lessonIdsForLevel("a1")).toHaveLength(44);
    expect(lessonIdsForLevel("a2")).toHaveLength(60);

    expect(currentEntries().map((entry) => entry.lessonId)).toEqual([
      ...BASE_LESSON_IDS,
      ...A1_RETAINED_LESSON_IDS,
      ...A2_LESSON_IDS,
    ]);
    expect(currentLessonRouteRegistry.size).toBe(144);
  });

  it("has no duplicate current module ids, lesson ids, or route keys", () => {
    const moduleIds = currentEntries()
      .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.moduleId === entry.moduleId) === index)
      .map((entry) => entry.moduleId);
    const lessonIds = currentEntries().map((entry) => entry.lessonId);
    const routeKeys = currentEntries().map((entry) => entry.routeKey);

    expect(new Set(moduleIds)).toHaveLength(36);
    expect(new Set(lessonIds)).toHaveLength(144);
    expect(new Set(routeKeys)).toHaveLength(144);
  });

  it("keeps Base stable modules out of retained A1 ownership", () => {
    expect(A1_RETAINED_LESSON_IDS_BY_MODULE).not.toHaveProperty("sounds");
    expect(A1_RETAINED_LESSON_IDS).not.toContain("sounds-1");
    expect(BASE_LESSON_IDS_BY_MODULE.sounds).toEqual([
      "sounds-1",
      "sounds-2",
      "sounds-3",
      "sounds-4",
    ]);
  });

  it("keeps published aliases separate and resolves every alias to a valid canonical owner", () => {
    expect(publishedRouteAliasRegistry.size).toBeGreaterThan(0);

    const currentLessonIds = new Set(currentEntries().map((entry) => entry.lessonId));
    const aliasLessonIds = aliasEntries().map((entry) => entry.aliasLessonId);
    const aliasRouteKeys = aliasEntries().map((entry) => entry.routeKey);

    expect(new Set(aliasLessonIds)).toHaveLength(aliasLessonIds.length);
    expect(new Set(aliasRouteKeys)).toHaveLength(aliasRouteKeys.length);

    for (const alias of aliasEntries()) {
      const owner = lessonOwner(alias.lessonId);
      expect(owner, alias.aliasLessonId).not.toBeNull();
      expect(alias.owner, alias.aliasLessonId).toEqual(owner);
      expect(alias.levelId, alias.aliasLessonId).toBe(owner?.levelId);
      expect(alias.moduleId, alias.aliasLessonId).toBe(owner?.moduleId);
      expect(currentLessonIds.has(alias.aliasLessonId), alias.aliasLessonId).toBe(false);
      expect(lessonOwner(alias.aliasLessonId), alias.aliasLessonId).toBeNull();
    }
  });

  it("exposes ownership registries and lookup owners through immutable runtime views", () => {
    const firstCurrent = currentLessonRouteRegistry.get("sounds-1");
    const owner = lessonOwner("sounds-1");
    const firstAlias = aliasEntries()[0];
    expect(firstCurrent).toBeDefined();
    expect(owner).toEqual({ levelId: "a0", moduleId: "sounds" });
    expect(firstAlias).toBeDefined();

    const mutableCurrent = currentLessonRouteRegistry as unknown as {
      clear?: () => void;
      delete?: (id: string) => boolean;
      set?: (id: string, value: unknown) => unknown;
    };
    const mutableAliases = publishedRouteAliasRegistry as unknown as {
      clear?: () => void;
      delete?: (id: string) => boolean;
      set?: (id: string, value: unknown) => unknown;
    };

    mutableCurrent.clear?.();
    mutableCurrent.delete?.("sounds-1");
    mutableCurrent.set?.("sounds-1", { ...firstCurrent!, moduleId: "mutated-module" });
    mutableAliases.clear?.();
    mutableAliases.delete?.(firstAlias!.aliasLessonId);
    mutableAliases.set?.(firstAlias!.aliasLessonId, { ...firstAlias!, moduleId: "mutated-module" });

    try {
      (owner as { moduleId: string } | null)!.moduleId = "mutated-module";
    } catch {
      // Frozen values may throw in strict mode; either way later reads must be stable.
    }
    try {
      (firstCurrent as { moduleId: string } | undefined)!.moduleId = "mutated-module";
    } catch {
      // Frozen values may throw in strict mode; either way later reads must be stable.
    }
    try {
      (firstAlias!.owner as { moduleId: string }).moduleId = "mutated-module";
    } catch {
      // Frozen values may throw in strict mode; either way later reads must be stable.
    }

    expect("clear" in currentLessonRouteRegistry).toBe(false);
    expect("delete" in currentLessonRouteRegistry).toBe(false);
    expect("set" in currentLessonRouteRegistry).toBe(false);
    expect("clear" in publishedRouteAliasRegistry).toBe(false);
    expect("delete" in publishedRouteAliasRegistry).toBe(false);
    expect("set" in publishedRouteAliasRegistry).toBe(false);
    expect(currentLessonRouteRegistry.size).toBe(144);
    expect(currentLessonRouteRegistry.get("sounds-1")).toEqual({
      routeKey: "sounds/sounds-1",
      levelId: "a0",
      moduleId: "sounds",
      lessonId: "sounds-1",
    });
    expect(lessonOwner("sounds-1")).toEqual({ levelId: "a0", moduleId: "sounds" });
    expect(publishedRouteAliasRegistry.get(firstAlias!.aliasLessonId)).toEqual(firstAlias);
    expect([...currentLessonRouteRegistry.keys()][0]).toBe("sounds-1");
  });
});

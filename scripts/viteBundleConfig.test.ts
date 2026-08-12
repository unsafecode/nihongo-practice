import { describe, expect, it } from "vitest";
import configFactory from "../vite.config";

async function manualChunkPartition() {
  if (typeof configFactory !== "function") {
    throw new Error("Expected Vite config factory.");
  }
  const config = await configFactory({
    command: "build",
    mode: "production",
    isSsrBuild: false,
    isPreview: false,
  });
  const output = config.build?.rollupOptions?.output;
  if (Array.isArray(output) || !output) {
    throw new Error("Expected object Rollup output config.");
  }
  const partition = output.manualChunks;
  if (typeof partition !== "function") {
    throw new Error("Expected manualChunks function.");
  }
  return partition;
}

describe("Vite bundle partitioning", () => {
  it("isolates only Base copy leaf content before fallback chunk rules", async () => {
    const partition = await manualChunkPartition();

    expect(partition("/repo/src/course/base/copy/en.ts", {} as never)).toBe(
      "course-base-copy",
    );
    expect(partition("/repo/src/course/base/copy/it.ts", {} as never)).toBe(
      "course-base-copy",
    );
    expect(partition("/repo/node_modules/react/index.js", {} as never)).toBe(
      "vendor",
    );
  });

  it("gives the Base level its own chunks, matched before the general course rules", async () => {
    const partition = await manualChunkPartition();

    // Base copy keeps its own, narrower leaf chunk.
    expect(partition("/repo/src/course/base/copy/en.ts", {} as never)).toBe(
      "course-base-copy",
    );

    // The authored lesson content — by far the largest Base subtree — is its
    // own chunk, so no single Base chunk exceeds the 500 KiB budget.
    for (const id of [
      "/repo/src/course/base/content/module01Sounds.ts",
      "/repo/src/course/base/content/module04PoliteVerbs.ts",
      "/repo/src/course/base/content/catalog.ts",
    ]) {
      expect(partition(id, {} as never), id).toBe("course-base-content");
    }

    // The shared leaf layer both content and the assembled catalog import.
    // Nothing here imports content or the assembled catalog back, which is
    // what keeps the Base chunk graph acyclic.
    for (const id of [
      "/repo/src/course/base/manifest.ts",
      "/repo/src/course/base/types.ts",
      "/repo/src/course/base/catalog/types.ts",
      "/repo/src/course/base/catalog/concepts.ts",
      "/repo/src/course/base/catalog/lexicon.ts",
      "/repo/src/course/base/catalog/firstTeach.ts",
      "/repo/src/course/base/catalog/visibleTargets.ts",
      "/repo/src/course/base/catalog/activityContracts.ts",
      "/repo/src/course/base/forms/verbForms.ts",
      "/repo/src/course/base/validation/lessonRules.ts",
      "/repo/src/course/base/audio/catalog.ts",
      "/repo/src/course/base/catalog/canDos.ts",
      "/repo/src/course/base/catalog/checkpoint.ts",
      "/repo/src/course/base/references/catalog.ts",
    ]) {
      expect(partition(id, {} as never), id).toBe("course-base-catalog");
    }

    // Everything else under `src/course/base/` lands in the Base chunk.
    for (const id of [
      "/repo/src/course/base/catalog/catalog.ts",
      "/repo/src/course/base/view/buildBaseLessonViewModel.ts",
      "/repo/src/course/base/audio/reviewLedger.ts",
    ]) {
      expect(partition(id, {} as never), id).toBe("course-base");
    }

    // Ordering: the Base rules must win before any general course rule could
    // claim a Base module (e.g. a `/src/course/` catch-all added later).
    expect(partition("/repo/src/course/a1/catalog/catalog.ts", {} as never)).toBe(
      "course-a1-catalog",
    );
    expect(partition("/repo/src/course/a2/content/catalog.ts", {} as never)).toBe(
      "course-a2-content",
    );
  });
});

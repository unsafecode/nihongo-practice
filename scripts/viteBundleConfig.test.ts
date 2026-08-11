import { describe, expect, it } from "vitest";
import configFactory from "../vite.config";

describe("Vite bundle partitioning", () => {
  it("isolates only Base copy leaf content before fallback chunk rules", async () => {
    if (typeof configFactory !== "function") {
      throw new Error("Expected Vite config factory.");
    }
    const config = await configFactory({
      command: "build",
      mode: "production",
      isSsrBuild: false,
      isPreview: false,
    });
    const manualChunks = config.build?.rollupOptions?.output;
    if (Array.isArray(manualChunks) || !manualChunks) {
      throw new Error("Expected object Rollup output config.");
    }
    const partition = manualChunks.manualChunks;
    if (typeof partition !== "function") {
      throw new Error("Expected manualChunks function.");
    }

    expect(partition("/repo/src/course/base/copy/en.ts", {} as never)).toBe(
      "course-base-copy",
    );
    expect(partition("/repo/src/course/base/copy/it.ts", {} as never)).toBe(
      "course-base-copy",
    );
    expect(
      partition("/repo/src/course/base/content/module01Sounds.ts", {} as never),
    ).toBeUndefined();
    expect(
      partition("/repo/src/course/base/audio/catalog.ts", {} as never),
    ).toBeUndefined();
    expect(partition("/repo/node_modules/react/index.js", {} as never)).toBe(
      "vendor",
    );
  });
});

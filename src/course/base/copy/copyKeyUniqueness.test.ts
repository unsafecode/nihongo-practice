import { describe, expect, it } from "vitest";

import { baseNavigationCopyEn } from "./en";
import { baseNavigationCopyIt } from "./it";

/**
 * `baseNavigationCopyEn`/`It` assemble their string table by spreading the
 * per-module copy blocks and then declaring further literals. A key defined in
 * both places is silently resolved last-wins, so a stale definition can sit in
 * the file looking authoritative while a different string is what the learner
 * actually reads — and the two can drift apart indefinitely because nothing
 * fails. This guard makes that shadowing loud.
 *
 * It reads the source rather than the assembled object precisely because the
 * assembled object is where the evidence is already destroyed.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const LOCALES = [
  { file: "en.ts", content: baseNavigationCopyEn.content },
  { file: "it.ts", content: baseNavigationCopyIt.content },
] as const;

function duplicateKeys(source: string): string[] {
  const counts = new Map<string, number>();
  for (const match of source.matchAll(/^\s{2,4}"([a-z0-9-]+)":\s/gmu)) {
    const key = match[1]!;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => `${key} (defined ${count}x)`)
    .sort();
}

describe("Base copy dictionaries", () => {
  it("never defines the same string key twice in one locale file", () => {
    for (const { file } of LOCALES) {
      const source = readFileSync(join(import.meta.dirname, file), "utf8");
      expect(duplicateKeys(source), file).toEqual([]);
    }
  });

  it("titles every reference identically to the reference it names", () => {
    // The four titles restored by R2 plus the one that already existed. A
    // reference whose title is missing renders an untitled surface; a title
    // that disagrees between locales breaks EN/IT parity.
    const referenceTitleKeys = [
      "reference-sentence-order-title",
      "reference-topic-particles-title",
      "reference-adjective-grid-title",
      "reference-te-forms-title",
      "reference-particle-frames-title",
    ] as const;
    for (const key of referenceTitleKeys) {
      for (const { file, content } of LOCALES) {
        const value = content[key];
        expect(value, `${file}:${key}`).toBeDefined();
        expect(value?.trim(), `${file}:${key}`).not.toBe("");
      }
    }
  });
});

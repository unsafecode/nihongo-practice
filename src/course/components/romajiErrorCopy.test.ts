import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `RomajiSequence` renders its `errorText` inside a `role="alert"` *in place
 * of* the Japanese it failed to assemble. Passing anything other than the
 * dedicated formatting-error copy therefore substitutes unrelated prose for a
 * sentence the learner is being asked to read or say — a plausible-looking
 * string that silently misrepresents the content instead of reporting a
 * failure. The error path is unreachable with valid catalog data, so this
 * invariant is enforced at every call site rather than at runtime.
 */

const COMPONENT_ROOT = join(import.meta.dirname, "..", "..");

function tsxFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (entry === "node_modules") continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      found.push(...tsxFiles(path));
    } else if (entry.endsWith(".tsx") && !entry.includes(".test.")) {
      found.push(path);
    }
  }
  return found;
}

describe("RomajiSequence error copy", () => {
  it("is the dedicated formatting-error string at every call site", () => {
    const offenders: string[] = [];
    let callSites = 0;
    for (const file of tsxFiles(COMPONENT_ROOT)) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/errorText=\{([^}]+)\}/g)) {
        callSites += 1;
        const expression = match[1]!.trim();
        const accepted =
          expression === "errorText" ||
          expression.endsWith("contentFormattingError") ||
          expression.endsWith("errorText");
        if (!accepted) {
          offenders.push(`${file.slice(COMPONENT_ROOT.length + 1)}: errorText={${expression}}`);
        }
      }
    }
    expect(callSites).toBeGreaterThan(1);
    expect(offenders).toEqual([]);
  });
});

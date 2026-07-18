import { describe, expect, it } from "vitest";
import { A2_RELEASE_CATALOG_VERSION, A2_RELEASE_SEED } from "./releaseIdentity";

/**
 * The single source of truth for the A2 release's deterministic selection
 * identity (Phase 3 Task 1). There is no validator/runtime yet to compare
 * against — this suite only proves the two constants exist as the exact,
 * stable literal values later tasks (the release validator, the runtime
 * lesson-view builder) must both import from here rather than redeclare, so
 * they can never silently drift apart the way A1's did before its own
 * `releaseIdentity` module existed.
 */
describe("A2 release identity", () => {
  it("exports the exact stable catalog version literal", () => {
    expect(A2_RELEASE_CATALOG_VERSION).toBe("a2-release-v1");
  });

  it("exports the exact stable seed literal", () => {
    expect(A2_RELEASE_SEED).toBe("a2-release-seed-v1");
  });

  it("keeps both identifiers distinct from each other", () => {
    expect(A2_RELEASE_CATALOG_VERSION).not.toBe(A2_RELEASE_SEED);
  });
});

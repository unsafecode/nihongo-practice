import { describe, expect, it } from "vitest";
import { BASE_RELEASE_CATALOG_VERSION, BASE_RELEASE_SEED } from "./releaseIdentity";

describe("Base release identity", () => {
  it("locks the immutable Base release catalog version and seed", () => {
    expect(BASE_RELEASE_CATALOG_VERSION).toBe("base-release-v1");
    expect(BASE_RELEASE_SEED).toBe("base-release-seed-v1");
  });
});

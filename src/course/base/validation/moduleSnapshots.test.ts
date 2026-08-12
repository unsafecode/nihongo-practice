import { expect, it } from "vitest";
import { ownDataArraySnapshot } from "./moduleSnapshots";

it("rejects symbol metadata on arrays before snapshotting module input", () => {
  const value = ["lesson"];
  Object.defineProperty(value, Symbol("hidden"), {
    value: "hostile",
  });

  expect(ownDataArraySnapshot(value)).toBeUndefined();
});

import { expect, it } from "vitest";
import { realizeIAdjectiveAttributive } from "./adjectiveForms";

it("generates the canonical i-adjective attributive without a copula", () => {
  const result = realizeIAdjectiveAttributive("adjective-oishii");
  expect(result).toMatchObject({ ok: true });
  if (!result.ok) return;
  expect(result.value.map(({ jp }) => jp).join("")).toBe("おいしい");
});

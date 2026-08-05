import { describe, expect, it } from "vitest";

import { A1_COMPLEMENT_GLOSS, A1_OBJECT_GLOSS } from "./a1CopyGloss";

describe("A1 copy glosses", () => {
  it("keeps name as an object-only gloss, not a copular complement", () => {
    expect(A1_OBJECT_GLOSS["a1-value-obj-name"]).toEqual({
      en: "a name",
      it: "un nome",
    });
    expect(A1_COMPLEMENT_GLOSS).not.toHaveProperty("a1-value-obj-name");
  });
});

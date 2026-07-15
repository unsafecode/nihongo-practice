import { describe, expect, it } from "vitest";
import { examples } from "./examples";
import { genericPersonas, validateRuntimeAliases } from "./personas";
import { en as enCopy } from "../i18n/en";
import { it as itCopy } from "../i18n/it";

describe("generic personas", () => {
  it("provides stable Yuki, Ken, and Mina identities", () => {
    expect(genericPersonas.map(({ id }) => id)).toEqual(["yuki", "ken", "mina"]);
  });

  it("rejects normalized legacy aliases", () => {
    expect(validateRuntimeAliases(["Ric" + "chi", "り" + "っち"])).toEqual([
      "forbidden-latin-alias",
      "forbidden-kana-alias",
    ]);
  });

  it("finds no legacy alias in assembled runtime content", () => {
    expect(validateRuntimeAliases([examples, itCopy, enCopy])).toEqual([]);
  });
});

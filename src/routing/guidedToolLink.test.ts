import { describe, expect, it } from "vitest";
import { lessonPath, routePaths } from "./routePaths";
import {
  GUIDED_RETURN_PARAM,
  buildGuidedToolHref,
  parseGuidedReturnValue,
  readGuidedReturn,
} from "./guidedToolLink";

const soundsReturn = {
  pathname: lessonPath("sounds", "sounds-core"),
  sectionId: "explore" as const,
};

function searchOf(href: string): URLSearchParams {
  const query = href.includes("?") ? href.slice(href.indexOf("?") + 1) : "";
  return new URLSearchParams(query);
}

describe("guided tool link contract: the single return param", () => {
  it("owns exactly one return query key", () => {
    expect(GUIDED_RETURN_PARAM).toBe("from");
  });
});

describe("buildGuidedToolHref (deterministic round trip through HashRouter)", () => {
  it("carries a lesson explore return exactly, for the syllabary tool", () => {
    const { href, returnResult } = buildGuidedToolHref(
      routePaths.syllabary,
      new URLSearchParams({ group: "gojuon" }),
      soundsReturn,
    );
    expect(returnResult.valid).toBe(true);
    expect(href).toBe(
      "/pratica/sillabario?group=gojuon&from=%2Fpercorso%2Fsounds%2Fsounds-core%23explore",
    );

    const back = readGuidedReturn(searchOf(href));
    expect(back).toEqual({
      status: "valid",
      target: { pathname: "/percorso/sounds/sounds-core", search: "", sectionId: "explore" },
      href: "/percorso/sounds/sounds-core#explore",
    });
  });

  it("carries a lesson explore return exactly, for the lab tool", () => {
    const { href } = buildGuidedToolHref(
      routePaths.lab,
      new URLSearchParams({ scenario: "eat", form: "past" }),
      { pathname: lessonPath("time", "time-past"), sectionId: "explore" },
    );
    expect(href).toContain("scenario=eat");
    expect(href).toContain("from=%2Fpercorso%2Ftime%2Ftime-past%23explore");
    const back = readGuidedReturn(searchOf(href));
    expect(back.status).toBe("valid");
    if (back.status === "valid") {
      expect(back.href).toBe("/percorso/time/time-past#explore");
    }
  });

  it("omits the return (never silently falls back to home) when the return input is invalid", () => {
    const { href, returnResult } = buildGuidedToolHref(
      routePaths.syllabary,
      new URLSearchParams({ group: "gojuon" }),
      { pathname: "https://evil.example.com", sectionId: null },
    );
    expect(returnResult.valid).toBe(false);
    expect(href).toBe("/pratica/sillabario?group=gojuon");
    expect(href).not.toContain("from=");
  });
});

describe("readGuidedReturn / parseGuidedReturnValue", () => {
  it("reports absent when no return is present", () => {
    expect(parseGuidedReturnValue(null)).toEqual({ status: "absent" });
    expect(readGuidedReturn(new URLSearchParams("group=gojuon"))).toEqual({
      status: "absent",
    });
  });

  it("accepts a legacy pathname-only return (returns to lesson top)", () => {
    const parsed = parseGuidedReturnValue("/percorso/sounds/sounds-core");
    expect(parsed).toEqual({
      status: "valid",
      target: { pathname: "/percorso/sounds/sounds-core", search: "", sectionId: null },
      href: "/percorso/sounds/sounds-core",
    });
  });

  it("rejects external, protocol-relative, malformed, unknown, and bad-section returns", () => {
    for (const raw of [
      "https://evil.example.com",
      "//evil.example.com",
      "/percorso/%",
      "/frasario/../../etc",
      "/percorso/sounds/sounds-core#nope",
      "/pratica/sillabario#explore",
    ]) {
      const parsed = parseGuidedReturnValue(raw);
      expect(parsed.status, raw).toBe("invalid");
      if (parsed.status === "invalid") {
        expect(parsed.fallback.pathname).toBe(routePaths.course);
      }
    }
  });

  it("rejects a duplicated return param rather than trusting one of two", () => {
    const params = new URLSearchParams();
    params.append("from", "/percorso/sounds/sounds-core#explore");
    params.append("from", "/percorso/actions/actions-object#explore");
    const parsed = readGuidedReturn(params);
    expect(parsed.status).toBe("invalid");
    if (parsed.status === "invalid") {
      expect(parsed.reason).toBe("duplicate");
    }
  });
});

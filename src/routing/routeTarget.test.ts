import { describe, expect, it } from "vitest";
import {
  createRouteTarget,
  FALLBACK_ROUTE_TARGET,
  isCourseLessonPathname,
  isKnownRoutePathname,
  parseRouteTarget,
  serializeRouteTarget,
  type RouteTarget,
} from "./routeTarget";

describe("isKnownRoutePathname / isCourseLessonPathname", () => {
  it("recognizes every existing static route", () => {
    expect(isKnownRoutePathname("/percorso")).toBe(true);
    expect(isKnownRoutePathname("/pratica")).toBe(true);
    expect(isKnownRoutePathname("/pratica/laboratorio")).toBe(true);
    expect(isKnownRoutePathname("/pratica/sillabario")).toBe(true);
    expect(isKnownRoutePathname("/frasario")).toBe(true);
  });

  it("recognizes well-formed course lesson pathnames", () => {
    expect(isCourseLessonPathname("/percorso/sounds/sounds-core")).toBe(true);
    expect(isKnownRoutePathname("/percorso/sounds/sounds-core")).toBe(true);
  });

  it("rejects malformed course lesson pathnames", () => {
    expect(isCourseLessonPathname("/percorso/sounds")).toBe(false);
    expect(isCourseLessonPathname("/percorso/sounds/sounds-core/extra")).toBe(
      false,
    );
    expect(isCourseLessonPathname("/percorso//sounds-core")).toBe(false);
    expect(isCourseLessonPathname("/percorso/SOUNDS/sounds-core")).toBe(
      false,
    );
  });
});

describe("parseRouteTarget: safety rejection", () => {
  it("rejects absolute URLs", () => {
    const result = parseRouteTarget("https://evil.example/percorso");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsafe-path");
    expect(result.target).toEqual(FALLBACK_ROUTE_TARGET);
  });

  it("rejects bare protocols with no leading slash", () => {
    const result = parseRouteTarget("javascript:alert(1)");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsafe-path");
  });

  it("rejects protocol-relative paths", () => {
    const result = parseRouteTarget("//evil.example/percorso");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsafe-path");
  });

  it("rejects raw backslash bypass attempts", () => {
    const result = parseRouteTarget("/\\evil.example");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsafe-path");
  });

  it("rejects percent-encoded protocol-relative bypasses", () => {
    const result = parseRouteTarget("/%2F%2Fevil.example");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsafe-path");
  });

  it("rejects percent-encoded backslash bypasses", () => {
    const result = parseRouteTarget("/%5Cevil.example");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsafe-path");
  });

  it("rejects malformed percent-encoding", () => {
    const result = parseRouteTarget("/percorso/%E0%A4%A");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsafe-path");
  });

  it("rejects a relative path with no leading slash", () => {
    const result = parseRouteTarget("percorso/sounds/sounds-core");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsafe-path");
  });

  it("rejects empty and non-string input", () => {
    expect(parseRouteTarget("").valid).toBe(false);
    // @ts-expect-error deliberate runtime misuse
    expect(parseRouteTarget(null).valid).toBe(false);
  });
});

describe("parseRouteTarget: route recognition", () => {
  it("rejects unsupported routes", () => {
    const result = parseRouteTarget("/not-a-real-route");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unknown-route");
    expect(result.target).toEqual(FALLBACK_ROUTE_TARGET);
  });

  it("rejects the bare root, which is only a redirect entry", () => {
    const result = parseRouteTarget("/");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unknown-route");
  });

  it("rejects malformed course lesson paths with a specific reason", () => {
    expect(parseRouteTarget("/percorso/sounds").reason).toBe(
      "malformed-lesson-path",
    );
    expect(
      parseRouteTarget("/percorso/sounds/sounds-core/extra").reason,
    ).toBe("malformed-lesson-path");
    expect(parseRouteTarget("/percorso/SOUNDS/sounds-core").reason).toBe(
      "malformed-lesson-path",
    );
  });

  it("accepts every known static route with no section anchor", () => {
    for (const pathname of [
      "/percorso",
      "/pratica",
      "/pratica/laboratorio",
      "/pratica/sillabario",
      "/frasario",
    ]) {
      const result = parseRouteTarget(pathname);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeNull();
      expect(result.target).toEqual({
        pathname,
        search: "",
        sectionId: null,
      });
    }
  });
});

describe("parseRouteTarget: lesson section anchors", () => {
  it("accepts a valid lesson section anchor on a course lesson route", () => {
    const result = parseRouteTarget(
      "/percorso/sounds/sounds-core#explore",
    );
    expect(result.valid).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.target).toEqual({
      pathname: "/percorso/sounds/sounds-core",
      search: "",
      sectionId: "explore",
    });
  });

  it("preserves query information alongside a section anchor", () => {
    const result = parseRouteTarget(
      "/percorso/sounds/sounds-core?ref=lab#explore",
    );
    expect(result.valid).toBe(true);
    expect(result.target).toEqual({
      pathname: "/percorso/sounds/sounds-core",
      search: "?ref=lab",
      sectionId: "explore",
    });
  });

  it("rejects an unknown/invalid section id", () => {
    const result = parseRouteTarget(
      "/percorso/sounds/sounds-core#bogus",
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid-section");
    expect(result.target).toEqual(FALLBACK_ROUTE_TARGET);
  });

  it("rejects duplicated/garbled section fragments", () => {
    const result = parseRouteTarget(
      "/percorso/sounds/sounds-core#explore#recap",
    );
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid-section");
  });

  it("rejects a section anchor on a route that is not a course lesson", () => {
    const result = parseRouteTarget("/pratica#explore");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("section-not-allowed");
    expect(result.target).toEqual(FALLBACK_ROUTE_TARGET);
  });

  it("treats a bare trailing hash as no section requested", () => {
    const result = parseRouteTarget("/percorso/sounds/sounds-core#");
    expect(result.valid).toBe(true);
    expect(result.target.sectionId).toBeNull();
  });
});

describe("parseRouteTarget: compatibility with existing Lab `from` values", () => {
  it("parses a plain pathname-only course lesson path with no anchor", () => {
    const result = parseRouteTarget("/percorso/sentence-map/sentence-order");
    expect(result.valid).toBe(true);
    expect(result.target).toEqual({
      pathname: "/percorso/sentence-map/sentence-order",
      search: "",
      sectionId: null,
    });
  });
});

describe("createRouteTarget", () => {
  it("builds a valid target from structured input", () => {
    const result = createRouteTarget({
      pathname: "/percorso/sounds/sounds-core",
      sectionId: "recap",
    });
    expect(result.valid).toBe(true);
    expect(result.target).toEqual({
      pathname: "/percorso/sounds/sounds-core",
      search: "",
      sectionId: "recap",
    });
  });

  it("defaults search to empty and sectionId to null", () => {
    const result = createRouteTarget({ pathname: "/frasario" });
    expect(result.target).toEqual({
      pathname: "/frasario",
      search: "",
      sectionId: null,
    });
  });

  it("rejects a section id on a non-lesson route", () => {
    const result = createRouteTarget({
      pathname: "/pratica/sillabario",
      sectionId: "rule",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("section-not-allowed");
  });

  it("rejects an invalid section id even when supplied programmatically", () => {
    const result = createRouteTarget({
      pathname: "/percorso/sounds/sounds-core",
      // @ts-expect-error deliberate runtime misuse
      sectionId: "not-a-real-section",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("invalid-section");
  });

  it("rejects an unsafe pathname", () => {
    const result = createRouteTarget({ pathname: "//evil.example" });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unsafe-path");
  });
});

describe("serializeRouteTarget", () => {
  it("serializes a plain route with no search or section", () => {
    const target: RouteTarget = {
      pathname: "/percorso",
      search: "",
      sectionId: null,
    };
    expect(serializeRouteTarget(target)).toBe("/percorso");
  });

  it("serializes a lesson route with a section anchor", () => {
    const target: RouteTarget = {
      pathname: "/percorso/sounds/sounds-core",
      search: "",
      sectionId: "explore",
    };
    expect(serializeRouteTarget(target)).toBe(
      "/percorso/sounds/sounds-core#explore",
    );
  });

  it("round-trips through parseRouteTarget", () => {
    const target: RouteTarget = {
      pathname: "/percorso/sounds/sounds-core",
      search: "?ref=lab",
      sectionId: "recap",
    };
    const serialized = serializeRouteTarget(target);
    const parsed = parseRouteTarget(serialized);
    expect(parsed.valid).toBe(true);
    expect(parsed.target).toEqual(target);
  });

  it("round-trips a legacy pathname-only value unchanged", () => {
    const pathname = "/percorso/sentence-map/sentence-order";
    const target: RouteTarget = { pathname, search: "", sectionId: null };
    expect(serializeRouteTarget(target)).toBe(pathname);
  });
});

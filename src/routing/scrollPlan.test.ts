import { describe, expect, it } from "vitest";
import {
  planRouteScroll,
  resolveScrollBehavior,
  resolveScrollOutcome,
} from "./scrollPlan";
import { lessonSectionAnchorId } from "./lessonSections";

describe("planRouteScroll", () => {
  it("plans a deterministic top reset for an ordinary route change", () => {
    expect(
      planRouteScroll({ pathname: "/percorso", search: "", hash: "" }),
    ).toEqual({ kind: "reset" });
  });

  it("plans a top reset when the location carries no anchor", () => {
    expect(
      planRouteScroll({
        pathname: "/percorso/sounds/sounds-core",
        search: "",
        hash: "",
      }),
    ).toEqual({ kind: "reset" });
  });

  it("plans an anchor scroll for a validated lesson section anchor", () => {
    expect(
      planRouteScroll({
        pathname: "/percorso/sounds/sounds-core",
        search: "",
        hash: "#explore",
      }),
    ).toEqual({
      kind: "anchor",
      sectionId: "explore",
      anchorId: lessonSectionAnchorId("explore"),
    });
  });

  it("preserves search alongside an anchor plan without affecting the plan shape", () => {
    expect(
      planRouteScroll({
        pathname: "/percorso/sounds/sounds-core",
        search: "?ref=lab",
        hash: "#recap",
      }),
    ).toEqual({
      kind: "anchor",
      sectionId: "recap",
      anchorId: lessonSectionAnchorId("recap"),
    });
  });

  it("plans a top reset when the anchor is invalid", () => {
    expect(
      planRouteScroll({
        pathname: "/percorso/sounds/sounds-core",
        search: "",
        hash: "#bogus",
      }),
    ).toEqual({ kind: "reset" });
  });

  it("plans a top reset when the anchor is on a route that cannot carry one", () => {
    expect(
      planRouteScroll({ pathname: "/pratica", search: "", hash: "#explore" }),
    ).toEqual({ kind: "reset" });
  });

  it("plans a top reset for an unrecognized route regardless of hash", () => {
    expect(
      planRouteScroll({
        pathname: "/not-a-real-route",
        search: "",
        hash: "#explore",
      }),
    ).toEqual({ kind: "reset" });
  });
});

describe("resolveScrollOutcome", () => {
  it("reports reset for a reset plan", () => {
    expect(resolveScrollOutcome({ kind: "reset" }, false)).toEqual({
      status: "reset",
    });
    expect(resolveScrollOutcome({ kind: "reset" }, true)).toEqual({
      status: "reset",
    });
  });

  it("reports anchored when the anchor plan's element exists", () => {
    const plan = {
      kind: "anchor" as const,
      sectionId: "explore" as const,
      anchorId: lessonSectionAnchorId("explore"),
    };
    expect(resolveScrollOutcome(plan, true)).toEqual({
      status: "anchored",
      anchorId: plan.anchorId,
    });
  });

  it("reports anchor-missing (not a silent success) when the element is absent", () => {
    const plan = {
      kind: "anchor" as const,
      sectionId: "recap" as const,
      anchorId: lessonSectionAnchorId("recap"),
    };
    expect(resolveScrollOutcome(plan, false)).toEqual({
      status: "anchor-missing",
      anchorId: plan.anchorId,
    });
  });
});

describe("resolveScrollBehavior", () => {
  it("uses smooth scrolling when the user has no reduced-motion preference", () => {
    expect(resolveScrollBehavior(false)).toBe("smooth");
  });

  it("disables smooth scrolling under a reduced-motion preference", () => {
    expect(resolveScrollBehavior(true)).toBe("auto");
  });
});

import { describe, expect, it } from "vitest";
import { readGuidedReturn } from "../routing/guidedToolLink";
import {
  SYLLABARY_GROUP_IDS,
  SYLLABARY_GROUP_PARAM,
  buildSyllabaryDeepLink,
  isSyllabaryGroupId,
  parseSyllabaryGroup,
  planSyllabaryScroll,
  resolveSyllabaryScrollOutcome,
  scheduleGroupScroll,
  syllabaryGroupDomId,
  syllabaryGroupHeadingId,
  type FrameScheduler,
} from "./groups";

describe("syllabary group ids", () => {
  it("declares exactly the four authored group ids in order", () => {
    expect(SYLLABARY_GROUP_IDS).toEqual([
      "gojuon",
      "dakuten",
      "yoon",
      "special-notes",
    ]);
  });

  it("guards membership with a type predicate", () => {
    expect(isSyllabaryGroupId("gojuon")).toBe(true);
    expect(isSyllabaryGroupId("special-notes")).toBe(true);
    expect(isSyllabaryGroupId("GOJUON")).toBe(false);
    expect(isSyllabaryGroupId("kanji")).toBe(false);
    expect(isSyllabaryGroupId("")).toBe(false);
  });

  it("builds stable, unique DOM and heading ids per group", () => {
    expect(syllabaryGroupDomId("gojuon")).toBe("syllabary-group-gojuon");
    expect(syllabaryGroupHeadingId("special-notes")).toBe(
      "syllabary-group-special-notes-heading",
    );
    const domIds = SYLLABARY_GROUP_IDS.map(syllabaryGroupDomId);
    expect(new Set(domIds).size).toBe(domIds.length);
  });
});

describe("parseSyllabaryGroup", () => {
  it("is absent when no group is present", () => {
    expect(parseSyllabaryGroup(new URLSearchParams())).toEqual({
      status: "absent",
    });
    expect(parseSyllabaryGroup(new URLSearchParams("group="))).toEqual({
      status: "absent",
    });
  });

  it("accepts each valid group", () => {
    for (const group of SYLLABARY_GROUP_IDS) {
      expect(
        parseSyllabaryGroup(new URLSearchParams(`${SYLLABARY_GROUP_PARAM}=${group}`)),
      ).toEqual({ status: "valid", group });
    }
  });

  it("rejects an unknown group value", () => {
    expect(parseSyllabaryGroup(new URLSearchParams("group=kanji"))).toEqual({
      status: "invalid",
      reason: "unknown-group",
    });
  });

  it("rejects a duplicated group key rather than trusting one", () => {
    expect(
      parseSyllabaryGroup(new URLSearchParams("group=gojuon&group=yoon")),
    ).toEqual({ status: "invalid", reason: "duplicate" });
  });
});

describe("buildSyllabaryDeepLink", () => {
  it("round-trips a group with an exact lesson explore return", () => {
    const { href, returnResult } = buildSyllabaryDeepLink("gojuon", {
      pathname: "/percorso/sounds/sounds-core",
      sectionId: "explore",
    });
    expect(href).toBe(
      "/pratica/sillabario?group=gojuon&from=%2Fpercorso%2Fsounds%2Fsounds-core%23explore",
    );
    expect(returnResult.valid).toBe(true);

    const params = new URLSearchParams(href.split("?")[1]);
    expect(parseSyllabaryGroup(params)).toEqual({
      status: "valid",
      group: "gojuon",
    });
    const back = readGuidedReturn(params);
    expect(back.status).toBe("valid");
    if (back.status === "valid") {
      expect(back.href).toBe("/percorso/sounds/sounds-core#explore");
    }
  });

  it("keeps the group but omits an invalid return, never a wrong one", () => {
    const { href, returnResult } = buildSyllabaryDeepLink("special-notes", {
      pathname: "https://evil.example.com",
      sectionId: "explore",
    });
    expect(href).toBe("/pratica/sillabario?group=special-notes");
    expect(returnResult.valid).toBe(false);
    expect(href).not.toContain("from=");
  });
});

describe("planSyllabaryScroll", () => {
  it("targets the requested group with its stable ids", () => {
    expect(planSyllabaryScroll({ status: "valid", group: "yoon" })).toEqual({
      kind: "target",
      group: "yoon",
      domId: "syllabary-group-yoon",
      headingId: "syllabary-group-yoon-heading",
    });
  });

  it("does nothing for absent or invalid selections", () => {
    expect(planSyllabaryScroll({ status: "absent" })).toEqual({ kind: "none" });
    expect(
      planSyllabaryScroll({ status: "invalid", reason: "unknown-group" }),
    ).toEqual({ kind: "none" });
  });
});

describe("resolveSyllabaryScrollOutcome", () => {
  it("focuses an existing target, reports a missing one honestly, idles otherwise", () => {
    const plan = planSyllabaryScroll({ status: "valid", group: "dakuten" });
    expect(resolveSyllabaryScrollOutcome(plan, true)).toEqual({
      status: "focused",
      domId: "syllabary-group-dakuten",
    });
    expect(resolveSyllabaryScrollOutcome(plan, false)).toEqual({
      status: "target-missing",
      domId: "syllabary-group-dakuten",
    });
    expect(resolveSyllabaryScrollOutcome({ kind: "none" }, true)).toEqual({
      status: "idle",
    });
  });
});

describe("scheduleGroupScroll", () => {
  function fakeScheduler() {
    const frames: Array<{ id: number; cb: () => void }> = [];
    let next = 1;
    let cancelled: number | null = null;
    const scheduler: FrameScheduler = {
      request(cb) {
        const id = next++;
        frames.push({ id, cb });
        return id;
      },
      cancel(id) {
        cancelled = id;
        const index = frames.findIndex((frame) => frame.id === id);
        if (index !== -1) frames.splice(index, 1);
      },
    };
    return {
      scheduler,
      flush() {
        const pending = frames.shift();
        pending?.cb();
      },
      get cancelled() {
        return cancelled;
      },
    };
  }

  it("runs the work when the frame fires", () => {
    const fake = fakeScheduler();
    let ran = false;
    scheduleGroupScroll(fake.scheduler, () => {
      ran = true;
    });
    expect(ran).toBe(false);
    fake.flush();
    expect(ran).toBe(true);
  });

  it("cancels the pending frame when cleaned up before it fires", () => {
    const fake = fakeScheduler();
    let ran = false;
    const cleanup = scheduleGroupScroll(fake.scheduler, () => {
      ran = true;
    });
    cleanup();
    expect(fake.cancelled).toBe(1);
    fake.flush();
    expect(ran).toBe(false);
  });

  it("cleanup after the frame fired is a harmless no-op", () => {
    const fake = fakeScheduler();
    const cleanup = scheduleGroupScroll(fake.scheduler, () => {});
    fake.flush();
    cleanup();
    expect(fake.cancelled).toBeNull();
  });
});

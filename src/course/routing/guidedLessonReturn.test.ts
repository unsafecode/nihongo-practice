import { describe, expect, it } from "vitest";
import { courseModules } from "../data/course";
import {
  parseGuidedReturnValue,
  readGuidedReturn,
} from "../../routing/guidedToolLink";
import {
  validateGuidedLessonReturn,
  validateGuidedLessonReturnWith,
} from "./guidedLessonReturn";

/**
 * The guided-return layer must validate the *course* association of a lesson
 * `from`, not merely its `/percorso/<seg>/<seg>` shape. A canonical module
 * paired with a lesson it does not own (e.g. `sounds` + `actions-1`) is a
 * crafted target that would otherwise be shown as a normal return Action and
 * then land on InvalidRoute. A retired v2.1 lesson id (`sentence-order`) is
 * canonicalized to its current lesson instead.
 */

const soundsFirst = "/percorso/sounds/sounds-1";

describe("validateGuidedLessonReturn (pure course-association check)", () => {
  it("keeps a canonical match target unchanged", () => {
    const check = validateGuidedLessonReturn({
      pathname: soundsFirst,
      search: "",
      sectionId: "explore",
    });
    expect(check).toEqual({ kind: "ok" });
  });

  it("rejects a canonical module paired with a lesson it does not own", () => {
    const check = validateGuidedLessonReturn({
      pathname: "/percorso/sounds/actions-1",
      search: "",
      sectionId: "explore",
    });
    expect(check).toEqual({ kind: "mismatch" });
  });

  it("rejects an unknown lesson under a real module", () => {
    const check = validateGuidedLessonReturn({
      pathname: "/percorso/sounds/nope",
      search: "",
      sectionId: null,
    });
    expect(check).toEqual({ kind: "mismatch" });
  });

  it("canonicalizes a retired v2.1 lesson return to its current module/lesson", () => {
    expect(
      validateGuidedLessonReturn({
        pathname: "/percorso/sentence-map/sentence-order",
        search: "",
        sectionId: "explore",
      }),
    ).toEqual({
      kind: "canonical",
      target: {
        pathname: "/percorso/introductions/introductions-1",
        search: "",
        sectionId: "explore",
      },
    });

    expect(
      validateGuidedLessonReturn({
        pathname: "/percorso/capstone/traps-verbs",
        search: "",
        sectionId: "explore",
      }),
    ).toEqual({
      kind: "canonical",
      target: {
        pathname: "/percorso/capstones/capstones-3",
        search: "",
        sectionId: "explore",
      },
    });
  });

  it("canonicalizes an even-older chapter url form of a retired lesson", () => {
    expect(
      validateGuidedLessonReturn({
        pathname: "/percorso/traps/traps-verbs",
        search: "",
        sectionId: "explore",
      }),
    ).toEqual({
      kind: "canonical",
      target: {
        pathname: "/percorso/capstones/capstones-3",
        search: "",
        sectionId: "explore",
      },
    });
  });

  it("preserves a pathname-only legacy return as return-to-top after canonicalization", () => {
    const check = validateGuidedLessonReturnWith(courseModules)({
      pathname: "/percorso/capstone/traps-verbs",
      search: "",
      sectionId: null,
    });
    expect(check).toEqual({
      kind: "canonical",
      target: {
        pathname: "/percorso/capstones/capstones-3",
        search: "",
        sectionId: null,
      },
    });
  });
});

describe("parseGuidedReturnValue with course validation", () => {
  it("flags a canonical mismatch as invalid module-lesson-mismatch, never a link", () => {
    const parsed = parseGuidedReturnValue(
      "/percorso/sounds/actions-1#explore",
      validateGuidedLessonReturn,
    );
    expect(parsed).toEqual({
      status: "invalid",
      reason: "module-lesson-mismatch",
      fallback: { pathname: "/percorso", search: "", sectionId: null },
    });
  });

  it("canonicalizes a legacy redirect return to the current module, preserving the anchor", () => {
    const parsed = parseGuidedReturnValue(
      "/percorso/capstone/traps-verbs#explore",
      validateGuidedLessonReturn,
    );
    expect(parsed).toEqual({
      status: "valid",
      target: {
        pathname: "/percorso/capstones/capstones-3",
        search: "",
        sectionId: "explore",
      },
      href: "/percorso/capstones/capstones-3#explore",
    });
  });

  it("keeps a canonical match valid and unchanged", () => {
    const parsed = parseGuidedReturnValue(
      `${soundsFirst}#explore`,
      validateGuidedLessonReturn,
    );
    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.href).toBe(`${soundsFirst}#explore`);
    }
  });

  it("does not surface a second redirect: the canonical href is already the current module", () => {
    const parsed = readGuidedReturn(
      new URLSearchParams(
        "from=%2Fpercorso%2Fquestions-existence%2Ftravel-questions%23explore",
      ),
      validateGuidedLessonReturn,
    );
    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.href).toBe(
        "/percorso/essential-questions/essential-questions-1#explore",
      );
    }
  });
});

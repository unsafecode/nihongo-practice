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
 * paired with a lesson it does not own (e.g. `sounds` + `traps-verbs`) is a
 * crafted target that would otherwise be shown as a normal return Action and
 * then land on InvalidRoute.
 */

const soundsCore = "/percorso/sounds/sounds-core";

describe("validateGuidedLessonReturn (pure course-association check)", () => {
  it("keeps a canonical match target unchanged", () => {
    const check = validateGuidedLessonReturn({
      pathname: soundsCore,
      search: "",
      sectionId: "explore",
    });
    expect(check).toEqual({ kind: "ok" });
  });

  it("rejects a canonical module paired with a lesson it does not own", () => {
    const check = validateGuidedLessonReturn({
      pathname: "/percorso/sounds/traps-verbs",
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

  it("canonicalizes both split legacy `traps` chapter pairs", () => {
    expect(
      validateGuidedLessonReturn({
        pathname: "/percorso/traps/traps-particles",
        search: "",
        sectionId: "explore",
      }),
    ).toEqual({
      kind: "canonical",
      target: {
        pathname: "/percorso/questions-existence/traps-particles",
        search: "",
        sectionId: "explore",
      },
    });

    expect(
      validateGuidedLessonReturn({
        pathname: "/percorso/traps/traps-verbs",
        search: "",
        sectionId: "explore",
      }),
    ).toEqual({
      kind: "canonical",
      target: {
        pathname: "/percorso/capstone/traps-verbs",
        search: "",
        sectionId: "explore",
      },
    });
  });

  it("canonicalizes both legacy `travel-patterns` chapter pairs", () => {
    expect(
      validateGuidedLessonReturn({
        pathname: "/percorso/travel-patterns/travel-questions",
        search: "",
        sectionId: "explore",
      }),
    ).toEqual({
      kind: "canonical",
      target: {
        pathname: "/percorso/questions-existence/travel-questions",
        search: "",
        sectionId: "explore",
      },
    });

    expect(
      validateGuidedLessonReturn({
        pathname: "/percorso/travel-patterns/travel-existence",
        search: "",
        sectionId: "explore",
      }),
    ).toEqual({
      kind: "canonical",
      target: {
        pathname: "/percorso/questions-existence/travel-existence",
        search: "",
        sectionId: "explore",
      },
    });
  });

  it("rejects a legacy chapter paired with a lesson it never owned", () => {
    const check = validateGuidedLessonReturn({
      pathname: "/percorso/travel-patterns/traps-particles",
      search: "",
      sectionId: "explore",
    });
    expect(check).toEqual({ kind: "mismatch" });
  });

  it("preserves a pathname-only legacy return as return-to-top after canonicalization", () => {
    const check = validateGuidedLessonReturnWith(courseModules)({
      pathname: "/percorso/traps/traps-verbs",
      search: "",
      sectionId: null,
    });
    expect(check).toEqual({
      kind: "canonical",
      target: {
        pathname: "/percorso/capstone/traps-verbs",
        search: "",
        sectionId: null,
      },
    });
  });
});

describe("parseGuidedReturnValue with course validation", () => {
  it("flags a canonical mismatch as invalid module-lesson-mismatch, never a link", () => {
    const parsed = parseGuidedReturnValue(
      "/percorso/sounds/traps-verbs#explore",
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
      "/percorso/traps/traps-verbs#explore",
      validateGuidedLessonReturn,
    );
    expect(parsed).toEqual({
      status: "valid",
      target: {
        pathname: "/percorso/capstone/traps-verbs",
        search: "",
        sectionId: "explore",
      },
      href: "/percorso/capstone/traps-verbs#explore",
    });
  });

  it("keeps a canonical match valid and unchanged", () => {
    const parsed = parseGuidedReturnValue(
      `${soundsCore}#explore`,
      validateGuidedLessonReturn,
    );
    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.href).toBe(`${soundsCore}#explore`);
    }
  });

  it("does not surface a second redirect: the canonical href is already the current module", () => {
    const parsed = readGuidedReturn(
      new URLSearchParams(
        "from=%2Fpercorso%2Ftravel-patterns%2Ftravel-questions%23explore",
      ),
      validateGuidedLessonReturn,
    );
    expect(parsed.status).toBe("valid");
    if (parsed.status === "valid") {
      expect(parsed.href).toBe(
        "/percorso/questions-existence/travel-questions#explore",
      );
    }
  });
});

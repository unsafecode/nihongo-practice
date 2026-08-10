import { describe, expect, it } from "vitest";
import {
  BASE_PARTICLE_FRAME_BY_PREDICATE,
  validateParticleFrame,
} from "./particleLicensing";

describe("Base particle frame licensing", () => {
  it("licenses object-marked themes for transitive predicate senses", () => {
    expect(validateParticleFrame("eat", { theme: "object-o" })).toEqual({
      ok: true,
      value: { predicateSenseId: "eat" },
    });
    expect(validateParticleFrame("write", { theme: "object-o" }).ok).toBe(true);
  });

  it("allows only the declared goal alternatives for movement", () => {
    expect(validateParticleFrame("go", { goal: "goal-ni" }).ok).toBe(true);
    expect(validateParticleFrame("go", { goal: "direction-he" }).ok).toBe(true);
    expect(validateParticleFrame("return", { goal: "direction-he" }).ok).toBe(true);
  });

  it("distinguishes action place and means from existence roles", () => {
    expect(validateParticleFrame("study", { "action-place": "action-place-de" }).ok).toBe(
      true,
    );
    expect(validateParticleFrame("travel", { means: "means-de" }).ok).toBe(true);
    expect(
      validateParticleFrame("aru", {
        "existence-location": "existence-location-ni",
        "existential-subject": "existential-subject-ga",
      }).ok,
    ).toBe(true);
  });

  it("returns a missing-role error instead of accepting incomplete frames", () => {
    expect(validateParticleFrame("aru", { "existence-location": "existence-location-ni" })).toEqual(
      {
        ok: false,
        errors: [
          {
            code: "missing-role",
            predicateSenseId: "aru",
            role: "existential-subject",
          },
        ],
      },
    );
  });

  it("returns unlicensed-particle for an English-like particle substitution", () => {
    expect(validateParticleFrame("eat", { theme: "focus-subject-ga" })).toEqual({
      ok: false,
      errors: [
        {
          code: "unlicensed-particle",
          predicateSenseId: "eat",
          role: "theme",
          particleSense: "focus-subject-ga",
        },
      ],
    });
  });

  it("returns unknown predicate and extra role errors without permissive fallback", () => {
    expect(validateParticleFrame("unknown", { theme: "object-o" })).toEqual({
      ok: false,
      errors: [{ code: "unknown-predicate", predicateSenseId: "unknown" }],
    });
    expect(validateParticleFrame("eat", { theme: "object-o", goal: "goal-ni" })).toEqual({
      ok: false,
      errors: [{ code: "extra-role", predicateSenseId: "eat", role: "goal" }],
    });
  });

  it("rejects inherited or accessor particle roles and treats only own data keys as evidence", () => {
    const inheritedTheme = Object.create({ theme: "object-o" }) as Record<string, unknown>;
    const accessorTheme = {} as Record<string, unknown>;
    Object.defineProperty(accessorTheme, "theme", {
      enumerable: true,
      get: () => "object-o",
    });

    expect(validateParticleFrame("eat", inheritedTheme)).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          expect.objectContaining({ code: "missing-role", role: "theme" }),
          expect.objectContaining({ code: "invalid-particle-frame" }),
        ]),
      }),
    );
    expect(validateParticleFrame("eat", accessorTheme)).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          expect.objectContaining({ code: "missing-role", role: "theme" }),
          expect.objectContaining({ code: "invalid-particle-frame" }),
        ]),
      }),
    );
  });

  it("reports a literal toString role without invoking inherited methods", () => {
    const provided = Object.create(null) as Record<string, unknown>;
    provided.theme = "object-o";
    Object.defineProperty(provided, "toString", {
      enumerable: true,
      value: "object-o",
    });

    expect(() => validateParticleFrame("eat", provided)).not.toThrow();
    expect(validateParticleFrame("eat", provided)).toEqual(
      expect.objectContaining({
        ok: false,
        errors: expect.arrayContaining([
          expect.objectContaining({ code: "extra-role", role: "toString" }),
        ]),
      }),
    );
  });

  it("exposes particle frames through a mutation-proof lookup", () => {
    const mutable = BASE_PARTICLE_FRAME_BY_PREDICATE as unknown as {
      clear?: () => void;
      set?: (id: string, value: unknown) => void;
    };
    mutable.clear?.();
    mutable.set?.("made-up", {});

    expect("clear" in BASE_PARTICLE_FRAME_BY_PREDICATE).toBe(false);
    expect(BASE_PARTICLE_FRAME_BY_PREDICATE.get("go")?.particleOwnerLessonId).toBe(
      "argument-particles-2",
    );
    expect(BASE_PARTICLE_FRAME_BY_PREDICATE.get("eat")?.allowedPredicateLexemeIds).toEqual([
      "verb-taberu",
    ]);
  });
});

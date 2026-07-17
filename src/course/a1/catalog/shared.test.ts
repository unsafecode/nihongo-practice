/**
 * Focused unit tests for `a1Variant`'s `form` / `interrogative` contract.
 *
 * Quality-review Minor M3: `a1Variant` previously let an explicit `form`
 * silently win over `interrogative: true` with no signal to the caller that
 * the requested question mood was dropped. These specs assert the
 * fail-closed contract: passing both together is rejected as a mutually
 * exclusive combination, while passing either alone still succeeds exactly
 * as before (regression guard for all existing A1 module authoring).
 *
 * No fixture imports: every input is a minimal, self-contained spec built
 * directly against `a1Variant`'s public surface.
 */
import { describe, expect, it } from "vitest";
import {
  a1Variant,
  A1_AFFIRMATIVE_PAST_POLITE,
  A1_NEGATIVE_PRESENT_POLITE,
  type A1VariantSpec,
} from "./shared";

const baseSpec: A1VariantSpec = {
  id: "shared-test-form-interrogative-base",
  family: "a1-family-object-action",
  context: "a1-context-cafe",
  speakerRole: "a1-role-learner",
  addresseeRole: "a1-role-teacher",
  subjectReferent: null,
  subjectRealization: "omitted",
  slots: { subject: "a1-value-watashi", predicate: "a1-value-eat", object: "a1-value-obj-sushi" },
  use: "model",
  translation: { en: "I eat sushi.", it: "Mangio il sushi." },
  scenario: { en: "At a cafe.", it: "In un caffè." },
};

describe("a1Variant – form vs. interrogative (M3 fail-closed contract)", () => {
  it("throws when both an explicit form and interrogative:true are supplied", () => {
    expect(() =>
      a1Variant({
        ...baseSpec,
        id: "shared-test-form-and-interrogative",
        form: A1_AFFIRMATIVE_PAST_POLITE,
        interrogative: true,
      }),
    ).toThrow(/mutually exclusive|form.*interrogative|interrogative.*form/i);
  });

  it("throws with a message naming the offending variant id", () => {
    expect(() =>
      a1Variant({
        ...baseSpec,
        id: "shared-test-form-and-interrogative-id-check",
        form: A1_NEGATIVE_PRESENT_POLITE,
        interrogative: true,
      }),
    ).toThrow(/shared-test-form-and-interrogative-id-check/);
  });

  it("still succeeds with only interrogative:true (no form)", () => {
    const built = a1Variant({
      ...baseSpec,
      id: "shared-test-interrogative-only",
      interrogative: true,
    });
    expect(built.variant.form.interrogative).toBe(true);
  });

  it("still succeeds with only an explicit form (no interrogative)", () => {
    const built = a1Variant({
      ...baseSpec,
      id: "shared-test-form-only",
      form: A1_AFFIRMATIVE_PAST_POLITE,
    });
    expect(built.variant.form).toEqual(A1_AFFIRMATIVE_PAST_POLITE);
  });

  it("still succeeds with neither form nor interrogative (default form)", () => {
    const built = a1Variant({ ...baseSpec, id: "shared-test-neither" });
    expect(built.variant.form.interrogative).not.toBe(true);
  });

  it("does not throw when interrogative is explicitly false alongside a form", () => {
    expect(() =>
      a1Variant({
        ...baseSpec,
        id: "shared-test-form-with-interrogative-false",
        form: A1_AFFIRMATIVE_PAST_POLITE,
        interrogative: false,
      }),
    ).not.toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { A2_CONJUGATION_CLASSES, A2_VERBS, conjugate } from "./a2Conjugation";
import { A2_CONSTRUCTIONS } from "./a2Constructions";
import { composeA2Construction } from "./composeA2Construction";
import { A2_GRAMMAR_SPIRAL } from "./grammarSpiral";

/**
 * Regression coverage for a hostile-runtime-mutation finding (Phase 3 Task 2
 * follow-up): the A2 form registries were mutable, and `conjugate`/
 * `composeA2Construction` outputs aliased registry fragment objects/arrays.
 * A caller mutating one returned fragment (accidentally, or a hostile
 * runtime) corrupted every later call sharing that fragment/table entry —
 * contradicting the "pure/independently-owned output" docs on both
 * functions and the codebase's `deepFreeze` convention (see
 * `src/course/foundations/deepFreeze.ts`, `A1_MANIFEST`, `A2_MANIFEST`,
 * `A2_LEVEL`).
 *
 * These tests must be RED against the pre-fix code (registries un-frozen,
 * `assemble`/`composeA2Construction` reusing table/stem/tail fragment
 * objects and arrays directly) and GREEN once registries are deep-frozen
 * and every output boundary clones its fragments before assembling and
 * deep-freezing the result.
 */

/** Cast away `readonly`/frozen typing so a test can attempt a mutation without `as any`. */
function unsafeMutableFragment(fragment: unknown): Record<string, unknown> {
  return fragment as Record<string, unknown>;
}

describe("A2 form registries are deeply frozen", () => {
  it("freezes A2_VERBS, every verb entry, its stem array, and every stem fragment", () => {
    expect(Object.isFrozen(A2_VERBS)).toBe(true);
    for (const verb of Object.values(A2_VERBS)) {
      expect(Object.isFrozen(verb)).toBe(true);
      expect(Object.isFrozen(verb.stem)).toBe(true);
      for (const fragment of verb.stem) {
        expect(Object.isFrozen(fragment)).toBe(true);
      }
    }
  });

  it("freezes A2_CONJUGATION_CLASSES", () => {
    expect(Object.isFrozen(A2_CONJUGATION_CLASSES)).toBe(true);
  });

  it("freezes A2_CONSTRUCTIONS, every construction entry, and every tail fragment", () => {
    expect(Object.isFrozen(A2_CONSTRUCTIONS)).toBe(true);
    for (const construction of Object.values(A2_CONSTRUCTIONS)) {
      expect(Object.isFrozen(construction)).toBe(true);
      if (construction.tail) {
        expect(Object.isFrozen(construction.tail)).toBe(true);
        for (const fragment of construction.tail) {
          expect(Object.isFrozen(fragment)).toBe(true);
        }
      }
    }
  });

  it("freezes A2_GRAMMAR_SPIRAL, every row, and every row's recurrenceLessonIds array", () => {
    expect(Object.isFrozen(A2_GRAMMAR_SPIRAL)).toBe(true);
    for (const row of A2_GRAMMAR_SPIRAL) {
      expect(Object.isFrozen(row)).toBe(true);
      expect(Object.isFrozen(row.recurrenceLessonIds)).toBe(true);
    }
  });
});

describe("conjugate() produces frozen, independently-owned results (irregular verb)", () => {
  it("two calls for the same irregular verb/form are deep-equal but not identical, with no shared fragment objects", () => {
    const first = conjugate("a2-sense-kuru", "past");
    const second = conjugate("a2-sense-kuru", "past");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.result).toEqual(second.result);
      expect(first.result).not.toBe(second.result);
      expect(first.result.fragments).not.toBe(second.result.fragments);
      expect(first.result.fragments.length).toBe(second.result.fragments.length);
      for (let i = 0; i < first.result.fragments.length; i += 1) {
        expect(first.result.fragments[i]).not.toBe(second.result.fragments[i]);
      }
    }
  });

  it("outputs and nested fragments are frozen", () => {
    const r = conjugate("a2-sense-kuru", "past");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.isFrozen(r.result)).toBe(true);
      expect(Object.isFrozen(r.result.fragments)).toBe(true);
      for (const fragment of r.result.fragments) {
        expect(Object.isFrozen(fragment)).toBe(true);
      }
    }
  });

  it("a mutation attempt on one result cannot alter a later call for the same verb/form", () => {
    const first = conjugate("a2-sense-kuru", "past");
    expect(first.ok).toBe(true);
    if (first.ok) {
      const target = unsafeMutableFragment(first.result.fragments[0]);
      const mutated = Reflect.set(target, "jp", "HACKED");
      expect(mutated).toBe(false);
      expect(first.result.fragments[0].jp).toBe("来");
    }

    const second = conjugate("a2-sense-kuru", "past");
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.result.jp).toBe("来た");
      expect(second.result.fragments[0].jp).toBe("来");
    }
  });
});

describe("conjugate() produces frozen, independently-owned results (regular verb)", () => {
  it("two calls for the same regular verb/form are deep-equal but not identical, with no shared fragment objects", () => {
    const first = conjugate("a2-sense-taberu", "past");
    const second = conjugate("a2-sense-taberu", "past");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.result).toEqual(second.result);
      expect(first.result).not.toBe(second.result);
      expect(first.result.fragments).not.toBe(second.result.fragments);
      expect(first.result.fragments.length).toBe(second.result.fragments.length);
      for (let i = 0; i < first.result.fragments.length; i += 1) {
        expect(first.result.fragments[i]).not.toBe(second.result.fragments[i]);
      }
    }
  });

  it("outputs and nested fragments are frozen", () => {
    const r = conjugate("a2-sense-taberu", "past");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.isFrozen(r.result)).toBe(true);
      expect(Object.isFrozen(r.result.fragments)).toBe(true);
      for (const fragment of r.result.fragments) {
        expect(Object.isFrozen(fragment)).toBe(true);
      }
    }
  });

  it("a mutation attempt on one result cannot alter a later call, and cannot corrupt the shared A2_VERBS stem", () => {
    const first = conjugate("a2-sense-taberu", "past");
    expect(first.ok).toBe(true);
    if (first.ok) {
      const target = unsafeMutableFragment(first.result.fragments[0]);
      const mutated = Reflect.set(target, "jp", "HACKED");
      expect(mutated).toBe(false);
      expect(first.result.fragments[0].jp).toBe("食");
    }

    // The registry's own stem fragment must be untouched too.
    expect(A2_VERBS["a2-sense-taberu"].stem[0].jp).toBe("食");

    const second = conjugate("a2-sense-taberu", "past");
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.result.jp).toBe("食べた");
      expect(second.result.fragments[0].jp).toBe("食");
    }
  });
});

describe("composeA2Construction() produces frozen, independently-owned results", () => {
  it("two calls for the same construction/verb are deep-equal but not identical, with no shared base/tail fragment objects", () => {
    const first = composeA2Construction({ constructionId: "ongoing-teiru", senseId: "a2-sense-yomu" });
    const second = composeA2Construction({ constructionId: "ongoing-teiru", senseId: "a2-sense-yomu" });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.sentence).toEqual(second.sentence);
      expect(first.sentence).not.toBe(second.sentence);
      expect(first.sentence.fragments).not.toBe(second.sentence.fragments);
      expect(first.sentence.fragments.length).toBe(second.sentence.fragments.length);
      for (let i = 0; i < first.sentence.fragments.length; i += 1) {
        expect(first.sentence.fragments[i]).not.toBe(second.sentence.fragments[i]);
      }
    }
  });

  it("outputs and nested fragments are frozen", () => {
    const r = composeA2Construction({ constructionId: "ongoing-teiru", senseId: "a2-sense-yomu" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(Object.isFrozen(r.sentence)).toBe(true);
      expect(Object.isFrozen(r.sentence.fragments)).toBe(true);
      for (const fragment of r.sentence.fragments) {
        expect(Object.isFrozen(fragment)).toBe(true);
      }
    }
  });

  it("a mutation attempt on one sentence's tail fragment cannot alter a later call or the shared A2_CONSTRUCTIONS tail", () => {
    const first = composeA2Construction({ constructionId: "ongoing-teiru", senseId: "a2-sense-yomu" });
    expect(first.ok).toBe(true);
    if (first.ok) {
      const tailFragment = first.sentence.fragments[first.sentence.fragments.length - 1];
      const target = unsafeMutableFragment(tailFragment);
      const mutated = Reflect.set(target, "jp", "HACKED");
      expect(mutated).toBe(false);
      expect(tailFragment.jp).toBe("います");
    }

    // The registry's own tail fragment must be untouched too.
    expect(A2_CONSTRUCTIONS["ongoing-teiru"].tail?.[0].jp).toBe("います");

    const second = composeA2Construction({ constructionId: "ongoing-teiru", senseId: "a2-sense-yomu" });
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.sentence.jp).toBe("読んでいます");
    }
  });
});

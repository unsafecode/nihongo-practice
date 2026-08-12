import { describe, expect, it } from "vitest";

import { BASE_NATURALNESS_REVIEW_INVENTORY } from "../review/naturalnessLedger";

/**
 * Japanese marks family reference by register, not by possessive pronoun:
 * ちち/はは are the in-group terms a speaker uses for their *own* parents, and
 * おとうさん/おかあさん are the respectful terms used for someone *else's*.
 * A sentence that pairs おかあさん with "my mother" is not a loose translation
 * — it teaches the opposite of the rule, and the learner has no way to see the
 * error because the English reads perfectly well.
 *
 * This is finding R4 of the independent naturalness review. The guard covers
 * every learner-visible Japanese surface rather than the handful the review
 * happened to cite.
 */

const OUT_GROUP = /(おとうさん|おかあさん)/u;
const IN_GROUP = /(ちち|はは)/u;
const CLAIMS_OWN_EN = /\bmy (father|mother|dad|mum|mom)\b/iu;
const CLAIMS_OWN_IT = /\b(mio padre|mia madre|mio papà|mia mamma)\b/iu;
const CLAIMS_OTHER_EN = /\byour (father|mother|dad|mum|mom)\b/iu;
const CLAIMS_OTHER_IT = /\b(tuo padre|tua madre|suo padre|sua madre)\b/iu;

describe("Base family-term register", () => {
  it("never translates a respectful family term as the speaker's own family", () => {
    const offenders = BASE_NATURALNESS_REVIEW_INVENTORY.filter(
      (entry) =>
        OUT_GROUP.test(entry.jp) &&
        (CLAIMS_OWN_EN.test(entry.en) || CLAIMS_OWN_IT.test(entry.it)),
    ).map((entry) => `${entry.contentId}: ${entry.jp} / ${entry.en} / ${entry.it}`);
    expect(offenders).toEqual([]);
  });

  it("never translates an in-group family term as the listener's family", () => {
    const offenders = BASE_NATURALNESS_REVIEW_INVENTORY.filter(
      (entry) =>
        IN_GROUP.test(entry.jp) &&
        !OUT_GROUP.test(entry.jp) &&
        (CLAIMS_OTHER_EN.test(entry.en) || CLAIMS_OTHER_IT.test(entry.it)),
    ).map((entry) => `${entry.contentId}: ${entry.jp} / ${entry.en} / ${entry.it}`);
    expect(offenders).toEqual([]);
  });

  it("still covers the surfaces the review cited, so the guard cannot pass vacuously", () => {
    const familySurfaces = BASE_NATURALNESS_REVIEW_INVENTORY.filter(
      (entry) => OUT_GROUP.test(entry.jp) || IN_GROUP.test(entry.jp),
    );
    expect(familySurfaces.length).toBeGreaterThan(10);
    expect(
      familySurfaces.some((entry) => OUT_GROUP.test(entry.jp)),
    ).toBe(true);
    expect(familySurfaces.some((entry) => IN_GROUP.test(entry.jp))).toBe(true);
  });
});

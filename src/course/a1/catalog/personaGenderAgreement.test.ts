/**
 * Persona/Italian-gender agreement contract (Phase 2 Task 7 independent
 * finding).
 *
 * Canonical persona agreement for the whole A1 release:
 *   - Ken   — masculine
 *   - Mina  — feminine
 *   - Yuki  — feminine
 *
 * Italian, unlike English/Japanese, marks grammatical gender on copular
 * predicate nouns (uno studente / una studentessa), some occupation nouns
 * (un impiegato / un'impiegata), nationality adjectives (americano /
 * americana), and past participles in compound tenses (svegliato /
 * svegliata, andato / andata). Every realized A1 sentence whose subject is
 * one of the three named personas must agree with that persona's canonical
 * gender. Self/learner ("watashi") and unnamed/generic roles (classmate,
 * teacher, clerk, person …) have no established real-world gender in this
 * course and must NOT be guessed — they keep whatever default/invariant
 * form the copy already uses.
 *
 * This suite enumerates every realized A1 variant (all 572 semantic model +
 * transfer rows) from the frozen release catalog — no hand-picked subset —
 * plus pins the exact literal fix for the concretely reported bug ids.
 */
import { describe, expect, it } from "vitest";
import { a1AllVariants, a1FoundationCopy } from "./catalog";
import { a1PersonRoles, a1Referents, a1TranslationCopyId } from "./shared";

// ---------------------------------------------------------------------------
// Referent → persona gender, derived only from the frozen catalogs (never
// hand-declared here).
// ---------------------------------------------------------------------------

const roleGenderById = new Map(a1PersonRoles.map((role) => [role.id, role.gender]));
const referentRoleById = new Map(a1Referents.map((referent) => [referent.id, referent.personRoleId]));

function genderOfReferent(referentId: string | null): "masculine" | "feminine" | undefined {
  if (referentId === null) return undefined;
  const roleId = referentRoleById.get(referentId);
  if (roleId === undefined) return undefined;
  return roleGenderById.get(roleId);
}

function translationOf(variantId: string): string {
  const key = a1TranslationCopyId(variantId);
  const text = a1FoundationCopy.it[key];
  if (text === undefined) throw new Error(`Missing IT translation copy for "${key}".`);
  return text;
}

describe("persona gender metadata (canonical agreement)", () => {
  it("declares Ken masculine, Mina and Yuki feminine", () => {
    expect(roleGenderById.get("a1-role-ken")).toBe("masculine");
    expect(roleGenderById.get("a1-role-mina")).toBe("feminine");
    expect(roleGenderById.get("a1-role-yuki")).toBe("feminine");
  });

  it("leaves generic/unnamed roles without a guessed gender", () => {
    for (const roleId of [
      "a1-role-learner",
      "a1-role-teacher",
      "a1-role-classmate",
      "a1-role-friend",
      "a1-role-clerk",
      "a1-role-person",
      "a1-role-thing",
      "a1-role-creature",
    ]) {
      expect(roleGenderById.get(roleId), roleId).toBeUndefined();
    }
  });
});

describe("persona gender agreement — full 572-row enumeration", () => {
  // Masculine surface forms that must never appear when the copular
  // predicate's subject is a known-feminine persona (Mina, Yuki).
  const MASCULINE_FORMS: ReadonlyArray<[RegExp, string]> = [
    [/\buno studente\b/, "una studentessa"],
    [/\bun impiegato\b/, "un'impiegata"],
    [/\bamericano\b/, "americana"],
  ];
  const FEMININE_FORMS: ReadonlyArray<[RegExp, string]> = [
    [/\buna studentessa\b/, "uno studente"],
    [/\bun'impiegata\b/, "un impiegato"],
    [/\bamericana\b/, "americano"],
  ];

  // Past-participle pairs (compound tenses agree with the subject's gender
  // regardless of sentence family, so these are checked across every
  // family, not just the copular one).
  const MASCULINE_PARTICIPLES = ["andato", "svegliato", "tornato"];
  const FEMININE_PARTICIPLES = ["andata", "svegliata", "tornata"];

  const copularVariants = a1AllVariants.filter((v) => v.sentenceFamilyId === "a1-family-topic-copular");

  it("every copular variant with a feminine persona subject (Mina/Yuki) avoids masculine complement forms", () => {
    const offenders: string[] = [];
    for (const variant of copularVariants) {
      const gender = genderOfReferent(variant.discourse.subjectReferentId);
      if (gender !== "feminine") continue;
      const text = translationOf(variant.id);
      for (const [masculinePattern, expectedFeminine] of MASCULINE_FORMS) {
        if (masculinePattern.test(text)) {
          offenders.push(`${variant.id}: "${text}" should use "${expectedFeminine}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every copular variant with the masculine persona subject (Ken) avoids feminine complement forms", () => {
    const offenders: string[] = [];
    for (const variant of copularVariants) {
      const gender = genderOfReferent(variant.discourse.subjectReferentId);
      if (gender !== "masculine") continue;
      const text = translationOf(variant.id);
      for (const [femininePattern, expectedMasculine] of FEMININE_FORMS) {
        if (femininePattern.test(text)) {
          offenders.push(`${variant.id}: "${text}" should use "${expectedMasculine}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every variant (any family) with a feminine persona subject uses feminine past participles", () => {
    const offenders: string[] = [];
    for (const variant of a1AllVariants) {
      const gender = genderOfReferent(variant.discourse.subjectReferentId);
      if (gender !== "feminine") continue;
      const text = translationOf(variant.id);
      for (const masculine of MASCULINE_PARTICIPLES) {
        if (new RegExp(`\\b${masculine}\\b`).test(text)) {
          offenders.push(`${variant.id}: "${text}" contains masculine participle "${masculine}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("every variant (any family) with the masculine persona subject uses masculine past participles", () => {
    const offenders: string[] = [];
    for (const variant of a1AllVariants) {
      const gender = genderOfReferent(variant.discourse.subjectReferentId);
      if (gender !== "masculine") continue;
      const text = translationOf(variant.id);
      for (const feminine of FEMININE_PARTICIPLES) {
        if (new RegExp(`\\b${feminine}\\b`).test(text)) {
          offenders.push(`${variant.id}: "${text}" contains feminine participle "${feminine}"`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("at least one feminine-persona copular row actually exercises each gendered complement (regression can't pass by vacuity)", () => {
    const feminineTexts = copularVariants
      .filter((v) => genderOfReferent(v.discourse.subjectReferentId) === "feminine")
      .map((v) => translationOf(v.id));
    expect(feminineTexts.some((t) => /\buna studentessa\b/.test(t))).toBe(true);
    expect(feminineTexts.some((t) => /\bun'impiegata\b/.test(t))).toBe(true);
    expect(feminineTexts.some((t) => /\bamericana\b/.test(t))).toBe(true);
  });

  it("at least one feminine-persona row actually exercises a feminine past participle (regression can't pass by vacuity)", () => {
    const feminineTexts = a1AllVariants
      .filter((v) => genderOfReferent(v.discourse.subjectReferentId) === "feminine")
      .map((v) => translationOf(v.id));
    expect(feminineTexts.some((t) => /\bandata\b/.test(t))).toBe(true);
    expect(feminineTexts.some((t) => /\bsvegliata\b/.test(t))).toBe(true);
  });
});

describe("persona gender agreement — concrete reported bug ids (independent finding)", () => {
  // These pin the exact variants named in the independent finding so the fix
  // is unambiguous, on top of the exhaustive sweep above.
  const EXPECTED_IT: ReadonlyArray<[string, string]> = [
    // module02Introductions.ts — a1Copular-composed rows.
    ["introductions-1-m1", "Yuki è una studentessa."],
    ["introductions-3-m3", "Mina è americana."],
    ["introductions-4-m1", "Yuki è una studentessa."],
    ["introductions-4-m3", "Yuki è un'impiegata."],
    // module03Questions.ts — hand-authored literal rows that bypass a1Copular.
    ["essential-questions-1-m3", "Che cosa capisce Yuki?"],
    ["essential-questions-2-t5", "Mina è una studentessa?"],
    ["essential-questions-4-m8", "Yuki è una studentessa?"],
  ];

  for (const [variantId, expectedIt] of EXPECTED_IT) {
    it(`"${variantId}" renders "${expectedIt}"`, () => {
      expect(translationOf(variantId)).toBe(expectedIt);
    });
  }

  // Ken's forms (already consistent) must stay exactly as-is — this is the
  // negative control that proves the fix is gender-*aware*, not a blanket
  // feminization of every persona.
  const KEN_STAYS: ReadonlyArray<[string, string]> = [
    ["introductions-1-t1", "Ken è uno studente."],
    ["introductions-3-t4", "Ken è americano."],
  ];

  for (const [variantId, expectedIt] of KEN_STAYS) {
    it(`"${variantId}" keeps Ken's masculine "${expectedIt}"`, () => {
      expect(translationOf(variantId)).toBe(expectedIt);
    });
  }
});

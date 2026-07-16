import { describe, expect, it } from "vitest";

import { formatRomaji } from "../../romaji/formatRomaji";
import {
  fixtureFamily,
  fixtureVariant,
  foundationCatalogs,
  foundationLessons,
  withFixtureOverride,
} from "./fixtures";
import type {
  ConceptId,
  LearningTargetSense,
  SemanticValue,
  SentenceFamily,
  SentenceVariant,
} from "./types";
import {
  realizeVariant,
  type FamilyRealizationErrorCode,
  type RealizeVariantCatalogs,
} from "./realizeFamily";

/**
 * Shared, lesson-agnostic catalogs realization needs. These four are global
 * (not lesson-scoped) — only `availableConceptIds` is lesson-scoped, per the
 * fail-closed contract: a caller must explicitly state which concepts have
 * been taught, never assume `family.requiredConceptIds` are automatically
 * available.
 */
const catalogs: RealizeVariantCatalogs = {
  contexts: foundationCatalogs.contexts,
  personRoles: foundationCatalogs.personRoles,
  referents: foundationCatalogs.referents,
  semanticValues: foundationCatalogs.semanticValues,
  learningTargetSenses: foundationCatalogs.learningTargetSenses,
};

const familiesById = new Map(
  foundationCatalogs.sentenceFamilies.map((family) => [family.id, family]),
);

/** The concept ids a representative lesson has actually introduced: the
 * union of `requiredConceptIds` across every family that lesson teaches. */
function conceptIdsForLesson(lessonId: string): readonly ConceptId[] {
  const lesson = foundationLessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) {
    throw new Error(`Unknown fixture lesson id: ${lessonId}`);
  }
  const ids = new Set<ConceptId>();
  for (const familyId of lesson.familyIds) {
    const family = familiesById.get(familyId);
    if (!family) {
      throw new Error(`Unknown fixture family id: ${familyId}`);
    }
    for (const conceptId of family.requiredConceptIds) {
      ids.add(conceptId);
    }
  }
  return [...ids];
}

/** Finds the representative lesson that owns (teaches) a given family. */
function lessonIdForFamily(familyId: string): string {
  const lesson = foundationLessons.find((candidate) =>
    candidate.familyIds.includes(familyId),
  );
  if (!lesson) {
    throw new Error(`No representative lesson owns family: ${familyId}`);
  }
  return lesson.id;
}

const a1ConceptIds = conceptIdsForLesson("fixture-a1-personal-details");
const a2ConceptIds = conceptIdsForLesson("fixture-a2-routine-plans");

function expectSingleError(
  errors: readonly { code: FamilyRealizationErrorCode }[],
  code: FamilyRealizationErrorCode,
) {
  expect(errors.length).toBeGreaterThan(0);
  expect(errors.every((error) => error.code === code)).toBe(true);
}

describe("realizeVariant", () => {
  describe("exact Japanese/romaji output", () => {
    it("realizes the A1 object-action study sentence exactly", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const variant = fixtureVariant("fixture-a1-yuki-study-japanese");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe(
        "ゆきはにほんごをべんきょうします",
      );
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      expect(romaji.text).toBe("yuki wa nihongo o benkyoushimasu");
    });

    it("realizes the omitted-subject A1 work sentence with で for the workplace location", () => {
      const family = fixtureFamily("fixture-a1-residence-action");
      const variant = fixtureVariant("fixture-a1-omitted-work-company");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("かいしゃではたらきます");
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      expect(romaji.text).toBe("kaisha de hatarakimasu");
    });

    it("realizes an omitted-subject A1 live sentence with に for the location", () => {
      const family = fixtureFamily("fixture-a1-residence-action");
      const base = fixtureVariant("fixture-a1-yuki-live-rome");
      const omittedLive: SentenceVariant = withFixtureOverride(base, {
        id: "test-omitted-live-rome",
        discourse: { ...base.discourse, subjectRealization: "omitted" },
      });

      const result = realizeVariant(family, omittedLive, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("ローマにすみます");
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      expect(romaji.text).toBe("rooma ni sumimasu");
    });
  });

  describe("subject realization", () => {
    it("omits both the subject token and は for an omitted-subject variant, while the fingerprint still carries the referent", () => {
      const family = fixtureFamily("fixture-a1-topic-copular");
      const variant = fixtureVariant("fixture-a1-teacher-omitted-class");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(
        result.sentence.tokens.some((token) => token.jp === "は"),
      ).toBe(false);
      // The subject slot itself must never contribute a token when omitted —
      // even though the object complement happens to share the same surface
      // form ("せんせい") as the subject referent's own fragment.
      expect(
        result.sentence.tokens.some((token) => token.source.referenceId.includes("/subject")),
      ).toBe(false);
      expect(result.sentence.canonicalJapanese).toBe("せんせいです");
      expect(result.sentence.semanticFingerprint).toContain(
        variant.discourse.subjectReferentId as string,
      );
    });

    it("emits the subject token and は for an explicit-subject variant", () => {
      const family = fixtureFamily("fixture-a1-topic-copular");
      const variant = fixtureVariant("fixture-a1-yuki-student-meeting");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.tokens[0]?.jp).toBe("ゆき");
      expect(result.sentence.tokens[1]?.jp).toBe("は");
    });
  });

  describe("fail-closed explicit subject", () => {
    /**
     * A synthetic family (never authored in fixtures.ts, where every real
     * "subject" slot is `optional: false`) whose subject slot is marked
     * optional — proving the realizer itself, not merely fixture discipline,
     * fails closed when `discourse.subjectRealization` is `"explicit"` but no
     * subject value resolves, instead of reaching the old unsafe
     * `as SemanticValue` cast and throwing.
     */
    function optionalSubjectFamily(): SentenceFamily {
      const base = fixtureFamily("fixture-a1-topic-copular");
      return withFixtureOverride(base, {
        id: "test-optional-subject-family",
        slotSchema: base.slotSchema.map((slot) =>
          slot.id === "subject" ? { ...slot, optional: true } : slot,
        ),
      });
    }

    it("returns a missing-slot Result error (and never throws) when the subject is explicit but no subject value resolves, even though the schema marks the slot optional", () => {
      const family = optionalSubjectFamily();
      const base = fixtureVariant("fixture-a1-yuki-student-meeting"); // explicit subject
      const { subject: _omittedSubject, ...withoutSubject } = base.slotValues;
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-explicit-missing-subject",
        sentenceFamilyId: family.id,
        slotValues: withoutSubject,
      });

      let result: ReturnType<typeof realizeVariant> | undefined;
      expect(() => {
        result = realizeVariant(family, variant, catalogs, {
          availableConceptIds: a1ConceptIds,
        });
      }).not.toThrow();

      expect(result?.ok).toBe(false);
      if (!result || result.ok) return;
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.every((error) => error.code === "missing-slot")).toBe(true);
      expect(result.errors[0]?.slotId).toBe("subject");
    });

    it("still realizes successfully (retaining the semantic subject value without emitting it) when the subject is omitted and the now-optional slot is populated", () => {
      const family = optionalSubjectFamily();
      const base = fixtureVariant("fixture-a1-teacher-omitted-class"); // omitted subject
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-omitted-optional-subject",
        sentenceFamilyId: family.id,
      });

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(
        result.sentence.tokens.some((token) => token.jp === "は"),
      ).toBe(false);
      expect(
        result.sentence.tokens.some((token) => token.source.referenceId.includes("/subject")),
      ).toBe(false);
      expect(result.sentence.semanticFingerprint).toContain(
        variant.discourse.subjectReferentId as string,
      );
    });
  });

  describe("A2 natural realizations", () => {
    it("realizes a natural A2 time-action sentence", () => {
      const family = fixtureFamily("fixture-a2-time-action");
      const variant = fixtureVariant("fixture-a2-yuki-wake-weekday");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a2ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("ゆきはまいあさおきます");
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      expect(romaji.text).toBe("yuki wa maiasa okimasu");
    });

    it("realizes a natural A2 sequence-action sentence", () => {
      const family = fixtureFamily("fixture-a2-sequence-action");
      const variant = fixtureVariant("fixture-a2-friend-meet-after-work");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a2ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe(
        "ともだちはしごとのあとであいます",
      );
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      expect(romaji.text).toBe("tomodachi wa shigoto no ato de aimasu");
    });

    it("realizes a natural A2 invitation-action sentence", () => {
      const family = fixtureFamily("fixture-a2-invitation-action");
      const variant = fixtureVariant("fixture-a2-friend-invite-lunch");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a2ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe(
        "ともだちはランチにさそいます",
      );
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      expect(romaji.text).toBe("tomodachi wa ranchi ni sasoimasu");
    });
  });

  describe("object/theme case-frame licensing", () => {
    it("fails closed with invalid-argument-structure when a governed-theme rule's sense lacks the theme argument role", () => {
      const family = fixtureFamily("fixture-a1-object-action"); // objectRole: "governed-theme"
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const brokenSense: LearningTargetSense = withFixtureOverride(
        catalogs.learningTargetSenses.find(
          (sense) => sense.id === "fixture-a1-sense-study",
        ) as LearningTargetSense,
        { id: "test-sense-study-no-theme", argumentRoles: ["agent"] },
      );
      const brokenPredicateValue: SemanticValue = withFixtureOverride(
        catalogs.semanticValues.find(
          (value) => value.id === "fixture-a1-value-study",
        ) as SemanticValue,
        { id: "test-value-study-no-theme", senseId: brokenSense.id },
      );
      const brokenCatalogs: RealizeVariantCatalogs = {
        ...catalogs,
        learningTargetSenses: [...catalogs.learningTargetSenses, brokenSense],
        semanticValues: [...catalogs.semanticValues, brokenPredicateValue],
      };
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-governed-theme-mismatch",
        slotValues: { ...base.slotValues, predicate: brokenPredicateValue.id },
      });

      const result = realizeVariant(family, variant, brokenCatalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "invalid-argument-structure");
      expect(result.errors[0]?.slotId).toBe("object");
      expect(result.errors[0]?.referenceId).toBe("theme");
    });

    it("realizes successfully with a copular-complement object even though the copula sense declares no theme argument role", () => {
      const family = fixtureFamily("fixture-a1-topic-copular"); // objectRole: "copular-complement"
      const variant = fixtureVariant("fixture-a1-yuki-student-meeting");
      const sense = catalogs.learningTargetSenses.find(
        (candidate) => candidate.id === "fixture-a1-sense-be",
      ) as LearningTargetSense;
      expect(sense.argumentRoles).not.toContain("theme");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe("full fixture coverage", () => {
    it("realizes all 34 fixture variants successfully under their owning representative lesson's concept set", () => {
      expect(foundationCatalogs.sentenceVariants.length).toBe(34);

      for (const variant of foundationCatalogs.sentenceVariants) {
        const family = familiesById.get(variant.sentenceFamilyId) as SentenceFamily;
        const lessonId = lessonIdForFamily(family.id);
        const availableConceptIds = conceptIdsForLesson(lessonId);

        const result = realizeVariant(family, variant, catalogs, {
          availableConceptIds,
        });

        if (!result.ok) {
          throw new Error(
            `${variant.id} failed to realize: ${JSON.stringify(result.errors)}`,
          );
        }
        expect(result.ok).toBe(true);
        expect(result.sentence.canonicalJapanese.length).toBeGreaterThan(0);
      }
    });
  });

  describe("token traceability", () => {
    it("produces unique, traceable token ids and sources", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const variant = fixtureVariant("fixture-a1-yuki-study-japanese");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const ids = result.sentence.tokens.map((token) => token.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const token of result.sentence.tokens) {
        expect(token.source.domain).toBe("family");
        expect(token.source.referenceId.length).toBeGreaterThan(0);
        expect(token.source.referenceId).toContain(variant.id);
      }
    });

    it("passes the romaji formatter cleanly for every fixture variant", () => {
      for (const variant of foundationCatalogs.sentenceVariants) {
        const family = familiesById.get(variant.sentenceFamilyId) as SentenceFamily;
        const lessonId = lessonIdForFamily(family.id);
        const result = realizeVariant(family, variant, catalogs, {
          availableConceptIds: conceptIdsForLesson(lessonId),
        });
        if (!result.ok) {
          throw new Error(`${variant.id} failed to realize`);
        }
        const romaji = formatRomaji(result.sentence.tokens);
        expect(romaji.ok).toBe(true);
      }
    });
  });

  describe("semantic fingerprint", () => {
    it("is independent of slotValues insertion order", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const variant = fixtureVariant("fixture-a1-yuki-study-japanese");
      const reordered: SentenceVariant = withFixtureOverride(variant, {
        slotValues: {
          object: variant.slotValues.object,
          predicate: variant.slotValues.predicate,
          subject: variant.slotValues.subject,
        },
      });

      const a = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });
      const b = realizeVariant(family, reordered, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(a.ok).toBe(true);
      expect(b.ok).toBe(true);
      if (!a.ok || !b.ok) return;
      expect(a.sentence.semanticFingerprint).toBe(b.sentence.semanticFingerprint);
    });

    it("changes when the family changes", () => {
      const objectFamily = fixtureFamily("fixture-a1-object-action");
      const residenceFamily = fixtureFamily("fixture-a1-residence-action");
      const variant = fixtureVariant("fixture-a1-yuki-study-japanese");

      const a = realizeVariant(objectFamily, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });
      const residenceVariant = fixtureVariant("fixture-a1-yuki-live-rome");
      const b = realizeVariant(residenceFamily, residenceVariant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(a.ok).toBe(true);
      expect(b.ok).toBe(true);
      if (!a.ok || !b.ok) return;
      expect(a.sentence.semanticFingerprint).not.toBe(b.sentence.semanticFingerprint);
    });

    it("changes when the discourse role (subject referent) changes", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const a = realizeVariant(
        family,
        fixtureVariant("fixture-a1-yuki-study-japanese"),
        catalogs,
        { availableConceptIds: a1ConceptIds },
      );
      const b = realizeVariant(
        family,
        fixtureVariant("fixture-a1-classmate-study-english"),
        catalogs,
        { availableConceptIds: a1ConceptIds },
      );
      expect(a.ok).toBe(true);
      expect(b.ok).toBe(true);
      if (!a.ok || !b.ok) return;
      expect(a.sentence.semanticFingerprint).not.toBe(b.sentence.semanticFingerprint);
    });

    it("changes when the predicate sense changes", () => {
      const family = fixtureFamily("fixture-a1-residence-action");
      const live = realizeVariant(
        family,
        fixtureVariant("fixture-a1-yuki-live-rome"),
        catalogs,
        { availableConceptIds: a1ConceptIds },
      );
      const work = realizeVariant(
        family,
        fixtureVariant("fixture-a1-transfer-yuki-work-company"),
        catalogs,
        { availableConceptIds: a1ConceptIds },
      );
      expect(live.ok).toBe(true);
      expect(work.ok).toBe(true);
      if (!live.ok || !work.ok) return;
      expect(live.sentence.semanticFingerprint).not.toBe(
        work.sentence.semanticFingerprint,
      );
    });

    it("changes when the context changes", () => {
      const family = fixtureFamily("fixture-a1-residence-action");
      const rome = realizeVariant(
        family,
        fixtureVariant("fixture-a1-yuki-live-rome"),
        catalogs,
        { availableConceptIds: a1ConceptIds },
      );
      const rome2: SentenceVariant = withFixtureOverride(
        fixtureVariant("fixture-a1-yuki-live-rome"),
        { id: "test-rome-other-context", contextId: "fixture-a1-context-workplace" },
      );
      const rome2Result = realizeVariant(family, rome2, catalogs, {
        availableConceptIds: a1ConceptIds,
      });
      expect(rome.ok).toBe(true);
      expect(rome2Result.ok).toBe(true);
      if (!rome.ok || !rome2Result.ok) return;
      expect(rome.sentence.semanticFingerprint).not.toBe(
        rome2Result.sentence.semanticFingerprint,
      );
    });

    it("changes when the form changes", () => {
      const family = fixtureFamily("fixture-a1-residence-action");
      const base = fixtureVariant("fixture-a1-yuki-live-rome");
      const past: SentenceVariant = withFixtureOverride(base, {
        id: "test-rome-past",
        form: { ...base.form, tense: "past" },
      });

      const present = realizeVariant(family, base, catalogs, {
        availableConceptIds: a1ConceptIds,
      });
      const pastResult = realizeVariant(family, past, catalogs, {
        availableConceptIds: a1ConceptIds,
      });
      expect(present.ok).toBe(true);
      expect(pastResult.ok).toBe(true);
      if (!present.ok || !pastResult.ok) return;
      expect(present.sentence.semanticFingerprint).not.toBe(
        pastResult.sentence.semanticFingerprint,
      );
    });
  });

  describe("visible target key", () => {
    it("stays identical for the same Japanese even when hidden semantics (context) differ", () => {
      const family = fixtureFamily("fixture-a1-residence-action");
      const base = fixtureVariant("fixture-a1-yuki-live-rome");
      const sameJpDifferentContext: SentenceVariant = withFixtureOverride(base, {
        id: "test-rome-different-context",
        contextId: "fixture-a1-context-workplace",
      });

      const a = realizeVariant(family, base, catalogs, {
        availableConceptIds: a1ConceptIds,
      });
      const b = realizeVariant(family, sameJpDifferentContext, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(a.ok).toBe(true);
      expect(b.ok).toBe(true);
      if (!a.ok || !b.ok) return;
      expect(a.sentence.visibleTargetKey).toBe(b.sentence.visibleTargetKey);
      expect(a.sentence.visibleTargetKey).toBe(a.sentence.canonicalJapanese);
      expect(a.sentence.semanticFingerprint).not.toBe(
        b.sentence.semanticFingerprint,
      );
      // The visible key must never leak hidden semantics such as context id.
      expect(a.sentence.visibleTargetKey).not.toContain("context");
    });
  });

  describe("usedLexemeSenseIds", () => {
    it("collects every resolved semantic value's senseId in slot-schema order, deduplicated by first occurrence, and still includes the predicate sense", () => {
      const family = fixtureFamily("fixture-a1-object-action"); // schema order: subject, predicate, object
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const predicateSenseId = "fixture-a1-sense-study";

      // A non-predicate (object) value that also carries a senseId — proves
      // usedLexemeSenseIds is not hardcoded to "only the predicate slot".
      const objectValueWithSense: SemanticValue = withFixtureOverride(
        catalogs.semanticValues.find(
          (value) => value.id === "fixture-a1-value-object-japanese",
        ) as SemanticValue,
        { id: "test-object-value-with-sense", senseId: "fixture-a2-sense-eat" },
      );
      // A subject (earlier-in-schema) value that duplicates the predicate's
      // own senseId — proves dedup keeps the first schema-order occurrence
      // rather than double-counting or dropping the predicate sense.
      const subjectValueWithPredicateSense: SemanticValue = withFixtureOverride(
        catalogs.semanticValues.find((value) => value.id === "fixture-value-yuki") as SemanticValue,
        { id: "test-subject-value-with-predicate-sense", senseId: predicateSenseId },
      );

      const extendedCatalogs: RealizeVariantCatalogs = {
        ...catalogs,
        semanticValues: [
          ...catalogs.semanticValues,
          objectValueWithSense,
          subjectValueWithPredicateSense,
        ],
      };
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-used-sense-ids",
        slotValues: {
          ...base.slotValues,
          subject: subjectValueWithPredicateSense.id,
          object: objectValueWithSense.id,
        },
      });

      const result = realizeVariant(family, variant, extendedCatalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.predicateSenseId).toBe(predicateSenseId);
      expect(result.sentence.usedLexemeSenseIds).toEqual([
        predicateSenseId,
        "fixture-a2-sense-eat",
      ]);
    });
  });

  describe("error codes", () => {
    it("fails closed with family-variant-mismatch when the variant belongs to a different family", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const mismatched = fixtureVariant("fixture-a1-yuki-live-rome"); // belongs to residence-action

      const result = realizeVariant(family, mismatched, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "family-variant-mismatch");
    });

    it("fails closed with illegal-axis-value when a slot's axis is not permitted by the family", () => {
      const base = fixtureFamily("fixture-a1-object-action");
      const brokenFamily: SentenceFamily = withFixtureOverride(base, {
        slotSchema: base.slotSchema.map((slot) =>
          slot.id === "object" ? { ...slot, axis: "time" as const } : slot,
        ),
      });
      const variant = fixtureVariant("fixture-a1-yuki-study-japanese");

      const result = realizeVariant(brokenFamily, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "illegal-axis-value");
      expect(result.errors[0]?.slotId).toBe("object");
    });

    it("fails closed with unmet-concept-requirement when a required concept was never taught", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const variant = fixtureVariant("fixture-a1-yuki-study-japanese");

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: [],
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "unmet-concept-requirement");
      expect(result.errors.map((error) => error.referenceId)).toEqual([
        ...family.requiredConceptIds,
      ]);
    });

    it("fails closed with incompatible-animacy when the subject value's animacy contradicts the referent", () => {
      const family = fixtureFamily("fixture-a1-topic-copular");
      const base = fixtureVariant("fixture-a1-yuki-student-meeting");
      const inanimateYuki: SemanticValue = withFixtureOverride(
        catalogs.semanticValues.find((value) => value.id === "fixture-value-yuki") as SemanticValue,
        { id: "test-inanimate-yuki", animacy: "inanimate" },
      );
      const brokenCatalogs: RealizeVariantCatalogs = {
        ...catalogs,
        semanticValues: [...catalogs.semanticValues, inanimateYuki],
      };
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-incompatible-animacy",
        slotValues: { ...base.slotValues, subject: inanimateYuki.id },
      });

      const result = realizeVariant(family, variant, brokenCatalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "incompatible-animacy");
    });

    it("fails closed with invalid-argument-structure when the variant declares an undeclared slot", () => {
      const family = fixtureFamily("fixture-a1-topic-copular");
      const base = fixtureVariant("fixture-a1-yuki-student-meeting");
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-undeclared-slot",
        slotValues: { ...base.slotValues, extraneous: "fixture-a1-value-object-student" },
      });

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "invalid-argument-structure");
      expect(result.errors[0]?.slotId).toBe("extraneous");
    });

    it("fails closed with invalid-conjugation for the currently unsupported plain form", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-plain-form",
        form: { ...base.form, formality: "plain" },
      });

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "invalid-conjugation");
    });

    it("fails closed with unknown-sense when the predicate value's sense id does not resolve", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const brokenPredicateValue: SemanticValue = withFixtureOverride(
        catalogs.semanticValues.find(
          (value) => value.id === "fixture-a1-value-study",
        ) as SemanticValue,
        { id: "test-unknown-sense-predicate", senseId: "no-such-sense" },
      );
      const brokenCatalogs: RealizeVariantCatalogs = {
        ...catalogs,
        semanticValues: [...catalogs.semanticValues, brokenPredicateValue],
      };
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-unknown-sense",
        slotValues: { ...base.slotValues, predicate: brokenPredicateValue.id },
      });

      const result = realizeVariant(family, variant, brokenCatalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "unknown-sense");
    });

    it("fails closed with unresolved-discourse-reference when the subject referent id does not resolve", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-unresolved-referent",
        discourse: { ...base.discourse, subjectReferentId: "no-such-referent" },
      });

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "unresolved-discourse-reference");
      expect(result.errors[0]?.referenceId).toBe("no-such-referent");
    });

    it("fails closed with unknown-context when the context id does not resolve", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-unknown-context",
        contextId: "no-such-context",
      });

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "unknown-context");
      expect(result.errors[0]?.referenceId).toBe("no-such-context");
    });

    it("fails closed with unknown-realization-rule when the family points at an unregistered rule", () => {
      const base = fixtureFamily("fixture-a1-object-action");
      const brokenFamily: SentenceFamily = withFixtureOverride(base, {
        realizationRuleId: "fixture-rule-does-not-exist",
      });
      const variant = fixtureVariant("fixture-a1-yuki-study-japanese");

      const result = realizeVariant(brokenFamily, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "unknown-realization-rule");
    });

    it("fails closed with invalid-romaji-sequence when a semantic fragment has no romaji", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const brokenObjectValue: SemanticValue = withFixtureOverride(
        catalogs.semanticValues.find(
          (value) => value.id === "fixture-a1-value-object-japanese",
        ) as SemanticValue,
        {
          id: "test-empty-romaji-object",
          tokenFragments: [
            { jp: "にほんご", romaji: "", kind: "lexical", boundaryBefore: "attach" },
          ],
        },
      );
      const brokenCatalogs: RealizeVariantCatalogs = {
        ...catalogs,
        semanticValues: [...catalogs.semanticValues, brokenObjectValue],
      };
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-empty-romaji",
        slotValues: { ...base.slotValues, object: brokenObjectValue.id },
      });

      const result = realizeVariant(family, variant, brokenCatalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "invalid-romaji-sequence");
    });

    it("fails closed with unknown-semantic-value when a slot references a nonexistent semantic value id", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-unknown-value",
        slotValues: { ...base.slotValues, object: "no-such-semantic-value" },
      });

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "unknown-semantic-value");
      expect(result.errors[0]?.referenceId).toBe("no-such-semantic-value");
    });

    it("fails closed with missing-slot when a required slot has no value", () => {
      const family = fixtureFamily("fixture-a1-topic-copular");
      const base = fixtureVariant("fixture-a1-yuki-student-meeting");
      const { object: _omitted, ...withoutObject } = base.slotValues;
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-missing-slot",
        slotValues: withoutObject,
      });

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "missing-slot");
      expect(result.errors[0]?.slotId).toBe("object");
    });

    it("orders errors deterministically, surfacing only the earlier-stage error when two stages are broken", () => {
      const family = fixtureFamily("fixture-a1-topic-copular");
      const base = fixtureVariant("fixture-a1-yuki-student-meeting");
      const { object: _omitted, ...withoutObject } = base.slotValues;
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-double-broken",
        contextId: "no-such-context", // earlier stage: unknown-context
        slotValues: withoutObject, // later stage: missing-slot
      });

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "unknown-context");
    });
  });
});

import { describe, expect, it } from "vitest";

import { formatRomaji } from "../../romaji/formatRomaji";
import {
  a1Contexts,
  a1LearningTargetSenses,
  a1PersonRoles,
  a1Referents,
  a1SemanticValues,
  a1SentenceFamilies,
} from "../a1/catalog/a1SemanticCatalog";
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

    it("realizes explicit and omitted subjects through the A1 bare polite-action family", () => {
      const family = a1SentenceFamilies.find(
        (candidate) => candidate.id === "a1-family-bare-action",
      );
      expect(family).toBeDefined();
      if (!family) return;

      const a1Catalogs: RealizeVariantCatalogs = {
        contexts: a1Contexts,
        personRoles: a1PersonRoles,
        referents: a1Referents,
        semanticValues: a1SemanticValues,
        learningTargetSenses: a1LearningTargetSenses,
      };
      const explicit = withFixtureOverride(
        fixtureVariant("fixture-a1-yuki-study-japanese"),
        {
          id: "test-a1-bare-study-explicit",
          sentenceFamilyId: family.id,
          discourse: {
            speakerRoleId: "a1-role-yuki",
            addresseeRoleId: "a1-role-learner",
            subjectReferentId: "a1-referent-yuki",
            subjectRealization: "explicit",
            scenarioNoteCopyId: "test-a1-bare-study-explicit-scenario",
          },
          contextId: "a1-context-classroom",
          slotValues: {
            subject: "a1-value-yuki",
            predicate: "a1-value-study-bare",
          },
        },
      );
      const omitted = withFixtureOverride(
        fixtureVariant("fixture-a1-yuki-study-japanese"),
        {
          id: "test-a1-bare-work-omitted",
          sentenceFamilyId: family.id,
          discourse: {
            speakerRoleId: "a1-role-learner",
            addresseeRoleId: "a1-role-teacher",
            subjectReferentId: "a1-referent-self",
            subjectRealization: "omitted",
            scenarioNoteCopyId: "test-a1-bare-work-omitted-scenario",
          },
          contextId: "a1-context-workplace",
          slotValues: {
            subject: "a1-value-watashi",
            predicate: "a1-value-work-bare",
          },
        },
      );

      const explicitResult = realizeVariant(family, explicit, a1Catalogs, {
        availableConceptIds: ["a1-concept-topic-wa"],
      });
      expect(explicitResult.ok).toBe(true);
      if (explicitResult.ok) {
        expect(explicitResult.sentence.canonicalJapanese).toBe("ゆきはべんきょうします");
        const romaji = formatRomaji(explicitResult.sentence.tokens);
        expect(romaji.ok).toBe(true);
        if (romaji.ok) expect(romaji.text).toBe("yuki wa benkyoushimasu");
      }

      const omittedResult = realizeVariant(family, omitted, a1Catalogs, {
        availableConceptIds: ["a1-concept-topic-wa"],
      });
      expect(omittedResult.ok).toBe(true);
      if (omittedResult.ok) {
        expect(omittedResult.sentence.canonicalJapanese).toBe("はたらきます");
        const romaji = formatRomaji(omittedResult.sentence.tokens);
        expect(romaji.ok).toBe(true);
        if (romaji.ok) expect(romaji.text).toBe("hatarakimasu");
      }
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

    it("fails closed with invalid-argument-structure when a theme-governing sense is realized through a themeless (non-governed-theme) rule", () => {
      // Forward direction of the same invariant as the test above: a sense
      // that *requires* a governed theme (e.g. `study`) must never be
      // silently realized by a family/rule whose `object` slot is not
      // `governed-theme` — that would drop a required argument without ever
      // surfacing an error. `fixture-a1-topic-copular`'s object slot is
      // `copular-complement`, so pairing it with the theme-governing `study`
      // sense must fail closed instead of silently realizing a copular
      // sentence that drops `study`'s required theme.
      const family = fixtureFamily("fixture-a1-topic-copular"); // objectRole: "copular-complement"
      const base = fixtureVariant("fixture-a1-yuki-student-meeting");
      const studySense = catalogs.learningTargetSenses.find(
        (candidate) => candidate.id === "fixture-a1-sense-study",
      ) as LearningTargetSense;
      expect(studySense.argumentRoles).toContain("theme");
      const studyValue = catalogs.semanticValues.find(
        (value) => value.id === "fixture-a1-value-study",
      ) as SemanticValue;

      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-theme-in-themeless-rule",
        slotValues: { ...base.slotValues, predicate: studyValue.id },
      });

      const result = realizeVariant(family, variant, catalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "invalid-argument-structure");
      expect(result.errors[0]?.slotId).toBe("object");
      expect(result.errors[0]?.referenceId).toBe("theme");
    });

    it("realizes successfully when the same theme-governing sense is realized through its governed-theme rule", () => {
      // Same `study` sense as above, this time correctly paired with
      // `fixture-a1-object-action` (objectRole: "governed-theme", with an
      // `object` slot) — proving the forward check only rejects the
      // themeless pairing, not the sense itself.
      const family = fixtureFamily("fixture-a1-object-action"); // objectRole: "governed-theme"
      const variant = fixtureVariant("fixture-a1-yuki-study-japanese");

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

    it("fails closed with unknown-sense when a non-predicate subject value's sense id does not resolve, and never reaches usedLexemeSenseIds", () => {
      // Generic slot-senseId validation is not hardcoded to the predicate
      // slot: a subject value carrying an unresolvable senseId must fail
      // closed exactly like an unresolvable predicate sense, before the
      // realizer ever reaches assembly (so the bad id can never surface in
      // a successful `usedLexemeSenseIds`).
      const family = fixtureFamily("fixture-a1-object-action");
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const brokenSubjectValue: SemanticValue = withFixtureOverride(
        catalogs.semanticValues.find(
          (value) => value.id === "fixture-value-yuki",
        ) as SemanticValue,
        { id: "test-subject-unknown-sense", senseId: "no-such-sense-subject" },
      );
      const brokenCatalogs: RealizeVariantCatalogs = {
        ...catalogs,
        semanticValues: [...catalogs.semanticValues, brokenSubjectValue],
      };
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-subject-unknown-sense-variant",
        slotValues: { ...base.slotValues, subject: brokenSubjectValue.id },
      });

      const result = realizeVariant(family, variant, brokenCatalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "unknown-sense");
      expect(result.errors[0]?.slotId).toBe("subject");
      expect(result.errors[0]?.referenceId).toBe("no-such-sense-subject");
    });

    it("fails closed with unknown-sense when a non-predicate object value's sense id does not resolve", () => {
      const family = fixtureFamily("fixture-a1-object-action");
      const base = fixtureVariant("fixture-a1-yuki-study-japanese");
      const brokenObjectValue: SemanticValue = withFixtureOverride(
        catalogs.semanticValues.find(
          (value) => value.id === "fixture-a1-value-object-japanese",
        ) as SemanticValue,
        { id: "test-object-unknown-sense", senseId: "no-such-sense-object" },
      );
      const brokenCatalogs: RealizeVariantCatalogs = {
        ...catalogs,
        semanticValues: [...catalogs.semanticValues, brokenObjectValue],
      };
      const variant: SentenceVariant = withFixtureOverride(base, {
        id: "test-object-unknown-sense-variant",
        slotValues: { ...base.slotValues, object: brokenObjectValue.id },
      });

      const result = realizeVariant(family, variant, brokenCatalogs, {
        availableConceptIds: a1ConceptIds,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expectSingleError(result.errors, "unknown-sense");
      expect(result.errors[0]?.slotId).toBe("object");
      expect(result.errors[0]?.referenceId).toBe("no-such-sense-object");
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

// ---------------------------------------------------------------------------
// §16 realizer generalization: stable rule ids + aliases, `ga` particle,
// interrogative か. These prove the Phase 1 realizer now serves the deep A1
// release catalog without any fixture regression (covered separately by the
// full foundations suite staying green).
// ---------------------------------------------------------------------------

describe("realizer generalization (stable rule ids, ga, interrogative)", () => {
  it("resolves a stable rule id identically to its fixture alias", () => {
    const base = fixtureFamily("fixture-a1-topic-copular");
    const aliasResult = realizeVariant(
      base,
      fixtureVariant("fixture-a1-yuki-student-meeting"),
      catalogs,
      { availableConceptIds: a1ConceptIds },
    );
    const stableFamily: SentenceFamily = withFixtureOverride(base, {
      realizationRuleId: "rule-topic-copular",
    });
    const stableResult = realizeVariant(
      stableFamily,
      fixtureVariant("fixture-a1-yuki-student-meeting"),
      catalogs,
      { availableConceptIds: a1ConceptIds },
    );

    expect(aliasResult.ok).toBe(true);
    expect(stableResult.ok).toBe(true);
    if (!aliasResult.ok || !stableResult.ok) return;
    expect(stableResult.sentence.canonicalJapanese).toBe(
      aliasResult.sentence.canonicalJapanese,
    );
    expect(stableResult.sentence.tokens.map((t) => t.jp)).toEqual(
      aliasResult.sentence.tokens.map((t) => t.jp),
    );
  });

  it("appends か and a mood segment for an interrogative form; the statement carries neither", () => {
    const family = fixtureFamily("fixture-a1-topic-copular");
    const statement = fixtureVariant("fixture-a1-yuki-student-meeting");
    const question: SentenceVariant = withFixtureOverride(statement, {
      id: "test-yuki-student-question",
      form: { ...statement.form, interrogative: true },
    });

    const statementResult = realizeVariant(family, statement, catalogs, {
      availableConceptIds: a1ConceptIds,
    });
    const questionResult = realizeVariant(family, question, catalogs, {
      availableConceptIds: a1ConceptIds,
    });

    expect(statementResult.ok).toBe(true);
    expect(questionResult.ok).toBe(true);
    if (!statementResult.ok || !questionResult.ok) return;

    expect(statementResult.sentence.canonicalJapanese.endsWith("か")).toBe(false);
    expect(statementResult.sentence.semanticFingerprint).not.toContain("mood=");

    expect(questionResult.sentence.canonicalJapanese).toBe(
      `${statementResult.sentence.canonicalJapanese}か`,
    );
    expect(questionResult.sentence.semanticFingerprint).toContain(
      "mood=interrogative",
    );
    const romaji = formatRomaji(questionResult.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text.endsWith(" ka")).toBe(true);
  });

  it("realizes a nominative (が) theme verb — 日本語がわかります", () => {
    const understandSense: LearningTargetSense = {
      id: "test-sense-understand",
      lexemeId: "test-lexeme-wakaru",
      learningUse: "productive",
      semanticFrameId: "test-frame-understand",
      predicate: "understand" as LearningTargetSense["predicate"],
      argumentRoles: ["theme"],
      argumentParticleByRole: {},
    };
    const themeValue: SemanticValue = {
      id: "test-value-japanese-ga",
      kind: "object",
      tokenFragments: [
        { jp: "にほんご", romaji: "nihongo", kind: "lexical", boundaryBefore: "attach" },
      ],
    };
    const predicateValue: SemanticValue = {
      id: "test-value-understand",
      kind: "predicate-sense",
      senseId: "test-sense-understand",
      tokenFragments: [
        { jp: "わかり", romaji: "wakari", kind: "lexical", boundaryBefore: "attach" },
      ],
    };
    const family: SentenceFamily = {
      id: "test-nominative-action" as SentenceFamily["id"],
      level: "a1",
      canDoIds: [],
      slotSchema: [
        { id: "object", axis: "object", valueKind: "object", optional: false },
        { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      ],
      permittedAxes: ["object", "predicate-verb"],
      realizationRuleId: "rule-nominative-action",
      requiredConceptIds: [],
    };
    const variant: SentenceVariant = {
      id: "test-understand-japanese",
      sentenceFamilyId: family.id,
      discourse: {
        speakerRoleId: "fixture-role-learner",
        addresseeRoleId: null,
        subjectReferentId: null,
        subjectRealization: "omitted",
        scenarioNoteCopyId: "test-scenario",
      },
      contextId: "fixture-a1-context-language-class",
      slotValues: { object: themeValue.id, predicate: predicateValue.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const localCatalogs: RealizeVariantCatalogs = {
      ...catalogs,
      semanticValues: [...catalogs.semanticValues, themeValue, predicateValue],
      learningTargetSenses: [...catalogs.learningTargetSenses, understandSense],
    };

    const result = realizeVariant(family, variant, localCatalogs, {
      availableConceptIds: [],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("にほんごがわかります");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("nihongo ga wakarimasu");
  });
});

// ---------------------------------------------------------------------------
// Standalone predicate boundaries: the polite copula (です/でした/では
// ありません/…) is a sequence of *space-bound* standalone predicate pieces,
// never a hidden run-on morpheme attached to the preceding nominal. Verb
// inflection (ます/…) keeps attaching to its stem. The shared formatter is the
// single oracle for spacing in every assertion below.
// ---------------------------------------------------------------------------

describe("standalone predicate boundaries (polite copula vs. attached verb inflection)", () => {
  const copularFamily = fixtureFamily("fixture-a1-topic-copular");
  const base = fixtureVariant("fixture-a1-yuki-student-meeting");

  const copulaVariant = (
    idSuffix: string,
    form: Partial<SentenceVariant["form"]>,
  ): SentenceVariant =>
    withFixtureOverride(base, {
      id: `test-copula-${idSuffix}`,
      form: { ...base.form, ...form },
    });

  const realizeCopula = (variant: SentenceVariant) => {
    const result = realizeVariant(copularFamily, variant, catalogs, {
      availableConceptIds: a1ConceptIds,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected copula realization to succeed");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) throw new Error("expected copula romaji to format");
    return { sentence: result.sentence, romaji };
  };

  it("present affirmative です is a standalone space-bound predicate — `gakusei desu`", () => {
    const { sentence, romaji } = realizeCopula(
      copulaVariant("present-affirmative", {
        tense: "present",
        polarity: "affirmative",
      }),
    );
    expect(sentence.canonicalJapanese).toBe("ゆきはがくせいです");
    expect(romaji.text).toBe("yuki wa gakusei desu");
    expect(sentence.tokens.map((t) => t.jp)).toEqual([
      "ゆき",
      "は",
      "がくせい",
      "です",
    ]);
    const desu = sentence.tokens[sentence.tokens.length - 1];
    expect(desu.jp).toBe("です");
    expect(desu.romaji).toBe("desu");
    expect(desu.boundaryBefore).toBe("space");
  });

  it("past affirmative でした is a standalone space-bound predicate — `gakusei deshita`", () => {
    const { sentence, romaji } = realizeCopula(
      copulaVariant("past-affirmative", { tense: "past", polarity: "affirmative" }),
    );
    expect(sentence.canonicalJapanese).toBe("ゆきはがくせいでした");
    expect(romaji.text).toBe("yuki wa gakusei deshita");
    expect(sentence.tokens.map((t) => t.jp)).toEqual([
      "ゆき",
      "は",
      "がくせい",
      "でした",
    ]);
    expect(sentence.tokens[sentence.tokens.length - 1].boundaryBefore).toBe("space");
  });

  it("present negative tokenizes では + ありません as two space-bound pieces — `gakusei dewa arimasen`", () => {
    const { sentence, romaji } = realizeCopula(
      copulaVariant("present-negative", { tense: "present", polarity: "negative" }),
    );
    expect(sentence.canonicalJapanese).toBe("ゆきはがくせいではありません");
    expect(romaji.text).toBe("yuki wa gakusei dewa arimasen");
    expect(sentence.tokens.map((t) => t.jp)).toEqual([
      "ゆき",
      "は",
      "がくせい",
      "では",
      "ありません",
    ]);
    const [dewa, arimasen] = sentence.tokens.slice(-2);
    expect(dewa.romaji).toBe("dewa");
    expect(dewa.boundaryBefore).toBe("space");
    expect(arimasen.romaji).toBe("arimasen");
    expect(arimasen.boundaryBefore).toBe("space");
    // No hidden internal join: each morpheme is its own token, never a single
    // "dewa arimasen" romaji cell.
    expect(sentence.tokens.every((t) => !t.romaji.includes(" "))).toBe(true);
  });

  it("past negative tokenizes では + ありません + でした as three space-bound pieces — `gakusei dewa arimasen deshita`", () => {
    const { sentence, romaji } = realizeCopula(
      copulaVariant("past-negative", { tense: "past", polarity: "negative" }),
    );
    expect(sentence.canonicalJapanese).toBe("ゆきはがくせいではありませんでした");
    expect(romaji.text).toBe("yuki wa gakusei dewa arimasen deshita");
    expect(sentence.tokens.map((t) => t.jp)).toEqual([
      "ゆき",
      "は",
      "がくせい",
      "では",
      "ありません",
      "でした",
    ]);
    for (const piece of sentence.tokens.slice(-3)) {
      expect(piece.boundaryBefore).toBe("space");
    }
    expect(sentence.tokens.every((t) => !t.romaji.includes(" "))).toBe(true);
  });

  it("gives every copula ending piece a unique, source-traceable token id", () => {
    const { sentence } = realizeCopula(
      copulaVariant("past-negative-ids", { tense: "past", polarity: "negative" }),
    );
    const ids = sentence.tokens.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const token of sentence.tokens) {
      expect(token.source.domain).toBe("family");
      expect(token.source.referenceId.length).toBeGreaterThan(0);
    }
  });

  it("keeps か after です spaced for an interrogative copula — `gakusei desu ka`", () => {
    const { sentence, romaji } = realizeCopula(
      copulaVariant("question", {
        tense: "present",
        polarity: "affirmative",
        interrogative: true,
      }),
    );
    expect(sentence.canonicalJapanese).toBe("ゆきはがくせいですか");
    expect(romaji.text).toBe("yuki wa gakusei desu ka");
    expect(romaji.text).not.toMatch(/\wdesu/);
  });

  it("never emits a run-on `\\wdesu` for any polite copula form", () => {
    for (const form of [
      { tense: "present", polarity: "affirmative" },
      { tense: "past", polarity: "affirmative" },
      { tense: "present", polarity: "negative" },
      { tense: "past", polarity: "negative" },
    ] as const) {
      const { romaji } = realizeCopula(
        copulaVariant(`no-runon-${form.tense}-${form.polarity}`, form),
      );
      expect(romaji.text).not.toMatch(/\wdesu/);
      expect(romaji.text).not.toMatch(/\wdeshita/);
    }
  });

  it("keeps polite verb ます attached to its stem — `benkyoushimasu`, never `benkyoushi masu`", () => {
    const family = fixtureFamily("fixture-a1-object-action");
    const variant = fixtureVariant("fixture-a1-yuki-study-japanese");
    const result = realizeVariant(family, variant, catalogs, {
      availableConceptIds: a1ConceptIds,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ending = result.sentence.tokens[result.sentence.tokens.length - 1];
    expect(ending.romaji).toBe("masu");
    expect(ending.kind).toBe("morpheme");
    expect(ending.boundaryBefore).toBe("attach");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("yuki wa nihongo o benkyoushimasu");
    expect(romaji.text).not.toContain("benkyoushi masu");
  });
});

// ---------------------------------------------------------------------------
// Quality-review Minor M4: `rule-schedule-action`, `rule-direction-action`,
// `rule-route-action`, and `rule-transport-action` (Task 3 realizer rules)
// previously had zero test coverage — neither a fixture family nor a direct
// unit test ever exercised them, so a production regression in any of the
// four could ship silently. Each rule gets one positive test (exact
// canonicalJapanese + romaji, proving the fixed particle(s) and content-slot
// order the rule's own code comment documents) and one negative test (a
// sense whose `argumentRoles` omit the governed role the family's slot
// shape requires, proving §11's frame check — not merely "some error" —
// actually fires for these four rules specifically). Fully self-contained
// local families/senses/values (the same pattern as "realizer
// generalization" > "realizes a nominative (が) theme verb" above) — no
// `fixtures.ts` changes, so no other suite's counts are touched.
// ---------------------------------------------------------------------------

describe("Task 3 realizer rules: schedule/direction/route/transport (M4)", () => {
  const wakeSense: LearningTargetSense = {
    id: "test-sense-wake-m4",
    lexemeId: "test-lexeme-okiru-m4",
    learningUse: "productive",
    semanticFrameId: "test-frame-wake-m4",
    predicate: "wake" as LearningTargetSense["predicate"],
    argumentRoles: ["time"],
    argumentParticleByRole: {},
  };
  const wakeSenseNoTime: LearningTargetSense = {
    ...wakeSense,
    id: "test-sense-wake-m4-no-time",
    argumentRoles: [],
  };
  const goSense: LearningTargetSense = {
    id: "test-sense-go-m4",
    lexemeId: "test-lexeme-iku-m4",
    learningUse: "productive",
    semanticFrameId: "test-frame-go-m4",
    predicate: "go" as LearningTargetSense["predicate"],
    argumentRoles: ["location"],
    argumentParticleByRole: {},
  };
  const goSenseNoLocation: LearningTargetSense = {
    ...goSense,
    id: "test-sense-go-m4-no-location",
    argumentRoles: [],
  };

  const timeValue: SemanticValue = {
    id: "test-value-time-7-m4",
    kind: "time",
    tokenFragments: [
      { jp: "しちじ", romaji: "shichiji", kind: "lexical", boundaryBefore: "attach" },
    ],
  };
  const wakeValue: SemanticValue = {
    id: "test-value-wake-m4",
    kind: "predicate-sense",
    senseId: wakeSense.id,
    tokenFragments: [{ jp: "おき", romaji: "oki", kind: "lexical", boundaryBefore: "attach" }],
  };
  const wakeValueNoTime: SemanticValue = {
    ...wakeValue,
    id: "test-value-wake-m4-no-time",
    senseId: wakeSenseNoTime.id,
  };
  const stationValue: SemanticValue = {
    id: "test-value-station-m4",
    kind: "location",
    tokenFragments: [{ jp: "えき", romaji: "eki", kind: "lexical", boundaryBefore: "attach" }],
  };
  const tokyoValue: SemanticValue = {
    id: "test-value-tokyo-m4",
    kind: "location",
    tokenFragments: [
      { jp: "とうきょう", romaji: "toukyou", kind: "lexical", boundaryBefore: "attach" },
    ],
  };
  const osakaValue: SemanticValue = {
    id: "test-value-osaka-m4",
    kind: "location",
    tokenFragments: [
      { jp: "おおさか", romaji: "oosaka", kind: "lexical", boundaryBefore: "attach" },
    ],
  };
  const trainValue: SemanticValue = {
    id: "test-value-train-m4",
    kind: "object",
    tokenFragments: [{ jp: "でんしゃ", romaji: "densha", kind: "lexical", boundaryBefore: "attach" }],
  };
  const goValue: SemanticValue = {
    id: "test-value-go-m4",
    kind: "predicate-sense",
    senseId: goSense.id,
    tokenFragments: [{ jp: "いき", romaji: "iki", kind: "lexical", boundaryBefore: "attach" }],
  };
  const goValueNoLocation: SemanticValue = {
    ...goValue,
    id: "test-value-go-m4-no-location",
    senseId: goSenseNoLocation.id,
  };

  const baseDiscourse = {
    speakerRoleId: "fixture-role-learner",
    addresseeRoleId: null,
    subjectReferentId: null,
    subjectRealization: "omitted" as const,
    scenarioNoteCopyId: "test-scenario-m4",
  };

  function localCatalogsWith(
    extraValues: readonly SemanticValue[],
    extraSenses: readonly LearningTargetSense[],
  ): RealizeVariantCatalogs {
    return {
      ...catalogs,
      semanticValues: [...catalogs.semanticValues, ...extraValues],
      learningTargetSenses: [...catalogs.learningTargetSenses, ...extraSenses],
    };
  }

  // ---- rule-schedule-action: verb + に-marked clock time -----------------

  const scheduleFamily: SentenceFamily = {
    id: "test-family-schedule-m4" as SentenceFamily["id"],
    level: "a1",
    canDoIds: [],
    slotSchema: [
      { id: "time", axis: "time", valueKind: "time", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["time", "predicate-verb"],
    realizationRuleId: "rule-schedule-action",
    requiredConceptIds: [],
  };

  it("rule-schedule-action: realizes しちじにおきます / shichiji ni okimasu", () => {
    const variant: SentenceVariant = {
      id: "test-variant-schedule-m4",
      sentenceFamilyId: scheduleFamily.id,
      discourse: baseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { time: timeValue.id, predicate: wakeValue.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      scheduleFamily,
      variant,
      localCatalogsWith([timeValue, wakeValue], [wakeSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("しちじにおきます");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("shichiji ni okimasu");
  });

  it("rule-schedule-action: rejects a sense whose argumentRoles omit `time`", () => {
    const variant: SentenceVariant = {
      id: "test-variant-schedule-m4-invalid",
      sentenceFamilyId: scheduleFamily.id,
      discourse: baseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { time: timeValue.id, predicate: wakeValueNoTime.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      scheduleFamily,
      variant,
      localCatalogsWith([timeValue, wakeValueNoTime], [wakeSenseNoTime]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "invalid-argument-structure",
        slotId: "time",
        referenceId: "time",
      }),
    );
  });

  // ---- rule-direction-action: verb + へ-marked direction ------------------

  const directionFamily: SentenceFamily = {
    id: "test-family-direction-m4" as SentenceFamily["id"],
    level: "a1",
    canDoIds: [],
    slotSchema: [
      { id: "location", axis: "location", valueKind: "location", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["location", "predicate-verb"],
    realizationRuleId: "rule-direction-action",
    requiredConceptIds: [],
  };

  it("rule-direction-action: realizes えきへいきます / eki e ikimasu", () => {
    const variant: SentenceVariant = {
      id: "test-variant-direction-m4",
      sentenceFamilyId: directionFamily.id,
      discourse: baseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { location: stationValue.id, predicate: goValue.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      directionFamily,
      variant,
      localCatalogsWith([stationValue, goValue], [goSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("えきへいきます");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("eki e ikimasu");
  });

  it("rule-direction-action: rejects a sense whose argumentRoles omit `location`", () => {
    const variant: SentenceVariant = {
      id: "test-variant-direction-m4-invalid",
      sentenceFamilyId: directionFamily.id,
      discourse: baseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { location: stationValue.id, predicate: goValueNoLocation.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      directionFamily,
      variant,
      localCatalogsWith([stationValue, goValueNoLocation], [goSenseNoLocation]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "invalid-argument-structure",
        slotId: "location",
        referenceId: "location",
      }),
    );
  });

  // ---- rule-route-action: verb + から source + まで goal ------------------

  const routeFamily: SentenceFamily = {
    id: "test-family-route-m4" as SentenceFamily["id"],
    level: "a1",
    canDoIds: [],
    slotSchema: [
      { id: "source", axis: "location", valueKind: "location", optional: false },
      { id: "goal", axis: "location", valueKind: "location", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["location", "predicate-verb"],
    realizationRuleId: "rule-route-action",
    requiredConceptIds: [],
  };

  it("rule-route-action: realizes とうきょうからおおさかまでいきます / toukyou kara oosaka made ikimasu", () => {
    const variant: SentenceVariant = {
      id: "test-variant-route-m4",
      sentenceFamilyId: routeFamily.id,
      discourse: baseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { source: tokyoValue.id, goal: osakaValue.id, predicate: goValue.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      routeFamily,
      variant,
      localCatalogsWith([tokyoValue, osakaValue, goValue], [goSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("とうきょうからおおさかまでいきます");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("toukyou kara oosaka made ikimasu");
  });

  it("rule-route-action: rejects a sense whose argumentRoles omit `location` (source/goal both location-kind)", () => {
    const variant: SentenceVariant = {
      id: "test-variant-route-m4-invalid",
      sentenceFamilyId: routeFamily.id,
      discourse: baseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: {
        source: tokyoValue.id,
        goal: osakaValue.id,
        predicate: goValueNoLocation.id,
      },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      routeFamily,
      variant,
      localCatalogsWith([tokyoValue, osakaValue, goValueNoLocation], [goSenseNoLocation]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "invalid-argument-structure", referenceId: "location" }),
    );
  });

  // ---- rule-transport-action: verb + で means + に destination ------------

  const transportFamily: SentenceFamily = {
    id: "test-family-transport-m4" as SentenceFamily["id"],
    level: "a1",
    canDoIds: [],
    slotSchema: [
      { id: "transport", axis: "object", valueKind: "object", optional: false },
      { id: "location", axis: "location", valueKind: "location", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["object", "location", "predicate-verb"],
    realizationRuleId: "rule-transport-action",
    requiredConceptIds: [],
  };

  it("rule-transport-action: realizes でんしゃでえきにいきます / densha de eki ni ikimasu", () => {
    const variant: SentenceVariant = {
      id: "test-variant-transport-m4",
      sentenceFamilyId: transportFamily.id,
      discourse: baseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { transport: trainValue.id, location: stationValue.id, predicate: goValue.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      transportFamily,
      variant,
      localCatalogsWith([trainValue, stationValue, goValue], [goSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("でんしゃでえきにいきます");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("densha de eki ni ikimasu");
  });

  it("rule-transport-action: rejects a sense whose argumentRoles omit `location`", () => {
    const variant: SentenceVariant = {
      id: "test-variant-transport-m4-invalid",
      sentenceFamilyId: transportFamily.id,
      discourse: baseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: {
        transport: trainValue.id,
        location: stationValue.id,
        predicate: goValueNoLocation.id,
      },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      transportFamily,
      variant,
      localCatalogsWith([trainValue, stationValue, goValueNoLocation], [goSenseNoLocation]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        code: "invalid-argument-structure",
        slotId: "location",
        referenceId: "location",
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Phase 3 Task 7 (A2 M13 relationships-events, give-receive): a genuinely
// compositional あげる/もらう construction needs TWO independently-varying
// content slots after the topic — a に-marked recipient/source and a を-marked
// gift/theme object, in that natural word order ("そらにほんをあげます") —
// which no existing rule shape provides (`rule-recipient-action` has only one
// content slot; `rule-transport-action`/`rule-route-action` both pair a
// location-kind slot with a different fixed particle, never object+を).
// `rule-recipient-object-action` is the minimal, purely additive rule that
// closes this gap: a real "referent"-kind `recipient` slot (never a
// discourse-tracked subject — see `realizeVariant`'s own `subject`-only
// special-casing) marked に, followed by a governed-theme `object` slot marked
// を, then the ordinary verb ending table. No existing family references this
// id, so no A1/A2 fixture behavior changes.
// ---------------------------------------------------------------------------

describe("Phase 3 Task 7 realizer rule: rule-recipient-object-action (A2 M13 give-receive)", () => {
  const giveSense: LearningTargetSense = {
    id: "test-sense-give-m13",
    lexemeId: "test-lexeme-ageru-m13",
    learningUse: "productive",
    semanticFrameId: "test-frame-give-m13",
    predicate: "give" as LearningTargetSense["predicate"],
    argumentRoles: ["theme"],
    argumentParticleByRole: {},
  };
  const giveSenseNoTheme: LearningTargetSense = {
    ...giveSense,
    id: "test-sense-give-m13-no-theme",
    argumentRoles: [],
  };
  const recipientValue: SemanticValue = {
    id: "test-value-recipient-m13",
    kind: "referent",
    animacy: "animate",
    tokenFragments: [{ jp: "そら", romaji: "sora", kind: "lexical", boundaryBefore: "attach" }],
  };
  const giftValue: SemanticValue = {
    id: "test-value-gift-m13",
    kind: "object",
    tokenFragments: [{ jp: "ほん", romaji: "hon", kind: "lexical", boundaryBefore: "attach" }],
  };
  const giveValue: SemanticValue = {
    id: "test-value-give-m13",
    kind: "predicate-sense",
    senseId: giveSense.id,
    tokenFragments: [{ jp: "あげ", romaji: "age", kind: "lexical", boundaryBefore: "attach" }],
  };
  const giveValueNoTheme: SemanticValue = {
    ...giveValue,
    id: "test-value-give-m13-no-theme",
    senseId: giveSenseNoTheme.id,
  };

  const baseDiscourseM13 = {
    speakerRoleId: "fixture-role-learner",
    addresseeRoleId: null,
    subjectReferentId: null,
    subjectRealization: "omitted" as const,
    scenarioNoteCopyId: "test-scenario-m13",
  };

  function localCatalogsWith(
    extraValues: readonly SemanticValue[],
    extraSenses: readonly LearningTargetSense[],
  ): RealizeVariantCatalogs {
    return {
      ...catalogs,
      semanticValues: [...catalogs.semanticValues, ...extraValues],
      learningTargetSenses: [...catalogs.learningTargetSenses, ...extraSenses],
    };
  }

  const giveReceiveFamily: SentenceFamily = {
    id: "test-family-give-receive-m13" as SentenceFamily["id"],
    level: "a2",
    canDoIds: [],
    slotSchema: [
      { id: "recipient", axis: "object", valueKind: "referent", optional: false },
      { id: "object", axis: "object", valueKind: "object", optional: false },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["object", "predicate-verb"],
    realizationRuleId: "rule-recipient-object-action",
    requiredConceptIds: [],
  };

  it("realizes そらにほんをあげます / sora ni hon o agemasu (recipient に precedes gift を)", () => {
    const variant: SentenceVariant = {
      id: "test-variant-give-m13",
      sentenceFamilyId: giveReceiveFamily.id,
      discourse: baseDiscourseM13,
      contextId: "fixture-a1-context-language-class",
      slotValues: { recipient: recipientValue.id, object: giftValue.id, predicate: giveValue.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      giveReceiveFamily,
      variant,
      localCatalogsWith([recipientValue, giftValue, giveValue], [giveSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("そらにほんをあげます");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("sora ni hon o agemasu");
  });

  it("rejects a sense whose argumentRoles omit `theme` (the object slot is a governed theme marked を)", () => {
    const variant: SentenceVariant = {
      id: "test-variant-give-m13-invalid",
      sentenceFamilyId: giveReceiveFamily.id,
      discourse: baseDiscourseM13,
      contextId: "fixture-a1-context-language-class",
      slotValues: { recipient: recipientValue.id, object: giftValue.id, predicate: giveValueNoTheme.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      giveReceiveFamily,
      variant,
      localCatalogsWith([recipientValue, giftValue, giveValueNoTheme], [giveSenseNoTheme]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "invalid-argument-structure", referenceId: "theme" }),
    );
  });
});

/**
 * Phase 3 Task 4: the additive `"invariant"` predicateKind. A2's grammar
 * spiral needs plain-form, suffix-composed (たことがあります/つもりです/よてい
 * です), and whole-baked-clause (connectors, backchannels, から/ので reason
 * clauses, と思います opinions) constructions the polite present/past x
 * affirmative/negative ending tables can never produce generically. Rather
 * than growing those tables, an "invariant" predicate value already carries
 * its *complete* realized content (computed once, at catalog-authoring time,
 * via `conjugate()`/`composeA2Construction()` or hand-composed fragments) —
 * the realizer emits it verbatim, exactly like a content slot, and appends
 * *no* ending morphology at all. This is purely additive: no existing rule
 * references `"invariant"`, so no A1/A2 fixture rule's behavior changes.
 */
describe("realizer generalization: the additive \"invariant\" predicateKind (Phase 3 Task 4)", () => {
  const bareBaseDiscourse = {
    speakerRoleId: "fixture-role-learner",
    addresseeRoleId: null,
    subjectReferentId: null,
    subjectRealization: "omitted" as const,
    scenarioNoteCopyId: "test-scenario-invariant",
  };

  function localCatalogsWith(
    extraValues: readonly SemanticValue[],
    extraSenses: readonly LearningTargetSense[],
  ): RealizeVariantCatalogs {
    return {
      ...catalogs,
      semanticValues: [...catalogs.semanticValues, ...extraValues],
      learningTargetSenses: [...catalogs.learningTargetSenses, ...extraSenses],
    };
  }

  const bareSense: LearningTargetSense = {
    id: "test-sense-invariant-bare",
    lexemeId: "test-lexeme-invariant-bare",
    learningUse: "productive",
    semanticFrameId: "test-frame-invariant-bare",
    predicate: "invariant-bare" as LearningTargetSense["predicate"],
    argumentRoles: [],
    argumentParticleByRole: {},
  };

  // ---- a fully-baked, no-slot, multi-clause utterance --------------------
  // (mirrors an A2 connector/backchannel construction: whole sentence baked
  // once as the predicate value's own fragments, no ending appended).

  const bakedConnectorValue: SemanticValue = {
    id: "test-value-invariant-connector",
    kind: "predicate-sense",
    senseId: bareSense.id,
    tokenFragments: [
      { jp: "きょう", romaji: "kyou", kind: "lexical", boundaryBefore: "attach" },
      { jp: "は", romaji: "wa", kind: "particle", boundaryBefore: "attach" },
      { jp: "あめ", romaji: "ame", kind: "lexical", boundaryBefore: "attach" },
      { jp: "です", romaji: "desu", kind: "lexical", boundaryBefore: "attach" },
      { jp: "。", romaji: ".", kind: "punctuation", boundaryBefore: "attach" },
      { jp: "でも", romaji: "demo", kind: "lexical", boundaryBefore: "attach" },
      { jp: "、", romaji: ",", kind: "punctuation", boundaryBefore: "attach" },
      { jp: "でかけ", romaji: "dekake", kind: "lexical", boundaryBefore: "attach" },
      { jp: "ます", romaji: "masu", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "。", romaji: ".", kind: "punctuation", boundaryBefore: "attach" },
    ],
  };

  const invariantOnlyFamily: SentenceFamily = {
    id: "test-family-invariant-only" as SentenceFamily["id"],
    level: "a2",
    canDoIds: [],
    slotSchema: [
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [],
  };

  it("emits the predicate value's own fragments verbatim, in their own authored kind/spacing, with no ending appended", () => {
    const variant: SentenceVariant = {
      id: "test-variant-invariant-connector",
      sentenceFamilyId: invariantOnlyFamily.id,
      discourse: bareBaseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { predicate: bakedConnectorValue.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      invariantOnlyFamily,
      variant,
      localCatalogsWith([bakedConnectorValue], [bareSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("きょうはあめです。でも、でかけます。");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("kyou wa ame desu. demo, dekakemasu.");
  });

  it("appends the sentence-final か for an interrogative invariant variant, exactly like every other predicate kind", () => {
    const questionValue: SemanticValue = {
      id: "test-value-invariant-question",
      kind: "predicate-sense",
      senseId: bareSense.id,
      tokenFragments: [
        { jp: "たべ", romaji: "tabe", kind: "lexical", boundaryBefore: "attach" },
        { jp: "た", romaji: "ta", kind: "morpheme", boundaryBefore: "attach" },
        { jp: "こと", romaji: "koto", kind: "lexical", boundaryBefore: "attach" },
        { jp: "が", romaji: "ga", kind: "particle", boundaryBefore: "attach" },
        { jp: "あります", romaji: "arimasu", kind: "lexical", boundaryBefore: "attach" },
      ],
    };
    const variant: SentenceVariant = {
      id: "test-variant-invariant-question",
      sentenceFamilyId: invariantOnlyFamily.id,
      discourse: bareBaseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { predicate: questionValue.id },
      form: {
        polarity: "affirmative",
        tense: "present",
        formality: "polite",
        interrogative: true,
      },
      pedagogicalUse: "transfer",
    };
    const result = realizeVariant(
      invariantOnlyFamily,
      variant,
      localCatalogsWith([questionValue], [bareSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("たべたことがありますか");
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("tabeta koto ga arimasu ka");
  });

  // M4 spec-fix ("form metadata"): an invariant predicate's own baked
  // fragments already ARE the complete realized content — unlike verb/
  // adjective/copula/request predicates, an invariant rule never looks up a
  // polite ending table keyed by tense/polarity, so its FormSelection is
  // honest *metadata describing* the baked value's real register, never a
  // lookup key the realizer must itself understand. It must therefore
  // accept (not reject) a plain/negative/past/past-negative FormSelection —
  // the exact combinations §9.3's own plain-recognition/narrate-order/
  // reason-node content actually is.
  it("accepts a plain-register FormSelection on an invariant variant instead of rejecting non-polite formality (honest metadata, not a lookup key)", () => {
    const plainPastValue: SemanticValue = {
      id: "test-value-invariant-plain-past",
      kind: "predicate-sense",
      senseId: bareSense.id,
      tokenFragments: [
        { jp: "たべ", romaji: "tabe", kind: "lexical", boundaryBefore: "attach" },
        { jp: "た", romaji: "ta", kind: "morpheme", boundaryBefore: "attach" },
      ],
    };
    const variant: SentenceVariant = {
      id: "test-variant-invariant-plain-past",
      sentenceFamilyId: invariantOnlyFamily.id,
      discourse: bareBaseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { predicate: plainPastValue.id },
      form: { polarity: "affirmative", tense: "past", formality: "plain" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      invariantOnlyFamily,
      variant,
      localCatalogsWith([plainPastValue], [bareSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("たべた");
  });

  it("accepts a negative-register FormSelection on an invariant variant (formality still polite here)", () => {
    const negativeValue: SemanticValue = {
      id: "test-value-invariant-negative",
      kind: "predicate-sense",
      senseId: bareSense.id,
      tokenFragments: [
        { jp: "わかりません", romaji: "wakarimasen", kind: "lexical", boundaryBefore: "attach" },
      ],
    };
    const variant: SentenceVariant = {
      id: "test-variant-invariant-negative",
      sentenceFamilyId: invariantOnlyFamily.id,
      discourse: bareBaseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { predicate: negativeValue.id },
      form: { polarity: "negative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      invariantOnlyFamily,
      variant,
      localCatalogsWith([negativeValue], [bareSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("わかりません");
  });

  it("still requires the predicate sense's own frame — an invariant predicate declaring a governed theme without a matching slot still fails closed", () => {
    const themeSense: LearningTargetSense = {
      id: "test-sense-invariant-theme",
      lexemeId: "test-lexeme-invariant-theme",
      learningUse: "productive",
      semanticFrameId: "test-frame-invariant-theme",
      predicate: "invariant-theme" as LearningTargetSense["predicate"],
      argumentRoles: ["theme"],
      argumentParticleByRole: {},
    };
    const themeValue: SemanticValue = {
      id: "test-value-invariant-theme",
      kind: "predicate-sense",
      senseId: themeSense.id,
      tokenFragments: [{ jp: "たべた", romaji: "tabeta", kind: "lexical", boundaryBefore: "attach" }],
    };
    const variant: SentenceVariant = {
      id: "test-variant-invariant-theme-invalid",
      sentenceFamilyId: invariantOnlyFamily.id,
      discourse: bareBaseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { predicate: themeValue.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "model",
    };
    const result = realizeVariant(
      invariantOnlyFamily,
      variant,
      localCatalogsWith([themeValue], [themeSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "invalid-argument-structure", referenceId: "theme" }),
    );
  });
});

// Phase 3 Task 5 (M5-M8 content): the "invariant" predicateKind (Task 4)
// always paired an empty `contentSlots: []` with `rule-invariant-utterance`
// because M1-M4's whole-clause-bake pattern never needed a separate content
// slot. M5-M8's te-form/ている/permission/prohibition/request/negative-request
// suffix constructions are still "invariant" (their complete realized
// content — base conjugation + fixed suffix tail — is pre-composed once at
// catalog-authoring time, exactly like §9.3's other invariant content), but
// the recipe calls for *compositional* transfer novelty (the same suffixed
// verb combined with different objects/locations), not just whole-clause
// duplication or subject swapping. The generic assembly loop already
// processes `rule.contentSlots` for any `predicateKind` (see the
// `for (const contentSlot of rule.contentSlots)` loop, unconditional on
// predicateKind) and already emits an "invariant" predicate's own fragments
// with no ending — so an "invariant" rule with a *non-empty* `contentSlots`
// is a new, purely additive *data* combination the existing dispatch logic
// already supports; no new branching code is required. These two rules —
// object (を) and location (で) — are genuinely needed and not expressible
// via `composeA2Construction` (which only ever conjugates one verb + a fixed
// tail, with no slot for a separate object/location noun at all).
describe("realizer generalization: \"invariant\" predicateKind with a non-empty contentSlots — object/location composition (Phase 3 Task 5)", () => {
  const bareBaseDiscourse = {
    speakerRoleId: "fixture-role-learner",
    addresseeRoleId: null,
    subjectReferentId: null,
    subjectRealization: "omitted" as const,
    scenarioNoteCopyId: "test-scenario-invariant-object-location",
  };

  function localCatalogsWith(
    extraValues: readonly SemanticValue[],
    extraSenses: readonly LearningTargetSense[],
  ): RealizeVariantCatalogs {
    return {
      ...catalogs,
      semanticValues: [...catalogs.semanticValues, ...extraValues],
      learningTargetSenses: [...catalogs.learningTargetSenses, ...extraSenses],
    };
  }

  describe("rule-invariant-object (invariant predicate + を-marked object slot)", () => {
    const bareSense: LearningTargetSense = {
      id: "test-sense-invariant-object-bare",
      lexemeId: "test-lexeme-invariant-object-bare",
      learningUse: "productive",
      semanticFrameId: "test-frame-invariant-object-bare",
      predicate: "invariant-object-bare" as LearningTargetSense["predicate"],
      argumentRoles: [],
      argumentParticleByRole: {},
    };

    const objectOnlyFamily: SentenceFamily = {
      id: "test-family-invariant-object" as SentenceFamily["id"],
      level: "a2",
      canDoIds: [],
      slotSchema: [
        { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
        { id: "object", axis: "object", valueKind: "object", optional: false },
        { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      ],
      permittedAxes: ["speaker-person", "object", "predicate-verb", "context"],
      realizationRuleId: "rule-invariant-object",
      requiredConceptIds: [],
    };

    const teiruPredicateValue: SemanticValue = {
      id: "test-value-invariant-object-teiru",
      kind: "predicate-sense",
      senseId: bareSense.id,
      tokenFragments: [
        { jp: "たべ", romaji: "tabe", kind: "lexical", boundaryBefore: "attach" },
        { jp: "て", romaji: "te", kind: "morpheme", boundaryBefore: "attach" },
        { jp: "います", romaji: "imasu", kind: "morpheme", boundaryBefore: "attach" },
      ],
    };
    const breadObjectValue: SemanticValue = {
      id: "test-value-invariant-object-pan",
      kind: "object",
      tokenFragments: [{ jp: "パン", romaji: "pan", kind: "lexical", boundaryBefore: "attach" }],
    };
    const waterObjectValue: SemanticValue = {
      id: "test-value-invariant-object-mizu",
      kind: "object",
      tokenFragments: [{ jp: "みず", romaji: "mizu", kind: "lexical", boundaryBefore: "attach" }],
    };

    it("assembles object + を + the invariant predicate's own fragments verbatim, with no ending appended", () => {
      const variant: SentenceVariant = {
        id: "test-variant-invariant-object-pan",
        sentenceFamilyId: objectOnlyFamily.id,
        discourse: bareBaseDiscourse,
        contextId: "fixture-a1-context-language-class",
        slotValues: { object: breadObjectValue.id, predicate: teiruPredicateValue.id },
        form: { polarity: "affirmative", tense: "present", formality: "polite" },
        pedagogicalUse: "model",
      };
      const result = realizeVariant(
        objectOnlyFamily,
        variant,
        localCatalogsWith([teiruPredicateValue, breadObjectValue], [bareSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("パンをたべています");
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      // "て"/"います" are authored "morpheme" kind here (mirroring
      // a2Constructions.ts's own raw tail — a "morpheme"/"punctuation" kind
      // always attaches with no leading space, generically by kind+position,
      // never from the fragment's own authored `boundaryBefore`; see
      // `romaji/formatRomaji.ts`'s `boundaryBefore()`). Only the を particle
      // (kind "particle", not in the attach-exempt set) gets a real space.
      // A catalog that wants "tabete imasu" (two independent words) would
      // author います as "lexical" instead — a catalog-authoring choice, not
      // a realizer concern this rule needs to make for its caller.
      expect(romaji.text).toBe("pan o tabeteimasu");
    });

    it("recombines the SAME predicate value with a DIFFERENT object value into a genuinely distinct sentence (compositional transfer novelty)", () => {
      const variant: SentenceVariant = {
        id: "test-variant-invariant-object-mizu",
        sentenceFamilyId: objectOnlyFamily.id,
        discourse: bareBaseDiscourse,
        contextId: "fixture-a1-context-language-class",
        slotValues: { object: waterObjectValue.id, predicate: teiruPredicateValue.id },
        form: { polarity: "affirmative", tense: "present", formality: "polite" },
        pedagogicalUse: "transfer",
      };
      const result = realizeVariant(
        objectOnlyFamily,
        variant,
        localCatalogsWith([teiruPredicateValue, waterObjectValue], [bareSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("みずをたべています");
      expect(result.sentence.canonicalJapanese).not.toBe("パンをたべています");
    });

    it("prepends an explicit subject + は before the object + predicate", () => {
      const variant: SentenceVariant = {
        id: "test-variant-invariant-object-explicit-subject",
        sentenceFamilyId: objectOnlyFamily.id,
        discourse: {
          ...bareBaseDiscourse,
          subjectReferentId: "fixture-referent-yuki",
          subjectRealization: "explicit",
        },
        contextId: "fixture-a1-context-language-class",
        slotValues: {
          subject: "fixture-value-yuki",
          object: breadObjectValue.id,
          predicate: teiruPredicateValue.id,
        },
        form: { polarity: "affirmative", tense: "present", formality: "polite" },
        pedagogicalUse: "model",
      };
      const result = realizeVariant(
        objectOnlyFamily,
        variant,
        localCatalogsWith([teiruPredicateValue, breadObjectValue], [bareSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("ゆきはパンをたべています");
    });
  });

  describe("rule-invariant-location (invariant predicate + で-marked location slot)", () => {
    const locationSense: LearningTargetSense = {
      id: "test-sense-invariant-location-bare",
      lexemeId: "test-lexeme-invariant-location-bare",
      learningUse: "productive",
      semanticFrameId: "test-frame-invariant-location-bare",
      predicate: "invariant-location-bare" as LearningTargetSense["predicate"],
      argumentRoles: ["location"],
      argumentParticleByRole: {},
    };

    const locationOnlyFamily: SentenceFamily = {
      id: "test-family-invariant-location" as SentenceFamily["id"],
      level: "a2",
      canDoIds: [],
      slotSchema: [
        { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
        { id: "location", axis: "location", valueKind: "location", optional: false },
        { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      ],
      permittedAxes: ["speaker-person", "location", "predicate-verb", "context"],
      realizationRuleId: "rule-invariant-location",
      requiredConceptIds: [],
    };

    const temoiiPredicateValue: SemanticValue = {
      id: "test-value-invariant-location-temoii",
      kind: "predicate-sense",
      senseId: locationSense.id,
      tokenFragments: [
        { jp: "たべ", romaji: "tabe", kind: "lexical", boundaryBefore: "attach" },
        { jp: "て", romaji: "te", kind: "morpheme", boundaryBefore: "attach" },
        { jp: "も", romaji: "mo", kind: "particle", boundaryBefore: "attach" },
        { jp: "いい", romaji: "ii", kind: "morpheme", boundaryBefore: "attach" },
        { jp: "です", romaji: "desu", kind: "morpheme", boundaryBefore: "attach" },
      ],
    };
    const hereLocationValue: SemanticValue = {
      id: "test-value-invariant-location-koko",
      kind: "location",
      tokenFragments: [{ jp: "ここ", romaji: "koko", kind: "lexical", boundaryBefore: "attach" }],
    };

    it("assembles location + で + the invariant predicate's own fragments verbatim, with no ending appended", () => {
      const variant: SentenceVariant = {
        id: "test-variant-invariant-location-koko",
        sentenceFamilyId: locationOnlyFamily.id,
        discourse: bareBaseDiscourse,
        contextId: "fixture-a1-context-language-class",
        slotValues: { location: hereLocationValue.id, predicate: temoiiPredicateValue.id },
        form: { polarity: "affirmative", tense: "present", formality: "polite" },
        pedagogicalUse: "model",
      };
      const result = realizeVariant(
        locationOnlyFamily,
        variant,
        localCatalogsWith([temoiiPredicateValue, hereLocationValue], [locationSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("ここでたべてもいいです");
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      // Same rationale as the object-rule test above: "て"/"いい"/"です" are
      // authored "morpheme" kind (attach, no space); only the particles で
      // and も (kind "particle") get a real leading space.
      expect(romaji.text).toBe("koko de tabete moiidesu");
    });

    it("appends the sentence-final か for an interrogative invariant+location variant", () => {
      const variant: SentenceVariant = {
        id: "test-variant-invariant-location-question",
        sentenceFamilyId: locationOnlyFamily.id,
        discourse: bareBaseDiscourse,
        contextId: "fixture-a1-context-language-class",
        slotValues: { location: hereLocationValue.id, predicate: temoiiPredicateValue.id },
        form: {
          polarity: "affirmative",
          tense: "present",
          formality: "polite",
          interrogative: true,
        },
        pedagogicalUse: "transfer",
      };
      const result = realizeVariant(
        locationOnlyFamily,
        variant,
        localCatalogsWith([temoiiPredicateValue, hereLocationValue], [locationSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("ここでたべてもいいですか");
    });

    it("still requires the family's location slot to be matched by the sense's own frame — a location slot with a sense that declares no location role fails closed", () => {
      const noLocationSense: LearningTargetSense = {
        id: "test-sense-invariant-location-missing-role",
        lexemeId: "test-lexeme-invariant-location-missing-role",
        learningUse: "productive",
        semanticFrameId: "test-frame-invariant-location-missing-role",
        predicate: "invariant-location-missing-role" as LearningTargetSense["predicate"],
        argumentRoles: [],
        argumentParticleByRole: {},
      };
      const noLocationValue: SemanticValue = {
        id: "test-value-invariant-location-missing-role",
        kind: "predicate-sense",
        senseId: noLocationSense.id,
        tokenFragments: [{ jp: "たべてもいいです", romaji: "tabetemoiidesu", kind: "lexical", boundaryBefore: "attach" }],
      };
      const variant: SentenceVariant = {
        id: "test-variant-invariant-location-invalid",
        sentenceFamilyId: locationOnlyFamily.id,
        discourse: bareBaseDiscourse,
        contextId: "fixture-a1-context-language-class",
        slotValues: { location: hereLocationValue.id, predicate: noLocationValue.id },
        form: { polarity: "affirmative", tense: "present", formality: "polite" },
        pedagogicalUse: "model",
      };
      const result = realizeVariant(
        locationOnlyFamily,
        variant,
        localCatalogsWith([noLocationValue, hereLocationValue], [noLocationSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: "invalid-argument-structure", referenceId: "location" }),
      );
    });
  });
});

// Task 4 final spec-fix ("keep M1-M4 transfer Japanese natural"): a fresh
// spec re-review found that mechanically prepending an explicit subject +
// は before an already-complete baked utterance (an invitation, a request,
// a question) reads as topic-marking the addressee ("そらは..."), not as
// natural direct address ("そらさん、...") — and, separately, that doing the
// same to a predicate value that already bakes its own topic (きょうは...)
// produces an unnatural double topic (わたしは きょうは...). `"vocative"` is
// the new, additive third `subjectRealization` mode fixing the first
// failure mode: it renders the resolved subject value's own tokens followed
// by さん (space-bound, exactly like every other standalone grammatical
// word) and 、 (attached, like every other authored comma), never は, ahead
// of the family's own content — a genuinely compositional rule, reusing
// already-modeled referent content, never a per-value baked vocative
// string.
describe("realizer generalization: the additive \"vocative\" subjectRealization (Task 4 final spec-fix)", () => {
  const vocativeBaseDiscourse = {
    speakerRoleId: "fixture-role-learner",
    addresseeRoleId: null,
    subjectReferentId: "fixture-referent-yuki",
    subjectRealization: "vocative" as const,
    scenarioNoteCopyId: "test-scenario-vocative",
  };

  function localCatalogsWith(
    extraValues: readonly SemanticValue[],
    extraSenses: readonly LearningTargetSense[],
  ): RealizeVariantCatalogs {
    return {
      ...catalogs,
      semanticValues: [...catalogs.semanticValues, ...extraValues],
      learningTargetSenses: [...catalogs.learningTargetSenses, ...extraSenses],
    };
  }

  const bareSense: LearningTargetSense = {
    id: "test-sense-vocative-bare",
    lexemeId: "test-lexeme-vocative-bare",
    learningUse: "productive",
    semanticFrameId: "test-frame-vocative-bare",
    predicate: "invariant-vocative-bare" as LearningTargetSense["predicate"],
    argumentRoles: [],
    argumentParticleByRole: {},
  };

  // A whole baked invitation utterance (mirrors A2's real
  // `a2-value-invite-eiga`): no baked topic of its own, so a vocative
  // prefix would be the only subject marking in the sentence.
  const bakedInviteValue: SemanticValue = {
    id: "test-value-vocative-invite",
    kind: "predicate-sense",
    senseId: bareSense.id,
    tokenFragments: [
      { jp: "いっしょに", romaji: "issho ni", kind: "lexical", boundaryBefore: "attach" },
      { jp: "えいがを", romaji: "eiga o", kind: "lexical", boundaryBefore: "attach" },
      { jp: "み", romaji: "mi", kind: "lexical", boundaryBefore: "attach" },
      { jp: "ましょう", romaji: "mashou", kind: "morpheme", boundaryBefore: "attach" },
      { jp: "か", romaji: "ka", kind: "particle", boundaryBefore: "attach" },
    ],
  };

  const vocativeFamily: SentenceFamily = {
    id: "test-family-vocative-invite" as SentenceFamily["id"],
    level: "a2",
    canDoIds: [],
    slotSchema: [
      { id: "subject", axis: "speaker-person", valueKind: "referent", optional: true },
      { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
    ],
    permittedAxes: ["speaker-person", "predicate-verb", "context"],
    realizationRuleId: "rule-invariant-utterance",
    requiredConceptIds: [],
  };

  function vocativeVariant(overrides: Partial<SentenceVariant> = {}): SentenceVariant {
    return {
      id: "test-variant-vocative-invite",
      sentenceFamilyId: vocativeFamily.id,
      discourse: vocativeBaseDiscourse,
      contextId: "fixture-a1-context-language-class",
      slotValues: { subject: "fixture-value-yuki", predicate: bakedInviteValue.id },
      form: { polarity: "affirmative", tense: "present", formality: "polite" },
      pedagogicalUse: "transfer",
      ...overrides,
    };
  }

  it("renders the vocative subject as name + さん + 、 ahead of the baked utterance, never は", () => {
    const result = realizeVariant(
      vocativeFamily,
      vocativeVariant(),
      localCatalogsWith([bakedInviteValue], [bareSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("ゆきさん、いっしょにえいがをみましょうか");
    expect(result.sentence.tokens.some((token) => token.jp === "は")).toBe(false);
    const romaji = formatRomaji(result.sentence.tokens);
    expect(romaji.ok).toBe(true);
    if (!romaji.ok) return;
    expect(romaji.text).toBe("yuki san, issho ni eiga o mimashou ka");
  });

  it("emits さん as a standalone space-bound word and 、 as an attached punctuation token (never fused as ゆきさん as one token, never a leading space before 、)", () => {
    const result = realizeVariant(
      vocativeFamily,
      vocativeVariant(),
      localCatalogsWith([bakedInviteValue], [bareSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.tokens.slice(0, 3).map((token) => token.jp)).toEqual(["ゆき", "さん", "、"]);
    const [nameToken, sanToken, commaToken] = result.sentence.tokens;
    expect(nameToken.boundaryBefore).toBe("attach"); // first token in the sentence
    expect(sanToken.boundaryBefore).toBe("space");
    expect(sanToken.kind).toBe("lexical");
    expect(commaToken.boundaryBefore).toBe("attach");
    expect(commaToken.kind).toBe("punctuation");
  });

  it("never emits は anywhere for a vocative subject even when the predicate itself is a plain declarative (not just an invitation)", () => {
    const declarativeValue: SemanticValue = {
      id: "test-value-vocative-declarative",
      kind: "predicate-sense",
      senseId: bareSense.id,
      tokenFragments: [
        { jp: "いいですね", romaji: "ii desu ne", kind: "lexical", boundaryBefore: "attach" },
        { jp: "。", romaji: ".", kind: "punctuation", boundaryBefore: "attach" },
        { jp: "いき", romaji: "iki", kind: "lexical", boundaryBefore: "attach" },
        { jp: "ましょう", romaji: "mashou", kind: "morpheme", boundaryBefore: "attach" },
        { jp: "。", romaji: ".", kind: "punctuation", boundaryBefore: "attach" },
      ],
    };
    const result = realizeVariant(
      vocativeFamily,
      vocativeVariant({ slotValues: { subject: "fixture-value-yuki", predicate: declarativeValue.id } }),
      localCatalogsWith([declarativeValue], [bareSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("ゆきさん、いいですね。いきましょう。");
    expect(result.sentence.tokens.some((token) => token.jp === "は")).toBe(false);
  });

  it("fails closed (missing-slot, never throws) when the subject is vocative but no subject value resolves, exactly like the explicit-subject fail-closed contract", () => {
    let result: ReturnType<typeof realizeVariant> | undefined;
    expect(() => {
      result = realizeVariant(
        vocativeFamily,
        vocativeVariant({ slotValues: { predicate: bakedInviteValue.id } }),
        localCatalogsWith([bakedInviteValue], [bareSense]),
        { availableConceptIds: [] },
      );
    }).not.toThrow();
    expect(result?.ok).toBe(false);
    if (!result || result.ok) return;
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.every((error) => error.code === "missing-slot")).toBe(true);
    expect(result.errors[0]?.slotId).toBe("subject");
  });

  it("keeps a distinct semantic fingerprint from the equivalent explicit-subject realization of the same referent/predicate (vocative and topic-marked are genuinely different discourse choices)", () => {
    const vocativeResult = realizeVariant(
      vocativeFamily,
      vocativeVariant(),
      localCatalogsWith([bakedInviteValue], [bareSense]),
      { availableConceptIds: [] },
    );
    const explicitResult = realizeVariant(
      vocativeFamily,
      vocativeVariant({ discourse: { ...vocativeBaseDiscourse, subjectRealization: "explicit" } }),
      localCatalogsWith([bakedInviteValue], [bareSense]),
      { availableConceptIds: [] },
    );
    expect(vocativeResult.ok).toBe(true);
    expect(explicitResult.ok).toBe(true);
    if (!vocativeResult.ok || !explicitResult.ok) return;
    expect(vocativeResult.sentence.semanticFingerprint).not.toBe(explicitResult.sentence.semanticFingerprint);
    // And the explicit form must still show the pre-existing は-topic
    // behavior unchanged (no regression to the existing "explicit" mode).
    expect(explicitResult.sentence.canonicalJapanese).toBe("ゆきはいっしょにえいがをみましょうか");
  });

  it("appends the sentence-final か for an interrogative vocative variant exactly like every other subject realization (mood is orthogonal to vocative)", () => {
    const questionValue: SemanticValue = {
      id: "test-value-vocative-question",
      kind: "predicate-sense",
      senseId: bareSense.id,
      tokenFragments: [
        { jp: "なんじに", romaji: "nanji ni", kind: "lexical", boundaryBefore: "attach" },
        { jp: "あい", romaji: "ai", kind: "lexical", boundaryBefore: "attach" },
        { jp: "ましょう", romaji: "mashou", kind: "morpheme", boundaryBefore: "attach" },
      ],
    };
    const result = realizeVariant(
      vocativeFamily,
      vocativeVariant({
        slotValues: { subject: "fixture-value-yuki", predicate: questionValue.id },
        form: { polarity: "affirmative", tense: "present", formality: "polite", interrogative: true },
      }),
      localCatalogsWith([questionValue], [bareSense]),
      { availableConceptIds: [] },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sentence.canonicalJapanese).toBe("ゆきさん、なんじにあいましょうか");
  });
});

// Phase 3 Task 6 (A2 M9-M12 dense content): two new, genuinely compositional
// rules the A2 shopping-returns module needs — favor-marked comparison
// ("XのほうがYよりADJです") and が-marked superlative ("Xがいちばん
// ADJです"). Both reuse the existing `predicateKind: "adjective"` machinery
// (i/na-class conjugation, honest FormSelection) so the SAME predicate stem
// value (e.g. やす "yasu") produces やすいです/やすくないです/やすかったです
// automatically — never a per-comparison whole-clause bake. の/ほう/が and
// いちばん are fixed grammar-level content the rule itself contributes
// (mirrors さん/、 in `pushVocativeAddress` above), never authored per-lesson.
describe("realizer generalization: \"rule-comparison-favor\" (Xのほうが Yより ADJです) and \"rule-superlative\" (Xが いちばん ADJです) (Phase 3 Task 6)", () => {
  const bareBaseDiscourse = {
    speakerRoleId: "fixture-role-learner",
    addresseeRoleId: null,
    subjectReferentId: null,
    subjectRealization: "omitted" as const,
    scenarioNoteCopyId: "test-scenario-comparison",
  };

  function localCatalogsWith(
    extraValues: readonly SemanticValue[],
    extraSenses: readonly LearningTargetSense[],
  ): RealizeVariantCatalogs {
    return {
      ...catalogs,
      semanticValues: [...catalogs.semanticValues, ...extraValues],
      learningTargetSenses: [...catalogs.learningTargetSenses, ...extraSenses],
    };
  }

  const yasuiSense: LearningTargetSense = {
    id: "test-sense-comparison-yasui",
    lexemeId: "test-lexeme-comparison-yasui",
    learningUse: "productive",
    semanticFrameId: "test-frame-comparison-yasui",
    predicate: "test-cheap" as LearningTargetSense["predicate"],
    argumentRoles: ["topic"],
    argumentParticleByRole: {},
    adjectiveClass: "i",
  };
  const yasuiStemValue: SemanticValue = {
    id: "test-value-comparison-yasui-stem",
    kind: "predicate-sense",
    senseId: yasuiSense.id,
    tokenFragments: [{ jp: "やす", romaji: "yasu", kind: "lexical", boundaryBefore: "attach" }],
  };
  const kabanValue: SemanticValue = {
    id: "test-value-comparison-kaban",
    kind: "object",
    tokenFragments: [{ jp: "かばん", romaji: "kaban", kind: "lexical", boundaryBefore: "attach" }],
  };
  const kutsuValue: SemanticValue = {
    id: "test-value-comparison-kutsu",
    kind: "object",
    tokenFragments: [{ jp: "くつ", romaji: "kutsu", kind: "lexical", boundaryBefore: "attach" }],
  };

  describe("rule-comparison-favor", () => {
    const comparisonFamily: SentenceFamily = {
      id: "test-family-comparison-favor" as SentenceFamily["id"],
      level: "a2",
      canDoIds: [],
      slotSchema: [
        { id: "favored", axis: "object", valueKind: "object", optional: false },
        { id: "standard", axis: "object", valueKind: "object", optional: false },
        { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      ],
      permittedAxes: ["object", "predicate-verb", "polarity-tense-form", "context"],
      realizationRuleId: "rule-comparison-favor",
      requiredConceptIds: [],
    };

    function variantWith(form: SentenceVariant["form"]): SentenceVariant {
      return {
        id: "test-variant-comparison-favor",
        sentenceFamilyId: comparisonFamily.id,
        discourse: bareBaseDiscourse,
        contextId: "fixture-a1-context-language-class",
        slotValues: { favored: kabanValue.id, standard: kutsuValue.id, predicate: yasuiStemValue.id },
        form,
        pedagogicalUse: "model",
      };
    }

    it("assembles favored + のほうが + standard + より + the adjective stem's own present-affirmative inflection", () => {
      const result = realizeVariant(
        comparisonFamily,
        variantWith({ polarity: "affirmative", tense: "present", formality: "polite" }),
        localCatalogsWith([yasuiStemValue, kabanValue, kutsuValue], [yasuiSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("かばんのほうがくつよりやすいです");
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      expect(romaji.text).toBe("kaban no hou ga kutsu yori yasui desu");
    });

    it("conjugates the SAME stem value honestly across form selections (negative/past), never a hand-baked whole clause", () => {
      const negative = realizeVariant(
        comparisonFamily,
        variantWith({ polarity: "negative", tense: "present", formality: "polite" }),
        localCatalogsWith([yasuiStemValue, kabanValue, kutsuValue], [yasuiSense]),
        { availableConceptIds: [] },
      );
      expect(negative.ok).toBe(true);
      if (negative.ok) expect(negative.sentence.canonicalJapanese).toBe("かばんのほうがくつよりやすくないです");

      const past = realizeVariant(
        comparisonFamily,
        variantWith({ polarity: "affirmative", tense: "past", formality: "polite" }),
        localCatalogsWith([yasuiStemValue, kabanValue, kutsuValue], [yasuiSense]),
        { availableConceptIds: [] },
      );
      expect(past.ok).toBe(true);
      if (past.ok) expect(past.sentence.canonicalJapanese).toBe("かばんのほうがくつよりやすかったです");
    });

    it("recombines the SAME predicate stem with DIFFERENT favored/standard values into a genuinely distinct sentence (compositional transfer novelty)", () => {
      const variant: SentenceVariant = {
        id: "test-variant-comparison-favor-swapped",
        sentenceFamilyId: comparisonFamily.id,
        discourse: bareBaseDiscourse,
        contextId: "fixture-a1-context-language-class",
        slotValues: { favored: kutsuValue.id, standard: kabanValue.id, predicate: yasuiStemValue.id },
        form: { polarity: "affirmative", tense: "present", formality: "polite" },
        pedagogicalUse: "transfer",
      };
      const result = realizeVariant(
        comparisonFamily,
        variant,
        localCatalogsWith([yasuiStemValue, kabanValue, kutsuValue], [yasuiSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("くつのほうがかばんよりやすいです");
      expect(result.sentence.canonicalJapanese).not.toBe("かばんのほうがくつよりやすいです");
    });

    it("appends the sentence-final か for an interrogative comparison variant", () => {
      const result = realizeVariant(
        comparisonFamily,
        {
          ...variantWith({
            polarity: "affirmative",
            tense: "present",
            formality: "polite",
            interrogative: true,
          }),
          pedagogicalUse: "transfer",
        },
        localCatalogsWith([yasuiStemValue, kabanValue, kutsuValue], [yasuiSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("かばんのほうがくつよりやすいですか");
    });
  });

  describe("rule-superlative", () => {
    const superlativeFamily: SentenceFamily = {
      id: "test-family-superlative" as SentenceFamily["id"],
      level: "a2",
      canDoIds: [],
      slotSchema: [
        { id: "favored", axis: "object", valueKind: "object", optional: false },
        { id: "predicate", axis: "predicate-verb", valueKind: "predicate-sense", optional: false },
      ],
      permittedAxes: ["object", "predicate-verb", "polarity-tense-form", "context"],
      realizationRuleId: "rule-superlative",
      requiredConceptIds: [],
    };

    it("assembles favored + が + いちばん + the adjective stem's own present-affirmative inflection, with いちばん fixed (never authored per-value)", () => {
      const variant: SentenceVariant = {
        id: "test-variant-superlative",
        sentenceFamilyId: superlativeFamily.id,
        discourse: bareBaseDiscourse,
        contextId: "fixture-a1-context-language-class",
        slotValues: { favored: kabanValue.id, predicate: yasuiStemValue.id },
        form: { polarity: "affirmative", tense: "present", formality: "polite" },
        pedagogicalUse: "model",
      };
      const result = realizeVariant(
        superlativeFamily,
        variant,
        localCatalogsWith([yasuiStemValue, kabanValue], [yasuiSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("かばんがいちばんやすいです");
      const romaji = formatRomaji(result.sentence.tokens);
      expect(romaji.ok).toBe(true);
      if (!romaji.ok) return;
      expect(romaji.text).toBe("kaban ga ichiban yasui desu");
    });

    it("recombines the SAME predicate stem with a DIFFERENT favored value into a genuinely distinct sentence", () => {
      const variant: SentenceVariant = {
        id: "test-variant-superlative-kutsu",
        sentenceFamilyId: superlativeFamily.id,
        discourse: bareBaseDiscourse,
        contextId: "fixture-a1-context-language-class",
        slotValues: { favored: kutsuValue.id, predicate: yasuiStemValue.id },
        form: { polarity: "affirmative", tense: "present", formality: "polite" },
        pedagogicalUse: "transfer",
      };
      const result = realizeVariant(
        superlativeFamily,
        variant,
        localCatalogsWith([yasuiStemValue, kutsuValue], [yasuiSense]),
        { availableConceptIds: [] },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.sentence.canonicalJapanese).toBe("くつがいちばんやすいです");
    });
  });
});

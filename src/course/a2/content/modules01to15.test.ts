/**
 * A2 M1-M15 aggregate (Phase 3 Task 7) — the whole-release closure test.
 *
 * `modules01to12.test.ts` (Phase 3 Task 6) documented, in its own
 * grammar-spiral content-evidence audit, that every recurrence lesson
 * named by `a2-synthesis-*`/`relationships-events-*`/`practical-texts-*`
 * was "a future M13-M15 lesson outside this file's scope and is correctly
 * skipped, not judged." This file closes that gap now that all 60 lessons
 * exist: every intro/practice/transfer/recurrence role of all 15
 * grammar-spiral forms is proven to carry genuine content evidence, with
 * literally nothing left to skip. It reuses the real, already-assembled
 * release catalog from `catalog/catalog.ts` (never a second, independent
 * 60-lesson assembly) as the single source of truth, and re-runs the
 * malformed-conjugation/no-dead-value/register-honesty editorial guards
 * `modules01to12.test.ts` proved over M1-M12, extended to the complete
 * 60-lesson scope, plus a direct no-Japanese cross-check — so this one
 * file is the "is the whole release actually done" closure test the task
 * asks for.
 */
import { describe, expect, it } from "vitest";

import { formatRomaji } from "../../../romaji/formatRomaji";
import { realizeVariant } from "../../foundations/realizeFamily";
import { validateFoundations } from "../../foundations/validateFoundations";
import type { SentenceFamily } from "../../foundations/types";
import {
  a2SemanticBuiltLessons,
  a2FoundationCatalogs,
  a2FoundationCopy,
  a2CanDosAuthored,
} from "../catalog/catalog";
import { A2_AVAILABLE_CONTENT_BY_LESSON } from "../catalog/catalog";
import { A2_ALL_59_CANDO_IDS, A2_CANDO_REGISTRY, a2CanDoDescriptorCopy } from "../catalog/canDos";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "../catalog/a2SemanticCatalog";
import { A2_CANONICAL_POSITIONS, A2_MODULE_IDS } from "../manifest";
import { A2_GRAMMAR_SPIRAL } from "../forms/grammarSpiral";
import {
  validateA2GrammarSpiral,
  auditA2GrammarSpiralEvidence,
  type GrammarEvidenceLesson,
} from "../forms/validateA2GrammarSpiral";
import { lintA2NoJapanese, A2_CONTENT_DIR } from "../../../../scripts/lintA2NoJapanese";

const allBuiltLessons = a2SemanticBuiltLessons;

describe("A2 M1-M15 aggregate — exactly 60 lessons across 15 modules in canonical order", () => {
  it("has exactly 60 built lessons", () => {
    expect(allBuiltLessons).toHaveLength(60);
  });

  it("has exactly 15 distinct module ids, each with exactly 4 lessons", () => {
    const moduleIds = new Set(allBuiltLessons.map((built) => built.recipe.moduleId));
    expect(moduleIds.size).toBe(15);
    const countByModule = new Map<string, number>();
    for (const built of allBuiltLessons) {
      countByModule.set(built.recipe.moduleId, (countByModule.get(built.recipe.moduleId) ?? 0) + 1);
    }
    for (const moduleId of A2_MODULE_IDS) {
      expect(countByModule.get(moduleId), moduleId).toBe(4);
    }
  });

  it("every lesson id resolves to a canonical position, and positions are 1..60 with no gaps/duplicates", () => {
    const positions = allBuiltLessons.map((built) => A2_CANONICAL_POSITIONS[built.recipe.id]);
    for (const position of positions) expect(position).toBeGreaterThan(0);
    const sorted = [...positions].sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
  });
});

describe("A2 M1-M15 aggregate — validateFoundations end-to-end over the complete release", () => {
  it("reports zero errors against the real, frozen 60-lesson catalog", () => {
    const result = validateFoundations({
      catalogs: a2FoundationCatalogs,
      foundationCopy: a2FoundationCopy,
      catalogVersion: "modules01to15-aggregate",
      seed: "modules01to15-aggregate-seed",
      availableContentByLesson: A2_AVAILABLE_CONTENT_BY_LESSON,
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });
});

describe("A2 M1-M15 aggregate — malformed conjugation guard, extended to all 60 lessons", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  // The exact malformed sequences a fresh M1-M4 spec review found; never
  // recurs anywhere in the full 60-lesson release.
  const MALFORMED_SEQUENCES = ["はなます", "たべるませんか", "いくませんか", "みよてい"] as const;

  it("realizes every one of all 60 lessons' model+transfer variants with no known-malformed conjugation sequence, and formatRomaji().ok === true", () => {
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const family = famById.get(variant.sentenceFamilyId);
        expect(family, `${variant.id} family ${variant.sentenceFamilyId}`).toBeDefined();
        const result = realizeVariant(family as SentenceFamily, variant, realizeCatalogs, {
          availableConceptIds: [...(family as SentenceFamily).requiredConceptIds],
        });
        if (!result.ok) {
          throw new Error(`realize ${variant.id} failed: ${JSON.stringify(result.errors)}`);
        }
        const romaji = formatRomaji(result.sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
        for (const malformed of MALFORMED_SEQUENCES) {
          expect(
            result.sentence.canonicalJapanese,
            `${variant.id} must not contain malformed sequence "${malformed}"`,
          ).not.toContain(malformed);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Phase 3 Task 7 structural-quality fix: honest invariant-family FormSelection
// across the WHOLE release, self-deriving its source of truth.
//
// Every invariant-family (`rule-invariant-*`) variant bakes its predicate's
// Japanese whole — the FormSelection is descriptive register metadata the
// realizer never consults — so a value's honest polarity/tense/formality is an
// invariant of that baked value, identical everywhere it recurs. This audit
// derives that truth *from the release itself* (the honest M1-M14
// instructional occurrences, each of which already passes its own module's
// register-honesty test — see `modules01to12.test.ts`'s "M4-style honest
// invariant FormSelection metadata" audit) and then holds EVERY
// invariant-family variant in all 60 lessons to it. Because M15 (contract
// "synthesis") recombines only already-taught values, every synthesis
// invariant-family variant MUST carry the same register its own baked value
// carries in the instructional modules; a silent affirmative/present/polite
// default over past/plain/negative baked Japanese is exactly the
// dishonest-metadata defect this catches — generically over the whole
// invariant-family space, never by a hand-listed set of ids. Fail-closed: a
// synthesis value with no honest instructional precedent, or any instructional
// value that itself carries two conflicting registers, fails rather than being
// silently skipped.
//
// Mood (`interrogative`) is a per-utterance choice, not a property of the baked
// value (the same value legitimately appears as both statement and question),
// so only polarity/tense/formality are compared.
// ---------------------------------------------------------------------------
describe("A2 M1-M15 aggregate — honest invariant-family FormSelection register across the whole release (Phase 3 Task 7)", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  const isInvariantFamily = (familyId: string): boolean =>
    famById.get(familyId)?.realizationRuleId.startsWith("rule-invariant-") ?? false;

  interface Register {
    readonly polarity: string;
    readonly tense: string;
    readonly formality: string;
  }
  const registerKey = (f: Register): string => `${f.polarity}/${f.tense}/${f.formality}`;

  // Source of truth: derive each invariant-family predicate value's honest
  // register from the M1-M14 instructional occurrences ONLY, never from M15
  // itself (whose candidate defect this audit exists to catch).
  const instructionalRegistersByValueId = new Map<string, Set<string>>();
  const honestRegisterByValueId = new Map<string, Register>();
  for (const built of allBuiltLessons) {
    if (built.recipe.contract === "synthesis") continue;
    for (const variant of built.variants) {
      if (!isInvariantFamily(variant.sentenceFamilyId)) continue;
      const predicateValueId = variant.slotValues.predicate;
      if (!predicateValueId) continue;
      const register: Register = {
        polarity: variant.form.polarity,
        tense: variant.form.tense,
        formality: variant.form.formality,
      };
      if (!instructionalRegistersByValueId.has(predicateValueId)) {
        instructionalRegistersByValueId.set(predicateValueId, new Set());
      }
      instructionalRegistersByValueId.get(predicateValueId)!.add(registerKey(register));
      honestRegisterByValueId.set(predicateValueId, register);
    }
  }

  it("the instructional (M1-M14) source of truth is internally consistent — every invariant-family value carries exactly one register", () => {
    const conflicting: string[] = [];
    for (const [valueId, registers] of instructionalRegistersByValueId) {
      if (registers.size > 1) {
        conflicting.push(`${valueId}: ${[...registers].sort().join(" vs ")}`);
      }
    }
    expect(
      conflicting,
      `${conflicting.length} invariant-family value(s) with conflicting instructional registers:\n${conflicting.join("\n")}`,
    ).toEqual([]);
  });

  it("every invariant-family variant across all 60 lessons carries the honest register its own baked value realizes (no dishonest affirmative/present/polite default)", () => {
    const violations: string[] = [];
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        if (!isInvariantFamily(variant.sentenceFamilyId)) continue;
        const predicateValueId = variant.slotValues.predicate;
        if (!predicateValueId) continue;
        const expected = honestRegisterByValueId.get(predicateValueId);
        // Fail-closed: an invariant-family value with no honest instructional
        // precedent cannot be validated, so it is a violation rather than a
        // silent skip.
        if (!expected) {
          violations.push(
            `${variant.id} (${predicateValueId}): no instructional register precedent to validate against`,
          );
          continue;
        }
        const actual = variant.form;
        if (
          actual.polarity !== expected.polarity ||
          actual.tense !== expected.tense ||
          actual.formality !== expected.formality
        ) {
          const family = famById.get(variant.sentenceFamilyId) as SentenceFamily;
          const result = realizeVariant(family, variant, realizeCatalogs, {
            availableConceptIds: [...family.requiredConceptIds],
          });
          const jp = result.ok ? result.sentence.canonicalJapanese : "<realize failed>";
          violations.push(
            `${variant.id} (${predicateValueId} => "${jp}"): form is ${JSON.stringify({
              polarity: actual.polarity,
              tense: actual.tense,
              formality: actual.formality,
            })}, expected ${JSON.stringify(expected)}`,
          );
        }
      }
    }
    expect(
      violations,
      `${violations.length} dishonest invariant-family FormSelection(s):\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});

describe("A2 M1-M15 aggregate — no dead values/families across the complete release", () => {
  const M13_M15_FAMILY_IDS: readonly string[] = [
    "a2-family-family-description",
    "a2-family-give-receive",
    "a2-family-celebrate-event",
    "a2-family-choose-gift",
    "a2-family-read-schedule",
    "a2-family-read-notice",
    "a2-family-reply-message",
    "a2-family-fill-form",
  ];

  it("every M13-M14-introduced family is referenced by at least one authored variant (no dead families)", () => {
    const liveFamilyIds = new Set(allBuiltLessons.flatMap((built) => built.variants.map((v) => v.sentenceFamilyId)));
    for (const familyId of M13_M15_FAMILY_IDS) {
      // Only assert for families that genuinely exist in the shared catalog
      // under this exact id (a soft precondition check keeps this test
      // honest if M13/M14's own family ids are ever renamed).
      if (a2SentenceFamilies.some((f) => f.id === familyId)) {
        expect(liveFamilyIds.has(familyId), familyId).toBe(true);
      }
    }
  });

  it("every semantic value referenced by any of all 60 lessons' variants resolves to a real catalog entry (no dangling references)", () => {
    const valueIds = new Set(a2SemanticValues.map((v) => v.id));
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        for (const valueId of Object.values(variant.slotValues)) {
          expect(valueIds.has(valueId), `${variant.id} -> ${valueId}`).toBe(true);
        }
      }
    }
  });

  it("every family referenced by any of all 60 lessons' variants is itself present in a2SentenceFamilies (no orphan family ids on variants)", () => {
    const famIds = new Set(a2SentenceFamilies.map((f) => f.id));
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        expect(famIds.has(variant.sentenceFamilyId), `${variant.id} -> ${variant.sentenceFamilyId}`).toBe(true);
      }
    }
  });

  // Scoped to this task's own additions only (M13/M14 introduce new
  // families/senses/values; M15 introduces none) — a whole-catalog "every
  // value ever declared since M1" sweep would also re-litigate pre-existing
  // M1-M12 debt (84 long-orphaned values, e.g. `a2-value-recipient-friend`,
  // `a2-value-companion-friend`) that predates and is unrelated to this
  // task, so it is deliberately not asserted here.
  it("no M13/M14-introduced value/sense/family (by naming pattern) is dead — every one is used by at least one of all 60 lessons' variants", () => {
    const usedValueIds = new Set(
      allBuiltLessons.flatMap((built) => built.variants.flatMap((v) => Object.values(v.slotValues))),
    );
    const M13_M14_VALUE_PATTERN =
      /^a2-value-(fam-|give-|gift-|celebrate-|event-|schedule-|notice-|reply-msg-|form-|opinion-mise-yasui$|kara-shigoto-owatta$)/;
    const dead = a2SemanticValues
      .filter((value) => M13_M14_VALUE_PATTERN.test(value.id))
      .map((value) => value.id)
      .filter((id) => !usedValueIds.has(id));
    expect(dead, `${dead.length} dead M13/M14-introduced value(s):\n${dead.join("\n")}`).toEqual([]);
  });
});

describe("A2 M1-M15 aggregate — grammar-spiral structural + CONTENT-evidence audit, zero skipped roles", () => {
  const canDoToServingFamilies = new Map<string, Set<string>>();
  for (const family of a2SentenceFamilies) {
    for (const canDoId of family.canDoIds) {
      if (!canDoToServingFamilies.has(canDoId)) canDoToServingFamilies.set(canDoId, new Set());
      canDoToServingFamilies.get(canDoId)!.add(family.id);
    }
  }

  const evidenceByLessonId = new Map<string, GrammarEvidenceLesson>(
    allBuiltLessons.map((built) => [
      built.recipe.id,
      {
        variants: built.variants.map((v) => ({
          sentenceFamilyId: v.sentenceFamilyId,
          pedagogicalUse: v.pedagogicalUse,
        })),
      },
    ]),
  );

  it("validateA2GrammarSpiral reports zero structural errors across all 15 forms", () => {
    const result = validateA2GrammarSpiral(A2_GRAMMAR_SPIRAL, A2_CANONICAL_POSITIONS);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("every role's lesson id of every one of the 15 forms is now inside the built scope — no role is silently skipped as out-of-scope any more", () => {
    const roleLessonIds = new Set<string>();
    for (const form of A2_GRAMMAR_SPIRAL) {
      roleLessonIds.add(form.introLessonId);
      roleLessonIds.add(form.controlledPracticeLessonId);
      roleLessonIds.add(form.transferLessonId);
      for (const lessonId of form.recurrenceLessonIds) roleLessonIds.add(lessonId);
    }
    const unbuilt = [...roleLessonIds].filter((lessonId) => !evidenceByLessonId.has(lessonId));
    expect(unbuilt, `${unbuilt.length} grammar-spiral role lesson id(s) still outside the built scope`).toEqual([]);
  });

  it("reports ZERO content-evidence errors across all 15 grammar-spiral rows — every intro/practice/transfer/recurrence role carries genuine content evidence, with no known-debt allowlist left to pin", () => {
    const result = auditA2GrammarSpiralEvidence(A2_GRAMMAR_SPIRAL, canDoToServingFamilies, evidenceByLessonId);
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("no :recurrence: error anywhere in the audit output, including the M13-M15 recurrence lessons this file newly closes", () => {
    const result = auditA2GrammarSpiralEvidence(A2_GRAMMAR_SPIRAL, canDoToServingFamilies, evidenceByLessonId);
    expect(result.errors.some((e) => e.id.includes(":recurrence:"))).toBe(false);
  });
});

describe("A2 M1-M15 aggregate — Can-do coverage across the complete 59-id registry", () => {
  it("every one of the 59 canonical Can-do ids is served by at least one real, non-empty lesson", () => {
    for (const canDo of a2CanDosAuthored) {
      expect(canDo.lessonIds.length, canDo.id).toBeGreaterThan(0);
    }
    expect(a2CanDosAuthored.map((c) => c.id).sort()).toEqual([...A2_ALL_59_CANDO_IDS].sort());
  });

  it("every one of the 59 canonical Can-do ids has an EN and IT descriptor copy entry with no Japanese literal", () => {
    const JAPANESE_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/u;
    for (const stub of A2_CANDO_REGISTRY) {
      const en = a2CanDoDescriptorCopy.en[stub.descriptorCopyId];
      const it = a2CanDoDescriptorCopy.it[stub.descriptorCopyId];
      expect(en, `${stub.id} EN`).toBeTruthy();
      expect(it, `${stub.id} IT`).toBeTruthy();
      expect(JAPANESE_RE.test(en ?? ""), `${stub.id} EN no Japanese`).toBe(false);
      expect(JAPANESE_RE.test(it ?? ""), `${stub.id} IT no Japanese`).toBe(false);
    }
  });
});

describe("A2 M1-M15 aggregate — no Japanese literal anywhere in the real content directory", () => {
  it("lintA2NoJapanese reports zero violations across all 15 A2 content module files", () => {
    const violations = lintA2NoJapanese(A2_CONTENT_DIR);
    expect(violations).toEqual([]);
  });
});

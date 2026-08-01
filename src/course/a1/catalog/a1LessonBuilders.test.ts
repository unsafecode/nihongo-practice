/**
 * A1 lesson-builder production-path tests (Phase 4 Task 4, code-review fixes).
 *
 * Proves the end-to-end pipeline: kit config → buildInstructionalLesson →
 * diversityConstraints → validateFoundations → insufficient-family-diversity.
 * Uses real A1 catalogs, deliberately scoped so every assertion is attributable
 * to the tested gate and not to collateral errors from unrelated lessons.
 */
import { describe, expect, it } from "vitest";

import {
  buildInstructionalLesson,
  toFoundationLessonDefinition,
} from "../../foundations/instructionalLessonKit";
import { validateFoundations, type ValidationError } from "../../foundations/validateFoundations";
import {
  a1SemanticFoundationCatalogs,
  a1FoundationCopy,
} from "./catalog";
import { A1_RELEASE_CATALOG_VERSION, A1_RELEASE_SEED } from "../releaseIdentity";
import { A1_INSTRUCTIONAL_KIT_CONFIG } from "./a1LessonBuilders";

// ---------------------------------------------------------------------------
// declared model-family floor — production-path proof (D8)
// ---------------------------------------------------------------------------

describe("A1 builder: production-path family-diversity gate (D8)", () => {
  // Build the real "actions-1" lesson (a known single-family lesson: all 8
  // models use "a1-family-object-action") through the kit with minFamilies: 2.
  const L = (en: string, it: string) => ({ en, it });
  const obj = (subject: string, predicate: string, object: string) => ({
    subject, predicate, object,
  });

  const raisedConfig = { ...A1_INSTRUCTIONAL_KIT_CONFIG, minFamilies: 2 };
  const builtRaised = buildInstructionalLesson(raisedConfig, {
    id: "actions-1",
    moduleId: "actions",
    order: 1 as const,
    primaryCanDoId: "a1-can-do-actions",
    supportingCanDoIds: ["a1-can-do-daily-life"],
    introducedConceptIds: [
      "a1-concept-topic-wa", "a1-concept-object-wo",
    ],
    introducedSenseIds: ["a1-sense-eat", "a1-sense-drink", "a1-sense-read"],
    models: [
      { id: "actions-1-m1", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit" as const, slots: obj("a1-value-yuki", "a1-value-eat", "a1-value-obj-sushi"), translation: L("Yuki eats sushi.", "Yuki mangia il sushi.") },
      { id: "actions-1-m2", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-self", subjectRealization: "omitted" as const, slots: obj("a1-value-watashi", "a1-value-eat", "a1-value-obj-ramen"), translation: L("I eat ramen.", "Mangio il ramen.") },
      { id: "actions-1-m3", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-self", subjectRealization: "omitted" as const, slots: obj("a1-value-watashi", "a1-value-drink", "a1-value-obj-coffee"), translation: L("I drink coffee.", "Bevo il caffè.") },
      { id: "actions-1-m4", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit" as const, slots: obj("a1-value-mina", "a1-value-drink", "a1-value-obj-tea"), translation: L("Mina drinks tea.", "Mina beve il tè.") },
      { id: "actions-1-m5", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-yuki", subjectRealization: "explicit" as const, slots: obj("a1-value-yuki", "a1-value-read", "a1-value-obj-book"), translation: L("Yuki reads a book.", "Yuki legge un libro.") },
      { id: "actions-1-m6", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted" as const, slots: obj("a1-value-watashi", "a1-value-read", "a1-value-obj-newspaper"), translation: L("I read the newspaper.", "Leggo il giornale.") },
      { id: "actions-1-m7", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit" as const, slots: obj("a1-value-ken", "a1-value-eat", "a1-value-obj-bread"), translation: L("Ken eats bread.", "Ken mangia il pane.") },
      { id: "actions-1-m8", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-self", subjectRealization: "omitted" as const, slots: obj("a1-value-watashi", "a1-value-drink", "a1-value-obj-water"), translation: L("I drink water.", "Bevo l'acqua.") },
    ],
    transfers: [
      { id: "actions-1-t1", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-mina", subjectRealization: "explicit" as const, slots: obj("a1-value-mina", "a1-value-read", "a1-value-obj-book"), translation: L("Mina reads a book.", "Mina legge un libro.") },
      { id: "actions-1-t2", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-self", subjectRealization: "omitted" as const, slots: obj("a1-value-watashi", "a1-value-eat", "a1-value-obj-sushi"), translation: L("I eat sushi.", "Mangio il sushi.") },
      { id: "actions-1-t3", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-ken", subjectRealization: "explicit" as const, slots: obj("a1-value-ken", "a1-value-drink", "a1-value-obj-coffee"), translation: L("Ken drinks coffee.", "Ken beve il caffè.") },
      { id: "actions-1-t4", family: "a1-family-object-action", context: "a1-context-classroom", subjectReferent: "a1-referent-self", subjectRealization: "omitted" as const, slots: obj("a1-value-watashi", "a1-value-read", "a1-value-obj-book"), translation: L("I read a book.", "Leggo un libro.") },
      { id: "actions-1-t5", family: "a1-family-object-action", context: "a1-context-cafe", subjectReferent: "a1-referent-mina", subjectRealization: "explicit" as const, slots: obj("a1-value-mina", "a1-value-eat", "a1-value-obj-ramen"), translation: L("Mina eats ramen.", "Mina mangia il ramen.") },
    ],
  });

  it("validateFoundations rejects when kit config declares minFamilies: 2 on a single-family lesson", () => {
    // Confirm the kit plumbed the raised floor into the recipe.
    expect(builtRaised.recipe.diversityConstraints.minFamilies).toBe(2);

    // Convert into a FoundationLessonDefinition and validate through
    // the real pipeline with the full A1 catalog.
    const variantById = new Map(
      a1SemanticFoundationCatalogs.sentenceVariants.map((v) => [v.id, v]),
    );
    const raisedLessonDef = toFoundationLessonDefinition(builtRaised.recipe, "a1", variantById);

    // Swap the raised lesson into the full A1 catalog (so integrity checks pass
    // on the unmodified 43 siblings) and validate through the real pipeline.
    const raisedCatalogs = {
      ...a1SemanticFoundationCatalogs,
      lessons: a1SemanticFoundationCatalogs.lessons.map((l) =>
        l.id === "actions-1" ? raisedLessonDef : l,
      ),
    };

    const result = validateFoundations({
      catalogs: raisedCatalogs,
      foundationCopy: a1FoundationCopy,
      catalogVersion: A1_RELEASE_CATALOG_VERSION,
      seed: A1_RELEASE_SEED,
    });

    // Assert on the specific error code and lesson — not `result.valid`, which
    // is false for unrelated reasons (transfer errors on sibling lessons whose
    // cumulative availability changes when actions-1 is rebuilt).
    const familyErrors = result.errors.filter(
      (e: ValidationError) => e.code === "insufficient-family-diversity",
    );
    expect(familyErrors.length).toBeGreaterThanOrEqual(1);
    const actions1Error = familyErrors.find(
      (e: ValidationError) => e.lessonId === "actions-1",
    );
    expect(actions1Error, "actions-1 must be rejected for insufficient family diversity").toBeDefined();
  });

  it("shipped floor of 1 produces zero insufficient-family-diversity errors on actions-1", () => {
    // Companion assertion: the real shipped catalog (minFamilies: 1) does NOT
    // fire the family-diversity gate, proving the test above discriminates.
    const shippedResult = validateFoundations({
      catalogs: a1SemanticFoundationCatalogs,
      foundationCopy: a1FoundationCopy,
      catalogVersion: A1_RELEASE_CATALOG_VERSION,
      seed: A1_RELEASE_SEED,
    });

    const familyErrors = shippedResult.errors.filter(
      (e: ValidationError) => e.code === "insufficient-family-diversity",
    );
    expect(
      familyErrors,
      "shipped floor of 1 must produce zero family-diversity errors — if this fails, a shipped A1 lesson now trips the family-diversity floor of 1",
    ).toHaveLength(0);
  });
});

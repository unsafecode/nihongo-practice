import { describe, expect, it } from "vitest";

import { BASE_REFERENCE_IDS } from "../../base/references/catalog";
import { baseReferencePath } from "../../../routing/routePaths";
import { a1LessonContents } from "./catalog";
import { a1LearningNoteById } from "./grammar";
import { buildA1CurriculumViewModel } from "./buildA1CurriculumViewModel";
import {
  A1_INHERITED_BASE_CONCEPT_IDS,
  BASE_REFERENCE_ID_BY_INHERITED_CONCEPT,
} from "./inheritedBase";

/**
 * Task 16: a Base-owned grammar concept appearing inside a retained A1 scenario
 * lesson is *reviewed and applied*, never introduced. The learner-facing proof
 * of that is the recap: it names each Base-owned concept the lesson leans on
 * and links out to the Base progressive reference that actually teaches it.
 */
describe("A1 recap links Base-owned concepts to their Base reference", () => {
  it("maps every inherited concept to a real Base reference id", () => {
    expect(Object.keys(BASE_REFERENCE_ID_BY_INHERITED_CONCEPT).sort()).toEqual(
      [...A1_INHERITED_BASE_CONCEPT_IDS].sort(),
    );
    for (const referenceId of Object.values(BASE_REFERENCE_ID_BY_INHERITED_CONCEPT)) {
      expect(BASE_REFERENCE_IDS).toContain(referenceId);
    }
  });

  it("exposes a reviewed reference for every retained lesson that requires one", () => {
    const inherited = new Set<string>(A1_INHERITED_BASE_CONCEPT_IDS);
    let lessonsWithReferences = 0;

    for (const content of a1LessonContents) {
      const note = a1LearningNoteById[content.learningNoteId];
      expect(note, content.lessonId).toBeDefined();
      const expectedConceptIds = [
        ...new Set(
          [...(note?.requiredConceptIds ?? []), ...content.prerequisiteConceptIds].filter(
            (conceptId) => inherited.has(conceptId),
          ),
        ),
      ].sort();

      for (const locale of ["en", "it"] as const) {
        const view = buildA1CurriculumViewModel(content.lessonId, locale);
        expect(view.ok, `${content.lessonId} ${locale}`).toBe(true);
        if (!view.ok) continue;

        const reviewed = view.model.recap.reviewedBaseReferences;
        expect(
          reviewed.map((entry) => entry.conceptId).sort(),
          `${content.lessonId} ${locale}`,
        ).toEqual(expectedConceptIds);

        for (const entry of reviewed) {
          expect(BASE_REFERENCE_IDS).toContain(entry.referenceId);
          expect(entry.href).toBe(baseReferencePath(entry.referenceId));
          expect(entry.label.trim().length, entry.conceptId).toBeGreaterThan(0);
        }
      }
      if (expectedConceptIds.length > 0) lessonsWithReferences += 1;
    }

    // The contract is only meaningful if retained A1 genuinely leans on Base.
    expect(lessonsWithReferences).toBeGreaterThan(0);
  });

  it("localizes the reference label rather than repeating one locale", () => {
    const withReferences = a1LessonContents.find((content) => {
      const view = buildA1CurriculumViewModel(content.lessonId, "en");
      return view.ok && view.model.recap.reviewedBaseReferences.length > 0;
    });
    expect(withReferences, "a retained lesson reviews a Base concept").toBeDefined();
    if (!withReferences) return;

    const en = buildA1CurriculumViewModel(withReferences.lessonId, "en");
    const it = buildA1CurriculumViewModel(withReferences.lessonId, "it");
    if (!en.ok || !it.ok) throw new Error("expected both locales to resolve");

    expect(it.model.recap.reviewedBaseReferences.map((entry) => entry.referenceId)).toEqual(
      en.model.recap.reviewedBaseReferences.map((entry) => entry.referenceId),
    );
    expect(it.model.recap.reviewedBaseReferences.map((entry) => entry.label)).not.toEqual(
      en.model.recap.reviewedBaseReferences.map((entry) => entry.label),
    );
  });
});

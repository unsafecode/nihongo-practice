import { describe, expect, it } from "vitest";

import { A1_LESSON_IDS, A1_RETAINED_LESSON_IDS } from "../manifest";
import { a1LessonContents } from "./catalog";
import { A1_INHERITED_BASE_CONCEPT_IDS as LEAF_INHERITED_BASE_CONCEPT_IDS } from "../inheritedBaseConcepts";
import { a1ConceptFirstTeachingNoteId, a1LearningNoteById } from "./grammar";
import {
  A1_INHERITED_BASE_CONCEPT_IDS,
  A1_INHERITED_BASE_LEXEME_IDS,
  A1_INHERITED_BASE_VERB_FORMS,
  A1_PUBLISHED_ROUTE_PARTITION,
  A1_REHOMED_LESSON_CONTENT,
  A1_REHOMED_LESSON_IDS,
  inheritedBaseConceptIds,
  inheritedBaseLexemeIds,
} from "./inheritedBase";

const REHOMED_MODULE_IDS = [
  "sounds",
  "sentence-foundations",
  "topic-questions",
  "polite-verbs",
  "time-movement",
];

describe("A1 inherited-Base vocabulary", () => {
  it("covers exactly the twenty rehomed lessons, none of the retained forty-four", () => {
    expect(A1_REHOMED_LESSON_IDS).toHaveLength(20);
    expect(new Set(A1_REHOMED_LESSON_IDS).size).toBe(20);

    for (const lessonId of A1_REHOMED_LESSON_IDS) {
      const moduleId = lessonId.slice(0, lessonId.lastIndexOf("-"));
      expect(REHOMED_MODULE_IDS, lessonId).toContain(moduleId);
      expect(A1_RETAINED_LESSON_IDS, lessonId).not.toContain(lessonId);
    }
  });

  it("splits the published 64 A1 routes into a disjoint rehomed/retained union", () => {
    const { rehomed, retained, published } = A1_PUBLISHED_ROUTE_PARTITION;

    expect(published).toEqual(A1_LESSON_IDS);
    expect(published).toHaveLength(64);
    expect(rehomed.filter((id) => retained.includes(id))).toEqual([]);
    expect([...rehomed, ...retained].sort()).toEqual([...published].sort());
  });

  it("derives the inherited lexemes from the rehomed lessons' own authored content", () => {
    const authored = A1_REHOMED_LESSON_CONTENT.flatMap(
      ({ newLexemeIds }) => newLexemeIds,
    );

    expect(A1_INHERITED_BASE_LEXEME_IDS).toEqual([...new Set(authored)]);
    expect(A1_INHERITED_BASE_LEXEME_IDS.length).toBeGreaterThan(0);
  });

  it("never claims a lexeme the retained A1 catalog still introduces itself", () => {
    const retainedIntroductions = new Set(
      a1LessonContents.flatMap(({ newLexemeIds }) => newLexemeIds),
    );
    const overlap = A1_INHERITED_BASE_LEXEME_IDS.filter((id) =>
      retainedIntroductions.has(id),
    );

    expect(overlap, "inherited seed must not mask a retained A1 introduction").toEqual([]);
  });

  it("hands out an independent mutable seed per closure walk", () => {
    const first = inheritedBaseLexemeIds();
    first.add("a1-lexeme-not-real");

    expect(inheritedBaseLexemeIds().has("a1-lexeme-not-real")).toBe(false);
    expect(inheritedBaseLexemeIds().size).toBe(A1_INHERITED_BASE_LEXEME_IDS.length);
  });

  it("inherits exactly the concepts whose first teaching note is a rehomed lesson's", () => {
    const rehomedNoteIds = new Set(
      A1_REHOMED_LESSON_CONTENT.map(({ learningNoteId }) => learningNoteId),
    );

    expect(A1_INHERITED_BASE_CONCEPT_IDS.length).toBeGreaterThan(0);
    for (const conceptId of A1_INHERITED_BASE_CONCEPT_IDS) {
      const noteId = a1ConceptFirstTeachingNoteId[conceptId];
      expect(rehomedNoteIds, conceptId).toContain(noteId);
      expect(a1LearningNoteById[noteId!]?.explainedConceptIds, conceptId).toContain(conceptId);
    }

    // A retained lesson may legitimately reuse a note (`a1-note-particle-ga`
    // serves both the rehomed `topic-questions-2` and the retained
    // `essential-questions-4`). What matters is that the *first* canonical
    // lesson carrying the first-teaching note is one Base now owns.
    const firstLessonByNoteId = new Map<string, string>();
    for (const lessonId of A1_LESSON_IDS) {
      const noteId =
        A1_REHOMED_LESSON_CONTENT.find((content) => content.lessonId === lessonId)
          ?.learningNoteId ??
        a1LessonContents.find((content) => content.lessonId === lessonId)?.learningNoteId;
      if (noteId !== undefined && !firstLessonByNoteId.has(noteId)) {
        firstLessonByNoteId.set(noteId, lessonId);
      }
    }
    for (const conceptId of A1_INHERITED_BASE_CONCEPT_IDS) {
      const firstLessonId = firstLessonByNoteId.get(a1ConceptFirstTeachingNoteId[conceptId]!);
      expect(A1_REHOMED_LESSON_IDS, `${conceptId} is Base-first-taught`).toContain(
        firstLessonId,
      );
    }
  });

  it("agrees with the dependency-light leaf derivation used by the authoring layer", () => {
    expect([...A1_INHERITED_BASE_CONCEPT_IDS].sort()).toEqual(
      [...LEAF_INHERITED_BASE_CONCEPT_IDS].sort(),
    );
  });

  it("inherits only verb forms the rehomed notes actually explain", () => {
    const authored = A1_REHOMED_LESSON_CONTENT.flatMap(
      ({ learningNoteId }) => a1LearningNoteById[learningNoteId]?.explainedVerbForms ?? [],
    );

    expect(A1_INHERITED_BASE_VERB_FORMS).toEqual(authored);
  });

  it("hands out an independent mutable concept seed", () => {
    const first = inheritedBaseConceptIds();
    first.add("a1-concept-not-real");

    expect(inheritedBaseConceptIds().has("a1-concept-not-real")).toBe(false);
    expect(inheritedBaseConceptIds().size).toBe(A1_INHERITED_BASE_CONCEPT_IDS.length);
  });
});

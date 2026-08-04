import { describe, expect, it } from "vitest";

import { A1_CONCEPT_IDS } from "../catalog/a1SemanticCatalog";
import {
  a1LearningNoteById,
  a1LearningNotes,
  defineA1LearningNote,
  type A1LearningNote,
} from "./grammar";

const REQUIRED_NOTE_IDS = [
  "a1-note-sentence-shape-omission",
  "a1-note-personal-reference",
  "a1-note-topic-wa-copula-desu",
  "a1-note-question-ka-words",
  "a1-note-dictionary-masu-classes",
  "a1-note-particle-ga",
  "a1-note-particle-o",
  "a1-note-particle-de",
  "a1-note-particle-ni",
  "a1-note-particle-he",
  "a1-note-masu-masen",
  "a1-note-mashita-masen-deshita",
] as const;

function validNote(): A1LearningNote {
  return {
    id: "a1-note-valid",
    kind: "grammar",
    explainedConceptIds: ["a1-concept-topic-wa"],
    requiredConceptIds: [],
    title: { en: "A title", it: "Un titolo" },
    meaning: { en: "A meaning", it: "Un significato" },
    use: { en: "A use", it: "Un uso" },
    construction: { en: "A construction", it: "Una costruzione" },
    typicalMistake: { en: "A mistake", it: "Un errore" },
    pattern: [
      {
        kind: "slot",
        text: "topic",
        label: { en: "topic", it: "tema" },
      },
    ],
  };
}

describe("A1 learner note catalog", () => {
  it("gives every note complete bilingual learner-facing copy", () => {
    const ids = new Set<string>();

    for (const note of a1LearningNotes) {
      expect(note.id.length).toBeGreaterThan(0);
      expect(ids.has(note.id)).toBe(false);
      ids.add(note.id);
      expect(note.title.en.trim()).not.toBe("");
      expect(note.title.it.trim()).not.toBe("");
      expect(note.meaning.en.trim()).not.toBe("");
      expect(note.meaning.it.trim()).not.toBe("");
      expect(note.use.en.trim()).not.toBe("");
      expect(note.use.it.trim()).not.toBe("");
      expect(note.construction.en.trim()).not.toBe("");
      expect(note.construction.it.trim()).not.toBe("");
      expect(note.typicalMistake.en.trim()).not.toBe("");
      expect(note.typicalMistake.it.trim()).not.toBe("");
      if (note.subjectOmissionNote) {
        expect(note.subjectOmissionNote.en.trim()).not.toBe("");
        expect(note.subjectOmissionNote.it.trim()).not.toBe("");
      }
    }
  });

  it("makes each visual pattern textual and bilingual rather than color-only", () => {
    for (const note of a1LearningNotes) {
      expect(note.pattern.length).toBeGreaterThan(0);
      for (const token of note.pattern) {
        expect(["slot", "particle", "ending", "punctuation"]).toContain(token.kind);
        expect(token.text.trim()).not.toBe("");
        expect(token.label.en.trim()).not.toBe("");
        expect(token.label.it.trim()).not.toBe("");
        if (token.kind === "particle" || token.kind === "ending") {
          expect(token.label.en).toMatch(/\S/);
          expect(token.label.it).toMatch(/\S/);
        }
      }
    }
  });

  it("contains the required notes with the intended kinds", () => {
    for (const id of REQUIRED_NOTE_IDS) {
      expect(a1LearningNoteById[id]?.id).toBe(id);
    }
    expect(a1LearningNotes.filter(({ kind }) => kind === "phonetic")).toHaveLength(4);
    expect(a1LearningNotes.filter(({ kind }) => kind === "synthesis")).not.toHaveLength(0);
    expect(a1LearningNoteById["a1-note-sounds-mora-vowels"]?.kind).toBe("phonetic");
    expect(a1LearningNoteById["a1-note-synthesis-recombine"]?.kind).toBe("synthesis");
  });

  it("covers and resolves the A1 concept graph without duplicate prerequisites", () => {
    const knownConceptIds = new Set(A1_CONCEPT_IDS);
    const explainedConceptIds = new Set<string>();

    for (const note of a1LearningNotes) {
      expect(new Set(note.requiredConceptIds).size).toBe(note.requiredConceptIds.length);
      expect(new Set(note.explainedConceptIds).size).toBe(note.explainedConceptIds.length);
      for (const conceptId of note.requiredConceptIds) {
        expect(knownConceptIds.has(conceptId)).toBe(true);
      }
      for (const conceptId of note.explainedConceptIds) {
        expect(knownConceptIds.has(conceptId)).toBe(true);
        explainedConceptIds.add(conceptId);
      }
      if (note.nearestContrastId) {
        expect(note.nearestContrastId).not.toBe(note.id);
        expect(a1LearningNoteById[note.nearestContrastId]?.id).toBe(note.nearestContrastId);
      }
    }

    expect(A1_CONCEPT_IDS.filter((conceptId) => !explainedConceptIds.has(conceptId))).toEqual([]);
  });

  it("freezes catalog entries and exposes a frozen plain-record index", () => {
    expect(Object.isFrozen(a1LearningNotes)).toBe(true);
    expect(Object.isFrozen(a1LearningNoteById)).toBe(true);
    expect(a1LearningNoteById).not.toBeInstanceOf(Map);

    for (const note of a1LearningNotes) {
      expect(a1LearningNoteById[note.id]).toBe(note);
      expect(Object.isFrozen(note)).toBe(true);
      expect(Object.isFrozen(note.explainedConceptIds)).toBe(true);
      expect(Object.isFrozen(note.requiredConceptIds)).toBe(true);
      expect(Object.isFrozen(note.pattern)).toBe(true);
      expect(Object.isFrozen(note.pattern[0])).toBe(true);
      expect(Object.isFrozen(note.pattern[0].label)).toBe(true);
    }

    expect(() => {
      // @ts-expect-error The public index is readonly.
      a1LearningNoteById["a1-note-other"] = a1LearningNotes[0];
    }).toThrow();
  });

  it("teaches personal reference through omission and context", () => {
    expect(a1LearningNoteById["a1-note-personal-reference"]).toMatchObject({
      title: {
        en: "Say the person once, then omit it",
        it: "Nomina la persona, poi omettila",
      },
      meaning: {
        en: expect.stringMatching(/leaves out.*I.*you.*subjects.*context/i),
        it: expect.stringMatching(/omette.*io.*tu.*soggetti.*contesto/i),
      },
      use: {
        en: expect.stringMatching(/わたし.*name.*title.*あなた/i),
        it: expect.stringMatching(/わたし.*nome.*titolo.*あなた/i),
      },
      typicalMistake: {
        en: expect.stringMatching(/do not repeat.*わたし.*あなた/i),
        it: expect.stringMatching(/non ripetere.*わたし.*あなた/i),
      },
      subjectOmissionNote: {
        en: expect.stringMatching(/recover.*context/i),
        it: expect.stringMatching(/ricavare.*contesto/i),
      },
      pattern: [
        expect.objectContaining({ text: "person", label: { en: "person/topic", it: "persona/tema" } }),
        expect.objectContaining({ kind: "particle", text: "は", label: { en: "topic particle", it: "particella del tema" } }),
        expect.objectContaining({ text: "information", label: { en: "information", it: "informazione" } }),
        expect.objectContaining({ kind: "ending", text: "です", label: { en: "polite copula", it: "copula cortese" } }),
      ],
    });
  });

  it("rejects incomplete or silently normalized note shapes", () => {
    expect(() =>
      defineA1LearningNote({
        ...validNote(),
        title: { en: " ", it: "Un titolo" },
      }),
    ).toThrow(/title.*non-empty/i);
    expect(() =>
      defineA1LearningNote({
        ...validNote(),
        kind: "other" as never,
      }),
    ).toThrow(/kind/i);
    expect(() =>
      defineA1LearningNote({
        ...validNote(),
        explainedConceptIds: ["a1-concept-topic-wa", "a1-concept-topic-wa"],
      }),
    ).toThrow(/duplicate.*explained/i);
    expect(() =>
      defineA1LearningNote({
        ...validNote(),
        pattern: [{ kind: "color" as never, text: "", label: { en: "", it: "" } }],
      }),
    ).toThrow(/pattern/i);
  });
});

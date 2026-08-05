import { describe, expect, it } from "vitest";

import { A1_CONCEPT_IDS } from "../catalog/a1SemanticCatalog";
import {
  a1ConceptFirstTeachingNoteId,
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
  "a1-note-location-ni-de-contrast",
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

  it("assigns every A1 concept one immutable substantive first-teaching note", () => {
    const firstTeachingNoteId = a1ConceptFirstTeachingNoteId;

    expect(Object.isFrozen(firstTeachingNoteId)).toBe(true);
    expect(firstTeachingNoteId).not.toBeInstanceOf(Map);
    expect(Object.keys(firstTeachingNoteId).sort()).toEqual([...A1_CONCEPT_IDS].sort());
    for (const conceptId of A1_CONCEPT_IDS) {
      const noteId = firstTeachingNoteId[conceptId];
      expect(noteId, conceptId).toEqual(expect.any(String));
      expect(a1LearningNoteById[noteId]?.explainedConceptIds).toContain(conceptId);
    }
    expect(firstTeachingNoteId).toMatchObject({
      "a1-concept-object-wo": "a1-note-particle-o",
      "a1-concept-preference-ga": "a1-note-preference-ga",
      "a1-concept-companion-to": "a1-note-companion-to",
      "a1-concept-recipient-ni": "a1-note-particle-ni",
      "a1-concept-location-particle": "a1-note-location-ni-de-contrast",
      "a1-concept-interrogative-ka": "a1-note-question-ka-words",
      "a1-concept-direction-he": "a1-note-particle-ni-destination",
      "a1-concept-topic-wa": "a1-note-sentence-shape-omission",
      "a1-concept-copula-desu": "a1-note-sentence-shape-omission",
    });
  });

  it("keeps the sentence-shape note out of later particle teaching", () => {
    expect(
      a1LearningNoteById["a1-note-sentence-shape-omission"]?.explainedConceptIds,
    ).toEqual(["a1-concept-topic-wa", "a1-concept-copula-desu"]);
  });

  it("explains the location particle through both action-place and destination uses", () => {
    const explainerIds = new Set(
      a1LearningNotes
        .filter(({ explainedConceptIds }) => explainedConceptIds.includes("a1-concept-location-particle"))
        .map(({ id }) => id),
    );

    expect([...explainerIds]).toEqual(
      expect.arrayContaining([
        "a1-note-particle-de",
        "a1-note-location-ni-de-contrast",
        "a1-note-particle-ni-destination",
      ]),
    );
  });

  it("scopes basic bare ほしい to the speaker and preserves the が warning", () => {
    expect(a1LearningNoteById["a1-note-needs-wants"]).toMatchObject({
      meaning: {
        en: "In this basic pattern, ほしい describes what the speaker wants; the wanted thing takes が.",
        it: "In questa struttura di base, ほしい descrive ciò che vuole chi parla; la cosa desiderata prende が.",
      },
      use: {
        en: "Use it for your own simple wish or need. To ask what the addressee wants, use a question.",
        it: "Usalo per un tuo semplice desiderio o bisogno. Per chiedere che cosa vuole l'interlocutore, usa una domanda.",
      },
      construction: {
        en: "State わたし as topic when needed, then the wanted thing + が + ほしいです.",
        it: "Se serve, indica わたし come tema, poi la cosa desiderata + が + ほしいです.",
      },
      typicalMistake: {
        en: "Do not use bare ほしいです to state another person's desire; later patterns or quoting are required and are outside this A1 lesson. Do not use を after the wanted thing.",
        it: "Non usare ほしいです da solo per dire il desiderio di un'altra persona; servono strutture successive o il discorso riportato, fuori da questa lezione A1. Non usare を dopo la cosa desiderata.",
      },
    });
  });

  it("contrasts destination に with an action place で without introducing unrelated roles", () => {
    const note = a1LearningNoteById["a1-note-location-ni-de-contrast"];

    expect(note).toMatchObject({
      id: "a1-note-location-ni-de-contrast",
      kind: "grammar",
      explainedConceptIds: ["a1-concept-location-particle"],
      requiredConceptIds: [],
      title: {
        en: "Contrast destination に and action place で",
        it: "Confronta la destinazione に e il luogo dell'azione で",
      },
      meaning: {
        en: "After a place, に marks the destination for going or coming; で marks the setting where an activity happens.",
        it: "Dopo un luogo, に segna la destinazione con andare o venire; で segna il contesto in cui avviene un'attività.",
      },
      use: {
        en: expect.stringMatching(/where to.*where.*activity happen/i),
        it: expect.stringMatching(/dove si va.*dove avviene l'attività/i),
      },
      construction: {
        en: expect.stringMatching(/place.*に.*go.*come.*place.*で.*work/i),
        it: expect.stringMatching(/luogo.*に.*andare.*venire.*luogo.*で.*lavorare/i),
      },
      typicalMistake: {
        en: expect.stringContaining("*placeでいきます"),
        it: expect.stringContaining("*luogoでいきます"),
      },
      nearestContrastId: "a1-note-particle-ni-destination",
    });
    expect(note?.typicalMistake.en).toContain("*placeに働きます");
    expect(note?.typicalMistake.it).toContain("*luogoに働きます");
    expect(note?.pattern).toEqual([
      expect.objectContaining({
        kind: "slot",
        text: "destination",
      }),
      expect.objectContaining({
        kind: "particle",
        text: "に",
        label: {
          en: "destination particle for go or come",
          it: "particella di destinazione con andare o venire",
        },
      }),
      expect.objectContaining({
        kind: "slot",
        text: "go／come",
      }),
      expect.objectContaining({
        kind: "punctuation",
        text: "／",
      }),
      expect.objectContaining({
        kind: "slot",
        text: "action place",
      }),
      expect.objectContaining({
        kind: "particle",
        text: "で",
        label: {
          en: "action-place particle",
          it: "particella del luogo dell'azione",
        },
      }),
      expect.objectContaining({
        kind: "slot",
        text: "activity (e.g. work)",
      }),
    ]);
    expect(a1LearningNoteById["a1-note-particle-de"]?.nearestContrastId).toBe(
      "a1-note-location-ni-de-contrast",
    );
    expect(a1LearningNoteById["a1-note-particle-ni-destination"]?.nearestContrastId).toBe(
      "a1-note-location-ni-de-contrast",
    );
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

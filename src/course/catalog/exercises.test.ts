import { describe, expect, it } from "vitest";
import {
  curriculumExercises,
  endingDistractorRefs,
  exerciseIdsByLesson,
} from "./exercises";
import {
  assembledCurriculum,
  curriculumCopy,
  curriculumLessons,
  orderedCurriculumLessons,
} from "./curriculum";
import { curriculumExamplesById } from "./examples";
import { validateCurriculum } from "./validateCurriculum";
import { evaluateExercise, generateExercise } from "../exercises/engine";
import type {
  ExerciseCandidate,
  ExerciseCatalogsInput,
  ExerciseDefinition,
  ExerciseKind,
  ExercisePrompt,
  SegmentRef,
} from "../exercises/types";
import type { ExerciseCatalogEntry } from "./types";

/**
 * Slice C Task 2 acceptance. Everything is proven from the shared engine and
 * the pure validator — never by counting rendered strings (design spec §5.2,
 * §10.1-§10.3, §17.1). The exercise catalog must be complete (3-5 per lesson),
 * derive every answer from shared example data, cover all five engine kinds,
 * and keep IT/EN prompt parity.
 */

const ALL_KINDS: readonly ExerciseKind[] = [
  "tile-ordering",
  "choice",
  "transformation",
  "completion",
  "constrained-construction",
];

const LESSON_MIN = 3;
const LESSON_MAX = 5;
const TOTAL_LESSONS = 40;

// Any hiragana, katakana (full/half width), or CJK ideograph — a definition
// that carries one has copied a canonical answer instead of referencing it.
const JAPANESE = /[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/;

const catalogs: ExerciseCatalogsInput = {
  concepts: assembledCurriculum.concepts.map((c) => ({ id: c.id })),
  lexemes: assembledCurriculum.lexemes.map((l) => ({ id: l.id })),
  examples: assembledCurriculum.examples.map((e) => ({
    id: e.id,
    jp: e.jp ?? "",
    segments: e.segments ?? [],
    lexemeIds: e.lexemeIds,
    conceptIds: e.conceptIds,
  })),
};

const exercisesById = new Map<string, ExerciseCatalogEntry>(
  curriculumExercises.map((entry) => [entry.id, entry]),
);

function definitionOf(id: string): ExerciseDefinition {
  const entry = exercisesById.get(id);
  if (!entry?.definition) throw new Error(`missing definition for ${id}`);
  return entry.definition;
}

function generatedPrompt(definition: ExerciseDefinition): ExercisePrompt {
  const result = generateExercise(definition, catalogs);
  if (!result.ok) {
    throw new Error(`generation failed for ${definition.id}: ${result.error.code}`);
  }
  return result.prompt;
}

function resolveSegmentSurface(definition: ExerciseDefinition, reference: { exampleId?: string; segmentId: string }) {
  const exampleId = reference.exampleId ?? definition.targetExampleId;
  const example = catalogs.examples.find((entry) => entry.id === exampleId);
  if (!example) throw new Error(`missing example ${exampleId}`);
  const segment = example.segments.find((entry) => entry.id === reference.segmentId);
  if (!segment) throw new Error(`missing segment ${exampleId}#${reference.segmentId}`);
  return segment.jp;
}

function resolveBankSurface(reference: SegmentRef) {
  if (!reference.exampleId) {
    throw new Error(`missing example for segment ${reference.segmentId}`);
  }
  const example = curriculumExamplesById.get(reference.exampleId);
  if (!example) throw new Error(`missing example ${reference.exampleId}`);
  const segment = example.segments.find((entry) => entry.id === reference.segmentId);
  if (!segment) {
    throw new Error(`missing segment ${reference.exampleId}#${reference.segmentId}`);
  }
  return segment.jp;
}

function canonicalCandidate(prompt: ExercisePrompt): ExerciseCandidate {
  switch (prompt.kind) {
    case "tile-ordering":
      return { kind: "tile-ordering", tileIds: [...prompt.correctTileIds] };
    case "choice":
      return { kind: "choice", optionId: prompt.correctOptionId };
    case "transformation":
    case "completion":
    case "constrained-construction":
      return { kind: prompt.kind, text: prompt.canonicalAnswer };
  }
}

describe("exercise catalog completeness (spec §5.2, §10.1)", () => {
  it("covers all forty learner lessons in the id map", () => {
    expect(exerciseIdsByLesson.size).toBe(TOTAL_LESSONS);
    expect(curriculumLessons).toHaveLength(TOTAL_LESSONS);
    for (const lesson of curriculumLessons) {
      expect(exerciseIdsByLesson.has(lesson.id), lesson.id).toBe(true);
    }
  });

  it("gives every lesson 3-5 unique, resolvable exercise ids", () => {
    for (const lesson of curriculumLessons) {
      const ids = lesson.exerciseIds ?? [];
      expect(ids.length, `${lesson.id} count`).toBeGreaterThanOrEqual(LESSON_MIN);
      expect(ids.length, `${lesson.id} count`).toBeLessThanOrEqual(LESSON_MAX);
      expect(new Set(ids).size, `${lesson.id} unique`).toBe(ids.length);
      for (const id of ids) {
        expect(exercisesById.has(id), `${lesson.id} -> ${id}`).toBe(true);
      }
    }
  });

  it("keeps the lesson map and lesson entries consistent", () => {
    for (const lesson of curriculumLessons) {
      expect([...(exerciseIdsByLesson.get(lesson.id) ?? [])]).toEqual([
        ...(lesson.exerciseIds ?? []),
      ]);
    }
  });

  it("assigns globally unique, stable exercise ids", () => {
    const ids = curriculumExercises.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Every catalog exercise is referenced by exactly one lesson.
    const referenced = curriculumLessons.flatMap((l) => l.exerciseIds ?? []);
    expect(new Set(referenced).size).toBe(referenced.length);
    expect(new Set(referenced)).toEqual(new Set(ids));
  });

  it("gives every lesson at least one production exercise", () => {
    for (const lesson of curriculumLessons) {
      const kinds = (lesson.exerciseIds ?? []).map((id) => definitionOf(id).kind);
      const hasProduction = kinds.some(
        (kind) => kind === "transformation" || kind === "constrained-construction",
      );
      expect(hasProduction, `${lesson.id} production`).toBe(true);
    }
  });

  it("uses all five engine kinds across the catalog", () => {
    const kinds = new Set(curriculumExercises.map((e) => definitionOf(e.id).kind));
    for (const kind of ALL_KINDS) {
      expect(kinds.has(kind), kind).toBe(true);
    }
  });
});

describe("exercise catalog shared-answer contract (spec §10.1, §10.2)", () => {
  it("never copies a Japanese answer string into a definition", () => {
    for (const entry of curriculumExercises) {
      expect(JAPANESE.test(JSON.stringify(entry.definition)), entry.id).toBe(false);
    }
  });

  it("targets only examples the owning lesson already shows", () => {
    const lessonById = new Map(curriculumLessons.map((l) => [l.id, l]));
    for (const [lessonId, ids] of exerciseIdsByLesson) {
      const lesson = lessonById.get(lessonId);
      const owned = new Set(lesson?.exampleIds ?? []);
      for (const id of ids) {
        const def = definitionOf(id);
        expect(owned.has(def.targetExampleId), `${id} target`).toBe(true);
        if (def.kind === "transformation") {
          expect(owned.has(def.promptExampleId), `${id} prompt`).toBe(true);
        }
      }
    }
  });

  it("only assesses explicit accepted variants (no implicit fuzz)", () => {
    for (const entry of curriculumExercises) {
      for (const variant of entry.definition?.acceptedVariants ?? []) {
        expect(variant.segmentRefs.length, `${entry.id}/${variant.id}`).toBeGreaterThan(0);
      }
    }
  });
});

describe("exercise transformation alignment (Slice C Task 2)", () => {
  it("changes only the predicate ending from prompt to target", () => {
    for (const entry of curriculumExercises) {
      const definition = definitionOf(entry.id);
      if (definition.kind !== "transformation") continue;

      const source = catalogs.examples.find(
        (example) => example.id === definition.promptExampleId,
      );
      const target = catalogs.examples.find(
        (example) => example.id === definition.targetExampleId,
      );
      expect(source, `${entry.id} prompt example`).toBeDefined();
      expect(target, `${entry.id} target example`).toBeDefined();
      if (!source || !target) continue;

      expect(source.segments, `${entry.id} segment count`).toHaveLength(
        target.segments.length,
      );
      const changedSegments = target.segments.flatMap((segment, index) => {
        const promptSegment = source.segments[index];
        return promptSegment.jp === segment.jp ? [] : [[promptSegment, segment]];
      });
      expect(changedSegments.length, `${entry.id} changed segment count`).toBeGreaterThan(0);
      expect(
        changedSegments.every(
          ([promptSegment, targetSegment]) =>
            promptSegment.kind === "ending" && targetSegment.kind === "ending",
        ),
        `${entry.id} changed segments`,
      ).toBe(true);

      const prompt = generatedPrompt(definition);
      expect(prompt.kind, entry.id).toBe("transformation");
      if (prompt.kind !== "transformation") continue;
      expect(
        evaluateExercise(prompt, {
          kind: "transformation",
          text: prompt.canonicalAnswer,
        }).status,
        entry.id,
      ).toBe("accepted");
    }
  });
});

describe("exercise distractor semantics", () => {
  it("keeps ending-bank semantic keys aligned to the resolved ending surface", () => {
    expect(
      Object.fromEntries(
        Object.entries(endingDistractorRefs).map(([key, reference]) => [
          key,
          resolveBankSurface(reference),
        ]),
      ),
    ).toEqual({
      desu: "です",
      masu: "ます",
      mashita: "ました",
      masen: "ません",
      mashou: "ましょう",
      tai: "たい",
      kudasai: "ください",
    });
  });

  it("keeps the shopping-2 request-ending distractors aligned to real single-segment endings", () => {
    const definition = definitionOf("shopping-2-ending-base");
    expect(definition.kind).toBe("choice");
    if (definition.kind !== "choice") return;

    expect(definition.distractorRefs.map((ref) => resolveSegmentSurface(definition, ref))).toEqual([
      "ます",
      "です",
    ]);

    const prompt = generatedPrompt(definition);
    expect(prompt.kind).toBe("choice");
    if (prompt.kind !== "choice") return;

    expect(prompt.options.map((option) => option.jp)).toEqual(["ください", "です", "ます"]);
    expect(new Set(prompt.options.map((option) => option.id)).size).toBe(
      prompt.options.length,
    );
    expect(new Set(prompt.options.map((option) => option.jp)).size).toBe(
      prompt.options.length,
    );
  });
});

describe("exercise catalog generation and evaluation (spec §10.3)", () => {
  it("generates a prompt for every definition", () => {
    for (const entry of curriculumExercises) {
      const result = generateExercise(definitionOf(entry.id), catalogs);
      expect(result.ok, `${entry.id}: ${result.ok ? "" : result.error.code}`).toBe(true);
    }
  });

  it("accepts every generated canonical answer", () => {
    for (const entry of curriculumExercises) {
      const prompt = generatedPrompt(definitionOf(entry.id));
      const evaluation = evaluateExercise(prompt, canonicalCandidate(prompt));
      expect(evaluation.status, entry.id).toBe("accepted");
    }
  });

  it("retries representative wrong answers of every kind", () => {
    const seenRetry = new Set<ExerciseKind>();
    for (const entry of curriculumExercises) {
      const prompt = generatedPrompt(definitionOf(entry.id));
      let wrong: ExerciseCandidate | undefined;
      if (prompt.kind === "tile-ordering") {
        if (prompt.correctTileIds.length >= 2) {
          const swapped = [
            prompt.correctTileIds[1],
            prompt.correctTileIds[0],
            ...prompt.correctTileIds.slice(2),
          ];
          const tilesById = new Map(prompt.tiles.map((t) => [t.id, t]));
          const rendered = (order: readonly string[]) =>
            order.map((id) => tilesById.get(id)?.jp ?? "").join("|");
          const acceptedRendered = new Set(
            [prompt.correctTileIds, ...prompt.acceptedTileOrders].map(rendered),
          );
          if (!acceptedRendered.has(rendered(swapped))) {
            wrong = { kind: "tile-ordering", tileIds: swapped };
          }
        }
      } else if (prompt.kind === "choice") {
        const distractor = prompt.options.find(
          (o) => !prompt.acceptedOptionIds.includes(o.id),
        );
        if (distractor) wrong = { kind: "choice", optionId: distractor.id };
      } else {
        const bogus = "ちがいます";
        const accepted = prompt.acceptedAnswers.includes(bogus);
        if (!accepted) wrong = { kind: prompt.kind, text: bogus };
      }
      if (wrong) {
        expect(evaluateExercise(prompt, wrong).status, entry.id).toBe("retry");
        seenRetry.add(prompt.kind);
      }
    }
    for (const kind of ALL_KINDS) {
      expect(seenRetry.has(kind), `retry ${kind}`).toBe(true);
    }
  });

  it("rejects structurally invalid input as invalid-input", () => {
    const seenInvalid = new Set<ExerciseKind>();
    for (const entry of curriculumExercises) {
      const prompt = generatedPrompt(definitionOf(entry.id));
      const empty: ExerciseCandidate =
        prompt.kind === "tile-ordering"
          ? { kind: "tile-ordering", tileIds: [] }
          : prompt.kind === "choice"
            ? { kind: "choice", optionId: "no-such-option" }
            : { kind: prompt.kind, text: "" };
      const result = evaluateExercise(prompt, empty);
      expect(result.status, entry.id).toBe("invalid-input");
      seenInvalid.add(prompt.kind);
    }
    for (const kind of ALL_KINDS) {
      expect(seenInvalid.has(kind), `invalid ${kind}`).toBe(true);
    }
  });
});

describe("exercise catalog order and coverage invariants (spec §6.4, §17.1)", () => {
  it("passes the release validator with exercise targets enforced", () => {
    const result = validateCurriculum(assembledCurriculum, {
      enforceReleaseTargets: true,
      enforceExerciseTargets: true,
    });
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("never assesses an exercise target before its lesson introduces it", () => {
    const introducedConcepts = new Set<string>();
    const introducedLexemes = new Set<string>();
    for (const lesson of orderedCurriculumLessons) {
      for (const id of lesson.introducedConceptIds) introducedConcepts.add(id);
      for (const id of lesson.introducedLexemeIds) introducedLexemes.add(id);
      for (const exerciseId of lesson.exerciseIds ?? []) {
        const def = definitionOf(exerciseId);
        for (const id of def.assessedConceptIds) {
          expect(introducedConcepts.has(id), `${exerciseId} concept ${id}`).toBe(true);
        }
        for (const id of def.assessedLexemeIds) {
          expect(introducedLexemes.has(id), `${exerciseId} lexeme ${id}`).toBe(true);
        }
      }
    }
  });

  it("keeps the exercise wrapper consistent with its runtime definition", () => {
    for (const entry of curriculumExercises) {
      const def = entry.definition;
      expect(def, entry.id).toBeDefined();
      expect(entry.id).toBe(def?.id);
      expect(entry.targetExampleId).toBe(def?.targetExampleId);
      expect([...entry.assessedConceptIds].sort()).toEqual(
        [...(def?.assessedConceptIds ?? [])].sort(),
      );
      expect([...entry.assessedLexemeIds].sort()).toEqual(
        [...(def?.assessedLexemeIds ?? [])].sort(),
      );
    }
  });
});

describe("exercise prompt copy parity (spec §9.1, §17.1)", () => {
  it("keeps IT and EN copy catalogs keyed identically", () => {
    expect(Object.keys(curriculumCopy.it).sort()).toEqual(
      Object.keys(curriculumCopy.en).sort(),
    );
  });

  it("resolves every prompt and intent copy id in both locales", () => {
    for (const entry of curriculumExercises) {
      const def = definitionOf(entry.id);
      for (const key of [def.promptCopyId]) {
        expect(curriculumCopy.it[key], `it ${key}`).toBeDefined();
        expect(curriculumCopy.en[key], `en ${key}`).toBeDefined();
      }
      if (def.kind === "constrained-construction") {
        expect(curriculumCopy.it[def.intentCopyId], `it ${def.intentCopyId}`).toBeDefined();
        expect(curriculumCopy.en[def.intentCopyId], `en ${def.intentCopyId}`).toBeDefined();
      }
    }
  });
});

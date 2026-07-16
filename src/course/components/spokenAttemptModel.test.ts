import { describe, expect, it } from "vitest";
import { courseModules } from "../data/course";
import { assembledExamples } from "../catalog/assembleCourse";
import { speechPromptByLessonId } from "../catalog/speechPrompts";
import { defaultTranscriptEvaluator } from "../speech/SpeechRecognitionContext";
import type { ResolvedSpeechPrompt } from "../speech/types";
import type { StaticExample } from "../data/types";
import {
  buildSpokenAttemptModel,
  getSpokenAttemptModel,
  type SpokenAttemptModelDeps,
} from "./spokenAttemptModel";

/**
 * The pure spoken-attempt model contract (Slice D plan Task 3; design spec §5.3,
 * §12.3). `getSpokenAttemptModel` resolves a lesson's existing speech prompt,
 * shared target example, ordered comparison/critical segments, derived
 * Japanese + romaji, and localized lesson/example copy into a complete model or
 * a structured error. It never duplicates a Japanese target string into copy.
 */

const allLessons = courseModules.flatMap((module) => module.lessons);

describe("getSpokenAttemptModel — every published lesson resolves", () => {
  it("covers all 40 lessons in both locales without error", () => {
    expect(allLessons.length).toBe(40);
    for (const lesson of allLessons) {
      for (const locale of ["it", "en"] as const) {
        const result = getSpokenAttemptModel(lesson.id, locale);
        expect(result.ok, `${lesson.id}/${locale}`).toBe(true);
      }
    }
  });

  it("resolves the lesson's existing speech prompt, target, and ordered segments", () => {
    for (const lesson of allLessons) {
      const result = getSpokenAttemptModel(lesson.id, "en");
      if (!result.ok) throw new Error(`unexpected error for ${lesson.id}`);
      const model = result.model;
      const prompt = speechPromptByLessonId.get(lesson.id);
      expect(prompt).toBeTruthy();

      expect(model.lessonId).toBe(lesson.id);
      expect(model.speechPromptId).toBe(prompt!.id);
      expect(model.targetExampleId).toBe(prompt!.targetExampleId);

      // Comparison segments are exposed in target order.
      expect(model.segments.map((segment) => segment.id)).toEqual([
        ...prompt!.comparisonSegmentIds,
      ]);

      // Critical flags mirror the prompt's declared critical subset exactly.
      const critical = new Set(prompt!.criticalSegmentIds);
      for (const segment of model.segments) {
        expect(segment.critical).toBe(critical.has(segment.id));
      }
    }
  });

  it("derives the Japanese target and romaji only from the shared example", () => {
    for (const lesson of allLessons) {
      const result = getSpokenAttemptModel(lesson.id, "en");
      if (!result.ok) throw new Error("error");
      const model = result.model;
      const example = assembledExamples[model.targetExampleId];
      expect(model.targetJp).toBe(example.jp);
      expect(model.targetRomaji).toBe(example.romaji);
      // Whole-sentence Japanese reconstructs from the ordered segments.
      expect(model.segments.map((segment) => segment.jp).join("")).toBe(
        model.targetJp,
      );
    }
  });

  it("exposes the exact readable target romaji for introductions-1 (romaji boundaries plan Task 4)", () => {
    const result = getSpokenAttemptModel("introductions-1", "en");
    if (!result.ok) throw new Error("error");
    expect(result.model.targetRomaji).toBe("watashi no namae wa yuki desu");
  });

  it("retains the complete AssembledToken metadata (boundaryBefore, source) each segment needs for the shared renderer", () => {
    const result = getSpokenAttemptModel("introductions-1", "en");
    if (!result.ok) throw new Error("error");
    for (const segment of result.model.segments) {
      expect(segment.token.id).toBe(segment.id);
      expect(segment.token.jp).toBe(segment.jp);
      expect(segment.token.romaji).toBe(segment.romaji);
      expect(["attach", "space"]).toContain(segment.token.boundaryBefore);
      expect(segment.token.source.referenceId.length).toBeGreaterThan(0);
    }
    // The sentence's first token is always attached (romaji boundaries plan §13.2).
    expect(result.model.segments[0]?.token.boundaryBefore).toBe("attach");
  });

  it("exposes the resolved prompt the recognizer evaluates against", () => {
    const result = getSpokenAttemptModel("introductions-1", "en");
    if (!result.ok) throw new Error("error");
    const prompt: ResolvedSpeechPrompt = result.model.prompt;
    // The canonical form is always an accepted comparable.
    expect(prompt.acceptedComparables).toContain(prompt.canonical.comparable);
    expect(prompt.segments.length).toBeGreaterThan(0);
  });

  it("returns localized lesson and example copy that differ by locale", () => {
    const en = getSpokenAttemptModel("introductions-1", "en");
    const itModel = getSpokenAttemptModel("introductions-1", "it");
    if (!en.ok || !itModel.ok) throw new Error("error");
    expect(en.model.lessonTitle.trim().length).toBeGreaterThan(0);
    expect(en.model.meaning.trim().length).toBeGreaterThan(0);
    expect(en.model.meaning).not.toBe(itModel.model.meaning);
    // Same shared Japanese target regardless of locale.
    expect(en.model.targetJp).toBe(itModel.model.targetJp);
  });
});

describe("getSpokenAttemptModel — never duplicates the Japanese target in copy", () => {
  it("keeps the Japanese target out of the localized meaning and title", () => {
    for (const lesson of allLessons) {
      for (const locale of ["it", "en"] as const) {
        const result = getSpokenAttemptModel(lesson.id, locale);
        if (!result.ok) throw new Error("error");
        const { targetJp, meaning, lessonTitle } = result.model;
        expect(meaning.includes(targetJp)).toBe(false);
        expect(lessonTitle.includes(targetJp)).toBe(false);
      }
    }
  });
});

describe("getSpokenAttemptModel — katakana segments keep their assisted reading", () => {
  it("carries the hiragana reading for a katakana loanword target (sounds-4 ミルク)", () => {
    const result = getSpokenAttemptModel("sounds-4", "en");
    if (!result.ok) throw new Error("error");
    const katakana = result.model.segments.find((segment) => segment.reading);
    expect(katakana).toBeTruthy();
    expect(katakana!.jp).toBe("ミルク");
    expect(katakana!.reading).toBe("みるく");
  });
});

describe("getSpokenAttemptModel — matched attempts yield coherent segment records", () => {
  it("recognizes every canonical segment when the exact target is spoken (all 40)", () => {
    for (const lesson of allLessons) {
      const result = getSpokenAttemptModel(lesson.id, "en");
      if (!result.ok) throw new Error("error");
      const model = result.model;
      const evaluation = defaultTranscriptEvaluator.evaluate(
        defaultTranscriptEvaluator.normalize(model.targetJp),
        model.prompt,
      );
      expect(evaluation.state).toBe("matched");
      // No contradictory "matched overall but a canonical segment unmatched".
      expect(evaluation.segmentMatches.every((match) => match.matched)).toBe(
        true,
      );
      expect(evaluation.segmentMatches.map((match) => match.segmentId)).toEqual(
        model.segments.map((segment) => segment.id),
      );
    }
  });
});

// ── Structured failures via the injectable core ───────────────────────────────

const fakeEntry = {
  id: "speech-x",
  targetExampleId: "x-say",
  acceptedTranscriptVariantExampleIds: [] as readonly string[],
  comparisonSegmentIds: ["p1"] as readonly string[],
  criticalSegmentIds: ["p1"] as readonly string[],
};

const fakeResolved: ResolvedSpeechPrompt = {
  id: "speech-x",
  targetExampleId: "x-say",
  canonical: { original: "みず", comparable: "みず" },
  acceptedComparables: ["みず"],
  segments: [{ id: "p1", comparable: "みず" }],
  criticalSegmentIds: ["p1"],
};

function testSource(referenceId: string) {
  return { domain: "test" as const, referenceId };
}

const fakeExample: StaticExample = {
  id: "x-say",
  jp: "みず",
  romaji: "mizu",
  segments: [
    {
      id: "p1",
      jp: "みず",
      romaji: "mizu",
      kind: "particle",
      tokenKind: "particle",
      boundaryBefore: "attach",
      source: testSource("x-say#p1"),
    },
  ],
};

function okDeps(): SpokenAttemptModelDeps {
  return {
    speechPrompt: () => fakeEntry,
    resolvePrompt: () => fakeResolved,
    targetExample: () => fakeExample,
    lessonTitle: () => "Water",
    exampleCopy: () => ({ translation: "Water" }),
  };
}

describe("buildSpokenAttemptModel — structured errors, never a partial success", () => {
  it("builds a complete model from valid dependencies", () => {
    const result = buildSpokenAttemptModel("x", okDeps());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.targetJp).toBe("みず");
    expect(result.model.segments[0].critical).toBe(true);
  });

  it("formats target romaji from segment metadata instead of concatenating segment strings", () => {
    const result = buildSpokenAttemptModel("x", {
      speechPrompt: () => ({
        ...fakeEntry,
        comparisonSegmentIds: ["w1", "w2"],
        criticalSegmentIds: ["w1", "w2"],
      }),
      resolvePrompt: () => ({
        ...fakeResolved,
        segments: [
          { id: "w1", comparable: "はじめまして" },
          { id: "w2", comparable: "よろしく" },
        ],
        criticalSegmentIds: ["w1", "w2"],
      }),
      targetExample: () => ({
        id: "x-say",
        jp: "はじめましてよろしく",
        romaji: "hajimemashite yoroshiku",
        segments: [
          {
            id: "w1",
            jp: "はじめまして",
            romaji: "hajimemashite",
            kind: "word",
            tokenKind: "lexical",
            boundaryBefore: "attach",
            source: testSource("x-say#w1"),
          },
          {
            id: "w2",
            jp: "よろしく",
            romaji: "yoroshiku",
            kind: "word",
            tokenKind: "lexical",
            boundaryBefore: "space",
            source: testSource("x-say#w2"),
          },
        ],
      }),
      lessonTitle: () => "Greeting",
      exampleCopy: () => ({ translation: "Nice to meet you" }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.targetRomaji).toBe("hajimemashite yoroshiku");
  });

  it("reports missing-speech-prompt when the lesson has no prompt", () => {
    const result = buildSpokenAttemptModel("x", {
      ...okDeps(),
      speechPrompt: () => undefined,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-speech-prompt");
    expect(result.error.lessonId).toBe("x");
  });

  it("reports unresolved-prompt when resolution throws", () => {
    const result = buildSpokenAttemptModel("x", {
      ...okDeps(),
      resolvePrompt: () => {
        throw new Error("boom");
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unresolved-prompt");
  });

  it("reports invalid-romaji-sequence (naming the offending segment) when a compared segment cannot form an assembled token", () => {
    // Distinct from a resolution failure (`unresolved-prompt`, reserved solely
    // for `resolvePrompt` throwing): the prompt resolved fine, but this
    // particular comparison segment cannot become a real AssembledToken. The
    // model must surface its own dedicated romaji-metadata error code, naming
    // exactly the offending `segment.id` — never the generic "the whole
    // prompt didn't resolve" code.
    const result = buildSpokenAttemptModel("x", {
      ...okDeps(),
      targetExample: () => ({
        id: "x-say",
        jp: "みず",
        romaji: "mizu",
        segments: [
          {
            id: "p1",
            jp: "みず",
            romaji: "mizu",
            kind: "word",
            tokenKind: "lexical",
            boundaryBefore: "attach",
            source: { domain: "test", referenceId: "" },
          },
        ],
      }),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("invalid-romaji-sequence");
    expect(result.error.referenceId).toBe("p1");
  });

  it("reports invalid-romaji-sequence (naming the deterministic offending token) when a well-formed token still fails formatRomaji's own validation (empty romaji)", () => {
    // Distinct from the case above: every field exampleSegmentToAssembledToken
    // itself requires is present (id/tokenKind/boundaryBefore/source.referenceId),
    // so a real AssembledToken IS formed — but its romaji is blank, which only
    // the shared formatRomaji validator rejects. This is a whole-sequence
    // formatting failure, not a resolution failure, so it must never surface
    // as `unresolved-prompt` either; it names the deterministic first
    // offending token id formatRomaji itself reports.
    const result = buildSpokenAttemptModel("x", {
      ...okDeps(),
      targetExample: () => ({
        id: "x-say",
        jp: "みず",
        romaji: "mizu",
        segments: [
          {
            id: "p1",
            jp: "みず",
            romaji: "",
            kind: "word",
            tokenKind: "lexical",
            boundaryBefore: "attach",
            source: testSource("x-say#p1"),
          },
        ],
      }),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("invalid-romaji-sequence");
    expect(result.error.referenceId).toBe("p1");
  });

  it("reports missing-target-example when the runtime example is absent", () => {
    const result = buildSpokenAttemptModel("x", {
      ...okDeps(),
      targetExample: () => undefined,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-target-example");
  });

  it("reports missing-comparison-segment when a compared segment is absent", () => {
    const result = buildSpokenAttemptModel("x", {
      ...okDeps(),
      targetExample: () => ({
        id: "x-say",
        jp: "みず",
        romaji: "mizu",
        segments: [
          {
            id: "other",
            jp: "みず",
            romaji: "mizu",
            kind: "word",
            tokenKind: "lexical",
            boundaryBefore: "attach",
            source: testSource("x-say#other"),
          },
        ],
      }),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-comparison-segment");
  });

  it("reports missing-lesson-copy when the localized title is absent", () => {
    const result = buildSpokenAttemptModel("x", {
      ...okDeps(),
      lessonTitle: () => undefined,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-lesson-copy");
  });

  it("reports missing-meaning-copy when the localized translation is absent", () => {
    const result = buildSpokenAttemptModel("x", {
      ...okDeps(),
      exampleCopy: () => undefined,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("missing-meaning-copy");
  });
});

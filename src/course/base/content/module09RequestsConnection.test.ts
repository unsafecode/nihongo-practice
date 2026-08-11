import { describe, expect, it } from "vitest";
import { BASE_CONCEPTS } from "../catalog/concepts";
import {
  BASE_LEXICON,
  BASE_TASK12_LEXEME_RECURRENCE_BY_ID,
  BASE_TASK12_LEXEME_RECURRENCE_PLANS,
} from "../catalog/lexicon";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import { realizeTeConstruction } from "../forms/verbForms";
import { BASE_SENTENCE_FOUNDATIONS_MODULE } from "./module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_MODULE } from "./module03TopicQuestions";
import {
  BASE_POLITE_VERBS_MODULE,
  buildTask11Lesson,
  task11Target,
  task11VerbForm,
} from "./module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_MODULE } from "./module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_MODULE } from "./module06TimeMovement";
import { BASE_COPULA_ADJECTIVES_MODULE } from "./module07CopulaAdjectives";
import {
  BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID,
  BASE_EXISTENCE_LOCATION_MODULE,
  validateBaseExistenceLocationModule,
} from "./module08ExistenceLocation";
import {
  BASE_REQUESTS_CONNECTION_MODULE,
  BASE_TE_ALLOMORPH_EVIDENCE,
  validateBaseRequestsConnectionModule,
} from "./module09RequestsConnection";

function japanese(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map(({ jp }) => jp).join("");
}

const EARLIER_TASK11_MODULES = [
  BASE_SENTENCE_FOUNDATIONS_MODULE,
  BASE_TOPIC_QUESTIONS_MODULE,
  BASE_POLITE_VERBS_MODULE,
  BASE_ARGUMENT_PARTICLES_MODULE,
  BASE_TIME_MOVEMENT_MODULE,
  BASE_COPULA_ADJECTIVES_MODULE,
  BASE_EXISTENCE_LOCATION_MODULE,
] as const;

const TASK12_MODULES = [
  BASE_COPULA_ADJECTIVES_MODULE,
  BASE_EXISTENCE_LOCATION_MODULE,
  BASE_REQUESTS_CONNECTION_MODULE,
] as const;

function normalizedCorpusSurface(target: {
  readonly tokens: readonly { readonly jp: string }[];
}): string {
  return japanese(target.tokens)
    .normalize("NFKC")
    .replace(/[\s。、，,.!?！？]/gu, "")
    .replace(/^(?:はい|いいえ)/u, "");
}

describe("Task 12 bounded te ownership", () => {
  it("publishes exactly the four bounded module 09 construction IDs", () => {
    const ownedIds = BASE_CONCEPTS.filter(
      ({ firstTeachLessonId, kind }) =>
        kind === "form" &&
        firstTeachLessonId.startsWith("requests-connection-"),
    ).map(({ id }) => id);

    expect(ownedIds).toEqual([
      "base-form-te",
      "base-construction-te-kudasai",
      "base-construction-sequential-te",
      "base-construction-te-imasu",
    ]);
    expect(ownedIds).not.toEqual(
      expect.arrayContaining([
        "permission-te-mo-ii",
        "prohibition-te-wa-ikenai",
        "conditional-tara",
      ]),
    );
  });

  it.each([
    ["verb-kau", "かって"],
    ["verb-matsu", "まって"],
    ["verb-kaeru", "かえって"],
    ["verb-nomu", "のんで"],
    ["verb-asobu", "あそんで"],
    ["verb-shinu", "しんで"],
    ["verb-kaku", "かいて"],
    ["verb-oyogu", "およいで"],
    ["verb-hanasu", "はなして"],
    ["verb-taberu", "たべて"],
    ["verb-suru", "して"],
    ["verb-kuru", "きて"],
    ["verb-iku", "いって"],
  ] as const)("generates canonical te form for %s", (lemmaId, expected) => {
    const realized = realizeTeConstruction(lemmaId, "te");
    expect(realized.ok && japanese(realized.value)).toBe(expected);
  });

  it("publishes generated te constructions through lesson targets", () => {
    const target = task11Target(
      [task11VerbForm("verb-iku", "te" as never)],
      {
        conceptIds: [],
        patternCellIds: ["te-exception"],
        semanticRoleIds: [],
        interpretationTags: ["metalinguistic"],
        predicateSenseId: "iku",
        predicateLexemeId: "verb-iku",
        predicateAspect: "dynamic",
      },
    );
    const built = buildTask11Lesson({
      lessonId: "requests-connection-1",
      contract: "system",
      prerequisiteLessonIds: ["existence-location-4"],
      newLexemeIds: [],
      reviewLexemeIds: ["verb-iku"],
      introducedConceptIds: ["base-form-te"],
      reviewedConceptIds: [],
      patternCellIds: ["te-exception"],
      referenceSnapshotIds: [],
      examples: [
        {
          target,
          frame: "test",
          utteranceKind: "complete-clause",
          en: "Go-form.",
          it: "Forma di andare.",
          purposeEn: "Tests the stored exception.",
          purposeIt: "Verifica l'eccezione registrata.",
          semanticTag: "metalinguistic",
        },
      ],
      activities: [],
      dialogue: null,
    });

    expect(japanese(built.lesson.examples[0].tokens)).toBe("いって");
    expect(built.lesson.examples[0].formIds).toEqual(["base-form-te"]);
  });

  it("allocates system and content lexeme budgets to module 09", () => {
    expect(
      [1, 2, 3, 4].map(
        (order) =>
          BASE_LEXICON.filter(
            ({ firstTeachLessonId }) =>
              firstTeachLessonId === `requests-connection-${order}`,
          ).length,
      ),
    ).toEqual([5, 10, 4, 3]);
  });

  it("publishes the required lesson classification and bounded dialogues", () => {
    expect(
      BASE_REQUESTS_CONNECTION_MODULE.lessons.map(
        ({ content }) => content.contract,
      ),
    ).toEqual(["system", "content", "system", "system"]);
    expect(BASE_REQUESTS_CONNECTION_MODULE.lessons[1].dialogue?.turns.length).toBeGreaterThanOrEqual(4);
    expect(BASE_REQUESTS_CONNECTION_MODULE.lessons[1].dialogue?.turns.length).toBeLessThanOrEqual(8);
    expect(BASE_REQUESTS_CONNECTION_MODULE.lessons[3].dialogue?.turns.length).toBeGreaterThanOrEqual(4);
    expect(BASE_REQUESTS_CONNECTION_MODULE.lessons[3].dialogue?.turns.length).toBeLessThanOrEqual(8);
    for (const lesson of BASE_REQUESTS_CONNECTION_MODULE.lessons) {
      expect(lesson.content.activities.filter(({ mode }) => mode === "non-spoken")).toHaveLength(8);
      expect(lesson.content.activities.filter(({ mode }) => mode === "audio")).toHaveLength(2);
    }
    expect(validateBaseRequestsConnectionModule(BASE_REQUESTS_CONNECTION_MODULE)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("publishes explicit class, allomorph, and いく-exception evidence", () => {
    expect(
      BASE_TE_ALLOMORPH_EVIDENCE.map(
        ({ endingFamily, lemmaId, surface, exception }) => [
          endingFamily,
          lemmaId,
          surface,
          exception,
        ],
      ),
    ).toEqual([
      ["う/つ/る", "verb-kau", "かって", false],
      ["む/ぶ/ぬ", "verb-nomu", "のんで", false],
      ["く", "verb-kaku", "かいて", false],
      ["ぐ", "verb-oyogu", "およいで", false],
      ["す", "verb-hanasu", "はなして", false],
      ["ichidan", "verb-taberu", "たべて", false],
      ["する", "verb-suru", "して", false],
      ["くる", "verb-kuru", "きて", false],
      ["いく-exception", "verb-iku", "いって", true],
    ]);
  });

  it("limits ongoing-now to requests-connection-4 and tags result states separately", () => {
    const dynamicTargets = BASE_REQUESTS_CONNECTION_MODULE.lessons.flatMap(
      (lesson) =>
        [
          ...lesson.examples,
          ...(lesson.dialogue?.turns ?? []),
          ...lesson.activityDesigns.flatMap((activity) => [
            ...activity.optionTargets,
            activity.acceptedAnswerTarget,
          ]),
        ].map((target) => ({ lessonId: lesson.content.lessonId, target })),
    );
    expect(
      dynamicTargets
        .filter(({ target }) => target.interpretationTags.includes("ongoing-now"))
        .every(({ lessonId }) => lessonId === "requests-connection-4"),
    ).toBe(true);
    expect(
      dynamicTargets.some(({ target }) =>
        target.interpretationTags.includes("resulting-state"),
      ),
    ).toBe(true);
  });

  it("rejects a cloned module that relabels an ongoing lexical action as a resulting state", () => {
    const mutated = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    const target = mutated.lessons[3].examples[0] as unknown as {
      interpretationTags: string[];
    };
    target.interpretationTags = ["resulting-state"];

    expect(validateBaseRequestsConnectionModule(mutated).ok).toBe(false);
  });

  it("rejects an overgeneralized いきて target despite canonical-looking provenance", () => {
    const mutated = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    const target = mutated.lessons[0].examples.find(
      ({ predicateLexemeId }) => predicateLexemeId === "verb-iku",
    )!;
    const tokens = target.tokens as unknown as {
      jp: string;
      romaji: string;
    }[];
    const stem = tokens.find(({ jp }) => jp === "い")!;
    const ending = tokens.find(({ jp }) => jp === "って")!;
    stem.jp = "いき";
    stem.romaji = "iki";
    ending.jp = "て";
    ending.romaji = "te";

    expect(validateBaseRequestsConnectionModule(mutated).ok).toBe(false);
  });

  it("publishes a later recurrence plan for every Task 12 lexeme", () => {
    const plans = BASE_TASK12_LEXEME_RECURRENCE_PLANS;
    const task12LexemeIds = BASE_LEXICON.filter(({ firstTeachLessonId }) =>
      /^(?:copula-adjectives|existence-location|requests-connection)-[1-4]$/u.test(
        firstTeachLessonId,
      ),
    ).map(({ id }) => id);

    expect(plans.map(({ lexemeId }) => lexemeId).sort()).toEqual(
      task12LexemeIds.sort(),
    );
    for (const plan of plans) {
      expect(
        plan.plannedLessonIds.length +
          plan.plannedSynthesisLessonIds.length,
      ).toBeGreaterThan(0);
      expect(plan.plannedSynthesisLessonIds).toEqual(["base-synthesis-3"]);
      expect(BASE_TASK12_LEXEME_RECURRENCE_BY_ID.get(plan.lexemeId)).toBe(
        plan,
      );
    }
  });

  it("keeps bounded te IDs out of earlier lessons and excluded forms out of Task 12", () => {
    const boundedIds = [
      "base-form-te",
      "base-construction-te-kudasai",
      "base-construction-sequential-te",
      "base-construction-te-imasu",
    ];
    for (const module of EARLIER_TASK11_MODULES) {
      for (const lesson of module.lessons) {
        for (const target of [
          ...lesson.examples,
          ...(lesson.dialogue?.turns ?? []),
          ...lesson.activityDesigns.flatMap((activity) => [
            activity.promptTarget,
            activity.acceptedAnswerTarget,
            ...activity.optionTargets,
          ]),
        ]) {
          expect(target.formIds).not.toEqual(
            expect.arrayContaining(boundedIds),
          );
        }
      }
    }
    const visibleTask12 = JSON.stringify(TASK12_MODULES);
    for (const excluded of [
      "permission-te-mo-ii",
      "prohibition-te-wa-ikenai",
      "conditional-tara",
      "pitch-accent",
    ]) {
      expect(visibleTask12).not.toContain(excluded);
    }
    expect(visibleTask12).not.toMatch(/てもいい|てはいけない/u);
    const explanatorySequence = TASK12_MODULES.some((module) =>
      module.lessons.some((lesson) =>
        [
          ...lesson.examples,
          ...(lesson.dialogue?.turns ?? []),
          ...lesson.activityDesigns.flatMap((activity) => [
            activity.promptTarget,
            activity.acceptedAnswerTarget,
            ...activity.optionTargets,
          ]),
        ].some(({ tokens }) =>
          tokens.some(
            ({ jp }, index) =>
              (jp === "の" || jp === "ん") &&
              tokens[index + 1]?.jp === "です",
          ),
        ),
      ),
    );
    expect(explanatorySequence).toBe(false);
  });

  it("keeps Task 12 accepted practice distinct from demonstrations, prompts, and itself", () => {
    const demonstrations = new Set<string>();
    const prompts = new Set<string>();
    for (const module of [...EARLIER_TASK11_MODULES, BASE_REQUESTS_CONNECTION_MODULE]) {
      for (const lesson of module.lessons) {
        for (const target of [
          ...lesson.examples,
          ...(lesson.dialogue?.turns ?? []),
        ]) {
          demonstrations.add(normalizedCorpusSurface(target));
        }
        for (const activity of lesson.activityDesigns) {
          prompts.add(normalizedCorpusSurface(activity.promptTarget));
        }
      }
    }
    const seenAccepted = new Set<string>();
    const collisions: string[] = [];
    for (const module of TASK12_MODULES) {
      for (const lesson of module.lessons) {
        for (const activity of lesson.activityDesigns) {
          const surface = normalizedCorpusSurface(
            activity.acceptedAnswerTarget,
          );
          if (
            demonstrations.has(surface) ||
            prompts.has(surface) ||
            seenAccepted.has(surface)
          ) {
            collisions.push(`${activity.id}:${surface}`);
          }
          seenAccepted.add(surface);
        }
      }
    }
    expect(collisions).toEqual([]);
  });

  it("publishes exact EN/IT copy parity and one listening plus one spoken activity per lesson", () => {
    for (const module of TASK12_MODULES) {
      for (const lesson of module.lessons) {
        const prefix = `${lesson.content.lessonId}-`;
        const enKeys = Object.keys(baseNavigationCopyEn.content)
          .filter((key) => key.startsWith(prefix))
          .sort();
        const itKeys = Object.keys(baseNavigationCopyIt.content)
          .filter((key) => key.startsWith(prefix))
          .sort();
        expect(itKeys).toEqual(enKeys);
        expect(enKeys.length).toBeGreaterThan(0);
        expect(
          lesson.content.activities.filter(
            ({ operation }) => operation === "identify-audio",
          ),
        ).toHaveLength(1);
        expect(
          lesson.content.activities.filter(
            ({ mode, operation }) =>
              mode === "audio" && operation !== "identify-audio",
          ),
        ).toHaveLength(1);
      }
    }
  });

  it("fails closed on explicit undefined and keeps Task 12 evidence truly immutable", () => {
    const invalidExistence = {
      ...structuredClone(BASE_EXISTENCE_LOCATION_MODULE),
      lessons: undefined,
    };
    const invalidRequests = {
      ...structuredClone(BASE_REQUESTS_CONNECTION_MODULE),
      lessons: undefined,
    };
    expect(validateBaseExistenceLocationModule(invalidExistence).ok).toBe(
      false,
    );
    expect(validateBaseRequestsConnectionModule(invalidRequests).ok).toBe(
      false,
    );
    expect("set" in BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID).toBe(false);
    expect("set" in BASE_TASK12_LEXEME_RECURRENCE_BY_ID).toBe(false);
    expect(Object.isFrozen(BASE_TASK12_LEXEME_RECURRENCE_PLANS)).toBe(true);
    expect(
      BASE_TASK12_LEXEME_RECURRENCE_PLANS.every((plan) =>
        Object.isFrozen(plan),
      ),
    ).toBe(true);
  });

  it("uses only natural licensed objects with てつだう", () => {
    const targets = BASE_REQUESTS_CONNECTION_MODULE.lessons.flatMap((lesson) => [
      ...lesson.examples,
      ...(lesson.dialogue?.turns ?? []),
      ...lesson.activityDesigns.map(({ acceptedAnswerTarget }) =>
        acceptedAnswerTarget,
      ),
    ]);
    for (const target of targets.filter(
      ({ predicateLexemeId }) => predicateLexemeId === "verb-tetsudau",
    )) {
      const theme = target.particleBindings?.find(
        ({ role }) => role === "theme",
      );
      expect(theme?.attachmentLexemeId).toBe("noun-shigoto");
    }
  });

  it("separates multiple dictionary verbs in sequential prompts visibly", () => {
    const lesson = BASE_REQUESTS_CONNECTION_MODULE.lessons[2];
    for (const { promptTarget } of lesson.activityDesigns) {
      const verbTokenIndices = promptTarget.tokens.flatMap((token, index) =>
        token.source.referenceId.startsWith("verb-") ? [index] : [],
      );
      if (verbTokenIndices.length < 2) continue;
      const first = verbTokenIndices[0];
      const last = verbTokenIndices.at(-1)!;
      expect(
        promptTarget.tokens
          .slice(first + 1, last)
          .some(({ kind }) => kind === "punctuation"),
      ).toBe(true);
    }
  });

  it("uses task-relevant source cues instead of an unrelated today card for listening", () => {
    for (const lesson of BASE_REQUESTS_CONNECTION_MODULE.lessons) {
      const listening = lesson.activityDesigns.find(
        ({ category }) => category === "listening",
      )!;
      expect(
        listening.promptTarget.tokens.some(
          ({ source }) => source.referenceId === "noun-kyou",
        ),
      ).toBe(false);
    }
  });

  it("describes people, not schedules, as carrying out sequential actions", () => {
    const lesson = BASE_REQUESTS_CONNECTION_MODULE.lessons[2];
    const firstInstructionId =
      lesson.content.activities[0].instructionCopyId;
    const lunchInstructionId =
      lesson.content.activities[6].instructionCopyId;
    const secondRetryId =
      lesson.content.activities[1].retryFeedbackCopyId;

    expect(baseNavigationCopyEn.content[firstInstructionId]).toMatch(
      /schedule says/iu,
    );
    expect(baseNavigationCopyIt.content[firstInstructionId]).toMatch(
      /programma dice/iu,
    );
    expect(baseNavigationCopyEn.content[lunchInstructionId]).toMatch(
      /at lunch/iu,
    );
    expect(baseNavigationCopyIt.content[lunchInstructionId]).toMatch(
      /a pranzo/iu,
    );
    expect(baseNavigationCopyEn.content[secondRetryId]).toMatch(/schedule/iu);
    expect(baseNavigationCopyIt.content[secondRetryId]).toMatch(/programma/iu);
  });

  it("uses a natural declarative offer before accepting help", () => {
    const lesson = BASE_REQUESTS_CONNECTION_MODULE.lessons[1];
    const offer = lesson.dialogue!.turns[4];
    const activityPrompt = lesson.activityDesigns[0].promptTarget;
    const translationId = `${lesson.dialogue!.id}-turn-5-translation`;

    expect(japanese(offer.tokens)).toBe("しごとをてつだいます");
    expect(japanese(activityPrompt.tokens)).toBe("しごとをてつだいます");
    expect(offer.semanticRoleIds).not.toContain("question");
    expect(baseNavigationCopyEn.content[translationId]).toMatch(
      /I'll help/iu,
    );
  });

  it("orders listening form cards from source to generated result", () => {
    const listening = BASE_REQUESTS_CONNECTION_MODULE.lessons[0].activityDesigns.find(
      ({ category }) => category === "listening",
    )!;

    for (const { tokens } of listening.optionTargets) {
      expect(tokens[0].id).toMatch(/-dictionary$/u);
      expect(
        tokens.slice(1).some(
          ({ source }) => source.referenceId === "te",
        ),
      ).toBe(true);
    }
  });
});

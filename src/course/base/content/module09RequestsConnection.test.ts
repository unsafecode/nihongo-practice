import { describe, expect, it } from "vitest";
import { BASE_CONCEPTS } from "../catalog/concepts";
import {
  BASE_LEXICON,
  BASE_LEXEME_BY_ID,
  BASE_TASK12_LEXEME_RECURRENCE_BY_ID,
  BASE_TASK12_LEXEME_RECURRENCE_PLANS,
} from "../catalog/lexicon";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import { realizeTeConstruction } from "../forms/verbForms";
import {
  strictTask11ModuleSnapshot,
  validateTask11CorpusDistinctness,
} from "../validation/moduleSnapshots";
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
import * as module09Exports from "./module09RequestsConnection";

function japanese(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map(({ jp }) => jp).join("");
}

type MutableModuleSnapshot = {
  lessons: Array<{
    activityDesigns: Array<Record<string, unknown>>;
  }>;
};

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

  it("anchors the engine to one immutable authored te-allomorph rule table", () => {
    const rules = (
      module09Exports as unknown as {
        readonly BASE_TE_ALLOMORPH_RULES?: readonly unknown[];
      }
    ).BASE_TE_ALLOMORPH_RULES;

    expect(rules).toEqual([
      {
        endingFamily: "う/つ/る",
        sourceEndings: ["う", "つ", "る"],
        replacement: "って",
        exceptionLemmaId: null,
      },
      {
        endingFamily: "む/ぶ/ぬ",
        sourceEndings: ["む", "ぶ", "ぬ"],
        replacement: "んで",
        exceptionLemmaId: null,
      },
      {
        endingFamily: "く",
        sourceEndings: ["く"],
        replacement: "いて",
        exceptionLemmaId: null,
      },
      {
        endingFamily: "ぐ",
        sourceEndings: ["ぐ"],
        replacement: "いで",
        exceptionLemmaId: null,
      },
      {
        endingFamily: "す",
        sourceEndings: ["す"],
        replacement: "して",
        exceptionLemmaId: null,
      },
      {
        endingFamily: "ichidan",
        sourceEndings: ["る"],
        replacement: "て",
        exceptionLemmaId: null,
      },
      {
        endingFamily: "する",
        sourceEndings: ["する"],
        replacement: "して",
        exceptionLemmaId: null,
      },
      {
        endingFamily: "くる",
        sourceEndings: ["くる"],
        replacement: "きて",
        exceptionLemmaId: null,
      },
      {
        endingFamily: "いく-exception",
        sourceEndings: ["いく"],
        replacement: "いって",
        exceptionLemmaId: "verb-iku",
      },
    ]);
    expect(Object.isFrozen(rules)).toBe(true);
    for (const rule of rules ?? []) {
      expect(Object.isFrozen(rule)).toBe(true);
      expect(
        Object.isFrozen(
          (rule as { readonly sourceEndings: readonly string[] }).sourceEndings,
        ),
      ).toBe(true);
    }
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
    ).toEqual([5, 12, 4, 5]);
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

  it("makes the offer-response activity determinate rather than rejecting a natural apology", () => {
    const lesson = BASE_REQUESTS_CONNECTION_MODULE.lessons[1];
    const activity = lesson.activityDesigns[0];
    const rejected =
      activity.optionTargets[
        activity.correctOptionIndex === 0 ? 1 : 0
      ];

    expect(japanese(activity.acceptedAnswerTarget.tokens)).toBe(
      "おねがいします",
    );
    expect(japanese(rejected.tokens)).toBe("いいえ");
    expect(
      baseNavigationCopyEn.content[
        lesson.content.activities[0].instructionCopyId
      ],
    ).toMatch(/want.*help|accept.*offer/iu);
    expect(
      baseNavigationCopyIt.content[
        lesson.content.activities[0].instructionCopyId
      ],
    ).toMatch(/vuoi.*aiuto|accetta.*offerta/iu);
  });

  it("uses one coherent alternating office exchange with natural responses", () => {
    const lesson = BASE_REQUESTS_CONNECTION_MODULE.lessons[1];
    const dialogue = lesson.dialogue!;

    expect(dialogue.turns.map(({ speakerId }) => speakerId)).toEqual([
      "learner",
      "partner",
      "learner",
      "partner",
    ]);
    expect(dialogue.turns.map(({ tokens }) => japanese(tokens))).toEqual([
      "すみません、しょるいをみせてください",
      "はい、どうぞ",
      "てがみをみせてください",
      "はい、わかりました",
    ]);
    expect(lesson.content.newLexemeIds).toEqual(
      expect.arrayContaining(["expression-douzo", "expression-wakarimashita"]),
    );
  });

  it("tests the くる te form with a grounded same-lemma canonical contrast", () => {
    const lesson = BASE_REQUESTS_CONNECTION_MODULE.lessons[0];
    const activity = lesson.activityDesigns[7];

    expect(activity.optionTargets.map(({ tokens }) => japanese(tokens))).toEqual([
      "えきにきます",
      "えきにきて",
    ]);
    expect(
      activity.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
    ).toEqual(["verb-kuru", "verb-kuru"]);
    for (const option of activity.optionTargets) {
      expect(option.particleBindings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: "goal",
            attachmentLexemeId: "noun-eki",
          }),
        ]),
      );
    }
  });

  it("uniquely cues the hidden softened teacher-call request in both locales", () => {
    const lesson = BASE_REQUESTS_CONNECTION_MODULE.lessons[1];
    const index = lesson.content.activities.findIndex(
      ({ operation }) => operation === "produce-spoken",
    );
    const activity = lesson.content.activities[index];
    const target = lesson.activityDesigns[index].acceptedAnswerTarget;
    const en = baseNavigationCopyEn.content[activity.instructionCopyId];
    const it = baseNavigationCopyIt.content[activity.instructionCopyId];

    expect(en).toMatch(/attention.*call.*teacher|call.*teacher.*attention/iu);
    expect(it).toMatch(/attenzione.*chiama.*insegnante|chiama.*insegnante.*attenzione/iu);
    expect(en.normalize("NFKC")).not.toContain(japanese(target.tokens));
    expect(it.normalize("NFKC")).not.toContain(japanese(target.tokens));
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

  it("anchors every te-imasu example in a Japanese situation that determines its reading", () => {
    const examples = BASE_REQUESTS_CONNECTION_MODULE.lessons[3].examples;

    expect(examples.map(({ tokens }) => japanese(tokens))).toEqual([
      "わたしはいまごはんをたべています",
      "たなかさんはいまほんをよんでいます",
      "やまださんはいまてがみをかいています",
      "すずきさんはいまでんわしています",
      "たなかさんはいまおよいでいます",
      "やまださんはいまべんきょうしています",
      "すずきさんはいまはたらいています",
      "わたしはやまださんをしっています",
      "やまださんはふくをきています",
      "すずきさんはいすにすわっています",
      "たなかさんはいまえきでまっています",
      "すずきさんはいまざっしをみています",
    ]);
    expect(
      new Set(examples.map(({ tokens }) => japanese(tokens))).size,
    ).toBe(examples.length);
    for (const example of examples) {
      expect(example.semanticRoleIds).toContain("topic");
      if (example.interpretationTags.includes("ongoing-now")) {
        expect(example.lexemeIds).toContain("noun-ima");
      }
    }
  });

  it("makes the te-imasu listening pair full same-verb ongoing clauses", () => {
    const listening =
      BASE_REQUESTS_CONNECTION_MODULE.lessons[3].activityDesigns.find(
        ({ category }) => category === "listening",
      )!;
    const surfaces = listening.optionTargets.map(({ tokens }) =>
      japanese(tokens),
    );

    expect(
      listening.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
    ).toEqual(["verb-miru", "verb-miru"]);
    expect(surfaces).toEqual([
      "すずきさんはいまほんをみています",
      "すずきさんはいましょるいをみています",
    ]);
    for (const target of listening.optionTargets) {
      expect(target.semanticRoleIds).toEqual(["topic", "time", "theme"]);
      expect(target.interpretationTags).toContain("ongoing-now");
    }
  });

  it("publishes canonical event classes and state anchors for te-imasu", () => {
    expect(BASE_LEXEME_BY_ID.get("verb-taberu")).toMatchObject({
      eventClass: "activity",
    });
    expect(BASE_LEXEME_BY_ID.get("verb-suwaru")).toMatchObject({
      eventClass: "change-of-state",
      teImasuAnchor: { semanticRole: "goal", lexemeIds: ["noun-isu"] },
    });
    expect(BASE_LEXEME_BY_ID.get("verb-kiru")).toMatchObject({
      eventClass: "change-of-state",
      teImasuAnchor: { semanticRole: "theme", lexemeIds: ["noun-fuku"] },
    });
    expect(BASE_LEXEME_BY_ID.get("verb-shiru")).toMatchObject({
      eventClass: "stative",
      teImasuAnchor: { semanticRole: "theme" },
    });
  });

  it.each(["verb-shiru", "verb-suwaru"] as const)(
    "rejects relabeling %s current state as ongoing",
    (lemmaId) => {
      const mutated = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
      const target = mutated.lessons[3].examples.find(
        ({ predicateLexemeId }) => predicateLexemeId === lemmaId,
      ) as unknown as {
        interpretationTags: string[];
        patternCellIds: string[];
      };
      target.interpretationTags = ["ongoing-now"];
      target.patternCellIds = ["te-imasu-ongoing-action"];

      expect(validateBaseRequestsConnectionModule(mutated).ok).toBe(false);
    },
  );

  it("rejects te-imasu aspect and cell metadata that contradict the lexical event class", () => {
    const wrongAspect = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    const aspectTarget = wrongAspect.lessons[3].examples.find(
      ({ predicateLexemeId }) => predicateLexemeId === "verb-suwaru",
    ) as unknown as { predicateAspect: string };
    aspectTarget.predicateAspect = "dynamic";

    const wrongCell = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    const cellTarget = wrongCell.lessons[3].examples.find(
      ({ predicateLexemeId }) => predicateLexemeId === "verb-shiru",
    ) as unknown as { patternCellIds: string[] };
    cellTarget.patternCellIds = ["te-imasu-ongoing-action"];

    expect(validateBaseRequestsConnectionModule(wrongAspect).ok).toBe(false);
    expect(validateBaseRequestsConnectionModule(wrongCell).ok).toBe(false);
  });

  it("disambiguates wearing with an explicit clothing theme and same-lemma contrast", () => {
    const lesson = BASE_REQUESTS_CONNECTION_MODULE.lessons[3];
    const wearingExample = lesson.examples.find(
      ({ predicateLexemeId }) => predicateLexemeId === "verb-kiru",
    )!;
    const activity = lesson.activityDesigns[6];

    expect(wearingExample.particleBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "theme",
          attachmentLexemeId: "noun-fuku",
        }),
      ]),
    );
    expect(
      activity.optionTargets.map(({ predicateLexemeId }) => predicateLexemeId),
    ).toEqual(["verb-kiru", "verb-kiru"]);
    expect(activity.optionTargets.map(({ tokens }) => japanese(tokens))).toEqual([
      "すずきさんはふくをきています",
      "すずきさんはふくをきます",
    ]);
  });

  it("rejects a cloned module that relabels an ongoing lexical action as a resulting state", () => {
    const mutated = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    const target = mutated.lessons[3].examples[0] as unknown as {
      interpretationTags: string[];
    };
    target.interpretationTags = ["resulting-state"];

    expect(validateBaseRequestsConnectionModule(mutated).ok).toBe(false);
  });

  it.each([
    ["spoken answer", "spoken"],
    ["example", "example"],
  ] as const)("rejects trailing lexical junk on an RC4 %s", (_, source) => {
    const mutated = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    const target =
      source === "spoken"
        ? mutated.lessons[3].activityDesigns[9].acceptedAnswerTarget
        : mutated.lessons[3].examples[0];
    const mutable = target as unknown as {
      tokens: Array<
        (typeof BASE_REQUESTS_CONNECTION_MODULE.lessons)[number]["examples"][number]["tokens"][number]
      >;
    };
    const magazineToken = mutated.lessons[3].examples
      .flatMap(({ tokens }) => tokens)
      .find(({ source: tokenSource }) => tokenSource.referenceId === "noun-zasshi")!;
    mutable.tokens.push(structuredClone(magazineToken));

    expect(validateBaseRequestsConnectionModule(mutated).ok).toBe(false);
  });

  it("rejects an unauthorized particle after a generated te construction", () => {
    const mutated = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    const target = mutated.lessons[3].examples[0] as unknown as {
      tokens: Array<
        (typeof BASE_REQUESTS_CONNECTION_MODULE.lessons)[number]["examples"][number]["tokens"][number]
      >;
    };
    const topicParticle = target.tokens.find(
      ({ source }) => source.referenceId === "topic-wa",
    )!;
    target.tokens.push(structuredClone(topicParticle));

    expect(validateBaseRequestsConnectionModule(mutated).ok).toBe(false);
  });

  it("uses canonical equality as the final defense for context drift", () => {
    const mutated = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    const context = mutated.lessons[0].activityDesigns[0]
      .contextTarget as unknown as { id: string };
    context.id = `${context.id}-forged`;

    expect(validateBaseRequestsConnectionModule(mutated)).toEqual({
      ok: false,
      errors: ["invalid-module-shape"],
    });
  });

  it("sanitizes raw module input before reading semantic fields", () => {
    const hostile = new Proxy(BASE_REQUESTS_CONNECTION_MODULE, {
      get() {
        throw new Error("raw module property read");
      },
    });

    expect(validateBaseRequestsConnectionModule(hostile)).toEqual({
      ok: true,
      errors: [],
    });
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

  it("rejects cross-module example, dialogue, and multi-token prompt corpus collisions", () => {
    const visibleFields = [
      "tokens",
      "lexemeIds",
      "formIds",
      "conceptIds",
      "patternCellIds",
      "semanticRoleIds",
      "interpretationTags",
      "predicateSenseId",
      "predicateLexemeId",
      "predicateAspect",
      "particleFrame",
    ] as const;
    const copyVisibleTarget = (
      target: Record<string, unknown>,
      source: Record<string, unknown>,
    ) => {
      for (const field of visibleFields) {
        target[field] = structuredClone(source[field]);
      }
    };

    const exampleExample = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    copyVisibleTarget(
      exampleExample.lessons[0].examples[0] as unknown as Record<string, unknown>,
      BASE_COPULA_ADJECTIVES_MODULE.lessons[2].examples[0] as unknown as Record<
        string,
        unknown
      >,
    );
    expect(validateBaseRequestsConnectionModule(exampleExample).ok).toBe(false);

    const exampleDialogue = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    copyVisibleTarget(
      exampleDialogue.lessons[0].examples[0] as unknown as Record<string, unknown>,
      BASE_EXISTENCE_LOCATION_MODULE.lessons[3].dialogue
        ?.turns[1] as unknown as Record<string, unknown>,
    );
    expect(validateBaseRequestsConnectionModule(exampleDialogue).ok).toBe(false);

    const dialoguePrompt = structuredClone(BASE_REQUESTS_CONNECTION_MODULE);
    copyVisibleTarget(
      dialoguePrompt.lessons[1].activityDesigns[0]
        .promptTarget as unknown as Record<string, unknown>,
      dialoguePrompt.lessons[1].dialogue?.turns[0] as unknown as Record<
        string,
        unknown
      >,
    );
    expect(validateBaseRequestsConnectionModule(dialoguePrompt).ok).toBe(false);
  });

  it("keeps every Task 12 corpus surface distinct from modules 02 through 09", () => {
    const collisions = validateTask11CorpusDistinctness(
      [...EARLIER_TASK11_MODULES, BASE_REQUESTS_CONNECTION_MODULE],
      baseNavigationCopyEn.content,
      baseNavigationCopyIt.content,
    );
    expect(collisions).toBeDefined();
    expect(
      collisions?.filter(({ lessonId }) =>
        /^(?:copula-adjectives|existence-location|requests-connection)-/u.test(
          lessonId,
        ),
      ),
    ).toEqual([]);
  });

  it("uses canonical learner-corpus script in every Task 12 explanation", () => {
    const corpusSurfaces = TASK12_MODULES.flatMap((module) => {
      const snapshot = strictTask11ModuleSnapshot(module)!;
      return snapshot.corpusTargets.map(({ target }) =>
        japanese(target.tokens),
      );
    });
    const canonicalLexemeSurfaces = BASE_LEXICON.map(({ kana }) => kana);
    const allowedRecognitionOrNotation = new Set(["じゃありません"]);
    const mismatches: string[] = [];

    for (const module of TASK12_MODULES) {
      for (const lesson of module.lessons) {
        const copyIds = [
          ...Object.values(lesson.content.explanationBlockIds),
          lesson.content.recapCopyId,
          ...lesson.activityDesigns.map(
            ({ promptContextCopyId }) => promptContextCopyId,
          ),
        ];
        for (const copyId of copyIds) {
          for (const [locale, copy] of [
            ["en", baseNavigationCopyEn],
            ["it", baseNavigationCopyIt],
          ] as const) {
            const runs =
              copy.content[copyId].match(
                /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々ー]+/gu,
              ) ?? [];
            for (const run of runs) {
              if (
                allowedRecognitionOrNotation.has(run) ||
                corpusSurfaces.some((surface) => surface.includes(run)) ||
                canonicalLexemeSurfaces.includes(run)
              ) {
                continue;
              }
              mismatches.push(`${locale}:${copyId}:${run}`);
            }
          }
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("snapshots prompts, contexts, audio, and hidden spoken targets for every lesson", () => {
    for (const module of TASK12_MODULES) {
      const snapshot = strictTask11ModuleSnapshot(module);
      expect(snapshot).toBeDefined();
      expect(
        snapshot?.corpusTargets.filter(({ source }) => source === "prompt"),
      ).toHaveLength(40);
      expect(
        snapshot?.corpusTargets.filter(({ source }) => source === "audio"),
      ).toHaveLength(4);
      expect(
        snapshot?.corpusTargets.filter(({ source }) => source === "spoken"),
      ).toHaveLength(4);
      expect(snapshot?.contexts).toHaveLength(40);
    }
  });

  it("rejects hostile copy accessors without invoking them during corpus audit", () => {
    const contextId =
      BASE_REQUESTS_CONNECTION_MODULE.lessons[0].activityDesigns[0]
        .promptContextCopyId;
    let reads = 0;
    const hostileCopy = { ...baseNavigationCopyEn.content };
    Object.defineProperty(hostileCopy, contextId, {
      enumerable: true,
      configurable: true,
      get() {
        reads += 1;
        return "きて";
      },
    });

    expect(
      validateTask11CorpusDistinctness(
        [BASE_REQUESTS_CONNECTION_MODULE],
        hostileCopy,
        baseNavigationCopyIt.content,
      ),
    ).toBeUndefined();
    expect(reads).toBe(0);
  });

  it.each([
    [
      "prompt",
      (module: MutableModuleSnapshot) => {
        module.lessons[0].activityDesigns[0].promptTarget = undefined;
      },
    ],
    [
      "context",
      (module: MutableModuleSnapshot) => {
        module.lessons[0].activityDesigns[0].contextTarget = undefined;
      },
    ],
    [
      "audio",
      (module: MutableModuleSnapshot) => {
        module.lessons[0].activityDesigns[8].audioTargetId = undefined;
      },
    ],
    [
      "spoken",
      (module: MutableModuleSnapshot) => {
        module.lessons[0].activityDesigns[9].acceptedAnswerTarget = undefined;
      },
    ],
  ] as const)("fails closed on a malformed %s snapshot field", (_, mutate) => {
    const module = structuredClone(
      BASE_REQUESTS_CONNECTION_MODULE,
    ) as unknown as MutableModuleSnapshot;
    mutate(module);

    expect(validateBaseRequestsConnectionModule(module).ok).toBe(false);
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

  it("grounds acceptance in a wanted offer without reusing the dialogue", () => {
    const lesson = BASE_REQUESTS_CONNECTION_MODULE.lessons[1];
    const activity = lesson.activityDesigns[0];
    const activityPrompt = activity.promptTarget;
    const accepted = japanese(activity.acceptedAnswerTarget.tokens);
    const rejected = activity.optionTargets
      .map(({ tokens }) => japanese(tokens))
      .find((surface) => surface !== accepted);

    expect(japanese(activityPrompt.tokens)).toBe("しごとをてつだいます");
    expect(accepted).toBe("おねがいします");
    expect(rejected).toBe("いいえ");
    const contextCopyId = lesson.content.activities[0].instructionCopyId;
    expect(
      baseNavigationCopyEn.content[contextCopyId],
    ).toMatch(/want.*help/iu);
    expect(
      baseNavigationCopyIt.content[contextCopyId],
    ).toMatch(/vuoi.*aiuto/iu);
    expect(lesson.dialogue!.turns.map(({ tokens }) => japanese(tokens))).not
      .toContain(japanese(activityPrompt.tokens));
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

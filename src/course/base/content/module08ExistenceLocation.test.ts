import { describe, expect, it } from "vitest";
import {
  BASE_FIRST_TEACH_OWNER_BY_KEY,
  firstTeachOwnerKey,
} from "../catalog/firstTeach";
import { BASE_LEXICON } from "../catalog/lexicon";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID,
  BASE_EXISTENCE_LOCATION_MODULE,
  validateBaseExistenceLocationModule,
} from "./module08ExistenceLocation";

const jp = (target: { readonly tokens: readonly { readonly jp: string }[] }) =>
  target.tokens.map(({ jp: text }) => text).join("");

describe("Task 12 existence-particle ownership", () => {
  it.each([
    ["base-particle-existence-ni", "concept"],
    ["base-particle-existential-ga", "concept"],
  ] as const)("owns %s at existence-location-2", (contentId, kind) => {
    expect(
      BASE_FIRST_TEACH_OWNER_BY_KEY.get(firstTeachOwnerKey(kind, contentId))
        ?.lessonId,
    ).toBe("existence-location-2");
  });

  it("allocates the required new lexemes to every module 08 lesson", () => {
    expect(
      [1, 2, 3, 4].map(
        (order) =>
          BASE_LEXICON.filter(
            ({ firstTeachLessonId }) =>
              firstTeachLessonId === `existence-location-${order}`,
          ).length,
      ),
    ).toEqual([5, 4, 4, 9]);
  });

  it("publishes three system lessons and one content lesson with a finding-place dialogue", () => {
    expect(
      BASE_EXISTENCE_LOCATION_MODULE.lessons.map(
        ({ content }) => content.contract,
      ),
    ).toEqual(["system", "system", "system", "content"]);
    for (const lesson of BASE_EXISTENCE_LOCATION_MODULE.lessons.slice(0, 3)) {
      expect(lesson.examples.length).toBeGreaterThanOrEqual(10);
      expect(lesson.examples.length).toBeLessThanOrEqual(14);
    }
    const practical = BASE_EXISTENCE_LOCATION_MODULE.lessons[3];
    expect(practical.examples.length).toBeGreaterThanOrEqual(6);
    expect(practical.examples.length).toBeLessThanOrEqual(10);
    expect(practical.dialogue?.turns.length).toBeGreaterThanOrEqual(4);
    expect(practical.dialogue?.turns.length).toBeLessThanOrEqual(8);
    expect(
      BASE_EXISTENCE_LOCATION_MODULE.lessons[2].content.introducedConceptIds,
    ).toEqual([
      "existence-vs-action-location",
      "existential-ga-vs-topic-wa",
    ]);
    for (const lesson of BASE_EXISTENCE_LOCATION_MODULE.lessons) {
      expect(lesson.content.activities.filter(({ mode }) => mode === "non-spoken")).toHaveLength(8);
      expect(lesson.content.activities.filter(({ mode }) => mode === "audio")).toHaveLength(2);
    }
    expect(validateBaseExistenceLocationModule(BASE_EXISTENCE_LOCATION_MODULE)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("grounds ある and いる in independent inanimate and animate entity classes", () => {
    expect(BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID.get("noun-tsukue")).toBe(
      "inanimate",
    );
    expect(BASE_EXISTENCE_ENTITY_CLASS_BY_LEXEME_ID.get("noun-inu")).toBe(
      "animate",
    );
    for (const [lessonIndex, lesson] of BASE_EXISTENCE_LOCATION_MODULE.lessons.entries()) {
      for (const target of [
        ...lesson.examples,
        ...(lesson.dialogue?.turns ?? []),
        ...lesson.activityDesigns.flatMap((activity) => [
          ...activity.optionTargets,
          activity.acceptedAnswerTarget,
        ]),
      ]) {
        if (
          target.predicateLexemeId !== "verb-aru" &&
          target.predicateLexemeId !== "verb-iru"
        ) {
          continue;
        }
        expect(target.predicateAspect).toBe("stative");
        expect(target.interpretationTags).toContain("present-state");
        expect(target.interpretationTags).not.toContain("ongoing-now");
        if (lessonIndex === 0) {
          expect(target.particleFrame).toBeUndefined();
          expect(target.semanticRoleIds).toContain("topic");
        } else {
          expect(target.particleFrame?.provided["existence-location"]).toBe(
            "existence-location-ni",
          );
          expect(
            target.particleFrame?.provided["existential-subject"] ===
              "existential-subject-ga" ||
              target.semanticRoleIds.includes("topic"),
          ).toBe(true);
        }
      }
    }
  });

  it("uses は only for established-topic questions and answers in lesson 1", () => {
    const lesson = BASE_EXISTENCE_LOCATION_MODULE.lessons[0];

    expect(lesson.examples.map(({ tokens }) => tokens.map(({ jp }) => jp).join(""))).toEqual([
      "はい、つくえはあります",
      "はい、いぬはいます",
      "くるまはありますね",
      "はい、ほんはあります",
      "ともだちはいますよ",
      "かさはありますか",
      "せんせいはいますね",
      "はい、えんぴつはあります",
      "たなかさんはいますか",
      "じてんしゃはありますよ",
    ]);
    for (const example of lesson.examples) {
      const copyId =
        "copyId" in example.translationCopy
          ? example.translationCopy.copyId
          : example.translationCopy.enCopyId;
      expect(baseNavigationCopyEn.content[copyId]).not.toMatch(
        /^There (?:is|are)\b/iu,
      );
      const itCopyId =
        "copyId" in example.translationCopy
          ? example.translationCopy.copyId
          : example.translationCopy.itCopyId;
      expect(baseNavigationCopyIt.content[itCopyId]).not.toMatch(
        /^(?:C'è|Ci sono)\b/iu,
      );
    }
    const contrastId =
      lesson.content.explanationBlockIds.nearestContrast;
    expect(baseNavigationCopyEn.content[contrastId]).toMatch(
      /established|already known/iu,
    );
    expect(baseNavigationCopyIt.content[contrastId]).toMatch(
      /già (?:stabilito|noto)/iu,
    );
  });

  it.each([1, 2] as const)(
    "makes lesson %s ordering distractor predicate-nonfinal rather than an alternate grammatical order",
    (lessonIndex) => {
      const activity =
        BASE_EXISTENCE_LOCATION_MODULE.lessons[lessonIndex].activityDesigns[2];
      const accepted = activity.acceptedAnswerTarget;
      const distractor =
        activity.optionTargets[
          activity.correctOptionIndex === 0 ? 1 : 0
        ];
      const multiset = (target: typeof accepted) =>
        target.tokens.map(({ source }) => source.referenceId).sort();

      expect(multiset(distractor)).toEqual(multiset(accepted));
      expect(distractor.predicateLexemeId).toBe(
        accepted.predicateLexemeId,
      );
      expect(distractor.tokens.at(-1)?.kind).toBe("particle");
      expect(accepted.tokens.at(-1)?.kind).toBe("morpheme");
    },
  );

  it("repairs the new-entity topic mismatch by changing only は to が", () => {
    const diagnosis =
      BASE_EXISTENCE_LOCATION_MODULE.lessons[2].activityDesigns[5];
    const prompt = diagnosis.promptTarget;
    const accepted = diagnosis.acceptedAnswerTarget;
    const differingTokens = prompt.tokens.flatMap((token, index) =>
      token.source.referenceId === accepted.tokens[index]?.source.referenceId
        ? []
        : [[token.source.referenceId, accepted.tokens[index]?.source.referenceId]],
    );

    expect(prompt.tokens.map(({ jp }) => jp).join("")).toBe(
      "へやにいぬはいます",
    );
    expect(accepted.tokens.map(({ jp }) => jp).join("")).toBe(
      "へやにいぬがいます",
    );
    expect(differingTokens).toEqual([["topic-wa", "existential-subject-ga"]]);
  });

  it("uniquely cues the hidden police-officer location in both locales", () => {
    const lesson = BASE_EXISTENCE_LOCATION_MODULE.lessons[3];
    const index = lesson.content.activities.findIndex(
      ({ operation }) => operation === "produce-spoken",
    );
    const activity = lesson.content.activities[index];
    const target = lesson.activityDesigns[index].acceptedAnswerTarget;
    const en = baseNavigationCopyEn.content[activity.instructionCopyId];
    const it = baseNavigationCopyIt.content[activity.instructionCopyId];

    expect(en).toMatch(/police officer.*station/iu);
    expect(it).toMatch(/agente.*stazione/iu);
    expect(en.normalize("NFKC")).not.toContain(
      target.tokens.map(({ jp }) => jp).join(""),
    );
    expect(it.normalize("NFKC")).not.toContain(
      target.tokens.map(({ jp }) => jp).join(""),
    );
  });

  it("rejects a cloned accepted target whose existence predicate contradicts its entity class", () => {
    const mutated = structuredClone(BASE_EXISTENCE_LOCATION_MODULE);
    const target = mutated.lessons[0].examples[0] as unknown as {
      lexemeIds: string[];
      predicateLexemeId: string | null;
      predicateSenseId: string | null;
    };
    target.lexemeIds = target.lexemeIds.map((id) =>
      id === "verb-aru" ? "verb-iru" : id,
    );
    target.predicateLexemeId = "verb-iru";
    target.predicateSenseId = "iru";

    expect(validateBaseExistenceLocationModule(mutated).ok).toBe(false);
  });

  it("rejects trailing lexical junk after a canonical existence predicate", () => {
    const mutated = structuredClone(BASE_EXISTENCE_LOCATION_MODULE);
    const target = mutated.lessons[0].examples[0] as unknown as {
      tokens: Array<
        (typeof BASE_EXISTENCE_LOCATION_MODULE.lessons)[number]["examples"][number]["tokens"][number]
      >;
    };
    const dogToken = mutated.lessons[0].examples
      .flatMap(({ tokens }) => tokens)
      .find(({ source }) => source.referenceId === "noun-inu")!;
    target.tokens.push(structuredClone(dogToken));

    expect(validateBaseExistenceLocationModule(mutated).ok).toBe(false);
  });

  it("derives ある evidence after predicate metadata is stripped", () => {
    const mutated = structuredClone(BASE_EXISTENCE_LOCATION_MODULE);
    const target = mutated.lessons[1].examples[0] as unknown as {
      predicateLexemeId: string | null;
      tokens: Array<{
        jp: string;
        romaji: string;
        source: { referenceId: string };
      }>;
    };
    target.predicateLexemeId = null;
    const stem = target.tokens.find(
      ({ source }) => source.referenceId === "verb-aru",
    )!;
    stem.jp = "い";
    stem.romaji = "i";

    expect(validateBaseExistenceLocationModule(mutated)).toEqual({
      ok: false,
      errors: ["invalid-lesson-shape"],
    });
  });

  it.each(["example", "option", "audio", "spoken", "context"] as const)(
    "rejects stripped existence predicate metadata on a %s target",
    (source) => {
      const mutated = structuredClone(BASE_EXISTENCE_LOCATION_MODULE);
      const firstLesson = mutated.lessons[0];
      const listening = firstLesson.activityDesigns[8];
      const target =
        source === "example"
          ? firstLesson.examples[0]
          : source === "option"
            ? firstLesson.activityDesigns[0].optionTargets[0]
            : source === "audio"
              ? listening.optionTargets[listening.correctOptionIndex!]
              : source === "spoken"
                ? firstLesson.activityDesigns[9].acceptedAnswerTarget
                : firstLesson.activityDesigns[5].promptTarget;
      (
        target as unknown as { predicateLexemeId: string | null }
      ).predicateLexemeId = null;

      expect(validateBaseExistenceLocationModule(mutated)).toEqual({
        ok: false,
        errors: ["invalid-lesson-shape"],
      });
    },
  );

  it("rejects forged option predicates that disagree with lexical evidence", () => {
    const mutated = structuredClone(BASE_EXISTENCE_LOCATION_MODULE);
    const activity = mutated.lessons[0].activityDesigns[0];
    const target = activity.optionTargets[
      activity.correctOptionIndex!
    ] as unknown as {
      lexemeIds: string[];
    };
    target.lexemeIds.push("verb-aru");

    expect(validateBaseExistenceLocationModule(mutated)).toEqual({
      ok: false,
      errors: ["invalid-lesson-shape"],
    });
  });

  it("uses canonical equality as the final defense for context drift", () => {
    const mutated = structuredClone(BASE_EXISTENCE_LOCATION_MODULE);
    const context = mutated.lessons[0].activityDesigns[0]
      .contextTarget as unknown as { id: string };
    context.id = `${context.id}-forged`;

    expect(validateBaseExistenceLocationModule(mutated)).toEqual({
      ok: false,
      errors: ["invalid-module-shape"],
    });
  });

  it("sanitizes raw module input before reading semantic fields", () => {
    const hostile = new Proxy(BASE_EXISTENCE_LOCATION_MODULE, {
      get() {
        throw new Error("raw module property read");
      },
    });

    expect(validateBaseExistenceLocationModule(hostile)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("rejects a coherently relabeled action-place で on an existence predicate", () => {
    const mutated = structuredClone(BASE_EXISTENCE_LOCATION_MODULE);
    const target = mutated.lessons[1].examples[0] as unknown as {
      tokens: {
        jp: string;
        romaji: string;
        source: { referenceId: string };
      }[];
      semanticRoleIds: string[];
      particleBindings: {
        role: string;
        particleSense: string;
        attachmentLexemeId: string;
      }[];
      particleFrame: {
        predicateSenseId: string;
        provided: Record<string, string>;
        attachmentLexemeIdByRole: Record<string, string>;
      };
    };
    const particle = target.tokens.find(
      ({ source }) => source.referenceId === "existence-location-ni",
    )!;
    particle.jp = "で";
    particle.romaji = "de";
    particle.source.referenceId = "action-place-de";
    target.semanticRoleIds[0] = "action-place";
    target.particleBindings[0] = {
      role: "action-place",
      particleSense: "action-place-de",
      attachmentLexemeId: "noun-heya",
    };
    target.particleFrame.provided = {
      "action-place": "action-place-de",
      "existential-subject": "existential-subject-ga",
    };
    target.particleFrame.attachmentLexemeIdByRole = {
      "action-place": "noun-heya",
      "existential-subject": "noun-isu",
    };

    expect(validateBaseExistenceLocationModule(mutated).ok).toBe(false);
  });

  it("names the exact authored locations in non-audio activity situations", () => {
    const frameLesson = BASE_EXISTENCE_LOCATION_MODULE.lessons[1];
    const practicalLesson = BASE_EXISTENCE_LOCATION_MODULE.lessons[3];
    const officeChairId = frameLesson.content.activities[0].instructionCopyId;
    const restroomId =
      practicalLesson.content.activities[4].instructionCopyId;
    const classroomEmployeeId =
      practicalLesson.content.activities[7].instructionCopyId;

    expect(baseNavigationCopyEn.content[officeChairId]).toMatch(/office/iu);
    expect(baseNavigationCopyIt.content[officeChairId]).toMatch(/ufficio/iu);
    expect(baseNavigationCopyEn.content[restroomId]).not.toMatch(/or bag/iu);
    expect(baseNavigationCopyIt.content[restroomId]).not.toMatch(
      /o la borsa/iu,
    );
    expect(baseNavigationCopyEn.content[classroomEmployeeId]).toMatch(
      /classroom/iu,
    );
    expect(baseNavigationCopyIt.content[classroomEmployeeId]).toMatch(
      /aula/iu,
    );
  });

  it("uses plausible animate locations instead of placing fish in a garden", () => {
    const lesson = BASE_EXISTENCE_LOCATION_MODULE.lessons[2];
    const japanese = [
      ...lesson.examples.map(jp),
      ...lesson.activityDesigns.flatMap((activity) => [
        jp(activity.promptTarget),
        ...activity.optionTargets.map(jp),
        jp(activity.acceptedAnswerTarget),
      ]),
    ];

    expect(japanese.some((surface) => /にわ.*さかな|さかな.*にわ/u.test(surface))).toBe(
      false,
    );
    expect(jp(lesson.examples[4])).toBe("にわにこどもがいます");
    expect(jp(lesson.examples[6])).toBe("さかなはうちにいます");
    expect(jp(lesson.activityDesigns[2].acceptedAnswerTarget)).toBe(
      "うちにさかながいます",
    );
    expect(jp(lesson.activityDesigns[8].acceptedAnswerTarget)).toBe(
      "うちにゆきさんがいます",
    );
  });
});

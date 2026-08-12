import { describe, expect, it } from "vitest";

import { BASE_LESSON_IDS } from "../manifest";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateTask11SemanticReview } from "./module04PoliteVerbs";
import {
  BASE_SYNTHESIS_LESSONS,
  BASE_SYNTHESIS_MODULE,
  BASE_SYNTHESIS_VALIDATION,
  BASE_SYNTHESIS_VALIDATION_CATALOGS,
  validateSynthesisCueRelevance,
} from "./module10Synthesis";

const jp = (target: { readonly tokens: readonly { readonly jp: string }[] }) =>
  target.tokens.map(({ jp: text }) => text).join("");

describe("Base Module 10 synthesis", () => {
  it("publishes exactly four synthesis lessons with no new teaching", () => {
    expect(BASE_SYNTHESIS_MODULE.lessons).toHaveLength(4);
    expect(
      BASE_SYNTHESIS_MODULE.sequence.slice(-4).map(({ lessonId }) => lessonId),
    ).toEqual(BASE_LESSON_IDS.slice(-4));

    for (const lesson of BASE_SYNTHESIS_LESSONS) {
      expect(lesson.content.contract).toBe("synthesis");
      expect(lesson.content.newLexemeIds).toEqual([]);
      expect(lesson.content.introducedConceptIds).toEqual([]);
    }
  });

  it("gives every synthesis lesson visible cumulative depth", () => {
    for (const lesson of BASE_SYNTHESIS_LESSONS) {
      const validation = validateBaseLessonDepth(
        lesson.content,
        BASE_SYNTHESIS_VALIDATION_CATALOGS,
      );
      const nonSpoken = lesson.content.activities.filter(
        ({ mode }) => mode === "non-spoken",
      );
      const categoryCounts = new Map<string, number>();

      for (const activity of nonSpoken) {
        categoryCounts.set(
          activity.category,
          (categoryCounts.get(activity.category) ?? 0) + 1,
        );
      }

      expect(validation).toEqual([]);
      expect(lesson.content.reviewLexemeIds.length).toBeGreaterThanOrEqual(12);
      expect(lesson.content.retrievedSystemIds.length).toBeGreaterThanOrEqual(4);
      expect(lesson.examples.length).toBeGreaterThanOrEqual(6);
      expect(lesson.examples.length).toBeLessThanOrEqual(10);
      expect(lesson.dialogue?.turns.length).toBeGreaterThanOrEqual(4);
      expect(lesson.dialogue?.turns.length).toBeLessThanOrEqual(8);
      expect(nonSpoken).toHaveLength(8);
      expect(categoryCounts.size).toBeGreaterThanOrEqual(6);
      expect(Math.max(...categoryCounts.values())).toBeLessThanOrEqual(2);
      expect(
        lesson.content.activities.filter(
          ({ interactionKind }) => interactionKind === "listening",
        ),
      ).toHaveLength(1);
      expect(
        lesson.content.activities.filter(
          ({ interactionKind }) => interactionKind === "spoken",
        ),
      ).toHaveLength(1);
    }
  });

  it("passes the independently derived module validation", () => {
    expect(BASE_SYNTHESIS_VALIDATION.errors).toEqual([]);
  });

  it("passes the independent semantic review for repairs and listening", () => {
    expect(validateTask11SemanticReview(BASE_SYNTHESIS_LESSONS)).toEqual([]);
  });

  it("keeps the authored synthesis conversations and activity cues coherent", () => {
    const japanese = (target: { readonly tokens: readonly { readonly jp: string }[] }) =>
      target.tokens.map(({ jp }) => jp).join("");
    const dialogue = (lessonIndex: number) => {
      const lesson = BASE_SYNTHESIS_LESSONS[lessonIndex];
      if (!lesson?.dialogue) throw new Error("Missing synthesis dialogue.");
      return lesson.dialogue.turns.map((turn, index) => {
        const copy = lesson.dialogue?.turnCopy[index];
        if (!copy) throw new Error("Missing synthesis dialogue copy.");
        return [
          japanese(turn),
          baseNavigationCopyEn.content[copy.translationCopyId],
          baseNavigationCopyIt.content[copy.translationCopyId],
        ];
      });
    };

    expect(dialogue(0)).toEqual([
      [
        "おとうさんのなまえはなんですか",
        "What is your father's name?",
        "Come si chiama tuo padre?",
      ],
      [
        "ちちのなまえはそらです",
        "My father's name is Sora.",
        "Mio padre si chiama Sora.",
      ],
      [
        "おかあさんはけんきゅうしゃですか",
        "Is your mother a researcher?",
        "Tua madre è una ricercatrice?",
      ],
      [
        "そうです、けんきゅうしゃです",
        "That's right, she is a researcher.",
        "Esatto, è una ricercatrice.",
      ],
      [
        "おかあさんのじむしょはきれいですか",
        "Is your mother's office clean?",
        "L'ufficio di tua madre è pulito?",
      ],
      ["はい、きれいです", "Yes, it is clean.", "Sì, è pulito."],
      [
        "おかあさんのかさはたかいですか",
        "Is your mother's umbrella expensive?",
        "L'ombrello di tua madre è costoso?",
      ],
      [
        "いいえ、たかくないです",
        "No, it is not expensive.",
        "No, non è costoso.",
      ],
    ]);
    expect(dialogue(1)).toEqual([
      ["わたしはゆきです", "I am Yuki.", "Sono Yuki."],
      [
        "ふだんしごとをしますか",
        "Do you usually work?",
        "Di solito lavori?",
      ],
      [
        "そうです、しごとをします",
        "That's right, I work.",
        "Esatto, lavoro.",
      ],
      ["よるに、うたいます", "I will sing at night.", "Canterò di sera."],
      [
        "ごじに、でんわして、あいますか",
        "Will you call and then meet at five?",
        "Telefonerai e poi vi incontrerete alle cinque?",
      ],
      [
        "いいえ、あした、でんわして、あいます",
        "No, I will call and then meet tomorrow.",
        "No, telefonerò e poi ci incontreremo domani.",
      ],
      [
        "しょるい、おねがいします",
        "The documents, please.",
        "I documenti, per favore.",
      ],
      [
        "わかりました、もってきます",
        "Understood, I will bring them.",
        "Ho capito, li porterò.",
      ],
    ]);
    expect(dialogue(2)).toEqual([
      ["こんびにはどこにありますか", "Where is the convenience store?", "Dov'è il minimarket?"],
      [
        "こんびにはばすていにあります",
        "The convenience store is at the bus stop.",
        "Il minimarket è alla fermata dell'autobus.",
      ],
      [
        "すみません、といれはどこにありますか",
        "Excuse me, where is the restroom?",
        "Scusi, dov'è il bagno?",
      ],
      [
        "きょう、といれはうけつけにあります",
        "Today, the restroom is at reception.",
        "Oggi il bagno è alla reception.",
      ],
      [
        "こんしゅう、げつようびのよるにりょこうしますか",
        "Will you travel on Monday night this week?",
        "Viaggerai lunedì sera questa settimana?",
      ],
      [
        "はい、こんしゅう、げつようびのよるにりょこうします",
        "Yes, I will travel on Monday night this week.",
        "Sì, viaggerò lunedì sera questa settimana.",
      ],
      [
        "すみません、たなかさん、ちずをみせてください",
        "Excuse me, Tanaka, please show me the map.",
        "Mi scusi, Tanaka, mi mostri la mappa, per favore.",
      ],
      [
        "わかりました、みせます",
        "Understood, I will show it.",
        "Ho capito, la mostrerò.",
      ],
    ]);
    expect(dialogue(3)).toEqual([
      ["わたしはさくらです", "I am Sakura.", "Sono Sakura."],
      ["わたしははるです", "I am Haru.", "Sono Haru."],
      [
        "すみません、ともだちはだれですか",
        "Excuse me, who is your friend?",
        "Scusa, chi è il tuo amico?",
      ],
      ["ゆきさんです", "My friend is Yuki.", "La mia amica è Yuki."],
      [
        "ゆきさんはじむしょにいますか",
        "Is Yuki at the office?",
        "Yuki è in ufficio?",
      ],
      [
        "いいえ、ゆきさんはがっこうにいます",
        "No, Yuki is at school.",
        "No, Yuki è a scuola.",
      ],
      [
        "すみません、ゆきさんをよんでください",
        "Excuse me, please call Yuki.",
        "Mi scusi, chiami Yuki, per favore.",
      ],
      [
        "わかりました、よびます",
        "Understood, I will call her.",
        "Ho capito, la chiamerò.",
      ],
    ]);

    const [one, two, three, four] = BASE_SYNTHESIS_LESSONS;
    if (!one || !two || !three || !four) throw new Error("Missing synthesis lesson.");
    expect(japanese(one.examples[6]!)).toBe("こんびにはばすていにありますか");
    expect(japanese(two.examples[4]!)).toBe("げつようびに、でかけます");
    expect(japanese(two.examples[6]!)).toBe("ふくをきました");
    expect(japanese(two.examples[9]!)).toBe("くじに、ねます");
    expect(two.reviewedTranslations[9]?.en).toBe("I will sleep at nine.");
    expect(one.activityDesigns[2]?.options).toEqual([
      "さとうさんはしずかなりょうりにんです",
      "さとうさんはりょうりにんですしずかな",
    ]);
    expect(two.activityDesigns[2]?.acceptedAnswers).toEqual(["きいて、つくります"]);
    expect(two.activityDesigns[5]?.prompt).toContain("きのう");
    expect(two.activityDesigns[5]?.acceptedAnswers).toEqual(["きのうしりました"]);
    expect(two.activityDesigns[7]?.acceptedAnswers).toEqual([
      "きのう、はなはしにました",
    ]);
    expect(
      baseNavigationCopyEn.content[
        one.content.activities[9]!.instructionCopyId
      ],
    ).toContain("shown order");
    expect(
      one.content.activities.map(
        ({ instructionCopyId }) =>
          baseNavigationCopyEn.content[instructionCopyId],
      ),
    ).not.toContainEqual(expect.stringContaining("affirmative cue"));
    expect(three.activityDesigns[2]?.prompt).toContain("でる");
    expect(three.activityDesigns[4]?.prompt).toBe("ふくをあらいましたた");
    expect(three.activityDesigns[8]?.options).toEqual([
      "ちゅういをよみます",
      "ちゅういをよみません",
    ]);

    for (const lesson of BASE_SYNTHESIS_LESSONS) {
      lesson.examples.forEach((example, index) => {
        const copyId =
          "copyId" in example.translationCopy
            ? example.translationCopy.copyId
            : example.translationCopy.enCopyId;
        expect(baseNavigationCopyEn.content[copyId], `${copyId}:en`).toBe(
          lesson.reviewedTranslations[index]?.en,
        );
        expect(baseNavigationCopyIt.content[copyId], `${copyId}:it`).toBe(
          lesson.reviewedTranslations[index]?.it,
        );
      });
    }

    for (const lesson of BASE_SYNTHESIS_LESSONS) {
      for (const design of lesson.activityDesigns.filter(
        ({ category }) => category === "cumulative-retrieval",
      )) {
        expect(design.prompt.split("、").length).toBeGreaterThanOrEqual(2);
        expect(baseNavigationCopyEn.content[design.promptContextCopyId]).not.toMatch(
          /every item|word bank/i,
        );
        expect(baseNavigationCopyIt.content[design.promptContextCopyId]).not.toMatch(
          /ogni voce|elenco di parole/i,
        );
      }
    }
  });

  it("uses only task-relevant Japanese cues instead of unrelated word banks", () => {
    const expectedPrompts = new Map([
      ["base-synthesis-1-activity-3", "さとうさん、しずか、りょうりにん"],
      ["base-synthesis-1-activity-4", "おかあさん、ぎんこういん"],
      ["base-synthesis-1-activity-5", "かきますた"],
      ["base-synthesis-1-activity-6", "はな、えき"],
      ["base-synthesis-2-activity-1", "あした、そら、かく"],
      ["base-synthesis-2-activity-6", "きのう、しる"],
      ["base-synthesis-2-activity-8", "きのう、はな、しぬ"],
      ["base-synthesis-3-activity-7", "ちず、じむしょ"],
    ]);

    for (const lesson of BASE_SYNTHESIS_LESSONS) {
      for (const activity of lesson.activityDesigns) {
        const expected = expectedPrompts.get(activity.id);
        if (expected !== undefined) {
          expect(activity.prompt, activity.id).toBe(expected);
        }
      }
    }
  });

  it("rejects cue lexemes that do not participate in either activity option", () => {
    expect(validateSynthesisCueRelevance(BASE_SYNTHESIS_MODULE)).toEqual([]);

    const mutated = JSON.parse(JSON.stringify(BASE_SYNTHESIS_MODULE));
    mutated.lessons[0].activityDesigns[0].promptTarget.lexemeIds.push(
      "noun-sakana",
    );

    expect(validateSynthesisCueRelevance(mutated)).toContainEqual({
      lessonId: "base-synthesis-1",
      activityId: "base-synthesis-1-activity-1",
      lexemeId: "noun-sakana",
    });
  });

  it("keeps the final dialogue's friend, chronology, and request coherent", () => {
    const lesson = BASE_SYNTHESIS_LESSONS.find(
      ({ content }) => content.lessonId === "base-synthesis-4",
    );
    expect(lesson?.dialogue?.turns.map(jp)).toEqual([
      "わたしはさくらです",
      "わたしははるです",
      "すみません、ともだちはだれですか",
      "ゆきさんです",
      "ゆきさんはじむしょにいますか",
      "いいえ、ゆきさんはがっこうにいます",
      "すみません、ゆきさんをよんでください",
      "わかりました、よびます",
    ]);
  });

  it("uses honorific third-person names and grounded synthesis propositions", () => {
    const activities = new Map(
      BASE_SYNTHESIS_LESSONS.flatMap((lesson) =>
        lesson.activityDesigns.map((activity) => [activity.id, activity] as const),
      ),
    );

    expect(activities.get("base-synthesis-1-activity-7")?.acceptedAnswers).toEqual([
      "ゆきさんはげんきです",
    ]);
    expect(activities.get("base-synthesis-4-activity-9")?.acceptedAnswers).toEqual([
      "ゆきさんはいま、はたらいています",
    ]);
    expect(
      activities.get("base-synthesis-1-activity-10")?.acceptedAnswers[0],
    ).toBe(
      "たなかさんはえきいんです",
    );
    expect(activities.get("base-synthesis-2-activity-2")?.options).toEqual([
      "たなかさんはよるにうたいます",
      "たなかさんはよるにうたいません",
    ]);
    expect(activities.get("base-synthesis-2-activity-2")?.prompt).not.toContain(
      "しぬ",
    );
    expect(activities.get("base-synthesis-3-activity-7")?.prompt).not.toContain(
      "しぬ",
    );
  });

  it("places すみません before synthesis requests", () => {
    const surfaces = BASE_SYNTHESIS_LESSONS.flatMap((lesson) => [
      ...lesson.examples.map(jp),
      ...(lesson.dialogue?.turns.map(jp) ?? []),
      ...lesson.activityDesigns.flatMap((activity) => [
        activity.prompt,
        ...(activity.operation === "produce-spoken"
          ? [activity.acceptedAnswers[0]]
          : []),
      ]),
    ]);

    expect(surfaces).not.toContain("おねがいします、ちずをみせてください");
    expect(surfaces).not.toContain("おねがいします、かばんをみせてください");
    expect(surfaces).not.toContain("おねがいします、ざっしをよんでください");
    expect(surfaces).toContain("すみません、たなかさん、ちずをみせてください");
    expect(surfaces).toContain("すみません、かばんをみせてください");
    expect(surfaces).toContain("すみません、ざっしをよんでください");
  });
});

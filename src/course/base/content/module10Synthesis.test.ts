import { describe, expect, it } from "vitest";

import { BASE_LESSON_IDS } from "../manifest";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import {
  BASE_SYNTHESIS_LESSONS,
  BASE_SYNTHESIS_MODULE,
  BASE_SYNTHESIS_VALIDATION,
  BASE_SYNTHESIS_VALIDATION_CATALOGS,
} from "./module10Synthesis";

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
        "たなかさんはしずかなけんきゅうしゃです",
        "Tanaka is a quiet researcher.",
        "Tanaka è un ricercatore tranquillo.",
      ],
      ["げんきですか", "Is he well?", "Sta bene?"],
      ["はい、げんきです", "Yes, he is well.", "Sì, sta bene."],
      ["えんじにあですか", "Is he an engineer?", "È un ingegnere?"],
      [
        "いいえ、けんきゅうしゃです",
        "No, he is a researcher.",
        "No, è un ricercatore.",
      ],
      ["ゆうめいです", "He is famous.", "È famoso."],
    ]);
    expect(dialogue(1)).toEqual([
      [
        "ふだんべんきょうしますか",
        "Do you usually study?",
        "Di solito studi?",
      ],
      [
        "しちじからくじまでべんきょうします",
        "I study from seven until nine.",
        "Studio dalle sette alle nove.",
      ],
      [
        "あしたくじにじむしょにいきますか",
        "Will you go to the office at nine tomorrow?",
        "Andrai in ufficio domani alle nove?",
      ],
      ["はい、くじにいきます", "Yes, I will go at nine.", "Sì, andrò alle nove."],
      [
        "しょるいをみせますか",
        "Will you show the documents?",
        "Mostrerai i documenti?",
      ],
      [
        "はい、もってきて、みせます",
        "Yes, I will bring them and show them.",
        "Sì, li porterò e li mostrerò.",
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
      ["といれはえきにあります", "The restroom is at the station.", "Il bagno è alla stazione."],
      ["おねがいします、ちずをみせてください", "Please show me the map.", "Mi mostri la mappa, per favore."],
      ["はい、みせます", "Yes, I will show it.", "Sì, la mostrerò."],
    ]);
    expect(dialogue(3)).toEqual([
      ["ともだちはがくせいです", "My friend is a student.", "Il mio amico è uno studente."],
      ["がっこうでべんきょうします", "They study at school.", "Studia a scuola."],
      ["きょうじむしょにいきます", "They will go to the office today.", "Oggi andrà in ufficio."],
      [
        "ともだちはじむしょにいます",
        "My friend is at the office.",
        "Il mio amico è in ufficio.",
      ],
      ["おねがいします、ほんをよんでください", "Please read the book.", "Legga il libro, per favore."],
      ["はい、きょうよみます", "Yes, I will read it today.", "Sì, lo leggerò oggi."],
    ]);

    const [one, two, three, four] = BASE_SYNTHESIS_LESSONS;
    if (!one || !two || !three || !four) throw new Error("Missing synthesis lesson.");
    expect(japanese(one.examples[1]!)).toBe(
      "すずきさんはげんきなえんじにあです",
    );
    expect(japanese(one.examples[5]!)).toBe(
      "かいしゃいんのひるごはんはおいしいです",
    );
    expect(japanese(two.examples[8]!)).toBe("やまださんはしちじによみます");
    expect(japanese(two.examples[7]!)).toBe("しょるいをとります");
    expect(japanese(two.examples[9]!)).toBe("なまえをけします");
    expect(two.reviewedTranslations[8]?.en).toBe("Yamada reads at seven.");
    expect(one.activityDesigns[2]?.options).toEqual([
      "さとうさんはしずかなえんじにあです",
      "さとうさんはえんじにあですしずかな",
    ]);
    expect(two.activityDesigns[2]?.acceptedAnswers).toEqual(["きて、すわります"]);
    expect(two.activityDesigns[5]?.prompt).toContain("きのう");
    expect(two.activityDesigns[5]?.acceptedAnswers).toEqual(["しりました"]);
    expect(two.activityDesigns[7]?.options).toEqual([
      "すずきさんはよみます",
      "すずきさんはよみません",
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
    expect(three.activityDesigns[4]?.prompt).toBe("ふく、あらう");
    expect(three.activityDesigns[8]?.options).toEqual([
      "ちずをよみます",
      "ちずをよみません",
    ]);

    for (const lesson of BASE_SYNTHESIS_LESSONS) {
      for (const design of lesson.activityDesigns.filter(
        ({ category }) => category === "cumulative-retrieval",
      )) {
        expect(design.prompt.split("、").length).toBeGreaterThanOrEqual(6);
        expect(baseNavigationCopyEn.content[design.promptContextCopyId]).toContain(
          "word bank",
        );
        expect(baseNavigationCopyIt.content[design.promptContextCopyId]).toContain(
          "elenco di parole",
        );
      }
    }
  });
});

import { describe, expect, it } from "vitest";

import {
  buildA1PracticeFeedback,
  feedbackConceptTitle,
} from "./a1PracticeFeedback";

const EXPECTED_READABLE_TITLES = [
  {
    lessonId: "introductions-2",
    title: {
      en: "Set a topic with は and finish with です",
      it: "Imposta il tema con は e termina con です",
    },
  },
  {
    lessonId: "actions-1",
    title: {
      en: "Mark a direct object with を",
      it: "Segna l'oggetto diretto con を",
    },
  },
  {
    lessonId: "essential-questions-4",
    title: {
      en: "Use が for focus or grammatical subject",
      it: "Usa が per il fuoco o il soggetto grammaticale",
    },
  },
  {
    lessonId: "descriptions-2",
    title: {
      en: "Mark what you like with が",
      it: "Segna ciò che ti piace con が",
    },
  },
] as const;

describe("buildA1PracticeFeedback", () => {
  it.each(EXPECTED_READABLE_TITLES)(
    "keeps the exact authored localized title for $lessonId",
    ({ lessonId, title }) => {
      const feedback = buildA1PracticeFeedback(
        lessonId,
        "form-discrimination",
        [],
        [],
      );

      expect(feedback).toBeDefined();
      if (!feedback) return;
      for (const locale of ["en", "it"] as const) {
        expect(feedback[locale].accepted).toContain(title[locale]);
        expect(feedback[locale].retry).toContain(title[locale]);
      }
    },
  );

  it("keeps a full concept title when only a particle overlaps a forbidden target", () => {
    expect(
      feedbackConceptTitle(
        "Set a topic with は and finish with です",
        ["私は学生です"],
        "en",
      ),
    ).toBe("Set a topic with は and finish with です");
  });

  it.each([
    ["exactly equals", "私は学生です", ["私は学生です"], "en", "The taught pattern"],
    [
      "contains",
      "Review the answer: 私は学生です",
      ["私は学生です"],
      "it",
      "Lo schema studiato",
    ],
    ["is blank", "   ", [], "en", "The taught pattern"],
  ] as const)(
    "uses a localized generic concept when the title %s a forbidden full target",
    (_case, title, forbiddenFullTargets, locale, expected) => {
      expect(feedbackConceptTitle(title, forbiddenFullTargets, locale)).toBe(expected);
    },
  );

  it("fails closed when an authored title contains a full visible target", () => {
    const fullVisibleTargets = [
      "Mark a direct object with を",
      "Segna l'oggetto diretto con を",
    ];
    const feedback = buildA1PracticeFeedback(
      "actions-1",
      "form-discrimination",
      [],
      fullVisibleTargets,
    );

    expect(feedback?.en.accepted).toContain("The taught pattern");
    expect(feedback?.it.retry).toContain("Lo schema studiato");
    for (const fullVisibleTarget of fullVisibleTargets) {
      expect(feedback?.en.accepted).not.toContain(fullVisibleTarget);
      expect(feedback?.it.retry).not.toContain(fullVisibleTarget);
    }
  });
});

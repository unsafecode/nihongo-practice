import { describe, expect, it } from "vitest";
import { courseModules } from "../data/course";
import {
  a1RuntimeLessonCopy,
  a1RuntimeModuleCopy,
  a1RuntimeObjectiveCopy,
  a1RuntimeOutcomeCopy,
} from "./runtimeCopy";

/**
 * Phase 2 Task 6: the A1 manifest carries only locale-independent copy ids;
 * these four functions are the single place that resolves them into real
 * `CourseCopy` dictionaries. Every id `data/course.ts` actually assigns must
 * resolve to non-blank text in both locales, and the resolved dictionaries
 * must contain exactly those ids — never more (which would leak unrelated
 * copy into the runtime's orphan-key checks) and never fewer.
 */
describe("A1 runtime copy", () => {
  const locales = ["en", "it"] as const;
  const introductionsTitles = {
    en: {
      module: "Introductions",
      outcome:
        "You can introduce yourself, share practical personal details, and keep a first conversation going.",
      lessons: [
        "Meeting and introducing yourself",
        "Where you are from and what you do",
        "Talking about languages and work",
        "A natural first conversation",
      ],
    },
    it: {
      module: "Presentazioni",
      outcome:
        "Sai presentarti, condividere informazioni personali pratiche e portare avanti una prima conversazione.",
      lessons: [
        "Conoscersi e presentarsi",
        "Da dove vieni e cosa fai",
        "Lingue e lavoro",
        "Una prima conversazione naturale",
      ],
    },
  } as const;
  const foundationLessonTitles = {
    en: {
      "sentence-foundations": [
        "Predicate-final identity",
        "Names and recoverable omission",
        "Natural person reference",
        "An identity exchange",
      ],
      "topic-questions": [
        "Topics and polite identity",
        "Focused answers with ga",
        "Who, what, and where",
        "This, that, and which",
      ],
      "polite-verbs": [
        "Dictionary forms and masu",
        "Objects with o",
        "Polite negative actions",
        "Places for movement and action",
      ],
      "time-movement": [
        "Clock time with ni",
        "Day parts and routines",
        "Past and negative time",
        "Direction and transport",
      ],
    },
    it: {
      "sentence-foundations": [
        "Identità con predicato finale",
        "Nomi e omissione ricavabile",
        "Riferimenti personali naturali",
        "Uno scambio d'identità",
      ],
      "topic-questions": [
        "Temi e identità cortese",
        "Risposte in fuoco con ga",
        "Chi, che cosa e dove",
        "Questo, quello e quale",
      ],
      "polite-verbs": [
        "Forme dizionario e masu",
        "Oggetti con o",
        "Azioni cortesi negative",
        "Luoghi per movimento e azione",
      ],
      "time-movement": [
        "L'ora con ni",
        "Parti della giornata e routine",
        "Tempo passato e negativo",
        "Direzione e trasporto",
      ],
    },
  } as const;

  it("names all 16 modules with non-blank text, distinct per module", () => {
    for (const locale of locales) {
      const modules = a1RuntimeModuleCopy(locale);
      expect(Object.keys(modules).sort()).toEqual(
        courseModules.map((m) => m.id).sort(),
      );
      const titles = new Set<string>();
      for (const module of courseModules) {
        const title = modules[module.id]?.title;
        expect(title?.trim().length ?? 0).toBeGreaterThan(0);
        titles.add(title!);
      }
      expect(titles.size).toBe(courseModules.length);
    }
  });

  it("uses the approved concise titles and outcomes for every new Foundations module", () => {
    const expected = {
      en: {
        "sentence-foundations": {
          title: "Sentence Foundations",
          outcome:
            "You can build short predicate-final identity sentences and omit a known topic.",
        },
        "topic-questions": {
          title: "Topics & Questions",
          outcome:
            "You can set a topic, focus an identity with ga, and ask simple clarification questions.",
        },
        "polite-verbs": {
          title: "Polite Verbs",
          outcome:
            "You can use basic polite nonpast actions with objects, places, and clear subject omission.",
        },
        "time-movement": {
          title: "Time & Movement",
          outcome:
            "You can say when an action happened and describe a short trip with direction and transport.",
        },
      },
      it: {
        "sentence-foundations": {
          title: "Fondamenti della frase",
          outcome:
            "Sai costruire brevi frasi d'identità con predicato finale e omettere un tema noto.",
        },
        "topic-questions": {
          title: "Temi e domande",
          outcome:
            "Sai impostare un tema, mettere a fuoco un'identità con ga e fare semplici domande di chiarimento.",
        },
        "polite-verbs": {
          title: "Verbi cortesi",
          outcome:
            "Sai usare azioni cortesi non-passate con oggetti, luoghi e un'omissione chiara del soggetto.",
        },
        "time-movement": {
          title: "Tempo e movimento",
          outcome:
            "Sai dire quando è avvenuta un'azione e descrivere un breve spostamento con direzione e trasporto.",
        },
      },
    } as const;

    for (const locale of locales) {
      const modules = a1RuntimeModuleCopy(locale);
      const outcomes = a1RuntimeOutcomeCopy(locale);
      for (const [moduleId, copy] of Object.entries(expected[locale])) {
        expect(modules[moduleId]).toEqual({ title: copy.title });
        expect(outcomes[`a1-module-outcome-${moduleId}`]).toBe(copy.outcome);
      }
    }
  });

  it("titles all 64 lessons with stable, localized text", () => {
    for (const locale of locales) {
      const modules = a1RuntimeModuleCopy(locale);
      const lessons = a1RuntimeLessonCopy(locale);
      const allLessonIds = courseModules.flatMap((m) => m.lessons.map((l) => l.id));
      expect(Object.keys(lessons).sort()).toEqual([...allLessonIds].sort());
      for (const module of courseModules) {
        module.lessons.forEach((lesson, index) => {
          const expected =
            foundationLessonTitles[locale][
              module.id as keyof (typeof foundationLessonTitles)[typeof locale]
            ]?.[index] ??
            (module.id === "introductions"
              ? introductionsTitles[locale].lessons[index]
              : `${modules[module.id]!.title} ${index + 1}`);
          expect(lessons[lesson.id]?.title).toBe(expected);
        });
      }
    }
  });

  it("restores introductions as applied scenario practice, with exact localized outcomes and lesson titles", () => {
    for (const locale of locales) {
      const expected = introductionsTitles[locale];
      expect(a1RuntimeModuleCopy(locale).introductions).toEqual({
        title: expected.module,
      });
      expect(
        a1RuntimeOutcomeCopy(locale)["a1-module-outcome-introductions"],
      ).toBe(expected.outcome);
      expect(
        ["introductions-1", "introductions-2", "introductions-3", "introductions-4"].map(
          (lessonId) => a1RuntimeLessonCopy(locale)[lessonId]?.title,
        ),
      ).toEqual(expected.lessons);
    }
  });

  it("resolves exactly the referenced Can-do objective copy ids, non-blank", () => {
    const knownObjectiveIds = new Set(
      courseModules.flatMap((m) => m.lessons.flatMap((l) => l.objectiveCopyIds ?? [])),
    );
    for (const locale of locales) {
      const objectives = a1RuntimeObjectiveCopy(locale);
      expect(new Set(Object.keys(objectives))).toEqual(knownObjectiveIds);
      for (const id of knownObjectiveIds) {
        expect(objectives[id]?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("resolves exactly the referenced module outcome copy ids, non-blank", () => {
    const knownOutcomeIds = new Set(
      courseModules.flatMap((m) => m.outcomeCopyIds ?? []),
    );
    for (const locale of locales) {
      const outcomes = a1RuntimeOutcomeCopy(locale);
      expect(new Set(Object.keys(outcomes))).toEqual(knownOutcomeIds);
      for (const id of knownOutcomeIds) {
        expect(outcomes[id]?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("differs between locales for every module and lesson title", () => {
    const modulesEn = a1RuntimeModuleCopy("en");
    const modulesIt = a1RuntimeModuleCopy("it");
    for (const module of courseModules) {
      expect(modulesEn[module.id]!.title).not.toBe(modulesIt[module.id]!.title);
    }
  });
});

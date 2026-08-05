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
  const foundationsTitles = {
    en: {
      module: "Foundations: sentences and introductions",
      outcome:
        "You can build simple sentences, introduce yourself, and use polite verbs with natural subject omission.",
      lessons: [
        "Sentence shape and identity",
        "Topics, copula, origins and roles",
        "Dictionary and polite verbs",
        "Natural personal reference and exchange",
      ],
    },
    it: {
      module: "Fondamenta: frasi e presentazioni",
      outcome:
        "Sai costruire frasi semplici, presentarti e usare verbi cortesi con l'omissione naturale del soggetto.",
      lessons: [
        "Struttura della frase e identità",
        "Tema, copula, origine e ruolo",
        "Verbi: forma dizionario e forma cortese",
        "Riferimenti personali naturali e scambi",
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
              ? foundationsTitles[locale].lessons[index]
              : `${modules[module.id]!.title} ${index + 1}`);
          expect(lessons[lesson.id]?.title).toBe(expected);
        });
      }
    }
  });

  it("names the introductions module as staged Foundations, with exact localized outcomes and lesson titles", () => {
    for (const locale of locales) {
      const expected = foundationsTitles[locale];
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

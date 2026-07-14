import { describe, expect, it } from "vitest";
import { courseModules } from "./course";
import { examples } from "./examples";
import { loanwords } from "./loanwords";
import { referencedExampleOrder } from "./validate";
import { getCourseCopy } from "../i18n/catalog";
import type { CourseConceptId, GuidedExploration, Lesson } from "./types";

/**
 * Task 6 corrective-redesign suite (design spec §§2.6-2.7, 4.2-4.4, 6.2-6.6,
 * 8.3). Every assertion inspects the *real shipped* course data / bilingual
 * copy so a corrected placement, an honest capstone, or a katakana fix can
 * never silently regress.
 */

const lessons = courseModules.flatMap((module) => module.lessons);

function lesson(id: string): Lesson {
  const found = lessons.find((entry) => entry.id === id);
  if (!found) throw new Error(`lesson ${id} not found`);
  return found;
}

function moduleOfLesson(id: string) {
  const found = courseModules.find((module) =>
    module.lessons.some((entry) => entry.id === id),
  );
  if (!found) throw new Error(`module for lesson ${id} not found`);
  return found;
}

function glyphs(exampleId: string): string[] {
  const example = examples[exampleId];
  if (!example?.segments) return [];
  return example.segments.map((segment) => segment.jp.trim());
}

function comparison(id: string) {
  const section = lesson(id).sections.find((entry) => entry.id === "comparison");
  if (!section || section.id !== "comparison") {
    throw new Error(`comparison section missing for ${id}`);
  }
  return section.comparison;
}

function exploration(id: string): GuidedExploration {
  const section = lesson(id).sections.find((entry) => entry.id === "explore");
  if (!section || section.id !== "explore") {
    throw new Error(`explore section missing for ${id}`);
  }
  return section.exploration;
}

function blockText(
  locale: "en" | "it",
  copyIds: readonly string[],
): string {
  const copy = getCourseCopy(locale);
  return copyIds
    .map((copyId) => {
      const block = copy.blocks[copyId];
      return [block.title, block.body, ...(block.bullets ?? [])]
        .filter(Boolean)
        .join(" ");
    })
    .join(" ");
}

/**
 * Forward-looking structural view of a (possibly multi-scene) capstone
 * exploration. Written structurally so the real-data RED assertions compile
 * against today's single-transformation data and stay honest once the typed
 * `journey` variant ships. No engine logic is bypassed — it only reads shape.
 */
interface SceneView {
  readonly transformation: {
    readonly initialSelection: { readonly exampleId?: string };
    readonly targetSelection: { readonly exampleId?: string };
    readonly changedGearIds: readonly string[];
  };
}

function capstoneScenes(): readonly SceneView[] {
  const exp = exploration("traps-verbs");
  if (String(exp.kind) !== "journey") return [];
  const data = exp.data as { scenes?: readonly SceneView[] };
  return data.scenes ?? [];
}

const FAMILY_GEARS: Record<string, readonly string[]> = {
  time: ["あした", "きょう", "きのう"],
  request: ["ください"],
  movement: ["に"],
  place: ["で"],
  people: ["と"],
  desire: ["たいです", "たい"],
  invitation: ["ましょう"],
  question: ["か"],
  existence: ["あり", "あります", "い", "います"],
};

function familiesCovered(gears: ReadonlySet<string>): string[] {
  return Object.entries(FAMILY_GEARS)
    .filter(([, reps]) => reps.some((rep) => gears.has(rep)))
    .map(([family]) => family);
}

describe("Issue 1 — Module 5 teaches で/に/へ; Module 7 is questions/existence", () => {
  it("Module 5 places-movement introduces destination-ni AND direction-e", () => {
    const introduced = [...lesson("places-movement").introducedConceptIds];
    expect(introduced).toContain("destination-ni");
    expect(introduced).toContain("direction-e");
  });

  it("Module 5 (places) teaches every one of で, に and へ across its lessons", () => {
    const module = moduleOfLesson("places-movement");
    const introduced = module.lessons.flatMap((entry) => [
      ...entry.introducedConceptIds,
    ]);
    expect(introduced).toContain("particle-de");
    expect(introduced).toContain("destination-ni");
    expect(introduced).toContain("direction-e");
  });

  it("Module 5 places-movement copy contrasts に with へ in both locales", () => {
    for (const locale of ["en", "it"] as const) {
      const copy = getCourseCopy(locale);
      expect(copy.objectives["places-movement"]).toMatch(/へ/);
      const text = blockText(locale, [
        "places-movement-rule",
        "places-movement-comparison",
        "places-movement-explore",
        "places-movement-recap",
      ]);
      expect(text).toMatch(/に/);
      expect(text).toMatch(/へ/);
    }
  });

  it("Module 7 traps-particles introduces nothing and only uses the question/existence family", () => {
    const target = lesson("traps-particles");
    expect([...target.introducedConceptIds]).toEqual([]);
    const approved: CourseConceptId[] = [
      "question-ka",
      "existence-arimasu",
      "existence-imasu",
      "subject-ga",
    ];
    const used = [
      ...target.introducedConceptIds,
      ...target.requiredConceptIds,
    ];
    for (const concept of used) {
      expect(approved).toContain(concept);
    }
    for (const forbidden of [
      "destination-ni",
      "direction-e",
      "person-ni",
    ] as CourseConceptId[]) {
      expect(used).not.toContain(forbidden);
    }
  });

  it("Module 7 traps-particles never uses movement/direction gears (へ/に)", () => {
    const gears = new Set<string>([...comparison("traps-particles").changedGearIds]);
    const exp = exploration("traps-particles");
    if (exp.kind === "transformation") {
      for (const gear of exp.data.changedGearIds) gears.add(gear);
    }
    expect(gears.has("へ")).toBe(false);
    expect(gears.has("に")).toBe(false);
    const usesQuestionOrExistence = [...gears].some((gear) =>
      ["か", "あり", "あります", "い", "います"].includes(gear),
    );
    expect(usesQuestionOrExistence).toBe(true);
  });

  it("Module 7 traps-particles guided objective asks whether a thing/person exists", () => {
    const exp = exploration("traps-particles");
    expect(exp.kind).toBe("transformation");
    if (exp.kind !== "transformation") return;
    const initial = exp.data.initialSelection;
    const target = exp.data.targetSelection;
    expect("exampleId" in initial && "exampleId" in target).toBe(true);
    if (!("exampleId" in initial) || !("exampleId" in target)) return;
    const initialGlyphs = glyphs(initial.exampleId);
    const targetGlyphs = glyphs(target.exampleId);
    expect(initialGlyphs).toContain("か");
    expect(targetGlyphs).toContain("か");
    expect(
      initialGlyphs.some((gear) => ["あり", "あります"].includes(gear)),
    ).toBe(true);
    expect(targetGlyphs.some((gear) => ["い", "います"].includes(gear))).toBe(
      true,
    );
  });

  it("Module 7 title, outcomes and traps-particles copy drop direction claims", () => {
    const module = moduleOfLesson("traps-particles");
    for (const locale of ["en", "it"] as const) {
      const copy = getCourseCopy(locale);
      expect(copy.modules[module.id].title).not.toMatch(
        /direction|direzione|へ/i,
      );
      const outcomes = module.outcomeCopyIds
        .map((outcomeId) => copy.outcomes[outcomeId])
        .join(" ");
      expect(outcomes).not.toMatch(/へ/);
      const text = blockText(locale, [
        "traps-particles-rule",
        "traps-particles-comparison",
        "traps-particles-explore",
        "traps-particles-recap",
      ]);
      expect(text).not.toMatch(/へ|direction|direzione|movement|movimento/i);
      expect(copy.objectives["traps-particles"]).not.toMatch(
        /へ|direction|direzione/i,
      );
    }
  });
});

describe("Issue 2 — genuine day-in-travel capstone", () => {
  it("keeps introducedConceptIds empty but requires every recombined family", () => {
    const capstone = lesson("traps-verbs");
    expect([...capstone.introducedConceptIds]).toEqual([]);
    const required = new Set<CourseConceptId>([...capstone.requiredConceptIds]);
    for (const concept of [
      "request-kudasai",
      "particle-de",
      "destination-ni",
      "with-to",
      "desire-tai",
      "volitional-mashou",
      "question-ka",
      "existence-arimasu",
      "object-o",
      "polite-masu",
    ] as CourseConceptId[]) {
      expect(required.has(concept)).toBe(true);
    }
  });

  it("comparison is a multi-gear transformation spanning >=4 prior families (not time-only)", () => {
    const gears = new Set<string>([...comparison("traps-verbs").changedGearIds]);
    const families = familiesCovered(gears);
    expect(families).toContain("time");
    expect(families).toContain("place");
    expect(families).toContain("people");
    expect(families).toContain("desire");
    expect(families.length).toBeGreaterThanOrEqual(4);
    const timeOnly = [...gears].every((gear) =>
      FAMILY_GEARS.time.includes(gear),
    );
    expect(timeOnly).toBe(false);
  });

  it("exploration is a multi-scene journey of honest transformations", () => {
    expect(String(exploration("traps-verbs").kind)).toBe("journey");
    const scenes = capstoneScenes();
    expect(scenes.length).toBeGreaterThanOrEqual(4);
    for (const scene of scenes) {
      expect(scene.transformation.changedGearIds.length).toBeGreaterThan(0);
    }
  });

  it("capstone surface recombines time, request, movement, place, people, desire, invitation, question, existence", () => {
    const gears = new Set<string>(glyphs(comparison("traps-verbs").changedExampleId));
    for (const scene of capstoneScenes()) {
      for (const selection of [
        scene.transformation.initialSelection,
        scene.transformation.targetSelection,
      ]) {
        if (selection.exampleId) {
          for (const gear of glyphs(selection.exampleId)) gears.add(gear);
        }
      }
    }
    for (const [family, reps] of Object.entries(FAMILY_GEARS)) {
      expect({ family, covered: reps.some((rep) => gears.has(rep)) }).toEqual({
        family,
        covered: true,
      });
    }
  });

  it("a sentence containing only で/と/を/ます fails capstone family coverage", () => {
    const gears = new Set<string>(["で", "と", "を", "ます"]);
    expect(familiesCovered(gears).length).toBeLessThan(
      Object.keys(FAMILY_GEARS).length,
    );
  });
});

describe("Issue 3 — standard katakana after first exposure", () => {
  const hiraganaForms = new Map<string, string>();
  const katakanaForms = new Map<string, string>();
  for (const loanword of Object.values(loanwords)) {
    hiraganaForms.set(loanword.hiragana, loanword.id);
    katakanaForms.set(loanword.katakana, loanword.hiragana);
  }

  it("no learner-visible referenced example spells a registered loanword in bare hiragana", () => {
    const violations: string[] = [];
    for (const exampleId of referencedExampleOrder(courseModules)) {
      const example = examples[exampleId];
      if (!example?.segments) continue;
      for (const segment of example.segments) {
        const jp = segment.jp.trim();
        if (hiraganaForms.has(jp)) violations.push(`${exampleId}:${jp}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("every referenced katakana loanword keeps its explicit hiragana reading", () => {
    const missing: string[] = [];
    for (const exampleId of referencedExampleOrder(courseModules)) {
      const example = examples[exampleId];
      if (!example?.segments) continue;
      for (const segment of example.segments) {
        const jp = segment.jp.trim();
        const expectedReading = katakanaForms.get(jp);
        if (expectedReading && segment.reading?.trim() !== expectedReading) {
          missing.push(`${exampleId}:${jp}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

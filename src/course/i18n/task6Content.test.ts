import { describe, expect, it } from "vitest";
import { it as itCopy } from "./it";
import { en as enCopy } from "./en";
import type { CourseCopy } from "./types";
import { examples } from "../data/examples";
import { courseModules } from "../data/course";
import type { Lesson, TransformComparisonData } from "../data/types";

/**
 * Task 6 regression suite (design spec §§2.6-2.7, 4.2-4.4, 6.2-6.6, 8.3).
 *
 * These tests inspect the *real shipped* bilingual copy and course data — not
 * synthetic fixtures — so an approved linguistic correction can never silently
 * regress. The synthetic validator negatives live in their own files
 * (validateConceptOrder / validateLoanwordExposure / objectiveAlignment).
 */

const COURSE_DICTS = [
  "modules",
  "lessons",
  "objectives",
  "outcomes",
  "blocks",
  "examples",
] as const;

/** Flatten every localized string a learner can read in the course content. */
function courseCopyStrings(copy: CourseCopy): string[] {
  const out: string[] = [];
  for (const dict of COURSE_DICTS) {
    const table = copy[dict] as Record<string, unknown>;
    for (const entry of Object.values(table)) {
      if (typeof entry === "string") {
        // string-valued dictionaries (objectives, outcomes)
        out.push(entry);
        continue;
      }
      if (!entry || typeof entry !== "object") continue;
      for (const value of Object.values(entry)) {
        if (typeof value === "string") out.push(value);
        else if (Array.isArray(value)) {
          for (const bullet of value) {
            if (typeof bullet === "string") out.push(bullet);
          }
        }
      }
    }
  }
  return out;
}

const allShippedStrings = [
  ...courseCopyStrings(itCopy),
  ...courseCopyStrings(enCopy),
];

const lessons = courseModules.flatMap((module) => module.lessons);

function lesson(id: string): Lesson {
  const found = lessons.find((entry) => entry.id === id);
  if (!found) throw new Error(`lesson ${id} not found`);
  return found;
}

function comparisonOf(id: string): TransformComparisonData {
  const section = lesson(id).sections.find((s) => s.id === "comparison");
  if (!section || section.id !== "comparison") {
    throw new Error(`comparison section missing for ${id}`);
  }
  return section.comparison;
}

function explorationGears(id: string): readonly string[] {
  const section = lesson(id).sections.find((s) => s.id === "explore");
  if (!section || section.id !== "explore") {
    throw new Error(`explore section missing for ${id}`);
  }
  const exploration = section.exploration;
  if (exploration.kind !== "transformation") {
    throw new Error(`explore section for ${id} is not a transformation`);
  }
  return exploration.data.changedGearIds;
}

function recapBullets(copy: CourseCopy, copyId: string): string[] {
  return copy.blocks[copyId]?.bullets ?? [];
}

describe("Task 6 — copula / topic sentence (Module 2)", () => {
  it("renders これはみずです as one continuous string with no spaces", () => {
    expect(examples["this-is-water"].jp).toBe("これはみずです");
    expect(examples["this-is-water"].jp).not.toMatch(/\s/);
    // the earlier copula example must also render continuously
    expect(examples["it-is-water"].jp).toBe("みずです");
  });

  it("translates the demonstrative water sentence with natural Italian", () => {
    expect(itCopy.examples["this-is-water"].translation).toBe("Questa è acqua.");
    expect(itCopy.examples["it-is-water"].translation).toBe("È acqua.");
    expect(enCopy.examples["this-is-water"].translation).toBe("This is water.");
    // the unnatural copula-partitive "è dell'acqua" must be gone everywhere
    // (the partitive object "bevo dell'acqua" stays natural and is allowed)
    for (const value of allShippedStrings) {
      expect(value).not.toMatch(/è dell'acqua/i);
    }
  });

  it("keeps Module 2 free of を and polite ます in its shipped copy", () => {
    for (const copyId of [
      "sentence-order-rule",
      "sentence-order-comparison",
      "sentence-order-recap",
      "sentence-omission-rule",
      "sentence-omission-comparison",
      "sentence-omission-recap",
    ]) {
      for (const copy of [itCopy, enCopy]) {
        const block = copy.blocks[copyId];
        const text = [block.title, block.body, ...(block.bullets ?? [])]
          .filter(Boolean)
          .join(" ");
        expect(text).not.toMatch(/を/);
        expect(text).not.toMatch(/ます/);
      }
    }
  });
});

describe("Task 6 — order / request (Module 3)", () => {
  it("actions-object introduces を against a bare-verb baseline", () => {
    const comparison = comparisonOf("actions-object");
    expect(comparison.baseExampleId).toBe("eat-masu");
    expect(comparison.changedExampleId).toBe("order-ramen-eat");
    expect([...comparison.changedGearIds]).toContain("を");
    // the changed example must render continuously (no visible gaps)
    expect(examples[comparison.changedExampleId].jp).not.toMatch(/\s/);
  });

  it("actions-masu guided objective actually forms a ください request", () => {
    const comparison = comparisonOf("actions-masu");
    expect([...comparison.changedGearIds]).toContain("ください");
    expect([...explorationGears("actions-masu")]).toContain("ください");
    // and it never falls back to a dictionary-form baseline to explain ます
    for (const copy of [itCopy, enCopy]) {
      const block = copy.blocks["actions-masu-comparison"];
      const text = [block.title, block.body].filter(Boolean).join(" ");
      expect(text).not.toMatch(/たべる/);
    }
  });

  it("teaches requests in Module 3, not Module 7", () => {
    // the order/request module owns ください…
    expect(itCopy.outcomes.actions).toMatch(/ください/);
    expect(enCopy.outcomes.actions).toMatch(/ください/);
    // …and the questions/existence module no longer claims requests
    for (const copy of [itCopy, enCopy]) {
      expect(copy.outcomes["questions-existence"]).not.toMatch(/ください/);
      expect(copy.modules["questions-existence"].title).not.toMatch(
        /richieste|requests/i,
      );
    }
  });
});

describe("Task 6 — precise non-past wording (Module 4)", () => {
  it("never calls the ます-form a dedicated future tense", () => {
    for (const value of allShippedStrings) {
      expect(value).not.toMatch(/future tense|tempo futuro/i);
      expect(value).not.toMatch(/dedicated future|futuro dedicato/i);
      expect(value).not.toMatch(/future still uses|futuro usa ancora/i);
    }
  });

  it("explains ます as non-past with future coming from context", () => {
    const itRecap = recapBullets(itCopy, "time-past-recap").join(" ");
    const enRecap = recapBullets(enCopy, "time-past-recap").join(" ");
    expect(itRecap).toMatch(/non-passato/);
    expect(itRecap).toMatch(/contesto/);
    expect(enRecap).toMatch(/non-past/);
    expect(enRecap).toMatch(/context/);
  });
});

describe("Task 6 — invitations (Module 6)", () => {
  it("distinguishes ましょう (proposal) from ましょうか (tentative offer)", () => {
    for (const copy of [itCopy, enCopy]) {
      const bullets = recapBullets(copy, "people-desire-recap").join("\n");
      expect(bullets).toMatch(/ましょうか/);
      // a standalone ましょう not immediately followed by か must also appear
      expect(bullets).toMatch(/ましょう(?!か)/);
    }
    const itBullets = recapBullets(itCopy, "people-desire-recap").join(" ");
    expect(itBullets).toMatch(/proposta|facciamo|andiamo/i);
    expect(itBullets).toMatch(/offerta|tentativ/i);
    const enBullets = recapBullets(enCopy, "people-desire-recap").join(" ");
    expect(enBullets).toMatch(/suggestion|let's/i);
    expect(enBullets).toMatch(/offer|tentative/i);
  });
});

describe("Task 6 — questions / existence (Module 7)", () => {
  it("forms a real question objective (adds か), not a request", () => {
    const comparison = comparisonOf("travel-questions");
    expect([...comparison.changedGearIds]).toContain("か");
    for (const copy of [itCopy, enCopy]) {
      for (const copyId of [
        "travel-questions-rule",
        "travel-questions-comparison",
        "travel-questions-explore",
        "travel-questions-recap",
      ]) {
        const block = copy.blocks[copyId];
        const text = [block.title, block.body, ...(block.bullets ?? [])]
          .filter(Boolean)
          .join(" ");
        expect(text).not.toMatch(/ください/);
      }
      expect(copy.objectives["travel-questions"]).not.toMatch(/ください/);
    }
  });

  it("existence contrast shows the standard katakana トイレ, not hiragana", () => {
    const comparison = comparisonOf("travel-existence");
    expect(examples[comparison.baseExampleId].jp).toMatch(/トイレ/);
    for (const copy of [itCopy, enCopy]) {
      expect(copy.blocks["travel-existence-comparison"].body).toMatch(/トイレ/);
      expect(copy.blocks["travel-existence-comparison"].body).not.toMatch(
        /といれ/,
      );
    }
  });

  it("consolidates question + existence (か / あります / います) with no direction or trap claims", () => {
    const target = lesson("traps-particles");
    expect([...target.introducedConceptIds]).toEqual([]);
    const comparisonGears = [...comparisonOf("traps-particles").changedGearIds];
    const guidedGears = [...explorationGears("traps-particles")];
    const allGears = new Set([...comparisonGears, ...guidedGears]);
    expect(allGears.has("へ")).toBe(false);
    expect(allGears.has("に")).toBe(false);
    expect(
      [...allGears].some((gear) =>
        ["か", "あり", "あります", "い", "います"].includes(gear),
      ),
    ).toBe(true);
    for (const copy of [itCopy, enCopy]) {
      for (const copyId of [
        "traps-particles-rule",
        "traps-particles-comparison",
        "traps-particles-explore",
        "traps-particles-recap",
      ]) {
        const block = copy.blocks[copyId];
        const text = [block.title, block.body, ...(block.bullets ?? [])]
          .filter(Boolean)
          .join(" ");
        expect(text).not.toMatch(/へ|direction|direzione|movement|movimento/i);
      }
    }
  });
});

describe("Task 6 — synthesis capstone (Module 8)", () => {
  it("recombines multiple gears rather than adding a lone time word", () => {
    const comparison = comparisonOf("traps-verbs");
    const gears = [...comparison.changedGearIds];
    expect(new Set(gears).size).toBeGreaterThanOrEqual(3);
    // spans place (で), companion (と) and desire (たいです) — a genuine
    // multi-gear day, not merely a time expression bolted onto one sentence.
    expect(gears).toContain("で");
    expect(gears).toContain("と");
    expect(gears).toContain("たいです");
    const timeWordsOnly = gears.every((gear) =>
      ["あした", "きょう", "きのう"].includes(gear),
    );
    expect(timeWordsOnly).toBe(false);
  });

  it("demonstrates the day as a multi-scene guided journey, not one sentence", () => {
    const section = lesson("traps-verbs").sections.find(
      (s) => s.id === "explore",
    );
    if (!section || section.id !== "explore") {
      throw new Error("explore section missing for traps-verbs");
    }
    expect(section.exploration.kind).toBe("journey");
    if (section.exploration.kind !== "journey") return;
    expect(section.exploration.data.scenes.length).toBeGreaterThanOrEqual(4);
  });

  it("introduces no new foundational grammar in the capstone", () => {
    expect([...lesson("traps-verbs").introducedConceptIds]).toEqual([]);
  });
});

describe("Task 6 — no stale instructional claims", () => {
  it("ships no chapter / trap / mastery / godan / completion claims", () => {
    for (const value of allShippedStrings) {
      expect(value).not.toMatch(/godan|ichidan/i);
      expect(value).not.toMatch(/\bchapters?\b|capitolo|capitoli/i);
      expect(value).not.toMatch(/\btraps?\b|trappol/i);
      expect(value).not.toMatch(/mastery|padronanz/i);
      expect(value).not.toMatch(/\bcompletion\b|completament/i);
    }
  });
});

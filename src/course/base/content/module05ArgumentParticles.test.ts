import { describe, expect, it } from "vitest";
import { BASE_FIRST_TEACH_OWNERS, firstTeachLessonPosition } from "../catalog/firstTeach";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  baseParticleSurfaceTokens,
  validateParticleFrame,
} from "../forms/particleLicensing";
import { visibleSurfaceFingerprint } from "../validation/fingerprints";
import { validateBaseLessonDepth } from "../validation/lessonRules";
import { validateFirstTeachOrder } from "../validation/sequenceRules";
import {
  BASE_ARGUMENT_PARTICLES_LESSONS,
  BASE_ARGUMENT_PARTICLES_MODULE,
  BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
  validateBaseArgumentParticlesModule,
} from "./module05ArgumentParticles";

function jp(tokens: readonly { readonly jp: string }[]): string {
  return tokens.map(({ jp }) => jp).join("");
}

function targetsForLesson(
  lesson: typeof BASE_ARGUMENT_PARTICLES_MODULE.lessons[number],
) {
  return [
    ...lesson.examples,
    ...(lesson.dialogue?.turns ?? []),
    ...lesson.activityDesigns.flatMap(({ promptTarget, optionTargets, acceptedAnswerTarget }) => [
      promptTarget,
      ...optionTargets,
      acceptedAnswerTarget,
    ]),
  ];
}

describe("Base argument-particles module", () => {
  it("publishes four system lessons in the exact canonical order", () => {
    expect(
      BASE_ARGUMENT_PARTICLES_LESSONS.map(
        ({ lessonId, contract, prerequisiteLessonIds }) => [
          lessonId,
          contract,
          prerequisiteLessonIds,
        ],
      ),
    ).toEqual([
      ["argument-particles-1", "system", ["polite-verbs-4"]],
      ["argument-particles-2", "system", ["argument-particles-1"]],
      ["argument-particles-3", "system", ["argument-particles-2"]],
      ["argument-particles-4", "system", ["argument-particles-3"]],
    ]);
  });

  it("meets all depth, sequence, density, and 8+2 practice gates", () => {
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      expect(
        validateBaseLessonDepth(
          lesson.content,
          BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
        ),
        lesson.content.lessonId,
      ).toEqual([]);
      expect(lesson.examples.length).toBeGreaterThanOrEqual(10);
      expect(lesson.examples.length).toBeLessThanOrEqual(14);
      expect(lesson.activityDesigns).toHaveLength(10);
      expect(
        new Set(
          lesson.activityDesigns
            .filter(({ mode }) => mode === "non-spoken")
            .map(({ category }) => category),
        ).size,
      ).toBeGreaterThanOrEqual(6);
    }
    expect(
      validateFirstTeachOrder(
        BASE_ARGUMENT_PARTICLES_MODULE.sequence,
        BASE_FIRST_TEACH_OWNERS,
        BASE_ARGUMENT_PARTICLES_VALIDATION_CATALOGS,
      ),
    ).toEqual([]);
    expect(validateBaseArgumentParticlesModule(BASE_ARGUMENT_PARTICLES_MODULE)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("publishes canonical particle pronunciation", () => {
    expect(baseParticleSurfaceTokens("object-o")).toMatchObject([
      { jp: "を", romaji: "o" },
    ]);
    expect(baseParticleSurfaceTokens("direction-he")).toMatchObject([
      { jp: "へ", romaji: "e" },
    ]);
  });

  it("cites and licenses every governed visible particle by predicate sense and role", () => {
    const governed = new Set([
      "object-o",
      "goal-ni",
      "direction-he",
      "action-place-de",
      "means-de",
    ]);
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      for (const target of targetsForLesson(lesson)) {
        const visibleGoverned = target.tokens
          .filter(
            ({ kind, source }) =>
              kind === "particle" && governed.has(source.referenceId),
          )
          .map(({ source }) => source.referenceId);
        if (visibleGoverned.length === 0) continue;
        expect(target.particleFrame, jp(target.tokens)).toBeDefined();
        expect(target.predicateSenseId).toBe(target.particleFrame?.predicateSenseId);
        expect(target.predicateLexemeId).toBeTypeOf("string");
        expect(target.lexemeIds).toContain(target.predicateLexemeId);
        expect(
          validateParticleFrame(
            target.particleFrame?.predicateSenseId,
            target.particleFrame?.provided,
          ),
          jp(target.tokens),
        ).toMatchObject({ ok: true });
        for (const role of Object.keys(target.particleFrame?.provided ?? {})) {
          expect(target.semanticRoleIds).toContain(
            role === "action-place" ? "location" : role,
          );
        }
      }
    }
  });

  it("teaches transitive theme o and a licensed topicalized theme", () => {
    const lesson = BASE_ARGUMENT_PARTICLES_MODULE.lessons[0];
    expect(lesson.examples.some(({ tokens }) => jp(tokens).includes("を"))).toBe(true);
    expect(
      lesson.examples.some(
        ({ patternCellIds, tokens, semanticRoleIds, predicateSenseId }) =>
          patternCellIds.includes("ap1-topicalized-theme-wa") &&
          jp(tokens).includes("は") &&
          semanticRoleIds.includes("theme") &&
          predicateSenseId !== null,
      ),
    ).toBe(true);
  });

  it("distinguishes exact goal ni, direction e, action-place de, and means de senses", () => {
    const l2 = BASE_ARGUMENT_PARTICLES_MODULE.lessons[1].examples;
    expect(l2.some(({ tokens }) => jp(tokens).includes("に"))).toBe(true);
    expect(l2.some(({ tokens }) => jp(tokens).includes("へ"))).toBe(true);
    expect(
      new Set(
        l2.flatMap(({ particleFrame }) =>
          particleFrame ? [particleFrame.predicateSenseId] : [],
        ),
      ).size,
    ).toBeGreaterThanOrEqual(4);

    const l3 = BASE_ARGUMENT_PARTICLES_MODULE.lessons[2].examples;
    expect(
      l3.some(({ particleFrame }) =>
        Object.values(particleFrame?.provided ?? {}).includes("action-place-de"),
      ),
    ).toBe(true);
    expect(
      l3.some(({ particleFrame }) =>
        Object.values(particleFrame?.provided ?? {}).includes("means-de"),
      ),
    ).toBe(true);
  });

  it("rejects wrong particles instead of accepting cosmetic swaps", () => {
    expect(validateParticleFrame("eat", { theme: "goal-ni" })).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "unlicensed-particle" })],
    });
    expect(validateParticleFrame("go-goal", { goal: "direction-he" })).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "unlicensed-particle" })],
    });
    expect(validateParticleFrame("go-direction", { goal: "goal-ni" })).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "unlicensed-particle" })],
    });
    expect(validateParticleFrame("study-place", { "action-place": "means-de" })).toMatchObject({
      ok: false,
      errors: [expect.objectContaining({ code: "unlicensed-particle" })],
    });
  });

  it("places verb classes before licensed argument teaching", () => {
    const owner = (contentId: string) =>
      BASE_FIRST_TEACH_OWNERS.find(({ contentId: id }) => id === contentId)?.lessonId;
    const classes = ["godan-verb-class", "ichidan-verb-class", "polite-stems", "masu-nonpast"];
    const arguments_ = ["licensed-object-o", "goal-ni", "direction-he", "action-place-de", "means-de"];
    for (const argument of arguments_) {
      for (const klass of classes) {
        expect(firstTeachLessonPosition(owner(klass)!)!).toBeLessThan(
          firstTeachLessonPosition(owner(argument)!)!,
        );
      }
    }
  });

  it("advances particle references only when their predicate frames are owned", () => {
    expect(
      BASE_ARGUMENT_PARTICLES_MODULE.lessons.map(
        ({ content }) => content.referenceSnapshotIds,
      ),
    ).toEqual([
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation"],
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation"],
      ["sentence-anatomy", "particle-atlas", "verb-classes-conjugation"],
      [
        "sentence-anatomy",
        "particle-atlas",
        "verb-classes-conjugation",
        "reference-particle-frames",
      ],
    ]);
  });

  it("contains no future forms, te forms, adjectives, or ongoing-now readings", () => {
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      for (const target of targetsForLesson(lesson)) {
        expect(target.formIds).toEqual(
          expect.not.arrayContaining(["four-polite-tense-cells", "te-imasu"]),
        );
        expect(target.interpretationTags).not.toContain("ongoing-now");
        expect(jp(target.tokens)).not.toContain("ています");
        expect(target.predicateAspect).not.toBe("adjectival");
      }
    }
  });

  it("publishes natural copy and keeps accepted targets distinct from demonstrations", () => {
    for (const lesson of BASE_ARGUMENT_PARTICLES_MODULE.lessons) {
      const ids = [
        lesson.titleCopyId,
        lesson.objectiveCopyId,
        lesson.content.recapCopyId,
        ...Object.values(lesson.explanation),
        ...lesson.examples.flatMap((example) => [
          example.teachingPurposeCopyId,
          "copyId" in example.translationCopy ? example.translationCopy.copyId : "",
        ]),
        ...lesson.activityDesigns.map(({ promptContextCopyId }) => promptContextCopyId),
        ...lesson.content.activities.flatMap((activity) => [
          activity.instructionCopyId,
          activity.acceptedFeedbackCopyId,
          activity.retryFeedbackCopyId,
        ]),
      ];
      for (const id of ids) {
        expect(baseNavigationCopyEn.content[id], `EN:${id}`).toBeTypeOf("string");
        expect(baseNavigationCopyIt.content[id], `IT:${id}`).toBeTypeOf("string");
      }
      const demos = new Set(
        lesson.examples.map(({ tokens }) => visibleSurfaceFingerprint(tokens)),
      );
      for (const { acceptedAnswerTarget } of lesson.activityDesigns) {
        expect(demos.has(visibleSurfaceFingerprint(acceptedAnswerTarget.tokens))).toBe(false);
      }
    }
  });

  it("fails closed on getters, sparse arrays, prototypes, and unknown IDs", () => {
    expect(Object.isFrozen(BASE_ARGUMENT_PARTICLES_MODULE)).toBe(true);
    const getter = {
      id: "argument-particles",
      get lessons() {
        return BASE_ARGUMENT_PARTICLES_MODULE.lessons;
      },
      sequence: BASE_ARGUMENT_PARTICLES_MODULE.sequence,
      worldFacts: BASE_ARGUMENT_PARTICLES_MODULE.worldFacts,
      worldFactIds: BASE_ARGUMENT_PARTICLES_MODULE.worldFactIds,
      worldFactLedger: BASE_ARGUMENT_PARTICLES_MODULE.worldFactLedger,
    };
    expect(validateBaseArgumentParticlesModule(getter)).toMatchObject({ ok: false });
    const sparse = [...BASE_ARGUMENT_PARTICLES_MODULE.lessons];
    delete (sparse as unknown[])[2];
    expect(
      validateBaseArgumentParticlesModule({
        ...BASE_ARGUMENT_PARTICLES_MODULE,
        lessons: sparse,
      }),
    ).toMatchObject({ ok: false });

    const wrongParticle = structuredClone(BASE_ARGUMENT_PARTICLES_MODULE);
    (
      wrongParticle.lessons[0].examples[0].particleFrame!.provided as {
        theme: string;
      }
    ).theme = "goal-ni";
    expect(validateBaseArgumentParticlesModule(wrongParticle)).toEqual({
      ok: false,
      errors: ["invalid-module-shape"],
    });
  });
});

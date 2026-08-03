import { describe, expect, it } from "vitest";

import type { Locale } from "../../i18n/LocaleContext";
import type { AssembledToken } from "../../romaji/types";
import {
  buildFoundationLessonViewModel,
  foundationComparisonTokenIds,
} from "./foundationViewModel";
import {
  buildLessonViewModel,
  type FoundationCopy,
  type FoundationLessonViewModel,
  type FoundationLessonViewModelResult,
} from "./buildLessonViewModel";
import {
  FOUNDATION_FIXTURE_LESSON_IDS,
  foundationCatalogs,
  foundationCopy,
  foundationLessons,
} from "./fixtures";
import type { FoundationCatalogs } from "./types";

const SEED = "phase1-foundation-preview-v1";
const CATALOG_VERSION = "phase1-foundation-fixture-v1";

/** The two authored fixture lessons, exercised as a matrix over locales. */
const LESSON_IDS = FOUNDATION_FIXTURE_LESSON_IDS;
const LOCALES: readonly Locale[] = ["en", "it"];
const SEEDS: readonly string[] = [SEED, "phase1-foundation-preview-alt-seed"];

function comparisonToken(
  id: string,
  jp: string,
  romaji: string,
  kind: AssembledToken["kind"],
  domain: AssembledToken["source"]["domain"],
  referenceId: string,
): AssembledToken {
  return {
    id,
    jp,
    romaji,
    kind,
    boundaryBefore: "attach",
    source: { domain, referenceId },
  };
}

function comparisonFixture() {
  const variant = foundationCatalogs.sentenceVariants.find(
    (candidate) => candidate.id === "fixture-a1-yuki-student-meeting",
  );
  if (!variant) throw new Error("missing comparison fixture variant");
  const family = foundationCatalogs.sentenceFamilies.find(
    (candidate) => candidate.id === variant.sentenceFamilyId,
  );
  if (!family) throw new Error("missing comparison fixture family");

  const variantWithoutObject = {
    ...variant,
    slotValues: {
      subject: "fixture-value-yuki",
      predicate: "fixture-a1-value-be",
    },
  };
  const prefix = variant.id;
  const tokens = [
    comparisonToken(
      "slot-subject-1",
      "わた",
      "wata",
      "lexical",
      "family",
      `${prefix}/subject`,
    ),
    comparisonToken(
      "rule-particle",
      "は",
      "wa",
      "particle",
      "family",
      `${prefix}/rule/topic`,
    ),
    comparisonToken(
      "slot-subject-2",
      "し",
      "shi",
      "lexical",
      "family",
      `${prefix}/subject`,
    ),
    comparisonToken(
      "slot-predicate",
      "です",
      "desu",
      "morpheme",
      "family",
      `${prefix}/predicate`,
    ),
    comparisonToken(
      "absent-authored-slot",
      "がくせい",
      "gakusei",
      "lexical",
      "family",
      `${prefix}/object`,
    ),
    comparisonToken(
      "rule-ending",
      "ます",
      "masu",
      "morpheme",
      "family",
      `${prefix}/rule/ending`,
    ),
    comparisonToken(
      "rule-punctuation",
      "。",
      ".",
      "punctuation",
      "family",
      `${prefix}/rule/punctuation`,
    ),
    comparisonToken(
      "different-variant",
      "けん",
      "ken",
      "lexical",
      "family",
      "fixture-a1-ken-doctor-meeting/subject",
    ),
    comparisonToken(
      "unknown-slot",
      "なぞ",
      "nazo",
      "lexical",
      "family",
      `${prefix}/unknown`,
    ),
    comparisonToken(
      "malformed-reference",
      "こわれた",
      "kowareta",
      "lexical",
      "family",
      `${prefix}/subject/extra`,
    ),
    comparisonToken(
      "non-family-source",
      "こてい",
      "kotei",
      "lexical",
      "catalog",
      `${prefix}/subject`,
    ),
  ] as const;

  return { family, variant: variantWithoutObject, tokens };
}

function lessonById(id: string) {
  const lesson = foundationLessons.find((l) => l.id === id);
  if (!lesson) throw new Error(`missing lesson ${id}`);
  return lesson;
}

/**
 * A structural, order-preserving projection of a view model that drops the two
 * live resolver closures (`tokensForExample`, `tokenForTile`) so two
 * independent builds can be compared with `toEqual` — every semantic field
 * (matrix rows, guided delta, selected targets, prompts, localized copy) is
 * retained.
 */
function serializable(model: FoundationLessonViewModel): unknown {
  const { tokensForExample: _t, tokenForTile: _f, ...rest } = model;
  return rest;
}

function modelOf(result: FoundationLessonViewModelResult): FoundationLessonViewModel {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}`);
  return result.model;
}

/** Reverses every catalog array in place-free fashion — same members, new order. */
function reorderedCatalogs(catalogs: FoundationCatalogs): FoundationCatalogs {
  const rev = <T>(items: readonly T[]): readonly T[] => [...items].reverse();
  return {
    levels: rev(catalogs.levels),
    modules: rev(catalogs.modules),
    checkpoints: rev(catalogs.checkpoints),
    canDos: rev(catalogs.canDos),
    contexts: rev(catalogs.contexts),
    personRoles: rev(catalogs.personRoles),
    referents: rev(catalogs.referents),
    learningTargetSenses: rev(catalogs.learningTargetSenses),
    semanticValues: rev(catalogs.semanticValues),
    sentenceFamilies: rev(catalogs.sentenceFamilies),
    sentenceVariants: rev(catalogs.sentenceVariants),
    lessons: rev(catalogs.lessons),
    lessonPositions: rev(catalogs.lessonPositions),
    verbUseRecords: rev(catalogs.verbUseRecords),
  };
}

/** Rebuilds the copy with every locale's key order reversed — same entries. */
function reorderedCopy(copy: FoundationCopy): FoundationCopy {
  const revKeys = (record: Readonly<Record<string, string>>): Record<string, string> =>
    Object.fromEntries(Object.entries(record).reverse());
  return { en: revKeys(copy.en), it: revKeys(copy.it) };
}

describe("foundationComparisonTokenIds", () => {
  it("returns exactly authored family-slot fragments in realized token order", () => {
    const { family, variant, tokens } = comparisonFixture();

    expect(foundationComparisonTokenIds(family, variant, tokens)).toEqual([
      "slot-subject-1",
      "slot-subject-2",
      "slot-predicate",
    ]);
  });

  it("uses source metadata only, never Japanese or romaji surface strings", () => {
    const { family, variant, tokens } = comparisonFixture();
    const changedSurfaces = tokens.map((token) => ({
      ...token,
      jp: `changed-jp-${token.id}`,
      romaji: `changed-romaji-${token.id}`,
    }));
    const changedMetadata = changedSurfaces.map((token) =>
      token.id === "slot-subject-1"
        ? {
            ...token,
            source: {
              domain: "catalog" as const,
              referenceId: token.source.referenceId,
            },
          }
        : token,
    );

    expect(
      foundationComparisonTokenIds(family, variant, changedSurfaces),
    ).toEqual(["slot-subject-1", "slot-subject-2", "slot-predicate"]);
    expect(
      foundationComparisonTokenIds(family, variant, changedMetadata),
    ).toEqual(["slot-subject-2", "slot-predicate"]);
  });
});

describe("buildFoundationLessonViewModel", () => {
  it.each(LESSON_IDS)("returns a complete success model for %s", (lessonId) => {
    const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { model } = result;
    expect(model.lessonId).toBe(lessonId);
    expect(model.canDoDescriptor.trim().length).toBeGreaterThan(0);
    expect(model.levelId).toBe(lessonById(lessonId).level);
  });

  it.each(LESSON_IDS)(
    "realizes all eight models in authored order for %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      const { matrix } = result.model;
      expect(matrix.rows).toHaveLength(8);
      expect(matrix.rows.map((r) => r.variantId)).toEqual(
        lessonById(lessonId).modelVariantIds,
      );
      // Each row carries adjacent Japanese tokens + a localized translation.
      for (const row of matrix.rows) {
        expect(row.tokens.length).toBeGreaterThan(0);
        expect(row.translation.trim().length).toBeGreaterThan(0);
        expect(row.speaker.trim().length).toBeGreaterThan(0);
        expect(row.context.trim().length).toBeGreaterThan(0);
        expect(row.comparisonTokenIds.length).toBeGreaterThan(0);
        const rowTokenIds = new Set(row.tokens.map((token) => token.id));
        expect(
          row.comparisonTokenIds.every((tokenId) => rowTokenIds.has(tokenId)),
        ).toBe(true);
        const tokenIndexById = new Map(
          row.tokens.map((token, index) => [token.id, index]),
        );
        const positions = row.comparisonTokenIds.map(
          (tokenId) => tokenIndexById.get(tokenId) ?? -1,
        );
        expect(positions).toEqual([...positions].sort((a, b) => a - b));
      }
      expect(matrix.initialVariantIds).toEqual(
        lessonById(lessonId).modelVariantIds.slice(0, 3),
      );
    },
  );

  it.each(LESSON_IDS)("selects five targets per round for %s", (lessonId) => {
    const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
    if (!result.ok) throw new Error("expected ok");
    const [roundOne, roundTwo] = result.model.rounds;
    expect(roundOne.purpose).toBe("guided-controlled");
    expect(roundTwo.purpose).toBe("transfer");
    expect(roundOne.targets).toHaveLength(5);
    expect(roundTwo.targets).toHaveLength(5);
  });

  it.each(LESSON_IDS)(
    "round two includes constrained construction plus another transfer kind for %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      const kinds = result.model.rounds[1].targets.map((t) => t.exerciseKind);
      const constrained = kinds.filter(
        (k) => k === "constrained-construction",
      );
      expect(constrained.length).toBeGreaterThanOrEqual(1);
      const otherTransfer = kinds.filter(
        (k) => k !== "constrained-construction",
      );
      expect(otherTransfer.length).toBeGreaterThanOrEqual(1);
    },
  );

  it.each(LESSON_IDS)(
    "generates a complete prompt for every selected target in %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      for (const round of result.model.rounds) {
        for (const target of round.targets) {
          expect(target.prompt).toBeDefined();
          expect(target.prompt.kind).toBe(target.exerciseKind);
          expect(target.instruction.trim().length).toBeGreaterThan(0);
        }
      }
    },
  );

  it.each(LESSON_IDS)(
    "honors the diversity/reuse contract across the ten selected targets for %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      const targets = result.model.rounds.flatMap((r) => r.targets);
      expect(targets).toHaveLength(10);
      const counts = new Map<string, number>();
      for (const target of targets) {
        counts.set(
          target.visibleTargetKey,
          (counts.get(target.visibleTargetKey) ?? 0) + 1,
        );
      }
      const d = lessonById(lessonId).diversityConstraints;
      expect(counts.size).toBeGreaterThanOrEqual(d.minUniqueTargets);
      expect(Math.max(...counts.values())).toBeLessThanOrEqual(
        d.maxTargetReuse,
      );
    },
  );

  it.each(LESSON_IDS)(
    "selects identical target ids and matrix order regardless of locale for %s",
    (lessonId) => {
      const en = buildFoundationLessonViewModel(lessonId, "en", SEED);
      const it = buildFoundationLessonViewModel(lessonId, "it", SEED);
      if (!en.ok || !it.ok) throw new Error("expected ok");
      const ids = (m: typeof en) =>
        m.ok
          ? m.model.rounds.flatMap((r) => r.targets.map((t) => t.targetId))
          : [];
      expect(ids(it)).toEqual(ids(en));
      expect(it.model.matrix.rows.map((r) => r.variantId)).toEqual(
        en.model.matrix.rows.map((r) => r.variantId),
      );
      expect(
        it.model.matrix.rows.map((row) => row.comparisonTokenIds),
      ).toEqual(en.model.matrix.rows.map((row) => row.comparisonTokenIds));
      // Localized copy actually changes between locales.
      expect(it.model.canDoDescriptor).not.toBe(en.model.canDoDescriptor);
    },
  );

  it.each(LESSON_IDS)("is deterministic across repeated builds for %s", (lessonId) => {
    const a = buildFoundationLessonViewModel(lessonId, "en", SEED);
    const b = buildFoundationLessonViewModel(lessonId, "en", SEED);
    if (!a.ok || !b.ok) throw new Error("expected ok");
    const ids = (m: typeof a) =>
      m.ok ? m.model.rounds.flatMap((r) => r.targets.map((t) => t.targetId)) : [];
    expect(ids(b)).toEqual(ids(a));
  });

  it.each(LESSON_IDS)(
    "builds an honest same-family guided construction for %s",
    (lessonId) => {
      const result = buildFoundationLessonViewModel(lessonId, "en", SEED);
      if (!result.ok) throw new Error("expected ok");
      const { guided } = result.model;
      expect(guided.initial.familyId).toBe(guided.target.familyId);
      expect(guided.familyId).toBe(guided.initial.familyId);
      expect(guided.activeAxes.length).toBeGreaterThanOrEqual(1);
      expect(guided.targetChangedTokenIds.length).toBeGreaterThanOrEqual(1);
      const targetTokenIds = new Set(guided.target.tokens.map((t) => t.id));
      for (const id of guided.targetChangedTokenIds) {
        expect(targetTokenIds.has(id)).toBe(true);
      }
      // Initial and target must actually differ semantically.
      expect(guided.target.semanticFingerprint).not.toBe(
        guided.initial.semanticFingerprint,
      );
    },
  );

  it("returns a typed error for an unknown fixture id", () => {
    const result = buildFoundationLessonViewModel("no-such-lesson", "en", SEED);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unknown-lesson");
  });

  it("exposes token resolvers covering every realized example and tile", () => {
    const result = buildFoundationLessonViewModel(LESSON_IDS[0], "en", SEED);
    if (!result.ok) throw new Error("expected ok");
    const { model } = result;
    for (const round of model.rounds) {
      for (const target of round.targets) {
        const tokens = model.tokensForExample(target.targetExampleId);
        expect(tokens).toBeDefined();
        expect(tokens?.length ?? 0).toBeGreaterThan(0);
        const first = tokens?.[0];
        if (first) {
          expect(model.tokenForTile(`${target.targetExampleId}#${first.id}`)).toEqual(
            first,
          );
        }
      }
    }
  });
});

describe("buildFoundationLessonViewModel wraps the generic builder (parity)", () => {
  const combos = LESSON_IDS.flatMap((lessonId) =>
    LOCALES.flatMap((locale) => SEEDS.map((seed) => ({ lessonId, locale, seed }))),
  );

  it.each(combos)(
    "wrapper output deep-equals the generic builder for $lessonId/$locale/$seed",
    ({ lessonId, locale, seed }) => {
      const wrapped = buildFoundationLessonViewModel(lessonId, locale, seed);
      const generic = buildLessonViewModel({
        catalogs: foundationCatalogs,
        copy: foundationCopy,
        lessonId,
        locale,
        catalogVersion: CATALOG_VERSION,
        seed,
      });
      expect(wrapped.ok).toBe(true);
      expect(generic.ok).toBe(true);
      expect(serializable(modelOf(wrapped))).toEqual(
        serializable(modelOf(generic)),
      );
    },
  );

  it.each(combos)(
    "wrapper token resolvers match the generic builder for $lessonId/$locale/$seed",
    ({ lessonId, locale, seed }) => {
      const wrapped = modelOf(buildFoundationLessonViewModel(lessonId, locale, seed));
      const generic = modelOf(
        buildLessonViewModel({
          catalogs: foundationCatalogs,
          copy: foundationCopy,
          lessonId,
          locale,
          catalogVersion: CATALOG_VERSION,
          seed,
        }),
      );
      for (const round of wrapped.rounds) {
        for (const target of round.targets) {
          expect(wrapped.tokensForExample(target.targetExampleId)).toEqual(
            generic.tokensForExample(target.targetExampleId),
          );
        }
      }
    },
  );
});

describe("buildLessonViewModel is catalog/copy-order independent", () => {
  it.each(LESSON_IDS)(
    "selects identical targets and matrix order under reordered catalogs/copy for %s",
    (lessonId) => {
      const canonical = modelOf(
        buildLessonViewModel({
          catalogs: foundationCatalogs,
          copy: foundationCopy,
          lessonId,
          locale: "en",
          catalogVersion: CATALOG_VERSION,
          seed: SEED,
        }),
      );
      const reordered = modelOf(
        buildLessonViewModel({
          catalogs: reorderedCatalogs(foundationCatalogs),
          copy: reorderedCopy(foundationCopy),
          lessonId,
          locale: "en",
          catalogVersion: CATALOG_VERSION,
          seed: SEED,
        }),
      );
      // The whole semantic projection is identical — selection, ordering, and
      // localized copy do not depend on catalog array or copy key order.
      expect(serializable(reordered)).toEqual(serializable(canonical));
    },
  );
});

describe("buildLessonViewModel returns typed failures, never partial or thrown", () => {
  it("reports an unknown lesson id", () => {
    const result = buildLessonViewModel({
      catalogs: foundationCatalogs,
      copy: foundationCopy,
      lessonId: "no-such-lesson",
      locale: "en",
      catalogVersion: CATALOG_VERSION,
      seed: SEED,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("unknown-lesson");
  });

  it("reports a realization failure when a referenced variant is absent", () => {
    const lessonId = LESSON_IDS[0];
    const droppedVariantId = lessonById(lessonId).modelVariantIds[0];
    const catalogs: FoundationCatalogs = {
      ...foundationCatalogs,
      sentenceVariants: foundationCatalogs.sentenceVariants.filter(
        (v) => v.id !== droppedVariantId,
      ),
    };
    const result = buildLessonViewModel({
      catalogs,
      copy: foundationCopy,
      lessonId,
      locale: "en",
      catalogVersion: CATALOG_VERSION,
      seed: SEED,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("realization-failed");
  });

  it("reports a selection failure when a round's diversity contract cannot be met", () => {
    const lessonId = LESSON_IDS[0];
    const lesson = lessonById(lessonId);
    const impossible = {
      ...lesson,
      diversityConstraints: {
        ...lesson.diversityConstraints,
        // More unique visible targets than the round can ever produce.
        minUniqueTargets: 999,
      },
    };
    const catalogs: FoundationCatalogs = {
      ...foundationCatalogs,
      lessons: foundationCatalogs.lessons.map((l) =>
        l.id === lessonId ? impossible : l,
      ),
    };
    const result = buildLessonViewModel({
      catalogs,
      copy: foundationCopy,
      lessonId,
      locale: "en",
      catalogVersion: CATALOG_VERSION,
      seed: SEED,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("selection-failed");
  });

  it("resolves missing copy to empty strings without throwing or partial output", () => {
    const emptyCopy: FoundationCopy = { en: {}, it: {} };
    const result = buildLessonViewModel({
      catalogs: foundationCatalogs,
      copy: emptyCopy,
      lessonId: LESSON_IDS[0],
      locale: "en",
      catalogVersion: CATALOG_VERSION,
      seed: SEED,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.model.canDoDescriptor).toBe("");
    for (const row of result.model.matrix.rows) {
      expect(row.translation).toBe("");
      // Structure (tokens/order) is intact even with no copy.
      expect(row.tokens.length).toBeGreaterThan(0);
    }
  });
});

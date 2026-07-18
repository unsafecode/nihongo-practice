/**
 * A2 Modules 1-4 — cross-module aggregate validation (Phase 3 Task 4).
 *
 * The final integration gate: assembles all 16 authored M1-M4 lessons into
 * one real `FoundationCatalogs` (never a fixture), derives the honest
 * M1-M4-served Can-do subset via `buildA2CanDos`, computes cumulative
 * introduced-content availability in canonical position order, and runs the
 * shared `validateFoundations` pipeline end-to-end against real release
 * data — exactly the same validator A1's own release relies on. No
 * validator is ever weakened here; a failure here must be fixed by
 * correcting content/wiring, never by loosening a check.
 */
import { describe, expect, it } from "vitest";

import { formatRomaji } from "../../../romaji/formatRomaji";
import { realizeVariant } from "../../foundations/realizeFamily";
import { validateFoundations } from "../../foundations/validateFoundations";
import type {
  CheckpointDefinition,
  CourseLevel,
  FoundationModule,
  SentenceFamily,
} from "../../foundations/types";
import {
  assembleA2FoundationCatalogs,
  computeAvailableContentByLesson,
  type A2BuiltLesson,
} from "../catalog/a2LessonBuilders";
import {
  A2_M1_M4_SERVED_CANDO_IDS,
  a2CanDoDescriptorCopy,
  buildA2CanDos,
} from "../catalog/canDos";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
  a2SharedCopy,
} from "../catalog/a2SemanticCatalog";
import { A2_CANONICAL_POSITIONS, A2_MODULE_MANIFEST } from "../manifest";
import { module1Lessons } from "./module01ConnectedConversation";
import { module2Lessons } from "./module02PlansInvitations";
import { module3Lessons } from "./module03ExperiencesNarratives";
import { module4Lessons } from "./module04ReasonsOpinions";

// ---------------------------------------------------------------------------
// Assemble the real, cumulative M1-M4 catalog
// ---------------------------------------------------------------------------

const allBuiltLessonsUnsorted: readonly A2BuiltLesson[] = [
  ...module1Lessons,
  ...module2Lessons,
  ...module3Lessons,
  ...module4Lessons,
];

// Never assume authoring order is canonical order — sort explicitly by the
// real manifest's canonical position, exactly as `computeAvailableContentByLesson`'s
// own contract requires of its caller.
const allBuiltLessons: readonly A2BuiltLesson[] = [...allBuiltLessonsUnsorted].sort(
  (a, b) => A2_CANONICAL_POSITIONS[a.recipe.id] - A2_CANONICAL_POSITIONS[b.recipe.id],
);

const a2M1M4CanDos = buildA2CanDos(A2_M1_M4_SERVED_CANDO_IDS, allBuiltLessons);

const M1_M4_MODULE_IDS = [
  "connected-conversation",
  "plans-invitations",
  "experiences-narratives",
  "reasons-opinions",
] as const;

const foundationModules: readonly FoundationModule[] = M1_M4_MODULE_IDS.map((moduleId) => {
  const manifestEntry = A2_MODULE_MANIFEST[moduleId];
  const lessonsInModule = allBuiltLessons.filter((built) => built.recipe.moduleId === moduleId);
  const canDoIds = [
    ...new Set(
      lessonsInModule.flatMap((built) => [
        built.recipe.primaryCanDoId,
        ...built.recipe.supportingCanDoIds,
      ]),
    ),
  ].sort();
  return {
    id: moduleId,
    level: "a2",
    order: manifestEntry.order,
    canDoIds,
    lessonIds: [...manifestEntry.lessonIds],
  };
});

const foundationLevel: CourseLevel = {
  id: "a2",
  alignmentCopyId: "a2-level-alignment",
  moduleIds: [...M1_M4_MODULE_IDS],
  canDoIds: [...A2_M1_M4_SERVED_CANDO_IDS],
};

// A synthetic, interim checkpoint sampling exactly the M1-M4 taught primary
// Can-dos (no real A2 checkpoint module exists yet — that is a later task's
// deliverable). `minAcceptedTransferTargetsPerCanDo: 3` matches every
// registered Can-do's own `checkpointEvidenceRule.minAcceptedTransferTargets`.
const TAUGHT_PRIMARY_CAN_DO_IDS = [
  ...new Set(allBuiltLessons.map((built) => built.recipe.primaryCanDoId)),
].sort();

const interimCheckpoint: CheckpointDefinition = {
  id: "a2-checkpoint-m1-m4-interim",
  level: "a2",
  sampledCanDoIds: TAUGHT_PRIMARY_CAN_DO_IDS,
  minAcceptedTransferTargetsPerCanDo: 3,
};

const catalogs = assembleA2FoundationCatalogs({
  lessons: allBuiltLessons.map((built) => built.recipe),
  variants: allBuiltLessons.flatMap((built) => built.variants),
  canDos: a2M1M4CanDos,
  modules: foundationModules,
  levels: [foundationLevel],
  checkpoints: [interimCheckpoint],
});

const availableContentByLesson = computeAvailableContentByLesson(allBuiltLessons, catalogs);

function mergeCopy(
  ...sources: readonly Readonly<Record<string, string>>[]
): Readonly<Record<string, string>> {
  const merged: Record<string, string> = {};
  for (const source of sources) Object.assign(merged, source);
  return merged;
}

const foundationCopy = {
  en: mergeCopy(
    a2SharedCopy.en,
    a2CanDoDescriptorCopy.en,
    { "a2-level-alignment": "A2 (CEFR) — elementary proficiency, building on A1." },
    ...allBuiltLessons.map((built) => built.en),
  ),
  it: mergeCopy(
    a2SharedCopy.it,
    a2CanDoDescriptorCopy.it,
    { "a2-level-alignment": "A2 (QCER) — competenza elementare, sopra le fondamenta dell'A1." },
    ...allBuiltLessons.map((built) => built.it),
  ),
};

describe("A2 M1-M4 aggregate — exactly 16 lessons across 4 modules in canonical order", () => {
  it("has exactly 16 lessons total", () => {
    expect(allBuiltLessons).toHaveLength(16);
  });

  it("lists each module's exact 4 lesson ids in the real manifest", () => {
    for (const moduleId of M1_M4_MODULE_IDS) {
      expect(A2_MODULE_MANIFEST[moduleId].lessonIds).toHaveLength(4);
    }
  });

  it("is sorted strictly ascending by canonical position", () => {
    const positions = allBuiltLessons.map((built) => A2_CANONICAL_POSITIONS[built.recipe.id]);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });
});

describe("A2 M1-M4 aggregate — buildA2CanDos honest subset", () => {
  it("materializes exactly the 15 M1-M4-served Can-dos, each with >=1 real lessonId", () => {
    expect(a2M1M4CanDos).toHaveLength(15);
    for (const canDo of a2M1M4CanDos) {
      expect(canDo.lessonIds.length, canDo.id).toBeGreaterThan(0);
    }
  });
});

describe("A2 M1-M4 aggregate — foundation copy parity", () => {
  it("has identical EN/IT key sets across the full aggregate", () => {
    expect(Object.keys(foundationCopy.en).sort()).toEqual(Object.keys(foundationCopy.it).sort());
  });

  it("has no Japanese literal in any aggregate copy value", () => {
    const JAPANESE_PATTERN = /[\u3040-\u30ff\u4e00-\u9fff]/;
    for (const value of [...Object.values(foundationCopy.en), ...Object.values(foundationCopy.it)]) {
      expect(JAPANESE_PATTERN.test(value), value).toBe(false);
    }
  });
});

describe("A2 M1-M4 aggregate — validateFoundations end-to-end", () => {
  it("is valid against the real, cumulative M1-M4 release data (never weakened to pass)", () => {
    const result = validateFoundations({
      catalogs,
      foundationCopy,
      catalogVersion: "a2-m1-m4-task4",
      seed: "a2-task4-aggregate-seed",
      availableContentByLesson,
    });
    if (!result.valid) {
      throw new Error(
        `validateFoundations reported ${result.errors.length} error(s):\n` +
          JSON.stringify(result.errors, null, 2),
      );
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe("A2 M1-M4 aggregate — Task4 editorial regression (malformed conjugation guard)", () => {
  const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
  const realizeCatalogs = {
    contexts: a2Contexts,
    personRoles: a2PersonRoles,
    referents: a2Referents,
    semanticValues: a2SemanticValues,
    learningTargetSenses: a2LearningTargetSenses,
  };

  // The exact malformed sequences a fresh spec review found across M1-M4: an
  // unconjugated verb root left before ます (はなます — should be the ます-stem
  // はなします), a plain dictionary form left before an invitation's ませんか
  // (たべるませんか, いくませんか — should be the ます-stem たべ/いき), and a
  // ます-stem left before a よてい plan where the dictionary form is required
  // (みよてい — should be みるよてい). None of these are valid Japanese; a
  // `formatRomaji`-ok check alone can never catch them, because every
  // individual token is still well-formed — only scanning the assembled
  // string catches an invalid *sequence* of otherwise-valid tokens. Exact
  // row assertions for the concrete fixed variants (cc1-m1/t3,
  // pi3-m3/t2/m7) live in their own module test files
  // (`module01ConnectedConversation.test.ts`, `module02PlansInvitations.test.ts`);
  // this aggregate guard's job is the broad net across every authored
  // M1-M4 variant, so this whole class of error can never recur anywhere
  // in the release, not just at the five spots found this time.
  const MALFORMED_SEQUENCES = ["はなます", "たべるませんか", "いくませんか", "みよてい"] as const;

  it("realizes every currently authored M1-M4 model+transfer variant with no known-malformed conjugation sequence", () => {
    for (const built of allBuiltLessons) {
      for (const variant of built.variants) {
        const family = famById.get(variant.sentenceFamilyId);
        expect(family, `${variant.id} family ${variant.sentenceFamilyId}`).toBeDefined();
        const result = realizeVariant(family as SentenceFamily, variant, realizeCatalogs, {
          availableConceptIds: [...(family as SentenceFamily).requiredConceptIds],
        });
        if (!result.ok) {
          throw new Error(`realize ${variant.id} failed: ${JSON.stringify(result.errors)}`);
        }
        const romaji = formatRomaji(result.sentence.tokens);
        expect(romaji.ok, `${variant.id} romaji`).toBe(true);
        for (const malformed of MALFORMED_SEQUENCES) {
          expect(
            result.sentence.canonicalJapanese,
            `${variant.id} must not contain malformed sequence "${malformed}"`,
          ).not.toContain(malformed);
        }
      }
    }
  });
});

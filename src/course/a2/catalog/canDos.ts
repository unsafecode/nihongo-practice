/**
 * A2 Can-do registry (Phase 3 Task 4).
 *
 * The complete, stable Can-do identity/domain registry for all 59 Phase-3
 * Can-dos: the 15 grammar Can-dos (one per `a2/forms/grammarSpiral.ts` row,
 * using its exact `canDoId`), 40 topical Can-dos (reading/writing/listening/
 * spoken-production/interaction), and 4 capstone-scenario Can-dos (served by
 * the future `a2-synthesis` module, exactly like A1's Module 12 capstones —
 * left as pure stubs with no served lessons yet, never fabricated).
 *
 * `A2_CANDO_REGISTRY` fixes every Can-do's identity/domain/descriptor/
 * evidence-rule now, so later modules (M5-M15) never redeclare a definition
 * — they only ever call {@link buildA2CanDos}/{@link buildA2CanDoLessonMap}
 * with a wider `allBuiltLessons` set as more modules land. Grammar Can-dos
 * derive their served lesson ids from the union of their grammar-spiral row
 * (intro/controlled-practice/transfer/recurrence), filtered to lessons that
 * actually exist in the provided built set; topical/scenario Can-dos derive
 * theirs from scanning which built lessons name them as primary or
 * supporting. Both fail closed (throw) the moment a *requested* id has zero
 * serving lessons — a later task can safely ask to materialize a wider slice
 * without this file ever silently fabricating an empty-lessonIds CanDo.
 */

import type { CanDo, CanDoDomain, CourseLevelId } from "../../foundations/types";
import { A2_GRAMMAR_SPIRAL } from "../forms/grammarSpiral";

// ---------------------------------------------------------------------------
// Registry stub shape (identity/domain/descriptor/evidence — never
// lessonIds/contextIds, which only `buildA2CanDos` ever derives)
// ---------------------------------------------------------------------------

export type A2CanDoGroup = "grammar" | "topical" | "scenario";

export interface A2CanDoStub {
  readonly id: string;
  readonly level: CourseLevelId;
  readonly group: A2CanDoGroup;
  readonly domain: CanDoDomain;
  readonly descriptorCopyId: string;
  readonly checkpointEvidenceRule: {
    readonly evidenceKind: "checkpoint-sampled";
    readonly minAcceptedTransferTargets: number;
  };
}

function stub(
  id: string,
  group: A2CanDoGroup,
  domain: CanDoDomain,
): A2CanDoStub {
  return {
    id,
    level: "a2",
    group,
    domain,
    descriptorCopyId: `${id}-descriptor`,
    checkpointEvidenceRule: { evidenceKind: "checkpoint-sampled", minAcceptedTransferTargets: 3 },
  };
}

// ---------------------------------------------------------------------------
// 15 grammar Can-dos — exactly the grammar-spiral row ids as `a2-cando-<id>`
// ---------------------------------------------------------------------------

const GRAMMAR_STUBS: readonly A2CanDoStub[] = A2_GRAMMAR_SPIRAL.map((row) =>
  stub(row.canDoId, "grammar", "spoken-production"),
);

// ---------------------------------------------------------------------------
// 40 topical Can-dos
// ---------------------------------------------------------------------------

const TOPICAL_STUBS: readonly A2CanDoStub[] = [
  // --- reading (3) ---
  stub("a2-cando-read-schedule", "topical", "reading"),
  stub("a2-cando-read-notice", "topical", "reading"),
  stub("a2-cando-read-reply", "topical", "reading"),

  // --- writing (5) ---
  stub("a2-cando-write-message", "topical", "writing"),
  stub("a2-cando-write-colleague-note", "topical", "writing"),
  stub("a2-cando-write-progress-update", "topical", "writing"),
  stub("a2-cando-write-reply", "topical", "writing"),
  stub("a2-cando-write-form", "topical", "writing"),

  // --- listening (2) ---
  stub("a2-cando-listen-plain-speech", "topical", "listening"),
  stub("a2-cando-listen-announcement", "topical", "listening"),

  // --- spoken-production (19) ---
  stub("a2-cando-narrate-order", "topical", "spoken-production"),
  stub("a2-cando-describe-ongoing-action", "topical", "spoken-production"),
  stub("a2-cando-describe-daily-plans", "topical", "spoken-production"),
  stub("a2-cando-share-opinion", "topical", "spoken-production"),
  stub("a2-cando-compare-options", "topical", "spoken-production"),
  stub("a2-cando-connect-spoken-ideas", "topical", "spoken-production"),
  stub("a2-cando-recount-experience", "topical", "spoken-production"),
  stub("a2-cando-give-reasons", "topical", "spoken-production"),
  stub("a2-cando-describe-now", "topical", "spoken-production"),
  stub("a2-cando-describe-ongoing-state", "topical", "spoken-production"),
  stub("a2-cando-describe-routine", "topical", "spoken-production"),
  stub("a2-cando-express-ability", "topical", "spoken-production"),
  stub("a2-cando-express-inability", "topical", "spoken-production"),
  stub("a2-cando-describe-facility", "topical", "spoken-production"),
  stub("a2-cando-describe-symptoms", "topical", "spoken-production"),
  stub("a2-cando-describe-family", "topical", "spoken-production"),
  stub("a2-cando-give-receive", "topical", "spoken-production"),
  stub("a2-cando-describe-events", "topical", "spoken-production"),
  stub("a2-cando-describe-trip", "topical", "spoken-production"),

  // --- interaction (11) ---
  stub("a2-cando-backchannel-followup", "topical", "interaction"),
  stub("a2-cando-clarify-repeat", "topical", "interaction"),
  stub("a2-cando-invite-accept-decline", "topical", "interaction"),
  stub("a2-cando-arrange-meeting", "topical", "interaction"),
  stub("a2-cando-ask-experience", "topical", "interaction"),
  stub("a2-cando-agree-disagree", "topical", "interaction"),
  stub("a2-cando-ask-for-help", "topical", "interaction"),
  stub("a2-cando-confirm-understanding", "topical", "interaction"),
  stub("a2-cando-make-small-talk", "topical", "interaction"),
  stub("a2-cando-negotiate-price", "topical", "interaction"),
  stub("a2-cando-handle-phone-call", "topical", "interaction"),
];

// ---------------------------------------------------------------------------
// 4 capstone-scenario Can-dos (served by the future a2-synthesis module —
// pure stubs, never fabricated lessons; mirrors A1's Module 12 capstones)
// ---------------------------------------------------------------------------

const SCENARIO_STUBS: readonly A2CanDoStub[] = [
  stub("a2-cando-scenario-1", "scenario", "interaction"),
  stub("a2-cando-scenario-2", "scenario", "interaction"),
  stub("a2-cando-scenario-3", "scenario", "interaction"),
  stub("a2-cando-scenario-4", "scenario", "interaction"),
];

/** The complete, frozen 59-entry A2 Can-do registry (15 + 40 + 4). */
export const A2_CANDO_REGISTRY: readonly A2CanDoStub[] = Object.freeze([
  ...GRAMMAR_STUBS,
  ...TOPICAL_STUBS,
  ...SCENARIO_STUBS,
]);

const A2_CANDO_BY_ID: ReadonlyMap<string, A2CanDoStub> = new Map(
  A2_CANDO_REGISTRY.map((c) => [c.id, c]),
);

const A2_GRAMMAR_SPIRAL_BY_CANDO_ID = new Map(A2_GRAMMAR_SPIRAL.map((row) => [row.canDoId, row]));

// ---------------------------------------------------------------------------
// Lesson-serving derivation
// ---------------------------------------------------------------------------

/** The minimal shape `buildA2CanDoLessonMap`/`buildA2CanDos` need from a
 * built lesson — structurally satisfied by `BuiltInstructionalLesson<A2LessonRecipe>`. */
export interface A2CanDoServingLesson {
  readonly recipe: {
    readonly id: string;
    readonly primaryCanDoId: string;
    readonly supportingCanDoIds: readonly string[];
  };
  readonly variants: readonly { readonly contextId: string }[];
}

/**
 * Derive each requested Can-do id's served lesson ids, purely from the
 * provided built lessons: a grammar Can-do unions its grammar-spiral row's
 * intro/controlled-practice/transfer/recurrence lesson ids, filtered to
 * lessons that actually exist in `allBuiltLessons`; every other Can-do scans
 * `allBuiltLessons` for recipes naming it as `primaryCanDoId` or within
 * `supportingCanDoIds`, in the lessons' given order. Throws — fails closed —
 * the moment a *requested* id resolves to zero serving lessons, so a caller
 * can never silently materialize an empty-lessonIds CanDo.
 */
export function buildA2CanDoLessonMap(
  idsToMaterialize: readonly string[],
  allBuiltLessons: readonly A2CanDoServingLesson[],
): ReadonlyMap<string, readonly string[]> {
  const existingLessonIds = new Set(allBuiltLessons.map((built) => built.recipe.id));
  const map = new Map<string, readonly string[]>();

  for (const id of idsToMaterialize) {
    const registered = A2_CANDO_BY_ID.get(id);
    if (!registered) {
      throw new Error(
        `buildA2CanDoLessonMap: "${id}" is not one of the 59 registered A2 Can-do ids.`,
      );
    }

    let lessonIds: readonly string[];
    const spiralRow = A2_GRAMMAR_SPIRAL_BY_CANDO_ID.get(id);
    const namedByBuiltLesson = allBuiltLessons
      .filter(
        (built) =>
          built.recipe.primaryCanDoId === id || built.recipe.supportingCanDoIds.includes(id),
      )
      .map((built) => built.recipe.id);
    if (spiralRow) {
      // Union the spiral row's own schedule with any built lesson that
      // independently names this Can-do as primary/supporting: the frozen
      // spiral row's intro/controlled-practice/transfer/recurrence fields
      // are singular per stage, but authored content can legitimately give
      // one grammar Can-do a *second* intro-shaped lesson (e.g. pi2's
      // tsumori alongside pi1's yotei both naming intentions-plans) that the
      // spiral row was never designed to enumerate. Without this union, such
      // a lesson's own `primaryCanDoId` would reference a Can-do whose
      // materialized `lessonIds` doesn't include it — an internally
      // inconsistent CanDo that `validateFoundations`'s
      // `can-do-primary-coverage` check rightly rejects.
      const union = new Set<string>([
        spiralRow.introLessonId,
        spiralRow.controlledPracticeLessonId,
        spiralRow.transferLessonId,
        ...spiralRow.recurrenceLessonIds,
        ...namedByBuiltLesson,
      ]);
      lessonIds = [...union].filter((lessonId) => existingLessonIds.has(lessonId)).sort();
    } else {
      lessonIds = namedByBuiltLesson;
    }

    if (lessonIds.length === 0) {
      throw new Error(
        `buildA2CanDoLessonMap: Can-do "${id}" has no serving lesson among the ${allBuiltLessons.length} provided built lesson(s) — refusing to materialize an unserved Can-do.`,
      );
    }
    map.set(id, lessonIds);
  }

  return map;
}

/** Union of the contexts taught across a Can-do's served lessons (sorted). */
function contextsForLessons(
  lessonIds: readonly string[],
  lessonById: ReadonlyMap<string, A2CanDoServingLesson>,
): readonly string[] {
  const seen = new Set<string>();
  for (const lessonId of lessonIds) {
    const built = lessonById.get(lessonId);
    if (!built) continue;
    for (const variant of built.variants) seen.add(variant.contextId);
  }
  return [...seen].sort();
}

/**
 * Materialize real `CanDo` objects for exactly the requested ids: real
 * `lessonIds` (via {@link buildA2CanDoLessonMap}), real `contextIds` (the
 * union of contexts those lessons actually teach), and the explicit
 * JF/CEFR alignment `sourceNote` — never an implied certification claim.
 */
export function buildA2CanDos(
  idsToMaterialize: readonly string[],
  allBuiltLessons: readonly A2CanDoServingLesson[],
): readonly CanDo[] {
  const lessonMap = buildA2CanDoLessonMap(idsToMaterialize, allBuiltLessons);
  const lessonById = new Map(allBuiltLessons.map((built) => [built.recipe.id, built]));

  return idsToMaterialize.map((id): CanDo => {
    const registered = A2_CANDO_BY_ID.get(id);
    if (!registered) {
      throw new Error(`buildA2CanDos: "${id}" is not one of the 59 registered A2 Can-do ids.`);
    }
    const lessonIds = lessonMap.get(id) ?? [];
    return {
      id: registered.id,
      level: registered.level,
      domain: registered.domain,
      descriptorCopyId: registered.descriptorCopyId,
      contextIds: contextsForLessons(lessonIds, lessonById),
      lessonIds,
      checkpointEvidenceRule: registered.checkpointEvidenceRule,
      sourceNote: "product-authored-jf-cefr-aligned",
    };
  });
}

/**
 * The 15 distinct Can-do ids the current 16 M1-M4 lessons actually serve (8
 * topical primaries, 7 grammar ids used as primary or support — `narrate-order`,
 * `ask-experience`, and `give-reasons` are topical; the rest of this list are
 * grammar-spiral ids). Exported so module content and the aggregate test can
 * request exactly this honest, currently-servable subset from
 * `buildA2CanDos`/`buildA2CanDoLessonMap` without importing modules 5+ (which
 * do not exist yet).
 */
export const A2_M1_M4_SERVED_CANDO_IDS: readonly string[] = Object.freeze([
  "a2-cando-backchannel-followup",
  "a2-cando-connectors",
  "a2-cando-clarify-repeat",
  "a2-cando-recognize-plain-forms",
  "a2-cando-intentions-plans",
  "a2-cando-invite-accept-decline",
  "a2-cando-arrange-meeting",
  "a2-cando-experience-takoto",
  "a2-cando-narrate-order",
  "a2-cando-ask-experience",
  "a2-cando-give-reasons",
  "a2-cando-reason-kara",
  "a2-cando-reason-node",
  "a2-cando-opinion-toomou",
  "a2-cando-agree-disagree",
]);

// ---------------------------------------------------------------------------
// Bilingual descriptor copy (the 15 M1-M4-served Can-dos only — the other 44
// registered ids belong to modules that do not exist yet, so their copy is
// honestly left for the tasks that author those modules, never fabricated
// ahead of time)
// ---------------------------------------------------------------------------

/**
 * Natural, non-placeholder EN/IT "I can..." statements keyed by each served
 * Can-do's own `descriptorCopyId` (never the raw Can-do id) — resolved by
 * `validateFoundations`'s copy-parity/reference integrity check for every
 * Can-do present in an assembled `FoundationCatalogs.canDos`.
 */
export const a2CanDoDescriptorCopy: { readonly en: Readonly<Record<string, string>>; readonly it: Readonly<Record<string, string>> } = Object.freeze({
  en: {
    "a2-cando-backchannel-followup-descriptor":
      "I can use natural backchannels and follow-up questions to keep a conversation going.",
    "a2-cando-connectors-descriptor":
      "I can link two related ideas using basic discourse connectors like \"but\" and \"then\".",
    "a2-cando-clarify-repeat-descriptor":
      "I can ask someone to repeat, speak more slowly, or confirm what they said.",
    "a2-cando-recognize-plain-forms-descriptor":
      "I can recognize casual plain-form verbs and adjectives in everyday dialogue.",
    "a2-cando-intentions-plans-descriptor":
      "I can state my plans and intentions.",
    "a2-cando-invite-accept-decline-descriptor":
      "I can invite someone, and accept or politely decline an invitation.",
    "a2-cando-arrange-meeting-descriptor":
      "I can arrange a time and place to meet someone.",
    "a2-cando-experience-takoto-descriptor":
      "I can talk about things I have experienced before.",
    "a2-cando-narrate-order-descriptor":
      "I can narrate a short sequence of past events in order.",
    "a2-cando-ask-experience-descriptor":
      "I can ask someone whether they have ever experienced something.",
    "a2-cando-give-reasons-descriptor":
      "I can give a reason for a statement or decision.",
    "a2-cando-reason-kara-descriptor":
      "I can state a direct, personal reason.",
    "a2-cando-reason-node-descriptor":
      "I can state a softer, more objective reason.",
    "a2-cando-opinion-toomou-descriptor":
      "I can state my own opinion.",
    "a2-cando-agree-disagree-descriptor":
      "I can agree or disagree with someone's opinion.",
  },
  it: {
    "a2-cando-backchannel-followup-descriptor":
      "Riesco a usare naturali segnali di ascolto e domande di approfondimento per continuare una conversazione.",
    "a2-cando-connectors-descriptor":
      "Riesco a collegare due idee correlate usando connettori di base come \"ma\" e \"poi\".",
    "a2-cando-clarify-repeat-descriptor":
      "Riesco a chiedere a qualcuno di ripetere, parlare più lentamente o confermare quello che ha detto.",
    "a2-cando-recognize-plain-forms-descriptor":
      "Riesco a riconoscere verbi e aggettivi in forma semplice in un dialogo informale quotidiano.",
    "a2-cando-intentions-plans-descriptor":
      "Riesco a esprimere i miei piani e le mie intenzioni.",
    "a2-cando-invite-accept-decline-descriptor":
      "Riesco a invitare qualcuno e ad accettare o rifiutare educatamente un invito.",
    "a2-cando-arrange-meeting-descriptor":
      "Riesco a organizzare un orario e un luogo per incontrare qualcuno.",
    "a2-cando-experience-takoto-descriptor":
      "Riesco a parlare di cose che ho già vissuto.",
    "a2-cando-narrate-order-descriptor":
      "Riesco a raccontare una breve sequenza di eventi passati in ordine.",
    "a2-cando-ask-experience-descriptor":
      "Riesco a chiedere a qualcuno se ha mai vissuto qualcosa.",
    "a2-cando-give-reasons-descriptor":
      "Riesco a dare una motivazione per un'affermazione o una decisione.",
    "a2-cando-reason-kara-descriptor":
      "Riesco a esprimere una motivazione diretta e personale.",
    "a2-cando-reason-node-descriptor":
      "Riesco a esprimere una motivazione più oggettiva e cortese.",
    "a2-cando-opinion-toomou-descriptor":
      "Riesco a esprimere una mia opinione.",
    "a2-cando-agree-disagree-descriptor":
      "Riesco a essere d'accordo o in disaccordo con l'opinione di qualcuno.",
  },
});

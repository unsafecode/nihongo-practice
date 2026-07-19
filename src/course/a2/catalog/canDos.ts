/**
 * A2 Can-do registry (Phase 3 Task 4; canonical taxonomy restored by the
 * Phase 3 Task 5 spec-fix).
 *
 * The complete, stable Can-do identity/domain registry for all 59 Phase-3
 * Can-dos: the 15 grammar Can-dos (one per `a2/forms/grammarSpiral.ts` row,
 * using its exact `canDoId`), 40 topical Can-dos (reading/writing/
 * spoken-production/interaction — the only listening Can-do is the grammar
 * `recognize-plain-forms`), and 4 capstone-scenario Can-dos (served by
 * the future `a2-synthesis` module, exactly like A1's Module 12 capstones —
 * left as pure stubs with no served lessons yet, never fabricated). Every id
 * here is the exact, authoritative canonical name — Task 4 had shipped a
 * redesigned taxonomy that renamed/consolidated several topical ids (e.g.
 * "describe-ongoing" -> "describe-ongoing-action", "can-cannot" ->
 * "express-ability", and collapsed two distinct M7/M8 Can-dos into one
 * shared "ask-for-help"); Task 5 restores the canonical names below with no
 * alias map.
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
// 15 grammar Can-dos — exactly the grammar-spiral row ids as `a2-cando-<id>`.
// Domain is per-id (never a blanket "spoken-production"): most grammar
// constructions are practiced through interactive direct-address speech acts
// (asking/giving permission, requesting, refusing), a handful are genuinely
// monologue-shaped spoken production (sequencing, describing, opining,
// comparing, connecting ideas), and recognizing plain-form speech is a
// listening skill.
// ---------------------------------------------------------------------------

const GRAMMAR_CANDO_DOMAIN: Readonly<Record<string, CanDoDomain>> = {
  "a2-cando-recognize-plain-forms": "listening",
  "a2-cando-sequence-te": "spoken-production",
  "a2-cando-ongoing-teiru": "spoken-production",
  "a2-cando-request-tekudasai": "interaction",
  "a2-cando-permission-temoii": "interaction",
  "a2-cando-prohibition-tewaikenai": "interaction",
  "a2-cando-negative-request": "interaction",
  "a2-cando-experience-takoto": "interaction",
  "a2-cando-intentions-plans": "spoken-production",
  "a2-cando-reason-kara": "interaction",
  "a2-cando-reason-node": "interaction",
  "a2-cando-opinion-toomou": "spoken-production",
  "a2-cando-compare": "spoken-production",
  "a2-cando-possibility": "interaction",
  "a2-cando-connectors": "spoken-production",
};

function grammarDomain(canDoId: string): CanDoDomain {
  const domain = GRAMMAR_CANDO_DOMAIN[canDoId];
  if (!domain) {
    throw new Error(`GRAMMAR_CANDO_DOMAIN: no domain mapped for grammar Can-do "${canDoId}".`);
  }
  return domain;
}

const GRAMMAR_STUBS: readonly A2CanDoStub[] = A2_GRAMMAR_SPIRAL.map((row) =>
  stub(row.canDoId, "grammar", grammarDomain(row.canDoId)),
);

// ---------------------------------------------------------------------------
// 40 topical Can-dos — the exact canonical Phase 3 taxonomy.
// ---------------------------------------------------------------------------

const TOPICAL_STUBS: readonly A2CanDoStub[] = [
  // --- interaction (21) ---
  stub("a2-cando-backchannel-followup", "topical", "interaction"),
  stub("a2-cando-clarify-repeat", "topical", "interaction"),
  stub("a2-cando-invite-accept-decline", "topical", "interaction"),
  stub("a2-cando-arrange-meeting", "topical", "interaction"),
  stub("a2-cando-ask-experience", "topical", "interaction"),
  stub("a2-cando-agree-disagree", "topical", "interaction"),
  stub("a2-cando-ask-directions", "topical", "interaction"),
  stub("a2-cando-order-food", "topical", "interaction"),
  stub("a2-cando-special-request", "topical", "interaction"),
  stub("a2-cando-report-problem", "topical", "interaction"),
  stub("a2-cando-pay-handle-problem", "topical", "interaction"),
  stub("a2-cando-ask-price-decide", "topical", "interaction"),
  stub("a2-cando-return-exchange", "topical", "interaction"),
  stub("a2-cando-advice-tahouga", "topical", "interaction"),
  stub("a2-cando-get-better", "topical", "interaction"),
  stub("a2-cando-clinic-appointment", "topical", "interaction"),
  stub("a2-cando-make-reservation", "topical", "interaction"),
  stub("a2-cando-travel-schedule", "topical", "interaction"),
  stub("a2-cando-travel-problem", "topical", "interaction"),
  stub("a2-cando-change-cancel", "topical", "interaction"),
  stub("a2-cando-choose-gift", "topical", "interaction"),

  // --- spoken-production (11) ---
  stub("a2-cando-narrate-order", "topical", "spoken-production"),
  stub("a2-cando-give-reasons", "topical", "spoken-production"),
  stub("a2-cando-describe-now", "topical", "spoken-production"),
  stub("a2-cando-describe-ongoing", "topical", "spoken-production"),
  stub("a2-cando-morning-routine", "topical", "spoken-production"),
  stub("a2-cando-can-cannot", "topical", "spoken-production"),
  stub("a2-cando-explain-facility", "topical", "spoken-production"),
  stub("a2-cando-describe-symptoms", "topical", "spoken-production"),
  stub("a2-cando-family-relations", "topical", "spoken-production"),
  stub("a2-cando-give-receive", "topical", "spoken-production"),
  stub("a2-cando-events-celebrations", "topical", "spoken-production"),

  // --- writing (5) ---
  stub("a2-cando-message-late-absent", "topical", "writing"),
  stub("a2-cando-ask-colleague", "topical", "writing"),
  stub("a2-cando-report-progress", "topical", "writing"),
  stub("a2-cando-reply-confirm", "topical", "writing"),
  stub("a2-cando-fill-form", "topical", "writing"),

  // --- reading (3) ---
  stub("a2-cando-read-schedule", "topical", "reading"),
  stub("a2-cando-read-notice", "topical", "reading"),
  stub("a2-cando-read-reply-message", "topical", "reading"),
];

// ---------------------------------------------------------------------------
// 4 capstone-scenario Can-dos (served by the future a2-synthesis module —
// pure stubs, never fabricated lessons; mirrors A1's Module 12 capstones).
// scenario-trip-recount is spoken-production (a narrated recount); the other
// three are interaction (a lived multi-turn exchange).
// ---------------------------------------------------------------------------

const SCENARIO_STUBS: readonly A2CanDoStub[] = [
  stub("a2-cando-scenario-weekend-outing", "scenario", "interaction"),
  stub("a2-cando-scenario-service-shopping", "scenario", "interaction"),
  stub("a2-cando-scenario-health-absence", "scenario", "interaction"),
  stub("a2-cando-scenario-trip-recount", "scenario", "spoken-production"),
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

/**
 * The 17 distinct Can-do ids the M5-M8 lessons (Phase 3 Task 5) actually
 * serve: 7 grammar-spiral ids (`sequence-te`, `ongoing-teiru`,
 * `permission-temoii`, `prohibition-tewaikenai`, `request-tekudasai`,
 * `negative-request`, `possibility`) plus 10 topical/interaction ids
 * (`describe-now`, `describe-ongoing`, `morning-routine`, `can-cannot`,
 * `ask-directions`, `explain-facility`, `order-food`, `special-request`,
 * `report-problem`, `pay-handle-problem`). 17, not 16: `ask-directions`
 * (neighborhood-services-3) and `special-request` (restaurant-problems-2)
 * are two genuinely distinct Can-dos — Task 4's redesigned registry had
 * incorrectly collapsed both into one shared "ask-for-help" id, which this
 * Phase 3 Task 5 spec-fix restores as two canonical ids (see
 * `canDos.test.ts`'s "16-lesson M5-M8 recipe mapping" suite for the full
 * per-lesson mapping).
 */
export const A2_M5_M8_SERVED_CANDO_IDS: readonly string[] = Object.freeze([
  "a2-cando-sequence-te",
  "a2-cando-describe-now",
  "a2-cando-describe-ongoing",
  "a2-cando-ongoing-teiru",
  "a2-cando-morning-routine",
  "a2-cando-permission-temoii",
  "a2-cando-prohibition-tewaikenai",
  "a2-cando-request-tekudasai",
  "a2-cando-negative-request",
  "a2-cando-possibility",
  "a2-cando-can-cannot",
  "a2-cando-ask-directions",
  "a2-cando-explain-facility",
  "a2-cando-order-food",
  "a2-cando-special-request",
  "a2-cando-report-problem",
  "a2-cando-pay-handle-problem",
]);

/**
 * The complete, honest 32-id staged subset the 32 authored M1-M8 lessons
 * serve — the union of `A2_M1_M4_SERVED_CANDO_IDS` and
 * `A2_M5_M8_SERVED_CANDO_IDS`, with no overlap between the two. Exported so
 * `modules01to08.test.ts` can request exactly this subset from
 * `buildA2CanDos`/`buildA2CanDoLessonMap` without importing modules 9+
 * (which do not exist yet) — mirrors `A2_M1_M4_SERVED_CANDO_IDS`'s own
 * contract exactly, just widened as M5-M8 land.
 */
export const A2_M1_M8_SERVED_CANDO_IDS: readonly string[] = Object.freeze([
  ...A2_M1_M4_SERVED_CANDO_IDS,
  ...A2_M5_M8_SERVED_CANDO_IDS,
]);

/**
 * The 15 distinct Can-do ids FIRST served by the M9-M12 lessons (Phase 3
 * Task 6): 1 grammar-spiral id introduced in this range
 * (`compare` — genuinely new here, introduced at shopping-returns-1/2) plus
 * 14 topical ids (`ask-price-decide`, `return-exchange`,
 * `describe-symptoms`, `advice-tahouga`, `get-better`,
 * `clinic-appointment`, `message-late-absent`, `ask-colleague`,
 * `report-progress`, `reply-confirm`, `make-reservation`,
 * `travel-schedule`, `travel-problem`, `change-cancel`). Deliberately
 * excludes every id M9-M12 merely RECOMBINES from an earlier block
 * (`opinion-toomou`/`possibility`/`reason-kara`/`reason-node`/
 * `negative-request`/`request-tekudasai`/`ongoing-teiru`/
 * `intentions-plans`/`experience-takoto` — all already served by
 * `A2_M1_M8_SERVED_CANDO_IDS`), so `A2_M1_M12_SERVED_CANDO_IDS`'s own
 * concatenation stays duplicate-free.
 */
export const A2_M9_M12_SERVED_CANDO_IDS: readonly string[] = Object.freeze([
  "a2-cando-compare",
  "a2-cando-ask-price-decide",
  "a2-cando-return-exchange",
  "a2-cando-describe-symptoms",
  "a2-cando-advice-tahouga",
  "a2-cando-get-better",
  "a2-cando-clinic-appointment",
  "a2-cando-message-late-absent",
  "a2-cando-ask-colleague",
  "a2-cando-report-progress",
  "a2-cando-reply-confirm",
  "a2-cando-make-reservation",
  "a2-cando-travel-schedule",
  "a2-cando-travel-problem",
  "a2-cando-change-cancel",
]);

/**
 * The complete, honest 47-id staged subset the 48 authored M1-M12 lessons
 * serve — the union of `A2_M1_M8_SERVED_CANDO_IDS` and
 * `A2_M9_M12_SERVED_CANDO_IDS`, with no overlap between the two (47, not
 * 32+15's naive 47 minus zero — every M9-M12-reused id is already counted
 * once, in `A2_M1_M8_SERVED_CANDO_IDS`). Exported so
 * `modules01to12.test.ts` can request exactly this subset from
 * `buildA2CanDos`/`buildA2CanDoLessonMap` without importing modules 13+
 * (which do not exist yet) — mirrors `A2_M1_M8_SERVED_CANDO_IDS`'s own
 * contract exactly, just widened as M9-M12 land.
 */
export const A2_M1_M12_SERVED_CANDO_IDS: readonly string[] = Object.freeze([
  ...A2_M1_M8_SERVED_CANDO_IDS,
  ...A2_M9_M12_SERVED_CANDO_IDS,
]);

// ---------------------------------------------------------------------------
// Bilingual descriptor copy (the 32 M1-M8-served Can-dos only — the other 27
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
    "a2-cando-sequence-te-descriptor":
      "I can describe two or more actions in the order they happen, using the te-form.",
    "a2-cando-describe-now-descriptor":
      "I can describe what I am doing as part of a short daily sequence.",
    "a2-cando-describe-ongoing-descriptor":
      "I can describe an action that is happening right now.",
    "a2-cando-ongoing-teiru-descriptor":
      "I can describe an ongoing action or a resulting state using the teiru form.",
    "a2-cando-morning-routine-descriptor":
      "I can describe my daily routine, step by step.",
    "a2-cando-permission-temoii-descriptor":
      "I can ask for and give permission using the temoii construction.",
    "a2-cando-prohibition-tewaikenai-descriptor":
      "I can say that something is not allowed using the tewaikenai construction.",
    "a2-cando-request-tekudasai-descriptor":
      "I can politely ask someone to do something using the tekudasai construction.",
    "a2-cando-negative-request-descriptor":
      "I can politely ask someone not to do something using a negative request construction.",
    "a2-cando-possibility-descriptor":
      "I can say what is possible to do somewhere, using a koto-ga-dekimasu construction.",
    "a2-cando-can-cannot-descriptor":
      "I can say what I can and cannot do.",
    "a2-cando-ask-directions-descriptor":
      "I can ask for directions to a place in my neighborhood, or ask someone for help.",
    "a2-cando-explain-facility-descriptor":
      "I can describe a local facility, including where it is and whether it's open.",
    "a2-cando-order-food-descriptor":
      "I can order food and drinks and confirm my order with a server or clerk.",
    "a2-cando-special-request-descriptor":
      "I can make a special request, such as asking permission or asking for a favor while ordering.",
    "a2-cando-report-problem-descriptor":
      "I can recount what happened and explain a problem with an order.",
    "a2-cando-pay-handle-problem-descriptor":
      "I can handle paying and a small problem in a short exchange.",
    "a2-cando-compare-descriptor":
      "I can compare two things, and say which one is the most, using comparison phrases.",
    "a2-cando-ask-price-decide-descriptor":
      "I can ask the price of something and decide what to buy.",
    "a2-cando-return-exchange-descriptor":
      "I can return or exchange an item at a shop.",
    "a2-cando-describe-symptoms-descriptor":
      "I can describe simple symptoms, like saying what hurts or how I feel.",
    "a2-cando-advice-tahouga-descriptor":
      "I can give simple advice, saying what someone should do.",
    "a2-cando-get-better-descriptor":
      "I can talk about getting better after being unwell.",
    "a2-cando-clinic-appointment-descriptor":
      "I can make or change a clinic appointment.",
    "a2-cando-message-late-absent-descriptor":
      "I can write a short message saying I will be late or absent.",
    "a2-cando-ask-colleague-descriptor":
      "I can ask a colleague or classmate to help with something specific.",
    "a2-cando-report-progress-descriptor":
      "I can report what I am currently working on.",
    "a2-cando-reply-confirm-descriptor":
      "I can reply to confirm that I understand or agree.",
    "a2-cando-make-reservation-descriptor":
      "I can make a simple travel reservation.",
    "a2-cando-travel-schedule-descriptor":
      "I can describe a simple travel schedule, like how and when I arrive.",
    "a2-cando-travel-problem-descriptor":
      "I can explain a problem that comes up while traveling.",
    "a2-cando-change-cancel-descriptor":
      "I can change or cancel a reservation.",
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
    "a2-cando-sequence-te-descriptor":
      "Riesco a descrivere due o più azioni nell'ordine in cui avvengono, usando la forma in te.",
    "a2-cando-describe-now-descriptor":
      "Riesco a descrivere quello che sto facendo come parte di una breve sequenza quotidiana.",
    "a2-cando-describe-ongoing-descriptor":
      "Riesco a descrivere un'azione che sta accadendo proprio ora.",
    "a2-cando-ongoing-teiru-descriptor":
      "Riesco a descrivere un'azione in corso o uno stato risultante usando la forma teiru.",
    "a2-cando-morning-routine-descriptor":
      "Riesco a descrivere la mia routine quotidiana, passo dopo passo.",
    "a2-cando-permission-temoii-descriptor":
      "Riesco a chiedere e dare il permesso usando la costruzione temoii.",
    "a2-cando-prohibition-tewaikenai-descriptor":
      "Riesco a dire che qualcosa non è permesso usando la costruzione tewaikenai.",
    "a2-cando-request-tekudasai-descriptor":
      "Riesco a chiedere educatamente a qualcuno di fare qualcosa usando la costruzione tekudasai.",
    "a2-cando-negative-request-descriptor":
      "Riesco a chiedere educatamente a qualcuno di non fare qualcosa usando una costruzione negativa.",
    "a2-cando-possibility-descriptor":
      "Riesco a dire cosa è possibile fare in un posto, usando una costruzione koto-ga-dekimasu.",
    "a2-cando-can-cannot-descriptor":
      "Riesco a dire cosa so e cosa non so fare.",
    "a2-cando-ask-directions-descriptor":
      "Riesco a chiedere indicazioni per raggiungere un posto nel quartiere, o chiedere aiuto a qualcuno.",
    "a2-cando-explain-facility-descriptor":
      "Riesco a descrivere un servizio del quartiere, dove si trova e se è aperto.",
    "a2-cando-order-food-descriptor":
      "Riesco a ordinare cibo e bevande e confermare il mio ordine con un cameriere o un commesso.",
    "a2-cando-special-request-descriptor":
      "Riesco a fare una richiesta speciale, ad esempio chiedere il permesso o un favore mentre ordino.",
    "a2-cando-report-problem-descriptor":
      "Riesco a raccontare cosa è successo e spiegare un problema con un ordine.",
    "a2-cando-pay-handle-problem-descriptor":
      "Riesco a gestire il pagamento e un piccolo problema in un breve scambio.",
    "a2-cando-compare-descriptor":
      "Riesco a confrontare due cose, e dire quale sia la più, usando espressioni di confronto.",
    "a2-cando-ask-price-decide-descriptor":
      "Riesco a chiedere il prezzo di qualcosa e decidere cosa comprare.",
    "a2-cando-return-exchange-descriptor":
      "Riesco a restituire o cambiare un articolo in un negozio.",
    "a2-cando-describe-symptoms-descriptor":
      "Riesco a descrivere sintomi semplici, dicendo cosa mi fa male o come mi sento.",
    "a2-cando-advice-tahouga-descriptor":
      "Riesco a dare un consiglio semplice, dicendo cosa qualcuno dovrebbe fare.",
    "a2-cando-get-better-descriptor":
      "Riesco a parlare del migliorare dopo essere stato male.",
    "a2-cando-clinic-appointment-descriptor":
      "Riesco a prendere o cambiare un appuntamento in ambulatorio.",
    "a2-cando-message-late-absent-descriptor":
      "Riesco a scrivere un breve messaggio per dire che farò tardi o che sarò assente.",
    "a2-cando-ask-colleague-descriptor":
      "Riesco a chiedere a un collega o un compagno di aiutarmi con qualcosa di specifico.",
    "a2-cando-report-progress-descriptor":
      "Riesco a riferire su cosa sto lavorando in questo momento.",
    "a2-cando-reply-confirm-descriptor":
      "Riesco a rispondere per confermare di aver capito o di essere d'accordo.",
    "a2-cando-make-reservation-descriptor":
      "Riesco a fare una semplice prenotazione di viaggio.",
    "a2-cando-travel-schedule-descriptor":
      "Riesco a descrivere un semplice programma di viaggio, come e quando arrivo.",
    "a2-cando-travel-problem-descriptor":
      "Riesco a spiegare un problema che si presenta durante un viaggio.",
    "a2-cando-change-cancel-descriptor":
      "Riesco a cambiare o cancellare una prenotazione.",
  },
});

/**
 * A1 productive-verb recurrence wiring (§9.3 rules 3-5).
 *
 * Modules 2, 4 and 5 introduce productive verb senses with `laterUses: []` in
 * their raw {@link VerbUseRecord} arrays — those records stay frozen and empty
 * so the Modules 1-4 regression suite keeps asserting a clean introduction
 * timeline. This module performs a *non-mutating* immutable merge: for every
 * introduced sense it produces a NEW record (via {@link withA1LaterUses}) that
 * appends the genuine later, spaced reuses authored in Modules 5-8.
 *
 * Every later use points at a MODEL variant of the hosting lesson whose target
 * predicate genuinely realizes that sense (a correctness-bearing building block,
 * never a catalog-only mention). Each sense gains:
 *   - ≥2 later-lesson variants,
 *   - a canonical position gap ≥2 vs. the introduction,
 *   - at least one use in a later module,
 *   - ≥2 distinct structure keys across intro + reuse.
 *
 * The raw arrays are re-exported untouched; consumers that want the recurrence
 * timeline import {@link a1AugmentedVerbUseRecords}.
 */

import type { VerbLaterUse, VerbUseRecord } from "../../foundations/types";
import { withA1LaterUses } from "./shared";
import { module2VerbUseRecords } from "./module02Introductions";
import { module4VerbUseRecords } from "./module04Actions";
import { module5VerbUseRecords } from "./module05Routines";
import { module8VerbUseRecords } from "./module08People";
import { module9VerbUseRecords } from "./module09Descriptions";
import { module10VerbUseRecords } from "./module10Shopping";
import { module11VerbUseRecords } from "./module11ExistenceNeeds";

/** senseId → the later, spaced reuses authored across Modules 5-8. */
const LATER_USES_BY_SENSE: Readonly<
  Record<string, readonly VerbLaterUse[]>
> = Object.freeze({
  // --- Module 2 senses (introductions) ---
  "a1-sense-be": [
    { lessonId: "past-negative-4", variantId: "past-negative-4-m1" },
    { lessonId: "people-1", variantId: "people-1-m1" },
  ],
  "a1-sense-live": [
    { lessonId: "people-1", variantId: "people-1-m7" },
    { lessonId: "places-3", variantId: "places-3-m7" },
  ],
  "a1-sense-study": [
    { lessonId: "past-negative-3", variantId: "past-negative-3-m1" },
    { lessonId: "people-2", variantId: "people-2-m2" },
  ],
  "a1-sense-work": [
    { lessonId: "past-negative-2", variantId: "past-negative-2-m2" },
    { lessonId: "places-2", variantId: "places-2-m5" },
  ],
  "a1-sense-understand": [
    { lessonId: "past-negative-2", variantId: "past-negative-2-m3" },
    { lessonId: "past-negative-4", variantId: "past-negative-4-m7" },
  ],
  "a1-sense-do": [
    { lessonId: "past-negative-1", variantId: "past-negative-1-m2" },
    { lessonId: "people-2", variantId: "people-2-m3" },
  ],
  // --- Module 4 senses (actions) ---
  "a1-sense-eat": [
    { lessonId: "routines-4", variantId: "routines-4-m8" },
    { lessonId: "past-negative-1", variantId: "past-negative-1-m1" },
  ],
  "a1-sense-drink": [
    { lessonId: "past-negative-2", variantId: "past-negative-2-m1" },
    { lessonId: "people-1", variantId: "people-1-m5" },
  ],
  "a1-sense-read": [
    { lessonId: "routines-4", variantId: "routines-4-m5" },
    { lessonId: "past-negative-3", variantId: "past-negative-3-m2" },
  ],
  "a1-sense-go": [
    { lessonId: "routines-4", variantId: "routines-4-m3" },
    { lessonId: "places-1", variantId: "places-1-m1" },
  ],
  "a1-sense-come": [
    { lessonId: "routines-4", variantId: "routines-4-m6" },
    { lessonId: "places-1", variantId: "places-1-m3" },
  ],
  "a1-sense-accompany": [
    { lessonId: "people-4", variantId: "people-4-m1" },
    { lessonId: "capstones-1", variantId: "capstones-1-m6" },
  ],
  "a1-sense-ask": [
    { lessonId: "past-negative-2", variantId: "past-negative-2-m4" },
    { lessonId: "people-3", variantId: "people-3-m3" },
  ],
  "a1-sense-buy": [
    { lessonId: "past-negative-1", variantId: "past-negative-1-m3" },
    { lessonId: "people-4", variantId: "people-4-m4" },
  ],
  "a1-sense-see": [
    { lessonId: "past-negative-2", variantId: "past-negative-2-m5" },
    { lessonId: "people-4", variantId: "people-4-m3" },
  ],
  "a1-sense-listen": [
    { lessonId: "past-negative-2", variantId: "past-negative-2-m6" },
    { lessonId: "people-4", variantId: "people-4-m5" },
  ],
  "a1-sense-write": [
    { lessonId: "past-negative-1", variantId: "past-negative-1-m4" },
    { lessonId: "people-2", variantId: "people-2-m4" },
  ],
  // --- Module 5 senses (routines) ---
  "a1-sense-wake": [
    { lessonId: "past-negative-1", variantId: "past-negative-1-m6" },
    { lessonId: "past-negative-3", variantId: "past-negative-3-m3" },
  ],
  "a1-sense-sleep": [
    { lessonId: "past-negative-1", variantId: "past-negative-1-m7" },
    { lessonId: "past-negative-3", variantId: "past-negative-3-m4" },
  ],
  "a1-sense-go-out": [
    { lessonId: "past-negative-2", variantId: "past-negative-2-m7" },
    { lessonId: "past-negative-3", variantId: "past-negative-3-m5" },
  ],
  "a1-sense-return": [
    { lessonId: "past-negative-1", variantId: "past-negative-1-m8" },
    { lessonId: "past-negative-2", variantId: "past-negative-2-m8" },
  ],
  "a1-sense-study-routine": [
    { lessonId: "past-negative-3", variantId: "past-negative-3-m6" },
    { lessonId: "people-2", variantId: "people-2-m5" },
  ],
  "a1-sense-eat-routine": [
    { lessonId: "past-negative-3", variantId: "past-negative-3-m8" },
    { lessonId: "people-2", variantId: "people-2-m6" },
  ],
  "a1-sense-read-routine": [
    { lessonId: "past-negative-3", variantId: "past-negative-3-m7" },
    { lessonId: "people-2", variantId: "people-2-m7" },
  ],
  // --- Module 9 senses (descriptions) — reused across the capstones ---
  "a1-sense-hot": [
    { lessonId: "capstones-4", variantId: "capstones-4-m5" },
    { lessonId: "capstones-4", variantId: "capstones-4-t2" },
  ],
  "a1-sense-cold": [
    { lessonId: "capstones-4", variantId: "capstones-4-m6" },
    { lessonId: "capstones-4", variantId: "capstones-4-t1" },
  ],
  "a1-sense-quiet": [
    { lessonId: "capstones-4", variantId: "capstones-4-m7" },
    { lessonId: "capstones-4", variantId: "capstones-4-t4" },
  ],
  "a1-sense-big": [
    { lessonId: "capstones-1", variantId: "capstones-1-m4" },
    { lessonId: "capstones-1", variantId: "capstones-1-t1" },
  ],
  "a1-sense-small": [
    { lessonId: "capstones-1", variantId: "capstones-1-m5" },
    { lessonId: "capstones-1", variantId: "capstones-1-t3" },
  ],
  "a1-sense-like": [
    { lessonId: "capstones-2", variantId: "capstones-2-m6" },
    { lessonId: "capstones-2", variantId: "capstones-2-t4" },
  ],
  "a1-sense-dislike": [
    { lessonId: "capstones-3", variantId: "capstones-3-m2" },
    { lessonId: "capstones-3", variantId: "capstones-3-t1" },
  ],
  // --- Module 10 senses (shopping) — reused across the capstones ---
  "a1-sense-expensive": [
    { lessonId: "capstones-2", variantId: "capstones-2-m2" },
    { lessonId: "shopping-3", variantId: "shopping-3-m5" },
  ],
  "a1-sense-cheap": [
    { lessonId: "capstones-2", variantId: "capstones-2-m3" },
    { lessonId: "capstones-2", variantId: "capstones-2-t2" },
  ],
  "a1-sense-request": [
    { lessonId: "capstones-2", variantId: "capstones-2-m5" },
    { lessonId: "capstones-2", variantId: "capstones-2-t3" },
  ],
  // --- Module 11 senses (existence & needs) — reused across the capstones ---
  "a1-sense-exist-inanimate": [
    { lessonId: "capstones-3", variantId: "capstones-3-m4" },
    { lessonId: "capstones-3", variantId: "capstones-3-t2" },
  ],
  "a1-sense-exist-animate": [
    { lessonId: "capstones-3", variantId: "capstones-3-m6" },
    { lessonId: "capstones-3", variantId: "capstones-3-t3" },
  ],
  "a1-sense-want": [
    { lessonId: "capstones-3", variantId: "capstones-3-m8" },
    { lessonId: "capstones-3", variantId: "capstones-3-t4" },
  ],
});

/** Attach each record's authored later uses (fails loudly if none exist). */
function augment(records: readonly VerbUseRecord[]): readonly VerbUseRecord[] {
  return records.map((record) => {
    const additions = LATER_USES_BY_SENSE[record.senseId];
    if (additions === undefined) {
      throw new Error(
        `A1 recurrence: no later uses authored for sense ${record.senseId}`,
      );
    }
    return withA1LaterUses(record, additions);
  });
}

/**
 * The forward direction of the map/record correspondence: every key in
 * `laterUsesBySense` must name a sense some record actually introduces.
 * `augment` above already fails closed when a record has NO map entry (a
 * missing key); without this check the reverse case — a map key with no
 * matching record (a typo'd sense id, or a stale entry left behind after a
 * sense was removed/renamed) — was silently ignored, since nothing ever
 * iterated `Object.keys(laterUsesBySense)` looking for orphans. Exported
 * (pure, dependency-injected) so this contract is unit-testable directly
 * against synthetic maps/records, not only through the full frozen catalog.
 */
export function assertNoStaleLaterUseKeys(
  laterUsesBySense: Readonly<Record<string, readonly VerbLaterUse[]>>,
  records: readonly VerbUseRecord[],
): void {
  const introducedSenseIds = new Set(records.map((record) => record.senseId));
  const staleKeys = Object.keys(laterUsesBySense)
    .filter((senseId) => !introducedSenseIds.has(senseId))
    .sort();
  if (staleKeys.length > 0) {
    throw new Error(
      `A1 recurrence: stale later-use map key(s) with no introduced record: ${staleKeys.join(", ")}`,
    );
  }
}

/** The raw Modules 2/4/5 introduction records (later uses land in Modules 4-8). */
const deepModuleRawRecords: readonly VerbUseRecord[] = [
  ...module2VerbUseRecords,
  ...module4VerbUseRecords,
  ...module5VerbUseRecords,
];

/** The people companion plus Modules 9/10/11 records (later uses land in capstones). */
const descriptiveModuleRawRecords: readonly VerbUseRecord[] = [
  ...module8VerbUseRecords,
  ...module9VerbUseRecords,
  ...module10VerbUseRecords,
  ...module11VerbUseRecords,
];

// `LATER_USES_BY_SENSE` is a single map shared by both raw-record groups
// above, so the stale-key check runs once, at module load, over their
// union — never per-group, which would wrongly flag a later group while
// validating only the Modules 2/4/5 group.
assertNoStaleLaterUseKeys(LATER_USES_BY_SENSE, [
  ...deepModuleRawRecords,
  ...descriptiveModuleRawRecords,
]);

/**
 * The 23 Modules 2/4/5 productive verb records, augmented with their authored
 * later, spaced reuses across Modules 4-8. This is the Task-3 recurrence view:
 * it resolves entirely within the Modules 2-8 catalog, so the deep-authoring
 * suite can assert it in isolation. Non-mutating — the source arrays remain
 * `laterUses: []`.
 */
export const a1AugmentedVerbUseRecords: readonly VerbUseRecord[] = Object.freeze(
  augment(deepModuleRawRecords),
);

/**
 * The full A1 release recurrence view: the 23 deep-module records plus the
 * companion and 13 Modules 9/10/11 senses whose spaced reuses are the four
 * capstone syntheses.
 * Consumers assembling the whole 48-lesson level (catalog / release validator)
 * import this so every productive sense — early and late — resolves its timeline.
 */
export const a1ReleaseVerbUseRecords: readonly VerbUseRecord[] = Object.freeze([
  ...a1AugmentedVerbUseRecords,
  ...augment(descriptiveModuleRawRecords),
]);

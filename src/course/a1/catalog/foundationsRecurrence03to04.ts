/**
 * Staged recurrence wiring for Foundations modules 03–04.
 *
 * This file deliberately does not participate in the published recurrence
 * module: importing it would pull unpromoted lessons into the 12/48 runtime
 * bundle before Task 5.
 */

import type { VerbLaterUse, VerbUseRecord } from "../../foundations/types";
import { withA1LaterUses } from "./shared";
import { modulePoliteVerbsVerbUseRecords } from "./modulePoliteVerbs";
import { moduleTimeMovementVerbUseRecords } from "./moduleTimeMovement";
import { a1StagedFoundationsArea01to02VerbUseRecords } from "./recurrence";

const LATER_USES_BY_SENSE: Readonly<Record<string, readonly VerbLaterUse[]>> =
  Object.freeze({
    "a1-sense-work-bare": [
      { lessonId: "introductions-4", variantId: "introductions-4-m6" },
      { lessonId: "routines-4", variantId: "routines-4-m1" },
    ],
    "a1-sense-study-bare": [
      { lessonId: "introductions-4", variantId: "introductions-4-m5" },
      { lessonId: "routines-4", variantId: "routines-4-m2" },
    ],
    "a1-sense-do-bare": [
      { lessonId: "introductions-4", variantId: "introductions-4-m7" },
      { lessonId: "routines-4", variantId: "routines-4-m3" },
    ],
    "a1-sense-rest-bare": [
      { lessonId: "time-movement-3", variantId: "time-movement-3-m7" },
      { lessonId: "time-movement-3", variantId: "time-movement-3-m8" },
    ],
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
    "a1-sense-write": [
      { lessonId: "past-negative-1", variantId: "past-negative-1-m4" },
      { lessonId: "people-2", variantId: "people-2-m4" },
    ],
    "a1-sense-see": [
      { lessonId: "past-negative-2", variantId: "past-negative-2-m5" },
      { lessonId: "people-4", variantId: "people-4-m3" },
    ],
    "a1-sense-listen": [
      { lessonId: "past-negative-2", variantId: "past-negative-2-m6" },
      { lessonId: "people-4", variantId: "people-4-m5" },
    ],
    "a1-sense-buy": [
      { lessonId: "past-negative-1", variantId: "past-negative-1-m3" },
      { lessonId: "people-4", variantId: "people-4-m4" },
    ],
    "a1-sense-return-bare": [
      { lessonId: "time-movement-3", variantId: "time-movement-3-m5" },
      { lessonId: "time-movement-3", variantId: "time-movement-3-m6" },
    ],
    "a1-sense-work": [
      { lessonId: "past-negative-2", variantId: "past-negative-2-m2" },
      { lessonId: "places-2", variantId: "places-2-m5" },
    ],
    "a1-sense-return-location": [
      { lessonId: "time-movement-4", variantId: "time-movement-4-m2" },
      { lessonId: "time-movement-4", variantId: "time-movement-4-m3" },
    ],
    "a1-sense-study-routine": [
      { lessonId: "time-movement-3", variantId: "time-movement-3-m3" },
      { lessonId: "people-2", variantId: "people-2-m5" },
    ],
    "a1-sense-return": [
      { lessonId: "time-movement-3", variantId: "time-movement-3-m2" },
      { lessonId: "past-negative-1", variantId: "past-negative-1-m8" },
    ],
  });

function augment(
  records: readonly VerbUseRecord[],
): readonly VerbUseRecord[] {
  return records.map((record) => {
    const uses = LATER_USES_BY_SENSE[record.senseId];
    if (!uses) {
      throw new Error(`Missing staged Foundations later uses for ${record.senseId}.`);
    }
    return withA1LaterUses(record, uses);
  });
}

/** Final-two-module records only; no published recurrence view imports this. */
export const a1StagedFoundationsArea03to04VerbUseRecords: readonly VerbUseRecord[] =
  Object.freeze([
    ...augment(modulePoliteVerbsVerbUseRecords),
    ...augment(moduleTimeMovementVerbUseRecords),
  ]);

/** All expanded Foundations recurrence records, retained exclusively for staging. */
export const a1ExpandedFoundationsVerbUseRecords: readonly VerbUseRecord[] =
  Object.freeze([
    ...a1StagedFoundationsArea01to02VerbUseRecords,
    ...a1StagedFoundationsArea03to04VerbUseRecords,
  ]);

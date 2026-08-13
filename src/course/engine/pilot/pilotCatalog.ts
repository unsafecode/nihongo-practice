import type { Lesson } from "../types";
import { konbiniImmersion } from "./konbiniImmersion";
import { politePresentBlock } from "./politePresentBlock";

/**
 * Slug → Lesson catalog for the Phase 0 preview route (Task 13,
 * `#/anteprima/:pilotId`). The slug is deliberately distinct from the
 * lesson's own `id`: the URL is a stable, human-authored public identifier,
 * while the lesson id is the engine's internal content key. Keeping this
 * mapping pure and React-free means it can be imported by plain unit tests
 * (and eventually e2e specs) with no DOM.
 */
export const PILOT_LESSON_SLUGS = [
  "polite-present-block",
  "konbini-immersion",
] as const;

export type PilotLessonSlug = (typeof PILOT_LESSON_SLUGS)[number];

const PILOT_LESSONS_BY_SLUG: Readonly<Record<PilotLessonSlug, Lesson>> = {
  "polite-present-block": politePresentBlock,
  "konbini-immersion": konbiniImmersion,
};

function isPilotLessonSlug(value: string): value is PilotLessonSlug {
  return (PILOT_LESSON_SLUGS as readonly string[]).includes(value);
}

/** Looks up the pilot lesson for a preview slug. `undefined` for anything else. */
export function pilotLessonForSlug(slug: string): Lesson | undefined {
  return isPilotLessonSlug(slug) ? PILOT_LESSONS_BY_SLUG[slug] : undefined;
}

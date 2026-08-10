import type { SemanticArgumentRole } from "../../foundations/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";

export type BaseParticleSense =
  | "topic-wa"
  | "focus-subject-ga"
  | "object-o"
  | "goal-ni"
  | "direction-he"
  | "action-place-de"
  | "means-de"
  | "existence-location-ni"
  | "existential-subject-ga"
  | "time-ni"
  | "source-kara"
  | "limit-made"
  | "possessive-attributive-no"
  | "additive-mo"
  | "companion-to"
  | "listing-to"
  | "nominal-to"
  | "question-ka";

export type BaseParticleRole =
  | Extract<SemanticArgumentRole, "theme" | "goal">
  | "action-place"
  | "means"
  | "existence-location"
  | "existential-subject";

export type BasePredicateSenseId =
  | "eat"
  | "read"
  | "write"
  | "buy"
  | "go"
  | "come"
  | "return"
  | "study"
  | "work"
  | "travel"
  | "aru"
  | "iru";

export interface BaseParticleSenseDefinition {
  readonly id: BaseParticleSense;
  readonly firstTeachLessonId: string;
}

export interface BasePredicateParticleFrame {
  readonly id: BasePredicateSenseId;
  readonly requiredRoles: readonly BaseParticleRole[];
  readonly particleSensesByRole: Readonly<
    Partial<Record<BaseParticleRole, readonly BaseParticleSense[]>>
  >;
  readonly particleOwnerLessonId: string;
}

export type BaseParticleFrameError =
  | Readonly<{
      readonly code: "unknown-predicate";
      readonly predicateSenseId: string;
    }>
  | Readonly<{
      readonly code: "missing-role" | "extra-role";
      readonly predicateSenseId: string;
      readonly role: BaseParticleRole;
    }>
  | Readonly<{
      readonly code: "unlicensed-particle";
      readonly predicateSenseId: string;
      readonly role: BaseParticleRole;
      readonly particleSense: BaseParticleSense;
    }>;

export type BaseParticleFrameResult =
  | Readonly<{
      readonly ok: true;
      readonly value: Readonly<{ readonly predicateSenseId: BasePredicateSenseId }>;
    }>
  | Readonly<{ readonly ok: false; readonly errors: readonly BaseParticleFrameError[] }>;

export const BASE_PARTICLE_SENSES: readonly BaseParticleSenseDefinition[] = deepFreeze([
  { id: "topic-wa", firstTeachLessonId: "topic-questions-1" },
  { id: "focus-subject-ga", firstTeachLessonId: "topic-questions-2" },
  { id: "object-o", firstTeachLessonId: "argument-particles-1" },
  { id: "goal-ni", firstTeachLessonId: "argument-particles-2" },
  { id: "direction-he", firstTeachLessonId: "argument-particles-2" },
  { id: "action-place-de", firstTeachLessonId: "argument-particles-3" },
  { id: "means-de", firstTeachLessonId: "argument-particles-3" },
  { id: "existence-location-ni", firstTeachLessonId: "existence-location-2" },
  { id: "existential-subject-ga", firstTeachLessonId: "existence-location-2" },
  { id: "time-ni", firstTeachLessonId: "time-movement-2" },
  { id: "source-kara", firstTeachLessonId: "time-movement-2" },
  { id: "limit-made", firstTeachLessonId: "time-movement-2" },
  { id: "possessive-attributive-no", firstTeachLessonId: "topic-questions-3" },
  { id: "additive-mo", firstTeachLessonId: "topic-questions-3" },
  { id: "companion-to", firstTeachLessonId: "topic-questions-3" },
  { id: "listing-to", firstTeachLessonId: "topic-questions-3" },
  { id: "nominal-to", firstTeachLessonId: "topic-questions-3" },
  { id: "question-ka", firstTeachLessonId: "topic-questions-4" },
]);

/**
 * Maps every licensed particle sense to the content record that introduces its
 * learner-facing distinction. The mapped records are owned by
 * `BASE_FIRST_TEACH_OWNERS`.
 */
export const BASE_PARTICLE_SENSE_CONTENT_ID_BY_SENSE: Readonly<
  Record<BaseParticleSense, string>
> = deepFreeze({
  "topic-wa": "topic-wa",
  "focus-subject-ga": "focus-subject-ga",
  "object-o": "licensed-object-o",
  "goal-ni": "goal-ni",
  "direction-he": "direction-he",
  "action-place-de": "action-place-de",
  "means-de": "means-de",
  "existence-location-ni": "existence-location-ni",
  "existential-subject-ga": "existential-subject-ga",
  "time-ni": "time-ni",
  "source-kara": "source-kara",
  "limit-made": "limit-made",
  "possessive-attributive-no": "possessive-no",
  "additive-mo": "additive-mo",
  "companion-to": "companion-to",
  "listing-to": "nominal-listing-to",
  "nominal-to": "nominal-listing-to",
  "question-ka": "question-ka",
});

export function particleSenseFirstTeachContentId(
  sense: BaseParticleSense,
): string {
  return BASE_PARTICLE_SENSE_CONTENT_ID_BY_SENSE[sense];
}

const BASE_PREDICATE_PARTICLE_FRAMES: readonly BasePredicateParticleFrame[] = deepFreeze([
  {
    id: "eat",
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "read",
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "write",
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "buy",
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "go",
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["goal-ni", "direction-he"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "come",
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["goal-ni", "direction-he"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "return",
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["goal-ni", "direction-he"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "study",
    requiredRoles: ["action-place"],
    particleSensesByRole: { "action-place": ["action-place-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "work",
    requiredRoles: ["action-place"],
    particleSensesByRole: { "action-place": ["action-place-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "travel",
    requiredRoles: ["means"],
    particleSensesByRole: { means: ["means-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "aru",
    requiredRoles: ["existence-location", "existential-subject"],
    particleSensesByRole: {
      "existence-location": ["existence-location-ni"],
      "existential-subject": ["existential-subject-ga"],
    },
    particleOwnerLessonId: "existence-location-2",
  },
  {
    id: "iru",
    requiredRoles: ["existence-location", "existential-subject"],
    particleSensesByRole: {
      "existence-location": ["existence-location-ni"],
      "existential-subject": ["existential-subject-ga"],
    },
    particleOwnerLessonId: "existence-location-2",
  },
]);

export const BASE_PARTICLE_FRAME_BY_PREDICATE: ReadonlyMap<
  BasePredicateSenseId,
  BasePredicateParticleFrame
> = immutableReadonlyMap(
  BASE_PREDICATE_PARTICLE_FRAMES.map((frame) => [frame.id, frame]),
);

export function validateParticleFrame(
  predicateSenseId: string,
  provided: Readonly<Partial<Record<BaseParticleRole, BaseParticleSense>>>,
): BaseParticleFrameResult {
  const frame = BASE_PARTICLE_FRAME_BY_PREDICATE.get(
    predicateSenseId as BasePredicateSenseId,
  );
  if (!frame) {
    const errors: readonly BaseParticleFrameError[] = Object.freeze([
      { code: "unknown-predicate", predicateSenseId },
    ]);
    return Object.freeze({
      ok: false,
      errors,
    });
  }

  const errors: BaseParticleFrameError[] = [];
  for (const role of frame.requiredRoles) {
    if (!provided[role]) {
      errors.push({ code: "missing-role", predicateSenseId, role });
    }
  }
  for (const [role, particleSense] of Object.entries(provided) as [
    BaseParticleRole,
    BaseParticleSense,
  ][]) {
    const allowed = frame.particleSensesByRole[role];
    if (!allowed) {
      errors.push({ code: "extra-role", predicateSenseId, role });
    } else if (!allowed.includes(particleSense)) {
      errors.push({
        code: "unlicensed-particle",
        predicateSenseId,
        role,
        particleSense,
      });
    }
  }
  return errors.length === 0
    ? Object.freeze({
        ok: true,
        value: Object.freeze({ predicateSenseId: frame.id }),
      })
    : Object.freeze({ ok: false, errors: deepFreeze(errors) });
}

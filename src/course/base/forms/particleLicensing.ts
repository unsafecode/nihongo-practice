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
  readonly allowedPredicateLexemeIds: readonly string[];
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
    }>
  | Readonly<{
      readonly code: "invalid-particle-frame";
      readonly predicateSenseId: string;
      readonly role?: BaseParticleRole;
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
    allowedPredicateLexemeIds: ["verb-taberu"],
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "read",
    allowedPredicateLexemeIds: ["verb-yomu"],
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "write",
    allowedPredicateLexemeIds: ["verb-kaku"],
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "buy",
    allowedPredicateLexemeIds: ["verb-kau"],
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "go",
    allowedPredicateLexemeIds: ["verb-iku"],
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["goal-ni", "direction-he"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "come",
    allowedPredicateLexemeIds: ["verb-kuru", "verb-motte-kuru"],
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["goal-ni", "direction-he"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "return",
    allowedPredicateLexemeIds: ["verb-kaeru"],
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["goal-ni", "direction-he"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "study",
    allowedPredicateLexemeIds: ["verb-benkyou-suru"],
    requiredRoles: ["action-place"],
    particleSensesByRole: { "action-place": ["action-place-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "work",
    allowedPredicateLexemeIds: ["verb-hataraku"],
    requiredRoles: ["action-place"],
    particleSensesByRole: { "action-place": ["action-place-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "travel",
    allowedPredicateLexemeIds: ["verb-iku", "verb-kuru", "verb-kaeru"],
    requiredRoles: ["means"],
    particleSensesByRole: { means: ["means-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "aru",
    allowedPredicateLexemeIds: ["verb-aru"],
    requiredRoles: ["existence-location", "existential-subject"],
    particleSensesByRole: {
      "existence-location": ["existence-location-ni"],
      "existential-subject": ["existential-subject-ga"],
    },
    particleOwnerLessonId: "existence-location-2",
  },
  {
    id: "iru",
    allowedPredicateLexemeIds: ["verb-iru"],
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

const BASE_PARTICLE_ROLE_BY_ID: ReadonlyMap<BaseParticleRole, BaseParticleRole> =
  immutableReadonlyMap(
    ([
      "theme",
      "goal",
      "action-place",
      "means",
      "existence-location",
      "existential-subject",
    ] as const).map((role) => [role, role]),
  );

const BASE_PARTICLE_SENSE_BY_ID: ReadonlyMap<BaseParticleSense, BaseParticleSense> =
  immutableReadonlyMap(BASE_PARTICLE_SENSES.map((sense) => [sense.id, sense.id]));

const hasOwn: (value: object, key: PropertyKey) => boolean =
  (Object as unknown as {
    hasOwn?: (value: object, key: PropertyKey) => boolean;
  }).hasOwn ??
  ((value, key) => Object.prototype.hasOwnProperty.call(value, key));

function isPlainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyOwnDataProperties(value: Readonly<Record<string, unknown>>): boolean {
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every(
    (descriptor) => "value" in descriptor,
  );
}

export function validateParticleFrame(
  predicateSenseId: unknown,
  provided: unknown,
): BaseParticleFrameResult {
  if (typeof predicateSenseId !== "string") {
    const errors: readonly BaseParticleFrameError[] = Object.freeze([
      { code: "invalid-particle-frame", predicateSenseId: "" },
    ]);
    return Object.freeze({
      ok: false as const,
      errors,
    });
  }
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
  const plainProvided = isPlainRecord(provided);
  const ownDataProvided =
    plainProvided && hasOnlyOwnDataProperties(provided);
  if (!ownDataProvided) {
    errors.push({ code: "invalid-particle-frame", predicateSenseId });
  }
  for (const role of frame.requiredRoles) {
    const property =
      ownDataProvided && hasOwn(provided, role)
        ? Object.getOwnPropertyDescriptor(provided, role)
        : undefined;
    if (
      !property ||
      !("value" in property) ||
      typeof property.value !== "string" ||
      property.value.trim().length === 0
    ) {
      errors.push({ code: "missing-role", predicateSenseId, role });
    }
  }
  if (!ownDataProvided) {
    return Object.freeze({ ok: false, errors: deepFreeze(errors) });
  }
  for (const role of Object.keys(provided)) {
    const descriptor = Object.getOwnPropertyDescriptor(provided, role);
    const particleSense = descriptor && "value" in descriptor ? descriptor.value : undefined;
    if (typeof particleSense !== "string" || particleSense.trim().length === 0) {
      errors.push({
        code: "invalid-particle-frame",
        predicateSenseId,
        role: role as BaseParticleRole,
      });
      continue;
    }
    if (!BASE_PARTICLE_ROLE_BY_ID.has(role as BaseParticleRole)) {
      errors.push({
        code: "extra-role",
        predicateSenseId,
        role: role as BaseParticleRole,
      });
      continue;
    }
    const allowed = frame.particleSensesByRole[role as BaseParticleRole];
    if (!allowed) {
      errors.push({
        code: "extra-role",
        predicateSenseId,
        role: role as BaseParticleRole,
      });
    } else if (
      !BASE_PARTICLE_SENSE_BY_ID.has(particleSense as BaseParticleSense) ||
      !allowed.includes(particleSense as BaseParticleSense)
    ) {
      errors.push({
        code: "unlicensed-particle",
        predicateSenseId,
        role: role as BaseParticleRole,
        particleSense: particleSense as BaseParticleSense,
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

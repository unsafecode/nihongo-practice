import type { SemanticArgumentRole } from "../../foundations/types";
import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import {
  particleProvidedEntries,
  type ParticleProvidedEntries,
} from "./particleProvided";

export {
  particleProvidedEntries,
  type InvalidParticleProvidedEntry,
  type ParticleProvidedEntries,
  type ParticleProvidedEntry,
} from "./particleProvided";

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
  | "question-ka"
  | "interactional-ne"
  | "interactional-yo";

export type BaseParticleRole =
  | Extract<SemanticArgumentRole, "theme" | "goal">
  | "action-place"
  | "means"
  | "time"
  | "source"
  | "limit"
  | "existence-location"
  | "existential-subject";

export type BasePredicateSenseId =
  | "eat"
  | "drink"
  | "see"
  | "do"
  | "read"
  | "write"
  | "buy"
  | "go"
  | "come"
  | "return"
  | "study"
  | "work"
  | "travel"
  | "go-goal"
  | "go-direction"
  | "come-goal"
  | "come-direction"
  | "return-goal"
  | "return-direction"
  | "study-place"
  | "work-place"
  | "play-place"
  | "eat-place"
  | "travel-means"
  | "write-means"
  | "action-time"
  | "go-time-goal"
  | "movement-source"
  | "movement-limit"
  | "movement-bounds"
  | "time-source"
  | "time-limit"
  | "time-bounds"
  | "aru"
  | "iru";

export interface BaseParticleSenseDefinition {
  readonly id: BaseParticleSense;
  readonly firstTeachLessonId: string;
}

interface BaseParticleSurfaceDefinition {
  readonly kana: string;
  readonly romaji: string;
}

export interface BasePredicateParticleFrame {
  readonly id: BasePredicateSenseId;
  readonly allowedPredicateLexemeIds: readonly string[];
  readonly requiredRoles: readonly BaseParticleRole[];
  readonly particleSensesByRole: Readonly<
    Partial<Record<BaseParticleRole, readonly BaseParticleSense[]>>
  >;
  /** Canonical argument licensing; retained beside the legacy field for callers. */
  readonly argumentParticleByRole?: Readonly<
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
  { id: "interactional-ne", firstTeachLessonId: "topic-questions-4" },
  { id: "interactional-yo", firstTeachLessonId: "topic-questions-4" },
]);

const BASE_PARTICLE_SURFACE_BY_SENSE: Readonly<
  Record<BaseParticleSense, BaseParticleSurfaceDefinition>
> = deepFreeze({
  "topic-wa": { kana: "は", romaji: "wa" },
  "focus-subject-ga": { kana: "が", romaji: "ga" },
  "object-o": { kana: "を", romaji: "o" },
  "goal-ni": { kana: "に", romaji: "ni" },
  "direction-he": { kana: "へ", romaji: "e" },
  "action-place-de": { kana: "で", romaji: "de" },
  "means-de": { kana: "で", romaji: "de" },
  "existence-location-ni": { kana: "に", romaji: "ni" },
  "existential-subject-ga": { kana: "が", romaji: "ga" },
  "time-ni": { kana: "に", romaji: "ni" },
  "source-kara": { kana: "から", romaji: "kara" },
  "limit-made": { kana: "まで", romaji: "made" },
  "possessive-attributive-no": { kana: "の", romaji: "no" },
  "additive-mo": { kana: "も", romaji: "mo" },
  "companion-to": { kana: "と", romaji: "to" },
  "listing-to": { kana: "と", romaji: "to" },
  "nominal-to": { kana: "と", romaji: "to" },
  "question-ka": { kana: "か", romaji: "ka" },
  "interactional-ne": { kana: "ね", romaji: "ne" },
  "interactional-yo": { kana: "よ", romaji: "yo" },
});

/** Returns the one canonical token sequence for a licensed particle sense. */
export function baseParticleSurfaceTokens(
  sense: BaseParticleSense,
): readonly AssembledToken[] {
  const surface = BASE_PARTICLE_SURFACE_BY_SENSE[sense];
  return deepFreeze([
    {
      id: `${sense}-particle`,
      jp: surface.kana,
      romaji: surface.romaji,
      kind: "particle",
      boundaryBefore: "attach",
      source: { domain: "catalog", referenceId: sense },
    },
  ]);
}

/**
 * Maps every licensed particle sense to the content record that introduces its
 * learner-facing distinction. The mapped records are owned by
 * `BASE_FIRST_TEACH_OWNERS`.
 */
const PARTICLE_SENSE_CONTENT_ENTRIES: readonly (readonly [
  BaseParticleSense,
  string,
])[] = [
  ["topic-wa", "topic-wa"],
  ["focus-subject-ga", "focus-subject-ga"],
  ["object-o", "licensed-object-o"],
  ["goal-ni", "goal-ni"],
  ["direction-he", "direction-he"],
  ["action-place-de", "action-place-de"],
  ["means-de", "means-de"],
  ["existence-location-ni", "existence-location-ni"],
  ["existential-subject-ga", "existential-subject-ga"],
  ["time-ni", "time-ni"],
  ["source-kara", "source-kara"],
  ["limit-made", "limit-made"],
  ["possessive-attributive-no", "possessive-no"],
  ["additive-mo", "additive-mo"],
  ["companion-to", "companion-to"],
  ["listing-to", "nominal-listing-to"],
  ["nominal-to", "nominal-listing-to"],
  ["question-ka", "question-ka"],
  ["interactional-ne", "interactional-ne"],
  ["interactional-yo", "interactional-yo"],
];

export const BASE_PARTICLE_SENSE_CONTENT_ID_BY_SENSE: Readonly<
  Record<BaseParticleSense, string>
> = deepFreeze(
  Object.fromEntries(PARTICLE_SENSE_CONTENT_ENTRIES) as Record<
    BaseParticleSense,
    string
  >,
);

const PARTICLE_SENSE_CONTENT_ID_BY_SENSE = immutableReadonlyMap(
  PARTICLE_SENSE_CONTENT_ENTRIES,
);

export function particleSenseFirstTeachContentId(
  sense: BaseParticleSense,
): string {
  return PARTICLE_SENSE_CONTENT_ID_BY_SENSE.get(sense) ?? "";
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
    id: "drink",
    allowedPredicateLexemeIds: ["verb-nomu"],
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "see",
    allowedPredicateLexemeIds: ["verb-miru"],
    requiredRoles: ["theme"],
    particleSensesByRole: { theme: ["object-o"] },
    particleOwnerLessonId: "argument-particles-1",
  },
  {
    id: "do",
    allowedPredicateLexemeIds: ["verb-suru"],
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
    id: "go-goal",
    allowedPredicateLexemeIds: ["verb-iku"],
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["goal-ni"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "go-direction",
    allowedPredicateLexemeIds: ["verb-iku"],
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["direction-he"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "come-goal",
    allowedPredicateLexemeIds: ["verb-kuru"],
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["goal-ni"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "come-direction",
    allowedPredicateLexemeIds: ["verb-kuru"],
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["direction-he"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "return-goal",
    allowedPredicateLexemeIds: ["verb-kaeru"],
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["goal-ni"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "return-direction",
    allowedPredicateLexemeIds: ["verb-kaeru"],
    requiredRoles: ["goal"],
    particleSensesByRole: { goal: ["direction-he"] },
    particleOwnerLessonId: "argument-particles-2",
  },
  {
    id: "study-place",
    allowedPredicateLexemeIds: ["verb-benkyou-suru"],
    requiredRoles: ["action-place"],
    particleSensesByRole: { "action-place": ["action-place-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "work-place",
    allowedPredicateLexemeIds: ["verb-hataraku"],
    requiredRoles: ["action-place"],
    particleSensesByRole: { "action-place": ["action-place-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "play-place",
    allowedPredicateLexemeIds: ["verb-asobu"],
    requiredRoles: ["action-place"],
    particleSensesByRole: { "action-place": ["action-place-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "eat-place",
    allowedPredicateLexemeIds: ["verb-taberu"],
    requiredRoles: ["action-place"],
    particleSensesByRole: { "action-place": ["action-place-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "travel-means",
    allowedPredicateLexemeIds: ["verb-iku", "verb-kuru", "verb-kaeru"],
    requiredRoles: ["means"],
    particleSensesByRole: { means: ["means-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "write-means",
    allowedPredicateLexemeIds: ["verb-kaku"],
    requiredRoles: ["means"],
    particleSensesByRole: { means: ["means-de"] },
    particleOwnerLessonId: "argument-particles-3",
  },
  {
    id: "action-time",
    allowedPredicateLexemeIds: [
      "verb-kaku",
      "verb-yomu",
      "verb-nomu",
      "verb-kau",
      "verb-hataraku",
      "verb-asobu",
      "verb-taberu",
      "verb-miru",
      "verb-suru",
      "verb-benkyou-suru",
      "verb-yasumu",
      "verb-okiru",
      "verb-neru",
      "verb-aruku",
      "verb-kiku",
      "verb-tsukuru",
      "verb-au",
      "verb-utau",
      "verb-hanasu",
      "verb-matsu",
      "verb-iku",
      "verb-hashiru",
      "verb-ryokou-suru",
      "verb-ryouri-suru",
      "verb-dekakeru",
    ],
    requiredRoles: ["time"],
    particleSensesByRole: { time: ["time-ni"] },
    particleOwnerLessonId: "time-movement-2",
  },
  {
    id: "go-time-goal",
    allowedPredicateLexemeIds: ["verb-iku"],
    requiredRoles: ["time", "goal"],
    particleSensesByRole: {
      time: ["time-ni"],
      goal: ["goal-ni"],
    },
    particleOwnerLessonId: "time-movement-2",
  },
  {
    id: "movement-source",
    allowedPredicateLexemeIds: ["verb-iku", "verb-kuru", "verb-kaeru", "verb-ryokou-suru"],
    requiredRoles: ["source"],
    particleSensesByRole: { source: ["source-kara"] },
    particleOwnerLessonId: "time-movement-2",
  },
  {
    id: "movement-limit",
    allowedPredicateLexemeIds: ["verb-iku", "verb-kuru", "verb-kaeru", "verb-ryokou-suru"],
    requiredRoles: ["limit"],
    particleSensesByRole: { limit: ["limit-made"] },
    particleOwnerLessonId: "time-movement-2",
  },
  {
    id: "movement-bounds",
    allowedPredicateLexemeIds: ["verb-iku", "verb-kuru", "verb-kaeru", "verb-ryokou-suru"],
    requiredRoles: ["source", "limit"],
    particleSensesByRole: {
      source: ["source-kara"],
      limit: ["limit-made"],
    },
    particleOwnerLessonId: "time-movement-2",
  },
  {
    id: "time-source",
    allowedPredicateLexemeIds: ["verb-hataraku", "verb-benkyou-suru", "verb-yasumu"],
    requiredRoles: ["source"],
    particleSensesByRole: { source: ["source-kara"] },
    particleOwnerLessonId: "time-movement-2",
  },
  {
    id: "time-limit",
    allowedPredicateLexemeIds: ["verb-hataraku", "verb-benkyou-suru", "verb-yasumu"],
    requiredRoles: ["limit"],
    particleSensesByRole: { limit: ["limit-made"] },
    particleOwnerLessonId: "time-movement-2",
  },
  {
    id: "time-bounds",
    allowedPredicateLexemeIds: ["verb-hataraku", "verb-benkyou-suru", "verb-yasumu"],
    requiredRoles: ["source", "limit"],
    particleSensesByRole: {
      source: ["source-kara"],
      limit: ["limit-made"],
    },
    particleOwnerLessonId: "time-movement-2",
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
  BASE_PREDICATE_PARTICLE_FRAMES.map((frame) => [
    frame.id,
    deepFreeze({
      ...frame,
      argumentParticleByRole: frame.particleSensesByRole,
    }),
  ]),
);

const BASE_PARTICLE_ROLE_BY_ID: ReadonlyMap<BaseParticleRole, BaseParticleRole> =
  immutableReadonlyMap(
    ([
      "theme",
      "goal",
      "action-place",
      "means",
      "time",
      "source",
      "limit",
      "existence-location",
      "existential-subject",
    ] as const).map((role) => [role, role]),
  );

const BASE_PARTICLE_SENSE_BY_ID: ReadonlyMap<BaseParticleSense, BaseParticleSense> =
  immutableReadonlyMap(BASE_PARTICLE_SENSES.map((sense) => [sense.id, sense.id]));

export function validateParticleFrameEntries(
  predicateSenseId: unknown,
  provided: ParticleProvidedEntries,
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
  for (const error of provided.errors) {
    errors.push({
      code: "invalid-particle-frame",
      predicateSenseId,
      ...(error.role !== undefined
        ? { role: error.role as BaseParticleRole }
        : {}),
    });
  }
  const senseByRole = new Map(provided.entries);
  for (const role of frame.requiredRoles) {
    const particleSense = senseByRole.get(role);
    if (typeof particleSense !== "string" || particleSense.trim().length === 0) {
      errors.push({ code: "missing-role", predicateSenseId, role });
    }
  }
  for (const [role, particleSense] of provided.entries) {
    if (particleSense.trim().length === 0) {
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
    const allowedDescriptor = Object.getOwnPropertyDescriptor(
      frame.argumentParticleByRole ?? frame.particleSensesByRole,
      role,
    );
    const allowed =
      allowedDescriptor && "value" in allowedDescriptor
        ? (allowedDescriptor.value as readonly BaseParticleSense[])
        : undefined;
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

export function validateParticleFrame(
  predicateSenseId: unknown,
  provided: unknown,
): BaseParticleFrameResult {
  return validateParticleFrameEntries(
    predicateSenseId,
    particleProvidedEntries(provided),
  );
}

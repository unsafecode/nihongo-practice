import type { AssembledToken } from "../../../romaji/types";
import {
  type BaseActivityDefinition,
  type BaseDialogueTurn,
  type BaseExample,
  type BaseValidationCatalogs,
} from "../catalog/types";

export { BASE_ACTIVITY_OPERATION_BY_CATEGORY } from "../catalog/types";

type SemanticFingerprintSubject = Pick<
  BaseExample | BaseDialogueTurn,
  | "tokens"
  | "formIds"
  | "semanticRoleIds"
  | "discourseFrameId"
  | "predicateAspect"
  | "interpretationTags"
  | "particleFrame"
>;

interface CanonicalTargetMetadata {
  readonly tokens: readonly AssembledToken[];
  readonly formIds: readonly string[];
  readonly semanticRoleIds: readonly string[];
  readonly discourseFrameId: string | null;
  readonly predicateAspect: string | null;
  readonly interpretationTags: readonly string[];
  readonly particleFrame: SemanticFingerprintSubject["particleFrame"] | null;
}

export type ActivityFingerprintResolution =
  | Readonly<{ readonly ok: true; readonly fingerprint: string }>
  | Readonly<{
      readonly ok: false;
      readonly error: Readonly<{
        readonly code: "unresolved-activity-target";
        readonly targetId: string;
      }>;
    }>;

function normalizeText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function sortedNormalized(values: readonly string[]): readonly string[] {
  return [...new Set(values.map(normalizeText))].sort();
}

function normalizedParticleFrame(
  particleFrame: SemanticFingerprintSubject["particleFrame"] | null | undefined,
): Readonly<{
  readonly predicateSenseId: string;
  readonly provided: readonly (readonly [string, string])[];
}> | null {
  if (!particleFrame) return null;
  return {
    predicateSenseId: normalizeText(particleFrame.predicateSenseId),
    provided: Object.entries(particleFrame.provided)
      .map(([role, sense]) => [normalizeText(role), normalizeText(sense)] as const)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
  };
}

/**
 * Produces a stable token sequence from learner-visible Japanese only. Token
 * identity and romaji/copy metadata cannot affect semantic equivalence.
 */
export function canonicalTokenSequence(tokens: readonly AssembledToken[]): string {
  return JSON.stringify(
    tokens.map((token) => [
      normalizeText(token.jp),
      normalizeText(token.kind),
      normalizeText(token.boundaryBefore),
    ]),
  );
}

function semanticPayload(input: SemanticFingerprintSubject): Readonly<Record<string, unknown>> {
  return {
    tokens: canonicalTokenSequence(input.tokens),
    formIds: sortedNormalized(input.formIds),
    semanticRoleIds: sortedNormalized(input.semanticRoleIds),
    discourseFrameId: normalizeText(input.discourseFrameId),
    predicateAspect: normalizeText(input.predicateAspect),
    interpretationTags: sortedNormalized(input.interpretationTags),
    particleFrame: normalizedParticleFrame(input.particleFrame),
  };
}

export function semanticFingerprintFor(input: SemanticFingerprintSubject): string {
  return `base-semantic-v1:${JSON.stringify(semanticPayload(input))}`;
}

function targetMetadataFor(
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): CanonicalTargetMetadata | undefined {
  const example = catalogs.examples.get(activity.targetId);
  if (example) {
    return {
      tokens: example.tokens,
      formIds: example.formIds,
      semanticRoleIds: example.semanticRoleIds,
      discourseFrameId: example.discourseFrameId,
      predicateAspect: example.predicateAspect,
      interpretationTags: example.interpretationTags,
      particleFrame: example.particleFrame,
    };
  }
  const acceptedAnswer = catalogs.acceptedAnswerTokens.get(activity.targetId);
  if (acceptedAnswer) {
    return {
      tokens: acceptedAnswer,
      formIds: [],
      semanticRoleIds: [],
      discourseFrameId: null,
      predicateAspect: null,
      interpretationTags: [],
      particleFrame: null,
    };
  }
  const audioTarget = catalogs.audioTargets.get(activity.targetId);
  if (audioTarget) {
    return {
      tokens: audioTarget,
      formIds: [],
      semanticRoleIds: [],
      discourseFrameId: null,
      predicateAspect: null,
      interpretationTags: [],
      particleFrame: null,
    };
  }
  return undefined;
}

export function activityTargetOperationFingerprintFor(
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): ActivityFingerprintResolution {
  const target = targetMetadataFor(activity, catalogs);
  if (!target) {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code: "unresolved-activity-target" as const,
        targetId: activity.targetId,
      }),
    });
  }
  return Object.freeze({
    ok: true as const,
    fingerprint: `base-activity-target-v1:${JSON.stringify({
      operation: activity.operation,
      tokens: canonicalTokenSequence(target.tokens),
      assessedConceptIds: sortedNormalized(activity.assessedConceptIds),
      assessedLexemeIds: sortedNormalized(activity.assessedLexemeIds),
      targetFormIds: sortedNormalized(target.formIds),
      targetSemanticRoleIds: sortedNormalized(target.semanticRoleIds),
      targetDiscourseFrameId:
        target.discourseFrameId === null ? null : normalizeText(target.discourseFrameId),
      targetPredicateAspect:
        target.predicateAspect === null ? null : normalizeText(target.predicateAspect),
      targetInterpretationTags: sortedNormalized(target.interpretationTags),
      targetParticleFrame: normalizedParticleFrame(target.particleFrame),
    })}`,
  });
}

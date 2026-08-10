import type { AssembledToken } from "../../../romaji/types";
import {
  type BaseActivityDefinition,
  type BaseValidationCatalogs,
  type BaseVisibleTarget,
} from "../catalog/types";
import { activityTargetReferenceFor } from "../catalog/visibleTargets";

export { BASE_ACTIVITY_OPERATION_BY_CATEGORY } from "../catalog/types";

type SemanticFingerprintSubject = BaseVisibleTarget;

export type ActivityFingerprintResolution =
  | Readonly<{ readonly ok: true; readonly fingerprint: string }>
  | Readonly<{
      readonly ok: false;
      readonly error: Readonly<{
        readonly code: "unresolved-activity-target";
        readonly targetId: string;
      }>;
    }>;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return typeof value === "string"
    ? value.normalize("NFKC").replace(/\s+/gu, " ").trim()
    : "";
}

function normalizedOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : null;
}

function sortedNormalized(values: unknown): readonly string[] {
  if (!Array.isArray(values)) return [];
  return [
    ...new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map(normalizeText)
        .filter((value) => value.length > 0),
    ),
  ].sort();
}

function normalizedParticleFrame(
  particleFrame: unknown,
): Readonly<{
  readonly predicateSenseId: string;
  readonly provided: readonly (readonly [string, string])[];
}> | null {
  if (!isRecord(particleFrame)) return null;
  const provided = isRecord(particleFrame.provided)
    ? Object.entries(particleFrame.provided)
        .filter(
          (entry): entry is [string, string] =>
            typeof entry[0] === "string" && typeof entry[1] === "string",
        )
        .map(
          ([role, sense]) =>
            [normalizeText(role), normalizeText(sense)] as const,
        )
        .filter(([, sense]) => sense.length > 0)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    : [];
  return {
    predicateSenseId: normalizeText(particleFrame.predicateSenseId),
    provided,
  };
}

/**
 * Produces a stable learner-visible Japanese surface. Token identity, token
 * boundaries, segmentation, and romaji/copy metadata cannot affect it.
 */
export function visibleSurfaceFingerprint(
  tokens: readonly AssembledToken[] | unknown,
): string {
  if (!Array.isArray(tokens)) return "";
  return tokens
    .map((token) => (isRecord(token) ? normalizeText(token.jp) : ""))
    .join("")
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim();
}

export function canonicalTokenSequence(tokens: readonly AssembledToken[] | unknown): string {
  return visibleSurfaceFingerprint(tokens);
}

function semanticPayload(input: SemanticFingerprintSubject | unknown): Readonly<Record<string, unknown>> {
  const target = isRecord(input) ? input : {};
  return {
    tokens: canonicalTokenSequence(target.tokens),
    formIds: sortedNormalized(target.formIds),
    semanticRoleIds: sortedNormalized(target.semanticRoleIds),
    discourseFrameId: normalizedOptionalText(target.discourseFrameId),
    predicateAspect: normalizedOptionalText(target.predicateAspect),
    interpretationTags: sortedNormalized(target.interpretationTags),
    particleFrame: normalizedParticleFrame(target.particleFrame),
  };
}

export function semanticFingerprintFor(input: SemanticFingerprintSubject | unknown): string {
  return `base-semantic-v1:${JSON.stringify(semanticPayload(input))}`;
}

function targetMetadataFor(
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): BaseVisibleTarget | undefined {
  return activityTargetReferenceFor(activity, catalogs)?.target;
}

export function activityTargetVisibleSurfaceFor(
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): string | undefined {
  const target = targetMetadataFor(activity, catalogs);
  return target ? visibleSurfaceFingerprint(target.tokens) : undefined;
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
      targetLexemeIds: sortedNormalized(target.lexemeIds),
      targetConceptIds: sortedNormalized(target.conceptIds),
      assessedConceptIds: sortedNormalized(activity.assessedConceptIds),
      assessedLexemeIds: sortedNormalized(activity.assessedLexemeIds),
      targetFormIds: sortedNormalized(target.formIds),
      targetPatternCellIds: sortedNormalized(target.patternCellIds),
      targetSemanticRoleIds: sortedNormalized(target.semanticRoleIds),
      targetDiscourseFrameId: normalizedOptionalText(target.discourseFrameId),
      targetPredicateAspect: normalizedOptionalText(target.predicateAspect),
      targetInterpretationTags: sortedNormalized(target.interpretationTags),
      targetParticleFrame: normalizedParticleFrame(target.particleFrame),
    })}`,
  });
}

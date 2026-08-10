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
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

const hasOwn: (value: object, key: PropertyKey) => boolean =
  (Object as unknown as {
    hasOwn?: (value: object, key: PropertyKey) => boolean;
  }).hasOwn ??
  ((value, key) => Object.prototype.hasOwnProperty.call(value, key));

function ownDataValue(
  value: Readonly<Record<string, unknown>>,
  key: string,
): unknown {
  if (!hasOwn(value, key)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

function ownStringEntries(
  value: Readonly<Record<string, unknown>>,
): readonly (readonly [string, string])[] {
  return Object.keys(value).flatMap((key) => {
    const entry = ownDataValue(value, key);
    return typeof entry === "string" ? ([[key, entry]] as const) : [];
  });
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
  const predicateSenseId = ownDataValue(particleFrame, "predicateSenseId");
  if (typeof predicateSenseId !== "string") return null;
  const providedValue = ownDataValue(particleFrame, "provided");
  const provided = isRecord(providedValue)
    ? ownStringEntries(providedValue)
        .map(
          ([role, sense]) =>
            [normalizeText(role), normalizeText(sense)] as const,
        )
        .filter(([, sense]) => sense.length > 0)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    : [];
  return {
    predicateSenseId: normalizeText(predicateSenseId),
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
  _lessonId: string,
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): string | undefined {
  const target = targetMetadataFor(activity, catalogs);
  return target ? visibleSurfaceFingerprint(target.tokens) : undefined;
}

export function activityTargetOperationFingerprintFor(
  _lessonId: string,
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

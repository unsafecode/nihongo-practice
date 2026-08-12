import type { AssembledToken } from "../../../romaji/types";
import {
  type BaseActivityDefinition,
  type BaseValidationCatalogs,
  type BaseVisibleTarget,
} from "../catalog/types";
import { activityTargetReferenceFor } from "../catalog/visibleTargets";
import {
  isPlainDataRecord,
  ownDataArrayValues,
  ownDataValue,
} from "./runtimeGuards";
import { particleProvidedEntries } from "../forms/particleLicensing";

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
  const entries = ownDataArrayValues(values);
  if (!entries) return [];
  return [
    ...new Set(
      entries
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
  readonly attachmentLexemeIdByRole: readonly (readonly [string, string])[];
}> | null {
  if (!isPlainDataRecord(particleFrame)) return null;
  const predicateSenseId = ownDataValue(particleFrame, "predicateSenseId");
  if (typeof predicateSenseId !== "string") return null;
  const provided = particleProvidedEntries(
    ownDataValue(particleFrame, "provided"),
  ).entries
    .map(
      ([role, sense]) => [normalizeText(role), normalizeText(sense)] as const,
    )
    .filter(([, sense]) => sense.length > 0)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  const attachmentLexemeIdByRole = particleProvidedEntries(
    ownDataValue(particleFrame, "attachmentLexemeIdByRole"),
  ).entries
    .map(
      ([role, lexemeId]) =>
        [normalizeText(role), normalizeText(lexemeId)] as const,
    )
    .filter(([, lexemeId]) => lexemeId.length > 0)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  return {
    predicateSenseId: normalizeText(predicateSenseId),
    provided,
    attachmentLexemeIdByRole,
  };
}

function normalizedParticleBindings(
  value: unknown,
): readonly (readonly [string, string, string])[] {
  const entries = ownDataArrayValues(value);
  if (!entries) return [];
  return entries
    .flatMap((entry) => {
      if (!isPlainDataRecord(entry)) return [];
      const role = normalizeText(ownDataValue(entry, "role"));
      const particleSense = normalizeText(
        ownDataValue(entry, "particleSense"),
      );
      const attachmentLexemeId = normalizeText(
        ownDataValue(entry, "attachmentLexemeId"),
      );
      return role && particleSense && attachmentLexemeId
        ? [[role, particleSense, attachmentLexemeId] as const]
        : [];
    })
    .sort(([leftRole, leftSense], [rightRole, rightSense]) =>
      leftRole === rightRole
        ? leftSense < rightSense
          ? -1
          : leftSense > rightSense
            ? 1
            : 0
        : leftRole < rightRole
          ? -1
          : 1,
    );
}

/**
 * Produces a stable learner-visible Japanese surface. Token identity, token
 * boundaries, segmentation, and romaji/copy metadata cannot affect it.
 */
export function visibleSurfaceFingerprint(
  tokens: readonly AssembledToken[] | unknown,
): string {
  const entries = ownDataArrayValues(tokens);
  if (!entries) return "";
  return entries
    .map((token) =>
      isPlainDataRecord(token) ? normalizeText(ownDataValue(token, "jp")) : "",
    )
    .join("")
    .normalize("NFKC")
    .replace(/\s+/gu, "")
    .replace(/[、。？！?!]+$/gu, "");
}

export function canonicalTokenSequence(tokens: readonly AssembledToken[] | unknown): string {
  return visibleSurfaceFingerprint(tokens);
}

function semanticPayload(input: SemanticFingerprintSubject | unknown): Readonly<Record<string, unknown>> {
  const target: Readonly<Record<string, unknown>> = isPlainDataRecord(input)
    ? input
    : {};
  return {
    tokens: canonicalTokenSequence(ownDataValue(target, "tokens")),
    formIds: sortedNormalized(ownDataValue(target, "formIds")),
    semanticRoleIds: sortedNormalized(ownDataValue(target, "semanticRoleIds")),
    discourseFrameId: normalizedOptionalText(ownDataValue(target, "discourseFrameId")),
    predicateAspect: normalizedOptionalText(ownDataValue(target, "predicateAspect")),
    interpretationTags: sortedNormalized(ownDataValue(target, "interpretationTags")),
    particleFrame: normalizedParticleFrame(ownDataValue(target, "particleFrame")),
    particleBindings: normalizedParticleBindings(
      ownDataValue(target, "particleBindings"),
    ),
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
  const reference = activityTargetReferenceFor(activity, catalogs);
  return reference && !reference.invalidReason
    ? visibleSurfaceFingerprint(reference.target.tokens)
    : undefined;
}

export function activityTargetOperationFingerprintFor(
  _lessonId: string,
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
): ActivityFingerprintResolution {
  const target = targetMetadataFor(activity, catalogs);
  const activityRecord = isPlainDataRecord(activity)
    ? activity
    : ({} as Readonly<Record<string, unknown>>);
  const targetId = ownDataValue(activityRecord, "targetId");
  if (!target) {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code: "unresolved-activity-target" as const,
        targetId: typeof targetId === "string" ? targetId : "",
      }),
    });
  }
  const targetRecord = target as unknown as Readonly<Record<string, unknown>>;
  return Object.freeze({
    ok: true as const,
    fingerprint: `base-activity-target-v1:${JSON.stringify({
      operation: ownDataValue(activityRecord, "operation"),
      tokens: canonicalTokenSequence(target.tokens),
      targetLexemeIds: sortedNormalized(target.lexemeIds),
      targetConceptIds: sortedNormalized(target.conceptIds),
      assessedConceptIds: sortedNormalized(
        ownDataValue(activityRecord, "assessedConceptIds"),
      ),
      assessedLexemeIds: sortedNormalized(
        ownDataValue(activityRecord, "assessedLexemeIds"),
      ),
      targetFormIds: sortedNormalized(target.formIds),
      targetPatternCellIds: sortedNormalized(target.patternCellIds),
      targetSemanticRoleIds: sortedNormalized(target.semanticRoleIds),
      targetDiscourseFrameId: normalizedOptionalText(
        ownDataValue(targetRecord, "discourseFrameId"),
      ),
      targetPredicateAspect: normalizedOptionalText(
        ownDataValue(targetRecord, "predicateAspect"),
      ),
      targetInterpretationTags: sortedNormalized(
        ownDataValue(targetRecord, "interpretationTags"),
      ),
      targetParticleFrame: normalizedParticleFrame(
        ownDataValue(targetRecord, "particleFrame"),
      ),
      targetParticleBindings: normalizedParticleBindings(
        ownDataValue(targetRecord, "particleBindings"),
      ),
    })}`,
  });
}

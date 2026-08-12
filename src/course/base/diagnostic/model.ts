import { deepFreeze } from "../../foundations/deepFreeze";

export const BASE_DIAGNOSTIC_DIMENSION_IDS = deepFreeze([
  "mora-timing",
  "sentence-anatomy",
  "particle-sense",
  "polite-verb-form",
] as const);

export type BaseDiagnosticDimensionId =
  (typeof BASE_DIAGNOSTIC_DIMENSION_IDS)[number];

export const BASE_DIAGNOSTIC_RECOMMENDATION_MODULE_IDS = deepFreeze([
  "sounds",
  "sentence-foundations",
  "argument-particles",
  "polite-verbs",
  "introductions",
] as const);

type BaseDiagnosticDimensions = Readonly<
  Record<BaseDiagnosticDimensionId, boolean>
>;

export interface BaseDiagnosticResult {
  readonly recommendedLevel: "a0" | "a1";
  readonly recommendedModuleId:
    (typeof BASE_DIAGNOSTIC_RECOMMENDATION_MODULE_IDS)[number];
  readonly dimensionResults: BaseDiagnosticDimensions;
}

export interface BaseDiagnosticInvalidResult {
  readonly error: "invalid-diagnostic-input";
}

const INVALID_RESULT: BaseDiagnosticInvalidResult = deepFreeze({
  error: "invalid-diagnostic-input",
});

const MODULE_BY_DIMENSION: Readonly<
  Record<
    BaseDiagnosticDimensionId,
    Exclude<BaseDiagnosticResult["recommendedModuleId"], "introductions">
  >
> = deepFreeze({
  "mora-timing": "sounds",
  "sentence-anatomy": "sentence-foundations",
  "particle-sense": "argument-particles",
  "polite-verb-form": "polite-verbs",
});

function dimensionSnapshot(value: unknown): BaseDiagnosticDimensions | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const names = Object.getOwnPropertyNames(value);
    if (
      names.length !== BASE_DIAGNOSTIC_DIMENSION_IDS.length ||
      names.some(
        (name) =>
          !BASE_DIAGNOSTIC_DIMENSION_IDS.includes(
            name as BaseDiagnosticDimensionId,
          ),
      )
    ) {
      return null;
    }

    const snapshot = {} as Record<BaseDiagnosticDimensionId, boolean>;
    for (const id of BASE_DIAGNOSTIC_DIMENSION_IDS) {
      const descriptor = descriptors[id];
      if (
        !descriptor ||
        !descriptor.enumerable ||
        !("value" in descriptor) ||
        typeof descriptor.value !== "boolean"
      ) {
        return null;
      }
      snapshot[id] = descriptor.value;
    }
    return deepFreeze(snapshot);
  } catch {
    return null;
  }
}

export function evaluateBaseDiagnostic(
  input: unknown,
): BaseDiagnosticResult | BaseDiagnosticInvalidResult | null {
  if (input === "skip") return null;
  const dimensions = dimensionSnapshot(input);
  if (!dimensions) return INVALID_RESULT;
  const firstUnmet = BASE_DIAGNOSTIC_DIMENSION_IDS.find(
    (id) => !dimensions[id],
  );
  return deepFreeze(
    firstUnmet
      ? {
          recommendedLevel: "a0" as const,
          recommendedModuleId: MODULE_BY_DIMENSION[firstUnmet],
          dimensionResults: dimensions,
        }
      : {
          recommendedLevel: "a1" as const,
          recommendedModuleId: "introductions" as const,
          dimensionResults: dimensions,
        },
  );
}

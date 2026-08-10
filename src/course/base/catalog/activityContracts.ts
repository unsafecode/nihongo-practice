import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";

export type BaseActivityCategory =
  | "meaning-comprehension"
  | "form-function-discrimination"
  | "ordering"
  | "controlled-production"
  | "transformation"
  | "error-diagnosis"
  | "contextual-response"
  | "cumulative-retrieval";

export type BaseInteractionKind =
  | "choice"
  | "tile-ordering"
  | "completion"
  | "transformation"
  | "constrained-construction"
  | "listening"
  | "spoken";

export type BaseActivityMode = "non-spoken" | "audio";
export type BaseActivityKind = BaseActivityCategory | "listening" | "spoken";
export type BaseSemanticActivityOperation =
  | "recognize-meaning"
  | "discriminate-form-function"
  | "order-chunks"
  | "produce-controlled"
  | "transform-form"
  | "diagnose-error"
  | "select-contextual-response"
  | "retrieve-cumulative"
  | "identify-audio"
  | "produce-spoken";
export type BasePhoneticActivityOperation =
  | "discriminate-sound"
  | "segment-morae"
  | "recognize-kana"
  | "map-script"
  | "match-sound-word"
  | "assemble-reading";
export type BaseActivityOperation =
  | BaseSemanticActivityOperation
  | BasePhoneticActivityOperation;

const ACTIVITY_OPERATION_ENTRIES: readonly (
  readonly [BaseActivityKind, BaseSemanticActivityOperation]
)[] = [
  ["meaning-comprehension", "recognize-meaning"],
  ["form-function-discrimination", "discriminate-form-function"],
  ["ordering", "order-chunks"],
  ["controlled-production", "produce-controlled"],
  ["transformation", "transform-form"],
  ["error-diagnosis", "diagnose-error"],
  ["contextual-response", "select-contextual-response"],
  ["cumulative-retrieval", "retrieve-cumulative"],
  ["listening", "identify-audio"],
  ["spoken", "produce-spoken"],
];

const ACTIVITY_INTERACTION_ENTRIES: readonly (
  readonly [BaseActivityKind, readonly BaseInteractionKind[]]
)[] = [
  ["meaning-comprehension", ["choice"]],
  ["form-function-discrimination", ["choice"]],
  ["ordering", ["tile-ordering"]],
  ["controlled-production", ["completion", "constrained-construction"]],
  ["transformation", ["transformation"]],
  ["error-diagnosis", ["choice"]],
  ["contextual-response", ["choice", "constrained-construction"]],
  ["cumulative-retrieval", ["completion", "constrained-construction"]],
  ["listening", ["listening"]],
  ["spoken", ["spoken"]],
];

export const BASE_ACTIVITY_OPERATION_BY_CATEGORY: Readonly<
  Record<BaseActivityKind, BaseSemanticActivityOperation>
> = deepFreeze(Object.fromEntries(ACTIVITY_OPERATION_ENTRIES)) as Readonly<
  Record<BaseActivityKind, BaseSemanticActivityOperation>
>;

export const BASE_ACTIVITY_INTERACTIONS_BY_CATEGORY: Readonly<
  Record<BaseActivityKind, readonly BaseInteractionKind[]>
> = deepFreeze(Object.fromEntries(ACTIVITY_INTERACTION_ENTRIES)) as Readonly<
  Record<BaseActivityKind, readonly BaseInteractionKind[]>
>;

export const BASE_PHONETIC_ACTIVITY_OPERATIONS: readonly BasePhoneticActivityOperation[] =
  deepFreeze([
    "discriminate-sound",
    "segment-morae",
    "recognize-kana",
    "map-script",
    "match-sound-word",
    "assemble-reading",
  ]);

const ACTIVITY_OPERATION_BY_CATEGORY = immutableReadonlyMap(
  ACTIVITY_OPERATION_ENTRIES,
);
const ACTIVITY_INTERACTIONS_BY_CATEGORY = immutableReadonlyMap(
  ACTIVITY_INTERACTION_ENTRIES,
);
const ACTIVITY_KINDS = new Set<string>(
  ACTIVITY_OPERATION_ENTRIES.map(([category]) => category),
);
const ACTIVITY_INTERACTIONS = new Set<string>(
  ACTIVITY_INTERACTION_ENTRIES.flatMap(([, interactions]) => interactions),
);
const ACTIVITY_MODES = new Set<string>(["non-spoken", "audio"]);
const ACTIVITY_OPERATIONS = new Set<string>([
  ...ACTIVITY_OPERATION_ENTRIES.map(([, operation]) => operation),
  ...BASE_PHONETIC_ACTIVITY_OPERATIONS,
]);

export function isBaseActivityKind(value: unknown): value is BaseActivityKind {
  return typeof value === "string" && ACTIVITY_KINDS.has(value);
}

export function isBaseInteractionKind(
  value: unknown,
): value is BaseInteractionKind {
  return typeof value === "string" && ACTIVITY_INTERACTIONS.has(value);
}

export function isBaseActivityMode(value: unknown): value is BaseActivityMode {
  return typeof value === "string" && ACTIVITY_MODES.has(value);
}

export function isBaseActivityOperation(
  value: unknown,
): value is BaseActivityOperation {
  return typeof value === "string" && ACTIVITY_OPERATIONS.has(value);
}

export function baseActivityOperationFor(
  category: unknown,
): BaseSemanticActivityOperation | null {
  return isBaseActivityKind(category)
    ? ACTIVITY_OPERATION_BY_CATEGORY.get(category) ?? null
    : null;
}

export function baseActivityInteractionsFor(
  category: unknown,
): readonly BaseInteractionKind[] | null {
  return isBaseActivityKind(category)
    ? ACTIVITY_INTERACTIONS_BY_CATEGORY.get(category) ?? null
    : null;
}

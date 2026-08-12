import { deepFreeze } from "../../foundations/deepFreeze";
import type { CheckpointDefinition, LessonId } from "../../foundations/types";
import { BASE_LESSON_IDS_BY_MODULE } from "../manifest";
import type { BaseReferenceId } from "../references/catalog";
import { BASE_CAN_DO_IDS } from "./canDos";

export const BASE_CHECKPOINT_ID = "base-checkpoint-1" as const;
export const BASE_CHECKPOINT_MIN_TRANSFER_TARGETS = 2;

export const BASE_CHECKPOINT_SCENARIO_LESSON_IDS: readonly LessonId[] =
  deepFreeze([...BASE_LESSON_IDS_BY_MODULE["base-synthesis"]]);

export const BASE_CHECKPOINT_SYNTHESIS_LESSON_IDS =
  BASE_CHECKPOINT_SCENARIO_LESSON_IDS;

export const BASE_CHECKPOINT_REFERENCE_IDS: readonly BaseReferenceId[] =
  deepFreeze([
    "sentence-anatomy",
    "particle-atlas",
    "verb-classes-conjugation",
    "tense-polarity",
    "adjective-copula",
  ]);

export interface BaseCheckpointObservationPolicy {
  readonly recordsObservedEvidenceOnly: true;
  readonly unlocksA1: false;
  readonly isCertification: false;
}

export type BaseCheckpointDefinition = CheckpointDefinition &
  Readonly<{
    readonly observationPolicy: BaseCheckpointObservationPolicy;
  }>;

const rawCheckpoint = {
  id: BASE_CHECKPOINT_ID,
  level: "a0",
  sampledCanDoIds: [...BASE_CAN_DO_IDS],
  minAcceptedTransferTargetsPerCanDo: BASE_CHECKPOINT_MIN_TRANSFER_TARGETS,
} as CheckpointDefinition & {
  observationPolicy?: BaseCheckpointObservationPolicy;
};

Object.defineProperty(rawCheckpoint, "observationPolicy", {
  value: deepFreeze({
    recordsObservedEvidenceOnly: true,
    unlocksA1: false,
    isCertification: false,
  }),
  enumerable: false,
  configurable: false,
  writable: false,
});

export const baseCheckpoint: BaseCheckpointDefinition = deepFreeze(
  rawCheckpoint as BaseCheckpointDefinition,
);

export interface BaseCheckpointValidation {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

function validateBaseCheckpoint(): BaseCheckpointValidation {
  const errors: string[] = [];
  if (
    BASE_CHECKPOINT_REFERENCE_IDS.length !== 5 ||
    new Set(BASE_CHECKPOINT_REFERENCE_IDS).size !== 5
  ) {
    errors.push("reference-sampling");
  }
  if (
    BASE_CHECKPOINT_SYNTHESIS_LESSON_IDS.length !== 4 ||
    BASE_CHECKPOINT_SYNTHESIS_LESSON_IDS.some(
      (id, index) =>
        id !== BASE_LESSON_IDS_BY_MODULE["base-synthesis"][index],
    )
  ) {
    errors.push("synthesis-sampling");
  }
  if (
    baseCheckpoint.sampledCanDoIds.length !== BASE_CAN_DO_IDS.length ||
    baseCheckpoint.sampledCanDoIds.some(
      (id, index) => id !== BASE_CAN_DO_IDS[index],
    )
  ) {
    errors.push("can-do-link");
  }
  return {
    ok: errors.length === 0,
    errors: deepFreeze(errors),
  };
}

export const BASE_CHECKPOINT_VALIDATION = validateBaseCheckpoint();

import { deepFreeze } from "../../foundations/deepFreeze";
import type { CheckpointDefinition, LessonId } from "../../foundations/types";
import { BASE_LESSON_IDS_BY_MODULE } from "../manifest";
import { BASE_CAN_DO_IDS } from "./canDos";

export const BASE_CHECKPOINT_ID = "base-checkpoint-1" as const;
export const BASE_CHECKPOINT_MIN_TRANSFER_TARGETS = 2;

export const BASE_CHECKPOINT_SCENARIO_LESSON_IDS: readonly LessonId[] =
  deepFreeze([...BASE_LESSON_IDS_BY_MODULE["base-synthesis"]]);

export const baseCheckpoint: CheckpointDefinition = deepFreeze({
  id: BASE_CHECKPOINT_ID,
  level: "a0",
  sampledCanDoIds: [...BASE_CAN_DO_IDS],
  minAcceptedTransferTargetsPerCanDo: BASE_CHECKPOINT_MIN_TRANSFER_TARGETS,
});

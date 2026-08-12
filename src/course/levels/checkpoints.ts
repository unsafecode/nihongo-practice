import { a1CanDosAuthored } from "../a1/catalog/canDos";
import { a1Checkpoint } from "../a1/catalog/checkpoint";
import { deepFreeze } from "../foundations/deepFreeze";
import type { CanDo, CheckpointDefinition } from "../foundations/types";
import { lessonOwner } from "./ownership";
import type { CourseLevelId } from "./types";

export function retainedCheckpointProjection(
  checkpoint: CheckpointDefinition,
  canDos: readonly CanDo[],
): CheckpointDefinition {
  const authoredCanDoIds = new Set(canDos.map((canDo) => canDo.id));
  for (const sampledId of checkpoint.sampledCanDoIds) {
    if (!authoredCanDoIds.has(sampledId)) {
      throw new Error(`checkpoint "${checkpoint.id}" samples unknown Can-do "${sampledId}"`);
    }
  }

  const retainedCanDoIds = new Set(
    canDos
      .filter(
        (canDo) =>
          canDo.level === checkpoint.level &&
          canDo.lessonIds.some((lessonId) => lessonOwner(lessonId)?.levelId === checkpoint.level),
      )
      .map((canDo) => canDo.id),
  );
  if (retainedCanDoIds.size === 0) {
    throw new Error(`checkpoint "${checkpoint.id}" has no retained ${checkpoint.level} Can-dos`);
  }

  const sampledCanDoIds = checkpoint.sampledCanDoIds.filter((sampledId) =>
    retainedCanDoIds.has(sampledId),
  );
  if (sampledCanDoIds.length === 0) {
    throw new Error(`checkpoint "${checkpoint.id}" has no retained sampled Can-dos`);
  }

  return deepFreeze({
    ...checkpoint,
    sampledCanDoIds,
  });
}

export function retainedCheckpointForLevel(
  level: CourseLevelId,
  checkpoint: CheckpointDefinition,
  canDos: readonly CanDo[],
): CheckpointDefinition {
  if (checkpoint.level !== level) {
    throw new Error(`checkpoint "${checkpoint.id}" is not a ${level} checkpoint`);
  }
  return retainedCheckpointProjection(checkpoint, canDos);
}

export const retainedA1Checkpoint: CheckpointDefinition = retainedCheckpointForLevel(
  "a1",
  a1Checkpoint,
  a1CanDosAuthored,
);

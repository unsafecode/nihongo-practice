import { describe, expect, it } from "vitest";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import { a1Checkpoint } from "../a1/catalog/checkpoint";
import type { CheckpointDefinition } from "../foundations/types";
import {
  retainedA1Checkpoint,
  retainedCheckpointProjection,
} from "./checkpoints";
import { LEVEL_RUNTIME_CONFIG } from "./runtimeConfig";

describe("retained checkpoint projection", () => {
  it("projects the authored A1 checkpoint onto the retained A1 Can-do membership", () => {
    const retainedIds = new Set(LEVEL_RUNTIME_CONFIG.a1.canDos.map((canDo) => canDo.id));

    expect(retainedA1Checkpoint.sampledCanDoIds).not.toHaveLength(0);
    expect(retainedA1Checkpoint.sampledCanDoIds).toEqual(
      a1Checkpoint.sampledCanDoIds.filter((id) => retainedIds.has(id)),
    );
    expect(retainedA1Checkpoint).not.toBe(a1Checkpoint);
    expect(a1Checkpoint.sampledCanDoIds).toContain("a1-can-do-sounds");
    expect(retainedA1Checkpoint.sampledCanDoIds).not.toContain("a1-can-do-sounds");
  });

  it("fails closed when a checkpoint samples an unknown Can-do", () => {
    const checkpoint: CheckpointDefinition = {
      ...a1Checkpoint,
      sampledCanDoIds: [...a1Checkpoint.sampledCanDoIds, "a1-can-do-unknown"],
    };

    expect(() => retainedCheckpointProjection(checkpoint, a1CanDosAuthored)).toThrow(
      /unknown Can-do "a1-can-do-unknown"/,
    );
  });

  it("fails closed when no sampled Can-dos remain after retained ownership filtering", () => {
    const checkpoint: CheckpointDefinition = {
      ...a1Checkpoint,
      sampledCanDoIds: ["a1-can-do-sounds"],
    };

    expect(() => retainedCheckpointProjection(checkpoint, a1CanDosAuthored)).toThrow(
      /no retained sampled Can-dos/,
    );
  });
});

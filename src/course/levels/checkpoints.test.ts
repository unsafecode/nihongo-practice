import { describe, expect, it } from "vitest";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import { a1Checkpoint } from "../a1/catalog/checkpoint";
import type { CanDo, CheckpointDefinition } from "../foundations/types";
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
    // Task 16 removed the Base-owned outcomes from the *authored* checkpoint,
    // so the projection is now a defence in depth rather than the only guard:
    // nothing Base owns is sampled at either layer.
    for (const canDoId of [
      "a1-can-do-sounds",
      "a1-can-do-sentence-foundations",
      "a1-can-do-topic-questions",
      "a1-can-do-polite-verbs",
      "a1-can-do-time-movement",
    ]) {
      expect(a1Checkpoint.sampledCanDoIds, canDoId).not.toContain(canDoId);
      expect(retainedA1Checkpoint.sampledCanDoIds, canDoId).not.toContain(canDoId);
    }
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
    // An A1-level Can-do whose only lessons are owned by another level: known
    // to the catalog, so it passes the unknown-Can-do guard, but not retained.
    const baseOwnedCanDo: CanDo = {
      ...a1CanDosAuthored[0]!,
      id: "a1-can-do-base-owned-fixture",
      lessonIds: ["sounds-1"],
    };
    const checkpoint: CheckpointDefinition = {
      ...a1Checkpoint,
      sampledCanDoIds: [baseOwnedCanDo.id],
    };

    expect(() =>
      retainedCheckpointProjection(checkpoint, [...a1CanDosAuthored, baseOwnedCanDo]),
    ).toThrow(/no retained sampled Can-dos/);
  });
});

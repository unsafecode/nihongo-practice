import { describe, expect, it } from "vitest";
import {
  A2_ALIGNMENT_COPY_ID,
  A2_LEVEL_ID,
  A2_RECOMMENDED_PREREQUISITE_CHECKPOINT_ID,
  buildA2Level,
} from "./level";
import { A2_MODULE_IDS } from "../manifest";

/**
 * A2 level architecture (Phase 3 Task 1). There is no Can-do catalog yet, so
 * `buildA2Level` takes the Can-do id list as a parameter rather than reading
 * a real catalog — later tasks call it with the authored Can-do ids. This
 * suite proves the level's stable ids, its exact five-key `CourseLevel`
 * shape, that it never locks A2 behind the A1 checkpoint (soft recommend
 * only), and that the function is pure and deep-frozen.
 */
describe("A2 level", () => {
  it("exposes the stable level id, alignment copy id, and recommended-prerequisite checkpoint id", () => {
    expect(A2_LEVEL_ID).toBe("a2");
    expect(A2_ALIGNMENT_COPY_ID).toBe("a2-level-a2-alignment");
    expect(A2_RECOMMENDED_PREREQUISITE_CHECKPOINT_ID).toBe("a1-checkpoint");
  });

  it("builds a CourseLevel with exactly five keys: id, alignmentCopyId, moduleIds, canDoIds, recommendedPrerequisiteCheckpointId", () => {
    const canDoIds = ["a2-can-do-one", "a2-can-do-two"];
    const level = buildA2Level(canDoIds);

    expect(Object.keys(level).sort()).toEqual(
      [
        "id",
        "alignmentCopyId",
        "moduleIds",
        "canDoIds",
        "recommendedPrerequisiteCheckpointId",
      ].sort(),
    );
    expect(level.id).toBe("a2");
    expect(level.alignmentCopyId).toBe("a2-level-a2-alignment");
    expect(level.moduleIds).toEqual(A2_MODULE_IDS);
    expect(level.canDoIds).toEqual(canDoIds);
    expect(level.recommendedPrerequisiteCheckpointId).toBe("a1-checkpoint");
  });

  it("recommends but does not lock A2 behind the A1 checkpoint", () => {
    // "Recommended" is a soft prerequisite: the field is present, but A2 has
    // no gate/lock field anywhere in its CourseLevel shape that would block
    // entry when the A1 checkpoint is unmet.
    const level = buildA2Level([]);
    expect(level.recommendedPrerequisiteCheckpointId).toBe("a1-checkpoint");
    expect(level).not.toHaveProperty("requiredPrerequisiteCheckpointId");
    expect(level).not.toHaveProperty("locked");
  });

  it("is pure (same input produces deep-equal output) and deep-frozen", () => {
    const canDoIds = ["a2-can-do-one"];
    const levelA = buildA2Level(canDoIds);
    const levelB = buildA2Level(canDoIds);
    expect(levelA).toEqual(levelB);

    expect(Object.isFrozen(levelA)).toBe(true);
    expect(Object.isFrozen(levelA.moduleIds)).toBe(true);
    expect(Object.isFrozen(levelA.canDoIds)).toBe(true);

    // Mutating the input array after the call must not affect the built level.
    const mutableInput = ["a2-can-do-x"];
    const levelC = buildA2Level(mutableInput);
    mutableInput.push("a2-can-do-y");
    expect(levelC.canDoIds).toEqual(["a2-can-do-x"]);
  });
});

import { deepFreeze } from "../../foundations/deepFreeze";
import { BASE_LEXICON } from "../catalog/lexicon";
import {
  BASE_PARTICLE_SENSES,
  validateParticleFrame,
} from "../forms/particleLicensing";
import type { BaseReleaseInput, BaseReleaseVisibleTarget } from "../reports";
import { buildBaseReleaseInput } from "../validateBase";

/**
 * Task 17 mutation fixtures.
 *
 * `baseReleaseInput` is the real, deep-frozen release snapshot. Every mutator
 * below **deep-clones it first** and then changes **exactly one field**, so a
 * fixture can never corrupt the shared input and can never accidentally trip
 * more than the invariant it targets.
 *
 * Every target is *selected by measurement* against the real release — never
 * by a hardcoded id — so a fixture fails loudly (rather than silently
 * degrading into a no-op that would make the mutation test vacuously pass) if
 * the content it needs ever stops existing.
 */

export const baseReleaseInput: BaseReleaseInput = deepFreeze(
  buildBaseReleaseInput(),
);

/** Deep-clones a release input so a mutation can never reach the original. */
export function cloneBaseReleaseInput(input: BaseReleaseInput): BaseReleaseInput {
  return structuredClone(input) as BaseReleaseInput;
}

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`mutationFixtures: the release no longer contains ${what}.`);
  }
  return value;
}

function targetIndex(
  predicate: (target: BaseReleaseVisibleTarget) => boolean,
  what: string,
): number {
  const index = baseReleaseInput.visibleTargets.findIndex(predicate);
  if (index < 0) {
    throw new Error(`mutationFixtures: the release no longer contains ${what}.`);
  }
  return index;
}

const CANONICAL_KINDS: ReadonlySet<BaseReleaseVisibleTarget["kind"]> = new Set([
  "example",
  "dialogue-turn",
  "activity-answer",
]);

const I_ADJECTIVE_KANA_BY_ID = new Map(
  BASE_LEXICON.flatMap((lexeme) =>
    lexeme.category === "adjective" && lexeme.adjectiveClass === "i"
      ? [[lexeme.id, lexeme.kana] as const]
      : [],
  ),
);

// --- selection ------------------------------------------------------------

/** A dynamic predicate that is *not* already glossed as ongoing-now. */
const DYNAMIC_NONPAST_INDEX = targetIndex(
  (target) =>
    target.predicateAspect === "dynamic" &&
    !target.interpretationTags.includes("ongoing-now") &&
    !target.formIds.includes("base-construction-te-imasu"),
  "a dynamic non-past visible target",
);

/** A canonical surface that visibly realizes an i-adjective. */
const I_ADJECTIVE_SELECTION = (() => {
  for (const [index, target] of baseReleaseInput.visibleTargets.entries()) {
    if (!CANONICAL_KINDS.has(target.kind)) continue;
    for (const lexemeId of target.lexemeIds) {
      const kana = I_ADJECTIVE_KANA_BY_ID.get(lexemeId);
      if (kana && target.japanese.includes(kana) && !target.japanese.includes(`${kana}だ`)) {
        return { index, kana };
      }
    }
  }
  throw new Error(
    "mutationFixtures: the release no longer contains a canonical i-adjective surface.",
  );
})();

/**
 * A particle frame plus one role/sense swap that the licensing engine rejects
 * with exactly `unlicensed-particle` — proved here, at fixture-build time,
 * against the real engine rather than assumed.
 */
const PARTICLE_SELECTION = (() => {
  for (const [index, target] of baseReleaseInput.visibleTargets.entries()) {
    const frame = target.particleFrame;
    if (!frame) continue;
    for (const role of Object.keys(frame.provided)) {
      for (const sense of BASE_PARTICLE_SENSES) {
        if (frame.provided[role] === sense.id) continue;
        const result = validateParticleFrame(frame.predicateSenseId, {
          ...frame.provided,
          [role]: sense.id,
        });
        if (
          !result.ok &&
          result.errors.length === 1 &&
          result.errors[0]?.code === "unlicensed-particle"
        ) {
          return { index, role, sense: sense.id };
        }
      }
    }
  }
  throw new Error(
    "mutationFixtures: the release no longer contains a licensable particle frame.",
  );
})();

/**
 * A pattern cell a *system* lesson declares and exactly one of its surfaces
 * realizes, so removing it from that one surface genuinely uncovers the cell.
 */
const PATTERN_CELL_SELECTION = (() => {
  const systemLessonIds = new Set(
    baseReleaseInput.lessons
      .filter((lesson) => lesson.contract === "system")
      .map((lesson) => lesson.lessonId),
  );
  for (const lesson of baseReleaseInput.lessons) {
    if (!systemLessonIds.has(lesson.lessonId)) continue;
    for (const cellId of lesson.patternCellIds) {
      const carriers = baseReleaseInput.visibleTargets
        .map((target, index) => ({ target, index }))
        .filter(
          ({ target }) =>
            target.lessonId === lesson.lessonId &&
            target.patternCellIds.includes(cellId),
        );
      if (carriers.length === 1) {
        return { index: required(carriers[0], "a pattern-cell carrier").index, cellId };
      }
    }
  }
  throw new Error(
    "mutationFixtures: no system pattern cell is realized by exactly one surface.",
  );
})();

/** Two distinct worked examples in the same lesson, so one can shadow the other. */
const DUPLICATE_SELECTION = (() => {
  const byLesson = new Map<string, { index: number; sourceId: string }[]>();
  for (const [index, target] of baseReleaseInput.visibleTargets.entries()) {
    if (target.kind !== "example") continue;
    const bucket = byLesson.get(target.lessonId) ?? [];
    bucket.push({ index, sourceId: target.sourceId });
    byLesson.set(target.lessonId, bucket);
  }
  for (const bucket of byLesson.values()) {
    const [first, second] = bucket;
    if (first && second && first.sourceId !== second.sourceId) {
      return { index: second.index, japanese: undefined, donorIndex: first.index };
    }
  }
  throw new Error(
    "mutationFixtures: no lesson publishes two distinct worked examples.",
  );
})();

/** A pre-attempt probe that genuinely has a secret answer to leak. */
const PROBE_INDEX = (() => {
  const index = baseReleaseInput.renderProbes.findIndex(
    (probe) => probe.forbiddenAnswers.length > 0,
  );
  if (index < 0) {
    throw new Error(
      "mutationFixtures: no practice activity has a pre-attempt secret answer.",
    );
  }
  return index;
})();

/** A canonical-audio review that names a shipped asset. */
const AUDIO_REVIEW_INDEX = (() => {
  const index = baseReleaseInput.audio.reviews.findIndex(
    (review) => review.assetId !== null,
  );
  if (index < 0) {
    throw new Error("mutationFixtures: no audio review names a shipped asset.");
  }
  return index;
})();

const NATURALNESS_REVIEW_INDEX = (() => {
  const index = baseReleaseInput.naturalness.reviews.findIndex(
    (review) => review.jp.length > 0,
  );
  if (index < 0) {
    throw new Error("mutationFixtures: no naturalness review carries Japanese.");
  }
  return index;
})();

// --- mutators -------------------------------------------------------------

function mutableTargets(
  input: BaseReleaseInput,
): BaseReleaseVisibleTarget[] {
  return input.visibleTargets as BaseReleaseVisibleTarget[];
}

/**
 * Glosses a dynamic non-past predicate as ongoing-now, which only the bounded
 * `ている` construction can license. One field: `interpretationTags`.
 */
export function mutateDynamicNonpastGloss(
  input: BaseReleaseInput,
): BaseReleaseInput {
  const clone = cloneBaseReleaseInput(input);
  const targets = mutableTargets(clone);
  const target = required(targets[DYNAMIC_NONPAST_INDEX], "a dynamic target");
  targets[DYNAMIC_NONPAST_INDEX] = {
    ...target,
    interpretationTags: [...target.interpretationTags, "ongoing-now"],
  };
  return clone;
}

/**
 * Realizes an i-adjective predicate with the copula だ. One field: the
 * canonical surface's `japanese`.
 */
export function mutateIAdjectiveDa(input: BaseReleaseInput): BaseReleaseInput {
  const clone = cloneBaseReleaseInput(input);
  const targets = mutableTargets(clone);
  const { index, kana } = I_ADJECTIVE_SELECTION;
  const target = required(targets[index], "an i-adjective surface");
  targets[index] = {
    ...target,
    japanese: target.japanese.replace(kana, `${kana}だ`),
  };
  return clone;
}

/**
 * Binds a particle role to a sense the predicate does not license. One field:
 * the frame's `provided` map.
 */
export function mutateParticleFrame(input: BaseReleaseInput): BaseReleaseInput {
  const clone = cloneBaseReleaseInput(input);
  const targets = mutableTargets(clone);
  const { index, role, sense } = PARTICLE_SELECTION;
  const target = required(targets[index], "a particle frame");
  const frame = required(target.particleFrame ?? undefined, "a particle frame");
  targets[index] = {
    ...target,
    particleFrame: {
      ...frame,
      provided: { ...frame.provided, [role]: sense },
    },
  };
  return clone;
}

/**
 * Drops the only surface that realizes one of a system lesson's declared
 * pattern cells. One field: that surface's `patternCellIds`.
 */
export function removePatternCell(input: BaseReleaseInput): BaseReleaseInput {
  const clone = cloneBaseReleaseInput(input);
  const targets = mutableTargets(clone);
  const { index, cellId } = PATTERN_CELL_SELECTION;
  const target = required(targets[index], "a pattern-cell carrier");
  targets[index] = {
    ...target,
    patternCellIds: target.patternCellIds.filter((id) => id !== cellId),
  };
  return clone;
}

/**
 * Makes one worked example render exactly like another in the same lesson —
 * indistinguishable to a learner. One field: `japanese`.
 */
export function duplicateVisibleTarget(
  input: BaseReleaseInput,
): BaseReleaseInput {
  const clone = cloneBaseReleaseInput(input);
  const targets = mutableTargets(clone);
  const target = required(targets[DUPLICATE_SELECTION.index], "a worked example");
  const donor = required(
    targets[DUPLICATE_SELECTION.donorIndex],
    "a donor worked example",
  );
  targets[DUPLICATE_SELECTION.index] = { ...target, japanese: donor.japanese };
  return clone;
}

/**
 * Ships the canonical answer in a pre-attempt DOM data attribute. One field:
 * the probe's `preAttemptAttributes`.
 */
export function leakAnswerDataAttribute(
  input: BaseReleaseInput,
): BaseReleaseInput {
  const clone = cloneBaseReleaseInput(input);
  const probes = clone.renderProbes as BaseReleaseInput["renderProbes"][number][];
  const probe = required(probes[PROBE_INDEX], "a pre-attempt probe");
  probes[PROBE_INDEX] = {
    ...probe,
    preAttemptAttributes: {
      ...probe.preAttemptAttributes,
      "data-answer": required(probe.forbiddenAnswers[0], "a secret answer"),
    },
  };
  return clone;
}

/**
 * Leaves the audio ledger describing a different asset than the one shipped —
 * a stale review, whatever its acceptance status. One field: `assetSha256`.
 */
export function changeReviewedAudioHash(
  input: BaseReleaseInput,
): BaseReleaseInput {
  const clone = cloneBaseReleaseInput(input);
  const reviews = clone.audio.reviews as BaseReleaseInput["audio"]["reviews"][number][];
  const review = required(reviews[AUDIO_REVIEW_INDEX], "an audio review");
  reviews[AUDIO_REVIEW_INDEX] = {
    ...review,
    assetSha256: `0${(review.assetSha256 ?? "").slice(1)}`.padEnd(64, "0"),
  };
  return clone;
}

/**
 * Leaves the naturalness ledger describing Japanese the release no longer
 * ships — a stale review, whatever its acceptance status. One field: `jp`.
 */
export function changeReviewedJapanese(
  input: BaseReleaseInput,
): BaseReleaseInput {
  const clone = cloneBaseReleaseInput(input);
  const reviews =
    clone.naturalness.reviews as BaseReleaseInput["naturalness"]["reviews"][number][];
  const review = required(reviews[NATURALNESS_REVIEW_INDEX], "a naturalness review");
  reviews[NATURALNESS_REVIEW_INDEX] = { ...review, jp: `${review.jp}ね` };
  return clone;
}

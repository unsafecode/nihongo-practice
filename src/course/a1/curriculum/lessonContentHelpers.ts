import type {
  A1PracticeActivity,
  A1PracticeBlueprint,
} from "./types";
import { buildA1LessonViewModel } from "../a1LessonViewModel";
import {
  module1ItemsByLesson,
  type A1PhoneticItem,
} from "../catalog/module01Sounds";

type PhoneticItemIds = readonly [string, string, string, string, string];

type GeneratedPhoneticTargetRef = Extract<
  A1PracticeActivity["targetRef"],
  Readonly<{ round: "one" | "two"; index: number }>
>;

/**
 * Resolves the one phonetic catalog item a generated blueprint activity
 * targets. This is shared by the runtime exercise model and the curriculum
 * validator so their round/index semantics cannot drift.
 */
export function phoneticItemForPracticeTarget(
  items: readonly A1PhoneticItem[],
  targetRef: GeneratedPhoneticTargetRef,
): A1PhoneticItem | undefined {
  const offset = targetRef.round === "one" ? 0 : 3;
  return items[targetRef.index + offset];
}

export function semanticBlueprint(
  lessonId: string,
  spokenVariantId: string,
  fourth: "transformation" | "contextual-response",
): A1PracticeBlueprint {
  const built = buildA1LessonViewModel(lessonId, "en");
  if (!built.ok) {
    throw new Error(`A1 semantic practice blueprint cannot resolve "${lessonId}".`);
  }
  const selectedVisibleTargets = new Set(
    built.model.rounds.flatMap((round) => round.targets.map((target) => target.visibleTargetKey)),
  );
  const selectedFamilyCounts = built.model.rounds
    .flatMap((round) => round.targets)
    .reduce<Map<string, number>>(
      (counts, target) =>
        counts.set(target.familyId, (counts.get(target.familyId) ?? 0) + 1),
      new Map(),
    );
  const spokenCandidates = built.model.matrix.rows
    .filter((row) => !selectedVisibleTargets.has(row.tokens.map((token) => token.jp).join("")))
    .sort((left, right) => {
      const leftBenefit = selectedFamilyCounts.get(left.familyId) === 1 ? 1 : 0;
      const rightBenefit = selectedFamilyCounts.get(right.familyId) === 1 ? 1 : 0;
      if (leftBenefit !== rightBenefit) return rightBenefit - leftBenefit;
      if (left.variantId === spokenVariantId) return -1;
      if (right.variantId === spokenVariantId) return 1;
      return left.variantId.localeCompare(right.variantId);
    });
  const spokenTargetVariantId =
    spokenCandidates[0]?.variantId ?? spokenVariantId;
  const interactionFor = (
    round: "one" | "two",
    index: number,
  ): Exclude<A1PracticeBlueprint["activities"][number]["interactionKind"], "spoken"> => {
    const roundOne = built.model.rounds[0].targets;
    const roundTwo = built.model.rounds[1].targets;
    const target = (round === "one" ? roundOne : roundTwo)[index];
    if (!target) {
      throw new Error(`A1 semantic practice blueprint cannot resolve ${lessonId}:${round}:${index}.`);
    }
    return target.prompt.kind;
  };

  return {
    activities: [
      {
        id: `${lessonId}-meaning`,
        function: "meaning-comprehension",
        interactionKind: interactionFor("one", 1),
        targetRef: { round: "one", index: 1 },
      },
      {
        id: `${lessonId}-form`,
        function: "form-discrimination",
        interactionKind: interactionFor("two", 0),
        targetRef: { round: "two", index: 0 },
      },
      {
        id: `${lessonId}-production`,
        function: "controlled-production",
        interactionKind: interactionFor("one", 0),
        targetRef: { round: "one", index: 0 },
      },
      fourth === "contextual-response"
        ? {
            id: `${lessonId}-transfer`,
            function: "contextual-response",
            interactionKind: interactionFor("two", 1),
            targetRef: { round: "two", index: 1 },
          }
        : {
            id: `${lessonId}-transfer`,
            function: "transformation",
            interactionKind: interactionFor("two", 1),
            targetRef: { round: "two", index: 1 },
          },
      {
        id: `${lessonId}-spoken`,
        function: "listening-speaking",
        interactionKind: "spoken",
        targetRef: { spokenVariantId: spokenTargetVariantId },
      },
    ],
  };
}

export function phoneticBlueprint(
  lessonId: string,
  itemIds: PhoneticItemIds,
): A1PracticeBlueprint {
  const visibleItemIds = [
    itemIds[0],
    itemIds[1],
    itemIds[2],
    itemIds[4],
    itemIds[3],
  ];
  if (new Set(visibleItemIds).size !== visibleItemIds.length) {
    throw new Error("Phonetic practice requires unique phonetic item ids.");
  }
  const items = module1ItemsByLesson[lessonId] ?? [];
  const interactionFor = (
    round: "one" | "two",
    index: number,
  ): Exclude<A1PracticeBlueprint["activities"][number]["interactionKind"], "spoken"> => {
    const item = phoneticItemForPracticeTarget(items, { round, index });
    if (!item) {
      throw new Error(`A1 phonetic practice blueprint cannot resolve ${lessonId}:${round}:${index}.`);
    }
    return item.exerciseKind === "mora-tiling" ? "tile-ordering" : "choice";
  };

  return {
    activities: [
      {
        id: `${lessonId}-meaning`,
        function: "meaning-comprehension",
        interactionKind: interactionFor("one", 0),
        targetRef: { round: "one", index: 0 },
      },
      {
        id: `${lessonId}-form`,
        function: "form-discrimination",
        interactionKind: interactionFor("one", 1),
        targetRef: { round: "one", index: 1 },
      },
      {
        id: `${lessonId}-production`,
        function: "controlled-production",
        interactionKind: interactionFor("one", 2),
        targetRef: { round: "one", index: 2 },
      },
      {
        id: `${lessonId}-transfer`,
        function: "contextual-response",
        interactionKind: interactionFor("two", 0),
        targetRef: { round: "two", index: 0 },
      },
      {
        id: `${lessonId}-spoken`,
        function: "listening-speaking",
        interactionKind: "spoken",
        targetRef: { spokenVariantId: itemIds[4] },
      },
    ],
  };
}

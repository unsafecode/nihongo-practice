import type { A1PracticeBlueprint } from "./types";

type PhoneticItemIds = readonly [string, string, string, string, string];

export function semanticBlueprint(
  lessonId: string,
  spokenVariantId: string,
  fourth: "transformation" | "contextual-response",
): A1PracticeBlueprint {
  return {
    activities: [
      {
        id: `${lessonId}-meaning`,
        function: "meaning-comprehension",
        interactionKind: "choice",
        targetRef: { round: "one", index: 1 },
      },
      {
        id: `${lessonId}-form`,
        function: "form-discrimination",
        interactionKind: "completion",
        targetRef: { round: "two", index: 0 },
      },
      {
        id: `${lessonId}-production`,
        function: "controlled-production",
        interactionKind: "tile-ordering",
        targetRef: { round: "one", index: 0 },
      },
      fourth === "contextual-response"
        ? {
            id: `${lessonId}-transfer`,
            function: "contextual-response",
            interactionKind: "constrained-construction",
            targetRef: { round: "two", index: 1 },
          }
        : {
            id: `${lessonId}-transfer`,
            function: "transformation",
            interactionKind: "transformation",
            targetRef: { round: "two", index: 1 },
          },
      {
        id: `${lessonId}-spoken`,
        function: "listening-speaking",
        interactionKind: "spoken",
        targetRef: { spokenVariantId },
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

  return {
    activities: [
      {
        id: `${lessonId}-meaning`,
        function: "meaning-comprehension",
        interactionKind: "choice",
        targetRef: { round: "one", index: 0 },
      },
      {
        id: `${lessonId}-form`,
        function: "form-discrimination",
        interactionKind: "choice",
        targetRef: { round: "one", index: 1 },
      },
      {
        id: `${lessonId}-production`,
        function: "controlled-production",
        interactionKind: "tile-ordering",
        targetRef: { round: "one", index: 2 },
      },
      {
        id: `${lessonId}-transfer`,
        function: "contextual-response",
        interactionKind: "choice",
        targetRef: { round: "two", index: 1 },
      },
      {
        id: `${lessonId}-spoken`,
        function: "listening-speaking",
        interactionKind: "spoken",
        targetRef: { spokenVariantId: itemIds[3] },
      },
    ],
  };
}

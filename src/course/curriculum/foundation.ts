import type {
  CurriculumFoundation,
  CurriculumModuleFoundation,
} from "./types";

type ModuleSeed = readonly [
  id: string,
  phase: CurriculumModuleFoundation["phase"],
  lessons: number,
  introducedVerbs: number,
  vocabulary: number,
];

const moduleSeeds: readonly ModuleSeed[] = [
  ["sounds", "orient", 5, 0, 20],
  ["introductions", "orient", 3, 4, 25],
  ["essential-questions", "orient", 3, 2, 20],
  ["actions", "build", 3, 8, 25],
  ["routines", "build", 3, 6, 25],
  ["past-negative", "build", 3, 3, 20],
  ["places", "navigate", 4, 7, 25],
  ["people", "navigate", 3, 3, 25],
  ["descriptions", "navigate", 3, 3, 25],
  ["shopping", "navigate", 3, 3, 30],
  ["existence-needs", "navigate", 3, 3, 30],
  ["capstones", "synthesize", 4, 0, 0],
];

export const curriculumFoundation: CurriculumFoundation = {
  version: "a0-a1-v1",
  modules: moduleSeeds.map(
    ([id, phase, lessons, introducedVerbs, vocabulary], index) => ({
      id,
      phase,
      order: index + 1,
      prerequisiteIds: index === 0 ? [] : [moduleSeeds[index - 1][0]],
      coverage: { lessons, introducedVerbs, vocabulary },
    }),
  ),
};

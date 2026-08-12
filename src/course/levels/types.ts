import { deepFreeze } from "../foundations/deepFreeze";

export type CourseLevelId = "a0" | "a1" | "a2";
export type CourseLevelParam = "base" | "a1" | "a2";

export const COURSE_LEVEL_IDS: readonly CourseLevelId[] = deepFreeze([
  "a0",
  "a1",
  "a2",
]);

export function levelParam(level: CourseLevelId): CourseLevelParam {
  return level === "a0" ? "base" : level;
}

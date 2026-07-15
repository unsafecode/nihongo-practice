import type { CourseModule } from "./types";
import { courseModules as assembledCourseModules } from "../catalog/assembleCourse";

/**
 * The runnable course data (design spec §5, §9, §13).
 *
 * The complete A0→A1 course (12 modules / 40 lessons) is no longer authored by
 * hand here: it is assembled from the validated locale-independent catalogs by
 * the pure `assembleCourse` adapter. That adapter runs `validateCurriculum`
 * with the release targets enforced at import time and throws rather than
 * export any partial content, so importing `courseModules` can only ever yield
 * the complete, validated course. Every route, component, and progress contract
 * keeps consuming `courseModules` in the existing `CourseModule` shape.
 */
export const courseModules: CourseModule[] = assembledCourseModules;

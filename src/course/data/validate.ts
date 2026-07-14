import { semanticIconIds } from "../../components/icons/Icon";
import { resolveLabSelection } from "../../content/selection";
import { classifyNaturalness } from "../../lab/engine/naturalness";
import { LESSON_SECTION_IDS } from "../../routing/lessonSections";
import { PHASE_IDS } from "./types";
import type { CourseModule, StaticExample } from "./types";

export interface PrerequisiteNode {
  id: string;
  prerequisiteIds: string[];
}

/**
 * Independent DFS-based cycle detector over a prerequisite graph. Kept
 * separate from validateCourse's "prerequisites point to a strictly earlier
 * module order" check so the two checks act as defense in depth: a mistake
 * in one cannot silently defeat the other (Task 3 §A.6).
 */
export function findPrerequisiteCycle(
  nodes: PrerequisiteNode[],
): string[] | null {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];

  function visit(id: string): string[] | null {
    if (state.get(id) === "done") return null;
    if (state.get(id) === "visiting") {
      const cycleStart = stack.indexOf(id);
      return [...stack.slice(cycleStart), id];
    }
    state.set(id, "visiting");
    stack.push(id);
    const node = byId.get(id);
    if (node) {
      for (const prerequisiteId of node.prerequisiteIds) {
        const cycle = visit(prerequisiteId);
        if (cycle) return cycle;
      }
    }
    stack.pop();
    state.set(id, "done");
    return null;
  }

  for (const node of nodes) {
    const cycle = visit(node.id);
    if (cycle) return cycle;
  }
  return null;
}

const SEMANTIC_ICON_ID_SET = new Set<string>(semanticIconIds);
const PHASE_ID_SET = new Set<string>(PHASE_IDS);

function hasValidEstimate(minutes: number): boolean {
  return Number.isFinite(minutes) && minutes > 0;
}

export function validateCourse(
  modules: CourseModule[],
  examples: Record<string, StaticExample>,
): string[] {
  const errors: string[] = [];
  const moduleIds = new Set<string>();
  const lessonIds = new Set<string>();
  const orderByModuleId = new Map(
    modules.map((courseModule) => [courseModule.id, courseModule.order]),
  );

  modules.forEach((courseModule, moduleIndex) => {
    if (moduleIds.has(courseModule.id)) {
      errors.push(`duplicate module:${courseModule.id}`);
    }
    moduleIds.add(courseModule.id);

    if (!PHASE_ID_SET.has(courseModule.phase)) {
      errors.push(`invalid phase:${courseModule.id}:${courseModule.phase}`);
    }

    if (courseModule.order !== moduleIndex + 1) {
      errors.push(`module order:${courseModule.id}`);
    }

    if (!hasValidEstimate(courseModule.estimatedMinutes)) {
      errors.push(`invalid module estimate:${courseModule.id}`);
    }

    if (!SEMANTIC_ICON_ID_SET.has(courseModule.iconId)) {
      errors.push(`invalid icon:${courseModule.id}:${courseModule.iconId}`);
    }

    if (courseModule.lessons.length === 0) {
      errors.push(`empty module:${courseModule.id}`);
    }

    for (const prerequisiteId of courseModule.prerequisiteIds) {
      const prerequisiteOrder = orderByModuleId.get(prerequisiteId);
      if (prerequisiteOrder === undefined) {
        errors.push(
          `unknown prerequisite:${courseModule.id}:${prerequisiteId}`,
        );
      } else if (prerequisiteOrder >= courseModule.order) {
        errors.push(`late prerequisite:${courseModule.id}:${prerequisiteId}`);
      }
    }

    let lessonEstimateTotal = 0;
    courseModule.lessons.forEach((lesson, lessonIndex) => {
      lessonEstimateTotal += lesson.estimatedMinutes;

      if (lesson.moduleId !== courseModule.id) {
        errors.push(`wrong module:${lesson.id}`);
      }
      if (lessonIds.has(lesson.id)) {
        errors.push(`duplicate lesson:${lesson.id}`);
      }
      lessonIds.add(lesson.id);

      if (lesson.order !== lessonIndex + 1) {
        errors.push(`lesson order:${lesson.id}`);
      }

      if (!hasValidEstimate(lesson.estimatedMinutes)) {
        errors.push(`invalid lesson estimate:${lesson.id}`);
      }

      const sectionIds = lesson.sections.map((section) => section.id);
      const sectionsValid =
        sectionIds.length === LESSON_SECTION_IDS.length &&
        sectionIds.every((id, index) => id === LESSON_SECTION_IDS[index]);
      if (!sectionsValid) {
        errors.push(`invalid sections:${lesson.id}`);
      }

      for (const section of lesson.sections) {
        for (const block of section.blocks) {
          if ("exampleIds" in block) {
            for (const id of block.exampleIds) {
              if (!examples[id]) errors.push(`unknown example:${lesson.id}:${id}`);
            }
          }
          if (block.type === "guidedTool" && block.target === "lab") {
            if (!block.preset) {
              errors.push(`missing preset:${lesson.id}`);
              continue;
            }
            try {
              resolveLabSelection(block.preset);
              const naturalness = classifyNaturalness(
                block.preset.form,
                block.preset.timeId,
              );
              if (naturalness !== "natural") {
                errors.push(`non-natural preset:${lesson.id}:${naturalness}`);
              }
            } catch (error) {
              const reason =
                error instanceof Error
                  ? error.message
                  : "unknown selection error";
              errors.push(`invalid preset:${lesson.id}:${reason}`);
            }
          }
        }
      }
    });

    if (
      hasValidEstimate(courseModule.estimatedMinutes) &&
      courseModule.estimatedMinutes !== lessonEstimateTotal
    ) {
      errors.push(`module estimate mismatch:${courseModule.id}`);
    }
  });

  const cycle = findPrerequisiteCycle(
    modules.map((courseModule) => ({
      id: courseModule.id,
      prerequisiteIds: courseModule.prerequisiteIds,
    })),
  );
  if (cycle) {
    errors.push(`prerequisite cycle:${cycle.join("->")}`);
  }

  for (const example of Object.values(examples)) {
    if (!example.segments) continue;
    if (example.segments.map((segment) => segment.jp).join("") !== example.jp) {
      errors.push(`example jp segments:${example.id}`);
    }
    if (
      example.segments.map((segment) => segment.romaji).join("") !==
      example.romaji
    ) {
      errors.push(`example romaji segments:${example.id}`);
    }
  }

  return errors;
}

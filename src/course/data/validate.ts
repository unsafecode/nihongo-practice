import { semanticIconIds } from "../../components/icons/Icon";
import type { LabSelection } from "../../content/types";
import { classifyNaturalness } from "../../lab/engine/naturalness";
import { buildJapaneseSentence } from "../../lab/engine/japanese";
import { LESSON_SECTION_IDS } from "../../routing/lessonSections";
import { lessonPath } from "../../routing/routePaths";
import { createRouteTarget } from "../../routing/routeTarget";
import { PHASE_IDS } from "./types";
import type {
  AuthoredSelection,
  CourseModule,
  ExampleSegment,
  GuidedExploration,
  RouteReturnTarget,
  StaticExample,
  TransformComparisonData,
} from "./types";

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

function segmentId(segment: ExampleSegment, index: number): string {
  return segment.id ?? String(index);
}

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

/**
 * Pure integrity check for one lesson comparison (design spec §6.3). Proves
 * the declared before/after delta is honest so the renderer can mark exactly
 * the changed segments and nothing else. Never throws; returns stable error
 * codes. Rejects: identical endpoints (same id or same text), a
 * missing/unsegmented endpoint, an empty gear or segment declaration, an
 * unknown or duplicated changed-segment id, marking a segment that is
 * unchanged between the two endpoints, and any mismatch between the declared
 * changed gears and the glyphs actually carried by the declared segments.
 */
export function validateComparison(
  comparison: TransformComparisonData,
  examples: Record<string, StaticExample>,
): string[] {
  const errors: string[] = [];
  const {
    id,
    baseExampleId,
    changedExampleId,
    changedGearIds,
    changedSegmentIds,
  } = comparison;

  if (baseExampleId === changedExampleId) {
    errors.push(`comparison-same-endpoints:${id}`);
  }
  const base = examples[baseExampleId];
  const changed = examples[changedExampleId];
  if (!base) errors.push(`comparison-unknown-example:${id}:${baseExampleId}`);
  if (!changed) {
    errors.push(`comparison-unknown-example:${id}:${changedExampleId}`);
  }
  if (changedGearIds.length === 0) errors.push(`comparison-empty-gears:${id}`);
  if (changedSegmentIds.length === 0) {
    errors.push(`comparison-empty-segments:${id}`);
  }
  if (!base || !changed) return errors;

  if (base.jp === changed.jp) errors.push(`comparison-identical-text:${id}`);

  if (!base.segments || !changed.segments) {
    errors.push(`comparison-unsegmented:${id}`);
    return errors;
  }

  const changedById = new Map<string, ExampleSegment>();
  changed.segments.forEach((segment, index) => {
    changedById.set(segmentId(segment, index), segment);
  });
  const baseTrimmed = new Set(
    base.segments.map((segment) => segment.jp.trim()),
  );
  const introduced = new Set(
    changed.segments
      .map((segment) => segment.jp.trim())
      .filter((jp) => !baseTrimmed.has(jp)),
  );

  const seenSegmentIds = new Set<string>();
  const declaredGears = new Set<string>();
  for (const declaredId of changedSegmentIds) {
    if (seenSegmentIds.has(declaredId)) {
      errors.push(`comparison-duplicate-segment:${id}:${declaredId}`);
      continue;
    }
    seenSegmentIds.add(declaredId);
    const segment = changedById.get(declaredId);
    if (!segment) {
      errors.push(`comparison-unknown-segment:${id}:${declaredId}`);
      continue;
    }
    const trimmed = segment.jp.trim();
    if (!introduced.has(trimmed)) {
      errors.push(`comparison-segment-not-changed:${id}:${declaredId}`);
      continue;
    }
    declaredGears.add(trimmed);
  }

  if (!setsEqual(new Set(changedGearIds), declaredGears)) {
    errors.push(`comparison-gear-segment-mismatch:${id}`);
  }

  return errors;
}

/** The minimal lesson identity `validateExploration` needs. */
export interface ExplorationLesson {
  readonly id: string;
  readonly moduleId: string;
  readonly objectiveCopyIds: readonly string[];
}

function isLabSelection(
  selection: LabSelection | AuthoredSelection,
): selection is LabSelection {
  return !("exampleId" in selection);
}

function returnTargetValid(
  target: RouteReturnTarget,
  lesson: ExplorationLesson,
): boolean {
  if (target.pathname !== lessonPath(lesson.moduleId, lesson.id)) return false;
  if (target.sectionId !== "explore") return false;
  return createRouteTarget({
    pathname: target.pathname,
    sectionId: target.sectionId,
  }).valid;
}

interface EndpointModel {
  readonly gears: Set<string>;
  readonly signature: string;
}

function authoredEndpoint(
  selection: AuthoredSelection,
  examples: Record<string, StaticExample>,
  id: string,
  errors: string[],
): EndpointModel | null {
  const example = examples[selection.exampleId];
  if (!example) {
    errors.push(`exploration-unknown-example:${id}:${selection.exampleId}`);
    return null;
  }
  if (!example.segments) {
    errors.push(`exploration-unsegmented:${id}:${selection.exampleId}`);
    return null;
  }
  const knownIds = new Set(
    example.segments.map((segment, index) => segmentId(segment, index)),
  );
  for (const declaredId of selection.segmentIds) {
    if (!knownIds.has(declaredId)) {
      errors.push(`exploration-unknown-segment:${id}:${declaredId}`);
    }
  }
  return {
    gears: new Set(example.segments.map((segment) => segment.jp.trim())),
    signature: example.jp,
  };
}

function labEndpoint(
  selection: LabSelection,
  id: string,
  which: "initial" | "target",
  errors: string[],
): EndpointModel | null {
  let model;
  try {
    model = buildJapaneseSentence(selection);
  } catch {
    errors.push(`exploration-invalid-lab:${id}:${which}`);
    return null;
  }
  if (classifyNaturalness(selection.form, selection.timeId) !== "natural") {
    errors.push(`exploration-non-natural:${id}:${which}`);
  }
  const gears = new Set<string>();
  for (const part of model.parts) {
    const particle = part.particle?.jp?.trim();
    const suffix = part.suffix?.jp?.trim();
    if (particle) gears.add(particle);
    if (suffix) gears.add(suffix);
  }
  return { gears, signature: model.sentence.jp };
}

function endpointModel(
  selection: LabSelection | AuthoredSelection,
  which: "initial" | "target",
  examples: Record<string, StaticExample>,
  id: string,
  errors: string[],
): EndpointModel | null {
  return isLabSelection(selection)
    ? labEndpoint(selection, id, which, errors)
    : authoredEndpoint(selection, examples, id, errors);
}

function symmetricDifference(
  a: ReadonlySet<string>,
  b: ReadonlySet<string>,
): Set<string> {
  const result = new Set<string>();
  for (const value of a) if (!b.has(value)) result.add(value);
  for (const value of b) if (!a.has(value)) result.add(value);
  return result;
}

/**
 * Pure integrity check for one lesson's guided exploration (design spec §6.4).
 * Guarantees the exploration is honest: it targets a declared objective of the
 * lesson, its return target is exactly this lesson's explore anchor, and — for
 * transformations — that the two endpoints genuinely differ and the declared
 * changed gears exactly equal the endpoint gear delta (reusing the live
 * Japanese engine for Lab endpoints so grammar is never duplicated). Never
 * throws; returns stable error codes.
 */
export function validateExploration(
  exploration: GuidedExploration,
  lesson: ExplorationLesson,
  examples: Record<string, StaticExample>,
): string[] {
  const errors: string[] = [];
  const { id, objectiveId, returnTarget } = exploration.data;

  if (!lesson.objectiveCopyIds.includes(objectiveId)) {
    errors.push(`exploration-unknown-objective:${id}:${objectiveId}`);
  }
  if (!returnTargetValid(returnTarget, lesson)) {
    errors.push(`exploration-bad-return:${id}`);
  }

  if (exploration.kind === "tool") {
    return errors;
  }

  const { initialSelection, targetSelection, changedGearIds } = exploration.data;
  if (changedGearIds.length === 0) {
    errors.push(`exploration-empty-gears:${id}`);
  }

  const initial = endpointModel(
    initialSelection,
    "initial",
    examples,
    id,
    errors,
  );
  const target = endpointModel(targetSelection, "target", examples, id, errors);
  if (!initial || !target) return errors;

  if (initial.signature === target.signature) {
    errors.push(`exploration-identical-endpoints:${id}`);
  }

  const delta = symmetricDifference(initial.gears, target.gears);
  if (!setsEqual(new Set(changedGearIds), delta)) {
    errors.push(`exploration-gear-diff-mismatch:${id}`);
  }

  return errors;
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

      // Only validate typed section content once the section shape/order is
      // trusted, so a deliberately malformed-order fixture reports
      // `invalid sections` without crashing on a missing typed field.
      if (sectionsValid) {
        const [, comparisonSection, exploreSection] = lesson.sections;
        errors.push(
          ...validateComparison(comparisonSection.comparison, examples),
        );
        errors.push(
          ...validateExploration(exploreSection.exploration, lesson, examples),
        );
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

import { semanticIconIds } from "../../components/icons/Icon";
import type { LabSelection } from "../../content/types";
import { classifyNaturalness } from "../../lab/engine/naturalness";
import { buildJapaneseSentence } from "../../lab/engine/japanese";
import { formatRomaji } from "../../romaji/formatRomaji";
import type { AssembledToken } from "../../romaji/types";
import { LESSON_SECTION_IDS } from "../../routing/lessonSections";
import { lessonPath } from "../../routing/routePaths";
import { createRouteTarget } from "../../routing/routeTarget";
import { PHASE_IDS, COURSE_CONCEPT_IDS, CONCEPT_GEARS } from "./types";
import { loanwords } from "./loanwords";
import type { Loanword } from "./loanwords";
import type {
  AuthoredSelection,
  CourseConceptId,
  CourseModule,
  ExampleSegment,
  GuidedExploration,
  GuidedTransformationData,
  PhaseId,
  RouteReturnTarget,
  StaticExample,
  TransformComparisonData,
} from "./types";

export interface PrerequisiteNode {
  id: string;
  prerequisiteIds: string[];
}

function exampleTokens(segments: readonly ExampleSegment[]): AssembledToken[] {
  return segments.map((segment) => ({
    id: segment.id ?? "",
    jp: segment.jp,
    romaji: segment.romaji,
    kind: segment.tokenKind,
    boundaryBefore: segment.boundaryBefore,
    source: segment.source,
    ...(segment.reading ? { reading: segment.reading } : {}),
  }));
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
const CONCEPT_ID_SET = new Set<string>(COURSE_CONCEPT_IDS);

/** The minimal lesson identity `validateConceptOrder` needs. */
export interface ConceptLesson {
  readonly id: string;
  readonly introducedConceptIds: readonly CourseConceptId[];
  readonly requiredConceptIds: readonly CourseConceptId[];
}

/** The minimal module identity `validateConceptOrder` needs. */
export interface ConceptModule {
  readonly id: string;
  readonly order: number;
  readonly phase: PhaseId;
  readonly lessons: readonly ConceptLesson[];
}

/**
 * Pure prerequisite-contract check over the whole course (design spec
 * §2.6/§6.5, Task A). Walking modules in `order` and lessons in array order,
 * it proves: no unknown concept id is used; no concept is introduced by two
 * lessons; every `requiredConceptId` is introduced by an earlier lesson, an
 * earlier lesson of the same module, or the same lesson before use (never
 * later, never absent); and a synthesize-phase (capstone) lesson introduces no
 * foundational grammar — it may only recombine earlier gears. Never throws;
 * returns stable string error codes.
 */
export function validateConceptOrder(modules: readonly ConceptModule[]): string[] {
  const errors: string[] = [];
  const ordered = [...modules].sort((a, b) => a.order - b.order);

  // First pass: assign each lesson a monotonic course position and record the
  // earliest position that introduces each concept (rejecting duplicates and
  // unknown ids as we go).
  const introducedAt = new Map<string, number>();
  const lessonPositions: { lesson: ConceptLesson; position: number }[] = [];
  let position = 0;
  for (const courseModule of ordered) {
    for (const lesson of courseModule.lessons) {
      const pos = position++;
      lessonPositions.push({ lesson, position: pos });
      for (const conceptId of lesson.introducedConceptIds) {
        if (!CONCEPT_ID_SET.has(conceptId)) {
          errors.push(`concept-unknown:${lesson.id}:${conceptId}`);
          continue;
        }
        if (introducedAt.has(conceptId)) {
          errors.push(`concept-duplicate-introduced:${conceptId}:${lesson.id}`);
          continue;
        }
        introducedAt.set(conceptId, pos);
      }
      if (courseModule.phase === "synthesize") {
        for (const conceptId of lesson.introducedConceptIds) {
          errors.push(`concept-capstone-introduces:${lesson.id}:${conceptId}`);
        }
      }
    }
  }

  // Second pass: every required concept must be known and introduced no later
  // than the lesson that requires it.
  for (const { lesson, position: pos } of lessonPositions) {
    for (const conceptId of lesson.requiredConceptIds) {
      if (!CONCEPT_ID_SET.has(conceptId)) {
        errors.push(`concept-unknown:${lesson.id}:${conceptId}`);
        continue;
      }
      const introPos = introducedAt.get(conceptId);
      if (introPos === undefined || introPos > pos) {
        errors.push(
          `concept-required-before-introduced:${lesson.id}:${conceptId}`,
        );
      }
    }
  }

  return errors;
}

/**
 * Ordered, de-duplicated list of the static examples the course actually
 * shows on screen, in course order (module order, then lesson order): each
 * lesson's comparison endpoints followed by its authored guided-transformation
 * endpoints. Lab guided-transformation endpoints are intentionally excluded —
 * the Lab renders hiragana-first and never carries authored katakana spelling,
 * so it is not a loanword "first exposure" surface. First occurrence wins,
 * which is exactly what the loanword first-exposure contract needs.
 */
export function referencedExampleOrder(
  modules: readonly CourseModule[],
): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  const push = (exampleId: string) => {
    if (seen.has(exampleId)) return;
    seen.add(exampleId);
    ordered.push(exampleId);
  };
  const sortedModules = [...modules].sort((a, b) => a.order - b.order);
  for (const courseModule of sortedModules) {
    const sortedLessons = [...courseModule.lessons].sort(
      (a, b) => a.order - b.order,
    );
    for (const lesson of sortedLessons) {
      // Defensive against deliberately malformed synthetic fixtures: a lesson
      // whose sections are missing or reordered is separately reported by
      // validateCourse as `invalid sections`, so here we simply skip any
      // section that does not carry the typed field we expect rather than
      // assume the tuple shape and crash.
      for (const section of lesson.sections) {
        if (section.id === "comparison" && "comparison" in section) {
          push(section.comparison.baseExampleId);
          push(section.comparison.changedExampleId);
        }
        if (
          section.id === "explore" &&
          "exploration" in section &&
          section.exploration.kind === "transformation"
        ) {
          for (const selection of [
            section.exploration.data.initialSelection,
            section.exploration.data.targetSelection,
          ]) {
            if ("exampleId" in selection) push(selection.exampleId);
          }
        }
        // A journey exploration shows each scene's two endpoints on screen, so
        // they are learner-visible references too (Task 6 capstone §6.6).
        if (
          section.id === "explore" &&
          "exploration" in section &&
          section.exploration.kind === "journey"
        ) {
          for (const scene of section.exploration.data.scenes) {
            for (const selection of [
              scene.transformation.initialSelection,
              scene.transformation.targetSelection,
            ]) {
              if ("exampleId" in selection) push(selection.exampleId);
            }
          }
        }
      }
    }
  }
  return ordered;
}

/**
 * Katakana-first loanword contract (design spec §8.3, Task C). Given the
 * examples shown on screen in course order, proves that every registered
 * loanword the course actually uses first appears in its standard katakana
 * spelling *with* a hiragana reading — the honest way to introduce a loanword
 * while keeping the course hiragana-first for reading support. Never throws;
 * returns stable error codes. Rejects: a hiragana-only first exposure (kana
 * pretending to be the standard spelling), a katakana first exposure missing
 * or mismatching its hiragana reading, and a first exposure whose visible form
 * is neither the standard katakana nor the plain hiragana reading (an
 * incorrect standard form). Loanwords the course never references are ignored,
 * and any later hiragana reuse is the sanctioned reading support.
 */
export function validateLoanwordExposure(
  orderedExampleIds: readonly string[],
  examples: Record<string, StaticExample>,
  registry: Record<string, Loanword>,
): string[] {
  const errors: string[] = [];
  for (const loanword of Object.values(registry)) {
    let firstExposure: { exampleId: string; segment: ExampleSegment } | null =
      null;
    for (const exampleId of orderedExampleIds) {
      const example = examples[exampleId];
      if (!example?.segments) continue;
      const segment = example.segments.find(
        (candidate) =>
          candidate.jp.trim() === loanword.katakana ||
          candidate.jp.trim() === loanword.hiragana ||
          candidate.reading === loanword.hiragana,
      );
      if (segment) {
        firstExposure = { exampleId, segment };
        break;
      }
    }
    if (!firstExposure) continue;

    const { exampleId, segment } = firstExposure;
    const visible = segment.jp.trim();
    if (visible === loanword.katakana) {
      if (segment.reading !== loanword.hiragana) {
        errors.push(`loanword-missing-reading:${loanword.id}:${exampleId}`);
      }
    } else if (visible === loanword.hiragana) {
      errors.push(`loanword-hiragana-first:${loanword.id}:${exampleId}`);
    } else {
      errors.push(`loanword-wrong-standard:${loanword.id}:${exampleId}`);
    }
  }
  return errors;
}

/**
 * Post-exposure loanword usage contract (design spec §8.3, Task C — Task 6
 * hardening). Stricter than {@link validateLoanwordExposure}: it walks *every*
 * learner-visible occurrence of a registered loanword (not just the first) and
 * proves the primary Japanese spelling is always the standard katakana. Any
 * later bare-hiragana occurrence — kana pretending to be the word rather than
 * reading support — is rejected, and every katakana occurrence must keep its
 * explicit hiragana `reading`. Hiragana that appears only in a segment's
 * `reading` field is the sanctioned reading support and is allowed. Words the
 * course never references, and non-loanword segments, are ignored. Never
 * throws; returns stable error codes keyed by loanword id + example id.
 */
export function validateLoanwordUsage(
  orderedExampleIds: readonly string[],
  examples: Record<string, StaticExample>,
  registry: Record<string, Loanword>,
): string[] {
  const errors: string[] = [];
  const byHiragana = new Map<string, Loanword>();
  const byKatakana = new Map<string, Loanword>();
  for (const loanword of Object.values(registry)) {
    byHiragana.set(loanword.hiragana, loanword);
    byKatakana.set(loanword.katakana, loanword);
  }
  for (const exampleId of orderedExampleIds) {
    const example = examples[exampleId];
    if (!example?.segments) continue;
    for (const segment of example.segments) {
      const visible = segment.jp.trim();
      const asHiragana = byHiragana.get(visible);
      if (asHiragana) {
        errors.push(`loanword-hiragana-primary:${asHiragana.id}:${exampleId}`);
        continue;
      }
      const asKatakana = byKatakana.get(visible);
      if (asKatakana && segment.reading?.trim() !== asKatakana.hiragana) {
        errors.push(`loanword-missing-reading:${asKatakana.id}:${exampleId}`);
      }
    }
  }
  return errors;
}

function segmentId(segment: ExampleSegment, index: number): string {
  return segment.id ?? String(index);
}

/**
 * Every occurrence-based check below (`changedById`, `introducedSegmentIds`,
 * `matchedIntroducedIds`) is keyed by `segmentId(segment, index)` and stored
 * in a Map/Set, so two segments that resolve to the same effective id within
 * one endpoint silently collapse into one entry — whichever the Map/Set
 * happens to keep. That collision is reachable from real authored data: `id`
 * is optional (falls back to the segment's index), so an explicit id can
 * collide with another segment's fallback index id, not just with another
 * explicit id. Returns each colliding effective id once, in first-duplicate
 * order, so callers can reject the ambiguity explicitly instead of letting
 * it silently corrupt every id-keyed check that follows.
 */
function findDuplicateEffectiveSegmentIds(
  segments: readonly ExampleSegment[],
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  segments.forEach((segment, index) => {
    const effectiveId = segmentId(segment, index);
    if (seen.has(effectiveId)) {
      duplicates.add(effectiveId);
    } else {
      seen.add(effectiveId);
    }
  });
  return [...duplicates];
}

function hasValidEstimate(minutes: number): boolean {
  return Number.isFinite(minutes) && minutes > 0;
}

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

/**
 * Pure integrity check for one lesson comparison (design spec §6.3). Proves
 * the declared before/after delta is honest so the renderer can mark exactly
 * the changed segments and nothing else. Never throws; returns stable error
 * codes. Rejects: identical endpoints (same id or same text), a
 * missing/unsegmented endpoint, an empty gear or segment declaration, a
 * duplicate effective segment id authored within either endpoint (which
 * would otherwise collapse two distinct segments into one entry in every
 * id-keyed check below), an unknown or duplicated changed-segment id,
 * marking a segment that is unchanged between the two endpoints, any
 * mismatch between the declared changed gears and the glyphs actually
 * carried by the declared segments, and — via occurrence/segment-id-based
 * completeness against the full set of introduced segment ids (not a
 * distinct-introduced-text set, which would collapse two distinct new
 * segments sharing identical text into one member) — a comparison that
 * under-declares its delta by omitting a genuinely introduced segment
 * occurrence from `changedSegmentIds`.
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

  // Reject duplicate effective segment ids within each endpoint before any
  // id-keyed Map/Set is built below: a collision there would silently drop
  // one of the colliding segments from every subsequent check, which could
  // itself manufacture misleading completeness/gear errors that merely
  // reflect the collision rather than a real authoring mistake. Base and
  // changed are each their own id namespace, so they're checked separately.
  const baseDuplicateIds = findDuplicateEffectiveSegmentIds(base.segments);
  const changedDuplicateIds = findDuplicateEffectiveSegmentIds(changed.segments);
  for (const dupId of baseDuplicateIds) {
    errors.push(`comparison-duplicate-authored-segment-id:${id}:base:${dupId}`);
  }
  for (const dupId of changedDuplicateIds) {
    errors.push(`comparison-duplicate-authored-segment-id:${id}:changed:${dupId}`);
  }
  if (baseDuplicateIds.length > 0 || changedDuplicateIds.length > 0) {
    return errors;
  }

  const changedById = new Map<string, ExampleSegment>();
  changed.segments.forEach((segment, index) => {
    changedById.set(segmentId(segment, index), segment);
  });

  // Occurrence-based (not distinct-text-based) introduced-segment detection:
  // walk base's trimmed texts into a multiset of remaining counts, then walk
  // changed's segments in order, consuming one matching base occurrence per
  // changed segment when available. Any changed segment whose text has no
  // remaining base occurrence to consume is a genuinely introduced segment,
  // identified by its own id. This correctly distinguishes two distinct
  // introduced ids that happen to share identical text (each is its own
  // unmatched occurrence) from an added *second* occurrence of text that
  // already existed once in base (the first occurrence still consumes the
  // base match; only the added one is introduced).
  const remainingBaseCounts = new Map<string, number>();
  for (const segment of base.segments) {
    const trimmed = segment.jp.trim();
    remainingBaseCounts.set(trimmed, (remainingBaseCounts.get(trimmed) ?? 0) + 1);
  }
  const introducedSegmentIds = new Set<string>();
  changed.segments.forEach((segment, index) => {
    const trimmed = segment.jp.trim();
    const remaining = remainingBaseCounts.get(trimmed) ?? 0;
    if (remaining > 0) {
      remainingBaseCounts.set(trimmed, remaining - 1);
      return;
    }
    introducedSegmentIds.add(segmentId(segment, index));
  });

  const seenSegmentIds = new Set<string>();
  // Text-keyed set purely for changedGearIds consistency: gear labels are
  // intentionally unique values, so collapsing declared introduced segments
  // to their text here is correct and unrelated to completeness below.
  const declaredGears = new Set<string>();
  const matchedIntroducedIds = new Set<string>();
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
    if (!introducedSegmentIds.has(declaredId)) {
      errors.push(`comparison-segment-not-changed:${id}:${declaredId}`);
      continue;
    }
    declaredGears.add(segment.jp.trim());
    matchedIntroducedIds.add(declaredId);
  }

  if (!setsEqual(new Set(changedGearIds), declaredGears)) {
    errors.push(`comparison-gear-segment-mismatch:${id}`);
  }

  // Completeness is occurrence/segment-id based: matchedIntroducedIds is
  // always a subset of introducedSegmentIds (only declared ids that resolve
  // to a genuinely introduced occurrence are added above), so a size
  // mismatch means some introduced occurrence was never declared — an
  // honest but under-declared delta. One stable code regardless of how many
  // occurrences are missing, so pre-existing unknown/duplicate/not-changed
  // errors above don't also spam this check.
  if (matchedIntroducedIds.size !== introducedSegmentIds.size) {
    errors.push(`comparison-incomplete-delta:${id}`);
  }

  return errors;
}

/** The minimal lesson identity `validateExploration` needs. */
export interface ExplorationLesson {
  readonly id: string;
  readonly moduleId: string;
  readonly objectiveCopyIds: readonly string[];
  /**
   * The lesson's declared objective grammar (design spec §6.4, Task D). A
   * guided transformation's changed-gear delta must intersect the gears these
   * concepts map to. Introduced concepts are the objective; a capstone that
   * introduces nothing falls back to its required concepts (the gears it
   * recombines). Optional so lightweight synthetic fixtures can omit it — an
   * empty objective simply skips the intersection check.
   */
  readonly introducedConceptIds?: readonly CourseConceptId[];
  readonly requiredConceptIds?: readonly CourseConceptId[];
}

/**
 * The grammar gears a lesson's objective targets: the union of `CONCEPT_GEARS`
 * over its introduced concepts, or — when it introduces nothing (the capstone)
 * — over its required concepts.
 */
function objectiveGears(lesson: ExplorationLesson): Set<string> {
  const conceptIds =
    (lesson.introducedConceptIds && lesson.introducedConceptIds.length > 0
      ? lesson.introducedConceptIds
      : lesson.requiredConceptIds) ?? [];
  const gears = new Set<string>();
  for (const conceptId of conceptIds) {
    for (const gear of CONCEPT_GEARS[conceptId] ?? []) gears.add(gear);
  }
  return gears;
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
/**
 * Core integrity check for a single honest transformation (one initial/target
 * pair). Shared by both a lesson's single guided transformation and each scene
 * of a capstone journey, so a journey scene is validated with the exact same
 * engine semantics as a standalone transformation — it can never render an
 * interaction it does not prove. Pushes stable error codes keyed by `data.id`;
 * never throws. `objective` is the lesson's objective-gear set (empty skips the
 * alignment check for lightweight fixtures).
 */
function validateTransformationCore(
  data: GuidedTransformationData,
  examples: Record<string, StaticExample>,
  objective: ReadonlySet<string>,
  errors: string[],
): void {
  const { id, initialSelection, targetSelection, changedGearIds } = data;
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
  if (!initial || !target) return;

  if (initial.signature === target.signature) {
    errors.push(`exploration-identical-endpoints:${id}`);
  }

  const delta = symmetricDifference(initial.gears, target.gears);
  if (!setsEqual(new Set(changedGearIds), delta)) {
    errors.push(`exploration-gear-diff-mismatch:${id}`);
  }

  // Alignment (Task D): the changed gears must genuinely touch the lesson's
  // declared objective grammar, so a matching objectiveId string alone can't
  // certify an exploration that only shuffles an unrelated word.
  if (objective.size > 0 && ![...delta].some((gear) => objective.has(gear))) {
    errors.push(`exploration-objective-gear-miss:${id}`);
  }
}

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

  const objective = objectiveGears(lesson);

  // A journey is an ordered sequence of honest transformation scenes that
  // together recombine several prior families across one coherent scenario
  // (Task 6 capstone §6.6). Each scene is validated exactly like a single
  // transformation; a journey with no scenes proves nothing.
  if (exploration.kind === "journey") {
    if (exploration.data.scenes.length === 0) {
      errors.push(`exploration-empty-journey:${id}`);
    }
    for (const scene of exploration.data.scenes) {
      validateTransformationCore(
        scene.transformation,
        examples,
        objective,
        errors,
      );
    }
    return errors;
  }

  validateTransformationCore(exploration.data, examples, objective, errors);
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

  errors.push(...validateConceptOrder(modules));

  errors.push(
    ...validateLoanwordExposure(
      referencedExampleOrder(modules),
      examples,
      loanwords,
    ),
  );

  errors.push(
    ...validateLoanwordUsage(
      referencedExampleOrder(modules),
      examples,
      loanwords,
    ),
  );

  for (const example of Object.values(examples)) {
    if (!example.segments) continue;
    if (example.segments.map((segment) => segment.jp).join("") !== example.jp) {
      errors.push(`example jp segments:${example.id}`);
    }
    if (
      example.segments.some(
        (segment) =>
          !segment.tokenKind ||
          !segment.boundaryBefore ||
          !segment.source?.referenceId,
      )
    ) {
      errors.push(`example romaji segments:${example.id}`);
      continue;
    }
    const formatted = formatRomaji(exampleTokens(example.segments));
    if (!formatted.ok || formatted.text !== example.romaji) {
      errors.push(`example romaji segments:${example.id}`);
    }
  }

  return errors;
}

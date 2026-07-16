import type { SemanticIconId } from "../../components/icons/Icon";
import { lessonPath } from "../../routing/routePaths";
import type { SyllabaryGroupId } from "../../syllabary/groups";
import { DAKUTEN, GOJUON, YOON } from "../../syllabary/kana";
import type {
  BlockCopy,
  CourseCopy,
  ExampleCopy,
} from "../i18n/types";
import { curriculumFoundation } from "../curriculum/foundation";
import type {
  ContrastDimension,
  CourseModule,
  ExampleSegment,
  GuidedExploration,
  Lesson,
  LessonSections,
  StaticExample,
} from "../data/types";
import { assembledCurriculum } from "./curriculum";
import { lessonPlans } from "./curriculum";
import { curriculumExamples } from "./examples";
import type { CurriculumExampleEntry } from "./examples";
import type { AssembledCurriculumCatalogs } from "./types";
import { validateCurriculum } from "./validateCurriculum";

/**
 * Pure catalog→runtime course adapter (design spec §5, §9, §13; Slice B plan
 * Task 4). It converts the validated locale-independent catalogs into the
 * existing `CourseModule` runtime shape so every route, component, and progress
 * contract stays stable, while the Japanese source of truth lives once in the
 * example catalog and localized prose lives once in the copy catalogs.
 *
 * The adapter never authors new Japanese: comparison and guided-construction
 * sections are derived from the shared example segments, romaji is derived from
 * the shared kana reading (spec §7), and coverage metadata is the machine
 * computed value. It fails closed — if `validateCurriculum` rejects the catalogs
 * with the release targets enforced, assembly throws a deterministic
 * `CourseAssemblyError` carrying the structured codes rather than exporting any
 * partial or fallback content (spec §16, §9.3).
 */

/** Thrown when the catalogs fail release validation; carries the error codes. */
export class CourseAssemblyError extends Error {
  readonly codes: readonly string[];
  constructor(codes: readonly string[]) {
    super(`course assembly rejected: ${[...codes].sort().join(", ")}`);
    this.name = "CourseAssemblyError";
    this.codes = [...codes].sort();
  }
}

// ── Romaji derivation (spec §7: romaji uses the shared kana reading) ──────────

const KANA_ROMAJI = new Map<string, string>();
for (const row of [...GOJUON, ...DAKUTEN, ...YOON]) {
  for (const cell of row.cells) {
    if (cell) KANA_ROMAJI.set(cell.kana, cell.romaji);
  }
}
// Foreign-sound combinations used by loanword readings (e.g. パーティー → ぱーてぃー).
KANA_ROMAJI.set("てぃ", "ti");
KANA_ROMAJI.set("でぃ", "di");

const SMALL_COMBINERS = new Set(["ゃ", "ゅ", "ょ", "ぃ"]);

/**
 * Converts a hiragana reading to Hepburn-ish romaji, handling small っ
 * (gemination), the long-vowel mark ー (repeat the previous vowel), the moraic
 * ん, and yōon/foreign digraphs. Non-kana characters pass through unchanged.
 */
function kanaToRomaji(input: string): string {
  const chars = [...input];
  let out = "";
  let lastVowel = "";
  let geminate = false;
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    if (ch === "っ") {
      geminate = true;
      continue;
    }
    if (ch === "ー") {
      out += lastVowel;
      continue;
    }
    if (ch === "。") {
      out += ".";
      lastVowel = "";
      continue;
    }
    let romaji: string | undefined;
    let step = 1;
    const next = chars[i + 1];
    if (next && SMALL_COMBINERS.has(next)) {
      const digraph = KANA_ROMAJI.get(ch + next);
      if (digraph) {
        romaji = digraph;
        step = 2;
      }
    }
    if (romaji === undefined) romaji = KANA_ROMAJI.get(ch);
    if (romaji === undefined && ch === "ん") romaji = "n";
    if (romaji === undefined) {
      out += ch;
      lastVowel = "";
      continue;
    }
    if (geminate) {
      romaji = romaji.charAt(0) + romaji;
      geminate = false;
    }
    out += romaji;
    const vowel = romaji.match(/[aeiou]$/);
    lastVowel = vowel ? vowel[0] : "";
    i += step - 1;
  }
  return out;
}

/**
 * The pronounced romaji for one segment: the topic/goal particles は and へ read
 * "wa"/"e" (not the kana value), every other segment romanizes its shared kana
 * reading (katakana loanwords carry an explicit hiragana `reading`).
 */
function segmentRomaji(segment: {
  readonly jp: string;
  readonly kind: string;
  readonly reading?: string;
}): string {
  const surface = segment.jp.trim();
  if (segment.kind === "particle" && surface === "は") return "wa";
  if (segment.kind === "particle" && surface === "へ") return "e";
  return kanaToRomaji(segment.reading ?? segment.jp);
}

// ── Runtime example adapter (no duplicated Japanese) ──────────────────────────

function toRuntimeExample(entry: CurriculumExampleEntry): StaticExample {
  const segments: ExampleSegment[] = entry.segments.map((segment) => ({
    id: segment.id,
    jp: segment.jp,
    romaji: segmentRomaji(segment),
    kind: segment.kind,
    ...(segment.reading ? { reading: segment.reading } : {}),
  }));
  return {
    id: entry.id,
    jp: segments.map((segment) => segment.jp).join(""),
    romaji: segments.map((segment) => segment.romaji).join(""),
    segments,
  };
}

/** Every catalog example projected into the runtime `StaticExample` shape. */
export const assembledExamples: Record<string, StaticExample> = Object.freeze(
  Object.fromEntries(
    curriculumExamples.map((entry) => [entry.id, toRuntimeExample(entry)]),
  ),
);

const exampleById = new Map<string, CurriculumExampleEntry>(
  curriculumExamples.map((entry) => [entry.id, entry]),
);

// ── Comparison and exploration derivation from shared segments ────────────────

interface IntroducedDelta {
  readonly segmentIds: readonly string[];
  readonly gears: readonly string[];
  readonly kinds: ReadonlySet<ExampleSegment["kind"]>;
}

/**
 * The segments the `changed` example introduces relative to `base`, computed by
 * the same occurrence-diff `validateComparison` re-derives (spec §6.3): a
 * changed segment whose trimmed text has no remaining matching base occurrence
 * is genuinely introduced. Returns its stable ids, the unique changed gear
 * glyphs, and the grammatical kinds involved (used only to label the contrast).
 */
function introducedDelta(
  base: CurriculumExampleEntry,
  changed: CurriculumExampleEntry,
): IntroducedDelta {
  const remaining = new Map<string, number>();
  for (const segment of base.segments) {
    const text = segment.jp.trim();
    remaining.set(text, (remaining.get(text) ?? 0) + 1);
  }
  const segmentIds: string[] = [];
  const gears = new Set<string>();
  const kinds = new Set<ExampleSegment["kind"]>();
  for (const segment of changed.segments) {
    const text = segment.jp.trim();
    const count = remaining.get(text) ?? 0;
    if (count > 0) {
      remaining.set(text, count - 1);
      continue;
    }
    segmentIds.push(segment.id);
    gears.add(text);
    kinds.add(segment.kind);
  }
  return { segmentIds, gears: [...gears], kinds };
}

/** A cosmetic contrast dimension for the comparison delta strip (spec §6.3). */
function contrastDimension(
  moduleId: string,
  gears: readonly string[],
  kinds: ReadonlySet<ExampleSegment["kind"]>,
): ContrastDimension {
  if (moduleId === "sounds") return "sound";
  if (gears.includes("か")) return "question";
  if (gears.some((gear) => gear === "あります" || gear === "います")) {
    return "existence";
  }
  if (gears.some((gear) => gear === "ました" || gear === "ませんでした")) {
    return "time";
  }
  if (gears.some((gear) => gear === "ません")) return "polarity";
  if (gears.includes("ください")) return "request";
  if (kinds.has("particle")) return "particle";
  if (kinds.has("ending")) return "ending";
  return "word-order";
}

/** Set symmetric difference of two examples' segment-text sets (spec §6.4). */
function gearSymmetricDifference(
  a: CurriculumExampleEntry,
  b: CurriculumExampleEntry,
): string[] {
  const left = new Set(a.segments.map((segment) => segment.jp.trim()));
  const right = new Set(b.segments.map((segment) => segment.jp.trim()));
  const diff: string[] = [];
  for (const gear of left) if (!right.has(gear)) diff.push(gear);
  for (const gear of right) if (!left.has(gear)) diff.push(gear);
  return diff;
}

/**
 * Chooses the guided-construction endpoints (spec §6.4). Prefers base→spoken
 * target so the guided board demonstrates constructing the utterance the lesson
 * asks the learner to say; falls back to other example pairs so every lesson
 * yields two endpoints that genuinely differ in gears.
 */
function chooseExplorationEndpoints(
  base: CurriculumExampleEntry,
  changed: CurriculumExampleEntry,
  guided: CurriculumExampleEntry,
): { initial: CurriculumExampleEntry; target: CurriculumExampleEntry; gears: string[] } {
  const candidates: [CurriculumExampleEntry, CurriculumExampleEntry][] = [
    [base, guided],
    [base, changed],
    [changed, guided],
  ];
  for (const [initial, target] of candidates) {
    const gears = gearSymmetricDifference(initial, target);
    if (gears.length > 0 && initial.jp !== target.jp) {
      return { initial, target, gears };
    }
  }
  const gears = gearSymmetricDifference(base, guided);
  return { initial: base, target: guided, gears };
}

/**
 * The course-map "verb" count for one module's coverage badge (spec §13.3):
 * the union, deduplicated by lexeme id, of the verbs the module *introduces*
 * and the verbs its lessons *practice*. A capstone-only module introduces no
 * new verbs but still spirals many earlier verbs back into review, so the
 * union — not `introducedVerbIds` alone — is the count that actually exposes
 * that reuse on the course map instead of hiding it behind a zero.
 */
function practicedVerbLexemeCount(coverage: {
  readonly introducedVerbIds: readonly string[];
  readonly practicedVerbIds: readonly string[];
}): number {
  return new Set([...coverage.introducedVerbIds, ...coverage.practicedVerbIds])
    .size;
}

// ── Module icons (spec §13.4) ─────────────────────────────────────────────────

/** The Syllabary group the sounds/kana bridge lessons open (spec §5.2). */
const SOUNDS_SYLLABARY_GROUP: SyllabaryGroupId = "gojuon";

const MODULE_ICON: Record<string, SemanticIconId> = {
  sounds: "sounds",
  introductions: "identity",
  "essential-questions": "questions",
  actions: "ordering",
  routines: "time",
  "past-negative": "sentence",
  places: "places",
  people: "people",
  descriptions: "descriptions",
  shopping: "shopping",
  "existence-needs": "existence",
  capstones: "capstone",
};

// ── Lesson and module assembly ────────────────────────────────────────────────

interface LessonRefs {
  readonly baseExampleId: string;
  readonly changedExampleId: string;
  readonly guidedExampleId: string;
}

const lessonRefsById = new Map<string, LessonRefs>(
  lessonPlans.map((plan) => [
    plan.id,
    {
      baseExampleId: plan.baseExampleId,
      changedExampleId: plan.changedExampleId,
      guidedExampleId: plan.guidedExampleId,
    },
  ]),
);

function buildLessonSections(
  moduleId: string,
  lessonId: string,
  refs: LessonRefs,
): LessonSections {
  const base = exampleById.get(refs.baseExampleId);
  const changed = exampleById.get(refs.changedExampleId);
  const guided = exampleById.get(refs.guidedExampleId);
  if (!base || !changed || !guided) {
    throw new CourseAssemblyError([
      `missing-lesson-example:${lessonId}`,
    ]);
  }

  const delta = introducedDelta(base, changed);
  const rule = {
    id: "rule" as const,
    copyId: `${lessonId}-rule`,
    gear: delta.gears[0] ?? changed.segments[0]?.jp.trim() ?? "",
  };
  const comparison = {
    id: "comparison" as const,
    copyId: `${lessonId}-comparison`,
    comparison: {
      id: `cmp-${lessonId}`,
      baseExampleId: base.id,
      changedExampleId: changed.id,
      contrastDimension: contrastDimension(moduleId, delta.gears, delta.kinds),
      changedGearIds: delta.gears,
      changedSegmentIds: delta.segmentIds,
    },
  };

  const endpoints = chooseExplorationEndpoints(base, changed, guided);
  const returnTarget = {
    pathname: lessonPath(moduleId, lessonId),
    sectionId: "explore" as const,
  };
  // The sounds/kana bridge (Module 1) links out to the Syllabary tool rather
  // than faking an in-engine transformation of pre-grammar greetings/loanwords
  // (spec §5.2, §6.4); every other module demonstrates a genuine guided
  // construction derived from the shared example segments.
  const exploration: GuidedExploration =
    moduleId === "sounds"
      ? {
          kind: "tool",
          data: {
            id: `exp-${lessonId}`,
            objectiveId: lessonId,
            target: "syllabary",
            group: SOUNDS_SYLLABARY_GROUP,
            returnTarget,
          },
        }
      : {
          kind: "transformation",
          data: {
            id: `exp-${lessonId}`,
            objectiveId: lessonId,
            initialSelection: { exampleId: endpoints.initial.id, segmentIds: [] },
            targetSelection: { exampleId: endpoints.target.id, segmentIds: [] },
            changedGearIds: endpoints.gears,
            returnTarget,
          },
        };
  const explore = {
    id: "explore" as const,
    copyId: `${lessonId}-explore`,
    exploration,
  };
  const recap = { id: "recap" as const, copyId: `${lessonId}-recap` };
  return [rule, comparison, explore, recap];
}

function buildLesson(
  moduleId: string,
  entry: { id: string; order: number; estimatedMinutes: number },
): Lesson {
  const refs = lessonRefsById.get(entry.id);
  if (!refs) {
    throw new CourseAssemblyError([`missing-lesson-plan:${entry.id}`]);
  }
  return {
    id: entry.id,
    moduleId,
    order: entry.order,
    titleCopyId: entry.id,
    objectiveCopyIds: [entry.id],
    // The pedagogy (concept order, reuse, capstone gates) is proven on the
    // shared catalogs by validateCurriculum; the runtime concept vocabulary is
    // a distinct, narrower union, so runtime lessons carry no concept ids and
    // rely on the catalog as the single source of truth.
    introducedConceptIds: [],
    requiredConceptIds: [],
    estimatedMinutes: entry.estimatedMinutes,
    sections: buildLessonSections(moduleId, entry.id, refs),
  };
}

export interface AssembledCourseCopy {
  readonly modules: CourseCopy["modules"];
  readonly lessons: CourseCopy["lessons"];
  readonly objectives: CourseCopy["objectives"];
  readonly outcomes: CourseCopy["outcomes"];
  readonly blocks: CourseCopy["blocks"];
  readonly examples: CourseCopy["examples"];
  readonly journeyScenes: CourseCopy["journeyScenes"];
}

export interface AssembledCourse {
  readonly modules: CourseModule[];
  readonly examples: Record<string, StaticExample>;
  readonly copy: { readonly it: AssembledCourseCopy; readonly en: AssembledCourseCopy };
}

const RECAP_HEADING: Record<"it" | "en", string> = {
  it: "In sintesi",
  en: "In summary",
};

function required(
  copy: Readonly<Record<string, string>>,
  key: string,
): string {
  const value = copy[key];
  if (value === undefined) {
    throw new CourseAssemblyError([`missing-copy:${key}`]);
  }
  return value;
}

/**
 * Projects the locale-independent curriculum copy catalog into the runtime
 * `CourseCopy` dictionaries. Japanese never enters these dictionaries — only
 * localized titles, instructions, and natural translations of the shared
 * examples (spec §9.1). The recap heading is the one localized label the block
 * shape needs that the sentence-level catalog copy does not carry.
 */
function buildLocaleCopy(
  locale: "it" | "en",
  catalogs: AssembledCurriculumCatalogs,
): AssembledCourseCopy {
  const source = catalogs.copy[locale];
  const modules: Record<string, { title: string }> = {};
  const outcomes: Record<string, string> = {};
  for (const module of catalogs.modules) {
    modules[module.id] = { title: required(source, `module.${module.id}.title`) };
    outcomes[module.id] = required(source, `module.${module.id}.outcome`);
  }

  const lessons: Record<string, { title: string }> = {};
  const objectives: Record<string, string> = {};
  const blocks: Record<string, BlockCopy> = {};
  for (const lesson of catalogs.lessons) {
    const id = lesson.id;
    lessons[id] = { title: required(source, `lesson.${id}.title`) };
    objectives[id] = required(source, `lesson.${id}.objective`);
    blocks[`${id}-rule`] = { title: required(source, `lesson.${id}.rule`) };
    blocks[`${id}-comparison`] = {
      title: required(source, `lesson.${id}.comparison`),
    };
    blocks[`${id}-explore`] = {
      title: required(source, `lesson.${id}.guided`),
      body: required(source, `lesson.${id}.spoken`),
    };
    blocks[`${id}-recap`] = {
      title: RECAP_HEADING[locale],
      bullets: [required(source, `lesson.${id}.recap`)],
    };
  }

  const examples: Record<string, ExampleCopy> = {};
  for (const example of curriculumExamples) {
    examples[example.id] = {
      translation: required(source, `example.${example.id}.translation`),
    };
  }

  return { modules, lessons, objectives, outcomes, blocks, examples, journeyScenes: {} };
}

/**
 * Assembles the complete runnable course from the catalogs, failing closed on
 * any release-validation error. The default input is the real assembled
 * curriculum; a caller may pass alternative catalogs (e.g. a test fixture) to
 * prove the fail-closed contract.
 */
export function assembleCourse(
  catalogs: AssembledCurriculumCatalogs = assembledCurriculum,
): AssembledCourse {
  // The exercise-budget gate is on at the release boundary now that Slice C
  // Task 2 has authored the 3-5 shared exercises per lesson: assembly fails
  // closed if any lesson falls outside the budget or an exercise stops
  // resolving to shared example data (design spec §5.2, §10.1, §17.1).
  const result = validateCurriculum(catalogs, {
    enforceReleaseTargets: true,
    enforceExerciseTargets: true,
    enforceSpeechTargets: true,
  });
  if (!result.valid) {
    throw new CourseAssemblyError(result.errors.map((error) => error.code));
  }

  const lessonsByModule = new Map<string, typeof catalogs.lessons[number][]>();
  for (const lesson of catalogs.lessons) {
    const list = lessonsByModule.get(lesson.moduleId) ?? [];
    list.push(lesson);
    lessonsByModule.set(lesson.moduleId, list);
  }

  const modules: CourseModule[] = [...curriculumFoundation.modules]
    .sort((a, b) => a.order - b.order)
    .map((foundation) => {
      const coverage = result.coverage.moduleCoverage[foundation.id];
      const moduleLessons = [...(lessonsByModule.get(foundation.id) ?? [])].sort(
        (a, b) => a.order - b.order,
      );
      const lessons = moduleLessons.map((entry, index) =>
        buildLesson(foundation.id, {
          id: entry.id,
          order: index + 1,
          estimatedMinutes: entry.estimatedMinutes,
        }),
      );
      const iconId = MODULE_ICON[foundation.id];
      if (!iconId) {
        throw new CourseAssemblyError([`missing-module-icon:${foundation.id}`]);
      }
      return {
        id: foundation.id,
        phase: foundation.phase,
        order: foundation.order,
        prerequisiteIds: [...foundation.prerequisiteIds],
        outcomeCopyIds: [foundation.id],
        estimatedMinutes: lessons.reduce(
          (sum, lesson) => sum + lesson.estimatedMinutes,
          0,
        ),
        coverage: {
          verbCount: practicedVerbLexemeCount(coverage),
          vocabularyCount: coverage.introducedLexemeIds.length,
        },
        iconId,
        lessons,
      };
    });

  return {
    modules,
    examples: assembledExamples,
    copy: {
      it: buildLocaleCopy("it", catalogs),
      en: buildLocaleCopy("en", catalogs),
    },
  };
}

/** The published, release-validated course (throws at import if invalid). */
export const assembledCourse: AssembledCourse = assembleCourse();

/** The runnable 12-module / 40-lesson course modules. */
export const courseModules: CourseModule[] = assembledCourse.modules;

/** Both locale copy projections, keyed identically (spec §9.1). */
export const assembledCourseCopy = assembledCourse.copy;

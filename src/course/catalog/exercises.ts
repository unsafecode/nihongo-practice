import type { LessonId } from "../data/types";
import { curriculumFoundation } from "../curriculum/foundation";
import { curriculumExamplesById } from "./examples";
import { exampleIdsForPlan, lessonPlans } from "./lessonPlans";
import type {
  AcceptedVariant,
  ChoiceExerciseDefinition,
  CompletionExerciseDefinition,
  ConstrainedConstructionExerciseDefinition,
  ExerciseDefinition,
  SegmentRef,
  TileOrderingExerciseDefinition,
  TransformationExerciseDefinition,
} from "../exercises/types";
import type {
  ConceptId,
  ExerciseCatalogEntry,
  ExerciseDefinitionId,
  LexemeId,
} from "./types";

/**
 * The authored A0→A1 exercise catalog (design spec §5.2, §10.1-§10.3 and Slice C
 * plan Task 2). Every one of the 40 learner lessons gets 3-5 deterministic
 * exercises drawn from its own shared examples, covering all five engine kinds
 * across the course.
 *
 * The load-bearing contract (proven by `exercises.test.ts` and
 * `validateCurriculum`): a definition stores only *references* to shared
 * concept, lexeme, and example (segment) data plus locale-independent copy IDs.
 * No canonical Japanese answer string is ever copied here — the pure engine
 * assembles every tile, option, and answer from the example catalog, so the
 * validator can prove content is shared, not duplicated.
 *
 * Assessed concept/lexeme IDs are derived as the target example's own
 * references intersected with everything the owning lesson has introduced by its
 * canonical teaching position, mirroring exactly the availability window
 * `validateCurriculum` enforces (§6.4). That keeps every assessment honest — an
 * exercise never claims to assess a gear or word the learner has not yet met,
 * even when a shared spoken target happens to reuse a still-future lexeme.
 */

// ── Lesson scope (introduced-so-far) ──────────────────────────────────────────
// Canonical teaching order is (moduleOrder, lessonOrder) — never source array
// position — so it matches the window `validateCurriculum` walks (§6.4).
const moduleOrder = new Map(
  curriculumFoundation.modules.map((module) => [module.id, module.order]),
);

interface LessonScope {
  readonly concepts: ReadonlySet<ConceptId>;
  readonly lexemes: ReadonlySet<LexemeId>;
  readonly exampleIds: ReadonlySet<string>;
}

const scopeByLesson = new Map<LessonId, LessonScope>();
{
  const orderedPlans = [...lessonPlans].sort(
    (left, right) =>
      (moduleOrder.get(left.moduleId) ?? Number.MAX_SAFE_INTEGER) -
        (moduleOrder.get(right.moduleId) ?? Number.MAX_SAFE_INTEGER) ||
      left.order - right.order,
  );
  const concepts = new Set<ConceptId>();
  const lexemes = new Set<LexemeId>();
  for (const plan of orderedPlans) {
    for (const id of plan.introducedConceptIds) concepts.add(id);
    for (const id of plan.introducedLexemeIds) lexemes.add(id);
    scopeByLesson.set(plan.id, {
      concepts: new Set(concepts),
      lexemes: new Set(lexemes),
      exampleIds: new Set(exampleIdsForPlan(plan)),
    });
  }
}

function scopeFor(lessonId: LessonId): LessonScope {
  const scope = scopeByLesson.get(lessonId);
  if (!scope) throw new Error(`unknown lesson ${lessonId}`);
  return scope;
}

/** Target example references, intersected with the owning lesson's scope. */
function assessedFor(
  lessonId: LessonId,
  exampleId: string,
): { readonly conceptIds: readonly ConceptId[]; readonly lexemeIds: readonly LexemeId[] } {
  const scope = scopeFor(lessonId);
  if (!scope.exampleIds.has(exampleId)) {
    throw new Error(`${lessonId} exercise targets non-lesson example ${exampleId}`);
  }
  const example = curriculumExamplesById.get(exampleId);
  if (!example) throw new Error(`unknown example ${exampleId}`);
  return {
    conceptIds: example.conceptIds.filter((id) => scope.concepts.has(id)),
    lexemeIds: example.lexemeIds.filter((id) => scope.lexemes.has(id)),
  };
}

// ── Shared distractor banks ───────────────────────────────────────────────────
// Stable references to a real segment carrying each glyph, so a choice's wrong
// options are shared example data rather than copied literals.
const PARTICLE_SOURCE: Readonly<Record<string, SegmentRef>> = {
  wa: { exampleId: "introductions-1-base", segmentId: "p1" }, // は
  o: { exampleId: "actions-1-base", segmentId: "p1" }, // を
  ni: { exampleId: "introductions-2-say", segmentId: "p1" }, // に
  de: { exampleId: "actions-1-changed", segmentId: "p1" }, // で
  e: { exampleId: "places-1-base", segmentId: "p1" }, // へ
  ga: { exampleId: "descriptions-2-base", segmentId: "p1" }, // が
  to: { exampleId: "actions-2-changed", segmentId: "p1" }, // と
  no: { exampleId: "introductions-1-say", segmentId: "p1" }, // の
  ka: { exampleId: "essential-questions-1-changed", segmentId: "p2" }, // か
  yori: { exampleId: "descriptions-3-base", segmentId: "p1" }, // より
  kara: { exampleId: "places-1-r1", segmentId: "p1" }, // から
  na: { exampleId: "descriptions-1-say", segmentId: "p1" }, // な
};

const ENDING_SOURCE: Readonly<Record<string, SegmentRef>> = {
  desu: { exampleId: "introductions-1-base", segmentId: "e1" }, // です
  masu: { exampleId: "introductions-3-base", segmentId: "e1" }, // ます
  mashita: { exampleId: "past-negative-1-base", segmentId: "e1" }, // ました
  masen: { exampleId: "past-negative-2-changed", segmentId: "e1" }, // ません
  mashou: { exampleId: "people-3-base", segmentId: "e1" }, // ましょう
  mashouka: { exampleId: "people-3-changed", segmentId: "e1" }, // ましょうか
  tai: { exampleId: "shopping-2-changed", segmentId: "e1" }, // たい
  kudasai: { exampleId: "shopping-2-base", segmentId: "e1" }, // ください
};

const PROMPT = {
  order: "exercise.prompt.order",
  particle: "exercise.prompt.particle",
  ending: "exercise.prompt.ending",
  complete: "exercise.prompt.complete",
  construct: "exercise.prompt.construct",
  transformPast: "exercise.prompt.transform.past",
  transformNegative: "exercise.prompt.transform.negative",
  transformPastNegative: "exercise.prompt.transform.past-negative",
} as const;

// ── Authoring accumulators ────────────────────────────────────────────────────
const entries: ExerciseCatalogEntry[] = [];
const byLesson = new Map<LessonId, ExerciseDefinitionId[]>();
const seenIds = new Set<ExerciseDefinitionId>();

function register(lessonId: LessonId, definition: ExerciseDefinition): void {
  if (seenIds.has(definition.id)) {
    throw new Error(`duplicate exercise id ${definition.id}`);
  }
  seenIds.add(definition.id);
  entries.push(
    Object.freeze({
      id: definition.id,
      targetExampleId: definition.targetExampleId,
      assessedConceptIds: definition.assessedConceptIds,
      assessedLexemeIds: definition.assessedLexemeIds,
      definition,
    }),
  );
  const list = byLesson.get(lessonId) ?? [];
  list.push(definition.id);
  byLesson.set(lessonId, list);
}

function distractorRefs(
  bank: Readonly<Record<string, SegmentRef>>,
  glyphs: readonly string[],
): SegmentRef[] {
  return glyphs.map((glyph) => {
    const ref = bank[glyph];
    if (!ref) throw new Error(`unknown distractor glyph ${glyph}`);
    return { ...ref };
  });
}

/** A fluent, per-lesson authoring surface. Roles resolve to `${lesson}-${role}`. */
class Author {
  constructor(private readonly lessonId: LessonId) {}

  private exId(role: string): string {
    return `${this.lessonId}-${role}`;
  }

  private id(kind: string, role: string): string {
    return `${this.lessonId}-${kind}-${role}`;
  }

  private assessed(exampleId: string) {
    return assessedFor(this.lessonId, exampleId);
  }

  order(
    role: string,
    variants?: readonly AcceptedVariant[],
  ): this {
    const target = this.exId(role);
    const { conceptIds, lexemeIds } = this.assessed(target);
    const definition: TileOrderingExerciseDefinition = {
      id: this.id("order", role),
      kind: "tile-ordering",
      promptCopyId: PROMPT.order,
      targetExampleId: target,
      assessedConceptIds: conceptIds,
      assessedLexemeIds: lexemeIds,
      ...(variants ? { acceptedVariants: variants } : {}),
    };
    register(this.lessonId, definition);
    return this;
  }

  private choice(
    kindLabel: "particle" | "ending",
    promptCopyId: string,
    bank: Readonly<Record<string, SegmentRef>>,
    role: string,
    blankSegmentId: string,
    distractorGlyphs: readonly string[],
  ): this {
    const target = this.exId(role);
    const { conceptIds, lexemeIds } = this.assessed(target);
    const definition: ChoiceExerciseDefinition = {
      id: this.id(kindLabel, role),
      kind: "choice",
      promptCopyId,
      targetExampleId: target,
      blankSegmentId,
      distractorRefs: distractorRefs(bank, distractorGlyphs),
      assessedConceptIds: conceptIds,
      assessedLexemeIds: lexemeIds,
    };
    register(this.lessonId, definition);
    return this;
  }

  particle(role: string, blankSegmentId: string, glyphs: readonly string[]): this {
    return this.choice("particle", PROMPT.particle, PARTICLE_SOURCE, role, blankSegmentId, glyphs);
  }

  ending(role: string, blankSegmentId: string, glyphs: readonly string[]): this {
    return this.choice("ending", PROMPT.ending, ENDING_SOURCE, role, blankSegmentId, glyphs);
  }

  complete(role: string, blankSegmentIds: readonly string[]): this {
    const target = this.exId(role);
    const { conceptIds, lexemeIds } = this.assessed(target);
    const definition: CompletionExerciseDefinition = {
      id: this.id("complete", role),
      kind: "completion",
      promptCopyId: PROMPT.complete,
      targetExampleId: target,
      blankSegmentIds: [...blankSegmentIds],
      assessedConceptIds: conceptIds,
      assessedLexemeIds: lexemeIds,
    };
    register(this.lessonId, definition);
    return this;
  }

  transform(
    promptRole: string,
    targetRole: string,
    transformation: "tense" | "polarity",
    promptCopyId: string,
  ): this {
    const target = this.exId(targetRole);
    const prompt = this.exId(promptRole);
    // Reference the prompt example so `validateCurriculum` proves it resolves.
    if (!scopeFor(this.lessonId).exampleIds.has(prompt)) {
      throw new Error(`${this.lessonId} transform prompt ${prompt} not in lesson`);
    }
    const { conceptIds, lexemeIds } = this.assessed(target);
    const definition: TransformationExerciseDefinition = {
      id: this.id("transform", targetRole),
      kind: "transformation",
      promptCopyId,
      promptExampleId: prompt,
      targetExampleId: target,
      transformation,
      assessedConceptIds: conceptIds,
      assessedLexemeIds: lexemeIds,
    };
    register(this.lessonId, definition);
    return this;
  }

  construct(role: string, options: { readonly permitKatakanaToHiragana?: boolean } = {}): this {
    const target = this.exId(role);
    const { conceptIds, lexemeIds } = this.assessed(target);
    const definition: ConstrainedConstructionExerciseDefinition = {
      id: this.id("construct", role),
      kind: "constrained-construction",
      promptCopyId: PROMPT.construct,
      targetExampleId: target,
      intentCopyId: `example.${target}.translation`,
      assessedConceptIds: conceptIds,
      assessedLexemeIds: lexemeIds,
      ...(options.permitKatakanaToHiragana
        ? { permitKatakanaToHiragana: true }
        : {}),
    };
    register(this.lessonId, definition);
    return this;
  }
}

function lesson(lessonId: LessonId, author: (a: Author) => void): void {
  author(new Author(lessonId));
}

// ── Module 1 · Sounds, hiragana, and the katakana bridge ─────────────────────
// Pure single-word vocabulary: production from meaning is the apt drill, so each
// greeting/loanword is recalled with a constrained construction; the two-phrase
// opener also gets an ordering.
lesson("sounds-1", (a) => {
  a.construct("base");
  a.construct("changed");
  a.construct("say");
  a.construct("r1");
});
lesson("sounds-2", (a) => {
  a.construct("base");
  a.construct("changed");
  a.construct("say");
  a.construct("r1");
});
lesson("sounds-3", (a) => {
  a.construct("base");
  a.construct("changed");
  a.order("say");
  a.construct("say");
});
lesson("sounds-4", (a) => {
  a.construct("base", { permitKatakanaToHiragana: true });
  a.construct("changed", { permitKatakanaToHiragana: true });
  a.construct("say", { permitKatakanaToHiragana: true });
  a.construct("r1", { permitKatakanaToHiragana: true });
});
lesson("sounds-5", (a) => {
  a.construct("base", { permitKatakanaToHiragana: true });
  a.construct("changed", { permitKatakanaToHiragana: true });
  a.construct("say", { permitKatakanaToHiragana: true });
  a.construct("r1", { permitKatakanaToHiragana: true });
});

// ── Module 2 · Introducing oneself ───────────────────────────────────────────
lesson("introductions-1", (a) => {
  a.order("base");
  a.particle("base", "p1", ["no"]); // は vs の
  a.complete("base", ["e1"]); // です
  a.construct("say");
});
lesson("introductions-2", (a) => {
  a.order("base");
  a.particle("say", "p1", ["wa", "no"]); // に vs は/の
  a.complete("say", ["e1"]); // ます
  a.construct("say");
});
lesson("introductions-3", (a) => {
  a.order("base");
  a.particle("base", "p1", ["wa", "ni"]); // を vs は/に
  a.complete("base", ["e1"]); // ます
  a.construct("say");
});

// ── Module 3 · Essential questions ───────────────────────────────────────────
lesson("essential-questions-1", (a) => {
  a.order("base");
  a.particle("base", "p1", ["no", "o"]); // は vs の/を
  a.complete("changed", ["p2"]); // か
  a.construct("say");
});
lesson("essential-questions-2", (a) => {
  a.order("base");
  a.particle("say", "p2", ["wa", "o"]); // に vs は/を
  a.complete("say", ["e1"]); // ます
  a.construct("say");
});
lesson("essential-questions-3", (a) => {
  a.order("base");
  a.particle("say", "p1", ["no", "o"]); // は vs の/を
  a.complete("say", ["e1"]); // です
  a.construct("say");
});

// ── Module 4 · Actions and objects ───────────────────────────────────────────
lesson("actions-1", (a) => {
  a.order("changed");
  a.particle("changed", "p1", ["o", "ni"]); // で vs を/に
  a.complete("base", ["e1"]); // ます
  a.construct("say");
});
lesson("actions-2", (a) => {
  a.order("changed");
  a.particle("changed", "p1", ["o", "de"]); // と vs を/で
  a.complete("base", ["e1"]); // ます
  a.construct("say");
});
lesson("actions-3", (a) => {
  a.order("base");
  a.particle("base", "p1", ["ni", "de"]); // を vs に/で
  a.complete("say", ["e1"]); // ます
  a.construct("say");
});

// ── Module 5 · Routines, clock time, and frequency ───────────────────────────
lesson("routines-1", (a) => {
  a.order("base");
  a.particle("base", "p1", ["o", "de"]); // に vs を/で
  a.complete("changed", ["e1"]); // ます
  a.construct("say");
});
lesson("routines-2", (a) => {
  a.order("changed");
  a.particle("changed", "p1", ["ni", "de"]); // を vs に/で
  a.complete("base", ["e1"]); // ます
  a.construct("say");
});
lesson("routines-3", (a) => {
  a.order("say");
  a.particle("say", "p1", ["o", "de"]); // に vs を/で
  a.complete("base", ["e1"]); // ます
  a.construct("say");
});

// ── Module 6 · Past and negative (transformation lives here) ──────────────────
lesson("past-negative-1", (a) => {
  a.transform("changed", "base", "tense", PROMPT.transformPast); // present → past
  a.order("say");
  a.particle("say", "p1", ["ni", "to"]); // を vs に/と
  a.construct("say");
});
lesson("past-negative-2", (a) => {
  a.transform("base", "changed", "polarity", PROMPT.transformNegative); // affirmative → negative
  a.order("say");
  a.particle("say", "p1", ["o", "de"]); // に vs を/で
  a.construct("say");
});
lesson("past-negative-3", (a) => {
  a.transform("base", "changed", "polarity", PROMPT.transformPastNegative); // past → past-negative
  a.order("say");
  a.particle("say", "p2", ["ni", "to"]); // を vs に/と
  a.construct("say");
});

// ── Module 7 · Places, movement, and transport ───────────────────────────────
lesson("places-1", (a) => {
  a.order("base");
  a.particle("base", "p1", ["ni", "o"]); // へ vs に/を
  a.complete("changed", ["e1"]); // ます
  a.construct("say");
});
lesson("places-2", (a) => {
  a.order("base");
  a.particle("r1", "p1", ["ni", "de"]); // から vs に/で
  a.complete("base", ["e1"]); // ます
  a.construct("say");
});
lesson("places-3", (a) => {
  a.order("base");
  a.particle("base", "p2", ["o", "de"]); // に vs を/で
  a.complete("changed", ["e1"]); // ます
  a.construct("say");
});
lesson("places-4", (a) => {
  a.order("base");
  a.particle("changed", "p2", ["de", "ni"]); // を vs で/に
  a.complete("say", ["e1"]); // です
  a.construct("say");
});

// ── Module 8 · People, family, and relationships ─────────────────────────────
lesson("people-1", (a) => {
  a.order("say");
  a.particle("say", "p1", ["o", "to"]); // に vs を/と
  a.complete("base", ["e1"]); // です
  a.construct("say");
});
lesson("people-2", (a) => {
  a.order("base");
  a.particle("base", "p1", ["o", "e"]); // に vs を/へ
  a.complete("changed", ["e1"]); // ます
  a.construct("say");
});
lesson("people-3", (a) => {
  a.order("base");
  a.ending("base", "e1", ["masu", "mashita"]); // ましょう vs ます/ました
  a.particle("base", "p2", ["o", "e"]); // に vs を/へ
  a.construct("say");
});

// ── Module 9 · Descriptions, preferences, and weather ────────────────────────
lesson("descriptions-1", (a) => {
  a.order("base");
  a.complete("base", ["e1"]); // です
  a.particle("say", "p1", ["de", "o"]); // な vs で/を
  a.construct("say");
});
lesson("descriptions-2", (a) => {
  a.order("base");
  a.particle("base", "p1", ["wa", "o"]); // が vs は/を
  a.complete("changed", ["e1"]); // です
  a.construct("say");
});
lesson("descriptions-3", (a) => {
  a.order("base");
  a.particle("base", "p1", ["ga", "wa"]); // より vs が/は
  a.construct("base");
  a.construct("say");
});

// ── Module 10 · Shopping, quantities, and requests ───────────────────────────
lesson("shopping-1", (a) => {
  a.order("base");
  a.particle("base", "p1", ["ga", "ni"]); // を vs が/に
  a.complete("base", ["e1"]); // ます
  a.construct("say");
});
lesson("shopping-2", (a) => {
  a.order("base");
  a.ending("base", "e1", ["masu", "desu"]); // ください vs ます/です
  a.particle("changed", "p1", ["ga", "ni"]); // を vs が/に
  a.construct("say");
});
lesson("shopping-3", (a) => {
  a.order("base");
  a.particle("base", "p1", ["ni", "de"]); // を vs に/で
  a.complete("changed", ["e1"]); // ます
  a.construct("say");
});

// ── Module 11 · Existence, position, and needs ───────────────────────────────
lesson("existence-needs-1", (a) => {
  a.order("base");
  a.particle("base", "p3", ["wa", "o"]); // が vs は/を
  a.complete("changed", ["e1"]); // ます
  a.construct("say");
});
lesson("existence-needs-2", (a) => {
  a.order("base");
  a.particle("base", "p3", ["wa", "o"]); // が vs は/を
  a.complete("changed", ["e1"]); // ます
  a.construct("say");
});
lesson("existence-needs-3", (a) => {
  a.order("base");
  a.particle("base", "p1", ["o", "wa"]); // が vs を/は
  a.complete("say", ["e1"]); // ます
  a.construct("say");
});

// ── Module 12 · Practical synthesis (capstones) ──────────────────────────────
lesson("capstones-orientation", (a) => {
  a.order("base");
  a.particle("base", "p1", ["ga", "o"]); // は vs が/を
  a.complete("base", ["e1"]); // です
  a.construct("say");
});
lesson("capstones-self-introduction", (a) => {
  a.order("base");
  a.particle("changed", "p1", ["ga", "o"]); // は vs が/を
  a.construct("changed");
  a.construct("say");
});
lesson("capstones-everyday-outing", (a) => {
  a.order("changed");
  a.particle("changed", "p1", ["ni", "o"]); // で vs に/を
  a.construct("base");
  a.construct("say");
});
lesson("capstones-travel-day", (a) => {
  a.particle("base", "p2", ["o", "de"]); // に vs を/で
  a.construct("base");
  a.construct("changed");
  a.construct("say");
});

/** The authored, order-stable exercise catalog (design spec §10.1). */
export const curriculumExercises: readonly ExerciseCatalogEntry[] =
  Object.freeze(entries);

/** The 3-5 exercise IDs each lesson assesses, keyed by lesson id. */
export const exerciseIdsByLesson: ReadonlyMap<
  LessonId,
  readonly ExerciseDefinitionId[]
> = new Map(
  [...byLesson.entries()].map(([lessonId, ids]) => [
    lessonId,
    Object.freeze([...ids]),
  ]),
);

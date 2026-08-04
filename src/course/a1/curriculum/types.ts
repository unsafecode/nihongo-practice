import { deepFreeze } from "../../foundations/deepFreeze";

export const A1_SEMANTIC_SECTION_ORDER = [
  "rule",
  "vocabulary",
  "grammar",
  "comparison",
  "explore",
  "recap",
] as const;

export const A1_PRACTICE_FUNCTIONS = [
  "meaning-comprehension",
  "form-discrimination",
  "controlled-production",
  "transformation",
  "contextual-response",
  "listening-speaking",
] as const;

export type A1PracticeFunction = (typeof A1_PRACTICE_FUNCTIONS)[number];
export type Bilingual = Readonly<{ en: string; it: string }>;

export interface A1Lexeme {
  readonly id: string;
  readonly valueIds: readonly string[];
  readonly kana: string;
  readonly romaji: string;
  readonly category:
    | "pronoun"
    | "person"
    | "noun"
    | "verb"
    | "adjective"
    | "question-word"
    | "time"
    | "expression";
  readonly meaning: Bilingual;
  readonly verb?: Readonly<{
    dictionary: Readonly<{ kana: string; romaji: string }>;
    polite: Readonly<{ kana: string; romaji: string }>;
    class: "godan" | "ichidan" | "irregular";
  }>;
}

export interface A1PracticeActivity {
  readonly id: string;
  readonly function: A1PracticeFunction;
  readonly interactionKind:
    | "tile-ordering"
    | "choice"
    | "transformation"
    | "completion"
    | "constrained-construction"
    | "spoken";
  readonly targetRef:
    | Readonly<{ round: "one" | "two"; index: number }>
    | Readonly<{ spokenVariantId: string }>;
}

export interface A1PracticeBlueprint {
  readonly activities: readonly [
    A1PracticeActivity,
    A1PracticeActivity,
    A1PracticeActivity,
    A1PracticeActivity,
    A1PracticeActivity,
  ];
}

export interface A1LessonContent {
  readonly lessonId: string;
  readonly situation: Bilingual;
  readonly prerequisiteLessonIds: readonly string[];
  readonly prerequisiteConceptIds: readonly string[];
  readonly newLexemeIds: readonly string[];
  readonly vocabularyException?: Readonly<{ kind: "synthesis"; reason: Bilingual }>;
  readonly learningNoteId: string;
  readonly workedExampleVariantIds: readonly [string, string] | readonly [string, string, string];
  readonly dialogue?: Readonly<{
    turnVariantIds: readonly [string, string] | readonly [string, string, string];
  }>;
  readonly practiceBlueprint: A1PracticeBlueprint;
  readonly retrievalCue: Bilingual;
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertBilingual(value: Bilingual, label: string): void {
  assertNonEmptyString(value.en, `${label}.en`);
  assertNonEmptyString(value.it, `${label}.it`);
}

function assertNonEmptyIds(ids: readonly string[], label: string): void {
  for (const id of ids) {
    assertNonEmptyString(id, `${label} id`);
  }
}

function assertUnique(ids: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(`Duplicate ${label} "${id}".`);
    }
    seen.add(id);
  }
}

function isSpokenTargetRef(
  targetRef: A1PracticeActivity["targetRef"],
): targetRef is Readonly<{ spokenVariantId: string }> {
  return "spokenVariantId" in targetRef;
}

function assertPracticeBlueprint(blueprint: A1PracticeBlueprint): void {
  const activities = blueprint.activities;
  if (!Array.isArray(activities) || activities.length !== 5) {
    throw new Error("Practice blueprint must contain exactly five activities.");
  }

  const activityIds = new Set<string>();
  const nonSpokenTargets = new Set<string>();
  const presentFunctions = new Set<A1PracticeFunction>();

  activities.forEach((activity, index) => {
    assertNonEmptyString(activity.id, `Practice activity ${index + 1} id`);
    if (activityIds.has(activity.id)) {
      throw new Error(`Duplicate activity id "${activity.id}".`);
    }
    activityIds.add(activity.id);
    presentFunctions.add(activity.function);

    if (index > 0 && activity.function === activities[index - 1].function) {
      throw new Error(`Consecutive duplicate practice function "${activity.function}".`);
    }

    const spokenTarget = isSpokenTargetRef(activity.targetRef);
    if (activity.function === "listening-speaking") {
      if (activity.interactionKind !== "spoken" || !spokenTarget) {
        throw new Error("Listening-speaking activities must use spoken interaction and a spoken target.");
      }
      assertNonEmptyString(activity.targetRef.spokenVariantId, `Practice activity ${index + 1} spoken target id`);
      return;
    }

    if (activity.interactionKind === "spoken" || spokenTarget) {
      throw new Error("Non-listening activities cannot use spoken interaction or a spoken target.");
    }

    const targetKey = `${activity.targetRef.round}:${activity.targetRef.index}`;
    if (nonSpokenTargets.has(targetKey)) {
      throw new Error(`Duplicate non-spoken target reference "${targetKey}".`);
    }
    nonSpokenTargets.add(targetKey);
  });

  for (const requiredFunction of [
    "meaning-comprehension",
    "form-discrimination",
    "controlled-production",
    "listening-speaking",
  ] as const) {
    if (!presentFunctions.has(requiredFunction)) {
      throw new Error(`Missing required ${requiredFunction} practice activity.`);
    }
  }
}

function assertVariantIds(
  ids: readonly string[],
  label: "worked example" | "dialogue turn",
): void {
  if (ids.length !== 2 && ids.length !== 3) {
    throw new Error(`${label} ids must contain exactly two or three entries.`);
  }
  assertNonEmptyIds(ids, label);
  assertUnique(ids, label);
}

/**
 * Validates the learner-facing A1 lesson contract and freezes the authored
 * value in place without normalizing any lesson data.
 */
export function defineA1LessonContent(input: A1LessonContent): A1LessonContent {
  assertNonEmptyString(input.lessonId, "Lesson id");
  assertBilingual(input.situation, "Situation");
  assertNonEmptyIds(input.prerequisiteLessonIds, "Prerequisite lesson");
  assertNonEmptyIds(input.prerequisiteConceptIds, "Prerequisite concept");
  assertNonEmptyIds(input.newLexemeIds, "New lexeme");
  assertUnique(input.newLexemeIds, "new lexeme id");
  assertNonEmptyString(input.learningNoteId, "Learning note id");
  assertVariantIds(input.workedExampleVariantIds, "worked example");
  assertBilingual(input.retrievalCue, "Retrieval cue");

  if (input.vocabularyException !== undefined) {
    if (input.newLexemeIds.length > 0) {
      throw new Error("A vocabulary exception cannot be present with new lexeme ids.");
    }
    assertBilingual(input.vocabularyException.reason, "Vocabulary exception reason");
  }

  if (input.dialogue !== undefined) {
    assertVariantIds(input.dialogue.turnVariantIds, "dialogue turn");
  }

  assertPracticeBlueprint(input.practiceBlueprint);
  return deepFreeze(input);
}

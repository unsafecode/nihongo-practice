import type { Locale } from "../../i18n/LocaleContext";
import type { AssembledToken } from "../../romaji/types";
import { buildA1LessonViewModel } from "../a1/a1LessonViewModel";
import { a1FoundationCatalogs } from "../a1/catalog/catalog";
import { a1LessonContentById } from "../a1/curriculum/catalog";
import { buildA1PracticeFeedback } from "../a1/curriculum/a1PracticeFeedback";
import { reviewRetrievalConceptIds } from "../a1/curriculum/lessonContentHelpers";
import type { A1PracticeFunction } from "../a1/curriculum/types";
import { a2FoundationCatalogs } from "../a2/catalog/catalog";
import { buildA2FoundationViewModel } from "../a2/view/buildA2LessonViewModel";
import { courseModulesByLevel } from "../data/course";
import type { ExercisePrompt } from "../exercises/types";
import type {
  FoundationLessonViewModel,
  FoundationLessonViewModelResult,
} from "../foundations/buildLessonViewModel";
import { buildPhoneticLessonModel, phoneticLessonIds } from "./phoneticExerciseModel";

/**
 * The pure lesson-exercise model (Phase 2 Task 6; design spec §10.1-§10.2).
 * It resolves each of the A1 release's 44 semantic lessons' two practice
 * rounds into the deterministic engine prompts the UI renders, and exposes
 * the derived lookups a component needs without ever reconstructing a
 * canonical answer:
 *
 *   - {@link segmentToken} — the real {@link AssembledToken} (jp/romaji/kind/
 *     boundary) the A1 release builder already derived for a tile/option's
 *     shared example segment, so a tile renders through the shared semantic
 *     romaji renderer from the same source as every other on-page romaji,
 *     never a hard-coded fragment;
 *   - {@link exampleTokens} — the whole ordered token list for an example, for
 *     a transformation source or in-sentence context to render as one real
 *     runtime sequence.
 *
 * Every exercise's localized instruction and (for constrained-construction)
 * intent text are precomputed once, per locale, directly on the
 * {@link GeneratedExercise} itself — sourced from `buildA1LessonViewModel`'s
 * own locale-resolved `FoundationRoundTarget.instruction`/`.intentText`
 * (a fixed kind→locale→string map internal to the builder), not from the
 * legacy curriculum copy catalog, which carries no entries for A1 prompt
 * copy ids.
 *
 * Only the 44 semantic lessons produce sentence-engine exercises: the four
 * phonetic `sounds-*` lessons instead resolve their own deterministic
 * choice/tile-ordering exercises from `phoneticExerciseModel.ts`'s
 * `buildPhoneticLessonModel` — hand-assembled directly from `module01Sounds`'s
 * validated 10-item-per-lesson catalog, since the sentence engine has no
 * predicate/role for an isolated phonetic item (`a1FoundationCatalogs`
 * excludes them; see `a1/catalog/catalog.ts`). A real builder failure for
 * either kind of lesson (a structural catalog defect) surfaces as a
 * `LessonExerciseModelError` entry rather than a silent or partial exercise
 * list, so `lessonExerciseModel.test.ts` can prove every published lesson —
 * semantic and phonetic alike — generates error-free prompts.
 */

export interface GeneratedExercise {
  readonly definitionId: string;
  /** The shared example the exercise targets, for deriving in-sentence romaji. */
  readonly targetExampleId: string;
  readonly prompt: ExercisePrompt;
  /** Localized instruction for the exercise's kind, by locale (exact IT/EN parity). */
  readonly instruction: Readonly<Record<Locale, string>>;
  /** Localized constrained-construction intent/scenario note, or null, by locale. */
  readonly intentText: Readonly<Record<Locale, string | null>>;
  /**
   * The release builder's own round purpose for this target — round 1's
   * `"guided-controlled"` or round 2's `"transfer"` (never re-derived from
   * the target/round index here, so it always agrees with
   * `FoundationRoundModel.purpose`). `ProgressContext` reads this to record
   * Can-do transfer evidence only for a genuine transfer-round acceptance.
   */
  readonly practicePurpose: "guided-controlled" | "transfer";
  /**
   * The exercise's real visible-answer key: the semantic engine's own
   * `FoundationRoundTarget.visibleTargetKey` (the realized canonical
   * Japanese sentence) for the 44 semantic lessons, or a phonetic item's own
   * displayed `glyph` for the four `sounds-*` lessons — never a re-derived
   * id. `Exercise.tsx` only ever emits this through {@link opaqueTargetKey}
   * (never the raw string) as `.lesson-exercise`'s `data-visible-target-key`,
   * so an e2e semantic-diversity audit can tell two exercises' real targets
   * apart, or the same target reused, without ever reading raw Japanese
   * (`authoring.ts`'s `FORBIDDEN_FIELD_NAMES` bans this field name from ever
   * reaching a recipe, let alone the DOM, in un-hashed form).
   */
  readonly visibleTargetKey: string;
  /**
   * The authored A1 practice purpose, or null for A2 where exercise selection
   * continues to expose only its existing round semantics.
   */
  readonly practiceFunction: A1PracticeFunction | null;
  /** Post-submit copy. It is not rendered until the future practice UI uses it. */
  readonly feedback: Readonly<
    Record<Locale, Readonly<{ accepted: string; retry: string }>>
  >;
}

export interface LessonExerciseModelError {
  readonly code: string;
  readonly lessonId: string;
  readonly detail?: string;
}

export interface LessonExercisesModel {
  readonly lessonId: string;
  readonly exercises: readonly GeneratedExercise[];
  readonly errors: readonly LessonExerciseModelError[];
}

const LOCALES: readonly Locale[] = ["en", "it"];

const GENERIC_FEEDBACK: GeneratedExercise["feedback"] = {
  en: {
    accepted: "That works for this practice step.",
    retry: "Try the practice step again.",
  },
  it: {
    accepted: "Va bene per questo passaggio di pratica.",
    retry: "Riprova questo passaggio di pratica.",
  },
};

/** A catalog-neutral lesson-view-model builder (A1 or A2), used by
 * {@link buildSemanticModel} so both levels' sentence lessons resolve their
 * rounds/targets through the same deterministic path. */
type FoundationViewModelBuilder = (
  lessonId: string,
  locale: Locale,
) => FoundationLessonViewModelResult;

/** The A1 lesson ids that carry sentence-engine content (the 44 semantic lessons). */
const a1SemanticLessonIds = new Set(
  a1FoundationCatalogs.lessons.map((lesson) => lesson.id),
);

/** Every A2 lesson id — all 60 A2 lessons are semantic (no phonetic module). */
const a2LessonIds = new Set(a2FoundationCatalogs.lessons.map((lesson) => lesson.id));

function emptyModel(lessonId: string): LessonExercisesModel {
  return { lessonId, exercises: [], errors: [] };
}

function errorModel(
  lessonId: string,
  code: string,
  detail?: string,
): LessonExercisesModel {
  return { lessonId, exercises: [], errors: [{ code, lessonId, detail }] };
}

function buildSemanticModel(
  lessonId: string,
  buildViewModel: FoundationViewModelBuilder,
): LessonExercisesModel {
  const byLocale = new Map<Locale, FoundationLessonViewModel>();
  for (const locale of LOCALES) {
    const result = buildViewModel(lessonId, locale);
    if (!result.ok) {
      return errorModel(lessonId, result.error.code, result.error.detail);
    }
    byLocale.set(locale, result.model);
  }
  const en = byLocale.get("en")!;
  const other = LOCALES.filter((locale) => locale !== "en");

  const exercises: GeneratedExercise[] = [];
  for (let roundIndex = 0; roundIndex < en.rounds.length; roundIndex++) {
    const enRound = en.rounds[roundIndex]!;
    const enTargets = enRound.targets;
    for (let targetIndex = 0; targetIndex < enTargets.length; targetIndex++) {
      const enTarget = enTargets[targetIndex]!;
      const instruction: Record<Locale, string> = { en: enTarget.instruction, it: enTarget.instruction };
      const intentText: Record<Locale, string | null> = {
        en: enTarget.intentText,
        it: enTarget.intentText,
      };
      for (const locale of other) {
        const localeTarget = byLocale.get(locale)!.rounds[roundIndex]!.targets[targetIndex];
        if (!localeTarget || localeTarget.targetId !== enTarget.targetId) {
          return errorModel(
            lessonId,
            "locale-mismatch",
            `${locale} round ${roundIndex} target ${targetIndex} did not match en's ${enTarget.targetId}`,
          );
        }
        instruction[locale] = localeTarget.instruction;
        intentText[locale] = localeTarget.intentText;
      }
      exercises.push({
        definitionId: enTarget.targetId,
        targetExampleId: enTarget.targetExampleId,
        prompt: enTarget.prompt,
        instruction,
        intentText,
        practicePurpose: enRound.purpose,
        // Locale-invariant (derived from the realized Japanese target, not
        // any locale's narration), so it is safe to read from the `en`
        // build alone rather than re-validating it per locale above.
        visibleTargetKey: enTarget.visibleTargetKey,
        practiceFunction: null,
        feedback: GENERIC_FEEDBACK,
      });
    }
  }

  const content = a1LessonContentById[lessonId];
  if (content) {
    const byDefinitionId = new Map(
      exercises.map((exercise) => [exercise.definitionId, exercise] as const),
    );
    const selected: GeneratedExercise[] = [];
    for (const activity of content.practiceBlueprint.activities) {
      if ("spokenVariantId" in activity.targetRef) continue;
      const round =
        activity.targetRef.round === "one" ? en.rounds[0] : en.rounds[1];
      const target = round.targets[activity.targetRef.index];
      if (!target) {
        return errorModel(
          lessonId,
          "a1-practice-target-unresolved",
          `${activity.targetRef.round}:${activity.targetRef.index}`,
        );
      }
      const generated = byDefinitionId.get(target.targetId);
      const feedback = generated
        ? buildA1PracticeFeedback(
            lessonId,
            activity.function,
            generated.prompt.assessedLexemeIds,
            [generated.visibleTargetKey],
          )
        : undefined;
      if (!generated || !feedback || target.prompt.kind !== activity.interactionKind) {
        return errorModel(lessonId, "a1-practice-target-unresolved", activity.id);
      }
      selected.push({
        ...generated,
        prompt: {
          ...generated.prompt,
          assessedConceptIds: reviewRetrievalConceptIds(
            generated.prompt.assessedConceptIds,
            content.learningNoteId,
          ),
        },
        practiceFunction: activity.function,
        feedback,
      });
    }
    if (selected.length !== 4) {
      return errorModel(lessonId, "a1-practice-target-unresolved", lessonId);
    }
    return { lessonId, exercises: selected, errors: [] };
  }
  return { lessonId, exercises, errors: [] };
}

function buildModel(lessonId: string): LessonExercisesModel {
  if (a1SemanticLessonIds.has(lessonId)) {
    return buildSemanticModel(lessonId, buildA1LessonViewModel);
  }
  if (a2LessonIds.has(lessonId)) {
    return buildSemanticModel(lessonId, buildA2FoundationViewModel);
  }
  if (phoneticLessonIds.has(lessonId)) return buildPhoneticLessonModel(lessonId).model;
  return emptyModel(lessonId);
}

const allCourseLessonIds = [
  ...courseModulesByLevel.a1,
  ...courseModulesByLevel.a2,
].flatMap((courseModule) => courseModule.lessons.map((lesson) => lesson.id));

const modelsByLesson = new Map<string, LessonExercisesModel>(
  allCourseLessonIds.map((lessonId) => [lessonId, buildModel(lessonId)]),
);

/** The deterministic exercise model for a lesson, or undefined when unknown. */
export function getLessonExercises(
  lessonId: string,
): LessonExercisesModel | undefined {
  return modelsByLesson.get(lessonId);
}

// ── Derived tokens: a tile id is `${exampleId}#${segmentId}` (the same
// convention the shared engine already uses everywhere else). Built once per
// semantic lesson from that lesson's own `buildA1LessonViewModel` closures —
// each is the real `AssembledToken` every other learner-facing romaji surface
// renders through `RomajiSequence`, never a plain fragment string a component
// would have to re-join itself. ─────────────────────────────────────────────
const tokenByTileId = new Map<string, AssembledToken>();
const tokensByExampleId = new Map<string, readonly AssembledToken[]>();

function tileIdsForPrompt(
  prompt: ExercisePrompt,
  targetExampleId: string,
): readonly string[] {
  switch (prompt.kind) {
    case "tile-ordering":
      return prompt.tiles.map((tile) => tile.id);
    case "choice":
      return [
        ...prompt.options.map((option) => option.id),
        ...prompt.sentenceSegments.map(
          (segment) => `${targetExampleId}#${segment.id}`,
        ),
      ];
    case "completion":
      return prompt.sentenceSegments.map(
        (segment) => `${targetExampleId}#${segment.id}`,
      );
    case "constrained-construction":
    case "transformation":
      return [];
  }
}

function exampleIdsForPrompt(
  prompt: ExercisePrompt,
  targetExampleId: string,
): readonly string[] {
  return prompt.kind === "transformation"
    ? [targetExampleId, prompt.promptExampleId]
    : [targetExampleId];
}

function indexSemanticLessonTokens(
  lessonIds: Iterable<string>,
  buildViewModel: FoundationViewModelBuilder,
): void {
  for (const lessonId of lessonIds) {
    const model = getLessonExercises(lessonId);
    if (!model || model.exercises.length === 0) continue;
    const built = buildViewModel(lessonId, "en");
    if (!built.ok) continue; // Already recorded as a model error above.
    const { tokenForTile, tokensForExample } = built.model;
    for (const exercise of model.exercises) {
      for (const tileId of tileIdsForPrompt(exercise.prompt, exercise.targetExampleId)) {
        const token = tokenForTile(tileId);
        if (token) tokenByTileId.set(tileId, token);
      }
      for (const exampleId of exampleIdsForPrompt(exercise.prompt, exercise.targetExampleId)) {
        const tokens = tokensForExample(exampleId);
        if (tokens) tokensByExampleId.set(exampleId, tokens);
      }
    }
  }
}

indexSemanticLessonTokens(a1SemanticLessonIds, buildA1LessonViewModel);
indexSemanticLessonTokens(a2LessonIds, buildA2FoundationViewModel);

for (const lessonId of phoneticLessonIds) {
  const model = getLessonExercises(lessonId);
  if (!model || model.exercises.length === 0) continue;
  const built = buildPhoneticLessonModel(lessonId);
  for (const [tileId, token] of built.tokenByTileId) tokenByTileId.set(tileId, token);
  for (const [exampleId, tokens] of built.tokensByExampleId) {
    tokensByExampleId.set(exampleId, tokens);
  }
}

/** The derived real assembled token for a tile/option id, or undefined when unresolved. */
export function segmentToken(tileId: string): AssembledToken | undefined {
  return tokenByTileId.get(tileId);
}

/** The whole-sentence ordered token list for an example id (transformation source, in-sentence context), or undefined when unresolved. */
export function exampleTokens(
  exampleId: string,
): readonly AssembledToken[] | undefined {
  return tokensByExampleId.get(exampleId);
}

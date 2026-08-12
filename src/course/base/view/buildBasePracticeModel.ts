import type { AssembledToken } from "../../../romaji/types";
import { opaqueTargetKey } from "../../foundations/opaqueTargetKey";
import type { BaseActivityKind } from "../catalog/activityContracts";
import type { BaseActivityDefinition, BaseValidationCatalogs } from "../catalog/types";
import { baseCanonicalCatalog } from "../catalog/catalog";
import {
  activityOptionTargetReferencesFor,
  activityPromptTargetReferenceFor,
  activityTargetReferenceFor,
} from "../catalog/visibleTargets";
import { visibleSurfaceFingerprint } from "../validation/fingerprints";
import { baseLessonManifestEntry } from "../manifest";
import { BASE_SOUND_MODULE, BASE_SOUND_TARGET_BY_ID, type BaseSoundActivityDesign } from "../content/module01Sounds";
import { BASE_SYNTHESIS_VALIDATION_CATALOGS } from "../content/module10Synthesis";
import { baseAudioRecordById } from "../audio/catalog";

/**
 * The Base level's deterministic practice model (Task 14): every lesson's
 * already-authored, already-validated `content.activities` (a
 * `BaseActivityDefinition[]` whose 8+2/6+2 counts and category coverage are
 * enforced upstream by `validation/lessonRules.ts`) resolved into a
 * render-ready, leakage-safe shape. This builder never invents new practice
 * content: it only resolves each authored activity's existing target/option
 * references through the frozen catalogs into the three interaction shapes
 * the practice UI renders (`choice`, `tile-ordering`, `reveal`) plus the
 * dedicated `listening`/`spoken` shapes — mapping authored categories onto
 * these interaction kinds rather than re-authoring a second content set.
 *
 * Every activity's `fingerprint` is the opaque (FNV-1a hashed, never raw
 * Japanese) diversity key `Exercise.tsx` already uses in production
 * (`opaqueTargetKey`), so a review harness can tell two activities' targets
 * apart, or the same target reused, without any Japanese ever reaching a
 * `data-*` attribute pre-attempt.
 */

export interface BasePracticeOptionView {
  readonly id: string;
  readonly tokens: readonly AssembledToken[];
}

export interface BasePracticeTileView {
  readonly id: string;
  readonly token: AssembledToken;
}

export type BaseListeningPlayback =
  | { readonly kind: "asset"; readonly assetId: string }
  | { readonly kind: "synthesis"; readonly tokens: readonly AssembledToken[] };

interface BasePracticeActivityCommon {
  readonly id: string;
  readonly mode: "non-spoken" | "listening" | "spoken";
  readonly category: BaseActivityKind;
  /** Alias of {@link category}; kept distinct so a listening/spoken filter
   * (`item.kind === "listening"`) reads independently of a category-coverage
   * check (`item.category`) even though both hold the same value here. */
  readonly kind: BaseActivityKind;
  readonly instructionCopyId: string;
  readonly acceptedFeedbackCopyId: string;
  readonly retryFeedbackCopyId: string;
  /** Opaque diversity key — never the raw Japanese surface. */
  readonly fingerprint: string;
}

export interface BaseChoicePracticeActivity extends BasePracticeActivityCommon {
  readonly interactionKind: "choice";
  readonly options: readonly BasePracticeOptionView[];
  readonly correctOptionId: string;
}

export interface BaseTileOrderingPracticeActivity extends BasePracticeActivityCommon {
  readonly interactionKind: "tile-ordering";
  readonly tiles: readonly BasePracticeTileView[];
  readonly correctTileIds: readonly string[];
}

export interface BaseRevealPracticeActivity extends BasePracticeActivityCommon {
  readonly interactionKind: "reveal";
  readonly promptTokens: readonly AssembledToken[] | null;
  readonly answerTokens: readonly AssembledToken[];
}

export interface BaseListeningPracticeActivity extends BasePracticeActivityCommon {
  readonly interactionKind: "listening";
  readonly playback: BaseListeningPlayback;
  readonly options: readonly BasePracticeOptionView[];
  readonly correctOptionId: string;
}

export interface BaseSpokenPracticeActivity extends BasePracticeActivityCommon {
  readonly interactionKind: "spoken";
  readonly tokens: readonly AssembledToken[];
}

export type BasePracticeActivity =
  | BaseChoicePracticeActivity
  | BaseTileOrderingPracticeActivity
  | BaseRevealPracticeActivity
  | BaseListeningPracticeActivity
  | BaseSpokenPracticeActivity;

export interface BasePracticeModel {
  readonly lessonId: string;
  readonly activities: readonly BasePracticeActivity[];
}

export type BasePracticeModelErrorCode = "unknown-lesson" | "invalid-practice";

export interface BasePracticeModelError {
  readonly code: BasePracticeModelErrorCode;
  readonly lessonId: string;
  readonly referenceId: string;
}

export type BasePracticeModelResult =
  | { readonly ok: true; readonly model: BasePracticeModel }
  | { readonly ok: false; readonly error: BasePracticeModelError };

function failure(
  code: BasePracticeModelErrorCode,
  lessonId: string,
  referenceId: string,
): BasePracticeModelResult {
  return { ok: false, error: { code, lessonId, referenceId } };
}

function singleToken(id: string, jp: string, romaji: string): AssembledToken {
  return {
    id,
    jp,
    romaji,
    kind: "lexical",
    boundaryBefore: "attach",
    source: { domain: "catalog", referenceId: id },
  };
}

function modeFor(category: BaseActivityKind): BasePracticeActivityCommon["mode"] {
  if (category === "listening") return "listening";
  if (category === "spoken") return "spoken";
  return "non-spoken";
}

function fingerprintFor(tokens: readonly AssembledToken[]): string {
  return opaqueTargetKey(visibleSurfaceFingerprint(tokens));
}

const soundLessonByLessonId: ReadonlyMap<
  string,
  { readonly activityDesigns: readonly BaseSoundActivityDesign[] }
> = new Map(
  BASE_SOUND_MODULE.lessons.map((lesson) => [
    lesson.content.lessonId,
    { activityDesigns: lesson.activityDesigns },
  ]),
);

function phoneticDesignFor(
  lessonId: string,
  activityId: string,
): BaseSoundActivityDesign | undefined {
  return soundLessonByLessonId
    .get(lessonId)
    ?.activityDesigns.find((design) => design.activityId === activityId);
}

function phoneticTargetToken(targetId: string): AssembledToken | undefined {
  const target = BASE_SOUND_TARGET_BY_ID.get(targetId);
  return target ? singleToken(target.id, target.kana, target.romaji) : undefined;
}

/** Builds a phonetic (`sounds-*`) activity: every non-spoken phonetic design
 * is authored with 2-3 options and one correct index (see
 * `module01Sounds.ts`'s `ACTIVITY_SURFACES`), so every non-spoken phonetic
 * activity renders as `choice` here regardless of its authored
 * `interactionKind` label — an honest reflection of what is actually
 * authored, not a fabricated tile/completion mechanic over option data. */
function buildPhoneticActivity(
  lessonId: string,
  activity: BaseActivityDefinition,
): BasePracticeActivity | null {
  const design = phoneticDesignFor(lessonId, activity.id);
  if (!design) return null;
  const mode = modeFor(activity.category);
  const common = {
    id: activity.id,
    mode,
    category: activity.category,
    kind: activity.category,
    instructionCopyId: activity.instructionCopyId,
    acceptedFeedbackCopyId: activity.acceptedFeedbackCopyId,
    retryFeedbackCopyId: activity.retryFeedbackCopyId,
  };

  if (mode === "spoken") {
    const answerToken = phoneticTargetToken(design.answerTargetId);
    if (!answerToken) return null;
    return {
      ...common,
      interactionKind: "spoken",
      tokens: [answerToken],
      fingerprint: fingerprintFor([answerToken]),
    };
  }

  const optionTokens = design.optionTargetIds
    .map((id) => phoneticTargetToken(id))
    .filter((token): token is AssembledToken => token !== undefined);
  if (optionTokens.length !== design.optionTargetIds.length) return null;
  const options: BasePracticeOptionView[] = optionTokens.map((token) => ({
    id: opaqueTargetKey(token.id),
    tokens: [token],
  }));
  const correctToken = design.correctOptionTargetId
    ? phoneticTargetToken(design.correctOptionTargetId)
    : undefined;
  if (!correctToken) return null;
  const correctOptionId = opaqueTargetKey(correctToken.id);

  if (mode === "listening") {
    const audioRecord = design.canonicalAudioId
      ? baseAudioRecordById(design.canonicalAudioId)
      : null;
    const playback: BaseListeningPlayback = audioRecord
      ? { kind: "asset", assetId: audioRecord.id }
      : { kind: "synthesis", tokens: [correctToken] };
    return {
      ...common,
      interactionKind: "listening",
      playback,
      options,
      correctOptionId,
      fingerprint: fingerprintFor([correctToken]),
    };
  }

  return {
    ...common,
    interactionKind: "choice",
    options,
    correctOptionId,
    fingerprint: fingerprintFor([correctToken]),
  };
}

/** Builds a semantic (non-phonetic) activity purely from the flattened
 * `BaseActivityDefinition` plus the frozen synthesis catalog's generic
 * target/option/prompt resolvers — no per-module rich object is required.
 * Listening's correct option cannot be found by id equality (its `targetId`
 * names a separate audio-only entry), so it is resolved by matching the
 * audio target's own visible surface against each option's — true because
 * the authoring pipeline stores the exact same target object as both the
 * audio target and the correct option for every listening activity. */
function buildSemanticActivity(
  activity: BaseActivityDefinition,
  catalogs: BaseValidationCatalogs,
  lessonId: string,
): BasePracticeActivity | null {
  const mode = modeFor(activity.category);
  const common = {
    id: activity.id,
    mode,
    category: activity.category,
    kind: activity.category,
    instructionCopyId: activity.instructionCopyId,
    acceptedFeedbackCopyId: activity.acceptedFeedbackCopyId,
    retryFeedbackCopyId: activity.retryFeedbackCopyId,
  };

  const targetReference = activityTargetReferenceFor(activity, catalogs);
  if (!targetReference || targetReference.invalidReason) return null;

  if (mode === "spoken") {
    return {
      ...common,
      interactionKind: "spoken",
      tokens: targetReference.target.tokens,
      fingerprint: fingerprintFor(targetReference.target.tokens),
    };
  }

  const optionReferences = activityOptionTargetReferencesFor(activity, catalogs);
  const options: BasePracticeOptionView[] = optionReferences.map((reference) => ({
    id: opaqueTargetKey(reference.referenceId),
    tokens: reference.target.tokens,
  }));

  if (mode === "listening") {
    if (options.length === 0) return null;
    const audioSurface = visibleSurfaceFingerprint(targetReference.target.tokens);
    const correct = options.find(
      (option) => visibleSurfaceFingerprint(option.tokens) === audioSurface,
    );
    if (!correct) return null;
    return {
      ...common,
      interactionKind: "listening",
      playback: { kind: "synthesis", tokens: targetReference.target.tokens },
      options,
      correctOptionId: correct.id,
      fingerprint: fingerprintFor(targetReference.target.tokens),
    };
  }

  if (activity.interactionKind === "choice") {
    if (options.length === 0) return null;
    const correct = options.find((option) => {
      const reference = optionReferences.find((entry) => opaqueTargetKey(entry.referenceId) === option.id);
      return reference?.referenceId === activity.targetId;
    });
    if (!correct) return null;
    return {
      ...common,
      interactionKind: "choice",
      options,
      correctOptionId: correct.id,
      fingerprint: fingerprintFor(targetReference.target.tokens),
    };
  }

  if (activity.interactionKind === "tile-ordering") {
    const tokens = targetReference.target.tokens;
    if (tokens.length === 0) return null;
    const tiles: BasePracticeTileView[] = tokens.map((token) => ({
      id: opaqueTargetKey(`${activity.id}#${token.id}`),
      token,
    }));
    return {
      ...common,
      interactionKind: "tile-ordering",
      tiles,
      correctTileIds: tiles.map((tile) => tile.id),
      fingerprint: fingerprintFor(tokens),
    };
  }

  // completion | constrained-construction | transformation: a reveal-and-
  // self-check activity. The prompt (context) may be absent for some
  // categories; the answer is always the resolved target's own tokens.
  const promptReference = activityPromptTargetReferenceFor(lessonId, activity, catalogs);
  return {
    ...common,
    interactionKind: "reveal",
    promptTokens:
      promptReference && !promptReference.invalidReason
        ? promptReference.target.tokens
        : null,
    answerTokens: targetReference.target.tokens,
    fingerprint: fingerprintFor(targetReference.target.tokens),
  };
}

/**
 * Builds the deterministic practice model for one Base lesson. Fail-closed:
 * an unknown lesson id or any activity whose authored reference cannot be
 * resolved through the frozen catalogs surfaces as `invalid-practice` rather
 * than a partial or silently-dropped activity list.
 */
export function buildBasePracticeModel(lessonId: string): BasePracticeModelResult {
  const manifest = baseLessonManifestEntry(lessonId);
  if (!manifest) return failure("unknown-lesson", lessonId, lessonId);
  const content = baseCanonicalCatalog.lessonById.get(lessonId);
  if (!content) return failure("unknown-lesson", lessonId, lessonId);

  const activities: BasePracticeActivity[] = [];
  if (content.contract === "phonetic") {
    for (const activity of content.activities) {
      const built = buildPhoneticActivity(lessonId, activity);
      if (!built) return failure("invalid-practice", lessonId, activity.id);
      activities.push(built);
    }
  } else {
    for (const activity of content.activities) {
      const built = buildSemanticActivity(activity, BASE_SYNTHESIS_VALIDATION_CATALOGS, lessonId);
      if (!built) return failure("invalid-practice", lessonId, activity.id);
      activities.push(built);
    }
  }

  return { ok: true, model: { lessonId, activities } };
}

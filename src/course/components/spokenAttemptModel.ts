import type { Locale } from "../../i18n/LocaleContext";
import { formatRomaji } from "../../romaji/formatRomaji";
import type { AssembledToken } from "../../romaji/types";
import { assembledExamples } from "../catalog/assembleCourse";
import { curriculumExamples } from "../catalog/examples";
import { speechPromptByLessonId } from "../catalog/speechPrompts";
import type { SpeechPromptCatalogEntry } from "../catalog/types";
import { courseModules } from "../data/course";
import { exampleSegmentToAssembledToken } from "../data/romajiTokens";
import type { StaticExample } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import type { ExampleCopy } from "../i18n/types";
import {
  resolveSpeechPrompt,
  type SpeechExampleInput,
} from "../speech/evaluateTranscript";
import type { ResolvedSpeechPrompt } from "../speech/types";

/**
 * The pure spoken-attempt model (Slice D plan Task 3; design spec §5.3,
 * §12.3). It resolves a lesson's *existing* speech prompt, its shared target
 * example, the ordered comparison/critical segments, the derived Japanese +
 * romaji, and the localized lesson/example copy into a complete model — or a
 * structured error (design spec §16), never a partial success.
 *
 * The Japanese target lives once in the shared example catalog: this model
 * derives `targetJp`/`targetRomaji` and the per-segment views from it and never
 * copies a Japanese literal into localized copy. The resolved prompt it carries
 * is exactly what the recognizer's evaluator judges against, so the UI and the
 * evaluation can never drift apart.
 *
 * `getSpokenAttemptModel` binds the real catalogs; `buildSpokenAttemptModel`
 * takes injectable dependencies so every structured-failure branch is provable
 * without contriving malformed release data.
 */

/** One ordered comparison segment, resolved for display. */
export interface SpokenSegmentView {
  readonly id: string;
  readonly jp: string;
  readonly romaji: string;
  /** Hiragana reading for an assisted katakana loanword (ruby), when present. */
  readonly reading?: string;
  readonly kind: "word" | "particle" | "ending" | "punctuation";
  /** Whether this comparison segment is one of the prompt's critical segments. */
  readonly critical: boolean;
}

/** An accepted orthographic transcript variant, resolved for display. */
export interface SpokenVariantView {
  readonly exampleId: string;
  readonly jp: string;
  readonly romaji: string;
}

export interface SpokenAttemptModel {
  readonly lessonId: string;
  readonly speechPromptId: string;
  readonly targetExampleId: string;
  /** The resolved prompt the recognizer's evaluator compares against. */
  readonly prompt: ResolvedSpeechPrompt;
  /** The ordered comparison segments, each flagged critical or not. */
  readonly segments: readonly SpokenSegmentView[];
  /** The whole-sentence Japanese, derived from the segments (never authored). */
  readonly targetJp: string;
  /** The whole-sentence romaji, derived from the shared kana reading (spec §7). */
  readonly targetRomaji: string;
  /** The localized lesson title. */
  readonly lessonTitle: string;
  /** The localized meaning of the target sentence (no Japanese). */
  readonly meaning: string;
  /** An optional localized note on the target. */
  readonly note?: string;
  /** Any accepted transcript variants (empty when the target admits none). */
  readonly variants: readonly SpokenVariantView[];
}

export type SpokenAttemptModelErrorCode =
  | "missing-speech-prompt"
  | "unresolved-prompt"
  | "missing-target-example"
  | "missing-comparison-segment"
  | "missing-lesson-copy"
  | "missing-meaning-copy";

export interface SpokenAttemptModelError {
  readonly code: SpokenAttemptModelErrorCode;
  readonly lessonId: string;
  /** The unresolved reference (example/segment id) when relevant. */
  readonly referenceId?: string;
}

export type SpokenAttemptModelResult =
  | { readonly ok: true; readonly model: SpokenAttemptModel }
  | { readonly ok: false; readonly error: SpokenAttemptModelError };

/** The injectable dependency surface the pure builder reads. */
export interface SpokenAttemptModelDeps {
  /** The lesson's catalog speech-prompt entry, or undefined when absent. */
  readonly speechPrompt: (lessonId: string) => SpeechPromptCatalogEntry | undefined;
  /** Resolve a catalog entry into folded comparable text; may throw. */
  readonly resolvePrompt: (
    entry: SpeechPromptCatalogEntry,
  ) => ResolvedSpeechPrompt;
  /** The runtime example (with derived romaji/reading), or undefined. */
  readonly targetExample: (exampleId: string) => StaticExample | undefined;
  /** The localized lesson title, or undefined when copy is absent. */
  readonly lessonTitle: (lessonId: string) => string | undefined;
  /** The localized example meaning/note, or undefined when copy is absent. */
  readonly exampleCopy: (exampleId: string) => ExampleCopy | undefined;
}

function fail(
  code: SpokenAttemptModelErrorCode,
  lessonId: string,
  referenceId?: string,
): SpokenAttemptModelResult {
  return { ok: false, error: { code, lessonId, referenceId } };
}

/**
 * Build the model for a lesson from injected dependencies. It resolves the
 * prompt, maps every ordered comparison segment onto its shared runtime segment
 * (failing loudly on any unresolved reference), flags the critical subset, and
 * attaches the localized title and meaning. It never fabricates Japanese and
 * never returns a partial model alongside an error.
 */
export function buildSpokenAttemptModel(
  lessonId: string,
  deps: SpokenAttemptModelDeps,
): SpokenAttemptModelResult {
  const entry = deps.speechPrompt(lessonId);
  if (!entry) return fail("missing-speech-prompt", lessonId);

  let resolved: ResolvedSpeechPrompt;
  try {
    resolved = deps.resolvePrompt(entry);
  } catch {
    return fail("unresolved-prompt", lessonId, entry.targetExampleId);
  }

  const example = deps.targetExample(resolved.targetExampleId);
  if (!example?.segments) {
    return fail("missing-target-example", lessonId, resolved.targetExampleId);
  }

  const segmentById = new Map(
    example.segments
      .filter((segment): segment is typeof segment & { id: string } =>
        typeof segment.id === "string",
      )
      .map((segment) => [segment.id, segment]),
  );
  const critical = new Set(resolved.criticalSegmentIds);

  const segments: SpokenSegmentView[] = [];
  const targetTokens: AssembledToken[] = [];
  for (const segment of resolved.segments) {
    const runtime = segmentById.get(segment.id);
    if (!runtime) {
      return fail("missing-comparison-segment", lessonId, segment.id);
    }
    const token = exampleSegmentToAssembledToken(runtime);
    if (!token) {
      return fail("unresolved-prompt", lessonId, resolved.targetExampleId);
    }
    targetTokens.push(token);
    segments.push({
      id: segment.id,
      jp: runtime.jp,
      romaji: runtime.romaji,
      ...(runtime.reading ? { reading: runtime.reading } : {}),
      kind: runtime.kind,
      critical: critical.has(segment.id),
    });
  }

  const lessonTitle = deps.lessonTitle(lessonId);
  if (!lessonTitle) return fail("missing-lesson-copy", lessonId);

  const copy = deps.exampleCopy(resolved.targetExampleId);
  if (!copy) {
    return fail("missing-meaning-copy", lessonId, resolved.targetExampleId);
  }

  const formattedTarget = formatRomaji(targetTokens);
  if (!formattedTarget.ok) {
    return fail("unresolved-prompt", lessonId, resolved.targetExampleId);
  }

  const variants: SpokenVariantView[] = [];
  for (const variantId of entry.acceptedTranscriptVariantExampleIds) {
    const variant = deps.targetExample(variantId);
    if (variant) {
      variants.push({
        exampleId: variantId,
        jp: variant.jp,
        romaji: variant.romaji,
      });
    }
  }

  return {
    ok: true,
    model: {
      lessonId,
      speechPromptId: resolved.id,
      targetExampleId: resolved.targetExampleId,
      prompt: resolved,
      segments,
      targetJp: segments.map((segment) => segment.jp).join(""),
      targetRomaji: formattedTarget.text,
      lessonTitle,
      meaning: copy.translation,
      ...(copy.note ? { note: copy.note } : {}),
      variants,
    },
  };
}

// ── Real-catalog bindings ─────────────────────────────────────────────────────

const examplesById: ReadonlyMap<string, SpeechExampleInput> = new Map(
  curriculumExamples.map((example) => [example.id, example]),
);

const lessonById = new Map(
  courseModules.flatMap((module) =>
    module.lessons.map((lesson) => [lesson.id, lesson] as const),
  ),
);

/**
 * The complete spoken-attempt model for a lesson in a locale, or a structured
 * error. Bound to the release catalogs; the release catalog resolves every
 * lesson cleanly, and `spokenAttemptModel.test` proves all 40 lessons build.
 */
export function getSpokenAttemptModel(
  lessonId: string,
  locale: Locale,
): SpokenAttemptModelResult {
  const copy = getCourseCopy(locale);
  return buildSpokenAttemptModel(lessonId, {
    speechPrompt: (id) => speechPromptByLessonId.get(id),
    resolvePrompt: (entry) => resolveSpeechPrompt(entry, examplesById),
    targetExample: (id) => assembledExamples[id],
    lessonTitle: (id) => {
      const lesson = lessonById.get(id);
      if (!lesson) return undefined;
      return copy.lessons[lesson.titleCopyId]?.title;
    },
    exampleCopy: (id) => copy.examples[id],
  });
}

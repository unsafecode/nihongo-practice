import type { Locale } from "../../i18n/LocaleContext";
import { formatRomaji } from "../../romaji/formatRomaji";
import { buildA2FoundationViewModel } from "../a2/view/buildA2LessonViewModel";
import { getCourseCopy } from "../i18n/catalog";
import {
  resolvePromptFromTokens,
  segmentsFromTokens,
  type A1SpokenAttemptModelResult,
} from "./a1SpokenAttemptModel";

/**
 * The A2-native spoken-attempt model (Phase 3 Task 8), the exact A2 mirror of
 * `a1SpokenAttemptModel.ts`'s semantic branch: it builds a `SpokenAttemptModel`
 * by hand from the realized `AssembledToken`s of the lesson's guided-
 * construction target (`buildA2FoundationViewModel(...).guided.target`), reusing
 * the shared `segmentsFromTokens`/`resolvePromptFromTokens` helpers so an A2
 * spoken attempt is a full, honest citizen of the same
 * `SpokenAttemptView`/`createSpokenAttemptHandlers`/`evaluateTranscript`
 * pipeline as every A1 lesson's — no pronunciation grading, no transcript
 * persistence, no required microphone, and no network involved in producing or
 * judging the prompt (design spec §20 speech truthfulness). It never authors a
 * second copy of the Japanese: the target sentence comes only from the frozen
 * catalog's realized tokens.
 *
 * Reuses A1's `A1SpokenAttemptModelResult` shape (the same
 * `SpokenAttemptModel`/error contract) rather than declaring a parallel type.
 */
export function getA2SpokenAttemptModel(
  lessonId: string,
  locale: Locale,
): A1SpokenAttemptModelResult {
  const built = buildA2FoundationViewModel(lessonId, locale);
  if (!built.ok) {
    return { ok: false, error: { code: "guided-unavailable", lessonId, referenceId: built.error.code } };
  }

  const target = built.model.guided.target;
  const title = getCourseCopy(locale).lessons[lessonId]?.title;
  if (!title) {
    return { ok: false, error: { code: "missing-lesson-copy", lessonId } };
  }
  if (!target.translation) {
    return { ok: false, error: { code: "missing-meaning-copy", lessonId, referenceId: target.variantId } };
  }

  const formattedTarget = formatRomaji(target.tokens);
  if (!formattedTarget.ok) {
    const firstOffendingTokenId = formattedTarget.errors.find(
      (error) => error.tokenId !== undefined,
    )?.tokenId;
    return {
      ok: false,
      error: { code: "invalid-romaji-sequence", lessonId, referenceId: firstOffendingTokenId ?? target.variantId },
    };
  }

  const segments = segmentsFromTokens(target.tokens);
  const prompt = resolvePromptFromTokens(`a2-spoken-${lessonId}`, target.variantId, target.tokens);

  return {
    ok: true,
    model: {
      lessonId,
      speechPromptId: prompt.id,
      targetExampleId: target.variantId,
      prompt,
      segments,
      targetJp: segments.map((segment) => segment.jp).join(""),
      targetRomaji: formattedTarget.text,
      lessonTitle: title,
      meaning: target.translation,
      variants: [],
    },
  };
}

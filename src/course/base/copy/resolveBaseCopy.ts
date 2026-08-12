import type { Locale } from "../../../i18n/LocaleContext";
import { baseNavigationCopyEn } from "./en";
import { baseNavigationCopyIt } from "./it";

/**
 * The single shared locale-copy lookup for the Base level's `content`
 * dictionary (Task 14 re-review). `buildBaseLessonViewModel.ts` and
 * `buildBasePracticeModel.ts` both need the identical
 * non-empty-string-or-null resolution rule for an authored copy id — this
 * module is the one place that rule lives, so the two builders can never
 * silently drift into two different definitions of "resolved".
 */
export function baseLocalizedCopyContent(locale: Locale): Readonly<Record<string, string>> {
  return locale === "it" ? baseNavigationCopyIt.content : baseNavigationCopyEn.content;
}

/** Resolves a copy id to a non-empty localized string, or null when missing/blank. */
export function resolveBaseCopyText(locale: Locale, copyId: string): string | null {
  const value = baseLocalizedCopyContent(locale)[copyId];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

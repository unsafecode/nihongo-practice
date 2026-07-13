import type { Locale } from "../../i18n/LocaleContext";
import { it } from "./it";
import { en } from "./en";

export const courseCatalog = { it, en } as const;

export function getCourseCopy(locale: Locale) {
  return courseCatalog[locale];
}

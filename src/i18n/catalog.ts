import type { Locale } from "./LocaleContext";
import type { LocalePack } from "./types";
import { it } from "./it";
import { en } from "./en";

export const catalogs: Record<Locale, LocalePack> = { it, en };

export function getCatalog(locale: Locale): LocalePack {
  return catalogs[locale];
}

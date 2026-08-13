import type { Locale } from "../../../i18n/LocaleContext";
import type { LocalizedText } from "../types";
import type { AssembledToken } from "../../../romaji/types";

export type { Locale };

export interface StepViewProps<S> {
  readonly step: S;
  readonly locale: Locale;
  readonly onComplete: () => void;
}

export const pick = (text: LocalizedText, locale: Locale): string => text[locale];

export function joinTokens(tokens: readonly AssembledToken[]): { kana: string; romaji: string } {
  let kana = "";
  let romaji = "";
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const spaceBefore = i > 0 && t.boundaryBefore === "space";
    kana += t.jp;
    romaji += spaceBefore ? ` ${t.romaji}` : t.romaji;
  }
  return { kana, romaji };
}

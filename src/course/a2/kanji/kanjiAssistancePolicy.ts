/**
 * The A2 contextual kanji assistance policy (Phase 3 Task 3, locked decision
 * L3). This is the single source of truth for how much support a kanji
 * exposure receives, and it depends only on the exposure's `stage` — never on
 * the activity mode or the learner's global script preference. In
 * particular, an `assessed` exposure always resolves to hidden furigana and
 * withheld romaji in every recognition mode; there is no code path in this
 * policy that can be parameterized back to visible/allowed for an assessed
 * exposure, so a learner cannot use romaji/hiragana script settings to bypass
 * assessment.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type { KanjiActivityMode, KanjiAssistancePolicy, KanjiExposure, KanjiSupport } from "./kanjiTypes";

function supportFor(exposure: KanjiExposure, _mode: KanjiActivityMode): KanjiSupport {
  switch (exposure.stage) {
    case "first-supported":
    case "supported-retrieval":
      return { furigana: "visible", romaji: "allowed" };
    case "revealable":
      return { furigana: "revealable", romaji: "allowed" };
    case "assessed":
      return { furigana: "hidden", romaji: "not-shown" };
  }
}

export const a2KanjiAssistancePolicy: KanjiAssistancePolicy = deepFreeze({ supportFor });

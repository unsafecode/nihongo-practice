/**
 * The A2 contextual kanji assistance policy (Phase 3 Task 3, locked decision
 * L3). This is the single source of truth for how much support a kanji
 * exposure receives, and it depends only on the exposure's `stage` — never on
 * the activity mode or the learner's global script preference. In particular,
 * `revealable` and `assessed` exposures always withhold romaji in every mode;
 * there is no code path in this policy that can be parameterized back to
 * allowed for either of those stages, so a learner cannot use a romaji script
 * setting to bypass the retrieval effort at revealable or the assessment at
 * assessed.
 */

import { deepFreeze } from "../../foundations/deepFreeze";
import type { KanjiActivityMode, KanjiAssistancePolicy, KanjiExposure, KanjiSupport } from "./kanjiTypes";

function supportFor(exposure: KanjiExposure, _mode: KanjiActivityMode): KanjiSupport {
  switch (exposure.stage) {
    case "first-supported":
    case "supported-retrieval":
      return { furigana: "visible", romaji: "allowed" };
    case "revealable":
      // Reveal-on-demand must be effortful in every script mode. Leaving romaji
      // on here handed the answer to any learner in romaji mode and collapsed
      // the four-stage progression to three for them.
      return { furigana: "revealable", romaji: "not-shown" };
    case "assessed":
      return { furigana: "hidden", romaji: "not-shown" };
  }
}

export const a2KanjiAssistancePolicy: KanjiAssistancePolicy = deepFreeze({ supportFor });

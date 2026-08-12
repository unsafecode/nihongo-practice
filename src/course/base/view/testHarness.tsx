import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LocaleProvider } from "../../../i18n/LocaleContext";
import { ScriptProvider } from "../../../settings/ScriptContext";
import { ProgressProvider } from "../../progress/ProgressContext";
import { SpeechRecognitionProvider } from "../../speech/SpeechRecognitionContext";
import { getCourseCopy } from "../../i18n/catalog";
import type { BaseActivityCategory } from "../catalog/activityContracts";
import { BasePracticeActivityCard } from "../../components/base/BasePracticeSequence";
import { buildBasePracticeModel } from "./buildBasePracticeModel";

/**
 * Test-only rendering + canonical-answer helpers for Base practice
 * (Task 14). Production code must never import this module: it exists
 * exclusively so `*.test.tsx` files can render the real production
 * `BasePracticeActivityCard` inside real providers and independently read
 * the authored catalog's canonical/accepted answers for pre-attempt
 * leakage assertions. Keeping the answer-reading helper here (not in any
 * production module) is itself part of the leakage-safety contract: nothing
 * that ships imports this file.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface RenderedBaseActivity {
  readonly container: HTMLElement;
  readonly unmount: () => void;
}

/**
 * Renders the real `BasePracticeActivityCard` for one lesson's practice
 * activity at `index`, wrapped in the same providers a real lesson page
 * mounts under (`LocaleProvider`/`ScriptProvider`/`ProgressProvider`/
 * `SpeechRecognitionProvider`). Throws if the lesson/index does not resolve
 * — a fixture assumption failure, not a result a leakage test should treat
 * as "nothing to check".
 */
export function renderBaseActivity(lessonId: string, index: number): RenderedBaseActivity {
  const result = buildBasePracticeModel(lessonId);
  if (!result.ok) {
    throw new Error(`renderBaseActivity: practice model unavailable for "${lessonId}"`);
  }
  const activity = result.model.activities[index];
  if (!activity) {
    throw new Error(`renderBaseActivity: no activity at index ${index} for "${lessonId}"`);
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  act(() => {
    root.render(
      createElement(
        LocaleProvider,
        null,
        createElement(
          ScriptProvider,
          null,
          createElement(
            ProgressProvider,
            null,
            createElement(
              SpeechRecognitionProvider,
              null,
              createElement(BasePracticeActivityCard, {
                activity,
                idBase: `${lessonId}-${activity.id}`,
                copy: getCourseCopy("en"),
                onAttempt: () => {},
              }),
            ),
          ),
        ),
      ),
    );
  });

  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

/**
 * Reads the authored catalog's canonical/accepted answer text(s) for one
 * practice activity directly (test-only; never resolved through any
 * production rendering path).
 *
 * Only `tile-ordering` (whose full canonical *order* is hidden until the
 * tiles are placed) and `reveal` (whose answer is hidden until an explicit
 * reveal) have a genuine pre-attempt secret to check as forbidden text.
 * `choice`/`listening` activities render every option's real Japanese
 * (including the correct one) as ordinary visible content — the secret
 * there is *which* option is correct, never the text itself — so they
 * return an empty array; that property is instead checked by asserting no
 * DOM attribute marks the correct option (see `testHarness.test.tsx`). A
 * `spoken` activity has no pre-attempt secret at all: the sentence to say is
 * the visible prompt itself.
 */
export function canonicalAnswersForActivity(
  lessonId: string,
  index: number,
): readonly string[] {
  const result = buildBasePracticeModel(lessonId);
  if (!result.ok) return [];
  const activity = result.model.activities[index];
  if (!activity) return [];

  switch (activity.interactionKind) {
    case "choice":
    case "listening":
    case "spoken":
      return [];
    case "tile-ordering": {
      const tokenById = new Map(activity.tiles.map((tile) => [tile.id, tile.token]));
      const ordered = activity.correctTileIds
        .map((id) => tokenById.get(id)?.jp ?? "")
        .join("");
      return ordered.length > 0 ? [ordered] : [];
    }
    case "reveal":
      return [activity.answerTokens.map((token) => token.jp).join("")];
  }
}

const CATEGORY_ORDER: readonly BaseActivityCategory[] = [
  "meaning-comprehension",
  "form-function-discrimination",
  "ordering",
  "controlled-production",
  "transformation",
  "error-diagnosis",
  "contextual-response",
  "cumulative-retrieval",
];

/** Numeric counts per non-spoken category, in fixed taxonomy order. */
export function categoryCounts(
  activities: readonly { readonly category: string }[],
): number[] {
  return CATEGORY_ORDER.map(
    (category) => activities.filter((activity) => activity.category === category).length,
  );
}

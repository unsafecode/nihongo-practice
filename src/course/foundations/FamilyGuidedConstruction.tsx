import { Fragment } from "react";
import type { ReactElement } from "react";

import { Notice } from "../../components/Notice";
import { RomajiSequence } from "../../romaji/RomajiSequence";
import type { Script } from "../../settings/ScriptContext";
import type { VariationAxis } from "./types";
import type { CourseCopy } from "../i18n/types";
import { JapaneseSegmentText } from "../components/JapaneseSegmentText";
import type { FoundationLocalizedRow } from "./foundationViewModel";

export interface GuidedAxisLabel {
  readonly id: VariationAxis;
  readonly label: string;
}

export interface FamilyGuidedConstructionProps {
  readonly initial: FoundationLocalizedRow;
  readonly target: FoundationLocalizedRow;
  /** The semantic axes that actually change, resolved to localized text. */
  readonly activeAxes: readonly GuidedAxisLabel[];
  /** Target token ids whose slot semantic value differs from the initial. */
  readonly targetChangedTokenIds: readonly string[];
  readonly script: Script;
  readonly copy: CourseCopy["foundation"];
  readonly errorText: string;
  readonly idBase: string;
}

function JapaneseRow({
  row,
  changed,
}: {
  readonly row: FoundationLocalizedRow;
  readonly changed?: ReadonlySet<string>;
}): ReactElement {
  return (
    <span className="foundation-guided__jp" lang="ja">
      {row.tokens.map((token) => {
        const glyph = (
          <JapaneseSegmentText jp={token.jp} reading={token.reading} />
        );
        return changed?.has(token.id) ? (
          <mark key={token.id} className="foundation-guided__changed">
            {glyph}
          </mark>
        ) : (
          <Fragment key={token.id}>{glyph}</Fragment>
        );
      })}
    </span>
  );
}

/**
 * The same-family guided-construction board (design spec §10.3, §12): one
 * initial model sentence transformed into a target sentence within the same
 * sentence family, with the changed tokens marked in both scripts and every
 * changing semantic axis named as text. The board only renders when the two
 * rows genuinely share a family and at least one axis differs; any other
 * input yields a single localized notice and no partial board.
 */
export function FamilyGuidedConstruction({
  initial,
  target,
  activeAxes,
  targetChangedTokenIds,
  script,
  copy,
  errorText,
  idBase,
}: FamilyGuidedConstructionProps): ReactElement {
  const sameFamily = initial.familyId === target.familyId;
  const hasDelta = activeAxes.length > 0 && targetChangedTokenIds.length > 0;

  if (!sameFamily || !hasDelta) {
    return (
      <Notice
        tone="warning"
        title={copy.unavailableTitle}
        body={copy.unavailableBody}
      />
    );
  }

  const changed = new Set(targetChangedTokenIds);
  const showJapanese = script === "hiragana";

  return (
    <section
      className="foundation-guided"
      data-family-id={initial.familyId}
      aria-labelledby={`${idBase}-title`}
    >
      <h3 className="foundation-guided__title" id={`${idBase}-title`}>
        {copy.guidedTitle}
      </h3>
      <div className="foundation-guided__pair">
        <div className="foundation-guided__row" data-role="initial">
          <p className="foundation-guided__label">{copy.initialLabel}</p>
          {showJapanese ? <JapaneseRow row={initial} /> : null}
          <span className="foundation-guided__romaji">
            <RomajiSequence tokens={initial.tokens} errorText={errorText} />
          </span>
          <p className="foundation-guided__translation">{initial.translation}</p>
        </div>
        <div className="foundation-guided__row" data-role="target">
          <p className="foundation-guided__label">{copy.targetLabel}</p>
          {showJapanese ? <JapaneseRow row={target} changed={changed} /> : null}
          <span className="foundation-guided__romaji">
            <RomajiSequence
              tokens={target.tokens}
              highlightedTokenIds={targetChangedTokenIds}
              highlightClassName="foundation-guided__changed"
              errorText={errorText}
            />
          </span>
          <p className="foundation-guided__translation">{target.translation}</p>
        </div>
      </div>
      <div className="foundation-guided__axes">
        <p className="foundation-guided__axes-label">{copy.activeAxesLabel}</p>
        <ul className="foundation-guided__axes-list">
          {activeAxes.map((axis) => (
            <li key={axis.id} data-axis-id={axis.id}>
              {axis.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { useId, useState } from "react";
import type { ReactElement } from "react";

import { RomajiSequence } from "../../romaji/RomajiSequence";
import type { Script } from "../../settings/ScriptContext";
import type { CourseCopy } from "../i18n/types";
import { JapaneseSegmentText } from "../components/JapaneseSegmentText";
import type { FoundationLocalizedRow } from "./foundationViewModel";

export interface SentenceMatrixProps {
  readonly rows: readonly FoundationLocalizedRow[];
  /** The exact first three curated model variant ids (collapsed subset). */
  readonly initialVariantIds: readonly string[];
  readonly script: Script;
  readonly copy: CourseCopy["foundation"];
  /** Announced when a row's romaji cannot be assembled. */
  readonly errorText: string;
  readonly idBase: string;
}

/**
 * The rows visible for a given expansion state. Collapsed shows only the
 * curated subset (in authored order); expanded shows every authored row in
 * the exact authored order. Pure so node tests can prove both projections
 * without React state — the component's only state is the boolean `expanded`.
 */
export function visibleMatrixRows(
  rows: readonly FoundationLocalizedRow[],
  initialVariantIds: readonly string[],
  expanded: boolean,
): readonly FoundationLocalizedRow[] {
  if (expanded) return rows;
  const curated = new Set(initialVariantIds);
  return rows.filter((row) => curated.has(row.variantId));
}

function JapaneseRow({
  row,
}: {
  readonly row: FoundationLocalizedRow;
}): ReactElement {
  return (
    <span className="foundation-matrix__jp" lang="ja">
      {row.tokens.map((token) => (
        <JapaneseSegmentText
          key={token.id}
          jp={token.jp}
          reading={token.reading}
        />
      ))}
    </span>
  );
}

/**
 * The compact eight-model sentence matrix (design spec §10.3, §11). It shows
 * the three curated models by default and discloses all eight in authored
 * order on demand. Every row renders its adjacent Japanese, whole-sentence
 * romaji, natural translation, speaker role, and context; pro-dropped rows
 * additionally carry an omitted-subject note. Locale and script never reorder
 * the rows and no canonical Japanese answer is ever emitted as DOM metadata.
 */
export function SentenceMatrix({
  rows,
  initialVariantIds,
  script,
  copy,
  errorText,
  idBase,
}: SentenceMatrixProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const generatedId = useId();
  const regionId = `${idBase}-${generatedId}-rows`;
  const visible = visibleMatrixRows(rows, initialVariantIds, expanded);

  return (
    <section className="foundation-matrix" aria-labelledby={`${regionId}-title`}>
      <h3 className="foundation-matrix__title" id={`${regionId}-title`}>
        {copy.matrixTitle}
      </h3>
      <p className="foundation-matrix__intro">{copy.matrixIntro}</p>
      <ul className="foundation-matrix__rows" id={regionId}>
        {visible.map((row) => (
          <li
            key={row.variantId}
            className="foundation-matrix__row"
            data-variant-id={row.variantId}
            data-family-id={row.familyId}
            data-context-id={row.contextId}
            data-speaker-role-id={row.speakerRoleId}
            data-semantic-fingerprint={row.semanticFingerprint}
          >
            <div className="foundation-matrix__sentence">
              {script === "hiragana" ? <JapaneseRow row={row} /> : null}
              <span className="foundation-matrix__romaji">
                <RomajiSequence tokens={row.tokens} errorText={errorText} />
              </span>
            </div>
            <p className="foundation-matrix__translation">{row.translation}</p>
            <dl className="foundation-matrix__meta">
              <div className="foundation-matrix__meta-pair">
                <dt>{copy.speakerLabel}</dt>
                <dd>{row.speaker}</dd>
              </div>
              <div className="foundation-matrix__meta-pair">
                <dt>{copy.contextLabel}</dt>
                <dd>{row.context}</dd>
              </div>
            </dl>
            {row.subjectRealization === "omitted" ? (
              <p className="foundation-matrix__omitted">{copy.omittedSubject}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="action action--secondary foundation-matrix__toggle"
        aria-expanded={expanded}
        aria-controls={regionId}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? copy.showFewer : copy.showAll}
      </button>
    </section>
  );
}

import type { ReactElement } from "react";
import { useParams, useSearchParams } from "react-router";
import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import { RomajiSequence } from "../../romaji/RomajiSequence";
import { BASE_LESSON_IDS } from "../base/manifest";
import {
  buildBaseReferenceViewModel,
  type BaseReferenceLocale,
} from "../base/references/buildReferenceViewModel";
import { BASE_REFERENCE_IDS, type BaseReferenceId } from "../base/references/catalog";
import { getCourseCopy } from "../i18n/catalog";
import { JapaneseSegmentText } from "./JapaneseSegmentText";

const BASE_LESSON_ID_SET: ReadonlySet<string> = new Set(BASE_LESSON_IDS);
const BASE_REFERENCE_ID_SET: ReadonlySet<string> = new Set(BASE_REFERENCE_IDS);

function isBaseLessonId(value: string): boolean {
  return BASE_LESSON_ID_SET.has(value);
}

function isBaseReferenceId(value: string): value is BaseReferenceId {
  return BASE_REFERENCE_ID_SET.has(value);
}

/**
 * The Base level's standalone reference surface
 * (`/riferimenti/base/:referenceId`, Task 15). Unlike the lesson route, an
 * unrecognized reference id or an invalid `throughLessonId` never
 * redirects — both render a visible, in-place `role="alert"` (via
 * `Notice`'s `tone="error"`), so a bad deep link is honest about what went
 * wrong instead of silently landing on the course map, or worse, silently
 * defaulting to showing the whole reference regardless of what the link
 * actually named.
 *
 * `throughLessonId` gates progressive disclosure: only entries/cells taught
 * at or before that lesson are shown (`buildBaseReferenceViewModel`), so a
 * reference opened early in the course never leaks a later grammar point.
 * It is validated against the real Base lesson order: a non-Base lesson id
 * — including a real A1/A2 lesson id — is exactly as invalid as a nonsense
 * string, since "progressive ownership" only has meaning within the Base
 * lesson list. When the URL omits it entirely, the reference defaults to
 * the end of the Base course (the full, unrestricted view) rather than
 * failing — only a *present but unrecognized* value is treated as invalid.
 */
export function BaseReferencePage(): ReactElement {
  const { referenceId } = useParams<{ referenceId: string }>();
  const [searchParams] = useSearchParams();
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const pageCopy = copy.baseReferencePage;

  const throughLessonIdParam = searchParams.get("throughLessonId");
  if (throughLessonIdParam !== null && !isBaseLessonId(throughLessonIdParam)) {
    return (
      <main className="base-reference-page">
        <Notice
          tone="error"
          title={pageCopy.invalidThroughLessonTitle}
          body={pageCopy.invalidThroughLessonBody}
        />
      </main>
    );
  }

  if (!referenceId || !isBaseReferenceId(referenceId)) {
    return (
      <main className="base-reference-page">
        <Notice
          tone="error"
          title={pageCopy.unknownReferenceTitle}
          body={pageCopy.unknownReferenceBody}
        />
      </main>
    );
  }

  const throughLessonId =
    throughLessonIdParam ?? BASE_LESSON_IDS[BASE_LESSON_IDS.length - 1]!;
  const result = buildBaseReferenceViewModel(
    referenceId,
    throughLessonId,
    locale as BaseReferenceLocale,
  );

  if (!result.ok) {
    return (
      <main className="base-reference-page">
        <Notice
          tone="error"
          title={pageCopy.unavailableTitle}
          body={pageCopy.unavailableBody}
        />
      </main>
    );
  }

  const { model } = result;
  const errorText = copy.lesson.contentFormattingError;

  return (
    <main className="base-reference-page" data-reference-id={model.id}>
      <header className="base-reference-page__header">
        <h1>{model.label}</h1>
        <p className="base-reference-page__explanation">{model.explanation}</p>
      </header>

      <table className="base-reference-page__grid" aria-label={pageCopy.tableViewLabel}>
        <caption>{model.grid.caption}</caption>
        <thead>
          <tr>
            <th scope="col" />
            {model.grid.columns.map((column) => (
              <th key={column.id} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.grid.rows.map((row) => (
            <tr key={row.id} data-row-id={row.id}>
              <th scope="row">{row.header}</th>
              {row.cells.map((cell) => (
                <td key={cell.columnId} data-column-id={cell.columnId}>
                  <span className="base-reference-page__cell-japanese" lang="ja">
                    {cell.value.map((token) => (
                      <JapaneseSegmentText key={token.id} jp={token.jp} reading={token.reading} />
                    ))}
                  </span>
                  <span className="base-reference-page__cell-romaji">
                    <RomajiSequence tokens={cell.value} errorText={errorText} />
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/*
        Stacked cards are generated one-for-one from the same rows the table
        above renders — never a separately-authored duplicate — so a mobile
        layout always shows exactly the entries the table shows.
      */}
      <ul
        className="base-reference-page__stacked-cards"
        aria-label={pageCopy.cardsViewLabel}
      >
        {model.stackedRows.map((row) => (
          <li
            key={row.id}
            className="base-reference-page__stacked-card"
            data-row-id={row.id}
          >
            <h2 className="base-reference-page__stacked-card-heading">{row.header}</h2>
            <dl className="base-reference-page__stacked-card-cells">
              {row.cells.map((cell) => (
                <div key={cell.columnId} data-column-id={cell.columnId}>
                  <dt>{cell.label}</dt>
                  <dd lang="ja">
                    <span className="base-reference-page__cell-japanese">
                      {cell.value.map((token) => (
                        <JapaneseSegmentText key={token.id} jp={token.jp} reading={token.reading} />
                      ))}
                    </span>{" "}
                    <span className="base-reference-page__cell-romaji">
                      <RomajiSequence tokens={cell.value} errorText={errorText} />
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </main>
  );
}

import type { ReactElement } from "react";
import { Notice } from "../../components/Notice";
import { useLocale } from "../../i18n/LocaleContext";
import { RomajiSequence } from "../../romaji/RomajiSequence";
import type { AssembledToken } from "../../romaji/types";
import { useScript } from "../../settings/ScriptContext";
import type { LessonSectionId } from "../../routing/lessonSections";
import {
  buildA1LessonViewModel,
  foundationAxisLabel,
} from "../a1/a1LessonViewModel";
import {
  a1ContrastFeatureCopyId,
  a1PhoneticOutcomeCopyId,
  module1ItemsByLesson,
  type A1PhoneticItem,
} from "../a1/catalog/module01Sounds";
import type { FoundationLocalizedRow } from "../foundations/buildLessonViewModel";
import { FamilyGuidedConstruction } from "../foundations/FamilyGuidedConstruction";
import { SentenceMatrix } from "../foundations/SentenceMatrix";
// `foundation.css` styles `SentenceMatrix`/`FamilyGuidedConstruction`
// (`.foundation-matrix*` / `.foundation-guided*`) — both render on every
// "semantic rule" A1 lesson via this page. The file previously shipped only
// as a side effect of the compile-time-gated `FoundationFixturePage` import,
// so a real `npm run build` (no `VITE_FOUNDATION_FIXTURES` flag) tree-shook
// it out entirely, leaving these two components completely unstyled in
// production. Import it here directly so it is part of the real bundle
// regardless of the fixture flag.
import "../foundations/foundation.css";
import { getCourseCopy } from "../i18n/catalog";
import { JapaneseSegmentText } from "./JapaneseSegmentText";
import { A1SpokenAttempt } from "./A1SpokenAttempt";
import { assembledTokenForPhoneticItem } from "./a1SpokenAttemptModel";
import { LessonExercises } from "./LessonExercises";

/**
 * The A1 release's deep lesson body (Phase 2 Task 6, master task point 2).
 * `LessonPage.tsx` delegates every section's content to this one dispatcher
 * instead of the legacy per-lesson `LessonSection` data shape, which no A1
 * lesson populates (`data/course.ts`'s `Lesson.sections` stays `undefined`
 * for every A1 lesson by design).
 *
 * Two content sources exist, matching the two lesson contracts the release
 * catalog validates (`a1/types.ts`):
 *
 *   - The 44 semantic lessons resolve through {@link buildA1LessonViewModel},
 *     reusing the exact Phase 1 foundation components ({@link SentenceMatrix},
 *     {@link FamilyGuidedConstruction}) so the compact eight-model matrix and
 *     the same-family guided construction ("honest comparison") are never
 *     reimplemented here — only wired.
 *   - The four phonetic `sounds-*` lessons have no sentence variants at all
 *     (`a1FoundationCatalogs` excludes them); their rule/comparison content is
 *     rendered directly from `module01Sounds.ts`'s validated item roster and
 *     minimal-pair contrasts instead.
 *
 * Every anchor keeps the plan's rule/comparison/explore/recap meaning:
 * rule teaches, comparison contrasts honestly, explore is round 1 + round 2
 * transfer plus the optional spoken attempt, and recap restates the Can-do,
 * what varied, the lesson's vocabulary, and the honest note that anything
 * missed returns to review — never a certification/mastery/completion claim
 * (§3.1).
 */
export function A1LessonSection({
  lessonId,
  sectionId,
}: {
  readonly lessonId: string;
  readonly sectionId: LessonSectionId;
}): ReactElement | null {
  const { locale } = useLocale();
  const { script } = useScript();
  const copy = getCourseCopy(locale);
  const phoneticItems = module1ItemsByLesson[lessonId];

  if (phoneticItems) {
    return (
      <PhoneticSection
        lessonId={lessonId}
        sectionId={sectionId}
        items={phoneticItems}
        script={script}
        copy={copy}
      />
    );
  }

  return (
    <SemanticSection
      lessonId={lessonId}
      sectionId={sectionId}
      locale={locale}
      script={script}
      copy={copy}
    />
  );
}

// ---------------------------------------------------------------------------
// Semantic lessons (44 of the 48)
// ---------------------------------------------------------------------------

/**
 * Every distinct lexical (content-word) token across the matrix's rows, in
 * first-seen authored order, de-duplicated by its written form so a word
 * repeated across model rows (e.g. the same verb under a different subject)
 * appears once in the recap — never fabricated, always the release's own
 * realized tokens.
 */
export function distinctLexicalTokens(
  rows: readonly FoundationLocalizedRow[],
): readonly AssembledToken[] {
  const seen = new Set<string>();
  const result: AssembledToken[] = [];
  for (const row of rows) {
    for (const token of row.tokens) {
      if (token.kind !== "lexical") continue;
      const key = `${token.jp}\u0000${token.romaji}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(token);
    }
  }
  return result;
}

function SemanticSection({
  lessonId,
  sectionId,
  locale,
  script,
  copy,
}: {
  readonly lessonId: string;
  readonly sectionId: LessonSectionId;
  readonly locale: ReturnType<typeof useLocale>["locale"];
  readonly script: ReturnType<typeof useScript>["script"];
  readonly copy: ReturnType<typeof getCourseCopy>;
}): ReactElement | null {
  const result = buildA1LessonViewModel(lessonId, locale);
  if (!result.ok) {
    return (
      <Notice
        tone="warning"
        title={copy.foundation.unavailableTitle}
        body={copy.foundation.unavailableBody}
      />
    );
  }
  const { model } = result;
  const errorText = copy.lesson.contentFormattingError;

  switch (sectionId) {
    case "rule":
      return (
        <div className="a1-lesson-rule">
          <p className="a1-lesson-rule__can-do">{model.canDoDescriptor}</p>
          <SentenceMatrix
            rows={model.matrix.rows}
            initialVariantIds={model.matrix.initialVariantIds}
            script={script}
            copy={copy.foundation}
            errorText={errorText}
            idBase={`${lessonId}-matrix`}
          />
        </div>
      );

    case "comparison": {
      const activeAxes = model.guided.activeAxes.map((id) => ({
        id,
        label: foundationAxisLabel(id, locale),
      }));
      return (
        <FamilyGuidedConstruction
          initial={model.guided.initial}
          target={model.guided.target}
          activeAxes={activeAxes}
          targetChangedTokenIds={model.guided.targetChangedTokenIds}
          script={script}
          copy={copy.foundation}
          errorText={errorText}
          idBase={`${lessonId}-guided`}
        />
      );
    }

    case "explore":
      return (
        <>
          <LessonExercises lessonId={lessonId} />
          <A1SpokenAttempt lessonId={lessonId} />
        </>
      );

    case "recap": {
      const axisLabels = model.guided.activeAxes.map((id) =>
        foundationAxisLabel(id, locale),
      );
      const vocab = distinctLexicalTokens(model.matrix.rows);
      return (
        <RecapContent
          canDoText={model.canDoDescriptor}
          variationLabels={axisLabels}
          vocab={vocab}
          script={script}
          copy={copy}
        />
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Phonetic lessons (sounds-1..sounds-4)
// ---------------------------------------------------------------------------

function contrastPartnerMap(
  items: readonly A1PhoneticItem[],
): ReadonlyMap<string, A1PhoneticItem> {
  return new Map(items.map((item) => [item.id, item] as const));
}

function ItemGlyph({
  item,
  script,
  errorText,
}: {
  readonly item: A1PhoneticItem;
  readonly script: ReturnType<typeof useScript>["script"];
  readonly errorText: string;
}): ReactElement {
  return (
    <span className="a1-phonetic-item__glyph">
      {script === "hiragana" ? (
        <span lang="ja" className="a1-phonetic-item__jp">
          <JapaneseSegmentText jp={item.glyph} />
        </span>
      ) : null}
      <RomajiSequence
        tokens={[assembledTokenForPhoneticItem(item)]}
        errorText={errorText}
      />
    </span>
  );
}

export function PhoneticSection({
  lessonId,
  sectionId,
  items,
  script,
  copy,
}: {
  readonly lessonId: string;
  readonly sectionId: LessonSectionId;
  readonly items: readonly A1PhoneticItem[];
  readonly script: ReturnType<typeof useScript>["script"];
  readonly copy: ReturnType<typeof getCourseCopy>;
}): ReactElement | null {
  const errorText = copy.lesson.contentFormattingError;

  switch (sectionId) {
    case "rule":
      return (
        <ul className="a1-phonetic-roster">
          {items.map((item) => (
            <li
              key={item.id}
              className="a1-phonetic-roster__item"
              data-item-id={item.id}
            >
              <ItemGlyph item={item} script={script} errorText={errorText} />
              <p className="a1-phonetic-roster__hint">
                {copy.phonetics[item.hintCopyId]}
              </p>
            </li>
          ))}
        </ul>
      );

    case "comparison": {
      const byId = contrastPartnerMap(items);
      return (
        <ul className="a1-phonetic-contrasts">
          {items.map((item) => {
            const partner = byId.get(item.contrastWithId);
            return (
              <li
                key={item.id}
                className="a1-phonetic-contrasts__pair"
                data-item-id={item.id}
                data-contrast-with-id={item.contrastWithId}
              >
                <p className="a1-phonetic-contrasts__feature">
                  {copy.phonetics[a1ContrastFeatureCopyId(item.contrastFeature)]}
                </p>
                <div className="a1-phonetic-contrasts__row" data-role="item">
                  <ItemGlyph item={item} script={script} errorText={errorText} />
                </div>
                <div className="a1-phonetic-contrasts__row" data-role="contrast">
                  {partner ? (
                    // `validateA1.ts`'s release gate (phonetic-dangling-contrast /
                    // the I2 phonetic-contrast-cross-lesson check) is what actually
                    // keeps every contrastWithId resolvable within this same
                    // lesson's own roster before the app ships. This branch is
                    // defense-in-depth only — but "defensive" must still mean
                    // fail-closed and visible, never a silently vanished row, so
                    // an unresolved partner (which should never occur in a
                    // validated release) renders the same localized formatting
                    // error the rest of the app surfaces for a broken token.
                    <ItemGlyph item={partner} script={script} errorText={errorText} />
                  ) : (
                    <p className="a1-phonetic-contrasts__error" role="status">
                      {errorText}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    case "explore":
      return (
        <>
          <LessonExercises lessonId={lessonId} />
          <A1SpokenAttempt lessonId={lessonId} />
        </>
      );

    case "recap": {
      const outcome = copy.phonetics[a1PhoneticOutcomeCopyId(lessonId)];
      const distinctFeatures = [...new Set(items.map((item) => item.contrastFeature))];
      const variationLabels = distinctFeatures.map(
        (feature) => copy.phonetics[a1ContrastFeatureCopyId(feature)],
      );
      const vocab = items.map((item) => assembledTokenForPhoneticItem(item));
      return (
        <RecapContent
          canDoText={outcome}
          variationLabels={variationLabels}
          vocab={vocab}
          script={script}
          copy={copy}
        />
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Shared recap content (Can-do restated / variation / vocab / next-retrieval)
// ---------------------------------------------------------------------------

export function RecapContent({
  canDoText,
  variationLabels,
  vocab,
  script,
  copy,
}: {
  readonly canDoText: string;
  readonly variationLabels: readonly string[];
  readonly vocab: readonly AssembledToken[];
  readonly script: ReturnType<typeof useScript>["script"];
  readonly copy: ReturnType<typeof getCourseCopy>;
}): ReactElement {
  const recapCopy = copy.lesson.recap;
  return (
    <div className="a1-lesson-recap">
      <p className="a1-lesson-recap__can-do" data-recap="can-do">
        <strong>{recapCopy.canDoLabel}: </strong>
        {canDoText}
      </p>

      {variationLabels.length > 0 ? (
        <div data-recap="variation">
          <h3>{recapCopy.variationLabel}</h3>
          <ul>
            {variationLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div data-recap="vocab">
        <h3>{recapCopy.vocabLabel}</h3>
        <ul className="a1-lesson-recap__vocab">
          {vocab.map((token) => (
            <li key={token.id}>
              {script === "hiragana" ? (
                <span lang="ja">
                  <JapaneseSegmentText jp={token.jp} reading={token.reading} />
                </span>
              ) : null}
              <span className="a1-lesson-recap__romaji">{token.romaji}</span>
            </li>
          ))}
        </ul>
      </div>

      <Notice
        tone="info"
        title={recapCopy.nextRetrievalTitle}
        body={recapCopy.nextRetrievalBody}
      />
    </div>
  );
}

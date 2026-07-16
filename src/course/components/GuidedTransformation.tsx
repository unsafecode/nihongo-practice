import { Fragment } from "react";
import { ActionLink } from "../../components/actions/Action";
import type { LabSelection } from "../../content/types";
import { useLocale } from "../../i18n/LocaleContext";
import { buildJapaneseSentence } from "../../lab/engine/japanese";
import { buildLabDeepLink } from "../../lab/presets";
import { RomajiSequence } from "../../romaji/RomajiSequence";
import type { AssembledToken } from "../../romaji/types";
import { useScript } from "../../settings/ScriptContext";
import { examples } from "../data/examples";
import { exampleSegmentToAssembledToken } from "../data/romajiTokens";
import type {
  AuthoredSelection,
  GuidedTransformationData,
} from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import { JapaneseSegmentText } from "./JapaneseSegmentText";

type ScriptField = "jp" | "romaji";

function isLabSelection(
  selection: LabSelection | AuthoredSelection,
): selection is LabSelection {
  return !("exampleId" in selection);
}

/** A deliberately invalid sentinel forcing `RomajiSequence`'s error path
 * (never a silent fallback) when an authored endpoint's segments cannot
 * resolve to real assembled tokens. */
const INVALID_TOKEN: AssembledToken = {
  id: "",
  jp: "",
  romaji: "",
  kind: "lexical",
  boundaryBefore: "attach",
  source: { domain: "catalog", referenceId: "" },
};

/**
 * Derives the visible endpoint's real assembled tokens. Lab endpoints reuse
 * the existing Japanese engine's own `AssembledToken[]`
 * (`buildJapaneseSentence(...).tokens`) so no grammar or boundary logic is
 * duplicated here; authored endpoints map their curated static segments
 * through the same shared `exampleSegmentToAssembledToken` every other
 * learner surface uses (master spec §13.2-13.3).
 */
function endpointTokens(
  selection: LabSelection | AuthoredSelection,
): readonly AssembledToken[] {
  if (isLabSelection(selection)) {
    return buildJapaneseSentence(selection).tokens;
  }
  const example = examples[selection.exampleId];
  const segments = example.segments ?? [];
  if (segments.length === 0) return [INVALID_TOKEN];
  return segments.map(
    (segment) => exampleSegmentToAssembledToken(segment) ?? INVALID_TOKEN,
  );
}

/**
 * The token ids whose trimmed Japanese glyph is one of the declared changed
 * gears, so each endpoint highlights exactly its side of the honest delta
 * that `validateExploration` has proven — independent of whether the
 * endpoint is Lab-engine or authored.
 */
function highlightedIdsFor(
  tokens: readonly AssembledToken[],
  changedGears: ReadonlySet<string>,
): readonly string[] {
  return tokens
    .filter((token) => changedGears.has(token.jp.trim()))
    .map((token) => token.id);
}

/**
 * Renders one endpoint's Japanese line: every token through the shared
 * {@link JapaneseSegmentText} (so a katakana loanword's first-exposure
 * hiragana reading, spec §7 §8.3, still shows as ruby exactly when the token
 * carries one), with no inter-token separator — Japanese never spaces
 * between words — and the declared changed tokens wrapped in `<mark>`.
 */
function EndpointJpLine({
  tokens,
  highlighted,
}: {
  tokens: readonly AssembledToken[];
  highlighted: ReadonlySet<string>;
}) {
  return (
    <>
      {tokens.map((token) => {
        const content = (
          <JapaneseSegmentText jp={token.jp} reading={token.reading} />
        );
        return highlighted.has(token.id) ? (
          <mark className="guided-board__gear" key={token.id}>
            {content}
          </mark>
        ) : (
          <Fragment key={token.id}>{content}</Fragment>
        );
      })}
    </>
  );
}

function Endpoint({
  label,
  tokens,
  highlightedTokenIds,
  errorText,
}: {
  label: string;
  tokens: readonly AssembledToken[];
  highlightedTokenIds: readonly string[];
  errorText: string;
}) {
  const { script } = useScript();
  const mainField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const subField: ScriptField = script === "hiragana" ? "romaji" : "jp";
  const highlighted = new Set(highlightedTokenIds);

  return (
    <div className="guided-board__state">
      <p className="guided-board__state-label">{label}</p>
      <p
        className={`guided-board__jp${
          mainField === "romaji" ? " is-romaji" : ""
        }`}
        lang={mainField === "jp" ? "ja" : undefined}
      >
        {mainField === "jp" ? (
          <EndpointJpLine tokens={tokens} highlighted={highlighted} />
        ) : (
          <RomajiSequence
            tokens={tokens}
            highlightedTokenIds={highlightedTokenIds}
            highlightClassName="guided-board__gear"
            errorText={errorText}
          />
        )}
      </p>
      <p
        className="guided-board__reading"
        lang={subField === "jp" ? "ja" : undefined}
      >
        {subField === "jp" ? (
          <EndpointJpLine tokens={tokens} highlighted={new Set()} />
        ) : (
          <RomajiSequence tokens={tokens} errorText={errorText} />
        )}
      </p>
    </div>
  );
}

/**
 * A compact dark-board guided transformation (design spec §6.4). It shows both
 * the initial and target states honestly derived from the lesson's declared
 * selections, highlights the gears that change with a redundant text
 * (`<mark>` + a labelled chip strip, never colour alone), and — for Lab-backed
 * transformations — offers an Action-styled link into the Lab carrying this
 * lesson's return path for Task 7 to wire. Authored transformations that the
 * Lab engine cannot model deliberately omit that link rather than claim an
 * interaction they cannot deliver.
 */
export function GuidedTransformation({
  data,
}: {
  data: GuidedTransformationData;
}) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const guided = copy.lesson.guided;
  const errorText = copy.lesson.contentFormattingError;
  const changedGears = new Set(data.changedGearIds);
  const initialTokens = endpointTokens(data.initialSelection);
  const targetTokens = endpointTokens(data.targetSelection);
  const initialHighlighted = highlightedIdsFor(initialTokens, changedGears);
  const targetHighlighted = highlightedIdsFor(targetTokens, changedGears);

  const labLink = (() => {
    if (
      !isLabSelection(data.initialSelection) ||
      !isLabSelection(data.targetSelection)
    ) {
      return null;
    }
    try {
      return buildLabDeepLink(data.targetSelection, {
        pathname: data.returnTarget.pathname,
        sectionId: data.returnTarget.sectionId,
      }).href;
    } catch {
      // A preset that cannot be serialized (e.g. an unknown slot/form) must
      // never open an unrelated default board disguised as this lesson's
      // transformation — omit the link instead.
      return null;
    }
  })();

  return (
    <div className="guided-board">
      <div className="guided-board__states">
        <Endpoint
          label={guided.initial}
          tokens={initialTokens}
          highlightedTokenIds={initialHighlighted}
          errorText={errorText}
        />
        <div className="guided-board__arrow" aria-hidden="true">
          ↓
        </div>
        <Endpoint
          label={guided.target}
          tokens={targetTokens}
          highlightedTokenIds={targetHighlighted}
          errorText={errorText}
        />
      </div>
      <div className="guided-board__changed">
        <p className="guided-board__changed-label">{guided.changed}</p>
        <ul className="guided-board__gears">
          {data.changedGearIds.map((gear) => (
            <li key={gear} className="guided-gear-chip">
              <span aria-hidden="true" className="guided-gear-chip__mark">
                ▸
              </span>
              <b lang="ja">{gear}</b>
            </li>
          ))}
        </ul>
      </div>
      {labLink ? (
        <ActionLink variant="secondary" to={labLink}>
          {copy.practice.openGuidedLab} →
        </ActionLink>
      ) : null}
    </div>
  );
}

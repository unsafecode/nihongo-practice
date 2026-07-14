import { Fragment } from "react";
import { ActionLink } from "../../components/actions/Action";
import type { LabSelection } from "../../content/types";
import { useLocale } from "../../i18n/LocaleContext";
import { buildJapaneseSentence } from "../../lab/engine/japanese";
import { buildLabDeepLink } from "../../lab/presets";
import { useScript } from "../../settings/ScriptContext";
import { examples } from "../data/examples";
import type {
  AuthoredSelection,
  GuidedTransformationData,
} from "../data/types";
import { getCourseCopy } from "../i18n/catalog";

type ScriptField = "jp" | "romaji";

interface EndpointToken {
  readonly jp: string;
  readonly romaji: string;
  readonly gear: boolean;
}

function isLabSelection(
  selection: LabSelection | AuthoredSelection,
): selection is LabSelection {
  return !("exampleId" in selection);
}

/**
 * Derives the visible endpoint tokens. Lab endpoints go through the existing
 * Japanese engine (`buildJapaneseSentence`) so no grammar logic is duplicated
 * here; authored endpoints render their curated static segments. A token is
 * flagged `gear` only when its trimmed glyph is one of the declared changed
 * gears, so each endpoint highlights exactly its side of the honest delta that
 * `validateExploration` has proven.
 */
function endpointTokens(
  selection: LabSelection | AuthoredSelection,
  changedGears: ReadonlySet<string>,
): EndpointToken[] {
  if (isLabSelection(selection)) {
    const model = buildJapaneseSentence(selection);
    const tokens: EndpointToken[] = [];
    for (const part of model.parts) {
      tokens.push({ jp: part.jp, romaji: part.romaji, gear: false });
      const gear = part.particle ?? part.suffix;
      if (gear) {
        tokens.push({
          jp: gear.jp,
          romaji: gear.romaji,
          gear: changedGears.has(gear.jp.trim()),
        });
      }
    }
    return tokens;
  }
  const example = examples[selection.exampleId];
  return (example.segments ?? []).map((segment) => ({
    jp: segment.jp,
    romaji: segment.romaji,
    gear: changedGears.has(segment.jp.trim()),
  }));
}

function EndpointLine({
  tokens,
  field,
  mark,
}: {
  tokens: EndpointToken[];
  field: ScriptField;
  mark: boolean;
}) {
  return (
    <>
      {tokens.map((token, index) =>
        mark && token.gear ? (
          <mark className="guided-board__gear" key={index}>
            {token[field]}
          </mark>
        ) : (
          <Fragment key={index}>{token[field]}</Fragment>
        ),
      )}
    </>
  );
}

function Endpoint({
  label,
  tokens,
}: {
  label: string;
  tokens: EndpointToken[];
}) {
  const { script } = useScript();
  const mainField: ScriptField = script === "hiragana" ? "jp" : "romaji";
  const subField: ScriptField = script === "hiragana" ? "romaji" : "jp";
  return (
    <div className="guided-board__state">
      <p className="guided-board__state-label">{label}</p>
      <p
        className={`guided-board__jp${
          mainField === "romaji" ? " is-romaji" : ""
        }`}
        lang={mainField === "jp" ? "ja" : undefined}
      >
        <EndpointLine tokens={tokens} field={mainField} mark />
      </p>
      <p
        className="guided-board__reading"
        lang={subField === "jp" ? "ja" : undefined}
      >
        <EndpointLine tokens={tokens} field={subField} mark={false} />
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
  const changedGears = new Set(data.changedGearIds);
  const initialTokens = endpointTokens(data.initialSelection, changedGears);
  const targetTokens = endpointTokens(data.targetSelection, changedGears);

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
        <Endpoint label={guided.initial} tokens={initialTokens} />
        <div className="guided-board__arrow" aria-hidden="true">
          ↓
        </div>
        <Endpoint label={guided.target} tokens={targetTokens} />
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

import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import type { BaseVerbLexeme } from "../catalog/types";

export type BaseVerbFormErrorCode = "unknown-lexeme" | "not-a-verb" | "invalid-verb-ending";

export interface BaseVerbFormError {
  readonly code: BaseVerbFormErrorCode;
  readonly lemmaId: string;
}

export type BaseFormResult<T> =
  | Readonly<{ readonly ok: true; readonly value: T }>
  | Readonly<{ readonly ok: false; readonly error: BaseVerbFormError }>;

export interface PoliteVerbGrid {
  readonly affirmative: readonly AssembledToken[];
  readonly negative: readonly AssembledToken[];
  readonly pastAffirmative: readonly AssembledToken[];
  readonly pastNegative: readonly AssembledToken[];
}

export type TeConstruction = "te" | "request" | "sequence" | "te-imasu";

const POLITE_STEM_BY_GODAN_ENDING: Readonly<Record<string, readonly [string, string]>> = {
  "う": ["い", "i"],
  "く": ["き", "ki"],
  "ぐ": ["ぎ", "gi"],
  "す": ["し", "shi"],
  "つ": ["ち", "chi"],
  "ぬ": ["に", "ni"],
  "ぶ": ["び", "bi"],
  "む": ["み", "mi"],
  "る": ["り", "ri"],
};

const TE_BY_GODAN_ENDING: Readonly<Record<string, readonly [string, string]>> = {
  "う": ["って", "tte"],
  "つ": ["って", "tte"],
  "る": ["って", "tte"],
  "む": ["んで", "nde"],
  "ぶ": ["んで", "nde"],
  "ぬ": ["んで", "nde"],
  "く": ["いて", "ite"],
  "ぐ": ["いで", "ide"],
  "す": ["して", "shite"],
};

function result<T>(value: T): BaseFormResult<T> {
  return Object.freeze({ ok: true, value });
}

function error(code: BaseVerbFormErrorCode, lemmaId: string): BaseFormResult<never> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, lemmaId }) });
}

function verbFor(lemmaId: string): BaseFormResult<BaseVerbLexeme> {
  const lexeme = BASE_LEXEME_BY_ID.get(lemmaId);
  if (!lexeme) return error("unknown-lexeme", lemmaId);
  if (lexeme.category !== "verb") return error("not-a-verb", lemmaId);
  return result(lexeme);
}

function token(
  id: string,
  jp: string,
  romaji: string,
  kind: AssembledToken["kind"],
  boundaryBefore: AssembledToken["boundaryBefore"],
  referenceId: string,
): AssembledToken {
  const assembled: AssembledToken = {
    id,
    jp,
    romaji,
    kind,
    boundaryBefore,
    source: { domain: "catalog", referenceId },
  };
  return Object.freeze(assembled);
}

function removeEnding(verb: BaseVerbLexeme): readonly [string, string, string] | undefined {
  const lastKana = verb.kana.slice(-1);
  const lastRomaji = verb.romaji.slice(-1);
  if (!lastKana || !lastRomaji) return undefined;
  return [verb.kana.slice(0, -1), verb.romaji.slice(0, -1), lastKana];
}

function politeStemParts(
  verb: BaseVerbLexeme,
): readonly [string, string] | undefined {
  if (verb.verbClass === "suru") return ["し", "shi"];
  if (verb.verbClass === "kuru") return ["き", "ki"];
  const ending = removeEnding(verb);
  if (!ending) return undefined;
  const [rootKana, rootRomaji, endingKana] = ending;
  if (verb.verbClass === "ichidan") return [rootKana, rootRomaji];
  const stemEnding = POLITE_STEM_BY_GODAN_ENDING[endingKana];
  if (!stemEnding) return undefined;
  return [`${rootKana}${stemEnding[0]}`, `${rootRomaji}${stemEnding[1]}`];
}

function teParts(verb: BaseVerbLexeme): readonly [string, string, string, string] | undefined {
  if (verb.teFormException) {
    return [
      verb.teFormException.stemKana,
      verb.teFormException.stemRomaji,
      verb.teFormException.endingKana,
      verb.teFormException.endingRomaji,
    ];
  }
  if (verb.verbClass === "suru") return ["し", "shi", "て", "te"];
  if (verb.verbClass === "kuru") return ["き", "ki", "て", "te"];
  const ending = removeEnding(verb);
  if (!ending) return undefined;
  const [rootKana, rootRomaji, endingKana] = ending;
  if (verb.verbClass === "ichidan") return [rootKana, rootRomaji, "て", "te"];
  const teEnding = TE_BY_GODAN_ENDING[endingKana];
  if (!teEnding) return undefined;
  return [rootKana, rootRomaji, teEnding[0], teEnding[1]];
}

function lexicalToken(
  verb: BaseVerbLexeme,
  idSuffix: string,
  jp: string,
  romaji: string,
): AssembledToken {
  return token(`${verb.id}-${idSuffix}`, jp, romaji, "lexical", "space", verb.id);
}

function appendMorpheme(
  tokens: readonly AssembledToken[],
  lemmaId: string,
  id: string,
  jp: string,
  romaji: string,
): readonly AssembledToken[] {
  return deepFreeze([
    ...tokens,
    token(`${lemmaId}-${id}`, jp, romaji, "morpheme", "attach", id),
  ]);
}

export function realizeVerbDictionary(
  lemmaId: string,
): BaseFormResult<readonly AssembledToken[]> {
  const verb = verbFor(lemmaId);
  if (!verb.ok) return verb;
  return result(verb.value.dictionaryTokens);
}

export function realizePoliteStem(
  lemmaId: string,
): BaseFormResult<readonly AssembledToken[]> {
  const verb = verbFor(lemmaId);
  if (!verb.ok) return verb;
  const stem = politeStemParts(verb.value);
  if (!stem) return error("invalid-verb-ending", lemmaId);
  return result(deepFreeze([lexicalToken(verb.value, "polite-stem", stem[0], stem[1])]));
}

export function realizePoliteNonpast(
  lemmaId: string,
): BaseFormResult<readonly AssembledToken[]> {
  const stem = realizePoliteStem(lemmaId);
  if (!stem.ok) return stem;
  return result(appendMorpheme(stem.value, lemmaId, "masu", "ます", "masu"));
}

export function realizePoliteGrid(lemmaId: string): BaseFormResult<PoliteVerbGrid> {
  const stem = realizePoliteStem(lemmaId);
  if (!stem.ok) return stem;
  return result(
    deepFreeze({
      affirmative: appendMorpheme(stem.value, lemmaId, "masu", "ます", "masu"),
      negative: appendMorpheme(stem.value, lemmaId, "masen", "ません", "masen"),
      pastAffirmative: appendMorpheme(stem.value, lemmaId, "mashita", "ました", "mashita"),
      pastNegative: appendMorpheme(
        stem.value,
        lemmaId,
        "masen-deshita",
        "ませんでした",
        "masen deshita",
      ),
    }),
  );
}

export function realizeTeConstruction(
  lemmaId: string,
  construction: TeConstruction,
): BaseFormResult<readonly AssembledToken[]> {
  const verb = verbFor(lemmaId);
  if (!verb.ok) return verb;
  const parts = teParts(verb.value);
  if (!parts) return error("invalid-verb-ending", lemmaId);
  const teId = construction === "sequence" ? "te-sequence" : "te";
  const teTokens = deepFreeze([
    lexicalToken(verb.value, "te-stem", parts[0], parts[1]),
    token(
      `${lemmaId}-${teId}`,
      parts[2],
      parts[3],
      "morpheme",
      "attach",
      teId,
    ),
  ]);
  if (construction === "te") return result(teTokens);
  if (construction === "sequence") return result(teTokens);
  if (construction === "request") {
    return result(appendMorpheme(teTokens, lemmaId, "kudasai", "ください", "kudasai"));
  }
  return result(appendMorpheme(teTokens, lemmaId, "imasu", "います", "imasu"));
}

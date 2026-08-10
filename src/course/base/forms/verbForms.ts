import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import type { BaseTeConstruction, BaseVerbLexeme } from "../catalog/types";

export type BaseVerbFormErrorCode =
  | "unknown-lexeme"
  | "not-a-verb"
  | "invalid-verb-ending"
  | "construction-not-licensed";

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

export type TeConstruction = BaseTeConstruction;

interface GodanEnding {
  readonly kana: string;
  readonly romaji: string;
  readonly politeKana: string;
  readonly politeRomaji: string;
  readonly teKana: string;
  readonly teRomaji: string;
}

const GODAN_ENDING_BY_KANA: Readonly<Record<string, GodanEnding>> = {
  "う": {
    kana: "う",
    romaji: "u",
    politeKana: "い",
    politeRomaji: "i",
    teKana: "って",
    teRomaji: "tte",
  },
  "く": {
    kana: "く",
    romaji: "ku",
    politeKana: "き",
    politeRomaji: "ki",
    teKana: "いて",
    teRomaji: "ite",
  },
  "ぐ": {
    kana: "ぐ",
    romaji: "gu",
    politeKana: "ぎ",
    politeRomaji: "gi",
    teKana: "いで",
    teRomaji: "ide",
  },
  "す": {
    kana: "す",
    romaji: "su",
    politeKana: "し",
    politeRomaji: "shi",
    teKana: "して",
    teRomaji: "shite",
  },
  "つ": {
    kana: "つ",
    romaji: "tsu",
    politeKana: "ち",
    politeRomaji: "chi",
    teKana: "って",
    teRomaji: "tte",
  },
  "ぬ": {
    kana: "ぬ",
    romaji: "nu",
    politeKana: "に",
    politeRomaji: "ni",
    teKana: "んで",
    teRomaji: "nde",
  },
  "ぶ": {
    kana: "ぶ",
    romaji: "bu",
    politeKana: "び",
    politeRomaji: "bi",
    teKana: "んで",
    teRomaji: "nde",
  },
  "む": {
    kana: "む",
    romaji: "mu",
    politeKana: "み",
    politeRomaji: "mi",
    teKana: "んで",
    teRomaji: "nde",
  },
  "る": {
    kana: "る",
    romaji: "ru",
    politeKana: "り",
    politeRomaji: "ri",
    teKana: "って",
    teRomaji: "tte",
  },
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
  return assembled;
}

function removeSuffix(
  verb: BaseVerbLexeme,
  kanaSuffix: string,
  romajiSuffix: string,
): readonly [string, string] | undefined {
  if (
    !verb.kana.endsWith(kanaSuffix) ||
    !verb.romaji.endsWith(romajiSuffix)
  ) {
    return undefined;
  }
  return [
    verb.kana.slice(0, -kanaSuffix.length),
    verb.romaji.slice(0, -romajiSuffix.length),
  ];
}

function compoundParts(
  verb: BaseVerbLexeme,
  kanaSuffix: "する" | "くる",
  romajiSuffix: "suru" | "kuru",
  politeKana: string,
  politeRomaji: string,
  teKana: string,
  teRomaji: string,
): readonly [string, string, string, string] | undefined {
  const prefix = removeSuffix(verb, kanaSuffix, romajiSuffix);
  if (!prefix) return undefined;
  return [
    `${prefix[0]}${politeKana}`,
    `${prefix[1]}${politeRomaji}`,
    teKana,
    teRomaji,
  ];
}

function politeStemParts(
  verb: BaseVerbLexeme,
): readonly [string, string] | undefined {
  if (verb.verbClass === "suru") {
    const parts = compoundParts(verb, "する", "suru", "し", "shi", "て", "te");
    return parts ? [parts[0], parts[1]] : undefined;
  }
  if (verb.verbClass === "kuru") {
    const parts = compoundParts(verb, "くる", "kuru", "き", "ki", "て", "te");
    return parts ? [parts[0], parts[1]] : undefined;
  }
  if (verb.verbClass === "ichidan") {
    return removeSuffix(verb, "る", "ru");
  }
  const endingKana = verb.kana.slice(-1);
  const ending = GODAN_ENDING_BY_KANA[endingKana];
  if (!ending) return undefined;
  const root = removeSuffix(verb, ending.kana, ending.romaji);
  if (!root) return undefined;
  return [
    `${root[0]}${ending.politeKana}`,
    `${root[1]}${ending.politeRomaji}`,
  ];
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
  if (verb.verbClass === "suru") {
    return compoundParts(verb, "する", "suru", "し", "shi", "て", "te");
  }
  if (verb.verbClass === "kuru") {
    return compoundParts(verb, "くる", "kuru", "き", "ki", "て", "te");
  }
  if (verb.verbClass === "ichidan") {
    const root = removeSuffix(verb, "る", "ru");
    return root ? [root[0], root[1], "て", "te"] : undefined;
  }
  const endingKana = verb.kana.slice(-1);
  const ending = GODAN_ENDING_BY_KANA[endingKana];
  if (!ending) return undefined;
  const root = removeSuffix(verb, ending.kana, ending.romaji);
  if (!root) return undefined;
  return [root[0], root[1], ending.teKana, ending.teRomaji];
}

function lexicalToken(
  verb: BaseVerbLexeme,
  idSuffix: string,
  jp: string,
  romaji: string,
): AssembledToken {
  return token(`${verb.id}-${idSuffix}`, jp, romaji, "lexical", "attach", verb.id);
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

function appendStandaloneWord(
  tokens: readonly AssembledToken[],
  lemmaId: string,
  id: string,
  jp: string,
  romaji: string,
): readonly AssembledToken[] {
  return deepFreeze([
    ...tokens,
    token(`${lemmaId}-${id}`, jp, romaji, "morpheme", "space", id),
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
  if (!verb.value.allowedTeConstructions.includes(construction)) {
    return error("construction-not-licensed", lemmaId);
  }
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
    return result(
      appendStandaloneWord(teTokens, lemmaId, "kudasai", "ください", "kudasai"),
    );
  }
  return result(
    appendStandaloneWord(teTokens, lemmaId, "imasu", "います", "imasu"),
  );
}

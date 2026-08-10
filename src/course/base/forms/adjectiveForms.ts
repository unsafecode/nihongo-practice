import type { AssembledToken } from "../../../romaji/types";
import { deepFreeze } from "../../foundations/deepFreeze";
import { BASE_LEXEME_BY_ID } from "../catalog/lexicon";
import type { BaseAdjectiveLexeme } from "../catalog/types";

export type DesuFunction = "politeness-marker" | "copula";

export interface BasePredicateCell {
  readonly tokens: readonly AssembledToken[];
  readonly desuFunction: DesuFunction;
}

export interface BasePredicateGrid {
  readonly affirmative: BasePredicateCell;
  readonly negative: BasePredicateCell;
  readonly pastAffirmative: BasePredicateCell;
  readonly pastNegative: BasePredicateCell;
}

export interface BaseNounPredicateInput {
  readonly id: string;
  readonly kana: string;
  readonly romaji: string;
}

export type BaseAdjectiveFormErrorCode =
  | "unknown-lexeme"
  | "not-an-i-adjective"
  | "not-a-na-adjective";

export type BaseAdjectiveFormResult<T> =
  | Readonly<{ readonly ok: true; readonly value: T }>
  | Readonly<{
      readonly ok: false;
      readonly error: Readonly<{
        readonly code: BaseAdjectiveFormErrorCode;
        readonly lexemeId: string;
      }>;
    }>;

export type BasePredicateValidationInput =
  | Readonly<{
      readonly predicateKind: "i-adjective";
      readonly lexemeId: string;
      readonly ending: "da" | "desu" | "none";
      readonly surface?: string;
    }>
  | Readonly<{
      readonly predicateKind: "na-adjective";
      readonly lexemeId: string;
      readonly position: "attributive";
      readonly hasNa: boolean;
      readonly surface?: string;
    }>
  | Readonly<{
      readonly predicateKind: "na-adjective";
      readonly lexemeId: string;
      readonly position: "predicate";
      readonly copula: "none" | "desu" | "da";
      readonly surface?: string;
    }>;

export type BasePredicateValidationErrorCode =
  | "i-adjective-copula-da"
  | "na-adjective-missing-na"
  | "na-adjective-missing-copula"
  | "unknown-lexeme"
  | "not-an-adjective"
  | "predicate-kind-lexeme-mismatch";

export type BasePredicateValidationResult =
  | Readonly<{ readonly ok: true }>
  | Readonly<{
      readonly ok: false;
      readonly error: Readonly<{
        readonly code: BasePredicateValidationErrorCode;
        readonly lexemeId: string;
      }>;
    }>;

function ok<T>(value: T): BaseAdjectiveFormResult<T> {
  return Object.freeze({ ok: true, value });
}

function error(
  code: BaseAdjectiveFormErrorCode,
  lexemeId: string,
): BaseAdjectiveFormResult<never> {
  return Object.freeze({ ok: false, error: Object.freeze({ code, lexemeId }) });
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

function lexicalTokens(
  id: string,
  kana: string,
  romaji: string,
): readonly AssembledToken[] {
  return deepFreeze([token(`${id}-stem`, kana, romaji, "lexical", "space", id)]);
}

function append(
  tokens: readonly AssembledToken[],
  id: string,
  suffixId: string,
  jp: string,
  romaji: string,
): readonly AssembledToken[] {
  return deepFreeze([
    ...tokens,
    token(`${id}-${suffixId}`, jp, romaji, "morpheme", "attach", suffixId),
  ]);
}

function cell(
  tokens: readonly AssembledToken[],
  desuFunction: DesuFunction,
): BasePredicateCell {
  return deepFreeze({ tokens, desuFunction });
}

function adjectiveFor(
  lexemeId: string,
  adjectiveClass: BaseAdjectiveLexeme["adjectiveClass"],
): BaseAdjectiveFormResult<BaseAdjectiveLexeme> {
  const lexeme = BASE_LEXEME_BY_ID.get(lexemeId);
  if (!lexeme) return error("unknown-lexeme", lexemeId);
  if (lexeme.category !== "adjective" || lexeme.adjectiveClass !== adjectiveClass) {
    return error(
      adjectiveClass === "i" ? "not-an-i-adjective" : "not-a-na-adjective",
      lexemeId,
    );
  }
  return ok(lexeme);
}

function copulaGrid(
  stem: readonly AssembledToken[],
  id: string,
): BasePredicateGrid {
  return deepFreeze({
    affirmative: cell(append(stem, id, "desu", "です", "desu"), "copula"),
    negative: cell(
      append(stem, id, "dewa-arimasen", "ではありません", "dewa arimasen"),
      "copula",
    ),
    pastAffirmative: cell(append(stem, id, "deshita", "でした", "deshita"), "copula"),
    pastNegative: cell(
      append(
        stem,
        id,
        "dewa-arimasen-deshita",
        "ではありませんでした",
        "dewa arimasen deshita",
      ),
      "copula",
    ),
  });
}

export function realizeNounPredicate(
  noun: BaseNounPredicateInput,
): BaseAdjectiveFormResult<BasePredicateGrid> {
  return ok(copulaGrid(lexicalTokens(noun.id, noun.kana, noun.romaji), noun.id));
}

export function realizeNaAdjectivePredicate(
  lexemeId: string,
): BaseAdjectiveFormResult<BasePredicateGrid> {
  const adjective = adjectiveFor(lexemeId, "na");
  if (!adjective.ok) return adjective;
  return ok(
    copulaGrid(
      lexicalTokens(adjective.value.id, adjective.value.kana, adjective.value.romaji),
      adjective.value.id,
    ),
  );
}

export function realizeNaAdjectiveAttributive(
  lexemeId: string,
): BaseAdjectiveFormResult<readonly AssembledToken[]> {
  const adjective = adjectiveFor(lexemeId, "na");
  if (!adjective.ok) return adjective;
  return ok(
    append(
      lexicalTokens(adjective.value.id, adjective.value.kana, adjective.value.romaji),
      adjective.value.id,
      "na",
      "な",
      "na",
    ),
  );
}

function iAdjectiveStem(adjective: BaseAdjectiveLexeme): readonly [string, string] {
  if (adjective.iAdjectiveInflection) {
    return [
      adjective.iAdjectiveInflection.negativeStemKana,
      adjective.iAdjectiveInflection.negativeStemRomaji,
    ];
  }
  return [adjective.kana.slice(0, -1), adjective.romaji.slice(0, -1)];
}

export function realizeIAdjectivePredicate(
  lexemeId: string,
): BaseAdjectiveFormResult<BasePredicateGrid> {
  const adjective = adjectiveFor(lexemeId, "i");
  if (!adjective.ok) return adjective;
  const [stemKana, stemRomaji] = iAdjectiveStem(adjective.value);
  const dictionary = lexicalTokens(
    adjective.value.id,
    adjective.value.kana,
    adjective.value.romaji,
  );
  const stem = lexicalTokens(adjective.value.id, stemKana, stemRomaji);
  return ok(
    deepFreeze({
      affirmative: cell(
        append(dictionary, adjective.value.id, "desu", "です", "desu"),
        "politeness-marker",
      ),
      negative: cell(
        append(stem, adjective.value.id, "kunai-desu", "くないです", "kunai desu"),
        "politeness-marker",
      ),
      pastAffirmative: cell(
        append(stem, adjective.value.id, "katta-desu", "かったです", "katta desu"),
        "politeness-marker",
      ),
      pastNegative: cell(
        append(
          stem,
          adjective.value.id,
          "kunakatta-desu",
          "くなかったです",
          "kunakatta desu",
        ),
        "politeness-marker",
      ),
    }),
  );
}

function validationError(
  code: BasePredicateValidationErrorCode,
  lexemeId: string,
): BasePredicateValidationResult {
  return Object.freeze({ ok: false, error: Object.freeze({ code, lexemeId }) });
}

export function validateBasePredicate(
  input: BasePredicateValidationInput,
): BasePredicateValidationResult {
  const lexeme = BASE_LEXEME_BY_ID.get(input.lexemeId);
  if (!lexeme) {
    return validationError("unknown-lexeme", input.lexemeId);
  }
  if (lexeme.category !== "adjective") {
    return validationError("not-an-adjective", input.lexemeId);
  }
  if (
    (input.predicateKind === "i-adjective" && lexeme.adjectiveClass !== "i") ||
    (input.predicateKind === "na-adjective" && lexeme.adjectiveClass !== "na")
  ) {
    return validationError("predicate-kind-lexeme-mismatch", input.lexemeId);
  }
  if (
    input.predicateKind === "i-adjective" &&
    lexeme.adjectiveClass === "i" &&
    input.ending === "da"
  ) {
    return validationError("i-adjective-copula-da", input.lexemeId);
  }
  if (
    input.predicateKind === "na-adjective" &&
    lexeme.adjectiveClass === "na" &&
    input.position === "attributive" &&
    !input.hasNa
  ) {
    return validationError("na-adjective-missing-na", input.lexemeId);
  }
  if (
    input.predicateKind === "na-adjective" &&
    lexeme.adjectiveClass === "na" &&
    input.position === "predicate" &&
    input.copula === "none"
  ) {
    return validationError("na-adjective-missing-copula", input.lexemeId);
  }
  return Object.freeze({ ok: true });
}

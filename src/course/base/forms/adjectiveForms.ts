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

export type BasePredicateForm =
  | "affirmative"
  | "negative"
  | "pastAffirmative"
  | "pastNegative";

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
      readonly form: BasePredicateForm;
      readonly surface: string;
      readonly ending?: "da" | "desu" | "none";
    }>
  | Readonly<{
      readonly predicateKind: "na-adjective";
      readonly lexemeId: string;
      readonly position: "attributive";
      readonly surface: string;
      readonly hasNa?: boolean;
    }>
  | Readonly<{
      readonly predicateKind: "na-adjective";
      readonly lexemeId: string;
      readonly position: "predicate";
      readonly form: BasePredicateForm | "plainAffirmative";
      readonly copula: "none" | "desu" | "da";
      readonly surface: string;
    }>;

export type BasePredicateValidationErrorCode =
  | "i-adjective-copula-da"
  | "na-adjective-missing-na"
  | "na-adjective-missing-copula"
  | "surface-form-mismatch"
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
  return assembled;
}

function lexicalTokens(
  id: string,
  kana: string,
  romaji: string,
): readonly AssembledToken[] {
  return deepFreeze([token(`${id}-stem`, kana, romaji, "lexical", "attach", id)]);
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

function appendStandaloneWord(
  tokens: readonly AssembledToken[],
  id: string,
  suffixId: string,
  jp: string,
  romaji: string,
): readonly AssembledToken[] {
  return deepFreeze([
    ...tokens,
    token(`${id}-${suffixId}`, jp, romaji, "morpheme", "space", suffixId),
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
    affirmative: cell(
      appendStandaloneWord(stem, id, "desu", "です", "desu"),
      "copula",
    ),
    negative: cell(
      appendStandaloneWord(
        stem,
        id,
        "dewa-arimasen",
        "ではありません",
        "dewa arimasen",
      ),
      "copula",
    ),
    pastAffirmative: cell(
      appendStandaloneWord(stem, id, "deshita", "でした", "deshita"),
      "copula",
    ),
    pastNegative: cell(
      appendStandaloneWord(
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
    appendStandaloneWord(
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
        appendStandaloneWord(dictionary, adjective.value.id, "desu", "です", "desu"),
        "politeness-marker",
      ),
      negative: cell(
        appendStandaloneWord(
          append(stem, adjective.value.id, "kunai", "くない", "kunai"),
          adjective.value.id,
          "desu",
          "です",
          "desu",
        ),
        "politeness-marker",
      ),
      pastAffirmative: cell(
        appendStandaloneWord(
          append(stem, adjective.value.id, "katta", "かった", "katta"),
          adjective.value.id,
          "desu",
          "です",
          "desu",
        ),
        "politeness-marker",
      ),
      pastNegative: cell(
        appendStandaloneWord(
          append(
            stem,
            adjective.value.id,
            "kunakatta",
            "くなかった",
            "kunakatta",
          ),
          adjective.value.id,
          "desu",
          "です",
          "desu",
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

function japaneseSurface(tokens: readonly AssembledToken[]): string {
  return tokens.map((token) => token.jp).join("").normalize("NFKC").trim();
}

function normalizedSurface(surface: unknown): string {
  return typeof surface === "string" ? surface.normalize("NFKC").trim() : "";
}

function isPredicateForm(value: unknown): value is BasePredicateForm {
  return (
    value === "affirmative" ||
    value === "negative" ||
    value === "pastAffirmative" ||
    value === "pastNegative"
  );
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
    (input.ending === "da" || normalizedSurface(input.surface).endsWith("だ"))
  ) {
    return validationError("i-adjective-copula-da", input.lexemeId);
  }

  if (input.predicateKind === "i-adjective") {
    const realized = realizeIAdjectivePredicate(input.lexemeId);
    if (!realized.ok) {
      return validationError("not-an-adjective", input.lexemeId);
    }
    if (!isPredicateForm(input.form)) {
      return validationError("surface-form-mismatch", input.lexemeId);
    }
    const cell = realized.value[input.form];
    if (
      input.ending !== undefined &&
      input.ending !== "desu"
    ) {
      return validationError("surface-form-mismatch", input.lexemeId);
    }
    return japaneseSurface(cell.tokens) === normalizedSurface(input.surface)
      ? Object.freeze({ ok: true })
      : validationError("surface-form-mismatch", input.lexemeId);
  }

  if (input.position === "attributive") {
    const realized = realizeNaAdjectiveAttributive(input.lexemeId);
    if (!realized.ok) {
      return validationError("not-an-adjective", input.lexemeId);
    }
    const surface = normalizedSurface(input.surface);
    if (
      input.hasNa === false ||
      surface === japaneseSurface(
        realized.value.slice(0, realized.value.length - 1),
      )
    ) {
      return validationError("na-adjective-missing-na", input.lexemeId);
    }
    return japaneseSurface(realized.value) === surface
      ? Object.freeze({ ok: true })
      : validationError("surface-form-mismatch", input.lexemeId);
  }

  const surface = normalizedSurface(input.surface);
  if (
    input.copula === "none" ||
    surface === lexeme.kana.normalize("NFKC").trim()
  ) {
    return validationError("na-adjective-missing-copula", input.lexemeId);
  }
  if (input.form === "plainAffirmative") {
    if (input.copula !== "da") {
      return validationError("surface-form-mismatch", input.lexemeId);
    }
    return surface === `${lexeme.kana}だ`
      ? Object.freeze({ ok: true })
      : validationError("surface-form-mismatch", input.lexemeId);
  }
  if (!isPredicateForm(input.form)) {
    return validationError("surface-form-mismatch", input.lexemeId);
  }
  if (input.copula !== "desu") {
    return validationError("surface-form-mismatch", input.lexemeId);
  }
  const realized = realizeNaAdjectivePredicate(input.lexemeId);
  if (!realized.ok) {
    return validationError("not-an-adjective", input.lexemeId);
  }
  return japaneseSurface(realized.value[input.form].tokens) === surface
    ? Object.freeze({ ok: true })
    : validationError("surface-form-mismatch", input.lexemeId);
}

export interface CatalogReferenceInput {
  readonly conceptIds: readonly string[];
  readonly lexemeIds: readonly string[];
  readonly exampleIds: readonly string[];
  readonly personaIds: readonly string[];
  readonly referencedConceptIds: readonly string[];
  readonly referencedLexemeIds: readonly string[];
  readonly referencedExampleIds: readonly string[];
  readonly referencedPersonaIds: readonly string[];
}

export type CatalogReferenceErrorCode =
  | "duplicate-concept-id"
  | "duplicate-example-id"
  | "duplicate-lexeme-id"
  | "duplicate-persona-id"
  | "missing-concept-reference"
  | "missing-example-reference"
  | "missing-lexeme-reference"
  | "missing-persona-reference";

export interface CatalogReferenceError {
  readonly code: CatalogReferenceErrorCode;
  readonly id: string;
}

function duplicateErrors(
  ids: readonly string[],
  code: CatalogReferenceErrorCode,
): CatalogReferenceError[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates].map((id) => ({ code, id }));
}

function missingErrors(
  declaredIds: readonly string[],
  referencedIds: readonly string[],
  code: CatalogReferenceErrorCode,
): CatalogReferenceError[] {
  const declared = new Set(declaredIds);
  return [...new Set(referencedIds)]
    .filter((id) => !declared.has(id))
    .map((id) => ({ code, id }));
}

export function validateCatalogReferences(
  input: CatalogReferenceInput,
): CatalogReferenceError[] {
  const errors = [
    ...duplicateErrors(input.conceptIds, "duplicate-concept-id"),
    ...duplicateErrors(input.exampleIds, "duplicate-example-id"),
    ...duplicateErrors(input.lexemeIds, "duplicate-lexeme-id"),
    ...duplicateErrors(input.personaIds, "duplicate-persona-id"),
    ...missingErrors(
      input.conceptIds,
      input.referencedConceptIds,
      "missing-concept-reference",
    ),
    ...missingErrors(
      input.exampleIds,
      input.referencedExampleIds,
      "missing-example-reference",
    ),
    ...missingErrors(
      input.lexemeIds,
      input.referencedLexemeIds,
      "missing-lexeme-reference",
    ),
    ...missingErrors(
      input.personaIds,
      input.referencedPersonaIds,
      "missing-persona-reference",
    ),
  ];

  return errors.sort(
    (left, right) =>
      left.code.localeCompare(right.code) || left.id.localeCompare(right.id),
  );
}

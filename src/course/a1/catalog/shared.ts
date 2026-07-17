/**
 * A1 release shared catalog barrel (Phase 2 Task 2; split per quality-review
 * M5 into three focused modules, each owning one responsibility this file
 * used to mix together):
 *
 * - `a1SemanticCatalog.ts` — the deeply-frozen data catalogs (concepts,
 *   contexts, person roles, referents, learning-target senses, semantic
 *   values, sentence families, Can-do stubs). The only place Japanese/romaji
 *   lexical content is authored.
 * - `a1CopyGloss.ts` — bilingual (EN/IT) copy and the small gloss tables /
 *   composition helpers used to assemble natural translations and scenario
 *   notes. Never Japanese.
 * - `a1LessonBuilders.ts` — lesson authoring: the variant builder, the
 *   `FoundationCatalogs` assembly helper, and the instructional-lesson /
 *   verb-use-record builders. Depends on the two catalogs above, never the
 *   reverse.
 *
 * This file re-exports all three so every existing `from "./shared"` import
 * across the A1 module files and tests keeps working unchanged.
 */

export * from "./a1SemanticCatalog";
export * from "./a1CopyGloss";
export * from "./a1LessonBuilders";

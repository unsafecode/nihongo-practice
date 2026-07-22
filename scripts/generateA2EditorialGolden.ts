/**
 * Generator for the A2 editorial golden surface table (Phase 3 Task 9).
 *
 * Emits `src/course/a2/catalog/a2EditorialSurfaces.golden.json`: one reviewed
 * row per authored A2 sentence variant (all 806), sorted by canonical lesson
 * position then variant id. Each row records the *realized* learner-facing
 * surface — exact canonical Japanese, exact assembled rōmaji, the EN/IT
 * translation gloss — plus the authored register/form metadata and the
 * family/rule it realizes through.
 *
 * The golden is a *committed, human-reviewed* artifact. `editorial.test.ts`
 * reads it read-only and compares it against a fresh realization; it never
 * regenerates it. That is the whole point: expected surfaces come from a
 * frozen prior run a reviewer signed off on, never from the actual output in
 * the same test run, so the surface gate cannot self-confirm. Re-run this
 * script (and re-review the diff) only when a *deliberate* content/realizer
 * change is expected to move surfaces.
 *
 * Run: `npx vite-node scripts/generateA2EditorialGolden.ts`
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { realizeVariant } from "../src/course/foundations/realizeFamily";
import type { SentenceFamily, SentenceVariant } from "../src/course/foundations/types";
import { a2AllVariants, a2SemanticBuiltLessons } from "../src/course/a2/catalog/catalog";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "../src/course/a2/catalog/a2SemanticCatalog";
import { A2_CANONICAL_POSITIONS } from "../src/course/a2/manifest";
import { formatRomaji } from "../src/romaji/formatRomaji";

const familyById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((family) => [family.id, family]));
const realizeCatalogs = {
  contexts: a2Contexts,
  personRoles: a2PersonRoles,
  referents: a2Referents,
  semanticValues: a2SemanticValues,
  learningTargetSenses: a2LearningTargetSenses,
};

interface GoldenRow {
  readonly id: string;
  readonly position: number;
  readonly lessonId: string;
  readonly use: string;
  readonly family: string;
  readonly rule: string;
  readonly formality: string;
  readonly polarity: string;
  readonly tense: string;
  readonly interrogative: boolean;
  readonly jp: string;
  readonly romaji: string;
  readonly en: string;
  readonly it: string;
}

const glossByVariant = new Map<string, { lessonId: string; en: string; it: string }>();
for (const built of a2SemanticBuiltLessons) {
  for (const variant of built.variants) {
    glossByVariant.set(variant.id, {
      lessonId: built.recipe.id,
      en: built.en[`${variant.id}-translation`] ?? "",
      it: built.it[`${variant.id}-translation`] ?? "",
    });
  }
}

function realize(variant: SentenceVariant) {
  const family = familyById.get(variant.sentenceFamilyId);
  if (!family) throw new Error(`generateA2EditorialGolden: unknown family ${variant.sentenceFamilyId} for ${variant.id}`);
  const result = realizeVariant(family, variant, realizeCatalogs, {
    availableConceptIds: [...family.requiredConceptIds],
  });
  if (!result.ok) {
    throw new Error(`generateA2EditorialGolden: realize ${variant.id} failed: ${JSON.stringify(result.errors)}`);
  }
  const romaji = formatRomaji(result.sentence.tokens);
  if (!romaji.ok) {
    throw new Error(`generateA2EditorialGolden: romaji ${variant.id} failed: ${JSON.stringify(romaji.errors)}`);
  }
  return { sentence: result.sentence, romaji: romaji.text };
}

const rows: GoldenRow[] = a2AllVariants.map((variant) => {
  const family = familyById.get(variant.sentenceFamilyId);
  if (!family) throw new Error(`generateA2EditorialGolden: unknown family ${variant.sentenceFamilyId}`);
  const gloss = glossByVariant.get(variant.id);
  if (!gloss) throw new Error(`generateA2EditorialGolden: no gloss row for ${variant.id}`);
  const { sentence, romaji } = realize(variant);
  const position = A2_CANONICAL_POSITIONS[gloss.lessonId];
  if (typeof position !== "number") {
    throw new Error(`generateA2EditorialGolden: no canonical position for ${gloss.lessonId}`);
  }
  return {
    id: variant.id,
    position,
    lessonId: gloss.lessonId,
    use: variant.pedagogicalUse,
    family: variant.sentenceFamilyId,
    rule: family.realizationRuleId,
    formality: variant.form.formality,
    polarity: variant.form.polarity,
    tense: variant.form.tense,
    interrogative: variant.form.interrogative === true,
    jp: sentence.canonicalJapanese,
    romaji,
    en: gloss.en,
    it: gloss.it,
  };
});

rows.sort((left, right) => left.position - right.position || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));

const outputPath = fileURLToPath(
  new URL("../src/course/a2/catalog/a2EditorialSurfaces.golden.json", import.meta.url),
);
writeFileSync(outputPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
console.log(`generateA2EditorialGolden: wrote ${rows.length} rows to ${outputPath}`);

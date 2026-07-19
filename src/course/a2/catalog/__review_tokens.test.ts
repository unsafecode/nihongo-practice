import { describe, it } from "vitest";
import { realizeVariant } from "../../foundations/realizeFamily";
import type { SentenceFamily, SentenceVariant } from "../../foundations/types";
import { a2AllVariants } from "./catalog";
import {
  a2Contexts,
  a2LearningTargetSenses,
  a2PersonRoles,
  a2Referents,
  a2SemanticValues,
  a2SentenceFamilies,
} from "./a2SemanticCatalog";
import { writeFileSync } from "node:fs";

const famById = new Map<string, SentenceFamily>(a2SentenceFamilies.map((f) => [f.id, f]));
const catalogs = {
  contexts: a2Contexts,
  personRoles: a2PersonRoles,
  referents: a2Referents,
  semanticValues: a2SemanticValues,
  learningTargetSenses: a2LearningTargetSenses,
};

describe("scratch tokens", () => {
  it("dump tokens", () => {
    const ids = ["relationships-events-3-m7", "sequencing-ongoing-3-m1", "a2-synthesis-2-m3"];
    const out: string[] = [];
    for (const v of a2AllVariants as SentenceVariant[]) {
      if (!ids.includes(v.id)) continue;
      const fam = famById.get(v.sentenceFamilyId)!;
      const r = realizeVariant(fam, v, catalogs, { availableConceptIds: [...fam.requiredConceptIds] });
      if (!r.ok) { out.push(`${v.id}: FAIL`); continue; }
      out.push(`\n=== ${v.id} : ${r.sentence.canonicalJapanese}`);
      for (const t of r.sentence.tokens) {
        out.push(`  jp=${JSON.stringify(t.jp)} romaji=${JSON.stringify(t.romaji)} kind=${t.kind} boundaryBefore=${t.boundaryBefore}`);
      }
    }
    writeFileSync("tokens_dump.txt", out.join("\n"), "utf8");
  });
});

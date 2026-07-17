/**
 * A1 copy — English.
 *
 * A single flat `copyId → string` map aggregating every English string the A1
 * modules reference: shared role/referent/context labels, Can-do descriptors,
 * module outcomes, phonetic outcomes and item hints, and the natural
 * translation + scenario note for every model and transfer variant across
 * modules 2-4. The key set is identical to {@link a1CopyIt}; no entry contains
 * Japanese (all Japanese lives in the semantic-value table and the phonetic
 * item catalog).
 */

import { a1SharedCopy } from "../catalog/shared";
import { module1Copy } from "../catalog/module01Sounds";
import { module2Lessons } from "../catalog/module02Introductions";
import { module3Lessons } from "../catalog/module03Questions";
import { module4Lessons } from "../catalog/module04Actions";

function buildEn(): Record<string, string> {
  const out: Record<string, string> = { ...a1SharedCopy.en, ...module1Copy.en };
  for (const lessons of [module2Lessons, module3Lessons, module4Lessons]) {
    for (const lesson of lessons) {
      Object.assign(out, lesson.en);
    }
  }
  return out;
}

export const a1CopyEn: Readonly<Record<string, string>> = Object.freeze(buildEn());

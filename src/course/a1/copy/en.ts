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
import { module5Lessons } from "../catalog/module05Routines";
import { module6Lessons } from "../catalog/module06TensePolarity";
import { module7Lessons } from "../catalog/module07Places";
import { module8Lessons } from "../catalog/module08People";
import { module9Lessons } from "../catalog/module09Descriptions";
import { module10Lessons } from "../catalog/module10Shopping";
import { module11Lessons } from "../catalog/module11ExistenceNeeds";
import { module12Lessons } from "../catalog/module12Capstones";

function buildEn(): Record<string, string> {
  const out: Record<string, string> = { ...a1SharedCopy.en, ...module1Copy.en };
  for (const lessons of [
    module2Lessons,
    module3Lessons,
    module4Lessons,
    module5Lessons,
    module6Lessons,
    module7Lessons,
    module8Lessons,
    module9Lessons,
    module10Lessons,
    module11Lessons,
    module12Lessons,
  ]) {
    for (const lesson of lessons) {
      Object.assign(out, lesson.en);
    }
  }
  return out;
}

export const a1CopyEn: Readonly<Record<string, string>> = Object.freeze(buildEn());

/**
 * A1 copy — Italian.
 *
 * The Italian counterpart to {@link a1CopyEn}: a single flat `copyId → string`
 * map with an identical key set. Every A1 string the modules reference is
 * present exactly once, and no entry contains Japanese.
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

function buildIt(): Record<string, string> {
  const out: Record<string, string> = { ...a1SharedCopy.it, ...module1Copy.it };
  for (const lessons of [
    module2Lessons,
    module3Lessons,
    module4Lessons,
    module5Lessons,
    module6Lessons,
    module7Lessons,
    module8Lessons,
  ]) {
    for (const lesson of lessons) {
      Object.assign(out, lesson.it);
    }
  }
  return out;
}

export const a1CopyIt: Readonly<Record<string, string>> = Object.freeze(buildIt());

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
import { module9Lessons } from "../catalog/module09Descriptions";
import { module10Lessons } from "../catalog/module10Shopping";
import { module11Lessons } from "../catalog/module11ExistenceNeeds";
import { module12Lessons } from "../catalog/module12Capstones";
import { moduleSentenceFoundationsLessons } from "../catalog/moduleSentenceFoundations";
import { moduleTopicQuestionsLessons } from "../catalog/moduleTopicQuestions";
import { modulePoliteVerbsLessons } from "../catalog/modulePoliteVerbs";
import { moduleTimeMovementLessons } from "../catalog/moduleTimeMovement";

function buildIt(): Record<string, string> {
  const out: Record<string, string> = { ...a1SharedCopy.it, ...module1Copy.it };
  for (const lessons of [
    moduleSentenceFoundationsLessons,
    moduleTopicQuestionsLessons,
    modulePoliteVerbsLessons,
    moduleTimeMovementLessons,
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
      Object.assign(out, lesson.it);
    }
  }
  return out;
}

export const a1CopyIt: Readonly<Record<string, string>> = Object.freeze(buildIt());

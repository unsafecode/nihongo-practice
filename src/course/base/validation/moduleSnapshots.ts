import type { BaseVisibleTarget } from "../catalog/types";
import type { AssembledToken } from "../../../romaji/types";
import {
  strictRuntimeDialogueTurn,
  strictRuntimeExample,
  strictRuntimeVisibleTarget,
} from "./runtimeGuards";

export interface StrictTask11ModuleTarget {
  readonly lessonId: string;
  readonly source:
    | "example"
    | "dialogue"
    | "accepted-answer"
    | "option";
  readonly target: BaseVisibleTarget;
}

export function containsExactGeneratedTokenSequence(
  target: readonly AssembledToken[],
  expected: readonly AssembledToken[],
): boolean {
  return target.some((_, start) =>
    expected.every((token, offset) => {
      const actual = target[start + offset];
      return (
        actual?.jp === token.jp &&
        actual.romaji === token.romaji &&
        actual.kind === token.kind &&
        (offset === 0 || actual.boundaryBefore === token.boundaryBefore) &&
        actual.source.domain === token.source.domain &&
        actual.source.referenceId === token.source.referenceId
      );
    }),
  );
}

export function ownDataRecordSnapshot(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    Object.getOwnPropertySymbols(value).length > 0
  ) {
    return undefined;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Object.values(descriptors).some((descriptor) => !("value" in descriptor))) {
    return undefined;
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(descriptors).map(([key, descriptor]) => [
        key,
        (descriptor as PropertyDescriptor & { value: unknown }).value,
      ]),
    ),
  );
}

export function ownDataArraySnapshot(
  value: unknown,
): readonly unknown[] | undefined {
  if (
    !Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Array.prototype ||
    Object.getOwnPropertySymbols(value).length > 0
  ) {
    return undefined;
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
  if (
    Object.keys(descriptors).length !== value.length + 1 ||
    !lengthDescriptor ||
    !("value" in lengthDescriptor)
  ) {
    return undefined;
  }
  const entries: unknown[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = descriptors[String(index)];
    if (!descriptor || !("value" in descriptor)) return undefined;
    entries.push(descriptor.value);
  }
  return Object.freeze(entries);
}

export function strictTask11ModuleTargets(
  value: unknown,
): readonly StrictTask11ModuleTarget[] | undefined {
  const module = ownDataRecordSnapshot(value);
  const lessons = module ? ownDataArraySnapshot(module.lessons) : undefined;
  if (!lessons) return undefined;
  const targets: StrictTask11ModuleTarget[] = [];
  for (const lessonValue of lessons) {
    const lesson = ownDataRecordSnapshot(lessonValue);
    const content = lesson ? ownDataRecordSnapshot(lesson.content) : undefined;
    const lessonId = content?.lessonId;
    const examples = lesson
      ? ownDataArraySnapshot(lesson.examples)
      : undefined;
    const designs = lesson
      ? ownDataArraySnapshot(lesson.activityDesigns)
      : undefined;
    if (!lesson || typeof lessonId !== "string" || !examples || !designs) {
      return undefined;
    }
    for (const exampleValue of examples) {
      const target = strictRuntimeExample(exampleValue);
      if (!target) return undefined;
      targets.push({ lessonId, source: "example", target });
    }
    const dialogueValue = lesson.dialogue;
    if (dialogueValue !== null) {
      const dialogue = ownDataRecordSnapshot(dialogueValue);
      const turns = dialogue
        ? ownDataArraySnapshot(dialogue.turns)
        : undefined;
      if (!turns) return undefined;
      for (const turnValue of turns) {
        const target = strictRuntimeDialogueTurn(turnValue);
        if (!target) return undefined;
        targets.push({ lessonId, source: "dialogue", target });
      }
    }
    for (const designValue of designs) {
      const design = ownDataRecordSnapshot(designValue);
      const options = design
        ? ownDataArraySnapshot(design.optionTargets)
        : undefined;
      const accepted = design
        ? strictRuntimeVisibleTarget(design.acceptedAnswerTarget)
        : undefined;
      if (!design || !options || !accepted) return undefined;
      targets.push({ lessonId, source: "accepted-answer", target: accepted });
      for (const optionValue of options) {
        const target = strictRuntimeVisibleTarget(optionValue);
        if (!target) return undefined;
        targets.push({ lessonId, source: "option", target });
      }
    }
  }
  return Object.freeze(targets);
}

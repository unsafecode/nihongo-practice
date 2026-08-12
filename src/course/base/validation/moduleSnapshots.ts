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

export type StrictTask11CorpusSource =
  | "example"
  | "dialogue"
  | "prompt"
  | "option"
  | "accepted-answer"
  | "audio"
  | "spoken";

export interface StrictTask11CorpusTarget {
  readonly lessonId: string;
  readonly activityId: string | null;
  readonly occurrenceId: string;
  readonly source: StrictTask11CorpusSource;
  readonly operation: string | null;
  readonly target: BaseVisibleTarget;
}

export interface StrictTask11CorpusContext {
  readonly lessonId: string;
  readonly activityId: string;
  readonly copyId: string;
}

export interface StrictTask11ModuleSnapshot {
  readonly targets: readonly StrictTask11ModuleTarget[];
  readonly corpusTargets: readonly StrictTask11CorpusTarget[];
  readonly contexts: readonly StrictTask11CorpusContext[];
}

export interface ExactGeneratedTokenSpan {
  readonly start: number;
  readonly end: number;
}

export function findExactGeneratedTokenSpans(
  target: readonly AssembledToken[],
  expected: readonly AssembledToken[],
): readonly ExactGeneratedTokenSpan[] {
  if (expected.length === 0) return Object.freeze([]);
  return Object.freeze(
    target.flatMap((_, start) =>
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
      })
        ? [{ start, end: start + expected.length }]
        : [],
    ),
  );
}

const LICENSED_CLAUSE_FINAL_PARTICLE_IDS = Object.freeze([
  "question-ka",
  "interactional-ne",
  "interactional-yo",
]);

export function hasAuthoredClauseFinalSuffix(
  target: BaseVisibleTarget,
  end: number,
): boolean {
  const authoredParticleIds: ReadonlySet<string> = new Set(
    (target.particleBindings ?? []).map(({ particleSense }) => particleSense),
  );
  return target.tokens.slice(end).every((token) => {
    if (token.kind === "punctuation") return true;
    return (
      token.kind === "particle" &&
      LICENSED_CLAUSE_FINAL_PARTICLE_IDS.includes(token.source.referenceId) &&
      authoredParticleIds.has(token.source.referenceId)
    );
  });
}

function tokenIdentity(token: AssembledToken): string {
  return JSON.stringify([
    token.jp,
    token.romaji,
    token.kind,
    token.source.domain,
    token.source.referenceId,
  ]);
}

function tokenSequenceSignature(tokens: readonly AssembledToken[]): string {
  return tokens.map(tokenIdentity).join("\u0000");
}

function tokenMultisetSignature(tokens: readonly AssembledToken[]): string {
  return tokens.map(tokenIdentity).sort().join("\u0000");
}

export function isExactOrderChunkPermutation(
  entry: StrictTask11CorpusTarget,
  corpusTargets: readonly StrictTask11CorpusTarget[],
): boolean {
  if (
    entry.source !== "option" ||
    entry.operation !== "order-chunks" ||
    entry.activityId === null
  ) {
    return false;
  }
  const accepted = corpusTargets.find(
    (candidate) =>
      candidate.activityId === entry.activityId &&
      candidate.source === "accepted-answer",
  );
  return (
    accepted !== undefined &&
    tokenMultisetSignature(entry.target.tokens) ===
      tokenMultisetSignature(accepted.target.tokens) &&
    tokenSequenceSignature(entry.target.tokens) !==
      tokenSequenceSignature(accepted.target.tokens)
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

export function strictTask11ModuleSnapshot(
  value: unknown,
): StrictTask11ModuleSnapshot | undefined {
  const module = ownDataRecordSnapshot(value);
  const lessons = module ? ownDataArraySnapshot(module.lessons) : undefined;
  if (!lessons) return undefined;
  const targets: StrictTask11ModuleTarget[] = [];
  const corpusTargets: StrictTask11CorpusTarget[] = [];
  const contexts: StrictTask11CorpusContext[] = [];
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
    for (const [exampleIndex, exampleValue] of examples.entries()) {
      const example = ownDataRecordSnapshot(exampleValue);
      const target = strictRuntimeExample(exampleValue);
      if (!example || !target) return undefined;
      targets.push({ lessonId, source: "example", target });
      corpusTargets.push({
        lessonId,
        activityId: null,
        occurrenceId:
          typeof example.id === "string"
            ? example.id
            : `${lessonId}:example:${exampleIndex}`,
        source: "example",
        operation: null,
        target,
      });
    }
    const dialogueValue = lesson.dialogue;
    if (dialogueValue !== null) {
      const dialogue = ownDataRecordSnapshot(dialogueValue);
      const turns = dialogue
        ? ownDataArraySnapshot(dialogue.turns)
        : undefined;
      if (!turns) return undefined;
      for (const [turnIndex, turnValue] of turns.entries()) {
        const turn = ownDataRecordSnapshot(turnValue);
        const target = strictRuntimeDialogueTurn(turnValue);
        if (!turn || !target) return undefined;
        targets.push({ lessonId, source: "dialogue", target });
        corpusTargets.push({
          lessonId,
          activityId: null,
          occurrenceId:
            typeof turn.id === "string"
              ? turn.id
              : `${lessonId}:dialogue:${turnIndex}`,
          source: "dialogue",
          operation: null,
          target,
        });
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
      const prompt = design
        ? strictRuntimeVisibleTarget(design.promptTarget)
        : undefined;
      const context = design
        ? ownDataRecordSnapshot(design.contextTarget)
        : undefined;
      const activityId = design?.id;
      const acceptedId = design?.acceptedAnswerTargetId;
      const optionIds = design
        ? ownDataArraySnapshot(design.optionTargetIds)
        : undefined;
      const audioTargetId = design?.audioTargetId;
      const operation = design?.operation;
      if (
        !design ||
        !options ||
        !accepted ||
        !prompt ||
        !context ||
        typeof activityId !== "string" ||
        typeof acceptedId !== "string" ||
        !optionIds ||
        optionIds.length !== options.length ||
        optionIds.some((id) => typeof id !== "string") ||
        (audioTargetId !== null && typeof audioTargetId !== "string") ||
        typeof operation !== "string" ||
        typeof context.copyId !== "string"
      ) {
        return undefined;
      }
      corpusTargets.push({
        lessonId,
        activityId,
        occurrenceId: `${activityId}:prompt`,
        source: "prompt",
        operation,
        target: prompt,
      });
      contexts.push({ lessonId, activityId, copyId: context.copyId });
      targets.push({ lessonId, source: "accepted-answer", target: accepted });
      corpusTargets.push({
        lessonId,
        activityId,
        occurrenceId: acceptedId,
        source: operation === "produce-spoken" ? "spoken" : "accepted-answer",
        operation,
        target: accepted,
      });
      if (audioTargetId !== null) {
        corpusTargets.push({
          lessonId,
          activityId,
          occurrenceId: acceptedId,
          source: "audio",
          operation,
          target: accepted,
        });
      }
      for (const [optionIndex, optionValue] of options.entries()) {
        const target = strictRuntimeVisibleTarget(optionValue);
        if (!target) return undefined;
        targets.push({ lessonId, source: "option", target });
        corpusTargets.push({
          lessonId,
          activityId,
          occurrenceId: optionIds[optionIndex] as string,
          source: "option",
          operation,
          target,
        });
      }
    }
  }
  return Object.freeze({
    targets: Object.freeze(targets),
    corpusTargets: Object.freeze(corpusTargets),
    contexts: Object.freeze(contexts),
  });
}

export function strictTask11ModuleTargets(
  value: unknown,
): readonly StrictTask11ModuleTarget[] | undefined {
  return strictTask11ModuleSnapshot(value)?.targets;
}

export interface Task11CorpusCollision {
  readonly surface: string;
  readonly lessonId: string;
  readonly activityId: string | null;
  readonly source: StrictTask11CorpusSource | "context";
  readonly priorLessonId: string;
  readonly priorActivityId: string | null;
  readonly priorSource: StrictTask11CorpusSource | "context";
}

interface CorpusOccurrence {
  readonly lessonId: string;
  readonly activityId: string | null;
  readonly occurrenceId: string;
  readonly source: StrictTask11CorpusSource | "context";
  readonly operation: string | null;
  readonly tokenCount: number;
}

function normalizedCorpusSurface(tokens: readonly AssembledToken[]): string {
  return tokens
    .map(({ jp }) => jp)
    .join("")
    .normalize("NFKC")
    .trim()
    .replace(/^(?:はい|いいえ)[、,]?/u, "")
    .replace(/[\s。、，,.!?！？]/gu, "");
}

function japaneseContextSurfaces(copy: string): readonly string[] {
  return (
    copy
      .normalize("NFKC")
      .match(
        /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々ー\s。、，,.!?！？]+/gu,
      ) ?? []
  )
    .map((surface) =>
      surface
        .trim()
        .replace(/^(?:はい|いいえ)[、,]?/u, "")
        .replace(/[\s。、，,.!?！？]/gu, ""),
    )
    .filter((surface) => surface.length > 1);
}

function isPermittedSameActivitySourceReuse(
  left: CorpusOccurrence,
  right: CorpusOccurrence,
): boolean {
  return (
    left.activityId !== null &&
    left.activityId === right.activityId &&
    (left.operation === "diagnose-error" ||
      left.operation === "transform-form") &&
    ((left.source === "prompt" &&
      (right.source === "option" || right.source === "accepted-answer")) ||
      (right.source === "prompt" &&
        (left.source === "option" || left.source === "accepted-answer")))
  );
}

export function validateTask11CorpusDistinctness(
  moduleValues: readonly unknown[],
  copyEn: Readonly<Record<string, string>>,
  copyIt: Readonly<Record<string, string>>,
): readonly Task11CorpusCollision[] | undefined {
  const copyEnSnapshot = ownDataRecordSnapshot(copyEn);
  const copyItSnapshot = ownDataRecordSnapshot(copyIt);
  if (
    !copyEnSnapshot ||
    !copyItSnapshot ||
    Object.values(copyEnSnapshot).some((copy) => typeof copy !== "string") ||
    Object.values(copyItSnapshot).some((copy) => typeof copy !== "string")
  ) {
    return undefined;
  }
  const snapshots = moduleValues.map(strictTask11ModuleSnapshot);
  if (snapshots.some((snapshot) => snapshot === undefined)) return undefined;
  const collisions: Task11CorpusCollision[] = [];
  const seen = new Map<string, CorpusOccurrence[]>();
  const register = (surface: string, current: CorpusOccurrence) => {
    if (!surface || (current.source === "prompt" && current.tokenCount < 2)) {
      return;
    }
    const priorOccurrences = seen.get(surface) ?? [];
    for (const prior of priorOccurrences) {
      if (
        prior.occurrenceId === current.occurrenceId ||
        isPermittedSameActivitySourceReuse(prior, current)
      ) {
        continue;
      }
      collisions.push({
        surface,
        lessonId: current.lessonId,
        activityId: current.activityId,
        source: current.source,
        priorLessonId: prior.lessonId,
        priorActivityId: prior.activityId,
        priorSource: prior.source,
      });
    }
    priorOccurrences.push(current);
    seen.set(surface, priorOccurrences);
  };

  for (const snapshot of snapshots as readonly StrictTask11ModuleSnapshot[]) {
    for (const entry of snapshot.corpusTargets) {
      register(normalizedCorpusSurface(entry.target.tokens), {
        lessonId: entry.lessonId,
        activityId: entry.activityId,
        occurrenceId: entry.occurrenceId,
        source: entry.source,
        operation: entry.operation,
        tokenCount: entry.target.tokens.filter(
          ({ kind }) => kind !== "punctuation",
        ).length,
      });
    }
    for (const context of snapshot.contexts) {
      const occurrenceId = `${context.activityId}:context`;
      const surfaces = new Set([
        ...japaneseContextSurfaces(
          (copyEnSnapshot[context.copyId] as string | undefined) ?? "",
        ),
        ...japaneseContextSurfaces(
          (copyItSnapshot[context.copyId] as string | undefined) ?? "",
        ),
      ]);
      for (const surface of surfaces) {
        register(surface, {
          lessonId: context.lessonId,
          activityId: context.activityId,
          occurrenceId,
          source: "context",
          operation: null,
          tokenCount: 2,
        });
      }
    }
  }
  return Object.freeze(collisions);
}

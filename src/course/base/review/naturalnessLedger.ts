import { deepFreeze } from "../../foundations/deepFreeze";
import type { BaseVisibleTarget } from "../catalog/types";
import { BASE_AUDIO_CATALOG } from "../audio/catalog";
import { baseNavigationCopyEn } from "../copy/en";
import { baseNavigationCopyIt } from "../copy/it";
import {
  BASE_SOUND_MODULE,
  BASE_SOUND_TARGET_BY_ID,
} from "../content/module01Sounds";
import { BASE_SENTENCE_FOUNDATIONS_MODULE } from "../content/module02SentenceFoundations";
import { BASE_TOPIC_QUESTIONS_MODULE } from "../content/module03TopicQuestions";
import {
  BASE_POLITE_VERBS_MODULE,
} from "../content/module04PoliteVerbs";
import { BASE_ARGUMENT_PARTICLES_MODULE } from "../content/module05ArgumentParticles";
import { BASE_TIME_MOVEMENT_MODULE } from "../content/module06TimeMovement";
import { BASE_COPULA_ADJECTIVES_MODULE } from "../content/module07CopulaAdjectives";
import { BASE_EXISTENCE_LOCATION_MODULE } from "../content/module08ExistenceLocation";
import { BASE_REQUESTS_CONNECTION_MODULE } from "../content/module09RequestsConnection";
import { BASE_SYNTHESIS_MODULE } from "../content/module10Synthesis";
import { canonicalReviewFingerprint } from "./fingerprint";

export type BaseNaturalnessSourceKind =
  | "example"
  | "dialogue-turn"
  | "prompt"
  | "option"
  | "accepted-answer"
  | "spoken-answer"
  | "audio-string"
  | "localized-copy";

interface BaseNaturalnessReviewEntryCommon {
  readonly contentId: string;
  readonly lessonId: string;
  readonly sourceId: string;
  readonly sourceKind: BaseNaturalnessSourceKind;
  readonly jp: string;
  readonly en: string;
  readonly it: string;
  readonly fingerprint: string;
}

export type BaseNaturalnessReviewEntry =
  | (BaseNaturalnessReviewEntryCommon &
      Readonly<{ readonly status: "pending" }>)
  | (BaseNaturalnessReviewEntryCommon &
      Readonly<{
        readonly status: "accepted";
        readonly reviewerIdentity: string;
        readonly reviewedAt: string;
      }>);

interface ReviewSource extends Omit<BaseNaturalnessReviewEntryCommon, "fingerprint"> {
  readonly payload: unknown;
}

interface ExternalAcceptance {
  readonly contentId: string;
  readonly fingerprint: string;
  readonly reviewerIdentity: string;
  readonly reviewedAt: string;
}

// Populated only from an independently supplied review handoff.
const EXTERNAL_ACCEPTANCES: readonly ExternalAcceptance[] = deepFreeze([]);

const SEMANTIC_LESSONS = [
  ...BASE_SENTENCE_FOUNDATIONS_MODULE.lessons,
  ...BASE_TOPIC_QUESTIONS_MODULE.lessons,
  ...BASE_POLITE_VERBS_MODULE.lessons,
  ...BASE_ARGUMENT_PARTICLES_MODULE.lessons,
  ...BASE_TIME_MOVEMENT_MODULE.lessons,
  ...BASE_COPULA_ADJECTIVES_MODULE.lessons,
  ...BASE_EXISTENCE_LOCATION_MODULE.lessons,
  ...BASE_REQUESTS_CONNECTION_MODULE.lessons,
  ...BASE_SYNTHESIS_MODULE.lessons,
];

function japanese(target: BaseVisibleTarget): string {
  return target.tokens.map(({ jp }) => jp).join("");
}

function copyPair(copyId: string): Readonly<{ en: string; it: string }> {
  const en = baseNavigationCopyEn.content[copyId];
  const it = baseNavigationCopyIt.content[copyId];
  return {
    en: typeof en === "string" ? en : "",
    it: typeof it === "string" ? it : "",
  };
}

function targetSource(
  contentId: string,
  lessonId: string,
  sourceId: string,
  sourceKind: Exclude<BaseNaturalnessSourceKind, "localized-copy">,
  target: BaseVisibleTarget,
  en = "",
  it = "",
  extraPayload: unknown = null,
): ReviewSource {
  return {
    contentId,
    lessonId,
    sourceId,
    sourceKind,
    jp: japanese(target),
    en,
    it,
    payload: { target, extraPayload },
  };
}

function localizedSource(
  lessonId: string,
  copyId: string,
  jp: string,
  payload: unknown,
): ReviewSource | null {
  const { en, it } = copyPair(copyId);
  if (!en || !it) return null;
  return {
    contentId: `copy:${copyId}`,
    lessonId,
    sourceId: copyId,
    sourceKind: "localized-copy",
    jp,
    en,
    it,
    payload: { copyId, en, it, source: payload },
  };
}

function buildReviewSources(): readonly ReviewSource[] {
  const sources: ReviewSource[] = [];
  const localized = new Map<string, ReviewSource>();
  const addLocalized = (
    lessonId: string,
    copyId: string | null | undefined,
    jp: string,
    payload: unknown,
  ): void => {
    if (!copyId || localized.has(copyId)) return;
    const source = localizedSource(lessonId, copyId, jp, payload);
    if (source) localized.set(copyId, source);
  };

  for (const lesson of BASE_SOUND_MODULE.lessons) {
    const lessonId = lesson.content.lessonId;
    for (const anchor of lesson.anchorWords) {
      const meaning = copyPair(anchor.meaningCopyId);
      sources.push({
        contentId: `${lessonId}:example:${anchor.id}`,
        lessonId,
        sourceId: anchor.id,
        sourceKind: "example",
        jp: anchor.kana,
        en: meaning.en,
        it: meaning.it,
        payload: anchor,
      });
      addLocalized(lessonId, anchor.meaningCopyId, anchor.kana, anchor);
    }
    for (const design of lesson.activityDesigns) {
      const activity = lesson.content.activities.find(
        ({ id }) => id === design.activityId,
      );
      const prompt = BASE_SOUND_TARGET_BY_ID.get(design.promptTargetId);
      const accepted = BASE_SOUND_TARGET_BY_ID.get(design.answerTargetId);
      if (!activity || !prompt || !accepted) {
        throw new Error(`Incomplete sound review source "${design.activityId}".`);
      }
      sources.push({
        contentId: `${design.activityId}:prompt`,
        lessonId,
        sourceId: design.promptTargetId,
        sourceKind: "prompt",
        jp: prompt.kana,
        en: "",
        it: "",
        payload: prompt,
      });
      design.optionTargetIds.forEach((id, index) => {
        const option = BASE_SOUND_TARGET_BY_ID.get(id);
        if (!option) throw new Error(`Missing sound option "${id}".`);
        sources.push({
          contentId: `${design.activityId}:option:${index + 1}`,
          lessonId,
          sourceId: id,
          sourceKind: "option",
          jp: option.kana,
          en: "",
          it: "",
          payload: option,
        });
      });
      sources.push({
        contentId: `${design.activityId}:${
          design.correctOptionTargetId === null ? "spoken" : "accepted"
        }`,
        lessonId,
        sourceId: design.answerTargetId,
        sourceKind:
          design.correctOptionTargetId === null
            ? "spoken-answer"
            : "accepted-answer",
        jp: accepted.kana,
        en: "",
        it: "",
        payload: accepted,
      });
      addLocalized(
        lessonId,
        activity.instructionCopyId,
        prompt.kana,
        design,
      );
      addLocalized(
        lessonId,
        activity.acceptedFeedbackCopyId,
        accepted.kana,
        design,
      );
      addLocalized(
        lessonId,
        activity.retryFeedbackCopyId,
        prompt.kana,
        design,
      );
    }
  }

  for (const lesson of SEMANTIC_LESSONS) {
    const lessonId = lesson.content.lessonId;
    lesson.examples.forEach((example) => {
      const translationCopyId =
        "copyId" in example.translationCopy
          ? example.translationCopy.copyId
          : example.translationCopy.enCopyId;
      const translation = copyPair(translationCopyId);
      const jp = japanese(example);
      sources.push(
        targetSource(
          `${lessonId}:example:${example.id}`,
          lessonId,
          example.id,
          "example",
          example,
          translation.en,
          translation.it,
        ),
      );
      addLocalized(lessonId, translationCopyId, jp, example);
      addLocalized(lessonId, example.teachingPurposeCopyId, jp, example);
      addLocalized(lessonId, example.contextCopyId, jp, example);
    });

    if (lesson.dialogue) {
      const firstSurface = japanese(lesson.dialogue.turns[0]);
      addLocalized(
        lessonId,
        lesson.dialogue.practicalOutcomeCopyId,
        firstSurface,
        lesson.dialogue,
      );
      lesson.dialogue.turns.forEach((turn, index) => {
        const copy = lesson.dialogue?.turnCopy[index];
        const translation = copy
          ? copyPair(copy.translationCopyId)
          : { en: "", it: "" };
        const sourceId = `${lesson.dialogue?.id}-turn-${index + 1}`;
        const jp = japanese(turn);
        sources.push(
          targetSource(
            `${lessonId}:dialogue:${index + 1}`,
            lessonId,
            sourceId,
            "dialogue-turn",
            turn,
            translation.en,
            translation.it,
          ),
        );
        addLocalized(lessonId, copy?.translationCopyId, jp, turn);
        addLocalized(lessonId, copy?.purposeCopyId, jp, turn);
      });
    }

    lesson.activityDesigns.forEach((design, index) => {
      const activity = lesson.content.activities[index];
      const promptJp = japanese(design.promptTarget);
      sources.push(
        targetSource(
          `${activity.id}:prompt`,
          lessonId,
          `${activity.id}:prompt`,
          "prompt",
          design.promptTarget,
          "",
          "",
          design.contextTarget,
        ),
      );
      design.optionTargets.forEach((option, optionIndex) => {
        sources.push(
          targetSource(
            `${activity.id}:option:${optionIndex + 1}`,
            lessonId,
            design.optionTargetIds[optionIndex],
            "option",
            option,
            "",
            "",
            {
              factStatus: design.optionFactStatus[optionIndex],
              reviewEvidence:
                "reviewEvidence" in design ? design.reviewEvidence : null,
            },
          ),
        );
      });
      const spoken = design.correctOptionIndex === null;
      sources.push(
        targetSource(
          `${activity.id}:${spoken ? "spoken" : "accepted"}`,
          lessonId,
          design.acceptedAnswerTargetId,
          spoken ? "spoken-answer" : "accepted-answer",
          design.acceptedAnswerTarget,
          "",
          "",
          {
            operationEvidence: design.operationEvidence,
            reviewEvidence:
              "reviewEvidence" in design ? design.reviewEvidence : null,
          },
        ),
      );
      if (design.audioContract) {
        sources.push(
          targetSource(
            `${activity.id}:audio`,
            lessonId,
            design.audioContract.targetId,
            "audio-string",
            design.acceptedAnswerTarget,
            "",
            "",
            design.audioContract,
          ),
        );
      }
      addLocalized(
        lessonId,
        activity.instructionCopyId,
        promptJp,
        design,
      );
      addLocalized(
        lessonId,
        activity.acceptedFeedbackCopyId,
        japanese(design.acceptedAnswerTarget),
        design,
      );
      addLocalized(
        lessonId,
        activity.retryFeedbackCopyId,
        promptJp,
        design,
      );
    });

    const anchorJp =
      lesson.examples[0] !== undefined
        ? japanese(lesson.examples[0])
        : lesson.content.lessonId;
    addLocalized(lessonId, lesson.titleCopyId, anchorJp, lesson.explanation);
    addLocalized(lessonId, lesson.objectiveCopyId, anchorJp, lesson.explanation);
    addLocalized(
      lessonId,
      lesson.explanation.mainCopyId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(
      lessonId,
      lesson.explanation.constructionCopyId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(
      lessonId,
      lesson.explanation.constraintsCopyId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(
      lessonId,
      lesson.explanation.commonErrorCopyId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(
      lessonId,
      lesson.explanation.nearestContrastId,
      anchorJp,
      lesson.explanation,
    );
    addLocalized(lessonId, lesson.content.recapCopyId, anchorJp, lesson.content);
  }

  for (const record of BASE_AUDIO_CATALOG) {
    sources.push({
      contentId: `audio-string:${record.id}`,
      lessonId: record.id.replace(/^snd(\d+)-.*$/u, "sounds-$1"),
      sourceId: record.id,
      sourceKind: "audio-string",
      jp: record.kana,
      en: record.meaning.en,
      it: record.meaning.it,
      payload: {
        id: record.id,
        kana: record.kana,
        morae: record.morae,
        sha256: record.sha256,
        fingerprint: record.fingerprint,
      },
    });
  }

  sources.push(...localized.values());
  return deepFreeze(
    sources.sort((left, right) => left.contentId.localeCompare(right.contentId)),
  );
}

const REVIEW_SOURCES = buildReviewSources();

function fingerprintFor(source: ReviewSource): string {
  return canonicalReviewFingerprint({
    contentId: source.contentId,
    lessonId: source.lessonId,
    sourceId: source.sourceId,
    sourceKind: source.sourceKind,
    jp: source.jp,
    en: source.en,
    it: source.it,
    payload: source.payload,
  });
}

export const BASE_NATURALNESS_CURRENT_CORPUS_FINGERPRINT =
  canonicalReviewFingerprint(
    REVIEW_SOURCES.map((source) => ({
      contentId: source.contentId,
      fingerprint: fingerprintFor(source),
    })),
  );

const INVENTORIED_CORPUS_FINGERPRINT =
  "5f846dde60bf049f231a5d8940c17707fefc2db6fc596972ada0d5c6a5b588ee";

const acceptanceByContentId = new Map(
  EXTERNAL_ACCEPTANCES.map((acceptance) => [acceptance.contentId, acceptance]),
);

export const BASE_NATURALNESS_REVIEW_INVENTORY: readonly BaseNaturalnessReviewEntry[] =
  deepFreeze(
    REVIEW_SOURCES.map((source): BaseNaturalnessReviewEntry => {
      const fingerprint = fingerprintFor(source);
      const acceptance = acceptanceByContentId.get(source.contentId);
      const common = {
        contentId: source.contentId,
        lessonId: source.lessonId,
        sourceId: source.sourceId,
        sourceKind: source.sourceKind,
        jp: source.jp,
        en: source.en,
        it: source.it,
        fingerprint,
      };
      return acceptance && acceptance.fingerprint === fingerprint
        ? {
            ...common,
            status: "accepted",
            reviewerIdentity: acceptance.reviewerIdentity,
            reviewedAt: acceptance.reviewedAt,
          }
        : { ...common, status: "pending" };
    }),
  );

export type BaseNaturalnessReviewError =
  | "invalid-inventory-shape"
  | "malformed-entry"
  | "duplicate-entry"
  | "missing-entry"
  | "stale-entry"
  | "stale-corpus-fingerprint";

export interface BaseNaturalnessReviewValidation {
  readonly ok: boolean;
  readonly errors: readonly BaseNaturalnessReviewError[];
}

function densePlainArray(value: unknown): readonly unknown[] | null {
  if (!Array.isArray(value)) return null;
  try {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (Object.getOwnPropertyNames(value).length !== value.length + 1) {
      return null;
    }
    const result: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        !descriptor ||
        !descriptor.enumerable ||
        !("value" in descriptor)
      ) {
        return null;
      }
      result.push(descriptor.value);
    }
    return result;
  } catch {
    return null;
  }
}

function plainEntry(
  value: unknown,
): Readonly<Record<string, unknown>> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  try {
    const prototype = Object.getPrototypeOf(value);
    if (
      (prototype !== Object.prototype && prototype !== null) ||
      Object.getOwnPropertySymbols(value).length > 0
    ) {
      return null;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (
      Object.getOwnPropertyNames(value).some((name) => {
        const descriptor = descriptors[name];
        return !descriptor || !descriptor.enumerable || !("value" in descriptor);
      })
    ) {
      return null;
    }
    return Object.fromEntries(
      Object.entries(descriptors).map(([name, descriptor]) => [
        name,
        "value" in descriptor ? descriptor.value : undefined,
      ]),
    );
  } catch {
    return null;
  }
}

export function validateBaseNaturalnessReviewInventory(
  value: unknown,
): BaseNaturalnessReviewValidation {
  const values = densePlainArray(value);
  if (!values) {
    return { ok: false, errors: ["invalid-inventory-shape"] };
  }
  const errors = new Set<BaseNaturalnessReviewError>();
  const expected = new Map(
    BASE_NATURALNESS_REVIEW_INVENTORY.map((entry) => [entry.contentId, entry]),
  );
  const seen = new Set<string>();
  for (const value of values) {
    const entry = plainEntry(value);
    if (!entry || typeof entry.contentId !== "string") {
      errors.add("malformed-entry");
      continue;
    }
    if (seen.has(entry.contentId)) errors.add("duplicate-entry");
    seen.add(entry.contentId);
    const canonical = expected.get(entry.contentId);
    if (!canonical) {
      errors.add("stale-entry");
      continue;
    }
    const expectedKeys = Object.keys(canonical).sort();
    const actualKeys = Object.keys(entry).sort();
    if (
      actualKeys.length !== expectedKeys.length ||
      actualKeys.some((key, index) => key !== expectedKeys[index]) ||
      expectedKeys.some(
        (key) =>
          entry[key] !==
          (canonical as unknown as Readonly<Record<string, unknown>>)[key],
      )
    ) {
      errors.add("stale-entry");
    }
  }
  for (const contentId of expected.keys()) {
    if (!seen.has(contentId)) errors.add("missing-entry");
  }
  if (
    BASE_NATURALNESS_CURRENT_CORPUS_FINGERPRINT !==
    INVENTORIED_CORPUS_FINGERPRINT
  ) {
    errors.add("stale-corpus-fingerprint");
  }
  return {
    ok: errors.size === 0,
    errors: [...errors],
  };
}

export const BASE_NATURALNESS_REVIEW_VALIDATION =
  validateBaseNaturalnessReviewInventory(
    BASE_NATURALNESS_REVIEW_INVENTORY,
  );

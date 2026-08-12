import { deepFreeze } from "../../foundations/deepFreeze";
import { immutableReadonlyMap } from "../../foundations/immutableReadonlyMap";
import type { CanDo, CanDoDomain, CanDoId, LessonId, ModuleId } from "../../foundations/types";
import { BASE_LESSON_IDS_BY_MODULE, BASE_MODULE_IDS } from "../manifest";

const CANDO_IDS_BY_MODULE: Readonly<Record<ModuleId, CanDoId>> = {
  sounds: "a1-can-do-sounds",
  "sentence-foundations": "a1-can-do-sentence-foundations",
  "topic-questions": "a1-can-do-topic-questions",
  "polite-verbs": "a1-can-do-polite-verbs",
  "argument-particles": "base-can-do-argument-particles",
  "time-movement": "a1-can-do-time-movement",
  "copula-adjectives": "base-can-do-copula-adjectives",
  "existence-location": "base-can-do-existence-location",
  "requests-connection": "base-can-do-requests-connection",
  "base-synthesis": "base-can-do-synthesis",
};

const DOMAIN_BY_MODULE: Readonly<Record<ModuleId, CanDoDomain>> = {
  sounds: "listening",
  "sentence-foundations": "spoken-production",
  "topic-questions": "interaction",
  "polite-verbs": "interaction",
  "argument-particles": "spoken-production",
  "time-movement": "interaction",
  "copula-adjectives": "spoken-production",
  "existence-location": "interaction",
  "requests-connection": "interaction",
  "base-synthesis": "interaction",
};

export const BASE_MODULE_CAN_DO_IDS_BY_MODULE: Readonly<
  Record<ModuleId, readonly CanDoId[]>
> = deepFreeze(
  Object.fromEntries(
    BASE_MODULE_IDS.map((moduleId) => [moduleId, [CANDO_IDS_BY_MODULE[moduleId]]]),
  ),
);

export const BASE_CAN_DO_IDS: readonly CanDoId[] = deepFreeze(
  BASE_MODULE_IDS.map((moduleId) => CANDO_IDS_BY_MODULE[moduleId]),
);

function canDoForModule(moduleId: ModuleId): CanDo {
  const id = CANDO_IDS_BY_MODULE[moduleId];
  const lessonIds: readonly LessonId[] = BASE_LESSON_IDS_BY_MODULE[moduleId];
  return {
    id,
    level: "a0",
    domain: DOMAIN_BY_MODULE[moduleId],
    descriptorCopyId: `${id}-descriptor`,
    contextIds: [],
    lessonIds,
    checkpointEvidenceRule: {
      evidenceKind: "checkpoint-sampled",
      minAcceptedTransferTargets: 2,
    },
    sourceNote: "product-authored-jf-cefr-aligned",
  };
}

export const baseCanDos: readonly CanDo[] = deepFreeze(
  BASE_MODULE_IDS.map((moduleId) => canDoForModule(moduleId)),
);

export const baseCanDoById: ReadonlyMap<CanDoId, CanDo> = immutableReadonlyMap(
  baseCanDos.map((canDo) => [canDo.id, canDo]),
);

export interface BaseCanDoOutcome {
  readonly moduleId: ModuleId;
  readonly canDoId: CanDoId;
  readonly mechanicsLabel:
    | "a1-performance-mechanics"
    | "practical-mechanics";
  readonly lessonIds: readonly LessonId[];
  readonly evidenceActivityIds: readonly string[];
  readonly observesAcceptedEvidenceOnly: true;
}

export interface BaseCanDoValidation {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

const SOUND_EVIDENCE_ACTIVITY_IDS: Readonly<Record<string, string>> = deepFreeze({
  "sounds-1": "snd1-discriminate-vowels",
  "sounds-2": "snd2-discriminate-kaga",
  "sounds-3": "snd3-discriminate-obasan",
  "sounds-4": "snd4-discriminate-yoon",
});

function primaryEvidenceActivityId(lessonId: LessonId): string {
  return (
    SOUND_EVIDENCE_ACTIVITY_IDS[lessonId] ?? `${lessonId}-activity-1`
  );
}

export const BASE_CAN_DO_OUTCOMES: readonly BaseCanDoOutcome[] = deepFreeze(
  BASE_MODULE_IDS.map((moduleId) => {
    const lessonIds = BASE_LESSON_IDS_BY_MODULE[moduleId];
    const evidenceActivityIds = lessonIds.map(primaryEvidenceActivityId);
    return {
      moduleId,
      canDoId: CANDO_IDS_BY_MODULE[moduleId],
      mechanicsLabel:
        moduleId === "sounds"
          ? "a1-performance-mechanics"
          : "practical-mechanics",
      lessonIds: [...lessonIds],
      evidenceActivityIds,
      observesAcceptedEvidenceOnly: true,
    };
  }),
);

function validateBaseCanDoOutcomes(): BaseCanDoValidation {
  const errors: string[] = [];
  const canDoIds = new Set<string>();
  BASE_CAN_DO_OUTCOMES.forEach((outcome, index) => {
    if (outcome.moduleId !== BASE_MODULE_IDS[index]) {
      errors.push("module-order");
    }
    if (canDoIds.has(outcome.canDoId)) errors.push("duplicate-can-do");
    canDoIds.add(outcome.canDoId);
    const canDo = baseCanDoById.get(outcome.canDoId);
    if (
      !canDo ||
      outcome.lessonIds.length === 0 ||
      outcome.lessonIds.some((lessonId) => !canDo.lessonIds.includes(lessonId))
    ) {
      errors.push("invalid-lesson-owner");
    }
    if (
      outcome.evidenceActivityIds.length !== outcome.lessonIds.length ||
      outcome.evidenceActivityIds.some(
        (id, evidenceIndex) =>
          id.length === 0 ||
          id !== primaryEvidenceActivityId(outcome.lessonIds[evidenceIndex]),
      )
    ) {
      errors.push("invalid-evidence-owner");
    }
  });
  return {
    ok: errors.length === 0,
    errors: deepFreeze(errors),
  };
}

export const BASE_CAN_DO_VALIDATION = validateBaseCanDoOutcomes();

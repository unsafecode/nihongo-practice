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

import type { Locale } from "../../i18n/LocaleContext";
import { a1CanDosAuthored } from "../a1/catalog/canDos";
import { a2CanDosAuthored } from "../a2/catalog/catalog";
import { a2CanDoDescriptorCopy } from "../a2/catalog/canDos";
import { a2Checkpoint } from "../a2/catalog/checkpoint";
import type { A1CourseArea } from "../a1/types";
import { baseCanDos } from "../base/catalog/canDos";
import { baseCheckpoint } from "../base/catalog/checkpoint";
import { a1RetainedAreas, courseModulesByLevel } from "../data/course";
import type { CourseModule } from "../data/types";
import type { CanDo, CheckpointDefinition } from "../foundations/types";
import { getCourseCopy } from "../i18n/catalog";
import { retainedA1Checkpoint } from "./checkpoints";
import { COURSE_LEVEL_IDS, type CourseLevelId } from "./types";

export interface CourseLevelCopyConfig {
  readonly shortLabelKey: "base" | "a1" | "a2";
  readonly headingKey: "baseHeading" | "a1Heading" | "a2Heading";
  readonly badgeKey: "baseBadge" | "a1Badge" | "a2Badge";
  readonly checkpointHeadingKey:
    | "baseCheckpointHeading"
    | "a1CheckpointHeading"
    | "a2CheckpointHeading";
}

export interface CourseLevelRuntimeConfig {
  readonly id: CourseLevelId;
  readonly modules: readonly CourseModule[];
  readonly areas: readonly A1CourseArea[];
  readonly canDos: readonly CanDo[];
  readonly progressLevel: CourseLevelId;
  readonly checkpoint: CheckpointDefinition;
  readonly copy: CourseLevelCopyConfig;
  readonly resolveDescriptor: (locale: Locale, descriptorCopyId: string) => string | null;
}

function courseCopyDescriptor(locale: Locale, descriptorCopyId: string): string | null {
  const text = getCourseCopy(locale).objectives[descriptorCopyId];
  return text && text.trim() ? text : null;
}

function a2Descriptor(locale: Locale, descriptorCopyId: string): string | null {
  const text = a2CanDoDescriptorCopy[locale][descriptorCopyId];
  return text && text.trim() ? text : null;
}

const retainedA1LessonIds = new Set(
  courseModulesByLevel.a1.flatMap((module) => module.lessons.map((lesson) => lesson.id)),
);

const retainedA1CanDos = a1CanDosAuthored.filter((canDo) =>
  canDo.lessonIds.some((lessonId) => retainedA1LessonIds.has(lessonId)),
);

export const LEVEL_RUNTIME_CONFIG: Readonly<Record<CourseLevelId, CourseLevelRuntimeConfig>> = {
  a0: {
    id: "a0",
    modules: courseModulesByLevel.a0,
    areas: [],
    canDos: baseCanDos,
    progressLevel: "a0",
    checkpoint: baseCheckpoint,
    copy: {
      shortLabelKey: "base",
      headingKey: "baseHeading",
      badgeKey: "baseBadge",
      checkpointHeadingKey: "baseCheckpointHeading",
    },
    resolveDescriptor: courseCopyDescriptor,
  },
  a1: {
    id: "a1",
    modules: courseModulesByLevel.a1,
    areas: a1RetainedAreas,
    canDos: retainedA1CanDos,
    progressLevel: "a1",
    checkpoint: retainedA1Checkpoint,
    copy: {
      shortLabelKey: "a1",
      headingKey: "a1Heading",
      badgeKey: "a1Badge",
      checkpointHeadingKey: "a1CheckpointHeading",
    },
    resolveDescriptor: courseCopyDescriptor,
  },
  a2: {
    id: "a2",
    modules: courseModulesByLevel.a2,
    areas: [],
    canDos: a2CanDosAuthored,
    progressLevel: "a2",
    checkpoint: a2Checkpoint,
    copy: {
      shortLabelKey: "a2",
      headingKey: "a2Heading",
      badgeKey: "a2Badge",
      checkpointHeadingKey: "a2CheckpointHeading",
    },
    resolveDescriptor: a2Descriptor,
  },
};

if (Object.keys(LEVEL_RUNTIME_CONFIG).length !== COURSE_LEVEL_IDS.length) {
  throw new Error("course runtime config: missing a configured course level.");
}

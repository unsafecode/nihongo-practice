import { Link } from "react-router";
import { Icon } from "../../components/icons/Icon";
import { useLocale } from "../../i18n/LocaleContext";
import {
  isA1LessonSectionId,
  isA2LessonSectionId,
  type LessonSectionId,
} from "../../routing/lessonSections";
import { lessonSectionTarget } from "../../routing/lessonSectionTarget";
import { courseModulesByLevel } from "../data/course";
import type { LessonId, ModuleId } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import type { CourseLevelId } from "../levels/types";

/**
 * Normative props (design spec §6.1). The rail is told which sections exist
 * and which one is active; it derives everything else (labels, links, module
 * icon) so it can never disagree with the page it navigates.
 */
export interface LessonRailProps {
  readonly level: CourseLevelId;
  readonly moduleId: ModuleId;
  readonly lessonId: LessonId;
  readonly sections: readonly LessonSectionId[];
  readonly activeSectionId: LessonSectionId;
}

/**
 * Lesson rail / scrollspy navigation. Base (`a0`) and A1 share the same six
 * vocabulary-first section anchors (each with its own localized labels), and
 * A2 keeps its established four labels; each drives both a desktop sticky
 * rail and a mobile sticky context bar. The active step carries
 * `aria-current="step"`, every step is a router-safe link built through the
 * shared `lessonSectionTarget` helper (so a link and `RouteScrollManager` can
 * never disagree), and the module's semantic icon is shown for orientation.
 */
export function LessonRail({
  level,
  moduleId,
  lessonId,
  sections,
  activeSectionId,
}: LessonRailProps) {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const courseModule = courseModulesByLevel[level].find(
    (item) => item.id === moduleId,
  );

  const sectionLabel = (sectionId: LessonSectionId): string => {
    if (level === "a2") return isA2LessonSectionId(sectionId) ? copy.lesson.sections[sectionId] : "";
    if (level === "a0") return isA1LessonSectionId(sectionId) ? copy.baseLesson.sections[sectionId] : "";
    return isA1LessonSectionId(sectionId) ? copy.a1Lesson.sections[sectionId] : "";
  };

  const steps = sections.map((sectionId, index) => ({
    sectionId,
    index: index + 1,
    label: sectionLabel(sectionId),
    target: lessonSectionTarget(moduleId, lessonId, sectionId),
  }));


  const renderSteps = (variant: string) => (
    <ol className={`${variant}__list`}>
      {steps.map((step) => (
        <li key={step.sectionId}>
          <Link
            className={`${variant}__step`}
            to={step.target.to}
            aria-current={
              step.sectionId === activeSectionId ? "step" : undefined
            }
          >
            <span className={`${variant}__index`} aria-hidden="true">
              {step.index}
            </span>
            <span className={`${variant}__label`}>{step.label}</span>
          </Link>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <nav className="lesson-rail" aria-label={copy.lesson.railLabel}>
        <p className="lesson-rail__module">
          {courseModule ? (
            <Icon id={courseModule.iconId} size="small" decorative />
          ) : null}
          <span>{copy.lesson.railLabel}</span>
        </p>
        {renderSteps("lesson-rail")}
      </nav>
      <nav
        className="lesson-rail-mobile"
        aria-label={copy.lesson.sectionMenuLabel}
      >
        <span className="lesson-rail-mobile__module" aria-hidden="true">
          {courseModule ? (
            <Icon id={courseModule.iconId} size="small" decorative />
          ) : null}
        </span>
        {renderSteps("lesson-rail-mobile")}
      </nav>
    </>
  );
}

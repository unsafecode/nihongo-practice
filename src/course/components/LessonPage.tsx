import { useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { ActionLink } from "../../components/actions/Action";
import { Icon } from "../../components/icons/Icon";
import { Notice } from "../../components/Notice";
import { SpeechNotice } from "../../components/SpeechNotice";
import { useSpeech } from "../../hooks/useSpeech";
import { useLocale } from "../../i18n/LocaleContext";
import {
  LESSON_SECTION_ANCHOR_CLASS,
  LESSON_SECTION_IDS,
  lessonSectionAnchorId,
} from "../../routing/lessonSections";
import { lessonPath, routePaths } from "../../routing/routes";
import { courseModules } from "../data/course";
import type { LessonSection } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import {
  isLegacyModuleRedirectState,
  LEGACY_MODULE_REDIRECT_STATE,
  resolveLessonRoute,
} from "../routing/lessonRouteResolution";
import { useProgress } from "../progress/ProgressContext";
import { GuidedToolLink } from "./GuidedToolLink";
import { GuidedJourney } from "./GuidedJourney";
import { GuidedTransformation } from "./GuidedTransformation";
import { LessonRail } from "./LessonRail";
import { TransformComparison } from "./TransformComparison";
import { useActiveSection } from "./useActiveSection";

const orderedLessons = courseModules.flatMap((courseModule) =>
  courseModule.lessons.map((lesson) => ({ courseModule, lesson })),
);

export function LessonPage() {
  // The URL's `:moduleId` segment must name either the lesson's real
  // module or a recognized legacy alias for it (see
  // routing/lessonRouteResolution.ts): a lesson is never accepted by its
  // `lessonId` alone, so a mismatched module (e.g. an unrelated module
  // paired with someone else's lesson) resolves invalid instead of
  // silently rendering the wrong module's lesson.
  const { moduleId, lessonId } = useParams<{
    moduleId: string;
    lessonId: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { supported, japaneseVoiceAvailable, playbackFailed } = useSpeech();
  const { markVisited } = useProgress();
  const activeSectionId = useActiveSection(LESSON_SECTION_IDS);
  const resolution = resolveLessonRoute(moduleId, lessonId, courseModules);
  // A stable primitive derived from `resolution`, used (instead of the
  // `resolution` object itself, which is a fresh reference every render) as
  // the effect dependency below: it only actually changes when the matched
  // lesson changes, so the effect - and the markVisited call it makes -
  // does not re-run every render even though `resolution` always does.
  const matchedLessonId = resolution.kind === "match" ? resolution.lesson.id : null;

  useEffect(() => {
    if (matchedLessonId !== null) markVisited(matchedLessonId);
  }, [matchedLessonId, markVisited]);

  if (resolution.kind === "invalid") {
    return (
      <Navigate
        replace
        to={routePaths.course}
        state={{ invalidPath: location.pathname }}
      />
    );
  }

  if (resolution.kind === "redirect") {
    return (
      <Navigate
        replace
        to={lessonPath(resolution.courseModule.id, resolution.lesson.id)}
        state={
          resolution.moduleChanged
            ? LEGACY_MODULE_REDIRECT_STATE
            : undefined
        }
      />
    );
  }

  const { courseModule, lesson } = resolution;
  const showLegacyModuleNotice = isLegacyModuleRedirectState(location.state);

  const currentIndex = orderedLessons.findIndex(
    (item) => item.lesson.id === lesson.id,
  );
  const previous = orderedLessons[currentIndex - 1];
  const next = orderedLessons[currentIndex + 1];
  const lessonCopy = copy.lessons[lesson.titleCopyId];
  const objective = lesson.objectiveCopyIds
    .map((id) => copy.objectives[id])
    .join(" ");

  const renderSectionBody = (section: LessonSection) => {
    switch (section.id) {
      case "rule": {
        const content = copy.blocks[section.copyId];
        return (
          <div className="lesson-rule">
            <span className="lesson-rule__gear" lang="ja" aria-hidden="true">
              {section.gear}
            </span>
            <div className="lesson-rule__body">
              {content.eyebrow ? (
                <p className="course-eyebrow">{content.eyebrow}</p>
              ) : null}
              <h3>{content.title}</h3>
              {content.body ? <p>{content.body}</p> : null}
            </div>
          </div>
        );
      }
      case "comparison": {
        const content = copy.blocks[section.copyId];
        return (
          <>
            <div className="lesson-section__intro">
              <h3>{content.title}</h3>
              {content.body ? <p>{content.body}</p> : null}
            </div>
            <TransformComparison comparison={section.comparison} />
          </>
        );
      }
      case "explore": {
        if (section.exploration.kind === "tool") {
          return (
            <GuidedToolLink
              exploration={section.exploration.data}
              copyId={section.copyId}
            />
          );
        }
        const content = copy.blocks[section.copyId];
        return (
          <>
            <div className="lesson-section__intro">
              <h3>{content.title}</h3>
              {content.body ? <p>{content.body}</p> : null}
            </div>
            {section.exploration.kind === "journey" ? (
              <GuidedJourney data={section.exploration.data} />
            ) : (
              <GuidedTransformation data={section.exploration.data} />
            )}
          </>
        );
      }
      case "recap": {
        const content = copy.blocks[section.copyId];
        return (
          <div className="lesson-recap">
            <h3>{content.title}</h3>
            <ul>
              {content.bullets?.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
          </div>
        );
      }
    }
  };

  return (
    <main className="lesson-layout">
      <LessonRail
        moduleId={courseModule.id}
        lessonId={lesson.id}
        sections={LESSON_SECTION_IDS}
        activeSectionId={activeSectionId}
      />

      <article className="lesson-main">
        <header className="lesson-header">
          <p className="course-eyebrow lesson-header__eyebrow">
            <Icon id={courseModule.iconId} size="small" decorative />
            {copy.lesson.modulePosition(
              courseModule.order,
              courseModules.length,
            )}
          </p>
          <h1>{lessonCopy.title}</h1>
          <p>{objective}</p>
        </header>

        {showLegacyModuleNotice ? (
          <Notice
            tone="info"
            title={copy.lesson.legacyModuleNoticeTitle}
            body={copy.lesson.legacyModuleNoticeBody}
            dismissLabel={copy.home.dismiss}
            onDismiss={() =>
              navigate(
                { pathname: location.pathname, search: location.search },
                { replace: true, state: null },
              )
            }
          />
        ) : null}

        <SpeechNotice
          supported={supported}
          japaneseVoiceAvailable={japaneseVoiceAvailable}
          playbackFailed={playbackFailed}
        />

        <div className="lesson-sections">
          {lesson.sections.map((section) => {
            const headingId = `${lessonSectionAnchorId(section.id)}-heading`;
            return (
              <section
                key={section.id}
                id={lessonSectionAnchorId(section.id)}
                className={`lesson-section ${LESSON_SECTION_ANCHOR_CLASS}`}
                aria-labelledby={headingId}
              >
                <h2 id={headingId} className="lesson-section__landmark">
                  {copy.lesson.sections[section.id]}
                </h2>
                {renderSectionBody(section)}
              </section>
            );
          })}
        </div>

        <footer className="lesson-footer">
          {previous ? (
            <ActionLink
              variant="secondary"
              to={lessonPath(previous.courseModule.id, previous.lesson.id)}
            >
              ← {copy.lesson.previous}
            </ActionLink>
          ) : (
            <span />
          )}
          <ActionLink variant="inline" to={routePaths.course}>
            {copy.lesson.map}
          </ActionLink>
          {next ? (
            <ActionLink
              variant="primary"
              to={lessonPath(next.courseModule.id, next.lesson.id)}
            >
              {copy.lesson.next} →
            </ActionLink>
          ) : (
            <span />
          )}
        </footer>
      </article>
    </main>
  );
}

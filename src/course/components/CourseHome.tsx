import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { courseModules } from "../data/course";
import type { Lesson } from "../data/types";
import { getCourseCopy } from "../i18n/catalog";
import {
  knownVisitedLessonIds,
  recommendContinuationLessonId,
  visitedPercent,
} from "../progress/progress";
import { useProgress } from "../progress/ProgressContext";
import { lessonPath } from "../../routing/routes";
import { ChapterCard } from "./ChapterCard";
import { RouteNotice } from "./RouteNotice";
import "../course.css";

const lessons = courseModules.flatMap((courseModule) => courseModule.lessons);
const knownLessonIds = new Set(lessons.map((lesson) => lesson.id));

function moduleFor(lesson: Lesson) {
  const courseModule = courseModules.find((item) => item.id === lesson.moduleId);
  if (!courseModule) throw new Error(`Missing module for lesson ${lesson.id}`);
  return courseModule;
}

export function CourseHome() {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const { progress, corrupted, dismissCorruption, reset } = useProgress();
  const visitedKnown = knownVisitedLessonIds(
    progress.visitedLessonIds,
    knownLessonIds,
  );
  const visitedSet = new Set(visitedKnown);
  const continuationLessonId = recommendContinuationLessonId(
    courseModules,
    progress.visitedLessonIds,
    progress.lastVisitedLessonId,
  );
  const continuation =
    lessons.find((lesson) => lesson.id === continuationLessonId) ?? lessons[0];
  const continuationModule = moduleFor(continuation);
  const percent = visitedPercent(visitedKnown, lessons.length);
  const allVisited = visitedKnown.length === lessons.length;

  const resetProgress = () => {
    if (window.confirm(copy.home.resetConfirm)) reset();
  };

  return (
    <main className="course-home">
      <RouteNotice />
      {corrupted ? (
        <div className="route-notice" role="status">
          <p>{copy.home.corruptProgress}</p>
          <button type="button" onClick={dismissCorruption}>
            {copy.home.dismiss}
          </button>
        </div>
      ) : null}

      <section className="course-hero" aria-labelledby="course-title">
        <div>
          <p className="course-eyebrow">{copy.home.eyebrow}</p>
          <h1 id="course-title">{copy.home.title}</h1>
          <p className="course-lead">{copy.home.lead}</p>
        </div>
        <div className="course-hero__progress">
          <p>
            <strong>{allVisited ? copy.home.allVisited : `${percent}%`}</strong>
            <span>
              {copy.home.lessonsProgress(
                visitedKnown.length,
                lessons.length,
              )}
            </span>
          </p>
          <div
            className="course-progress"
            role="progressbar"
            aria-label={copy.home.lessonsProgress(visitedKnown.length, lessons.length)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <Link
            className="course-primary-action"
            to={lessonPath(continuationModule.id, continuation.id)}
          >
            {allVisited ? copy.home.review : copy.home.continue}
          </Link>
          <button
            className="course-reset"
            type="button"
            onClick={resetProgress}
            disabled={
              progress.visitedLessonIds.length === 0 &&
              progress.lastVisitedLessonId === null
            }
          >
            {copy.home.reset}
          </button>
        </div>
      </section>

      <section className="chapter-grid" aria-label={copy.home.eyebrow}>
        {courseModules.map((courseModule) => (
          <ChapterCard
            key={courseModule.id}
            courseModule={courseModule}
            visitedLessonIds={visitedSet}
          />
        ))}
      </section>
    </main>
  );
}

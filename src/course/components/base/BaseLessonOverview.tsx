import type { ReactElement } from "react";
import type { CourseCopy } from "../../i18n/types";

export interface BaseLessonOverviewProps {
  readonly title: string;
  readonly canDo: string;
  readonly copy: CourseCopy["baseLesson"];
}

/**
 * The Base lesson's rule/overview anchor (Task 14): the lesson title and its
 * restated can-do outcome, mirroring A1's overview but scoped to what Base's
 * view model actually carries (no situation/prerequisite copy yet — that is
 * Task 15's routing/navigation work).
 */
export function BaseLessonOverview({
  title,
  canDo,
  copy,
}: BaseLessonOverviewProps): ReactElement {
  return (
    <div className="base-lesson-overview">
      <p className="base-lesson-overview__can-do">
        <span className="base-lesson-overview__can-do-label">
          {copy.recap.canDoLabel}:{" "}
        </span>
        {canDo}
      </p>
      <p className="base-lesson-overview__title-echo">{title}</p>
    </div>
  );
}

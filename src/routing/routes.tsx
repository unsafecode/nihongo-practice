import { useCallback, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { Phrasebook } from "../components/Phrasebook";
import { Notice } from "../components/Notice";
import { Lab } from "../lab/components/Lab";
import { Syllabary } from "../syllabary/Syllabary";
import { CourseHome } from "../course/components/CourseHome";
import { LessonPage } from "../course/components/LessonPage";
import { PracticeHome } from "../course/components/PracticeHome";
import { getCourseCopy } from "../course/i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { RouteScrollManager } from "./RouteScrollManager";
import type { ScrollOutcome } from "./scrollPlan";
import { lessonPath, routePaths } from "./routePaths";

export { lessonPath, routePaths };

function InvalidRoute() {
  const location = useLocation();
  return (
    <Navigate
      replace
      to={routePaths.course}
      state={{ invalidPath: location.pathname }}
    />
  );
}

/**
 * Surfaces a real deep-link failure as a styled, dismissible warning
 * (design spec §7.2/§7.4): when a validated lesson-section anchor cannot be
 * found the manager resets to the top instead of silently landing nowhere,
 * and this Notice tells the user why. `reset`/`anchored` outcomes clear it,
 * so an ordinary follow-up navigation makes it disappear on its own.
 *
 * The manager stores `onScrollOutcome` in a ref and only re-runs its scroll
 * effect on `location` changes, so passing a fresh `useCallback` identity
 * here never re-triggers a scroll — no callback/effect loop.
 */
function RouteScrollNotice() {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale);
  const [missingAnchorId, setMissingAnchorId] = useState<string | null>(null);

  const handleScrollOutcome = useCallback((outcome: ScrollOutcome) => {
    setMissingAnchorId((current) =>
      outcome.status === "anchor-missing"
        ? outcome.anchorId
        : current === null
          ? current
          : null,
    );
  }, []);

  return (
    <>
      <RouteScrollManager onScrollOutcome={handleScrollOutcome} />
      {missingAnchorId !== null ? (
        <Notice
          tone="warning"
          title={copy.home.missingAnchorTitle}
          body={copy.home.missingAnchorBody}
          dismissLabel={copy.home.dismiss}
          onDismiss={() => setMissingAnchorId(null)}
        />
      ) : null}
    </>
  );
}

export function AppRoutes() {
  return (
    <>
      <RouteScrollNotice />
      <Routes>
        <Route
          path="/"
          element={<Navigate replace to={routePaths.course} />}
        />
        <Route path={routePaths.course} element={<CourseHome />} />
        <Route path={routePaths.lesson} element={<LessonPage />} />
        <Route path={routePaths.practice} element={<PracticeHome />} />
        <Route path={routePaths.lab} element={<Lab />} />
        <Route path={routePaths.syllabary} element={<Syllabary />} />
        <Route path={routePaths.phrasebook} element={<Phrasebook />} />
        <Route path="*" element={<InvalidRoute />} />
      </Routes>
    </>
  );
}

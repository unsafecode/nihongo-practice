import { useCallback, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { Phrasebook } from "../components/Phrasebook";
import { Notice } from "../components/Notice";
import { Lab } from "../lab/components/Lab";
import { Syllabary } from "../syllabary/Syllabary";
import { CourseHome } from "../course/components/CourseHome";
import { LessonPage } from "../course/components/LessonPage";
import { PracticeHome } from "../course/components/PracticeHome";
import { FoundationFixturePage } from "../course/foundations/FoundationFixturePage";
import { getCourseCopy } from "../course/i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { RouteScrollManager } from "./RouteScrollManager";
import type { ScrollOutcome } from "./scrollPlan";
import { lessonPath, routePaths } from "./routePaths";

export { lessonPath, routePaths };

/**
 * The literal path of the compile-time-gated Phase 1 foundation fixture
 * harness. It is deliberately not part of {@link routePaths} — the harness is
 * never a public location, is never linked from navigation, and only exists in
 * a build explicitly opted in via `VITE_FOUNDATION_FIXTURES`.
 */
const FOUNDATION_FIXTURE_PATH = "/__fixtures__/foundation/:fixtureId";

/**
 * Whether the foundation fixture harness route should be registered, given a
 * build-time environment flag value. Enabled only for the exact string
 * `"true"` — never for `"1"`, `"TRUE"`, an empty string, or `undefined` — so a
 * normal or GitHub Pages build without the explicit opt-in never ships the
 * harness route. Pure so it can be unit-tested without a router.
 */
export function foundationFixturesEnabledFor(
  value: string | undefined,
): boolean {
  return value === "true";
}

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
        {import.meta.env.VITE_FOUNDATION_FIXTURES === "true" ? (
          <Route
            path={FOUNDATION_FIXTURE_PATH}
            element={<FoundationFixturePage />}
          />
        ) : null}
        <Route path="*" element={<InvalidRoute />} />
      </Routes>
    </>
  );
}

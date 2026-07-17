import { Suspense, lazy, useCallback, useState } from "react";
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

/**
 * The lazily-loaded foundation fixture harness page — created only when the
 * build was opted in via `VITE_FOUNDATION_FIXTURES=true`. Vite statically
 * replaces `import.meta.env.VITE_FOUNDATION_FIXTURES` at build time, so in a
 * normal (or GitHub Pages) release this whole ternary folds to `null` and
 * Rollup tree-shakes the `import()` away: no fixture chunk, no fixture module
 * graph (IDs/UI), and — because the page owns `foundation.css` — no fixture
 * CSS is emitted. When the flag is on, the dynamic import splits the harness
 * into its own chunk that loads on demand behind the route below.
 */
const FoundationFixturePage =
  import.meta.env.VITE_FOUNDATION_FIXTURES === "true"
    ? lazy(() =>
        import("../course/foundations/FoundationFixturePage").then(
          (module) => ({ default: module.FoundationFixturePage }),
        ),
      )
    : null;

/**
 * Accessible, network-free loading shell shown while the gated fixture chunk
 * resolves. It is a real `main` landmark marked `aria-busy` so assistive tech
 * (and the E2E `gotoReady` landmark wait) sees a page immediately, then the
 * actual fixture `main` replaces it once the chunk loads. It never issues a
 * request or touches a backend.
 */
export function FoundationFixtureLoading() {
  return <main className="foundation-page" aria-busy="true" />;
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
        {FoundationFixturePage ? (
          <Route
            path={FOUNDATION_FIXTURE_PATH}
            element={
              <Suspense fallback={<FoundationFixtureLoading />}>
                <FoundationFixturePage />
              </Suspense>
            }
          />
        ) : null}
        <Route path="*" element={<InvalidRoute />} />
      </Routes>
    </>
  );
}

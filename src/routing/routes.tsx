import { Suspense, lazy, useCallback, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { Notice } from "../components/Notice";
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
 * graph (IDs/UI), and no fixture-only markup. This gating is about the
 * harness route/component tree only, *not* about `foundation.css` itself:
 * that stylesheet now also ships unconditionally as part of the real
 * production bundle, imported directly by `A1LessonPage.tsx` (see the
 * comment there), because real semantic A1 lessons render the same
 * `SentenceMatrix`/`FamilyGuidedConstruction` components the fixture harness
 * exercises. So a normal/Pages build still emits `foundation.css`, just
 * without ever loading this fixture's own gated module. When the flag is on,
 * the dynamic import below splits the harness into its own chunk that loads
 * on demand behind the route below.
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

/**
 * The nine real navigation destinations, each lazily loaded into its own
 * chunk (Phase 2 Task 6, finding I3). Unlike the compile-time-gated
 * {@link FoundationFixturePage}, these always ship — they just load on
 * demand behind the route the user actually visits, instead of every page's
 * code sitting in one always-downloaded chunk regardless of which page is
 * ever opened.
 */
const CourseHome = lazy(() =>
  import("../course/components/CourseHome").then((module) => ({
    default: module.CourseHome,
  })),
);
const LessonPage = lazy(() =>
  import("../course/components/LessonPage").then((module) => ({
    default: module.LessonPage,
  })),
);
const PracticeHome = lazy(() =>
  import("../course/components/PracticeHome").then((module) => ({
    default: module.PracticeHome,
  })),
);
const Lab = lazy(() =>
  import("../lab/components/Lab").then((module) => ({ default: module.Lab })),
);
const Syllabary = lazy(() =>
  import("../syllabary/Syllabary").then((module) => ({
    default: module.Syllabary,
  })),
);
const Phrasebook = lazy(() =>
  import("../components/Phrasebook").then((module) => ({
    default: module.Phrasebook,
  })),
);
const BaseReferencePage = lazy(() =>
  import("../course/components/BaseReferencePage").then((module) => ({
    default: module.BaseReferencePage,
  })),
);
const BaseDiagnostic = lazy(() =>
  import("../course/components/BaseDiagnostic").then((module) => ({
    default: module.BaseDiagnostic,
  })),
);

/**
 * The lesson-engine pilot preview page (Phase 0 Task 13, `#/anteprima/:pilotId`).
 * Unlike the other lazy pages above, this one has its own default export, so
 * `lazy()` needs no `.then()` mapping — `React.lazy` already resolves a
 * dynamic import's `module.default`. It is still its own dynamic `import()`
 * naming the module path, so Rollup still splits it into its own chunk and
 * it never lands inside an existing (bundle-budget-constrained) chunk.
 */
const PilotLessonPage = lazy(() => import("../course/engine/pilot/PilotLessonPage"));

/**
 * Accessible, network-free loading shell shown while a route's chunk
 * resolves. It is a real `main` landmark marked `aria-busy` — the same
 * pattern as {@link FoundationFixtureLoading} — so assistive tech (and the
 * E2E `gotoReady` landmark wait) always sees a page immediately, and the
 * loaded route's own `main` replaces it once its chunk resolves.
 */
function RouteLoading() {
  return <main aria-busy="true" />;
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
        <Route
          path={routePaths.course}
          element={
            <Suspense fallback={<RouteLoading />}>
              <CourseHome />
            </Suspense>
          }
        />
        <Route
          path={routePaths.lesson}
          element={
            <Suspense fallback={<RouteLoading />}>
              <LessonPage />
            </Suspense>
          }
        />
        <Route
          path={routePaths.baseDiagnostic}
          element={
            <Suspense fallback={<RouteLoading />}>
              <BaseDiagnostic />
            </Suspense>
          }
        />
        <Route
          path={routePaths.reference}
          element={
            <Suspense fallback={<RouteLoading />}>
              <BaseReferencePage />
            </Suspense>
          }
        />
        <Route
          path={routePaths.practice}
          element={
            <Suspense fallback={<RouteLoading />}>
              <PracticeHome />
            </Suspense>
          }
        />
        <Route
          path={routePaths.lab}
          element={
            <Suspense fallback={<RouteLoading />}>
              <Lab />
            </Suspense>
          }
        />
        <Route
          path={routePaths.syllabary}
          element={
            <Suspense fallback={<RouteLoading />}>
              <Syllabary />
            </Suspense>
          }
        />
        <Route
          path={routePaths.phrasebook}
          element={
            <Suspense fallback={<RouteLoading />}>
              <Phrasebook />
            </Suspense>
          }
        />
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
        <Route
          path={routePaths.pilotLesson}
          element={
            <Suspense fallback={<RouteLoading />}>
              <PilotLessonPage />
            </Suspense>
          }
        />
        <Route path="*" element={<InvalidRoute />} />
      </Routes>
    </>
  );
}

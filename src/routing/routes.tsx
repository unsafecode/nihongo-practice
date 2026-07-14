import { Navigate, Route, Routes, useLocation } from "react-router";
import { Phrasebook } from "../components/Phrasebook";
import { Lab } from "../lab/components/Lab";
import { Syllabary } from "../syllabary/Syllabary";
import { CourseHome } from "../course/components/CourseHome";
import { LessonPage } from "../course/components/LessonPage";
import { PracticeHome } from "../course/components/PracticeHome";
import { RouteScrollManager } from "./RouteScrollManager";
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

export function AppRoutes() {
  return (
    <>
      <RouteScrollManager />
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

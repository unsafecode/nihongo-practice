import { Navigate, Route, Routes, useLocation } from "react-router";
import { Phrasebook } from "../components/Phrasebook";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { Lab } from "../lab/components/Lab";
import { Syllabary } from "../syllabary/Syllabary";

export const routePaths = {
  course: "/percorso",
  lesson: "/percorso/:chapterId/:lessonId",
  practice: "/pratica",
  lab: "/pratica/laboratorio",
  syllabary: "/pratica/sillabario",
  phrasebook: "/frasario",
} as const;

export function lessonPath(chapterId: string, lessonId: string): string {
  return `/percorso/${encodeURIComponent(chapterId)}/${encodeURIComponent(lessonId)}`;
}

function Placeholder({ page }: { page: "course" | "practice" }) {
  const { locale } = useLocale();
  return (
    <main className="route-placeholder">
      <h1>{getCatalog(locale).ui.nav[page]}</h1>
    </main>
  );
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

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to={routePaths.course} />} />
      <Route path={routePaths.course} element={<Placeholder page="course" />} />
      <Route path={routePaths.lesson} element={<Placeholder page="course" />} />
      <Route path={routePaths.practice} element={<Placeholder page="practice" />} />
      <Route path={routePaths.lab} element={<Lab />} />
      <Route path={routePaths.syllabary} element={<Syllabary />} />
      <Route path={routePaths.phrasebook} element={<Phrasebook />} />
      <Route path="*" element={<InvalidRoute />} />
    </Routes>
  );
}

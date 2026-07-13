import { Link } from "react-router";
import { useLocale } from "../../i18n/LocaleContext";
import { routePaths } from "../../routing/routes";
import { getCourseCopy } from "../i18n/catalog";

export function PracticeHome() {
  const { locale } = useLocale();
  const copy = getCourseCopy(locale).practice;
  return (
    <main className="practice-home">
      <header>
        <p className="course-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.lead}</p>
      </header>
      <div className="practice-grid">
        <article>
          <span aria-hidden="true">組</span>
          <h2>{copy.labTitle}</h2>
          <p>{copy.labBody}</p>
          <Link to={routePaths.lab}>{copy.open} →</Link>
        </article>
        <article>
          <span aria-hidden="true">あ</span>
          <h2>{copy.syllabaryTitle}</h2>
          <p>{copy.syllabaryBody}</p>
          <Link to={routePaths.syllabary}>{copy.open} →</Link>
        </article>
      </div>
    </main>
  );
}

import type { ReactElement } from "react";
import { useLocale } from "../../../i18n/LocaleContext";
import type { LayoutProps } from "./layout";

/**
 * Editorial layout: two columns on desktop — a persistent, labelled section rail
 * beside the step column — collapsing to a horizontal rail under 720px. The rail
 * entries are derived from `archetype.phases`, never a hard-coded list, so the
 * rail stays correct for archetypes that do not exist yet.
 */
export function EditorialLayout({
  archetype,
  stepIndex,
  stepCount,
  phaseIndex,
  children,
  onBack,
}: LayoutProps): ReactElement {
  const { locale } = useLocale();
  const human = stepIndex + 1;
  return (
    <div className="lesson-engine lesson-engine--editorial">
      <div className="lesson-engine__shell">
        <nav
          className="lesson-engine__rail"
          aria-label={locale === "it" ? "Sezioni della lezione" : "Lesson sections"}
        >
          <p className="lesson-engine__rail-title">
            {locale === "it" ? "Sezioni" : "Sections"}
          </p>
          <ol className="lesson-engine__rail-list">
            {archetype.phases.map((phase, index) => (
              <li
                key={`${phase.name}-${index}`}
                className="lesson-engine__rail-item"
                aria-current={index === phaseIndex ? "step" : undefined}
              >
                {phase.name}
              </li>
            ))}
          </ol>
        </nav>
        <main className="lesson-engine__main">
          <div className="lesson-engine__topbar">
            {onBack && stepIndex > 0 ? (
              <button type="button" className="lesson-engine__back" onClick={onBack}>
                {locale === "it" ? "Indietro" : "Back"}
              </button>
            ) : null}
            <p
              className="engine-rail__count"
              aria-label={
                locale === "it"
                  ? `Passo ${human} di ${stepCount}`
                  : `Step ${human} of ${stepCount}`
              }
            >
              {human} / {stepCount}
            </p>
          </div>
          <div className="lesson-engine__content">{children}</div>
        </main>
      </div>
    </div>
  );
}

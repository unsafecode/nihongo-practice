import type { ReactElement } from "react";
import { useLocale } from "../../../i18n/LocaleContext";
import type { LayoutProps } from "./layout";

/**
 * Stage layout: a single centred column with the section rail reduced to a thin
 * progress meter. There is deliberately no navigation landmark — a stage lesson
 * moves linearly and never exposes section jumps.
 */
export function StageLayout({
  stepIndex,
  stepCount,
  children,
  onBack,
}: LayoutProps): ReactElement {
  const { locale } = useLocale();
  const human = stepIndex + 1;
  const fraction = stepCount > 0 ? Math.min(1, human / stepCount) : 0;
  return (
    <div className="lesson-engine lesson-engine--stage">
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
        <div className="lesson-engine__meter" role="presentation">
          <span
            className="lesson-engine__meter-fill"
            style={{ width: `${Math.round(fraction * 100)}%` }}
          />
        </div>
        <div className="lesson-engine__stage-center">{children}</div>
      </main>
    </div>
  );
}

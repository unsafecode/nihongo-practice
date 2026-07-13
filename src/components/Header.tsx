import { NavLink } from "react-router";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";
import { routePaths } from "../routing/routes";
import { useScript } from "../settings/ScriptContext";

export function Header() {
  const {
    locale,
    showReference,
    setLocale,
    setShowReference,
  } = useLocale();
  const { script, setScript } = useScript();
  const ui = getCatalog(locale).ui;
  const navItems = [
    { to: routePaths.course, label: ui.nav.course },
    { to: routePaths.practice, label: ui.nav.practice },
    { to: routePaths.phrasebook, label: ui.nav.phrasebook },
  ];

  const settings = () => (
    <>
      <div className="localetoggle" role="group" aria-label={ui.settings.language}>
        {(["it", "en"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={locale === item ? "is-active" : ""}
            aria-pressed={locale === item}
            onClick={() => setLocale(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="scripttoggle" role="group" aria-label={ui.settings.writing}>
        <button
          type="button"
          className={script === "hiragana" ? "is-active" : ""}
          aria-pressed={script === "hiragana"}
          onClick={() => setScript("hiragana")}
        >
          <span className="k" lang="ja" aria-hidden="true">あ</span> Hiragana
        </button>
        <button
          type="button"
          className={script === "romaji" ? "is-active" : ""}
          aria-pressed={script === "romaji"}
          onClick={() => setScript("romaji")}
        >
          <span className="k" aria-hidden="true">A</span> Rōmaji
        </button>
      </div>
      <label className="reference-toggle">
        <input
          type="checkbox"
          checked={showReference}
          onChange={(event) => setShowReference(event.target.checked)}
        />
        {ui.settings.reference}
      </label>
    </>
  );

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__logo" lang="ja" aria-hidden="true">はなそう</span>
        <div className="header__text">
          <span className="header__title">{ui.brand.title}</span>
          <span className="header__subtitle">{ui.brand.subtitle}</span>
        </div>
      </div>

      <nav className="modenav" aria-label={ui.nav.primary}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `modenav__item${isActive ? " is-active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="header__settings header__settings--desktop">
        {settings()}
      </div>
      <details className="header__settings-mobile">
        <summary>⚙ {ui.settings.menu}</summary>
        <div>{settings()}</div>
      </details>
    </header>
  );
}

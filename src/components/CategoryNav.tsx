import type { Category } from "../data/phrases";
import { getCatalog } from "../i18n/catalog";
import { useLocale } from "../i18n/LocaleContext";

interface Props {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeId, onSelect }: Props) {
  const { locale } = useLocale();
  const ui = getCatalog(locale).ui;
  return (
    <nav className="catnav" aria-label={ui.phrasebook.categoriesLabel}>
      {categories.map((category) => {
        const active = category.id === activeId;
        return (
          <button
            key={category.id}
            type="button"
            className={`catnav__item${active ? " is-active" : ""}`}
            onClick={() => onSelect(category.id)}
            aria-pressed={active}
          >
            <span className="catnav__emoji" aria-hidden="true">{category.emoji}</span>
            <span className="catnav__labels">
              <span className="catnav__label">{category.labels[locale]}</span>
              <span className="catnav__jp" lang="ja" aria-hidden="true">{category.hiragana}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

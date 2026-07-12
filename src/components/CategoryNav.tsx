import type { Category } from "../data/phrases";

interface Props {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeId, onSelect }: Props) {
  return (
    <nav className="catnav" aria-label="Categorie di frasi">
      {categories.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            type="button"
            className={`catnav__item${active ? " is-active" : ""}`}
            onClick={() => onSelect(c.id)}
            aria-pressed={active}
          >
            <span className="catnav__emoji" aria-hidden="true">
              {c.emoji}
            </span>
            <span className="catnav__labels">
              <span className="catnav__label">{c.label}</span>
              <span className="catnav__jp" lang="ja" aria-hidden="true">
                {c.hiragana}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

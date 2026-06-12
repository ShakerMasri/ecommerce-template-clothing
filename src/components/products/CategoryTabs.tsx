type Category = {
  id: string;
  name: string;
  slug: string;
};

type CategoryTabsProps = {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  allLabel: string;
};

export function CategoryTabs({
  categories,
  selectedCategory,
  onCategoryChange,
  allLabel,
}: CategoryTabsProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2 pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          aria-pressed={selectedCategory === null}
          className={`min-h-11 rounded-full border px-5 py-2 text-sm font-semibold transition ${
            selectedCategory === null
              ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface-page)] shadow-sm"
              : "border-[var(--line-soft)] bg-[var(--surface-card)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
          }`}
        >
          {allLabel}
        </button>

        {categories.map((category) => {
          const isActive = selectedCategory === category.slug;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.slug)}
              aria-pressed={isActive}
              className={`min-h-11 rounded-full border px-5 py-2 text-sm font-semibold transition ${
                isActive
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface-page)] shadow-sm"
                  : "border-[var(--line-soft)] bg-[var(--surface-card)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

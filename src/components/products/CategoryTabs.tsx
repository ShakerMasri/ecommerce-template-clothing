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
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex w-max gap-2 pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            selectedCategory === null
              ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
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
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
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

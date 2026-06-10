"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useAppPreferences } from "~/components/providers/AppPreferencesProvider";

type FieldErrors = Record<string, string[] | undefined>;

type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
};

type CategoryForm = {
  name: string;
  slug: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type CategoryFilters = {
  q: string;
  usage: "all" | "with_products" | "empty";
  sort: "name_asc" | "name_desc" | "newest" | "oldest";
};

type CategoriesResponse = {
  categories?: AdminCategory[];
  category?: AdminCategory;
  pagination?: Pagination;
  message?: string;
  errors?: FieldErrors;
};

type MessageType = "success" | "error";

const defaultCategoryFilters: CategoryFilters = {
  q: "",
  usage: "all",
  sort: "name_asc",
};

const defaultPagination: Pagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

function buildCategoriesUrl(filters: CategoryFilters, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(defaultPagination.limit),
    usage: filters.usage,
    sort: filters.sort,
  });

  const search = filters.q.trim();

  if (search) {
    params.set("q", search);
  }

  return `/api/admin/categories?${params.toString()}`;
}

function getEmptyCategoryForm(): CategoryForm {
  return {
    name: "",
    slug: "",
  };
}

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm font-medium text-red-600">{message}</p>;
}

export function AdminCategoriesClient() {
  const { t } = useAppPreferences();
  const labels = t.admin.categories;

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilters>(
    defaultCategoryFilters,
  );
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPagination, setCategoryPagination] =
    useState<Pagination>(defaultPagination);
  const [createForm, setCreateForm] = useState<CategoryForm>(() =>
    getEmptyCategoryForm(),
  );
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>(() =>
    getEmptyCategoryForm(),
  );

  const [createErrors, setCreateErrors] = useState<FieldErrors>({});
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("success");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  );

  function showMessage(type: MessageType, value: string) {
    setMessageType(type);
    setMessage(value);
  }

  async function loadCategories(
    page = categoryPage,
    filters = categoryFilters,
  ) {
    setIsLoading(true);
    setCreateErrors({});
    setEditErrors({});

    try {
      const response = await fetch(buildCategoriesUrl(filters, page));
      const data = (await response.json()) as CategoriesResponse;

      if (!response.ok) {
        setCategories([]);
        setCategoryPagination(defaultPagination);
        showMessage("error", data.message ?? labels.failedToLoad);
        return;
      }

      setCategories(data.categories ?? []);
      setCategoryPage(data.pagination?.page ?? page);
      setCategoryPagination(data.pagination ?? defaultPagination);
    } catch {
      showMessage("error", labels.failedToConnect);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories(1, defaultCategoryFilters);
    // Load once on mount. Language changes only affect labels.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsCreating(true);
    setCreateErrors({});
    setMessage("");

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      const data = (await response.json()) as CategoriesResponse;

      if (!response.ok) {
        setCreateErrors(data.errors ?? {});
        showMessage("error", data.message ?? labels.failedToCreate);
        return;
      }

      setCreateForm(getEmptyCategoryForm());
      showMessage("success", data.message ?? labels.created);
      await loadCategories(categoryPage, categoryFilters);
    } catch {
      showMessage("error", labels.failedToConnect);
    } finally {
      setIsCreating(false);
    }
  }

  function startEditingCategory(category: AdminCategory) {
    setEditCategoryId(category.id);
    setEditForm({
      name: category.name,
      slug: category.slug,
    });
    setEditErrors({});
    setMessage("");
  }

  function cancelEditingCategory() {
    setEditCategoryId(null);
    setEditForm(getEmptyCategoryForm());
    setEditErrors({});
  }

  async function handleUpdateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editCategoryId) {
      return;
    }

    setIsSaving(true);
    setEditErrors({});
    setMessage("");

    try {
      const response = await fetch(`/api/admin/categories/${editCategoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data = (await response.json()) as CategoriesResponse;

      if (!response.ok) {
        setEditErrors(data.errors ?? {});
        showMessage("error", data.message ?? labels.failedToUpdate);
        return;
      }

      showMessage("success", data.message ?? labels.updated);
      cancelEditingCategory();
      await loadCategories(categoryPage, categoryFilters);
    } catch {
      showMessage("error", labels.failedToConnect);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCategory(category: AdminCategory) {
    const productCount = category._count?.products ?? 0;

    if (productCount > 0) {
      showMessage("error", labels.cannotDeleteWithProducts);
      return;
    }

    const confirmed = window.confirm(labels.deleteConfirm);

    if (!confirmed) {
      return;
    }

    setDeletingCategoryId(category.id);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as CategoriesResponse;

      if (!response.ok) {
        showMessage(
          "error",
          data.errors?._form?.[0] ?? data.message ?? labels.failedToDelete,
        );
        return;
      }

      showMessage("success", data.message ?? labels.deleted);
      await loadCategories(categoryPage, categoryFilters);
    } catch {
      showMessage("error", labels.failedToConnect);
    } finally {
      setDeletingCategoryId(null);
    }
  }

  function handleApplyCategoryFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryPage(1);
    void loadCategories(1, categoryFilters);
  }

  function clearCategoryFilters() {
    setCategoryFilters(defaultCategoryFilters);
    setCategoryPage(1);
    void loadCategories(1, defaultCategoryFilters);
  }

  function goToCategoryPage(page: number) {
    const nextPage = Math.min(
      Math.max(page, 1),
      Math.max(categoryPagination.totalPages, 1),
    );

    setCategoryPage(nextPage);
    void loadCategories(nextPage, categoryFilters);
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="h-72 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-72 animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-orange-600 uppercase dark:text-orange-400">
            {labels.badge}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
            {labels.title}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {labels.description}
          </p>
        </div>

        <Link
          href="/admin"
          className="w-fit rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-950"
        >
          {labels.backToDashboard}
        </Link>
      </div>

      {message && (
        <div
          className={`rounded-2xl border p-4 text-sm font-medium ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
        <aside className="space-y-6 lg:sticky lg:top-24">
          <form
            onSubmit={handleCreateCategory}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="text-xl font-black text-zinc-950 dark:text-white">
              {labels.createTitle}
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {labels.createDescription}
            </p>

            {createErrors._form?.[0] && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {createErrors._form[0]}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {labels.name}
                </label>

                <input
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
                  placeholder={labels.namePlaceholder}
                />

                <FieldError message={createErrors.name?.[0]} />
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {labels.slug}
                </label>

                <div className="mt-2 flex gap-2">
                  <input
                    value={createForm.slug}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
                    placeholder={labels.slugPlaceholder}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setCreateForm((current) => ({
                        ...current,
                        slug: makeSlug(current.name),
                      }))
                    }
                    className="shrink-0 rounded-2xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    {labels.make}
                  </button>
                </div>

                <FieldError message={createErrors.slug?.[0]} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="mt-5 w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {isCreating ? labels.creating : labels.createButton}
            </button>
          </form>
        </aside>

        <div className="space-y-6">
          {editCategoryId && (
            <form
              onSubmit={handleUpdateCategory}
              className="rounded-3xl border border-orange-200 bg-orange-50 p-5 shadow-sm dark:border-orange-900 dark:bg-orange-950"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-zinc-950 dark:text-white">
                    {labels.editTitle}
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                    {labels.editDescription}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cancelEditingCategory}
                  className="w-fit rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-white dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  {labels.cancel}
                </button>
              </div>

              {editErrors._form?.[0] && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                  {editErrors._form[0]}
                </div>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                <div>
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {labels.name}
                  </label>

                  <input
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
                    placeholder={labels.namePlaceholder}
                  />

                  <FieldError message={editErrors.name?.[0]} />
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {labels.slug}
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      value={editForm.slug}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          slug: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
                      placeholder={labels.slugPlaceholder}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((current) => ({
                          ...current,
                          slug: makeSlug(current.name),
                        }))
                      }
                      className="shrink-0 rounded-2xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    >
                      {labels.make}
                    </button>
                  </div>

                  <FieldError message={editErrors.slug?.[0]} />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="mt-7 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  {isSaving ? labels.saving : labels.saveButton}
                </button>
              </div>
            </form>
          )}

          <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-zinc-950 dark:text-white">
                  {labels.listTitle}
                </h2>

                <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {labels.listDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadCategories()}
                className="w-fit rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-950"
              >
                {labels.refresh}
              </button>
            </div>

            <form
              onSubmit={handleApplyCategoryFilters}
              className="mt-6 grid gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50"
            >
              <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
                <div>
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {labels.search}
                  </label>
                  <input
                    value={categoryFilters.q}
                    onChange={(event) =>
                      setCategoryFilters((current) => ({
                        ...current,
                        q: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
                    placeholder={labels.searchPlaceholder}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {labels.usageFilter}
                  </label>
                  <select
                    value={categoryFilters.usage}
                    onChange={(event) =>
                      setCategoryFilters((current) => ({
                        ...current,
                        usage: event.target.value as CategoryFilters["usage"],
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
                  >
                    <option value="all">{labels.allUsage}</option>
                    <option value="with_products">{labels.withProducts}</option>
                    <option value="empty">{labels.emptyCategories}</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {labels.sortBy}
                  </label>
                  <select
                    value={categoryFilters.sort}
                    onChange={(event) =>
                      setCategoryFilters((current) => ({
                        ...current,
                        sort: event.target.value as CategoryFilters["sort"],
                      }))
                    }
                    className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 transition outline-none focus:border-orange-600 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-950"
                  >
                    <option value="name_asc">{labels.sortNameAsc}</option>
                    <option value="name_desc">{labels.sortNameDesc}</option>
                    <option value="newest">{labels.sortNewest}</option>
                    <option value="oldest">{labels.sortOldest}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {labels.pageInfo
                    .replace("{page}", String(categoryPagination.page))
                    .replace(
                      "{totalPages}",
                      String(categoryPagination.totalPages),
                    )}{" "}
                  ·{" "}
                  {labels.totalCategories.replace(
                    "{count}",
                    String(categoryPagination.total),
                  )}
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={clearCategoryFilters}
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-white dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    {labels.clearFilters}
                  </button>

                  <button
                    type="submit"
                    className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    {labels.applyFilters}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {categories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  {labels.noCategoriesYet}
                </div>
              ) : (
                categories.map((category) => {
                  const productCount = category._count?.products ?? 0;
                  const isDeleting = deletingCategoryId === category.id;
                  const cannotDelete = productCount > 0;

                  return (
                    <article
                      key={category.id}
                      className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-black text-zinc-950 dark:text-white">
                            {category.name}
                          </h3>

                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            /{category.slug}
                          </p>

                          <p className="mt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            {labels.productCount.replace(
                              "{count}",
                              String(productCount),
                            )}
                          </p>

                          {cannotDelete && (
                            <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
                              {labels.deleteBlockedHint}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingCategory(category)}
                            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-950"
                          >
                            {labels.edit}
                          </button>

                          <button
                            type="button"
                            onClick={() => void deleteCategory(category)}
                            disabled={isDeleting || cannotDelete}
                            title={
                              cannotDelete
                                ? labels.cannotDeleteWithProducts
                                : undefined
                            }
                            className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            {isDeleting ? labels.deleting : labels.delete}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {labels.pageInfo
                  .replace("{page}", String(categoryPagination.page))
                  .replace(
                    "{totalPages}",
                    String(categoryPagination.totalPages),
                  )}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={categoryPagination.page <= 1}
                  onClick={() => goToCategoryPage(categoryPagination.page - 1)}
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-950"
                >
                  {labels.previousPage}
                </button>

                <button
                  type="button"
                  disabled={
                    categoryPagination.page >= categoryPagination.totalPages
                  }
                  onClick={() => goToCategoryPage(categoryPagination.page + 1)}
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-950"
                >
                  {labels.nextPage}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}


import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/api.js";

const INITIAL_FORM = {
  name: "",
  type: "EXPENSE",
  color: "#6366F1",
  icon: "",
};

const COLORS = [
  "#6366F1",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#0EA5E9",
  "#A855F7",
  "#EC4899",
  "#64748B",
];

function getCategoryColor(category) {
  return /^#[0-9A-Fa-f]{6}$/.test(category.color || "")
    ? category.color
    : "#6366F1";
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [archivingId, setArchivingId] = useState(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        archived: String(showArchived),
      });

      if (typeFilter !== "ALL") {
        params.set("type", typeFilter);
      }

      const result = await apiRequest(
        `/categories?${params.toString()}`,
        { method: "GET" }
      );

      setCategories(
        Array.isArray(result.data?.categories)
          ? result.data.categories
          : []
      );
    } catch (err) {
      setError(err.message || "Unable to load categories.");
    } finally {
      setIsLoading(false);
    }
  }, [showArchived, typeFilter]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          archived: String(showArchived),
        });

        if (typeFilter !== "ALL") {
          params.set("type", typeFilter);
        }

        const result = await apiRequest(
          `/categories?${params.toString()}`,
          { method: "GET" }
        );

        if (!cancelled) {
          setCategories(
            Array.isArray(result.data?.categories)
              ? result.data.categories
              : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load categories.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, [showArchived, typeFilter]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((category) => {
      return (
        category.name?.toLowerCase().includes(query) ||
        category.type?.toLowerCase().includes(query) ||
        category.icon?.toLowerCase().includes(query)
      );
    });
  }, [categories, search]);

  const expenseCount = categories.filter(
    (category) => category.type === "EXPENSE"
  ).length;

  const incomeCount = categories.filter(
    (category) => category.type === "INCOME"
  ).length;

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    setFormError("");
    setError("");
    setNotice("");
    setIsFormOpen(true);
  };

  const openEditForm = (category) => {
    if (category.isArchived) return;

    setEditingId(category._id);
    setForm({
      name: category.name || "",
      type: category.type || "EXPENSE",
      color: getCategoryColor(category),
      icon: category.icon || "",
    });
    setFormError("");
    setError("");
    setNotice("");
    setIsFormOpen(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    setFormError("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setFormError("");
    setError("");
    setNotice("");

    const name = form.name.trim();
    const icon = form.icon.trim();

    if (name.length < 2 || name.length > 50) {
      setFormError("Category name must contain 2–50 characters.");
      return;
    }

    if (!["INCOME", "EXPENSE"].includes(form.type)) {
      setFormError("Choose a valid category type.");
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(form.color)) {
      setFormError("Choose a valid category color.");
      return;
    }

    if (icon.length > 50) {
      setFormError("The icon must contain at most 50 characters.");
      return;
    }

    const wasEditing = Boolean(editingId);

    const payload = {
      name,
      color: form.color,
      icon,
      ...(!wasEditing ? { type: form.type } : {}),
    };

    setIsSaving(true);

    try {
      const result = await apiRequest(
        wasEditing
          ? `/categories/${editingId}`
          : "/categories",
        {
          method: wasEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setNotice(
        result.message ||
          (wasEditing
            ? "Category updated successfully."
            : "Category created successfully.")
      );

      closeForm();
      await loadCategories();
    } catch (err) {
      setFormError(err.message || "Unable to save category.");
    } finally {
      setIsSaving(false);
    }
  };

  const archiveCategory = async (category) => {
    const confirmed = window.confirm(
      `Archive "${category.name}"? It will no longer appear in active categories.`
    );

    if (!confirmed) return;

    setArchivingId(category._id);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(
        `/categories/${category._id}/archive`,
        { method: "PATCH" }
      );

      setNotice(result.message || "Category archived successfully.");

      if (editingId === category._id) {
        closeForm();
      }

      await loadCategories();
    } catch (err) {
      setError(err.message || "Unable to archive category.");
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Organize your finances
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Categories
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Organize your income and expenses with categories
              that make your financial activity easier to understand.
            </p>
          </div>

          {!isFormOpen && !showArchived && (
            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + Create category
            </button>
          )}
        </header>

        {notice && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total categories</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {categories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Expense categories</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              {expenseCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Income categories</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {incomeCount}
            </p>
          </div>
        </section>

        {isFormOpen && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingId ? "Edit category" : "Create category"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a clear name, type, color, and optional icon.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="category-name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Category name
                  </label>

                  <input
                    id="category-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={50}
                    minLength={2}
                    required
                    placeholder="e.g. Groceries"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category-type"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Category type
                  </label>

                  <select
                    id="category-type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    disabled={Boolean(editingId)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>

                  {editingId && (
                    <p className="mt-1 text-xs text-slate-500">
                      The category type cannot be changed after creation.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="category-color"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Category color
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="category-color"
                      name="color"
                      type="color"
                      value={form.color}
                      onChange={handleChange}
                      className="h-12 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                    />

                    <span className="text-sm font-medium uppercase text-slate-600">
                      {form.color}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Choose color ${color}`}
                        aria-pressed={form.color === color}
                        onClick={() =>
                          setForm((current) => ({ ...current, color }))
                        }
                        className={`h-7 w-7 rounded-full border-2 ${
                          form.color === color
                            ? "border-slate-900 ring-2 ring-slate-200"
                            : "border-white"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="category-icon"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Icon (optional)
                  </label>

                  <input
                    id="category-icon"
                    name="icon"
                    value={form.icon}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="e.g. 🛒 or shopping-cart"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Enter an emoji or a short icon identifier.
                  </p>
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : editingId
                      ? "Update category"
                      : "Save category"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {showArchived ? "Archived categories" : "Your categories"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Manage categories used to organize transactions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowArchived((current) => !current)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {showArchived ? "View active" : "View archived"}
              </button>

              <button
                type="button"
                onClick={loadCategories}
                disabled={isLoading}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>

              <input
                id="category-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="category-filter"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Filter by type
              </label>

              <select
                id="category-filter"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="ALL">All categories</option>
                <option value="EXPENSE">Expenses</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center">
              <div
                role="status"
                aria-label="Loading categories"
                className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"
              />
              <p className="mt-4 text-sm text-slate-500">
                Loading categories...
              </p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                🏷️
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {search
                  ? "No matching categories"
                  : showArchived
                    ? "No archived categories"
                    : "No categories found"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {search
                  ? "Try another search term or clear your search."
                  : showArchived
                    ? "Categories you archive will appear here."
                    : "Create a category to organize your income or expenses."}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Clear search
                </button>
              )}

              {!search && !showArchived && !isFormOpen && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Create category
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCategories.map((category) => (
                <article
                  key={category._id}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-indigo-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
                        style={{
                          backgroundColor: `${getCategoryColor(category)}20`,
                          color: getCategoryColor(category),
                        }}
                      >
                        {category.icon || category.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words font-bold text-slate-900">
                          {category.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {category.type === "INCOME" ? "Income" : "Expense"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        category.type === "INCOME"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {category.type}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    />
                    <span className="uppercase">{getCategoryColor(category)}</span>

                    {category.isArchived && (
                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                        Archived
                      </span>
                    )}
                  </div>

                  {!category.isArchived && (
                    <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => openEditForm(category)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => archiveCategory(category)}
                        disabled={archivingId === category._id}
                        className="rounded-lg border border-amber-200 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                      >
                        {archivingId === category._id
                          ? "Archiving..."
                          : "Archive"}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

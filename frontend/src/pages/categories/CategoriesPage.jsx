import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../services/api.js";

const INITIAL_FORM = {
  name: "",
  type: "EXPENSE",
  color: "#0BB079",
  icon: "",
};

const COLORS = [
  "#0BB079",
  "#0C1A33",
  "#F59E0B",
  "#EF4444",
  "#0EA5E9",
  "#8B5CF6",
  "#EC4899",
  "#64748B",
];

function getCategoryColor(category) {
  return /^#[0-9A-Fa-f]{6}$/.test(category.color || "")
    ? category.color
    : "#0BB079";
}

function getCategoryName(category) {
  return category.name || "Untitled category";
}

function getCategoryIcon(category) {
  return (
    category.icon ||
    getCategoryName(category).charAt(0).toUpperCase() ||
    "?"
  );
}

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    tag: (
      <>
        <path d="M20.59 13.41 11 3.83A2.83 2.83 0 0 0 9 3H4a1 1 0 0 0-1 1v5a2.83 2.83 0 0 0 .83 2l9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.82Z" />
        <circle cx="7.5" cy="7.5" r=".8" />
      </>
    ),
    income: (
      <>
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </>
    ),
    expense: (
      <>
        <path d="M12 5v14" />
        <path d="m19 12-7 7-7-7" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M5.6 9A7 7 0 0 1 18 6l2 6" />
        <path d="M18.4 15A7 7 0 0 1 6 18l-2-6" />
      </>
    ),
    archive: (
      <>
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
        <path d="M10 12h4" />
      </>
    ),
    edit: (
      <>
        <path d="m15 5 4 4" />
        <path d="M4 20l4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12" />
        <path d="m6 6 12 12" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 9h18" />
        <path d="M16 14h2" />
        <path d="M7 5V3h11" />
      </>
    ),
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.tag}
    </svg>
  );
}

function SummaryCard({ label, value, description, icon, tone }) {
  const tones = {
    navy: "bg-slate-100 text-[#0C1A33]",
    green: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#0C1A33]">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            tones[tone] || tones.navy
          }`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-5 text-slate-500">{description}</p>
    </article>
  );
}

function Field({ label, htmlFor, children, hint }) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0C1A33] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

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
    loadCategories();
  }, [loadCategories]);

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
        wasEditing ? `/categories/${editingId}` : "/categories",
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
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Page introduction */}
        <header className="relative isolate overflow-hidden rounded-3xl bg-[#0C1A33] p-6 shadow-xl shadow-slate-900/10 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-6 -top-14 -z-10 h-52 w-52 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 right-1/4 -z-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                PERSONAL FINANCE
              </span>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Your categories
                <span className="text-emerald-400">.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Give every rupee a purpose. Organize income and expenses
                into meaningful categories so your financial activity
                is easier to understand.
              </p>
            </div>

            {!isFormOpen && !showArchived && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0BB079] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
              >
                <Icon name="plus" className="h-5 w-5" />
                Create category
              </button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Icon name="tag" className="h-4 w-4 text-emerald-400" />
                Total categories
              </div>
              <p className="mt-3 text-3xl font-bold text-white">
                {categories.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {showArchived ? "Archived view" : "Currently displayed"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Icon name="expense" className="h-4 w-4 text-rose-300" />
                Expense categories
              </div>
              <p className="mt-3 text-3xl font-bold text-white">
                {expenseCount}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                For tracking spending
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Icon name="income" className="h-4 w-4 text-emerald-300" />
                Income categories
              </div>
              <p className="mt-3 text-3xl font-bold text-white">
                {incomeCount}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                For tracking earnings
              </p>
            </div>
          </div>
        </header>

        {/* Notifications */}
        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800"
          >
            <div className="flex items-start gap-3">
              <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="rounded-lg p-1 hover:bg-emerald-100"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Create / edit form */}
        {isFormOpen && (
          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon name={editingId ? "edit" : "plus"} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0C1A33]">
                    {editingId ? "Edit category" : "Create a category"}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Choose a name, category type, color, and optional icon.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                aria-label="Close category form"
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
              >
                <Icon name="close" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Category name" htmlFor="category-name">
                  <input
                    id="category-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={50}
                    minLength={2}
                    required
                    placeholder="e.g. Groceries"
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Category type"
                  htmlFor="category-type"
                  hint={
                    editingId
                      ? "The category type cannot be changed after creation."
                      : "Choose whether this category tracks money coming in or going out."
                  }
                >
                  <select
                    id="category-type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    disabled={Boolean(editingId)}
                    className={inputClass}
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </Field>

                <Field
                  label="Choose a color"
                  htmlFor="category-color"
                  hint="Select a preset or use the color picker."
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      id="category-color"
                      name="color"
                      type="color"
                      value={form.color}
                      onChange={handleChange}
                      aria-label="Choose custom category color"
                      className="h-12 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                    />
                    <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs font-semibold uppercase text-slate-600">
                      {form.color}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Choose color ${color}`}
                        aria-pressed={form.color === color}
                        onClick={() =>
                          setForm((current) => ({ ...current, color }))
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-110 ${
                          form.color === color
                            ? "ring-2 ring-[#0C1A33] ring-offset-2"
                            : "ring-1 ring-black/5"
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {form.color === color && (
                          <Icon
                            name="check"
                            className="h-4 w-4 text-white"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field
                  label="Icon (optional)"
                  htmlFor="category-icon"
                  hint="An emoji or short icon identifier, such as 🛒 or shopping-cart."
                >
                  <input
                    id="category-icon"
                    name="icon"
                    value={form.icon}
                    onChange={handleChange}
                    maxLength={50}
                    placeholder="e.g. 🛒"
                    className={inputClass}
                  />

                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F4F7FA] p-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg"
                      style={{
                        backgroundColor: `${form.color}20`,
                        color: form.color,
                      }}
                    >
                      {form.icon.trim() ||
                        form.name.trim().charAt(0).toUpperCase() ||
                        "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-500">
                        Preview
                      </p>
                      <p className="break-words text-sm font-semibold text-[#0C1A33]">
                        {form.name.trim() || "Your category"}
                      </p>
                    </div>
                  </div>
                </Field>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {formError}
                </p>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0BB079] px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name={editingId ? "check" : "plus"} className="h-4 w-4" />
                      {editingId ? "Update category" : "Save category"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Category management */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  CATEGORY MANAGEMENT
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0C1A33]">
                  {showArchived ? "Archived categories" : "Your categories"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {categories.length}{" "}
                  {categories.length === 1 ? "category" : "categories"} in this view.
                  Search, filter, and manage them below.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowArchived((current) => !current)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    showArchived
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon name="archive" className="h-4 w-4" />
                  {showArchived ? "View active" : "View archived"}
                </button>

                <button
                  type="button"
                  onClick={loadCategories}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon
                    name="refresh"
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  {isLoading ? "Refreshing..." : "Refresh"}
                </button>

                {!isFormOpen && !showArchived && (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0C1A33] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <Icon name="plus" className="h-4 w-4" />
                    Add new
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.7fr)]">
              <Field label="Search categories" htmlFor="category-search">
                <div className="relative">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="category-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, type, or icon..."
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Filter by type" htmlFor="category-filter">
                <select
                  id="category-filter"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className={inputClass}
                >
                  <option value="ALL">All categories</option>
                  <option value="EXPENSE">Expense categories</option>
                  <option value="INCOME">Income categories</option>
                </select>
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {[
                { value: "ALL", label: "All types" },
                { value: "EXPENSE", label: "Expenses" },
                { value: "INCOME", label: "Income" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setTypeFilter(filter.value)}
                  aria-pressed={typeFilter === filter.value}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    typeFilter === filter.value
                      ? "bg-[#0C1A33] text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}

              <span className="ml-auto text-xs font-medium text-slate-500">
                {filteredCategories.length} shown
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            {isLoading ? (
              <div className="py-16 text-center">
                <div
                  role="status"
                  aria-label="Loading categories"
                  className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500"
                />
                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading your categories...
                </p>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-[#F8FAFC] px-5 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon name="tag" className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#0C1A33]">
                  {search
                    ? "No matching categories"
                    : showArchived
                      ? "No archived categories"
                      : "Start organizing your money"}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {search
                    ? "Try another search term or clear your search."
                    : showArchived
                      ? "Categories you archive will appear here."
                      : "Create your first category to make your income and spending easier to track."}
                </p>

                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Clear search
                  </button>
                ) : !showArchived && !isFormOpen ? (
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0BB079] px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
                  >
                    <Icon name="plus" className="h-4 w-4" />
                    Create category
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCategories.map((category) => {
                  const color = getCategoryColor(category);
                  const isIncome = category.type === "INCOME";

                  return (
                    <article
                      key={category._id}
                      className="group flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-900/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold"
                            style={{
                              backgroundColor: `${color}18`,
                              color,
                            }}
                          >
                            {getCategoryIcon(category)}
                          </div>

                          <div className="min-w-0">
                            <h3 className="break-words text-base font-bold text-[#0C1A33]">
                              {getCategoryName(category)}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {isIncome ? "Money received" : "Money spent"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            isIncome
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isIncome ? "Income" : "Expense"}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-[#F4F7FA] px-3.5 py-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate font-mono text-xs font-semibold uppercase text-slate-600">
                            {color}
                          </span>
                        </div>

                        {category.isArchived && (
                          <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                            Archived
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-5">
                        {!category.isArchived ? (
                          <div className="flex gap-2 border-t border-slate-100 pt-4">
                            <button
                              type="button"
                              onClick={() => openEditForm(category)}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              <Icon name="edit" className="h-4 w-4" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => archiveCategory(category)}
                              disabled={archivingId === category._id}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-200 px-3 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Icon name="archive" className="h-4 w-4" />
                              {archivingId === category._id
                                ? "Archiving..."
                                : "Archive"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                            <Icon name="archive" className="h-4 w-4" />
                            This category is archived.
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {!isLoading && filteredCategories.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-[#F8FAFC] px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <span>
                Showing {filteredCategories.length} of {categories.length}{" "}
                {categories.length === 1 ? "category" : "categories"} in this view
              </span>
              <span>Income and expenses are organized separately.</span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api.js";

function getDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthEnd(dateString) {
  const [year, month] = dateString.split("-").map(Number);
  return getDateString(new Date(year, month, 0));
}

function formatMoney(amountMinor, currency = "INR") {
  const amount = Number(amountMinor || 0) / 100;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getCategoryId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function getInitialForm() {
  const today = getDateString(new Date());
  const month = today.slice(0, 7);
  const periodStart = `${month}-01`;

  return {
    name: "",
    amount: "",
    currency: "INR",
    periodStart,
    periodEnd: getMonthEnd(periodStart),
    categoryId: "",
  };
}

function getBudgetForm(budget) {
  return {
    name: budget.name || "",
    amount: String(Number(budget.amountMinor) / 100),
    currency: budget.currency || "INR",
    periodStart: getDateString(new Date(budget.periodStart)),
    periodEnd: getDateString(new Date(budget.periodEnd)),
    categoryId: getCategoryId(budget.categoryId),
  };
}

function getUsageMap(budgets) {
  return new Map(budgets.map((budget) => [String(budget._id), budget]));
}

function getUsageStatus(usage, budget) {
  if (!usage) return "UNKNOWN";

  if (Number(usage.spentMinor || 0) > Number(budget.amountMinor)) {
    return "OVER_BUDGET";
  }

  if (Number(usage.percentageUsed || 0) >= 80) {
    return "NEAR_LIMIT";
  }

  return "WITHIN_BUDGET";
}

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0C1A33] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function Notice({ children, type = "success", onDismiss }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : type === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`mb-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}
    >
      <div>{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 text-lg font-semibold opacity-70 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [usageMap, setUsageMap] = useState(new Map());
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(getInitialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUsageLoading, setIsUsageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingBudgetId, setIsDeletingBudgetId] = useState(null);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [usageError, setUsageError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBudgets = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      const result = await apiRequest(`/budgets?${params.toString()}`, {
        method: "GET",
      });

      setBudgets(Array.isArray(result.data) ? result.data : []);
      setPagination(
        result.pagination || {
          page,
          limit: 10,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setError(err.message || "Unable to load budgets.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  const loadUsage = useCallback(async () => {
    setIsUsageLoading(true);
    setUsageError("");

    try {
      const result = await apiRequest("/dashboard/summary", {
        method: "GET",
      });

      const usageBudgets = result.data?.budgets;

      if (!Array.isArray(usageBudgets)) {
        throw new Error(
          "The server returned an unexpected budget usage response."
        );
      }

      setUsageMap(getUsageMap(usageBudgets));
    } catch (err) {
      setUsageError(err.message || "Unable to load budget usage.");
    } finally {
      setIsUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchBudgets() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
        });

        const result = await apiRequest(`/budgets?${params.toString()}`, {
          method: "GET",
        });

        if (!cancelled) {
          setBudgets(Array.isArray(result.data) ? result.data : []);
          setPagination(
            result.pagination || {
              page,
              limit: 10,
              total: 0,
              totalPages: 0,
            }
          );
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load budgets.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchBudgets();

    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsage() {
      try {
        const result = await apiRequest("/dashboard/summary", {
          method: "GET",
        });

        const usageBudgets = result.data?.budgets;

        if (!Array.isArray(usageBudgets)) {
          throw new Error(
            "The server returned an unexpected budget usage response."
          );
        }

        if (!cancelled) {
          setUsageMap(getUsageMap(usageBudgets));
          setUsageError("");
        }
      } catch (err) {
        if (!cancelled) {
          setUsageError(err.message || "Unable to load budget usage.");
        }
      } finally {
        if (!cancelled) setIsUsageLoading(false);
      }
    }

    fetchUsage();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const result = await apiRequest("/categories?type=EXPENSE", {
          method: "GET",
        });

        if (!cancelled) {
          const categoryData = result.data?.categories;
          setCategories(Array.isArray(categoryData) ? categoryData : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load expense categories.");
        }
      }
    }

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const openCreateForm = () => {
    setEditingBudgetId(null);
    setForm(getInitialForm());
    setFormError("");
    setError("");
    setNotice("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingBudgetId(null);
    setForm(getInitialForm());
    setFormError("");
  };

  const startEditingBudget = (budget) => {
    setEditingBudgetId(budget._id);
    setForm(getBudgetForm(budget));
    setFormError("");
    setError("");
    setNotice("");
    setIsFormOpen(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSaveBudget = async (event) => {
    event.preventDefault();

    setFormError("");
    setError("");
    setNotice("");

    const amount = Number(form.amount);
    const amountMinor = Math.round(amount * 100);
    const currency = form.currency.trim().toUpperCase();

    if (
      !Number.isFinite(amount) ||
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0
    ) {
      setFormError("Enter a valid budget amount greater than zero.");
      return;
    }

    if (form.name.trim().length > 100) {
      setFormError("The budget name cannot exceed 100 characters.");
      return;
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      setFormError("Enter a valid three-letter currency code.");
      return;
    }

    if (
      !form.periodStart ||
      !form.periodEnd ||
      form.periodEnd <= form.periodStart
    ) {
      setFormError("The end date must be after the start date.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      amountMinor,
      currency,
      periodStart: new Date(
        `${form.periodStart}T12:00:00`
      ).toISOString(),
      periodEnd: new Date(`${form.periodEnd}T12:00:00`).toISOString(),
      categoryId: form.categoryId || null,
    };

    const wasEditing = Boolean(editingBudgetId);
    setIsSaving(true);

    try {
      await apiRequest(
        wasEditing ? `/budgets/${editingBudgetId}` : "/budgets",
        {
          method: wasEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setNotice(
        wasEditing
          ? "Budget updated successfully."
          : "Budget created successfully."
      );

      setIsFormOpen(false);
      setEditingBudgetId(null);
      setForm(getInitialForm());

      if (!wasEditing && page !== 1) {
        setPage(1);
      } else {
        await Promise.all([loadBudgets(), loadUsage()]);
      }
    } catch (err) {
      setFormError(err.message || "Unable to save the budget.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBudget = async (budget) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        budget.name || "General budget"
      }"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeletingBudgetId(budget._id);
    setError("");
    setNotice("");

    try {
      await apiRequest(`/budgets/${budget._id}`, {
        method: "DELETE",
      });

      setNotice("Budget deleted successfully.");

      if (isFormOpen && editingBudgetId === budget._id) {
        closeForm();
      }

      if (budgets.length === 1 && page > 1) {
        setPage((current) => current - 1);
        await loadUsage();
      } else {
        await Promise.all([loadBudgets(), loadUsage()]);
      }
    } catch (err) {
      setError(err.message || "Unable to delete the budget.");
    } finally {
      setIsDeletingBudgetId(null);
    }
  };

  const filteredBudgets = budgets.filter((budget) => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return true;

    const name = (budget.name || "General budget").toLowerCase();
    const currency = (budget.currency || "").toLowerCase();

    const categoryName =
      typeof budget.categoryId === "object"
        ? (
            budget.categoryId?.name ||
            budget.categoryId?.title ||
            ""
          ).toLowerCase()
        : "";

    return (
      name.includes(searchText) ||
      currency.includes(searchText) ||
      categoryName.includes(searchText)
    );
  });

  const totalPages = pagination.totalPages || 0;
  const hasBudgets = budgets.length > 0;

  const totalBudgetMinor = budgets.reduce(
    (total, budget) => total + Number(budget.amountMinor || 0),
    0
  );

  const overBudgetCount = budgets.filter(
    (budget) =>
      getUsageStatus(usageMap.get(String(budget._id)), budget) ===
      "OVER_BUDGET"
  ).length;

  const nearLimitCount = budgets.filter(
    (budget) =>
      getUsageStatus(usageMap.get(String(budget._id)), budget) ===
      "NEAR_LIMIT"
  ).length;

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 text-[#0C1A33] sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page hero */}
        <header className="relative isolate mb-8 overflow-hidden rounded-[28px] bg-[#0C1A33] px-5 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-9 lg:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-20 -z-10 h-64 w-64 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 right-1/4 -z-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
          />

          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                PERSONAL FINANCE
              </span>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Your budgets<span className="text-emerald-400">.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Give every rupee a purpose. Set spending limits, track
                progress, and make smarter decisions with your money.
              </p>
            </div>

            {!isFormOpen && (
              <button
                type="button"
                onClick={openCreateForm}
                className={primaryButton}
              >
                <span className="text-xl leading-none">+</span>
                Create budget
              </button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm text-slate-300">Budgets on this page</p>
              <p className="mt-2 text-3xl font-bold">
                {isLoading ? "—" : budgets.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {pagination.total} total saved
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm text-slate-300">Over budget</p>
              <p className="mt-2 text-3xl font-bold text-rose-300">
                {isUsageLoading ? "—" : overBudgetCount}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Budgets that exceeded their limit
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-sm text-slate-300">Near spending limit</p>
              <p className="mt-2 text-3xl font-bold text-amber-300">
                {isUsageLoading ? "—" : nearLimitCount}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Budgets with at least 80% used
              </p>
            </div>
          </div>
        </header>

        {notice && (
          <Notice onDismiss={() => setNotice("")}>{notice}</Notice>
        )}

        {error && (
          <Notice type="error" onDismiss={() => setError("")}>
            {error}
          </Notice>
        )}

        {usageError && (
          <Notice type="warning">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Budget usage could not be loaded. Your spending figures may
                be unavailable until the data is refreshed.
              </span>
              <button
                type="button"
                onClick={loadUsage}
                disabled={isUsageLoading}
                className="shrink-0 rounded-lg border border-amber-300 px-3 py-2 font-semibold transition hover:bg-amber-100 disabled:opacity-50"
              >
                {isUsageLoading ? "Loading..." : "Retry usage"}
              </button>
            </div>
          </Notice>
        )}

        {/* Create and edit form */}
        {isFormOpen && (
          <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Budget settings
                </p>
                <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                  {editingBudgetId ? "Edit your budget" : "Create a budget"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose your limit, period, and optional expense category.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className={secondaryButton}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor="budget-name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Budget name
                  </label>
                  <input
                    id="budget-name"
                    name="name"
                    type="text"
                    maxLength={100}
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Monthly essentials"
                    className={inputClass}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Optional. Leave blank for a general budget.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="budget-amount"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Budget limit
                  </label>
                  <input
                    id="budget-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={handleFormChange}
                    placeholder="e.g. 10000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="budget-currency"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Currency code
                  </label>
                  <input
                    id="budget-currency"
                    name="currency"
                    type="text"
                    maxLength={3}
                    minLength={3}
                    required
                    value={form.currency}
                    onChange={handleFormChange}
                    placeholder="INR"
                    className={`${inputClass} uppercase`}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Use a three-letter code, such as INR or USD.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="budget-start"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Start date
                  </label>
                  <input
                    id="budget-start"
                    name="periodStart"
                    type="date"
                    required
                    value={form.periodStart}
                    onChange={handleFormChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="budget-end"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    End date
                  </label>
                  <input
                    id="budget-end"
                    name="periodEnd"
                    type="date"
                    min={form.periodStart || undefined}
                    required
                    value={form.periodEnd}
                    onChange={handleFormChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="budget-category"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Expense category
                  </label>
                  <select
                    id="budget-category"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleFormChange}
                    className={inputClass}
                  >
                    <option value="">Overall budget — all categories</option>
                    {categories.map((category) => (
                      <option
                        key={category._id || category.id}
                        value={category._id || category.id}
                      >
                        {category.name || category.title || "Category"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className={secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={primaryButton}
                >
                  {isSaving
                    ? "Saving..."
                    : editingBudgetId
                      ? "Save changes"
                      : "Create budget"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Budget list */}
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  YOUR FINANCIAL PLAN
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">
                  Budget overview
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {pagination.total}{" "}
                  {pagination.total === 1 ? "budget" : "budgets"} in total
                </p>
              </div>

              <button
                type="button"
                onClick={() => Promise.all([loadBudgets(), loadUsage()])}
                disabled={isLoading || isUsageLoading}
                className={secondaryButton}
              >
                <span aria-hidden="true">↻</span>
                {isLoading || isUsageLoading ? "Refreshing..." : "Refresh data"}
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1 sm:max-w-lg">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400"
                >
                  ⌕
                </span>
                <label htmlFor="budget-search" className="sr-only">
                  Search budgets
                </label>
                <input
                  id="budget-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by budget name, category, or currency..."
                  className={`${inputClass} pl-11`}
                />
              </div>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className={secondaryButton}
                >
                  Clear search
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="px-5 py-20 text-center">
              <div
                className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"
                role="status"
                aria-label="Loading budgets"
              />
              <p className="mt-4 text-sm font-medium text-slate-500">
                Loading your budgets...
              </p>
            </div>
          ) : !hasBudgets ? (
            <div className="px-5 py-20 text-center sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl font-bold text-emerald-700">
                ₹
              </div>
              <h3 className="mt-5 text-xl font-bold">Start with your first budget</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create a spending limit for a category or your overall
                expenses, then track how your spending changes over time.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className={`${primaryButton} mt-6`}
              >
                <span className="text-xl leading-none">+</span>
                Create your first budget
              </button>
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <h3 className="text-lg font-bold">No matching budgets</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different search term.
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:gap-5 sm:p-6 xl:grid-cols-2">
              {filteredBudgets.map((budget) => {
                const usage = usageMap.get(String(budget._id));
                const spentMinor = Number(usage?.spentMinor || 0);
                const remainingMinor = Number(
                  usage?.remainingMinor ?? budget.amountMinor
                );
                const percentageUsed = Number(
                  usage?.percentageUsed ??
                    ((spentMinor / Number(budget.amountMinor)) * 100)
                );

                const safePercentage = Number.isFinite(percentageUsed)
                  ? Math.max(0, Math.min(percentageUsed, 100))
                  : 0;

                const status = getUsageStatus(usage, budget);
                const category =
                  typeof budget.categoryId === "object"
                    ? budget.categoryId
                    : null;

                const categoryName =
                  category?.name ||
                  category?.title ||
                  (budget.categoryId
                    ? "Category-specific"
                    : "Overall budget");

                const barColor =
                  status === "OVER_BUDGET"
                    ? "bg-rose-500"
                    : status === "NEAR_LIMIT"
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                const statusClasses =
                  status === "OVER_BUDGET"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : status === "NEAR_LIMIT"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : status === "UNKNOWN"
                        ? "border-slate-200 bg-slate-100 text-slate-600"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700";

                const statusLabel =
                  status === "OVER_BUDGET"
                    ? "Over budget"
                    : status === "NEAR_LIMIT"
                      ? "Near limit"
                      : status === "UNKNOWN"
                        ? "Usage unavailable"
                        : "Within budget";

                return (
                  <article
                    key={budget._id}
                    className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-900/5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {categoryName}
                        </span>
                        <h3 className="mt-3 break-words text-xl font-bold tracking-tight text-[#0C1A33]">
                          {budget.name || "General budget"}
                        </h3>
                      </div>

                      <span className="shrink-0 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-emerald-800">
                        {budget.currency || "INR"}
                      </span>
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#F4F7FA] p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Spending limit
                      </p>
                      <p className="mt-2 break-words text-2xl font-bold tracking-tight text-[#0C1A33] sm:text-3xl">
                        {formatMoney(
                          budget.amountMinor,
                          budget.currency || "INR"
                        )}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">Start date</p>
                          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                            {formatDate(budget.periodStart)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">End date</p>
                          <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                            {formatDate(budget.periodEnd)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex-1 rounded-2xl border border-slate-200 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#0C1A33]">
                          Spending progress
                        </h4>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses}`}
                        >
                          {isUsageLoading ? "Updating..." : statusLabel}
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            Amount spent
                          </p>
                          <p className="mt-1 break-words text-base font-bold text-[#0C1A33]">
                            {formatMoney(
                              spentMinor,
                              budget.currency || "INR"
                            )}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            {remainingMinor < 0
                              ? "Over budget by"
                              : "Remaining"}
                          </p>
                          <p
                            className={`mt-1 break-words text-base font-bold ${
                              remainingMinor < 0
                                ? "text-rose-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {formatMoney(
                              Math.abs(remainingMinor),
                              budget.currency || "INR"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium text-slate-500">
                          Budget used
                        </span>
                        <span className="font-bold text-[#0C1A33]">
                          {Number.isFinite(percentageUsed)
                            ? `${percentageUsed.toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>

                      <div
                        className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`Budget used for ${
                          budget.name || "General budget"
                        }`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={safePercentage}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${safePercentage}%` }}
                        />
                      </div>

                      {status === "OVER_BUDGET" && (
                        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm leading-5 text-rose-700">
                          You've exceeded this budget by{" "}
                          <strong>
                            {formatMoney(
                              Math.abs(remainingMinor),
                              budget.currency || "INR"
                            )}
                          </strong>
                          .
                        </p>
                      )}

                      {status === "NEAR_LIMIT" && (
                        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-800">
                          You've used at least 80% of this budget. Keep an eye
                          on your remaining spending.
                        </p>
                      )}

                      {status === "UNKNOWN" && (
                        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-5 text-slate-600">
                          Spending data is unavailable. Refresh the usage data
                          to see your actual totals.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => startEditingBudget(budget)}
                        className={`${secondaryButton} flex-1 sm:flex-none`}
                      >
                        Edit budget
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteBudget(budget)}
                        disabled={isDeletingBudgetId === budget._id}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                      >
                        {isDeletingBudgetId === budget._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isLoading && hasBudgets && totalPages > 1 && (
            <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-sm text-slate-500">
                Page <span className="font-semibold text-[#0C1A33]">{pagination.page}</span>{" "}
                of <span className="font-semibold text-[#0C1A33]">{totalPages}</span>
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={page <= 1}
                  className={secondaryButton}
                >
                  ← Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={page >= totalPages}
                  className={secondaryButton}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </section>

        <footer className="mt-5 flex flex-col gap-1 px-1 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>Plan your spending. Build better money habits.</span>
          <span>
            Total budget limits on this page:{" "}
            <strong className="text-slate-700">
              {formatMoney(totalBudgetMinor, "INR")}
            </strong>
            {" "}INR equivalent is not calculated across currencies.
          </span>
        </footer>
      </div>
    </main>
  );
}
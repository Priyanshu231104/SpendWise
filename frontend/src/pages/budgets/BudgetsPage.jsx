
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
  return new Map(
    budgets.map((budget) => [String(budget._id), budget])
  );
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

      const result = await apiRequest(
        `/budgets?${params.toString()}`,
        { method: "GET" }
      );

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
        throw new Error("The server returned an unexpected budget usage response.");
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
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      try {
        const result = await apiRequest(
          `/budgets?${params.toString()}`,
          { method: "GET" }
        );

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
          setUsageError(
            err.message || "Unable to load budget usage."
          );
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
        const result = await apiRequest(
          "/categories?type=EXPENSE",
          { method: "GET" }
        );

        if (!cancelled) {
          const categoryData = result.data?.categories;
          setCategories(
            Array.isArray(categoryData) ? categoryData : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load expense categories."
          );
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
      periodEnd: new Date(
        `${form.periodEnd}T12:00:00`
      ).toISOString(),
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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Personal finance
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Budgets
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Set spending limits, monitor actual expenses, and stay
              in control of your finances.
            </p>
          </div>

          {!isFormOpen && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="mr-2 text-lg">+</span>
              Create budget
            </button>
          )}
        </header>

        {notice && (
          <div
            role="status"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {usageError && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              Budget usage could not be loaded. Spending figures are
              unavailable until the data is refreshed.
            </span>

            <button
              type="button"
              onClick={loadUsage}
              disabled={isUsageLoading}
              className="self-start rounded-lg border border-amber-300 px-3 py-2 font-semibold hover:bg-amber-100 disabled:opacity-50 sm:self-auto"
            >
              {isUsageLoading ? "Loading..." : "Retry usage"}
            </button>
          </div>
        )}

        {isFormOpen && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingBudgetId ? "Edit budget" : "Create budget"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Configure your spending limit and budget period.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="budget-name" className="mb-2 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Optional. Leave blank for a general budget.
                  </p>
                </div>

                <div>
                  <label htmlFor="budget-amount" className="mb-2 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="budget-currency" className="mb-2 block text-sm font-medium text-slate-700">
                    Currency
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="budget-start" className="mb-2 block text-sm font-medium text-slate-700">
                    Start date
                  </label>
                  <input
                    id="budget-start"
                    name="periodStart"
                    type="date"
                    required
                    value={form.periodStart}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="budget-end" className="mb-2 block text-sm font-medium text-slate-700">
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
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label htmlFor="budget-category" className="mb-2 block text-sm font-medium text-slate-700">
                    Expense category
                  </label>
                  <select
                    id="budget-category"
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : editingBudgetId
                      ? "Update budget"
                      : "Save budget"}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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
                Your budgets
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {pagination.total}{" "}
                {pagination.total === 1 ? "budget" : "budgets"} in total
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => Promise.all([loadBudgets(), loadUsage()])}
                disabled={isLoading || isUsageLoading}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isLoading || isUsageLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="budget-search" className="sr-only">
              Search budgets
            </label>
            <input
              id="budget-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search budgets by name, category, or currency..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:max-w-md"
            />
          </div>

          {isLoading ? (
            <div className="py-16 text-center">
              <div
                className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"
                role="status"
                aria-label="Loading budgets"
              />
              <p className="mt-4 text-sm text-slate-500">
                Loading your budgets...
              </p>
            </div>
          ) : !hasBudgets ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-600">
                ₹
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                No budgets yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first budget to track spending against a
                category or your overall expenses.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Create your first budget
              </button>
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="py-16 text-center">
              <h3 className="text-lg font-semibold text-slate-900">
                No matching budgets
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another search term.
              </p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
              {filteredBudgets.map((budget) => {
                const usage = usageMap.get(String(budget._id));
                const spentMinor = Number(usage?.spentMinor || 0);
                const remainingMinor =
                  Number(usage?.remainingMinor ?? budget.amountMinor);
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
                    ? "bg-red-500"
                    : status === "NEAR_LIMIT"
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                const statusClasses =
                  status === "OVER_BUDGET"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : status === "NEAR_LIMIT"
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : status === "UNKNOWN"
                        ? "border-slate-200 bg-slate-50 text-slate-600"
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
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-slate-900">
                          {budget.name || "General budget"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {categoryName}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                        {budget.currency || "INR"}
                      </span>
                    </div>

                    <div className="mt-6 rounded-xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-500">
                        Budget limit
                      </p>
                      <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900">
                        {formatMoney(
                          budget.amountMinor,
                          budget.currency || "INR"
                        )}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Starts
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {formatDate(budget.periodStart)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500">
                            Ends
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {formatDate(budget.periodEnd)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          Spending progress
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses}`}
                        >
                          {isUsageLoading ? "Updating..." : statusLabel}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Spent</p>
                          <p className="mt-1 break-words text-base font-bold text-slate-900">
                            {formatMoney(
                              spentMinor,
                              budget.currency || "INR"
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            {remainingMinor < 0 ? "Over budget by" : "Remaining"}
                          </p>
                          <p
                            className={`mt-1 break-words text-base font-bold ${
                              remainingMinor < 0
                                ? "text-red-600"
                                : "text-slate-900"
                            }`}
                          >
                            {formatMoney(
                              Math.abs(remainingMinor),
                              budget.currency || "INR"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                        <span>Budget used</span>
                        <span className="font-semibold text-slate-700">
                          {Number.isFinite(percentageUsed)
                            ? `${percentageUsed.toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>

                      <div
                        className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`Budget used for ${budget.name || "General budget"}`}
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
                        <p className="mt-3 text-sm font-medium text-red-700">
                          You have exceeded this budget by{" "}
                          {formatMoney(
                            Math.abs(remainingMinor),
                            budget.currency || "INR"
                          )}
                          .
                        </p>
                      )}

                      {status === "NEAR_LIMIT" && (
                        <p className="mt-3 text-sm font-medium text-amber-800">
                          You have used at least 80% of this budget.
                        </p>
                      )}

                      {status === "UNKNOWN" && (
                        <p className="mt-3 text-sm text-slate-500">
                          Spending data is currently unavailable. Retry
                          loading usage to see your actual totals.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => startEditingBudget(budget)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteBudget(budget)}
                        disabled={isDeletingBudgetId === budget._id}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {totalPages}
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={page <= 1}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={page >= totalPages}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

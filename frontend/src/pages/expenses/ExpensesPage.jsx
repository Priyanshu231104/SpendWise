
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api.js";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "OTHER", label: "Other" },
];

const CURRENCIES = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
];

const initialForm = {
  amount: "",
  currency: "INR",
  categoryId: "",
  description: "",
  date: getToday(),
  paymentMethod: "UPI",
};

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMoney(amountMinor, currency = "INR") {
  const amount = Number(amountMinor ?? 0) / 100;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatPaymentMethod(value) {
  const method = PAYMENT_METHODS.find((item) => item.value === value);
  return method?.label || "Other";
}

function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <p
      role="alert"
      className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
    >
      {children}
    </p>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label
      className={`block text-sm font-semibold text-[#0C1A33] ${className}`}
    >
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "mt-2 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-normal text-[#0C1A33] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

function SectionIcon({ children, tone = "emerald" }) {
  const styles = {
    emerald: "bg-[#E7F7F2] text-emerald-700",
    navy: "bg-slate-100 text-[#0C1A33]",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

function ExpenseEmptyState({ filtered, onAdd }) {
  return (
    <div className="px-5 py-14 text-center sm:px-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E7F7F2] text-emerald-700">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <rect x="4" y="4" width="16" height="17" rx="2" />
          <path
            d="M8 2v4m8-4v4M8 10h8m-8 4h5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h3 className="mt-5 text-lg font-bold text-[#0C1A33]">
        {filtered ? "No matching expenses" : "Your expense list is empty"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {filtered
          ? "No transactions match your current search or filter. Try changing your criteria."
          : "Start tracking your spending by recording your first expense."}
      </p>

      {!filtered && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0BB079] px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
        >
          <span className="text-lg leading-none">+</span>
          Add your first expense
        </button>
      )}
    </div>
  );
}

function ExpenseSummaryCard({ title, value, description, tone, icon }) {
  const tones = {
    navy: {
      icon: "bg-slate-100 text-[#0C1A33]",
      accent: "bg-[#0C1A33]",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-700",
      accent: "bg-[#0BB079]",
    },
    rose: {
      icon: "bg-rose-50 text-rose-600",
      accent: "bg-rose-500",
    },
  };

  const colors = tones[tone];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-4 break-words text-2xl font-bold tracking-tight text-[#0C1A33] sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colors.icon}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-500">{description}</p>

      <div
        className={`absolute bottom-0 left-0 h-1 w-0 transition-all duration-300 group-hover:w-full ${colors.accent}`}
      />
    </article>
  );
}

function PaymentBadge({ method }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      {formatPaymentMethod(method)}
    </span>
  );
}

function ExpenseActions({ expense, onEdit, onDelete, deleting }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onEdit(expense)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
      >
        Edit
      </button>

      <button
        type="button"
        disabled={deleting}
        onClick={() => onDelete(expense)}
        className="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [isDeletingExpenseId, setIsDeletingExpenseId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (search) params.set("search", search);
    if (paymentMethod) params.set("paymentMethod", paymentMethod);

    try {
      const result = await apiRequest(`/expenses?${params.toString()}`, {
        method: "GET",
      });

      setExpenses(result.data.expenses);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err.message || "Unable to load expenses.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, paymentMethod]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const result = await apiRequest("/categories?type=EXPENSE", {
          method: "GET",
        });

        if (!cancelled) {
          setCategories(result.data.categories);
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

  function updateForm(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    setNotice("");
  }

  function openNewExpenseForm() {
    setFormError("");
    setNotice("");
    setEditingExpenseId(null);
    setForm({ ...initialForm, date: getToday() });
    setIsFormOpen(true);
  }

  async function createExpense(event) {
    event.preventDefault();
    setFormError("");
    setError("");
    setNotice("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }

    const amountMinor = Math.round(amount * 100);

    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }

    if (!form.date) {
      setFormError("Please select the expense date.");
      return;
    }

    const payload = {
      amountMinor,
      currency: form.currency.trim().toUpperCase(),
      categoryId: form.categoryId || null,
      description: form.description.trim(),
      date: new Date(`${form.date}T12:00:00`).toISOString(),
      paymentMethod: form.paymentMethod,
    };

    const isEditing = Boolean(editingExpenseId);
    setIsSaving(true);

    try {
      if (isEditing) {
        await apiRequest(`/expenses/${editingExpenseId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/expenses", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setForm(initialForm);
      setEditingExpenseId(null);
      setIsFormOpen(false);
      setNotice(
        isEditing
          ? "Expense updated successfully."
          : "Expense added successfully.",
      );

      if (isEditing) {
        await loadExpenses();
      } else {
        setSearch("");
        setSearchInput("");
        setPaymentMethod("");
        setPage(1);

        const result = await apiRequest("/expenses?page=1&limit=10", {
          method: "GET",
        });

        setExpenses(result.data.expenses);
        setPagination(result.data.pagination);
      }
    } catch (err) {
      setFormError(
        err.message ||
          (isEditing
            ? "Unable to update expense."
            : "Unable to create expense."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  function startEditingExpense(expense) {
    setFormError("");
    setNotice("");
    setError("");
    setEditingExpenseId(expense._id);

    setForm({
      amount: (Number(expense.amountMinor) / 100).toFixed(2),
      currency: expense.currency || "INR",
      categoryId: expense.categoryId?._id || expense.categoryId || "",
      description: expense.description || "",
      date: expense.date
        ? new Date(expense.date).toISOString().slice(0, 10)
        : getToday(),
      paymentMethod: expense.paymentMethod || "OTHER",
    });

    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteExpense(expense) {
    const confirmed = window.confirm(
      `Delete "${expense.description || "this expense"}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setIsDeletingExpenseId(expense._id);

    try {
      await apiRequest(`/expenses/${expense._id}`, {
        method: "DELETE",
      });

      setNotice("Expense deleted successfully.");

      if (expenses.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadExpenses();
      }
    } catch (err) {
      setError(err.message || "Unable to delete expense.");
    } finally {
      setIsDeletingExpenseId(null);
    }
  }

  const totalPages = pagination.totalPages;
  const isFiltered = Boolean(search || paymentMethod);

  const visibleCurrencyTotals = expenses.reduce((totals, expense) => {
    const currency = expense.currency || "INR";
    totals[currency] =
      (totals[currency] || 0) + Number(expense.amountMinor ?? 0);
    return totals;
  }, {});

  const currencyEntries = Object.entries(visibleCurrencyTotals);
  const visibleTotalCount = expenses.length;

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page banner */}
        <header className="relative overflow-hidden rounded-3xl bg-[#0C1A33] px-6 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-9">
          <div
            className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-2 -top-10 h-48 w-48 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Finance management
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Expense tracker
                <span className="text-emerald-300">.</span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Keep track of every rupee, understand your spending, and make
                more confident financial decisions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (isFormOpen && !editingExpenseId) {
                  setIsFormOpen(false);
                  setFormError("");
                } else if (isFormOpen && editingExpenseId) {
                  setEditingExpenseId(null);
                  setForm({ ...initialForm, date: getToday() });
                  setFormError("");
                  setIsFormOpen(false);
                } else {
                  openNewExpenseForm();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0BB079] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
            >
              <span className="text-xl leading-none">
                {isFormOpen ? "×" : "+"}
              </span>
              {isFormOpen ? "Close form" : "Add expense"}
            </button>
          </div>

          <div className="relative mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-medium text-slate-300">
                Matching transactions
              </p>
              <p className="mt-2 text-2xl font-bold">
                {isLoading ? "…" : pagination.total}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {isFiltered ? "Based on your current filters" : "Across your expense records"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-medium text-slate-300">
                On this page
              </p>
              <p className="mt-2 text-2xl font-bold">
                {isLoading ? "…" : visibleTotalCount}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Up to 10 transactions displayed
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-medium text-slate-300">
                Currencies represented
              </p>
              <p className="mt-2 text-2xl font-bold">
                {currencyEntries.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Shown separately to avoid mixing currencies
              </p>
            </div>
          </div>
        </header>

        {/* Feedback */}
        {notice && (
          <div
            role="status"
            className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <span className="font-bold" aria-hidden="true">✓</span>
            <p>{notice}</p>
            <button
              type="button"
              onClick={() => setNotice("")}
              className="ml-auto text-emerald-700 hover:text-emerald-900"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        {/* Add / edit form */}
        {isFormOpen && (
          <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
              <SectionIcon>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    d="M12 5v14m-7-7h14"
                    strokeLinecap="round"
                  />
                </svg>
              </SectionIcon>
              <div>
                <h2 className="text-xl font-bold text-[#0C1A33]">
                  {editingExpenseId ? "Edit expense" : "Record a new expense"}
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Add the details below to keep your financial records
                  accurate.
                </p>
              </div>
            </div>

            <form onSubmit={createExpense} className="p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Amount">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      {form.currency}
                    </span>
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max="90071992547409.91"
                      required
                      value={form.amount}
                      onChange={updateForm}
                      placeholder="0.00"
                      className={`${inputClass} pl-16`}
                    />
                  </div>
                </Field>

                <Field label="Currency">
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={updateForm}
                    required
                    className={inputClass}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Expense date">
                  <input
                    name="date"
                    type="date"
                    max={getToday()}
                    required
                    value={form.date}
                    onChange={updateForm}
                    className={inputClass}
                  />
                </Field>

                <Field label="Category">
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={updateForm}
                    className={inputClass}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <span className="mt-1.5 block text-xs font-normal text-slate-500">
                      No active expense categories found.
                    </span>
                  )}
                </Field>

                <Field label="Payment method">
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={updateForm}
                    required
                    className={inputClass}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Description">
                  <input
                    name="description"
                    type="text"
                    maxLength={500}
                    value={form.description}
                    onChange={updateForm}
                    placeholder="e.g. Groceries, transport..."
                    className={inputClass}
                  />
                </Field>
              </div>

              <ErrorMessage>{formError}</ErrorMessage>

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormError("");
                    setEditingExpenseId(null);
                    setForm({ ...initialForm, date: getToday() });
                  }}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0C1A33] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#172C4D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    editingExpenseId ? "Save changes" : "Save expense"
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Expense totals on current page */}
        {currencyEntries.length > 0 && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#0C1A33]">
                Spending snapshot
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Totals for the transactions currently displayed on this page.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {currencyEntries.map(([currency, amount]) => (
                <ExpenseSummaryCard
                  key={currency}
                  title={`Expenses in ${currency}`}
                  value={formatMoney(amount, currency)}
                  description={`${expenses.filter((item) => (item.currency || "INR") === currency).length} transactions on this page`}
                  tone="rose"
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path
                        d="M12 5v14m-6-6 6 6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Expense history */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Transaction management
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-[#0C1A33] sm:text-2xl">
                  Expense history
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {pagination.total} transaction
                  {pagination.total === 1 ? "" : "s"} found
                  {isFiltered ? " with the current filters" : ""}
                </p>
              </div>

              <form
                onSubmit={applySearch}
                className="flex flex-col gap-2 sm:flex-row"
              >
                <label className="sr-only" htmlFor="expense-search">
                  Search expense descriptions
                </label>
                <div className="relative min-w-0 flex-1 sm:w-64">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path
                      d="m16 16 4 4"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    id="expense-search"
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search descriptions..."
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-[#0C1A33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172C4D]"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center">
                Payment method
                <select
                  value={paymentMethod}
                  onChange={(event) => {
                    setPage(1);
                    setPaymentMethod(event.target.value);
                    setNotice("");
                  }}
                  className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#0C1A33] outline-none focus:border-emerald-500 sm:min-w-48"
                >
                  <option value="">All payment methods</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>

              {isFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                    setPaymentMethod("");
                    setPage(1);
                  }}
                  className="self-start text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline sm:self-auto"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mx-5 mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:mx-7"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={loadExpenses}
                disabled={isLoading}
                className="mt-2 font-semibold underline underline-offset-4 disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Try again"}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3 p-5 sm:p-7" aria-label="Loading expenses">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse items-center gap-4 rounded-xl border border-slate-100 p-4"
                >
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-4 w-36 max-w-full rounded bg-slate-100" />
                    <div className="mt-3 h-3 w-24 rounded bg-slate-100" />
                  </div>
                  <div className="h-5 w-24 rounded bg-slate-100" />
                </div>
              ))}
              <p className="pt-2 text-center text-sm text-slate-500">
                Loading your expenses...
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <ExpenseEmptyState
              filtered={isFiltered}
              onAdd={() => {
                openNewExpenseForm();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          ) : (
            <>
              {/* Mobile transaction cards */}
              <div className="space-y-3 p-4 md:hidden">
                {expenses.map((expense) => (
                  <article
                    key={expense._id}
                    className="rounded-2xl border border-slate-200/80 p-4 transition hover:border-slate-300"
                  >
                    <div className="flex items-start gap-3">
                      <SectionIcon tone="rose">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          <path
                            d="M12 5v14m-6-6 6 6 6-6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </SectionIcon>

                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold text-[#0C1A33]">
                          {expense.description || "Expense"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(expense.date)}
                        </p>
                      </div>

                      <p className="shrink-0 break-words text-right text-base font-bold text-rose-600">
                        −{formatMoney(expense.amountMinor, expense.currency)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <PaymentBadge method={expense.paymentMethod} />
                      <ExpenseActions
                        expense={expense}
                        onEdit={startEditingExpense}
                        onDelete={deleteExpense}
                        deleting={isDeletingExpenseId === expense._id}
                      />
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop transaction table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4 font-semibold">Expense</th>
                      <th className="px-4 py-4 font-semibold">Date</th>
                      <th className="px-4 py-4 font-semibold">Payment</th>
                      <th className="px-4 py-4 text-right font-semibold">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense._id}
                        className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/70"
                      >
                        <td className="max-w-xs px-6 py-4">
                          <div className="flex items-center gap-3">
                            <SectionIcon tone="rose">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-5 w-5"
                                aria-hidden="true"
                              >
                                <path
                                  d="M12 5v14m-6-6 6 6 6-6"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </SectionIcon>
                            <div className="min-w-0">
                              <p className="break-words font-semibold text-[#0C1A33]">
                                {expense.description || "Expense"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {expense.currency || "INR"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {formatDate(expense.date)}
                        </td>

                        <td className="px-4 py-4">
                          <PaymentBadge method={expense.paymentMethod} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-rose-600">
                          −{formatMoney(expense.amountMinor, expense.currency)}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex justify-end">
                            <ExpenseActions
                              expense={expense}
                              onEdit={startEditingExpense}
                              onDelete={deleteExpense}
                              deleting={isDeletingExpenseId === expense._id}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p className="text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-[#0C1A33]">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#0C1A33]">
                    {Math.max(totalPages, 1)}
                  </span>
                  <span className="ml-2 text-slate-400">
                    · {pagination.total} total
                  </span>
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <footer className="mt-8 border-t border-slate-200 py-5">
          <p className="text-center text-xs leading-5 text-slate-500">
            SpendWise · Every expense tracked is a step towards better
            financial clarity.
          </p>
        </footer>
      </div>
    </main>
  );
}

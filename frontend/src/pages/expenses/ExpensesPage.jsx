
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api.js";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "OTHER", label: "Other" },
];

const initialForm = {
  amount: "",
  currency: "INR",
  categoryId: "",
  description: "",
  date: new Date().toLocaleDateString("en-CA"),
  paymentMethod: "UPI",
};

function formatMoney(amountMinor, currency = "INR") {
  const amount = Number(amountMinor) / 100;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function ErrorMessage({ children }) {
  if (!children) return null;

  return (
    <p role="alert" className="mt-3 text-sm text-red-600">
      {children}
    </p>
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
  let cancelled = false;

  async function fetchExpenses() {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (search) params.set("search", search);
    if (paymentMethod) params.set("paymentMethod", paymentMethod);

    try {
      const result = await apiRequest(
        `/expenses?${params.toString()}`,
        { method: "GET" },
      );

      if (!cancelled) {
        setExpenses(result.data.expenses);
        setPagination(result.data.pagination);
        setError("");
      }
    } catch (err) {
      if (!cancelled) {
        setError(err.message || "Unable to load expenses.");
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  }

  fetchExpenses();

  return () => {
    cancelled = true;
  };
}, [page, search, paymentMethod]);

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

      // If the last record on a page was deleted, go back one page.
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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-red-600">FINANCE MANAGEMENT</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Expenses
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Track your spending and keep your finances organized.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setNotice("");
            setIsFormOpen((open) => !open);
          }}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
        >
          {isFormOpen ? "Close form" : "+ Add expense"}
        </button>
      </div>

      {notice && (
        <p role="status" className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-800">
          {notice}
        </p>
      )}

      {isFormOpen && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {editingExpenseId ? "Edit expense" : "Add an expense"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter the details below. Your expense will be saved to your account.
          </p>

          <form onSubmit={createExpense} className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Amount (₹)
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max="90071992547409.91"
                  required
                  value={form.amount}
                  onChange={updateForm}
                  placeholder="e.g. 450.00"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Currency
                <select
                  name="currency"
                  value={form.currency}
                  onChange={updateForm}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-red-500"
                >
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Date
                <input
                  name="date"
                  type="date"
                  max={getToday()}
                  required
                  value={form.date}
                  onChange={updateForm}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-red-500"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Category
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={updateForm}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-red-500"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    No active expense categories found.
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Payment method
                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={updateForm}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-red-500"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-1">
                Description
                <input
                  name="description"
                  type="text"
                  maxLength={500}
                  value={form.description}
                  onChange={updateForm}
                  placeholder="e.g. Grocery shopping"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-red-500"
                />
              </label>
            </div>

            <ErrorMessage>{formError}</ErrorMessage>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : editingExpenseId
                    ? "Update expense"
                    : "Save expense"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setFormError("");
                  setEditingExpenseId(null);
                  setForm(initialForm);
                }}
                disabled={isSaving}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Expense history
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {pagination.total} transaction{pagination.total === 1 ? "" : "s"} found
            </p>
          </div>

          <form onSubmit={applySearch} className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="expense-search">
              Search descriptions
            </label>
            <input
              id="expense-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search descriptions"
              maxLength={100}
              className="min-w-0 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 sm:w-64"
            />
            <button
              type="submit"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Search
            </button>
          </form>
        </div>

        <div className="mt-4 max-w-xs">
          <label className="block text-sm font-medium text-slate-700">
            Filter by payment method
            <select
              value={paymentMethod}
              onChange={(event) => {
                setPage(1);
                setPaymentMethod(event.target.value);
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-red-500"
            >
              <option value="">All payment methods</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={loadExpenses}
              className="ml-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Loading expenses...
          </p>
        ) : expenses.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              ₹
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              {search || paymentMethod
                ? "No matching expenses"
                : "No expenses yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              {search || paymentMethod
                ? "Try changing your search or filter."
                : "Add your first expense to start tracking your spending."}
            </p>
            {!search && !paymentMethod && (
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Add your first expense
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3 md:hidden">
              {expenses.map((expense) => (
                <article
                  key={expense._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-slate-900">
                        {expense.description || "Expense"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(expense.date)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-red-600">
                      −{formatMoney(expense.amountMinor, expense.currency)}
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {expense.paymentMethod?.replaceAll("_", " ") || "Other"}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditingExpense(expense)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={isDeletingExpenseId === expense._id}
                      onClick={() => deleteExpense(expense)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeletingExpenseId === expense._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-3 font-medium">Description</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Payment</th>
                    <th className="px-3 py-3 text-right font-medium">Amount</th>
                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="border-b border-slate-100 last:border-0">
                      <td className="max-w-xs break-words px-3 py-4 font-medium text-slate-900">
                        {expense.description || "Expense"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-slate-600">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-3 py-4 text-slate-600">
                        {expense.paymentMethod?.replaceAll("_", " ") || "Other"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right font-semibold text-red-600">
                        −{formatMoney(expense.amountMinor, expense.currency)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => startEditingExpense(expense)}
                            className="mr-3 font-medium text-slate-700 underline"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={isDeletingExpenseId === expense._id}
                            onClick={() => deleteExpense(expense)}
                            className="font-medium text-red-600 underline disabled:opacity-50"
                          >
                            {isDeletingExpenseId === expense._id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {Math.max(totalPages, 1)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

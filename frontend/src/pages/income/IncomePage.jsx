
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../../services/api.js";

const initialForm = {
  amount: "",
  currency: "INR",
  categoryId: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "OTHER",
};

const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "OTHER", label: "Other" },
];

function formatMoney(amountMinor, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(Number(amountMinor) / 100);
  } catch {
    return `${currency} ${(Number(amountMinor) / 100).toFixed(2)}`;
  }
}

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function IncomePage() {
  const [form, setForm] = useState(initialForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [isDeletingIncomeId, setIsDeletingIncomeId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [incomeRecords, setIncomeRecords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const loadIncome = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });

    if (search) params.set("search", search);
    if (paymentMethod) params.set("paymentMethod", paymentMethod);

    try {
      const result = await apiRequest(
        `/income?${params.toString()}`,
        { method: "GET" },
      );

      setIncomeRecords(result.data.income);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err.message || "Unable to load income records.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, paymentMethod]);

  useEffect(() => {
    let cancelled = false;

    async function fetchIncome() {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (search) params.set("search", search);
      if (paymentMethod) params.set("paymentMethod", paymentMethod);

      try {
        const result = await apiRequest(
          `/income?${params.toString()}`,
          { method: "GET" },
        );

        if (!cancelled) {
          setIncomeRecords(result.data.income);
          setPagination(result.data.pagination);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load income records.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchIncome();

    return () => {
      cancelled = true;
    };
  }, [page, search, paymentMethod]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const result = await apiRequest("/categories?type=INCOME", {
          method: "GET",
        });

        if (!cancelled) {
          setCategories(result.data.categories || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load income categories.");
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
    setForm((current) => ({ ...current, [name]: value }));
  }


  function startEditingIncome(income) {
    setFormError("");
    setError("");
    setNotice("");
    setEditingIncomeId(income._id);

    setForm({
      amount: (Number(income.amountMinor) / 100).toFixed(2),
      currency: income.currency || "INR",
      categoryId: income.categoryId?._id || income.categoryId || "",
      description: income.description || "",
      date: income.date
        ? new Date(income.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      paymentMethod: income.paymentMethod || "OTHER",
    });

    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  async function deleteIncome(income) {
    const confirmed = window.confirm(
      `Delete "${income.description || "this income record"}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setIsDeletingIncomeId(income._id);

    try {
      await apiRequest(`/income/${income._id}`, {
        method: "DELETE",
      });

      setNotice("Income deleted successfully.");

      if (incomeRecords.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadIncome();
      }
    } catch (err) {
      setError(err.message || "Unable to delete income.");
    } finally {
      setIsDeletingIncomeId(null);
    }
  }

  async function handleSubmit(event) {
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
      setFormError("Please select the income date.");
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

    const isEditing = Boolean(editingIncomeId);
    setIsSaving(true);

    try {
      if (isEditing) {
        await apiRequest(`/income/${editingIncomeId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/income", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setForm(initialForm);
      setEditingIncomeId(null);
      setIsFormOpen(false);
      setNotice(
        isEditing
          ? "Income updated successfully."
          : "Income added successfully.",
      );

      if (!isEditing) {
        setSearch("");
        setSearchInput("");
        setPaymentMethod("");
        setPage(1);
      }

      const result = await apiRequest("/income?page=1&limit=10", {
        method: "GET",
      });

      setIncomeRecords(result.data.income);
      setPagination(result.data.pagination);
      setPage(1);
    } catch (err) {
      setFormError(
        err.message ||
          (isEditing
            ? "Unable to update income."
            : "Unable to save income."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
              Finance management
            </p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Income
            </h1>
            <p className="mt-2 text-slate-600">
              Track your earnings and keep your finances organized.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(initialForm);
              setFormError("");
              setIsFormOpen((current) => !current);
            }}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            {isFormOpen ? "Close form" : "+ Add income"}
          </button>
        </div>

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800"
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {isFormOpen && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-semibold text-slate-900">
              {editingIncomeId ? "Edit income" : "Add income"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Enter the details below. Your income will be saved to your account.
            </p>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                <label className="block text-sm font-medium text-slate-700">
                  Amount
                  <input
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={updateForm}
                    placeholder="e.g. 25000"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Currency
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={updateForm}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
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
                    required
                    value={form.date}
                    onChange={updateForm}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Category
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={updateForm}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <span className="mt-1 block text-xs text-slate-500">
                      No active income categories found.
                    </span>
                  )}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Payment method
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={updateForm}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Description
                  <input
                    name="description"
                    type="text"
                    maxLength="500"
                    value={form.description}
                    onChange={updateForm}
                    placeholder="e.g. Monthly salary"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>
              </div>

              {formError && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : editingIncomeId
                      ? "Update income"
                      : "Save income"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setForm(initialForm);
                    setFormError("");
                    setEditingIncomeId(null);
                  }}
                  className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Income history
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {pagination.total} {pagination.total === 1 ? "record" : "records"} found
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search descriptions"
                maxLength="100"
                className="min-w-0 rounded-xl border border-slate-300 px-4 py-3"
              />
              <button
                type="submit"
                className="rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Search
              </button>
            </form>
          </div>

          <div className="mt-5 max-w-sm">
            <label className="block text-sm font-medium text-slate-700">
              Filter by payment method
              <select
                value={paymentMethod}
                onChange={(event) => {
                  setPaymentMethod(event.target.value);
                  setPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="">All payment methods</option>
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <p className="py-10 text-center text-slate-500">
              Loading income records...
            </p>
          ) : incomeRecords.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <h3 className="font-semibold text-slate-900">
                No income records found
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Add your first income record to start tracking your earnings.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
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
                    {incomeRecords.map((income) => (
                      <tr
                        key={income._id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="max-w-xs break-words px-3 py-4 font-medium text-slate-900">
                          {income.description || "Income"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-slate-600">
                          {formatDate(income.date)}
                        </td>
                        <td className="px-3 py-4 text-slate-600">
                          {income.paymentMethod?.replaceAll("_", " ") || "Other"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right font-semibold text-emerald-700">
                          +{formatMoney(income.amountMinor, income.currency)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => startEditingIncome(income)}
                            className="mr-3 font-medium text-slate-700 underline"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={isDeletingIncomeId === income._id}
                            onClick={() => deleteIncome(income)}
                            className="font-medium text-red-600 underline disabled:opacity-50"
                          >
                            {isDeletingIncomeId === income._id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 space-y-3 md:hidden">
                {incomeRecords.map((income) => (
                  <article
                    key={income._id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-slate-900">
                          {income.description || "Income"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(income.date)}
                        </p>
                      </div>
                      <p className="whitespace-nowrap font-semibold text-emerald-700">
                        +{formatMoney(income.amountMinor, income.currency)}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {income.paymentMethod?.replaceAll("_", " ") || "Other"}
                    </p>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingIncome(income)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={isDeletingIncomeId === income._id}
                        onClick={() => deleteIncome(income)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
                      >
                        {isDeletingIncomeId === income._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>

                  </article>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500">
                  Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={loadIncome}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh income
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

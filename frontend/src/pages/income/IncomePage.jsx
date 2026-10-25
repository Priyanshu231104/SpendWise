import { useCallback, useEffect, useMemo, useState } from "react";
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
    }).format(Number(amountMinor ?? 0) / 100);
  } catch {
    return `${currency} ${(Number(amountMinor ?? 0) / 100).toFixed(2)}`;
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

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-[#0C1A33] sm:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function IncomeMetric({ title, value, description, icon }) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-4 break-words text-2xl font-bold tracking-tight text-[#0C1A33] sm:text-3xl">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{description}</p>
    </article>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block min-w-0 text-sm font-semibold text-slate-700">
      {label}
      {children}
      {hint && (
        <span className="mt-1.5 block text-xs font-normal text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0C1A33] outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${className}`}
    />
  );
}

function SelectInput({ children, className = "", ...props }) {
  return (
    <select
      {...props}
      className={`mt-2 min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0C1A33] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${className}`}
    >
      {children}
    </select>
  );
}

function IncomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M12 19V5m-6 6 6-6 6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="15" rx="2.5" />
      <path d="M3 9h18m-5 5h2" strokeLinecap="round" />
    </svg>
  );
}

function RecordsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M8 6h12M8 12h12M8 18h12"
        strokeLinecap="round"
      />
      <circle cx="4" cy="6" r=".8" fill="currentColor" />
      <circle cx="4" cy="12" r=".8" fill="currentColor" />
      <circle cx="4" cy="18" r=".8" fill="currentColor" />
    </svg>
  );
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
      const result = await apiRequest(`/income?${params.toString()}`, {
        method: "GET",
      });

      setIncomeRecords(result.data.income);
      setPagination(result.data.pagination);
    } catch (err) {
      setError(err.message || "Unable to load income records.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search, paymentMethod]);

  useEffect(() => {
    loadIncome();
  }, [loadIncome]);

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

  const currentPageTotals = useMemo(() => {
    const totals = new Map();

    incomeRecords.forEach((income) => {
      const currency = income.currency || "INR";
      const existing = totals.get(currency) || {
        currency,
        amountMinor: 0,
        count: 0,
      };

      existing.amountMinor += Number(income.amountMinor || 0);
      existing.count += 1;
      totals.set(currency, existing);
    });

    return Array.from(totals.values());
  }, [incomeRecords]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openNewIncomeForm() {
    setForm({ ...initialForm, date: new Date().toISOString().slice(0, 10) });
    setEditingIncomeId(null);
    setFormError("");
    setNotice("");
    setIsFormOpen((current) => !current);
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

  function closeForm() {
    setIsFormOpen(false);
    setForm(initialForm);
    setFormError("");
    setEditingIncomeId(null);
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

  function clearFilters() {
    setSearch("");
    setSearchInput("");
    setPaymentMethod("");
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-[#F3F6FA] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <section className="relative isolate overflow-hidden rounded-[28px] bg-[#0C1A33] px-6 py-8 shadow-xl shadow-slate-900/10 sm:px-9 sm:py-10 lg:px-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-32 -z-10 h-80 w-80 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-4 -top-20 -z-10 h-64 w-64 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-36 right-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
          />

          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-2 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Finance management
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Income tracker
                <span className="text-emerald-400">.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Every earning tells a story. Keep your income organized,
                understand your cash flow, and stay in control of your finances.
              </p>
            </div>

            <button
              type="button"
              onClick={openNewIncomeForm}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-[#0BB079] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 lg:self-center"
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {isFormOpen && !editingIncomeId ? "−" : "+"}
              </span>
              {isFormOpen && !editingIncomeId ? "Close form" : "Add income"}
            </button>
          </div>

          <div className="mt-9 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-emerald-400">
                  <RecordsIcon />
                </span>
                Total income records
              </div>
              <p className="mt-3 text-3xl font-bold text-white">
                {pagination.total}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Across your saved income history
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-emerald-400">
                  <WalletIcon />
                </span>
                Records on this page
              </div>
              <p className="mt-3 text-3xl font-bold text-white">
                {incomeRecords.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Up to 10 transactions displayed
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-emerald-400">
                  <IncomeIcon />
                </span>
                Currencies represented
              </div>
              <p className="mt-3 text-3xl font-bold text-white">
                {currentPageTotals.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Each currency is tracked separately
              </p>
            </div>
          </div>
        </section>

        {/* Status messages */}
        {notice && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold">
              ✓
            </span>
            <p className="pt-1">{notice}</p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={loadIncome}
              disabled={isLoading}
              className="shrink-0 self-start rounded-lg border border-red-200 bg-white px-4 py-2 font-semibold transition hover:bg-red-100 disabled:opacity-50 sm:self-auto"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="mt-6 ...">
          <SectionHeading
            eyebrow="Your earnings"
            title="Income snapshot"
            description="A breakdown of the income transactions currently displayed on this page."
          />

          {isLoading && incomeRecords.length === 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : currentPageTotals.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <IncomeIcon />
              </div>
              <h3 className="mt-4 font-bold text-[#0C1A33]">
                Your earnings will appear here
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Add an income record to see your earnings summarized by
                currency. You can also search your saved income history below.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {currentPageTotals.map((item) => (
                <IncomeMetric
                  key={item.currency}
                  title={`Income in ${item.currency}`}
                  value={formatMoney(item.amountMinor, item.currency)}
                  description={`${item.count} ${item.count === 1 ? "transaction" : "transactions"} on this page`}
                  icon={<IncomeIcon />}
                />
              ))}
            </div>
          )}
        </section>

        {/* Add / edit form */}
        {isFormOpen && (
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  {editingIncomeId ? "Update transaction" : "New transaction"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#0C1A33]">
                  {editingIncomeId ? "Edit income" : "Add income details"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingIncomeId
                    ? "Update the details of this income record."
                    : "Record your salary, freelance payment, or other earnings."}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Income entry
              </span>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-7">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
                <Field label="Amount" hint="Enter an amount greater than zero.">
                  <TextInput
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={updateForm}
                    placeholder="e.g. 25000.00"
                  />
                </Field>

                <Field label="Currency">
                  <SelectInput
                    name="currency"
                    value={form.currency}
                    onChange={updateForm}
                  >
                    <option value="INR">INR — Indian Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </SelectInput>
                </Field>

                <Field label="Income date">
                  <TextInput
                    name="date"
                    type="date"
                    required
                    value={form.date}
                    onChange={updateForm}
                  />
                </Field>

                <Field label="Category">
                  <SelectInput
                    name="categoryId"
                    value={form.categoryId}
                    onChange={updateForm}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </SelectInput>
                  {categories.length === 0 && (
                    <span className="mt-1.5 block text-xs font-normal text-slate-500">
                      No active income categories found.
                    </span>
                  )}
                </Field>

                <Field label="Payment method">
                  <SelectInput
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={updateForm}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <Field label="Description" hint="Optional · Up to 500 characters.">
                  <TextInput
                    name="description"
                    type="text"
                    maxLength="500"
                    value={form.description}
                    onChange={updateForm}
                    placeholder="e.g. Monthly salary"
                  />
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

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0BB079] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : editingIncomeId ? (
                    "Update income"
                  ) : (
                    "Save income"
                  )}
                </button>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="min-h-12 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <p className="text-xs text-slate-400 sm:ml-auto">
                  Your entry is saved to your account.
                </p>
              </div>
            </form>
          </section>
        )}

        {/* Income history */}
        <section className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <SectionHeading
                eyebrow="Transaction management"
                title="Income history"
                description={`${pagination.total} ${pagination.total === 1 ? "record" : "records"} found in your income history.`}
              />

              <form
                onSubmit={handleSearch}
                className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-xl"
              >
                <div className="relative min-w-0 flex-1">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  >
                    <circle cx="10.8" cy="10.8" r="6.8" />
                    <path d="m16 16 4 4" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search descriptions..."
                    maxLength="100"
                    aria-label="Search income descriptions"
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-12 shrink-0 rounded-xl bg-[#0C1A33] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full sm:max-w-xs">
                <Field label="Filter by payment method">
                  <SelectInput
                    value={paymentMethod}
                    onChange={(event) => {
                      setPaymentMethod(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">All payment methods</option>
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>

              {(search || paymentMethod) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="self-start rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:self-end"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {isLoading && incomeRecords.length === 0 ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
              <p className="text-center text-sm text-slate-500">
                Loading income records...
              </p>
            </div>
          ) : incomeRecords.length === 0 ? (
            <div className="px-6 py-14 text-center sm:py-16">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <RecordsIcon />
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#0C1A33]">
                No income records found
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {search || paymentMethod
                  ? "Try changing your search or payment-method filter."
                  : "Add your first income record to start tracking your earnings."}
              </p>
              {search || paymentMethod ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!isFormOpen) openNewIncomeForm();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mt-5 rounded-xl bg-[#0BB079] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  + Add your first income
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop transaction table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] table-auto text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Income</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4 text-right">Amount</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {incomeRecords.map((income) => (
                      <tr
                        key={income._id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="max-w-[300px] px-6 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                              <IncomeIcon />
                            </div>
                            <div className="min-w-0">
                              <p className="break-words font-semibold text-[#0C1A33]">
                                {income.description || "Income"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {income.currency || "INR"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(income.date)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex max-w-full items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            {income.paymentMethod?.replaceAll("_", " ") || "Other"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-emerald-700">
                          +{formatMoney(income.amountMinor, income.currency)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEditingIncome(income)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingIncomeId === income._id}
                              onClick={() => deleteIncome(income)}
                              className="rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isDeletingIncomeId === income._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile transaction cards */}
              <div className="space-y-3 p-4 md:hidden">
                {incomeRecords.map((income) => (
                  <article
                    key={income._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <IncomeIcon />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words font-semibold text-[#0C1A33]">
                          {income.description || "Income"}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(income.date)} ·{" "}
                          {income.paymentMethod?.replaceAll("_", " ") || "Other"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <span className="text-xs font-medium text-slate-500">
                        Amount received
                      </span>
                      <span className="break-words text-right text-lg font-bold text-emerald-700">
                        +{formatMoney(income.amountMinor, income.currency)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingIncome(income)}
                        className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isDeletingIncomeId === income._id}
                        onClick={() => deleteIncome(income)}
                        className="min-h-10 rounded-xl border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {isDeletingIncomeId === income._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <p className="text-sm text-slate-500">
                  Page{" "}
                  <span className="font-semibold text-[#0C1A33]">
                    {pagination.page || page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#0C1A33]">
                    {Math.max(pagination.totalPages, 1)}
                  </span>
                  <span className="ml-2 text-slate-400">
                    · {pagination.total} total records
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((current) => current - 1)}
                    className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages || isLoading}
                    onClick={() => setPage((current) => current + 1)}
                    className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:px-7">
            <p className="text-xs text-slate-400">
              Income totals are grouped by currency to avoid mixing amounts.
            </p>
            <button
              type="button"
              onClick={loadIncome}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                aria-hidden="true"
              >
                <path
                  d="M20 7v5h-5M4 17v-5h5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.6 9a7 7 0 0 1 11.7-2L20 12M4 12l2.7 5a7 7 0 0 0 11.7-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Refresh income
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
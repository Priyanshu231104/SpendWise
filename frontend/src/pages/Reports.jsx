
import { useCallback, useEffect, useMemo, useState } from "react";
import { getReportsData } from "../services/reportsApi.js";

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getPresetRange(preset) {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  if (preset === "today") {
    // Keep today's range.
  } else if (preset === "thisWeek") {
    const day = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - day);
  } else if (preset === "thisMonth") {
    start.setDate(1);
  } else if (preset === "lastMonth") {
    start.setDate(1);
    start.setMonth(start.getMonth() - 1);
    end.setDate(0);
  } else if (preset === "thisYear") {
    start.setMonth(0, 1);
  }

  return {
    from: toDateInputValue(start),
    to: toDateInputValue(end),
  };
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

function formatMonth(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

function Card({ title, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {title && (
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function EmptyState({ message = "No data available for this period." }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function BarComparison({ data }) {
  const rows = data.slice(-8);

  if (!rows.length) {
    return <EmptyState />;
  }

  const maxValue = Math.max(
    1,
    ...rows.flatMap((item) => [
      item.totalIncomeMinor,
      item.totalExpensesMinor,
    ]),
  );

  return (
    <div className="space-y-5">
      {rows.map((item) => (
        <div
          key={`${item.year}-${item.month}-${item.currency}`}
          className="space-y-2"
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-700">
              {formatMonth(item.year, item.month)}
            </span>
            <span className="text-xs text-slate-500">{item.currency}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-slate-500">Income</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (item.totalIncomeMinor / maxValue) * 100,
                    )}%`,
                  }}
                />
              </div>
              <span className="w-24 text-right text-xs font-medium text-slate-700">
                {formatMoney(item.totalIncomeMinor, item.currency)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-slate-500">Expenses</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-rose-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (item.totalExpensesMinor / maxValue) * 100,
                    )}%`,
                  }}
                />
              </div>
              <span className="w-24 text-right text-xs font-medium text-slate-700">
                {formatMoney(item.totalExpensesMinor, item.currency)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryBreakdown({ data }) {
  if (!data.length) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-5">
      {data.slice(0, 10).map((item, index) => {
        const color = item.color || "#64748b";

        return (
          <div
            key={`${item.currency}-${item.categoryId ?? "uncategorized"}-${index}`}
            className="space-y-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate text-sm font-medium text-slate-700">
                  {item.categoryName}
                </span>
              </div>
              <span className="whitespace-nowrap text-sm font-semibold text-slate-800">
                {formatMoney(item.totalSpentMinor, item.currency)}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (item.totalSpentMinor /
                      Math.max(
                        1,
                        ...data
                          .filter((entry) => entry.currency === item.currency)
                          .map((entry) => entry.totalSpentMinor),
                      )) *
                      100,
                  )}%`,
                  backgroundColor: color,
                }}
              />
            </div>

            <p className="text-xs text-slate-500">
              {item.transactionCount} transactions · {item.currency}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function SavingsTrend({ data }) {
  if (!data.length) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {data.slice(-8).map((item) => {
        const positive = item.netSavingsMinor >= 0;

        return (
          <div
            key={`${item.year}-${item.month}-${item.currency}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">
                {formatMonth(item.year, item.month)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Income {formatMoney(item.totalIncomeMinor, item.currency)}
              </p>
              <p className="text-xs text-slate-500">
                Expenses{" "}
                {formatMoney(item.totalExpensesMinor, item.currency)}
              </p>
            </div>

            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  positive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {positive ? "+" : ""}
                {formatMoney(item.netSavingsMinor, item.currency)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Net savings</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BudgetPerformance({ data }) {
  if (!data.length) {
    return <EmptyState message="No budgets overlap this date range." />;
  }

  return (
    <div className="space-y-4">
      {data.map((budget) => {
        const overBudget = budget.status === "OVER_BUDGET";
        const percentage = Math.max(0, Number(budget.percentageUsed) || 0);

        return (
          <div
            key={budget.budgetId}
            className="rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">
                  {budget.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Budget {formatMoney(budget.amountMinor, budget.currency)}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  overBudget
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {overBudget ? "Over budget" : "Within budget"}
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  overBudget ? "bg-rose-500" : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                {percentage.toFixed(1)}% used
              </span>
              <span className="font-medium text-slate-700">
                Remaining {formatMoney(budget.remainingMinor, budget.currency)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Reports() {
  const [preset, setPreset] = useState("thisMonth");
  const [range, setRange] = useState(() => getPresetRange("thisMonth"));
  const [draftRange, setDraftRange] = useState(() =>
    getPresetRange("thisMonth"),
  );
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (selectedRange) => {
    setLoading(true);
    setError("");

    try {
      const result = await getReportsData(selectedRange);
      setReports(result);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to load your financial reports.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getReportsData(range)
      .then((result) => {
        if (cancelled) return;

        setReports(result);
        setError("");
      })
      .catch((requestError) => {
        if (cancelled) return;

        setError(
          requestError.message || "Unable to load your financial reports.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const summaryByCurrency = useMemo(() => {
    return reports?.summary ?? [];
  }, [reports]);

  const presets = [
    { value: "today", label: "Today" },
    { value: "thisWeek", label: "This week" },
    { value: "thisMonth", label: "This month" },
    { value: "lastMonth", label: "Last month" },
    { value: "thisYear", label: "This year" },
  ];

  function selectPreset(value) {
    const nextRange = getPresetRange(value);
    setLoading(true);
    setError("");
    setPreset(value);
    setRange(nextRange);
    setDraftRange(nextRange);
  }

  function applyCustomRange(event) {
    event.preventDefault();

    if (!draftRange.from || !draftRange.to) {
      setError("Please select both start and end dates.");
      return;
    }

    if (draftRange.from > draftRange.to) {
      setError("The start date must be before or equal to the end date.");
      return;
    }

    setPreset("custom");
    setRange({ ...draftRange });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Financial insights
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Reports & Analytics
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Understand your income, spending, savings, and budgets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadReports(range)}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh reports"}
          </button>
        </header>

        <Card title="Report date range">
          <div className="flex flex-wrap gap-2">
            {presets.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => selectPreset(item.value)}
                className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                  preset === item.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={applyCustomRange}
            className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                From
              </span>
              <input
                type="date"
                value={draftRange.from}
                max={draftRange.to || undefined}
                onChange={(event) => {
                  setDraftRange((current) => ({
                    ...current,
                    from: event.target.value,
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                To
              </span>
              <input
                type="date"
                value={draftRange.to}
                min={draftRange.from || undefined}
                onChange={(event) => {
                  setDraftRange((current) => ({
                    ...current,
                    to: event.target.value,
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Apply range
            </button>
          </form>

          <p className="mt-3 text-xs text-slate-500">
            Selected period: {range.from} to {range.to}
          </p>
        </Card>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => loadReports(range)}
              className="shrink-0 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading && !reports ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>
        ) : (
          <>
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Financial summary
                </h2>
                {loading && (
                  <span className="text-xs text-slate-500">
                    Updating reports…
                  </span>
                )}
              </div>

              {summaryByCurrency.length === 0 ? (
                <EmptyState message="No transactions were found for this period." />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {summaryByCurrency.map((item) => (
                    <div
                      key={item.currency}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <p className="text-sm font-medium text-slate-500">
                        Total income · {item.currency}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-emerald-600">
                        {formatMoney(item.totalIncomeMinor, item.currency)}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.incomeCount} income transactions
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {summaryByCurrency.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {summaryByCurrency.map((item) => (
                    <div
                      key={item.currency}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <p className="text-sm font-medium text-slate-500">
                        Total expenses · {item.currency}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-rose-600">
                        {formatMoney(item.totalExpensesMinor, item.currency)}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.expenseCount} expense transactions
                      </p>
                    </div>
                  ))}

                  {summaryByCurrency.map((item) => (
                    <div
                      key={item.currency}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <p className="text-sm font-medium text-slate-500">
                        Net balance · {item.currency}
                      </p>
                      <p
                        className={`mt-2 text-2xl font-bold ${
                          item.netBalanceMinor >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatMoney(item.netBalanceMinor, item.currency)}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.transactionCount} total transactions
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card title="Monthly income vs expenses">
                <div className="mb-4 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Income
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    Expenses
                  </span>
                </div>
                <BarComparison data={reports?.monthlyTrends ?? []} />
              </Card>

              <Card title="Spending by category">
                <CategoryBreakdown
                  data={reports?.categoryBreakdown ?? []}
                />
              </Card>

              <Card title="Savings trend">
                <SavingsTrend data={reports?.savingsTrend ?? []} />
              </Card>

              <Card title="Budget performance">
                <BudgetPerformance
                  data={reports?.budgetPerformance ?? []}
                />
              </Card>
            </section>

            <Card title="Monthly spending distribution">
              {(reports?.spendingDistribution ?? []).length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {reports.spendingDistribution.map((month) => (
                    <div
                      key={`${month.year}-${month.month}-${month.currency}`}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-800">
                          {formatMonth(month.year, month.month)}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {month.currency}
                        </span>
                      </div>

                      <p className="mb-4 text-xl font-bold text-slate-900">
                        {formatMoney(
                          month.totalExpensesMinor,
                          month.currency,
                        )}
                      </p>

                      <div className="space-y-3">
                        {month.categories.slice(0, 6).map((category) => (
                          <div
                            key={category.categoryId ?? category.name}
                            className="space-y-1.5"
                          >
                            <div className="flex justify-between gap-3 text-xs">
                              <span className="truncate text-slate-600">
                                {category.name}
                              </span>
                              <span className="font-medium text-slate-800">
                                {category.percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, category.percentage)}%`,
                                  backgroundColor:
                                    category.color || "#6366f1",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        <p className="text-center text-xs text-slate-400">
          Reports are calculated from your SpendWise account transactions and
          budgets.
        </p>
      </div>
    </main>
  );
}

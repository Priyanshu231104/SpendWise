
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth.js";
import { apiRequest } from "../../services/api.js";

function formatMoney(amountMinor, currency) {
  const amount = Number(amountMinor ?? 0) / 100;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "INR"} ${amount.toFixed(2)}`;
  }
}

function SummaryCard({ title, value, description }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 break-words text-2xl font-bold text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
}

export default function DashboardPage() {
  const { user, logout, isAuthLoading } = useAuth();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await apiRequest("/dashboard/summary", {
        method: "GET",
      });

      setSummary(result.data);
    } catch (err) {
      setError(err.message || "Unable to load your dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
  if (isAuthLoading) return;

  let cancelled = false;

  async function fetchDashboard() {
    setError("");

    try {
      const result = await apiRequest("/dashboard/summary", {
        method: "GET",
      });

      if (!cancelled) {
        setSummary(result.data);
      }
    } catch (err) {
      if (!cancelled) {
        setError(err.message || "Unable to load your dashboard.");
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  }

  fetchDashboard();

  return () => {
    cancelled = true;
  };
}, [isAuthLoading]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.assign("/login");
    } catch (err) {
      setError(err.message || "Logout failed. Please try again.");
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  if (error && !summary) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-slate-900">
            Your dashboard
          </h1>

          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white hover:bg-slate-700"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const currencies = summary?.currencies ?? [];
  const budgets = summary?.budgets ?? [];
  const primaryCurrency = currencies[0];

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-violet-600">
              SpendWise overview
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Welcome{user?.name ? `, ${user.name}` : ""}!
            </h1>

            <p className="mt-2 text-slate-600">
              Here's a summary of your financial activity.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="self-start rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 sm:self-auto"
          >
            Log out
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800"
          >
            {error}
          </div>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            Financial summary
          </h2>

          {currencies.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8">
              <h3 className="text-lg font-semibold text-slate-900">
                Your financial journey starts here
              </h3>

              <p className="mt-2 max-w-xl text-slate-600">
                You don't have any recorded income or expenses yet. Once you
                add transactions, your financial summary will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currencies.map((item) => (
                <SummaryCard
                  key={item.currency}
                  title={`${item.currency} · Net balance`}
                  value={formatMoney(
                    item.netBalanceMinor,
                    item.currency,
                  )}
                  description={`${item.transactionCount} total transactions`}
                />
              ))}

              {currencies.map((item) => (
                <SummaryCard
                  key={`income-${item.currency}`}
                  title={`${item.currency} · Total income`}
                  value={formatMoney(
                    item.totalIncomeMinor,
                    item.currency,
                  )}
                  description={`${item.incomeCount} income transactions`}
                />
              ))}

              {currencies.map((item) => (
                <SummaryCard
                  key={`expenses-${item.currency}`}
                  title={`${item.currency} · Total expenses`}
                  value={formatMoney(
                    item.totalExpensesMinor,
                    item.currency,
                  )}
                  description={`${item.expenseCount} expense transactions`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Your budgets
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Track your spending against your saved budgets.
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Refresh summary
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600">
              No saved budgets yet. Your budget summaries will appear here
              after you create a budget.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {budgets.map((budget) => {
                const percentage = Number(budget.percentageUsed ?? 0);
                const progress = Math.min(Math.max(percentage, 0), 100);

                return (
                  <article
                    key={budget._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {budget.name || "Budget"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {budget.currency}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          budget.status === "OVER_BUDGET"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {budget.status === "OVER_BUDGET"
                          ? "Over budget"
                          : "Within budget"}
                      </span>
                    </div>

                    <div className="mt-5 flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">Spent</span>
                      <span className="font-semibold text-slate-900">
                        {formatMoney(budget.spentMinor, budget.currency)}
                      </span>
                    </div>

                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          percentage > 100 ? "bg-red-500" : "bg-violet-600"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-2 flex justify-between gap-4 text-sm">
                      <span className="text-slate-500">
                        {percentage.toFixed(1)}% used
                      </span>
                      <span className="text-slate-600">
                        Remaining:{" "}
                        {formatMoney(
                          budget.remainingMinor,
                          budget.currency,
                        )}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                      Budget amount:{" "}
                      {formatMoney(budget.amountMinor, budget.currency)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {primaryCurrency && (
          <p className="mt-8 text-xs text-slate-400">
            Your summary may contain multiple currencies. Each currency is
            displayed separately.
          </p>
        )}
      </div>
    </main>
  );
}

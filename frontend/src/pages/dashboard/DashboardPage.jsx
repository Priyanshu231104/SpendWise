
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value ?? 0));
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone = "navy",
}) {
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

  const colors = tones[tone] || tones.navy;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
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

      <p className="mt-3 text-sm leading-5 text-slate-500">
        {description}
      </p>

      <div
        className={`absolute bottom-0 left-0 h-1 w-0 ${colors.accent} transition-all duration-300 group-hover:w-full`}
      />
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#0C1A33] sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center sm:px-8">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F7F2] text-emerald-700"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#0C1A33]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-4 h-9 w-64 max-w-full rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-slate-200" />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-40 rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="mt-6 h-8 w-40 rounded bg-slate-200" />
              <div className="mt-4 h-3 w-32 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="mt-10 h-56 rounded-2xl bg-white" />
      </div>
      <p className="mt-6 text-center text-sm text-slate-500">
        Preparing your financial overview...
      </p>
    </main>
  );
}

export default function DashboardPage() {
  const { user, logout, isAuthLoading } = useAuth();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setError("");

    try {
      await logout();
      window.location.assign("/login");
    } catch (err) {
      setError(err.message || "Logout failed. Please try again.");
      setIsLoggingOut(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return <LoadingState />;
  }

  if (error && !summary) {
    return (
      <main className="min-h-screen bg-[#F4F7FA] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path
                d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-bold text-[#0C1A33]">
            We couldn't load your dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your financial information is still safe. Check your connection
            and try loading your summary again.
          </p>
          <div
            role="alert"
            className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </div>
          <button
            type="button"
            onClick={loadDashboard}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#0C1A33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172C4D] focus:outline-none focus:ring-4 focus:ring-slate-200"
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
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-3xl bg-[#0C1A33] px-6 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-9 sm:py-9 lg:px-10">
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

          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Your personal finance overview
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
                <span className="text-emerald-300">.</span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Every smart financial decision starts with clarity. Here's
                how your money is doing.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadDashboard}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                    d="M5.6 9A7 7 0 0 1 17.3 5L20 12M4 12l2.7 7A7 7 0 0 0 18.4 15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Refresh
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#0C1A33] transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    d="M10 17l5-5-5-5m5 5H3m9-9h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="relative mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-medium text-slate-300">
                Currency accounts
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatNumber(currencies.length)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-medium text-slate-300">
                Total transactions
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatNumber(
                  currencies.reduce(
                    (total, item) =>
                      total + Number(item.transactionCount ?? 0),
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs font-medium text-slate-300">
                Saved budgets
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatNumber(budgets.length)}
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={loadDashboard}
              disabled={isLoading}
              className="shrink-0 font-semibold underline underline-offset-4 disabled:opacity-50"
            >
              Try again
            </button>
          </div>
        )}

        
        <section className="mt-9">
          <SectionHeading
            eyebrow="The big picture"
            title="Financial summary"
            description="A clear view of your money across each currency."
          />
        
          {currencies.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="M3 10h18M7 15h3" strokeLinecap="round" />
                </svg>
              }
              title="Your financial journey starts here"
              description="Once you record your income and expenses, your financial summary will appear here."
              action={
                <Link
                  to="/expenses"
                  className="inline-flex items-center justify-center rounded-xl bg-[#0C1A33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172C4D]"
                >
                  Explore expenses
                </Link>
              }
            />
          ) : (
            <div className="mt-5 space-y-6">
              {currencies.map((item) => (
                <div key={item.currency}>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                    {item.currency} overview
                  </h3>
        
                  <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <SummaryCard
                      title="Net balance"
                      value={formatMoney(item.netBalanceMinor, item.currency)}
                      description={`${formatNumber(item.transactionCount)} total transactions`}
                      tone="navy"
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
                            d="M3 8.5A2.5 2.5 0 0 1 5.5 6H20v13H5.5A2.5 2.5 0 0 1 3 16.5v-8Z"
                            strokeLinejoin="round"
                          />
                          <path d="M3 9h17M15 14h2" strokeLinecap="round" />
                        </svg>
                      }
                    />
        
                    <SummaryCard
                      title="Total income"
                      value={formatMoney(item.totalIncomeMinor, item.currency)}
                      description={`${formatNumber(item.incomeCount)} income transactions`}
                      tone="emerald"
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
                            d="M12 19V5m-6 6 6-6 6 6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      }
                    />
        
                    <SummaryCard
                      title="Total expenses"
                      value={formatMoney(item.totalExpensesMinor, item.currency)}
                      description={`${formatNumber(item.expenseCount)} expense transactions`}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        <section className="mt-10">
          <SectionHeading
            eyebrow="Plan with purpose"
            title="Your budgets"
            description="See how much you've spent and how much remains in each budget."
          />

          {budgets.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <rect x="4" y="4" width="16" height="17" rx="2" />
                  <path
                    d="M8 2v4m8-4v4M8 10h8m-8 4h5"
                    strokeLinecap="round"
                  />
                </svg>
              }
              title="Give your money a plan"
              description="You haven't created any budgets yet. Set a spending limit and use SpendWise to keep your financial goals on track."
              action={
                <Link
                  to="/budgets"
                  className="inline-flex items-center justify-center rounded-xl bg-[#0BB079] px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Explore budgets
                </Link>
              }
            />
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {budgets.map((budget) => {
                const percentage = Number(budget.percentageUsed ?? 0);
                const progress = Math.min(Math.max(percentage, 0), 100);
                const isOverBudget =
                  budget.status === "OVER_BUDGET" || percentage > 100;

                return (
                  <article
                    key={budget._id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] text-emerald-700">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 19V5m0 14h16M8 15v-3m4 3V8m4 7V5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <h3 className="break-words font-bold text-[#0C1A33]">
                            {budget.name || "Budget"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {budget.currency}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          isOverBudget
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isOverBudget ? "bg-rose-500" : "bg-emerald-500"
                          }`}
                        />
                        {isOverBudget ? "Over budget" : "Within budget"}
                      </span>
                    </div>

                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          Amount spent
                        </p>
                        <p className="mt-1 break-words text-xl font-bold text-[#0C1A33]">
                          {formatMoney(budget.spentMinor, budget.currency)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-slate-600">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>

                    <div
                      className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-label={`${budget.name || "Budget"} usage`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isOverBudget ? "bg-rose-500" : "bg-[#0BB079]"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="mt-3 flex justify-between gap-3 text-xs text-slate-500 sm:text-sm">
                      <span>
                        Budget: {formatMoney(budget.amountMinor, budget.currency)}
                      </span>
                      <span className="text-right">
                        {isOverBudget ? "Exceeded by" : "Remaining"}{" "}
                        <span
                          className={`font-semibold ${
                            isOverBudget ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {formatMoney(budget.remainingMinor, budget.currency)}
                        </span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-slate-200 py-5">
          <p className="text-center text-xs leading-5 text-slate-500">
            SpendWise helps you understand your money, one decision at a time.
            {primaryCurrency &&
              " Amounts are shown separately for each currency."}
          </p>
        </footer>
      </div>
    </main>
  );
}

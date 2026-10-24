import { useState } from "react";
import { useGuest } from "../../context/useGuest";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";

const categories = [
  {
    key: "housing",
    label: "Housing",
    placeholder: "Enter housing expenses",
    icon: "⌂",
    color: "#0C1A33",
  },
  {
    key: "food",
    label: "Food & Groceries",
    placeholder: "Enter food expenses",
    icon: "◉",
    color: "#0BB079",
  },
  {
    key: "transport",
    label: "Transportation",
    placeholder: "Enter transportation expenses",
    icon: "↗",
    color: "#64748B",
  },
  {
    key: "utilities",
    label: "Utilities & Bills",
    placeholder: "Enter utility expenses",
    icon: "ϟ",
    color: "#D97706",
  },
  {
    key: "education",
    label: "Education",
    placeholder: "Enter education expenses",
    icon: "▤",
    color: "#6366F1",
  },
  {
    key: "health",
    label: "Health",
    placeholder: "Enter health expenses",
    icon: "+",
    color: "#E11D48",
  },
  {
    key: "entertainment",
    label: "Entertainment",
    placeholder: "Enter entertainment expenses",
    icon: "♫",
    color: "#8B5CF6",
  },
  {
    key: "shopping",
    label: "Shopping",
    placeholder: "Enter shopping expenses",
    icon: "◇",
    color: "#0891B2",
  },
  {
    key: "other",
    label: "Other Expenses",
    placeholder: "Enter other expenses",
    icon: "•••",
    color: "#78716C",
  },
];

const initialFormData = {
  income: "",
  housing: "",
  food: "",
  transport: "",
  utilities: "",
  education: "",
  health: "",
  entertainment: "",
  shopping: "",
  other: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatCompactCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);

function MetricCard({ label, value, detail, accent = "navy" }) {
  const accentClasses = {
    navy: "bg-[#F4F7FA] text-[#0C1A33]",
    green: "bg-[#E7F7F2] text-[#087F5B]",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-50 text-slate-700",
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p
        className={`mt-3 break-words text-xl font-bold tracking-tight sm:text-2xl ${
          accentClasses[accent] || accentClasses.navy
        }`}
      >
        {value}
      </p>

      {detail && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {detail}
        </p>
      )}
    </div>
  );
}

function MonthlyBudgetPlannerPage() {
  const { guestData, saveGuestData } = useGuest();

  const [formData, setFormData] = useState(() => ({
    ...initialFormData,
    ...(guestData.monthlyPlanner?.formData || {}),
  }));

  const [result, setResult] = useState(
    guestData.monthlyPlanner?.result || null
  );

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setResult(null);
  };

  const handleCalculate = () => {
    const incomeText = formData.income.trim();
    const income = Number(incomeText);

    if (
      incomeText === "" ||
      !Number.isFinite(income) ||
      income <= 0
    ) {
      setError("Enter a valid monthly income greater than ₹0.");
      setResult(null);
      return;
    }

    const categoryResults = [];

    for (const category of categories) {
      const rawValue = formData[category.key].trim();
      const amount = rawValue === "" ? 0 : Number(rawValue);

      if (!Number.isFinite(amount) || amount < 0) {
        setError(
          `${category.label}: enter a valid amount of ₹0 or more.`
        );
        setResult(null);
        return;
      }

      categoryResults.push({
        ...category,
        amount,
      });
    }

    const totalExpenses = categoryResults.reduce(
      (total, category) => total + category.amount,
      0
    );

    const remainingMoney = income - totalExpenses;

    const calculationResult = {
      income,
      categories: categoryResults,
      totalExpenses,
      remainingMoney,
      expensePercentage: (totalExpenses / income) * 100,
      savingsPercentage: (remainingMoney / income) * 100,
    };

    setError("");
    setResult(calculationResult);

    saveGuestData("monthlyPlanner", {
      formData,
      result: calculationResult,
    });
  };

  const expenseRatio = result
    ? Math.min(result.expensePercentage, 100)
    : 0;

  const positiveCategories = result
    ? result.categories.filter((category) => category.amount > 0)
    : [];

  const budgetStatus = !result
    ? null
    : result.remainingMoney < 0
      ? {
          label: "Over budget",
          description:
            "Your planned expenses exceed your monthly income. Review the categories below to find where you can reduce spending.",
          style: "border-red-200 bg-red-50 text-red-800",
        }
      : result.remainingMoney === 0
        ? {
            label: "Fully allocated",
            description:
              "Your entire income has been allocated. Consider leaving a small buffer for unexpected expenses.",
            style: "border-amber-200 bg-amber-50 text-amber-800",
          }
        : result.expensePercentage >= 80
          ? {
              label: "Keep an eye on spending",
              description:
                "Most of your income is already allocated. Review your plan and make sure you have enough room for unexpected costs.",
              style: "border-amber-200 bg-amber-50 text-amber-800",
            }
          : {
              label: "Budget looking good",
              description:
                "Your planned expenses fit within your income. Give your remaining money a purpose, such as savings or an emergency fund.",
              style: "border-emerald-200 bg-[#E7F7F2] text-emerald-900",
            };

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Page introduction */}
        <header className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-[#E7F7F2] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
            Monthly planning
          </div>

          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[#0C1A33] sm:text-4xl lg:text-5xl">
            Give your money
            <br className="hidden sm:block" />{" "}
            <span className="text-[#0BB079]">
              a plan that works.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Plan your income, organize monthly expenses, and understand
            how much money you have left. A clearer view of your money
            starts here.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-slate-600 sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-[#0BB079]">✓</span>
              Nine expense categories
            </span>

            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-[#0BB079]">✓</span>
              Instant breakdown
            </span>

            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-[#0BB079]">✓</span>
              Saved in this browser
            </span>
          </div>
        </header>

        {/* Planner and overview */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-7">
          {/* Input panel */}
          <Card>
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F7F2] text-xl font-bold text-[#087F5B]">
                ₹
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#0C1A33]">
                  Plan your month
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Start with your take-home income, then add your
                  expected expenses.
                </p>
              </div>
            </div>

            {/* Income field */}
            <div className="mb-7 rounded-2xl border border-emerald-100 bg-[#F0FAF6] p-4 sm:p-5">
              <InputField
                label="Monthly take-home income (₹)"
                name="income"
                type="number"
                value={formData.income}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="e.g. 30000"
                required
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Enter the income available after taxes and regular
                payroll deductions.
              </p>
            </div>

            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#0C1A33]">
                  Expected expenses
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Enter monthly estimates in rupees.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {categories.length} categories
              </span>
            </div>

            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              {categories.map((category) => (
                <div
                  key={category.key}
                  className="min-w-0 rounded-xl border border-slate-200/80 bg-white p-3 transition-colors duration-200 hover:border-emerald-200 sm:p-4"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                      style={{
                        backgroundColor: `${category.color}14`,
                        color: category.color,
                      }}
                      aria-hidden="true"
                    >
                      {category.icon}
                    </span>

                    <span className="text-sm font-semibold text-[#0C1A33]">
                      {category.label}
                    </span>
                  </div>

                  <InputField
                    label={`${category.label} (₹)`}
                    name={category.key}
                    type="number"
                    value={formData[category.key]}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder={category.placeholder}
                  />
                </div>
              ))}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            <div className="mt-7 border-t border-slate-100 pt-6">
              <Button onClick={handleCalculate}>
                Create my monthly plan
              </Button>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Your calculation uses the information entered in this
                browser. Results are estimates, not financial advice.
              </p>
            </div>
          </Card>

          {/* Summary panel */}
          <div className="space-y-5 lg:sticky lg:top-6">
            <section className="overflow-hidden rounded-2xl bg-[#0C1A33] text-white shadow-lg shadow-slate-900/10">
              <div className="p-5 sm:p-6 lg:p-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-300">
                    Monthly overview
                  </p>

                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    {result ? "Calculated plan" : "Your plan"}
                  </span>
                </div>

                <p className="mt-6 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  Monthly income
                </p>

                <p className="mt-2 break-words text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {result ? formatCurrency(result.income) : "₹0.00"}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {result
                    ? "Here's how your planned spending compares with your income."
                    : "Your summary will appear here after you create your plan."}
                </p>

                {/* Income allocation bar */}
                <div
                  className="mt-7"
                  role="img"
                  aria-label={
                    result
                      ? `${result.expensePercentage.toFixed(
                          1
                        )}% of income allocated to planned expenses.`
                      : "No budget has been calculated yet."
                  }
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-300">
                      Income allocated
                    </span>

                    <span className="font-bold text-emerald-300">
                      {result
                        ? `${result.expensePercentage.toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        result && result.remainingMoney < 0
                          ? "bg-red-400"
                          : "bg-[#0BB079]"
                      }`}
                      style={{ width: `${expenseRatio}%` }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between gap-3 text-xs text-slate-400">
                    <span>₹0</span>
                    <span>
                      {result
                        ? formatCompactCurrency(result.income)
                        : "Income target"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-white/10 bg-white/[0.05]">
                <div className="min-w-0 p-4 sm:p-5">
                  <p className="text-xs text-slate-400">
                    Planned expenses
                  </p>

                  <p className="mt-2 break-words text-lg font-bold sm:text-xl">
                    {result
                      ? formatCurrency(result.totalExpenses)
                      : "₹0.00"}
                  </p>
                </div>

                <div className="min-w-0 border-l border-white/10 p-4 sm:p-5">
                  <p className="text-xs text-slate-400">
                    Money remaining
                  </p>

                  <p
                    className={`mt-2 break-words text-lg font-bold sm:text-xl ${
                      result && result.remainingMoney < 0
                        ? "text-red-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {result
                      ? formatCurrency(result.remainingMoney)
                      : "₹0.00"}
                  </p>
                </div>
              </div>
            </section>

            {/* Budget health */}
            {result && budgetStatus ? (
              <section
                className={`rounded-2xl border p-5 ${budgetStatus.style}`}
                aria-live="polite"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">
                    {result.remainingMoney < 0
                      ? "!"
                      : result.remainingMoney === 0
                        ? "◷"
                        : "✓"}
                  </span>

                  <h3 className="font-bold">
                    {budgetStatus.label}
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-6 opacity-90">
                  {budgetStatus.description}
                </p>
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-[#0C1A33]">
                  A clearer view of your money
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add your income and expenses to see how much of your
                  money is allocated and what remains.
                </p>
              </section>
            )}

            {/* Category snapshot */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#0C1A33]">
                    Spending breakdown
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your biggest planned expenses
                  </p>
                </div>

                {result && (
                  <span className="rounded-lg bg-[#E7F7F2] px-2.5 py-1 text-xs font-bold text-emerald-800">
                    {positiveCategories.length} active
                  </span>
                )}
              </div>

              {positiveCategories.length > 0 ? (
                <div className="mt-5 space-y-5">
                  {[...positiveCategories]
                    .sort((a, b) => b.amount - a.amount)
                    .map((category) => {
                      const percentage =
                        result.totalExpenses > 0
                          ? (category.amount / result.totalExpenses) * 100
                          : 0;

                      return (
                        <div key={category.key}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: category.color,
                                }}
                                aria-hidden="true"
                              />

                              <span className="truncate text-sm font-medium text-slate-700">
                                {category.label}
                              </span>
                            </div>

                            <span className="shrink-0 text-right text-sm font-bold text-[#0C1A33]">
                              {formatCurrency(category.amount)}
                            </span>
                          </div>

                          <div
                            className="h-2 overflow-hidden rounded-full bg-slate-100"
                            role="progressbar"
                            aria-label={`${category.label} share of total planned expenses`}
                            aria-valuenow={Number(percentage.toFixed(1))}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: category.color,
                              }}
                            />
                          </div>

                          <p className="mt-1 text-right text-xs text-slate-500">
                            {percentage.toFixed(1)}% of expenses
                          </p>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-[#F4F7FA] px-4 py-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg text-[#0BB079] shadow-sm">
                    ₹
                  </div>

                  <p className="mt-3 text-sm font-semibold text-[#0C1A33]">
                    Your breakdown starts here
                  </p>

                  <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    Add expense amounts and calculate your plan to see
                    which categories use the most money.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Detailed results */}
        {result && (
          <section
            className="mt-8 space-y-6 sm:mt-10"
            aria-live="polite"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                Your results
              </p>

              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0C1A33] sm:text-3xl">
                Your monthly plan, at a glance.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review the numbers below and adjust your planned
                expenses to match your financial priorities.
              </p>
            </div>

            {/* Summary metrics */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Monthly income"
                value={formatCurrency(result.income)}
                detail="Your available take-home income"
              />

              <MetricCard
                label="Planned expenses"
                value={formatCurrency(result.totalExpenses)}
                detail={`${result.expensePercentage.toFixed(
                  1
                )}% of monthly income`}
              />

              <MetricCard
                label={
                  result.remainingMoney >= 0
                    ? "Money remaining"
                    : "Budget shortfall"
                }
                value={formatCurrency(
                  Math.abs(result.remainingMoney)
                )}
                detail={
                  result.remainingMoney >= 0
                    ? "Available for savings or other goals"
                    : "Amount by which expenses exceed income"
                }
                accent={
                  result.remainingMoney >= 0 ? "green" : "red"
                }
              />

              <MetricCard
                label="Unallocated income"
                value={`${result.savingsPercentage.toFixed(1)}%`}
                detail={
                  result.remainingMoney >= 0
                    ? "Income left after planned expenses"
                    : "Your expenses are above your income"
                }
                accent={
                  result.remainingMoney >= 0 ? "green" : "red"
                }
              />
            </div>

            {/* Full expense breakdown */}
            <Card>
              <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-xl font-bold text-[#0C1A33]">
                    Expense breakdown
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Compare the amount assigned to each category.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {categories.length} categories reviewed
                </span>
              </div>

              <div className="space-y-5">
                {result.categories.map((category) => {
                  const percentage =
                    result.totalExpenses > 0
                      ? (category.amount / result.totalExpenses) * 100
                      : 0;

                  return (
                    <div
                      key={category.key}
                      className="rounded-xl border border-slate-100 p-3 sm:p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                          style={{
                            backgroundColor: `${category.color}14`,
                            color: category.color,
                          }}
                          aria-hidden="true"
                        >
                          {category.icon}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#0C1A33]">
                            {category.label}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {percentage.toFixed(1)}% of total expenses
                          </p>
                        </div>

                        <p className="shrink-0 text-right text-sm font-bold text-[#0C1A33] sm:text-base">
                          {formatCurrency(category.amount)}
                        </p>
                      </div>

                      <div className="ml-0 mt-4 h-2 overflow-hidden rounded-full bg-slate-100 sm:ml-[52px]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-[#F4F7FA] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-600">
                    Total planned expenses
                  </span>

                  <span className="text-right text-lg font-extrabold text-[#0C1A33]">
                    {formatCurrency(result.totalExpenses)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Remaining money */}
            <section
              className={`overflow-hidden rounded-2xl border ${
                result.remainingMoney >= 0
                  ? "border-emerald-200 bg-white"
                  : "border-red-200 bg-white"
              }`}
            >
              <div
                className={`p-5 sm:p-7 ${
                  result.remainingMoney >= 0
                    ? "bg-[#E7F7F2]"
                    : "bg-red-50"
                }`}
              >
                <p
                  className={`text-sm font-bold ${
                    result.remainingMoney >= 0
                      ? "text-emerald-800"
                      : "text-red-800"
                  }`}
                >
                  {result.remainingMoney >= 0
                    ? "Money available after expenses"
                    : "Amount over your monthly income"}
                </p>

                <p
                  className={`mt-3 break-words text-3xl font-extrabold tracking-tight sm:text-4xl ${
                    result.remainingMoney >= 0
                      ? "text-[#087F5B]"
                      : "text-red-700"
                  }`}
                >
                  {formatCurrency(Math.abs(result.remainingMoney))}
                </p>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {result.remainingMoney > 0
                    ? `${result.savingsPercentage.toFixed(
                        1
                      )}% of your income remains unallocated. You could direct some of this amount toward savings, an emergency fund, or upcoming bills.`
                    : result.remainingMoney === 0
                      ? "Your planned expenses use your full monthly income. Consider whether you need a buffer for unexpected costs."
                      : `Your planned expenses exceed your income by ${formatCurrency(
                          Math.abs(result.remainingMoney)
                        )}. Review your expenses and consider reducing non-essential spending.`}
                </p>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
                <div>
                  <p className="text-sm text-slate-500">
                    Monthly income
                  </p>

                  <p className="mt-2 text-lg font-bold text-[#0C1A33]">
                    {formatCurrency(result.income)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Planned expenses
                  </p>

                  <p className="mt-2 text-lg font-bold text-[#0C1A33]">
                    {formatCurrency(result.totalExpenses)}
                  </p>
                </div>
              </div>
            </section>

            <p className="px-1 text-center text-xs leading-6 text-slate-500">
              This planner provides estimates based on the information
              you enter. Actual spending may vary. Remaining money is
              not automatically saved or transferred, and this tool
              does not provide financial advice.
            </p>
          </section>
        )}

        {/* Footer note */}
        <footer className="mt-10 border-t border-slate-200 pt-5">
          <p className="text-center text-xs leading-6 text-slate-500">
            SpendWise Monthly Budget Planner · Your plan, your priorities.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default MonthlyBudgetPlannerPage;
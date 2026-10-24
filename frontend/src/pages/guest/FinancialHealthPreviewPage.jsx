import { useState } from "react";
import { useGuest } from "../../context/useGuest";

import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const financialFields = [
  {
    key: "income",
    label: "Monthly income",
    placeholder: "e.g. 30000",
    description: "Your take-home income after deductions.",
  },
  {
    key: "expenses",
    label: "Monthly expenses",
    placeholder: "e.g. 18000",
    description: "Rent, food, transport, bills and other spending.",
  },
  {
    key: "savings",
    label: "Monthly savings",
    placeholder: "e.g. 6000",
    description: "The amount you plan to set aside each month.",
  },
  {
    key: "debtPayments",
    label: "Monthly debt payments",
    placeholder: "e.g. 3000",
    description: "Loan EMIs, credit payments and other debt obligations.",
  },
];

const getHealthStyle = (rating) => {
  switch (rating) {
    case "Strong":
      return {
        text: "text-emerald-700",
        background: "bg-emerald-50",
        border: "border-emerald-200",
        ring: "#0BB079",
      };
    case "Balanced":
      return {
        text: "text-blue-700",
        background: "bg-blue-50",
        border: "border-blue-200",
        ring: "#3B82F6",
      };
    case "Needs Attention":
      return {
        text: "text-amber-700",
        background: "bg-amber-50",
        border: "border-amber-200",
        ring: "#F59E0B",
      };
    default:
      return {
        text: "text-red-700",
        background: "bg-red-50",
        border: "border-red-200",
        ring: "#EF4444",
      };
  }
};

function MetricCard({ label, value, description, icon, color }) {
  return (
    <Card className="h-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-[#0C1A33]">
            {value}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${color}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

function RatioBar({ label, value, description, color }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const barWidth = Math.min(safeValue, 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold tabular-nums text-[#0C1A33]">
          {safeValue.toFixed(1)}%
        </span>
      </div>

      <div
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={label}
        aria-valuenow={barWidth}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function FinancialHealthPreviewPage() {
  const { guestData, saveGuestData } = useGuest();

  const initialForm = {
    income: guestData.financialHealth?.formData?.income ?? "",
    expenses: guestData.financialHealth?.formData?.expenses ?? "",
    savings: guestData.financialHealth?.formData?.savings ?? "",
    debtPayments: guestData.financialHealth?.formData?.debtPayments ?? "",
  };

  const [formData, setFormData] = useState(initialForm);
  const [result, setResult] = useState(
    guestData.financialHealth?.result ?? null
  );
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleCalculate = (event) => {
    event.preventDefault();
    setError("");

    const monthlyIncome = Number(formData.income);
    const monthlyExpenses = Number(formData.expenses);
    const monthlySavings = Number(formData.savings);
    const monthlyDebt = Number(formData.debtPayments);

    const values = [
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      monthlyDebt,
    ];

    if (
      Object.values(formData).some((value) => String(value).trim() === "") ||
      values.some((value) => !Number.isFinite(value))
    ) {
      setError("Please enter a valid amount in every field.");
      return;
    }

    if (monthlyIncome <= 0) {
      setError("Monthly income must be greater than ₹0.");
      return;
    }

    if (values.some((value) => value < 0)) {
      setError("Amounts cannot be negative.");
      return;
    }

    const expenseRatio = (monthlyExpenses / monthlyIncome) * 100;
    const savingsRate = (monthlySavings / monthlyIncome) * 100;
    const debtRatio = (monthlyDebt / monthlyIncome) * 100;

    const leftover =
      monthlyIncome -
      monthlyExpenses -
      monthlySavings -
      monthlyDebt;

    let score = 100;

    if (expenseRatio > 80) {
      score -= 25;
    } else if (expenseRatio > 60) {
      score -= 10;
    }

    if (savingsRate < 10) {
      score -= 25;
    } else if (savingsRate < 20) {
      score -= 10;
    }

    if (debtRatio > 40) {
      score -= 30;
    } else if (debtRatio > 20) {
      score -= 15;
    }

    if (leftover < 0) {
      score -= 20;
    }

    score = Math.max(0, Math.min(100, score));

    let rating;

    if (score >= 80) {
      rating = "Strong";
    } else if (score >= 60) {
      rating = "Balanced";
    } else if (score >= 40) {
      rating = "Needs Attention";
    } else {
      rating = "At Risk";
    }

    const recommendations = [];

    if (expenseRatio > 60) {
      recommendations.push({
        title: "Review your spending",
        description:
          "Consider reviewing your monthly expenses and identifying areas where spending can be reduced.",
        icon: "↘",
      });
    }

    if (savingsRate < 20) {
      recommendations.push({
        title: "Build your savings habit",
        description:
          "Try gradually increasing your monthly savings rate to strengthen your financial buffer.",
        icon: "＋",
      });
    }

    if (debtRatio > 20) {
      recommendations.push({
        title: "Review debt commitments",
        description:
          "Keep an eye on debt payments and avoid taking on unnecessary high-cost debt.",
        icon: "↗",
      });
    }

    if (leftover < 0) {
      recommendations.push({
        title: "Rebalance your allocations",
        description:
          "Your current expenses, savings and debt payments exceed your income. Review these allocations.",
        icon: "!",
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: "Keep building good habits",
        description:
          "Your current numbers show a healthy balance between spending, saving and debt payments.",
        icon: "✓",
      });
    }

    const calculationResult = {
      score,
      rating,
      expenseRatio,
      savingsRate,
      debtRatio,
      leftover,
      recommendations,
    };

    setResult(calculationResult);

    saveGuestData("financialHealth", {
      formData,
      result: calculationResult,
    });
  };

  const handleReset = () => {
    const emptyForm = {
      income: "",
      expenses: "",
      savings: "",
      debtPayments: "",
    };

    setFormData(emptyForm);
    setResult(null);
    setError("");

    saveGuestData("financialHealth", {
      formData: emptyForm,
      result: null,
    });
  };

  const healthStyle = result ? getHealthStyle(result.rating) : null;

  return (
    <main className="min-h-[calc(100vh-73px)] bg-[#F4F7FA]">
      {/* Page introduction */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-[#E7F7F2] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
              Financial wellness
            </div>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-[#0C1A33] sm:text-4xl lg:text-5xl">
              Understand your money.
              <span className="mt-1 block text-[#0BB079]">
                Strengthen your financial health.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Get a simple snapshot of your spending, savings and debt
              commitments. Discover areas to review and take the next step
              towards better money habits.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                "Quick financial snapshot",
                "Personalized suggestions",
                "Free guest calculator",
              ].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 sm:text-sm"
                >
                  <span className="font-bold text-[#0BB079]">✓</span>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid items-start gap-6 xl:grid-cols-[0.88fr_1.12fr]">
          {/* Input panel */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-6 sm:px-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F7F2] text-2xl text-emerald-700">
                  ₹
                </div>

                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0C1A33]">
                    Your monthly numbers
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Use your approximate monthly amounts to get started.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCalculate} className="space-y-5 p-5 sm:p-7">
              {financialFields.map((field, index) => (
                <div
                  key={field.key}
                  className={
                    index === 0
                      ? "rounded-xl border border-emerald-100 bg-[#F0FAF6] p-4"
                      : "rounded-xl border border-slate-200 bg-white p-4"
                  }
                >
                  <InputField
                    label={field.label}
                    name={field.key}
                    type="number"
                    value={formData[field.key]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    min="0"
                    step="0.01"
                    required
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {field.description}
                  </p>
                </div>
              ))}

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <Button type="submit">
                  Check financial health
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                >
                  Reset values
                </Button>
              </div>

              <p className="text-xs leading-5 text-slate-500">
                Your preview uses the numbers you enter. It is an educational
                estimate, not professional financial advice.
              </p>
            </form>
          </Card>

          {/* Results panel */}
          <div className="space-y-5" aria-live="polite">
            {!result ? (
              <>
                <section className="overflow-hidden rounded-2xl bg-[#0C1A33] p-6 text-white shadow-sm sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-300">
                      Financial overview
                    </span>

                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                      Ready when you are
                    </span>
                  </div>

                  <div className="mt-8">
                    <p className="text-sm text-slate-300">
                      Your financial health score
                    </p>

                    <div className="mt-3 flex items-end gap-3">
                      <span className="text-5xl font-extrabold tracking-tight">
                        -- 
                      </span>
                      <span className="mb-1 text-sm text-slate-400">
                        / 100
                      </span>
                    </div>

                    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-0 rounded-full bg-[#0BB079]" />
                    </div>

                    <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                      Enter your monthly income, expenses, savings and debt
                      payments to generate your personal preview.
                    </p>
                  </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: "↘",
                      title: "Spending",
                      description: "Understand how much income goes towards expenses.",
                    },
                    {
                      icon: "＋",
                      title: "Savings",
                      description: "See how much of your income you set aside.",
                    },
                    {
                      icon: "↗",
                      title: "Debt",
                      description: "Review your monthly debt commitments.",
                    },
                    {
                      icon: "✓",
                      title: "Balance",
                      description: "Check what remains after your allocations.",
                    },
                  ].map((item) => (
                    <Card key={item.title} className="p-5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F7F2] text-lg font-bold text-emerald-700">
                        {item.icon}
                      </span>

                      <h3 className="mt-4 font-bold text-[#0C1A33]">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Health score */}
                <section className="overflow-hidden rounded-2xl bg-[#0C1A33] text-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-5 sm:px-7">
                    <div>
                      <p className="text-sm font-semibold text-slate-300">
                        Your financial overview
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Based on your monthly figures
                      </p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold ${healthStyle.background} ${healthStyle.text} ${healthStyle.border}`}
                    >
                      {result.rating}
                    </span>
                  </div>

                  <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:p-7">
                    <div
                      className="mx-auto flex h-36 w-36 items-center justify-center rounded-full sm:mx-0"
                      style={{
                        background: `conic-gradient(${healthStyle.ring} ${result.score * 3.6}deg, rgba(255,255,255,0.12) 0deg)`,
                      }}
                      role="img"
                      aria-label={`Financial health score: ${result.score} out of 100`}
                    >
                      <div className="flex h-[116px] w-[116px] flex-col items-center justify-center rounded-full bg-[#0C1A33]">
                        <span className="text-4xl font-extrabold tracking-tight">
                          {result.score}
                        </span>
                        <span className="mt-1 text-xs text-slate-400">
                          OUT OF 100
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        Your current rating
                      </p>

                      <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                        {result.rating === "Strong"
                          ? "You're building healthy habits."
                          : result.rating === "Balanced"
                            ? "You're finding your balance."
                            : result.rating === "Needs Attention"
                              ? "There are areas to review."
                              : "Let's review your allocations."}
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        This score is a simplified estimate based on the
                        entered ratios and remaining balance. It is not a
                        credit score or a professional financial assessment.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Summary metrics */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <MetricCard
                    label="Expense rate"
                    value={`${result.expenseRatio.toFixed(1)}%`}
                    description="Of monthly income used for expenses."
                    icon="↘"
                    color="bg-slate-100 text-slate-700"
                  />

                  <MetricCard
                    label="Savings rate"
                    value={`${result.savingsRate.toFixed(1)}%`}
                    description="Of monthly income set aside as savings."
                    icon="＋"
                    color="bg-[#E7F7F2] text-emerald-700"
                  />

                  <MetricCard
                    label="Debt rate"
                    value={`${result.debtRatio.toFixed(1)}%`}
                    description="Of monthly income allocated to debt payments."
                    icon="↗"
                    color="bg-amber-50 text-amber-700"
                  />

                  <MetricCard
                    label="Remaining balance"
                    value={formatCurrency(result.leftover)}
                    description="After expenses, savings and debt payments."
                    icon="₹"
                    color={
                      result.leftover >= 0
                        ? "bg-[#E7F7F2] text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }
                  />
                </div>

                {/* Ratio breakdown */}
                <Card className="p-5 sm:p-7">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-[#0C1A33]">
                      Where your income goes
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Compare each allocation with your monthly income.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <RatioBar
                      label="Expenses"
                      value={result.expenseRatio}
                      description="Money used for your regular spending."
                      color="bg-[#0C1A33]"
                    />

                    <RatioBar
                      label="Savings"
                      value={result.savingsRate}
                      description="Money you plan to save."
                      color="bg-[#0BB079]"
                    />

                    <RatioBar
                      label="Debt payments"
                      value={result.debtRatio}
                      description="Money allocated to debt obligations."
                      color="bg-amber-500"
                    />
                  </div>
                </Card>

                {/* Recommendations */}
                <Card className="p-5 sm:p-7">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] text-xl text-emerald-700">
                      ✦
                    </span>

                    <div>
                      <h2 className="text-lg font-bold text-[#0C1A33]">
                        Your next steps
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Suggestions based on the numbers you entered.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {result.recommendations.map((recommendation, index) => {
                      const item =
                        typeof recommendation === "string"
                          ? {
                              title: "Suggestion",
                              description: recommendation,
                              icon: "✓",
                            }
                          : recommendation;

                      return (
                        <div
                          key={`${item.title}-${index}`}
                          className="flex items-start gap-3 rounded-xl border border-slate-100 bg-[#F8FAFC] p-4"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white font-bold text-emerald-700 shadow-sm">
                            {item.icon}
                          </span>

                          <div>
                            <h3 className="text-sm font-bold text-[#0C1A33]">
                              {item.title}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Balance summary */}
                <section
                  className={`overflow-hidden rounded-2xl border ${result.leftover >= 0 ? "border-emerald-200" : "border-red-200"}`}
                >
                  <div
                    className={`p-6 sm:p-7 ${result.leftover >= 0 ? "bg-[#E7F7F2]" : "bg-red-50"}`}
                  >
                    <p
                      className={`text-sm font-semibold ${result.leftover >= 0 ? "text-emerald-800" : "text-red-800"}`}
                    >
                      {result.leftover >= 0
                        ? "Money remaining after allocations"
                        : "Your allocations exceed your income"}
                    </p>

                    <p
                      className={`mt-3 break-words text-3xl font-extrabold tracking-tight sm:text-4xl ${result.leftover >= 0 ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {formatCurrency(Math.abs(result.leftover))}
                    </p>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                      {result.leftover >= 0
                        ? "This is the amount not assigned to the expenses, savings and debt payments you entered. Consider your upcoming needs before allocating it."
                        : "Your expenses, savings and debt payments add up to more than your monthly income. Review your allocations to find a sustainable balance."}
                    </p>
                  </div>

                  <div className="grid gap-4 bg-white p-5 sm:grid-cols-2 sm:p-6">
                    <div>
                      <p className="text-sm text-slate-500">
                        Monthly income
                      </p>
                      <p className="mt-2 text-lg font-bold text-[#0C1A33]">
                        {formatCurrency(Number(formData.income))}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Total allocations
                      </p>
                      <p className="mt-2 text-lg font-bold text-[#0C1A33]">
                        {formatCurrency(
                          Number(formData.expenses) +
                            Number(formData.savings) +
                            Number(formData.debtPayments)
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                <p className="px-1 text-xs leading-5 text-slate-500">
                  This educational preview is based only on your inputs.
                  Actual financial health depends on factors not assessed by
                  this tool, including emergency savings, assets, interest
                  rates and future obligations.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default FinancialHealthPreviewPage;
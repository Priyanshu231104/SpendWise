import { useState } from "react";
import { useGuest } from "../../context/useGuest";

import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";

function FinancialHealthPreviewPage() {
  const { guestData, saveGuestData } = useGuest();
  const [income, setIncome] = useState(
    guestData.financialHealth?.formData?.income || ""
  );
  
  const [expenses, setExpenses] = useState(
    guestData.financialHealth?.formData?.expenses || ""
  );
  
  const [savings, setSavings] = useState(
    guestData.financialHealth?.formData?.savings || ""
  );
  
  const [debtPayments, setDebtPayments] = useState(
    guestData.financialHealth?.formData?.debtPayments || ""
  );

  const [result, setResult] = useState(
    guestData.financialHealth?.result || null
  );
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const handleCalculate = (event) => {
    event.preventDefault();
    setError("");

    const monthlyIncome = Number(income);
    const monthlyExpenses = Number(expenses);
    const monthlySavings = Number(savings);
    const monthlyDebt = Number(debtPayments);

    if (!monthlyIncome || monthlyIncome <= 0) {
      setError("Please enter a valid monthly income.");
      return;
    }

    if (monthlyExpenses < 0 || monthlySavings < 0 || monthlyDebt < 0) {
      setError("Values cannot be negative.");
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

    // Expense health
    if (expenseRatio > 80) {
      score -= 25;
    } else if (expenseRatio > 60) {
      score -= 10;
    }

    // Savings health
    if (savingsRate < 10) {
      score -= 25;
    } else if (savingsRate < 20) {
      score -= 10;
    }

    // Debt health
    if (debtRatio > 40) {
      score -= 30;
    } else if (debtRatio > 20) {
      score -= 15;
    }

    // Negative leftover
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
      recommendations.push(
        "Consider reviewing your monthly expenses and identifying areas where spending can be reduced."
      );
    }

    if (savingsRate < 20) {
      recommendations.push(
        "Try gradually increasing your monthly savings rate."
      );
    }

    if (debtRatio > 20) {
      recommendations.push(
        "Keep an eye on your debt payments and avoid taking on unnecessary high-cost debt."
      );
    }

    if (leftover < 0) {
      recommendations.push(
        "Your current monthly allocations exceed your income. Review your expenses, savings, or debt payments."
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Your current numbers show a healthy balance between spending, saving, and debt payments."
      );
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
      formData: {
        income,
        expenses,
        savings,
        debtPayments,
      },
      result: calculationResult,
    });
  };

  const handleReset = () => {
    setIncome("");
    setExpenses("");
    setSavings("");
    setDebtPayments("");
    setResult(null);
    setError("");
  
    saveGuestData("financialHealth", {
      formData: {
        income: "",
        expenses: "",
        savings: "",
        debtPayments: "",
      },
      result: null,
    });
  };

  return (
    <section className="min-h-[calc(100vh-73px)] bg-slate-50 px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Financial Wellness
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Financial Health Preview
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Get a quick educational snapshot of your spending, savings, and
            debt patterns using your monthly numbers.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Input section */}
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Your Monthly Numbers
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter approximate amounts to generate your preview.
              </p>
            </div>

            <form onSubmit={handleCalculate} className="space-y-5">
              <InputField
                label="Monthly Income"
                name="income"
                type="number"
                value={income}
                onChange={(event) => setIncome(event.target.value)}
                placeholder="e.g. 30000"
                min="0"
                required
              />

              <InputField
                label="Monthly Expenses"
                name="expenses"
                type="number"
                value={expenses}
                onChange={(event) => setExpenses(event.target.value)}
                placeholder="e.g. 18000"
                min="0"
                required
              />

              <InputField
                label="Monthly Savings"
                name="savings"
                type="number"
                value={savings}
                onChange={(event) => setSavings(event.target.value)}
                placeholder="e.g. 6000"
                min="0"
                required
              />

              <InputField
                label="Monthly Debt Payments"
                name="debtPayments"
                type="number"
                value={debtPayments}
                onChange={(event) => setDebtPayments(event.target.value)}
                placeholder="e.g. 3000"
                min="0"
                required
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button type="submit">
                  Check Financial Health
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </div>
            </form>
          </Card>

          {/* Result section */}
          <div className="space-y-6">
            {!result ? (
              <Card className="flex min-h-[420px] items-center justify-center text-center">
                <div className="max-w-sm">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">
                    ↗
                  </div>

                  <h2 className="text-xl font-semibold text-slate-900">
                    Your preview will appear here
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your monthly financial numbers and we'll generate a
                    simple overview.
                  </p>
                </div>
              </Card>
            ) : (
              <>
                {/* Score */}
                <Card>
                  <div className="flex flex-col items-center text-center">
                    <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
                      Financial Health Preview
                    </p>

                    <div className="mt-5 flex h-32 w-32 items-center justify-center rounded-full border-8 border-slate-900">
                      <div>
                        <p className="text-3xl font-bold text-slate-900">
                          {result.score}
                        </p>
                        <p className="text-xs text-slate-500">/ 100</p>
                      </div>
                    </div>

                    <h2 className="mt-5 text-2xl font-bold text-slate-900">
                      {result.rating}
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      This is an educational estimate based only on the
                      numbers you entered. It is not a professional financial
                      assessment.
                    </p>
                  </div>
                </Card>

                {/* Metrics */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="p-5">
                    <p className="text-sm text-slate-500">
                      Expense Rate
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {result.expenseRatio.toFixed(1)}%
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      of your income
                    </p>
                  </Card>

                  <Card className="p-5">
                    <p className="text-sm text-slate-500">
                      Savings Rate
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {result.savingsRate.toFixed(1)}%
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      of your income
                    </p>
                  </Card>

                  <Card className="p-5">
                    <p className="text-sm text-slate-500">
                      Debt Rate
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {result.debtRatio.toFixed(1)}%
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      of your income
                    </p>
                  </Card>
                </div>

                {/* Remaining money */}
                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Remaining Allocation
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Income left after your entered allocations.
                      </p>
                    </div>

                    <p
                      className={`text-xl font-bold ${
                        result.leftover >= 0
                          ? "text-slate-900"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(result.leftover)}
                    </p>
                  </div>
                </Card>

                {/* Recommendations */}
                <Card>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Suggestions
                  </h2>

                  <div className="mt-4 space-y-3">
                    {result.recommendations.map((recommendation, index) => (
                      <div
                        key={index}
                        className="rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
                      >
                        {recommendation}
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinancialHealthPreviewPage;
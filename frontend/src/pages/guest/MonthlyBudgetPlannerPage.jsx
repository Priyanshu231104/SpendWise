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
  },
  {
    key: "food",
    label: "Food & Groceries",
    placeholder: "Enter food expenses",
  },
  {
    key: "transport",
    label: "Transportation",
    placeholder: "Enter transportation expenses",
  },
  {
    key: "utilities",
    label: "Utilities & Bills",
    placeholder: "Enter utility expenses",
  },
  {
    key: "education",
    label: "Education",
    placeholder: "Enter education expenses",
  },
  {
    key: "health",
    label: "Health",
    placeholder: "Enter health expenses",
  },
  {
    key: "entertainment",
    label: "Entertainment",
    placeholder: "Enter entertainment expenses",
  },
  {
    key: "shopping",
    label: "Shopping",
    placeholder: "Enter shopping expenses",
  },
  {
    key: "other",
    label: "Other Expenses",
    placeholder: "Enter other expenses",
  },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

function MonthlyBudgetPlannerPage() {
  const { guestData, saveGuestData } = useGuest();
  const [formData, setFormData] = useState(
    guestData.monthlyPlanner?.formData || {
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
    }
  );

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
    const income = Number(formData.income);

    if (
      formData.income.trim() === "" ||
      !Number.isFinite(income) ||
      income <= 0
    ) {
      setError("Please enter a valid monthly income greater than ₹0.");
      setResult(null);
      return;
    }

    const categoryResults = categories.map((category) => {
      const amount = Number(formData[category.key]) || 0;

      return {
        ...category,
        amount,
      };
    });

    const totalExpenses = categoryResults.reduce(
      (total, category) => total + category.amount,
      0
    );

    const remainingMoney = income - totalExpenses;

    const expensePercentage = (totalExpenses / income) * 100;

    const savingsPercentage = (remainingMoney / income) * 100;

    setError("");

    const calculationResult = {
      income,
      categories: categoryResults,
      totalExpenses,
      remainingMoney,
      expensePercentage,
      savingsPercentage,
    };
    
    setResult(calculationResult);
    
    saveGuestData("monthlyPlanner", {
      formData,
      result: calculationResult,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <header className="mb-8">
          <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Monthly planning
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Monthly Budget Planner
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Organize your expected monthly spending and see how much
            money you may have left after covering your planned expenses.
          </p>
        </header>

        {/* Inputs */}
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Plan Your Month
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter your monthly income and expected expenses.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <InputField
                label="Monthly Income"
                name="income"
                type="number"
                value={formData.income}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Enter your monthly income"
                required
              />
            </div>

            {categories.map((category) => (
              <InputField
                key={category.key}
                label={category.label}
                name={category.key}
                type="number"
                value={formData[category.key]}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder={category.placeholder}
              />
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 text-sm font-medium text-red-600"
            >
              {error}
            </p>
          )}

          <div className="mt-6">
            <Button onClick={handleCalculate}>
              Create Monthly Plan
            </Button>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <section
            className="mt-6 space-y-6"
            aria-live="polite"
          >
            {/* Overview */}
            <Card>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Monthly Plan Summary
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Here's how your planned monthly spending looks.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Monthly Income
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {formatCurrency(result.income)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Planned Expenses
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {formatCurrency(result.totalExpenses)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Remaining Money
                  </p>

                  <p
                    className={`mt-1 text-xl font-bold ${
                      result.remainingMoney >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(result.remainingMoney)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Planned Expense %
                  </p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {result.expensePercentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Spending Breakdown
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your planned spending across each category.
                </p>
              </div>

              <div className="space-y-4">
                {result.categories
                  .filter((category) => category.amount > 0)
                  .map((category) => {
                    const percentage =
                      result.totalExpenses > 0
                        ? (category.amount / result.totalExpenses) * 100
                        : 0;

                    return (
                      <div key={category.key}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-slate-700">
                            {category.label}
                          </span>

                          <span className="text-sm font-semibold text-slate-900">
                            {formatCurrency(category.amount)}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                            style={{
                              width: `${Math.min(percentage, 100)}%`,
                            }}
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {percentage.toFixed(1)}% of planned expenses
                        </p>
                      </div>
                    );
                  })}

                {result.totalExpenses === 0 && (
                  <p className="text-sm text-slate-500">
                    No expenses were entered yet.
                  </p>
                )}
              </div>
            </Card>

            {/* Savings / Remaining */}
            <Card>
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900">
                  Your Remaining Money
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  This is the amount left after your planned expenses.
                </p>
              </div>

              <div
                className={`rounded-xl p-6 ${
                  result.remainingMoney >= 0
                    ? "bg-emerald-50"
                    : "bg-red-50"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    result.remainingMoney >= 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {result.remainingMoney >= 0
                    ? "Potential Savings / Unallocated Money"
                    : "Budget Shortfall"}
                </p>

                <p
                  className={`mt-2 text-3xl font-bold ${
                    result.remainingMoney >= 0
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {formatCurrency(
                    Math.abs(result.remainingMoney)
                  )}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  {result.remainingMoney >= 0
                    ? `${result.savingsPercentage.toFixed(
                        2
                      )}% of your income remains unallocated.`
                    : `Your planned expenses are ${Math.abs(
                        result.remainingMoney
                      ).toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                      })} higher than your income.`}
                </p>
              </div>
            </Card>

            <p className="px-1 text-xs leading-5 text-slate-500">
              This planner provides an estimate based on the numbers you
              enter. Actual spending may vary throughout the month.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

export default MonthlyBudgetPlannerPage;
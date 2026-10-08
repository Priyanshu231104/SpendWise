import { useState } from "react";
import { useGuest } from "../../context/useGuest";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

function BudgetRuleCalculatorPage() {
  const { guestData, saveGuestData } = useGuest();
  const [income, setIncome] = useState(
    guestData.budgetRule?.formData?.income || ""
  );
  const [result, setResult] = useState(
    guestData.budgetRule?.result || null
  );
  const [error, setError] = useState("");

  const handleCalculate = () => {
    const monthlyIncome = Number(income);

    if (
      income.trim() === "" ||
      !Number.isFinite(monthlyIncome) ||
      monthlyIncome <= 0
    ) {
      setError("Please enter a valid monthly income greater than ₹0.");
      setResult(null);
      return;
    }

    setError("");

    const calculationResult = {
      income: monthlyIncome,
      needs: monthlyIncome * 0.5,
      wants: monthlyIncome * 0.3,
      savings: monthlyIncome * 0.2,
    };
    
    setResult(calculationResult);
    
    saveGuestData("budgetRule", {
      formData: {
        income,
      },
      result: calculationResult,
    });
  };

  const allocations = result
    ? [
        {
          title: "Needs",
          percentage: 50,
          amount: result.needs,
          description:
            "Essential expenses such as rent, groceries, utilities, and transport.",
          color: "bg-blue-600",
          background: "bg-blue-50",
          textColor: "text-blue-700",
        },
        {
          title: "Wants",
          percentage: 30,
          amount: result.wants,
          description:
            "Non-essential spending such as entertainment, dining out, and shopping.",
          color: "bg-violet-600",
          background: "bg-violet-50",
          textColor: "text-violet-700",
        },
        {
          title: "Savings & Debt",
          percentage: 20,
          amount: result.savings,
          description:
            "Savings goals, emergency funds, investments, and eligible debt repayments.",
          color: "bg-emerald-600",
          background: "bg-emerald-50",
          textColor: "text-emerald-700",
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Budgeting guide
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            50/30/20 Budget Calculator
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Create a simple monthly budget by dividing your income
            between essential needs, personal wants, and savings.
          </p>
        </header>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Your Monthly Income
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter your monthly take-home income to calculate your
              recommended budget.
            </p>
          </div>

          <InputField
            label="Monthly Take-Home Income"
            name="income"
            type="number"
            value={income}
            onChange={(event) => {
              setIncome(event.target.value);
              setError("");
              setResult(null);
            }}
            min="0"
            step="0.01"
            placeholder="e.g. 30000"
            required
          />

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6">
            <Button onClick={handleCalculate}>
              Calculate My Budget
            </Button>
          </div>
        </Card>

        {result && (
          <section className="mt-6 space-y-6" aria-live="polite">
            <Card>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Your Recommended Budget
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Based on a monthly income of{" "}
                  {formatCurrency(result.income)}.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {allocations.map((allocation) => (
                  <div
                    key={allocation.title}
                    className={`rounded-xl ${allocation.background} p-5`}
                  >
                    <p
                      className={`text-sm font-semibold ${allocation.textColor}`}
                    >
                      {allocation.title}
                    </p>

                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {allocation.percentage}%
                    </p>

                    <p className="mt-1 text-lg font-semibold text-slate-800">
                      {formatCurrency(allocation.amount)}
                    </p>

                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      {allocation.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <div
                  className="flex h-4 w-full overflow-hidden rounded-full bg-slate-200"
                  role="img"
                  aria-label="Budget allocation: 50 percent needs, 30 percent wants, and 20 percent savings and debt repayment"
                >
                  <div className="h-full w-1/2 bg-blue-600" />
                  <div className="h-full w-[30%] bg-violet-600" />
                  <div className="h-full w-1/5 bg-emerald-600" />
                </div>

                <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-slate-600">
                  <span>Needs: 50%</span>
                  <span>Wants: 30%</span>
                  <span>Savings: 20%</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">
                  Monthly allocation check
                </p>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600">
                    Total allocated
                  </span>

                  <span className="font-bold text-slate-900">
                    {formatCurrency(
                      result.needs + result.wants + result.savings
                    )}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600">
                    Monthly income
                  </span>

                  <span className="font-bold text-slate-900">
                    {formatCurrency(result.income)}
                  </span>
                </div>
              </div>
            </Card>

            <p className="px-1 text-xs leading-5 text-slate-500">
              The 50/30/20 rule is a budgeting guideline, not a strict
              requirement. Adjust the percentages to suit your living
              costs, financial obligations, and personal goals.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

export default BudgetRuleCalculatorPage;
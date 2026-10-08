import { useState } from "react";
import { useGuest } from "../../context/useGuest";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";

function SavingsGoalCalculatorPage() {
  const { guestData, saveGuestData } = useGuest();
  const [formData, setFormData] = useState(
    guestData.savingsGoal?.formData || {
      goalAmount: "",
      currentSavings: "",
      months: "",
    }
  );
  
  const [result, setResult] = useState(
    guestData.savingsGoal?.result || null
  );
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
  };

  const handleCalculate = () => {
    const { goalAmount, currentSavings, months } = formData;

    if (
      goalAmount.trim() === "" ||
      currentSavings.trim() === "" ||
      months.trim() === ""
    ) {
      setError("Please complete all fields before calculating.");
      setResult(null);
      return;
    }

    const goal = Number(goalAmount);
    const saved = Number(currentSavings);
    const duration = Number(months);

    if (!Number.isFinite(goal) || goal <= 0) {
      setError("Your savings goal must be greater than ₹0.");
      setResult(null);
      return;
    }

    if (!Number.isFinite(saved) || saved < 0) {
      setError("Current savings cannot be negative.");
      setResult(null);
      return;
    }

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 1200
    ) {
      setError("Enter a whole number of months between 1 and 1200.");
      setResult(null);
      return;
    }

    const remainingAmount = Math.max(goal - saved, 0);
    const monthlySavings = remainingAmount / duration;
    const progress = Math.min((saved / goal) * 100, 100);

    setError("");

    const calculationResult = {
      goalAmount: goal,
      currentSavings: saved,
      remainingAmount,
      monthlySavings,
      progress,
      achieved: saved >= goal,
      months: duration,
    };
    
    setResult(calculationResult);
    
    saveGuestData("savingsGoal", {
      formData,
      result: calculationResult,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="mb-8">
          <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Savings planner
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Savings Goal Calculator
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Turn your financial goals into a practical monthly savings
            plan. Find out how much more you need to save and track
            your progress toward your target.
          </p>
        </section>

        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Your Savings Goal
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter your target, existing savings, and timeline.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <InputField
                label="Target Savings Amount"
                name="goalAmount"
                type="number"
                value={formData.goalAmount}
                onChange={handleChange}
                min="0"
                placeholder="e.g. 100000"
                required
              />
            </div>

            <InputField
              label="Current Savings"
              name="currentSavings"
              type="number"
              value={formData.currentSavings}
              onChange={handleChange}
              min="0"
              placeholder="e.g. 15000"
              required
            />

            <InputField
              label="Time to Reach Goal (Months)"
              name="months"
              type="number"
              value={formData.months}
              onChange={handleChange}
              min="1"
              step="1"
              placeholder="e.g. 12"
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          <div className="mt-6">
            <Button onClick={handleCalculate}>
              Calculate Savings Plan
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Your Savings Plan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Here is your estimated path toward your goal.
              </p>
            </div>

            {result.achieved ? (
              <div
                role="status"
                className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5"
              >
                <h3 className="text-lg font-bold text-emerald-800">
                  Congratulations! Goal achieved.
                </h3>

                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Your current savings meet or exceed your target.
                  You do not need to save anything additional to reach
                  this goal.
                </p>
              </div>
            ) : (
              <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-5">
                <p className="text-sm font-medium text-indigo-700">
                  Recommended Monthly Savings
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-indigo-700 sm:text-4xl">
                  {formatCurrency(result.monthlySavings)}
                </p>

                <p className="mt-2 text-sm text-indigo-600">
                  Save this amount every month for{" "}
                  {result.months} months to reach your target,
                  assuming no interest or investment returns.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Target Amount
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatCurrency(result.goalAmount)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Already Saved
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatCurrency(result.currentSavings)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Amount Remaining
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {formatCurrency(result.remainingAmount)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Time Available
                </p>

                <p className="mt-2 text-xl font-bold text-slate-900">
                  {result.months} months
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Goal Progress
                </h3>

                <span className="text-sm font-bold text-indigo-600">
                  {result.progress.toFixed(1)}%
                </span>
              </div>

              <div
                className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Savings goal progress"
                aria-valuenow={Number(result.progress.toFixed(1))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${result.progress}%` }}
                />
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                You have saved {formatCurrency(result.currentSavings)}{" "}
                toward your {formatCurrency(result.goalAmount)} goal.
              </p>
            </div>
          </Card>
        )}

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          This calculator provides estimates based on your inputs.
          It does not account for interest, investment returns,
          inflation, or changes in your savings.
        </p>
      </div>
    </main>
  );
}

export default SavingsGoalCalculatorPage;

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

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

    const calculationResult = {
      goalAmount: goal,
      currentSavings: saved,
      remainingAmount,
      monthlySavings,
      progress,
      achieved: saved >= goal,
      months: duration,
    };

    setError("");
    setResult(calculationResult);

    saveGuestData("savingsGoal", {
      formData,
      result: calculationResult,
    });
  };

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-[#E7F7F2] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
            Savings planner
          </span>

          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-[#0C1A33] sm:text-4xl lg:text-5xl">
            Make your goals happen,
            <span className="block text-[#0BB079]">
              one month at a time.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Turn your savings target into a practical monthly plan.
            See how much you still need and track your progress toward
            the things that matter to you.
          </p>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F7F2] text-xl font-bold text-emerald-700">
                ₹
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#0C1A33]">
                  Your savings target
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set your goal and choose a realistic timeline.
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-emerald-100 bg-[#F0FAF6] p-4">
              <InputField
                label="Target savings amount (₹)"
                name="goalAmount"
                type="number"
                value={formData.goalAmount}
                onChange={handleChange}
                min="0"
                step="any"
                placeholder="e.g. 100000"
                required
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                How much money would you like to save in total?
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <InputField
                label="Current savings (₹)"
                name="currentSavings"
                type="number"
                value={formData.currentSavings}
                onChange={handleChange}
                min="0"
                step="any"
                placeholder="e.g. 15000"
                required
              />

              <InputField
                label="Time available (months)"
                name="months"
                type="number"
                value={formData.months}
                onChange={handleChange}
                min="1"
                max="1200"
                step="1"
                placeholder="e.g. 12"
                required
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-6">
              <Button onClick={handleCalculate}>
                Calculate my savings plan
              </Button>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Your inputs are used for this calculator's guest
              experience. Results are estimates, not financial advice.
            </p>
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden !p-0">
              <div className="bg-[#0C1A33] p-6 text-white sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-300">
                    Your savings goal
                  </p>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {result?.achieved ? "Achieved" : "Your next milestone"}
                  </span>
                </div>

                <p className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {result
                    ? formatCurrency(result.goalAmount)
                    : "₹1,00,000"}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {result
                    ? result.achieved
                      ? "You've reached your savings target."
                      : `Save ${formatCurrency(result.monthlySavings)} each month to reach your goal.`
                    : "Enter your own target to build a personalized savings plan."}
                </p>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Goal progress</span>
                    <span className="font-bold text-emerald-300">
                      {result ? `${result.progress.toFixed(1)}%` : "0%"}
                    </span>
                  </div>

                  <div
                    className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15"
                    role="progressbar"
                    aria-label="Savings goal progress"
                    aria-valuenow={result ? Number(result.progress.toFixed(1)) : 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-[#0BB079] transition-all duration-500"
                      style={{
                        width: `${result ? result.progress : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Already saved</p>
                  <p className="mt-2 break-words text-lg font-bold text-[#0C1A33]">
                    {formatCurrency(result?.currentSavings ?? 0)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Still needed</p>
                  <p className="mt-2 break-words text-lg font-bold text-[#0C1A33]">
                    {formatCurrency(result?.remainingAmount ?? 0)}
                  </p>
                </div>
              </div>
            </Card>

            {result && (
              <Card>
                <h2 className="text-lg font-bold text-[#0C1A33]">
                  Your monthly plan
                </h2>

                {result.achieved ? (
                  <div
                    role="status"
                    className="mt-4 rounded-xl border border-emerald-200 bg-[#E7F7F2] p-4"
                  >
                    <p className="font-bold text-emerald-800">
                      Congratulations! Goal achieved.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                      Your current savings meet or exceed your target.
                      No additional savings are required to reach it.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-emerald-100 bg-[#F0FAF6] p-5">
                    <p className="text-sm font-medium text-emerald-800">
                      Recommended monthly savings
                    </p>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                      {formatCurrency(result.monthlySavings)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      For {result.months} months, assuming no interest
                      or investment returns.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                  <span className="text-slate-500">Target timeline</span>
                  <span className="font-semibold text-[#0C1A33]">
                    {result.months} months
                  </span>
                </div>
              </Card>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-[#0C1A33]">
                A simple plan works
              </h3>
              <ol className="mt-4 space-y-4">
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] text-sm font-bold text-emerald-700">
                    1
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0C1A33]">
                      Set a clear target
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Decide how much you want to save.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] text-sm font-bold text-emerald-700">
                    2
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0C1A33]">
                      Choose your timeline
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Pick a monthly plan that fits your goal.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] text-sm font-bold text-emerald-700">
                    3
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0C1A33]">
                      Track your progress
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Review your target as your savings grow.
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          This calculator does not account for interest, investment
          returns, inflation, or changes in your savings.
        </p>
      </div>
    </main>
  );
}

export default SavingsGoalCalculatorPage;

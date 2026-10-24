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

    const calculationResult = {
      income: monthlyIncome,
      needs: monthlyIncome * 0.5,
      wants: monthlyIncome * 0.3,
      savings: monthlyIncome * 0.2,
    };

    setError("");
    setResult(calculationResult);

    saveGuestData("budgetRule", {
      formData: { income },
      result: calculationResult,
    });
  };

  const allocations = result
    ? [
        {
          title: "Needs",
          percentage: 50,
          amount: result.needs,
          description: "Rent, groceries, utilities and transport.",
          color: "bg-slate-700",
          textColor: "text-slate-700",
          background: "bg-slate-50",
        },
        {
          title: "Wants",
          percentage: 30,
          amount: result.wants,
          description: "Entertainment, dining out and shopping.",
          color: "bg-emerald-500",
          textColor: "text-emerald-700",
          background: "bg-emerald-50",
        },
        {
          title: "Savings & Debt",
          percentage: 20,
          amount: result.savings,
          description: "Emergency funds, savings goals and debt repayments.",
          color: "bg-teal-700",
          textColor: "text-teal-700",
          background: "bg-teal-50",
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-[#E7F7F2] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
            Budgeting guide
          </span>

          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-[#0C1A33] sm:text-5xl">
            Give every rupee
            <span className="block text-[#0BB079]">
              a clear purpose.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Use the 50/30/20 rule to divide your monthly take-home
            income between essential needs, personal wants and future
            financial goals.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F7F2] text-xl font-bold text-emerald-700">
                ₹
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#0C1A33]">
                  Plan your monthly income
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Start with what you take home each month.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-[#F0FAF6] p-4 sm:p-5">
              <InputField
                label="Monthly take-home income (₹)"
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

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Enter your income after taxes and regular payroll deductions.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-6">
              <Button onClick={handleCalculate}>
                Calculate my budget
              </Button>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Your calculation uses the information entered in this browser.
              This is a budgeting estimate, not financial advice.
            </p>
          </Card>

          <div className="space-y-6">
            <section className="overflow-hidden rounded-2xl bg-[#0C1A33] text-white shadow-lg shadow-slate-900/10">
              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-300">
                    Your income allocation
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    50 / 30 / 20 rule
                  </span>
                </div>

                <p className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {result ? formatCurrency(result.income) : "₹30,000.00"}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {result
                    ? "Here is how your monthly income can be distributed."
                    : "A simple framework to help you plan your money."}
                </p>

                <div
                  className="mt-7 flex h-4 overflow-hidden rounded-full bg-white/10"
                  role="img"
                  aria-label="50 percent needs, 30 percent wants, 20 percent savings and debt"
                >
                  <div className="h-full w-1/2 bg-slate-400" />
                  <div className="h-full w-[30%] bg-[#0BB079]" />
                  <div className="h-full w-1/5 bg-teal-300" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="mb-2 block h-2 w-2 rounded-full bg-slate-400" />
                    <p className="text-slate-300">Needs</p>
                    <p className="mt-1 font-bold text-white">50%</p>
                  </div>
                  <div>
                    <span className="mb-2 block h-2 w-2 rounded-full bg-[#0BB079]" />
                    <p className="text-slate-300">Wants</p>
                    <p className="mt-1 font-bold text-white">30%</p>
                  </div>
                  <div>
                    <span className="mb-2 block h-2 w-2 rounded-full bg-teal-300" />
                    <p className="text-slate-300">Savings</p>
                    <p className="mt-1 font-bold text-white">20%</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-white/[0.04]">
                <div className="p-3 sm:p-4">
                  <p className="text-xs text-slate-400">Needs</p>
                  <p className="mt-2 text-sm font-bold sm:text-base">
                    {formatCurrency(result?.needs ?? 15000)}
                  </p>
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-xs text-slate-400">Wants</p>
                  <p className="mt-2 text-sm font-bold sm:text-base">
                    {formatCurrency(result?.wants ?? 9000)}
                  </p>
                </div>
                <div className="p-3 sm:p-4">
                  <p className="text-xs text-slate-400">Savings</p>
                  <p className="mt-2 text-sm font-bold sm:text-base">
                    {formatCurrency(result?.savings ?? 6000)}
                  </p>
                </div>
              </div>
            </section>

            {result ? (
              <Card>
                <div className="mb-5">
                  <h2 className="text-lg font-bold text-[#0C1A33]">
                    Your recommended budget
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Based on {formatCurrency(result.income)} per month.
                  </p>
                </div>

                <div className="space-y-5">
                  {allocations.map((allocation) => (
                    <div key={allocation.title}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#0C1A33]">
                            {allocation.title}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {allocation.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-bold text-[#0C1A33]">
                            {formatCurrency(allocation.amount)}
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${allocation.textColor}`}>
                            {allocation.percentage}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${allocation.color}`}
                          style={{ width: `${allocation.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-emerald-100 bg-[#F0FAF6] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-600">
                      Total allocated
                    </p>
                    <p className="font-bold text-emerald-800">
                      {formatCurrency(
                        result.needs + result.wants + result.savings
                      )}
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Your full income is assigned across the three categories.
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <h2 className="text-lg font-bold text-[#0C1A33]">
                  How the rule works
                </h2>
                <div className="mt-5 space-y-4">
                  {[
                    {
                      number: "01",
                      title: "50% for needs",
                      description: "Cover essential living costs first.",
                    },
                    {
                      number: "02",
                      title: "30% for wants",
                      description: "Make room for the things you enjoy.",
                    },
                    {
                      number: "03",
                      title: "20% for savings",
                      description: "Build resilience and work toward goals.",
                    },
                  ].map((item) => (
                    <div key={item.number} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] text-sm font-bold text-emerald-800">
                        {item.number}
                      </div>
                      <div>
                        <p className="font-semibold text-[#0C1A33]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-500">
          The 50/30/20 rule is a flexible budgeting guideline, not a strict
          requirement. Adjust the percentages to fit your living costs,
          obligations and personal goals.
        </p>
      </div>
    </main>
  );
}

export default BudgetRuleCalculatorPage;
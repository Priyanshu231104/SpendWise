import { useState } from "react";
import { useGuest } from "../../context/useGuest";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";

const expenseFields = [
  { name: "rent", label: "Rent & housing", placeholder: "e.g. 8000" },
  { name: "food", label: "Food & groceries", placeholder: "e.g. 3500" },
  { name: "transport", label: "Transport", placeholder: "e.g. 1200" },
  { name: "education", label: "Education", placeholder: "e.g. 2000" },
  { name: "entertainment", label: "Entertainment", placeholder: "e.g. 800" },
  { name: "shopping", label: "Shopping", placeholder: "e.g. 1000" },
  { name: "other", label: "Other expenses", placeholder: "e.g. 500" },
];

const initialFormData = {
  income: "",
  rent: "",
  food: "",
  transport: "",
  education: "",
  entertainment: "",
  shopping: "",
  other: "",
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

function BudgetCalculatorPage() {
  const { guestData, saveGuestData } = useGuest();

  const [formData, setFormData] = useState(
    guestData.budget?.formData || initialFormData
  );
  const [result, setResult] = useState(
    guestData.budget?.result || null
  );
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleCalculate = () => {
    const income = Number(formData.income);

    if (
      !formData.income.trim() ||
      !Number.isFinite(income) ||
      income <= 0
    ) {
      setError("Please enter a monthly income greater than ₹0.");
      setResult(null);
      return;
    }

    const expenseValues = expenseFields.map(({ name }) =>
      Number(formData[name] || 0)
    );

    if (
      expenseValues.some(
        (value) => !Number.isFinite(value) || value < 0
      )
    ) {
      setError("Please enter valid, non-negative expense amounts.");
      setResult(null);
      return;
    }

    const totalExpenses = expenseValues.reduce(
      (total, amount) => total + amount,
      0
    );

    const remainingMoney = income - totalExpenses;

    const calculationResult = {
      totalExpenses,
      remainingMoney,
      savings: remainingMoney,
      savingsPercentage: (remainingMoney / income) * 100,
      expensePercentage: (totalExpenses / income) * 100,
    };

    setError("");
    setResult(calculationResult);

    saveGuestData("budget", {
      formData,
      result: calculationResult,
    });
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResult(null);
    setError("");
    saveGuestData("budget", {
      formData: initialFormData,
      result: null,
    });
  };

  const remaining = result?.remainingMoney ?? 0;
  const isOverspending = Boolean(result && remaining < 0);

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Page heading */}
        <header className="mb-8 animate-[fadeUp_500ms_ease-out_both]">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C8EEE1] bg-[#E7F7F2] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#087F5B]">
            <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
            Free financial tool
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#0C1A33] sm:text-4xl">
            Budget calculator
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#64748B] sm:text-base">
            Understand where your money goes. Add your monthly income
            and expenses to see what you have left for your goals.
          </p>
        </header>

        {/* Main calculator layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Input form */}
          <section className="animate-[fadeUp_600ms_ease-out_both]">
            <Card>
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F7F2] text-2xl font-bold text-[#087F5B]">
                  ₹
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#0C1A33]">
                    Your monthly budget
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#64748B]">
                    Enter amounts in Indian rupees.
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-[#C8EEE1] bg-[#F0FBF7] p-4">
                <InputField
                  label="Monthly income"
                  name="income"
                  type="number"
                  value={formData.income}
                  onChange={handleChange}
                  min="0"
                  step="any"
                  placeholder="e.g. 30000"
                  required
                />
                <p className="mt-2 text-xs text-[#64748B]">
                  Include your salary and other regular income.
                </p>
              </div>

              <div className="mb-4">
                <h3 className="font-bold text-[#0C1A33]">
                  Monthly expenses
                </h3>
                <p className="mt-1 text-sm text-[#64748B]">
                  Leave a field empty if it does not apply.
                </p>
              </div>

              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                {expenseFields.map((field) => (
                  <InputField
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    type="number"
                    value={formData[field.name]}
                    onChange={handleChange}
                    min="0"
                    step="any"
                    placeholder={field.placeholder}
                  />
                ))}
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </p>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <div className="flex-1 [&>button]:w-full">
                  <Button onClick={handleCalculate}>
                    Calculate my budget
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-[#475569] transition-colors hover:border-[#0BB079] hover:bg-[#E7F7F2] hover:text-[#087F5B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
                >
                  Reset
                </button>
              </div>

              <p className="mt-4 text-xs leading-5 text-[#64748B]">
                Your entries are used for this calculator's guest
                experience. This is an estimate, not financial advice.
              </p>
            </Card>
          </section>

          {/* Results panel */}
          <aside className="animate-[fadeUp_700ms_ease-out_both] lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_36px_rgba(12,26,51,0.06)]">
              <div className="bg-[#0C1A33] p-6 text-white sm:p-7">
                <p className="text-sm font-medium text-slate-300">
                  {result ? "Your monthly balance" : "Your budget at a glance"}
                </p>

                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {result ? formatCurrency(remaining) : "₹ —"}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {result
                    ? isOverspending
                      ? "Your expenses exceed your income. Review the breakdown below."
                      : "This is what remains after the expenses you entered."
                    : "Enter your income and expenses, then calculate to see your results."}
                </p>

                {result && (
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-300">
                      <span>Income used by expenses</span>
                      <span className="font-semibold text-white">
                        {result.expensePercentage.toFixed(1)}%
                      </span>
                    </div>

                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-white/15"
                      role="progressbar"
                      aria-label="Percentage of income used by expenses"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(
                        100,
                        Math.max(0, result.expensePercentage)
                      )}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isOverspending ? "bg-red-400" : "bg-[#0BB079]"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, result.expensePercentage)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
                    <p className="text-xs font-medium text-[#64748B]">
                      Monthly income
                    </p>
                    <p className="mt-2 break-words text-lg font-bold text-[#0C1A33]">
                      {result
                        ? formatCurrency(Number(formData.income))
                        : "₹ —"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
                    <p className="text-xs font-medium text-[#64748B]">
                      Total expenses
                    </p>
                    <p className="mt-2 break-words text-lg font-bold text-[#0C1A33]">
                      {result
                        ? formatCurrency(result.totalExpenses)
                        : "₹ —"}
                    </p>
                  </div>
                </div>

                {result ? (
                  <>
                    <div
                      className={`rounded-xl border p-4 ${
                        isOverspending
                          ? "border-red-200 bg-red-50"
                          : "border-[#C8EEE1] bg-[#F0FBF7]"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          isOverspending ? "text-red-700" : "text-[#087F5B]"
                        }`}
                      >
                        {isOverspending ? "Amount over budget" : "Available to save"}
                      </p>
                      <p
                        className={`mt-1 break-words text-2xl font-extrabold ${
                          isOverspending ? "text-red-700" : "text-[#087F5B]"
                        }`}
                      >
                        {formatCurrency(Math.abs(remaining))}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#64748B]">
                        {result.savingsPercentage.toFixed(1)}% of your income
                        {isOverspending
                          ? " is the amount your expenses exceed."
                          : " remains after expenses."}
                      </p>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-[#0C1A33]">
                          Expense breakdown
                        </h3>
                        <span className="text-xs text-[#64748B]">
                          By category
                        </span>
                      </div>

                      <div className="space-y-4">
                        {expenseFields
                          .map((field) => ({
                            ...field,
                            amount: Number(formData[field.name] || 0),
                          }))
                          .filter((field) => field.amount > 0)
                          .sort((a, b) => b.amount - a.amount)
                          .map((field) => {
                            const share =
                              result.totalExpenses > 0
                                ? (field.amount / result.totalExpenses) * 100
                                : 0;

                            return (
                              <div key={field.name}>
                                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                                  <span className="truncate text-[#475569]">
                                    {field.label}
                                  </span>
                                  <span className="shrink-0 font-semibold text-[#0C1A33]">
                                    {formatCurrency(field.amount)}
                                  </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-[#0BB079] transition-all duration-500"
                                    style={{ width: `${share}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}

                        {result.totalExpenses === 0 && (
                          <p className="rounded-xl bg-slate-50 p-4 text-sm text-[#64748B]">
                            No expenses entered yet. Add your spending
                            categories to see a breakdown.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7F7F2] text-xl text-[#087F5B]">
                      ↗
                    </div>
                    <h3 className="mt-3 font-bold text-[#0C1A33]">
                      Your results will appear here
                    </h3>
                    <p className="mx-auto mt-1 max-w-xs text-sm leading-6 text-[#64748B]">
                      Calculate your budget to review your spending,
                      remaining balance, and savings percentage.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

export default BudgetCalculatorPage;
import { useState } from "react";
import { useGuest } from "../../context/useGuest";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";

function ExpenseSplitCalculatorPage() {
  const { guestData, saveGuestData } = useGuest();
  const [formData, setFormData] = useState(
    guestData.expenseSplit?.formData || {
      totalExpense: "",
      peopleCount: "",
    }
  );
  
  const [result, setResult] = useState(
    guestData.expenseSplit?.result || null
  );
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    // Clear stale results when the user edits an input.
    setResult(null);
    setError("");
  };

  const handleCalculate = () => {
    const totalExpense = Number(formData.totalExpense);
    const peopleCount = Number(formData.peopleCount);

    if (
      formData.totalExpense.trim() === "" ||
      !Number.isFinite(totalExpense) ||
      totalExpense <= 0
    ) {
      setError("Please enter a total expense greater than zero.");
      setResult(null);
      return;
    }

    if (
      formData.peopleCount.trim() === "" ||
      !Number.isInteger(peopleCount) ||
      peopleCount < 2
    ) {
      setError("Please enter a whole number of at least 2 people.");
      setResult(null);
      return;
    }

    const sharePerPerson = totalExpense / peopleCount;

    setError("");
    
    const calculationResult = {
      totalExpense,
      peopleCount,
      sharePerPerson,
    };
    
    setResult(calculationResult);
    
    saveGuestData("expenseSplit", {
      formData,
      result: calculationResult,
    });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Page introduction */}
        <section className="mb-8">
          <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Shared expenses
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Expense Split Calculator
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Split bills fairly with friends, roommates, or family.
            Enter the total expense and the number of people sharing it.
          </p>
        </section>

        {/* Calculator form */}
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Split your expenses
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Everyone contributes an equal amount.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <InputField
              label="Total Shared Expense"
              name="totalExpense"
              type="number"
              value={formData.totalExpense}
              onChange={handleChange}
              min="0"
              step="any"
              placeholder="e.g. 1500"
              required
            />

            <InputField
              label="Number of People"
              name="peopleCount"
              type="number"
              value={formData.peopleCount}
              onChange={handleChange}
              min="2"
              step="1"
              placeholder="e.g. 3"
              required
            />
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
              Split Expense
            </Button>
          </div>
        </Card>

        {/* Calculation result */}
        {result && (
          <Card className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Your Split Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Here is how much each person contributes.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Total Expense
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatCurrency(result.totalExpense)}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Number of People
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {result.peopleCount}
                </p>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 sm:col-span-2">
                <p className="text-sm font-medium text-indigo-700">
                  Each Person Pays
                </p>

                <p className="mt-2 text-3xl font-bold text-indigo-700">
                  {formatCurrency(result.sharePerPerson)}
                </p>

                <p className="mt-2 text-sm text-indigo-700">
                  {formatCurrency(result.sharePerPerson)} per person
                  × {result.peopleCount} people
                </p>
              </div>
            </div>
          </Card>
        )}

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          This calculator runs in your browser. Your entered expenses
          are not saved to your SpendWise account or database.
        </p>
      </div>
    </main>
  );
}

export default ExpenseSplitCalculatorPage;
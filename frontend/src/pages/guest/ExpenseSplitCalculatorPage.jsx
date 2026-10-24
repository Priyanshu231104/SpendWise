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

    const calculationResult = {
      totalExpense,
      peopleCount,
      sharePerPerson: totalExpense / peopleCount,
    };

    setError("");
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

  const participantIcons = ["A", "B", "C", "D", "E", "F"];

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Page introduction */}
        <section className="mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
            Shared expenses
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0C1A33] sm:text-4xl lg:text-[2.75rem]">
            Split expenses,
            <span className="block text-[#0BB079]">
              not the friendship.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Sharing a bill shouldn't be complicated. Calculate a fair
            contribution for everyone in seconds, whether it's rent,
            groceries, a trip, or dinner with friends.
          </p>
        </section>

        {/* Main calculator layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          {/* Input panel */}
          <Card>
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E7F7F2] text-2xl font-bold text-[#07865F]">
                ₹
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#0C1A33]">
                  Split a bill
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the amount and group size.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-100 bg-[#F0FAF6] p-4 sm:p-5">
                <InputField
                  label="Total shared expense (₹)"
                  name="totalExpense"
                  type="number"
                  value={formData.totalExpense}
                  onChange={handleChange}
                  min="0"
                  step="any"
                  placeholder="e.g. 3000"
                  required
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Enter the full bill amount before splitting it.
                </p>
              </div>

              <InputField
                label="Number of people"
                name="peopleCount"
                type="number"
                value={formData.peopleCount}
                onChange={handleChange}
                min="2"
                step="1"
                placeholder="e.g. 4"
                required
              />

              <p className="-mt-2 text-xs leading-5 text-slate-500">
                A minimum of two people is needed to split an expense.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-7">
              <Button onClick={handleCalculate}>
                Calculate each share
              </Button>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Your calculation uses the information entered in this
              browser. It is not a payment or money-transfer service.
            </p>
          </Card>

          {/* Result / preview panel */}
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl bg-[#0C1A33] shadow-lg shadow-slate-900/10">
              <div className="p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-300">
                    {result ? "Each person contributes" : "Your split preview"}
                  </p>

                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Equal split
                  </span>
                </div>

                <p className="mt-4 break-words text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {result
                    ? formatCurrency(result.sharePerPerson)
                    : "₹ —"}
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {result
                    ? `The total is divided equally among ${result.peopleCount} people.`
                    : "Enter your bill amount and number of people to see each person's share."}
                </p>

                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    People sharing the bill
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    {participantIcons
                      .slice(
                        0,
                        Math.min(
                          6,
                          Math.max(0, Number(formData.peopleCount) || 0)
                        )
                      )
                      .map((person) => (
                        <span
                          key={person}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-bold text-emerald-200"
                        >
                          {person}
                        </span>
                      ))}

                    {Number(formData.peopleCount) > 6 && (
                      <span className="text-xs font-medium text-slate-300">
                        +{Number(formData.peopleCount) - 6} more
                      </span>
                    )}

                    {!formData.peopleCount && (
                      <span className="text-sm text-slate-400">
                        Your group will appear here
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-white/10">
                <div className="bg-white/5 p-5">
                  <p className="text-xs text-slate-400">Total bill</p>
                  <p className="mt-2 break-words text-lg font-bold text-white">
                    {result ? formatCurrency(result.totalExpense) : "₹ —"}
                  </p>
                </div>

                <div className="bg-white/5 p-5">
                  <p className="text-xs text-slate-400">Group size</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {result ? `${result.peopleCount} people` : "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Helpful information */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="font-bold text-[#0C1A33]">
                How the split works
              </h3>

              <div className="mt-4 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] text-sm font-bold text-[#07865F]">
                  1
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Enter the total bill
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Include the expenses you want everyone to share.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] text-sm font-bold text-[#07865F]">
                  2
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Add the number of people
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Count everyone contributing equally.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] text-sm font-bold text-[#07865F]">
                  3
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Calculate each share
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    SpendWise divides the bill by the group size.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <p className="mt-7 text-center text-xs leading-5 text-slate-500">
          This calculator provides an estimate for equal expense sharing.
          Your result is not financial or payment advice.
        </p>
      </div>
    </main>
  );
}

export default ExpenseSplitCalculatorPage;

import { useState } from "react";
import { useGuest } from "../../context/useGuest";
import InputField from "../../components/common/InputField";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";

function BudgetCalculatorPage() {
  const { guestData, saveGuestData } = useGuest();

  const [formData, setFormData] = useState(
    guestData.budget?.formData || {
      income: "",
      rent: "",
      food: "",
      transport: "",
      education: "",
      entertainment: "",
      shopping: "",
      other: "",
    }
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
  
    if (!formData.income || income <= 0) {
      setError("Please enter a monthly income greater than ₹0.");
      setResult(null);
      return;
    }
  
    const totalExpenses =
      Number(formData.rent) +
      Number(formData.food) +
      Number(formData.transport) +
      Number(formData.education) +
      Number(formData.entertainment) +
      Number(formData.shopping) +
      Number(formData.other);
  
    const remainingMoney = income - totalExpenses;
  
    const savingsPercentage = (remainingMoney / income) * 100;
  
    const expensePercentage = (totalExpenses / income) * 100;
  
    setError("");
  
    const calculationResult = {
      totalExpenses,
      remainingMoney,
      savings: remainingMoney,
      savingsPercentage,
      expensePercentage,
    };
    
    setResult(calculationResult);
    
    saveGuestData("budget", {
      formData,
      result: calculationResult,
    });
  };

    return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Budget Calculator
          </h1>
  
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Plan your monthly budget and understand how much you can
            allocate to different spending categories.
          </p>
        </div>
  
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Budget Inputs
            </h2>
  
            <p className="mt-1 text-sm text-slate-500">
              Enter your monthly income and estimated expenses.
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
                placeholder="Enter your monthly income"
                required
              />
            </div>
  
            <InputField
              label="Rent"
              name="rent"
              type="number"
              value={formData.rent}
              onChange={handleChange}
              min="0"
              placeholder="Enter rent"
            />
  
            <InputField
              label="Food"
              name="food"
              type="number"
              value={formData.food}
              onChange={handleChange}
              min="0"
              placeholder="Enter food expenses"
            />
  
            <InputField
              label="Transport"
              name="transport"
              type="number"
              value={formData.transport}
              onChange={handleChange}
              min="0"
              placeholder="Enter transport expenses"
            />
  
            <InputField
              label="Education"
              name="education"
              type="number"
              value={formData.education}
              onChange={handleChange}
              min="0"
              placeholder="Enter education expenses"
            />
  
            <InputField
              label="Entertainment"
              name="entertainment"
              type="number"
              value={formData.entertainment}
              onChange={handleChange}
              min="0"
              placeholder="Enter entertainment expenses"
            />
  
            <InputField
              label="Shopping"
              name="shopping"
              type="number"
              value={formData.shopping}
              onChange={handleChange}
              min="0"
              placeholder="Enter shopping expenses"
            />
  
            <div className="sm:col-span-2">
              <InputField
                label="Other Expenses"
                name="other"
                type="number"
                value={formData.other}
                onChange={handleChange}
                min="0"
                placeholder="Enter other expenses"
              />
            </div>
          </div>
  
          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
  
          <div className="mt-6">
            <Button onClick={handleCalculate}>
              Calculate Budget
            </Button>
          </div>
        </Card>
  
        {result && (
          <Card className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Budget Summary
              </h2>
  
              <p className="mt-1 text-sm text-slate-500">
                Here's how your monthly budget looks.
              </p>
            </div>
  
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Total Expenses
                </p>
  
                <p className="mt-1 text-xl font-bold text-slate-900">
                  ₹{result.totalExpenses.toFixed(2)}
                </p>
              </div>
  
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Remaining Money
                </p>
  
                <p className="mt-1 text-xl font-bold text-slate-900">
                  ₹{result.remainingMoney.toFixed(2)}
                </p>
              </div>
  
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Savings
                </p>
  
                <p className="mt-1 text-xl font-bold text-slate-900">
                  ₹{result.savings.toFixed(2)}
                </p>
              </div>
  
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Savings Percentage
                </p>
  
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {result.savingsPercentage.toFixed(2)}%
                </p>
              </div>
  
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Expense Percentage
                </p>
  
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {result.expensePercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

export default BudgetCalculatorPage;
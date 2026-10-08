import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/guest/LandingPage";
import CalculatorsPage from "../pages/guest/CalculatorsPage";
import BudgetCalculatorPage from "../pages/guest/BudgetCalculatorPage";
import ExpenseSplitCalculatorPage from "../pages/guest/ExpenseSplitCalculatorPage";
import SavingsGoalCalculatorPage from "../pages/guest/SavingsGoalCalculatorPage";
import BudgetRuleCalculatorPage from "../pages/guest/BudgetRuleCalculatorPage";
import MonthlyBudgetPlannerPage from "../pages/guest/MonthlyBudgetPlannerPage";
import FinancialHealthPreviewPage from "../pages/guest/FinancialHealthPreviewPage";
import ProtectedFeaturesPage from "../pages/guest/ProtectedFeaturesPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import GuestLayout from "../layouts/GuestLayout";

function AppRoutes() {
  return (
    <Routes>
      {/* Guest / Public Experience */}
      <Route element={<GuestLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/calculators" element={<CalculatorsPage />} />

        <Route
          path="/features"
          element={<ProtectedFeaturesPage />}
        />
      
        <Route
          path="/calculators/budget"
          element={<BudgetCalculatorPage />}
        />
      
        <Route
          path="/calculators/expense-split"
          element={<ExpenseSplitCalculatorPage />}
        />

        <Route
          path="/calculators/savings-goal"
          element={<SavingsGoalCalculatorPage />}
        />

        <Route
          path="/calculators/budget-rule"
          element={<BudgetRuleCalculatorPage />}
        />

        <Route
          path="/calculators/monthly-planner"
          element={<MonthlyBudgetPlannerPage />}
        />

        <Route
          path="/calculators/financial-health"
          element={<FinancialHealthPreviewPage />}
        />
      
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
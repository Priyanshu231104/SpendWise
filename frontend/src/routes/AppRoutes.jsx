import { Routes, Route } from "react-router-dom";

// Public pages
import LandingPage from "../pages/guest/LandingPage";
import CalculatorsPage from "../pages/guest/CalculatorsPage";
import BudgetCalculatorPage from "../pages/guest/BudgetCalculatorPage";
import ExpenseSplitCalculatorPage from "../pages/guest/ExpenseSplitCalculatorPage";
import SavingsGoalCalculatorPage from "../pages/guest/SavingsGoalCalculatorPage";
import BudgetRuleCalculatorPage from "../pages/guest/BudgetRuleCalculatorPage";
import MonthlyBudgetPlannerPage from "../pages/guest/MonthlyBudgetPlannerPage";
import FinancialHealthPreviewPage from "../pages/guest/FinancialHealthPreviewPage";
import ProtectedFeaturesPage from "../pages/guest/ProtectedFeaturesPage";

// Authentication pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

// Authenticated application pages
import DashboardPage from "../pages/dashboard/DashboardPage";
import ExpensesPage from "../pages/expenses/ExpensesPage";
import IncomePage from "../pages/income/IncomePage";
import BudgetsPage from "../pages/budgets/BudgetsPage";
import CategoriesPage from "../pages/categories/CategoriesPage";
import ProfilePage from "../pages/profile/ProfilePage";
import Reports from "../pages/Reports.jsx";

// Layouts and route protection
import GuestLayout from "../layouts/GuestLayout";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages and authentication */}
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

      {/* Protected pages with authenticated navigation */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/expenses"
            element={<ExpensesPage />}
          />

          <Route
            path="/income"
            element={<IncomePage />}
          />

          <Route
            path="/budgets"
            element={<BudgetsPage />}
          />

          <Route
            path="/categories"
            element={<CategoriesPage />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
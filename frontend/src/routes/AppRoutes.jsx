
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Public pages
const LandingPage = lazy(() => import("../pages/guest/LandingPage"));
const CalculatorsPage = lazy(() => import("../pages/guest/CalculatorsPage"));
const BudgetCalculatorPage = lazy(() => import("../pages/guest/BudgetCalculatorPage"));
const ExpenseSplitCalculatorPage = lazy(() => import("../pages/guest/ExpenseSplitCalculatorPage"));
const SavingsGoalCalculatorPage = lazy(() => import("../pages/guest/SavingsGoalCalculatorPage"));
const BudgetRuleCalculatorPage = lazy(() => import("../pages/guest/BudgetRuleCalculatorPage"));
const MonthlyBudgetPlannerPage = lazy(() => import("../pages/guest/MonthlyBudgetPlannerPage"));
const FinancialHealthPreviewPage = lazy(() => import("../pages/guest/FinancialHealthPreviewPage"));
const ProtectedFeaturesPage = lazy(() => import("../pages/guest/ProtectedFeaturesPage"));

// Authentication pages
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));

// Authenticated application pages
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const ExpensesPage = lazy(() => import("../pages/expenses/ExpensesPage"));
const IncomePage = lazy(() => import("../pages/income/IncomePage"));
const BudgetsPage = lazy(() => import("../pages/budgets/BudgetsPage"));
const CategoriesPage = lazy(() => import("../pages/categories/CategoriesPage"));
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const Reports = lazy(() => import("../pages/Reports.jsx"));

// Layouts and route protection
import GuestLayout from "../layouts/GuestLayout";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";

function RouteLoader() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FA]"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
      <p className="mt-4 text-sm font-medium text-slate-600">
        Loading SpendWise...
      </p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
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
    </Suspense>
  );
}

export default AppRoutes;

import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/useAuth.js";

const navigationItems = [
  { label: "Dashboard", to: "/dashboard", icon: "▦" },
  { label: "Expenses", to: "/expenses", icon: "↗" },
  { label: "Income", to: "/income", icon: "↙" },
  { label: "Budgets", to: "/budgets", icon: "◷" },
  { label: "Categories", to: "/categories", icon: "▤" },
  { label: "Reports", to: "/reports", icon: "▥" },
];

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Unable to log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setIsMenuOpen(false);
    }
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="flex shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="SpendWise dashboard"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-lg font-bold text-white shadow-sm">
              S
            </span>
            <span className="text-xl font-bold tracking-tight">
              Spend<span className="text-indigo-600">Wise</span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClass}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="relative flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-36 truncate text-sm font-semibold">
                {user?.name || "Account"}
              </p>
              <p className="max-w-36 truncate text-xs text-slate-500">
                {user?.email || ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-label="Open account menu"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 transition hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {(user?.name || "U").trim().charAt(0).toUpperCase()}
            </button>

            {isMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close account menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsMenuOpen(false)}
                />

                <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate text-sm font-semibold">
                      {user?.name || "Account"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user?.email || ""}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-1 flex items-center rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Profile & settings
                  </Link>

                  {logoutError && (
                    <p
                      role="alert"
                      className="px-3 py-2 text-sm text-red-600"
                    >
                      {logoutError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingOut ? "Signing out..." : "Log out"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Compact navigation for smaller screens */}
        <nav
          className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden"
          aria-label="Mobile navigation"
        >
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            Profile
          </NavLink>
        </nav>
      </header>

      <main className="min-h-[calc(100vh-120px)]">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
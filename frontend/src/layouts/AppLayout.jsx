
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import SpendWiseLogo from "../components/brand/SpendWiseLogo";
import BrandIntroOverlay from "../components/brand/BrandIntroOverlay";

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
  const [showBrandIntro, setShowBrandIntro] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowBrandIntro(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, []);

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
        ? "bg-[#E7F7F2] text-[#087F5B]"
        : "text-[#475569] hover:bg-slate-50 hover:text-[#0C1A33]"
    }`;

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#0C1A33]">
      {showBrandIntro && <BrandIntroOverlay />}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
            aria-label="SpendWise dashboard"
          >
            <SpendWiseLogo />
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
              <p className="max-w-36 truncate text-sm font-semibold text-[#0C1A33]">
                {user?.name || "Account"}
              </p>
              <p className="max-w-36 truncate text-xs text-[#475569]">
                {user?.email || ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-expanded={isMenuOpen}
              aria-label="Open account menu"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E7F7F2] text-sm font-bold text-[#087F5B] transition hover:bg-[#D0F1E7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
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
                    <p className="truncate text-sm font-semibold text-[#0C1A33]">
                      {user?.name || "Account"}
                    </p>
                    <p className="truncate text-xs text-[#475569]">
                      {user?.email || ""}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="mt-1 flex items-center rounded-xl px-3 py-3 text-sm font-medium text-[#475569] hover:bg-[#F4F7FA] hover:text-[#0C1A33]"
                  >
                    Profile &amp; settings
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
                    ? "bg-[#E7F7F2] text-[#087F5B]"
                    : "text-[#475569] hover:bg-slate-50 hover:text-[#0C1A33]"
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
                  ? "bg-[#E7F7F2] text-[#087F5B]"
                  : "text-[#475569] hover:bg-slate-50 hover:text-[#0C1A33]"
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

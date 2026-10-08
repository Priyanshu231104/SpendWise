import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        {/* SpendWise Brand */}
        <Link
          to="/"
          className="group flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="SpendWise home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            S
          </span>

          <span className="text-xl font-bold tracking-tight text-slate-900">
            Spend<span className="text-indigo-600">Wise</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-3 sm:gap-6">
          <NavLink
            to="/calculators"
            className={({ isActive }) =>
              `hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:inline-flex ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            Calculators
          </NavLink>

          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
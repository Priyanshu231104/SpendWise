
import SpendWiseLogo from "../brand/SpendWiseLogo";
import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          className="group flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
          aria-label="SpendWise home"
        >
          <SpendWiseLogo />
        </Link>

        <div className="flex items-center gap-2 sm:gap-5">
          <NavLink
            to="/calculators"
            className={({ isActive }) =>
              `hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-[#E7F7F2] hover:text-[#087F5B] sm:inline-flex ${
                isActive
                  ? "bg-[#E7F7F2] text-[#087F5B]"
                  : "text-[#475569]"
              }`
            }
          >
            Calculators
          </NavLink>

          <Link
            to="/login"
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0C1A33] transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#0C1A33] bg-[#0C1A33] px-4 py-2.5 text-sm font-bold !text-white shadow-md shadow-[#0C1A33]/15 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#087F5B] hover:bg-[#087F5B] hover:shadow-lg hover:shadow-[#087F5B]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079] focus-visible:ring-offset-2"
          >
            Get Started
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;

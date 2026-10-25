
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import SpendWiseLogo from "../brand/SpendWiseLogo";

function Icon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    calculator: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8v3H8zM8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01" />
      </>
    ),
    login: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    menu: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `group inline-flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079] ${
      isActive
        ? "bg-[#E7F7F2] text-[#087F5B]"
        : "text-[#475569] hover:bg-[#E7F7F2] hover:text-[#087F5B]"
    }`;

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link
          to="/"
          onClick={closeMenu}
          className="flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
          aria-label="SpendWise home"
        >
          <SpendWiseLogo />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/calculators" className={navLinkClass}>
            <Icon name="calculator" className="h-[18px] w-[18px]" />
            <span>Calculators</span>
          </NavLink>
        </div>

        {/* Desktop account actions */}
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0C1A33] transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
          >
            <Icon name="login" className="h-[18px] w-[18px]" />
            Login
          </Link>

          <Link
            to="/register"
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0C1A33] bg-[#0C1A33] px-4 py-2.5 text-sm font-bold !text-white shadow-md shadow-[#0C1A33]/15 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#087F5B] hover:bg-[#087F5B] hover:shadow-lg hover:shadow-[#087F5B]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079] focus-visible:ring-offset-2"
          >
            Get Started
            <Icon
              name="arrow"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Compact actions for small screens */}
        <div className="flex shrink-0 items-center gap-2 sm:hidden">
          <Link
            to="/login"
            onClick={closeMenu}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[#0C1A33] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
          >
            <Icon name="login" className="h-4 w-4" />
            Login
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-guest-navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#0C1A33] transition hover:bg-[#E7F7F2] hover:text-[#087F5B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <div
        id="mobile-guest-navigation"
        className={`grid transition-[grid-template-rows,opacity] duration-200 sm:hidden ${
          menuOpen
            ? "grid-rows-[1fr] border-t border-slate-200/80 opacity-100"
            : "pointer-events-none grid-rows-[0fr] opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="overflow-hidden">
          <div className="mx-auto max-w-7xl space-y-2 px-4 py-3 sm:px-6">
            <NavLink
              to="/calculators"
              onClick={closeMenu}
              className={navLinkClass}
              tabIndex={menuOpen ? 0 : -1}
            >
              <Icon name="calculator" className="h-5 w-5" />
              <span>Financial calculators</span>
              <span className="ml-auto text-xs text-slate-400">Explore</span>
            </NavLink>

            <Link
              to="/register"
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
              className="group flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#0C1A33] bg-[#0C1A33] px-4 py-3 text-sm font-bold !text-white transition-colors hover:border-[#087F5B] hover:bg-[#087F5B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079] focus-visible:ring-offset-2"
            >
              Get Started
              <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

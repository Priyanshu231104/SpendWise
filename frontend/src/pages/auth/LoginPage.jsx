import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import SpendWiseLogo from "../../components/brand/SpendWiseLogo.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      await login({
        email: normalizedEmail,
        password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to log in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden bg-[#F4F7FA] px-4 py-5 sm:px-6 lg:px-8 lg:py-4">
      {/* Soft mint background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-[#0BB079]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-[#0BB079]/[0.07] blur-3xl"
      />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_20px_65px_rgba(12,26,51,0.10)] lg:grid-cols-[0.92fr_1.08fr]">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#0C1A33] p-8 text-white lg:flex xl:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full border border-white/[0.08]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-8 h-64 w-64 rounded-full border border-white/[0.08]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-36 -left-28 h-96 w-96 rounded-full bg-[#0BB079]/10 blur-3xl"
          />

          <Link
            to="/"
            className="relative z-10 inline-flex w-fit rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
            aria-label="SpendWise home"
          >
            <span className="flex items-center gap-3">
                <SpendWiseLogo variant="icon" size={42} />
                <span className="text-[25px] font-extrabold tracking-tight">
                  <span className="text-white">Spend</span>
                  <span className="text-[#0BB079]">Wise</span>
                </span>
            
            </span>
          </Link>

          <div className="relative z-10 my-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium tracking-wide text-emerald-100">
              <span className="h-2 w-2 rounded-full bg-[#0BB079] shadow-[0_0_12px_rgba(11,176,121,0.8)]" />
              YOUR MONEY, MORE MINDFULLY
            </div>

            <h1 className="max-w-lg text-3xl font-bold leading-[1.12] tracking-tight xl:text-4xl">
              Make every
              <span className="block text-[#55E0B0]">rupee count.</span>
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 xl:text-base xl:leading-7">
              Understand your spending, build better habits, and make
              confident decisions about your financial future.
            </p>

            {/* Decorative finance preview */}
            <div className="mt-7 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur-sm xl:mt-8 xl:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-300 xl:text-sm">
                    Your next step
                  </p>
                  <p className="mt-1 text-base font-semibold xl:text-lg">
                    Build a saving habit
                  </p>
                </div>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0BB079]/15 text-[#55E0B0] xl:h-10 xl:w-10">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 16l5-5 4 3 7-8M14 6h6v6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>

              <div
                className="mt-4 flex h-14 items-end gap-2 xl:mt-5 xl:h-16"
                aria-hidden="true"
              >
                {[28, 43, 35, 58, 48, 70, 56, 86, 66, 100, 78, 92].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-[#087F5B] to-[#55E0B0] opacity-80 transition-opacity duration-300 hover:opacity-100"
                      style={{ height: `${height}%` }}
                    />
                  ),
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300 xl:text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#55E0B0]" />
                Small steps can make a difference.
              </div>
            </div>
          </div>

          <p className="relative z-10 text-[11px] text-slate-400">
            Clarity today. Confidence tomorrow.
          </p>
        </aside>

        {/* Login form */}
        <div className="flex items-center justify-center px-5 py-7 sm:px-10 sm:py-10 lg:px-9 lg:py-7 xl:px-12">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
              <Link
                to="/"
                className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
                aria-label="SpendWise home"
              >
                <SpendWiseLogo />
              </Link>

              <Link
                to="/"
                className="text-sm font-medium text-[#475569] transition hover:text-[#087F5B]"
              >
                Back to home
              </Link>
            </div>

            <div className="mb-6 lg:mb-5">
              <p className="text-sm font-semibold tracking-wide text-[#087F5B]">
                WELCOME BACK
              </p>

              <h2 className="mt-2.5 text-3xl font-bold tracking-tight text-[#0C1A33] sm:text-4xl lg:text-3xl">
                Sign in to your account
              </h2>

              <p className="mt-2.5 text-sm leading-6 text-[#475569]">
                Pick up where you left off and keep your finances on track.
              </p>
            </div>

            {/* Sign-in / registration navigation */}
            <div className="mb-6 grid grid-cols-2 rounded-xl border border-slate-200 bg-[#F4F7FA] p-1 lg:mb-5">
              <div
                className="rounded-lg bg-white px-3 py-2.5 text-center text-sm font-semibold text-[#0C1A33] shadow-sm ring-1 ring-slate-200/70"
                aria-current="page"
              >
                Sign in
              </div>

              <Link
                to="/register"
                className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-[#475569] transition duration-200 hover:bg-white hover:text-[#087F5B]"
              >
                Create account
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-3.5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-semibold text-[#0C1A33]"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0C1A33] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0BB079] focus:ring-4 focus:ring-[#0BB079]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-semibold text-[#0C1A33]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-[#0C1A33] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0BB079] focus:ring-4 focus:ring-[#0BB079]/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-sm font-semibold text-[#087F5B] transition hover:bg-[#E7F7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0BB079] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,176,121,0.20)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#079866] hover:shadow-[0_12px_25px_rgba(11,176,121,0.25)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0BB079]/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {isLoading ? "Signing in..." : "Sign in"}

                {!isLoading && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#475569]">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-[#087F5B] underline decoration-transparent underline-offset-4 transition hover:decoration-current"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              SpendWise helps you organize your finances with clarity.
            </p>
          </div>
        </div>
      </div>

      {/* Login-only wordmark colors: white Spend + green Wise */}
      <style>{`
        .login-brand-logo > span > span {
          color: #ffffff !important;
        }

        .login-brand-logo > span > span > span {
          color: #0BB079 !important;
        }
      `}</style>
    </section>
  );
}

export default LoginPage;
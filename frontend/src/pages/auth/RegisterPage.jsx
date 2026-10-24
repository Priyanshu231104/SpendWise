import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth.js";
import SpendWiseLogo from "../../components/brand/SpendWiseLogo";

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setError("Name must be between 2 and 100 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: normalizedName,
        email: normalizedEmail,
        password,
      });

      navigate("/login", {
        replace: true,
        state: { message: "Account created successfully. Please sign in." },
      });
    } catch (err) {
      setError(err.message || "Unable to create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#0C1A33] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#0BB079] focus:ring-4 focus:ring-[#0BB079]/10";

  return (
    <section className="relative flex min-h-[calc(100vh-73px)] items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#E7F7F2_0%,_#F4F7FA_48%,_#EAF1F8_100%)] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#0BB079]/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(12,26,51,0.12)] md:grid-cols-[0.88fr_1fr]">
        {/* Branding panel */}
        <aside className="relative hidden overflow-hidden bg-[#0C1A33] text-white md:flex md:flex-col md:justify-between md:p-7 lg:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -right-8 -top-12 h-64 w-64 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#0BB079]/10 blur-3xl" />

          <div className="relative z-10">
            <Link
              to="/"
              aria-label="SpendWise home"
              className="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
            >
              <span className="flex items-center gap-3">
                <SpendWiseLogo variant="icon" size={42} />
                <span className="text-[25px] font-extrabold tracking-tight">
                  <span className="text-white">Spend</span>
                  <span className="text-[#0BB079]">Wise</span>
                </span>
              </span>
            </Link>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[10px] font-bold tracking-wide text-emerald-100 lg:text-[11px]">
              <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
              YOUR MONEY, MORE MINDFULLY
            </div>

            <h1 className="mt-7 text-3xl font-extrabold leading-[1.13] tracking-tight lg:text-[40px]">
              A smarter way to
              <span className="mt-1 block text-[#35D6A5]">
                manage your money.
              </span>
            </h1>

            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300 lg:text-[15px]">
              Track spending, plan your budget, and build better financial
              habits one step at a time.
            </p>
          </div>

          {/* Decorative demo card; contains no real financial data */}
          <div className="relative z-10 mt-7 rounded-[18px] border border-white/10 bg-white/[0.055] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-300">Your next step</p>
                <p className="mt-1.5 text-base font-bold text-white">
                  Build a saving habit
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0BB079]/15 text-[#35D6A5]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M4 16l6-6 4 3 6-7M14 6h6v6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div
              className="mt-5 flex h-[76px] items-end gap-2"
              aria-hidden="true"
            >
              {[34, 49, 42, 61, 53, 72, 62, 85, 69, 94, 76, 88].map(
                (height, index) => (
                  <div
                    key={index}
                    className="min-w-0 flex-1 rounded-t-md bg-gradient-to-t from-[#087F5B] to-[#35D6A5]"
                    style={{ height: `${height}%` }}
                  />
                ),
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#35D6A5]" />
              Small steps can make a difference.
            </div>
          </div>

          <p className="relative z-10 mt-6 text-[11px] text-slate-400">
            Your financial journey starts here.
          </p>
        </aside>

        {/* Registration form */}
        <div className="bg-white px-5 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-8">
          {/* Mobile-only branding */}
          <div className="mb-6 flex items-center justify-between md:hidden">
            <Link
              to="/"
              aria-label="SpendWise home"
              className="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
            >
              <span className="flex items-center gap-2.5">
                <SpendWiseLogo variant="icon" size={36} />
                <span className="text-xl font-extrabold tracking-tight">
                  <span className="text-[#0C1A33]">Spend</span>
                  <span className="text-[#0BB079]">Wise</span>
                </span>
              </span>
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[420px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#087F5B]">
              Get started for free
            </p>

            <h2 className="mt-2 text-[27px] font-extrabold leading-tight tracking-tight text-[#0C1A33] sm:text-3xl">
              Create your account
            </h2>

            <p className="mt-2 text-sm leading-5 text-[#475569]">
              Start building better financial habits with SpendWise.
            </p>

            {/* Navigation between the existing auth routes */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-[#F4F7FA] p-1">
              <Link
                to="/login"
                className="flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-semibold text-[#475569] transition hover:bg-white hover:text-[#0C1A33]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                aria-current="page"
                className="flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-[#0C1A33] shadow-sm"
              >
                Create account
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              <div>
                <label
                  htmlFor="register-name"
                  className="mb-1.5 block text-sm font-semibold text-[#0C1A33]"
                >
                  Full name
                </label>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="mb-1.5 block text-sm font-semibold text-[#0C1A33]"
                >
                  Email address
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="mb-1.5 block text-sm font-semibold text-[#0C1A33]"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className={`${inputClass} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 rounded-md px-1 text-sm font-semibold text-[#087F5B] transition hover:text-[#0BB079] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-controls="register-password"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-confirm-password"
                  className="mb-1.5 block text-sm font-semibold text-[#0C1A33]"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    className={`${inputClass} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute inset-y-0 right-3 rounded-md px-1 text-sm font-semibold text-[#087F5B] transition hover:text-[#0BB079] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079]"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    aria-controls="register-confirm-password"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0BB079] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,176,121,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#099967] hover:shadow-[0_12px_25px_rgba(11,176,121,0.25)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0BB079]/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isLoading ? "Creating account..." : "Create account"}
                {!isLoading && (
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-[#475569]">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-[#0C1A33] underline decoration-[#0BB079]/50 underline-offset-4 transition hover:text-[#087F5B]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RegisterPage;
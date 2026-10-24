
import { Link } from "react-router-dom";

const features = [
  {
    number: "01",
    title: "Track every expense",
    description:
      "Understand where your money goes with an organized view of your daily spending.",
    icon: "↗",
  },
  {
    number: "02",
    title: "Build smarter budgets",
    description:
      "Set spending limits, monitor your progress, and make more intentional decisions.",
    icon: "◎",
  },
  {
    number: "03",
    title: "Grow your savings",
    description:
      "Set savings goals and build habits that move you closer to financial freedom.",
    icon: "↗",
  },
];

const demoExpenses = [
  {
    name: "Groceries",
    category: "Food & essentials",
    amount: 2450,
    color: "#0BB079",
  },
  {
    name: "Transportation",
    category: "Travel",
    amount: 1200,
    color: "#64748B",
  },
  {
    name: "Subscriptions",
    category: "Lifestyle",
    amount: 899,
    color: "#F0B45B",
  },
];

const steps = [
  {
    number: "1",
    title: "Get a clear picture",
    description:
      "Start by understanding your income, expenses, and spending habits.",
  },
  {
    number: "2",
    title: "Plan with purpose",
    description:
      "Set a budget and decide what matters most to your financial goals.",
  },
  {
    number: "3",
    title: "Review and improve",
    description:
      "Use your financial overview to spot patterns and make informed changes.",
  },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-[#0C1A33]">
      {/* Hero */}
      <section className="relative isolate">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-32 -z-10 h-[420px] w-[420px] rounded-full bg-[#E7F7F2] blur-3xl sm:h-[600px] sm:w-[600px]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-80 w-80 rounded-full bg-[#F4F7FA] blur-3xl"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:pb-28 lg:pt-24">
          {/* Hero content */}
          <div className="max-w-2xl">
            <div className="sw-hero-enter mb-6 inline-flex items-center gap-2 rounded-full border border-[#D6F0E7] bg-[#F2FBF7] px-3.5 py-2 text-xs font-semibold text-[#087F5B] sm:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0BB079] opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0BB079]" />
              </span>
              A clearer way to manage money
            </div>

            <h1 className="sw-hero-enter-delay-1 text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              Your money.
              <br />
              Your goals.
              <br />
              <span className="relative inline-block text-[#0BB079]">
                Your future.
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 h-1 w-0 rounded-full bg-[#0BB079]/30 motion-safe:animate-[sw-underline_900ms_900ms_ease-out_forwards]"
                />
              </span>
            </h1>

            <p className="sw-hero-enter-delay-2 mt-6 max-w-lg text-base leading-7 text-[#64748B] sm:text-lg sm:leading-8">
              Take control of your finances with a simpler way to track
              expenses, plan budgets, and make every rupee count.
            </p>

            <div className="sw-hero-enter-delay-2 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="sw-cta-hover inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0BB079] px-6 py-3 text-sm font-semibold !text-white shadow-lg shadow-emerald-900/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0BB079]/30"
              >
                Get started for free
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>

              <Link
                to="/calculators"
                className="sw-cta-hover inline-flex min-h-12 items-center justify-center rounded-xl border border-[#DCE3EA] bg-white px-6 py-3 text-sm font-semibold text-[#0C1A33] hover:border-[#0BB079] hover:bg-[#F7FCF9] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0BB079]/20"
              >
                Explore free tools
              </Link>
            </div>

            <div className="sw-hero-enter-delay-2 mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#64748B]">
              <span className="flex items-center gap-2">
                <span className="font-bold text-[#0BB079]">✓</span>
                Easy to get started
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-[#0BB079]">✓</span>
                Free financial tools
              </span>
            </div>
          </div>

          {/* Illustrative dashboard preview */}
          <div className="sw-dashboard-enter relative mx-auto w-full max-w-xl lg:ml-auto">
            <div
              aria-hidden="true"
              className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-[#E7F7F2] via-white to-[#F4F7FA] blur-xl"
            />

            <div className="sw-dashboard-float overflow-hidden rounded-2xl border border-[#E5EBF0] bg-white shadow-2xl shadow-[#0C1A33]/10 sm:rounded-3xl">
              <div className="flex items-center justify-between border-b border-[#EDF1F5] px-4 py-4 sm:px-6">
                <div>
                  <p className="text-sm font-bold">Financial overview</p>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Your money at a glance
                  </p>
                </div>

                <span className="rounded-lg bg-[#F4F7FA] px-3 py-2 text-xs font-medium text-[#475569]">
                  Demo preview
                </span>
              </div>

              <div className="p-4 sm:p-6">
                {/* Spending overview */}
                <div className="rounded-2xl bg-[#0C1A33] p-5 text-white sm:p-6">
                  <p className="text-sm text-white/65">
                    Monthly spending overview
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    {formatCurrency(12500)}
                  </p>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/60">
                        Illustrative budget
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatCurrency(20000)}
                      </p>
                    </div>

                    <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-[#A7F3D0]">
                      62.5% used
                    </span>
                  </div>

                  <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-white/15"
                    role="img"
                    aria-label="Illustrative budget progress: 62.5 percent used"
                  >
                    <div className="sw-progress-animate h-full rounded-full bg-[#0BB079]" />
                  </div>
                </div>

                {/* Summary cards */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="sw-interactive-card rounded-xl border border-[#E8EDF2] p-4">
                    <p className="text-xs text-[#64748B]">
                      Illustrative income
                    </p>
                    <p className="mt-2 text-lg font-bold sm:text-xl">
                      {formatCurrency(30000)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#0BB079]">
                      Monthly example
                    </p>
                  </div>

                  <div className="sw-interactive-card rounded-xl border border-[#E8EDF2] p-4">
                    <p className="text-xs text-[#64748B]">
                      Budget remaining
                    </p>
                    <p className="mt-2 text-lg font-bold sm:text-xl">
                      {formatCurrency(7500)}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Illustrative balance
                    </p>
                  </div>
                </div>

                {/* Recent expenses */}
                <div className="mt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold">Recent expenses</h2>
                    <span className="text-xs text-[#94A3B8]">Sample data</span>
                  </div>

                  <div className="space-y-4">
                    {demoExpenses.map((expense, index) => (
                      <div
                        key={expense.name}
                        className="sw-expense-enter flex items-center justify-between gap-3"
                        style={{ animationDelay: `${900 + index * 140}ms` }}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="h-10 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: expense.color }}
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {expense.name}
                            </p>
                            <p className="mt-1 text-xs text-[#94A3B8]">
                              {expense.category}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-sm font-semibold">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-3 text-center text-xs text-[#94A3B8]">
              Illustrative figures only — not actual account data.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F4F7FA] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="sw-hero-enter mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0BB079]">
              Everything in one place
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Make better money decisions, every day.
            </h2>

            <p className="mt-4 leading-7 text-[#64748B]">
              Less guesswork. More clarity. Tools that help you understand
              your finances and plan what comes next.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="sw-card-reveal sw-interactive-card rounded-2xl border border-[#E6EBF0] bg-white p-6 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7F7F2] text-xl font-bold text-[#0BB079] transition-transform duration-300 group-hover:scale-110">
                    {feature.icon}
                  </span>

                  <span className="text-sm font-semibold text-[#CBD5E1]">
                    {feature.number}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold">{feature.title}</h3>

                <p className="mt-3 leading-7 text-[#64748B]">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>

          <div className="sw-hero-enter-delay-1 mt-8 text-center">
            <Link
              to="/features"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[#087F5B] transition-colors hover:text-[#065F46]"
            >
              Discover SpendWise features
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div className="sw-hero-enter">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0BB079]">
              Simple by design
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              A healthier relationship with money starts here.
            </h2>

            <p className="mt-5 leading-7 text-[#64748B]">
              You don't need to be a finance expert to understand your money.
              Start with the basics and build your financial habits over time.
            </p>

            <Link
              to="/register"
              className="sw-cta-hover mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#0C1A33] bg-[#0C1A33] px-5 py-3 text-sm font-semibold !text-white shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079] focus-visible:ring-offset-2"
            >
              Create your account
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="sw-card-reveal sw-interactive-card flex gap-4 rounded-2xl border border-[#E6EBF0] bg-white p-5 sm:p-6"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F7F2] font-bold text-[#087F5B]">
                  {step.number}
                </span>

                <div>
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#64748B]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free tools CTA */}
      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12">
        <div className="sw-hero-enter relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-[#0C1A33] px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-[#0BB079]/20 blur-3xl"
          />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#83E4C2]">
                Start without signing up
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Small steps today. Smarter finances tomorrow.
              </h2>

              <p className="mt-4 leading-7 text-white/70">
                Try our free financial calculators to plan a budget, split
                expenses, estimate savings, and explore your options.
              </p>
            </div>

            <Link
              to="/calculators"
              className="sw-cta-hover inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0BB079] px-6 py-3 text-sm font-semibold !text-white hover:bg-[#099768] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#83E4C2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C1A33]"
            >
              Explore calculators
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8EDF2] bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight"
            aria-label="SpendWise home"
          >
            Spend<span className="text-[#0BB079]">Wise</span>
          </Link>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#64748B]"
          >
            <Link
              className="transition-colors hover:text-[#0BB079]"
              to="/calculators"
            >
              Calculators
            </Link>

            <Link
              className="transition-colors hover:text-[#0BB079]"
              to="/features"
            >
              Features
            </Link>

            <Link
              className="transition-colors hover:text-[#0BB079]"
              to="/login"
            >
              Log in
            </Link>

            <Link
              className="transition-colors hover:text-[#0BB079]"
              to="/register"
            >
              Sign up
            </Link>
          </nav>

          <p className="text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} SpendWise
          </p>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;

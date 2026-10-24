import { Link } from "react-router-dom";

const calculators = [
  {
    id: "budget",
    icon: "₹",
    title: "Budget Calculator",
    description:
      "Plan your monthly income and expenses to understand where your money goes.",
    category: "BUDGETING",
    path: "/calculators/budget",
    available: true,
  },
  {
    id: "expense-split",
    icon: "↗",
    title: "Expense Split Calculator",
    description:
      "Split shared expenses fairly among friends, roommates, or family members.",
    category: "SHARED EXPENSES",
    path: "/calculators/expense-split",
    available: true,
  },
  {
    id: "savings-goal",
    icon: "◎",
    title: "Savings Goal Calculator",
    description:
      "Discover how much you need to save each month to reach your financial goals.",
    category: "SAVINGS",
    path: "/calculators/savings-goal",
    available: true,
  },
  {
    id: "budget-rule",
    icon: "%",
    title: "50/30/20 Budget Calculator",
    description:
      "Divide your income into needs, wants, and savings using the 50/30/20 rule.",
    category: "BUDGETING",
    path: "/calculators/budget-rule",
    available: true,
  },
  {
    id: "monthly-planner",
    icon: "▦",
    title: "Monthly Budget Planner",
    description:
      "Organize your expected monthly spending across important expense categories.",
    category: "PLANNING",
    path: "/calculators/monthly-planner",
    available: true,
  },
  {
    id: "financial-health",
    icon: "↗",
    title: "Financial Health Preview",
    description:
      "Get a simple overview of your spending and savings habits using your inputs.",
    category: "FINANCIAL WELLNESS",
    path: "/calculators/financial-health",
    available: true,
  },
];

function CalculatorsPage() {
  const availableCount = calculators.filter(
    (calculator) => calculator.available
  ).length;

  return (
    <main className="sw-calculators-page min-h-screen overflow-hidden bg-[#F4F7FA] text-[#0C1A33]">
      {/* Decorative background */}
      <div className="pointer-events-none absolute left-0 right-0 top-[130px] -z-0 h-80 overflow-hidden">
        <div className="sw-calculator-glow absolute -right-20 -top-32 h-80 w-80 rounded-full bg-[#D9F5EA]/70 blur-3xl" />
        <div className="sw-calculator-glow sw-calculator-glow-delay absolute left-[15%] top-20 h-52 w-52 rounded-full bg-white/80 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-12 lg:pt-20">
        {/* Hero */}
        <section className="sw-calc-reveal relative mb-14 max-w-3xl sm:mb-16">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#CDEFE1] bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#087F5B] shadow-sm sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-[#0BB079] shadow-[0_0_0_4px_rgba(11,176,121,0.12)]" />
            Free financial tools
          </span>

          <h1 className="sw-calc-reveal-delay-1 text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
            Make smarter decisions
            <span className="mt-1 block text-[#0BB079]">
              with your money.
            </span>
          </h1>

          <p className="sw-calc-reveal-delay-2 mt-5 max-w-2xl text-base leading-7 text-[#64748B] sm:mt-6 sm:text-lg sm:leading-8">
            Explore simple tools to plan your budget, manage everyday
            expenses, and work towards your savings goals. No account is
            required to use our available calculators.
          </p>

          <div className="sw-calc-reveal-delay-2 mt-7 flex flex-wrap items-center gap-3 text-sm text-[#475569]">
            <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-[#E2E8F0]">
              <span className="font-bold text-[#0BB079]">✓</span>
              Free to use
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-[#E2E8F0]">
              <span className="font-bold text-[#0BB079]">✓</span>
              No account required
            </span>
          </div>
        </section>

        {/* Section heading */}
        <section aria-labelledby="calculator-list-heading">
          <div className="sw-calc-reveal mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="calculator-list-heading"
                className="text-2xl font-bold tracking-tight sm:text-3xl"
              >
                Explore calculators
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#64748B] sm:text-base">
                Practical tools for everyday financial decisions.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#DCE8E3] bg-white px-4 py-2 text-sm font-medium text-[#475569] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
              {availableCount} available
              <span className="text-[#CBD5E1]">·</span>
              {calculators.length - availableCount} coming soon
            </span>
          </div>

          {/* Calculator cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {calculators.map((calculator, index) => {
              const cardContent = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="sw-calculator-icon flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D8F1E7] bg-[#E7F7F2] text-2xl font-bold text-[#087F5B]">
                      {calculator.icon}
                    </div>

                    {calculator.available ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F7F2] px-3 py-1.5 text-xs font-semibold text-[#087F5B]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0BB079]" />
                        Available
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#F1F5F9] px-3 py-1.5 text-xs font-semibold text-[#64748B]">
                        Coming soon
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#0B9870]">
                      {calculator.category}
                    </p>

                    <h3 className="mt-2 text-lg font-bold leading-snug text-[#0C1A33] sm:text-xl">
                      {calculator.title}
                    </h3>

                    <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-[#64748B]">
                      {calculator.description}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-[#EDF1F5] pt-5">
                    <span
                      className={`text-sm font-semibold ${
                        calculator.available
                          ? "text-[#087F5B]"
                          : "text-[#94A3B8]"
                      }`}
                    >
                      {calculator.available
                        ? "Open calculator"
                        : "Under development"}
                    </span>

                    <span
                      aria-hidden="true"
                      className={`sw-calculator-arrow text-lg ${
                        calculator.available
                          ? "text-[#0BB079]"
                          : "text-[#CBD5E1]"
                      }`}
                    >
                      →
                    </span>
                  </div>
                </>
              );

              const cardClasses =
                "sw-calculator-card group flex min-h-[330px] flex-col rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_3px_12px_rgba(12,26,51,0.025)] sm:p-6";

              return calculator.available ? (
                <Link
                  key={calculator.id}
                  to={calculator.path}
                  style={{ "--card-index": index }}
                  className={`${cardClasses} sw-calculator-card-active focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0BB079] focus-visible:ring-offset-4`}
                >
                  {cardContent}
                </Link>
              ) : (
                <article
                  key={calculator.id}
                  style={{ "--card-index": index }}
                  aria-label={`${calculator.title}, coming soon`}
                  className={cardClasses}
                >
                  {cardContent}
                </article>
              );
            })}
          </div>
        </section>

        {/* Guest CTA */}
        <section className="sw-calc-reveal relative mt-12 overflow-hidden rounded-3xl bg-[#0C1A33] p-6 text-white shadow-xl shadow-[#0C1A33]/10 sm:mt-16 sm:p-9 lg:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-[#0BB079]/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 left-1/3 h-52 w-52 rounded-full bg-[#0BB079]/10 blur-3xl"
          />

          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#83E4C2]">
                <span aria-hidden="true">✦</span>
                Your next step starts here
              </span>

              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Start with what you need today.
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/70 sm:text-base">
                Use a calculator without creating an account. When you're
                ready for persistent expense tracking and personalized
                financial insights, create your SpendWise account.
              </p>
            </div>

            <Link
              to="/register"
              className="sw-calculator-cta inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-[#0BB079] px-5 py-3 text-sm font-bold !text-white shadow-lg shadow-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#83E4C2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C1A33]"
            >
              Get started for free
              <span aria-hidden="true" className="text-lg">→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default CalculatorsPage;
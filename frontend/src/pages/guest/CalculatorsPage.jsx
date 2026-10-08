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
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        {/* Page introduction */}
        <section className="mb-10 max-w-3xl sm:mb-12">
          <span className="mb-4 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-700">
            Free financial tools
          </span>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Make smarter decisions
            <span className="block text-indigo-600">
              with your money.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Explore simple tools to plan your budget, manage everyday
            expenses, and work towards your savings goals. No account
            is required to use our available calculators.
          </p>
        </section>

        {/* Availability summary */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Explore calculators
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Practical tools for everyday financial decisions.
            </p>
          </div>

          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
            6 available · 0 coming soon
          </span>
        </div>

        {/* Calculator cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {calculators.map((calculator) => {
            const cardContent = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl font-bold text-indigo-700 transition-colors duration-200 group-hover:bg-indigo-100">
                    {calculator.icon}
                  </div>

                  {calculator.available ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Available
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      Coming soon
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    {calculator.category}
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-slate-900">
                    {calculator.title}
                  </h3>

                  <p className="mt-2 min-h-[4.5rem] text-sm leading-6 text-slate-600">
                    {calculator.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span
                    className={`text-sm font-semibold ${
                      calculator.available
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    {calculator.available
                      ? "Open calculator"
                      : "Under development"}
                  </span>

                  <span
                    aria-hidden="true"
                    className={`text-lg transition-transform duration-200 ${
                      calculator.available
                        ? "text-indigo-600 group-hover:translate-x-1"
                        : "text-slate-300"
                    }`}
                  >
                    →
                  </span>
                </div>
              </>
            );

            const cardClasses =
              "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200";

            return calculator.available ? (
              <Link
                key={calculator.id}
                to={calculator.path}
                className={`${cardClasses} hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
              >
                {cardContent}
              </Link>
            ) : (
              <article
                key={calculator.id}
                aria-label={`${calculator.title}, coming soon`}
                className={`${cardClasses} cursor-default`}
              >
                {cardContent}
              </article>
            );
          })}
        </div>

        {/* Guest experience note */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:mt-12 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Start with what you need today.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Use the available calculator without creating an account.
                When you're ready for persistent expense tracking and
                personalized financial insights, you can create a
                SpendWise account.
              </p>
            </div>

            <Link
              to="/register"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Get Started
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default CalculatorsPage;
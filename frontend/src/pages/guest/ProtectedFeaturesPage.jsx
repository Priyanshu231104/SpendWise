import { Link } from "react-router-dom";

const protectedFeatures = [
  {
    title: "Expense Tracking",
    description:
      "Track daily expenses, organize transactions, and understand where your money goes.",
    icon: "₹",
    number: "01",
  },
  {
    title: "Budget Management",
    description:
      "Create personalized budgets and monitor your spending throughout the month.",
    icon: "▤",
    number: "02",
  },
  {
    title: "Financial Dashboard",
    description:
      "See your income, expenses, savings, and financial activity in one place.",
    icon: "◫",
    number: "03",
  },
  {
    title: "Reports & Analytics",
    description:
      "Discover financial patterns with reports and meaningful spending insights.",
    icon: "↗",
    number: "04",
  },
  {
    title: "Financial Goals",
    description:
      "Set savings goals and follow your progress toward the things that matter.",
    icon: "◎",
    number: "05",
  },
  {
    title: "Recurring Transactions",
    description:
      "Keep track of regular income and expenses without entering them manually each time.",
    icon: "↻",
    number: "06",
  },
];

function ProtectedFeaturesPage() {
  return (
    <main className="min-h-screen bg-[#F4F7FA] text-[#0C1A33]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#E7F7F2] opacity-80 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-[#F0F5FA] blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#BDEDDD] bg-[#E7F7F2] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#087F5B]">
            <span className="h-2 w-2 rounded-full bg-[#0BB079]" />
            Your money, more organized
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            More clarity.
            <span className="mt-2 block text-[#0BB079]">
              Better money habits.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#475569] sm:text-lg">
            Take control of your finances with tools designed to help you track
            spending, plan budgets, and understand your financial progress — all
            in one place.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl
                         border border-[#0C1A33] bg-[#0C1A33] px-7 py-3
                         text-base font-semibold !text-white
                         shadow-lg shadow-slate-900/10
                         transition-all duration-200
                         hover:border-[#0BB079] hover:bg-[#0BB079]
                         focus-visible:outline-none focus-visible:ring-4
                         focus-visible:ring-emerald-200"
            >
              Create your free account
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              to="/calculators"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-[#0C1A33] transition duration-200 hover:-translate-y-0.5 hover:border-[#0BB079] hover:bg-[#E7F7F2] focus:outline-none focus:ring-4 focus:ring-[#0BB079]/20"
            >
              Explore free calculators
              <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <p className="mt-5 text-sm text-[#64748B]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#087F5B] underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>

          <div className="mx-auto mt-12 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-[#0C1A33] shadow-sm">
                ◇
              </span>
              <div>
                <h2 className="font-bold text-[#0C1A33]">Explore as a guest</h2>
                <p className="mt-1 text-sm leading-6 text-[#64748B]">
                  Use free calculators without signing up.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-[#BDEDDD] bg-[#EFFBF6] p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-[#0BB079] shadow-sm">
                ✦
              </span>
              <div>
                <h2 className="font-bold text-[#0C1A33]">Unlock your account</h2>
                <p className="mt-1 text-sm leading-6 text-[#475569]">
                  Save your progress and manage your finances in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protected features */}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#0BB079]">
                Everything in one place
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Built for better financial decisions
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-[#64748B]">
                Create a free account to access the complete SpendWise
                experience.
              </p>
            </div>

            <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#475569]">
              6 account features
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {protectedFeatures.map((feature) => (
              <article
                key={feature.title}
                className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#A7E8D5] hover:shadow-xl hover:shadow-slate-900/5 sm:p-7"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F7F2] text-2xl font-bold text-[#087F5B] transition group-hover:bg-[#0BB079] group-hover:text-white">
                    {feature.icon}
                  </span>
                  <span className="text-sm font-semibold tracking-wider text-slate-300">
                    {feature.number}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-[#0C1A33]">
                  {feature.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-7 text-[#64748B]">
                  {feature.description}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[#475569]">
                    <span className="text-[#0BB079]">✦</span>
                    Account feature
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#0BB079]"
                  >
                    →
                  </span>
                </div>
              </article>
            ))}
          </div>

          {/* Final call to action */}
          <section className="relative mt-14 overflow-hidden rounded-3xl bg-[#0C1A33] px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[28px] border-white/[0.05]" />
            <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-[#0BB079]/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5DE2B2]">
                  Start today
                </p>

                <h2 className="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                  A clearer picture of your money starts here.
                </h2>

                <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                  Create your free account and bring your financial activity
                  together with SpendWise.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  to="/register"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0BB079] px-6 py-3 text-sm font-bold !text-[#062B23] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#32D49A] focus:outline-none focus:ring-4 focus:ring-[#5DE2B2]/40"
                >
                  Get started free
                  <span aria-hidden="true">→</span>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 bg-white px-6 py-3 text-sm font-bold !text-[#0C1A33] transition hover:-translate-y-0.5 hover:bg-[#E7F7F2] focus:outline-none focus:ring-4 focus:ring-white/30"
                >
                  Log in
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

export default ProtectedFeaturesPage;
import AuthRequiredCard from "../../components/guest/AuthRequiredCard";

function ProtectedFeaturesPage() {
  const protectedFeatures = [
    {
      title: "Expense Tracking",
      description:
        "Track your daily expenses, organize transactions, and understand where your money goes.",
      icon: "₹",
    },
    {
      title: "Budget Management",
      description:
        "Create and manage personalized budgets and monitor your progress throughout the month.",
      icon: "▣",
    },
    {
      title: "Financial Dashboard",
      description:
        "Get a complete overview of your income, expenses, savings, and financial activity.",
      icon: "◫",
    },
    {
      title: "Reports & Analytics",
      description:
        "Understand your financial patterns through reports and meaningful spending insights.",
      icon: "↗",
    },
    {
      title: "Financial Goals",
      description:
        "Create savings goals and track your progress toward the things that matter to you.",
      icon: "◎",
    },
    {
      title: "Recurring Transactions",
      description:
        "Manage recurring expenses and income so you don't have to track them manually every time.",
      icon: "↻",
    },
  ];

  return (
    <section className="min-h-[calc(100vh-73px)] bg-slate-50 px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-indigo-600">
            SpendWise
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Unlock the Full SpendWise Experience
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600">
            Calculators are available without an account. Create a free
            account to save your financial data and unlock the complete
            SpendWise experience.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {protectedFeatures.map((feature) => (
            <AuthRequiredCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProtectedFeaturesPage;
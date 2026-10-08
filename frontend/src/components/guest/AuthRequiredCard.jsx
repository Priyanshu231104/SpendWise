import { Link } from "react-router-dom";

function AuthRequiredCard({
  title,
  description,
  icon = "🔒",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        {icon}
      </div>

      <h2 className="mt-5 text-xl font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/register"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Create Free Account
        </Link>

        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors duration-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
        >
          Already have an account?
        </Link>
      </div>
    </div>
  );
}

export default AuthRequiredCard;
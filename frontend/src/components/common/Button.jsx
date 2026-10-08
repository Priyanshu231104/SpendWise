function Button({
  children,
  type = "button",
  onClick,
  disabled = false,
  variant = "primary",
}) {
  const variantClasses = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline:
      "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
}

export default Button;
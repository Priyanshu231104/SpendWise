function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  min,
  step = "any",
  required = false,
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={name}
        className="text-sm font-medium text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        required={required}
        className="
          w-full
          rounded-lg
          border
          border-slate-300
          bg-white
          px-4
          py-2.5
          text-sm
          text-slate-900
          outline-none
          transition
          duration-200
          placeholder:text-slate-400
          hover:border-slate-400
          focus:border-slate-900
          focus:ring-2
          focus:ring-slate-900/10
        "
      />
    </div>
  );
}

export default InputField;
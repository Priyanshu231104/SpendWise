
import { useCallback, useEffect, useState } from "react";
import { getReportsData } from "../services/reportsApi.js";

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPresetRange(preset) {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  if (preset === "thisWeek") {
    const day = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - day);
  } else if (preset === "thisMonth") {
    start.setDate(1);
  } else if (preset === "lastMonth") {
    start.setDate(1);
    start.setMonth(start.getMonth() - 1);
    end.setDate(0);
  } else if (preset === "thisYear") {
    start.setMonth(0, 1);
  }

  return {
    from: toDateInputValue(start),
    to: toDateInputValue(end),
  };
}

function formatMoney(amountMinor, currency = "INR") {
  const amount = Number(amountMinor ?? 0) / 100;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatCompactMoney(amountMinor, currency = "INR") {
  const amount = Number(amountMinor ?? 0) / 100;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatMoney(amountMinor, currency);
  }
}

function formatMonth(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "2-digit",
  });
}

function Card({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-6 ${className}`}
    >
      {(title || action) && (
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function EmptyState({
  message = "No data available for this period.",
}) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M4 19V5m0 14h16M8 15l4-4 3 2 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
      <p className="mt-1 text-xs text-slate-400">
        Try another date range or add a transaction.
      </p>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function TrendChart({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const rows = data.slice(-12);

  const currencies = [...new Set(rows.map((item) => item.currency))];

  if (!rows.length) {
    return <EmptyState />;
  }

  if (currencies.length > 1) {
    return (
      <div className="space-y-5">
        {currencies.map((currency) => (
          <div key={currency} className="rounded-2xl bg-slate-50 p-4">
            <p className="mb-4 text-sm font-bold text-slate-800">{currency}</p>
            <TrendChart
              data={rows.filter((item) => item.currency === currency)}
            />
          </div>
        ))}
      </div>
    );
  }

  const width = 700;
  const height = 270;
  const left = 68;
  const right = 18;
  const top = 20;
  const bottom = 42;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const maxValue = Math.max(
    1,
    ...rows.flatMap((item) => [
      Number(item.totalIncomeMinor) || 0,
      Number(item.totalExpensesMinor) || 0,
    ]),
  );

  const niceMax = maxValue * 1.12;
  const x = (index) =>
    left + (rows.length === 1 ? plotWidth / 2 : (index / (rows.length - 1)) * plotWidth);
  const y = (value) => top + plotHeight - (value / niceMax) * plotHeight;

  const incomePoints = rows.map((item, index) => ({
    x: x(index),
    y: y(Number(item.totalIncomeMinor) || 0),
  }));

  const expensePoints = rows.map((item, index) => ({
    x: x(index),
    y: y(Number(item.totalExpensesMinor) || 0),
  }));

  const linePath = (points) =>
    points
      .map((point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
      )
      .join(" ");

  const areaPath = (points) =>
    `${linePath(points)} L ${points[points.length - 1].x} ${top + plotHeight} L ${points[0].x} ${top + plotHeight} Z`;

  const active = activeIndex === null ? null : rows[activeIndex];

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-4">
          <LegendItem color="#0BB079" label="Income" />
          <LegendItem color="#F16B7B" label="Expenses" />
        </div>
        {active && (
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {formatMonth(active.year, active.month)}
          </span>
        )}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label="Monthly income and expenses line chart"
        >
          <defs>
            <linearGradient id="incomeAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0BB079" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0BB079" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="expenseAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F16B7B" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#F16B7B" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((step) => {
            const value = (niceMax * step) / 4;
            const yy = y(value);

            return (
              <g key={step}>
                <line
                  x1={left}
                  y1={yy}
                  x2={width - right}
                  y2={yy}
                  stroke="#E9EEF3"
                  strokeDasharray={step === 0 ? "0" : "4 5"}
                />
                <text
                  x={left - 10}
                  y={yy + 4}
                  fontSize="11"
                  textAnchor="end"
                  fill="#94A3B8"
                >
                  {formatCompactMoney(value, rows[0].currency)}
                </text>
              </g>
            );
          })}

          <path d={areaPath(incomePoints)} fill="url(#incomeAreaGradient)" />
          <path d={areaPath(expensePoints)} fill="url(#expenseAreaGradient)" />

          <path
            d={linePath(incomePoints)}
            fill="none"
            stroke="#0BB079"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={linePath(expensePoints)}
            fill="none"
            stroke="#F16B7B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {rows.map((item, index) => (
            <g key={`${item.year}-${item.month}-${item.currency}`}>
              {activeIndex === index && (
                <line
                  x1={x(index)}
                  y1={top}
                  x2={x(index)}
                  y2={top + plotHeight}
                  stroke="#CBD5E1"
                  strokeDasharray="4 4"
                />
              )}
              <circle
                cx={x(index)}
                cy={incomePoints[index].y}
                r={activeIndex === index ? 5 : 3.5}
                fill="#0BB079"
                stroke="white"
                strokeWidth="2"
              />
              <circle
                cx={x(index)}
                cy={expensePoints[index].y}
                r={activeIndex === index ? 5 : 3.5}
                fill="#F16B7B"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={x(index)}
                y={height - 13}
                textAnchor="middle"
                fontSize={rows.length > 8 ? "10" : "11"}
                fill={activeIndex === index ? "#0F172A" : "#94A3B8"}
                fontWeight={activeIndex === index ? "700" : "500"}
              >
                {formatMonth(item.year, item.month)}
              </text>
              <rect
                x={x(index) - Math.max(12, plotWidth / rows.length / 2)}
                y={top}
                width={Math.max(24, plotWidth / rows.length)}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                role="button"
                tabIndex="0"
                aria-label={`${formatMonth(item.year, item.month)}: income ${formatMoney(item.totalIncomeMinor, item.currency)}, expenses ${formatMoney(item.totalExpensesMinor, item.currency)}`}
              />
            </g>
          ))}
        </svg>
      </div>

      {active && (
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Income</p>
            <p className="mt-1 break-words text-sm font-bold text-emerald-700">
              {formatMoney(active.totalIncomeMinor, active.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Expenses</p>
            <p className="mt-1 break-words text-sm font-bold text-rose-600">
              {formatMoney(active.totalExpensesMinor, active.currency)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryDonut({ data }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!data.length) {
    return <EmptyState />;
  }

  const totalsByCurrency = new Map();

  data.forEach((item) => {
    const currency = item.currency || "INR";
    totalsByCurrency.set(
      currency,
      (totalsByCurrency.get(currency) || 0) +
        Math.max(0, Number(item.totalSpentMinor) || 0),
    );
  });

  const currencies = [...totalsByCurrency.keys()];

  if (currencies.length > 1) {
    return (
      <div className="space-y-6">
        {currencies.map((currency) => (
          <div key={currency}>
            <p className="mb-3 text-sm font-bold text-slate-800">{currency}</p>
            <CategoryDonut
              data={data.filter((item) => item.currency === currency)}
            />
          </div>
        ))}
      </div>
    );
  }

  const total = totalsByCurrency.get(currencies[0]) || 0;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  const segments = data
    .filter((item) => Number(item.totalSpentMinor) > 0)
    .slice(0, 10)
    .map((item, index) => {
      const value = Number(item.totalSpentMinor) || 0;
      const length = total > 0 ? (value / total) * circumference : 0;
      const segment = {
        ...item,
        value,
        index,
        length,
        offset: accumulated,
        color: item.color || [
          "#0BB079",
          "#4263EB",
          "#F59E0B",
          "#E879F9",
          "#F16B7B",
          "#14B8A6",
          "#64748B",
          "#8B5CF6",
          "#84CC16",
          "#06B6D4",
        ][index % 10],
      };
      accumulated += length;
      return segment;
    });

  const selected = segments[selectedIndex] || segments[0];

  if (!segments.length) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 items-center gap-7 sm:grid-cols-2">
      <div className="relative mx-auto w-full max-w-56">
        <svg
          viewBox="0 0 180 180"
          className="h-auto w-full"
          role="img"
          aria-label="Spending distribution by category"
        >
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="20"
          />
          {segments.map((segment) => (
            <circle
              key={`${segment.currency}-${segment.categoryId ?? segment.categoryName}-${segment.index}`}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={selected?.index === segment.index ? "24" : "19"}
              strokeDasharray={`${Math.max(0, segment.length - 1)} ${circumference}`}
              strokeDashoffset={-segment.offset}
              transform="rotate(-90 90 90)"
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => setSelectedIndex(segment.index)}
              onFocus={() => setSelectedIndex(segment.index)}
              onClick={() => setSelectedIndex(segment.index)}
              tabIndex="0"
              role="button"
              aria-label={`${segment.categoryName}: ${formatMoney(segment.value, segment.currency)}`}
            />
          ))}
          <text
            x="90"
            y="83"
            textAnchor="middle"
            fontSize="10"
            fill="#64748B"
          >
            Total spent
          </text>
          <text
            x="90"
            y="103"
            textAnchor="middle"
            fontSize={total / 100 >= 100000 ? "13" : "16"}
            fontWeight="800"
            fill="#0F172A"
          >
            {formatCompactMoney(total, currencies[0])}
          </text>
        </svg>
      </div>

      <div className="min-w-0 space-y-1">
        {segments.map((segment) => (
          <button
            key={`${segment.currency}-${segment.categoryId ?? segment.categoryName}-${segment.index}`}
            type="button"
            onMouseEnter={() => setSelectedIndex(segment.index)}
            onFocus={() => setSelectedIndex(segment.index)}
            onClick={() => setSelectedIndex(segment.index)}
            className={`flex w-full items-center justify-between gap-3 rounded-xl p-2.5 text-left transition ${
              selected?.index === segment.index
                ? "bg-slate-50"
                : "hover:bg-slate-50"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-sm font-medium text-slate-700">
                {segment.categoryName}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-bold text-slate-800">
                {((segment.value / Math.max(1, total)) * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400">
                {formatCompactMoney(segment.value, segment.currency)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SavingsTrend({ data }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const rows = data.slice(-12);

  if (!rows.length) {
    return <EmptyState />;
  }

  const currencies = [...new Set(rows.map((item) => item.currency))];

  if (currencies.length > 1) {
    return (
      <div className="space-y-5">
        {currencies.map((currency) => (
          <div key={currency}>
            <p className="mb-3 text-sm font-bold text-slate-800">{currency}</p>
            <SavingsTrend
              data={rows.filter((item) => item.currency === currency)}
            />
          </div>
        ))}
      </div>
    );
  }

  const width = 700;
  const height = 230;
  const left = 68;
  const right = 18;
  const top = 20;
  const bottom = 38;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const values = rows.map((item) => Number(item.netSavingsMinor) || 0);
  const maxAbs = Math.max(1, ...values.map(Math.abs));
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(0, ...values);
  const spread = Math.max(1, maxValue - minValue);
  const y = (value) =>
    top + ((maxValue - value + spread * 0.08) / (spread * 1.16)) * plotHeight;
  const zeroY = y(0);
  const x = (index) =>
    left +
    (rows.length === 1 ? plotWidth / 2 : (index / (rows.length - 1)) * plotWidth);

  const points = rows.map((item, index) => ({
    x: x(index),
    y: y(Number(item.netSavingsMinor) || 0),
  }));

  const path = points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
    )
    .join(" ");

  const active = activeIndex === null ? null : rows[activeIndex];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <LegendItem color="#0BB079" label="Positive savings" />
        <LegendItem color="#F16B7B" label="Negative savings" />
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Monthly net savings trend"
      >
        <defs>
          <linearGradient id="savingsAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0BB079" stopOpacity="0.23" />
            <stop offset="100%" stopColor="#0BB079" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <line
          x1={left}
          y1={zeroY}
          x2={width - right}
          y2={zeroY}
          stroke="#CBD5E1"
          strokeDasharray="5 4"
        />

        <text x={left - 10} y={top + 4} textAnchor="end" fontSize="11" fill="#94A3B8">
          {formatCompactMoney(maxValue, rows[0].currency)}
        </text>
        <text x={left - 10} y={height - bottom + 3} textAnchor="end" fontSize="11" fill="#94A3B8">
          {formatCompactMoney(minValue, rows[0].currency)}
        </text>

        <path
          d={`${path} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`}
          fill="url(#savingsAreaGradient)"
        />
        <path
          d={path}
          fill="none"
          stroke="#0BB079"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {rows.map((item, index) => (
          <g key={`${item.year}-${item.month}-${item.currency}`}>
            {activeIndex === index && (
              <line
                x1={x(index)}
                y1={top}
                x2={x(index)}
                y2={height - bottom}
                stroke="#CBD5E1"
                strokeDasharray="4 4"
              />
            )}
            <circle
              cx={x(index)}
              cy={points[index].y}
              r={activeIndex === index ? 5 : 3.5}
              fill={Number(item.netSavingsMinor) >= 0 ? "#0BB079" : "#F16B7B"}
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={x(index)}
              y={height - 12}
              textAnchor="middle"
              fontSize={rows.length > 8 ? "10" : "11"}
              fill="#94A3B8"
            >
              {formatMonth(item.year, item.month)}
            </text>
            <rect
              x={x(index) - Math.max(12, plotWidth / rows.length / 2)}
              y={top}
              width={Math.max(24, plotWidth / rows.length)}
              height={height - top - bottom}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              role="button"
              tabIndex="0"
              aria-label={`${formatMonth(item.year, item.month)} net savings: ${formatMoney(item.netSavingsMinor, item.currency)}`}
            />
          </g>
        ))}
      </svg>

      {active && (
        <div className="mt-3 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">
            {formatMonth(active.year, active.month)} · Net savings
          </p>
          <p
            className={`mt-1 text-lg font-extrabold ${
              Number(active.netSavingsMinor) >= 0
                ? "text-emerald-700"
                : "text-rose-600"
            }`}
          >
            {Number(active.netSavingsMinor) > 0 ? "+" : ""}
            {formatMoney(active.netSavingsMinor, active.currency)}
          </p>
        </div>
      )}
    </div>
  );
}

function BudgetPerformance({ data }) {
  if (!data.length) {
    return <EmptyState message="No budgets overlap this date range." />;
  }

  return (
    <div className="space-y-4">
      {data.map((budget) => {
        const overBudget = budget.status === "OVER_BUDGET";
        const percentage = Math.max(0, Number(budget.percentageUsed) || 0);

        return (
          <div
            key={budget.budgetId}
            className="rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:bg-slate-50/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-800">{budget.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Budget {formatMoney(budget.amountMinor, budget.currency)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  overBudget
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {overBudget ? "Over budget" : "Within budget"}
              </span>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  overBudget ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-slate-500">
                {percentage.toFixed(1)}% used
              </span>
              <span className="text-right font-semibold text-slate-700">
                Remaining {formatMoney(budget.remainingMinor, budget.currency)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyDistribution({ data }) {
  if (!data.length) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data.map((month) => (
        <div
          key={`${month.year}-${month.month}-${month.currency}`}
          className="rounded-2xl border border-slate-100 p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800">
                {formatMonth(month.year, month.month)}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Spending breakdown
              </p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {month.currency}
            </span>
          </div>

          <p className="mb-5 break-words text-2xl font-extrabold tracking-tight text-slate-900">
            {formatMoney(month.totalExpensesMinor, month.currency)}
          </p>

          {month.categories.length === 0 ? (
            <p className="text-sm text-slate-500">No category details available.</p>
          ) : (
            <div className="space-y-4">
              {month.categories.slice(0, 6).map((category) => (
                <div
                  key={category.categoryId ?? category.name}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex min-w-0 items-center gap-2 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: category.color || "#0BB079",
                        }}
                      />
                      <span className="truncate">{category.name}</span>
                    </span>
                    <span className="shrink-0 font-bold text-slate-800">
                      {Number(category.percentage || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(category.percentage) || 0))}%`,
                        backgroundColor: category.color || "#0BB079",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [preset, setPreset] = useState("thisMonth");
  const [range, setRange] = useState(() => getPresetRange("thisMonth"));
  const [draftRange, setDraftRange] = useState(() =>
    getPresetRange("thisMonth"),
  );
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (selectedRange) => {
    setLoading(true);
    setError("");

    try {
      const result = await getReportsData(selectedRange);
      setReports(result);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to load your financial reports.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    getReportsData(range)
      .then((result) => {
        if (cancelled) return;
        setReports(result);
        setError("");
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(
          requestError.message || "Unable to load your financial reports.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const presets = [
    { value: "today", label: "Today" },
    { value: "thisWeek", label: "This week" },
    { value: "thisMonth", label: "This month" },
    { value: "lastMonth", label: "Last month" },
    { value: "thisYear", label: "This year" },
  ];

  function selectPreset(value) {
    const nextRange = getPresetRange(value);
    setError("");
    setPreset(value);
    setRange(nextRange);
    setDraftRange(nextRange);
  }

  function applyCustomRange(event) {
    event.preventDefault();

    if (!draftRange.from || !draftRange.to) {
      setError("Please select both start and end dates.");
      return;
    }

    if (draftRange.from > draftRange.to) {
      setError("The start date must be before or equal to the end date.");
      return;
    }

    setError("");
    setPreset("custom");
    setRange({ ...draftRange });
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="relative overflow-hidden rounded-3xl bg-[#0C1A33] p-6 text-white shadow-xl shadow-slate-900/10 sm:p-8 lg:p-9">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-[38px] border-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-emerald-400/[0.08] blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Your money, in perspective
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Reports & Analytics
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Turn your transactions into insights. Understand your spending,
                track your savings, and make more confident financial decisions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadReports(range)}
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#0C1A33] shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {loading ? "Refreshing..." : "Refresh reports"}
            </button>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-5 text-xs text-slate-300">
            <span className="rounded-lg bg-white/[0.07] px-3 py-2">
              From <strong className="ml-1 text-white">{range.from}</strong>
            </span>
            <span className="rounded-lg bg-white/[0.07] px-3 py-2">
              To <strong className="ml-1 text-white">{range.to}</strong>
            </span>
            <span className="rounded-lg bg-white/[0.07] px-3 py-2">
              Period{" "}
              <strong className="ml-1 text-emerald-300">
                {presets.find((item) => item.value === preset)?.label || "Custom"}
              </strong>
            </span>
          </div>
        </header>

        <Card
          title="Choose your reporting period"
          subtitle="Explore your financial activity over any date range."
        >
          <div className="flex flex-wrap gap-2">
            {presets.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => selectPreset(item.value)}
                aria-pressed={preset === item.value}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  preset === item.value
                    ? "bg-[#0C1A33] text-white shadow-md shadow-slate-900/10"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={applyCustomRange}
            className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                From date
              </span>
              <input
                type="date"
                value={draftRange.from}
                max={draftRange.to || undefined}
                onChange={(event) =>
                  setDraftRange((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                To date
              </span>
              <input
                type="date"
                value={draftRange.to}
                min={draftRange.from || undefined}
                onChange={(event) =>
                  setDraftRange((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                required
              />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
            >
              Apply range
            </button>
          </form>
        </Card>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                !
              </span>
              <div>
                <p className="font-semibold">We couldn't load your reports</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadReports(range)}
              className="shrink-0 rounded-lg px-3 py-2 font-bold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {loading && !reports ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-white p-5"
              >
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="mt-5 h-8 w-40 rounded bg-slate-200" />
                <div className="mt-5 h-3 w-24 rounded bg-slate-100" />
              </div>
            ))}
            <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Preparing your financial insights…
            </div>
          </div>
        ) : reports ? (
          <>
            
            <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
              <Card
                title="Income vs. expenses"
                subtitle="Compare how money comes in and goes out each month."
                className="xl:col-span-3"
              >
                <TrendChart data={reports.monthlyTrends ?? []} />
              </Card>

              <Card
                title="Spending by category"
                subtitle="Discover which categories take the largest share."
                className="xl:col-span-2"
              >
                <CategoryDonut data={reports.categoryBreakdown ?? []} />
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card
                title="Savings trend"
                subtitle="See your net savings rise and fall over time."
              >
                <SavingsTrend data={reports.savingsTrend ?? []} />
              </Card>

              <Card
                title="Budget performance"
                subtitle="Keep track of spending against your planned limits."
              >
                <BudgetPerformance data={reports.budgetPerformance ?? []} />
              </Card>
            </section>

            <Card
              title="Monthly spending distribution"
              subtitle="Explore the categories contributing to your monthly expenses."
            >
              <MonthlyDistribution data={reports.spendingDistribution ?? []} />
            </Card>
          </>
        ) : (
          <EmptyState message="Your reports could not be displayed. Please refresh to try again." />
        )}

        <footer className="pb-2 pt-1 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Your reports are calculated from your SpendWise transactions and budgets.
          </div>
        </footer>
      </div>
    </main>
  );
}

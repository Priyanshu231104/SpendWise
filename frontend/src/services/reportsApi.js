
import { apiRequest } from "./api.js";

const buildDateQuery = ({ from, to }) => {
  const params = new URLSearchParams({ from, to });
  return `?${params.toString()}`;
};

export const getFinancialSummary = (range) =>
  apiRequest(`/reports/summary${buildDateQuery(range)}`);

export const getCategoryBreakdown = (range) =>
  apiRequest(`/reports/category-breakdown${buildDateQuery(range)}`);

export const getBudgetPerformance = (range) =>
  apiRequest(`/reports/budget-performance${buildDateQuery(range)}`);

export const getMonthlyTrends = (range) =>
  apiRequest(`/analytics/monthly-trends${buildDateQuery(range)}`);

export const getSpendingDistribution = (range) =>
  apiRequest(`/analytics/spending-distribution${buildDateQuery(range)}`);

export const getSavingsTrend = (range) =>
  apiRequest(`/analytics/savings-trend${buildDateQuery(range)}`);

export const getReportsData = async (range) => {
  const [
    summary,
    categoryBreakdown,
    budgetPerformance,
    monthlyTrends,
    spendingDistribution,
    savingsTrend,
  ] = await Promise.all([
    getFinancialSummary(range),
    getCategoryBreakdown(range),
    getBudgetPerformance(range),
    getMonthlyTrends(range),
    getSpendingDistribution(range),
    getSavingsTrend(range),
  ]);

  return {
    summary: summary.data,
    categoryBreakdown: categoryBreakdown.data,
    budgetPerformance: budgetPerformance.data,
    monthlyTrends: monthlyTrends.data,
    spendingDistribution: spendingDistribution.data,
    savingsTrend: savingsTrend.data,
  };
};

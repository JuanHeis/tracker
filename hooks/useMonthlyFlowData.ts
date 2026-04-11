import { useMemo } from "react";
import { computeWaterfallData } from "@/lib/projection/waterfall";
import type { WaterfallBar } from "@/lib/projection/waterfall";
import type { Expense, ExtraIncome, Investment } from "@/hooks/useMoneyTracker";
import type { ViewMode } from "@/hooks/usePayPeriod";

export function useMonthlyFlowData(
  expenses: Expense[],
  investments: Investment[],
  salaryAmount: number,
  extraIncomes: ExtraIncome[],
  selectedMonth: string,
  viewMode: ViewMode,
  payDay: number,
): WaterfallBar[] {
  return useMemo(
    () =>
      computeWaterfallData({
        expenses,
        investments,
        salaryAmount,
        extraIncomes,
        selectedMonth,
        viewMode,
        payDay,
      }),
    [expenses, investments, salaryAmount, extraIncomes, selectedMonth, viewMode, payDay]
  );
}

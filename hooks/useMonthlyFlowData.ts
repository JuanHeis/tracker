import { useMemo } from "react";
import { computeWaterfallData } from "@/lib/projection/waterfall";
import type { WaterfallBar } from "@/lib/projection/waterfall";
import type { Expense, ExtraIncome, Investment, Transfer } from "@/hooks/useMoneyTracker";
import type { ViewMode } from "@/hooks/usePayPeriod";

export function useMonthlyFlowData(
  expenses: Expense[],
  investments: Investment[],
  salaryAmount: number,
  extraIncomes: ExtraIncome[],
  transfers: Transfer[],
  selectedMonth: string,
  viewMode: ViewMode,
  payDay: number,
  savingsEstimate: number,
): WaterfallBar[] {
  return useMemo(
    () =>
      computeWaterfallData({
        expenses,
        investments,
        salaryAmount,
        extraIncomes,
        transfers,
        selectedMonth,
        viewMode,
        payDay,
        savingsEstimate,
      }),
    [expenses, investments, salaryAmount, extraIncomes, transfers, selectedMonth, viewMode, payDay, savingsEstimate]
  );
}

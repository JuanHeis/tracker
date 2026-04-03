import type { RecurringExpense } from "@/hooks/useRecurringExpenses";
import { CurrencyType } from "@/constants/investments";

/**
 * Flat-line income projection: repeats current salary for N months.
 * Returns array of length horizonMonths + 1 (index 0 = current month).
 */
export function projectIncome(
  currentSalary: number,
  horizonMonths: number
): number[] {
  return Array.from({ length: horizonMonths + 1 }, () => currentSalary);
}

/**
 * Estimate monthly net savings by subtracting active recurring expenses from salary.
 * USD expenses are converted to ARS using globalUsdRate. Never returns negative.
 */
export function estimateMonthlyNetSavings(
  currentSalary: number,
  activeRecurringExpenses: RecurringExpense[],
  globalUsdRate: number
): number {
  const totalRecurring = activeRecurringExpenses
    .filter((r) => r.status === "Activa")
    .reduce((sum, r) => {
      if (r.currencyType === CurrencyType.USD) {
        return sum + r.amount * globalUsdRate;
      }
      return sum + r.amount;
    }, 0);

  return Math.max(0, currentSalary - totalRecurring);
}

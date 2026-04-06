import { CurrencyType } from "@/constants/investments";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";

// ── Types ──────────────────────────────────────────────────────────────

export interface SimulatedExpense {
  id: string;
  name: string;
  totalAmount: number;
  installments: number; // 1 = one-time, N = N monthly installments
  currencyType: CurrencyType;
}

export interface SimulatorDataPoint {
  month: string; // Display label: "Ene 26"
  monthKey: string; // "2026-04"
  sinSimulacion: number;
  conSimulacion: number;
}

export interface SimulatorSummary {
  totalCost: number; // Sum of all expenses in ARS
  maxMonthlyImpact: number; // Largest single-month deduction
  worstBalance: number; // Min value in simulated projection (excl month 0)
}

// ── Helpers ────────────────────────────────────────────────────────────

function toArs(amount: number, currency: CurrencyType, usdRate: number): number {
  return currency === CurrencyType.USD ? amount * usdRate : amount;
}

// ── Core functions ─────────────────────────────────────────────────────

/**
 * Apply simulated expenses to a base projection array.
 * Month 0 (current patrimony) is never modified.
 * Each installment payment is cumulative: once an installment hits month M,
 * its per-month amount is subtracted from months M through end.
 */
export function applySimulatedExpenses(
  baseProjection: number[],
  expenses: SimulatedExpense[],
  globalUsdRate: number
): number[] {
  const result = [...baseProjection];

  for (const expense of expenses) {
    const amountArs = toArs(expense.totalAmount, expense.currencyType, globalUsdRate);
    const perMonth = amountArs / expense.installments;

    for (let i = 0; i < expense.installments; i++) {
      const monthIndex = i + 1; // start from month 1
      if (monthIndex >= result.length) break;

      // Cumulative: subtract from this month through end
      for (let m = monthIndex; m < result.length; m++) {
        result[m] -= perMonth;
      }
    }
  }

  return result;
}

/**
 * Compute summary metrics from simulated expenses and the resulting projection.
 */
export function computeSimulatorSummary(
  expenses: SimulatedExpense[],
  simulatedProjection: number[],
  globalUsdRate: number
): SimulatorSummary {
  // totalCost: sum of all expenses converted to ARS
  const totalCost = expenses.reduce(
    (sum, e) => sum + toArs(e.totalAmount, e.currencyType, globalUsdRate),
    0
  );

  // maxMonthlyImpact: for each month, sum all installment payments hitting that month
  // then take the max
  const monthlyPayments = new Array(simulatedProjection.length).fill(0);
  for (const expense of expenses) {
    const amountArs = toArs(expense.totalAmount, expense.currencyType, globalUsdRate);
    const perMonth = amountArs / expense.installments;
    for (let i = 0; i < expense.installments; i++) {
      const monthIndex = i + 1;
      if (monthIndex < simulatedProjection.length) {
        monthlyPayments[monthIndex] += perMonth;
      }
    }
  }
  const maxMonthlyImpact = Math.max(0, ...monthlyPayments);

  // worstBalance: minimum value excluding month 0
  const worstBalance =
    simulatedProjection.length > 1
      ? Math.min(...simulatedProjection.slice(1))
      : 0;

  return { totalCost, maxMonthlyImpact, worstBalance };
}

/**
 * Build chart-ready data points pairing base and simulated projections.
 */
export function buildSimulatorData(
  baseProjection: number[],
  simulatedProjection: number[],
  horizonMonths: number
): SimulatorDataPoint[] {
  const now = new Date();
  const data: SimulatorDataPoint[] = [];

  for (let m = 0; m <= horizonMonths; m++) {
    const date = addMonths(now, m);
    const label = format(date, "MMM yy", { locale: es });
    // Capitalize first letter
    const month = label.charAt(0).toUpperCase() + label.slice(1);
    const monthKey = format(date, "yyyy-MM");

    data.push({
      month,
      monthKey,
      sinSimulacion: baseProjection[m] ?? 0,
      conSimulacion: simulatedProjection[m] ?? 0,
    });
  }

  return data;
}

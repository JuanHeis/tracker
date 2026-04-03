import type { Investment } from "@/hooks/useMoneyTracker";
import type { InvestmentProjection } from "./types";
import { DEFAULT_ANNUAL_RATES } from "./types";

/**
 * Convert TNA (Tasa Nominal Anual) percentage to monthly effective rate.
 * Argentine Plazo Fijo compounds daily; this approximates monthly.
 */
export function pfMonthlyRate(tnaPercent: number): number {
  return Math.pow(1 + tnaPercent / 100 / 365, 30) - 1;
}

/**
 * Get default monthly rate for an investment type.
 * For Plazo Fijo returns 0 — caller must use pfMonthlyRate with investment.tna.
 */
export function getDefaultMonthlyRate(
  type: Investment["type"],
  rateMultiplier: number = 1
): number {
  const annualRate = DEFAULT_ANNUAL_RATES[type];
  if (annualRate === 0) return 0; // PF: caller uses pfMonthlyRate
  return (annualRate * rateMultiplier) / 12;
}

/**
 * Project an investment forward using compound interest with optional monthly contributions.
 */
export function projectInvestment(
  investment: Investment,
  monthlyRate: number,
  horizonMonths: number,
  includeContributions: boolean
): InvestmentProjection {
  const currentValue = investment.currentValue;

  // Determine monthly contribution
  let monthlyContribution = 0;
  if (includeContributions) {
    const lastAporte = investment.movements
      .filter((m) => m.type === "aporte" && !m.isInitial)
      .at(-1);
    monthlyContribution = lastAporte?.amount ?? 0;
  }

  // Build projected values array
  const projectedValues: number[] = [Math.round(currentValue)];
  let balance = currentValue;

  for (let m = 1; m <= horizonMonths; m++) {
    balance = (balance + monthlyContribution) * (1 + monthlyRate);
    projectedValues.push(Math.round(balance));
  }

  // Determine the annual rate used
  const annualRate =
    investment.type === "Plazo Fijo" && investment.tna != null
      ? investment.tna / 100
      : DEFAULT_ANNUAL_RATES[investment.type];

  return {
    investmentId: investment.id,
    investmentName: investment.name,
    type: investment.type,
    currencyType: investment.currencyType,
    currentValue,
    monthlyContribution,
    annualRate,
    projectedValues,
  };
}

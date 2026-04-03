import type { Investment } from "@/hooks/useMoneyTracker";
import type { InvestmentProjection } from "./types";
import { DEFAULT_ANNUAL_RATES } from "./types";
import type { CustomAnnualRates } from "./types";

/**
 * Convert TNA (Tasa Nominal Anual) percentage to monthly effective rate.
 * Argentine Plazo Fijo compounds daily; this approximates monthly.
 */
export function pfMonthlyRate(tnaPercent: number): number {
  return Math.pow(1 + tnaPercent / 100 / 365, 30) - 1;
}

/**
 * Compute the observed monthly rate of return from an investment's actual performance.
 * Uses: totalInvested (sum of aporte movements), currentValue, and months elapsed.
 * Returns null if insufficient data (no movements, zero invested, or less than 1 month elapsed).
 */
export function computeObservedMonthlyRate(investment: Investment): number | null {
  const aportes = investment.movements.filter((m) => m.type === "aporte");
  if (aportes.length === 0) return null;

  const totalInvested = aportes.reduce((sum, m) => sum + m.amount, 0);
  if (totalInvested <= 0) return null;

  // Calculate months elapsed from first aporte to lastUpdated
  const firstAporteDate = new Date(aportes[0].date);
  const lastUpdatedDate = new Date(investment.lastUpdated);
  const msElapsed = lastUpdatedDate.getTime() - firstAporteDate.getTime();
  const monthsElapsed = msElapsed / (1000 * 60 * 60 * 24 * 30.44); // Average days per month

  if (monthsElapsed < 1) return null;

  // Solve for monthly rate: currentValue = totalInvested * (1 + r)^months
  // r = (currentValue / totalInvested)^(1/months) - 1
  const ratio = investment.currentValue / totalInvested;
  if (ratio <= 0) return null;

  const monthlyRate = Math.pow(ratio, 1 / monthsElapsed) - 1;
  return monthlyRate;
}

/**
 * Get default monthly rate for an investment type.
 * For Plazo Fijo returns 0 — caller must use pfMonthlyRate with investment.tna.
 * When customRates is provided and has a value for the type, use it instead of the hardcoded default.
 */
export function getDefaultMonthlyRate(
  type: Investment["type"],
  rateMultiplier: number = 1,
  customRates?: CustomAnnualRates
): number {
  const annualRate = customRates?.[type] ?? DEFAULT_ANNUAL_RATES[type];
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
  includeContributions: boolean,
  customRates?: CustomAnnualRates,
  contributionOverride?: number
): InvestmentProjection {
  const currentValue = investment.currentValue;

  // Determine monthly contribution
  let monthlyContribution = 0;
  if (includeContributions) {
    if (contributionOverride !== undefined) {
      monthlyContribution = contributionOverride;
    } else {
      const lastAporte = investment.movements
        .filter((m) => m.type === "aporte" && !m.isInitial)
        .at(-1);
      monthlyContribution = lastAporte?.amount ?? 0;
    }
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
      : customRates?.[investment.type] ?? DEFAULT_ANNUAL_RATES[investment.type];

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

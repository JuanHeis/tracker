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
 * Uses: totalInvested (sum of aporte movements), currentValue, and time elapsed.
 *
 * When sufficient history exists (>= 1 month), annualizes using compound interest math.
 * When data is recent (< 1 month, e.g. wizard-loaded investments where the user entered
 * their total aportes as initial value and then updated currentValue to real worth),
 * uses the simple total return as a monthly rate approximation.
 *
 * Returns null only when there's truly no data (no movements, zero invested, or
 * currentValue equals totalInvested meaning no observed return).
 */
export function computeObservedMonthlyRate(investment: Investment): number | null {
  const aportes = investment.movements.filter((m) => m.type === "aporte");
  if (aportes.length === 0) return null;

  const totalInvested = aportes.reduce((sum, m) => sum + m.amount, 0);
  if (totalInvested <= 0) return null;

  const ratio = investment.currentValue / totalInvested;
  if (ratio <= 0) return null;

  // No observed return (currentValue == totalInvested) -- nothing to differentiate
  if (Math.abs(ratio - 1) < 0.0001) return null;

  // Calculate months elapsed from first aporte to now (use current date, not lastUpdated,
  // since lastUpdated only reflects when the value was last edited in the app)
  const firstAporteDate = new Date(aportes[0].date);
  const now = new Date();
  const msElapsed = now.getTime() - firstAporteDate.getTime();
  const monthsElapsed = msElapsed / (1000 * 60 * 60 * 24 * 30.44);

  if (monthsElapsed >= 1) {
    // Enough history: solve for monthly rate via compound interest
    // currentValue = totalInvested * (1 + r)^months  =>  r = ratio^(1/months) - 1
    return Math.pow(ratio, 1 / monthsElapsed) - 1;
  }

  // Recent data (< 1 month elapsed, typical for wizard-loaded investments):
  // Use total return (ratio - 1) directly as monthly rate approximation.
  // E.g. invested 1M, now worth 1.05M => 5% monthly rate for projection.
  return ratio - 1;
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
  contributionOverride?: number,
  rateSource?: import("./types").RateSource
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

  // Determine the annual rate used — derive from the actual monthlyRate so the
  // description always reflects the rate that was really applied to the curve.
  const annualRate = monthlyRate * 12;

  return {
    investmentId: investment.id,
    investmentName: investment.name,
    type: investment.type,
    currencyType: investment.currencyType,
    currentValue,
    monthlyContribution,
    annualRate,
    rateSource: rateSource ?? "default",
    projectedValues,
  };
}

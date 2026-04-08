export type SavingsRateConfig =
  | { mode: "auto" }
  | { mode: "percentage"; percentage: number }
  | { mode: "fixed"; amount: number };

export interface SavingsEstimateInput {
  config: SavingsRateConfig;
  currentSalary: number;
  averageNetFlow: number;
}

export const DEFAULT_SAVINGS_CONFIG: SavingsRateConfig = { mode: "auto" };
export const SAVINGS_RATE_KEY = "savingsRateConfig";

/**
 * Compute the estimated monthly savings based on the user's chosen mode.
 *
 * - auto: uses the historical average net flow (clamped to >= 0)
 * - percentage: a percentage of the current salary
 * - fixed: a user-specified fixed amount
 */
export function computeSavingsEstimate(input: SavingsEstimateInput): number {
  switch (input.config.mode) {
    case "auto":
      return Math.max(0, input.averageNetFlow);
    case "percentage":
      return Math.round(input.currentSalary * input.config.percentage / 100);
    case "fixed":
      return input.config.amount;
  }
}

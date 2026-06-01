/**
 * Resumen del Mes configuration — Phase 22.
 * Stored in localStorage under key "resumenConfig".
 * Mirrors the pattern from lib/projection/savings-rate.ts.
 */

export interface ResumenConfig {
  /** Threshold for "deficit recurrente" banner, as a percentage of last salary. 10-100, steps of 10. Default 25. */
  deficitThresholdPercent: number;
  /** ISO timestamp set when the investment-purpose migration wizard completes or is dismissed. Undefined = wizard still pending. */
  wizardCompletedAt?: string;
}

export const RESUMEN_CONFIG_KEY = "resumenConfig";

export const DEFAULT_RESUMEN_CONFIG: ResumenConfig = {
  deficitThresholdPercent: 25,
};

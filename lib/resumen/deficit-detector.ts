/**
 * Pure deficit-banner-trigger engine for the Resumen del Mes card (Phase 22).
 *
 * Implements:
 *   D5 — "Deficit anterior" banner when sobrante_anterior < 0
 *   D6 — "Deficit recurrente" banner when 2 consecutive months with Resultado < 0
 *        OR cumulative deficit since last positive month exceeds N% of last salary
 *   D13 — Threshold changes apply read-time only; no historical re-evaluation, no storage.
 *
 * Caller supplies the resultado history with INDEX 0 = most recent month.
 */

export interface DeficitState {
  /** sobranteAnteriorRaw < 0 */
  anterior: boolean;
  /** consecutiveNegativeMonths >= 2 OR cumulativeDeficit > threshold */
  recurrente: boolean;
  /** Count of leading months in resultadoHistory with resultado < 0 */
  consecutiveNegativeMonths: number;
  /** Sum of |negative resultados| starting from index 0, stopping at first non-negative, capped at 6 months */
  cumulativeDeficit: number;
  /** lastSalary * thresholdPercent / 100 */
  threshold: number;
}

const CUMULATIVE_LOOKBACK_MONTHS = 6;

export function evaluateDeficitState(
  resultadoHistory: ReadonlyArray<number>,
  sobranteAnteriorRaw: number,
  lastSalary: number,
  thresholdPercent: number,
): DeficitState {
  const threshold = (lastSalary * thresholdPercent) / 100;

  let consecutive = 0;
  for (const r of resultadoHistory) {
    if (r < 0) consecutive++;
    else break;
  }

  let cumulative = 0;
  const maxLookback = Math.min(resultadoHistory.length, CUMULATIVE_LOOKBACK_MONTHS);
  for (let i = 0; i < maxLookback; i++) {
    const r = resultadoHistory[i];
    if (r < 0) cumulative += -r;
    else break;
  }

  return {
    anterior: sobranteAnteriorRaw < 0,
    recurrente: consecutive >= 2 || cumulative > threshold,
    consecutiveNegativeMonths: consecutive,
    cumulativeDeficit: cumulative,
    threshold,
  };
}

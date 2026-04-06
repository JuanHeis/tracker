import type { HistoricalPoint } from "./types";

export interface MonthlyNetFlow {
  monthKey: string;
  netFlow: number;
}

/**
 * Calculate per-month net flow from historical patrimony points.
 * Net flow = patrimony[month] - patrimony[previous month].
 * Returns N-1 entries for N input points (first month has no prior reference).
 */
export function calculateMonthlyNetFlow(
  historicalPoints: HistoricalPoint[]
): MonthlyNetFlow[] {
  if (historicalPoints.length <= 1) return [];

  const flows: MonthlyNetFlow[] = [];
  for (let i = 1; i < historicalPoints.length; i++) {
    flows.push({
      monthKey: historicalPoints[i].monthKey,
      netFlow: historicalPoints[i].patrimony - historicalPoints[i - 1].patrimony,
    });
  }
  return flows;
}

/**
 * Compute the average monthly net flow from the last N months.
 * If lastN not provided, averages all entries.
 * Returns 0 for empty input. Result rounded to integer.
 */
export function averageMonthlyNetFlow(
  flows: MonthlyNetFlow[],
  lastN?: number
): number {
  if (flows.length === 0) return 0;

  const subset = lastN !== undefined ? flows.slice(-lastN) : flows;
  const sum = subset.reduce((acc, f) => acc + f.netFlow, 0);
  return Math.round(sum / subset.length);
}

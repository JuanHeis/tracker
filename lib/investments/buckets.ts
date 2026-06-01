/**
 * Pure buckets-by-purpose engine (D18/D19).
 *
 * For an Investment, computes per-purpose balances: bucket[p] = Σ(aportes p) − Σ(retiros p),
 * using the effective per-movement purpose (movement override → investment default → "ahorro").
 *
 * Notes:
 * - isInitial aportes DO count toward buckets — buckets reflect patrimony composition
 *   (this differs from the monthly-flow rule D15 in month-metrics).
 * - Pending retiros are EXCLUDED — the money has not left the investment yet.
 * - sinAsignar = currentValue − total (may be any sign; positive usually means rendimientos).
 */
import type { Investment, InvestmentPurpose } from "@/hooks/useMoneyTracker";
import { getMovementPurpose, INVESTMENT_PURPOSE_ORDER } from "@/constants/investment-purpose";

export interface PurposeBucket {
  purpose: InvestmentPurpose;
  amount: number;
  negative: boolean;
}

export interface BucketBreakdown {
  buckets: PurposeBucket[];
  total: number;
  sinAsignar: number;
}

export function computeBuckets(inv: Investment): BucketBreakdown {
  const totals: Record<InvestmentPurpose, number> = {
    ahorro: 0,
    objetivo: 0,
    tarjeta: 0,
    especulacion: 0,
  };

  for (const mov of inv.movements) {
    // Pending retiros: money not yet out, do not reduce the bucket.
    if (mov.type === "retiro" && mov.pendingIngreso) continue;
    const p = getMovementPurpose(mov, inv);
    if (mov.type === "aporte") {
      totals[p] += mov.amount;
    } else {
      totals[p] -= mov.amount;
    }
  }

  const buckets: PurposeBucket[] = INVESTMENT_PURPOSE_ORDER.map((purpose) => ({
    purpose,
    amount: totals[purpose],
    negative: totals[purpose] < 0,
  }));

  const total = buckets.reduce((sum, b) => sum + b.amount, 0);
  const sinAsignar = inv.currentValue - total;

  return { buckets, total, sinAsignar };
}

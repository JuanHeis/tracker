/**
 * Pure PERIOD cash-block core of calculateDualBalances (Phase 23-02).
 *
 * `calculateDualBalances` (hooks/useMoneyTracker.ts) mixes closure state (monthlyData,
 * viewMode, payDay, salary resolver) and computes both PERIOD-scoped and ACCUMULATED
 * balances plus patrimonio. Per the locked CONTEXT decision ("AMBOS motores consumen la
 * función pura compartida") we extract ONLY the PERIOD cash block — the transfers + loans +
 * usdPurchases + investment-cash contribution to arsBalancePeriod / usdBalancePeriod — onto
 * the shared computeCashEffect. Salary, extraIncomes, expenses, liquid currentValue and the
 * ACCUMULATED numbers stay computed in calculateDualBalances exactly as today (minimal-risk
 * scope, per the locked decision).
 *
 * IMPORTANT — adjustments: computeCashEffect EXCLUDES adjustment_ars/adjustment_usd (they are
 * cuadre/seed artifacts, Plan 23-01 Q3). calculateDualBalances DOES add the in-range period
 * adjustment into arsBalancePeriod/usdBalancePeriod. To stay BYTE-IDENTICAL, this core adds the
 * period adjustment contribution SEPARATELY here (outside computeCashEffect). The snapshot test
 * in dual-balances-core.test.ts locks the result against pre-refactor constants.
 */
import { CurrencyType } from "@/constants/investments";
import type { Transfer, Loan, UsdPurchase, Investment } from "@/hooks/useMoneyTracker";
import { computeCashEffect } from "@/lib/resumen/cash-effects";

export interface DualBalancesCoreInput {
  isInRange: (dateStr: string) => boolean;
  transfers: ReadonlyArray<Transfer>;
  loans: ReadonlyArray<Loan>;
  usdPurchases: ReadonlyArray<UsdPurchase>;
  investments: ReadonlyArray<Investment>;
}

export interface DualBalancesCoreResult {
  /** PERIOD cash contribution to arsBalancePeriod (computeCashEffect + in-range adjustment_ars). */
  arsPeriodCash: number;
  /** PERIOD cash contribution to usdBalancePeriod (computeCashEffect + in-range adjustment_usd). */
  usdPeriodCash: number;
}

/**
 * Pure: the PERIOD cash contribution both engines share, built on computeCashEffect, with the
 * in-range adjustment contribution added SEPARATELY so calculateDualBalances stays byte-identical.
 */
export function computeDualBalancesCore(input: DualBalancesCoreInput): DualBalancesCoreResult {
  const { isInRange, transfers, loans, usdPurchases, investments } = input;

  // In-range period adjustment contribution (computeCashEffect excludes adjustments — Q3).
  let arsAdjustmentInRange = 0;
  let usdAdjustmentInRange = 0;
  for (const t of transfers) {
    if (!isInRange(t.date)) continue;
    if (t.type === "adjustment_ars") arsAdjustmentInRange += t.amount!;
    else if (t.type === "adjustment_usd") usdAdjustmentInRange += t.amount!;
  }

  const arsPeriodCash =
    computeCashEffect({
      currency: CurrencyType.ARS,
      isInRange,
      transfers,
      loans,
      usdPurchases,
      investments,
    }) + arsAdjustmentInRange;

  const usdPeriodCash =
    computeCashEffect({
      currency: CurrencyType.USD,
      isInRange,
      transfers,
      loans,
      usdPurchases,
      investments,
    }) + usdAdjustmentInRange;

  return { arsPeriodCash, usdPeriodCash };
}

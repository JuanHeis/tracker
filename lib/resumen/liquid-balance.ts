/**
 * Faithful pure reference engine of the per-month cash-flow (Phase 23-03).
 *
 * `computeLiquidFlowForMonth` is a FAITHFUL, pure extraction of the ARS
 * `calculateAvailableForMonth` (hooks/useMoneyTracker.ts L578-652) and the USD
 * `computeUsdAvailableForMonth` (components/expense-tracker.tsx L273-299): it
 * INDEPENDENTLY sums salary + aguinaldo + extraIncomes − expenses for the given
 * currency, then adds `computeCashEffect` ONLY for the transfers/loans/usdPurchases/
 * investment-cash block (reusing the single source of truth — no duplicated sign table).
 *
 * This is the HONEST, cuadre-free per-month liquid flow: it intentionally does NOT add
 * adjustment_ars / adjustment_usd. That is precisely why the reconciliation holds WITHOUT
 * the $4.1M cuadre (proving AC-3) — the cuadre is redundant once the flow is computed
 * correctly. It exists as the test's reference engine (Q1): kept test-only, NOT wired into
 * the live engines (the live engines already delegate to computeCashEffect after Plan 23-02;
 * re-wiring them onto this wrapper carried wizard-month display risk for zero net benefit).
 *
 * Pure: no React, no localStorage, no Date.now. The caller injects `isInRange` (the same
 * getFilterDateRange window both engines use), so it is range-agnostic across "mes
 * calendario" and "periodo personalizado".
 */
import { CurrencyType } from "@/constants/investments";
import { computeCashEffect } from "@/lib/resumen/cash-effects";
import type { Transfer, Loan, UsdPurchase, Investment } from "@/hooks/useMoneyTracker";

export interface LiquidFlowInput {
  currency: CurrencyType;
  isInRange: (dateStr: string) => boolean;
  /** ARS salary for the month (0 for USD — the USD engine has no salary term). */
  salaryAmount: number;
  /** ARS aguinaldo for the month (0 for USD, 0 for non-June/December). */
  aguinaldoAmount: number;
  extraIncomes: ReadonlyArray<{ amount: number; currencyType: CurrencyType; date: string }>;
  expenses: ReadonlyArray<{ amount: number; currencyType: CurrencyType; date: string }>;
  transfers: ReadonlyArray<Transfer>;
  loans: ReadonlyArray<Loan>;
  usdPurchases: ReadonlyArray<UsdPurchase>;
  investments: ReadonlyArray<Investment>;
}

/**
 * Faithful pure core of calculateAvailableForMonth / computeUsdAvailableForMonth
 * (single-period flow, EXCLUDING adjustments — the cuadre-free honest flow).
 * Independently sums income − expenses, then adds computeCashEffect for the
 * transfers/loans/usdPurchases/investment-cash block only.
 */
export function computeLiquidFlowForMonth(input: LiquidFlowInput): number {
  const {
    currency,
    isInRange,
    salaryAmount,
    aguinaldoAmount,
    extraIncomes,
    expenses,
    transfers,
    loans,
    usdPurchases,
    investments,
  } = input;

  let total = salaryAmount + aguinaldoAmount;

  for (const inc of extraIncomes) {
    if (inc.currencyType === currency && isInRange(inc.date)) total += inc.amount;
  }
  for (const exp of expenses) {
    if (exp.currencyType === currency && isInRange(exp.date)) total -= exp.amount;
  }

  total += computeCashEffect({ currency, isInRange, transfers, loans, usdPurchases, investments });

  return total;
}

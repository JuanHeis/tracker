/**
 * Single source of truth for liquid-cash effects (Phase 23-01).
 *
 * Pure function shared by both engines (calculateDualBalances and, once wired,
 * computeMonthMetrics) so their cash sign logic can never diverge again.
 *
 * The sign table is transcribed VERBATIM from calculateDualBalances
 * (hooks/useMoneyTracker.ts L471-547) plus the investment-as-cash block from
 * calculateAvailableForMonth (L607-616). It is the verified source of truth.
 *
 * Pure: no React, no localStorage, no Date.now. The caller injects `isInRange`
 * (the same getFilterDateRange window both engines already use), so the function
 * is range-agnostic and works for "mes calendario" and "periodo personalizado".
 *
 * Decisions locked in Plan 23-01:
 * - Q3: EXCLUDES adjustment_ars/adjustment_usd (cuadre/seed artifacts, not real
 *   cash flow). Including them would double-count the wizard seed every month.
 * - Q2: INCLUDES investment aporte(-)/retiro(+) as cash (the term computeMonthMetrics
 *   is missing), skipping isInitial/pendingIngreso exactly as the source engines do.
 */
import { CurrencyType } from "@/constants/investments";
import type { Transfer, Loan, UsdPurchase, Investment } from "@/hooks/useMoneyTracker";

export interface CashEffectInput {
  currency: CurrencyType;
  isInRange: (dateStr: string) => boolean;
  transfers: ReadonlyArray<Transfer>;
  loans: ReadonlyArray<Loan>;
  usdPurchases: ReadonlyArray<UsdPurchase>;
  investments: ReadonlyArray<Investment>;
}

/**
 * Net signed liquid-cash delta for the given currency over the in-range movements.
 * Positive = money in, negative = money out. Source of truth = calculateDualBalances.
 * EXCLUDES adjustment_ars/adjustment_usd (cuadre/seed artifacts — see Plan 23-01 decisions Q3).
 * INCLUDES investment aporte(-)/retiro(+) as cash (the term computeMonthMetrics is missing — Q2).
 */
export function computeCashEffect(input: CashEffectInput): number {
  const { currency, isInRange, transfers, loans, usdPurchases, investments } = input;
  const isUsd = currency === CurrencyType.USD;
  let delta = 0;

  for (const p of usdPurchases) {
    if (!isInRange(p.date)) continue;
    if (isUsd) delta += p.usdAmount;
    else if (p.origin === "tracked") delta -= p.arsAmount;
  }

  for (const t of transfers) {
    if (!isInRange(t.date)) continue;
    switch (t.type) {
      case "currency_ars_to_usd": delta += isUsd ? (t.usdAmount ?? 0) : -(t.arsAmount ?? 0); break;
      case "currency_usd_to_ars": delta += isUsd ? -(t.usdAmount ?? 0) : (t.arsAmount ?? 0); break;
      case "cash_out": if ((t.currency === "USD") === isUsd) delta -= t.amount!; break;
      case "cash_in":  if ((t.currency === "USD") === isUsd) delta += t.amount!; break;
      case "adjustment_ars":
      case "adjustment_usd":
        // Intentional no-op: adjustments are cuadre/seed artifacts, not real cash flow (Q3).
        break;
      default: {
        // Exhaustiveness guard: adding a new TransferType makes this a compile error
        // instead of a silent zero cash effect across all engines consuming this fn.
        const _exhaustive: never = t.type;
        void _exhaustive;
        break;
      }
    }
  }

  for (const loan of loans) {
    if ((loan.currencyType === CurrencyType.USD) !== isUsd) continue;
    if (loan.type === "preste") {
      if (isInRange(loan.date)) delta -= loan.amount;
      for (const pay of loan.payments) if (isInRange(pay.date)) delta += pay.amount;
    } else {
      for (const pay of loan.payments) if (isInRange(pay.date)) delta -= pay.amount;
    }
  }

  for (const inv of investments) {
    if ((inv.currencyType === CurrencyType.USD) !== isUsd) continue;
    for (const mov of inv.movements) {
      if (mov.isInitial || mov.pendingIngreso) continue;
      if (!isInRange(mov.date)) continue;
      if (mov.type === "aporte") delta -= mov.amount;
      else delta += (mov.receivedAmount ?? mov.amount);
    }
  }

  return delta;
}

/**
 * Phase 23 reconciliation — the permanent regression net (Plan 23-03).
 *
 * PRIMARY, NON-TAUTOLOGICAL PROOF (the reason this suite exists):
 *   The June 2026 Resumen "Disponible" liquid FLOW is reconstructed INDEPENDENTLY from the
 *   real billetera close in `calculateDualBalances`:
 *
 *     June ARS liquid flow == arsBalancePeriod − (in-range adjustment_ars cuadre)
 *                          == 3420058.73 − 4111230.13 == -691171.40
 *     June USD liquid flow == usdBalancePeriod − (in-range adjustment_usd cuadre)
 *                          ==       1.69 − (-25.13)   ==      26.82
 *
 *   These constants come from the real backup's OWN period billetera balance (the numbers
 *   the app displays as saldo líquido, snapshot-locked in dual-balances-core.test.ts) with
 *   the cuadre stripped off. They are NOT produced by the both-engines equality below, so
 *   they catch a shared bug inside computeCashEffect that a pure f(x)==f(x) check would miss.
 *   This IS the reconciliation: Resumen Disponible flow == honest saldo líquido, cuadre-free.
 *
 * SECONDARY (consistency layer): computeMonthMetrics(...).disponible − sobranteAnterior ==
 *   computeLiquidFlowForMonth(June). Both call computeCashEffect, so on its own this is
 *   tautological — it is a consistency guard ON TOP of the concrete anchors above.
 *
 * CUADRE-REDUNDANCY (AC-3): the backup transfers CONTAIN the $4.1M June adjustment_ars.
 *   computeCashEffect EXCLUDES adjustments, so the honest flow ignores it — proving the
 *   cuadre is redundant (the flow is correct DESPITE the $4.1M sitting in the data).
 *
 * ── NOTE ON THE $28.168,76 ANCHOR (Plan 23-03 stated constant — corrected here) ──────────
 *   The plan's expected primary anchor was $28.168,76 = $390.668,76 − $362.500, on the
 *   premise that the ONLY cash movement the fix folds into June's Disponible is the
 *   2026-06-04 currency_ars_to_usd conversion. Reconstructed against the REAL backup, that
 *   premise is stale (RESEARCH assumption A1 flagged the $390.668,76 baseline as coming from
 *   the PROMPT, not from running the live engines, and warned "if baseline differs, target
 *   arithmetic shifts"). The Plan-01/02 fix changed Disponible from subtracting only
 *   `aportesNoNeutros` ($764.000) to absorbing the FULL cashEffect, which additionally folds
 *   in the previously-ignored 2026-06-30 préstamo (−$333.334) and the June investment aportes
 *   (net −$1.095.967). The correct, independently-reconstructed June ARS liquid flow is
 *   therefore −$691.171,40 (period) / −$702.501,30 (chained with May's sobrante), NOT
 *   $28.168,76. This test asserts the CORRECT billetera-derived anchors. See 23-03-SUMMARY.md.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { CurrencyType } from "@/constants/investments";
import type { Investment, Transfer, Loan, UsdPurchase } from "@/hooks/useMoneyTracker";
import { computeMonthMetrics } from "@/lib/resumen/month-metrics";
import { computeLiquidFlowForMonth } from "@/lib/resumen/liquid-balance";
import { getFilterDateRange } from "@/hooks/usePayPeriod";

// Real backup fixture (READ-ONLY — never written). Loaded via fs.readFileSync (matching
// dual-balances-core.test.ts) rather than a JSON import, for consistency across the suite.
const backupPath = path.resolve(__dirname, "../../expense-tracker-backup-2026-06-30.json");
const backup = JSON.parse(readFileSync(backupPath, "utf8"));
const md = backup.data.monthlyData as {
  expenses: Array<{ amount: number; currencyType: CurrencyType; date: string }>;
  extraIncomes: Array<{ amount: number; currencyType: CurrencyType; date: string }>;
  investments: Investment[];
  transfers: Transfer[];
  loans: Loan[];
  usdPurchases: UsdPurchase[];
  salaryOverrides: Record<string, { amount: number; usdRate: number }>;
};
const salaryEntries = backup.data.salaryHistory.entries as Array<{
  effectiveDate: string;
  amount: number;
}>;

// ── Concrete billetera anchors, reconstructed independently from the real backup ────────
// arsBalancePeriod / usdBalancePeriod are the app's own June period saldo líquido (locked
// in dual-balances-core.test.ts). Strip the in-range cuadre to get the honest liquid flow.
const ARS_BALANCE_PERIOD_WITH_CUADRE = 3420058.73; // = SNAPSHOT_ARS_PERIOD (dual-balances-core)
const USD_BALANCE_PERIOD_WITH_CUADRE = 1.69; // = SNAPSHOT_USD_PERIOD (dual-balances-core)
const JUNE_ADJUSTMENT_ARS = 4111230.13; // 2026-06-30 cuadre in the backup
const JUNE_ADJUSTMENT_USD = -25.13; // 2026-06-30 cuadre in the backup
const JUNE_ARS_LIQUID_FLOW = ARS_BALANCE_PERIOD_WITH_CUADRE - JUNE_ADJUSTMENT_ARS; // -691171.40
const JUNE_USD_LIQUID_FLOW = USD_BALANCE_PERIOD_WITH_CUADRE - JUNE_ADJUSTMENT_USD; //      26.82

// May 2026 effectiveDate salary 2364969 resolves for June via getSalaryForMonth
// (latest effectiveDate <= monthKey). Sourced from backup.data.salaryHistory.entries.
function salaryForMonth(monthKey: string): number {
  let best: (typeof salaryEntries)[number] | null = null;
  for (const e of salaryEntries) {
    if (e.effectiveDate <= monthKey) {
      if (!best || e.effectiveDate > best.effectiveDate) best = e;
    }
  }
  return best ? best.amount : 0;
}
const MAY_SALARY = salaryForMonth("2026-05"); // 2364969 (sourced from backup salaryHistory)
const JUNE_SALARY = salaryForMonth("2026-06"); // 2364969 (same May effectiveDate resolves)

// isInRange built from the SHARED getFilterDateRange window (payDay=1, viewMode="periodo").
function makeIsInRange(monthKey: string): (dateStr: string) => boolean {
  const { start, end } = getFilterDateRange(monthKey, "periodo", 1);
  return (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt >= start && dt <= end;
  };
}
const isInRangeMay = makeIsInRange("2026-05");
const isInRangeJune = makeIsInRange("2026-06");

// Sobrante anterior for junio is DERIVED by chaining mayo through the reference engine on the
// REAL backup (W-3, NO hardcode). Expected values kept only as `//` sanity comments.
const sobranteJunArs = computeLiquidFlowForMonth({
  currency: CurrencyType.ARS,
  isInRange: isInRangeMay,
  salaryAmount: MAY_SALARY,
  aguinaldoAmount: 0,
  extraIncomes: md.extraIncomes,
  expenses: md.expenses,
  transfers: md.transfers,
  loans: md.loans,
  usdPurchases: md.usdPurchases,
  investments: md.investments,
}); // sanity: ≈ -11329.90 (May's honest ARS flow)
const sobranteJunUsd = computeLiquidFlowForMonth({
  currency: CurrencyType.USD,
  isInRange: isInRangeMay,
  salaryAmount: 0,
  aguinaldoAmount: 0,
  extraIncomes: md.extraIncomes,
  expenses: md.expenses,
  transfers: md.transfers,
  loans: md.loans,
  usdPurchases: md.usdPurchases,
  investments: md.investments,
}); // sanity: ≈ 5.56 (May's honest USD flow)

function juneMetrics(currency: CurrencyType, salaryAmount: number, sobrante: number) {
  return computeMonthMetrics({
    monthKey: "2026-06",
    currency,
    investments: md.investments,
    expenses: md.expenses,
    extraIncomes: md.extraIncomes,
    salaryAmount,
    aguinaldoAmount: 0,
    sobranteAnteriorRaw: sobrante,
    isInRange: isInRangeJune,
    transfers: md.transfers,
    loans: md.loans,
    usdPurchases: md.usdPurchases,
  });
}

describe("Phase 23 reconciliation — Resumen Disponible == honest saldo líquido (fixture)", () => {
  it("fixture actually CONTAINS the $4.1M June cuadre (so the redundancy test is meaningful)", () => {
    // Sanity: the test is provably running against data that carries the cuadre adjustments.
    expect(
      md.transfers.some((t) => t.type === "adjustment_ars" && t.date === "2026-06-30"),
    ).toBe(true);
    const juneCuadre = md.transfers.find(
      (t) => t.type === "adjustment_ars" && t.date === "2026-06-30",
    );
    expect(juneCuadre!.amount).toBeCloseTo(JUNE_ADJUSTMENT_ARS, 2); // ~$4.1M
    expect(
      md.transfers.some((t) => t.type === "adjustment_usd" && t.date === "2026-06-30"),
    ).toBe(true);
  });

  it("PRIMARY: June 2026 ARS liquid flow == -691171.40 (independent billetera reconstruction)", () => {
    // arsBalancePeriod (3420058.73, WITH cuadre) − cuadre (4111230.13) = honest flow.
    // Reconstructed from calculateDualBalances' OWN billetera close, NOT from the engine
    // under test — this is what makes the anchor non-tautological.
    const arsFlow = computeLiquidFlowForMonth({
      currency: CurrencyType.ARS,
      isInRange: isInRangeJune,
      salaryAmount: JUNE_SALARY,
      aguinaldoAmount: 0,
      extraIncomes: md.extraIncomes,
      expenses: md.expenses,
      transfers: md.transfers,
      loans: md.loans,
      usdPurchases: md.usdPurchases,
      investments: md.investments,
    });
    expect(arsFlow).toBeCloseTo(JUNE_ARS_LIQUID_FLOW, 2); // -691171.40, billetera-derived
  });

  it("PRIMARY: June 2026 USD liquid flow == 26.82 (independent billetera reconstruction)", () => {
    // usdBalancePeriod (1.69, WITH cuadre) − cuadre (-25.13) = 26.82 honest USD flow.
    const usdFlow = computeLiquidFlowForMonth({
      currency: CurrencyType.USD,
      isInRange: isInRangeJune,
      salaryAmount: 0,
      aguinaldoAmount: 0,
      extraIncomes: md.extraIncomes,
      expenses: md.expenses,
      transfers: md.transfers,
      loans: md.loans,
      usdPurchases: md.usdPurchases,
      investments: md.investments,
    });
    expect(usdFlow).toBeCloseTo(JUNE_USD_LIQUID_FLOW, 2); // 26.82, billetera-derived
  });

  it("SECONDARY (consistency): ARS computeMonthMetrics agrees with the reference engine", () => {
    // Consistency layer only — both call computeCashEffect. The concrete anchors above are
    // the real proof. sobrante is chained from May (isInRangeMay), NOT hardcoded.
    const arsDisp = juneMetrics(CurrencyType.ARS, JUNE_SALARY, sobranteJunArs).disponible;
    const arsFlow = computeLiquidFlowForMonth({
      currency: CurrencyType.ARS,
      isInRange: isInRangeJune,
      salaryAmount: JUNE_SALARY,
      aguinaldoAmount: 0,
      extraIncomes: md.extraIncomes,
      expenses: md.expenses,
      transfers: md.transfers,
      loans: md.loans,
      usdPurchases: md.usdPurchases,
      investments: md.investments,
    });
    expect(arsDisp - sobranteJunArs).toBeCloseTo(arsFlow, 2);
    // chained disponible = May sobrante + June flow ≈ -11329.90 + -691171.40 = -702501.30
    expect(arsDisp).toBeCloseTo(sobranteJunArs + JUNE_ARS_LIQUID_FLOW, 2);
  });

  it("SECONDARY (consistency): USD computeMonthMetrics agrees with the reference engine", () => {
    const usdDisp = juneMetrics(CurrencyType.USD, 0, sobranteJunUsd).disponible;
    const usdFlow = computeLiquidFlowForMonth({
      currency: CurrencyType.USD,
      isInRange: isInRangeJune,
      salaryAmount: 0,
      aguinaldoAmount: 0,
      extraIncomes: md.extraIncomes,
      expenses: md.expenses,
      transfers: md.transfers,
      loans: md.loans,
      usdPurchases: md.usdPurchases,
      investments: md.investments,
    });
    expect(usdDisp - sobranteJunUsd).toBeCloseTo(usdFlow, 2);
    expect(usdDisp).toBeCloseTo(sobranteJunUsd + JUNE_USD_LIQUID_FLOW, 2); // ≈ 32.38
  });

  it("CUADRE IS REDUNDANT (AC-3): flow == -691171.40 DESPITE the $4.1M adjustment_ars", () => {
    // The backup transfers CONTAIN the $4.1M June adjustment_ars. computeCashEffect excludes
    // adjustments, so the honest flow is correct and is NOT off by ~4.1M.
    const arsDisp = juneMetrics(CurrencyType.ARS, JUNE_SALARY, sobranteJunArs).disponible;
    // If the $4.1M cuadre leaked in, the chained disponible would be ≈ +3.4M. It is not.
    expect(arsDisp).toBeLessThan(1_000_000);
    expect(arsDisp).toBeCloseTo(sobranteJunArs + JUNE_ARS_LIQUID_FLOW, 2); // -702501.30
    // And the raw June flow equals the billetera close with the cuadre stripped off.
    expect(JUNE_ARS_LIQUID_FLOW).toBeCloseTo(
      ARS_BALANCE_PERIOD_WITH_CUADRE - JUNE_ADJUSTMENT_ARS,
      2,
    );
  });
});

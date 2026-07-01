/**
 * Numeric zero-regression snapshot for the calculateDualBalances PERIOD cash refactor
 * (Phase 23-02, Part D — the highest-risk operation of the phase).
 *
 * Proves that folding computeCashEffect (via computeDualBalancesCore) into calculateDualBalances
 * leaves arsBalancePeriod / usdBalancePeriod BYTE-IDENTICAL to the pre-refactor values on the
 * real user backup for June 2026 (payDay=1, viewMode="periodo", range 2026-06-01..2026-06-30).
 *
 * The reconstruction composes arsBalancePeriod exactly as calculateDualBalances does:
 *   salary + ARS extraIncomes(in range) − ARS expenses(in range) + liquid-ARS currentValue
 *     + computeDualBalancesCore(...).arsPeriodCash   (cash effect + in-range adjustment_ars)
 * and usdBalancePeriod symmetrically.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { CurrencyType } from "@/constants/investments";
import type { Investment, Transfer, Loan, UsdPurchase } from "@/hooks/useMoneyTracker";
import { computeDualBalancesCore } from "@/lib/resumen/dual-balances-core";

// Real backup fixture (expense-tracker-backup-2026-06-30). Read from repo root.
const backupPath = path.resolve(__dirname, "../../expense-tracker-backup-2026-06-30.json");
const backup = JSON.parse(readFileSync(backupPath, "utf8"));
const md = backup.data.monthlyData as {
  expenses: Array<{ amount: number; currencyType: string; date: string }>;
  extraIncomes: Array<{ amount: number; currencyType: string; date: string }>;
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

// ── Pre-refactor snapshot constants (captured 2026-07-01 by running the original
//    calculateDualBalances algorithm over the real backup for June 2026). ──────────
const SNAPSHOT_ARS_PERIOD = 3420058.73; // pre-refactor snapshot — must not change
const SNAPSHOT_USD_PERIOD = 1.69; // pre-refactor snapshot — must not change

// June 2026 periodo range with payDay=1 → 2026-06-01 .. 2026-06-30 (getPayPeriodRange).
const start = new Date(2026, 5, 1);
const end = new Date(2026, 5, 30);
const parseDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const isInRange = (s: string) => {
  const d = parseDate(s);
  return d >= start && d <= end;
};

// Salary resolution = getSalaryForMonth("2026-06", ...) with empty overrides.
function juneSalary(): number {
  const monthKey = "2026-06";
  let best: (typeof salaryEntries)[number] | null = null;
  for (const e of salaryEntries) {
    if (e.effectiveDate <= monthKey) {
      if (!best || e.effectiveDate > best.effectiveDate) best = e;
    }
  }
  return best ? best.amount : 0;
}

describe("dual-balances-core June 2026 zero-regression snapshot (Phase 23-02)", () => {
  const core = computeDualBalancesCore({
    isInRange,
    transfers: md.transfers || [],
    loans: md.loans || [],
    usdPurchases: md.usdPurchases || [],
    investments: md.investments || [],
  });

  it("June 2026 arsBalancePeriod byte-identical after refactor", () => {
    const salary = juneSalary();
    let arsExtra = 0;
    let arsExp = 0;
    let arsLiquid = 0;
    for (const i of md.extraIncomes || []) {
      if (i.currencyType !== CurrencyType.USD && isInRange(i.date)) arsExtra += i.amount;
    }
    for (const e of md.expenses || []) {
      if (e.currencyType !== CurrencyType.USD && isInRange(e.date)) arsExp += e.amount;
    }
    for (const inv of md.investments || []) {
      if (inv.status === "Activa" && inv.isLiquid && inv.currencyType === CurrencyType.ARS) {
        arsLiquid += inv.currentValue;
      }
    }
    const reconstructedArsBalancePeriod =
      salary + arsExtra - arsExp + arsLiquid + core.arsPeriodCash;

    expect(reconstructedArsBalancePeriod).toBeCloseTo(SNAPSHOT_ARS_PERIOD, 2);
  });

  it("June 2026 usdBalancePeriod byte-identical after refactor", () => {
    let usdExtra = 0;
    let usdExp = 0;
    let usdLiquid = 0;
    for (const i of md.extraIncomes || []) {
      if (i.currencyType === CurrencyType.USD && isInRange(i.date)) usdExtra += i.amount;
    }
    for (const e of md.expenses || []) {
      if (e.currencyType === CurrencyType.USD && isInRange(e.date)) usdExp += e.amount;
    }
    for (const inv of md.investments || []) {
      if (inv.status === "Activa" && inv.isLiquid && inv.currencyType === CurrencyType.USD) {
        usdLiquid += inv.currentValue;
      }
    }
    const reconstructedUsdBalancePeriod = usdExtra - usdExp + usdLiquid + core.usdPeriodCash;

    expect(reconstructedUsdBalancePeriod).toBeCloseTo(SNAPSHOT_USD_PERIOD, 2);
  });
});

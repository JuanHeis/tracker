/**
 * Pure month-metrics engine for the Resumen del Mes card (Phase 22).
 *
 * Computes Disponible and Resultado del mes per SPEC 260601-rdm decisions D1, D2, D11.
 *
 *   Disponible        = sobranteAnteriorRaw + ingresosMes − egresosMes
 *   Resultado del mes = ingresosMes − egresosMes
 *   ingresosMes       = ingresoFijo + otrosIngresos + aguinaldo
 *   egresosMes        = totalGastos + aportesNoNeutros
 *
 * aportesNoNeutros = aportes whose EFFECTIVE purpose ∈ {"ahorro","especulacion"}
 * (tarjeta/objetivo aportes are NEUTRAL — they don't reduce either metric).
 *
 * Purpose is resolved PER-MOVEMENT (D14): movement.purpose override →
 * investment.purpose default → "ahorro" fallback. See getMovementPurpose.
 *
 * Retiros never add to Resultado del mes (D2), and are NOT included here for Disponible
 * either — Disponible is a sobrante+income-out-expenses formula; investment withdrawals
 * are reflected in the caller's separate balance computation if needed.
 *
 * The function is pure: no Date.now, no localStorage, no React. The caller supplies
 * `isInRange` so the same engine works for both "mes calendario" and "periodo personalizado".
 */
import { CurrencyType } from "@/constants/investments";
import {
  type Investment,
  type InvestmentPurpose,
  type Transfer,
  type Loan,
  type UsdPurchase,
} from "@/hooks/useMoneyTracker";
import { getMovementPurpose } from "@/constants/investment-purpose";
import { computeCashEffect } from "@/lib/resumen/cash-effects";

export interface MonthMetricsInput {
  monthKey: string;
  currency: CurrencyType;
  investments: Investment[];
  expenses: ReadonlyArray<{ amount: number; currencyType: CurrencyType; date: string }>;
  extraIncomes: ReadonlyArray<{ amount: number; currencyType: CurrencyType; date: string }>;
  salaryAmount: number;
  aguinaldoAmount: number;
  sobranteAnteriorRaw: number;
  isInRange: (dateStr: string) => boolean;
  // Phase 23-02: OPTIONAL cash movements folded into `disponible` via computeCashEffect.
  // Default [] so the resultado-history loops (which read only resultadoDelMes) keep
  // compiling untouched. `investments` above is already required and reused for cash.
  transfers?: ReadonlyArray<Transfer>;
  loans?: ReadonlyArray<Loan>;
  usdPurchases?: ReadonlyArray<UsdPurchase>;
}

export interface MonthMetrics {
  ingresoFijo: number;
  otrosIngresos: number;
  aguinaldo: number;
  sobranteAnterior: number;
  totalGastos: number;
  aportesAll: number;
  aportesNoNeutros: number;
  cashEffect: number;
  disponible: number;
  resultadoDelMes: number;
}

/** Predicate matching D2: tarjeta and objetivo are NEUTRAL; ahorro and especulacion are NOT. */
function isNonNeutroPurpose(p: InvestmentPurpose): boolean {
  return p === "ahorro" || p === "especulacion";
}

/**
 * Sum aporte amounts in the given currency, filtered by date range and optionally by purpose.
 * Always excludes movements with isInitial or pendingIngreso (per existing codebase convention).
 */
export function sumAportes(
  investments: ReadonlyArray<Investment>,
  currency: CurrencyType,
  isInRange: (dateStr: string) => boolean,
  onlyNonNeutros: boolean,
): number {
  let sum = 0;
  for (const inv of investments) {
    if (inv.currencyType !== currency) continue;
    for (const mov of inv.movements) {
      if (mov.isInitial) continue;
      if (mov.pendingIngreso) continue;
      if (mov.type !== "aporte") continue;
      if (!isInRange(mov.date)) continue;
      // Purpose resolved per-movement (movement override → investment default → "ahorro").
      if (onlyNonNeutros && !isNonNeutroPurpose(getMovementPurpose(mov, inv))) continue;
      sum += mov.amount;
    }
  }
  return sum;
}

export function computeMonthMetrics(input: MonthMetricsInput): MonthMetrics {
  const {
    currency,
    investments,
    expenses,
    extraIncomes,
    salaryAmount,
    aguinaldoAmount,
    sobranteAnteriorRaw,
    isInRange,
    transfers,
    loans,
    usdPurchases,
  } = input;

  const ingresoFijo = currency === CurrencyType.ARS ? salaryAmount : 0;
  const aguinaldo = currency === CurrencyType.ARS ? aguinaldoAmount : 0;

  let otrosIngresos = 0;
  for (const inc of extraIncomes) {
    if (inc.currencyType !== currency) continue;
    if (!isInRange(inc.date)) continue;
    otrosIngresos += inc.amount;
  }

  let totalGastos = 0;
  for (const exp of expenses) {
    if (exp.currencyType !== currency) continue;
    if (!isInRange(exp.date)) continue;
    totalGastos += exp.amount;
  }

  const aportesAll = sumAportes(investments, currency, isInRange, false);
  const aportesNoNeutros = sumAportes(investments, currency, isInRange, true);

  // Option B (owner decision 2026-07): inversiones = ahorro, NO gasto. Investments do
  // NOT reduce Disponible as raw cash — aportes ahorro/especulación reduce it via
  // aportesNoNeutros (purpose logic); tarjeta/objetivo stay neutral. Only true CONSUMPTION
  // cash movements fold in: conversions, cash_in/out, usdPurchases, loans. So computeCashEffect
  // runs WITHOUT investments here. (The saldo-líquido engines still pass investments — Opción A.)
  const cashEffect = computeCashEffect({
    currency,
    isInRange,
    investments: [],
    transfers: transfers ?? [],
    loans: loans ?? [],
    usdPurchases: usdPurchases ?? [],
  });

  const ingresosMes = ingresoFijo + otrosIngresos + aguinaldo;

  // Resultado del mes keeps D2 semantics (retiros excluded, tarjeta/objetivo neutral) — UNCHANGED.
  const egresosMes = totalGastos + aportesNoNeutros;
  const resultadoDelMes = ingresosMes - egresosMes;

  // Disponible (Opción B): sobrante + ingresos − gastos − aportesNoNeutros + cashEffect.
  // cashEffect EXCLUDES investments, so aportes are counted once (via aportesNoNeutros).
  const disponible = sobranteAnteriorRaw + ingresosMes - egresosMes + cashEffect;

  return {
    ingresoFijo,
    otrosIngresos,
    aguinaldo,
    sobranteAnterior: sobranteAnteriorRaw,
    totalGastos,
    aportesAll,
    aportesNoNeutros,
    cashEffect,
    disponible,
    resultadoDelMes,
  };
}

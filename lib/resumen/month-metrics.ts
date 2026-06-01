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
 * aportesNoNeutros = aportes to investments whose purpose ∈ {"ahorro","especulacion"}
 * (tarjeta/objetivo aportes are NEUTRAL — they don't reduce either metric).
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
  getInvestmentPurpose,
} from "@/hooks/useMoneyTracker";

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
}

export interface MonthMetrics {
  ingresoFijo: number;
  otrosIngresos: number;
  aguinaldo: number;
  sobranteAnterior: number;
  totalGastos: number;
  aportesAll: number;
  aportesNoNeutros: number;
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
    if (onlyNonNeutros && !isNonNeutroPurpose(getInvestmentPurpose(inv))) continue;
    for (const mov of inv.movements) {
      if (mov.isInitial) continue;
      if (mov.pendingIngreso) continue;
      if (mov.type !== "aporte") continue;
      if (!isInRange(mov.date)) continue;
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

  const ingresosMes = ingresoFijo + otrosIngresos + aguinaldo;
  const egresosMes = totalGastos + aportesNoNeutros;

  const disponible = sobranteAnteriorRaw + ingresosMes - egresosMes;
  const resultadoDelMes = ingresosMes - egresosMes;

  return {
    ingresoFijo,
    otrosIngresos,
    aguinaldo,
    sobranteAnterior: sobranteAnteriorRaw,
    totalGastos,
    aportesAll,
    aportesNoNeutros,
    disponible,
    resultadoDelMes,
  };
}

import { getFilterDateRange } from "@/hooks/usePayPeriod";
import type { ViewMode } from "@/hooks/usePayPeriod";
import type {
  Expense,
  ExtraIncome,
  Investment,
  Transfer,
} from "@/hooks/useMoneyTracker";
import { CurrencyType } from "@/constants/investments";
import { getMovementPurpose } from "@/constants/investment-purpose";
import { parseISO, isWithinInterval } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubcategoryItem {
  name: string;
  amount: number;
}

export interface WaterfallBar {
  name: string;
  barBottom: number;
  barTop: number;
  amount: number;
  fill: string;
  subcategories: SubcategoryItem[];
}

export interface WaterfallInput {
  expenses: Expense[];
  investments: Investment[];
  salaryAmount: number;
  extraIncomes: ExtraIncome[];
  transfers: Transfer[];
  selectedMonth: string;
  viewMode: ViewMode;
  payDay: number;
  savingsEstimate: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const WATERFALL_COLORS = {
  ingresos: "#22c55e",
  gastosFijos: "#ef4444",
  gastosVariables: "#f97316",
  inversiones: "#3b82f6",
  ahorro: "#8b5cf6",
  libre: "#10b981",
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toArs(expense: Expense): number {
  return expense.currencyType === CurrencyType.USD
    ? expense.amount * expense.usdRate
    : expense.amount;
}

function toArsIncome(income: ExtraIncome): number {
  return income.currencyType === CurrencyType.USD
    ? income.amount * income.usdRate
    : income.amount;
}

function classifyExpenses(expenses: Expense[]): {
  fixed: Expense[];
  variable: Expense[];
} {
  const fixed: Expense[] = [];
  const variable: Expense[] = [];
  for (const e of expenses) {
    if (e.recurringId) {
      fixed.push(e);
    } else {
      variable.push(e);
    }
  }
  return { fixed, variable };
}

function isInRange(dateStr: string, range: { start: Date; end: Date }): boolean {
  const d = parseISO(dateStr);
  return isWithinInterval(d, { start: range.start, end: range.end });
}

/**
 * Build subcategory items grouped by name, sorted descending by amount.
 * If more than 5 items, keep top 5 and group the rest as "Otros".
 */
function buildSubcategories<T>(
  items: T[],
  getName: (item: T) => string,
  getAmount: (item: T) => number,
): SubcategoryItem[] {
  // Aggregate by name
  const map = new Map<string, number>();
  for (const item of items) {
    const name = getName(item);
    const amount = getAmount(item);
    map.set(name, (map.get(name) ?? 0) + amount);
  }

  // Sort descending by amount
  const sorted = Array.from(map.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  if (sorted.length <= 5) {
    return sorted;
  }

  const top5 = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const otrosAmount = rest.reduce((sum, item) => sum + item.amount, 0);
  return [...top5, { name: "Otros", amount: otrosAmount }];
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export function computeWaterfallData(input: WaterfallInput): WaterfallBar[] {
  const {
    expenses,
    investments,
    salaryAmount,
    extraIncomes,
    transfers,
    selectedMonth,
    viewMode,
    payDay,
    savingsEstimate,
  } = input;

  const dateRange = getFilterDateRange(selectedMonth, viewMode, payDay);

  // --- Filter expenses within date range ---
  const filteredExpenses = expenses.filter((e) => isInRange(e.date, dateRange));

  // --- Filter extra incomes within date range ---
  const filteredExtraIncomes = extraIncomes.filter((ei) =>
    isInRange(ei.date, dateRange),
  );

  // --- Initial balance from adjustment transfers within date range ---
  const initialBalanceArs = transfers
    .filter((t) => t.type === "adjustment_ars" && isInRange(t.date, dateRange))
    .reduce((sum, t) => sum + (t.amount ?? 0), 0);

  // --- Classify expenses ---
  const { fixed, variable } = classifyExpenses(filteredExpenses);

  // --- Convert to ARS ---
  const fixedTotal = fixed.reduce((sum, e) => sum + toArs(e), 0);
  const variableTotal = variable.reduce((sum, e) => sum + toArs(e), 0);

  // --- Extra incomes total ---
  const extraIncomesTotal = filteredExtraIncomes.reduce(
    (sum, ei) => sum + toArsIncome(ei),
    0,
  );

  // --- Ingresos total ---
  const ingresosTotal = salaryAmount + extraIncomesTotal + initialBalanceArs;

  // --- Investment movements (filtered by date, exclude isInitial) ---
  //
  // The "Ahorro" bar must match the Resumen card's "Aportes inversión": only
  // APORTES whose effective purpose is ahorro/especulación count. Aportes with
  // purpose tarjeta/objetivo are NEUTRAL (not savings, not an egreso) and are
  // excluded entirely. RETIROS are cash that came BACK to the wallet — they are
  // not savings, so they don't belong in the Ahorro bar; instead they flow into
  // "Libre" (added back to running below). This keeps the waterfall faithful and
  // makes Ahorro agree with the Resumen card. See quick (purpose-aware waterfall).
  let ahorroAportes = 0; // savings aportes only — the Ahorro bar amount
  let retirosCashBack = 0; // all retiros (any purpose) — return to Libre as cash
  const investmentByName = new Map<string, number>();

  for (const inv of investments) {
    let invAhorro = 0;
    for (const mov of inv.movements) {
      if (mov.isInitial) continue;
      if (mov.pendingIngreso) continue;
      if (!isInRange(mov.date, dateRange)) continue;

      const purpose = getMovementPurpose(mov, inv);

      // Movement amounts are stored in the investment's base currency.
      if (mov.type === "aporte") {
        // Only ahorro/especulación aportes are "savings"; tarjeta/objetivo are neutral.
        if (purpose === "ahorro" || purpose === "especulacion") {
          invAhorro += mov.amount;
        }
      } else {
        // Use receivedAmount when available (actual cash received may differ
        // from withdrawal amount due to exchange rate at settlement time).
        retirosCashBack += mov.receivedAmount ?? mov.amount;
      }
    }

    if (invAhorro !== 0) {
      investmentByName.set(
        inv.name,
        (investmentByName.get(inv.name) ?? 0) + invAhorro,
      );
      ahorroAportes += invAhorro;
    }
  }

  // --- Build running totals ---
  let running = ingresosTotal;

  const ingresoBar: WaterfallBar = {
    name: "Ingresos",
    barBottom: 0,
    barTop: ingresosTotal,
    amount: ingresosTotal,
    fill: WATERFALL_COLORS.ingresos,
    subcategories: buildIngresosSubcategories(
      salaryAmount,
      filteredExtraIncomes,
      initialBalanceArs,
    ),
  };

  running -= fixedTotal;
  const gastosFijosBar: WaterfallBar = {
    name: "Gastos Fijos",
    barBottom: running,
    barTop: running + fixedTotal,
    amount: fixedTotal,
    fill: WATERFALL_COLORS.gastosFijos,
    subcategories: buildSubcategories(fixed, (e) => e.name, toArs),
  };

  running -= variableTotal;
  const gastosVariablesBar: WaterfallBar = {
    name: "Gastos Variables",
    barBottom: running,
    barTop: running + variableTotal,
    amount: variableTotal,
    fill: WATERFALL_COLORS.gastosVariables,
    subcategories: buildSubcategories(variable, (e) => e.name, toArs),
  };

  // --- Retiros return as cash to "Libre" ---
  // Withdrawals are money that came back to the wallet this period, so they
  // increase what's free to use. Add them to running BEFORE carving out Ahorro.
  running += retirosCashBack;

  // --- Ahorro bar: savings aportes (ahorro/especulación) + savings target ---
  const ahorroAmount = ahorroAportes + Math.max(0, savingsEstimate);
  running -= ahorroAmount;
  const ahorroBar: WaterfallBar = {
    name: "Ahorro",
    barBottom: running,
    barTop: running + ahorroAmount,
    amount: ahorroAmount,
    fill: WATERFALL_COLORS.ahorro,
    subcategories: buildAhorroSubcategories(investmentByName, savingsEstimate),
  };

  const libreAmount = running;
  const libreBar: WaterfallBar = {
    name: "Libre",
    barBottom: Math.min(0, libreAmount),
    barTop: Math.max(0, libreAmount),
    amount: libreAmount,
    fill: WATERFALL_COLORS.libre,
    subcategories: [],
  };

  // Only include Ahorro bar if there's a savings amount
  const bars = [ingresoBar, gastosFijosBar, gastosVariablesBar];
  if (ahorroAmount > 0) {
    bars.push(ahorroBar);
  }
  bars.push(libreBar);
  return bars;
}

// ---------------------------------------------------------------------------
// Ahorro subcategories helper
// ---------------------------------------------------------------------------

function buildAhorroSubcategories(
  investmentByName: Map<string, number>,
  savingsEstimate: number,
): SubcategoryItem[] {
  const items: SubcategoryItem[] = [];

  // Add each investment contribution
  investmentByName.forEach((amount, name) => {
    if (amount > 0) items.push({ name, amount });
  });

  // Add savings rate line if nonzero
  if (savingsEstimate > 0) {
    items.push({ name: "Meta de ahorro", amount: savingsEstimate });
  }

  return items.sort((a, b) => b.amount - a.amount);
}

// ---------------------------------------------------------------------------
// Ingresos subcategories helper
// ---------------------------------------------------------------------------

function buildIngresosSubcategories(
  salaryAmount: number,
  extraIncomes: ExtraIncome[],
  initialBalanceArs: number,
): SubcategoryItem[] {
  const items: SubcategoryItem[] = [];

  if (initialBalanceArs > 0) {
    items.push({ name: "Saldo Inicial", amount: initialBalanceArs });
  }

  if (salaryAmount > 0) {
    items.push({ name: "Sueldo", amount: salaryAmount });
  }

  // Group extra incomes by name
  const extraMap = new Map<string, number>();
  for (const ei of extraIncomes) {
    const amount = toArsIncome(ei);
    extraMap.set(ei.name, (extraMap.get(ei.name) ?? 0) + amount);
  }

  extraMap.forEach((amount, name) => {
    items.push({ name, amount });
  });

  // Sort by amount descending
  items.sort((a, b) => b.amount - a.amount);

  return items;
}

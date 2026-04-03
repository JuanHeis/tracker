# Phase 15: Projection Engine - Research

**Researched:** 2026-04-03
**Domain:** Financial projection math (compound interest, linear projection, historical reconstruction), React hooks architecture
**Confidence:** HIGH

## Summary

Phase 15 is a pure computation phase: build a single hook (`useProjectionEngine`) that reads existing localStorage data (MonthlyData, salaryHistory, recurringExpenses, incomeConfig) and produces projection data series ready for chart consumption by Phase 16. No UI changes, no new localStorage keys, no schema mutations.

The math is straightforward: compound interest for investment projections, flat-line linear projection for income, and arithmetic for monthly net savings. Historical patrimony is reconstructed by iterating existing monthlyData month keys. The main complexity is orchestrating multiple data sources (investments, salary, recurring expenses, USD rate) into a coherent time-series output.

The project already decided (STATE.md): "No external math libraries -- compound interest + linear regression in ~100 lines plain TS." Growth rates come from "configurable defaults per type, NOT derived from movements." This keeps the engine simple and predictable.

**Primary recommendation:** Create a single `hooks/useProjectionEngine.ts` hook with pure helper functions for each projection type (investment compound interest, income flat line, patrimony net savings, historical reconstruction, scenario variants). All functions are pure and testable. The hook reads from existing data sources and returns typed arrays for chart consumption.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROJ-01 | User ve proyeccion de cada inversion activa con interes compuesto (PF usa TNA, otras usan rendimiento observado) | Investment interface has `tna` field for PF. For other types, use configurable default rates per type (STATE.md decision). Compound interest formula: `FV = PV * (1 + r/n)^(n*t)` with monthly compounding. See Code Examples section. |
| PROJ-02 | User puede activar "aportes futuros" por inversion -- proyecta aportes mensuales recurrentes (default: monto del ultimo aporte) | Investment.movements array is sorted by date. Last aporte amount = `movements.filter(m => m.type === "aporte").at(-1)?.amount`. Future contributions add to principal each month before compounding. See Code Examples section. |
| PROJ-03 | User ve proyeccion lineal de ingresos futuros basada en su ingreso fijo actual | salaryHistory.entries + getSalaryForMonth() already resolve current salary. Flat-line projection = repeat current amount for N future months. See Architecture Patterns. |
| PROJ-04 | Proyeccion de patrimonio deduce gastos recurrentes del ahorro mensual neto | recurringExpenses (localStorage key) has active recurring expenses with amounts. Monthly net savings = ingreso fijo - sum(active recurring amounts). See Architecture Patterns. |
| PROJ-05 | User ve patrimonio historico reconstruido mes a mes desde monthlyData en linea solida | monthlyData contains ALL historical data in a single object. Expenses and incomes have date fields (yyyy-MM-dd). Group by month, compute running patrimony. See Architecture Patterns. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Plain TypeScript | (project TS) | All projection math | STATE.md decision: "No external math libraries -- compound interest + linear regression in ~100 lines plain TS" |
| date-fns | ^4.1.0 | Month iteration, date formatting | Already installed and used throughout the project |

### Already Installed (No Changes)

| Library | Version | Purpose | Why Relevant |
|---------|---------|---------|--------------|
| recharts | ^3.8.1 | Chart rendering (Phase 16) | The hook output format must match what Recharts expects: array of objects with named keys |
| React 18 | ^18 | Hook runtime | useProjectionEngine will be a standard React hook |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain TS math | financial.js / finance-math | Overkill -- only need compound interest formula. Adding a dependency for one formula is wrong |
| Single hook | Redux slice | Project uses useLocalStorage pattern, not Redux for state. Adding Redux for projections would break consistency |
| Pure functions + hook wrapper | Class-based calculator | Project convention is functional hooks. Classes would be alien to codebase |

**Installation:**
No new packages needed.

## Architecture Patterns

### Recommended Project Structure

```
hooks/
  useProjectionEngine.ts    # Main hook: orchestrates all projections
lib/
  projection/
    compound-interest.ts    # Pure: investment projection math
    income-projection.ts    # Pure: flat-line income projection
    patrimony-history.ts    # Pure: historical patrimony reconstruction
    scenario-engine.ts      # Pure: optimista/base/pesimista variants
    types.ts                # Shared projection types
```

Alternative (simpler, fits project convention better -- all hooks are single files):

```
hooks/
  useProjectionEngine.ts    # Everything in one file (~200-300 lines)
```

**Recommendation:** Single file. The project has NO `lib/projection/` folder convention. Every hook is a single file in `hooks/`. The math is simple enough (~100 lines of pure functions + ~100 lines of hook orchestration). Split only if it exceeds 400 lines.

### Pattern 1: Investment Compound Interest Projection

**What:** Project future value of each active investment using compound interest
**When to use:** PROJ-01, PROJ-02

```typescript
// Pure function -- no React dependencies
interface InvestmentProjection {
  investmentId: string;
  investmentName: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  currentValue: number;
  monthlyContribution: number;  // 0 if aportes futuros disabled
  projectedValues: number[];    // Array indexed by future month (0 = current)
}

function projectInvestment(
  investment: Investment,
  monthlyRate: number,         // Annual rate / 12
  horizonMonths: number,
  includeContributions: boolean
): InvestmentProjection {
  const values: number[] = [investment.currentValue];
  let balance = investment.currentValue;

  // Default contribution = last aporte amount
  const lastAporte = investment.movements
    .filter(m => m.type === "aporte")
    .at(-1);
  const monthlyContribution = includeContributions && lastAporte
    ? lastAporte.amount
    : 0;

  for (let m = 1; m <= horizonMonths; m++) {
    balance = (balance + monthlyContribution) * (1 + monthlyRate);
    values.push(Math.round(balance));
  }

  return {
    investmentId: investment.id,
    investmentName: investment.name,
    type: investment.type,
    currencyType: investment.currencyType,
    currentValue: investment.currentValue,
    monthlyContribution,
    projectedValues: values,
  };
}
```

**Rate resolution per investment type:**
- **Plazo Fijo**: Use `investment.tna` (TNA percentage). Monthly rate = `tna / 100 / 365 * 30` (TNA is nominal annual, PF compounds daily but we approximate monthly)
- **FCI / Acciones / Crypto / Cuenta remunerada**: Use configurable default rates per type

### Pattern 2: Default Growth Rates Configuration

**What:** Configurable default annual growth rates per investment type
**When to use:** PROJ-01 (non-PF investments)

```typescript
// Hardcoded defaults -- NOT stored in localStorage (INFRA-03 compliance)
const DEFAULT_ANNUAL_RATES: Record<InvestmentType, number> = {
  "Plazo Fijo": 0,        // Uses TNA from investment, not this default
  "FCI": 0.05,            // 5% annual default
  "Crypto": 0.10,         // 10% annual default
  "Acciones": 0.08,       // 8% annual default
  "Cuenta remunerada": 0.02,  // 2% annual default (low yield, liquid)
};
```

**Note:** STATE.md says "configurable defaults per type." Since INFRA-03 prohibits new localStorage schema, "configurable" means constants in code that a user could change by editing config or that Phase 16 could expose via UI toggles. For Phase 15, hardcode sensible defaults as constants.

### Pattern 3: Historical Patrimony Reconstruction

**What:** Rebuild month-by-month patrimony from existing monthlyData
**When to use:** PROJ-05

The tricky part: monthlyData is a SINGLE object (not per-month). All expenses, incomes, and investments live in arrays with date strings. To reconstruct history:

1. Collect all unique months from expenses, extraIncomes, salaryHistory entries
2. For each month (chronologically), compute: salary + extraIncomes - expenses +/- investment movements +/- transfers +/- loans
3. Running cumulative balance = patrimony at that month

**Key insight from STATE.md blocker:** "Historical investment values not stored per month -- need interpolation strategy." For historical months, we only know the investment's `currentValue` (today). We do NOT know what it was worth in February. Strategy: use sum of movements (aportes - retiros) as historical investment value proxy, apply currentValue only for the latest month.

```typescript
interface HistoricalPoint {
  month: string;         // "yyyy-MM"
  patrimony: number;     // Total patrimony in ARS (USD converted at current rate)
  isHistorical: true;
}
```

### Pattern 4: Scenario Variants

**What:** Three scenarios with different growth rate multipliers
**When to use:** Success criteria #5

```typescript
interface ScenarioConfig {
  name: "optimista" | "base" | "pesimista";
  rateMultiplier: number;  // Applied to all growth rates
  savingsMultiplier: number; // Applied to monthly net savings
}

const SCENARIOS: ScenarioConfig[] = [
  { name: "optimista", rateMultiplier: 1.5, savingsMultiplier: 1.1 },
  { name: "base", rateMultiplier: 1.0, savingsMultiplier: 1.0 },
  { name: "pesimista", rateMultiplier: 0.5, savingsMultiplier: 0.8 },
];
```

### Pattern 5: Hook Output Shape (Chart-Ready)

**What:** The hook returns data arrays directly consumable by Recharts
**When to use:** All requirements

```typescript
interface ProjectionDataPoint {
  month: string;              // "Ene 26", "Feb 26" etc. for display
  monthKey: string;           // "2026-01" for internal use
  // Historical (null for future months)
  historicalPatrimony: number | null;
  // Projected (null for past months, overlaps at current month)
  proyeccionOptimista: number | null;
  proyeccionBase: number | null;
  proyeccionPesimista: number | null;
}

interface UseProjectionEngineReturn {
  // Main chart data (historical + projected patrimony)
  patrimonyData: ProjectionDataPoint[];
  // Per-investment projections
  investmentProjections: InvestmentProjection[];
  // Current month marker
  currentMonthIndex: number;
  // Summary values
  currentPatrimony: number;
  projectedPatrimony: { optimista: number; base: number; pesimista: number };
  // Config
  horizonMonths: number;
}
```

### Anti-Patterns to Avoid

- **Mutating localStorage from projection hook:** Projections are READ-ONLY. Never write to monthlyData, salaryHistory, or recurringExpenses from the projection engine.
- **Fetching live exchange rates:** Out of scope (REQUIREMENTS.md Out of Scope). Use globalUsdRate from existing useCurrencyEngine.
- **Per-investment historical value tracking:** We do NOT have historical `currentValue` snapshots. Don't try to reconstruct what we don't have. Use movement-based approximation.
- **Complex state management:** This hook should have ZERO internal state. It's a pure computation from existing data. Use `useMemo` for caching, not `useState`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month iteration | Custom date math | `date-fns` `addMonths`, `format`, `parse` | Already used throughout project, handles edge cases (month boundaries, leap years) |
| Number formatting | Custom formatters | Existing pattern from resumen-card.tsx (`.toLocaleString("es-AR")`) | Consistency with existing UI |

**Key insight:** The actual math IS hand-rolled (compound interest formula) because it's trivial (~5 lines). The complexity is in data orchestration, not math.

## Common Pitfalls

### Pitfall 1: Plazo Fijo TNA Calculation

**What goes wrong:** TNA (Tasa Nominal Anual) is NOT the effective annual rate. PF compounds daily in Argentina.
**Why it happens:** Confusing TNA with TEA (Tasa Efectiva Anual).
**How to avoid:** For monthly projection: `monthlyRate = (1 + tna/100/365)^30 - 1`. This converts daily-compounding TNA to a monthly effective rate.
**Warning signs:** Projected PF values significantly different from what banks show.

### Pitfall 2: Currency Mixing in Patrimony

**What goes wrong:** Adding ARS and USD amounts without conversion produces meaningless totals.
**Why it happens:** Investments can be ARS or USD. Patrimony must be a single number.
**How to avoid:** Convert ALL USD values to ARS using `globalUsdRate` before summing. Add a visible disclaimer (Phase 16 responsibility, but the hook should do the conversion).
**Warning signs:** Patrimony changes wildly when USD rate changes.

### Pitfall 3: Double-Counting Investment Values

**What goes wrong:** Counting both investment `currentValue` AND liquid balance impact from movements.
**Why it happens:** Investment aportes reduce liquid ARS. The currentValue is the investment's worth. These are separate.
**How to avoid:** Patrimony = liquid ARS + liquid USD * rate + sum(investment currentValues). Don't add movement amounts on top.
**Warning signs:** Patrimony inflated by 2x investment values.

### Pitfall 4: Empty Data Edge Cases

**What goes wrong:** Division by zero, empty arrays, no salary history.
**Why it happens:** New user with minimal data, or user skipped wizard steps.
**How to avoid:** Default to 0 for missing salary, empty array for no investments, guard against empty monthlyData. The hook should return valid (empty) data even with zero history.
**Warning signs:** NaN or Infinity in projected values.

### Pitfall 5: Stale Historical Reconstruction

**What goes wrong:** Historical patrimony reconstruction produces different values than what resumen-card shows for the current month.
**Why it happens:** Using different calculation logic than `calculateDualBalances()`.
**How to avoid:** Reuse the SAME calculation approach as `calculateDualBalances()` (from useMoneyTracker) but parameterized per month. Extract the core logic into a pure function if needed.
**Warning signs:** Current month historical value != current patrimony shown in UI.

### Pitfall 6: Recurring Expense Projection Mismatch

**What goes wrong:** Projecting monthly expenses based on current recurring list, but not accounting for paused/cancelled status.
**Why it happens:** Not filtering by `status === "Activa"`.
**How to avoid:** Only sum recurring expenses where `status === "Activa"` for future projections.
**Warning signs:** Projected expenses include paused subscriptions.

## Code Examples

### Compound Interest with Monthly Contributions

```typescript
/**
 * Project future value with compound interest and optional monthly contributions.
 * Contribution is added at the START of each month (before interest).
 */
function compoundGrowth(
  principal: number,
  monthlyRate: number,
  months: number,
  monthlyContribution: number = 0
): number[] {
  const values: number[] = [principal];
  let balance = principal;
  for (let i = 1; i <= months; i++) {
    balance = (balance + monthlyContribution) * (1 + monthlyRate);
    values.push(Math.round(balance));
  }
  return values;
}
```

### PF Monthly Rate from TNA

```typescript
/**
 * Convert TNA (Tasa Nominal Anual) to monthly effective rate.
 * Argentine PFs compound daily: TEA = (1 + TNA/365)^365 - 1
 * Monthly: (1 + TNA/365)^30 - 1
 */
function pfMonthlyRate(tnaPercent: number): number {
  return Math.pow(1 + tnaPercent / 100 / 365, 30) - 1;
}
```

### Monthly Net Savings Estimate

```typescript
function estimateMonthlyNetSavings(
  currentSalary: number,
  activeRecurringExpenses: RecurringExpense[]
): number {
  const totalRecurring = activeRecurringExpenses
    .filter(r => r.status === "Activa" && r.currencyType === CurrencyType.ARS)
    .reduce((sum, r) => sum + r.amount, 0);
  return Math.max(0, currentSalary - totalRecurring);
}
```

### Historical Month Iteration

```typescript
import { addMonths, format, parse } from "date-fns";

function getHistoricalMonths(monthlyData: MonthlyData): string[] {
  const months = new Set<string>();

  // Collect all months with activity
  monthlyData.expenses.forEach(e => months.add(e.date.substring(0, 7)));
  monthlyData.extraIncomes.forEach(i => months.add(i.date.substring(0, 7)));
  (monthlyData.investments || []).forEach(inv =>
    inv.movements.forEach(m => months.add(m.date.substring(0, 7)))
  );

  return Array.from(months).sort();
}
```

## Data Source Mapping

Critical for the planner -- which localStorage keys feed which projections:

| Projection | Data Source | localStorage Key | Access Pattern |
|------------|-----------|-----------------|----------------|
| Investment compound interest | Investment[] (active, with currentValue + tna) | `monthlyData` → `.investments` | Read via useMoneyTracker |
| Future contributions | InvestmentMovement[] (last aporte amount) | `monthlyData` → `.investments[].movements` | Read via useMoneyTracker |
| Income flat line | SalaryHistory.entries + incomeConfig | `salaryHistory`, `incomeConfig` | Read via useSalaryHistory |
| Recurring expense deduction | RecurringExpense[] (active) | `recurringExpenses` | Read via useRecurringExpenses |
| Historical patrimony | All of MonthlyData (expenses, incomes, investments, transfers, loans) | `monthlyData` | Read via useMoneyTracker |
| USD conversion | globalUsdRate | `globalUsdRate` | Read via useCurrencyEngine |
| Scenario variants | Computed from base projections | None (pure math) | N/A |

## Key Codebase Facts

These are verified facts from reading the codebase that the planner needs:

1. **Investment.tna exists** as optional `number` on the Investment interface (confirmed in useMoneyTracker.ts line 75). Only present for Plazo Fijo.
2. **Investment.plazoDias exists** as optional `number` (line 76). Relevant for PF maturity but NOT needed for continuous projection.
3. **Investment.isLiquid** flag exists (line 73). Liquid investments count as cash, not as investments in patrimony. The projection engine must handle this distinction.
4. **InvestmentMovement.isInitial** flag exists (line 60). Initial wizard movements should be excluded from "last aporte" calculation for PROJ-02.
5. **MonthlyData is a SINGLE object** -- not keyed by month. All data lives in one localStorage entry. Historical reconstruction must filter by date.
6. **salaryHistory** is a separate localStorage key with `{ entries: SalaryEntry[] }`.
7. **recurringExpenses** is a separate localStorage key with `RecurringExpense[]`.
8. **globalUsdRate** is stored as a separate localStorage key (number).
9. **INVESTMENT_TYPES** = `["Plazo Fijo", "FCI", "Crypto", "Acciones", "Cuenta remunerada"]` -- 5 types total.
10. **calculateDualBalances()** in useMoneyTracker.ts (line 351-525) is the authoritative patrimony calculation. Historical reconstruction should mirror its logic.

## Open Questions

1. **Aportes futuros toggle storage**
   - What we know: PROJ-02 says user "puede activar" aportes futuros per investment
   - What's unclear: Where is this toggle stored? INFRA-03 says zero changes to localStorage interfaces
   - Recommendation: Store as in-memory state within the projection hook (not persisted). Default: off. This is a projection parameter, not financial data. Alternatively, pass as a parameter from the chart UI (Phase 16).

2. **Horizon months default**
   - What we know: CHART-04 (Phase 16) says user can select 3, 6, 12, 24 months
   - What's unclear: What should the default be in Phase 15?
   - Recommendation: Default to 12 months. The hook should accept `horizonMonths` as parameter.

3. **Historical patrimony depth**
   - What we know: Need to reconstruct from monthlyData
   - What's unclear: How far back? All available data, or capped?
   - Recommendation: All available months. The data is finite (user-entered only) and won't be performance-heavy.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `hooks/useMoneyTracker.ts` -- Investment interface, MonthlyData interface, calculateDualBalances()
- Codebase inspection: `hooks/useInvestmentsTracker.ts` -- Investment CRUD operations, PF fields
- Codebase inspection: `hooks/useSalaryHistory.ts` -- SalaryEntry, getSalaryForMonth()
- Codebase inspection: `hooks/useRecurringExpenses.ts` -- RecurringExpense interface, status filtering
- Codebase inspection: `constants/investments.ts` -- INVESTMENT_TYPES, CurrencyType, CURRENCY_ENFORCEMENT
- Codebase inspection: `components/charts/projection-skeleton.tsx` -- Phase 14 chart pattern (ComposedChart + Line)

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` -- Project decisions on growth rates and math approach
- `.planning/REQUIREMENTS.md` -- PROJ-01 through PROJ-05 specifications

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed, plain TS math confirmed by project decision
- Architecture: HIGH - Hook pattern matches existing codebase, data sources fully mapped
- Pitfalls: HIGH - All identified from actual codebase reading (currency mixing, PF TNA, empty data)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable -- no external dependencies to change)

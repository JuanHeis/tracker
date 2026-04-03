# Phase 15: Projection Engine - Research

**Researched:** 2026-04-03
**Domain:** Financial projection math (compound interest, linear projection, historical reconstruction), React hooks architecture
**Confidence:** HIGH

## Summary

Phase 15 is a pure computation phase: build all projection math and data orchestration as pure TypeScript functions exposed through a single `useProjectionEngine` hook. No UI rendering beyond what Phase 14 already established. The hook reads existing localStorage data (MonthlyData, salaryHistory, recurringExpenses, globalUsdRate, incomeConfig) in a strictly read-only manner and outputs projection data series ready for chart consumption in Phase 16.

The math is straightforward: compound interest for investments, flat-line projection for income, monthly net savings minus recurring expenses for patrimony growth, and three scenario variants with different growth rate assumptions. No external math libraries needed -- all formulas are standard compound interest (`FV = PV * (1 + r/n)^(nt)`) and arithmetic in ~200 lines of plain TypeScript.

The key design challenge is historical patrimony reconstruction: since per-month investment values are NOT stored (only current value + movements), historical patrimony must be reconstructed from movements, expenses, incomes, and salary history on a month-by-month basis using the same logic as `calculateDualBalances()`.

**Primary recommendation:** Create a `lib/projection-engine.ts` with pure functions for each projection type, plus a `hooks/useProjectionEngine.ts` hook that orchestrates data reads and returns chart-ready data series. All functions must be pure (inputs in, outputs out) for testability.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROJ-01 | User ve proyeccion de cada inversion activa con interes compuesto (PF usa TNA, otras usan rendimiento observado) | Investment interface has `tna` field for PF. For other types, use configurable default rates per type (STATE.md decision: "Growth rates from configurable defaults per type, NOT derived from movements"). Compound interest formula with monthly compounding. See Code Examples. |
| PROJ-02 | User puede activar "aportes futuros" por inversion -- proyecta aportes mensuales recurrentes (default: monto del ultimo aporte) | Investment.movements array available. Last non-initial aporte = `movements.filter(m => m.type === "aporte" && !m.isInitial).at(-1)?.amount`. Toggle state lives in hook (not persisted -- INFRA-03 compliance). See Architecture Patterns: Future Contributions. |
| PROJ-03 | User ve proyeccion lineal de ingresos futuros basada en su ingreso fijo actual | SalaryHistory + getSalaryForMonth() already exist and resolve current salary correctly. Income projection = flat line at current salary for N months. See Architecture Patterns. |
| PROJ-04 | Proyeccion de patrimonio deduce gastos recurrentes del ahorro mensual neto | RecurringExpense[] available from localStorage key "recurringExpenses". Sum active recurring amounts = monthly outflow. Net savings = salary - recurring expenses. See Architecture Patterns. |
| PROJ-05 | User ve patrimonio historico reconstruido mes a mes desde monthlyData en linea solida | monthlyData contains ALL historical data in a single object. Expenses, incomes, investments with dates. Must iterate months and compute running patrimony mirroring calculateDualBalances() logic. See Architecture Patterns: Historical Patrimony. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Plain TypeScript | (project TS) | All projection math | STATE.md decision: "No external math libraries -- compound interest + linear regression in ~100 lines plain TS" |
| date-fns | ^4.1.0 | Month iteration, date math | Already installed and used throughout the project |

### Already Installed (No Changes)

| Library | Version | Purpose | Why Relevant |
|---------|---------|---------|--------------|
| recharts | ^3.8.1 | Chart rendering (Phase 16) | Hook output format must match Recharts expectations: array of objects with named keys |
| React 18 | ^18 | Hook runtime | useProjectionEngine is a standard React hook with useMemo |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain TS math | financial.js / mathjs | Overkill -- only need compound interest formula. One dependency for one formula is wrong |
| Pure functions in lib/ | Everything inline in hook | Pure functions are testable without React. Hook is just orchestration glue |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure

```
lib/
  projection-engine.ts       # Pure functions: all projection math + types
hooks/
  useProjectionEngine.ts     # Hook: reads data, calls pure functions, returns chart-ready series
```

**Why two files instead of one:** The project has `lib/utils.ts` already. Pure math functions with zero React dependency belong in `lib/`. The hook in `hooks/` orchestrates data reads and memoization. This separation enables testing the math without React test infrastructure.

### Pattern 1: Investment Compound Interest Projection (PROJ-01)

**What:** Project each active investment forward using compound interest.
**Rate resolution per investment type:**
- **Plazo Fijo:** Use `investment.tna` (TNA percentage). Monthly rate = `(1 + tna/100/365)^30 - 1` (PF compounds daily in Argentina).
- **FCI / Acciones / Crypto / Cuenta remunerada:** Use configurable default annual rates per type. Monthly rate = `annualRate / 12`.

```typescript
// Default annual rates (decimal). PF uses its own TNA, so 0 here.
const DEFAULT_ANNUAL_RATES: Record<InvestmentType, ScenarioRates> = {
  "Plazo Fijo":        { base: 0, optimista: 0, pesimista: 0 }, // Uses TNA
  "FCI":               { base: 0.40, optimista: 0.60, pesimista: 0.20 },
  "Crypto":            { base: 0.15, optimista: 0.40, pesimista: -0.10 },
  "Acciones":          { base: 0.12, optimista: 0.25, pesimista: -0.05 },
  "Cuenta remunerada": { base: 0.35, optimista: 0.45, pesimista: 0.25 },
};
```

**Note on rates:** These defaults reflect Argentine 2025-2026 market context (high nominal rates). They are hardcoded constants. "Editor custom de parametros de escenarios" is explicitly out of scope per REQUIREMENTS.md.

### Pattern 2: Future Contributions Toggle (PROJ-02)

**What:** Per-investment toggle that adds monthly contributions to compound growth.
**Default amount:** Last non-initial aporte in the movements array.
**State storage:** In-memory `useState` within useProjectionEngine (NOT persisted to localStorage -- INFRA-03).

```typescript
function getLastAporteAmount(investment: Investment): number {
  const aportes = investment.movements
    .filter(m => m.type === "aporte" && !m.isInitial);
  if (aportes.length === 0) return 0;
  return aportes[aportes.length - 1].amount;
}
```

### Pattern 3: Income Projection (PROJ-03)

**What:** Flat line at current ingreso fijo extended forward.
**Data source:** `getSalaryForMonth(currentMonth, salaryHistory.entries, salaryOverrides)` returns current salary.

```typescript
function projectIncome(
  currentSalary: number,
  horizonMonths: number,
  startMonth: string,  // "yyyy-MM"
): Array<{ month: string; amount: number }> {
  const points: Array<{ month: string; amount: number }> = [];
  let cursor = parse(startMonth, "yyyy-MM", new Date());
  for (let i = 0; i < horizonMonths; i++) {
    cursor = addMonths(cursor, 1);
    points.push({ month: format(cursor, "yyyy-MM"), amount: currentSalary });
  }
  return points;
}
```

### Pattern 4: Patrimony Projection with Scenarios (PROJ-04)

**What:** Monthly net savings + investment growth drives patrimony forward.
**Three scenarios affect ONLY investment growth rates, not income or expenses.**

```typescript
function monthlyNetSavings(
  currentSalary: number,
  recurringExpenses: RecurringExpense[],
  globalUsdRate: number,
): number {
  const totalRecurring = recurringExpenses
    .filter(r => r.status === "Activa")
    .reduce((sum, r) => {
      if (r.currencyType === CurrencyType.USD) return sum + r.amount * globalUsdRate;
      return sum + r.amount;
    }, 0);
  return Math.max(0, currentSalary - totalRecurring);
}
```

Patrimony at month N = Patrimony at month N-1 + net savings + investment growth for that month.

### Pattern 5: Historical Patrimony Reconstruction (PROJ-05)

**What:** Iterate all months with data in monthlyData and compute patrimony for each.
**Strategy:** Mirror the logic of `calculateDualBalances()` (lines 351-525 of useMoneyTracker.ts) but parameterized per month.

Key points:
1. Find the earliest month with any data (expense date, income date, salary entry, investment movement).
2. For each month from earliest to current month:
   - Salary: resolve via `getSalaryForMonth(monthKey, salaryHistory, overrides)`
   - Expenses: filter `expenses.filter(e => e.date.startsWith(monthKey))`
   - Extra incomes: filter by month
   - Investment movements: filter by month, separate ARS/USD
   - Transfers: filter by month
   - Loans: filter by month
3. Compute cumulative running balances (ARS liquid, USD liquid, investment capital deployed).
4. For the CURRENT month only: replace investment capital deployed with actual `currentValue` sums.
5. Total patrimony = ARS liquid + (USD liquid * globalUsdRate) + investment value.

**Simplification for isLiquid investments:** Liquid investments (`isLiquid: true`) add their currentValue to liquid balance, not investment balance -- matching calculateDualBalances() behavior.

### Pattern 6: Hook Output Shape (Chart-Ready)

```typescript
export interface ProjectionPoint {
  month: string;              // "yyyy-MM"
  label: string;              // "Ene 26" for chart display
  historico: number | null;   // null for future months
  base: number | null;        // null for past months (except overlap at current)
  optimista: number | null;
  pesimista: number | null;
}

export interface InvestmentProjection {
  investmentId: string;
  investmentName: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  currentValue: number;
  points: Array<{
    month: string;
    base: number;
    optimista: number;
    pesimista: number;
  }>;
}

export interface ProjectionConfig {
  horizonMonths: number;
  futureContributions: Record<string, boolean>;
  contributionAmounts: Record<string, number>;
}

export interface UseProjectionEngineReturn {
  // Main patrimony series (historical + projected)
  patrimonyData: ProjectionPoint[];
  // Per-investment projections
  investmentProjections: InvestmentProjection[];
  // Income projection
  incomeProjection: Array<{ month: string; amount: number }>;
  // Summary values
  currentPatrimony: number;
  monthlyNetSavings: number;
  // Config state + setters
  config: ProjectionConfig;
  setHorizon: (months: number) => void;
  toggleContributions: (investmentId: string) => void;
  setContributionAmount: (investmentId: string, amount: number) => void;
}
```

### Anti-Patterns to Avoid

- **Mutating localStorage:** INFRA-03 is absolute. The projection engine reads data only. Zero writes to monthlyData, salaryHistory, recurringExpenses, or any existing key.
- **Storing projection results:** Projections are derived on every render via useMemo. Never persist them.
- **Computing inside chart components:** All math in the hook/lib. Chart components (Phase 16) receive data arrays only.
- **Using investment.currentValue for historical months:** currentValue is today's snapshot. Historical months must use movement-based capital (sum of aportes - retiros up to that month).
- **Treating TNA as monthly rate:** TNA is annual nominal. Must convert: monthly effective = `(1 + TNA/100/365)^30 - 1`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month iteration | Manual string math | `date-fns` addMonths, format, parse | Already in project, handles edge cases |
| Salary resolution | Custom lookup | `getSalaryForMonth()` from useSalaryHistory.ts | Already exists, handles overrides correctly |
| Number formatting | Custom formatters | `.toLocaleString("es-AR")` pattern from existing components | Consistency with existing UI |

**Key insight:** The only genuinely complex computation is historical patrimony reconstruction. Even that is just iterating months and summing known quantities -- it's tedious, not algorithmically difficult.

## Common Pitfalls

### Pitfall 1: Plazo Fijo TNA vs Monthly Rate
**What goes wrong:** Using `tna` directly as monthly rate produces absurdly inflated projections.
**Why it happens:** TNA is "Tasa Nominal Anual" as a percentage. E.g., TNA 75% means 0.75 annual, but daily-compounding.
**How to avoid:** Monthly rate = `Math.pow(1 + tna / 100 / 365, 30) - 1`. For TNA 75%, monthly effective is ~6.4%.
**Warning signs:** A 1M ARS Plazo Fijo projecting to 100M+ in 12 months.

### Pitfall 2: Currency Mixing in Patrimony
**What goes wrong:** Adding ARS amounts and USD amounts without conversion.
**Why it happens:** Investments can be ARS or USD. Patrimony must be a single number.
**How to avoid:** Convert ALL USD values to ARS using `globalUsdRate` before summing. The hook does the conversion; charts display in ARS.
**Warning signs:** Patrimony changes wildly when USD rate changes (expected but should show disclaimer).

### Pitfall 3: isInitial Movements in Last Aporte
**What goes wrong:** Counting wizard-loaded initial movements as regular aportes for PROJ-02 defaults.
**Why it happens:** `isInitial: true` movements are wizard patrimony entries, not real monthly contributions.
**How to avoid:** Filter out `isInitial === true` when finding the last aporte.
**Warning signs:** Huge default monthly contribution amount matching initial capital.

### Pitfall 4: isLiquid Investment Double-Counting
**What goes wrong:** Liquid investments counted both as cash AND as investments in patrimony.
**Why it happens:** `calculateDualBalances()` adds isLiquid investment currentValue to arsBalance/usdBalance, NOT to arsInvestments/usdInvestments.
**How to avoid:** Mirror the same logic: isLiquid investments go to liquid balance, not investment total.
**Warning signs:** Patrimony inflated by the value of Cuenta remunerada investments.

### Pitfall 5: Negative Compound Growth
**What goes wrong:** Pessimistic scenario with negative rate (e.g., -10% Crypto) can reduce value below zero.
**Why it happens:** `(1 + r)^n` where r is negative approaches zero for large n.
**How to avoid:** Clamp projected values to >= 0 with `Math.max(0, value)`.

### Pitfall 6: Empty Data Edge Cases
**What goes wrong:** Division by zero, NaN, empty arrays when user has minimal data.
**Why it happens:** New user, skipped wizard steps, no salary history, no investments.
**How to avoid:** Default to 0 for missing salary. Return empty arrays for no investments. Guard every division. The hook must return valid (empty) data even with zero history.
**Warning signs:** NaN or Infinity in projected values.

### Pitfall 7: Historical Patrimony vs Current Month Mismatch
**What goes wrong:** Reconstructed patrimony for current month differs from what resumen-card shows.
**Why it happens:** Using different calculation logic than `calculateDualBalances()`.
**How to avoid:** The historical reconstruction must produce a value for the current month that matches the actual patrimony displayed in the UI. This is the "seam" point -- validate it.
**Warning signs:** Historical line's last point doesn't connect to projected line's first point.

## Code Examples

### Compound Interest with Monthly Contributions

```typescript
/**
 * Future value with compound interest + optional monthly contributions.
 * Returns array of values per month (index 0 = current, 1 = month 1, etc.)
 */
function compoundGrowth(
  principal: number,
  monthlyRate: number,
  months: number,
  monthlyContribution: number = 0,
): number[] {
  const values: number[] = [principal];
  let balance = principal;
  for (let i = 1; i <= months; i++) {
    balance = (balance + monthlyContribution) * (1 + monthlyRate);
    values.push(Math.max(0, Math.round(balance)));
  }
  return values;
}
```

### PF Monthly Rate from TNA

```typescript
/**
 * Convert TNA (Tasa Nominal Anual, percentage) to monthly effective rate.
 * Argentine PFs compound daily: monthly = (1 + TNA/100/365)^30 - 1
 */
function pfMonthlyRate(tnaPercent: number): number {
  if (!tnaPercent || tnaPercent <= 0) return 0;
  return Math.pow(1 + tnaPercent / 100 / 365, 30) - 1;
}
```

### Future Value Formula (Closed-Form with Annuity)

```typescript
/**
 * Single future value calculation (no intermediate points).
 * FV = PV * (1+r)^n + PMT * [((1+r)^n - 1) / r]
 */
function futureValue(
  principal: number,
  monthlyRate: number,
  months: number,
  monthlyContribution: number = 0,
): number {
  if (monthlyRate === 0) return principal + monthlyContribution * months;
  const growth = Math.pow(1 + monthlyRate, months);
  const fv = principal * growth + monthlyContribution * ((growth - 1) / monthlyRate);
  return Math.max(0, Math.round(fv));
}
```

### Historical Month Discovery

```typescript
function getEarliestMonth(monthlyData: MonthlyData, salaryHistory: SalaryEntry[]): string {
  const months: string[] = [];
  
  monthlyData.expenses.forEach(e => months.push(e.date.substring(0, 7)));
  monthlyData.extraIncomes.forEach(i => months.push(i.date.substring(0, 7)));
  (monthlyData.investments || []).forEach(inv =>
    inv.movements.forEach(m => months.push(m.date.substring(0, 7)))
  );
  (monthlyData.transfers || []).forEach(t => months.push(t.date.substring(0, 7)));
  (monthlyData.loans || []).forEach(l => months.push(l.date.substring(0, 7)));
  salaryHistory.forEach(e => months.push(e.effectiveDate.substring(0, 7)));

  if (months.length === 0) return format(new Date(), "yyyy-MM");
  return months.sort()[0];
}
```

## Data Source Mapping

Which localStorage keys feed which projections (planner must ensure all are read):

| Projection | Data Source | localStorage Key | Access Pattern |
|------------|-----------|-----------------|----------------|
| Investment compound interest | Investment[] (active, currentValue + tna) | `monthlyData` -> `.investments` | Read via useMoneyTracker |
| Future contributions | InvestmentMovement[] (last aporte) | `monthlyData` -> `.investments[].movements` | Read via useMoneyTracker |
| Income flat line | SalaryHistory.entries + IncomeConfig | `salaryHistory`, `incomeConfig` | Read via useSalaryHistory |
| Recurring expense deduction | RecurringExpense[] (active) | `recurringExpenses` | Read via useRecurringExpenses |
| Historical patrimony | All of MonthlyData | `monthlyData` | Read via useMoneyTracker |
| USD conversion | globalUsdRate | `globalUsdRate` | Read via useCurrencyEngine |
| Scenario variants | Computed from base projections | None (pure math) | N/A |

## Key Codebase Facts

Verified facts from reading the codebase:

1. **Investment.tna** exists as optional `number` (useMoneyTracker.ts line 75). Only present for Plazo Fijo.
2. **Investment.plazoDias** exists as optional `number` (line 76). Relevant for PF maturity but not needed for continuous projection.
3. **Investment.isLiquid** flag exists (line 73). Liquid investments count as cash in patrimonio, not as separate investments.
4. **InvestmentMovement.isInitial** flag exists (line 60). Must be excluded from "last aporte" for PROJ-02.
5. **MonthlyData is a SINGLE object** (not per-month). All data in one localStorage entry. Historical reconstruction must filter by date.
6. **salaryHistory** is a separate localStorage key: `{ entries: SalaryEntry[] }`.
7. **recurringExpenses** is a separate localStorage key: `RecurringExpense[]`.
8. **globalUsdRate** is a separate localStorage key (number).
9. **INVESTMENT_TYPES** = `["Plazo Fijo", "FCI", "Crypto", "Acciones", "Cuenta remunerada"]` (5 types).
10. **calculateDualBalances()** in useMoneyTracker.ts (lines 351-525) is the authoritative patrimony calculation. Historical reconstruction MUST mirror its logic.
11. **Projection skeleton** (`components/charts/projection-skeleton.tsx`) already exists from Phase 14 with `ComposedChart` + `Line` pattern using mock data.
12. **RecurringExpense.currencyType** can be USD -- must convert at globalUsdRate when summing for net savings.

## Open Questions

1. **Aportes futuros toggle storage**
   - What we know: PROJ-02 says user "puede activar" per investment. INFRA-03 prohibits localStorage changes.
   - What's unclear: Should toggle persist across sessions?
   - Recommendation: In-memory `useState` in the hook. Not persisted. Default: all OFF. This is a projection parameter, not financial data.

2. **Default annual rates exactness**
   - What we know: Rates are hardcoded constants (no custom editor per REQUIREMENTS.md out-of-scope).
   - What's unclear: Exact percentages for FCI/Crypto/Acciones/Cuenta remunerada in Argentine context.
   - Recommendation: Use reasonable defaults (listed above). These are projection assumptions, not promises. Phase 16 will show them with disclaimers.

3. **Historical patrimony depth**
   - What we know: Need to reconstruct from all monthlyData.
   - What's unclear: Performance with many months of data.
   - Recommendation: Process all available months. Data is user-entered and finite. Memoize with useMemo.

## Sources

### Primary (HIGH confidence)
- Codebase: `hooks/useMoneyTracker.ts` -- Investment, MonthlyData, calculateDualBalances()
- Codebase: `hooks/useInvestmentsTracker.ts` -- Investment CRUD, PF fields
- Codebase: `hooks/useSalaryHistory.ts` -- SalaryEntry, getSalaryForMonth()
- Codebase: `hooks/useRecurringExpenses.ts` -- RecurringExpense interface
- Codebase: `constants/investments.ts` -- INVESTMENT_TYPES, CurrencyType
- Codebase: `hooks/useCurrencyEngine.ts` -- globalUsdRate storage pattern
- Codebase: `components/charts/projection-skeleton.tsx` -- Phase 14 chart pattern
- `.planning/STATE.md` -- Design decisions (rates, no external math libs)
- `.planning/REQUIREMENTS.md` -- PROJ-01 through PROJ-05, INFRA-03, out-of-scope items

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries, pure TS math confirmed by project decision
- Architecture: HIGH - Two-file pattern (lib/ + hooks/) matches existing codebase conventions
- Pitfalls: HIGH - All identified from actual codebase reading (TNA conversion, isInitial, isLiquid, currency mixing)
- Historical reconstruction: MEDIUM - Approach is sound but involves approximation for historical investment values

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable -- no external dependencies to change)

# Phase 20: Waterfall Chart - Research

**Researched:** 2026-04-11
**Domain:** Recharts waterfall chart with financial data aggregation (React/TypeScript)
**Confidence:** HIGH

## Summary

Phase 20 builds a waterfall chart showing how monthly income flows through expense categories to arrive at free cash. The implementation follows a three-layer pattern already established in the codebase (pure function + hook + component): `computeWaterfallData()` in `lib/projection/`, `useMonthlyFlowData()` in `hooks/`, and `WaterfallChart` component in `components/charts/`.

Recharts 3.8.1 (already installed) supports range-value bars via a function dataKey that returns `[low, high]` arrays. This is the correct pattern for waterfall charts (decision D-11 explicitly forbids the transparent-floor stacking hack). Each bar spans an exact Y-axis range, with `Cell` components providing per-bar coloring. A custom tooltip component will display subcategory breakdowns (top 5 + "Otros").

**Primary recommendation:** Build `computeWaterfallData()` as a pure function first, fully tested with vitest, then wrap in a thin hook, then build the chart component last. No new dependencies needed -- Recharts `Bar`, `Cell`, `BarChart`, and `ChartTooltip` already in use.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Vertical bar orientation -- classic waterfall chart with bars left-to-right: Ingresos, Gastos Fijos, Gastos Variables, Inversiones, Libre
- **D-02:** Semantic financial color scheme: green for ingresos, red/orange tones for gastos (fijos vs variables distinguished by shade), blue for inversiones, emerald/light-green for libre
- **D-03:** No connectors between bars -- clean floating bars with [start, end] range-value pattern
- **D-04:** Tooltip on hover shows subcategory detail per segment (reuses existing Recharts tooltip pattern)
- **D-05:** Top 5 subcategories by amount displayed in tooltip, remaining grouped as "Otros ($X)"
- **D-06:** Tooltips on hover + entry animation (bars grow from 0 to final value)
- **D-07:** Uses existing global selectedMonth/selectedYear from expense-tracker.tsx -- no additional month selector
- **D-08:** Fixed expenses classified by presence of `recurringId` on the expense object; all others are variable
- **D-09:** USD expenses converted to ARS using each transaction's own `expense.usdRate`
- **D-10:** Exclude `isInitial` investment movements from waterfall aggregation
- **D-11:** Recharts waterfall uses `[start, end]` range-value pattern per bar (NOT transparent-floor stacking hack)

### Claude's Discretion
- Exact color hex values for each segment (within the semantic scheme)
- Tooltip component styling and formatting
- Animation duration and easing
- How to handle months with zero income or zero expenses (empty segments)
- Bar width and spacing

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLOW-01 | User sees waterfall chart: ingresos -> gastos fijos -> gastos variables -> inversiones -> libre | Recharts BarChart with range-value `[start, end]` dataKey pattern, 5-bar layout with computed running totals |
| FLOW-02 | Gastos fijos classified by `recurringId` present on expense | `Expense.recurringId` field verified on type definition (line 59 of useMoneyTracker.ts); filter `expense.recurringId != null` |
| FLOW-03 | Each segment shows subcategory breakdown | Custom tooltip component with per-bar `subcategories` array in data; top 5 by amount + "Otros" grouping (D-05) |
| FLOW-04 | Waterfall updates when user adds new expense | React reactivity -- `monthlyData.expenses` array updates trigger recalculation via `useMemo` in hook; no special mechanism needed |
| FLOW-05 | USD expenses converted using each transaction's `expense.usdRate` | Per-expense conversion: `expense.currencyType === "USD" ? expense.amount * expense.usdRate : expense.amount` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.1 | Chart rendering | Already installed, all project charts use it [VERIFIED: package.json + npm registry] |
| react | ^18 | UI framework | Already installed [VERIFIED: package.json] |
| date-fns | ^4.1.0 | Date parsing/filtering for month scoping | Already installed, used throughout codebase [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @/components/ui/chart | n/a (shadcn/ui) | ChartContainer, ChartTooltip wrappers | Mandatory for all charts (INFRA-02) [VERIFIED: codebase] |
| vitest | 4.1.2 | Unit testing `computeWaterfallData()` | Pure function testing [VERIFIED: vitest --version] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Range-value `[start, end]` | Transparent floor stacking | Explicitly forbidden by D-11; transparent stacking breaks with negative values and is fragile |
| Custom tooltip | ChartTooltipContent default | Default cannot show subcategory breakdown; custom content renderer needed for FLOW-03 |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
  projection/
    waterfall.ts           # computeWaterfallData() pure function
    waterfall.test.ts      # vitest unit tests
hooks/
  useMonthlyFlowData.ts    # Thin hook wrapping computeWaterfallData with useMemo
components/
  charts/
    waterfall-chart.tsx     # WaterfallChart component (props-only)
    waterfall-tooltip.tsx   # Custom tooltip content for subcategory breakdown
```

### Pattern 1: Three-Layer Architecture (pure function + hook + component)
**What:** Established project pattern: pure computation function in `lib/projection/`, hook in `hooks/`, UI component in `components/`.
**When to use:** All chart features in this codebase.
**Example:**
```typescript
// Source: lib/projection/savings-rate.ts (existing pattern)
// Layer 1: Pure function (testable, no React)
export function computeWaterfallData(input: WaterfallInput): WaterfallBar[] { ... }

// Layer 2: Hook (thin React wrapper with useMemo)
export function useMonthlyFlowData(
  expenses: Expense[],
  investments: Investment[],
  salaryAmount: number,
  extraIncomes: ExtraIncome[],
  selectedMonth: string,
  viewMode: ViewMode,
  payDay: number,
): WaterfallBar[] {
  return useMemo(
    () => computeWaterfallData({ expenses, investments, salaryAmount, extraIncomes, selectedMonth, viewMode, payDay }),
    [expenses, investments, salaryAmount, extraIncomes, selectedMonth, viewMode, payDay]
  );
}

// Layer 3: Component (props-only, Phase 21 consumes this)
export function WaterfallChart({ data }: { data: WaterfallBar[] }) { ... }
```
[VERIFIED: matches savings-rate.ts -> useSavingsRate -> SavingsRateSelector pattern in codebase]

### Pattern 2: Recharts Range-Value Bar
**What:** Bar component with a function `dataKey` that returns `[low, high]` tuple, combined with `Cell` for per-bar colors.
**When to use:** Waterfall charts where bars float at specific Y-axis positions.
**Example:**
```typescript
// Source: Recharts GitHub issue #7010, verified with Recharts 3.8.1 type definitions
interface WaterfallBar {
  name: string;
  barBottom: number;   // Y-axis lower bound
  barTop: number;      // Y-axis upper bound
  amount: number;      // Display value (for tooltip)
  fill: string;        // Color hex
  subcategories: SubcategoryItem[];
}

const waterfallRange = (d: WaterfallBar): [number, number] => [d.barBottom, d.barTop];

<BarChart data={data}>
  <Bar dataKey={waterfallRange} isAnimationActive animationDuration={600}>
    {data.map((entry, index) => (
      <Cell key={index} fill={entry.fill} />
    ))}
  </Bar>
</BarChart>
```
[VERIFIED: Recharts DataKey type accepts `(obj: T) => V` per node_modules/recharts/types/util/typedDataKey.d.ts]

### Pattern 3: Chart Component Shell (INFRA-02 compliance)
**What:** All charts must follow "use client" + useHydration guard + ChartContainer pattern.
**Example:**
```typescript
// Source: components/charts/patrimony-chart.tsx (existing pattern)
"use client";
import { useHydration } from "@/hooks/useHydration";
import { ChartContainer, ChartTooltip } from "../ui/chart";

export function WaterfallChart({ data }: WaterfallChartProps) {
  const isHydrated = useHydration();
  if (!isHydrated) {
    return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
  }
  return (
    <Card className="m-0 border-none shadow-none p-0">
      <CardHeader className="px-0">
        <CardTitle>Flujo Mensual</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer config={chartConfig}>
          {/* BarChart here */}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
```
[VERIFIED: PatrimonyChart, ExpensesByMonth both follow this exact pattern]

### Anti-Patterns to Avoid
- **Transparent floor stacking:** Using `fill="transparent"` + `stackId` to fake floating bars. Breaks with negative values and complicates domain calculation. Explicitly forbidden by D-11.
- **Inline computation in component:** Do NOT compute waterfall data inside the chart component. Use the three-layer pattern (pure function -> hook -> component). This is required because Phase 21 will consume WaterfallChart as a child of MonthlyFlowPanel with data passed as props.
- **Using globalUsdRate for USD conversion:** Each expense has its own `expense.usdRate` (D-09). Using the global rate would give incorrect totals for historical months.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive chart container | Custom resize observer | `ChartContainer` (shadcn/ui wrapping `ResponsiveContainer`) | Already handles resize, CSS variables, theme support |
| Date range filtering | Manual date comparison | `getFilterDateRange(monthKey, viewMode, payDay)` from `usePayPeriod` | Handles both pay-period and calendar-month view modes correctly |
| Currency formatting | Manual string formatting | `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })` or `toLocaleString("es-AR")` | Already used throughout codebase (savings-rate-selector.tsx line 11) |
| Hydration guard | Custom mounted state | `useHydration()` hook | Standard SSR guard used by all chart components |

**Key insight:** The waterfall computation is the novel part. Everything else (chart shell, tooltips, formatting, date filtering) has established patterns to reuse.

## Common Pitfalls

### Pitfall 1: USD Conversion Direction
**What goes wrong:** Converting USD amounts incorrectly -- dividing instead of multiplying, or using the wrong rate.
**Why it happens:** The codebase stores USD expenses with `amount` in USD and `usdRate` as the ARS/USD exchange rate. To get ARS equivalent: `amount * usdRate`.
**How to avoid:** Always convert as `expense.currencyType === "USD" ? expense.amount * expense.usdRate : expense.amount`. The `usdRate` field stores ARS-per-USD.
**Warning signs:** Waterfall totals don't match the ResumenCard values; very small or very large values for USD expenses.
[VERIFIED: calculateDualBalances() in useMoneyTracker.ts subtracts `expense.amount` directly for ARS and USD separately, confirming amount is stored in native currency]

### Pitfall 2: Forgetting isInitial Investment Movements
**What goes wrong:** Including wizard-created initial investment movements inflates the "Inversiones" bar.
**Why it happens:** `isInitial` movements represent pre-existing portfolio loaded during setup, not actual monthly cash outflow.
**How to avoid:** Filter with `movement.isInitial !== true` (decision D-10). The existing `calculateDualBalances()` already does this: `inv.movements.filter((mov) => !mov.isInitial)`.
**Warning signs:** "Inversiones" bar is much larger than expected; doesn't match the monthly card view.
[VERIFIED: useMoneyTracker.ts line 419 `inv.movements.filter((mov) => !mov.isInitial)`]

### Pitfall 3: Investment Movements Include Both Aportes and Retiros
**What goes wrong:** Counting only "aporte" movements and ignoring "retiro" movements, making the investment bar incorrect.
**Why it happens:** A retiro (withdrawal) brings money back from investment to liquid, reducing the net investment outflow for the month.
**How to avoid:** Net investment = sum of aportes - sum of retiros for the filtered month. Both types affect the waterfall.
**Warning signs:** Months with investment retiros still show a large "Inversiones" bar.

### Pitfall 4: Month Scoping Must Respect ViewMode
**What goes wrong:** Filtering expenses by calendar month when user has pay-period view active, causing mismatch between waterfall and the rest of the app.
**Why it happens:** The app supports two view modes: "mes" (calendar month) and "periodo" (pay day to pay day).
**How to avoid:** Use `getFilterDateRange(monthKey, viewMode, payDay)` to get the correct date range, then filter expenses within that range.
**Warning signs:** Waterfall totals don't match the expenses shown in the table view.
[VERIFIED: usePayPeriod.ts exports getFilterDateRange; useExpensesTracker and calculateDualBalances both use this]

### Pitfall 5: Range Values Must Account for Running Total Direction
**What goes wrong:** Subtraction bars (gastos, inversiones) have inverted barBottom/barTop, causing bars to render upside-down or with zero height.
**Why it happens:** For subtractive bars, `barTop` should be the previous running total and `barBottom` should be the new (lower) running total. If reversed, the bar renders incorrectly.
**How to avoid:** For each bar: `barTop = previousRunningTotal`, `barBottom = previousRunningTotal - segmentAmount`. The `amount` field stores the absolute value for display. For the "Ingresos" first bar: `barBottom = 0`, `barTop = totalIncome`. For "Libre" final bar: `barBottom = 0`, `barTop = remainingAmount`.
**Warning signs:** Bars overlap or have zero height; chart Y-axis domain looks wrong.

### Pitfall 6: Tooltip Shows Array Instead of Formatted Value
**What goes wrong:** Default Recharts tooltip for range-value bars shows `[123000, 456000]` instead of a formatted amount.
**Why it happens:** When dataKey is a function returning `[low, high]`, the tooltip value is the array, not a single number.
**How to avoid:** Use a fully custom tooltip `content` renderer that reads the bar's `payload` object (which contains the full data point including `amount`, `subcategories`, etc.) rather than relying on the default `value`.
**Warning signs:** Tooltip displays raw array or "NaN".

## Code Examples

### computeWaterfallData() Pure Function Signature
```typescript
// Target file: lib/projection/waterfall.ts
import type { Expense, ExtraIncome, Investment } from "@/hooks/useMoneyTracker";
import type { ViewMode } from "@/hooks/usePayPeriod";

export interface SubcategoryItem {
  name: string;
  amount: number;  // ARS equivalent
}

export interface WaterfallBar {
  name: string;           // "Ingresos", "Gastos Fijos", "Gastos Variables", "Inversiones", "Libre"
  barBottom: number;      // Y-axis lower bound
  barTop: number;         // Y-axis upper bound
  amount: number;         // Absolute display value for this segment
  fill: string;           // Hex color
  subcategories: SubcategoryItem[];
}

export interface WaterfallInput {
  expenses: Expense[];
  investments: Investment[];
  salaryAmount: number;          // From getSalaryForMonth()
  extraIncomes: ExtraIncome[];
  selectedMonth: string;         // "yyyy-MM" format
  viewMode: ViewMode;
  payDay: number;
}

export function computeWaterfallData(input: WaterfallInput): WaterfallBar[] {
  // 1. Compute date range using getFilterDateRange
  // 2. Filter expenses/incomes within range
  // 3. Classify expenses: recurringId => fixed, else => variable
  // 4. Convert USD amounts: amount * usdRate for each
  // 5. Filter investment movements: exclude isInitial, sum aportes - retiros within range
  // 6. Build 5 bars with running total:
  //    - Ingresos: [0, totalIncome]
  //    - Gastos Fijos: [totalIncome - fixedExpenses, totalIncome]
  //    - Gastos Variables: [totalIncome - fixedExpenses - variableExpenses, totalIncome - fixedExpenses]
  //    - Inversiones: [..., ...]
  //    - Libre: [0, remainder]
  // 7. For each bar, compute top-5 subcategories + "Otros"
}
```
[VERIFIED: Expense type has `recurringId?: string` field; Investment type has `movements: InvestmentMovement[]` with `isInitial?: boolean`]

### Range-Value Bar Rendering Pattern
```typescript
// Source: Recharts docs + GitHub issue #7010 pattern
import { BarChart, Bar, Cell, XAxis, YAxis } from "recharts";

const waterfallRange = (d: WaterfallBar): [number, number] => [d.barBottom, d.barTop];

<BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
  <XAxis
    dataKey="name"
    stroke="#888888"
    fontSize={12}
    tickLine={false}
    axisLine={false}
  />
  <YAxis
    stroke="#888888"
    fontSize={12}
    tickLine={false}
    axisLine={false}
    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
  />
  <Bar
    dataKey={waterfallRange}
    radius={[4, 4, 0, 0]}
    isAnimationActive
    animationDuration={600}
    animationEasing="ease-out"
  >
    {data.map((entry, index) => (
      <Cell key={index} fill={entry.fill} />
    ))}
  </Bar>
  <ChartTooltip content={<WaterfallTooltipContent />} cursor={false} />
</BarChart>
```
[VERIFIED: Cell import available from recharts; existing ExpensesByMonth uses similar BarChart pattern]

### Custom Tooltip for Subcategory Breakdown
```typescript
// Target file: components/charts/waterfall-tooltip.tsx
import type { TooltipProps } from "recharts";
import type { WaterfallBar } from "@/lib/projection/waterfall";

const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export function WaterfallTooltipContent({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload as WaterfallBar;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{data.name}</p>
      <p className="text-sm font-mono mb-2">{formatArs(data.amount)}</p>
      {data.subcategories.length > 0 && (
        <div className="space-y-0.5 border-t pt-1">
          {data.subcategories.map((sub) => (
            <div key={sub.name} className="flex justify-between gap-4">
              <span className="text-muted-foreground">{sub.name}</span>
              <span className="font-mono">{formatArs(sub.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```
[VERIFIED: follows existing tooltip pattern from patrimony-chart.tsx; Intl.NumberFormat pattern from savings-rate-selector.tsx]

### Expense Classification Logic
```typescript
// Classification decision (D-08): recurringId present => fixed, else => variable
function classifyExpenses(expenses: Expense[]): {
  fixed: Expense[];
  variable: Expense[];
} {
  const fixed: Expense[] = [];
  const variable: Expense[] = [];

  for (const expense of expenses) {
    if (expense.recurringId) {
      fixed.push(expense);
    } else {
      variable.push(expense);
    }
  }

  return { fixed, variable };
}
```
[VERIFIED: Expense type definition line 59: `recurringId?: string`]

### USD Conversion Per-Transaction
```typescript
// Decision D-09: use expense.usdRate, not globalUsdRate
function toArs(expense: Expense): number {
  if (expense.currencyType === CurrencyType.USD) {
    return expense.amount * expense.usdRate;
  }
  return expense.amount;
}
```
[VERIFIED: CurrencyType.USD import from constants/investments; usdRate field on Expense type]

## Semantic Color Recommendations (Claude's Discretion)

Based on the project's existing color conventions (green for income, red for expenses, blue for investments):

| Segment | Color | Hex | Rationale |
|---------|-------|-----|-----------|
| Ingresos | Green | `#22c55e` (green-500) | Matches CARD-05 convention, consistent with `text-green-600` used throughout |
| Gastos Fijos | Red | `#ef4444` (red-500) | Red for expenses per CARD-05; darker shade distinguishes from variable |
| Gastos Variables | Orange | `#f97316` (orange-500) | Lighter warm tone distinguishes from fixed expenses |
| Inversiones | Blue | `#3b82f6` (blue-500) | Matches CARD-05 convention for investments |
| Libre | Emerald | `#10b981` (emerald-500) | Distinct from income green; signals positive remainder |

[ASSUMED: Exact hex values are Claude's discretion area. These align with Tailwind CSS default palette and existing usage of `text-green-600`, `text-red-500`, etc. in the codebase]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Transparent floor stacking | Range-value `[low, high]` dataKey | Recharts 3.x (2024) | Cleaner implementation, works with negative values, proper Y-axis domain |
| Multiple stacked Bars | Single Bar with Cell coloring | Recharts 3.x | Simpler API, each bar independently colored |

**Deprecated/outdated:**
- The transparent `pv`/`uv` stacking approach from the 2020 Medium article is outdated and fragile. The range-value pattern is the recommended approach for Recharts 3.x. [VERIFIED: Recharts issue #7010 confirms range pattern is preferred]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run lib/projection/waterfall.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLOW-01 | computeWaterfallData returns 5 bars with correct running totals | unit | `npx vitest run lib/projection/waterfall.test.ts -t "returns 5 bars"` | Wave 0 |
| FLOW-02 | Expenses with recurringId classified as fixed | unit | `npx vitest run lib/projection/waterfall.test.ts -t "recurringId"` | Wave 0 |
| FLOW-03 | Subcategories computed per segment (top 5 + Otros) | unit | `npx vitest run lib/projection/waterfall.test.ts -t "subcategories"` | Wave 0 |
| FLOW-04 | Chart re-renders on expense change | manual-only | Visual verification | n/a (React reactivity) |
| FLOW-05 | USD conversion uses per-transaction usdRate | unit | `npx vitest run lib/projection/waterfall.test.ts -t "USD"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/projection/waterfall.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `lib/projection/waterfall.test.ts` -- covers FLOW-01, FLOW-02, FLOW-03, FLOW-05
- Framework install: none needed (vitest 4.1.2 already installed and configured)

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Exact hex colors for segments (green-500, red-500, orange-500, blue-500, emerald-500) | Semantic Color Recommendations | Low -- within Claude's discretion area, easily adjustable |
| A2 | Animation duration of 600ms with ease-out easing | Code Examples | Low -- within Claude's discretion area |
| A3 | Salary for waterfall includes only the resolved salary amount (no aguinaldo in the bar) | Architecture | Medium -- unclear if aguinaldo should be part of "Ingresos" bar in aguinaldo months; however ResumenCard shows it separately, so following that pattern |

## Open Questions

1. **Aguinaldo inclusion in Ingresos bar**
   - What we know: ResumenCard shows aguinaldo as a separate line item under ingresos. The waterfall shows "Ingresos totales" as the first bar.
   - What's unclear: Should aguinaldo be included in the Ingresos bar during June/December? The FLOW-01 description says "ingresos totales" which likely includes all income.
   - Recommendation: Include aguinaldo in the Ingresos total (salary + extraIncomes + aguinaldo if applicable). The subcategory tooltip can break it down as "Ingreso fijo: $X", "Aguinaldo: $Y", "Otros ingresos: $Z". This matches the "total income" concept.

2. **Negative "Libre" segment**
   - What we know: If expenses + investments exceed income, the "Libre" value would be negative.
   - What's unclear: How to visually represent a negative remainder in the waterfall.
   - Recommendation: If libre is negative, render the bar below the X-axis (barBottom = libreAmount, barTop = 0) with a distinct color (e.g., red tint). The running total naturally handles this since barBottom will be negative.

3. **Extra incomes in USD**
   - What we know: ExtraIncome has currencyType and usdRate fields, same as Expense.
   - What's unclear: D-09 mentions expense.usdRate conversion, but extraIncomes also need the same treatment.
   - Recommendation: Apply the same per-transaction usdRate conversion pattern to extraIncomes: `income.currencyType === "USD" ? income.amount * income.usdRate : income.amount`.

## Sources

### Primary (HIGH confidence)
- Recharts 3.8.1 installed package -- type definitions confirm DataKey accepts function returning tuple [VERIFIED: node_modules/recharts/types/util/typedDataKey.d.ts]
- Codebase canonical files -- all patterns verified by reading actual source files:
  - `components/charts-container.tsx` -- ChartsContainer integration point
  - `components/charts/patrimony-chart.tsx` -- ChartContainer + useHydration pattern
  - `components/charts/expenses-by-month.tsx` -- BarChart pattern
  - `hooks/useMoneyTracker.ts` -- MonthlyData types, Expense.recurringId field, calculateDualBalances
  - `hooks/useRecurringExpenses.ts` -- RecurringExpense type, recurringId linkage
  - `hooks/usePayPeriod.ts` -- getFilterDateRange for month scoping
  - `lib/projection/savings-rate.ts` -- pure function pattern to follow
  - `lib/projection/net-flow.ts` -- aggregation pattern reference

### Secondary (MEDIUM confidence)
- [Recharts official waterfall example page](https://recharts.github.io/en-US/examples/Waterfall/) -- confirms range-value pattern is documented
- [Recharts GitHub issue #7010](https://github.com/recharts/recharts/issues/7010) -- confirms `dataKey={(d) => [d.barBottom, d.barTop]}` pattern works; documents limitations

### Tertiary (LOW confidence)
- [Medium tutorial](https://medium.com/2359media/tutorial-how-to-create-a-waterfall-chart-in-recharts-15a0e980d4b) -- shows the older transparent stacking approach (NOT used, but useful to understand what to avoid)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed and verified
- Architecture: HIGH -- follows established three-layer pattern with verified codebase references
- Pitfalls: HIGH -- all edge cases verified against actual codebase types and data flow
- Recharts range-value pattern: MEDIUM-HIGH -- confirmed via type definitions and issue documentation; no official full example extracted but pattern is well-documented

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (stable -- all dependencies locked, no fast-moving concerns)
